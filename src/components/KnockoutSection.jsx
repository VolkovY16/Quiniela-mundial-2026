import { useState, useMemo } from 'react';
import { GROUPS, FLAGS, getAllGroupMatches, R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, formatDate, computeThirdPlaces, assignThirdsToSlots } from '../lib/worldcupData.js';

function deriveGroupStandings(groupId, picks) {
  const group = GROUPS[groupId];
  const groupMatches = getAllGroupMatches().filter(m => m.group === groupId);
  const table = {};
  for (const t of group.teams) table[t] = { team: t, pts: 0, gf: 0, ga: 0, gd: 0 };
  for (const match of groupMatches) {
    const pick = picks[match.id];
    if (!pick || pick.home_goals === null || pick.home_goals === undefined) continue;
    const rh = Number(pick.home_goals), ra = Number(pick.away_goals);
    if (isNaN(rh) || isNaN(ra)) continue;
    table[match.home].gf += rh; table[match.home].ga += ra;
    table[match.away].gf += ra; table[match.away].ga += rh;
    table[match.home].gd = table[match.home].gf - table[match.home].ga;
    table[match.away].gd = table[match.away].gf - table[match.away].ga;
    if (rh > ra) table[match.home].pts += 3;
    else if (rh < ra) table[match.away].pts += 3;
    else { table[match.home].pts++; table[match.away].pts++; }
  }
  return Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

function resolveTeam(source, picks, koPicks, thirdAssignments) {
  if (!source) return null;
  const gMatch = source.match(/^([A-L])([12])$/);
  if (gMatch) {
    const [, gId, pos] = gMatch;
    const standings = deriveGroupStandings(gId, picks);
    return standings[Number(pos) - 1]?.team || null;
  }
  // Check if it's a knockout pick
  const koPick = koPicks[source];
  return koPick?.winner || null;
}

function KnockoutMatch({ matchId, homeTeam, awayTeam, thirdLabel, koPicks, onKoPick, confirmed, matchNum, date, venue, thirdPending }) {
  const pick = koPicks[matchId];
  const winner = pick?.winner;
  const canPick = !confirmed && homeTeam && awayTeam;

  return (
    <div className="ko-match">
      <div className="match-meta">
        {matchNum && <span className="match-date">M{matchNum} · {formatDate(date)}</span>}
        {venue && <span className="match-venue">📍 {venue}</span>}
      </div>
      <div className="ko-teams">
        <button
          className={`ko-team ${winner === homeTeam ? 'selected' : ''} ${!canPick ? 'disabled' : ''}`}
          onClick={() => canPick && onKoPick(matchId, homeTeam)}
          disabled={!canPick || !homeTeam}
        >
          {FLAGS[homeTeam] || '🏳️'} {homeTeam || 'Por definir'}
        </button>
        <span className="ko-vs">vs</span>
        <button
          className={`ko-team ${winner === awayTeam ? 'selected' : ''} ${!canPick ? 'disabled' : ''} ${thirdPending ? 'third-pending' : ''}`}
          onClick={() => canPick && onKoPick(matchId, awayTeam)}
          disabled={!canPick || !awayTeam}
        >
          {awayTeam
            ? <>{FLAGS[awayTeam] || '🏳️'} {awayTeam}</>
            : <span className="third-tbd">3° Grupo ({thirdLabel}) — llena todos tus picks de grupos</span>
          }
        </button>
      </div>
      {winner && <div className="ko-winner-display">Avanza: <strong>{FLAGS[winner] || ''} {winner}</strong></div>}
    </div>
  );
}

export default function KnockoutSection({ koPicks, picks, confirmed, onKoPick }) {
  const [currentPhase, setCurrentPhase] = useState('r32');

  // Compute third place assignments from user's picks
  const thirdAssignments = useMemo(() => {
    const allThirds = computeThirdPlaces(picks);
    return assignThirdsToSlots(allThirds);
  }, [picks]);

  function resolve(src) {
    if (!src) return null;
    const gMatch = src.match(/^([A-L])([12])$/);
    if (gMatch) {
      const [, gId, pos] = gMatch;
      const standings = deriveGroupStandings(gId, picks);
      return standings[Number(pos) - 1]?.team || null;
    }
    return koPicks[src]?.winner || null;
  }

  const phases = [
    {
      id: 'r32', label: 'Dieciseisavos',
      fixtures: R32_BRACKET.map(m => ({
        ...m,
        home: resolve(m.homeSource),
        away: m.awaySource ? resolve(m.awaySource) : (thirdAssignments[m.id] || null),
        thirdPending: !m.awaySource && !thirdAssignments[m.id],
      }))
    },
    {
      id: 'r16', label: 'Octavos',
      fixtures: R16_BRACKET.map(m => ({ ...m, home: koPicks[m.homeSource]?.winner || null, away: koPicks[m.awaySource]?.winner || null }))
    },
    {
      id: 'qf', label: 'Cuartos',
      fixtures: QF_BRACKET.map(m => ({ ...m, home: koPicks[m.homeSource]?.winner || null, away: koPicks[m.awaySource]?.winner || null }))
    },
    {
      id: 'sf', label: 'Semifinales',
      fixtures: SF_BRACKET.map(m => ({ ...m, home: koPicks[m.homeSource]?.winner || null, away: koPicks[m.awaySource]?.winner || null }))
    },
    {
      id: 'final', label: 'Final',
      fixtures: [{ ...FINAL, home: koPicks[FINAL.homeSource]?.winner || null, away: koPicks[FINAL.awaySource]?.winner || null }]
    },
  ];

  const phaseData = phases.find(p => p.id === currentPhase);

  // Count how many third-place slots are filled
  const thirdsCount = Object.keys(thirdAssignments).length;

  return (
    <div className="knockout-section">
      <div className="ko-info-banner">
        ℹ️ Elige al ganador de cada partido. Los equipos se llenan desde tus picks de grupos siguiendo el bracket oficial FIFA 2026.
        {thirdsCount < 8 && currentPhase === 'r32' && (
          <span className="thirds-warning"> · Terceros lugares: {thirdsCount}/8 definidos (necesitas llenar más partidos de grupos)</span>
        )}
      </div>

      <div className="ko-phase-tabs">
        {phases.map(p => (
          <button key={p.id} className={`ko-phase-tab ${currentPhase === p.id ? 'active' : ''}`} onClick={() => setCurrentPhase(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="ko-matches-grid">
        {phaseData.fixtures.map(fix => (
          <KnockoutMatch
            key={fix.id}
            matchId={fix.id}
            homeTeam={fix.home}
            awayTeam={fix.away}
            thirdLabel={fix.thirdSources}
            thirdPending={fix.thirdPending}
            koPicks={koPicks}
            onKoPick={onKoPick}
            confirmed={confirmed}
            matchNum={fix.matchNum}
            date={fix.date}
            venue={fix.venue}
          />
        ))}
      </div>

      {currentPhase === 'final' && koPicks[FINAL.id]?.winner && (
        <div className="champion-display">
          <div className="champion-trophy">🏆</div>
          <p>Tu campeón del mundo</p>
          <h2>{FLAGS[koPicks[FINAL.id].winner] || ''} {koPicks[FINAL.id].winner}</h2>
        </div>
      )}
    </div>
  );
}
