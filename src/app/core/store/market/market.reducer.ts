import { createReducer, on } from '@ngrx/store';
import { Market, MarketHistoryPoint } from '../../models/market.model';
import * as MarketActions from './market.actions';

export interface MarketState {
  selectedMarket: Market | null;
  history: MarketHistoryPoint[];
  loadingMarket: boolean;
  loadingHistory: boolean;
  marketError: string | null;
  historyError: string | null;
}

export const initialState: MarketState = {
  selectedMarket: null,
  history: [],
  loadingMarket: false,
  loadingHistory: false,
  marketError: null,
  historyError: null,
};

export const marketReducer = createReducer(
  initialState,
  on(MarketActions.loadMarket, (state) => ({
    ...state,
    loadingMarket: true,
    marketError: null,
  })),
  on(MarketActions.loadMarketSuccess, (state, { market }) => ({
    ...state,
    selectedMarket: market,
    loadingMarket: false,
  })),
  on(MarketActions.loadMarketFailure, (state, { error }) => ({
    ...state,
    loadingMarket: false,
    marketError: error,
  })),
  on(MarketActions.loadHistory, (state) => ({
    ...state,
    loadingHistory: true,
    historyError: null,
  })),
  on(MarketActions.loadHistorySuccess, (state, { history }) => ({
    ...state,
    history,
    loadingHistory: false,
  })),
  on(MarketActions.loadHistoryFailure, (state, { error }) => ({
    ...state,
    loadingHistory: false,
    historyError: error,
  })),
  on(MarketActions.clearSelectedMarket, (state) => ({
    ...state,
    selectedMarket: null,
    history: [],
    marketError: null,
    historyError: null,
  }))
);
