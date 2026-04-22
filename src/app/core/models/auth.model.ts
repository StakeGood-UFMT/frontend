export interface AuthProfile {
  public_key: string;
  role: 'user' | 'ngo_partner' | 'admin';
  kyc_status: 'not_started' | 'in_progress' | 'pending' | 'approved' | 'rejected';
  terms_accepted: boolean;
  avatar_url?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  profile: AuthProfile;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  profile: AuthProfile | null;
  isLoggedIn: boolean;
}
