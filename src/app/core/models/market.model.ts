export type MarketStatus = 'active' | 'locked' | 'resolved' | 'CANCELLED';
export type MarketCategory = 'ALL' | 'Sports' | 'Finance' | 'Environment' | 'Tech' | 'Politics' | 'Science' | 'Health' | 'Education' | 'Animals' | 'Entertainment';

export interface UserPosition {
  outcome: 'YES' | 'NO' | null;
  amount: string;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  status: MarketStatus;
  image_url?: string;
  yes_price?: number;
  no_price?: number;
  total_liquidity: string;
  lock_at: string;
  settle_at?: string;
  created_at: string;
  outcome?: 'YES' | 'NO' | null;
  user_position?: UserPosition;
  
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
  if (market.status === 'active' && new Date() >= new Date(market.lock_at)) {
    return 'locked';
  }
  return market.status;
}
