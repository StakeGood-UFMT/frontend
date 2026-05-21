export interface NgoSummary {
  id: string;
  on_chain_id?: number | null;
  name: string;
  slug: string;
  category?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  verified: boolean;
}

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
  amount_staked?: number;
  outcome?: 'YES' | 'NO';
  position_status?: 'confirmed' | 'resolved' | 'claimed';
  created_at?: string;
  market_outcome?: 'YES' | 'NO' | null;
  market_status?: 'draft' | 'active' | 'locked' | 'resolved';
  market_lock_at?: string;
  ngo_voted?: NgoSummary | null;
  ngo_candidates?: NgoSummary[];
}
