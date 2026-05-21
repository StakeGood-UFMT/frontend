import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClaimService } from './claim.service';
import { Claim } from '../../../core/models/claim.model';
import { ClaimButtonComponent } from './claim-button.component';
import { PendingTxStore } from '../../../core/services/pending-tx.service';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ClaimButtonComponent],
  template: `
    <div class="claims-container">
      <header class="list-header">
        <div class="header-left-group">
          <h2>Claims</h2>
          <div class="filter-pills">
            <button 
              (click)="selectSubTab('won')" 
              [class.active]="activeSubTab() === 'won'" 
              class="pill-btn won"
            >
              🏆 Won <span class="badge">{{ wonCount() }}</span>
            </button>
            <button 
              (click)="selectSubTab('not-won')" 
              [class.active]="activeSubTab() === 'not-won'" 
              class="pill-btn not-won"
            >
              💤 Not Won <span class="badge">{{ notWonCount() }}</span>
            </button>
          </div>
        </div>
        <button (click)="loadClaims()" class="refresh-btn" [disabled]="loading()">
          <span [class.spinning]="loading()">↻</span> Refresh
        </button>
      </header>

      <div *ngIf="loading()" class="loading-state">
        <div class="skeleton-list">
          <div *ngFor="let i of [1,2,3]" class="skeleton-item"></div>
        </div>
      </div>

      <!-- Global Empty State (no claims at all) -->
      <div *ngIf="!loading() && claims().length === 0" class="empty-state">
        <div class="empty-icon">💸</div>
        <p>You don't have any claims available at the moment.</p>
        <small>Participate in more markets to earn payouts!</small>
      </div>

      <!-- Group-specific Empty State -->
      <div *ngIf="!loading() && claims().length > 0 && filteredClaims().length === 0" class="empty-state">
        <div class="empty-icon" [ngSwitch]="activeSubTab()">
          <span *ngSwitchCase="'won'">🏆</span>
          <span *ngSwitchCase="'not-won'">💤</span>
        </div>
        <p>
          {{ activeSubTab() === 'won' ? "You don't have any winning claims at the moment." : "You don't have any other predictions in this category." }}
        </p>
        <small>
          {{ activeSubTab() === 'won' ? "Participate in more markets and make accurate predictions to win rewards!" : "All your prediction results will appear here." }}
        </small>
      </div>

      <div *ngIf="!loading() && filteredClaims().length > 0" class="claims-grid">
        <div *ngFor="let claim of paginatedClaims()" class="claim-row" [class.claimed]="claim.claimed">
          <div class="claim-main-content">
            <!-- Market Title and Status -->
            <div class="market-header-row">
              <span class="market-title" [title]="claim.market_title">{{ claim.market_title }}</span>
              <span class="status-badge" [class]="(claim.market_status || 'resolved').toLowerCase()">
                {{ claim.market_status || claim.market_state }}
              </span>
            </div>

            <!-- Details Section -->
            <div class="claim-details-grid">
              <div class="detail-item" *ngIf="claim.amount_staked">
                <span class="detail-label">Staked</span>
                <span class="detail-value amount-staked">
                  {{ claim.amount_staked | number:'1.2-4' }} {{ claim.asset_code || 'XLM' }}
                </span>
              </div>
              <div class="detail-item" *ngIf="claim.outcome">
                <span class="detail-label">Your Vote</span>
                <span class="detail-value vote-badge" [class]="claim.outcome.toLowerCase()">
                  {{ claim.outcome }}
                </span>
              </div>
              <div class="detail-item" *ngIf="claim.created_at">
                <span class="detail-label">Date Staked</span>
                <span class="detail-value date">{{ claim.created_at | date:'short' }}</span>
              </div>
              <div class="detail-item" *ngIf="claim.market_lock_at">
                <span class="detail-label">Market Lock</span>
                <span class="detail-value date">{{ claim.market_lock_at | date:'short' }}</span>
              </div>
              <div class="detail-item" *ngIf="claim.amount !== undefined && claim.amount > 0">
                <span class="detail-label">Payout</span>
                <span class="detail-value payout-amount">
                  {{ claim.amount | number:'1.2-4' }} {{ claim.asset_code || 'XLM' }}
                </span>
              </div>
            </div>

            <!-- Reasons for Not Won (Only shown for Not Won group) -->
            <div *ngIf="activeSubTab() === 'not-won'" class="not-won-reason-container">
              <span class="reason-label">Status:</span>
              <span class="reason-value" [ngSwitch]="getNotWonReasonType(claim)">
                <span *ngSwitchCase="'not_resolved'" class="status-indicator active">
                  ⏳ Market not resolved yet. Resolves around {{ claim.market_lock_at | date:'short' }}.
                </span>
                <span *ngSwitchCase="'incorrect_outcome'" class="status-indicator lost">
                  ❌ Incorrect prediction. You voted <strong>{{ claim.outcome }}</strong> but the resolved outcome was <strong>{{ claim.market_outcome }}</strong>.
                </span>
                <span *ngSwitchCase="'no_opposing_stakes'" class="status-indicator refund">
                  🔄 Refund/No opposing stakes. Market resolved to <strong>{{ claim.market_outcome }}</strong>, but there were no opposing stakes to earn rewards from.
                </span>
                <span *ngSwitchDefault class="status-indicator unknown">
                  ℹ️ Resolve/Refund status information.
                </span>
              </span>
            </div>

            <!-- Links / Navigation Row -->
            <div class="claim-links-row">
              <a [routerLink]="['/arena', claim.market_id]" class="compact-nav-btn market-link">
                🏟️ Go to Market
              </a>
              <a *ngIf="claim.tx_hash" 
                 [href]="'https://stellar.expert/explorer/testnet/tx/' + claim.tx_hash" 
                 target="_blank" 
                 class="compact-nav-btn tx-link"
              >
                🔗 View Tx
              </a>
            </div>

            <!-- NGO Voted (for Won group: which NGO they supported) -->
            <div *ngIf="claim.ngo_voted" class="ngo-card">
              <div class="ngo-card-left">
                <div class="ngo-avatar" *ngIf="claim.ngo_voted.logo_url">
                  <img [src]="claim.ngo_voted.logo_url" [alt]="claim.ngo_voted.name" />
                </div>
                <div class="ngo-avatar ngo-avatar-fallback" *ngIf="!claim.ngo_voted.logo_url">🌱</div>
                <div class="ngo-info">
                  <span class="ngo-label">NGO You Supported</span>
                  <span class="ngo-name">{{ claim.ngo_voted.name }}</span>
                  <span *ngIf="claim.ngo_voted.category" class="ngo-category">{{ claim.ngo_voted.category }}</span>
                </div>
              </div>
              <div class="ngo-card-right">
                <span *ngIf="claim.ngo_voted.verified" class="verified-badge">✓ Verified</span>
                <a [routerLink]="['/ngos', claim.ngo_voted.slug]" class="ngo-btn">View NGO →</a>
              </div>
            </div>

            <!-- NGO Candidates Strip (market candidates at resolution) -->
            <div *ngIf="claim.ngo_candidates && claim.ngo_candidates.length > 0" class="ngo-candidates-strip">
              <span class="ngo-candidates-label">🤝 NGO Candidates for this Market</span>
              <div class="ngo-candidates-list">
                <a *ngFor="let ngo of claim.ngo_candidates" 
                   [routerLink]="['/ngos', ngo.slug]"
                   class="ngo-candidate-chip"
                   [title]="ngo.name"
                >
                  <span *ngIf="ngo.logo_url" class="chip-avatar">
                    <img [src]="ngo.logo_url" [alt]="ngo.name" />
                  </span>
                  <span class="chip-name">{{ ngo.name }}</span>
                  <span *ngIf="ngo.verified" class="chip-verified">✓</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Claim Action Button -->
          <div class="claim-actions-wrapper">
            <app-claim-button [claim]="claim"></app-claim-button>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination" *ngIf="!loading() && filteredClaims().length > limit">
        <button [disabled]="page() === 1" (click)="page.set(page() - 1)" class="pagination-btn">
          Previous
        </button>
        <span class="pagination-info">
          Page {{ page() }} of {{ Math.ceil(filteredClaims().length / limit) }}
        </span>
        <button [disabled]="page() * limit >= filteredClaims().length" (click)="page.set(page() + 1)" class="pagination-btn">
          Next
        </button>
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
      margin-bottom: 4px;
      gap: 16px;
    }

    .header-left-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-left-group h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #111815;
    }

    .filter-pills {
      display: flex;
      gap: 8px;
    }

    .pill-btn {
      background: #f3f4f6;
      border: 1px solid transparent;
      color: #4b5563;
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pill-btn:hover {
      background: #e5e7eb;
      color: #111815;
    }

    .pill-btn.active.won {
      background: rgba(17, 212, 138, 0.1);
      border-color: #11D48A;
      color: #0eb87a;
    }

    .pill-btn.active.not-won {
      background: rgba(107, 114, 128, 0.1);
      border-color: #6b7280;
      color: #374151;
    }

    .pill-btn .badge {
      font-size: 0.7rem;
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 6px;
      border-radius: 99px;
      color: inherit;
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
      gap: 12px;
    }

    .claim-row {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.015);
    }

    .claim-row:hover {
      border-color: rgba(17, 212, 138, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
    }

    .claim-row.claimed {
      opacity: 0.75;
      background: #f9fafb;
      border-style: dashed;
    }

    .claim-main-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex-grow: 1;
      min-width: 0;
    }

    .market-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .market-title {
      font-weight: 800;
      font-size: 1rem;
      color: #111815;
      line-height: 1.4;
    }

    .status-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #f3f4f6;
      color: #6b7280;
      white-space: nowrap;
    }

    .status-badge.resolved {
      background: rgba(17, 212, 138, 0.08);
      color: #0eb87a;
    }

    .status-badge.locked {
      background: rgba(245, 158, 11, 0.08);
      color: #d97706;
    }

    .status-badge.active {
      background: rgba(59, 130, 246, 0.08);
      color: #2563eb;
    }

    /* Details Grid */
    .claim-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
      gap: 12px;
      background: #f9fafb;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.02);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: 0.72rem;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .detail-value {
      font-size: 0.85rem;
      font-weight: 700;
      color: #1f2937;
    }

    .detail-value.amount-staked {
      color: #3b82f6;
    }

    .detail-value.payout-amount {
      color: #10b981;
    }

    .detail-value.date {
      color: #4b5563;
      font-weight: 600;
      font-size: 0.78rem;
    }

    .vote-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 800;
      width: fit-content;
    }

    .vote-badge.yes {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .vote-badge.no {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    /* Reason Alerts for Not Won predictions */
    .not-won-reason-container {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      background: rgba(243, 244, 246, 0.5);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.03);
    }

    .reason-label {
      font-weight: 700;
      color: #4b5563;
      flex-shrink: 0;
    }

    .status-indicator {
      line-height: 1.4;
    }

    .status-indicator.active {
      color: #d97706;
    }

    .status-indicator.lost {
      color: #ef4444;
    }

    .status-indicator.refund {
      color: #4b5563;
    }

    /* Navigation/Links row */
    .claim-links-row {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .compact-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #4b5563;
      text-decoration: none;
      padding: 6px 12px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }

    .compact-nav-btn:hover {
      background: #f9fafb;
      border-color: #11D48A;
      color: #0eb87a;
      transform: translateY(-1px);
    }

    /* NGO Card (voted + candidates) */
    .ngo-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: linear-gradient(135deg, rgba(17,212,138,0.05) 0%, rgba(17,212,138,0.02) 100%);
      border: 1px solid rgba(17,212,138,0.18);
      border-radius: 10px;
      padding: 8px 12px;
      margin-top: 4px;
    }

    .ngo-card-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .ngo-avatar {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid rgba(17,212,138,0.2);
    }

    .ngo-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .ngo-avatar-fallback {
      background: rgba(17,212,138,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .ngo-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .ngo-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #0eb87a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .ngo-name {
      font-size: 0.85rem;
      font-weight: 800;
      color: #111815;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ngo-category {
      font-size: 0.7rem;
      color: #6b7280;
      font-weight: 500;
    }

    .ngo-card-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }

    .verified-badge {
      font-size: 0.65rem;
      font-weight: 700;
      color: #0eb87a;
      background: rgba(17,212,138,0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .ngo-btn {
      font-size: 0.75rem;
      font-weight: 800;
      color: #0eb87a;
      text-decoration: none;
      padding: 5px 10px;
      background: white;
      border: 1px solid rgba(17,212,138,0.3);
      border-radius: 6px;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .ngo-btn:hover {
      background: rgba(17,212,138,0.08);
      border-color: #11D48A;
    }

    /* NGO Candidates Strip */
    .ngo-candidates-strip {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #f9fafb;
      border: 1px solid rgba(0,0,0,0.04);
      border-radius: 10px;
      padding: 8px 12px;
      margin-top: 4px;
    }

    .ngo-candidates-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .ngo-candidates-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .ngo-candidate-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: white;
      border: 1px solid rgba(17,212,138,0.15);
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #374151;
      text-decoration: none;
      transition: all 0.15s;
    }

    .ngo-candidate-chip:hover {
      background: rgba(17,212,138,0.06);
      border-color: #11D48A;
      color: #0eb87a;
    }

    .chip-avatar {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .chip-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .chip-name {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chip-verified {
      color: #0eb87a;
      font-size: 0.7rem;
    }

    .claim-actions-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: center;
      flex-shrink: 0;
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
      height: 120px;
      background: linear-gradient(90deg, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      border-radius: 16px;
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

    /* Mobile responsive layouts */
    @media (max-width: 768px) {
      .claim-row {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
      
      .claim-actions-wrapper {
        align-self: stretch;
      }
      
      .claim-actions-wrapper ::ng-deep .claim-btn {
        width: 100%;
      }
    }

    @media (max-width: 600px) {
      .list-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .header-left-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .refresh-btn {
        align-self: flex-end;
      }
      .claim-details-grid {
        grid-template-columns: 1fr 1fr;
      }
      .market-header-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
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
  activeSubTab = signal<'won' | 'not-won'>('won');

  Math = Math;

  wonClaims = computed(() => this.claims().filter(c => c.amount > 0));
  notWonClaims = computed(() => this.claims().filter(c => c.amount === 0));

  wonCount = computed(() => this.wonClaims().length);
  notWonCount = computed(() => this.notWonClaims().length);

  filteredClaims = computed(() => {
    return this.activeSubTab() === 'won' ? this.wonClaims() : this.notWonClaims();
  });

  paginatedClaims = computed(() => {
    const start = (this.page() - 1) * this.limit;
    return this.filteredClaims().slice(start, start + this.limit);
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

  selectSubTab(tab: 'won' | 'not-won') {
    this.activeSubTab.set(tab);
    this.page.set(1);
  }

  getNotWonReasonType(claim: Claim): 'not_resolved' | 'incorrect_outcome' | 'no_opposing_stakes' | 'unknown' {
    if (claim.market_status !== 'resolved') {
      return 'not_resolved';
    }
    
    if (claim.outcome !== claim.market_outcome) {
      return 'incorrect_outcome';
    }
    
    if (claim.outcome === claim.market_outcome && claim.amount === 0) {
      return 'no_opposing_stakes';
    }
    
    return 'unknown';
  }
}
