import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';

@Component({
  selector: 'app-wallet-connect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wallet-wrapper">
      <!-- NOT LOGGED IN -->
      <button 
        *ngIf="!isLoggedIn()"
        (click)="handleAction()" 
        [disabled]="isConnecting()" 
        class="connect-btn"
        [class.loading]="isConnecting()"
      >
        <div class="btn-content">
          <span class="icon" *ngIf="!isConnecting()">⚡</span>
          <span class="loader" *ngIf="isConnecting()"></span>
          <span class="label">{{ isConnecting() ? 'Connecting...' : 'Connect Wallet' }}</span>
        </div>
      </button>

      <!-- LOGGED IN -->
      <div *ngIf="isLoggedIn()" class="profile-card">
        <div class="user-info">
          <div class="avatar">
            <span class="avatar-icon">🛡️</span>
          </div>
          <div class="details">
            <span class="addr-label">Connected Wallet</span>
            <span class="address" [title]="auth.profile()?.public_key">{{ shortAddress() }}</span>
          </div>
          <button (click)="logout()" class="logout-icon-btn" title="Sign Out">
            <svg class="logout-svg" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Powered by Stellar Badge -->
      <div *ngIf="isLoggedIn()" class="stellar-badge-small">
        <span class="badge-dot"></span>
        Powered by Stellar
      </div>

      <!-- ERROR MESSAGE -->
      <div *ngIf="errorMessage()" class="error-toast">
        {{ errorMessage() }}
      </div>
    </div>
  `,
  styles: [`
    .wallet-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Connect Button Styles */
    .connect-btn {
      width: 100%;
      background: linear-gradient(135deg, #11D48A 0%, #0BB574 100%);
      color: #111815;
      border: none;
      padding: 14px;
      border-radius: 16px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(17, 212, 138, 0.2);
    }

    .connect-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(17, 212, 138, 0.3);
      filter: brightness(1.05);
    }

    .connect-btn:active {
      transform: translateY(0);
    }

    .connect-btn:disabled {
      opacity: 0.8;
      cursor: not-allowed;
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    /* Profile Card Styles */
    .profile-card {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 10px 12px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 32px;
      height: 32px;
      background: #f0fdf4;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(17, 212, 138, 0.15);
      flex-shrink: 0;
    }

    .avatar-icon {
      font-size: 16px;
    }

    .details {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      min-width: 0;
    }

    .addr-label {
      font-size: 0.65rem;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-weight: 600;
      line-height: 1.2;
    }

    .address {
      font-size: 0.8rem;
      color: #111815;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Logout Icon Button Styles */
    .logout-icon-btn {
      background: #FEF2F2;
      color: #CC5A37;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .logout-icon-btn:hover {
      background: #FEE2E2;
      color: #B91C1C;
    }

    .logout-icon {
      font-size: 14px;
    }

    /* Loader */
    .loader {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(17, 212, 138, 0.3);
      border-top: 2px solid #111815;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Error Toast */
    .error-toast {
      background: #FEF2F2;
      color: #CC5A37;
      font-size: 11px;
      padding: 8px 12px;
      border-radius: 10px;
      border-left: 3px solid #CC5A37;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Stellar Badge Styles */
    .stellar-badge-small {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #94a3b8;
      font-size: 0.65rem;
      font-weight: 500;
      width: 100%;
      margin-top: 4px;
      text-align: center;
    }

    .badge-dot {
      width: 5px;
      height: 5px;
      background: #11D48A;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.8); }
    }
  `]
})
export class WalletConnect {
  public auth = inject(AuthService);
  private wallet = inject(WalletService);

  public isLoggedIn = this.auth.isLoggedIn;
  public isConnecting = this.wallet.isConnecting;
  public errorMessage = signal<string | null>(null);

  public shortAddress = computed(() => {
    const profile = this.auth.profile();
    if (!profile) return '';
    const addr = profile.public_key;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  });

  async handleAction() {
    if (this.isLoggedIn()) return;
    
    this.errorMessage.set(null);
    try {
      await this.auth.login();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to connect wallet');
    }
  }

  logout() {
    this.auth.logout();
  }
}
