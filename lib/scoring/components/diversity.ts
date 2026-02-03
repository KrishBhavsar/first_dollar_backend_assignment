export function calculateDiversityScore(
  uniqueContracts: number,
  totalTransactions: number
): number {
  if (totalTransactions === 0) return 0;

  // Base score from unique contracts (0-70 points)
  const contractScore = Math.min((uniqueContracts / 20) * 70, 70);

  // Diversity ratio bonus (0-30 points)
  const diversityRatio = uniqueContracts / totalTransactions;
  const ratioScore = Math.min(diversityRatio * 150, 30);

  return Math.round(contractScore + ratioScore);
}