import { createAction, props } from '@ngrx/store';

export const loadKycUrl = createAction('[Anchor] Load KYC URL', props<{ currency?: string }>());
export const loadKycUrlSuccess = createAction('[Anchor] Load KYC URL Success', props<{ url: string }>());
export const loadKycUrlFailure = createAction('[Anchor] Load KYC URL Failure', props<{ error: string }>());

export const loadKycStatus = createAction('[Anchor] Load KYC Status');
export const loadKycStatusSuccess = createAction('[Anchor] Load KYC Status Success', props<{ status: string; localKycStatus: string }>());
export const loadKycStatusFailure = createAction('[Anchor] Load KYC Status Failure', props<{ error: string }>());

export const createQuote = createAction('[Anchor] Create Quote', props<{ fromCurrency: string; toCurrency: string; amount: string }>());
export const createQuoteSuccess = createAction('[Anchor] Create Quote Success', props<{ quote: any }>());
export const createQuoteFailure = createAction('[Anchor] Create Quote Failure', props<{ error: string }>());

export const createOnRamp = createAction('[Anchor] Create OnRamp', props<{ quoteId: string; amount: string; fromCurrency: string; toCurrency: string }>());
export const createOnRampSuccess = createAction('[Anchor] Create OnRamp Success', props<{ order: any }>());
export const createOnRampFailure = createAction('[Anchor] Create OnRamp Failure', props<{ error: string }>());

export const createOffRamp = createAction('[Anchor] Create OffRamp', props<{ quoteId: string; amount: string; fromCurrency: string; toCurrency: string; fiatAccountId: string }>());
export const createOffRampSuccess = createAction('[Anchor] Create OffRamp Success', props<{ order: any }>());
export const createOffRampFailure = createAction('[Anchor] Create OffRamp Failure', props<{ error: string }>());

export const pollOrderStatus = createAction('[Anchor] Poll Order Status', props<{ orderId: string }>());
export const pollOrderStatusSuccess = createAction('[Anchor] Poll Order Status Success', props<{ order: any }>());
export const pollOrderStatusFailure = createAction('[Anchor] Poll Order Status Failure', props<{ error: string }>());

export const loadUserOrders = createAction('[Anchor] Load User Orders');
export const loadUserOrdersSuccess = createAction('[Anchor] Load User Orders Success', props<{ orders: any[] }>());
export const loadUserOrdersFailure = createAction('[Anchor] Load User Orders Failure', props<{ error: string }>());

export const loadFiatAccounts = createAction('[Anchor] Load Fiat Accounts');
export const loadFiatAccountsSuccess = createAction('[Anchor] Load Fiat Accounts Success', props<{ accounts: any[] }>());
export const loadFiatAccountsFailure = createAction('[Anchor] Load Fiat Accounts Failure', props<{ error: string }>());

export const simulatePayment = createAction('[Anchor] Simulate Payment', props<{ orderId: string }>());
export const simulatePaymentSuccess = createAction('[Anchor] Simulate Payment Success', props<{ status: number }>());
export const simulatePaymentFailure = createAction('[Anchor] Simulate Payment Failure', props<{ error: string }>());

export const signOffRampXdr = createAction('[Anchor] Sign OffRamp XDR', props<{ xdr: string }>());
export const signOffRampXdrSuccess = createAction('[Anchor] Sign OffRamp XDR Success', props<{ txHash: string }>());
export const signOffRampXdrFailure = createAction('[Anchor] Sign OffRamp XDR Failure', props<{ error: string }>());

export const sandboxAutoApproveKyc = createAction('[Anchor] Sandbox Auto Approve KYC');
export const sandboxAutoApproveKycSuccess = createAction('[Anchor] Sandbox Auto Approve KYC Success', props<{ status: string; localKycStatus: string }>());
export const sandboxAutoApproveKycFailure = createAction('[Anchor] Sandbox Auto Approve KYC Failure', props<{ error: string }>());
