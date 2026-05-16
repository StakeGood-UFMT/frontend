import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bottom-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-bar">
      <a routerLink="/landing" routerLinkActive="active" class="nav-item">
        <span class="icon">🏠</span>
      </a>
      <a routerLink="/arena" routerLinkActive="active" class="nav-item">
        <span class="icon">🏆</span>
      </a>
      <a routerLink="/gateway" routerLinkActive="active" class="nav-item">
        <span class="icon">💱</span>
      </a>
      <a routerLink="/profile" routerLinkActive="active" class="nav-item">
        <span class="icon">👤</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-bar {
      display: none;
      height: 64px;
      background: var(--surface-color);
      border-top: 1px solid rgba(0,0,0,0.05);
      justify-content: space-around;
      align-items: center;
      padding: 0 1rem;
      flex-shrink: 0;
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: var(--text-color);
      padding: 0.5rem;
    }
    .nav-item.active {
      color: var(--primary-color);
    }
    .icon {
      font-size: 1.5rem;
    }
    @media (max-width: 768px) {
      .bottom-bar {
        display: flex;
      }
    }
  `]
})
export class BottomBarComponent {}
