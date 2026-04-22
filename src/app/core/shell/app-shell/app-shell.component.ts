import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopBarComponent, SideBarComponent],
  template: `
    <div class="app-container">
      <app-top-bar></app-top-bar>
      <div class="layout-body">
        <app-side-bar></app-side-bar>
        <main class="main-content">
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
    .full-width {
      padding: 0;
    }
  `]
})
export class AppShellComponent {
  private auth = inject(AuthService);
  public isLoggedIn = this.auth.isLoggedIn;
}
