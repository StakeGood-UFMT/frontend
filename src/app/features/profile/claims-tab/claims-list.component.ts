import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimService } from './claim.service';
import { Claim } from '../../../core/models/claim.model';
import { ClaimButtonComponent } from './claim-button.component';
import { PendingTxStore } from '../../../core/services/pending-tx.service';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [CommonModule, ClaimButtonComponent],
  template: `
    <div class="claims-container">
      <header class="list-header">
        <h2>Available Claims</h2>
        <button (click)="loadClaims()" class="refresh-btn" [disabled]="loading()">
          <span [class.spinning]="loading()">↻</span> Refresh
        </button>
      </header>

      <div *ngIf="loading()" class="loading-state">
        <div class="skeleton-list">
          <div *ngFor="let i of [1,2,3]" class="skeleton-item"></div>
        </div>
      </div>

      <div *ngIf="!loading() && claims().length === 0" class="empty-state">
        <div class="empty-icon">💸</div>
        <p>You don't have any claims available at the moment.</p>
        <small>Participate in more markets to earn payouts!</small>
      </div>

      <div *ngIf="!loading() && claims().length > 0" class="claims-grid">
        <div *ngFor="let claim of claims()" class="claim-row" [class.claimed]="claim.claimed">
          <div class="claim-info">
            <span class="market-title">{{ claim.market_title }}</span>
            <div class="claim-meta">
              <span class="amount">{{ claim.amount | number:'1.2-4' }} XLM</span>
              <span class="status-badge" [class]="claim.market_state.toLowerCase()">
                {{ claim.market_state }}
              </span>
            </div>
            <div *ngIf="claim.impact_generated_by_user" class="impact-info">
              <span class="impact-badge">✨ +{{ claim.impact_generated_by_user }} XP</span>
            </div>
          </div>
          <div class="claim-actions">
            <app-claim-button [claim]="claim"></app-claim-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .claims-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .list-header h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #111815;
    }

    .refresh-btn {
      background: transparent;
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: #6b7280;
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #11D48A;
      color: #11D48A;
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinning {
      display: inline-block;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .claims-grid {
      display: grid;
      gap: 16px;
    }

    .claim-row {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
    }

    .claim-row:hover {
      border-color: rgba(17, 212, 138, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
    }

    .claim-row.claimed {
      opacity: 0.6;
      background: #f9fafb;
      border-style: dashed;
    }

    .claim-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .market-title {
      font-weight: 700;
      font-size: 1.05rem;
      color: #111815;
    }

    .claim-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
    }

    .amount {
      color: #11D48A;
      font-weight: 800;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-badge.resolved {
      background: rgba(17, 212, 138, 0.08);
      color: #0eb87a;
    }

    .impact-info {
      margin-top: 4px;
    }

    .impact-badge {
      font-size: 0.72rem;
      color: #8b5cf6;
      font-weight: 600;
      background: rgba(139, 92, 246, 0.06);
      padding: 4px 8px;
      border-radius: 6px;
    }

    .loading-state, .empty-state {
      padding: 64px 32px;
      text-align: center;
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      color: #6b7280;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 8px;
    }

    .skeleton-list {
      display: grid;
      gap: 16px;
      width: 100%;
    }

    .skeleton-item {
      height: 90px;
      background: linear-gradient(90deg, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      border-radius: 16px;
      animation: shimmer 2s infinite linear;
    }

    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
  `]
})
export class ClaimsListComponent implements OnInit {
  private claimService = inject(ClaimService);
  private pendingTxStore = inject(PendingTxStore);
  
  claims = signal<Claim[]>([]);
  loading = signal(true);

  constructor() {
    // Refresh list when a claim is confirmed
    effect(() => {
      const pending = this.pendingTxStore.pendingTxs$();
      const hasConfirmedClaim = pending.some(tx => tx.type === 'CLAIM' && tx.status === 'confirmed');
      if (hasConfirmedClaim) {
        // Debounce or just reload
        this.loadClaims();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadClaims();
  }

  async loadClaims() {
    this.loading.set(true);
    try {
      const data = await this.claimService.getClaims();
      this.claims.set(data);
    } catch (error) {
      console.error('Failed to load claims', error);
    } finally {
      this.loading.set(false);
    }
  }
}
