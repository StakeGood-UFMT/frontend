import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LedgerService } from './services/ledger.service';
import { FilterBarComponent } from './components/filter-bar.component';
import { LedgerTableComponent } from './components/ledger-table.component';
import { ExportModalComponent } from './components/export-modal.component';
import { ImpactLedgerEntry, LedgerFilters } from './models/ledger.model';

@Component({
  selector: 'app-impact-ledger',
  standalone: true,
  imports: [
    CommonModule, 
    FilterBarComponent, 
    LedgerTableComponent, 
    ExportModalComponent
  ],
  template: `
    <div class="ledger-page">
      <header class="page-header">
        <div class="title-section">
          <h1 class="page-title">Global Impact Ledger</h1>
          <p class="page-subtitle">Real-time transparency of all impact distribution across the ecosystem.</p>
        </div>
        
        <button class="export-btn" (click)="showExportModal.set(true)">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Report
        </button>
      </header>

      <app-filter-bar (filtersChange)="onFiltersChange($event)"></app-filter-bar>

      <div *ngIf="loading()" class="loading-container">
        <div class="spinner"></div>
        <p>Fetching ledger records...</p>
      </div>

      <app-ledger-table 
        *ngIf="!loading()"
        [data]="ledgerData()"
        [total]="totalCount()"
        [page]="currentPage()"
        [limit]="pageSize()"
        (pageChange)="onPageChange($event)"
      ></app-ledger-table>

      <app-export-modal 
        *ngIf="showExportModal()" 
        [filters]="currentFilters"
        (close)="showExportModal.set(false)"
      ></app-export-modal>
    </div>
  `,
  styles: [`
    .ledger-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      animation: fadeIn 0.6s ease-out;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 40px;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
      }
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--secondary-color);
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 1.1rem;
      color: var(--text-muted);
    }

    .export-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--secondary-color);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #252f2a;
        transform: translateY(-2px);
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 100px 0;
      color: var(--text-muted);

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(17, 212, 138, 0.1);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ImpactLedgerPage implements OnInit {
  private ledgerService = inject(LedgerService);

  ledgerData = signal<ImpactLedgerEntry[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  loading = signal(false);
  showExportModal = signal(false);
  currentFilters: LedgerFilters = {};

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.ledgerService.getLedger(this.currentPage(), this.pageSize(), this.currentFilters)
      .subscribe({
        next: (res) => {
          this.ledgerData.set(res?.data || []);
          this.totalCount.set(res?.total || 0);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load ledger', err);
          this.loading.set(false);
        }
      });
  }

  onFiltersChange(filters: LedgerFilters) {
    this.currentFilters = filters;
    this.currentPage.set(1); // Reset to first page
    this.loadData();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }
}
