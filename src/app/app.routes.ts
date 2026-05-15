import { Routes } from '@angular/router';
import { AppShellComponent } from './core/shell/app-shell/app-shell.component';
import { authGuard } from './core/guards/auth.guard';
import { termsGuard } from './core/guards/terms.guard';
import { kycGuard } from './core/guards/kyc.guard';
import { adminGuard } from './core/guards/admin.guard';

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
        path: 'help',
        loadComponent: () => import('./features/static/pages/help-center/help-center.component').then(m => m.HelpCenterComponent)
      },
      {
        path: 'terms',
        loadComponent: () => import('./features/static/pages/terms/terms.component').then(m => m.TermsComponent)
      },
      { 
        path: 'arena', 
        loadComponent: () => import('./features/arena/arena.component').then(m => m.ArenaComponent) 
      },
      {
        path: 'arena/:id',
        loadComponent: () => import('./features/arena/market-detail/market-detail.component').then(m => m.MarketDetailComponent)
      },
      { 
        path: 'profile', 
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) 
      },
      {
        path: 'claims',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/claims-tab/claims-page.component').then(m => m.ClaimsPageComponent)
      },
      {
        path: 'onboarding/kyc',
        loadComponent: () => import('./features/onboarding/kyc/kyc.component').then(m => m.KycComponent)
      },
      {
        path: 'onboarding/terms',
        loadComponent: () => import('./features/onboarding/terms/terms.component').then(m => m.TermsComponent)
      },
      {
        path: 'proposals/new',
        canActivate: [authGuard, kycGuard],
        loadComponent: () => import('./features/proposals/pages/propose-market/propose-market.component').then(m => m.ProposeMarketComponent)
      },
      {
        path: 'voting',
        canActivate: [authGuard],
        loadComponent: () => import('./features/voting/voting.component').then(m => m.VotingPage)
      },
      {
        path: 'impact/ledger',
        loadComponent: () => import('./features/impact/ledger/impact-ledger.component').then(m => m.ImpactLedgerPage)
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsPage)
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./features/leaderboard/leaderboard.page').then(m => m.LeaderboardPage)
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsPage)
      },
      {
        path: 'ngos',
        loadComponent: () => import('./features/ngos/pages/ngo-directory/ngo-directory.component').then(m => m.NgoDirectoryPage)
      },
      {
        path: 'ngos/:id',
        loadComponent: () => import('./features/ngos/pages/ngo-profile/ngo-profile.component').then(m => m.NgoProfilePage)
      },
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      }
    ]
  }
  ,
  // Wildcard route for 404 - placed at root level to catch unknown routes
  { path: '**', loadComponent: () => import('./features/static/pages/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
