import { useState, useEffect } from 'react';
import { getAllGroupMatches, GROUPS, FLAGS, HOST_TEAMS } from '../lib/worldcupData.js';
import { saveResult, saveKnockoutResult, getAllResults, toggleDoubleMatch, getDoubleMatches, getBonusChallenges, saveBonusChallenge, saveBonusResult, getAllUsers, getUserPicks, savePick, supabase } from '../lib/supabase.js';

export default function AdminPage() {
  const [tab, setTab] = useState('results');
  const [results, setResults] = useState({});
  const [koResults, setKoResults] = useState({});
  const [doubleMatches, setDoubleMatches] = useState([]);
  const [bonusChallenges, setBonusChallenges] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState('');
  const allMatches = getAllGroupMatches();
  const [activeGroup, setActiveGroup] = useState('A');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [res, doubles, challenges, usersData] = await Promise.all([
      getAllResults(),
      getDoubleMatches(),
      getBonusChallenges(),
      getAllUsers(),
    ]);
    const resMap = {};
    for (const r of res.results) resMap[r.match_id] = r;
    setResults(resMap);
    const koMap = {};
    for (const r of res.koResults) koMap[r.match_id] = r;
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
    const title = prompt('Título del reto bonus:');
    if (!title) return;
    const desc = prompt('Descripción (opcional):');
    const points = parseInt(prompt('¿Cuántos puntos vale? (default 10):') || '10');
    const deadline = prompt('Fecha límite (YYYY-MM-DD, opcional):');
    const newChallenge = {
      id: crypto.randomUUID(),
      title,
      description: desc || null,
      points: isNaN(points) ? 10 : points,
      type: 'text',
      active: true,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    };
    await saveBonusChallenge(newChallenge);
    setBonusChallenges(prev => [...prev, newChallenge]);
  }

  async function handleResolveBonus(bonusId) {
    const answer = prompt('Ingresa la respuesta correcta:');
    if (!answer) return;
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
        <p className="admin-warning">Solo tú puedes ver esta sección. Los cambios se aplican en tiempo real para todos.</p>
      </div>

      <div className="admin-tabs">
        {[
          { id: 'results', label: '📊 Resultados' },
          { id: 'double', label: '×2 Partidos Dobles' },
          { id: 'bonus', label: '🎯 Bonus Challenges' },
          { id: 'users', label: '👥 Usuarios' },
        ].map(t => (
          <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'results' && (
        <div className="admin-results">
          <h3>Ingresar resultados reales de fase de grupos</h3>
          <div className="admin-group-tabs">
            {Object.keys(GROUPS).map(gId => (
              <button key={gId} className={`group-tab ${activeGroup === gId ? 'active' : ''}`} onClick={() => setActiveGroup(gId)}>
                {gId}
              </button>
            ))}
          </div>

          <div className="admin-matches-list">
            {allMatches.filter(m => m.group === activeGroup).map(match => {
              const result = results[match.id] || {};
              const isDouble = doubleMatches.includes(match.id) || match.isDouble;
              return (
                <div key={match.id} className={`admin-match-row ${isDouble ? 'is-double' : ''}`}>
                  <span className="team-name">{FLAGS[match.home]} {match.home}</span>
                  <div className="admin-score-area">
                    <input
                      type="number" min="0" max="20"
                      className="admin-score-input"
                      value={result.home_goals ?? ''}
                      onChange={e => setResults(prev => ({ ...prev, [match.id]: { ...prev[match.id], match_id: match.id, home_goals: e.target.value === '' ? null : Number(e.target.value) } }))}
                      placeholder="-"
                    />
                    <span> - </span>
                    <input
                      type="number" min="0" max="20"
                      className="admin-score-input"
                      value={result.away_goals ?? ''}
                      onChange={e => setResults(prev => ({ ...prev, [match.id]: { ...prev[match.id], match_id: match.id, away_goals: e.target.value === '' ? null : Number(e.target.value) } }))}
                      placeholder="-"
                    />
                    <button
                      className="btn-save"
                      disabled={saving === match.id}
                      onClick={() => {
                        const r = results[match.id] || {};
                        if (r.home_goals !== null && r.away_goals !== null && r.home_goals !== undefined && r.away_goals !== undefined) {
                          handleSaveResult(match.id, r.home_goals, r.away_goals);
                        }
                      }}
                    >
                      {saving === match.id ? '...' : '💾'}
                    </button>
                  </div>
                  <span className="team-name">{FLAGS[match.away]} {match.away}</span>
                  {isDouble && <span className="double-badge">×2</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'double' && (
        <div className="admin-doubles">
          <h3>Gestionar partidos con puntos dobles</h3>
          <p className="muted">Los partidos de México, Canadá y EUA ya tienen ×2 por defecto. Puedes añadir o quitar el doble a cualquier partido aquí.</p>
          <div className="admin-group-tabs">
            {Object.keys(GROUPS).map(gId => (
              <button key={gId} className={`group-tab ${activeGroup === gId ? 'active' : ''}`} onClick={() => setActiveGroup(gId)}>
                {gId}
              </button>
            ))}
          </div>
          {allMatches.filter(m => m.group === activeGroup).map(match => {
            const isDouble = doubleMatches.includes(match.id) || match.isDouble;
            return (
              <div key={match.id} className="admin-double-row">
                <span>{FLAGS[match.home]} {match.home} vs {match.away} {FLAGS[match.away]}</span>
                <button
                  className={`toggle-double ${isDouble ? 'active' : ''}`}
                  onClick={() => handleToggleDouble(match.id)}
                >
                  {isDouble ? '×2 Activo — Click para quitar' : 'Activar ×2'}
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
                {!c.resolved && (
                  <button className="btn-resolve" onClick={() => handleResolveBonus(c.id)}>Resolver</button>
                )}
                <button className="btn-toggle" onClick={() => handleToggleBonusActive(c)}>
                  {c.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-users">
          <h3>Participantes ({users.length})</h3>
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Confirmó</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id}>
                  <td>{u.username}</td>
                  <td>
                    <span className={`user-status ${u.confirmed ? 'confirmed' : 'pending'}`}>
                      {u.confirmed ? '✓ Confirmada' : 'Pendiente'}
                    </span>
                  </td>
                  <td>{u.confirmed_at ? new Date(u.confirmed_at).toLocaleDateString('es-MX') : '—'}</td>
                  <td>{u.is_admin ? '⚙ Admin' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted" style={{marginTop: '1rem'}}>
            Para editar picks de un usuario específico, accede a Supabase → Table Editor → picks.
            En una versión futura se añadirá edición directa aquí.
          </p>
        </div>
      )}
    </div>
  );
}
