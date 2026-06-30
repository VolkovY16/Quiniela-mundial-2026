import { useState, useRef, useEffect, useCallback } from 'react';
import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, FLAGS, formatDate } from '../lib/worldcupData.js';
import { saveKoDetailPick } from '../lib/supabase.js';
import { scoreKoPick } from '../lib/bracketFlow.js';

const PHASES = [
  { id: 'r32',   label: 'R32', fullLabel: 'Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16',   label: 'R16', fullLabel: 'Octavos',       matches: R16_BRACKET },
  { id: 'qf',    label: 'QF',  fullLabel: 'Cuartos',       matches: QF_BRACKET },
  { id: 'sf',    label: 'SF',  fullLabel: 'Semis',         matches: SF_BRACKET },
  { id: 'final', label: 'Final', fullLabel: 'Final',       matches: [FINAL, THIRD_PLACE] },
];

// Resolve teams for a match based on user's previous picks (for R16 onwards)
// For R32, teams come from real results (admin-defined)
function resolveTeams(match, userPicks, realResults) {
  // R32: teams from admin real results
  if (R32_BRACKET.find(m => m.id === match.id)) {
    const real = realResults[match.id] || {};
    return { home: real.home_team || null, away: real.away_team || null };
  }
  // Later rounds: teams from user's previous picks
  const home = match.homeSource ? (userPicks[match.homeSource]?.winner || null) : null;
  const away = match.awaySource ? (userPicks[match.awaySource]?.winner || null) : null;
  return { home, away };
}

