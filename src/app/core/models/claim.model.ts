export interface Claim {
  id: string;
  market_id: string;
  market_title: string;
  amount: number;
  claimed: boolean;
  can_claim: boolean;
  market_state: string;
  claimed_at?: string;
  tx_hash?: string;
  impact_generated_by_user?: number;
  asset_code?: string;
}
