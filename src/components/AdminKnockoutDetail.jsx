import { useState } from 'react';
import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, FLAGS, formatDate, GROUPS } from '../lib/worldcupData.js';
import { saveKoDetailResult, toggleKoFreeze } from '../lib/supabase.js';
import { computeGroupTable } from '../lib/scoring.js';

const PHASES = [
  { id: 'r32', label: 'R32 · Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16', label: 'R16 · Octavos', matches: R16_BRACKET },
  { id: 'qf',  label: 'QF · Cuartos', matches: QF_BRACKET },
  { id: 'sf',  label: 'SF · Semis', matches: SF_BRACKET },
  { id: 'final', label: 'Final', matches: [FINAL, THIRD_PLACE] },
];

export default function AdminKnockoutDetail({ koResults, setKoResults, groupResults, allMatches }) {
  const [activePhase, setActivePhase] = useState('r32');
  const [saving, setSaving] = useState('');

  // Resolve team from source using real group results
  function resolveTeam(source) {
    if (!source) return null;
    const gMatch = source.match(/^([A-L])([12])$/);
    if (gMatch) {
      const group = GROUPS[gMatch[1]];
      const matches = allMatches.filter(m => m.group === gMatch[1]);
      const table = computeGroupTable(group.teams, matches, Object.values(groupResults));
      return table[Number(gMatch[2]) - 1]?.team || null;
    }
    // From knockout winner
    return koResults[source]?.winner || null;
  }

  async function handleSave(matchId, field, value) {
    const current = koResults[matchId] || {};
    const updated = { ...current, match_id: matchId, [field]: value };
    setKoResults(prev => ({ ...prev, [matchId]: updated }));

    setSaving(matchId);
    try {
      await saveKoDetailResult(
        matchId,
        updated.home_team,
        updated.away_team,
        updated.home_goals ?? null,
        updated.away_goals ?? null,
        updated.penalties || false,
        updated.winner || null
      );
    } catch (e) {
      console.error(e);
    }
    setSaving('');
  }

  async function handleFreeze(matchId) {
    const current = koResults[matchId] || {};
    const newFrozen = !current.frozen;
    setKoResults(prev => ({ ...prev, [matchId]: { ...prev[matchId], frozen: newFrozen } }));
    await toggleKoFreeze(matchId, newFrozen);
  }

  const phaseData = PHASES.find(p => p.id === activePhase);

  return (
    <div className="admin-ko-detail">
      <div className="admin-ko-detail-header">
        <h3>Bracket de Eliminatorias — Admin</h3>
        <p className="muted">Define los equipos, marcadores y ganadores. Los equipos se auto-llenan desde los resultados reales de grupos. Usa 🔒 para congelar un partido y que los usuarios no puedan editarlo.</p>
      </div>

      <div className="admin-group-tabs" style={{flexWrap:'wrap'}}>
        {PHASES.map(p => (
          <button key={p.id} className={`group-tab ${activePhase === p.id ? 'active' : ''}`} onClick={() => setActivePhase(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="admin-ko-matches">
        {phaseData.matches.map(match => {
          const result = koResults[match.id] || {};
          const autoHome = resolveTeam(match.homeSource);
          const autoAway = match.awaySource ? resolveTeam(match.awaySource) : null;
          const homeTeam = result.home_team || autoHome;
          const awayTeam = result.away_team || autoAway;
          const isSaving = saving === match.id;
          const frozen = result.frozen || false;

          return (
            <div key={match.id} className={`admin-ko-detail-card ${frozen ? 'ko-frozen' : ''}`}>
              <div className="admin-ko-detail-header-row">
                <span className="ko-match-num">M{match.matchNum} · {formatDate(match.date)}</span>
                <span className="ko-match-date muted">📍 {match.venue}</span>
                <button
                  className={`btn-freeze ${frozen ? 'frozen' : ''}`}
                  onClick={() => handleFreeze(match.id)}
                  title={frozen ? 'Descongelar' : 'Congelar'}
                >
                  {frozen ? '🔒 Congelado' : '🔓 Congelar'}
                </button>
                {isSaving && <span className="muted" style={{fontSize:'0.75rem'}}>Guardando...</span>}
              </div>

              <div className="admin-ko-detail-body">
                {/* HOME TEAM */}
                <div className="admin-ko-team-row">
                  <span className="admin-ko-flag">{FLAGS[homeTeam] || '🏳️'}</span>
                  <span className="admin-ko-team-name">{homeTeam || <span className="muted">Por definir</span>}</span>
                  <input
                    type="number" min="0" max="20"
                    className="admin-score-input"
                    value={result.home_goals ?? ''}
                    placeholder="-"
                    onChange={e => handleSave(match.id, 'home_goals', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>

                <div className="admin-ko-middle">
                  <label className="admin-ko-penalties">
                    <input
                      type="checkbox"
                      checked={!!result.penalties}
                      onChange={e => handleSave(match.id, 'penalties', e.target.checked)}
                    />
                    Penales
                  </label>
                </div>

                {/* AWAY TEAM */}
                <div className="admin-ko-team-row">
                  <span className="admin-ko-flag">{FLAGS[awayTeam] || '🏳️'}</span>
                  <span className="admin-ko-team-name">{awayTeam || <span className="muted">Por definir</span>}</span>
                  <input
                    type="number" min="0" max="20"
                    className="admin-score-input"
                    value={result.away_goals ?? ''}
                    placeholder="-"
                    onChange={e => handleSave(match.id, 'away_goals', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>

                {/* WINNER */}
                {homeTeam && awayTeam && (
                  <div className="admin-ko-winner-row">
                    <span className="muted" style={{fontSize:'0.8rem'}}>Avanza:</span>
                    {[homeTeam, awayTeam].map(team => (
                      <button
                        key={team}
                        className={`admin-ko-winner-btn ${result.winner === team ? 'selected' : ''}`}
                        onClick={() => handleSave(match.id, 'winner', team)}
                      >
                        {FLAGS[team]} {team}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
