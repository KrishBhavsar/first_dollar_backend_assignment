import NodeCache from 'node-cache';
import { CACHE_TTL } from '../constants';
import { ScoreResponse } from '@/types';

class ScoreCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: CACHE_TTL,
      checkperiod: 60,
      useClones: false,
    });
  }

  get(address: string): ScoreResponse | undefined {
    return this.cache.get<ScoreResponse>(address.toLowerCase());
  }

  set(address: string, score: ScoreResponse): boolean {
    return this.cache.set(address.toLowerCase(), score);
  }

  has(address: string): boolean {
    return this.cache.has(address.toLowerCase());
  }

  clear(): void {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const scoreCache = new ScoreCache();