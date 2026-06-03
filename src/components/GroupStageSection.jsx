import { GROUPS, FLAGS, HOST_TEAMS, getAllGroupMatches } from '../lib/worldcupData.js';

function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number"
      min="0"
      max="20"
      value={value === null || value === undefined ? '' : value}
      onChange={e => {
        const v = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0);
        onChange(v);
      }}
      disabled={disabled}
      className="score-input"
      placeholder="-"
    />
  );
}

function MatchRow({ match, pick, result, onPickChange, confirmed }) {
  const isHost = HOST_TEAMS.includes(match.home) || HOST_TEAMS.includes(match.away);
  const hasResult = result && result.home_goals !== null;

  function getMatchClass() {
    if (!hasResult || !pick || pick.home_goals === null) return '';
    const ph = Number(pick.home_goals), pa = Number(pick.away_goals);
    const rh = Number(result.home_goals), ra = Number(result.away_goals);
    if (ph === rh && pa === ra) return 'match-exact';
    const po = ph > pa ? 'h' : ph < pa ? 'a' : 'd';
    const ro = rh > ra ? 'h' : rh < ra ? 'a' : 'd';
    return po === ro ? 'match-correct' : 'match-wrong';
  }

  return (
    <div className={`match-row ${getMatchClass()} ${isHost ? 'match-double' : ''}`}>
      {isHost && <span className="double-badge">×2</span>}
      <span className="team-name team-home">
        {FLAGS[match.home] || ''} {match.home}
      </span>
      <div className="score-area">
        <ScoreInput
          value={pick?.home_goals}
          onChange={v => onPickChange(match.id, v, pick?.away_goals ?? null)}
          disabled={confirmed}
        />
        <span className="score-sep">-</span>
        <ScoreInput
          value={pick?.away_goals}
          onChange={v => onPickChange(match.id, pick?.home_goals ?? null, v)}
          disabled={confirmed}
        />
      </div>
      <span className="team-name team-away">
        {match.away} {FLAGS[match.away] || ''}
      </span>
      {hasResult && (
        <span className="real-result">
          Real: {result.home_goals}-{result.away_goals}
        </span>
      )}
    </div>
  );
}

function GroupTable({ teams, groupId, allMatches, picks, results }) {
  const table = {};
  for (const t of teams) table[t] = { team: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0, w: 0, d: 0, l: 0 };

  const groupMatches = allMatches.filter(m => m.group === groupId);
  const sourceData = Object.keys(results).length > 0 ? results : picks;

  for (const match of groupMatches) {
    const data = results[match.id] || picks[match.id];
    if (!data || data.home_goals === null || data.home_goals === undefined) continue;
    const rh = Number(data.home_goals), ra = Number(data.away_goals);
    if (isNaN(rh) || isNaN(ra)) continue;

    table[match.home].played++; table[match.away].played++;
    table[match.home].gf += rh; table[match.home].ga += ra;
    table[match.away].gf += ra; table[match.away].ga += rh;
    table[match.home].gd = table[match.home].gf - table[match.home].ga;
    table[match.away].gd = table[match.away].gf - table[match.away].ga;
    if (rh > ra) { table[match.home].pts += 3; table[match.home].w++; table[match.away].l++; }
    else if (rh < ra) { table[match.away].pts += 3; table[match.away].w++; table[match.home].l++; }
    else { table[match.home].pts++; table[match.home].d++; table[match.away].pts++; table[match.away].d++; }
  }

  const sorted = Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  return (
    <div className="group-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Selección</th>
            <th>PJ</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>GF</th>
            <th>GC</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.team} className={i < 2 ? 'qualifies-direct' : ''}>
              <td className="pos-num">{i + 1}</td>
              <td className="team-cell">
                <span className="team-flag">{FLAGS[row.team] || ''}</span>
                {row.team}
                {HOST_TEAMS.includes(row.team) && <span className="host-star">★</span>}
              </td>
              <td>{row.played}</td>
              <td>{row.w}</td>
              <td>{row.d}</td>
              <td>{row.l}</td>
              <td>{row.gf}</td>
              <td>{row.ga}</td>
              <td>{row.gd > 0 ? '+' : ''}{row.gd}</td>
              <td className="pts-cell">{row.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="table-note">Clasifican directamente los 2 primeros. Los terceros compiten por 8 cupos.</p>
    </div>
  );
}

export default function GroupStageSection({ picks, results, confirmed, activeGroup, setActiveGroup, groupProgress, allMatches, onPickChange, getGroupStandingsFromPicks }) {
  const groupIds = Object.keys(GROUPS);

  return (
    <div className="group-stage-section">
      <div className="group-tabs">
        {groupIds.map(gId => {
          const prog = groupProgress[gId];
          const done = prog.filled === prog.total;
          return (
            <button
              key={gId}
              className={`group-tab ${activeGroup === gId ? 'active' : ''} ${done ? 'done' : ''}`}
              onClick={() => setActiveGroup(gId)}
            >
              {gId}
              <span className="group-tab-progress">{prog.filled}/{prog.total}</span>
            </button>
          );
        })}
      </div>

      <div className="group-content">
        <div className="group-label">
          <h3>{GROUPS[activeGroup].name}</h3>
          <div className="group-teams-preview">
            {GROUPS[activeGroup].teams.map(t => (
              <span key={t} className="team-pill">
                {FLAGS[t]} {t}
                {HOST_TEAMS.includes(t) && <span className="host-badge">Anfitrión</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="matches-list">
          {allMatches.filter(m => m.group === activeGroup).map(match => (
            <MatchRow
              key={match.id}
              match={match}
              pick={picks[match.id]}
              result={results[match.id]}
              onPickChange={onPickChange}
              confirmed={confirmed}
            />
          ))}
        </div>

        <GroupTable
          teams={GROUPS[activeGroup].teams}
          groupId={activeGroup}
          allMatches={allMatches}
          picks={picks}
          results={results}
        />
      </div>
    </div>
  );
}
