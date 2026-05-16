import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnchorState } from './anchor.reducer';

export const selectAnchorState = createFeatureSelector<AnchorState>('anchor');

export const selectKycUrl = createSelector(selectAnchorState, (state) => state.kycUrl);
export const selectKycStatus = createSelector(selectAnchorState, (state) => state.kycStatus);
export const selectLocalKycStatus = createSelector(selectAnchorState, (state) => state.localKycStatus);
export const selectCurrentQuote = createSelector(selectAnchorState, (state) => state.currentQuote);
export const selectCurrentOrder = createSelector(selectAnchorState, (state) => state.currentOrder);
export const selectUserOrders = createSelector(selectAnchorState, (state) => state.userOrders);
export const selectFiatAccounts = createSelector(selectAnchorState, (state) => state.fiatAccounts);
export const selectAnchorLoading = createSelector(selectAnchorState, (state) => state.loading);
export const selectAnchorError = createSelector(selectAnchorState, (state) => state.error);
