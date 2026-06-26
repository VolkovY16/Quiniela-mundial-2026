import { SCORING, HOST_TEAMS } from './worldcupData.js';

// ─── GROUP STAGE SCORING ────────────────────────────────────────────────────

export function scoreGroupMatch(pick, result, isDouble) {
  if (!pick || result.home_goals === null || result.home_goals === undefined) return null;
  if (pick.home_goals === null || pick.home_goals === undefined) return null;

  const ph = Number(pick.home_goals);
  const pa = Number(pick.away_goals);
  const rh = Number(result.home_goals);
  const ra = Number(result.away_goals);

  let pts = 0;
  let exactHit = false;
  let correctWinner = false;

  if (ph === rh && pa === ra) {
    pts = SCORING.exactResult;
    exactHit = true;
    correctWinner = true;
  } else {
    const pickOutcome = ph > pa ? 'home' : ph < pa ? 'away' : 'draw';
    const realOutcome = rh > ra ? 'home' : rh < ra ? 'away' : 'draw';
    if (pickOutcome === realOutcome) {
      pts = SCORING.correctWinner;
      correctWinner = true;
    }
  }

  if (isDouble) pts *= SCORING.doubleMultiplier;

  let goalsHit = 0;
  if (ph === rh) goalsHit++;
  if (pa === ra) goalsHit++;

  return { pts, exactHit, correctWinner, goalsHit };
}

// ─── COMPUTE FULL LEADERBOARD ────────────────────────────────────────────────

export function computeLeaderboard({ users, allPicks, allKoPicks, results, koResults, bonusChallenges, bonusPicks, doubleMatches, groupMatches, groupStandings, groups }) {
  return users.map(user => {
    const uid = user.user_id;
    const userPicks = allPicks.filter(p => p.user_id === uid);
    const userKoPicks = allKoPicks.filter(p => p.user_id === uid);
    const userBonusPicks = (bonusPicks || []).filter(p => p.user_id === uid);

    let totalPts = 0;
    let exactHits = 0;
    let correctWinners = 0;
    let totalGoalsHit = 0;

    // Group stage
    for (const match of groupMatches) {
      const pick = userPicks.find(p => p.match_id === match.id);
      const result = results.find(r => r.match_id === match.id);
      if (!pick || !result) continue;

      const isDouble = doubleMatches.includes(match.id) || match.isDouble;
      const scored = scoreGroupMatch(pick, result, isDouble);
      if (!scored) continue;

      totalPts += scored.pts;
      if (scored.exactHit) exactHits++;
      if (scored.correctWinner) correctWinners++;
      totalGoalsHit += scored.goalsHit;
    }

    // Knockout stages
    for (const result of koResults) {
      const pick = userKoPicks.find(p => p.match_id === result.match_id);
      if (!pick || !result.winner) continue;
      if (pick.winner === result.winner) {
        const isDouble = doubleMatches.includes(result.match_id);
        let pts = SCORING.correctWinner;
        if (isDouble) pts *= SCORING.doubleMultiplier;
        totalPts += pts;
        exactHits++;
        correctWinners++;
      }
    }

    // Bonus challenges
    let bonusPts = 0;
    for (const challenge of (bonusChallenges || [])) {
      if (!challenge.resolved) continue;
      const userBp = userBonusPicks.find(p => p.bonus_id === challenge.id);
      if (!userBp) continue;
      if (userBp.value?.toLowerCase().trim() === challenge.correct_value?.toLowerCase().trim()) {
        bonusPts += challenge.points || 10;
        totalPts += challenge.points || 10;
      }
    }

    // Standing points
    let standingPts = 0;
    if (groupStandings && groups) {
      const picksMap = {};
      for (const p of userPicks) picksMap[p.match_id] = p;
      standingPts = computeStandingPoints(picksMap, groupStandings, groupMatches, groups);
      totalPts += standingPts;
    }

    return {
      userId: uid,
      username: user.username || uid,
      confirmed: user.confirmed,
      totalPts,
      exactHits,
      correctWinners,
      totalGoalsHit,
      bonusPts,
      standingPts,
    };
  }).sort((a, b) => {
    if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    return b.totalGoalsHit - a.totalGoalsHit;
  });
}

// ─── GROUP TABLE ────────────────────────────────────────────────────────────

export function computeGroupTable(groupTeams, matches, results) {
  const table = {};
  for (const team of groupTeams) {
    table[team] = { team, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  }

  for (const match of matches) {
    const result = results.find(r => r.match_id === match.id);
    if (!result || result.home_goals === null || result.home_goals === undefined) continue;

    const rh = Number(result.home_goals);
    const ra = Number(result.away_goals);
    const home = table[match.home];
    const away = table[match.away];
    if (!home || !away) continue;

    home.played++; away.played++;
    home.gf += rh; home.ga += ra;
    away.gf += ra; away.ga += rh;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;

    if (rh > ra) { home.w++; home.pts += 3; away.l++; }
    else if (rh < ra) { away.w++; away.pts += 3; home.l++; }
    else { home.d++; home.pts++; away.d++; away.pts++; }
  }

  return Object.values(table).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

// ─── GROUP STANDINGS SCORING ─────────────────────────────────────────────────

// Compare user's computed group table vs real standing
// Returns { pts, positions: [{team, userPos, realPos, correct}] }
export function scoreGroupStanding(userTable, realStanding) {
  if (!realStanding || !realStanding.confirmed) return { pts: 0, positions: [] };

  const realOrder = [realStanding.pos1, realStanding.pos2, realStanding.pos3, realStanding.pos4];
  const userOrder = userTable.map(r => r.team);

  let pts = 0;
  const positions = realOrder.map((realTeam, i) => {
    const correct = userOrder[i] === realTeam;
    if (correct) pts++;
    return { team: realTeam, userTeam: userOrder[i], pos: i + 1, correct };
  });

  return { pts, positions };
}

// Compute total standing points for a user across all groups
export function computeStandingPoints(picks, groupStandings, groupMatches, groups) {
  let total = 0;
  for (const [groupId, group] of Object.entries(groups)) {
    const standing = groupStandings.find(s => s.group_id === groupId);
    if (!standing || !standing.confirmed) continue;
    const matches = groupMatches.filter(m => m.group === groupId);
    const userTable = computeGroupTable(group.teams, matches, Object.values(picks).filter(p => matches.find(m => m.id === p.match_id)));
    const { pts } = scoreGroupStanding(userTable, standing);
    total += pts;
  }
  return total;
}
