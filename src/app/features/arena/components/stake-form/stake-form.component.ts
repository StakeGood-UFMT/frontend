import { Component, Input, signal, computed, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Market } from '../../../../core/models/market.model';
import { StakeService } from '../../../../core/services/stake.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { UserPositionSelectorComponent } from '../user-position-selector/user-position-selector.component';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-stake-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UserPositionSelectorComponent],
  template: `
    <div class="stake-card">
      <app-user-position-selector
        [selected]="side()"
        [userPosition]="market.user_position"
        [yesPrice]="market.yes_price || 0"
        [noPrice]="market.no_price || 0"
        (selectionChange)="side.set($event)"
      ></app-user-position-selector>

      <div class="form-content">
        <!-- Compact Liquidity Stats -->
        <div class="liquidity-summary" *ngIf="market.yes_pool !== undefined">
          <div class="stat-item">
            <span class="stat-label">YES Pool</span>
            <span class="stat-value">{{ market.yes_pool | number:'1.2-2' }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">NO Pool</span>
            <span class="stat-value">{{ market.no_pool | number:'1.2-2' }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">Total</span>
            <span class="stat-value">{{ totalStaked().toFixed(2) }}</span>
          </div>
        </div>

        <div class="input-group">
          <div class="label-row">
            <label>Amount ({{ (market.asset_code || 'XLM').toUpperCase() }})</label>
          </div>
          <div class="input-wrapper">
            <div class="quick-chips">
              <button class="chip" (click)="setAmount(5)" [disabled]="isSubmitting()">5</button>
              <button class="chip" (click)="setAmount(10)" [disabled]="isSubmitting()">10</button>
              <button class="chip" (click)="setAmount(20)" [disabled]="isSubmitting()">20</button>
            </div>
            <div class="main-input">
              <button class="step-btn" (click)="increment(-1)" [disabled]="isSubmitting() || amount() <= 0">−</button>
              <input 
                type="number" 
                [ngModel]="amount()" 
                (ngModelChange)="onAmountChange($event)"
                placeholder="0.00"
                min="0"
                step="1"
              />
              <button class="step-btn" (click)="increment(1)" [disabled]="isSubmitting()">+</button>
            </div>
          </div>
        </div>

        <div class="input-group" *ngIf="(market.ngo_candidates || []).length === 3">
          <label>Vote for NGO <span class="label-hint">(Counts if you win)</span></label>
          <div class="ngo-grid">
            <button
              type="button"
              class="ngo-card"
              *ngFor="let ngo of market.ngo_candidates"
              [class.active]="selectedNgoId() === ngo.on_chain_id"
              (click)="selectedNgoId.set(ngo.on_chain_id)"
              [disabled]="isSubmitting()"
              [title]="ngo.name"
            >
              <a 
                *ngIf="ngo.id"
                [routerLink]="['/ngos', ngo.id]" 
                target="_blank" 
                class="ngo-link"
                (click)="$event.stopPropagation()"
                title="View NGO details"
              >
                ↗
              </a>
              <img class="ngo-card-logo" [src]="ngo.logo_url || '/logo.png'" [alt]="ngo.name" (error)="onImageError($event)" />
              <span class="ngo-card-name">{{ ngo.name }}</span>
            </button>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-row main">
            <div class="summary-item">
              <span class="label">Est. Shares</span>
              <span class="value">{{ estimatedShares().toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Potential Payout</span>
              <span class="value success">{{ potentialPayout().toFixed(2) }} {{ (market.asset_code || 'XLM').toUpperCase() }}</span>
            </div>
          </div>
          
          <div class="fees-collapsible">
            <button class="fees-toggle" (click)="showFees.set(!showFees())">
              <span>Fees Details</span>
              <span class="arrow" [class.open]="showFees()">▾</span>
            </button>
            
            <div class="fees-content" *ngIf="showFees()">
              <div class="fee-row">
                <span>NGO ({{ (market.fee_ngo * 100).toFixed(1) }}%)</span>
                <span>{{ fees().ngo.toFixed(4) }} {{ (market.asset_code || 'XLM').toUpperCase() }}</span>
              </div>
              <div class="fee-row">
                <span>Platform ({{ (market.fee_platform * 100).toFixed(1) }}%)</span>
                <span>{{ fees().platform.toFixed(4) }} {{ (market.asset_code || 'XLM').toUpperCase() }}</span>
              </div>
              <div class="fee-row">
                <span>Gamification ({{ (market.fee_gamification * 100).toFixed(2) }}%)</span>
                <span>{{ fees().gamification.toFixed(4) }} {{ (market.asset_code || 'XLM').toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>


        <button 
          class="submit-btn" 
          [class.no]="side() === 'NO'" 
          [disabled]="!isValid() || isSubmitting()"
          (click)="submitStake()"
        >
          <span *ngIf="!isSubmitting()">Stake {{ side() }}</span>
          <span *ngIf="isSubmitting()" class="btn-spinner"></span>
        </button>

        <p class="status-msg" *ngIf="isMarketClosed()">
          This market is closed.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .stake-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.15);
      position: sticky;
      top: 2rem;
      border: 1px solid #F3F4F6;
    }

    .form-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .liquidity-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #F9FAFB;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid #F3F4F6;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .stat-value {
      font-size: 0.85rem;
      font-weight: 900;
      color: #111827;
    }
    .stat-divider {
      width: 1px;
      height: 20px;
      background: #E5E7EB;
    }

    .input-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 800;
      color: #374151;
      margin-bottom: 0.5rem;
    }
    .label-hint {
      color: #9CA3AF;
      font-weight: 600;
      font-size: 0.7rem;
    }

    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-chips {
      display: flex;
      gap: 0.4rem;
    }
    .chip {
      flex: 1;
      border: 1px solid #E5E7EB;
      background: white;
      border-radius: 8px;
      padding: 0.4rem;
      font-weight: 800;
      font-size: 0.8rem;
      color: #4B5563;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chip:hover:not(:disabled) { border-color: #11D48A; color: #11D48A; background: #E8FBF4; }
    .chip:disabled { opacity: 0.5; cursor: not-allowed; }

    .main-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #F9FAFB;
      border: 2px solid #F3F4F6;
      border-radius: 12px;
      padding: 0.25rem;
      transition: border-color 0.2s;
    }
    .main-input:focus-within { border-color: #11D48A; background: white; }

    .step-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: white;
      color: #374151;
      font-weight: 900;
      font-size: 1.1rem;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-btn:hover:not(:disabled) { background: #F3F4F6; }

    .main-input input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 0.5rem;
      font-size: 1.1rem;
      font-weight: 900;
      color: #111827;
      text-align: center;
      outline: none;
      width: 100%;
    }
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

    .ngo-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      width: 100%;
    }
    .ngo-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      border-radius: 10px;
      border: 1px solid #F3F4F6;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 0; /* Important for grid truncation */
      position: relative; /* For the link positioning */
    }
    .ngo-link {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 0.7rem;
      color: #9CA3AF;
      text-decoration: none;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      background: rgba(243, 244, 246, 0.5);
      transition: all 0.2s;
      z-index: 2;
    }
    .ngo-link:hover {
      background: #11D48A;
      color: white;
    }
    .ngo-card:hover:not(:disabled) { border-color: #11D48A; transform: translateY(-1px); }
    .ngo-card.active { border-color: #11D48A; background: #E8FBF4; box-shadow: 0 0 0 2px rgba(17, 212, 138, 0.1); }
    .ngo-card-logo {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      object-fit: cover;
    }
    .ngo-card-name {
      font-size: 0.6rem;
      font-weight: 800;
      color: #374151;
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.2;
      height: 1.5rem; /* Fixed height for 2 lines to keep grid aligned */
    }

    .summary-section {
      background: #F9FAFB;
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid #F3F4F6;
    }
    .summary-row.main {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .summary-item .label { font-size: 0.65rem; font-weight: 800; color: #9CA3AF; text-transform: uppercase; }
    .summary-item .value { font-size: 0.9rem; font-weight: 900; color: #111827; }
    .summary-item .value.success { color: #11D48A; }

    .fees-collapsible {
      border-top: 1px solid #E5E7EB;
      padding-top: 0.5rem;
    }
    .fees-toggle {
      width: 100%;
      border: none;
      background: transparent;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
      font-size: 0.7rem;
      font-weight: 800;
      color: #6B7280;
      cursor: pointer;
    }
    .fees-toggle .arrow { transition: transform 0.2s; }
    .fees-toggle .arrow.open { transform: rotate(180deg); }

    .fees-content {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .fee-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      font-weight: 600;
      color: #9CA3AF;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 14px;
      background: #11D48A;
      color: white;
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(17, 212, 138, 0.3);
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(17, 212, 138, 0.4); }
    .submit-btn.no { background: #EF4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
    .submit-btn.no:hover:not(:disabled) { box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4); }
    .submit-btn:disabled { background: #D1D5DB; cursor: not-allowed; box-shadow: none; }

    .status-msg {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #6B7280;
      text-align: center;
      font-weight: 700;
    }

    .btn-spinner {
      display: inline-block;
      width: 1.2rem;
      height: 1.2rem;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class StakeFormComponent implements OnInit, OnChanges {
  private stakeService = inject(StakeService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);

  @Input({ required: true }) market!: Market;
  
  side = signal<'YES' | 'NO'>('YES');
  amount = signal(0);
  isSubmitting = signal(false);
  selectedNgoId = signal<number | null>(null);
  showFees = signal(false);

  isMarketClosed = computed(() => {
    if (!this.market) return true;
    if (this.market.status !== 'active') return true;
    const lockAt = new Date(this.market.lock_at);
    if (!Number.isFinite(lockAt.getTime())) return false;
    return new Date() >= lockAt;
  });

  constructor() {}

  ngOnInit() {
    this.enforceNoHedge();
    this.ensureSelectedNgo();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['market']) {
      this.enforceNoHedge();
      this.ensureSelectedNgo();
    }
  }

  private enforceNoHedge() {
    const userPos = this.market.user_position;
    if (userPos?.outcome && userPos.outcome !== this.side()) {
      this.side.set(userPos.outcome);
    }
  }

  private ensureSelectedNgo() {
    const candidates = this.market?.ngo_candidates ?? [];
    if (!Array.isArray(candidates) || candidates.length !== 3) {
      this.selectedNgoId.set(null);
      return;
    }
    const ids = candidates.map((c) => c.on_chain_id);
    const current = this.selectedNgoId();
    if (typeof current === 'number' && ids.includes(current)) return;
    this.selectedNgoId.set(ids[0]);
  }

  isValid() {
    const isOutcomeBlocked = this.market.user_position?.outcome && 
                            this.market.user_position.outcome !== this.side();
    const ngoOk =
      typeof this.selectedNgoId() === 'number' &&
      (this.market?.ngo_candidates ?? []).some(
        (n) => n.on_chain_id === this.selectedNgoId(),
      );
    
    return this.amount() > 0 && 
           this.authService.isLoggedIn() && 
           !isOutcomeBlocked && 
           !this.isMarketClosed() &&
           ngoOk;
  }

  async submitStake() {
    if (this.isSubmitting()) return;
    if (this.isMarketClosed()) {
      this.notify.error('Market is closed for new stakes.');
      return;
    }
    if (!this.isValid()) return;

    this.isSubmitting.set(true);
    try {
      await this.stakeService.placeStake(
        this.market.id,
        this.side(),
        this.amount(),
        this.selectedNgoId() as number,
      );
      this.amount.set(0);
    } catch (error) {
      // Error handled by service toast
    } finally {
      this.isSubmitting.set(false);
    }
  }

  estimatedShares = computed(() => {
    const price = this.side() === 'YES' ? (this.market.yes_price || 0) : (this.market.no_price || 0);
    const amt = this.amount();
    if (amt <= 0 || price <= 0) return 0;
    return amt / price;
  });

  potentialPayout = computed(() => {
    if (this.amount() <= 0) return 0;
    return this.estimatedShares();
  });

  fees = computed(() => {
    const amt = this.amount() || 0;
    return {
      ngo: amt * (this.market.fee_ngo || 0),
      platform: amt * (this.market.fee_platform || 0),
      gamification: amt * (this.market.fee_gamification || 0)
    };
  });

  totalStaked = computed(() => {
    const yes = Number(this.market.yes_pool ?? 0);
    const no = Number(this.market.no_pool ?? 0);
    return yes + no;
  });

  onAmountChange(val: any) {
    const next = Number(val);
    this.amount.set(Number.isFinite(next) ? Math.max(0, next) : 0);
  }

  setAmount(val: number) {
    this.amount.set(Math.max(0, Math.round(val)));
  }

  increment(delta: number) {
    const next = (this.amount() || 0) + delta;
    this.amount.set(Math.max(0, Math.round(next)));
  }
  onImageError(event: any) {
    event.target.src = '/logo.png';
  }
}
