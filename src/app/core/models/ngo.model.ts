export interface Ngo {
  id: string;
  on_chain_id?: number | null;
  name: string;
  description: string;
  logo_url: string;
  cover_url?: string;
  cause: string;
  verified: boolean;
  total_impact?: string;
  website_url?: string;
  audit_url?: string;
  treasury_url?: string;
  certification_url?: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  ngo_id: string;
  title: string;
  description: string;
  impact_value: string;
  tx_hash: string;
  date: string;
}
