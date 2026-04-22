export type MarketStatus = 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';
export type MarketCategory = 'ALL' | 'SPORTS' | 'POLITICS' | 'CRYPTO' | 'ENTERTAINMENT' | 'SCIENCE' | 'ECONOMICS';

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  status: MarketStatus;
  image_url?: string;
  yes_price: number;   // 0–1 probability
  no_price: number;    // 0–1 probability
  total_volume: number;
  lock_ts: string;     // ISO timestamp
  resolve_ts?: string;
  created_at: string;
  outcome?: 'YES' | 'NO' | null;
  
  // FE-6 Additions
  resolution_rule: string;
  resolution_source: string;
  oracle_url?: string;
  contract_address?: string;
  fee_ngo: number;
  fee_platform: number;
  fee_gamification: number;
}

export interface MarketHistoryPoint {
  timestamp: string;
  yes_price: number;
  no_price: number;
}

export interface MarketListResponse {
  markets: Market[];
  total: number;
  page: number;
  page_size: number;
}

/** Derived display status: if market is OPEN but past lock_ts, show as LOCKED */
export function derivedStatus(market: Market): MarketStatus {
  if (market.status === 'OPEN' && new Date() >= new Date(market.lock_ts)) {
    return 'LOCKED';
  }
  return market.status;
}
