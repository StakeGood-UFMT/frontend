import { createAction, props } from '@ngrx/store';
import { Market, MarketHistoryPoint } from '../../models/market.model';

export const loadMarket = createAction(
  '[Market] Load Market',
  props<{ id: string }>()
);

export const loadMarketSuccess = createAction(
  '[Market] Load Market Success',
  props<{ market: Market }>()
);

export const loadMarketFailure = createAction(
  '[Market] Load Market Failure',
  props<{ error: string }>()
);

export const loadHistory = createAction(
  '[Market] Load History',
  props<{ id: string; range: string }>()
);

export const loadHistorySuccess = createAction(
  '[Market] Load History Success',
  props<{ history: MarketHistoryPoint[] }>()
);

export const loadHistoryFailure = createAction(
  '[Market] Load History Failure',
  props<{ error: string }>()
);

export const clearSelectedMarket = createAction('[Market] Clear Selected Market');
