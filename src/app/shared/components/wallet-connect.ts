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
            <span class="address">{{ shortAddress() }}</span>
          </div>
        </div>
        
        <button (click)="logout()" class="logout-btn" title="Sign Out">
          <span class="logout-icon">🚪</span>
          Logout
        </button>
      </div>

      <!-- Powered by Stellar Badge -->
      <div *ngIf="isLoggedIn()" class="stellar-badge-small">
        <span class="badge-dot"></span>
        Powered by Stellar Network
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
      border-radius: 20px;
      padding: 16px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: #f0fdf4;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(17, 212, 138, 0.2);
    }

    .avatar-icon {
      font-size: 20px;
    }

    .details {
      display: flex;
      flex-direction: column;
    }

    .addr-label {
      font-size: 0.7rem;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .address {
      font-size: 0.9rem;
      color: #111815;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
    }

    /* Logout Button Styles */
    .logout-btn {
      width: 100%;
      background: #FEF2F2;
      color: #CC5A37;
      border: none;
      padding: 10px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      background: #FEE2E2;
      color: #B91C1C;
    }

    .logout-icon {
      font-size: 16px;
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
      gap: 8px;
      background: rgba(17, 212, 138, 0.08);
      color: #0a8a57;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      width: fit-content;
      margin: 4px auto 0;
    }

    .badge-dot {
      width: 7px;
      height: 7px;
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
  private auth = inject(AuthService);
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
