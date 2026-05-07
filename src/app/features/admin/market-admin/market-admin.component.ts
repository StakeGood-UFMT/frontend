import { Component, OnInit, inject, signal } from '@angular/core';
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
            <span class="stat-label">Resolved Markets</span>
            <span class="stat-value">{{ resolvedCount() }}</span>
          </div>
        </div>
      </header>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Synchronizing market states...</p>
      </div>

      <div *ngIf="!loading()" class="market-grid">
        <div *ngFor="let m of markets()" class="market-card" [class.is-resolved]="m.status === 'resolved'">
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

  resolvedCount = signal(0);

  ngOnInit() {
    this.loadMarkets();
  }

  loadMarkets() {
    this.loading.set(true);
    this.marketService.getMarkets().subscribe({
      next: (res: MarketListResponse) => {
        this.markets.set(res.markets);
        this.resolvedCount.set(res.markets.filter((m: Market) => m.status === 'resolved').length);
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
          { signedXdr: signedTxXdr },
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
