import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectTermsAccepted } from '../store/auth/auth.selectors';

export const termsGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectTermsAccepted).pipe(
    take(1),
    map((termsAccepted) => {
      if (termsAccepted === true) {
        return true;
      }
      return router.createUrlTree(['/onboarding/terms']);
    })
  );
};
