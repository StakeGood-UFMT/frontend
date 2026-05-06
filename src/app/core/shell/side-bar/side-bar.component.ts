import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WalletConnect } from '../../../shared/components/wallet-connect';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectIsAdmin } from '../../store/auth/auth.selectors';
import { UserNotificationsService } from '../../services/user-notifications.service';

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
          <li>
            <a routerLink="/impact/ledger" routerLinkActive="active" class="nav-item">
              <span class="icon">📊</span>
              <span class="label">Impact Ledger</span>
            </a>
          </li>
          <li>
            <a routerLink="/ngos" routerLinkActive="active" class="nav-item">
              <span class="icon">🌍</span>
              <span class="label">NGO Directory</span>
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
          <li *ngIf="isLoggedIn()">
            <a routerLink="/settings" routerLinkActive="active" class="nav-item">
              <span class="icon">⚙️</span>
              <span class="label">Settings</span>
            </a>
          </li>
          <li *ngIf="isLoggedIn()">
            <a routerLink="/notifications" routerLinkActive="active" class="nav-item">
              <span class="icon">🔔</span>
              <span class="label">Notifications</span>
              <span *ngIf="unreadCount() > 0" class="badge">{{ unreadCount() }}</span>
            </a>
          </li>

          <!-- Admin Section -->
          <li *ngIf="isAdmin()" class="admin-nav-group">
            <div class="nav-divider"></div>
            <div class="nav-section-title">Admin Operations</div>
            <a routerLink="/admin/keeper" routerLinkActive="active" class="nav-item">
              <span class="icon">⚙️</span>
              <span class="label">Keeper TTL</span>
            </a>
            <a routerLink="/admin/markets" routerLinkActive="active" class="nav-item">
              <span class="icon">🏢</span>
              <span class="label">Market Admin</span>
            </a>
            <a routerLink="/admin/proposals" routerLinkActive="active" class="nav-item">
              <span class="icon">📝</span>
              <span class="label">Proposal Moderation</span>
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
    .badge {
      margin-left: auto;
      background: #11D48A;
      color: white;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.1rem 0.4rem;
      border-radius: 99px;
      min-width: 1.25rem;
      text-align: center;
    }
    .sidebar-footer {
      padding-top: 2rem;
      border-top: 1px solid rgba(0,0,0,0.05);
    }
    .nav-divider {
      height: 1px;
      background: rgba(0,0,0,0.05);
      margin: 1.5rem 1rem 1rem;
    }
    .nav-section-title {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0 1rem 0.5rem;
    }
    .admin-nav-group .nav-item:hover {
      background: rgba(16, 185, 129, 0.08);
      color: #10b981;
    }
    .admin-nav-group .nav-item.active {
      color: #10b981;
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
  private store = inject(Store);
  private userNotificationsService = inject(UserNotificationsService);
  
  public isLoggedIn = this.auth.isLoggedIn;
  public isAdmin = toSignal(this.store.select(selectIsAdmin), { initialValue: false });
  public unreadCount = this.userNotificationsService.unreadCount;
}
