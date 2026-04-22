import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MarketService } from '../../services/market.service';
import * as MarketActions from './market.actions';

@Injectable()
export class MarketEffects {
  private actions$ = inject(Actions);
  private marketService = inject(MarketService);

  loadMarket$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketActions.loadMarket),
      switchMap(({ id }) =>
        this.marketService.getMarket(id).pipe(
          map((market) => MarketActions.loadMarketSuccess({ market })),
          catchError((error) =>
            of(MarketActions.loadMarketFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketActions.loadHistory),
      switchMap(({ id, range }) =>
        this.marketService.getMarketHistory(id, range).pipe(
          map((history) => MarketActions.loadHistorySuccess({ history })),
          catchError((error) =>
            of(MarketActions.loadHistoryFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
