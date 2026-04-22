import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketService } from '../../core/services/market.service';
import { MarketCardComponent } from './components/market-card/market-card.component';
import { MarketFiltersComponent } from './components/market-filters/market-filters.component';

@Component({
  selector: 'app-arena',
  standalone: true,
  imports: [CommonModule, MarketCardComponent, MarketFiltersComponent],
  template: `
    <div class="arena-page" id="arena-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <span class="title-icon">🏆</span>
            Arena
          </h1>
          <p class="page-subtitle">
            Discover and stake on prediction markets. Find the right question, pick your side.
          </p>
        </div>
        <div class="header-stats" *ngIf="!marketService.loading() && !marketService.error()">
          <div class="stat-chip">
            <span class="stat-value">{{ marketService.filteredMarkets().length }}</span>
            <span class="stat-label">Markets</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <app-market-filters></app-market-filters>

      <!-- Loading State -->
      <div class="state-container" *ngIf="marketService.loading()">
        <div class="loading-grid">
          <div class="skeleton-card" *ngFor="let _ of skeletonCards">
            <div class="skel-header">
              <div class="skel-badge"></div>
              <div class="skel-status"></div>
            </div>
            <div class="skel-title"></div>
            <div class="skel-desc"></div>
            <div class="skel-bar"></div>
            <div class="skel-footer">
              <div class="skel-volume"></div>
              <div class="skel-date"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div class="state-container" *ngIf="marketService.error() && !marketService.loading()" id="arena-error-state">
        <div class="state-card error-state">
          <div class="state-icon">⚠️</div>
          <h2 class="state-title">Something went wrong</h2>
          <p class="state-message">{{ marketService.error() }}</p>
          <button class="retry-btn" (click)="retry()" id="arena-retry-btn">
            <span class="retry-icon">↻</span>
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div class="state-container" *ngIf="marketService.isEmpty() && !marketService.loading()" id="arena-empty-state">
        <div class="state-card empty-state">
          <div class="state-icon">🔍</div>
          <h2 class="state-title">No markets found</h2>
          <p class="state-message">Try adjusting your search or filters to find what you're looking for.</p>
          <button class="clear-filters-btn" (click)="clearFilters()" id="arena-clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Market Grid -->
      <div
        class="market-grid"
        *ngIf="!marketService.loading() && !marketService.error() && !marketService.isEmpty()"
        id="market-grid"
      >
        <app-market-card
          *ngFor="let market of marketService.filteredMarkets(); trackBy: trackByMarket"
          [market]="market"
          class="grid-item"
        ></app-market-card>
      </div>
    </div>
  `,
  styles: [`
    .arena-page {
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

    .title-icon {
      font-size: 1.5rem;
    }

    .page-subtitle {
      margin: 6px 0 0;
      font-size: 0.92rem;
      color: #6b7280;
      line-height: 1.5;
    }

    .header-stats {
      flex-shrink: 0;
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
      letter-spacing: 0.5px;
    }

    /* ---- Market Grid ---- */
    .market-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
      animation: fadeInUp 0.5s ease-out 0.1s both;
    }

    .grid-item {
      display: flex;
    }

    /* ---- Loading Skeleton ---- */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .skeleton-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 24px;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .skel-header {
      display: flex;
      justify-content: space-between;
    }

    .skel-badge {
      width: 80px;
      height: 22px;
      border-radius: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite ease-in-out;
    }

    .skel-status {
      width: 60px;
      height: 18px;
      border-radius: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite ease-in-out 0.1s;
    }

    .skel-title {
      width: 85%;
      height: 20px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite ease-in-out 0.2s;
    }

    .skel-desc {
      width: 65%;
      height: 14px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite ease-in-out 0.3s;
    }

    .skel-bar {
      width: 100%;
      height: 8px;
      border-radius: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite ease-in-out 0.4s;
    }

    .skel-footer {
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.03);
    }

    .skel-volume {
      width: 100px;
      height: 14px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite ease-in-out 0.5s;
    }

    .skel-date {
      width: 80px;
      height: 14px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite ease-in-out 0.6s;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ---- State Cards ---- */
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
      animation: fadeInUp 0.4s ease-out;
    }

    .state-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .state-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111815;
      margin: 0 0 8px;
    }

    .state-message {
      font-size: 0.9rem;
      color: #6b7280;
      line-height: 1.5;
      margin: 0 0 24px;
    }

    .retry-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 28px;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #11D48A, #0eb87a);
      color: #FFFFFF;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(17, 212, 138, 0.3);
    }

    .retry-icon {
      font-size: 1.1rem;
    }

    .clear-filters-btn {
      padding: 12px 28px;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      border: 2px solid rgba(17, 212, 138, 0.3);
      border-radius: 12px;
      background: transparent;
      color: #11D48A;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .clear-filters-btn:hover {
      background: rgba(17, 212, 138, 0.08);
      border-color: #11D48A;
    }

    @media (max-width: 768px) {
      .arena-page {
        padding: 4px 0;
        gap: 18px;
      }
      .page-header {
        flex-direction: column;
        gap: 12px;
      }
      .page-title {
        font-size: 1.4rem;
      }
      .market-grid,
      .loading-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ArenaComponent implements OnInit {
  public marketService = inject(MarketService);

  skeletonCards = Array(6);

  ngOnInit(): void {
    this.marketService.fetchMarkets();
  }

  retry(): void {
    this.marketService.fetchMarkets();
  }

  clearFilters(): void {
    this.marketService.clearFilters();
  }

  trackByMarket(_: number, market: any): string {
    return market.id;
  }
}
