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
        <button *ngIf="!(walletService.publicKey$ | async)" (click)="walletService.connect()" class="btn-primary">
          Connect Wallet
        </button>
        
        <div *ngIf="walletService.publicKey$ | async as address" class="wallet-container">
          <div class="wallet-info">
            <span class="status-dot"></span>
            {{ address | slice:0:6 }}...{{ address | slice:-4 }}
          </div>
          <button (click)="walletService.disconnect()" class="btn-disconnect" title="Disconnect">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .top-bar {
      height: 72px;
      padding: 0 2rem;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      background: linear-gradient(135deg, var(--primary-color), #0eb878);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .btn-primary {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: var(--border-radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(17, 212, 138, 0.2);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(17, 212, 138, 0.3);
      background: #0eb878;
    }
    .wallet-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--bg-color);
      padding: 0.5rem;
      padding-left: 1rem;
      border-radius: var(--border-radius-sm);
      border: 1px solid rgba(0,0,0,0.05);
    }
    .wallet-info {
      font-size: 0.875rem;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-color);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--primary-color);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--primary-color);
    }
    .btn-disconnect {
      background: rgba(0,0,0,0.05);
      border: none;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      cursor: pointer;
      color: #666;
      transition: all 0.2s ease;
    }
    .btn-disconnect:hover {
      background: #fee2e2;
      color: #ef4444;
    }
  `]
})
export class TopBarComponent {
  walletService = inject(WalletService);
}
