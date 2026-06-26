import { GROUPS, FLAGS, HOST_TEAMS } from '../lib/worldcupData.js';
import { computeGroupTable, scoreGroupStanding } from '../lib/scoring.js';

function GroupTableCard({ groupId, group, matches, picks, realStanding }) {
  const userTable = computeGroupTable(group.teams, matches, Object.values(picks).filter(p => matches.find(m => m.id === p.match_id)));
  const { pts, positions } = scoreGroupStanding(userTable, realStanding);
  const isConfirmed = realStanding?.confirmed;

  return (
    <div className={`standings-card ${isConfirmed ? 'standings-confirmed' : ''}`}>
      <div className="standings-card-header">
        <h4>{group.name}</h4>
        {isConfirmed && <span className="standings-pts-badge">+{pts} pts</span>}
      </div>
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Selección</th>
            <th>Pts</th>
            <th>GD</th>
            {isConfirmed && <th>Real</th>}
          </tr>
        </thead>
        <tbody>
          {userTable.map((row, i) => {
            let rowClass = '';
            if (isConfirmed) {
              const realTeamAtPos = [realStanding.pos1, realStanding.pos2, realStanding.pos3, realStanding.pos4][i];
              rowClass = row.team === realTeamAtPos ? 'standing-correct' : 'standing-wrong';
            } else if (i < 2) {
              rowClass = 'qualifies-direct';
            }

            const realTeamAtPos = isConfirmed
              ? [realStanding.pos1, realStanding.pos2, realStanding.pos3, realStanding.pos4][i]
              : null;

            return (
              <tr key={row.team} className={rowClass}>
                <td className="pos-num">{i + 1}</td>
                <td className="team-cell">
                  <span className="team-flag">{FLAGS[row.team] || ''}</span>
                  {row.team}
                  {HOST_TEAMS.includes(row.team) && <span className="host-star">★</span>}
                </td>
                <td className="pts-cell">{row.pts}</td>
                <td>{row.gd > 0 ? '+' : ''}{row.gd}</td>
                {isConfirmed && (
                  <td className="real-pos-cell">
                    {row.team === realTeamAtPos
                      ? <span className="correct-icon">✓</span>
                      : <span className="wrong-icon">{FLAGS[realTeamAtPos] || ''} {realTeamAtPos}</span>
                    }
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!isConfirmed && (
        <p className="standings-pending">⏳ El admin aún no ha confirmado este grupo</p>
      )}
    </div>
  );
}

export default function GroupTablesSection({ picks, allMatches, groupStandings }) {
  const standingsMap = {};
  for (const s of (groupStandings || [])) standingsMap[s.group_id] = s;

  const confirmedCount = (groupStandings || []).filter(s => s.confirmed).length;
  const totalPts = Object.entries(GROUPS).reduce((acc, [groupId, group]) => {
    const standing = standingsMap[groupId];
    if (!standing?.confirmed) return acc;
    const matches = allMatches.filter(m => m.group === groupId);
    const userTable = computeGroupTable(group.teams, matches, Object.values(picks).filter(p => matches.find(m => m.id === p.match_id)));
    const { pts } = scoreGroupStanding(userTable, standing);
    return acc + pts;
  }, 0);

  return (
    <div className="group-tables-section">
      <div className="standings-header">
        <div className="standings-summary">
          <span>Grupos confirmados: <strong>{confirmedCount}/12</strong></span>
          {confirmedCount > 0 && <span className="standings-total-pts">Total tablas: <strong>+{totalPts} pts</strong></span>}
        </div>
        <p className="standings-info">
          Ganas <strong>1 punto</strong> por cada equipo que hayas colocado en la posición correcta según los resultados reales.
        </p>
      </div>

      <div className="standings-grid">
        {Object.entries(GROUPS).map(([groupId, group]) => (
          <GroupTableCard
            key={groupId}
            groupId={groupId}
            group={group}
            matches={allMatches.filter(m => m.group === groupId)}
            picks={picks}
            realStanding={standingsMap[groupId]}
          />
        ))}
      </div>
    </div>
  );
}
