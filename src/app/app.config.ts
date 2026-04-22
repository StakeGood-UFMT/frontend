import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { mockAuthInterceptor } from './core/interceptors/mock-auth.interceptor';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { authReducer } from './core/store/auth/auth.reducer';
import { AuthEffects } from './core/store/auth/auth.effects';

export const appConfig: ApplicationConfig = {
  providers: [

    provideRouter(routes),
    provideHttpClient(withInterceptors(
      environment.useMock 
        ? [mockAuthInterceptor, authInterceptor] 
        : [authInterceptor]
    )),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects])
  ]
};
