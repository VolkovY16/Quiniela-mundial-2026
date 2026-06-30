import { useState, useEffect, useRef, useCallback } from 'react';
import { GROUPS, getAllGroupMatches } from '../lib/worldcupData.js';
import {
  savePick, saveKnockoutPick, getUserPicks, getUserBonusPicks, saveBonusPick,
  confirmQuiniela, getUserMeta, getBonusChallenges, getAllResults,
  getGroupStandings, getUserKoDetailPicks, getKoDetailResults
} from '../lib/supabase.js';
import GroupStageSection from '../components/GroupStageSection.jsx';
import KnockoutSection from '../components/KnockoutSection.jsx';
import KnockoutBracketSection from '../components/KnockoutBracketSection.jsx';
import BonusSection from '../components/BonusSection.jsx';
import GroupTablesSection from '../components/GroupTablesSection.jsx';

export default function QuinielasPage({ session, userMeta }) {
  const [picks, setPicks] = useState({});
  const [koPicks, setKoPicks] = useState({});
  const [koBracketPicks, setKoBracketPicks] = useState({});
  const [koBracketResults, setKoBracketResults] = useState({});
  const [bonusPicks, setBonusPicks] = useState({});
  const [bonusChallenges, setBonusChallenges] = useState([]);
  const [results, setResults] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [activeGroup, setActiveGroup] = useState('A');
  const [saveStatus, setSaveStatus] = useState({});
  const [tab, setTab] = useState('group');
  const [groupStandings, setGroupStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const allMatches = getAllGroupMatches();
  const picksRef = useRef({});

  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session?.user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [userPicksData, userBonusData, challenges, realResults, standings, koDetailPicksData, koDetailResultsData] = await Promise.all([
        getUserPicks(session.user.id),
        getUserBonusPicks(session.user.id),
        getBonusChallenges(),
        getAllResults(),
        getGroupStandings(),
        getUserKoDetailPicks(session.user.id),
        getKoDetailResults(),
      ]);
      const meta = await getUserMeta(session.user.id);
      setConfirmed(meta?.confirmed || false);
      setGroupStandings(standings);

      const picksMap = {};
      for (const p of userPicksData.picks) picksMap[p.match_id] = p;
      setPicks(picksMap);
      picksRef.current = picksMap;

      const koPicksMap = {};
      for (const p of userPicksData.koPicks) koPicksMap[p.match_id] = p;
      setKoPicks(koPicksMap);

      const bonusMap = {};
      for (const p of userBonusData) bonusMap[p.bonus_id] = p;
      setBonusPicks(bonusMap);
      setBonusChallenges(challenges);

      const resultsMap = {};
      for (const r of realResults.results) resultsMap[r.match_id] = r;
      setResults(resultsMap);

      const koBracketPicksMap = {};
      for (const p of koDetailPicksData) koBracketPicksMap[p.match_id] = p;
      setKoBracketPicks(koBracketPicksMap);

      const koBracketResultsMap = {};
      for (const r of koDetailResultsData) koBracketResultsMap[r.match_id] = r;
      setKoBracketResults(koBracketResultsMap);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickChange(matchId, field, value) {
    if (confirmed) return;
    const current = picksRef.current[matchId] || { match_id: matchId, home_goals: null, away_goals: null };
    const updated = { ...current, match_id: matchId, [field]: value };
    picksRef.current = { ...picksRef.current, [matchId]: updated };
    setPicks(prev => ({ ...prev, [matchId]: updated }));

    const homeOk = updated.home_goals !== null && updated.home_goals !== undefined;
    const awayOk = updated.away_goals !== null && updated.away_goals !== undefined;
    if (!homeOk || !awayOk) return;

    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }));
    let retries = 0;
    const attempt = async () => {
      try {
        await savePick(session.user.id, matchId, updated.home_goals, updated.away_goals);
        setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
      } catch (e) {
        if (retries < 3) {
          retries++;
          setTimeout(attempt, 800 * retries);
        } else {
          setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }));
        }
      }
    };
    attempt();
  }

  async function handleKoPick(matchId, winner) {
    if (confirmed) return;
    const newKo = { ...koPicks, [matchId]: { match_id: matchId, winner } };
    setKoPicks(newKo);
    try { await saveKnockoutPick(session.user.id, matchId, winner); } catch (e) { console.error(e); }
  }

  async function handleBonusPick(bonusId, value) {
    if (confirmed) return;
    setBonusPicks(prev => ({ ...prev, [bonusId]: { bonus_id: bonusId, value } }));
    try { await saveBonusPick(session.user.id, bonusId, value); } catch (e) { console.error(e); }
  }

  async function handleConfirm() {
    const totalMatches = allMatches.length;
    const filled = Object.values(picksRef.current).filter(p =>
      p.home_goals !== null && p.home_goals !== undefined &&
      p.away_goals !== null && p.away_goals !== undefined
    ).length;
    if (filled < totalMatches) {
      alert(`Faltan ${totalMatches - filled} partidos de grupos por llenar.`);
      return;
    }
    if (!window.confirm('¿Confirmar tu quiniela? Solo el admin podrá editarla después.')) return;
    await confirmQuiniela(session.user.id);
    setConfirmed(true);
  }

  const groupProgress = Object.keys(GROUPS).reduce((acc, gId) => {
    const groupMatches = allMatches.filter(m => m.group === gId);
    const filled = groupMatches.filter(m => {
      const p = picks[m.id];
      return p?.home_goals !== null && p?.home_goals !== undefined && p?.away_goals !== null && p?.away_goals !== undefined;
    }).length;
    acc[gId] = { filled, total: groupMatches.length };
    return acc;
  }, {});

  const anySaving = Object.values(saveStatus).some(s => s === 'saving');
  const anyError = Object.values(saveStatus).some(s => s === 'error');

  const TABS = [
    { id: 'group',   label: 'Fase de Grupos', visible: true },
    { id: 'bracket', label: '🏆 Bracket',     visible: true },
    { id: 'knockout', label: 'Eliminatorias', visible: false },
    { id: 'tables',  label: 'Tablas',         visible: false },
    { id: 'bonus',   label: 'Retos Bonus',    visible: false },
  ];

  if (loading) {
    return (
      <div className="quiniela-page">
        <div className="loading-screen" style={{height:'300px'}}>
          <div className="loading-ball">⚽</div>
          <p>Cargando tu quiniela...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiniela-page">
      <div className="page-header">
        <h2>Mi Quiniela</h2>
        {confirmed ? (
          <span className="confirmed-badge">✓ Quiniela confirmada</span>
        ) : (
          <div className="header-actions">
            {anySaving && <span className="saving-indicator">Guardando...</span>}
            {!anySaving && anyError && <span className="saving-indicator error">⚠ Error al guardar</span>}
            {!anySaving && !anyError && Object.keys(saveStatus).length > 0 && <span className="saving-indicator ok">✓ Guardado</span>}
            <button className="btn-confirm" onClick={handleConfirm}>Confirmar quiniela</button>
          </div>
        )}
      </div>

      {confirmed && (
        <div className="confirmed-notice">Tu quiniela está confirmada. Solo puedes visualizarla.</div>
      )}

      <div className="phase-tabs">
        {TABS.filter(t => t.visible).map(t => (
          <button key={t.id} className={tab === t.id ? 'phase-tab active' : 'phase-tab'} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'group' && (
        <GroupStageSection
          picks={picks} results={results} confirmed={confirmed}
          activeGroup={activeGroup} setActiveGroup={setActiveGroup}
          groupProgress={groupProgress} allMatches={allMatches}
          onPickChange={handlePickChange} saveStatus={saveStatus}
        />
      )}

      {tab === 'bracket' && (
        <KnockoutBracketSection
          session={session}
          userPicks={koBracketPicks}
          setUserPicks={setKoBracketPicks}
          realResults={koBracketResults}
        />
      )}

      {/* Hidden tabs — data still works, just not shown in nav */}
      {tab === 'knockout' && (
        <KnockoutSection koPicks={koPicks} picks={picks} confirmed={false} onKoPick={handleKoPick} />
      )}
      {tab === 'tables' && (
        <GroupTablesSection picks={picks} allMatches={allMatches} groupStandings={groupStandings} />
      )}
      {tab === 'bonus' && (
        <BonusSection bonusChallenges={bonusChallenges} bonusPicks={bonusPicks} confirmed={confirmed} onBonusPick={handleBonusPick} />
      )}
    </div>
  );
}
