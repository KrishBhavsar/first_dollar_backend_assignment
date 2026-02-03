export function calculateMaturityScore(daysSinceFirstTx: number): number {
  // Wallet age scoring (0-100 points)
  // 0 days = 0, 30 days = 20, 180 days = 70, 365+ days = 100
  if (daysSinceFirstTx === 0) return 0;
  if (daysSinceFirstTx >= 365) return 100;
  if (daysSinceFirstTx >= 180) return 70 + ((daysSinceFirstTx - 180) / 185) * 30;
  if (daysSinceFirstTx >= 30) return 20 + ((daysSinceFirstTx - 30) / 150) * 50;
  
  return Math.round((daysSinceFirstTx / 30) * 20);
}