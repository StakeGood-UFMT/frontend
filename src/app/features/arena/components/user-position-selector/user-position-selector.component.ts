import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserPosition } from '../../../../core/models/market.model';

@Component({
  selector: 'app-user-position-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="selector-container">
      <div class="tabs">
        <button 
          [class.active]="selected === 'YES'" 
          [class.blocked]="isBlocked('YES')"
          [disabled]="isBlocked('YES')"
          (click)="selectSide('YES')" 
          [title]="getBlockReason('YES')"
          class="tab-yes"
        >
          YES {{ (yesPrice * 100).toFixed(0) }}¢
        </button>
        
        <button 
          [class.active]="selected === 'NO'" 
          [class.blocked]="isBlocked('NO')"
          [disabled]="isBlocked('NO')"
          (click)="selectSide('NO')" 
          [title]="getBlockReason('NO')"
          class="tab-no"
        >
          NO {{ (noPrice * 100).toFixed(0) }}¢
        </button>
      </div>

      <div class="hedge-warning" *ngIf="hasOppositePosition()">
        <span class="warning-icon">⚠️</span>
        <p>Hedging is not allowed. You have a position in the opposite outcome.</p>
      </div>
    </div>
  `,
  styles: [`
    .selector-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .tabs {
      display: flex;
      padding: 0.5rem;
      gap: 0.5rem;
      background: #F9FAFB;
      border-radius: 12px;
    }
    .tabs button {
      flex: 1;
      border: none;
      padding: 0.65rem;
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

    button.blocked {
      opacity: 0.4;
      cursor: not-allowed;
      filter: grayscale(0.5);
    }

    .hedge-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem;
      background: #FFF7ED;
      border: 1px solid #FFEDD5;
      border-radius: 8px;
      margin-top: 0.25rem;
    }
    .hedge-warning p {
      margin: 0;
      font-size: 0.7rem;
      color: #9A3412; /* Darker terracotta/warning color */
      font-weight: 600;
    }
    .warning-icon { font-size: 0.9rem; }
  `]
})
export class UserPositionSelectorComponent {
  @Input() selected: 'YES' | 'NO' = 'YES';
  @Input() userPosition?: UserPosition;
  @Input() yesPrice: number = 0;
  @Input() noPrice: number = 0;

  @Output() selectionChange = new EventEmitter<'YES' | 'NO'>();

  isBlocked(outcome: 'YES' | 'NO'): boolean {
    if (!this.userPosition || !this.userPosition.outcome) return false;
    return this.userPosition.outcome !== outcome;
  }

  getBlockReason(outcome: 'YES' | 'NO'): string {
    if (this.isBlocked(outcome)) {
      return 'Hedging is not allowed. You have a position in the opposite outcome.';
    }
    return '';
  }

  hasOppositePosition(): boolean {
    return !!(this.userPosition?.outcome && this.userPosition.outcome !== this.selected);
  }

  selectSide(side: 'YES' | 'NO') {
    if (!this.isBlocked(side)) {
      this.selectionChange.emit(side);
    }
  }
}
