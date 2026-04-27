import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vote-summary-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-bar" [class.over-limit]="totalCost > credits">
      <div class="summary-content">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">Total Credits</span>
            <span class="stat-value">{{ credits }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">Credits Used</span>
            <span class="stat-value" [class.error]="totalCost > credits">{{ totalCost }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">Remaining</span>
            <span class="stat-value highlight">{{ credits - totalCost }}</span>
          </div>
        </div>
        
        <button 
          class="submit-btn" 
          [disabled]="totalCost === 0 || totalCost > credits || disabled"
          (click)="onSubmit.emit()"
        >
          <span class="btn-text">Confirm My Vote</span>
          <span class="btn-icon">🗳️</span>
        </button>
      </div>

      <div class="progress-container">
        <div class="progress-bar" [style.width.%]="progressPercent" [class.error]="totalCost > credits"></div>
      </div>
    </div>
  `,
  styles: [`
    .summary-bar {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 48px);
      max-width: 900px;
      background: #111815;
      border-radius: 24px;
      padding: 16px 24px;
      color: white;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideUp {
      from { transform: translate(-50%, 100px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }

    .summary-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }

    .stats {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
    }

    .stat-value.highlight {
      color: var(--primary-color, #11D48A);
    }

    .stat-value.error {
      color: #ff4d4d;
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
    }

    .submit-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--primary-color, #11D48A);
      color: #111815;
      border: none;
      border-radius: 16px;
      padding: 12px 24px;
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .submit-btn:hover:not(:disabled) {
      transform: scale(1.02);
      box-shadow: 0 8px 20px rgba(17, 212, 138, 0.3);
    }

    .submit-btn:disabled {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.3);
      cursor: not-allowed;
    }

    .progress-container {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: var(--primary-color, #11D48A);
      transition: width 0.3s ease, background-color 0.3s ease;
    }

    .progress-bar.error {
      background: #ff4d4d;
    }

    @media (max-width: 768px) {
      .summary-bar {
        bottom: 12px;
        width: calc(100% - 24px);
        padding: 12px 16px;
      }
      .stat-divider {
        display: none;
      }
      .stats {
        gap: 12px;
      }
      .stat-label {
        font-size: 0.65rem;
      }
      .stat-value {
        font-size: 0.95rem;
      }
      .submit-btn {
        padding: 10px 16px;
        font-size: 0.9rem;
      }
    }
  `]
})
export class VoteSummaryBarComponent {
  @Input() credits = 0;
  @Input() totalCost = 0;
  @Input() disabled = false;
  
  @Output() onSubmit = new EventEmitter<void>();

  get progressPercent(): number {
    if (this.credits === 0) return 0;
    return Math.min((this.totalCost / this.credits) * 100, 100);
  }
}
