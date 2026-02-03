export interface ScoreRequest {
  address: string;
}

export interface ScoreResponse {
  address: string;
  basename?: string;
  score: number;
  breakdown: {
    activityConsistency: number;
    transactionVolume: number;
    multiAppUsage: number;
    walletMaturity: number;
  };
  stats: {
    totalTransactions: number;
    uniqueActiveDays: number;
    longestStreak: number;
    firstTxAt: string | null;
    lastTxAt: string | null;
    uniqueContracts: number;
    daysSinceFirstTx: number;
  };
  flags?: {
    possibleBot?: boolean;
    insufficientData?: boolean;
  };
}

export interface AlchemyTransaction {
  from: string;
  to: string;
  value: string;
  hash: string;
  blockNum: string;
  metadata: {
    blockTimestamp: string;
  };
  category: string;
}
