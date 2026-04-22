import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { BottomBarComponent } from '../bottom-bar/bottom-bar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopBarComponent, SideBarComponent, BottomBarComponent],
  template: `
    <div class="app-container">
      <app-top-bar></app-top-bar>
      <div class="layout-body">
        <app-side-bar></app-side-bar>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-bottom-bar></app-bottom-bar>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .layout-body {
      display: flex;
      flex: 1;
    }
    .main-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      background: var(--bg-color);
      margin-bottom: 0;
    }
    @media (max-width: 768px) {
      .main-content {
        margin-bottom: 64px; /* Space for bottom bar */
      }
    }
  `]
})
export class AppShellComponent {}
