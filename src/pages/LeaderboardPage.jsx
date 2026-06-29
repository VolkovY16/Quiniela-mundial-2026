import { useState, useEffect } from 'react';
import { getAllUserPicks, getAllResults, getAllUsers, getBonusChallenges, getDoubleMatches, getGroupStandings, getAppSetting, setAppSetting, getKoDetailResults, getAllKoDetailPicks, supabase } from '../lib/supabase.js';
import { getAllGroupMatches, GROUPS } from '../lib/worldcupData.js';
import { computeLeaderboard } from '../lib/scoring.js';
import { computeKoBracketLeaderboard } from '../lib/koScoring.js';

export default function LeaderboardPage({ session, userMeta }) {
  const [tab, setTab] = useState('groups');
  const [leaderboard, setLeaderboard] = useState([]);
  const [koLeaderboard, setKoLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hiddenUsers, setHiddenUsers] = useState([]);
  const isAdmin = userMeta?.is_admin === true;

  useEffect(() => {
    loadAll();
    loadHidden();

    const channel = supabase
      .channel('leaderboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knockout_results' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knockout_results_detail' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bonus_challenges' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users_meta' }, () => loadAll())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadHidden() {
    const val = await getAppSetting('hidden_users');
    if (Array.isArray(val)) setHiddenUsers(val);
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [usersData, picksData, resultsData, challenges, doubles, standings, koResultsData, koPicksData] = await Promise.all([
        getAllUsers(),
        getAllUserPicks(),
        getAllResults(),
        getBonusChallenges(),
        getDoubleMatches(),
        getGroupStandings(),
        getKoDetailResults(),
        getAllKoDetailPicks(),
      ]);

      const { data: bonusPicksData } = await supabase.from('bonus_picks').select('*');
      const groupMatches = getAllGroupMatches();

      // Group stage leaderboard
      const board = computeLeaderboard({
        users: usersData,
        allPicks: picksData.picks,
        allKoPicks: picksData.koPicks,
        results: resultsData.results,
        koResults: resultsData.koResults,
        bonusChallenges: challenges,
        bonusPicks: bonusPicksData || [],
        doubleMatches: doubles,
        groupMatches,
        groupStandings: standings,
        groups: GROUPS,
      });
      setLeaderboard(board);

      // Knockout bracket leaderboard
      const koBoard = computeKoBracketLeaderboard({
        users: usersData,
        koDetailPicks: koPicksData,
        koDetailResults: koResultsData,
      });
      setKoLeaderboard(koBoard);

      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleHide(userId) {
    const next = hiddenUsers.includes(userId)
      ? hiddenUsers.filter(id => id !== userId)
      : [...hiddenUsers, userId];
    setHiddenUsers(next);
    await setAppSetting('hidden_users', next);
  }

  const medals = ['🥇', '🥈', '🥉'];

  const visibleBoard = leaderboard.filter(e => !hiddenUsers.includes(e.userId));
  const visibleKoBoard = koLeaderboard.filter(e => !hiddenUsers.includes(e.userId));
  const hasGroupResults = visibleBoard.some(e => e.totalPts > 0);
  const hasKoResults = visibleKoBoard.some(e => e.totalPts > 0);

  const allUsers = leaderboard; // for hide controls

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h2>Tabla General</h2>
        <div className="update-info">
          {loading
            ? <span className="updating">Actualizando...</span>
            : <span className="last-update">Actualizado: {lastUpdate?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
          }
        </div>
      </div>

      {/* Admin hide controls */}
      {isAdmin && allUsers.length > 0 && (
        <div className="pp-hide-section">
          <span className="pp-hide-label">👁 Ocultar:</span>
          {allUsers.map(e => (
            <button key={e.userId}
              className={`pp-hide-btn ${hiddenUsers.includes(e.userId) ? 'hidden' : ''}`}
              onClick={() => toggleHide(e.userId)}>
              {hiddenUsers.includes(e.userId) ? '＋' : '✕'} {e.username}
            </button>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="pp-tabs">
        <button className={`pp-tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>
          Fase de Grupos
        </button>
        <button className={`pp-tab ${tab === 'knockout' ? 'active' : ''}`} onClick={() => setTab('knockout')}>
          🏆 Eliminatorias
        </button>
      </div>

      {/* ── GROUPS TAB ── */}
      {tab === 'groups' && (
        <>
          <div className="points-legend">
            <span className="legend-item">⭐ Exacto = 3 pts</span>
            <span className="legend-item">✓ Ganador = 1 pt</span>
            <span className="legend-item">×2 Anfitriones</span>
            <span className="legend-item">E = Tablas de grupos</span>
          </div>

          {!hasGroupResults && visibleBoard.length > 0 && (
            <div className="leaderboard-notice">
              ⏳ El torneo aún no ha comenzado — los puntos se actualizarán con los resultados reales.
            </div>
          )}

          {visibleBoard.length === 0 && !loading ? (
            <div className="leaderboard-empty"><p>Aún no hay participantes.</p></div>
          ) : (
            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Participante</th>
                    <th title="Puntos totales">Pts</th>
                    <th title="Resultados exactos">⭐</th>
                    <th title="Ganadores acertados">✓</th>
                    <th title="Goles acertados">⚽</th>
                    <th title="Bonus">🎯</th>
                    <th title="Tablas de grupos">E</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBoard.map((entry, i) => {
                    const isMe = entry.userId === session?.user?.id;
                    return (
                      <tr key={entry.userId} className={`lb-row ${isMe ? 'lb-me' : ''} ${i < 3 && hasGroupResults ? 'lb-podium' : ''}`}>
                        <td className="lb-pos">
                          {i < 3 && hasGroupResults ? medals[i] : <span className="pos-number">{i + 1}</span>}
                        </td>
                        <td className="lb-name">
                          {entry.username}
                          {isMe && <span className="you-badge">Tú</span>}
                          {entry.confirmed
                            ? <span className="confirmed-small">✓</span>
                            : <span className="unconfirmed-badge">Sin confirmar</span>}
                        </td>
                        <td className="lb-pts">{entry.totalPts}</td>
                        <td className="lb-exact">{entry.exactHits}</td>
                        <td className="lb-winners">{entry.correctWinners}</td>
                        <td className="lb-goals">{entry.totalGoalsHit}</td>
                        <td className="lb-bonus">{entry.bonusPts > 0 ? `+${entry.bonusPts}` : '-'}</td>
                        <td className="lb-standing">{entry.standingPts > 0 ? `+${entry.standingPts}` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="tiebreak-info">
            <h4>Criterios de desempate</h4>
            <ol>
              <li>Mayor número de resultados exactos</li>
              <li>Mayor número de goles acertados</li>
            </ol>
          </div>
        </>
      )}

      {/* ── KNOCKOUT TAB ── */}
      {tab === 'knockout' && (
        <>
          <div className="points-legend">
            <span className="legend-item">⭐ Marcador exacto o penales = 3 pts</span>
            <span className="legend-item">✓ Ganador correcto = 1 pt</span>
          </div>

          {!hasKoResults && visibleKoBoard.length > 0 && (
            <div className="leaderboard-notice">
              ⏳ Los puntos se actualizarán conforme el admin ingrese resultados reales de eliminatorias.
            </div>
          )}

          {visibleKoBoard.length === 0 && !loading ? (
            <div className="leaderboard-empty"><p>Aún no hay participantes.</p></div>
          ) : (
            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Participante</th>
                    <th title="Puntos totales">Pts</th>
                    <th title="Marcadores exactos (3 pts)">⭐</th>
                    <th title="Ganadores acertados (1 pt)">✓</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleKoBoard.map((entry, i) => {
                    const isMe = entry.userId === session?.user?.id;
                    return (
                      <tr key={entry.userId} className={`lb-row ${isMe ? 'lb-me' : ''} ${i < 3 && hasKoResults ? 'lb-podium' : ''}`}>
                        <td className="lb-pos">
                          {i < 3 && hasKoResults ? medals[i] : <span className="pos-number">{i + 1}</span>}
                        </td>
                        <td className="lb-name">
                          {entry.username}
                          {isMe && <span className="you-badge">Tú</span>}
                        </td>
                        <td className="lb-pts">{entry.totalPts}</td>
                        <td className="lb-exact">{entry.exactHits}</td>
                        <td className="lb-winners">{entry.correctWinners}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="tiebreak-info">
            <h4>Criterios de desempate</h4>
            <ol>
              <li>Mayor número de marcadores exactos (3 pts)</li>
              <li>Mayor número de ganadores acertados</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
