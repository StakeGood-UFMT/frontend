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
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      min-width: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-success {
      background: var(--success-green, #10b981);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #374151;
      color: #9ca3af;
      cursor: not-allowed;
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner-small {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
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
