import { useState, useEffect } from 'react';
import { GROUPS, FLAGS, getAllGroupMatches, HOST_TEAMS, R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL } from '../lib/worldcupData.js';
import { savePick, saveKnockoutPick, getUserPicks, getUserBonusPicks, saveBonusPick, confirmQuiniela, getUserMeta, getBonusChallenges, getAllResults } from '../lib/supabase.js';
import GroupStageSection from '../components/GroupStageSection.jsx';
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
  const [activePhase, setActivePhase] = useState('group');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('group'); // 'group' | 'knockout' | 'bonus'
  const allMatches = getAllGroupMatches();

  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session]);

  async function loadData() {
    const [userPicksData, userBonusData, challenges, realResults] = await Promise.all([
      getUserPicks(session.user.id),
      getUserBonusPicks(session.user.id),
      getBonusChallenges(),
      getAllResults(),
    ]);
    const meta = await getUserMeta(session.user.id);
    setConfirmed(meta?.confirmed || false);

    const picksMap = {};
    for (const p of userPicksData.picks) picksMap[p.match_id] = p;
    setPicks(picksMap);

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

  async function handlePickChange(matchId, homeGoals, awayGoals) {
    if (confirmed) return;
    const newPicks = { ...picks, [matchId]: { match_id: matchId, home_goals: homeGoals, away_goals: awayGoals } };
    setPicks(newPicks);
    setSaving(true);
    try {
      await savePick(session.user.id, matchId, homeGoals, awayGoals);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleKoPick(matchId, winner) {
    if (confirmed) return;
    const newKo = { ...koPicks, [matchId]: { match_id: matchId, winner } };
    setKoPicks(newKo);
    try {
      await saveKnockoutPick(session.user.id, matchId, winner);
    } catch (e) { console.error(e); }
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
    const filledPicks = Object.values(picks).filter(p => p.home_goals !== null && p.away_goals !== null).length;
    if (filledPicks < totalMatches) {
      alert(`Faltan ${totalMatches - filledPicks} partidos de fase de grupos por llenar.`);
      return;
    }
    if (!window.confirm('¿Confirmar tu quiniela? Una vez confirmada no podrás editarla (solo el admin puede hacerlo).')) return;
    await confirmQuiniela(session.user.id);
    setConfirmed(true);
  }

  // Compute group standings from user's own picks (for knockout bracket generation)
  function getGroupStandingsFromPicks(groupId) {
    const group = GROUPS[groupId];
    const groupMatches = allMatches.filter(m => m.group === groupId);
    const table = {};
    for (const t of group.teams) table[t] = { team: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 };

    for (const match of groupMatches) {
      const pick = picks[match.id];
      if (!pick || pick.home_goals === null) continue;
      const rh = Number(pick.home_goals), ra = Number(pick.away_goals);
      table[match.home].played++; table[match.away].played++;
      table[match.home].gf += rh; table[match.home].ga += ra;
      table[match.away].gf += ra; table[match.away].ga += rh;
      table[match.home].gd = table[match.home].gf - table[match.home].ga;
      table[match.away].gd = table[match.away].gf - table[match.away].ga;
      if (rh > ra) { table[match.home].pts += 3; }
      else if (rh < ra) { table[match.away].pts += 3; }
      else { table[match.home].pts++; table[match.away].pts++; }
    }
    return Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  const groupProgress = Object.keys(GROUPS).reduce((acc, gId) => {
    const groupMatches = allMatches.filter(m => m.group === gId);
    const filled = groupMatches.filter(m => picks[m.id]?.home_goals !== null && picks[m.id]?.away_goals !== null).length;
    acc[gId] = { filled, total: groupMatches.length };
    return acc;
  }, {});

  return (
    <div className="quiniela-page">
      <div className="page-header">
        <h2>Mi Quiniela</h2>
        {confirmed ? (
          <span className="confirmed-badge">✓ Quiniela confirmada</span>
        ) : (
          <div className="header-actions">
            {saving && <span className="saving-indicator">Guardando...</span>}
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
          getGroupStandingsFromPicks={getGroupStandingsFromPicks}
        />
      )}

      {tab === 'knockout' && (
        <KnockoutSection
          koPicks={koPicks}
          picks={picks}
          confirmed={confirmed}
          onKoPick={handleKoPick}
          getGroupStandingsFromPicks={getGroupStandingsFromPicks}
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
