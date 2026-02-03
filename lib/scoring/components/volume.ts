export function calculateVolumeScore(totalTransactions: number): number {
  // Log-scaled to prevent domination
  // 0 txs = 0, 10 txs = ~40, 100 txs = ~70, 1000 txs = 100
  if (totalTransactions === 0) return 0;
  
  const logScore = Math.log10(totalTransactions + 1) * 33.33;
  return Math.min(Math.round(logScore), 100);
}