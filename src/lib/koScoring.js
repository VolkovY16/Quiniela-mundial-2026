// Compute knockout bracket leaderboard from ko_detail picks vs ko_detail results
// Points: 3 for exact score + correct winner (or penalties match), 1 for correct winner only
export function computeKoBracketLeaderboard({ users, koDetailPicks, koDetailResults }) {
  return users.map(user => {
    const uid = user.user_id;
    const userPicks = koDetailPicks.filter(p => p.user_id === uid);

    let totalPts = 0;
    let exactHits = 0;
    let correctWinners = 0;

    for (const result of koDetailResults) {
      if (!result.winner) continue;
      const pick = userPicks.find(p => p.match_id === result.match_id);
      if (!pick || !pick.winner) continue;

      if (pick.winner === result.winner) {
        // Check exact: same score AND same penalties flag
        const exactScore = result.home_goals !== null &&
          result.home_goals !== undefined &&
          pick.home_goals === result.home_goals &&
          pick.away_goals === result.away_goals &&
          !!pick.penalties === !!result.penalties;

        if (exactScore) {
          totalPts += 3;
          exactHits++;
        } else {
          totalPts += 1;
        }
        correctWinners++;
      }
    }

    return {
      userId: uid,
      username: user.username || uid,
      confirmed: user.confirmed,
      totalPts,
      exactHits,
      correctWinners,
    };
  }).sort((a, b) => {
    if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    return b.correctWinners - a.correctWinners;
  });
}
