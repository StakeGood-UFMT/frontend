import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export const mockAuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  // Only intercept if the URL matches the full auth base path (including version)
  if (!req.url.startsWith(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.base}`)) {
    return next(req);
  }

  console.log(`[MockAuthInterceptor] Intercepting ${req.method} ${req.url}`);

  // 1. GET /nonce
  if (req.method === 'GET' && req.url === `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.nonce}`) {
    const wallet = req.params.get('wallet') || 'unknown';
    return of(new HttpResponse({
      status: 200,
      body: { 
        nonce: `mock-nonce-for-${wallet}-${Date.now()}`,
        expires_at: new Date(Date.now() + 300000).toISOString(),
        ttl_seconds: 300
      }
    })).pipe(delay(500));
  }

  // 2. POST /verify
  if (req.method === 'POST' && req.url === `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.verify}`) {
    const body: any = req.body;
    // Create a mock JWT (header.payload.signature)
    const payload = btoa(JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      public_key: body.wallet
    }));
    const mockToken = `header.${payload}.signature`;

    return of(new HttpResponse({
      status: 200,
      body: {
        jwt: mockToken,
        wallet: body.wallet || 'GA...MOCK',
        kyc_status: 'none',
        kyc_tier: 0,
        expires_in: 3600,
        user: {
          id: 'mock-uuid',
          primary_wallet: body.wallet || 'GA...MOCK',
          role: 'user',
          public_visibility: true
        }
      }
    })).pipe(delay(800));
  }

  // 3. POST /refresh
  if (req.method === 'POST' && req.url === `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.refresh}`) {
    const payload = btoa(JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 3600,
      public_key: 'GA...MOCK'
    }));
    const mockToken = `header.${payload}.signature`;

    return of(new HttpResponse({
      status: 200,
      body: {
        jwt: mockToken,
        wallet: 'GA...MOCK',
        kyc_status: 'none',
        kyc_tier: 0,
        expires_in: 3600,
        user: {
          id: 'mock-uuid',
          primary_wallet: 'GA...MOCK',
          role: 'user',
          public_visibility: true
        }
      }
    })).pipe(delay(500));
  }

  return next(req);
};
