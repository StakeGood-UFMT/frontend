import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="side-bar">
      <ul class="nav-links">
        <li>
          <a routerLink="/landing" routerLinkActive="active" class="nav-item">
            <span class="icon">🏠</span>
            <span class="label">Home</span>
          </a>
        </li>
        <li>
          <a routerLink="/arena" routerLinkActive="active" class="nav-item">
            <span class="icon">🏆</span>
            <span class="label">Arena</span>
          </a>
        </li>
        <li>
          <a routerLink="/profile" routerLinkActive="active" class="nav-item">
            <span class="icon">👤</span>
            <span class="label">Profile</span>
          </a>
        </li>
      </ul>
    </nav>
  `,
  styles: [`
    .side-bar {
      width: 240px;
      height: calc(100vh - 64px);
      background: var(--surface-color);
      border-right: 1px solid rgba(0,0,0,0.05);
      padding: 1rem;
    }
    .nav-links {
      list-style: none;
    }
    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: var(--text-color);
      border-radius: var(--border-radius-sm);
      margin-bottom: 0.5rem;
      transition: background 0.2s;
    }
    .nav-item:hover {
      background: rgba(17, 212, 138, 0.1);
    }
    .nav-item.active {
      background: rgba(17, 212, 138, 0.15);
      color: var(--primary-color);
      font-weight: 600;
    }
    .icon {
      margin-right: 0.75rem;
      font-size: 1.25rem;
    }
    @media (max-width: 768px) {
      .side-bar {
        display: none;
      }
    }
  `]
})
export class SideBarComponent {}
