import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminMarketTTL, KeeperEligibleMarketsResponse } from '../../../core/models/admin.model';
import { NotificationService } from '../../../core/services/notification.service';
import { KeeperTTLTableComponent } from './components/keeper-ttl-table.component';

@Component({
  selector: 'app-keeper-ttl',
  standalone: true,
  imports: [CommonModule, FormsModule, KeeperTTLTableComponent],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div class="header-content">
          <h1 class="title">Keeper TTL Management</h1>
          <p class="subtitle">Maintain on-chain state rent for eligible markets and smart contracts.</p>
        </div>
        <button class="sync-btn" [class.spinning]="loading()" (click)="loadMarkets()">
          <svg class="sync-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M21 21v-5h-5"/></svg>
          <span>Sync On-Chain Data</span>
        </button>
      </header>

      <!-- Global Contract TTL Card -->
      <section class="global-card" *ngIf="!loading()">
        <div class="card-left">
          <div class="card-icon">🛡️</div>
          <div class="card-info">
            <h2 class="card-title">Global Contract Instance Health</h2>
            <p class="card-desc">Overall state rent and persistent storage status on the Stellar network.</p>
            <div class="ledger-info" *ngIf="latestLedger() > 0">
              <span class="ledger-label">Latest Ledger:</span>
              <span class="ledger-val">#{{ latestLedger() | number }}</span>
            </div>
          </div>
        </div>

        <div class="card-right">
          <div class="ttl-display" *ngIf="contractTtl() !== undefined; else noGlobalTtl">
            <div class="ttl-status" [ngClass]="getGlobalStatusClass()">
              <span class="status-dot"></span>
              <span>{{ getGlobalStatusText() }}</span>
            </div>
            <div class="ttl-numbers">
              <span class="ttl-main">{{ formatLedgersAsDuration(contractTtl()!) }}</span>
              <span class="ttl-sub">{{ contractTtl() | number }} ledgers remaining</span>
            </div>
          </div>
          <ng-template #noGlobalTtl>
            <div class="ttl-missing-card">
              <span class="missing-text">TTL Status Unavailable</span>
              <span class="missing-sub">Verify contract ID and RPC connection</span>
            </div>
          </ng-template>
        </div>
      </section>

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

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Synchronizing live TTL data from Stellar network...</p>
      </div>

      <div *ngIf="!loading() && filteredMarkets().length === 0" class="empty-results">
        <p>No markets found matching your filters.</p>
      </div>

      <app-keeper-ttl-table
        *ngIf="!loading() && filteredMarkets().length > 0"
        [markets]="filteredMarkets()"
        (bumpBatch)="onBumpBatch($event)"
      ></app-keeper-ttl-table>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      animation: fadeIn 0.4s ease-out;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .header-content {
      flex: 1;
      min-width: 300px;
    }
    .title {
      font-family: 'Public Sans', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      color: #111815;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 1rem;
      color: #64748b;
    }

    /* Sync Button */
    .sync-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #10b981;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sync-btn:hover {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
    }
    .sync-btn:active {
      transform: translateY(0);
    }
    .sync-btn.spinning .sync-icon {
      animation: spin 1s linear infinite;
    }

    /* Global Contract TTL Card */
    .global-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #111815 0%, #1e293b 100%);
      color: white;
      padding: 24px 32px;
      border-radius: 20px;
      margin-bottom: 24px;
      box-shadow: 0 12px 32px rgba(17, 24, 21, 0.15);
      gap: 24px;
      flex-wrap: wrap;
    }
    .card-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .card-icon {
      font-size: 2.8rem;
      background: rgba(255,255,255,0.1);
      width: 68px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .card-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .card-title {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .card-desc {
      font-size: 0.9rem;
      color: #94a3b8;
      margin: 0;
    }
    .ledger-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      font-size: 0.85rem;
      background: rgba(255,255,255,0.08);
      padding: 4px 10px;
      border-radius: 8px;
      width: fit-content;
    }
    .ledger-label { color: #cbd5e1; font-weight: 600; }
    .ledger-val { color: #10b981; font-weight: 800; font-family: monospace; }

    .card-right {
      background: rgba(255,255,255,0.06);
      padding: 16px 24px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
      min-width: 240px;
    }
    .ttl-display {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ttl-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      width: fit-content;
      padding: 4px 10px;
      border-radius: 8px;
    }
    .ttl-status.healthy { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .ttl-status.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .ttl-status.critical { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 8px currentColor;
    }
    .ttl-numbers {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ttl-main {
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.1;
    }
    .ttl-sub {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 600;
    }
    .ttl-missing-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .missing-text { font-size: 1.1rem; font-weight: 700; color: #f87171; }
    .missing-sub { font-size: 0.8rem; color: #94a3b8; }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
      background: #FFFFFF;
      padding: 16px;
      border-radius: 16px;
      border: 1px solid rgba(0,0,0,0.05);
      flex-wrap: wrap;
    }

    .search-input {
      position: relative;
      flex: 1;
      min-width: 240px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94A3B8;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px 10px 36px;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .date-input {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .date-input .form-input {
      padding-left: 12px;
    }

    .date-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748B;
    }

    .clear-btn {
      padding: 8px 16px;
      background: #F1F5F9;
      border: none;
      border-radius: 8px;
      color: #64748B;
      font-weight: 600;
      cursor: pointer;
    }

    .empty-results {
      text-align: center;
      padding: 40px;
      color: #64748B;
      font-weight: 500;
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
export class KeeperTTLComponent implements OnInit {
  private adminService = inject(AdminService);
  private notify = inject(NotificationService);

  markets = signal<AdminMarketTTL[]>([]);
  contractTtl = signal<number | undefined>(undefined);
  latestLedger = signal<number>(0);
  loading = signal(true);
  
  searchTerm = signal('');
  dateFilter = signal('');

  filteredMarkets = computed(() => {
    let list = this.markets();
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
  });

  ngOnInit() {
    this.loadMarkets();
  }

  loadMarkets() {
    this.loading.set(true);
    this.adminService.getEligibleMarkets().subscribe({
      next: (data: KeeperEligibleMarketsResponse) => {
        this.markets.set(data.markets ?? []);
        this.contractTtl.set(data.contract_ttl);
        this.latestLedger.set(data.latest_ledger ?? 0);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.notify.error('Failed to load eligible markets and TTL data');
        this.loading.set(false);
      }
    });
  }

  clearFilters() {
    this.searchTerm.set('');
    this.dateFilter.set('');
  }

  onBumpBatch(marketIds: string[]) {
    if (!confirm(`Confirm batch bump TTL for ${marketIds.length} markets?`)) return;

    this.adminService.batchBumpTTL(marketIds).subscribe({
      next: () => {
        this.notify.success('Batch bump TTL submitted successfully');
        this.loadMarkets();
      },
      error: (err: any) => {
        this.notify.error('Failed to execute batch bump TTL');
      }
    });
  }

  getGlobalStatusClass(): string {
    const ttl = this.contractTtl();
    if (ttl === undefined) return '';
    if (ttl > 50000) return 'healthy';
    if (ttl > 10000) return 'warning';
    return 'critical';
  }

  getGlobalStatusText(): string {
    const ttl = this.contractTtl();
    if (ttl === undefined) return 'Unknown';
    if (ttl > 50000) return 'Optimal Rent';
    if (ttl > 10000) return 'Rent Warning';
    return 'Critical Rent';
  }

  formatLedgersAsDuration(ledgers: number): string {
    const seconds = Math.max(0, Math.floor(ledgers * 5));
    if (seconds === 0) return 'Expired';

    const month = 30 * 24 * 60 * 60;
    const day = 24 * 60 * 60;
    const hour = 60 * 60;
    const minute = 60;

    const months = Math.floor(seconds / month);
    const days = Math.floor((seconds % month) / day);
    const hours = Math.floor((seconds % day) / hour);
    const minutes = Math.floor((seconds % hour) / minute);
    const secs = seconds % minute;

    if (months > 0) return days > 0 ? `${months}mo ${days}d` : `${months}mo`;
    if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${secs}s`;
  }
}

