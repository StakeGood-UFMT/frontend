import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { API_CONFIG } from '../config/api.config';
import { catchError, switchMap, throwError, Observable, from } from 'rxjs';

/**
 * Interceptor responsible for handling token refresh.
 * It intercepts 401 Unauthorized errors and attempts to refresh the token.
 */
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!req.url.startsWith(API_CONFIG.baseUrl)) return throwError(() => error);
      if (req.url.startsWith(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.base}`)) return throwError(() => error);

      if (error.status === 401) {
        return from(authService.refresh()).pipe(
          switchMap(() => next(req)), // ← só repete o request, sem header
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
