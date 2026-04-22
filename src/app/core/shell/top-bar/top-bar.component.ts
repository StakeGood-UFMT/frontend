import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-bar">
      <div class="logo">
        <span class="brand">StakeGood</span>
      </div>
      <div class="actions">
        <button *ngIf="!walletService.address()" (click)="walletService.connect()" class="btn-primary">
          Connect Wallet
        </button>
        <div *ngIf="walletService.address()" class="wallet-info">
          {{ walletService.address() }}
        </div>
      </div>
    </header>
  `,
  styles: [`
    .top-bar {
      height: 64px;
      padding: 0 1.5rem;
      background: var(--surface-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .btn-primary {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius-sm);
      font-weight: 600;
      cursor: pointer;
    }
    .wallet-info {
      font-size: 0.875rem;
      font-family: monospace;
      padding: 0.5rem 1rem;
      background: var(--bg-color);
      border-radius: var(--border-radius-sm);
    }
  `]
})
export class TopBarComponent {
  walletService = inject(WalletService);
}
