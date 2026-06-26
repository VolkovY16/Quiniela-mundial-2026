import { useState, useEffect, useRef } from 'react';
import { GROUPS, getAllGroupMatches } from '../lib/worldcupData.js';
import { savePick, saveKnockoutPick, getUserPicks, getUserBonusPicks, saveBonusPick, confirmQuiniela, getUserMeta, getBonusChallenges, getAllResults, getGroupStandings } from '../lib/supabase.js';
import GroupStageSection from '../components/GroupStageSection.jsx';
import GroupTablesSection from '../components/GroupTablesSection.jsx';
import KnockoutSection from '../components/KnockoutSection.jsx';
import BonusSection from '../components/BonusSection.jsx';

export default function QuinielasPage({ session, userMeta }) {
  const [picks, setPicks] = useState({});
  const [koPicks, setKoPicks] = useState({});
  const [bonusPicks, setBonusPicks] = useState({});
  const [bonusChallenges, setBonusChallenges] = useState([]);
  const [results, setResults] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [activeGroup, setActiveGroup] = useState('A');
  const [saveStatus, setSaveStatus] = useState({}); // matchId -> 'saving' | 'saved' | 'error'
  const [groupStandings, setGroupStandings] = useState([]);
  const [tab, setTab] = useState('group');
  const allMatches = getAllGroupMatches();

  // Always-current snapshot of picks, used to avoid stale-closure races
  // when the user fills in home/away goals quickly back to back.
  const picksRef = useRef({});

  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session?.user?.id]);

  async function loadData() {
    const [userPicksData, userBonusData, challenges, realResults, standings] = await Promise.all([
      getUserPicks(session.user.id),
      getUserBonusPicks(session.user.id),
      getBonusChallenges(),
      getAllResults(),
      getGroupStandings(),
    ]);
    setGroupStandings(standings);
    const meta = await getUserMeta(session.user.id);
    setConfirmed(meta?.confirmed || false);

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
  }

  // field is 'home_goals' or 'away_goals'
  async function handlePickChange(matchId, field, value) {
    if (confirmed) return;

    const current = picksRef.current[matchId] || { match_id: matchId, home_goals: null, away_goals: null };
    const updated = { ...current, match_id: matchId, [field]: value };

    // Update ref and UI synchronously so the next rapid edit sees the latest value
    picksRef.current = { ...picksRef.current, [matchId]: updated };
    setPicks(prev => ({ ...prev, [matchId]: updated }));

    // Only save to DB when BOTH goals are filled in — avoids saving partial picks
    const homeOk = updated.home_goals !== null && updated.home_goals !== undefined && updated.home_goals !== '';
    const awayOk = updated.away_goals !== null && updated.away_goals !== undefined && updated.away_goals !== '';
    if (!homeOk || !awayOk) return;

    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }));
    try {
      await savePick(session.user.id, matchId, updated.home_goals, updated.away_goals);
      setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
    } catch (e) {
      console.error('Error saving pick:', e);
      setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }));
    }
  }

  async function handleKoPick(matchId, winner) {
    if (confirmed) return;
    const newKo = { ...koPicks, [matchId]: { match_id: matchId, winner } };
    setKoPicks(newKo);
    setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }));
    try {
      await saveKnockoutPick(session.user.id, matchId, winner);
      setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
    } catch (e) {
      console.error('Error saving knockout pick:', e);
      setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }));
    }
  }

  async function handleBonusPick(bonusId, value) {
    if (confirmed) return;
    const newBonus = { ...bonusPicks, [bonusId]: { bonus_id: bonusId, value } };
    setBonusPicks(newBonus);
    try {
      await saveBonusPick(session.user.id, bonusId, value);
    } catch (e) { console.error(e); }
  }

  async function handleConfirm() {
    const totalMatches = allMatches.length;
    const filledPicks = Object.values(picksRef.current).filter(p => p.home_goals !== null && p.home_goals !== undefined && p.away_goals !== null && p.away_goals !== undefined).length;
    if (filledPicks < totalMatches) {
      alert(`Faltan ${totalMatches - filledPicks} partidos de fase de grupos por llenar.`);
      return;
    }
    if (!window.confirm('¿Confirmar tu quiniela? Una vez confirmada no podrás editarla (solo el admin puede hacerlo).')) return;
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

  // Any save currently in flight or failed?
  const anySaving = Object.values(saveStatus).some(s => s === 'saving');
  const anyError = Object.values(saveStatus).some(s => s === 'error');

  return (
    <div className="quiniela-page">
      <div className="page-header">
        <h2>Mi Quiniela</h2>
        {confirmed ? (
          <span className="confirmed-badge">✓ Quiniela confirmada</span>
        ) : (
          <div className="header-actions">
            {anySaving && <span className="saving-indicator">Guardando...</span>}
            {!anySaving && anyError && <span className="saving-indicator error">⚠ Error al guardar, revisa tu conexión</span>}
            {!anySaving && !anyError && Object.keys(saveStatus).length > 0 && <span className="saving-indicator ok">✓ Guardado</span>}
            <button className="btn-confirm" onClick={handleConfirm}>Confirmar quiniela</button>
          </div>
        )}
      </div>

      {confirmed && (
        <div className="confirmed-notice">
          Tu quiniela está confirmada y guardada. Solo puedes visualizarla.
        </div>
      )}

      <div className="phase-tabs">
        <button className={tab === 'group' ? 'phase-tab active' : 'phase-tab'} onClick={() => setTab('group')}>
          Fase de Grupos
        </button>
        <button className={tab === 'knockout' ? 'phase-tab active' : 'phase-tab'} onClick={() => setTab('knockout')}>
          Eliminatorias
        </button>
        <button className={tab === 'bonus' ? 'phase-tab active' : 'phase-tab'} onClick={() => setTab('bonus')}>
          Retos Bonus
        </button>
        <button className={tab === 'tables' ? 'phase-tab active' : 'phase-tab'} onClick={() => setTab('tables')}>
          Tablas
        </button>
      </div>

      {tab === 'group' && (
        <GroupStageSection
          picks={picks}
          results={results}
          confirmed={confirmed}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          groupProgress={groupProgress}
          allMatches={allMatches}
          onPickChange={handlePickChange}
          saveStatus={saveStatus}
        />
      )}

      {tab === 'knockout' && (
        <KnockoutSection
          koPicks={koPicks}
          picks={picks}
          confirmed={confirmed}
          onKoPick={handleKoPick}
        />
      )}

      {tab === 'tables' && (
        <GroupTablesSection
          picks={picks}
          allMatches={allMatches}
          groupStandings={groupStandings}
        />
      )}

      {tab === 'bonus' && (
        <BonusSection
          bonusChallenges={bonusChallenges}
          bonusPicks={bonusPicks}
          confirmed={confirmed}
          onBonusPick={handleBonusPick}
        />
      )}
    </div>
  );
}
