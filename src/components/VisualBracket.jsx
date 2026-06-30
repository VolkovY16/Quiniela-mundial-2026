import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, FLAGS } from '../lib/worldcupData.js';

// Build bracket data from picks or real results
function buildBracket(picks, realResults, useUserPicks) {
  const resolved = {};

  // R32: always from real results (admin sets teams)
  for (const m of R32_BRACKET) {
    const real = realResults[m.id] || {};
    const pick = picks[m.id] || {};
    resolved[m.id] = {
      home: real.home_team || null,
      away: real.away_team || null,
      winner: useUserPicks ? pick.winner : real.winner,
      real_winner: real.winner,
      pick_winner: pick.winner,
    };
  }

  // Later rounds
  const laterPhases = [
    R16_BRACKET,
    QF_BRACKET,
    SF_BRACKET,
    [FINAL],
  ];

  for (const phase of laterPhases) {
    for (const m of phase) {
      if (useUserPicks) {
        // User bracket: teams are user's winners from previous round
        const home = m.homeSource ? (picks[m.homeSource]?.winner || null) : null;
        const away = m.awaySource ? (picks[m.awaySource]?.winner || null) : null;
        resolved[m.id] = { home, away, winner: picks[m.id]?.winner || null };
      } else {
        // Real bracket: teams are real winners
        const home = m.homeSource ? (realResults[m.homeSource]?.winner || null) : null;
        const away = m.awaySource ? (realResults[m.awaySource]?.winner || null) : null;
        resolved[m.id] = { home, away, winner: realResults[m.id]?.winner || null };
      }
    }
  }

  return resolved;
}

function TeamSlot({ team, isWinner, isDark }) {
  if (!team) return (
    <div className={`vb-slot vb-slot-empty ${isDark ? 'vb-slot-dark' : ''}`}>
      <span className="vb-tbd">TBD</span>
    </div>
  );
  return (
    <div className={`vb-slot ${isWinner ? 'vb-slot-winner' : ''} ${isDark ? 'vb-slot-dark' : ''}`}>
      <span className="vb-flag">{FLAGS[team] || '🏳️'}</span>
      <span className="vb-team">{team}</span>
    </div>
  );
}

function MatchBox({ matchNum, home, away, winner }) {
  return (
    <div className="vb-match">
      <div className="vb-match-num">M{matchNum}</div>
      <TeamSlot team={home} isWinner={winner === home} />
      <TeamSlot team={away} isWinner={winner === away} />
    </div>
  );
}

// Left side R32 matches (M73-M80), Right side (M81-M88)
const LEFT_R32  = ['r32_73','r32_74','r32_75','r32_76','r32_77','r32_78','r32_79','r32_80'];
const RIGHT_R32 = ['r32_81','r32_82','r32_83','r32_84','r32_85','r32_86','r32_87','r32_88'];

// R16 pairings (which two R32 matches feed each R16)
const LEFT_R16  = ['r16_89','r16_90','r16_91','r16_92'];
const RIGHT_R16 = ['r16_93','r16_94','r16_95','r16_96'];

// QF
const LEFT_QF  = ['qf_97','qf_99'];
const RIGHT_QF = ['qf_98','qf_100'];

// SF
const LEFT_SF  = ['sf_101'];
const RIGHT_SF = ['sf_102'];

export default function VisualBracket({ picks, realResults, mode }) {
  const useUserPicks = mode === 'user';
  const bracket = buildBracket(picks, realResults, useUserPicks);

  function M(id) {
    const d = bracket[id] || {};
    const match = [...R32_BRACKET, ...R16_BRACKET, ...QF_BRACKET, ...SF_BRACKET, FINAL].find(m => m.id === id);
    return { ...d, matchNum: match?.matchNum };
  }

  const final = M('match_104');

  return (
    <div className="vb-container">
      <div className="vb-scroll">
        <div className="vb-bracket">

          {/* LEFT SIDE */}
          <div className="vb-side vb-left">

            {/* R32 LEFT */}
            <div className="vb-round vb-r32">
              <div className="vb-round-label">R32</div>
              <div className="vb-round-matches">
                {LEFT_R32.map(id => { const d = M(id); return <MatchBox key={id} matchNum={d.matchNum} home={d.home} away={d.away} winner={d.winner} />; })}
              </div>
            </div>

            {/* R16 LEFT */}
            <div className="vb-round vb-r16">
              <div className="vb-round-label">R16</div>
              <div className="vb-round-matches">
                {LEFT_R16.map(id => { const d = M(id); return <MatchBox key={id} matchNum={d.matchNum} home={d.home} away={d.away} winner={d.winner} />; })}
              </div>
            </div>

            {/* QF LEFT */}
            <div className="vb-round vb-qf">
              <div className="vb-round-label">QF</div>
              <div className="vb-round-matches">
                {LEFT_QF.map(id => { const d = M(id); return <MatchBox key={id} matchNum={d.matchNum} home={d.home} away={d.away} winner={d.winner} />; })}
              </div>
            </div>

            {/* SF LEFT */}
            <div className="vb-round vb-sf">
              <div className="vb-round-label">SF</div>
              <div className="vb-round-matches">
                {LEFT_SF.map(id => { const d = M(id); return <MatchBox key={id} matchNum={d.matchNum} home={d.home} away={d.away} winner={d.winner} />; })}
              </div>
            </div>
          </div>

          {/* CENTER - FINAL */}
          <div className="vb-center">
            <div className="vb-trophy">🏆</div>
            <div className="vb-round-label">Final</div>
            <MatchBox matchNum={final.matchNum} home={final.home} away={final.away} winner={final.winner} />
            {final.winner && (
              <div className="vb-champion">
                <div className="vb-champion-flag">{FLAGS[final.winner] || ''}</div>
                <div className="vb-champion-name">{final.winner}</div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="vb-side vb-right">

            {/* SF RIGHT */}
            <div className="vb-round vb-sf">
              <div className="vb-round-label">SF</div>
              <div className="vb-round-matches">
                {RIGHT_SF.map(id => { const d = M(id); return <MatchBox key={id} matchNum={d.matchNum} home={d.home} away={d.away} winner={d.winner} />; })}
              </div>
            </div>

            {/* QF RIGHT */}
            <div className="vb-round vb-qf">
              <div className="vb-round-label">QF</div>
              <div className="vb-round-matches">
                {RIGHT_QF.map(id => { const d = M(id); return <MatchBox key={id} matchNum={d.matchNum} home={d.home} away={d.away} winner={d.winner} />; })}
              </div>
            </div>

            {/* R16 RIGHT */}
            <div className="vb-round vb-r16">
              <div className="vb-round-label">R16</div>
              <div className="vb-round-matches">
                {RIGHT_R16.map(id => { const d = M(id); return <MatchBox key={id} matchNum={d.matchNum} home={d.home} away={d.away} winner={d.winner} />; })}
              </div>
            </div>

            {/* R32 RIGHT */}
            <div className="vb-round vb-r32">
              <div className="vb-round-label">R32</div>
              <div className="vb-round-matches">
                {RIGHT_R32.map(id => { const d = M(id); return <MatchBox key={id} matchNum={d.matchNum} home={d.home} away={d.away} winner={d.winner} />; })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
