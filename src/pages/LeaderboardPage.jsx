import { useState, useEffect } from 'react';
import { getAllUserPicks, getAllResults, getAllUsers, getBonusChallenges, getDoubleMatches, supabase } from '../lib/supabase.js';
import { getAllGroupMatches } from '../lib/worldcupData.js';
import { computeLeaderboard } from '../lib/scoring.js';

export default function LeaderboardPage({ session, userMeta }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadLeaderboard();

    const channel = supabase
      .channel('leaderboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => loadLeaderboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knockout_results' }, () => loadLeaderboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bonus_challenges' }, () => loadLeaderboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users_meta' }, () => loadLeaderboard())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const [usersData, picksData, resultsData, challenges, doubles] = await Promise.all([
        getAllUsers(),
        getAllUserPicks(),
        getAllResults(),
        getBonusChallenges(),
        getDoubleMatches(),
      ]);

      const { data: bonusPicksData } = await supabase.from('bonus_picks').select('*');

      const groupMatches = getAllGroupMatches();
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
      });

      setLeaderboard(board);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const medals = ['🥇', '🥈', '🥉'];
  const hasResults = leaderboard.some(e => e.totalPts > 0);

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h2>Tabla General</h2>
        <div className="update-info">
          {loading ? (
            <span className="updating">Actualizando...</span>
          ) : (
            <span className="last-update">
              Actualizado: {lastUpdate?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="points-legend">
        <span className="legend-item exact">⭐ Exacto = 3 pts</span>
        <span className="legend-item winner">✓ Ganador = 1 pt</span>
        <span className="legend-item double">×2 Anfitriones</span>
        <span className="legend-item tiebreak">Desempate: exactos → goles</span>
      </div>

      {!hasResults && leaderboard.length > 0 && (
        <div className="leaderboard-notice">
          ⏳ El torneo aún no ha comenzado — los puntos se actualizarán cuando el admin ingrese resultados reales.
        </div>
      )}

      {leaderboard.length === 0 && !loading ? (
        <div className="leaderboard-empty">
          <p>Aún no hay participantes registrados.</p>
        </div>
      ) : (
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Participante</th>
                <th title="Puntos totales">Pts</th>
                <th title="Resultados exactos (3 pts)">⭐</th>
                <th title="Ganadores acertados">✓</th>
                <th title="Goles acertados">⚽</th>
                <th title="Puntos de retos bonus">🎯</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => {
                const isMe = entry.userId === session?.user?.id;
                return (
                  <tr key={entry.userId} className={`lb-row ${isMe ? 'lb-me' : ''} ${i < 3 && hasResults ? 'lb-podium' : ''}`}>
                    <td className="lb-pos">
                      {i < 3 && hasResults ? medals[i] : <span className="pos-number">{i + 1}</span>}
                    </td>
                    <td className="lb-name">
                      {entry.username}
                      {isMe && <span className="you-badge">Tú</span>}
                      {entry.confirmed
                        ? <span className="confirmed-small">✓</span>
                        : <span className="unconfirmed-badge">Sin confirmar</span>
                      }
                    </td>
                    <td className="lb-pts">{entry.totalPts}</td>
                    <td className="lb-exact">{entry.exactHits}</td>
                    <td className="lb-winners">{entry.correctWinners}</td>
                    <td className="lb-goals">{entry.totalGoalsHit}</td>
                    <td className="lb-bonus">{entry.bonusPts > 0 ? `+${entry.bonusPts}` : '-'}</td>
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
          <li>Mayor número de resultados exactos (3 pts)</li>
          <li>Mayor número de goles acertados correctamente</li>
        </ol>
      </div>
    </div>
  );
}
