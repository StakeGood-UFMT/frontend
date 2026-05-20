import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
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
        <div *ngFor="let claim of paginatedClaims()" class="claim-row" [class.claimed]="claim.claimed">
          <div class="claim-info">
            <span class="market-title">{{ claim.market_title }}</span>
            <div class="claim-meta">
              <span class="amount">{{ claim.amount | number:'1.2-4' }} {{ claim.asset_code || 'XLM' }}</span>
              <span class="status-badge" [class]="claim.market_state.toLowerCase()">
                {{ claim.market_state }}
              </span>
              <span *ngIf="claim.impact_generated_by_user" class="impact-badge">✨ +{{ claim.impact_generated_by_user }} XP</span>
            </div>
          </div>
          <div class="claim-actions">
            <app-claim-button [claim]="claim"></app-claim-button>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination" *ngIf="!loading() && claims().length > limit">
        <button [disabled]="page() === 1" (click)="page.set(page() - 1)" class="pagination-btn">
          Previous
        </button>
        <span class="pagination-info">
          Page {{ page() }} of {{ Math.ceil(claims().length / limit) }}
        </span>
        <button [disabled]="page() * limit >= claims().length" (click)="page.set(page() + 1)" class="pagination-btn">
          Next
        </button>
      </div>
    </div>
  `,
  styles: [`
    .claims-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
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
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.78rem;
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
      gap: 10px;
    }

    .claim-row {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
    }

    .claim-row:hover {
      border-color: rgba(17, 212, 138, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
    }

    .claim-row.claimed {
      opacity: 0.6;
      background: #f9fafb;
      border-style: dashed;
    }

    .claim-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex-grow: 1;
      min-width: 0;
    }

    .market-title {
      font-weight: 700;
      font-size: 0.92rem;
      color: #111815;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .claim-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8rem;
    }

    .amount {
      color: #11D48A;
      font-weight: 800;
    }

    .status-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-badge.resolved {
      background: rgba(17, 212, 138, 0.08);
      color: #0eb87a;
    }

    .impact-badge {
      font-size: 0.7rem;
      color: #8b5cf6;
      font-weight: 600;
      background: rgba(139, 92, 246, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .loading-state, .empty-state {
      padding: 48px 24px;
      text-align: center;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      color: #6b7280;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 2px;
    }

    .skeleton-list {
      display: grid;
      gap: 10px;
      width: 100%;
    }

    .skeleton-item {
      height: 60px;
      background: linear-gradient(90deg, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      border-radius: 12px;
      animation: shimmer 2s infinite linear;
    }

    @keyframes shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }

    /* Pagination CSS */
    .pagination {
      display: flex;
      gap: 12px;
      justify-content: center;
      align-items: center;
      padding: 12px 0;
      margin-top: 16px;
    }

    .pagination-btn {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: white;
      color: #4b5563;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: #11D48A;
      color: #11D48A;
      background: #f9fafb;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      font-size: 0.78rem;
      color: #6b7280;
      font-weight: 600;
    }
  `]
})
export class ClaimsListComponent implements OnInit {
  private claimService = inject(ClaimService);
  private pendingTxStore = inject(PendingTxStore);
  
  claims = signal<Claim[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = 5;

  Math = Math;

  paginatedClaims = computed(() => {
    const start = (this.page() - 1) * this.limit;
    return this.claims().slice(start, start + this.limit);
  });

  constructor() {
    effect(() => {
      const pending = this.pendingTxStore.pendingTxs$();
      const hasConfirmedClaim = pending.some(tx => tx.type === 'CLAIM' && tx.status === 'confirmed');
      if (hasConfirmedClaim) {
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
      this.page.set(1);
    } catch (error) {
      console.error('Failed to load claims', error);
    } finally {
      this.loading.set(false);
    }
  }
}
