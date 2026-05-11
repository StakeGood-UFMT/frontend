import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { MarketService } from '../../../core/services/market.service';
import { Market, MarketListResponse } from '../../../core/models/market.model';
import { NotificationService } from '../../../core/services/notification.service';
import { DistributeImpactButtonComponent } from './components/distribute-impact-button.component';
import { WalletService } from '../../../core/services/wallet.service';
import { API_CONFIG } from '../../../core/config/api.config';

@Component({
  selector: 'app-market-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, DistributeImpactButtonComponent],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-content">
          <h1 class="title">Market Impact Operations</h1>
          <p class="subtitle">Execute and audit impact distribution for resolved prediction markets.</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <span class="stat-label">To Resolve</span>
            <span class="stat-value pending">{{ pendingCount() }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Resolved Markets</span>
            <span class="stat-value">{{ resolvedCount() }}</span>
          </div>
        </div>
      </header>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Synchronizing market states...</p>
      </div>

      <ng-template #marketCard let-m="m">
        <div class="market-card" [class.is-resolved]="m.status === 'resolved'">
          <div class="card-body">
            <div class="market-main">
              <span class="category-chip">{{ m.category }}</span>
              <h3 class="market-title">{{ m.title }}</h3>
              <div class="market-meta">
                <span class="status-badge" [class]="m.status">{{ m.status }}</span>
                <span class="id-tag">ID: {{ m.id.substring(0, 8) }}</span>
                <a class="view-link" [routerLink]="['/arena', m.id]">
                  Open Market →
                </a>
                <button class="manage-link" (click)="openManage(m)">
                  Administrar
                </button>
              </div>
            </div>

            <div class="impact-section">
              <div class="resolve-block">
                <span class="label">Resolve</span>
                <div class="resolve-actions">
                  <button
                    class="resolve-btn yes"
                    [disabled]="m.status === 'resolved' || isResolving(m.id) || !isAfterLock(m)"
                    (click)="resolveMarket(m.id, 'YES')"
                  >
                    {{ isResolving(m.id) ? 'Processing…' : 'Set YES' }}
                  </button>
                  <button
                    class="resolve-btn no"
                    [disabled]="m.status === 'resolved' || isResolving(m.id) || !isAfterLock(m)"
                    (click)="resolveMarket(m.id, 'NO')"
                  >
                    {{ isResolving(m.id) ? 'Processing…' : 'Set NO' }}
                  </button>
                </div>
                <div class="resolve-hint" *ngIf="m.status !== 'resolved' && !isAfterLock(m)">
                  Available after lock time ({{ m.lock_at | date:'short' }}).
                </div>
              </div>

              <div class="impact-info">
                <span class="label">Projected Impact</span>
                <span class="value">{{ m.total_liquidity }} XLM</span>
              </div>
              <app-distribute-impact-button
                [marketId]="m.id"
                [disabled]="m.status !== 'resolved'"
                (distributed)="onImpactDistributed($event)"
              ></app-distribute-impact-button>
            </div>
          </div>

          <div class="card-footer" *ngIf="m.status === 'resolved'">
            <div class="warning-banner">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              Impact distribution is irreversible. Ensure oracle confirmation before execution.
            </div>
          </div>
        </div>
      </ng-template>

      <div *ngIf="!loading()" class="section">
        <div class="section-header">
          <h2 class="section-title">To Resolve</h2>
          <span class="section-count">{{ pendingCount() }}</span>
        </div>

        <div class="market-grid" *ngIf="pendingMarkets().length > 0; else emptyPending">
          <ng-container *ngFor="let m of pendingMarkets(); trackBy: trackMarket">
            <ng-container *ngTemplateOutlet="marketCard; context: { m: m }"></ng-container>
          </ng-container>
        </div>
        <ng-template #emptyPending>
          <div class="empty-state">No markets pending resolution.</div>
        </ng-template>
      </div>

      <div *ngIf="!loading()" class="section">
        <div class="section-header">
          <h2 class="section-title">Resolved</h2>
          <span class="section-count">{{ resolvedCount() }}</span>
        </div>

        <div class="market-grid" *ngIf="resolvedMarkets().length > 0; else emptyResolved">
          <ng-container *ngFor="let m of resolvedMarkets(); trackBy: trackMarket">
            <ng-container *ngTemplateOutlet="marketCard; context: { m: m }"></ng-container>
          </ng-container>
        </div>
        <ng-template #emptyResolved>
          <div class="empty-state">No resolved markets yet.</div>
        </ng-template>
      </div>
    </div>

    <div *ngIf="selectedMarket()" class="modal-overlay" (click)="closeManage()">
      <div class="modal-card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="modal-kicker">Administrar Market</div>
            <div class="modal-title">{{ selectedMarket()!.title }}</div>
          </div>
          <button class="modal-close" (click)="closeManage()">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-grid" *ngIf="!manageLoading(); else manageLoadingTpl">
            <div class="panel">
              <div class="panel-title">Status</div>
              <div class="kv">
                <div class="kv-row">
                  <span class="k">DB status</span>
                  <span class="v">
                    <span class="pill" [class]="selectedMarket()!.status">{{ selectedMarket()!.status }}</span>
                  </span>
                </div>
                <div class="kv-row">
                  <span class="k">Derived</span>
                  <span class="v">
                    <span class="pill neutral">{{ selectedMarket()!.derived_status || '-' }}</span>
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
                <div class="kv-row">
                  <span class="k">Resolve available</span>
                  <span class="v">{{ canResolveNow() ? 'Yes' : 'No' }}</span>
                </div>
                <div class="kv-row" *ngIf="onChainImpactDistributed() !== null">
                  <span class="k">Impact distributed</span>
                  <span class="v">{{ onChainImpactDistributed() ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </div>

            <div class="panel">
              <div class="panel-title">Ações</div>
              <div class="actions">
                <button
                  class="action-btn"
                  [disabled]="manageActionBusy() || !canToggleActive()"
                  (click)="toggleActive()"
                >
                  {{ selectedMarket()!.status === 'draft' ? 'Ativar' : 'Desativar' }}
                </button>

                <button
                  class="action-btn danger"
                  [disabled]="manageActionBusy() || selectedMarket()!.status === 'resolved'"
                  (click)="cancelSelected()"
                >
                  Cancelar Market
                </button>

                <div class="action-block">
                  <div class="action-label">Resolve</div>
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

                <div class="action-block">
                  <div class="action-label">Impact</div>
                  <app-distribute-impact-button
                    [marketId]="selectedMarket()!.id"
                    [disabled]="manageActionBusy() || selectedMarket()!.status !== 'resolved' || onChainImpactDistributed() === true"
                    (distributed)="afterChainAction()"
                  ></app-distribute-impact-button>
                </div>
              </div>
              <div class="panel-note">
                Resolve e Impact exigem assinatura da wallet do admin.
              </div>
            </div>

            <div class="panel wide">
              <div class="panel-title">Payouts / Fees</div>

              <div *ngIf="marketResults(); else noResultsTpl">
                <div *ngIf="marketResults()!.resolved; else projectionsTpl">
                  <div class="summary-row">
                    <span class="pill neutral">Outcome: {{ marketResults()!.outcome }}</span>
                    <span class="pill neutral">Total liquidity: {{ marketResults()!.pools?.total_liquidity }}</span>
                    <span class="pill neutral">Winners: {{ (marketResults()!.winners || []).length }}</span>
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

                  <div class="table" *ngIf="(marketResults()!.winners || []).length > 0">
                    <div class="thead">
                      <div>User</div>
                      <div>Invested</div>
                      <div>Profit</div>
                      <div>Payout</div>
                    </div>
                    <div class="trow" *ngFor="let w of marketResults()!.winners; trackBy: trackByAnyId">
                      <div class="mono">{{ w.wallet || w.user_id }}</div>
                      <div>{{ w.invested }}</div>
                      <div>{{ w.profit }}</div>
                      <div class="strong">{{ w.payout }}</div>
                    </div>
                  </div>
                </div>

                <ng-template #projectionsTpl>
                  <div class="summary-row">
                    <span class="pill neutral">Closed: {{ marketResults()!.closed ? 'Yes' : 'No' }}</span>
                    <span class="pill neutral">Total liquidity: {{ marketResults()!.pools?.total_liquidity }}</span>
                  </div>

                  <div *ngIf="marketResults()!.projections">
                    <div class="two-col">
                      <div class="projection">
                        <div class="proj-title">If YES wins</div>
                        <div class="proj-kv">
                          <div class="kv-row"><span class="k">Winners profit total</span><span class="v">{{ marketResults()!.projections?.YES?.winners_profit_total }}</span></div>
                          <div class="kv-row"><span class="k">Charity fee</span><span class="v">{{ marketResults()!.projections?.YES?.fees?.charity?.amount }}</span></div>
                        </div>
                      </div>
                      <div class="projection">
                        <div class="proj-title">If NO wins</div>
                        <div class="proj-kv">
                          <div class="kv-row"><span class="k">Winners profit total</span><span class="v">{{ marketResults()!.projections?.NO?.winners_profit_total }}</span></div>
                          <div class="kv-row"><span class="k">Charity fee</span><span class="v">{{ marketResults()!.projections?.NO?.fees?.charity?.amount }}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-template>
              </div>

              <ng-template #noResultsTpl>
                <div class="empty-state">No results available.</div>
              </ng-template>
            </div>

            <div class="panel wide">
              <div class="panel-title">Apostadores</div>
              <div *ngIf="marketPositions()?.positions?.length; else noPositionsTpl" class="table">
                <div class="thead">
                  <div>User</div>
                  <div>Outcome</div>
                  <div>Amount</div>
                  <div>Chain</div>
                </div>
                <div class="trow" *ngFor="let p of marketPositions()!.positions; trackBy: trackByAnyId">
                  <div class="mono">{{ p.user?.wallet || p.user?.display || p.user_id || p.id }}</div>
                  <div>{{ p.outcome }}</div>
                  <div>{{ p.amount }}</div>
                  <div>{{ p.chain_status }}</div>
                </div>
              </div>
              <ng-template #noPositionsTpl>
                <div class="empty-state">No positions found.</div>
              </ng-template>
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
      align-items: flex-end;
      margin-bottom: 40px;
    }
    .header-stats {
      display: flex;
      gap: 12px;
      align-items: stretch;
    }
    .title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #111815;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 1.1rem;
      color: #64748b;
    }
    .stat-card {
      background: #ffffff;
      padding: 16px 24px;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #10b981;
    }
    .stat-value.pending {
      color: #0f172a;
    }

    .section {
      margin-top: 24px;
    }
    .section-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .section-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .section-count {
      font-size: 0.8rem;
      font-weight: 800;
      color: #64748b;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 4px 10px;
      border-radius: 999px;
    }
    .empty-state {
      background: #ffffff;
      border: 1px dashed #e2e8f0;
      border-radius: 16px;
      padding: 18px 20px;
      color: #64748b;
      font-weight: 700;
    }

    .market-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .market-card {
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid #f1f5f9;
      overflow: hidden;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .market-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    }
    .market-card.is-resolved {
      border-left: 4px solid #10b981;
    }
    .card-body {
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .market-main {
      flex: 1;
    }
    .category-chip {
      font-size: 0.7rem;
      font-weight: 800;
      color: #10b981;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
      display: block;
    }
    .market-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 12px 0;
    }
    .market-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .status-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .status-badge.locked { background: #fef9c3; color: #854d0e; }
    .status-badge.resolved { background: #dbeafe; color: #1e40af; }
    .status-badge.draft { background: #f1f5f9; color: #334155; }
    
    .id-tag {
      font-size: 0.75rem;
      color: #94a3b8;
      font-family: monospace;
      background: #f8fafc;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .view-link {
      font-size: 0.8rem;
      font-weight: 900;
      color: #10b981;
      text-decoration: none;
      padding: 2px 6px;
      border-radius: 8px;
      border: 1px solid rgba(16, 185, 129, 0.18);
      background: #ecfdf5;
    }
    .view-link:hover {
      text-decoration: underline;
    }
    .manage-link {
      font-size: 0.8rem;
      font-weight: 900;
      color: #0f172a;
      text-decoration: none;
      padding: 2px 10px;
      border-radius: 8px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      background: #ffffff;
      cursor: pointer;
    }
    .manage-link:hover {
      background: #f8fafc;
    }

    .impact-section {
      display: flex;
      align-items: center;
      gap: 32px;
      padding-left: 32px;
      border-left: 1px solid #f1f5f9;
    }
    .resolve-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }
    .resolve-actions {
      display: inline-flex;
      gap: 8px;
    }
    .resolve-hint {
      font-size: 0.75rem;
      font-weight: 700;
      color: #b45309;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      padding: 6px 10px;
      border-radius: 12px;
      max-width: 260px;
      text-align: right;
    }
    .resolve-btn {
      border: 1px solid #E5E7EB;
      background: #ffffff;
      padding: 10px 14px;
      border-radius: 12px;
      font-weight: 900;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease;
      min-width: 92px;
    }
    .resolve-btn.yes:hover:not(:disabled) {
      border-color: rgba(16, 185, 129, 0.35);
      background: #dcfce7;
    }
    .resolve-btn.no:hover:not(:disabled) {
      border-color: rgba(239, 68, 68, 0.35);
      background: #fef2f2;
    }
    .resolve-btn:disabled {
      background: #f1f5f9;
      color: #cbd5e1;
      cursor: not-allowed;
      border-color: #f1f5f9;
    }
    .impact-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .impact-info .label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .impact-info .value {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1e293b;
    }

    .card-footer {
      background: #fffbeb;
      padding: 12px 32px;
      border-top: 1px solid #fef3c7;
    }
    .warning-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #b45309;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 100px 0;
      color: #64748b;
    }
    .loading-state.small {
      padding: 40px 0;
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

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 2000;
    }
    .modal-card {
      width: min(1100px, 96vw);
      max-height: 92vh;
      max-height: 92dvh;
      background: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 18px 50px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 16px 18px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }
    .modal-kicker {
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .modal-title {
      font-size: 1.2rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .modal-close {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: #64748b;
    }
    .modal-close:hover {
      background: #f8fafc;
      color: #0f172a;
    }
    .modal-body {
      padding: 16px 18px 18px;
      overflow: auto;
    }
    .modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .panel {
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      padding: 14px;
      background: #ffffff;
    }
    .panel.wide {
      grid-column: 1 / -1;
    }
    .panel-title {
      font-size: 0.85rem;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .kv {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .kv-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 0.85rem;
      color: #0f172a;
    }
    .kv-row .k {
      color: #64748b;
      font-weight: 800;
    }
    .kv-row .v {
      font-weight: 800;
      text-align: right;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-weight: 900;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #0f172a;
    }
    .pill.neutral {
      background: #f8fafc;
      color: #0f172a;
    }
    .pill.active { background: #dcfce7; color: #166534; border-color: rgba(22,101,52,0.15); }
    .pill.locked { background: #fef9c3; color: #854d0e; border-color: rgba(133,77,14,0.15); }
    .pill.resolved { background: #dbeafe; color: #1e40af; border-color: rgba(30,64,175,0.15); }
    .pill.draft { background: #f1f5f9; color: #334155; border-color: rgba(51,65,85,0.15); }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .action-btn {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      padding: 10px 12px;
      border-radius: 12px;
      font-weight: 900;
      cursor: pointer;
    }
    .action-btn:hover:not(:disabled) {
      background: #f8fafc;
    }
    .action-btn:disabled {
      background: #f1f5f9;
      color: #cbd5e1;
      cursor: not-allowed;
      border-color: #f1f5f9;
    }
    .action-btn.danger {
      border-color: rgba(239, 68, 68, 0.25);
      color: #991b1b;
      background: #fff1f2;
    }
    .action-btn.danger:hover:not(:disabled) {
      background: #ffe4e6;
    }
    .action-block {
      border-top: 1px dashed #e2e8f0;
      padding-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .action-label {
      font-size: 0.75rem;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .action-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .panel-note {
      margin-top: 10px;
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 700;
    }
    .summary-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .fees-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }
    .fee-card {
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      padding: 10px 12px;
      background: #ffffff;
    }
    .fee-k {
      font-size: 0.72rem;
      font-weight: 900;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .fee-v {
      margin-top: 2px;
      font-size: 1rem;
      font-weight: 900;
      color: #0f172a;
    }
    .table {
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      overflow: hidden;
    }
    .thead, .trow {
      display: grid;
      grid-template-columns: 1.6fr 0.7fr 0.7fr 0.7fr;
      gap: 10px;
      padding: 10px 12px;
      align-items: center;
    }
    .thead {
      background: #f8fafc;
      font-size: 0.72rem;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .trow {
      border-top: 1px solid #f1f5f9;
      font-size: 0.85rem;
      color: #0f172a;
      font-weight: 800;
      background: #ffffff;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-weight: 800;
      font-size: 0.8rem;
    }
    .strong {
      font-weight: 900;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .projection {
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      padding: 12px;
    }
    .proj-title {
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .proj-kv {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    @media (max-width: 980px) {
      .modal-grid { grid-template-columns: 1fr; }
      .fees-grid { grid-template-columns: 1fr; }
      .two-col { grid-template-columns: 1fr; }
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
  pendingCount = computed(() => this.pendingMarkets().length);
  resolvedCount = computed(() => this.resolvedMarkets().length);

  selectedMarket = signal<Market | null>(null);
  manageLoading = signal(false);
  manageActionBusy = signal(false);
  marketResults = signal<any | null>(null);
  marketPositions = signal<any | null>(null);
  onChain = signal<any | null>(null);

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
      const [results, positions, onChain] = await Promise.all([
        firstValueFrom(this.marketService.getMarketResults(m.id)),
        firstValueFrom(this.marketService.getMarketPositions(m.id, 50, 0)),
        firstValueFrom(this.adminService.getOnChainMarket(m.id)),
      ]);
      this.marketResults.set(results);
      this.marketPositions.set(positions);
      this.onChain.set(onChain);
    } catch (e: any) {
      this.notify.error(e?.error?.message ?? 'Failed to load market details.');
    } finally {
      this.manageLoading.set(false);
    }
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
    if (!confirm(`${nextStatus === 'active' ? 'Ativar' : 'Desativar'} este market?`)) return;

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
    if (!this.wallet.publicKey()) {
      this.notify.error('Connect your wallet first.');
      return;
    }
    if (!confirm('Cancelar este market on-chain?')) return;

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
    if (!this.wallet.publicKey()) {
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

    if (!this.wallet.publicKey()) {
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
}
