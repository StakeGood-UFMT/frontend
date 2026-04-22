import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../../models/auth.model';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectIsLoggedIn = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoggedIn
);

export const selectProfile = createSelector(
  selectAuthState,
  (state: AuthState) => state.profile
);

export const selectKycStatus = createSelector(
  selectProfile,
  (profile) => profile?.kyc_status
);

export const selectTermsAccepted = createSelector(
  selectProfile,
  (profile) => profile?.terms_accepted
);

export const selectRole = createSelector(
  selectProfile,
  (profile) => profile?.role
);
