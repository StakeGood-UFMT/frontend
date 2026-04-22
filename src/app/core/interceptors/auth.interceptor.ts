import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, Observable, from } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  // If it's an auth request, skip intercepting
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  // Check if token needs refresh (< 5 min)
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      const expirationTime = decoded.exp * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expirationTime - now < fiveMinutes) {
        console.log('[AuthInterceptor] Token expires soon. Triggering automatic refresh...');
        // Token is about to expire, refresh it first
        return from(authService.refresh()).pipe(
          switchMap((newToken) => {
            const authReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(authReq);
          }),
          catchError((err) => {
            authService.logout();
            return throwError(() => err);
          })
        );
      }
    } catch (e) {
      console.error('[AuthInterceptor] Error decoding token', e);
    }
  }

  // Normal request with token
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized, attempt refresh
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
