export const ALCHEMY_BASE_URL = 'https://base-mainnet.g.alchemy.com/v2';
export const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300');

// Scoring weights
export const SCORING_WEIGHTS = {
  activityConsistency: 0.30,
  transactionVolume: 0.25,
  multiAppUsage: 0.25,
  walletMaturity: 0.20,
};

// Thresholds for scoring
export const THRESHOLDS = {
  MIN_TRANSACTIONS_FOR_VALID_SCORE: 5,
  HIGH_ACTIVITY_DAYS: 50,
  HIGH_TX_COUNT: 100,
  HIGH_CONTRACT_DIVERSITY: 10,
  MATURE_WALLET_DAYS: 180,
  BOT_SINGLE_CONTRACT_THRESHOLD: 0.7, // 70% to one contract
};