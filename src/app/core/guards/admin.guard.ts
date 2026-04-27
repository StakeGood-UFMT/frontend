import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectRole } from '../store/auth/auth.selectors';

export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectRole).pipe(
    take(1),
    map((role) => {
      if (role === 'admin') {
        return true;
      }
      console.warn('[AdminGuard] Access denied. Role is:', role);
      return router.createUrlTree(['/landing']);
    })
  );
};
