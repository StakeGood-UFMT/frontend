import { createReducer, on } from '@ngrx/store';
import { AuthState } from '../../models/auth.model';
import * as AuthActions from './auth.actions';

const STORAGE_KEY = 'stakegood_auth';

function loadInitialState(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthState;
      const kyc = parsed?.profile?.kyc_status as any;
      if (kyc === 'verified') {
        parsed.profile = { ...(parsed.profile as any), kyc_status: 'approved' };
      } else if (kyc === 'none') {
        parsed.profile = { ...(parsed.profile as any), kyc_status: 'not_started' };
      }
      return parsed;
    }
  } catch (e) {
    console.error('[AuthReducer] Error parsing auth state', e);
  }
  return {
    accessToken: null,
    refreshToken: null,
    profile: null,
    isLoggedIn: false
  };
}

export const initialState: AuthState = loadInitialState();

export const authReducer = createReducer(
  initialState,
  on(AuthActions.loginSuccess, (state, { accessToken, refreshToken, profile }) => ({
    ...state,
    accessToken,
    refreshToken,
    profile,
    isLoggedIn: true
  })),
  on(AuthActions.logout, () => ({
    accessToken: null,
    refreshToken: null,
    profile: null,
    isLoggedIn: false
  })),
  on(AuthActions.updateProfile, (state, { profile }) => ({
    ...state,
    profile: state.profile ? { ...state.profile, ...profile } : null
  }))
);
