import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletConnect } from '../../../shared/components/wallet-connect';
import { AuthService } from '../../services/auth.service';
import { UserNotificationsService } from '../../services/user-notifications.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, WalletConnect],
  template: `
    <header class="top-bar">
      <div class="logo" routerLink="/landing">
        <img src="/logo.png" alt="StakeGood Logo" class="brand-logo">
        <span class="brand-name">StakeGood</span>
      </div>
      
      <!-- Hamburger Menu Toggle (Mobile) -->
      <div class="mobile-menu">
        <button (click)="toggleMenu()" class="hamburger-btn">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
        
        <div *ngIf="isMenuOpen()" class="mobile-drawer-overlay" (click)="toggleMenu()">
          <div class="drawer" (click)="$event.stopPropagation()">
            <div class="drawer-header">
              <div class="drawer-brand">
                <img src="/logo.png" alt="StakeGood Logo" class="drawer-logo">
                <span class="drawer-brand-name">StakeGood</span>
              </div>
              <button (click)="toggleMenu()" class="close-btn">&times;</button>
            </div>
            
            <div class="drawer-content">
              <!-- Navigation Links -->
              <nav class="drawer-nav">
                <a routerLink="/landing" (click)="toggleMenu()" routerLinkActive="active" class="drawer-item">
                  <span class="icon">🏠</span>
                  <span class="label">Home</span>
                </a>
                <a routerLink="/arena" (click)="toggleMenu()" routerLinkActive="active" class="drawer-item">
                  <span class="icon">🏆</span>
                  <span class="label">Arena</span>
                </a>
                <a *ngIf="isLoggedIn()" routerLink="/profile" (click)="toggleMenu()" routerLinkActive="active" class="drawer-item">
                  <span class="icon">👤</span>
                  <span class="label">Profile</span>
                </a>
                <a *ngIf="isLoggedIn()" routerLink="/notifications" (click)="toggleMenu()" routerLinkActive="active" class="drawer-item">
                  <span class="icon">🔔</span>
                  <span class="label">Notifications</span>
                  <span *ngIf="unreadCount() > 0" class="badge">{{ unreadCount() }}</span>
                </a>
              </nav>

              <div class="drawer-divider"></div>

              <!-- Wallet Section -->
              <div class="wallet-section">
                <app-wallet-connect></app-wallet-connect>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .top-bar {
      height: 72px;
      padding: 0 2rem;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 4px 0;
    }
    .brand-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
      transition: transform 0.2s;
    }
    .brand-logo:hover {
      transform: scale(1.05);
    }
    .brand-name {
      font-size: 1.4rem;
      font-weight: 900;
      color: #0d1b15;
      letter-spacing: -0.03em;
      text-transform: uppercase;
    }
    .mobile-menu {
      display: none;
    }

    @media (max-width: 768px) {
      .mobile-menu {
        display: block;
      }

      /* Hamburger Styles */
      .hamburger-btn {
        background: none;
        border: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
        cursor: pointer;
        padding: 10px;
      }
      .bar {
        width: 28px;
        height: 3px;
        background-color: #111815;
        border-radius: 2px;
      }

      .mobile-drawer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(4px);
        z-index: 1000;
      }

      .drawer {
        position: absolute;
        top: 0;
        right: 0;
        width: 85%;
        max-width: 320px;
        height: 100%;
        background: #F6F8F7;
        box-shadow: -4px 0 20px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        animation: slideIn 0.3s ease-out;
      }

      .drawer-header {
        padding: 24px;
        background: #FFFFFF;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }

      .drawer-brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .drawer-logo {
        height: 36px;
        width: auto;
      }
      .drawer-brand-name {
        font-size: 1.2rem;
        font-weight: 900;
        color: #0d1b15;
        text-transform: uppercase;
        letter-spacing: -0.02em;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #9ca3af;
        line-height: 1;
      }

      .drawer-content {
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .drawer-nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .drawer-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        text-decoration: none;
        color: #4b5563;
        border-radius: 12px;
        font-weight: 600;
        transition: all 0.2s;
      }

      .drawer-item:hover, .drawer-item.active {
        background: #FFFFFF;
        color: #11D48A;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      }

      .drawer-item .icon {
        margin-right: 12px;
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

      .drawer-divider {
        height: 1px;
        background: rgba(0,0,0,0.05);
        margin: 10px 0;
      }

      .wallet-section {
        margin-top: auto;
        padding-bottom: 20px;
      }

      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
    }
  `]
})
export class TopBarComponent {
  public isMenuOpen = signal(false);
  private auth = inject(AuthService);
  private userNotificationsService = inject(UserNotificationsService);
  public isLoggedIn = this.auth.isLoggedIn;
  public unreadCount = this.userNotificationsService.unreadCount;

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }
}
