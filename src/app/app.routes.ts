import { Routes } from '@angular/router';
import { AppShellComponent } from './core/shell/app-shell/app-shell.component';

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
        loadComponent: () => import('./features/arena/arena.component').then(m => m.ArenaComponent) 
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) 
      },
    ]
  }
];
