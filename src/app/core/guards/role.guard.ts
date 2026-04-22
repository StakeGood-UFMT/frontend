import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectRole } from '../store/auth/auth.selectors';

export const roleGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  // Expected role can be passed via route data, e.g. { data: { expectedRole: 'admin' } }
  const expectedRole = route.data['expectedRole'];

  return store.select(selectRole).pipe(
    take(1),
    map((role) => {
      if (!expectedRole || role === expectedRole) {
        return true;
      }
      return router.createUrlTree(['/unauthorized']);
    })
  );
};
