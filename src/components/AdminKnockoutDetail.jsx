import { useState, useEffect } from 'react';
import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, FLAGS, GROUPS, getAllGroupMatches, formatDate, computeThirdPlaces, assignThirdsToSlots, THIRD_PLACE_SLOTS } from '../lib/worldcupData.js';
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
].sort();

function TeamSelect({ value, onChange, disabled }) {
  const [mode, setMode] = useState('type'); // 'type' | 'pick'

  return (
    <div className="team-autocomplete">
      <div className="team-mode-toggle">
        <button className={mode === 'type' ? 'active' : ''} onClick={() => setMode('type')}>Escribir</button>
        <button className={mode === 'pick' ? 'active' : ''} onClick={() => setMode('pick')}>Lista</button>
      </div>

      {mode === 'type' ? (
        <TypeInput value={value} onChange={onChange} disabled={disabled} />
      ) : (
        <div className="team-input-row">
          <span className="admin-ko-flag">{FLAGS[value] || '🏳️'}</span>
          <select
            className="team-text-input"
            value={value || ''}
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
          >
            <option value="">— Selecciona equipo —</option>
            {ALL_TEAMS.map(t => (
              <option key={t} value={t}>{FLAGS[t] || ''} {t}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function TypeInput({ value, onChange, disabled }) {
  const [show, setShow] = useState(false);
  const filtered = value
    ? ALL_TEAMS.filter(t => t.toLowerCase().includes(value.toLowerCase()) && t !== value)
    : [];

  return (
    <div style={{position:'relative'}}>
      <div className="team-input-row">
        <span className="admin-ko-flag">{FLAGS[value] || '🏳️'}</span>
        <input
          type="text"
          className="team-text-input"
          value={value || ''}
          placeholder="Escribe selección..."
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
    const init = {};
    for (const [k, v] of Object.entries(koResults)) init[k] = { ...v };
    setLocalData(init);
  }, [koResults]);

  // Compute real group standings from admin-entered results
  function getRealStanding(groupId, pos) {
    const group = GROUPS[groupId];
    const matches = allMatches.filter(m => m.group === groupId);
    const table = computeGroupTable(group.teams, matches, Object.values(groupResults));
    return table[pos - 1]?.team || null;
  }

  // Compute real 3rd place assignments from group results
  const realThirdAssignments = (() => {
    const picksFromResults = {};
    for (const r of Object.values(groupResults)) {
      picksFromResults[r.match_id] = { home_goals: r.home_goals, away_goals: r.away_goals };
    }
    const thirds = computeThirdPlaces(picksFromResults);
    return assignThirdsToSlots(thirds);
  })();

  // Auto-suggest team for a match source
  function autoTeam(source, matchId) {
    if (!source) {
      // It's a third-place slot
      return realThirdAssignments[matchId] || null;
    }
    const gMatch = source.match(/^([A-L])([12])$/);
    if (gMatch) return getRealStanding(gMatch[1], Number(gMatch[2]));
    return koResults[source]?.winner || null;
  }

  function get(matchId) { return localData[matchId] || {}; }

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

  // Auto-fill all teams in current phase from real results
  async function handleAutoFillPhase() {
    const phaseData = PHASES.find(p => p.id === activePhase);
    const updates = { ...localData };
    for (const match of phaseData.matches) {
      const d = updates[match.id] || {};
      const sugHome = autoTeam(match.homeSource, match.id);
      const sugAway = match.awaySource ? autoTeam(match.awaySource, match.id) : realThirdAssignments[match.id] || null;
      if (sugHome && !d.home_team) updates[match.id] = { ...d, home_team: sugHome };
      if (sugAway && !updates[match.id]?.away_team) updates[match.id] = { ...updates[match.id], away_team: sugAway };
    }
    setLocalData(updates);
  }

  const phaseData = PHASES.find(p => p.id === activePhase);
  const thirdsReady = Object.keys(realThirdAssignments).length;

  return (
    <div className="admin-ko-detail">
      <div className="admin-ko-detail-header">
        <h3>Bracket Eliminatorias — Admin</h3>
        <p className="muted">
          <strong>Paso 1:</strong> Define los equipos (se auto-sugieren de los resultados reales incluyendo los 8 mejores terceros).<br/>
          <strong>Paso 2:</strong> Después del partido ingresa el resultado real para otorgar puntos.
        </p>
        {activePhase === 'r32' && (
          <p className="muted" style={{marginTop:'0.3rem'}}>
            Terceros lugares calculados: <strong>{thirdsReady}/8</strong>
            {thirdsReady < 8 && ' — necesitas ingresar más resultados de grupos'}
          </p>
        )}
      </div>

      <div className="admin-group-tabs">
        {PHASES.map(p => (
          <button key={p.id} className={`group-tab ${activePhase === p.id ? 'active' : ''}`}
            onClick={() => setActivePhase(p.id)}>{p.label}</button>
        ))}
      </div>

      <button className="btn-autofill" onClick={handleAutoFillPhase}>
        🔄 Auto-llenar equipos vacíos en esta ronda
      </button>

      <div className="admin-ko-matches">
        {phaseData.matches.map(match => {
          const d = get(match.id);
          const saved = koResults[match.id] || {};
          const frozen = saved.frozen || false;
          const isSaving = saving === match.id;

          const sugHome = autoTeam(match.homeSource, match.id);
          const sugAway = match.awaySource
            ? autoTeam(match.awaySource, match.id)
            : realThirdAssignments[match.id] || null;

          const thirdSlotLabel = !match.awaySource && match.thirdSources
            ? `3° mejor de grupos ${match.thirdSources}`
            : null;

          return (
            <div key={match.id} className={`admin-ko-detail-card ${frozen ? 'ko-frozen' : ''}`}>
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
                {/* STEP 1: TEAMS */}
                <div className="admin-ko-step">
                  <div className="admin-ko-step-label">1 · Equipos</div>

                  <div className="admin-ko-team-row-labeled">
                    <span className="admin-side-label">Local</span>
                    <div style={{flex:1}}>
                      {sugHome && !d.home_team && (
                        <button className="auto-suggest-btn" onClick={() => set(match.id, 'home_team', sugHome)}>
                          → {FLAGS[sugHome] || ''} {sugHome}
                        </button>
                      )}
                      <TeamSelect value={d.home_team || ''} onChange={v => set(match.id, 'home_team', v)} disabled={frozen} />
                    </div>
                  </div>

                  <div className="admin-ko-team-row-labeled">
                    <span className="admin-side-label">Visit.</span>
                    <div style={{flex:1}}>
                      {sugAway && !d.away_team && (
                        <button className="auto-suggest-btn" onClick={() => set(match.id, 'away_team', sugAway)}>
                          → {FLAGS[sugAway] || ''} {sugAway}
                          {thirdSlotLabel && <span className="muted" style={{fontSize:'0.65rem', marginLeft:'0.3rem'}}>({thirdSlotLabel})</span>}
                        </button>
                      )}
                      {!sugAway && thirdSlotLabel && !d.away_team && (
                        <p className="muted" style={{fontSize:'0.72rem', marginBottom:'0.3rem'}}>⏳ {thirdSlotLabel} — ingresa más resultados de grupos</p>
                      )}
                      <TeamSelect value={d.away_team || ''} onChange={v => set(match.id, 'away_team', v)} disabled={frozen} />
                    </div>
                  </div>
                </div>

                {/* STEP 2: RESULT */}
                <div className="admin-ko-step">
                  <div className="admin-ko-step-label">2 · Resultado real</div>
                  <div className="admin-ko-score-section">
                    <div className="admin-ko-score-row">
                      <span className="admin-score-team">{FLAGS[d.home_team] || '🏳️'} {d.home_team || 'Local'}</span>
                      <input type="number" min="0" max="20" className="admin-score-input"
                        value={d.home_goals ?? ''} placeholder="-"
                        onChange={e => set(match.id, 'home_goals', e.target.value === '' ? null : Number(e.target.value))}
                        disabled={frozen} />
                    </div>
                    <div className="admin-ko-score-row">
                      <span className="admin-score-team">{FLAGS[d.away_team] || '🏳️'} {d.away_team || 'Visitante'}</span>
                      <input type="number" min="0" max="20" className="admin-score-input"
                        value={d.away_goals ?? ''} placeholder="-"
                        onChange={e => set(match.id, 'away_goals', e.target.value === '' ? null : Number(e.target.value))}
                        disabled={frozen} />
                    </div>
                    <label className="admin-ko-penalties">
                      <input type="checkbox" checked={!!d.penalties}
                        onChange={e => set(match.id, 'penalties', e.target.checked)} disabled={frozen} />
                      Fueron a penales
                    </label>
                  </div>

                  {(d.home_team || d.away_team) && (
                    <div className="admin-ko-winner-row">
                      <span className="muted" style={{fontSize:'0.78rem'}}>Avanza:</span>
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

                <button className="btn-save-ko" onClick={() => handleSave(match.id)} disabled={isSaving || frozen}>
                  {isSaving ? 'Guardando...' : '💾 Guardar'}
                </button>

                {saved.home_team && (
                  <div className="admin-ko-saved-status">
                    ✓ {FLAGS[saved.home_team] || ''} {saved.home_team} vs {FLAGS[saved.away_team] || ''} {saved.away_team}
                    {saved.winner && <> · Avanza: <strong>{FLAGS[saved.winner] || ''} {saved.winner}</strong></>}
                    {saved.home_goals !== null && saved.home_goals !== undefined && <> · {saved.home_goals}-{saved.away_goals}{saved.penalties ? ' (pen.)' : ''}</>}
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
