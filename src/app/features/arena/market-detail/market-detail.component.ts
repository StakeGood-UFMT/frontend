import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter } from 'rxjs';
import * as MarketActions from '../../../core/store/market/market.actions';
import * as MarketSelectors from '../../../core/store/market/market.selectors';
import { ProbabilityChartComponent } from '../components/probability-chart/probability-chart.component';
import { StakeFormComponent } from '../components/stake-form/stake-form.component';

@Component({
  selector: 'app-market-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ProbabilityChartComponent, StakeFormComponent],
  template: `
    <div class="market-detail-container" *ngIf="market$ | async as market">
      <div class="header-nav">
        <a routerLink="/arena" class="back-link">← Back to Arena</a>
      </div>

      <div class="main-layout">
        <!-- Left Content: Market Info + Chart -->
        <div class="content-side">
          <div class="market-header">
            <span class="category-badge">{{ market.category }}</span>
            <h1>{{ market.title }}</h1>
            <p class="description">{{ market.description }}</p>
          </div>

          <div class="chart-section">
            <app-probability-chart 
              [history]="(history$ | async) || []" 
              [selectedRange]="selectedRange"
              (rangeChange)="onRangeChange($event)">
            </app-probability-chart>
          </div>

          <div class="resolution-details">
            <h2>Resolution Details</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="label">Rule</span>
                <p>{{ market.resolution_rule }}</p>
              </div>
              <div class="detail-item">
                <span class="label">Source</span>
                <p>
                  <a [href]="market.oracle_url" target="_blank" *ngIf="market.oracle_url; else noLink">
                    {{ market.resolution_source }} ↗
                  </a>
                  <ng-template #noLink>{{ market.resolution_source }}</ng-template>
                </p>
              </div>
              <div class="detail-item" *ngIf="market.contract_address">
                <span class="label">Smart Contract</span>
                <p class="mono">{{ market.contract_address }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Content: Stake Form (Sticky) -->
        <div class="form-side">
          <app-stake-form [market]="market"></app-stake-form>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-overlay" *ngIf="loading$ | async">
      <div class="spinner"></div>
      <p>Loading market details...</p>
    </div>

    <!-- Error State -->
    <div class="error-container" *ngIf="error$ | async as error">
      <div class="error-card">
        <h3>Oops! Something went wrong</h3>
        <p>{{ error }}</p>
        <button (click)="retry()" class="retry-btn">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .market-detail-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem 2rem;
    }
    .header-nav {
      margin-bottom: 0.5rem;
    }
    .back-link {
      color: #6B7280;
      text-decoration: none;
      font-size: 0.75rem;
      font-weight: 600;
      transition: color 0.2s;
    }
    .back-link:hover { color: #11D48A; }

    .main-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .main-layout {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }

    .category-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      background: #E8FBF4;
      color: #11D48A;
      border-radius: 99px;
      font-size: 0.7rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
    }

    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 0.5rem;
      line-height: 1.1;
      letter-spacing: -0.025em;
    }

    .description {
      font-size: 1rem;
      color: #6B7280;
      margin-bottom: 1.25rem;
      max-width: 800px;
      line-height: 1.5;
    }

    .chart-section {
      height: 340px;
      margin-bottom: 1.5rem;
    }

    .resolution-details {
      background: white;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px -10px rgba(0, 0, 0, 0.1);
      border: 1px solid #F3F4F6;
    }

    .resolution-details h2 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      color: #111827;
    }

    .details-grid {
      display: flex;
      gap: 3rem;
      flex-wrap: wrap;
    }

    .detail-item .label {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9CA3AF;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .detail-item p {
      color: #1F2937;
      font-weight: 500;
      line-height: 1.5;
    }

    .detail-item a {
      color: #11D48A;
      text-decoration: none;
    }

    .mono {
      font-family: monospace;
      font-size: 0.875rem;
      background: #F3F4F6;
      padding: 0.5rem;
      border-radius: 6px;
      word-break: break-all;
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #F3F4F6;
      border-top-color: #11D48A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-container {
      display: flex;
      justify-content: center;
      padding: 5rem 1rem;
    }

    .error-card {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      max-width: 400px;
    }

    .retry-btn {
      margin-top: 1.5rem;
      padding: 0.75rem 2rem;
      background: #11D48A;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
  `]
})
export class MarketDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  
  marketId = this.route.snapshot.paramMap.get('id');
  selectedRange = '1D';

  market$ = this.store.select(MarketSelectors.selectSelectedMarket);
  history$ = this.store.select(MarketSelectors.selectMarketHistory);
  loading$ = this.store.select(MarketSelectors.selectLoadingMarket);
  error$ = this.store.select(MarketSelectors.selectMarketError);

  ngOnInit() {
    if (this.marketId) {
      this.store.dispatch(MarketActions.loadMarket({ id: this.marketId }));
      this.store.dispatch(MarketActions.loadHistory({ id: this.marketId, range: this.selectedRange }));
    }
  }

  ngOnDestroy() {
    this.store.dispatch(MarketActions.clearSelectedMarket());
  }

  onRangeChange(range: string) {
    this.selectedRange = range;
    if (this.marketId) {
      this.store.dispatch(MarketActions.loadHistory({ id: this.marketId, range }));
    }
  }

  retry() {
    if (this.marketId) {
      this.store.dispatch(MarketActions.loadMarket({ id: this.marketId }));
      this.store.dispatch(MarketActions.loadHistory({ id: this.marketId, range: this.selectedRange }));
    }
  }
}
