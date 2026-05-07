import { Component, Input, signal, computed, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Market } from '../../../../core/models/market.model';
import { StakeService } from '../../../../core/services/stake.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { UserPositionSelectorComponent } from '../user-position-selector/user-position-selector.component';

@Component({
  selector: 'app-stake-form',
  standalone: true,
  imports: [CommonModule, FormsModule, UserPositionSelectorComponent],
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
        <div class="pools" *ngIf="market.yes_pool !== undefined && market.no_pool !== undefined">
          <div class="pool-row">
            <span class="pool-label">YES Pool</span>
            <span class="pool-value">{{ market.yes_pool | number:'1.2-2' }} XLM</span>
          </div>
          <div class="pool-row">
            <span class="pool-label">NO Pool</span>
            <span class="pool-value">{{ market.no_pool | number:'1.2-2' }} XLM</span>
          </div>
          <div class="pool-row total">
            <span class="pool-label">Total Staked</span>
            <span class="pool-value">{{ totalStaked().toFixed(2) }} XLM</span>
          </div>
        </div>

        <div class="input-group">
          <label>Amount (XLM)</label>
          <div class="quick-row">
            <button class="quick-btn" (click)="setAmount(5)" [disabled]="isSubmitting()">5</button>
            <button class="quick-btn" (click)="setAmount(10)" [disabled]="isSubmitting()">10</button>
            <button class="quick-btn" (click)="setAmount(20)" [disabled]="isSubmitting()">20</button>
          </div>
          <div class="input-wrapper">
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
            <span class="currency">XLM</span>
          </div>
        </div>

        <div class="summary">
          <div class="summary-row">
            <span>Est. Shares</span>
            <span class="value">{{ estimatedShares().toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Potential Payout</span>
            <span class="value success">{{ potentialPayout().toFixed(2) }} XLM</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="fees-section">
            <div class="summary-row fee">
              <span>NGO Fee ({{ (market.fee_ngo * 100).toFixed(2) }}%)</span>
              <span>{{ fees().ngo.toFixed(4) }} XLM</span>
            </div>
            <div class="summary-row fee">
              <span>Platform Fee ({{ (market.fee_platform * 100).toFixed(2) }}%)</span>
              <span>{{ fees().platform.toFixed(4) }} XLM</span>
            </div>
            <div class="summary-row fee">
              <span>Gamification ({{ (market.fee_gamification * 100).toFixed(3) }}%)</span>
              <span>{{ fees().gamification.toFixed(4) }} XLM</span>
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
          This market is closed for new stakes.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .stake-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 2rem;
    }
    .tabs {
      display: flex;
      padding: 0.5rem;
      gap: 0.5rem;
      background: #F9FAFB;
    }
    .tabs button {
      flex: 1;
      border: none;
      padding: 0.5rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.85rem;
    }
    .tab-yes { color: #11D48A; background: transparent; }
    .tab-yes.active { background: #11D48A; color: white; }
    .tab-no { color: #CC5A37; background: transparent; }
    .tab-no.active { background: #CC5A37; color: white; }

    .form-content {
      padding: 1rem;
    }
    .pools {
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      border-radius: 10px;
      padding: 0.75rem;
      margin-bottom: 0.9rem;
    }
    .pool-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      color: #6B7280;
      margin-bottom: 0.25rem;
    }
    .pool-row.total {
      margin-top: 0.4rem;
      padding-top: 0.4rem;
      border-top: 1px solid #E5E7EB;
      font-weight: 800;
      color: #111827;
    }
    .pool-value { font-weight: 800; color: #111827; }
    .pool-label { font-weight: 700; }
    .input-group label {
      display: block;
      font-size: 0.7rem;
      font-weight: 800;
      color: #9CA3AF;
      margin-bottom: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .quick-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .quick-btn {
      flex: 1;
      border: 1px solid #E5E7EB;
      background: #F9FAFB;
      border-radius: 10px;
      padding: 0.45rem 0.5rem;
      font-weight: 900;
      font-size: 0.8rem;
      color: #374151;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .quick-btn:hover:not(:disabled) { border-color: #11D48A; background: white; }
    .quick-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .input-wrapper {
      display: grid;
      grid-template-columns: 40px 1fr 40px auto;
      gap: 0.5rem;
      align-items: center;
    }
    .step-btn {
      border: 2px solid #F3F4F6;
      background: #F9FAFB;
      width: 40px;
      height: 38px;
      border-radius: 10px;
      font-weight: 900;
      font-size: 1.05rem;
      cursor: pointer;
      color: #374151;
      transition: border-color 0.15s, background 0.15s;
    }
    .step-btn:hover:not(:disabled) { border-color: #11D48A; background: white; }
    .step-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .input-wrapper input {
      width: 100%;
      padding: 0.65rem;
      border: 2px solid #F3F4F6;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      outline: none;
      transition: all 0.2s;
      background: #F9FAFB;
    }
    .input-wrapper input:focus {
      border-color: #11D48A;
      background: white;
    }
    .currency {
      font-weight: 700;
      color: #9CA3AF;
      font-size: 0.7rem;
      padding-right: 0.25rem;
    }

    .summary {
      margin-top: 1rem;
      background: #F9FAFB;
      padding: 0.75rem;
      border-radius: 8px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #6B7280;
      margin-bottom: 0.25rem;
    }
    .summary-row.fee {
      font-size: 0.65rem;
      opacity: 0.7;
    }
    .value {
      font-weight: 600;
      color: #1F2937;
    }
    .value.success {
      color: #11D48A;
    }
    .divider {
      height: 1px;
      background: #E5E7EB;
      margin: 0.5rem 0;
    }

    .submit-btn {
      width: 100%;
      margin-top: 1rem;
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      background: #11D48A;
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .submit-btn:hover { 
      background: #0FB978;
      box-shadow: 0 10px 15px -3px rgba(17, 212, 138, 0.3);
      transform: translateY(-1px);
    }
    .submit-btn:active { transform: translateY(0); }
    .submit-btn.no { 
      background: #CC5A37;
      box-shadow: 0 4px 6px -1px rgba(204, 90, 55, 0.2);
    }
    .submit-btn.no:hover {
      background: #B54D2E;
      box-shadow: 0 10px 15px -3px rgba(204, 90, 55, 0.3);
    }
    .submit-btn:disabled {
      background: #D1D5DB;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-spinner {
      display: inline-block;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .status-msg {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: #6B7280;
      text-align: center;
      background: #F3F4F6;
      padding: 0.5rem;
      border-radius: 6px;
      font-style: italic;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
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
  isMarketClosed = computed(() => {
    if (!this.market) return true;
    if (this.market.status !== 'active') return true;
    const lockAt = new Date(this.market.lock_at);
    if (!Number.isFinite(lockAt.getTime())) return false;
    return new Date() >= lockAt;
  });

  constructor() {
    // Effect to ensure side is not blocked when user position changes
    // We can use ngOnInit or a simple effect if we want it reactive
  }

  ngOnInit() {
    this.enforceNoHedge();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['market']) {
      this.enforceNoHedge();
    }
  }

  private enforceNoHedge() {
    const userPos = this.market.user_position;
    if (userPos?.outcome && userPos.outcome !== this.side()) {
      this.side.set(userPos.outcome);
    }
  }

  isValid() {
    const isOutcomeBlocked = this.market.user_position?.outcome && 
                            this.market.user_position.outcome !== this.side();
    
    return this.amount() > 0 && 
           this.authService.isLoggedIn() && 
           !isOutcomeBlocked && 
           !this.isMarketClosed();
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
        this.amount()
      );
      // Reset amount on success
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
    // Simplification: 1 share = 1 USDC on resolution
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
}
