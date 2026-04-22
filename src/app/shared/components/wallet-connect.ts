import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';

@Component({
  selector: 'app-wallet-connect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wallet-container">
      <button 
        (click)="handleAction()" 
        [disabled]="isConnecting()" 
        [class]="buttonClass()"
        class="connect-button"
      >
        <span *ngIf="!isConnecting() && !isLoggedIn()">Connect Wallet</span>
        <span *ngIf="isConnecting()">Checking wallet...</span>
        <span *ngIf="isLoggedIn()">{{ shortAddress() }}</span>
      </button>
      
      <button *ngIf="isLoggedIn()" (click)="logout()" class="logout-button">
        Logout
      </button>

      <div *ngIf="errorMessage()" class="error-message">
        {{ errorMessage() }}
      </div>
    </div>
  `,
  styles: [`
    .wallet-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .connect-button {
      background-color: #11D48A;
      color: #111815;
      border: none;
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 160px;
    }

    .connect-button:hover:not(:disabled) {
      filter: brightness(0.9);
      transform: translateY(-1px);
    }

    .connect-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .button-connected {
      background-color: #f0fdf4;
      border: 1px solid #11D48A;
      color: #111815;
    }

    .logout-button {
      background: transparent;
      border: none;
      color: #CC5A37;
      font-size: 12px;
      cursor: pointer;
      text-decoration: underline;
    }

    .error-message {
      color: #CC5A37;
      font-size: 12px;
      background: #fef2f2;
      padding: 4px 8px;
      border-radius: 4px;
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
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  });

  public buttonClass = computed(() => {
    return this.isLoggedIn() ? 'button-connected' : '';
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
