import { useState, useEffect } from 'react';
import { getAllUsers, getAllResults, getKoDetailResults, getAllKoDetailPicks, getAppSetting, setAppSetting } from '../lib/supabase.js';
import { getAllGroupMatches, FLAGS, formatDate, FINAL, R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, THIRD_PLACE } from '../lib/worldcupData.js';
import { scoreGroupMatch } from '../lib/scoring.js';
import { scoreKoPick } from '../lib/bracketFlow.js';
import VisualBracket from '../components/VisualBracket.jsx';

const KO_PHASES = [
  { id: 'r32',   label: 'R32 · Dieciseisavos', matches: R32_BRACKET },
  { id: 'r16',   label: 'R16 · Octavos',       matches: R16_BRACKET },
  { id: 'qf',    label: 'QF · Cuartos',         matches: QF_BRACKET },
  { id: 'sf',    label: 'SF · Semis',           matches: SF_BRACKET },
  { id: 'final', label: 'Final',                matches: [FINAL, THIRD_PLACE] },
];

export default function AllPicksPage({ session, userMeta }) {
  const [mainTab, setMainTab] = useState('knockout'); // eliminatorias first
  const [koSubTab, setKoSubTab] = useState('table');  // table | bracket
  const [koPhase, setKoPhase] = useState('r32');
  const [bracketMode, setBracketMode] = useState('user'); // user | real
  const [selectedUser, setSelectedUser] = useState(null); // for user bracket view

  const [users, setUsers] = useState([]);
  const [hiddenUsers, setHiddenUsers] = useState([]);
  const [picksByUser, setPicksByUser] = useState({});
  const [koPicksByUser, setKoPicksByUser] = useState({});
  const [results, setResults] = useState({});
  const [koResults, setKoResults] = useState({});
  const [loading, setLoading] = useState(true);

  const isAdmin = userMeta?.is_admin === true;

  useEffect(() => { load(); loadHidden(); }, []);

  async function loadHidden() {
    const val = await getAppSetting('hidden_users');
    if (Array.isArray(val)) setHiddenUsers(val);
  }

  async function load() {
    setLoading(true);
    try {
      const [usersData, resultsData, koResultsData, koPicksData] = await Promise.all([
        getAllUsers(),
        getAllResults(),
        getKoDetailResults(),
        getAllKoDetailPicks(),
      ]);

      // Also load group picks for group tab
      const { getAllUserPicks } = await import('../lib/supabase.js');
      const picksData = await getAllUserPicks();

      setUsers([...usersData].sort((a, b) => (a.username || '').localeCompare(b.username || '')));

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

  async function toggleHide(userId) {
    const next = hiddenUsers.includes(userId)
      ? hiddenUsers.filter(id => id !== userId)
      : [...hiddenUsers, userId];
    setHiddenUsers(next);
    await setAppSetting('hidden_users', next);
  }

  const visibleUsers = users.filter(u => !hiddenUsers.includes(u.user_id));

  // Group picks helpers
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
    return pick &&
      pick.home_goals !== null && pick.home_goals !== undefined &&
      pick.away_goals !== null && pick.away_goals !== undefined;
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
    if ((h === null || h === undefined) && (a === null || a === undefined)) return '–';
    return `${h ?? '?'}-${a ?? '?'}`;
  }

  function koPickClass(pick, result) {
    if (!pick?.winner) return 'pp-empty';
    if (!result?.winner) return 'pp-pending';
    const { status } = scoreKoPick(pick, result);
    if (status === 'exact') return 'pp-exact';
    if (status === 'correct') return 'pp-correct';
    return 'pp-wrong';
  }

  function koPickText(pick) {
    if (!pick?.winner) return '–';
    const flag = FLAGS[pick.winner] || '';
    const score = pick.home_goals !== null && pick.home_goals !== undefined
      ? `${pick.home_goals}-${pick.away_goals}${pick.penalties ? 'p' : ''}` : '';
    return score ? `${flag} ${score}` : flag;
  }

  const koPhaseData = KO_PHASES.find(p => p.id === koPhase);

  // For user bracket — use selected user or current user
  const bracketUserId = selectedUser || session?.user?.id;
  const bracketUserPicks = koPicksByUser[bracketUserId] || {};

  if (loading) return (
    <div className="allpicks-page">
      <div className="page-header"><h2>Pronósticos de todos</h2></div>
      <p className="muted" style={{padding:'2rem'}}>Cargando...</p>
    </div>
  );

  return (
    <div className="allpicks-page">
      <div className="page-header"><h2>Pronósticos de todos</h2></div>

      {isAdmin && (
        <div className="pp-hide-section">
          <span className="pp-hide-label">👁 Ocultar:</span>
          {users.map(u => (
            <button key={u.user_id} className={`pp-hide-btn ${hiddenUsers.includes(u.user_id) ? 'hidden' : ''}`} onClick={() => toggleHide(u.user_id)}>
              {hiddenUsers.includes(u.user_id) ? '＋' : '✕'} {u.username}
            </button>
          ))}
        </div>
      )}

      {/* Main tabs — Eliminatorias first */}
      <div className="pp-tabs">
        <button className={`pp-tab ${mainTab === 'knockout' ? 'active' : ''}`} onClick={() => setMainTab('knockout')}>🏆 Eliminatorias</button>
        <button className={`pp-tab ${mainTab === 'groups' ? 'active' : ''}`} onClick={() => setMainTab('groups')}>Fase de Grupos</button>
      </div>

      {/* ── ELIMINATORIAS ── */}
      {mainTab === 'knockout' && (
        <>
          <div className="pp-tabs" style={{marginBottom:'0.5rem'}}>
            <button className={`pp-tab ${koSubTab === 'table' ? 'active' : ''}`} onClick={() => setKoSubTab('table')}>📊 Tabla</button>
            <button className={`pp-tab ${koSubTab === 'bracket' ? 'active' : ''}`} onClick={() => setKoSubTab('bracket')}>🔢 Bracket visual</button>
          </div>

          {koSubTab === 'table' && (
            <>
              <div className="pp-legend">
                <span className="pp-legend-item pp-exact">Exacto (3pts)</span>
                <span className="pp-legend-item pp-correct">Ganador ✓ (1pt)</span>
                <span className="pp-legend-item pp-wrong">Fallido</span>
                <span className="pp-legend-item pp-pending">Sin resultado</span>
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
                        return (
                          <tr key={match.id}>
                            <td className="pp-match-cell">
                              <span className="pp-match-time">M{match.matchNum} · {formatDate(match.date)}</span>
                              <span className="pp-match-teams">
                                {result?.home_team
                                  ? <>{FLAGS[result.home_team] || ''} {result.home_team} <span className="pp-vs">vs</span> {FLAGS[result.away_team] || ''} {result.away_team}</>
                                  : <span className="muted">Por definir</span>}
                              </span>
                            </td>
                            <td className="pp-result-cell">
                              {result?.winner
                                ? <>{FLAGS[result.winner] || ''} {result.home_goals !== null ? `${result.home_goals}-${result.away_goals}${result.penalties ? 'p' : ''}` : ''}</>
                                : '–'}
                            </td>
                            {visibleUsers.map(u => {
                              const pick = koPicksByUser[u.user_id]?.[match.id];
                              return (
                                <td key={u.user_id} className={`pp-pick-cell ${koPickClass(pick, result)}`}>
                                  {koPickText(pick)}
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

          {koSubTab === 'bracket' && (
            <div>
              <div className="pp-tabs" style={{marginBottom:'0.5rem'}}>
                <button className={`pp-tab ${bracketMode === 'user' ? 'active' : ''}`} onClick={() => setBracketMode('user')}>👤 Bracket por usuario</button>
                <button className={`pp-tab ${bracketMode === 'real' ? 'active' : ''}`} onClick={() => setBracketMode('real')}>🌎 Bracket Real</button>
              </div>

              {bracketMode === 'user' && (
                <div style={{marginBottom:'0.6rem'}}>
                  <label className="admin-ko-field-label">Ver bracket de:</label>
                  <select
                    className="team-text-input" style={{maxWidth:'200px', marginTop:'0.3rem'}}
                    value={selectedUser || session?.user?.id || ''}
                    onChange={e => setSelectedUser(e.target.value)}
                  >
                    {users.map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}
                  </select>
                </div>
              )}

              <VisualBracket
                picks={bracketMode === 'user' ? bracketUserPicks : {}}
                realResults={koResults}
                mode={bracketMode}
              />
            </div>
          )}
        </>
      )}

      {/* ── GRUPOS ── */}
      {mainTab === 'groups' && (
        <>
          <div className="pp-legend">
            <span className="pp-legend-item pp-exact">Exacto</span>
            <span className="pp-legend-item pp-correct">Ganador ✓</span>
            <span className="pp-legend-item pp-wrong">Fallido</span>
            <span className="pp-legend-item pp-pending">Sin resultado</span>
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
                              <td key={u.user_id} className={`pp-pick-cell ${cellClass(pick, result)}`}>{cellText(pick)}</td>
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
        </>
      )}
    </div>
  );
}
