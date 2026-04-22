import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

export const mockAuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  // Only intercept if the URL contains /api/v1/auth/
  if (!req.url.includes('/api/v1/auth/')) {
    return next(req);
  }

  console.log(`[MockAuthInterceptor] Intercepting ${req.method} ${req.url}`);

  // 1. GET /nonce
  if (req.method === 'GET' && req.url.endsWith('/auth/nonce')) {
    const wallet = req.params.get('wallet') || 'unknown';
    return of(new HttpResponse({
      status: 200,
      body: { 
        nonce: `mock-nonce-for-${wallet}-${Date.now()}` 
      }
    })).pipe(delay(500));
  }

  // 2. POST /verify
  if (req.method === 'POST' && req.url.endsWith('/auth/verify')) {
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
        access_token: mockToken,
        refresh_token: 'mock-refresh-token',
        profile: {
          public_key: body.wallet || 'GA...MOCK',
          role: 'user',
          kyc_status: 'not_started',
          terms_accepted: false
        }
      }
    })).pipe(delay(800));
  }

  // 3. POST /refresh
  if (req.method === 'POST' && req.url.endsWith('/auth/refresh')) {
    const payload = btoa(JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 3600,
      public_key: 'GA...MOCK'
    }));
    const mockToken = `header.${payload}.signature`;

    return of(new HttpResponse({
      status: 200,
      body: {
        access_token: mockToken,
        refresh_token: 'mock-refreshed-refresh-token',
        profile: {
          public_key: 'GA...MOCK',
          role: 'user',
          kyc_status: 'not_started',
          terms_accepted: false
        }
      }
    })).pipe(delay(500));
  }

  return next(req);
};
