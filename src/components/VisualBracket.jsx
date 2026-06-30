import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL, THIRD_PLACE, FLAGS } from '../lib/worldcupData.js';

function buildBracket(picks, realResults, mode) {
  const isUser = mode === 'user';
  const b = {};

  for (const m of R32_BRACKET) {
    const real = realResults[m.id] || {};
    const pick = picks[m.id] || {};
    b[m.id] = {
      home: real.home_team || null,
      away: real.away_team || null,
      winner: isUser ? (pick.winner || null) : (real.winner || null),
    };
  }

  const phases = [R16_BRACKET, QF_BRACKET, SF_BRACKET];
  for (const phase of phases) {
    for (const m of phase) {
      if (isUser) {
        b[m.id] = {
          home: m.homeSource ? (picks[m.homeSource]?.winner || null) : null,
          away: m.awaySource ? (picks[m.awaySource]?.winner || null) : null,
          winner: picks[m.id]?.winner || null,
        };
      } else {
        b[m.id] = {
          home: m.homeSource ? (realResults[m.homeSource]?.winner || null) : null,
          away: m.awaySource ? (realResults[m.awaySource]?.winner || null) : null,
          winner: realResults[m.id]?.winner || null,
        };
      }
    }
  }

  // Final
  if (isUser) {
    b[FINAL.id] = {
      home: picks[FINAL.homeSource]?.winner || null,
      away: picks[FINAL.awaySource]?.winner || null,
      winner: picks[FINAL.id]?.winner || null,
    };
    // Third place — losers of semifinals
    const sf1 = b['sf_101'] || {};
    const sf2 = b['sf_102'] || {};
    const sf1pick = picks['sf_101'] || {};
    const sf2pick = picks['sf_102'] || {};
    const sf1loser = sf1pick.winner ? (sf1pick.winner === sf1.home ? sf1.away : sf1.home) : null;
    const sf2loser = sf2pick.winner ? (sf2pick.winner === sf2.home ? sf2.away : sf2.home) : null;
    b[THIRD_PLACE.id] = {
      home: sf1loser,
      away: sf2loser,
      winner: picks[THIRD_PLACE.id]?.winner || null,
    };
  } else {
    b[FINAL.id] = {
      home: realResults[FINAL.homeSource]?.winner || null,
      away: realResults[FINAL.awaySource]?.winner || null,
      winner: realResults[FINAL.id]?.winner || null,
    };
    const sf1 = realResults['sf_101'] || {};
    const sf2 = realResults['sf_102'] || {};
    const sf1loser = sf1.winner ? (sf1.winner === sf1.home_team ? sf1.away_team : sf1.home_team) : null;
    const sf2loser = sf2.winner ? (sf2.winner === sf2.home_team ? sf2.away_team : sf2.home_team) : null;
    b[THIRD_PLACE.id] = {
      home: sf1loser || realResults[THIRD_PLACE.id]?.home_team || null,
      away: sf2loser || realResults[THIRD_PLACE.id]?.away_team || null,
      winner: realResults[THIRD_PLACE.id]?.winner || null,
    };
  }
  return b;
}

function Team({ team, isWinner }) {
  if (!team) return (
    <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 6px',
      borderTop:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.2)',fontSize:'11px',fontStyle:'italic'}}>
      TBD
    </div>
  );
  return (
    <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 6px',
      borderTop:'1px solid rgba(255,255,255,0.07)',
      background: isWinner ? 'rgba(13,110,63,0.6)' : 'transparent',
      fontSize:'11px', fontWeight:'600', color: isWinner ? '#fff' : 'rgba(255,255,255,0.8)',
    }}>
      <span style={{fontSize:'13px',flexShrink:0}}>{FLAGS[team] || '🏳️'}</span>
      <span style={{maxWidth:'72px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{team}</span>
    </div>
  );
}

function Match({ id, matchNum, bracket }) {
  const d = bracket[id] || {};
  return (
    <div style={{background:'rgba(255,255,255,0.08)',borderRadius:'7px',overflow:'hidden',
      border:'1px solid rgba(255,255,255,0.12)',width:'122px',flexShrink:0}}>
      <div style={{fontSize:'9px',color:'rgba(255,255,255,0.3)',padding:'3px 6px 0',fontWeight:'700'}}>M{matchNum}</div>
      <Team team={d.home} isWinner={!!d.winner && d.winner === d.home} />
      <Team team={d.away} isWinner={!!d.winner && d.winner === d.away} />
    </div>
  );
}

