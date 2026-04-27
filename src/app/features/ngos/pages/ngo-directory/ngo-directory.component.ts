import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgosService } from '../../services/ngos.service';
import { NgoCardComponent } from '../../components/ngo-card/ngo-card.component';

@Component({
  selector: 'app-ngo-directory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgoCardComponent],
  template: `
    <div class="ngo-page" id="ngo-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <span class="title-icon">🌍</span>
            NGO Directory
          </h1>
          <p class="page-subtitle">
            Discover verified non-profit organizations and track their real-world impact through blockchain transparency.
          </p>
        </div>
        <div class="header-stats" *ngIf="!ngosService.loading() && !ngosService.error()">
          <div class="stat-chip">
            <span class="stat-value">{{ ngosService.filteredNgos().length }}</span>
            <span class="stat-label">Organizations</span>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-container">
        <!-- Search -->
        <div class="search-wrapper">
          <span class="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Search by name, description or cause..."
            class="search-input"
            id="ngo-search-input"
          />
          <button
            *ngIf="searchControl.value"
            (click)="clearSearch()"
            class="clear-btn"
          >✕</button>
        </div>

        <div class="filter-actions">
          <!-- Cause Filter -->
          <div class="tabs-scroll" #tabsScroll>
            <div class="tabs">
              <button
                *ngFor="let cause of causes"
                (click)="setCause(cause.value)"
                [class.active]="ngosService.filters().cause === cause.value"
                class="tab-btn"
              >
                {{ cause.label }}
              </button>
            </div>
          </div>

          <!-- Sort Filter -->
          <div class="sort-wrapper">
             <select [formControl]="sortControl" class="sort-select">
                <option value="trending">Trending</option>
                <option value="newest">Newest First</option>
             </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="state-container" *ngIf="ngosService.loading()">
        <div class="loading-grid">
          <div class="skeleton-card" *ngFor="let _ of [1,2,3,4,5,6]">
            <div class="skel-header">
              <div class="skel-avatar"></div>
              <div class="skel-info">
                <div class="skel-line"></div>
                <div class="skel-badges"></div>
              </div>
            </div>
            <div class="skel-body"></div>
            <div class="skel-footer"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div class="state-container" *ngIf="ngosService.error() && !ngosService.loading()">
        <div class="state-card error-state">
          <div class="state-icon">⚠️</div>
          <h2 class="state-title">Something went wrong</h2>
          <p class="state-message">{{ ngosService.error() }}</p>
          <button class="retry-btn" (click)="retry()">
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div class="state-container" *ngIf="ngosService.isEmpty() && !ngosService.loading()">
        <div class="state-card empty-state">
          <div class="state-icon">🔍</div>
          <h2 class="state-title">No NGOs found</h2>
          <p class="state-message">Try adjusting your filters or search term.</p>
          <button class="clear-filters-btn" (click)="clearFilters()">
            Clear All Filters
          </button>
        </div>
      </div>

      <!-- NGO Grid -->
      <div
        class="ngo-grid"
        *ngIf="!ngosService.loading() && !ngosService.error() && !ngosService.isEmpty()"
      >
        <app-ngo-card
          *ngFor="let ngo of ngosService.filteredNgos(); trackBy: trackById"
          [ngo]="ngo"
          class="grid-item"
        ></app-ngo-card>
      </div>
    </div>
  `,
  styles: [`
    .ngo-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fadeInUp 0.4s ease-out;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ---- Page Header ---- */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #111815;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title-icon { font-size: 1.5rem; }

    .page-subtitle {
      margin: 6px 0 0;
      font-size: 0.92rem;
      color: #6b7280;
      line-height: 1.5;
      max-width: 600px;
    }

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: rgba(17, 212, 138, 0.08);
      border: 1.5px solid rgba(17, 212, 138, 0.15);
      border-radius: 12px;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: #11D48A;
    }

    .stat-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    /* ---- Filters ---- */
    .filters-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: #9ca3af;
      display: flex;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 14px 48px;
      font-size: 0.95rem;
      border: 2px solid rgba(0, 0, 0, 0.06);
      border-radius: 14px;
      background: #FFFFFF;
      outline: none;
      transition: all 0.3s;
    }

    .search-input:focus {
      border-color: #11D48A;
      box-shadow: 0 0 0 4px rgba(17, 212, 138, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 14px;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-size: 0.7rem;
      color: #6b7280;
    }

    .filter-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .tabs-scroll {
      flex: 1;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .tabs-scroll::-webkit-scrollbar { display: none; }

    .tabs {
      display: flex;
      gap: 8px;
    }

    .tab-btn {
      padding: 8px 16px;
      border-radius: 10px;
      border: 1.5px solid rgba(0, 0, 0, 0.06);
      background: #FFFFFF;
      font-size: 0.85rem;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      border-color: rgba(17, 212, 138, 0.3);
      color: #11D48A;
    }

    .tab-btn.active {
      background: rgba(17, 212, 138, 0.08);
      border-color: #11D48A;
      color: #11D48A;
    }

    .sort-select {
      padding: 8px 12px;
      border-radius: 10px;
      border: 1.5px solid rgba(0, 0, 0, 0.06);
      background: #FFFFFF;
      font-size: 0.85rem;
      font-weight: 600;
      color: #111815;
      outline: none;
      cursor: pointer;
    }

    /* ---- Grid ---- */
    .ngo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
    }

    /* ---- States ---- */
    .state-container {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }

    .state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 32px;
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      max-width: 420px;
      width: 100%;
    }

    .state-icon { font-size: 3rem; margin-bottom: 16px; }
    .state-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 8px; }
    .state-message { font-size: 0.9rem; color: #6b7280; margin-bottom: 24px; }

    .retry-btn, .clear-filters-btn {
      padding: 12px 28px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
    }

    .retry-btn {
      background: #11D48A;
      color: #FFFFFF;
      border: none;
    }

    .clear-filters-btn {
      background: transparent;
      border: 2px solid rgba(17, 212, 138, 0.3);
      color: #11D48A;
    }

    /* ---- Skeleton ---- */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
      width: 100%;
    }

    .skeleton-card {
      height: 240px;
      background: #FFFFFF;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .skel-avatar { width: 56px; height: 56px; border-radius: 12px; background: #f3f4f6; }
    .skel-line { width: 60%; height: 20px; background: #f3f4f6; border-radius: 4px; margin-top: 12px; }
    .skel-body { width: 100%; height: 60px; background: #f3f4f6; border-radius: 4px; margin-top: 24px; }

    @media (max-width: 768px) {
      .filter-actions { flex-direction: column; align-items: flex-start; }
      .sort-wrapper { width: 100%; }
      .sort-select { width: 100%; }
      .ngo-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class NgoDirectoryPage implements OnInit, OnDestroy {
  public ngosService = inject(NgosService);

  searchControl = new FormControl('', { nonNullable: true });
  sortControl = new FormControl<'newest' | 'trending'>('trending', { nonNullable: true });

  causes = [
    { value: 'ALL', label: 'All Causes' },
    { value: 'Education', label: 'Education' },
    { value: 'Health', label: 'Health' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Animals', label: 'Animals' },
    { value: 'Human Rights', label: 'Human Rights' },
    { value: 'Poverty', label: 'Poverty' }
  ];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.ngosService.fetchNgos();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.ngosService.setSearch(value);
    });

    this.sortControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.ngosService.setSortBy(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setCause(cause: string): void {
    this.ngosService.setCause(cause);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.sortControl.setValue('trending');
    this.ngosService.clearFilters();
  }

  retry(): void {
    this.ngosService.fetchNgos();
  }

  trackById(_: number, ngo: any): string {
    return ngo.id;
  }
}
