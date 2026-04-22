import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectKycStatus } from '../store/auth/auth.selectors';

export const kycGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectKycStatus).pipe(
    take(1),
    map((kycStatus) => {
      if (kycStatus === 'approved') {
        return true;
      }
      return router.createUrlTree(['/onboarding/kyc']);
    })
  );
};
