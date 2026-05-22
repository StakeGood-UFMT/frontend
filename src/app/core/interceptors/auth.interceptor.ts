import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { API_CONFIG } from '../config/api.config';
import { catchError, switchMap, throwError, Observable, from } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

/**
 * Interceptor responsible for adding the Authorization header to outgoing requests.
 * Also handles proactive token refresh if the token is close to expiring.
 */export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  
  // só intercepta requests da nossa API
  if (!req.url.startsWith(API_CONFIG.baseUrl)) {
    return next(req);
  }

  // adiciona withCredentials para o browser enviar o cookie automaticamente
  const authReq = req.clone({ withCredentials: true });
  return next(authReq);
};