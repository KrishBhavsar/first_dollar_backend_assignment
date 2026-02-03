export function calculateActivityScore(
  uniqueActiveDays: number,
  longestStreak: number,
  daysSinceLastTx: number
): number {
  // Activity consistency based on unique days (0-40 points)
  const activeDaysScore = Math.min((uniqueActiveDays / 100) * 40, 40);

  // Streak bonus (0-30 points)
  const streakScore = Math.min((longestStreak / 30) * 30, 30);

  // Recency bonus/penalty (0-30 points)
  let recencyScore = 30;
  if (daysSinceLastTx > 90) recencyScore = 0;
  else if (daysSinceLastTx > 30) recencyScore = 15;
  else if (daysSinceLastTx > 7) recencyScore = 25;

  return Math.round(activeDaysScore + streakScore + recencyScore);
}

