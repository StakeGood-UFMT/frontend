import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MarketState } from './market.reducer';

export const selectMarketState = createFeatureSelector<MarketState>('market');

export const selectSelectedMarket = createSelector(
  selectMarketState,
  (state) => state.selectedMarket
);

export const selectMarketHistory = createSelector(
  selectMarketState,
  (state) => state.history
);

export const selectLoadingMarket = createSelector(
  selectMarketState,
  (state) => state.loadingMarket
);

export const selectLoadingHistory = createSelector(
  selectMarketState,
  (state) => state.loadingHistory
);

export const selectMarketError = createSelector(
  selectMarketState,
  (state) => state.marketError
);

export const selectHistoryError = createSelector(
  selectMarketState,
  (state) => state.historyError
);
