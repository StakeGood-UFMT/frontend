import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { MarketService } from '../../../core/services/market.service';
import { Market, MarketListResponse, MarketResults } from '../../../core/models/market.model';
import { NotificationService } from '../../../core/services/notification.service';
import { DistributeImpactButtonComponent } from './components/distribute-impact-button.component';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';
import { API_CONFIG } from '../../../core/config/api.config';

@Component({
  selector: 'app-market-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DistributeImpactButtonComponent],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-content">
          <h1 class="title">Market Admin</h1>
          <p class="subtitle">Management and impact distribution.</p>
        </div>
        <div class="header-stats">
          <div class="stat-item mini">
            <span class="label">To Resolve</span>
            <span class="value pending">{{ pendingCount() }}</span>
          </div>
          <div class="stat-item mini">
            <span class="label">Resolved</span>
            <span class="value">{{ resolvedCount() }}</span>
          </div>
        </div>
      </header>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Synchronizing market states...</p>
      </div>

      <ng-template #marketCard let-m="m">
        <div class="market-row" [class.is-resolved]="m.status === 'resolved'">
          <div class="row-main">
            <div class="m-meta">
              <span class="m-category">{{ m.category }}</span>
              <span class="m-id">#{{ m.id.substring(0, 8) }}</span>
              <span class="m-status" [class]="m.status">{{ m.status }}</span>
            </div>
            
            <div class="m-content">
              <h3 class="m-title">{{ m.title }}</h3>
              <div class="m-actions-inline">
                <a class="m-link" [routerLink]="['/arena', m.id]" title="Open Market">View ↗</a>
                <button class="m-link" (click)="openManage(m)">Manage</button>
              </div>
            </div>
          </div>

          <div class="row-side">
            <div class="m-stat">
              <span class="m-stat-val">{{ m.total_liquidity }}</span>
              <span class="m-stat-unit">{{ m.asset_code || 'XLM' }}</span>
            </div>

            <div class="m-resolve">
              <div class="m-btns">
                <button
                  class="m-btn yes"
                  [disabled]="m.status === 'resolved' || isResolving(m.id) || !isAfterLock(m)"
                  (click)="resolveMarket(m.id, 'YES')"
                >
                  {{ isResolving(m.id) ? '...' : 'YES' }}
                </button>
                <button
                  class="m-btn no"
                  [disabled]="m.status === 'resolved' || isResolving(m.id) || !isAfterLock(m)"
                  (click)="resolveMarket(m.id, 'NO')"
                >
                  {{ isResolving(m.id) ? '...' : 'NO' }}
                </button>
              </div>
              <div class="m-lock" *ngIf="m.status !== 'resolved' && !isAfterLock(m)">
                {{ m.lock_at | date:'dd/MM HH:mm' }}
              </div>
            </div>

            <div class="m-impact">
              <app-distribute-impact-button
                [marketId]="m.id"
                [disabled]="m.status !== 'resolved'"
                (distributed)="onImpactDistributed($event)"
              ></app-distribute-impact-button>
            </div>
          </div>
        </div>
      </ng-template>

      <div class="filter-bar">
        <div class="search-input">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            placeholder="Search by title or ID..."
            class="form-input"
          >
        </div>
        <div class="date-input">
          <span class="date-label">Created At:</span>
          <input 
            type="date" 
            [(ngModel)]="dateFilter" 
            class="form-input"
          >
        </div>
        <button class="clear-btn" (click)="clearFilters()" *ngIf="searchTerm() || dateFilter()">
          Clear
        </button>
      </div>

      <div *ngIf="!loading()" class="section">
        <div class="section-header">
          <h2 class="section-title">To Resolve</h2>
          <span class="section-count">{{ filteredPendingMarkets().length }}</span>
        </div>

        <div class="market-grid" *ngIf="filteredPendingMarkets().length > 0; else emptyPending">
          <ng-container *ngFor="let m of filteredPendingMarkets(); trackBy: trackMarket">
            <ng-container *ngTemplateOutlet="marketCard; context: { m: m }"></ng-container>
          </ng-container>
        </div>
        <ng-template #emptyPending>
          <div class="empty-state">No markets matching your filters.</div>
        </ng-template>
      </div>

      <div *ngIf="!loading()" class="section">
        <div class="section-header">
          <h2 class="section-title">Resolved</h2>
          <span class="section-count">{{ filteredResolvedMarkets().length }}</span>
        </div>

        <div class="market-grid" *ngIf="filteredResolvedMarkets().length > 0; else emptyResolved">
          <ng-container *ngFor="let m of filteredResolvedMarkets(); trackBy: trackMarket">
            <ng-container *ngTemplateOutlet="marketCard; context: { m: m }"></ng-container>
          </ng-container>
        </div>
        <ng-template #emptyResolved>
          <div class="empty-state">No resolved markets matching your filters.</div>
        </ng-template>
      </div>
    </div>

    <div *ngIf="selectedMarket()" class="modal-overlay" (click)="closeManage()">
      <div class="modal-card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-kicker">Manage Market</div>
            <div class="modal-title">{{ selectedMarket()!.title }}</div>
          </div>
          <button class="modal-close" (click)="closeManage()">×</button>
        </div>

        <div class="modal-tabs">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'overview'" 
            (click)="activeTab.set('overview')"
          >
            Overview & Actions
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'impact'" 
            (click)="activeTab.set('impact')"
          >
            Impact & NGOs
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'financials'" 
            (click)="activeTab.set('financials')"
          >
            Financials
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'bettors'" 
            (click)="activeTab.set('bettors')"
          >
            Bettors ({{ marketPositions()?.positions?.length || 0 }})
          </button>
        </div>

        <div class="modal-body">
          <div *ngIf="!manageLoading(); else manageLoadingTpl">
            <!-- TAB: OVERVIEW & ACTIONS -->
            <div class="tab-content" *ngIf="activeTab() === 'overview'">
              <div class="modal-grid">
                <div class="panel">
                  <div class="panel-title">Market Status</div>
                  <div class="kv">
                    <div class="kv-row">
                      <span class="k">DB status</span>
                      <span class="v">
                        <span class="pill" [class]="selectedMarket()!.status">{{ selectedMarket()!.status }}</span>
                      </span>
                    </div>
                    <div class="kv-row">
                      <span class="k">On-chain</span>
                      <span class="v">
                        <span class="pill neutral">{{ onChainStatusLabel() }}</span>
                      </span>
                    </div>
                    <div class="kv-row">
                      <span class="k">Lock time</span>
                      <span class="v">{{ selectedMarket()!.lock_at | date:'medium' }}</span>
                    </div>
                    <div class="kv-row">
                      <span class="k">Resolve time</span>
                      <span class="v">{{ selectedMarket()!.settle_at | date:'medium' }}</span>
                    </div>
                  </div>
                </div>

                <div class="panel">
                  <div class="panel-title">Admin Actions</div>
                  <div class="actions">
                    <div class="action-group">
                      <button
                        class="action-btn"
                        [disabled]="manageActionBusy() || !canToggleActive()"
                        (click)="toggleActive()"
                      >
                        {{ selectedMarket()!.status === 'draft' ? 'Activate Market' : 'Deactivate Market' }}
                      </button>

                      <button
                        class="action-btn danger"
                        [disabled]="manageActionBusy() || selectedMarket()!.status === 'resolved'"
                        (click)="cancelSelected()"
                      >
                        Cancel Market
                      </button>
                    </div>

                    <div class="action-block">
                      <div class="action-label">Resolution</div>
                      <div class="action-row">
                        <button
                          class="resolve-btn yes"
                          [disabled]="manageActionBusy() || !canResolveNow()"
                          (click)="resolveSelected('YES')"
                        >
                          Set YES
                        </button>
                        <button
                          class="resolve-btn no"
                          [disabled]="manageActionBusy() || !canResolveNow()"
                          (click)="resolveSelected('NO')"
                        >
                          Set NO
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="panel-note">
                    <span class="icon">ℹ️</span> Resolve and Impact actions require admin signature.
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: IMPACT & NGOs -->
            <div class="tab-content" *ngIf="activeTab() === 'impact'">
              <div class="impact-section">
                <div class="panel wide">
                  <div class="panel-header-inline">
                    <div class="panel-title">NGO Candidates & Voting</div>
                    <app-distribute-impact-button
                      [marketId]="selectedMarket()!.id"
                      [disabled]="manageActionBusy() || selectedMarket()!.status !== 'resolved' || onChainImpactDistributed() === true"
                      (distributed)="afterChainAction()"
                    ></app-distribute-impact-button>
                  </div>

                  <div class="ngo-grid" *ngIf="selectedMarket()?.ngo_candidates?.length; else noNgos">
                    <div class="ngo-card" *ngFor="let ngo of selectedMarket()!.ngo_candidates">
                      <div class="ngo-main">
                        <div class="ngo-logo">
                          <img 
                            *ngIf="ngo.logo_url" 
                            [src]="ngo.logo_url" 
                            [alt]="ngo.name"
                            (error)="onImageError($event)"
                          >
                          <div *ngIf="!ngo.logo_url" class="ngo-icon">NGO</div>
                        </div>
                        <div class="ngo-info">
                          <div class="ngo-name">{{ ngo.name }}</div>
                          <div class="ngo-id">ID: {{ ngo.on_chain_id }}</div>
                        </div>
                      </div>
                      <div class="ngo-votes" *ngIf="getVotesForNgo(ngo.on_chain_id) as voteData">
                        <div class="vote-stat">
                          <span class="vote-label">Votes</span>
                          <span class="vote-val">{{ voteData.total_votes }}</span>
                        </div>
                        <div class="vote-stat">
                          <span class="vote-label">Impact</span>
                          <span class="vote-val">{{ voteData.impact_units || 0 }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ng-template #noNgos>
                    <div class="empty-state">No NGO candidates associated with this market.</div>
                  </ng-template>
                </div>
              </div>
            </div>

            <!-- TAB: FINANCIALS -->
            <div class="tab-content" *ngIf="activeTab() === 'financials'">
              <div class="panel wide">
                <div class="panel-title">Payouts / Fees / Projections</div>

                <div *ngIf="marketResults(); else noResultsTpl">
                  <div *ngIf="marketResults()!.resolved; else projectionsTpl">
                    <div class="summary-row">
                      <div class="metric-card">
                        <span class="m-label">Outcome</span>
                        <span class="m-value outcome" [class]="marketResults()!.outcome">{{ marketResults()!.outcome }}</span>
                      </div>
                      <div class="metric-card">
                        <span class="m-label">Total Liquidity</span>
                        <span class="m-value">{{ marketResults()!.pools.total_liquidity }} {{ selectedMarket()!.asset_code || 'XLM' }}</span>
                      </div>
                      <div class="metric-card">
                        <span class="m-label">Winners Count</span>
                        <span class="m-value">{{ (marketResults()!.winners || []).length }}</span>
                      </div>
                    </div>

                    <div class="fees-grid">
                      <div class="fee-card">
                        <div class="fee-k">Charity</div>
                        <div class="fee-v">{{ marketResults()!.fees?.charity?.amount }}</div>
                      </div>
                      <div class="fee-card">
                        <div class="fee-k">Platform</div>
                        <div class="fee-v">{{ marketResults()!.fees?.platform?.amount }}</div>
                      </div>
                      <div class="fee-card">
                        <div class="fee-k">Gamification</div>
                        <div class="fee-v">{{ marketResults()!.fees?.gamification?.amount }}</div>
                      </div>
                    </div>

                    <div class="table-wrap" *ngIf="(marketResults()!.winners || []).length > 0">
                      <div class="table">
                        <div class="thead">
                          <div>User</div>
                          <div>Invested</div>
                          <div>Profit</div>
                          <div>Payout</div>
                        </div>
                        <div class="trow" *ngFor="let w of marketResults()!.winners; trackBy: trackByAnyId">
                          <div class="mono truncate">{{ w.wallet || w.user_id }}</div>
                          <div>{{ w.invested }}</div>
                          <div [class.profit]="(w.profit || 0) > 0">{{ w.profit }}</div>
                          <div class="strong">{{ w.payout }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ng-template #projectionsTpl>
                    <div class="summary-row">
                      <div class="metric-card">
                        <span class="m-label">Closed</span>
                        <span class="m-value">{{ marketResults()!.closed ? 'Yes' : 'No' }}</span>
                      </div>
                      <div class="metric-card">
                        <span class="m-label">Total Liquidity</span>
                        <span class="m-value">{{ marketResults()!.pools.total_liquidity }} {{ selectedMarket()!.asset_code || 'XLM' }}</span>
                      </div>
                    </div>

                    <div class="two-col">
                      <div class="projection yes">
                        <div class="proj-title">If YES wins</div>
                        <div class="proj-kv">
                          <div class="kv-row"><span class="k">Winners profit</span><span class="v">{{ marketResults()!.projections?.YES?.winners_profit_total }}</span></div>
                          <div class="kv-row"><span class="k">Charity fee</span><span class="v">{{ marketResults()!.projections?.YES?.fees?.charity?.amount }}</span></div>
                        </div>
                      </div>
                      <div class="projection no">
                        <div class="proj-title">If NO wins</div>
                        <div class="proj-kv">
                          <div class="kv-row"><span class="k">Winners profit</span><span class="v">{{ marketResults()!.projections?.NO?.winners_profit_total }}</span></div>
                          <div class="kv-row"><span class="k">Charity fee</span><span class="v">{{ marketResults()!.projections?.NO?.fees?.charity?.amount }}</span></div>
                        </div>
                      </div>
                    </div>
                  </ng-template>
                </div>

                <ng-template #noResultsTpl>
                  <div class="empty-state">No results available yet.</div>
                </ng-template>
              </div>
            </div>

            <!-- TAB: BETTORS -->
            <div class="tab-content" *ngIf="activeTab() === 'bettors'">
              <div class="panel wide no-border">
                <div *ngIf="marketPositions()?.positions?.length; else noPositionsTpl" class="table-wrap">
                  <div class="table">
                    <div class="thead">
                      <div>User</div>
                      <div>Outcome</div>
                      <div>Amount</div>
                      <div>Status</div>
                    </div>
                    <div class="trow" *ngFor="let p of marketPositions()!.positions; trackBy: trackByAnyId">
                      <div class="mono truncate">{{ p.user?.wallet || p.user?.display || p.user_id || p.id }}</div>
                      <div>
                        <span class="pill-sm" [class]="p.outcome">{{ p.outcome }}</span>
                      </div>
                      <div class="strong">{{ p.amount }}</div>
                      <div>{{ p.chain_status }}</div>
                    </div>
                  </div>
                </div>
                <ng-template #noPositionsTpl>
                  <div class="empty-state">No positions found for this market.</div>
                </ng-template>
              </div>
            </div>
          </div>
        </div>

        <ng-template #manageLoadingTpl>
          <div class="loading-state small">
            <div class="spinner"></div>
            <p>Loading market details...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      animation: fadeIn 0.4s ease-out;
      font-family: 'Public Sans', sans-serif;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .header-stats {
      display: flex;
      gap: 24px;
    }
    .title {
      font-size: 1.75rem;
      font-weight: 850;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.03em;
    }
    .subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .stat-item.mini {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .stat-item.mini .label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-item.mini .value {
      font-size: 1.25rem;
      font-weight: 850;
      color: #10b981;
    }
    .stat-item.mini .value.pending {
      color: #0f172a;
    }    .filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      align-items: center;
      background: #FFFFFF;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }
    .search-input {
      position: relative;
      flex: 1;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94A3B8;
      font-size: 0.8rem;
    }
    .form-input {
      width: 100%;
      padding: 8px 10px 8px 30px;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .date-input {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .date-input .form-input {
      padding-left: 10px;
      width: 130px;
    }
    .date-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748B;
    }
    .clear-btn {
      padding: 6px 12px;
      background: #F1F5F9;
      border: none;
      border-radius: 8px;
      color: #64748B;
      font-weight: 700;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .section {
      margin-top: 16px;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .section-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .section-count {
      font-size: 0.7rem;
      font-weight: 800;
      color: #64748b;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .empty-state {
      background: #ffffff;
      border: 1px dashed #e2e8f0;
      border-radius: 16px;
      padding: 18px 20px;
      color: #64748b;
      font-weight: 700;
    }    .market-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .market-row {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      gap: 16px;
      transition: all 0.2s;
    }
    .market-row:hover {
      border-color: #e2e8f0;
      background: #fcfdfe;
    }
    .market-row.is-resolved {
      border-left: 3px solid #10b981;
    }

    .row-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .m-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .m-category {
      font-size: 0.6rem;
      font-weight: 800;
      color: #10b981;
      text-transform: uppercase;
      background: #ecfdf5;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .m-id {
      font-size: 0.65rem;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
    }

    .m-status {
      font-size: 0.6rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .m-status.active { background: #dcfce7; color: #166534; }
    .m-status.locked { background: #fef9c3; color: #854d0e; }
    .m-status.resolved { background: #dbeafe; color: #1e40af; }
    .m-status.draft { background: #f1f5f9; color: #334155; }

    .m-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .m-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .m-actions-inline {
      display: flex;
      gap: 8px;
    }

    .m-link {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-decoration: none;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      cursor: pointer;
      white-space: nowrap;
    }
    .m-link:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .row-side {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .m-stat {
      display: flex;
      align-items: baseline;
      gap: 4px;
      min-width: 80px;
      justify-content: flex-end;
    }

    .m-stat-val {
      font-size: 0.9rem;
      font-weight: 800;
      color: #1e293b;
    }

    .m-stat-unit {
      font-size: 0.6rem;
      font-weight: 700;
      color: #94a3b8;
    }

    .m-resolve {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 120px;
    }

    .m-btns {
      display: flex;
      gap: 4px;
    }

    .m-btn {
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.65rem;
      cursor: pointer;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      min-width: 50px;
    }

    .m-btn.yes { color: #10b981; }
    .m-btn.yes:hover:not(:disabled) { background: #ecfdf5; border-color: #10b981; }

    .m-btn.no { color: #ef4444; }
    .m-btn.no:hover:not(:disabled) { background: #fef2f2; border-color: #ef4444; }

    .m-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .m-lock {
      font-size: 0.6rem;
      font-weight: 700;
      color: #b45309;
    }

    .m-impact {
      min-width: 140px;
    }

    ::ng-deep .m-impact .distribute-btn {
      padding: 6px 12px !important;
      font-size: 0.7rem !important;
      min-width: unset !important;
      width: 100%;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 100px 0;
      color: #64748b;
    }
    .loading-state.small {
      padding: 80px 0;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(16, 185, 129, 0.1);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Modal Styling */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 2000;
      animation: fadeIn 0.3s ease-out;
    }
    .modal-card {
      width: min(900px, 96vw);
      max-height: 90vh;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
    }
    .modal-kicker {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #10b981;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 850;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .modal-close {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: #f1f5f9;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: rotate(90deg);
    }

    /* Tabs */
    .modal-tabs {
      display: flex;
      padding: 0 24px;
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      gap: 24px;
    }
    .tab-btn {
      padding: 16px 0;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: #0f172a;
    }
    .tab-btn.active {
      color: #10b981;
      border-bottom-color: #10b981;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      background: #f8fafc;
      flex: 1;
    }
    .tab-content {
      animation: fadeIn 0.2s ease-out;
    }

    .modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .panel.wide { grid-column: 1 / -1; }
    .panel.no-border { background: transparent; border: none; padding: 0; box-shadow: none; }
    
    .panel-header-inline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .panel-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }

    .kv { display: flex; flex-direction: column; gap: 12px; }
    .kv-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }
    .kv-row .k { color: #64748b; font-weight: 600; }
    .kv-row .v { color: #0f172a; font-weight: 700; }

    .pill {
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pill.active { background: #dcfce7; color: #166534; }
    .pill.locked { background: #fef9c3; color: #854d0e; }
    .pill.resolved { background: #dbeafe; color: #1e40af; }
    .pill.draft { background: #f1f5f9; color: #334155; }
    .pill.neutral { background: #f1f5f9; color: #64748b; }

    .pill-sm {
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 800;
    }
    .pill-sm.YES { background: #dcfce7; color: #166534; }
    .pill-sm.NO { background: #fef2f2; color: #991b1b; }

    /* Actions */
    .actions { display: flex; flex-direction: column; gap: 16px; }
    .action-group { display: flex; gap: 10px; }
    .action-btn {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      font-weight: 800;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
    .action-btn.danger { color: #ef4444; background: #fff5f5; border-color: #fee2e2; }
    .action-btn.danger:hover:not(:disabled) { background: #fee2e2; }
    
    .action-block {
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
    .action-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .action-row { display: flex; gap: 10px; }
    .resolve-btn {
      flex: 1;
      padding: 10px;
      border-radius: 10px;
      border: 2px solid #e2e8f0;
      background: #ffffff;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
    }
    .resolve-btn.yes { color: #10b981; border-color: #dcfce7; }
    .resolve-btn.yes:hover:not(:disabled) { background: #10b981; color: white; border-color: #10b981; }
    .resolve-btn.no { color: #ef4444; border-color: #fef2f2; }
    .resolve-btn.no:hover:not(:disabled) { background: #ef4444; color: white; border-color: #ef4444; }

    .panel-note {
      margin-top: 16px;
      font-size: 0.75rem;
      color: #64748b;
      background: #f8fafc;
      padding: 10px;
      border-radius: 10px;
      display: flex;
      gap: 8px;
    }

    /* NGO Cards */
    .ngo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }
    .ngo-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ngo-main { display: flex; gap: 12px; align-items: center; }
    .ngo-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
      border: 1px solid #f1f5f9;
    }
    .ngo-logo img { width: 100%; height: 100%; object-fit: cover; }
    .ngo-icon { 
      width: 100%; height: 100%; display: flex; align-items: center; 
      justify-content: center; background: #10b981; color: white; font-size: 0.6rem; font-weight: 900;
    }
    .ngo-name { font-weight: 800; color: #0f172a; font-size: 0.9rem; }
    .ngo-id { font-size: 0.7rem; color: #94a3b8; font-family: monospace; }
    
    .ngo-votes {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #e2e8f0;
      padding-top: 12px;
    }
    .vote-stat { display: flex; flex-direction: column; }
    .vote-label { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
    .vote-val { font-weight: 800; color: #0f172a; font-size: 0.95rem; }

    /* Financials */
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      min-width: 140px;
    }
    .m-label { font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .m-value { font-size: 1.1rem; font-weight: 850; color: #0f172a; }
    .m-value.outcome.YES { color: #10b981; }
    .m-value.outcome.NO { color: #ef4444; }

    .fees-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
    .fee-card { background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .fee-k { font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .fee-v { font-size: 1rem; font-weight: 800; color: #0f172a; margin-top: 2px; }

    .projection { padding: 16px; border-radius: 16px; border: 2px solid #f1f5f9; }
    .projection.yes { border-color: #dcfce7; background: #f0fdf4; }
    .projection.no { border-color: #fef2f2; background: #fff5f5; }
    .proj-title { font-weight: 800; color: #0f172a; margin-bottom: 12px; font-size: 0.95rem; }

    /* Table Improvements */
    .table-wrap {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 10px;
    }
    .table { width: 100%; border: none; }
    .thead { 
      background: #f8fafc; 
      display: grid; 
      grid-template-columns: 2fr 1fr 1fr 1fr; 
      padding: 12px 20px;
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      border-bottom: 1px solid #f1f5f9;
    }
    .trow {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      padding: 12px 20px;
      align-items: center;
      font-size: 0.85rem;
      border-bottom: 1px solid #f8fafc;
      transition: background 0.2s;
    }
    .trow:last-child { border-bottom: none; }
    .trow:hover { background: #f8fafc; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #64748b; }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .profit { color: #10b981; font-weight: 800; }

    @media (max-width: 768px) {
      .modal-grid, .two-col, .fees-grid { grid-template-columns: 1fr; }
      .modal-tabs { overflow-x: auto; gap: 16px; padding: 0 16px; }
      .tab-btn { white-space: nowrap; }
    }

  `]
})
export class MarketAdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private marketService = inject(MarketService);
  private http = inject(HttpClient);
  private wallet = inject(WalletService);
  private notify = inject(NotificationService);

  markets = signal<Market[]>([]);
  loading = signal(true);
  resolving = signal<Record<string, boolean>>({});

  pendingMarkets = computed(() => this.markets().filter((m) => m.status !== 'resolved'));
  resolvedMarkets = computed(() => this.markets().filter((m) => m.status === 'resolved'));
  
  searchTerm = signal('');
  dateFilter = signal('');

  filteredPendingMarkets = computed(() => {
    return this.applyFilters(this.pendingMarkets());
  });

  filteredResolvedMarkets = computed(() => {
    return this.applyFilters(this.resolvedMarkets());
  });

  private applyFilters(list: Market[]) {
    const search = this.searchTerm().toLowerCase();
    const date = this.dateFilter();

    if (search) {
      list = list.filter(m => 
        m.title.toLowerCase().includes(search) || 
        m.id.toLowerCase().includes(search)
      );
    }

    if (date) {
      list = list.filter(m => {
        const marketDate = new Date(m.created_at).toISOString().split('T')[0];
        return marketDate === date;
      });
    }

    return list;
  }

  clearFilters() {
    this.searchTerm.set('');
    this.dateFilter.set('');
  }

  pendingCount = computed(() => this.pendingMarkets().length);
  resolvedCount = computed(() => this.resolvedMarkets().length);

  selectedMarket = signal<Market | null>(null);
  manageLoading = signal(false);
  manageActionBusy = signal(false);
  marketResults = signal<MarketResults | null>(null);
  marketPositions = signal<any | null>(null);
  marketVoting = signal<any[]>([]);
  onChain = signal<any | null>(null);
  activeTab = signal<'overview' | 'impact' | 'financials' | 'bettors'>('overview');


  ngOnInit() {
    this.loadMarkets();
  }

  loadMarkets() {
    this.loading.set(true);
    this.marketService.getMarkets().subscribe({
      next: (res: MarketListResponse) => {
        this.markets.set(res.markets);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.notify.error('Failed to load markets');
        this.loading.set(false);
      }
    });
  }

  onImpactDistributed(res: any) {
    this.notify.success(`Impact distributed: ${res.amount_distributed} units`);
    this.loadMarkets();
  }

  isResolving(marketId: string) {
    return !!this.resolving()[marketId];
  }

  isAfterLock(m: Market) {
    const lockAt = new Date(m.lock_at);
    if (!Number.isFinite(lockAt.getTime())) return false;
    return new Date() >= lockAt;
  }

  openManage(m: Market) {
    this.selectedMarket.set(m);
    this.refreshManage();
  }

  closeManage() {
    this.selectedMarket.set(null);
    this.marketResults.set(null);
    this.marketPositions.set(null);
    this.onChain.set(null);
    this.manageLoading.set(false);
    this.manageActionBusy.set(false);
  }

  private async refreshManage() {
    const m = this.selectedMarket();
    if (!m) return;
    this.manageLoading.set(true);
    try {
      const [fullMarket, results, positions, onChain, voting] = await Promise.all([
        firstValueFrom(this.marketService.getMarket(m.id)),
        firstValueFrom(this.marketService.getMarketResults(m.id)),
        firstValueFrom(this.marketService.getMarketPositions(m.id, 50, 0)),
        firstValueFrom(this.adminService.getOnChainMarket(m.id)),
        firstValueFrom(this.marketService.getMarketVoting(m.id)),
      ]);
      this.selectedMarket.set(fullMarket);
      this.marketResults.set(results);
      this.marketPositions.set(positions);
      this.onChain.set(onChain);
      this.marketVoting.set(voting || []);
    } catch (e: any) {
      this.notify.error(e?.error?.message ?? 'Failed to load market details.');
    } finally {
      this.manageLoading.set(false);
    }
  }

  getVotesForNgo(ngoOnChainId: number) {
    return this.marketVoting().find(v => v.ngo_on_chain_id === ngoOnChainId) || { total_votes: 0, impact_units: 0 };
  }


  canResolveNow() {
    const m = this.selectedMarket();
    if (!m) return false;
    if (m.status === 'resolved') return false;
    return this.isAfterLock(m);
  }

  canToggleActive() {
    const m = this.selectedMarket();
    if (!m) return false;
    if (m.status === 'resolved') return false;
    if (m.status === 'draft') return true;
    const lockAt = new Date(m.lock_at);
    return Number.isFinite(lockAt.getTime()) ? new Date() < lockAt : false;
  }

  async toggleActive() {
    const m = this.selectedMarket();
    if (!m) return;
    const nextStatus = m.status === 'draft' ? 'active' : 'draft';
    if (!confirm(`${nextStatus === 'active' ? 'Activate' : 'Deactivate'} this market?`)) return;

    this.manageActionBusy.set(true);
    try {
      await firstValueFrom(this.adminService.setMarketStatus(m.id, nextStatus));
      await this.loadMarkets();
      const updated = this.markets().find((x) => x.id === m.id) ?? null;
      this.selectedMarket.set(updated);
      await this.refreshManage();
    } catch (e: any) {
      this.notify.error(e?.error?.message ?? 'Failed to update status.');
    } finally {
      this.manageActionBusy.set(false);
    }
  }

  private async signAndSubmit(built: { xdr: string; txHash?: string }, successMessage: string) {
    const { signedTxXdr } = await this.wallet.signTransaction(built.xdr);
    await firstValueFrom(
      this.http.post(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.submit}`,
        { signedXdr: signedTxXdr, txHash: built.txHash },
      ),
    );
    this.notify.success(successMessage);
  }

  async cancelSelected() {
    const m = this.selectedMarket();
    if (!m) return;
    if (!this.wallet.ensurePublicKey()) {
      this.notify.error('Connect your wallet first.');
      return;
    }
    if (!confirm('Cancel this market on-chain?')) return;

    this.manageActionBusy.set(true);
    const toastId = this.notify.show('Preparing cancel...', 'pending', undefined, true);
    try {
      const built = await firstValueFrom(this.adminService.cancelMarket(m.id));
      this.notify.update(toastId, { message: 'Awaiting signature in wallet...' });
      await this.signAndSubmit(built, 'Cancel submitted.');
      this.notify.update(toastId, { message: 'Cancel submitted.', type: 'success', persistent: false });
      await this.loadMarkets();
      const updated = this.markets().find((x) => x.id === m.id) ?? null;
      this.selectedMarket.set(updated);
      await this.refreshManage();
    } catch (e: any) {
      this.notify.update(toastId, { message: e?.error?.message ?? 'Failed to cancel market.', type: 'error', persistent: false });
    } finally {
      this.manageActionBusy.set(false);
    }
  }

  async resolveSelected(outcome: 'YES' | 'NO') {
    const m = this.selectedMarket();
    if (!m) return;
    if (!this.wallet.ensurePublicKey()) {
      this.notify.error('Connect your wallet first.');
      return;
    }
    if (!this.canResolveNow()) {
      this.notify.error('Resolve is only available after lock time.');
      return;
    }
    if (!confirm(`Resolve this market as ${outcome}?`)) return;

    this.manageActionBusy.set(true);
    const toastId = this.notify.show('Preparing resolution...', 'pending', undefined, true);
    try {
      const built = await firstValueFrom(this.adminService.resolveMarket(m.id, outcome));
      this.notify.update(toastId, { message: 'Awaiting signature in wallet...' });
      await this.signAndSubmit(built, `Resolution submitted (${outcome}).`);
      this.notify.update(toastId, { message: `Resolution submitted (${outcome}).`, type: 'success', persistent: false });
      await this.loadMarkets();
      const updated = this.markets().find((x) => x.id === m.id) ?? null;
      this.selectedMarket.set(updated);
      await this.refreshManage();
    } catch (e: any) {
      this.notify.update(toastId, { message: e?.error?.message ?? 'Failed to resolve market.', type: 'error', persistent: false });
    } finally {
      this.manageActionBusy.set(false);
    }
  }

  async afterChainAction() {
    await this.loadMarkets();
    await this.refreshManage();
  }

  onChainStatusLabel() {
    const raw = this.onChain()?.market?.status;
    const n = typeof raw === 'number' ? raw : typeof raw === 'bigint' ? Number(raw) : null;
    if (n === 0) return 'Open';
    if (n === 1) return 'Locked';
    if (n === 2) return 'Canceled';
    if (n === 3) return 'Resolved';
    return '-';
  }

  onChainImpactDistributed() {
    const raw = this.onChain()?.market?.impact_distibuited ?? this.onChain()?.market?.impact_distributed;
    if (typeof raw === 'boolean') return raw;
    return null;
  }

  trackMarket(_: number, m: Market) {
    return m.id;
  }

  trackByAnyId(_: number, row: any) {
    return row?.id ?? row?.user_id ?? row?.wallet ?? _;
  }

  async resolveMarket(marketId: string, outcome: 'YES' | 'NO') {
    if (this.isResolving(marketId)) return;

    const market = this.markets().find((m) => m.id === marketId);
    if (!market || !this.isAfterLock(market)) {
      this.notify.error('You can only resolve a market after the lock time.');
      return;
    }

    if (!this.wallet.ensurePublicKey()) {
      this.notify.error('Connect your wallet first.');
      return;
    }

    if (!confirm(`Resolve this market as ${outcome}? This will send a transaction to the smart contract.`)) {
      return;
    }

    this.resolving.update((m) => ({ ...m, [marketId]: true }));
    const toastId = this.notify.show('Preparing resolution...', 'pending', undefined, true);

    try {
      const built = await firstValueFrom(this.adminService.resolveMarket(marketId, outcome));
      this.notify.update(toastId, { message: 'Awaiting signature in wallet...' });

      const { signedTxXdr } = await this.wallet.signTransaction(built.xdr);
      this.notify.update(toastId, { message: 'Submitting transaction...' });

      await firstValueFrom(
        this.http.post(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.base}/submit`,
          { signedXdr: signedTxXdr, txHash: built.txHash },
        ),
      );

      this.notify.update(toastId, {
        message: `Resolution submitted (${outcome}).`,
        type: 'success',
        persistent: false,
      });
      this.loadMarkets();
    } catch (e: any) {
      this.notify.update(toastId, {
        message: e?.error?.message ?? 'Failed to resolve market.',
        type: 'error',
        persistent: false,
      });
    } finally {
      this.resolving.update((m) => ({ ...m, [marketId]: false }));
    }
  }

  onImageError(event: any) {
    event.target.src = '/logo.png';
  }
}
