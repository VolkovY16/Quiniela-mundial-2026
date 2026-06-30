// FIFA 2026 Official Bracket Flow
// Each round's matches reference which prior matches feed them

import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE } from './worldcupData.js';

// All phases in order
export const ALL_PHASES = [
  { id: 'r32',   label: 'R32', fullLabel: 'Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16',   label: 'R16', fullLabel: 'Octavos',       matches: R16_BRACKET },
  { id: 'qf',    label: 'QF',  fullLabel: 'Cuartos',       matches: QF_BRACKET },
  { id: 'sf',    label: 'SF',  fullLabel: 'Semis',         matches: SF_BRACKET },
  { id: 'final', label: 'Final', fullLabel: 'Final',       matches: [FINAL, THIRD_PLACE] },
];

// Given a user's ko picks (map of matchId -> {winner, home_goals, away_goals, penalties})
// and real ko results (map of matchId -> {home_team, away_team, winner, ...})
// Returns: for a given matchId, what are the two teams the user should see?
export function resolveTeamsForUser(matchId, userPicks, realResults) {
  const match = findMatch(matchId);
  if (!match) return { home: null, away: null };

  const home = resolveSource(match.homeSource, userPicks, realResults);
  const away = match.awaySource
    ? resolveSource(match.awaySource, userPicks, realResults)
    : resolveThird(matchId, userPicks, realResults);

  return { home, away };
}

function resolveSource(source, userPicks, realResults) {
  if (!source) return null;
  // Group stage source like "A1", "B2" — resolved by real results (admin sets teams in ko_detail)
  const gMatch = source.match(/^([A-L])([12])$/);
  if (gMatch) {
    // Find the R32 match that has this source as homeSource or awaySource
    const r32Match = R32_BRACKET.find(m => m.homeSource === source || m.awaySource === source);
    if (!r32Match) return null;
    // Get from real results (admin-defined teams)
    const real = realResults[r32Match.id];
    if (real) {
      return r32Match.homeSource === source ? real.home_team : real.away_team;
    }
    return null;
  }
  // Knockout source — winner of a previous match
  return userPicks[source]?.winner || null;
}

function resolveThird(matchId, userPicks, realResults) {
  // Third place slots — for now use real results if admin set them
  const real = realResults[matchId];
  return real?.away_team || null;
}

function findMatch(matchId) {
  for (const phase of ALL_PHASES) {
    const found = phase.matches.find(m => m.id === matchId);
    if (found) return found;
  }
  return null;
}

// Compute what teams a user sees for each match in each phase
// based on their previous picks
export function buildUserBracket(userPicks, realResults) {
  const bracket = {};

  // R32: teams come from real results (admin sets home_team/away_team)
  for (const match of R32_BRACKET) {
    const real = realResults[match.id] || {};
    bracket[match.id] = {
      home: real.home_team || null,
      away: real.away_team || null,
      pick: userPicks[match.id] || null,
    };
  }

  // R16 and beyond: teams come from user's previous picks
  const laterPhases = [R16_BRACKET, QF_BRACKET, SF_BRACKET, [FINAL, THIRD_PLACE]];
  for (const phase of laterPhases) {
    for (const match of phase) {
      const home = match.homeSource ? (userPicks[match.homeSource]?.winner || null) : null;
      const away = match.awaySource ? (userPicks[match.awaySource]?.winner || null) : null;
      bracket[match.id] = {
        home,
        away,
        pick: userPicks[match.id] || null,
      };
    }
  }

  return bracket;
}

// Compute real bracket from admin results
export function buildRealBracket(realResults) {
  const bracket = {};
  for (const phase of ALL_PHASES) {
    for (const match of phase.matches) {
      const real = realResults[match.id] || {};
      const home = real.home_team || (match.homeSource ? (realResults[match.homeSource]?.winner || null) : null);
      const away = real.away_team || (match.awaySource ? (realResults[match.awaySource]?.winner || null) : null);
      bracket[match.id] = {
        home,
        away,
        winner: real.winner || null,
        home_goals: real.home_goals,
        away_goals: real.away_goals,
        penalties: real.penalties || false,
      };
    }
  }
  return bracket;
}

// Score a user's bracket pick against real result
// Returns { pts, status: 'exact'|'correct'|'wrong'|'pending'|'no_pick' }
export function scoreKoPick(pick, realResult) {
  if (!realResult?.winner) return { pts: 0, status: 'pending' };
  if (!pick?.winner) return { pts: 0, status: 'no_pick' };

  if (pick.winner !== realResult.winner) return { pts: 0, status: 'wrong' };

  // Correct winner — check exact score
  const exactScore = realResult.home_goals !== null &&
    realResult.home_goals !== undefined &&
    pick.home_goals === realResult.home_goals &&
    pick.away_goals === realResult.away_goals &&
    !!pick.penalties === !!realResult.penalties;

  return exactScore
    ? { pts: 3, status: 'exact' }
    : { pts: 1, status: 'correct' };
}
