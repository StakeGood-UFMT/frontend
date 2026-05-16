import { createReducer, on } from '@ngrx/store';
import * as AnchorActions from './anchor.actions';

export interface AnchorState {
  kycUrl: string | null;
  kycStatus: string | null;
  localKycStatus: string | null;
  currentQuote: any | null;
  currentOrder: any | null;
  userOrders: any[];
  fiatAccounts: any[];
  loading: boolean;
  error: string | null;
}

export const initialState: AnchorState = {
  kycUrl: null,
  kycStatus: null,
  localKycStatus: null,
  currentQuote: null,
  currentOrder: null,
  userOrders: [],
  fiatAccounts: [],
  loading: false,
  error: null,
};

export const anchorReducer = createReducer(
  initialState,
  on(AnchorActions.loadKycUrl, (state) => ({ ...state, loading: true, error: null })),
  on(AnchorActions.loadKycUrlSuccess, (state, { url }) => ({ ...state, kycUrl: url, loading: false })),
  on(AnchorActions.loadKycUrlFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(AnchorActions.loadKycStatus, (state) => ({ ...state, loading: true, error: null })),
  on(AnchorActions.loadKycStatusSuccess, (state, { status, localKycStatus }) => ({ ...state, kycStatus: status, localKycStatus, loading: false })),
  on(AnchorActions.loadKycStatusFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(AnchorActions.createQuote, (state) => ({ ...state, loading: true, error: null, currentQuote: null })),
  on(AnchorActions.createQuoteSuccess, (state, { quote }) => ({ ...state, currentQuote: quote, loading: false })),
  on(AnchorActions.createQuoteFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(AnchorActions.createOnRamp, (state) => ({ ...state, loading: true, error: null, currentOrder: null })),
  on(AnchorActions.createOnRampSuccess, (state, { order }) => ({ ...state, currentOrder: order, loading: false })),
  on(AnchorActions.createOnRampFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(AnchorActions.createOffRamp, (state) => ({ ...state, loading: true, error: null, currentOrder: null })),
  on(AnchorActions.createOffRampSuccess, (state, { order }) => ({ ...state, currentOrder: order, loading: false })),
  on(AnchorActions.createOffRampFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(AnchorActions.pollOrderStatusSuccess, (state, { order }) => ({ ...state, currentOrder: order })),

  on(AnchorActions.loadUserOrders, (state) => ({ ...state, loading: true, error: null })),
  on(AnchorActions.loadUserOrdersSuccess, (state, { orders }) => ({
    ...state,
    userOrders: orders,
    currentOrder: state.currentOrder || orders.find((o) => o.status === 'pending' || o.status === 'processing') || null,
    loading: false,
  })),
  on(AnchorActions.loadUserOrdersFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(AnchorActions.loadFiatAccounts, (state) => ({ ...state, loading: true, error: null })),
  on(AnchorActions.loadFiatAccountsSuccess, (state, { accounts }) => ({ ...state, fiatAccounts: accounts, loading: false })),
  on(AnchorActions.loadFiatAccountsFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(AnchorActions.signOffRampXdr, (state) => ({ ...state, loading: true, error: null })),
  on(AnchorActions.signOffRampXdrSuccess, (state, { txHash }) => ({
    ...state,
    loading: false,
    currentOrder: state.currentOrder ? { ...state.currentOrder, stellarTxHash: txHash, status: 'completed' } : null,
  })),
  on(AnchorActions.signOffRampXdrFailure, (state, { error }) => ({ ...state, error, loading: false })),
);
