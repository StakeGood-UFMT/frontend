import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketService } from '../../core/services/market.service';
import { AuthService } from '../../core/services/auth.service';
import { MarketCardComponent } from './components/market-card/market-card.component';
import { MarketFiltersComponent } from './components/market-filters/market-filters.component';
import { ProbabilityChartComponent } from './components/probability-chart/probability-chart.component';
import { derivedStatus, MarketHistoryPoint, Market } from '../../core/models/market.model';
import { lastValueFrom } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-arena',
  standalone: true,
  imports: [CommonModule, MarketCardComponent, MarketFiltersComponent, ProbabilityChartComponent, RouterModule],
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
        
        <div class="header-actions">
          <a *ngIf="isLoggedIn()" routerLink="/proposals/new" class="propose-btn" id="propose-market-btn">
            ✨ Propose Market
          </a>
          <div class="header-stats" *ngIf="!marketService.loading() && !marketService.error()">
            <div class="stat-chip">
              <span class="stat-value">{{ marketService.filteredMarkets().length }}</span>
              <span class="stat-label">Markets</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Hero Grid Section -->
      <div class="hero-grid" *ngIf="!marketService.loading() && !marketService.error() && featuredMarket()">
        <!-- Left: Featured Market with Chart -->
        <div class="featured-card">
          <div class="featured-info">
            <div class="featured-tag">FEATURED MARKET</div>
            <a [routerLink]="['/arena', featuredMarket()?.id]" class="featured-title-link">
              <h2 class="featured-title">{{ featuredMarket()?.title }}</h2>
            </a>
            <p class="featured-description">{{ featuredMarket()?.description }}</p>
            
            <div class="featured-outcomes" *ngIf="featuredMarket()">
              <div class="outcome-pill yes-pill">
                <span class="outcome-name">YES</span>
                <span class="outcome-value">{{ ((featuredMarket()?.yes_price || 0) * 100) | number:'1.0-0' }}%</span>
              </div>
              <div class="outcome-pill no-pill">
                <span class="outcome-name">NO</span>
                <span class="outcome-value">{{ ((featuredMarket()?.no_price || 0) * 100) | number:'1.0-0' }}%</span>
              </div>
            </div>
          </div>
          
          <div class="featured-chart-container">
            <app-probability-chart
              [history]="featuredMarketHistory()"
              [selectedRange]="featuredRange()"
              [assetCode]="featuredMarket()?.asset_code || 'XLM'"
              (rangeChange)="onFeaturedRangeChange($event)"
            ></app-probability-chart>
          </div>
        </div>

        <!-- Right: Sidebar Widgets -->
        <div class="sidebar-widgets">
          <!-- Latest Markets Widget -->
          <div class="widget-panel">
            <div class="widget-header">
              <span class="widget-icon">⚡</span>
              <h3 class="widget-title">Latest Markets</h3>
            </div>
            <div class="widget-list">
              <a *ngFor="let market of latestMarkets()" [routerLink]="['/arena', market.id]" class="widget-item">
                <span class="widget-item-title">{{ market.title }}</span>
                <div class="widget-item-meta">
                  <span class="widget-item-badge">{{ market.category }}</span>
                  <span class="widget-item-price" [class.yes]="(market.yes_price || 0) >= 0.5" [class.no]="(market.yes_price || 0) < 0.5">
                    YES {{ ((market.yes_price || 0) * 100) | number:'1.0-0' }}%
                  </span>
                </div>
              </a>
              <div class="widget-empty" *ngIf="latestMarkets().length === 0">
                No recent markets.
              </div>
            </div>
          </div>

          <!-- Trending Markets Widget -->
          <div class="widget-panel">
            <div class="widget-header">
              <span class="widget-icon">🔥</span>
              <h3 class="widget-title">Trending Markets</h3>
            </div>
            <div class="widget-list">
              <a *ngFor="let market of trendingMarkets()" [routerLink]="['/arena', market.id]" class="widget-item">
                <span class="widget-item-title">{{ market.title }}</span>
                <div class="widget-item-meta">
                  <span class="widget-item-vol">📊 {{ (market.total_liquidity || 0) | number:'1.0-1' }} {{ market.asset_code || 'XLM' }}</span>
                  <span class="widget-item-stakers">👥 {{ market.stakers_count || 0 }} stakers</span>
                </div>
              </a>
              <div class="widget-empty" *ngIf="trendingMarkets().length === 0">
                No trending markets.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & All Markets -->
      <div class="all-markets-section">
        <h2 class="section-title">All Markets</h2>
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .propose-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      font-size: 0.88rem;
      font-weight: 700;
      color: #FFFFFF;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }

    .propose-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
      background: linear-gradient(135deg, #7073f3, #5a52ea);
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

    /* ---- Hero Grid ---- */
    .hero-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 8px;
      animation: fadeInUp 0.5s ease-out;
    }

    .featured-card {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 18px;
      padding: 24px;
      display: grid;
      grid-template-columns: 1.2fr 1.8fr;
      gap: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      min-height: 320px;
    }

    .featured-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 12px;
    }

    .featured-tag {
      font-size: 0.65rem;
      font-weight: 800;
      color: #6366f1;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .featured-title-link {
      text-decoration: none;
      color: inherit;
    }

    .featured-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #111815;
      margin: 0;
      line-height: 1.3;
      transition: color 0.2s ease;
    }

    .featured-title-link:hover .featured-title {
      color: #11D48A;
    }

    .featured-description {
      font-size: 0.85rem;
      color: #6b7280;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .featured-outcomes {
      display: flex;
      gap: 10px;
      margin-top: 6px;
    }

    .outcome-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .yes-pill {
      background: rgba(17, 212, 138, 0.08);
      color: #0d9b66;
    }

    .no-pill {
      background: rgba(204, 90, 55, 0.08);
      color: #CC5A37;
    }

    .outcome-name {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }

    .featured-chart-container {
      position: relative;
      height: 100%;
      min-height: 250px;
    }

    /* ---- Sidebar Widgets ---- */
    .sidebar-widgets {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .widget-panel {
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .widget-header {
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.03);
      padding-bottom: 8px;
    }

    .widget-icon {
      font-size: 1.1rem;
    }

    .widget-title {
      font-size: 0.88rem;
      font-weight: 800;
      color: #111815;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .widget-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .widget-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-decoration: none;
      color: inherit;
      padding: 6px 8px;
      border-radius: 8px;
      transition: background 0.2s ease;
    }

    .widget-item:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .widget-item-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #111815;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .widget-item-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }

    .widget-item-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.04);
      color: #6b7280;
    }

    .widget-item-price {
      font-weight: 800;
    }

    .widget-item-price.yes {
      color: #0d9b66;
    }

    .widget-item-price.no {
      color: #CC5A37;
    }

    .widget-item-vol {
      color: #6b7280;
      font-weight: 600;
    }

    .widget-item-stakers {
      color: #9ca3af;
      font-weight: 500;
    }

    .widget-empty {
      font-size: 0.78rem;
      color: #9ca3af;
      text-align: center;
      padding: 12px 0;
    }

    /* ---- All Markets Section ---- */
    .all-markets-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #111815;
      margin: 10px 0 0;
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

    @media (max-width: 992px) {
      .hero-grid {
        grid-template-columns: 1fr;
      }
      .featured-card {
        grid-template-columns: 1fr;
        min-height: auto;
      }
      .featured-chart-container {
        min-height: 200px;
      }
    }

    @media (max-width: 768px) {
      .arena-page {
        padding: 4px 0;
        gap: 18px;
      }
      .page-header {
        flex-direction: column;
        gap: 16px;
      }
      .header-actions {
        width: 100%;
        justify-content: space-between;
        gap: 10px;
      }
      .propose-btn {
        flex: 1;
        justify-content: center;
        padding: 10px 14px;
        font-size: 0.82rem;
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
  private auth = inject(AuthService);
  public isLoggedIn = this.auth.isLoggedIn;

  skeletonCards = Array(6);

  // Featured Market Signals
  public featuredRange = signal<string>('1D');
  public featuredMarketHistory = signal<MarketHistoryPoint[]>([]);
  public featuredHistoryLoading = signal<boolean>(false);

  // Computes the featured market based on highest liquidity
  public featuredMarket = computed(() => {
    const active = this.marketService.markets().filter(m => derivedStatus(m) === 'active');
    if (active.length === 0) return null;
    return active.reduce((max, m) => {
      const maxLiq = parseFloat(max.total_liquidity) || 0;
      const mLiq = parseFloat(m.total_liquidity) || 0;
      return mLiq > maxLiq ? m : max;
    }, active[0]);
  });

  // Computes latest active markets (excluding featured market)
  public latestMarkets = computed(() => {
    const featured = this.featuredMarket();
    const active = this.marketService.markets()
      .filter(m => derivedStatus(m) === 'active' && m.id !== featured?.id);
    return active
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  });

  // Computes trending active markets based on stakers count or volume
  public trendingMarkets = computed(() => {
    const featured = this.featuredMarket();
    const active = this.marketService.markets()
      .filter(m => derivedStatus(m) === 'active' && m.id !== featured?.id);
    return active
      .sort((a, b) => (b.stakers_count || 0) - (a.stakers_count || 0))
      .slice(0, 3);
  });

  constructor() {
    // Reactively fetch featured market history
    effect(async () => {
      const market = this.featuredMarket();
      const range = this.featuredRange();
      if (market) {
        this.featuredHistoryLoading.set(true);
        try {
          const history = await lastValueFrom(
            this.marketService.getMarketHistory(market.id, range)
          );
          this.featuredMarketHistory.set(history || []);
        } catch (e) {
          console.error('[ArenaComponent] Failed to fetch featured market history', e);
          this.featuredMarketHistory.set([]);
        } finally {
          this.featuredHistoryLoading.set(false);
        }
      } else {
        this.featuredMarketHistory.set([]);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.marketService.fetchMarkets();
  }

  retry(): void {
    this.marketService.fetchMarkets();
  }

  clearFilters(): void {
    this.marketService.clearFilters();
  }

  trackByMarket(_: number, market: Market): string {
    return market.id;
  }

  onFeaturedRangeChange(range: string): void {
    this.featuredRange.set(range);
  }
}