function MatchCard({ match, userPicks, realResults, onSave, phaseId }) {
  const { home, away } = resolveTeams(match, userPicks, realResults);
  const pick = userPicks[match.id] || {};
  const real = realResults[match.id] || {};
  const frozen = real.frozen || false;
  const hasTeams = home && away;
  const isDisabled = frozen || !hasTeams;

  // Local state for immediate UI feedback
  const [localPick, setLocalPick] = useState({ ...pick });
  const localRef = useRef({ ...pick });
  const [saveState, setSaveState] = useState('');
  const saveTimer = useRef(null);
  const retryCount = useRef(0);

  // Sync when pick changes from parent (e.g. on load)
  useEffect(() => {
    localRef.current = { ...pick };
    setLocalPick({ ...pick });
  }, [pick.winner, pick.home_goals, pick.away_goals, pick.penalties]);

  const persist = useCallback(async (updated) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      const attempt = async () => {
        try {
          await onSave(match.id, updated.home_goals, updated.away_goals, updated.penalties, updated.winner);
          setSaveState('saved');
          retryCount.current = 0;
        } catch (e) {
          if (retryCount.current < 3) {
            retryCount.current++;
            setTimeout(attempt, 1000 * retryCount.current);
          } else {
            setSaveState('error');
            retryCount.current = 0;
          }
        }
      };
      attempt();
    }, 300);
  }, [match.id, onSave]);

  function update(field, value) {
    if (isDisabled) return;
    const updated = { ...localRef.current, [field]: value };
    localRef.current = updated;
    setLocalPick({ ...updated });
    persist(updated);
  }

  // Scoring
  const { pts, status } = scoreKoPick(localPick, real.winner ? real : null);

  // Card border color based on status
  const cardClass = [
    'ko-bracket-card',
    frozen ? 'ko-frozen' : '',
    !hasTeams ? 'ko-pending' : '',
    status === 'exact' ? 'ko-card-exact' : '',
    status === 'correct' ? 'ko-card-correct' : '',
    status === 'wrong' ? 'ko-card-wrong' : '',
  ].filter(Boolean).join(' ');

  // Team button class
  function teamClass(team) {
    if (!localPick.winner || localPick.winner !== team) return 'ko-team-btn';
    if (!real.winner) return 'ko-team-btn ko-winner-selected';
    if (real.winner === team) return 'ko-team-btn ko-winner-correct';
    return 'ko-team-btn ko-winner-wrong';
  }

  const scoreClass = status === 'exact' ? 'ko-score-row score-exact' : 'ko-score-row';

  return (
    <div className={cardClass}>
      <div className="ko-card-header">
        <span className="ko-match-num">M{match.matchNum}</span>
        <span className="ko-match-date">{formatDate(match.date)}</span>
        {frozen && <span className="ko-frozen-badge">🔒</span>}
        <span className={`ko-save-state ${saveState}`}>
          {saveState === 'saving' ? '···' : saveState === 'saved' ? '✓' : saveState === 'error' ? '⚠' : ''}
        </span>
      </div>

      {!hasTeams ? (
        <div className="ko-pending-teams">
          {phaseId === 'r32' ? 'Admin por definir equipos' : 'Elige ganadores en ronda anterior'}
        </div>
      ) : (
        <>
          <button className={teamClass(home)} onClick={() => update('winner', localPick.winner === home ? null : home)} disabled={isDisabled}>
            <span className="ko-flag">{FLAGS[home] || '🏳️'}</span>
            <span className="ko-team-name">{home}</span>
          </button>

          <div className={scoreClass}>
            <input type="number" min="0" max="20" className="ko-score-input"
              value={localPick.home_goals ?? ''} placeholder="-" disabled={isDisabled}
              onChange={e => update('home_goals', e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))}
            />
            <span className="ko-score-sep">-</span>
            <input type="number" min="0" max="20" className="ko-score-input"
              value={localPick.away_goals ?? ''} placeholder="-" disabled={isDisabled}
              onChange={e => update('away_goals', e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <label className={`ko-penalties-label ${isDisabled ? 'disabled' : ''}`}>
            <input type="checkbox" checked={!!localPick.penalties}
              onChange={e => update('penalties', e.target.checked)} disabled={isDisabled}
            />
            <span>Penales</span>
            {real.penalties && <span className="ko-penalties-real">✓ Fueron</span>}
          </label>

          <button className={teamClass(away)} onClick={() => update('winner', localPick.winner === away ? null : away)} disabled={isDisabled}>
            <span className="ko-flag">{FLAGS[away] || '🏳️'}</span>
            <span className="ko-team-name">{away}</span>
          </button>

          {real.winner && (
            <div className="ko-real-result">
              Avanza: <strong>{FLAGS[real.winner] || ''} {real.winner}</strong>
              {real.home_goals !== null && real.home_goals !== undefined &&
                <span> ({real.home_goals}-{real.away_goals}{real.penalties ? ' pen.' : ''})</span>}
            </div>
          )}

          {status !== 'pending' && status !== 'no_pick' && real.winner && (
            <div className={`ko-pts-preview ${status}`}>
              {status === 'exact' ? '+3 pts ⭐' : status === 'correct' ? '+1 pt ✓' : '0 pts ✗'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function KnockoutBracketSection({ session, userPicks, setUserPicks, realResults }) {
  const [activePhase, setActivePhase] = useState('r32');

  const handleSave = useCallback(async (matchId, homeGoals, awayGoals, penalties, winner) => {
    // Update parent state immediately so flowing picks update in real time
    setUserPicks(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], match_id: matchId, home_goals: homeGoals, away_goals: awayGoals, penalties, winner }
    }));
    await saveKoDetailPick(session.user.id, matchId, homeGoals, awayGoals, penalties, winner);
  }, [session.user.id, setUserPicks]);

  const phaseData = PHASES.find(p => p.id === activePhase);
  const definedCount = phaseData.matches.filter(m => {
    const { home, away } = resolveTeams(m, userPicks, realResults);
    return home && away;
  }).length;

  return (
    <div className="ko-bracket-section">
      <div className="ko-bracket-info">
        ⭐ Marcador exacto o penales = <strong>3 pts</strong> &nbsp;·&nbsp; ✓ Ganador = <strong>1 pt</strong><br/>
        Toca un equipo para marcarlo como tu ganador. En R32 los equipos los define el admin. En las siguientes rondas, avanzan los equipos que elegiste en la ronda anterior.
      </div>

      <div className="ko-phase-tabs">
        {PHASES.map(p => (
          <button key={p.id} className={`ko-phase-tab ${activePhase === p.id ? 'active' : ''}`} onClick={() => setActivePhase(p.id)}>
            <span className="phase-short">{p.label}</span>
            <span className="phase-full">{p.fullLabel}</span>
          </button>
        ))}
      </div>

      {definedCount === 0 && (
        <div className="ko-no-teams-notice">
          {activePhase === 'r32'
            ? '⏳ El admin aún no ha definido los equipos para esta ronda.'
            : '⏳ Elige ganadores en la ronda anterior para ver los equipos aquí.'}
        </div>
      )}

      <div className="ko-bracket-scroll">
        <div className="ko-bracket-cards">
          {phaseData.matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              userPicks={userPicks}
              realResults={realResults}
              onSave={handleSave}
              phaseId={activePhase}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
