import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinkedWallet } from '../../../../core/models/settings.model';

@Component({
  selector: 'app-linked-wallets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wallets-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Linked Wallets</h2>
          <p class="section-sub">Manage your connected Stellar wallets</p>
        </div>
        <button class="btn-add" id="btn-add-wallet" (click)="showAddInput.set(true)" *ngIf="!showAddInput()">
          + Add Wallet
        </button>
      </div>

      <!-- Add wallet input -->
      <div class="add-wallet-form" *ngIf="showAddInput()">
        <label for="input-new-wallet" class="sr-only">Stellar public key</label>
        <input
          id="input-new-wallet"
          class="wallet-input"
          type="text"
          aria-label="Stellar public key"
          placeholder="Enter Stellar public key (G...)"
          [(ngModel)]="newAddress"
          [ngModelOptions]="{standalone: true}" />
        <div class="add-actions">
          <button class="btn-confirm" id="btn-confirm-add-wallet" (click)="confirmAdd()" [disabled]="!newAddress.trim()">
            Confirm
          </button>
          <button class="btn-cancel" id="btn-cancel-add-wallet" (click)="cancelAdd()">Cancel</button>
        </div>
      </div>

      <!-- Wallets list -->
      <div class="wallets-list">
        <div class="wallet-item" *ngFor="let w of wallets(); let i = index">
          <div class="wallet-left">
            <span class="wallet-avatar">🔑</span>
            <div>
              <div class="wallet-address">{{ formatAddress(w.address) }}</div>
              <div class="wallet-meta">
                <span class="badge-primary" *ngIf="w.isPrimary">Primary</span>
                <span class="wallet-date">Linked {{ w.linkedAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>
          <button
            class="btn-remove"
            [id]="'btn-remove-wallet-' + i"
            [disabled]="!canRemove() || w.isPrimary"
            (click)="requestRemove(w)"
            [title]="!canRemove() ? 'Cannot remove last wallet' : 'Remove wallet'">
            🗑️
          </button>
        </div>

        <div class="wallet-empty" *ngIf="wallets().length === 0">
          No wallets linked yet.
        </div>
      </div>

      <!-- Confirm Delete Modal -->
      <div class="modal-overlay" *ngIf="pendingRemove()">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-msg" tabindex="-1">
          <div class="modal-icon">⚠️</div>
          <h3 id="modal-title">Remove Wallet?</h3>
          <p class="modal-addr">{{ formatAddress(pendingRemove()!.address) }}</p>
          <p id="modal-msg" class="modal-msg">This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-danger" id="btn-confirm-remove-wallet" (click)="confirmRemove()">Remove</button>
            <button class="btn-ghost"  id="btn-cancel-remove-wallet"  (click)="pendingRemove.set(null)">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallets-section { display: flex; flex-direction: column; gap: 1.25rem; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title { font-size: 1.1rem; font-weight: 800; color: #111827; margin: 0 0 0.2rem 0; }
    .section-sub   { font-size: 0.82rem; color: #6B7280; margin: 0; }

    .btn-add {
      background: linear-gradient(135deg, #11D48A, #0fb87a);
      color: white; border: none; border-radius: 10px;
      padding: 0.5rem 1.1rem; font-size: 0.85rem; font-weight: 700;
      cursor: pointer; transition: opacity 0.2s;
    }
    .btn-add:hover { opacity: 0.88; }

    .add-wallet-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .wallet-input {
      width: 100%; padding: 0.7rem 1rem;
      border: 1.5px solid #E5E7EB; border-radius: 10px;
      font-size: 0.9rem; outline: none; font-family: monospace;
      transition: border-color 0.2s; box-sizing: border-box;
    }
    .wallet-input:focus { border-color: #11D48A; }
    .add-actions { display: flex; gap: 0.5rem; }
    .btn-confirm {
      background: #11D48A; color: white; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 700; cursor: pointer;
    }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel {
      background: #F3F4F6; color: #374151; border: none; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
    }

    .wallets-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .wallet-item {
      display: flex; align-items: center; justify-content: space-between;
      background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
      padding: 1rem 1.25rem;
    }
    .wallet-left { display: flex; align-items: center; gap: 0.85rem; }
    .wallet-avatar { font-size: 1.3rem; }
    .wallet-address {
      font-family: monospace; font-size: 0.88rem; color: #111827; font-weight: 600;
    }
    .wallet-meta { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem; }
    .badge-primary {
      background: #D1FAE5; color: #065F46; font-size: 0.7rem;
      font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 99px;
    }
    .wallet-date { font-size: 0.75rem; color: #9CA3AF; }
    .wallet-empty { text-align: center; color: #9CA3AF; padding: 1.5rem; font-size: 0.9rem; }

    .btn-remove {
      background: none; border: none; cursor: pointer; font-size: 1rem;
      padding: 0.35rem 0.5rem; border-radius: 8px; transition: background 0.2s;
    }
    .btn-remove:hover:not(:disabled) { background: #FEE2E2; }
    .btn-remove:disabled { opacity: 0.3; cursor: not-allowed; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 999;
    }
    .modal-card {
      background: white; border-radius: 20px; padding: 2rem 2.5rem;
      text-align: center; max-width: 360px; width: 90%;
      box-shadow: 0 25px 60px rgba(0,0,0,0.2);
    }
    .modal-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .modal-card h3 { margin: 0 0 0.5rem; font-size: 1.2rem; color: #111827; }
    .modal-addr { font-family: monospace; font-size: 0.8rem; color: #6B7280; margin: 0 0 0.4rem; }
    .modal-msg  { font-size: 0.85rem; color: #9CA3AF; margin: 0 0 1.5rem; }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: center; }
    .btn-danger {
      background: #EF4444; color: white; border: none; border-radius: 10px;
      padding: 0.6rem 1.4rem; font-weight: 700; cursor: pointer; font-size: 0.9rem;
    }
    .btn-ghost {
      background: #F3F4F6; color: #374151; border: none; border-radius: 10px;
      padding: 0.6rem 1.4rem; font-weight: 600; cursor: pointer; font-size: 0.9rem;
    }
  `]
})
export class LinkedWalletsComponent {
  wallets    = input.required<LinkedWallet[]>();
  canRemove  = input<boolean>(true);

  addWallet    = output<string>();
  removeWallet = output<string>();

  showAddInput = signal(false);
  pendingRemove = signal<LinkedWallet | null>(null);
  newAddress = '';

  formatAddress(addr: string): string {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  }

  confirmAdd() {
    const addr = this.newAddress.trim();
    if (!addr) return;
    this.addWallet.emit(addr);
    this.cancelAdd();
  }

  cancelAdd() {
    this.newAddress = '';
    this.showAddInput.set(false);
  }

  requestRemove(w: LinkedWallet) {
    this.pendingRemove.set(w);
  }

  confirmRemove() {
    const w = this.pendingRemove();
    if (w) this.removeWallet.emit(w.address);
    this.pendingRemove.set(null);
  }
}
