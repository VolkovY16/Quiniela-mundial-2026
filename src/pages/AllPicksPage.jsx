import { useState, useEffect } from 'react';
import { getAllUsers, getAllUserPicks, getAllResults } from '../lib/supabase.js';
import { getAllGroupMatches, FLAGS, formatDate, FINAL } from '../lib/worldcupData.js';
import { scoreGroupMatch } from '../lib/scoring.js';

export default function AllPicksPage() {
  const [users, setUsers] = useState([]);
  const [picksByUser, setPicksByUser] = useState({});
  const [koPicksByUser, setKoPicksByUser] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [usersData, picksData, resultsData] = await Promise.all([
        getAllUsers(),
        getAllUserPicks(),
        getAllResults(),
      ]);

      const sortedUsers = [...usersData].sort((a, b) => (a.username || '').localeCompare(b.username || ''));
      setUsers(sortedUsers);

      const byUser = {};
      for (const p of picksData.picks) {
        if (!byUser[p.user_id]) byUser[p.user_id] = {};
        byUser[p.user_id][p.match_id] = p;
      }
      setPicksByUser(byUser);

      const koByUser = {};
      for (const p of picksData.koPicks) {
        if (!koByUser[p.user_id]) koByUser[p.user_id] = {};
        koByUser[p.user_id][p.match_id] = p;
      }
      setKoPicksByUser(koByUser);

      const resMap = {};
      for (const r of resultsData.results) resMap[r.match_id] = r;
      setResults(resMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const allMatches = getAllGroupMatches();
  // Sort matches by date then time (match-day order)
  const sortedMatches = [...allMatches].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  });

  // Group matches by date
  const matchesByDate = {};
  for (const m of sortedMatches) {
    if (!matchesByDate[m.date]) matchesByDate[m.date] = [];
    matchesByDate[m.date].push(m);
  }

  function cellClass(pick, result) {
    if (!pick || pick.home_goals === null || pick.home_goals === undefined) return 'pp-empty';
    if (!result || result.home_goals === null || result.home_goals === undefined) return 'pp-pending';
    const scored = scoreGroupMatch(pick, result, false);
    if (!scored) return 'pp-pending';
    if (scored.exactHit) return 'pp-exact';
    if (scored.correctWinner) return 'pp-correct';
    return 'pp-wrong';
  }

  function cellText(pick) {
    if (!pick || pick.home_goals === null || pick.home_goals === undefined) return '–';
    return `${pick.home_goals}-${pick.away_goals}`;
  }

  if (loading) {
    return (
      <div className="allpicks-page">
        <div className="page-header"><h2>Pronósticos de todos</h2></div>
        <p className="muted">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="allpicks-page">
      <div className="page-header">
        <h2>Pronósticos de todos</h2>
      </div>

      <div className="pp-legend">
        <span className="pp-legend-item pp-exact">Resultado exacto</span>
        <span className="pp-legend-item pp-correct">Ganador correcto</span>
        <span className="pp-legend-item pp-wrong">Fallido</span>
        <span className="pp-legend-item pp-pending">Sin resultado aún</span>
        <span className="pp-legend-item pp-empty">Sin pronóstico</span>
      </div>

      <div className="pp-scroll-wrap">
        {Object.entries(matchesByDate).map(([date, matches]) => (
          <div key={date} className="pp-day-block">
            <h3 className="pp-day-title">{formatDate(date)}</h3>
            <table className="pp-table">
              <thead>
                <tr>
                  <th className="pp-match-col">Partido</th>
                  <th className="pp-result-col">Real</th>
                  {users.map(u => <th key={u.user_id} className="pp-user-col">{u.username}</th>)}
                </tr>
              </thead>
              <tbody>
                {matches.map(match => {
                  const result = results[match.id];
                  const hasResult = result && result.home_goals !== null && result.home_goals !== undefined;
                  return (
                    <tr key={match.id}>
                      <td className="pp-match-cell">
                        <span className="pp-match-time">{match.time}</span>
                        <span className="pp-match-teams">
                          {FLAGS[match.home] || ''} {match.home} <span className="pp-vs">vs</span> {match.away} {FLAGS[match.away] || ''}
                        </span>
                      </td>
                      <td className="pp-result-cell">
                        {hasResult ? `${result.home_goals}-${result.away_goals}` : '–'}
                      </td>
                      {users.map(u => {
                        const pick = picksByUser[u.user_id]?.[match.id];
                        return (
                          <td key={u.user_id} className={`pp-pick-cell ${cellClass(pick, result)}`}>
                            {cellText(pick)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="pp-champions-block">
        <h3>🏆 Campeón elegido por cada persona</h3>
        <div className="pp-champions-grid">
          {users.map(u => {
            const champion = koPicksByUser[u.user_id]?.[FINAL.id]?.winner;
            return (
              <div key={u.user_id} className="pp-champion-card">
                <span className="pp-champion-user">{u.username}</span>
                <span className="pp-champion-pick">
                  {champion ? <>{FLAGS[champion] || ''} {champion}</> : <span className="muted">Sin definir</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
