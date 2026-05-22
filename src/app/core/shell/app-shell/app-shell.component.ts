import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { AuthService } from '../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopBarComponent, SideBarComponent],
  template: `
    <div class="app-container">
      <app-top-bar></app-top-bar>
      <div class="layout-body">
        <app-side-bar></app-side-bar>
        <main class="main-content" [class.no-padding]="isLanding()">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      overflow: hidden;
    }
    .layout-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .main-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      background: #F6F8F7;
      transition: all 0.3s ease;
    }
    .main-content.no-padding {
      padding: 0;
    }
    @media (max-width: 768px) {
      .main-content {
        padding: 0.75rem;
      }
    }
  `]
})
export class AppShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  public isLoggedIn = this.auth.isLoggedIn;
  public isLanding = toSignal(
    this.router.events.pipe(map(() => this.router.url === '/landing' || this.router.url === '/')),
    { initialValue: this.router.url === '/landing' || this.router.url === '/' }
  );
}
