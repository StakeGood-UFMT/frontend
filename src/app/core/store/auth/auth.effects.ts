import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { tap, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { AuthStorageService } from '../../services/auth-storage.service';
import { selectAuthState } from './auth.selectors';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authStorage = inject(AuthStorageService);
  private router = inject(Router);
  private store = inject(Store);

  saveState$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.logout, AuthActions.updateProfile),
        withLatestFrom(this.store.select(selectAuthState)),
        tap(([action, state]) => {
          this.authStorage.save(state);
        })
      ),
    { dispatch: false }
  );

  logoutRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.authStorage.clear();
          this.router.navigate(['/landing']);
        })
      ),
    { dispatch: false }
  );
}
