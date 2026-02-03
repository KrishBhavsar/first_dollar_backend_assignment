import { AlchemyTransaction } from '@/types';
import { SCORING_WEIGHTS, THRESHOLDS } from '../constants';
import { calculateActivityScore } from './components/activity';
import { calculateVolumeScore } from './components/volume';
import { calculateDiversityScore } from './components/diversity';
import { calculateMaturityScore } from './components/maturity';

export interface ProcessedStats {
  totalTransactions: number;
  uniqueActiveDays: number;
  longestStreak: number;
  firstTxAt: string | null;
  lastTxAt: string | null;
  uniqueContracts: number;
  daysSinceFirstTx: number;
  daysSinceLastTx: number;
}

export function processTransactions(
  transactions: AlchemyTransaction[]
): ProcessedStats {
  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      uniqueActiveDays: 0,
      longestStreak: 0,
      firstTxAt: null,
      lastTxAt: null,
      uniqueContracts: 0,
      daysSinceFirstTx: 0,
      daysSinceLastTx: 0,
    };
  }

  const uniqueContracts = new Set<string>();
  const activeDates = new Set<string>();
  const timestamps: Date[] = [];

  transactions.forEach((tx) => {
    if (tx.to) uniqueContracts.add(tx.to.toLowerCase());
    
    const date = new Date(tx.metadata.blockTimestamp);
    timestamps.push(date);
    activeDates.add(date.toISOString().split('T')[0]);
  });

  timestamps.sort((a, b) => a.getTime() - b.getTime());
  const firstTx = timestamps[0];
  const lastTx = timestamps[timestamps.length - 1];
  const now = new Date();

  // Calculate longest streak
  const sortedDates = Array.from(activeDates).sort();
  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.floor(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return {
    totalTransactions: transactions.length,
    uniqueActiveDays: activeDates.size,
    longestStreak,
    firstTxAt: firstTx.toISOString(),
    lastTxAt: lastTx.toISOString(),
    uniqueContracts: uniqueContracts.size,
    daysSinceFirstTx: Math.floor(
      (now.getTime() - firstTx.getTime()) / (1000 * 60 * 60 * 24)
    ),
    daysSinceLastTx: Math.floor(
      (now.getTime() - lastTx.getTime()) / (1000 * 60 * 60 * 24)
    ),
  };
}

export function calculateScore(stats: ProcessedStats) {
  // Check for insufficient data
  if (stats.totalTransactions < THRESHOLDS.MIN_TRANSACTIONS_FOR_VALID_SCORE) {
    return {
      score: 0,
      breakdown: {
        activityConsistency: 0,
        transactionVolume: 0,
        multiAppUsage: 0,
        walletMaturity: 0,
      },
      flags: { insufficientData: true },
    };
  }

  // Calculate component scores
  const activityConsistency = calculateActivityScore(
    stats.uniqueActiveDays,
    stats.longestStreak,
    stats.daysSinceLastTx
  );

  const transactionVolume = calculateVolumeScore(stats.totalTransactions);

  const multiAppUsage = calculateDiversityScore(
    stats.uniqueContracts,
    stats.totalTransactions
  );

  const walletMaturity = calculateMaturityScore(stats.daysSinceFirstTx);

  // Weighted final score
  const finalScore = Math.round(
    activityConsistency * SCORING_WEIGHTS.activityConsistency +
    transactionVolume * SCORING_WEIGHTS.transactionVolume +
    multiAppUsage * SCORING_WEIGHTS.multiAppUsage +
    walletMaturity * SCORING_WEIGHTS.walletMaturity
  );

  // Bot detection
  const singleContractRatio = stats.uniqueContracts / stats.totalTransactions;
  const possibleBot = singleContractRatio > THRESHOLDS.BOT_SINGLE_CONTRACT_THRESHOLD;

  return {
    score: Math.min(finalScore, 100),
    breakdown: {
      activityConsistency,
      transactionVolume,
      multiAppUsage,
      walletMaturity,
    },
    flags: possibleBot ? { possibleBot: true } : undefined,
  };
}