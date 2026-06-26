import { useState, useEffect } from 'react';
import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, FLAGS, GROUPS, getAllGroupMatches, formatDate } from '../lib/worldcupData.js';
import { saveKoDetailResult, toggleKoFreeze } from '../lib/supabase.js';
import { computeGroupTable } from '../lib/scoring.js';

const PHASES = [
  { id: 'r32', label: 'R32 · Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16', label: 'R16 · Octavos', matches: R16_BRACKET },
  { id: 'qf',  label: 'QF · Cuartos', matches: QF_BRACKET },
  { id: 'sf',  label: 'SF · Semis', matches: SF_BRACKET },
  { id: 'final', label: 'Final', matches: [FINAL, THIRD_PLACE] },
];

// All 48 teams for autocomplete
const ALL_TEAMS = [
  'México','Sudáfrica','Corea del Sur','República Checa',
  'Canadá','Bosnia y Herzegovina','Qatar','Suiza',
  'Brasil','Marruecos','Haití','Escocia',
  'Estados Unidos','Paraguay','Australia','Turquía',
  'Alemania','Curazao','Costa de Marfil','Ecuador',
  'Países Bajos','Japón','Suecia','Túnez',
  'Bélgica','Egipto','Irán','Nueva Zelanda',
  'España','Cabo Verde','Arabia Saudita','Uruguay',
  'Francia','Senegal','Irak','Noruega',
  'Argentina','Argelia','Austria','Jordania',
  'Portugal','R.D. Congo','Uzbekistán','Colombia',
  'Inglaterra','Croacia','Ghana','Panamá',
];

