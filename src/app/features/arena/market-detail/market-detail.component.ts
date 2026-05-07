import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import * as MarketActions from '../../../core/store/market/market.actions';
import * as MarketSelectors from '../../../core/store/market/market.selectors';
import { ProbabilityChartComponent } from '../components/probability-chart/probability-chart.component';
import { StakeFormComponent } from '../components/stake-form/stake-form.component';
import { MarketService } from '../../../core/services/market.service';
import { MarketResults } from '../../../core/models/market.model';

type ChainStatus = 'pending' | 'confirmed' | 'failed' | 'unknown';
type PositionOutcome = 'YES' | 'NO';

interface MarketPositionRow {
  id: string;
  user: { display: string };
  outcome: PositionOutcome;
  amount: number | null;
  position_status: string;
  tx_hash: string | null;
  chain_status: ChainStatus;
  created_at: string;
}

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
            <div class="close-row" *ngIf="market.lock_at">
              <span class="close-label">Closes in</span>
              <span class="close-pill">{{ formatCountdown(market.lock_at) }}</span>
              <span class="close-at">{{ market.lock_at | date:'MMM d, y, HH:mm:ss' }}</span>
            </div>
            <h1>{{ market.title }}</h1>
            <p class="description">{{ market.description }}</p>
          </div>

          <div class="tabs">
            <button class="tab" [class.active]="activeTab() === 'probability'" (click)="setTab('probability')">
              Probability
            </button>
            <button class="tab" [class.active]="activeTab() === 'details'" (click)="setTab('details')">
              Details
            </button>
            <button class="tab" [class.active]="activeTab() === 'predictions'" (click)="setTab('predictions')">
              Predictions
            </button>
            <button class="tab" [class.active]="activeTab() === 'results'" (click)="setTab('results')">
              Results
            </button>
          </div>

          <div class="tab-panel" *ngIf="activeTab() === 'probability'">
            <div class="chart-section">
              <app-probability-chart 
                [history]="(history$ | async) || []" 
                [selectedRange]="selectedRange"
                (rangeChange)="onRangeChange($event)">
              </app-probability-chart>
            </div>
          </div>

          <div class="tab-panel" *ngIf="activeTab() === 'details'">
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

          <div class="tab-panel" *ngIf="activeTab() === 'predictions'">
            <div class="positions-section">
              <div class="positions-header">
                <h2>Predictions History</h2>
                <button class="refresh-btn" (click)="loadPositions()" [disabled]="positionsLoading()">
                  {{ positionsLoading() ? 'Loading…' : 'Refresh' }}
                </button>
              </div>

              <div class="positions-loading" *ngIf="positionsLoading()">
                <div class="mini-spinner"></div>
                <span>Loading predictions…</span>
              </div>

              <div class="positions-error" *ngIf="positionsError()">
                {{ positionsError() }}
              </div>

              <div class="positions-empty" *ngIf="!positionsLoading() && !positionsError() && positions().length === 0">
                No predictions yet.
              </div>

              <div class="positions-table-wrap" *ngIf="positions().length > 0">
                <table class="positions-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Outcome</th>
                      <th>Amount</th>
                      <th>Chain</th>
                      <th>When</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of positions()">
                      <td class="mono">{{ p.user.display }}</td>
                      <td>
                        <span class="pill" [class.yes]="p.outcome === 'YES'" [class.no]="p.outcome === 'NO'">
                          {{ p.outcome }}
                        </span>
                      </td>
                      <td>{{ p.amount === null ? 'Hidden' : (p.amount | number:'1.2-2') + ' XLM' }}</td>
                      <td>
                        <span class="status" [class.ok]="p.chain_status === 'confirmed'" [class.bad]="p.chain_status === 'failed'" [class.wait]="p.chain_status === 'pending'">
                          {{ p.chain_status }}
                        </span>
                      </td>
                      <td>{{ p.created_at | date:'short' }}</td>
                      <td class="actions">
                        <a *ngIf="p.tx_hash" [href]="'https://stellar.expert/explorer/testnet/tx/' + p.tx_hash" target="_blank" class="tx-link">
                          Explorer ↗
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="tab-panel" *ngIf="activeTab() === 'results'">
            <div class="positions-section">
              <div class="positions-header">
                <h2>Results</h2>
                <button class="refresh-btn" (click)="loadResults()" [disabled]="resultsLoading()">
                  {{ resultsLoading() ? 'Loading…' : 'Refresh' }}
                </button>
              </div>

              <div class="positions-loading" *ngIf="resultsLoading()">
                <div class="mini-spinner"></div>
                <span>Loading results…</span>
              </div>

              <div class="positions-error" *ngIf="resultsError()">
                {{ resultsError() }}
              </div>

              <ng-container *ngIf="!resultsLoading() && !resultsError() && results() as r">
                <div class="positions-empty" *ngIf="!r.resolved && r.closed === false">
                  Market is still open.
                </div>

                <div *ngIf="!r.resolved && r.closed && r.projections as proj" class="results-wrap">
                  <div class="scenario-tabs">
                    <button class="scenario-tab" [class.active]="projectionOutcome() === 'YES'" (click)="projectionOutcome.set('YES')">
                      If YES wins
                    </button>
                    <button class="scenario-tab" [class.active]="projectionOutcome() === 'NO'" (click)="projectionOutcome.set('NO')">
                      If NO wins
                    </button>
                  </div>

                  <ng-container *ngIf="proj[projectionOutcome()] as s">
                    <div class="results-cards">
                      <div class="result-card">
                        <div class="result-title">Charity</div>
                        <div class="result-value">{{ s.fees.charity.amount | number:'1.2-2' }} XLM</div>
                        <div class="result-sub">{{ s.fees.charity.pct * 100 | number:'1.2-2' }}%</div>
                      </div>

                      <div class="result-card">
                        <div class="result-title">Platform Fee</div>
                        <div class="result-value">{{ s.fees.platform.amount | number:'1.2-2' }} XLM</div>
                        <div class="result-sub">{{ s.fees.platform.pct * 100 | number:'1.2-2' }}%</div>
                      </div>

                      <div class="result-card">
                        <div class="result-title">Gamification</div>
                        <div class="result-value">{{ s.fees.gamification.amount | number:'1.2-2' }} XLM</div>
                        <div class="result-sub">{{ s.fees.gamification.pct * 100 | number:'1.2-2' }}%</div>
                      </div>

                      <div class="result-card">
                        <div class="result-title">Winners (Total Payout)</div>
                        <div class="result-value">{{ s.winners_total_payout | number:'1.2-2' }} XLM</div>
                        <div class="result-sub">Profit: {{ s.winners_profit_total | number:'1.2-2' }} XLM</div>
                      </div>
                    </div>

                    <div class="positions-table-wrap" *ngIf="(s.winners?.length ?? 0) > 0; else noWinnersProjection">
                      <table class="positions-table">
                        <thead>
                          <tr>
                            <th>Wallet</th>
                            <th>Invested</th>
                            <th>Profit</th>
                            <th>Payout</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let w of s.winners">
                            <td class="mono">{{ w.wallet || 'Anonymous' }}</td>
                            <td>{{ w.invested === null ? 'Hidden' : (w.invested | number:'1.2-2') + ' XLM' }}</td>
                            <td>{{ w.profit === null ? 'Hidden' : (w.profit | number:'1.2-2') + ' XLM' }}</td>
                            <td>{{ w.payout === null ? 'Hidden' : (w.payout | number:'1.2-2') + ' XLM' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <ng-template #noWinnersProjection>
                      <div class="positions-empty">No winners found.</div>
                    </ng-template>
                  </ng-container>
                </div>

                <div *ngIf="r.resolved" class="results-wrap">
                  <div class="results-cards">
                    <div class="result-card">
                      <div class="result-title">Charity</div>
                      <div class="result-value">{{ r.fees!.charity.amount | number:'1.2-2' }} XLM</div>
                      <div class="result-sub">{{ r.fees!.charity.pct * 100 | number:'1.2-2' }}%</div>
                    </div>

                    <div class="result-card">
                      <div class="result-title">Platform Fee</div>
                      <div class="result-value">{{ r.fees!.platform.amount | number:'1.2-2' }} XLM</div>
                      <div class="result-sub">{{ r.fees!.platform.pct * 100 | number:'1.2-2' }}%</div>
                    </div>

                    <div class="result-card">
                      <div class="result-title">Gamification</div>
                      <div class="result-value">{{ r.fees!.gamification.amount | number:'1.2-2' }} XLM</div>
                      <div class="result-sub">{{ r.fees!.gamification.pct * 100 | number:'1.2-2' }}%</div>
                    </div>

                    <div class="result-card">
                      <div class="result-title">Winners (Total Payout)</div>
                      <div class="result-value">{{ r.winners_total_payout! | number:'1.2-2' }} XLM</div>
                      <div class="result-sub">Profit: {{ r.winners_profit_total! | number:'1.2-2' }} XLM</div>
                    </div>
                  </div>

                  <div class="positions-table-wrap" *ngIf="(r.winners?.length ?? 0) > 0; else noWinners">
                    <table class="positions-table">
                      <thead>
                        <tr>
                          <th>Wallet</th>
                          <th>Invested</th>
                          <th>Profit</th>
                          <th>Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let w of r.winners!">
                          <td class="mono">{{ w.wallet || 'Anonymous' }}</td>
                          <td>{{ w.invested === null ? 'Hidden' : (w.invested | number:'1.2-2') + ' XLM' }}</td>
                          <td>{{ w.profit === null ? 'Hidden' : (w.profit | number:'1.2-2') + ' XLM' }}</td>
                          <td>{{ w.payout === null ? 'Hidden' : (w.payout | number:'1.2-2') + ' XLM' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <ng-template #noWinners>
                    <div class="positions-empty">No winners found.</div>
                  </ng-template>
                </div>
              </ng-container>
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
    .close-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      color: #6B7280;
      font-weight: 700;
      flex-wrap: wrap;
    }
    .close-label {
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.7rem;
      font-weight: 900;
      color: #9CA3AF;
    }
    .close-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      border: 1px solid rgba(17, 212, 138, 0.25);
      background: rgba(17, 212, 138, 0.12);
      color: #065F46;
      font-weight: 900;
      font-size: 0.8rem;
    }
    .close-at {
      color: #6B7280;
      font-weight: 700;
      font-size: 0.75rem;
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

    .tabs {
      display: flex;
      gap: 0.5rem;
      background: #F3F4F6;
      padding: 0.25rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      width: fit-content;
    }
    .tab {
      border: none;
      background: transparent;
      padding: 0.45rem 0.85rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 900;
      cursor: pointer;
      color: #6B7280;
      transition: background 0.2s, color 0.2s, box-shadow 0.2s;
      white-space: nowrap;
    }
    .tab.active {
      background: white;
      color: #111827;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .tab-panel {
      margin-bottom: 1.25rem;
    }

    .chart-section {
      height: 340px;
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

    .positions-section {
      background: white;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
      box-shadow: 0 4px 20px -10px rgba(0, 0, 0, 0.1);
      padding: 1rem 1.25rem;
    }
    .positions-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }
    .positions-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 800;
      color: #111827;
    }
    .refresh-btn {
      border: 1px solid #E5E7EB;
      background: #F9FAFB;
      color: #374151;
      border-radius: 10px;
      padding: 0.5rem 0.8rem;
      font-weight: 800;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .positions-loading {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: #6B7280;
      font-size: 0.9rem;
      padding: 0.75rem 0;
    }
    .mini-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid #F3F4F6;
      border-top-color: #11D48A;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .positions-error {
      color: #DC2626;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.75rem 0;
    }
    .positions-empty {
      color: #6B7280;
      font-size: 0.9rem;
      padding: 0.75rem 0;
    }

    .positions-table-wrap { overflow-x: auto; }
    .positions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .positions-table th, .positions-table td {
      text-align: left;
      padding: 0.6rem 0.5rem;
      border-bottom: 1px solid #F3F4F6;
      white-space: nowrap;
    }
    .positions-table th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9CA3AF;
      font-weight: 800;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-weight: 900;
      font-size: 0.75rem;
      border: 1px solid #E5E7EB;
      background: #F9FAFB;
      color: #374151;
    }
    .pill.yes { border-color: #A7F3D0; background: #ECFDF5; color: #065F46; }
    .pill.no { border-color: #FECACA; background: #FEF2F2; color: #991B1B; }
    .status {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-weight: 900;
      font-size: 0.75rem;
      border: 1px solid #E5E7EB;
      background: #F9FAFB;
      color: #374151;
      text-transform: uppercase;
    }
    .status.ok { border-color: #A7F3D0; background: #ECFDF5; color: #065F46; }
    .status.bad { border-color: #FECACA; background: #FEF2F2; color: #991B1B; }
    .status.wait { border-color: #FDE68A; background: #FFFBEB; color: #92400E; }
    .actions { text-align: right; }
    .tx-link {
      color: #11D48A;
      text-decoration: none;
      font-weight: 800;
      font-size: 0.85rem;
    }
    .tx-link:hover { text-decoration: underline; }

    .results-wrap { display: grid; gap: 1rem; }
    .scenario-tabs {
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;
    }
    .scenario-tab {
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
      color: #111827;
      padding: 0.5rem 0.75rem;
      border-radius: 999px;
      font-weight: 900;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .scenario-tab.active {
      border-color: rgba(17, 212, 138, 0.45);
      background: #E8FBF4;
      color: #065F46;
    }
    .results-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }
    @media (max-width: 1024px) {
      .results-cards { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 520px) {
      .results-cards { grid-template-columns: 1fr; }
    }
    .result-card {
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
      border-radius: 0.85rem;
      padding: 0.9rem 1rem;
    }
    .result-title { color: #6B7280; font-weight: 800; font-size: 0.8rem; }
    .result-value { margin-top: 0.2rem; font-weight: 950; font-size: 1.15rem; color: #111827; }
    .result-sub { margin-top: 0.15rem; color: #6B7280; font-weight: 700; font-size: 0.8rem; }
  `]
})
export class MarketDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private marketService = inject(MarketService);
  
  marketId = this.route.snapshot.paramMap.get('id');
  selectedRange = '1D';
  private now = signal(Date.now());
  private nowInterval?: ReturnType<typeof setInterval>;
  private refreshInterval?: ReturnType<typeof setInterval>;
  activeTab = signal<'probability' | 'details' | 'predictions' | 'results'>(
    'probability',
  );

  market$ = this.store.select(MarketSelectors.selectSelectedMarket);
  history$ = this.store.select(MarketSelectors.selectMarketHistory);
  loading$ = this.store.select(MarketSelectors.selectLoadingMarket);
  error$ = this.store.select(MarketSelectors.selectMarketError);

  positions = signal<MarketPositionRow[]>([]);
  positionsLoading = signal(false);
  positionsError = signal<string | null>(null);

  results = signal<MarketResults | null>(null);
  resultsLoading = signal(false);
  resultsError = signal<string | null>(null);
  projectionOutcome = signal<'YES' | 'NO'>('YES');

  ngOnInit() {
    if (this.marketId) {
      this.store.dispatch(MarketActions.loadMarket({ id: this.marketId }));
      this.store.dispatch(MarketActions.loadHistory({ id: this.marketId, range: this.selectedRange }));
      this.loadPositions();
    }
    this.nowInterval = setInterval(() => this.now.set(Date.now()), 1000);
    this.refreshInterval = setInterval(() => {
      if (!this.marketId) return;
      this.store.dispatch(MarketActions.loadMarket({ id: this.marketId }));
      this.store.dispatch(
        MarketActions.loadHistory({ id: this.marketId, range: this.selectedRange }),
      );
      if (this.activeTab() === 'predictions' && !this.positionsLoading()) {
        this.loadPositions();
      }
      if (this.activeTab() === 'results' && !this.resultsLoading()) {
        this.loadResults();
      }
    }, 5000);
  }

  ngOnDestroy() {
    this.store.dispatch(MarketActions.clearSelectedMarket());
    if (this.nowInterval) clearInterval(this.nowInterval);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  onRangeChange(range: string) {
    this.selectedRange = range;
    if (this.marketId) {
      this.store.dispatch(MarketActions.loadHistory({ id: this.marketId, range }));
    }
  }

  setTab(tab: 'probability' | 'details' | 'predictions' | 'results') {
    this.activeTab.set(tab);
    if (tab === 'results' && !this.results()) {
      this.loadResults();
    }
  }

  retry() {
    if (this.marketId) {
      this.store.dispatch(MarketActions.loadMarket({ id: this.marketId }));
      this.store.dispatch(MarketActions.loadHistory({ id: this.marketId, range: this.selectedRange }));
      this.loadPositions();
    }
  }

  async loadPositions() {
    if (!this.marketId) return;
    this.positionsLoading.set(true);
    this.positionsError.set(null);
    try {
      const resp = await firstValueFrom(
        this.marketService.getMarketPositions(this.marketId, 25, 0),
      );
      this.positions.set((resp?.positions ?? []) as MarketPositionRow[]);
    } catch (e: any) {
      this.positionsError.set(
        e?.error?.message ?? 'Failed to load predictions history.',
      );
    } finally {
      this.positionsLoading.set(false);
    }
  }

  async loadResults() {
    if (!this.marketId) return;
    this.resultsLoading.set(true);
    this.resultsError.set(null);
    try {
      const resp = await firstValueFrom(this.marketService.getMarketResults(this.marketId));
      this.results.set(resp ?? null);
    } catch (e: any) {
      this.resultsError.set(e?.error?.message ?? 'Failed to load results.');
    } finally {
      this.resultsLoading.set(false);
    }
  }

  formatCountdown(lockAt: string) {
    const target = new Date(lockAt).getTime();
    const diff = Math.max(0, target - this.now());
    if (!Number.isFinite(diff) || diff <= 0) return 'Closed';

    const second = 1000;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;

    let remaining = diff;
    const months = Math.floor(remaining / month);
    remaining -= months * month;
    const days = Math.floor(remaining / day);
    remaining -= days * day;
    const hours = Math.floor(remaining / hour);
    remaining -= hours * hour;
    const minutes = Math.floor(remaining / minute);
    remaining -= minutes * minute;
    const seconds = Math.floor(remaining / second);

    const parts: string[] = [];
    if (months > 0) parts.push(`${months}mo`);
    parts.push(`${days}d`);
    parts.push(`${String(hours).padStart(2, '0')}h`);
    parts.push(`${String(minutes).padStart(2, '0')}m`);
    parts.push(`${String(seconds).padStart(2, '0')}s`);
    return parts.join(' ');
  }
}
