import { useState, useEffect } from 'react';
import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, FLAGS, GROUPS, getAllGroupMatches, formatDate } from '../lib/worldcupData.js';
import { saveKoDetailResult, toggleKoFreeze } from '../lib/supabase.js';
import { computeGroupTable } from '../lib/scoring.js';

const PHASES = [
  { id: 'r32',   label: 'R32 · Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16',   label: 'R16 · Octavos',       matches: R16_BRACKET },
  { id: 'qf',    label: 'QF · Cuartos',         matches: QF_BRACKET },
  { id: 'sf',    label: 'SF · Semis',           matches: SF_BRACKET },
  { id: 'final', label: 'Final',                matches: [FINAL, THIRD_PLACE] },
];

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
  const filtered = value
    ? ALL_TEAMS.filter(t => t.toLowerCase().includes(value.toLowerCase()) && t !== value)
    : [];

  return (
    <div className="team-autocomplete">
      <div className="team-input-row">
        <span className="admin-ko-flag">{FLAGS[value] || '🏳️'}</span>
        <input
          type="text"
          className="team-text-input"
          value={value || ''}
          placeholder={placeholder || 'Selección...'}
          disabled={disabled}
          onChange={e => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 200)}
        />
      </div>
      {show && filtered.length > 0 && (
        <div className="team-dropdown">
          {filtered.slice(0, 6).map(t => (
            <button key={t} className="team-dropdown-item"
              onMouseDown={() => { onChange(t); setShow(false); }}>
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
  const [localData, setLocalData] = useState({});
  const [saving, setSaving] = useState('');

  useEffect(() => {
    // Initialize local data from saved results
    const init = {};
    for (const [k, v] of Object.entries(koResults)) init[k] = { ...v };
    setLocalData(init);
  }, [koResults]);

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

  function get(matchId) {
    return localData[matchId] || {};
  }

  function set(matchId, field, value) {
    setLocalData(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: value } }));
  }

  async function handleSave(matchId) {
    const d = get(matchId);
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
      alert('Error: ' + e.message);
    }
    setSaving('');
  }

  async function handleFreeze(matchId) {
    const cur = koResults[matchId] || {};
    const newFrozen = !cur.frozen;
    await toggleKoFreeze(matchId, newFrozen);
    setKoResults(prev => ({ ...prev, [matchId]: { ...prev[matchId], frozen: newFrozen } }));
    setLocalData(prev => ({ ...prev, [matchId]: { ...prev[matchId], frozen: newFrozen } }));
  }

  const phaseData = PHASES.find(p => p.id === activePhase);

  return (
    <div className="admin-ko-detail">
      <div className="admin-ko-detail-header">
        <h3>Bracket Eliminatorias — Admin</h3>
        <p className="muted">
          <strong>Paso 1:</strong> Define los equipos de cada partido → los usuarios podrán llenar su predicción.<br/>
          <strong>Paso 2:</strong> Después del partido, ingresa el resultado real → se otorgan los puntos.
        </p>
      </div>

      <div className="admin-group-tabs">
        {PHASES.map(p => (
          <button key={p.id} className={`group-tab ${activePhase === p.id ? 'active' : ''}`}
            onClick={() => setActivePhase(p.id)}>{p.label}</button>
        ))}
      </div>

      <div className="admin-ko-matches">
        {phaseData.matches.map(match => {
          const d = get(match.id);
          const saved = koResults[match.id] || {};
          const frozen = saved.frozen || false;
          const isSaving = saving === match.id;
          const sugHome = autoTeam(match.homeSource);
          const sugAway = match.awaySource ? autoTeam(match.awaySource) : '';

          return (
            <div key={match.id} className={`admin-ko-detail-card ${frozen ? 'ko-frozen' : ''}`}>
              {/* Header */}
              <div className="admin-ko-detail-header-row">
                <div>
                  <span className="ko-match-num">M{match.matchNum}</span>
                  <span className="ko-match-date"> · {formatDate(match.date)}</span>
                </div>
                <button className={`btn-freeze ${frozen ? 'frozen' : ''}`} onClick={() => handleFreeze(match.id)}>
                  {frozen ? '🔒 Congelado' : '🔓 Congelar'}
                </button>
              </div>

              <div className="admin-ko-detail-body">

                {/* ── STEP 1: TEAMS ── */}
                <div className="admin-ko-step">
                  <div className="admin-ko-step-label">1 · Equipos</div>

                  <div className="admin-ko-team-row-labeled">
                    <span className="admin-side-label">Local</span>
                    <div style={{flex:1}}>
                      {sugHome && !d.home_team && (
                        <button className="auto-suggest-btn" onClick={() => set(match.id, 'home_team', sugHome)}>
                          → Usar {FLAGS[sugHome]} {sugHome}
                        </button>
                      )}
                      <TeamInput value={d.home_team || ''} onChange={v => set(match.id, 'home_team', v)} disabled={frozen} />
                    </div>
                  </div>

                  <div className="admin-ko-team-row-labeled">
                    <span className="admin-side-label">Visit.</span>
                    <div style={{flex:1}}>
                      {sugAway && !d.away_team && (
                        <button className="auto-suggest-btn" onClick={() => set(match.id, 'away_team', sugAway)}>
                          → Usar {FLAGS[sugAway]} {sugAway}
                        </button>
                      )}
                      <TeamInput value={d.away_team || ''} onChange={v => set(match.id, 'away_team', v)} disabled={frozen} />
                    </div>
                  </div>
                </div>

                {/* ── STEP 2: RESULT ── */}
                <div className="admin-ko-step">
                  <div className="admin-ko-step-label">2 · Resultado real (después del partido)</div>

                  <div className="admin-ko-score-section">
                    <div className="admin-ko-score-row">
                      <span className="admin-score-team">{FLAGS[d.home_team || ''] || '🏳️'} {d.home_team || 'Local'}</span>
                      <input type="number" min="0" max="20" className="admin-score-input"
                        value={d.home_goals ?? ''} placeholder="-"
                        onChange={e => set(match.id, 'home_goals', e.target.value === '' ? null : Number(e.target.value))}
                        disabled={frozen}
                      />
                    </div>
                    <div className="admin-ko-score-row">
                      <span className="admin-score-team">{FLAGS[d.away_team || ''] || '🏳️'} {d.away_team || 'Visitante'}</span>
                      <input type="number" min="0" max="20" className="admin-score-input"
                        value={d.away_goals ?? ''} placeholder="-"
                        onChange={e => set(match.id, 'away_goals', e.target.value === '' ? null : Number(e.target.value))}
                        disabled={frozen}
                      />
                    </div>
                    <label className="admin-ko-penalties">
                      <input type="checkbox" checked={!!d.penalties}
                        onChange={e => set(match.id, 'penalties', e.target.checked)} disabled={frozen} />
                      Fueron a penales
                    </label>
                  </div>

                  {/* WINNER */}
                  {(d.home_team || d.away_team) && (
                    <div className="admin-ko-winner-row">
                      <span className="muted" style={{fontSize:'0.78rem'}}>Equipo que avanza:</span>
                      {[d.home_team, d.away_team].filter(Boolean).map(team => (
                        <button key={team}
                          className={`admin-ko-winner-btn ${d.winner === team ? 'selected' : ''}`}
                          onClick={() => set(match.id, 'winner', d.winner === team ? null : team)}
                          disabled={frozen}>
                          {FLAGS[team] || ''} {team}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* SAVE BUTTON */}
                <button className="btn-save-ko" onClick={() => handleSave(match.id)} disabled={isSaving || frozen}>
                  {isSaving ? 'Guardando...' : '💾 Guardar'}
                </button>

                {/* SAVED STATUS */}
                {saved.home_team && (
                  <div className="admin-ko-saved-status">
                    ✓ {FLAGS[saved.home_team] || ''} {saved.home_team} vs {FLAGS[saved.away_team] || ''} {saved.away_team}
                    {saved.winner && <> · Avanza: <strong>{FLAGS[saved.winner] || ''} {saved.winner}</strong></>}
                    {(saved.home_goals !== null && saved.home_goals !== undefined) && <> · {saved.home_goals}-{saved.away_goals}{saved.penalties ? ' (pen.)' : ''}</>}
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
