import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WalletConnect } from '../../../shared/components/wallet-connect';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, WalletConnect],
  template: `
    <nav class="side-bar">
      <div class="nav-content">
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
          <li *ngIf="isLoggedIn()">
            <a routerLink="/voting" routerLinkActive="active" class="nav-item">
              <span class="icon">🗳️</span>
              <span class="label">Voting</span>
            </a>
          </li>
          <li *ngIf="isLoggedIn()">
            <a routerLink="/profile" routerLinkActive="active" class="nav-item">
              <span class="icon">👤</span>
              <span class="label">Profile</span>
            </a>
          </li>
        </ul>
      </div>

      <div class="sidebar-footer">
        <app-wallet-connect></app-wallet-connect>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .side-bar {
      width: 260px;
      height: 100%;
      background: #F6F8F7;
      border-right: 1px solid rgba(0,0,0,0.05);
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .nav-links {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.85rem 1rem;
      text-decoration: none;
      color: #4b5563;
      border-radius: 12px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .nav-item:hover {
      background: rgba(17, 212, 138, 0.08);
      color: #11D48A;
      transform: translateX(4px);
    }
    .nav-item.active {
      background: #FFFFFF;
      color: #11D48A;
      font-weight: 700;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .icon {
      margin-right: 1rem;
      font-size: 1.25rem;
    }
    .sidebar-footer {
      padding-top: 2rem;
      border-top: 1px solid rgba(0,0,0,0.05);
    }
    @media (max-width: 768px) {
      .side-bar {
        display: none;
      }
    }
  `]
})
export class SideBarComponent {
  private auth = inject(AuthService);
  public isLoggedIn = this.auth.isLoggedIn;
}
