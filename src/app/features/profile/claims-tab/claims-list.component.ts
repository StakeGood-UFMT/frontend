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
          <i class="icon-refresh"></i> Refresh
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
      gap: 1.5rem;
      color: #e5e7eb;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .list-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      background: linear-gradient(90deg, #fff, #9ca3af);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .refresh-btn {
      background: rgba(55, 65, 81, 0.5);
      border: 1px solid #374151;
      color: #9ca3af;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #374151;
      color: #fff;
    }

    .claims-grid {
      display: grid;
      gap: 1rem;
    }

    .claim-row {
      background: rgba(31, 41, 55, 0.6);
      backdrop-filter: blur(10px);
      border: 1px solid #374151;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .claim-row:hover {
      border-color: #4b5563;
      transform: translateX(4px);
      background: rgba(31, 41, 55, 0.8);
    }

    .claim-row.claimed {
      opacity: 0.6;
      border-style: dashed;
      background: rgba(17, 24, 39, 0.4);
    }

    .claim-info {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .market-title {
      font-weight: 600;
      font-size: 1.05rem;
      color: #f3f4f6;
    }

    .claim-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
    }

    .amount {
      color: #10b981;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .status-badge {
      padding: 0.15rem 0.5rem;
      border-radius: 99px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #374151;
      color: #9ca3af;
    }

    .status-badge.resolved {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .impact-info {
      margin-top: 0.2rem;
    }

    .impact-badge {
      font-size: 0.7rem;
      color: #a78bfa;
      font-weight: 600;
      background: rgba(139, 92, 246, 0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }

    .loading-state, .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      background: rgba(17, 24, 39, 0.4);
      border-radius: 16px;
      border: 1px dashed #374151;
      color: #9ca3af;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .skeleton-list {
      display: grid;
      gap: 1rem;
      width: 100%;
    }

    .skeleton-item {
      height: 90px;
      background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
      background-size: 200% 100%;
      border-radius: 12px;
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
    });
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
