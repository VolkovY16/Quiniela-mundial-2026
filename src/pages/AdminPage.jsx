import { useState, useEffect } from 'react';
import { getAllGroupMatches, GROUPS, FLAGS, R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, formatDate, computeThirdPlaces, assignThirdsToSlots } from '../lib/worldcupData.js';
import { computeGroupTable } from '../lib/scoring.js';
import { saveResult, saveKnockoutResult, getAllResults, toggleDoubleMatch, getDoubleMatches, getBonusChallenges, saveBonusChallenge, saveBonusResult, getAllUsers, savePick, confirmQuiniela, unconfirmQuiniela, supabase } from '../lib/supabase.js';

// ─── ADMIN KNOCKOUT BRACKET (connected to real group results) ──────────────
function AdminKnockoutBracket({ koResults, setKoResults, doubleMatches, handleToggleDouble, realResults }) {
  const [phase, setPhase] = useState('r32');

  async function handleKoResult(matchId, winner) {
    const newKo = { ...koResults, [matchId]: { match_id: matchId, winner } };
    setKoResults(newKo);
    await saveKnockoutResult(matchId, winner, phase);
  }

  function getRealGroupStanding(groupId, pos) {
    const group = GROUPS[groupId];
    const groupMatches = getAllGroupMatches().filter(m => m.group === groupId);
    const table = computeGroupTable(group.teams, groupMatches, realResults);
    return table[pos - 1]?.team || null;
  }

  const realThirds = (() => {
    const picksFromResults = {};
    for (const r of realResults) {
      picksFromResults[r.match_id] = { home_goals: r.home_goals, away_goals: r.away_goals };
    }
    const thirds = computeThirdPlaces(picksFromResults);
    return assignThirdsToSlots(thirds);
  })();

  function resolveSource(source) {
    if (!source) return null;
    const gMatch = source.match(/^([A-L])([12])$/);
    if (gMatch) return getRealGroupStanding(gMatch[1], Number(gMatch[2]));
    return koResults[source]?.winner || null;
  }

  function resolveThird(matchId) {
    return realThirds[matchId] || null;
  }

  const phases = [
    { id: 'r32', label: 'Dieciseisavos', fixtures: R32_BRACKET.map(m => ({
        ...m,
        home: resolveSource(m.homeSource),
        away: m.awaySource ? resolveSource(m.awaySource) : resolveThird(m.id),
        homeLabel: m.homeSource,
        awayLabel: m.awaySource || `3° (${m.thirdSources})`,
        thirdLabel: m.thirdSources
      }))
    },
    { id: 'r16', label: 'Octavos', fixtures: R16_BRACKET.map(m => ({ ...m, home: koResults[m.homeSource]?.winner || null, away: koResults[m.awaySource]?.winner || null })) },
    { id: 'qf',  label: 'Cuartos',  fixtures: QF_BRACKET.map(m => ({ ...m, home: koResults[m.homeSource]?.winner || null, away: koResults[m.awaySource]?.winner || null })) },
    { id: 'sf',  label: 'Semis',    fixtures: SF_BRACKET.map(m => ({ ...m, home: koResults[m.homeSource]?.winner || null, away: koResults[m.awaySource]?.winner || null })) },
    { id: 'final', label: 'Final',  fixtures: [
        { ...FINAL, home: koResults[FINAL.homeSource]?.winner || null, away: koResults[FINAL.awaySource]?.winner || null },
        { ...THIRD_PLACE, home: koResults['sf_101']?.winner || null, away: koResults['sf_102']?.winner || null }
      ]
    },
  ];

  const phaseData = phases.find(p => p.id === phase);

  return (
    <div className="admin-knockout">
      <div className="admin-group-tabs">
        {phases.map(p => <button key={p.id} className={`group-tab ${phase === p.id ? 'active' : ''}`} onClick={() => setPhase(p.id)}>{p.label}</button>)}
      </div>
      <div className="ko-matches-grid">
        {phaseData.fixtures.map(fix => {
          const result = koResults[fix.id];
          const isDouble = doubleMatches.includes(fix.id);
          return (
            <div key={fix.id} className={`admin-ko-match ${isDouble ? 'is-double' : ''}`}>
              <div className="match-meta">
                <span className="match-date">M{fix.matchNum} · {formatDate(fix.date)}</span>
                <span className="match-venue">📍 {fix.venue}</span>
                {fix.thirdLabel && <span className="third-note">3° grupos: {fix.thirdLabel}</span>}
              </div>
              {fix.homeLabel && (
                <div className="admin-ko-sources">
                  <span className="source-label">{fix.homeLabel}</span>
                  <span className="vs-label">vs</span>
                  <span className="source-label">{fix.awayLabel}</span>
                </div>
              )}
              <div className="admin-ko-teams">
                {[fix.home, fix.away].map((team, i) => team && (
                  <button
                    key={i}
                    className={`ko-team ${result?.winner === team ? 'selected' : ''}`}
                    onClick={() => handleKoResult(fix.id, team)}
                  >
                    {FLAGS[team] || ''} {team}
                  </button>
                ))}
                {(!fix.home || !fix.away) && <span className="muted">Equipos por definir</span>}
              </div>
              {result?.winner && <div className="ko-winner-display">✓ Avanza: <strong>{FLAGS[result.winner]} {result.winner}</strong></div>}
              <button className={`toggle-double small ${isDouble ? 'active' : ''}`} onClick={() => handleToggleDouble(fix.id)}>
                {isDouble ? '×2 Activo' : 'Activar ×2'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADMIN USER PICKS EDITOR ─────────────────────────────────────────────────
function AdminUserEditor({ users, allMatches, onUserUpdated }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPicks, setUserPicks] = useState({});
  const [saving, setSaving] = useState('');
  const [activeGroup, setActiveGroup] = useState('A');

  async function loadUserPicks(user) {
    setSelectedUser(user);
    const { data: picks } = await supabase.from('picks').select('*').eq('user_id', user.user_id);
    const pm = {}; for (const p of (picks || [])) pm[p.match_id] = p;
    setUserPicks(pm);
  }

  async function handleSavePick(matchId, homeGoals, awayGoals) {
    if (!selectedUser) return;
    setSaving(matchId);
    await savePick(selectedUser.user_id, matchId, homeGoals, awayGoals);
    setUserPicks(prev => ({ ...prev, [matchId]: { match_id: matchId, home_goals: homeGoals, away_goals: awayGoals } }));
    setSaving('');
  }

  async function handleConfirm() {
    if (!selectedUser) return;
    if (!window.confirm(`¿Confirmar la quiniela de ${selectedUser.username}?`)) return;
    await confirmQuiniela(selectedUser.user_id);
    setSelectedUser(prev => ({ ...prev, confirmed: true }));
    onUserUpdated?.();
  }

  async function handleUnconfirm() {
    if (!selectedUser) return;
    if (!window.confirm(`¿Desconfirmar la quiniela de ${selectedUser.username}? Podrá editarla de nuevo.`)) return;
    await unconfirmQuiniela(selectedUser.user_id);
    setSelectedUser(prev => ({ ...prev, confirmed: false }));
    onUserUpdated?.();
  }

  if (!selectedUser) {
    return (
      <div className="admin-users">
        <h3>Selecciona un usuario para editar su quiniela</h3>
        <div className="user-list">
          {users.map(u => (
            <button key={u.user_id} className="user-edit-btn" onClick={() => loadUserPicks(u)}>
              <span>{u.username}</span>
              <span className={`user-status ${u.confirmed ? 'confirmed' : 'pending'}`}>{u.confirmed ? '✓ Confirmada' : '⏳ Pendiente'}</span>
              <span className="edit-arrow">Editar →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-editor">
      <div className="editor-header">
        <button className="btn-back" onClick={() => setSelectedUser(null)}>← Volver</button>
        <h3>Editando quiniela de: <strong>{selectedUser.username}</strong></h3>
        {!selectedUser.confirmed && (
          <button className="btn-confirm-admin" onClick={handleConfirm}>✓ Confirmar quiniela</button>
        )}
        {selectedUser.confirmed && (
          <button className="btn-unconfirm" onClick={handleUnconfirm}>Desconfirmar quiniela</button>
        )}
      </div>

      <div className="admin-group-tabs">
        {Object.keys(GROUPS).map(gId => (
          <button key={gId} className={`group-tab ${activeGroup === gId ? 'active' : ''}`} onClick={() => setActiveGroup(gId)}>{gId}</button>
        ))}
      </div>

      <div className="admin-matches-list">
        {allMatches.filter(m => m.group === activeGroup).map(match => {
          const pick = userPicks[match.id] || {};
          return (
            <div key={match.id} className="admin-match-row">
              <div className="match-meta"><span className="match-date">{formatDate(match.date)}</span><span className="match-venue">📍 {match.venue}</span></div>
              <span className="team-name">{FLAGS[match.home]} {match.home}</span>
              <div className="admin-score-area">
                <input type="number" min="0" max="20" className="admin-score-input"
                  value={pick.home_goals ?? ''}
                  onChange={e => setUserPicks(prev => ({ ...prev, [match.id]: { ...prev[match.id], match_id: match.id, home_goals: e.target.value === '' ? null : Number(e.target.value) } }))}
                />
                <span> - </span>
                <input type="number" min="0" max="20" className="admin-score-input"
                  value={pick.away_goals ?? ''}
                  onChange={e => setUserPicks(prev => ({ ...prev, [match.id]: { ...prev[match.id], match_id: match.id, away_goals: e.target.value === '' ? null : Number(e.target.value) } }))}
                />
                <button className="btn-save" disabled={saving === match.id} onClick={() => {
                  const p = userPicks[match.id] || {};
                  if (p.home_goals !== null && p.home_goals !== undefined && p.away_goals !== null && p.away_goals !== undefined) {
                    handleSavePick(match.id, p.home_goals, p.away_goals);
                  }
                }}>{saving === match.id ? '...' : '💾'}</button>
              </div>
              <span className="team-name">{FLAGS[match.away]} {match.away}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('results');
  const [results, setResults] = useState({});
  const [koResults, setKoResults] = useState({});
  const [doubleMatches, setDoubleMatches] = useState([]);
  const [bonusChallenges, setBonusChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState('');
  const [activeGroup, setActiveGroup] = useState('A');
  const allMatches = getAllGroupMatches();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [res, doubles, challenges, usersData] = await Promise.all([
      getAllResults(),
      getDoubleMatches(),
      getBonusChallenges(),
      getAllUsers(),
    ]);
    const resMap = {}; for (const r of res.results) resMap[r.match_id] = r;
    setResults(resMap);
    const koMap = {}; for (const r of res.koResults) koMap[r.match_id] = r;
    setKoResults(koMap);
    setDoubleMatches(doubles);
    setBonusChallenges(challenges);
    setUsers(usersData);
  }

  async function handleSaveResult(matchId, homeGoals, awayGoals) {
    setSaving(matchId);
    await saveResult(matchId, homeGoals, awayGoals, 'group');
    setResults(prev => ({ ...prev, [matchId]: { match_id: matchId, home_goals: homeGoals, away_goals: awayGoals } }));
    setSaving('');
  }

  async function handleToggleDouble(matchId) {
    const isCurrentlyDouble = doubleMatches.includes(matchId);
    await toggleDoubleMatch(matchId, !isCurrentlyDouble);
    setDoubleMatches(prev => isCurrentlyDouble ? prev.filter(id => id !== matchId) : [...prev, matchId]);
  }

  async function handleAddBonus() {
    const title = prompt('Título del reto bonus:'); if (!title) return;
    const desc = prompt('Descripción (opcional):');
    const points = parseInt(prompt('¿Cuántos puntos vale? (default 10):') || '10');
    const deadline = prompt('Fecha límite (YYYY-MM-DD, opcional):');
    const newChallenge = { id: crypto.randomUUID(), title, description: desc || null, points: isNaN(points) ? 10 : points, type: 'text', active: true, deadline: deadline ? new Date(deadline).toISOString() : null };
    await saveBonusChallenge(newChallenge);
    setBonusChallenges(prev => [...prev, newChallenge]);
  }

  async function handleResolveBonus(bonusId) {
    const answer = prompt('Ingresa la respuesta correcta:'); if (!answer) return;
    await saveBonusResult(bonusId, answer);
    setBonusChallenges(prev => prev.map(c => c.id === bonusId ? { ...c, resolved: true, correct_value: answer } : c));
  }

  async function handleToggleBonusActive(challenge) {
    await supabase.from('bonus_challenges').update({ active: !challenge.active }).eq('id', challenge.id);
    setBonusChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, active: !c.active } : c));
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>⚙ Panel de Administrador</h2>
        <p className="admin-warning">Los cambios se aplican en tiempo real para todos los usuarios.</p>
      </div>
      <div className="admin-tabs">
        {[
          { id: 'results',    label: '📊 Resultados Grupos' },
          { id: 'knockout',   label: '🏆 Bracket Eliminatorias' },
          { id: 'double',     label: '×2 Partidos Dobles' },
          { id: 'bonus',      label: '🎯 Bonus' },
          { id: 'users',      label: '👥 Editar Quinielas' },
        ].map(t => <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {tab === 'results' && (
        <div className="admin-results">
          <h3>Resultados reales — Fase de Grupos</h3>
          <div className="admin-group-tabs">
            {Object.keys(GROUPS).map(gId => <button key={gId} className={`group-tab ${activeGroup === gId ? 'active' : ''}`} onClick={() => setActiveGroup(gId)}>{gId}</button>)}
          </div>
          <div className="admin-matches-list">
            {allMatches.filter(m => m.group === activeGroup).map(match => {
              const result = results[match.id] || {};
              const isDouble = doubleMatches.includes(match.id) || match.isDouble;
              return (
                <div key={match.id} className={`admin-match-row ${isDouble ? 'is-double' : ''}`}>
                  <div className="match-meta"><span className="match-date">{formatDate(match.date)} · {match.time}</span><span className="match-venue">📍 {match.venue}</span></div>
                  <span className="team-name">{FLAGS[match.home]} {match.home}</span>
                  <div className="admin-score-area">
                    <input type="number" min="0" max="20" className="admin-score-input" value={result.home_goals ?? ''}
                      onChange={e => setResults(prev => ({ ...prev, [match.id]: { ...prev[match.id], match_id: match.id, home_goals: e.target.value === '' ? null : Number(e.target.value) } }))} placeholder="-" />
                    <span> - </span>
                    <input type="number" min="0" max="20" className="admin-score-input" value={result.away_goals ?? ''}
                      onChange={e => setResults(prev => ({ ...prev, [match.id]: { ...prev[match.id], match_id: match.id, away_goals: e.target.value === '' ? null : Number(e.target.value) } }))} placeholder="-" />
                    <button className="btn-save" disabled={saving === match.id} onClick={() => {
                      const r = results[match.id] || {};
                      if (r.home_goals !== null && r.away_goals !== null && r.home_goals !== undefined && r.away_goals !== undefined) handleSaveResult(match.id, r.home_goals, r.away_goals);
                    }}>{saving === match.id ? '...' : '💾'}</button>
                  </div>
                  <span className="team-name">{FLAGS[match.away]} {match.away}</span>
                  {isDouble && <span className="double-badge">×2</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'knockout' && (
        <div className="admin-results">
          <h3>Bracket real de Eliminatorias</h3>
          <p className="muted">Selecciona al ganador de cada partido conforme avance el torneo. Los equipos se llenan automáticamente con los resultados reales de grupos que ingreses.</p>
          <AdminKnockoutBracket koResults={koResults} setKoResults={setKoResults} doubleMatches={doubleMatches} handleToggleDouble={handleToggleDouble} realResults={Object.values(results)} />
        </div>
      )}

      {tab === 'double' && (
        <div className="admin-doubles">
          <h3>Partidos con puntos dobles</h3>
          <p className="muted">México, EUA y Canadá ya tienen ×2 por defecto. Puedes añadir ×2 a cualquier partido.</p>
          <div className="admin-group-tabs">
            {Object.keys(GROUPS).map(gId => <button key={gId} className={`group-tab ${activeGroup === gId ? 'active' : ''}`} onClick={() => setActiveGroup(gId)}>{gId}</button>)}
          </div>
          {allMatches.filter(m => m.group === activeGroup).map(match => {
            const isDouble = doubleMatches.includes(match.id) || match.isDouble;
            return (
              <div key={match.id} className="admin-double-row">
                <span>{FLAGS[match.home]} {match.home} vs {match.away} {FLAGS[match.away]}</span>
                <button className={`toggle-double ${isDouble ? 'active' : ''}`} onClick={() => handleToggleDouble(match.id)}>
                  {isDouble ? '×2 Activo — Quitar' : 'Activar ×2'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'bonus' && (
        <div className="admin-bonus">
          <div className="admin-bonus-header">
            <h3>Retos Bonus</h3>
            <button className="btn-primary" onClick={handleAddBonus}>+ Añadir reto</button>
          </div>
          {bonusChallenges.length === 0 && <p className="muted">No hay retos configurados.</p>}
          {bonusChallenges.map(c => (
            <div key={c.id} className={`admin-bonus-card ${c.resolved ? 'resolved' : ''} ${!c.active ? 'inactive' : ''}`}>
              <div className="admin-bonus-info">
                <strong>{c.title}</strong>
                {c.description && <p>{c.description}</p>}
                <span className="bonus-meta">{c.points} pts · {c.active ? 'Activo' : 'Inactivo'} · {c.resolved ? `Resuelto: "${c.correct_value}"` : 'Sin resolver'}</span>
              </div>
              <div className="admin-bonus-actions">
                {!c.resolved && <button className="btn-resolve" onClick={() => handleResolveBonus(c.id)}>Resolver</button>}
                <button className="btn-toggle" onClick={() => handleToggleBonusActive(c)}>{c.active ? 'Desactivar' : 'Activar'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && <AdminUserEditor users={users} allMatches={allMatches} onUserUpdated={loadData} />}
    </div>
  );
}
