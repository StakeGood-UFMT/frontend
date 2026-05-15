import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminMarketTTL } from '../../../core/models/admin.model';
import { NotificationService } from '../../../core/services/notification.service';
import { KeeperTTLTableComponent } from './components/keeper-ttl-table.component';

@Component({
  selector: 'app-keeper-ttl',
  standalone: true,
  imports: [CommonModule, FormsModule, KeeperTTLTableComponent],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <h1 class="title">Keeper TTL Management</h1>
        <p class="subtitle">Maintain on-chain state rent for eligible markets.</p>
      </header>

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
        <p>Loading markets...</p>
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
      margin-bottom: 24px;
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

    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
      background: #FFFFFF;
      padding: 16px;
      border-radius: 16px;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .search-input {
      position: relative;
      flex: 1;
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
      next: (data: AdminMarketTTL[]) => {
        this.markets.set(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.notify.error('Failed to load eligible markets');
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
}

