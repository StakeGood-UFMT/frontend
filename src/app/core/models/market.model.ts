export type MarketStatus = 'OPEN' | 'LOCKED' | 'RESOLVED' | 'CANCELLED';
export type MarketCategory = 'ALL' | 'SPORTS' | 'POLITICS' | 'CRYPTO' | 'ENTERTAINMENT' | 'SCIENCE' | 'ECONOMICS';

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  status: MarketStatus;
  image_url?: string;
  yes_price?: number;   // Note: Backend documentation didn't explicitly show yes/no price in the list, but it's likely there.
  no_price?: number;
  total_liquidity: string; // decimal_string in backend
  lock_at: string;         // ISO_DATE
  settle_at?: string;      // ISO_DATE
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
  yes_pool: string;
  no_pool: string;
  yes_probability: number;
  trading_volume: string;
}

export interface MarketHistoryResponse {
  market_id: string;
  title: string;
  snapshots: MarketHistoryPoint[];
}

export interface MarketListResponse {
  markets: Market[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
  };
}

/** Derived display status: if market is OPEN but past lock_ts, show as LOCKED */
export function derivedStatus(market: Market): MarketStatus {
  if (market.status === 'OPEN' && new Date() >= new Date(market.lock_at)) {
    return 'LOCKED';
  }
  return market.status;
}
