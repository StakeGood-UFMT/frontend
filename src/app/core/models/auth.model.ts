export interface AuthProfile {
  public_key: string;
  role: 'user' | 'ngo_partner' | 'admin';
  kyc_status: 'not_started' | 'in_progress' | 'pending' | 'approved' | 'rejected';
  terms_accepted: boolean;
  avatar_url?: string;
}

export interface AuthResponse {
  refresh_token?: string;
  jwt: string;
  wallet: string;
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected';
  kyc_tier: number;
  expires_in: number;
  user: {
    id: string;
    primary_wallet: string;
    role: 'user' | 'ngo_partner' | 'admin';
    public_visibility: boolean;
  };
}

export interface AuthState {
  profile: AuthProfile | null;
  isLoggedIn: boolean;
}
