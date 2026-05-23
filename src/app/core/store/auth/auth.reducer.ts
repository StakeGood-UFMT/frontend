import { createReducer, on } from '@ngrx/store';
import { AuthState } from '../../models/auth.model';
import * as AuthActions from './auth.actions';

const STORAGE_KEY = 'stakegood_auth';

export const initialState: AuthState = {
  profile: null,
  isLoggedIn: false
  // sem accessToken e refreshToken
};
export const authReducer = createReducer(
  initialState,
  on(AuthActions.loginSuccess, (state, { profile }) => ({
  ...state,
  profile,
  isLoggedIn: true
})),
  on(AuthActions.logout, () => ({
    profile: null,
    isLoggedIn: false
  })),
  on(AuthActions.updateProfile, (state, { profile }) => ({
    ...state,
    profile: state.profile ? { ...state.profile, ...profile } : null
  }))
);
