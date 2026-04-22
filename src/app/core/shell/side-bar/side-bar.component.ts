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
    :host {
      display: block;
      height: 100%;
    }
    .side-bar {
      width: 240px;
      height: 100%;
      background: var(--surface-color);
      border-right: 1px solid rgba(0,0,0,0.05);
      padding: 1rem 0.75rem;
      overflow-y: auto;
    }
    .nav-links {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .nav-links li {
      margin: 0;
      padding: 0;
    }
    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      text-decoration: none;
      color: var(--text-color);
      border-radius: var(--border-radius-sm);
      transition: background 0.2s;
      line-height: 1.2;
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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
    }
    @media (max-width: 768px) {
      .side-bar {
        display: none;
      }
    }
  `]
})
export class SideBarComponent {}
