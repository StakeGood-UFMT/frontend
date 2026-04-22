import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { API_CONFIG } from '../config/api.config';
import { catchError, switchMap, throwError, Observable, from } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

/**
 * Interceptor responsible for adding the Authorization header to outgoing requests.
 * Also handles proactive token refresh if the token is close to expiring.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  // Only intercept requests to our API
  if (!req.url.startsWith(API_CONFIG.baseUrl)) {
    return next(req);
  }

  // If it's an auth request, skip adding headers
  if (req.url.startsWith(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.base}`)) {
    return next(req);
  }

  // Proactive check: if token exists and is about to expire (< 5 min), refresh it
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      const expirationTime = decoded.exp * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expirationTime - now < fiveMinutes) {
        console.log('[AuthInterceptor] Token expires soon. Proactively refreshing...');
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

  // Normal request: add token if available
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq);
};
