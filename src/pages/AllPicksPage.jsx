import { useState, useEffect } from 'react';
import { getAllUsers, getAllUserPicks, getAllResults, getKoDetailResults, getAllKoDetailPicks } from '../lib/supabase.js';
import { getAllGroupMatches, FLAGS, formatDate, FINAL, R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, THIRD_PLACE } from '../lib/worldcupData.js';
import { scoreGroupMatch } from '../lib/scoring.js';

const KO_PHASES = [
  { id: 'r32',   label: 'R32 · Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16',   label: 'R16 · Octavos',       matches: R16_BRACKET },
  { id: 'qf',    label: 'QF · Cuartos',         matches: QF_BRACKET },
  { id: 'sf',    label: 'SF · Semis',           matches: SF_BRACKET },
  { id: 'final', label: 'Final',                matches: [FINAL, THIRD_PLACE] },
];

export default function AllPicksPage({ session, userMeta }) {
  const [tab, setTab] = useState('groups');
  const [koPhase, setKoPhase] = useState('r32');
  const [users, setUsers] = useState([]);
  const [hiddenUsers, setHiddenUsers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hiddenUsers') || '[]'); } catch { return []; }
  });
  const [picksByUser, setPicksByUser] = useState({});
  const [koPicksByUser, setKoPicksByUser] = useState({});
  const [results, setResults] = useState({});
  const [koResults, setKoResults] = useState({});
  const [loading, setLoading] = useState(true);
  const isAdmin = userMeta?.is_admin === true;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [usersData, picksData, resultsData, koResultsData, koPicksData] = await Promise.all([
        getAllUsers(),
        getAllUserPicks(),
        getAllResults(),
        getKoDetailResults(),
        getAllKoDetailPicks(),
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
      for (const p of koPicksData) {
        if (!koByUser[p.user_id]) koByUser[p.user_id] = {};
        koByUser[p.user_id][p.match_id] = p;
      }
      setKoPicksByUser(koByUser);

      const resMap = {};
      for (const r of resultsData.results) resMap[r.match_id] = r;
      setResults(resMap);

      const koResMap = {};
      for (const r of koResultsData) koResMap[r.match_id] = r;
      setKoResults(koResMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function toggleHide(userId) {
    setHiddenUsers(prev => {
      const next = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      localStorage.setItem('hiddenUsers', JSON.stringify(next));
      return next;
    });
  }

  const visibleUsers = users.filter(u => !hiddenUsers.includes(u.user_id));

  // ─── GROUP STAGE ───────────────────────────────────────────────────────────
  const allMatches = getAllGroupMatches();
  const sortedMatches = [...allMatches].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : (a.time || '').localeCompare(b.time || '')
  );
  const matchesByDate = {};
  for (const m of sortedMatches) {
    if (!matchesByDate[m.date]) matchesByDate[m.date] = [];
    matchesByDate[m.date].push(m);
  }

  function isComplete(pick) {
    return pick && pick.home_goals !== null && pick.home_goals !== undefined && pick.home_goals !== '' &&
      pick.away_goals !== null && pick.away_goals !== undefined && pick.away_goals !== '';
  }

  function cellClass(pick, result) {
    if (!isComplete(pick)) return 'pp-empty';
    if (!result || result.home_goals === null || result.home_goals === undefined) return 'pp-pending';
    const scored = scoreGroupMatch(pick, result, false);
    if (!scored) return 'pp-pending';
    if (scored.exactHit) return 'pp-exact';
    if (scored.correctWinner) return 'pp-correct';
    return 'pp-wrong';
  }

  function cellText(pick) {
    if (!pick) return '–';
    const h = pick.home_goals, a = pick.away_goals;
    if ((h === null || h === undefined || h === '') && (a === null || a === undefined || a === '')) return '–';
    return `${h ?? '?'}-${a ?? '?'}`;
  }

  // ─── KNOCKOUT ──────────────────────────────────────────────────────────────
  function koPickClass(pick, result) {
    if (!pick?.winner) return 'pp-empty';
    if (!result?.winner) return 'pp-pending';
    if (pick.winner !== result.winner) return 'pp-wrong';
    // Check exact score
    const exact = pick.home_goals === result.home_goals &&
                  pick.away_goals === result.away_goals &&
                  !!pick.penalties === !!result.penalties;
    return exact ? 'pp-exact' : 'pp-correct';
  }

  function koPickText(pick, result) {
    if (!pick?.winner) return '–';
    const score = pick.home_goals !== null && pick.home_goals !== undefined
      ? `${pick.home_goals}-${pick.away_goals}${pick.penalties ? 'p' : ''}`
      : '';
    const flag = FLAGS[pick.winner] || '';
    return score ? `${flag} ${score}` : `${flag}`;
  }

  const koPhaseData = KO_PHASES.find(p => p.id === koPhase);

  if (loading) return (
    <div className="allpicks-page">
      <div className="page-header"><h2>Pronósticos de todos</h2></div>
      <p className="muted">Cargando...</p>
    </div>
  );

  return (
    <div className="allpicks-page">
      <div className="page-header">
        <h2>Pronósticos de todos</h2>
      </div>

      {/* Admin: hide users */}
      {isAdmin && (
        <div className="pp-hide-section">
          <span className="pp-hide-label">👁 Ocultar de tabla:</span>
          {users.map(u => (
            <button key={u.user_id}
              className={`pp-hide-btn ${hiddenUsers.includes(u.user_id) ? 'hidden' : ''}`}
              onClick={() => toggleHide(u.user_id)}>
              {hiddenUsers.includes(u.user_id) ? '＋' : '✕'} {u.username}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="pp-tabs">
        <button className={`pp-tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>Fase de Grupos</button>
        <button className={`pp-tab ${tab === 'knockout' ? 'active' : ''}`} onClick={() => setTab('knockout')}>Eliminatorias</button>
      </div>

      {/* ── GROUPS TAB ── */}
      {tab === 'groups' && (
        <>
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
                      {visibleUsers.map(u => <th key={u.user_id} className="pp-user-col">{u.username}</th>)}
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
                          <td className="pp-result-cell">{hasResult ? `${result.home_goals}-${result.away_goals}` : '–'}</td>
                          {visibleUsers.map(u => {
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
            <h3>🏆 Campeón elegido</h3>
            <div className="pp-champions-grid">
              {visibleUsers.map(u => {
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
        </>
      )}

      {/* ── KNOCKOUT TAB ── */}
      {tab === 'knockout' && (
        <>
          <div className="pp-legend">
            <span className="pp-legend-item pp-exact">Exacto (marcador+penales)</span>
            <span className="pp-legend-item pp-correct">Ganador correcto</span>
            <span className="pp-legend-item pp-wrong">Fallido</span>
            <span className="pp-legend-item pp-pending">Sin resultado aún</span>
            <span className="pp-legend-item pp-empty">Sin pronóstico</span>
          </div>

          <div className="ko-phase-tabs" style={{marginBottom:'0.8rem'}}>
            {KO_PHASES.map(p => (
              <button key={p.id} className={`ko-phase-tab ${koPhase === p.id ? 'active' : ''}`} onClick={() => setKoPhase(p.id)}>
                <span className="phase-short">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="pp-scroll-wrap">
            <div className="pp-day-block">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th className="pp-match-col">Partido</th>
                    <th className="pp-result-col">Real</th>
                    {visibleUsers.map(u => <th key={u.user_id} className="pp-user-col">{u.username}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {koPhaseData.matches.map(match => {
                    const result = koResults[match.id];
                    const homeTeam = result?.home_team;
                    const awayTeam = result?.away_team;
                    const hasResult = result?.winner;
                    return (
                      <tr key={match.id}>
                        <td className="pp-match-cell">
                          <span className="pp-match-time">M{match.matchNum} · {formatDate(match.date)}</span>
                          <span className="pp-match-teams">
                            {homeTeam
                              ? <>{FLAGS[homeTeam] || ''} {homeTeam} <span className="pp-vs">vs</span> {FLAGS[awayTeam] || ''} {awayTeam}</>
                              : <span className="muted">Por definir</span>
                            }
                          </span>
                        </td>
                        <td className="pp-result-cell">
                          {hasResult
                            ? <>{FLAGS[result.winner] || ''} {result.home_goals !== null ? `${result.home_goals}-${result.away_goals}${result.penalties ? 'p' : ''}` : ''}</>
                            : '–'
                          }
                        </td>
                        {visibleUsers.map(u => {
                          const pick = koPicksByUser[u.user_id]?.[match.id];
                          return (
                            <td key={u.user_id} className={`pp-pick-cell ${koPickClass(pick, result)}`}>
                              {koPickText(pick, result)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
