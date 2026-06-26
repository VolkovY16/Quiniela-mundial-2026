import { useState, useEffect, useRef } from 'react';
import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, FLAGS, formatDate } from '../lib/worldcupData.js';
import { saveKoDetailPick } from '../lib/supabase.js';

const PHASES = [
  { id: 'r32', label: 'R32', fullLabel: 'Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16', label: 'R16', fullLabel: 'Octavos', matches: R16_BRACKET },
  { id: 'qf',  label: 'QF',  fullLabel: 'Cuartos', matches: QF_BRACKET },
  { id: 'sf',  label: 'SF',  fullLabel: 'Semis', matches: SF_BRACKET },
  { id: 'final', label: 'Final', fullLabel: 'Final', matches: [FINAL, THIRD_PLACE] },
];

function ScoreBox({ value, onChange, disabled }) {
  return (
    <input
      type="number" min="0" max="20"
      value={value === null || value === undefined ? '' : value}
      onChange={e => onChange(e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))}
      disabled={disabled}
      className="ko-score-input"
      placeholder="-"
    />
  );
}

function MatchCard({ match, result, pick, onSave, frozen }) {
  const picksRef = useRef(pick || {});
  const [localPick, setLocalPick] = useState(pick || {});
  const [saveState, setSaveState] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    picksRef.current = pick || {};
    setLocalPick(pick || {});
  }, [pick]);

  const homeTeam = result?.home_team || null;
  const awayTeam = result?.away_team || null;
  const hasTeams = homeTeam && awayTeam;
  const isDisabled = frozen || !hasTeams;

  const realWinner = result?.winner || null;
  const realScore = result?.home_goals !== null && result?.home_goals !== undefined;

  function getWinnerClass(team) {
    if (!localPick.winner || !team) return '';
    if (localPick.winner === team) {
      if (realWinner) return realWinner === team ? 'ko-winner-correct' : 'ko-winner-wrong';
      return 'ko-winner-selected';
    }
    return '';
  }

  function getScoreClass() {
    if (!realScore || localPick.home_goals === null || localPick.home_goals === undefined) return '';
    if (localPick.home_goals === result.home_goals && localPick.away_goals === result.away_goals && localPick.penalties === result.penalties) return 'score-exact';
    return '';
  }

  async function handleChange(field, value) {
    if (isDisabled) return;
    const updated = { ...picksRef.current, [field]: value };
    picksRef.current = updated;
    setLocalPick({ ...updated });

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await onSave(match.id, updated.home_goals, updated.away_goals, updated.penalties, updated.winner);
        setSaveState('saved');
      } catch (e) {
        setSaveState('error');
      }
    }, 400);
  }

  // Points preview
  let ptsPreview = null;
  if (realWinner && localPick.winner) {
    if (localPick.winner === realWinner) {
      const exactScore = localPick.home_goals === result.home_goals &&
                         localPick.away_goals === result.away_goals &&
                         localPick.penalties === result.penalties;
      ptsPreview = exactScore ? '+3 pts ⭐' : '+1 pt ✓';
    } else {
      ptsPreview = '0 pts ✗';
    }
  }

  return (
    <div className={`ko-bracket-card ${frozen ? 'ko-frozen' : ''} ${!hasTeams ? 'ko-pending' : ''}`}>
      <div className="ko-card-header">
        <span className="ko-match-num">M{match.matchNum}</span>
        <span className="ko-match-date">{formatDate(match.date)}</span>
        {frozen && <span className="ko-frozen-badge">🔒</span>}
        {saveState === 'saving' && <span className="ko-save-state saving">...</span>}
        {saveState === 'saved' && <span className="ko-save-state saved">✓</span>}
        {saveState === 'error' && <span className="ko-save-state error">⚠</span>}
      </div>

      {!hasTeams ? (
        <div className="ko-pending-teams">Por definir</div>
      ) : (
        <>
          {/* HOME TEAM */}
          <button
            className={`ko-team-btn ${getWinnerClass(homeTeam)}`}
            onClick={() => handleChange('winner', localPick.winner === homeTeam ? null : homeTeam)}
            disabled={isDisabled}
          >
            <span className="ko-flag">{FLAGS[homeTeam] || '🏳️'}</span>
            <span className="ko-team-name">{homeTeam}</span>
          </button>

          {/* SCORE ROW */}
          <div className={`ko-score-row ${getScoreClass()}`}>
            <ScoreBox value={localPick.home_goals} onChange={v => handleChange('home_goals', v)} disabled={isDisabled} />
            <span className="ko-score-sep">-</span>
            <ScoreBox value={localPick.away_goals} onChange={v => handleChange('away_goals', v)} disabled={isDisabled} />
          </div>

          {/* PENALTIES */}
          <label className={`ko-penalties-label ${isDisabled ? 'disabled' : ''}`}>
            <input
              type="checkbox"
              checked={!!localPick.penalties}
              onChange={e => handleChange('penalties', e.target.checked)}
              disabled={isDisabled}
            />
            <span>Penales</span>
            {result?.penalties && <span className="ko-penalties-real">✓ Sí fueron</span>}
          </label>

          {/* AWAY TEAM */}
          <button
            className={`ko-team-btn ${getWinnerClass(awayTeam)}`}
            onClick={() => handleChange('winner', localPick.winner === awayTeam ? null : awayTeam)}
            disabled={isDisabled}
          >
            <span className="ko-flag">{FLAGS[awayTeam] || '🏳️'}</span>
            <span className="ko-team-name">{awayTeam}</span>
          </button>

          {/* REAL RESULT */}
          {realWinner && (
            <div className="ko-real-result">
              Avanza: <strong>{FLAGS[realWinner]} {realWinner}</strong>
              {realScore && <span> ({result.home_goals}-{result.away_goals}{result.penalties ? ' pen.' : ''})</span>}
            </div>
          )}

          {/* POINTS PREVIEW */}
          {ptsPreview && (
            <div className={`ko-pts-preview ${ptsPreview.startsWith('+3') ? 'exact' : ptsPreview.startsWith('+1') ? 'correct' : 'wrong'}`}>
              {ptsPreview}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function KnockoutBracketSection({ session, picks, results, onPickSaved }) {
  const [activePhase, setActivePhase] = useState('r32');

  async function handleSave(matchId, homeGoals, awayGoals, penalties, winner) {
    await saveKoDetailPick(session.user.id, matchId, homeGoals, awayGoals, penalties, winner);
    onPickSaved?.();
  }

  const phaseData = PHASES.find(p => p.id === activePhase);

  return (
    <div className="ko-bracket-section">
      <div className="ko-bracket-info">
        ⭐ Marcador exacto o penales acertados = <strong>3 pts</strong> · ✓ Ganador correcto = <strong>1 pt</strong>
        <br/>Selecciona al ganador tocando el equipo. Los equipos los define el admin conforme avanza el torneo.
      </div>

      {/* Phase tabs */}
      <div className="ko-phase-tabs">
        {PHASES.map(p => (
          <button
            key={p.id}
            className={`ko-phase-tab ${activePhase === p.id ? 'active' : ''}`}
            onClick={() => setActivePhase(p.id)}
          >
            <span className="phase-short">{p.label}</span>
            <span className="phase-full">{p.fullLabel}</span>
          </button>
        ))}
      </div>

      {/* Bracket scroll */}
      <div className="ko-bracket-scroll">
        <div className="ko-bracket-cards">
          {phaseData.matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              result={results[match.id] || null}
              pick={picks[match.id] || {}}
              onSave={handleSave}
              frozen={results[match.id]?.frozen || false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
