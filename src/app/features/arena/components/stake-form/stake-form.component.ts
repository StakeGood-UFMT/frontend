import { Component, Input, signal, computed, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Market } from '../../../../core/models/market.model';
import { StakeService } from '../../../../core/services/stake.service';
import { AuthService } from '../../../../core/services/auth.service';

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
        <div class="input-group">
          <label>Amount (USDC)</label>
          <div class="input-wrapper">
            <input 
              type="number" 
              [(ngModel)]="amount" 
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
            <span class="currency">USDC</span>
          </div>
        </div>

        <div class="summary">
          <div class="summary-row">
            <span>Est. Shares</span>
            <span class="value">{{ estimatedShares().toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Potential Payout</span>
            <span class="value success">{{ potentialPayout().toFixed(2) }} USDC</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="fees-section">
            <div class="summary-row fee">
              <span>NGO Fee ({{ market.fee_ngo }}%)</span>
              <span>{{ fees().ngo.toFixed(4) }} USDC</span>
            </div>
            <div class="summary-row fee">
              <span>Platform Fee ({{ market.fee_platform }}%)</span>
              <span>{{ fees().platform.toFixed(4) }} USDC</span>
            </div>
            <div class="summary-row fee">
              <span>Gamification ({{ market.fee_gamification }}%)</span>
              <span>{{ fees().gamification.toFixed(4) }} USDC</span>
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

        <p class="status-msg" *ngIf="market.status !== 'active'">
          This market is {{ market.status }} and closed for new stakes.
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
    .input-group label {
      display: block;
      font-size: 0.7rem;
      font-weight: 800;
      color: #9CA3AF;
      margin-bottom: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-wrapper input {
      width: 100%;
      padding: 0.65rem;
      padding-right: 3rem;
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
      position: absolute;
      right: 0.65rem;
      font-weight: 700;
      color: #9CA3AF;
      font-size: 0.7rem;
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

  @Input({ required: true }) market!: Market;
  
  side = signal<'YES' | 'NO'>('YES');
  amount = 0;
  isSubmitting = signal(false);

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
    
    return this.amount > 0 && 
           this.authService.isLoggedIn() && 
           !isOutcomeBlocked && 
           this.market.status === 'active';
  }

  async submitStake() {
    if (!this.isValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      await this.stakeService.placeStake(
        this.market.id,
        this.side(),
        this.amount
      );
      // Reset amount on success
      this.amount = 0;
    } catch (error) {
      // Error handled by service toast
    } finally {
      this.isSubmitting.set(false);
    }
  }

  estimatedShares = computed(() => {
    const price = this.side() === 'YES' ? (this.market.yes_price || 0) : (this.market.no_price || 0);
    if (this.amount <= 0 || price <= 0) return 0;
    return this.amount / price;
  });

  potentialPayout = computed(() => {
    if (this.amount <= 0) return 0;
    // Simplification: 1 share = 1 USDC on resolution
    return this.estimatedShares();
  });

  fees = computed(() => {
    const amt = this.amount || 0;
    return {
      ngo: amt * (this.market.fee_ngo / 100),
      platform: amt * (this.market.fee_platform / 100),
      gamification: amt * (this.market.fee_gamification / 100)
    };
  });
}
