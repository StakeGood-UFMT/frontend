import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { AnchorService } from '../../services/anchor.service';
import { WalletService } from '../../services/wallet.service';
import * as AnchorActions from './anchor.actions';

@Injectable()
export class AnchorEffects {
  private actions$ = inject(Actions);
  private anchorService = inject(AnchorService);
  private walletService = inject(WalletService);

  loadKycUrl$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.loadKycUrl),
      mergeMap(() =>
        this.anchorService.getKycUrl().pipe(
          map((response) => AnchorActions.loadKycUrlSuccess({ url: response.url })),
          catchError((error) =>
            of(AnchorActions.loadKycUrlFailure({ error: error?.error?.message || error?.message || 'Failed to load KYC URL' })),
          ),
        ),
      ),
    ),
  );

  loadKycStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.loadKycStatus),
      mergeMap(() =>
        this.anchorService.getKycStatus().pipe(
          map((response) =>
            AnchorActions.loadKycStatusSuccess({
              status: response.status,
              localKycStatus: response.localKycStatus,
            }),
          ),
          catchError((error) =>
            of(AnchorActions.loadKycStatusFailure({ error: error?.error?.message || error?.message || 'Failed to load KYC status' })),
          ),
        ),
      ),
    ),
  );

  createQuote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.createQuote),
      mergeMap(({ fromCurrency, toCurrency, amount }) =>
        this.anchorService.createQuote({ fromCurrency, toCurrency, amount }).pipe(
          map((quote) => AnchorActions.createQuoteSuccess({ quote })),
          catchError((error) =>
            of(AnchorActions.createQuoteFailure({ error: error?.error?.message || error?.message || 'Failed to create quote' })),
          ),
        ),
      ),
    ),
  );

  createOnRamp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.createOnRamp),
      mergeMap(({ quoteId, amount, fromCurrency, toCurrency }) =>
        this.anchorService.createOnRamp({ quoteId, amount, fromCurrency, toCurrency }).pipe(
          map((order) => AnchorActions.createOnRampSuccess({ order })),
          catchError((error) =>
            of(AnchorActions.createOnRampFailure({ error: error?.error?.message || error?.message || 'Failed to create OnRamp order' })),
          ),
        ),
      ),
    ),
  );

  createOffRamp$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.createOffRamp),
      mergeMap(({ quoteId, amount, fromCurrency, toCurrency, fiatAccountId }) =>
        this.anchorService.createOffRamp({ quoteId, amount, fromCurrency, toCurrency, fiatAccountId }).pipe(
          map((order) => AnchorActions.createOffRampSuccess({ order })),
          catchError((error) =>
            of(AnchorActions.createOffRampFailure({ error: error?.error?.message || error?.message || 'Failed to create OffRamp order' })),
          ),
        ),
      ),
    ),
  );

  pollOrderStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.pollOrderStatus),
      mergeMap(({ orderId }) =>
        this.anchorService.getOrderStatus(orderId).pipe(
          map((order) => AnchorActions.pollOrderStatusSuccess({ order })),
          catchError((error) =>
            of(AnchorActions.pollOrderStatusFailure({ error: error?.error?.message || error?.message || 'Failed to poll order status' })),
          ),
        ),
      ),
    ),
  );

  loadFiatAccounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.loadFiatAccounts),
      mergeMap(() =>
        this.anchorService.getFiatAccounts().pipe(
          map((accounts) => AnchorActions.loadFiatAccountsSuccess({ accounts })),
          catchError((error) =>
            of(AnchorActions.loadFiatAccountsFailure({ error: error?.error?.message || error?.message || 'Failed to load fiat accounts' })),
          ),
        ),
      ),
    ),
  );

  loadUserOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.loadUserOrders),
      mergeMap(() =>
        this.anchorService.getUserOrders().pipe(
          map((orders) => AnchorActions.loadUserOrdersSuccess({ orders })),
          catchError((error) =>
            of(AnchorActions.loadUserOrdersFailure({ error: error?.error?.message || error?.message || 'Failed to load user orders' })),
          ),
        ),
      ),
    ),
  );

  simulatePayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.simulatePayment),
      mergeMap(({ orderId }) =>
        this.anchorService.simulatePayment(orderId).pipe(
          map((response) => AnchorActions.simulatePaymentSuccess({ status: response.status })),
          catchError((error) =>
            of(AnchorActions.simulatePaymentFailure({ error: error?.error?.message || error?.message || 'Failed to simulate payment' })),
          ),
        ),
      ),
    ),
  );

  signOffRampXdr$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnchorActions.signOffRampXdr),
      mergeMap(({ xdr }) =>
        this.walletService.signTransaction(xdr).then(
          (result) => AnchorActions.signOffRampXdrSuccess({ txHash: 'signed_and_submitted' }),
          (error) => AnchorActions.signOffRampXdrFailure({ error: error?.error?.message || error?.message || 'Failed to sign XDR' }),
        ),
      ),
    ),
  );
}
