import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { authRefreshInterceptor } from './core/interceptors/auth-refresh.interceptor';
import { mockAuthInterceptor } from './core/interceptors/mock-auth.interceptor';
import { mockMarketInterceptor } from './core/interceptors/mock-market.interceptor';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { authReducer } from './core/store/auth/auth.reducer';
import { AuthEffects } from './core/store/auth/auth.effects';
import { marketReducer } from './core/store/market/market.reducer';
import { MarketEffects } from './core/store/market/market.effects';

export const appConfig: ApplicationConfig = {
  providers: [

    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors(
      environment.useMock 
        ? [mockAuthInterceptor, mockMarketInterceptor, authRefreshInterceptor, authInterceptor] 
        : [authRefreshInterceptor, authInterceptor]
    )),
    provideStore({ 
      auth: authReducer,
      market: marketReducer 
    }),
    provideEffects([AuthEffects, MarketEffects])
  ]
};
