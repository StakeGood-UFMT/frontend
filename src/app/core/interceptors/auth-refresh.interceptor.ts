import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { API_CONFIG } from '../config/api.config';
import { catchError, switchMap, throwError, Observable, from } from 'rxjs';

/**
 * Interceptor responsible for handling token refresh.
 * It intercepts 401 Unauthorized errors and attempts to refresh the token.
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If it's an auth request itself, don't try to refresh (avoid infinite loops)
      if (req.url.includes(API_CONFIG.endpoints.auth.base)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        console.log('[AuthRefreshInterceptor] 401 Unauthorized detected. Attempting token refresh...');
        return from(authService.refresh()).pipe(
          switchMap((newToken) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
