import { useState, useRef, useEffect } from 'react';
import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, FLAGS, formatDate } from '../lib/worldcupData.js';
import { saveKoDetailPick } from '../lib/supabase.js';

const PHASES = [
  { id: 'r32',   label: 'R32', fullLabel: 'Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16',   label: 'R16', fullLabel: 'Octavos',       matches: R16_BRACKET },
  { id: 'qf',    label: 'QF',  fullLabel: 'Cuartos',       matches: QF_BRACKET },
  { id: 'sf',    label: 'SF',  fullLabel: 'Semis',         matches: SF_BRACKET },
  { id: 'final', label: 'Final', fullLabel: 'Final',       matches: [FINAL, THIRD_PLACE] },
];

function MatchCard({ match, result, pick, userId, frozen }) {
  const localRef = useRef({ ...pick });
  const [local, setLocal] = useState({ ...pick });
  const [saveState, setSaveState] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    localRef.current = { ...pick };
    setLocal({ ...pick });
  }, [pick]);

  const homeTeam = result?.home_team || null;
  const awayTeam = result?.away_team || null;
  const hasTeams = homeTeam && awayTeam;
  const realWinner = result?.winner || null;
  const realScore = result?.home_goals !== null && result?.home_goals !== undefined;
  const isDisabled = frozen || !hasTeams;

  async function persist(updated) {
    if (timer.current) clearTimeout(timer.current);
    setSaveState('saving');
    timer.current = setTimeout(async () => {
      try {
        await saveKoDetailPick(userId, match.id, updated.home_goals, updated.away_goals, updated.penalties, updated.winner);
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 350);
  }

  function update(field, value) {
    if (isDisabled) return;
    const updated = { ...localRef.current, [field]: value };
    localRef.current = updated;
    setLocal({ ...updated });
    persist(updated);
  }

  // Score color
  function scoreClass() {
    if (!realScore || local.home_goals === null || local.home_goals === undefined) return '';
    if (local.home_goals === result.home_goals && local.away_goals === result.away_goals && !!local.penalties === !!result.penalties) return 'score-exact';
    return '';
  }

  // Team button color
  function teamClass(team) {
    if (!local.winner || local.winner !== team) return '';
    if (!realWinner) return 'ko-winner-selected';
    return realWinner === team ? 'ko-winner-correct' : 'ko-winner-wrong';
  }

  // Points
  let ptsLabel = null;
  if (realWinner && local.winner) {
    if (local.winner === realWinner) {
      const exact = realScore &&
        local.home_goals === result.home_goals &&
        local.away_goals === result.away_goals &&
        !!local.penalties === !!result.penalties;
      ptsLabel = exact ? { text: '+3 pts ⭐', cls: 'exact' } : { text: '+1 pt ✓', cls: 'correct' };
    } else {
      ptsLabel = { text: '0 pts ✗', cls: 'wrong' };
    }
  }

  return (
    <div className={`ko-bracket-card ${frozen ? 'ko-frozen' : ''} ${!hasTeams ? 'ko-pending' : ''}`}>
      {/* Header */}
      <div className="ko-card-header">
        <span className="ko-match-num">M{match.matchNum}</span>
        <span className="ko-match-date">{formatDate(match.date)}</span>
        {frozen && <span className="ko-frozen-badge">🔒</span>}
        <span className={`ko-save-state ${saveState}`}>
          {saveState === 'saving' ? '···' : saveState === 'saved' ? '✓' : saveState === 'error' ? '⚠' : ''}
        </span>
      </div>

      {!hasTeams ? (
        <div className="ko-pending-teams">El admin aún no ha definido los equipos</div>
      ) : (
        <>
          {/* HOME TEAM BUTTON */}
          <button className={`ko-team-btn ${teamClass(homeTeam)}`} onClick={() => update('winner', local.winner === homeTeam ? null : homeTeam)} disabled={isDisabled}>
            <span className="ko-flag">{FLAGS[homeTeam] || '🏳️'}</span>
            <span className="ko-team-name">{homeTeam}</span>
          </button>

          {/* SCORE */}
          <div className={`ko-score-row ${scoreClass()}`}>
            <input type="number" min="0" max="20" className="ko-score-input"
              value={local.home_goals ?? ''} placeholder="-" disabled={isDisabled}
              onChange={e => update('home_goals', e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))}
            />
            <span className="ko-score-sep">-</span>
            <input type="number" min="0" max="20" className="ko-score-input"
              value={local.away_goals ?? ''} placeholder="-" disabled={isDisabled}
              onChange={e => update('away_goals', e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          {/* PENALTIES */}
          <label className={`ko-penalties-label ${isDisabled ? 'disabled' : ''}`}>
            <input type="checkbox" checked={!!local.penalties}
              onChange={e => update('penalties', e.target.checked)} disabled={isDisabled}
            />
            <span>Penales</span>
            {result?.penalties && <span className="ko-penalties-real">✓ Sí fueron</span>}
          </label>

          {/* AWAY TEAM BUTTON */}
          <button className={`ko-team-btn ${teamClass(awayTeam)}`} onClick={() => update('winner', local.winner === awayTeam ? null : awayTeam)} disabled={isDisabled}>
            <span className="ko-flag">{FLAGS[awayTeam] || '🏳️'}</span>
            <span className="ko-team-name">{awayTeam}</span>
          </button>

          {/* REAL RESULT */}
          {realWinner && (
            <div className="ko-real-result">
              Avanza: <strong>{FLAGS[realWinner] || ''} {realWinner}</strong>
              {realScore && <span> ({result.home_goals}-{result.away_goals}{result.penalties ? ' pen.' : ''})</span>}
            </div>
          )}

          {/* POINTS */}
          {ptsLabel && (
            <div className={`ko-pts-preview ${ptsLabel.cls}`}>{ptsLabel.text}</div>
          )}
        </>
      )}
    </div>
  );
}

export default function KnockoutBracketSection({ session, picks, results }) {
  const [activePhase, setActivePhase] = useState('r32');
  const phaseData = PHASES.find(p => p.id === activePhase);

  const filledInPhase = phaseData.matches.filter(m => results[m.id]?.home_team).length;

  return (
    <div className="ko-bracket-section">
      <div className="ko-bracket-info">
        ⭐ Marcador exacto o penales acertados = <strong>3 pts</strong> &nbsp;·&nbsp; ✓ Ganador correcto = <strong>1 pt</strong><br/>
        Toca un equipo para marcarlo como tu ganador. Llena el marcador que predices y si crees que irán a penales.
        Los equipos aparecen cuando el admin los confirma.
      </div>

      <div className="ko-phase-tabs">
        {PHASES.map(p => (
          <button key={p.id} className={`ko-phase-tab ${activePhase === p.id ? 'active' : ''}`} onClick={() => setActivePhase(p.id)}>
            <span className="phase-short">{p.label}</span>
            <span className="phase-full">{p.fullLabel}</span>
          </button>
        ))}
      </div>

      {filledInPhase === 0 && (
        <div className="ko-no-teams-notice">
          ⏳ El admin aún no ha confirmado los equipos para esta ronda.
        </div>
      )}

      <div className="ko-bracket-scroll">
        <div className="ko-bracket-cards">
          {phaseData.matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              result={results[match.id] || null}
              pick={picks[match.id] || {}}
              userId={session.user.id}
              frozen={results[match.id]?.frozen || false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