function TeamInput({ value, onChange, placeholder, disabled }) {
  const [show, setShow] = useState(false);
  const filtered = ALL_TEAMS.filter(t => t.toLowerCase().includes((value || '').toLowerCase()) && t !== value);

  return (
    <div className="team-autocomplete">
      <div className="team-input-row">
        <span className="admin-ko-flag">{FLAGS[value] || '🏳️'}</span>
        <input
          type="text"
          className="team-text-input"
          value={value || ''}
          placeholder={placeholder}
          disabled={disabled}
          onChange={e => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 200)}
        />
      </div>
      {show && filtered.length > 0 && value && (
        <div className="team-dropdown">
          {filtered.slice(0, 6).map(t => (
            <button key={t} className="team-dropdown-item" onMouseDown={() => { onChange(t); setShow(false); }}>
              {FLAGS[t] || '🏳️'} {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminKnockoutDetail({ koResults, setKoResults, groupResults, allMatches }) {
  const [activePhase, setActivePhase] = useState('r32');
  const [saving, setSaving] = useState('');
  const [localData, setLocalData] = useState({});

  // Initialize localData from koResults
  useEffect(() => {
    setLocalData({ ...koResults });
  }, []);

  // Auto-suggest teams from real group results
  function autoTeam(source) {
    if (!source) return '';
    const gMatch = source.match(/^([A-L])([12])$/);
    if (gMatch) {
      const group = GROUPS[gMatch[1]];
      const matches = allMatches.filter(m => m.group === gMatch[1]);
      const table = computeGroupTable(group.teams, matches, Object.values(groupResults));
      return table[Number(gMatch[2]) - 1]?.team || '';
    }
    return koResults[source]?.winner || '';
  }

  function getLocal(matchId) {
    return localData[matchId] || koResults[matchId] || {};
  }

  function updateLocal(matchId, field, value) {
    setLocalData(prev => ({ ...prev, [matchId]: { ...prev[matchId], match_id: matchId, [field]: value } }));
  }

  async function handleSaveMatch(matchId) {
    const d = getLocal(matchId);
    setSaving(matchId);
    try {
      await saveKoDetailResult(
        matchId,
        d.home_team || null,
        d.away_team || null,
        d.home_goals ?? null,
        d.away_goals ?? null,
        d.penalties || false,
        d.winner || null
      );
      setKoResults(prev => ({ ...prev, [matchId]: { ...prev[matchId], ...d } }));
    } catch (e) {
      alert('Error al guardar: ' + e.message);
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
        <p className="muted">Define los equipos, marcadores y ganadores. Puedes escribir el nombre del equipo o elegirlo de la lista. Usa 💾 para guardar cada partido y 🔒 para congelarlo.</p>
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
          const d = getLocal(match.id);
          const saved = koResults[match.id] || {};
          const frozen = saved.frozen || false;
          const isSaving = saving === match.id;

          // Auto-suggest if empty
          const suggestedHome = autoTeam(match.homeSource);
          const suggestedAway = match.awaySource ? autoTeam(match.awaySource) : '';

          return (
            <div key={match.id} className={`admin-ko-detail-card ${frozen ? 'ko-frozen' : ''}`}>
              <div className="admin-ko-detail-header-row">
                <span className="ko-match-num">M{match.matchNum} · {formatDate(match.date)}</span>
                <button className={`btn-freeze ${frozen ? 'frozen' : ''}`} onClick={() => handleFreeze(match.id)}>
                  {frozen ? '🔒' : '🔓'}
                </button>
              </div>

              <div className="admin-ko-detail-body">
                {/* HOME TEAM */}
                <div className="admin-ko-team-section">
                  <label className="admin-ko-field-label">Local {suggestedHome && !d.home_team && <span className="auto-suggest" onClick={() => updateLocal(match.id, 'home_team', suggestedHome)}>→ {suggestedHome}</span>}</label>
                  <TeamInput
                    value={d.home_team || ''}
                    onChange={v => updateLocal(match.id, 'home_team', v)}
                    placeholder={suggestedHome || 'Selección local...'}
                    disabled={frozen}
                  />
                  <input type="number" min="0" max="20" className="admin-score-input" style={{width:'60px', marginTop:'0.3rem'}}
                    value={d.home_goals ?? ''} placeholder="Goles"
                    onChange={e => updateLocal(match.id, 'home_goals', e.target.value === '' ? null : Number(e.target.value))}
                    disabled={frozen}
                  />
                </div>

                <div className="admin-ko-vs-row">
                  <span className="muted">vs</span>
                  <label className="admin-ko-penalties">
                    <input type="checkbox" checked={!!d.penalties}
                      onChange={e => updateLocal(match.id, 'penalties', e.target.checked)}
                      disabled={frozen}
                    />
                    Penales
                  </label>
                </div>

                {/* AWAY TEAM */}
                <div className="admin-ko-team-section">
                  <label className="admin-ko-field-label">Visitante {suggestedAway && !d.away_team && <span className="auto-suggest" onClick={() => updateLocal(match.id, 'away_team', suggestedAway)}>→ {suggestedAway}</span>}</label>
                  <TeamInput
                    value={d.away_team || ''}
                    onChange={v => updateLocal(match.id, 'away_team', v)}
                    placeholder={suggestedAway || 'Selección visitante...'}
                    disabled={frozen}
                  />
                  <input type="number" min="0" max="20" className="admin-score-input" style={{width:'60px', marginTop:'0.3rem'}}
                    value={d.away_goals ?? ''} placeholder="Goles"
                    onChange={e => updateLocal(match.id, 'away_goals', e.target.value === '' ? null : Number(e.target.value))}
                    disabled={frozen}
                  />
                </div>

                {/* WINNER */}
                {(d.home_team || saved.home_team) && (d.away_team || saved.away_team) && (
                  <div className="admin-ko-winner-row">
                    <span className="muted" style={{fontSize:'0.8rem'}}>Avanza:</span>
                    {[d.home_team || saved.home_team, d.away_team || saved.away_team].map(team => (
                      <button key={team}
                        className={`admin-ko-winner-btn ${d.winner === team ? 'selected' : ''}`}
                        onClick={() => updateLocal(match.id, 'winner', team)}
                        disabled={frozen}
                      >
                        {FLAGS[team] || ''} {team}
                      </button>
                    ))}
                  </div>
                )}

                {/* SAVE BUTTON */}
                <button
                  className="btn-save-ko"
                  onClick={() => handleSaveMatch(match.id)}
                  disabled={isSaving || frozen}
                >
                  {isSaving ? 'Guardando...' : '💾 Guardar partido'}
                </button>

                {saved.home_team && (
                  <div className="admin-ko-saved-status">
                    ✓ Guardado: {FLAGS[saved.home_team]} {saved.home_team} vs {FLAGS[saved.away_team]} {saved.away_team}
                    {saved.winner && <> · Avanza: <strong>{saved.winner}</strong></>}
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
