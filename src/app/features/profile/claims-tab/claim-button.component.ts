import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Claim } from '../../../core/models/claim.model';
import { ClaimService } from './claim.service';

@Component({
  selector: 'app-claim-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      (click)="onClaim($event)"
      [disabled]="claim.claimed || !claim.can_claim || isProcessing()"
      [class.btn-success]="!claim.claimed && claim.can_claim"
      [class.btn-secondary]="claim.claimed"
      class="claim-btn"
    >
      <span *ngIf="isProcessing()">
        <i class="spinner-small"></i> Processing...
      </span>
      <span *ngIf="!isProcessing()">
        {{ claim.claimed ? 'Claimed' : (claim.can_claim ? 'Claim' : 'Not Claimable') }}
      </span>
    </button>
  `,
  styles: [`
    .claim-btn {
      padding: 10px 24px;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 700;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border: none;
      min-width: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-success {
      background: linear-gradient(135deg, #11D48A, #0eb87a);
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(17, 212, 138, 0.15);
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(17, 212, 138, 0.25);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2.5px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ClaimButtonComponent {
  @Input({ required: true }) claim!: Claim;
  
  private claimService = inject(ClaimService);
  isProcessing = signal(false);

  async onClaim(event: Event) {
    event.stopPropagation();
    if (this.isProcessing()) return;

    this.isProcessing.set(true);
    try {
      await this.claimService.executeClaim(this.claim);
      // Note: The UI will update via WebSocket or re-fetch in the parent
    } catch (error) {
      // Error handled in service (toast)
    } finally {
      this.isProcessing.set(false);
    }
  }
}