function Col({ label, gap, ids, allMatches, bracket }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
      <div style={{fontSize:'10px',fontWeight:'700',color:'rgba(255,255,255,0.45)',letterSpacing:'0.08em',marginBottom:'2px'}}>{label}</div>
      <div style={{display:'flex',flexDirection:'column',gap: gap || '4px'}}>
        {ids.map(id => {
          const m = allMatches.find(x => x.id === id);
          return <Match key={id} id={id} matchNum={m?.matchNum} bracket={bracket} />;
        })}
      </div>
    </div>
  );
}

const ALL_MATCHES = [...R32_BRACKET, ...R16_BRACKET, ...QF_BRACKET, ...SF_BRACKET, FINAL, THIRD_PLACE];

export default function VisualBracket({ picks, realResults, mode }) {
  const bracket = buildBracket(picks || {}, realResults || {}, mode);
  const champion = bracket['match_104']?.winner;
  const thirdWinner = bracket['match_103']?.winner;

  return (
    <div style={{background:'#0a3520',borderRadius:'12px',padding:'1rem',overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
      <div style={{display:'flex',alignItems:'center',gap:'6px',minWidth:'880px'}}>

        {/* LEFT */}
        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
          <Col label="R32" gap="4px" ids={['r32_73','r32_74','r32_75','r32_76','r32_77','r32_78','r32_79','r32_80']} allMatches={ALL_MATCHES} bracket={bracket} />
          <Col label="R16" gap="18px" ids={['r16_89','r16_90','r16_91','r16_92']} allMatches={ALL_MATCHES} bracket={bracket} />
          <Col label="QF" gap="58px" ids={['qf_97','qf_99']} allMatches={ALL_MATCHES} bracket={bracket} />
          <Col label="SF" gap="130px" ids={['sf_101']} allMatches={ALL_MATCHES} bracket={bracket} />
        </div>

        {/* CENTER */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',padding:'0 8px',minWidth:'155px'}}>
          <div style={{fontSize:'28px'}}>🏆</div>
          <div style={{fontSize:'10px',fontWeight:'700',color:'rgba(255,255,255,0.5)',letterSpacing:'0.08em'}}>FINAL</div>
          <Match id="match_104" matchNum={FINAL.matchNum} bracket={bracket} />
          {champion && (
            <div style={{textAlign:'center',marginTop:'2px'}}>
              <div style={{fontSize:'20px'}}>{FLAGS[champion] || ''}</div>
              <div style={{fontSize:'11px',fontWeight:'700',color:'#f5c842'}}>{champion}</div>
            </div>
          )}
          <div style={{marginTop:'8px',borderTop:'1px solid rgba(255,255,255,0.15)',paddingTop:'8px',width:'100%',textAlign:'center'}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'rgba(255,255,255,0.4)',letterSpacing:'0.08em',marginBottom:'4px'}}>3° LUGAR</div>
            <Match id="match_103" matchNum={THIRD_PLACE.matchNum} bracket={bracket} />
            {thirdWinner && (
              <div style={{textAlign:'center',marginTop:'2px',fontSize:'10px',color:'rgba(255,255,255,0.6)'}}>
                {FLAGS[thirdWinner] || ''} {thirdWinner}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{display:'flex',gap:'6px',alignItems:'center',flexDirection:'row-reverse'}}>
          <Col label="R32" gap="4px" ids={['r32_81','r32_82','r32_83','r32_84','r32_85','r32_86','r32_87','r32_88']} allMatches={ALL_MATCHES} bracket={bracket} />
          <Col label="R16" gap="18px" ids={['r16_93','r16_94','r16_95','r16_96']} allMatches={ALL_MATCHES} bracket={bracket} />
          <Col label="QF" gap="58px" ids={['qf_98','qf_100']} allMatches={ALL_MATCHES} bracket={bracket} />
          <Col label="SF" gap="130px" ids={['sf_102']} allMatches={ALL_MATCHES} bracket={bracket} />
        </div>

      </div>
    </div>
  );
}
