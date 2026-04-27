import { Market } from './market.model';

export interface AdminMarketTTL extends Market {
  ttl_ledger_expiry?: number;
  is_eligible_for_bump: boolean;
}

export interface BatchBumpTTLRequest {
  market_ids: string[];
}

export interface DistributeImpactResponse {
  tx_hash: string;
  amount_distributed: string;
  market_id: string;
}
