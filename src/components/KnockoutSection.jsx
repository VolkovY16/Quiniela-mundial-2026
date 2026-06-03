import { useState } from 'react';
import { GROUPS, FLAGS, HOST_TEAMS, getAllGroupMatches } from '../lib/worldcupData.js';

function deriveGroupStandings(groupId, picks) {
  const group = GROUPS[groupId];
  const allMatches = getAllGroupMatches();
  const groupMatches = allMatches.filter(m => m.group === groupId);
  const table = {};
  for (const t of group.teams) table[t] = { team: t, pts: 0, gf: 0, ga: 0, gd: 0 };
  for (const match of groupMatches) {
    const pick = picks[match.id];
    if (!pick || pick.home_goals === null || pick.home_goals === undefined) continue;
    const rh = Number(pick.home_goals), ra = Number(pick.away_goals);
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

function getTeamFromSource(source, picks, koPicks) {
  if (!source) return null;
  const groupMatch = source.match(/^([A-L])([12])$/);
  if (groupMatch) {
    const [, gId, pos] = groupMatch;
    const standings = deriveGroupStandings(gId, picks);
    return standings[Number(pos) - 1]?.team || null;
  }
  if (source.startsWith('3rd_')) return null; // Se define post-grupos
  const koPick = koPicks[source];
  return koPick?.winner || null;
}

function KnockoutMatch({ matchId, homeTeam, awayTeam, koPicks, onKoPick, confirmed, label }) {
  const pick = koPicks[matchId];
  const winner = pick?.winner;
  const canPick = !confirmed && homeTeam && awayTeam;

  return (
    <div className="ko-match">
      {label && <div className="ko-match-label">{label}</div>}
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
          className={`ko-team ${winner === awayTeam ? 'selected' : ''} ${!canPick ? 'disabled' : ''}`}
          onClick={() => canPick && onKoPick(matchId, awayTeam)}
          disabled={!canPick || !awayTeam}
        >
          {FLAGS[awayTeam] || '🏳️'} {awayTeam || 'Por definir'}
        </button>
      </div>
      {winner && (
        <div className="ko-winner-display">
          Avanza: <strong>{FLAGS[winner] || ''} {winner}</strong>
        </div>
      )}
    </div>
  );
}

export default function KnockoutSection({ koPicks, picks, confirmed, onKoPick }) {
  const [currentPhase, setCurrentPhase] = useState('r32');

  function g(src) { return getTeamFromSource(src, picks, koPicks); }

  // R32 fixtures — fuente oficial FIFA 2026
  const r32Fixtures = [
    { id: 'r32_1',  home: g('A1'), away: g('B2'),  label: 'R32 M1' },
    { id: 'r32_2',  home: g('C1'), away: g('D2'),  label: 'R32 M2' },
    { id: 'r32_3',  home: g('B1'), away: null,      label: 'R32 M3 (B1 vs 3°)' },
    { id: 'r32_4',  home: g('A2'), away: g('C2'),  label: 'R32 M4' },
    { id: 'r32_5',  home: g('D1'), away: null,      label: 'R32 M5 (D1 vs 3°)' },
    { id: 'r32_6',  home: g('F1'), away: g('E2'),  label: 'R32 M6' },
    { id: 'r32_7',  home: g('E1'), away: null,      label: 'R32 M7 (E1 vs 3°)' },
    { id: 'r32_8',  home: g('G1'), away: g('H2'),  label: 'R32 M8' },
    { id: 'r32_9',  home: g('H1'), away: g('G2'),  label: 'R32 M9' },
    { id: 'r32_10', home: g('I1'), away: g('J2'),  label: 'R32 M10' },
    { id: 'r32_11', home: g('J1'), away: g('I2'),  label: 'R32 M11' },
    { id: 'r32_12', home: g('K1'), away: null,      label: 'R32 M12 (K1 vs 3°)' },
    { id: 'r32_13', home: g('L1'), away: g('K2'),  label: 'R32 M13' },
    { id: 'r32_14', home: g('F2'), away: null,      label: 'R32 M14 (F2 vs 3°)' },
    { id: 'r32_15', home: g('L2'), away: null,      label: 'R32 M15 (L2 vs 3°)' },
    { id: 'r32_16', home: null,    away: null,      label: 'R32 M16 (3° vs 3°)' },
  ];

  const r16Fixtures = [
    { id: 'r16_1', home: koPicks['r32_1']?.winner,  away: koPicks['r32_2']?.winner,  label: 'R16 M1' },
    { id: 'r16_2', home: koPicks['r32_3']?.winner,  away: koPicks['r32_4']?.winner,  label: 'R16 M2' },
    { id: 'r16_3', home: koPicks['r32_5']?.winner,  away: koPicks['r32_6']?.winner,  label: 'R16 M3' },
    { id: 'r16_4', home: koPicks['r32_7']?.winner,  away: koPicks['r32_8']?.winner,  label: 'R16 M4' },
    { id: 'r16_5', home: koPicks['r32_9']?.winner,  away: koPicks['r32_10']?.winner, label: 'R16 M5' },
    { id: 'r16_6', home: koPicks['r32_11']?.winner, away: koPicks['r32_12']?.winner, label: 'R16 M6' },
    { id: 'r16_7', home: koPicks['r32_13']?.winner, away: koPicks['r32_14']?.winner, label: 'R16 M7' },
    { id: 'r16_8', home: koPicks['r32_15']?.winner, away: koPicks['r32_16']?.winner, label: 'R16 M8' },
  ];

  const qfFixtures = [
    { id: 'qf_1', home: koPicks['r16_1']?.winner, away: koPicks['r16_2']?.winner, label: 'CF M1' },
    { id: 'qf_2', home: koPicks['r16_3']?.winner, away: koPicks['r16_4']?.winner, label: 'CF M2' },
    { id: 'qf_3', home: koPicks['r16_5']?.winner, away: koPicks['r16_6']?.winner, label: 'CF M3' },
    { id: 'qf_4', home: koPicks['r16_7']?.winner, away: koPicks['r16_8']?.winner, label: 'CF M4' },
  ];

  const sfFixtures = [
    { id: 'sf_1', home: koPicks['qf_1']?.winner, away: koPicks['qf_2']?.winner, label: 'Semifinal 1' },
    { id: 'sf_2', home: koPicks['qf_3']?.winner, away: koPicks['qf_4']?.winner, label: 'Semifinal 2' },
  ];

  const finalFixture = { id: 'final', home: koPicks['sf_1']?.winner, away: koPicks['sf_2']?.winner, label: 'Gran Final' };

  const phases = [
    { id: 'r32',   label: 'Dieciseisavos', fixtures: r32Fixtures },
    { id: 'r16',   label: 'Octavos',       fixtures: r16Fixtures },
    { id: 'qf',    label: 'Cuartos',       fixtures: qfFixtures },
    { id: 'sf',    label: 'Semifinales',   fixtures: sfFixtures },
    { id: 'final', label: 'Final',         fixtures: [finalFixture] },
  ];

  const phaseData = phases.find(p => p.id === currentPhase);

  return (
    <div className="knockout-section">
      <div className="ko-info-banner">
        ℹ️ Selecciona al ganador de cada partido. Los equipos se llenan automáticamente a partir de tus predicciones de grupos.
        Los partidos contra "3er lugar" se definirán con los 8 mejores terceros al final de la fase de grupos.
      </div>

      <div className="ko-phase-tabs">
        {phases.map(p => (
          <button
            key={p.id}
            className={`ko-phase-tab ${currentPhase === p.id ? 'active' : ''}`}
            onClick={() => setCurrentPhase(p.id)}
          >
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
            koPicks={koPicks}
            onKoPick={onKoPick}
            confirmed={confirmed}
            label={fix.label}
          />
        ))}
      </div>

      {currentPhase === 'final' && koPicks['final']?.winner && (
        <div className="champion-display">
          <div className="champion-trophy">🏆</div>
          <p>Tu campeón del mundo</p>
          <h2>{FLAGS[koPicks['final'].winner] || ''} {koPicks['final'].winner}</h2>
        </div>
      )}
    </div>
  );
}
