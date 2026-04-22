import { Routes } from '@angular/router';
import { AppShellComponent } from './core/shell/app-shell/app-shell.component';
import { authGuard } from './core/guards/auth.guard';
import { termsGuard } from './core/guards/terms.guard';
import { kycGuard } from './core/guards/kyc.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'landing', pathMatch: 'full' },
      { 
        path: 'landing', 
        loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) 
      },
      { 
        path: 'arena', 
        canActivate: [authGuard, termsGuard, kycGuard],
        loadComponent: () => import('./features/arena/arena.component').then(m => m.ArenaComponent) 
      },
      {
        path: 'arena/:id',
        canActivate: [authGuard, termsGuard, kycGuard],
        loadComponent: () => import('./features/arena/market-detail/market-detail.component').then(m => m.MarketDetailComponent)
      },
      { 
        path: 'profile', 
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) 
      },
      {
        path: 'onboarding/kyc',
        loadComponent: () => import('./features/onboarding/kyc/kyc.component').then(m => m.KycComponent)
      },
      {
        path: 'onboarding/terms',
        loadComponent: () => import('./features/onboarding/terms/terms.component').then(m => m.TermsComponent)
      }
    ]
  }
];
