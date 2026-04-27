import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-distribute-impact-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="distribute-btn" 
      [class.processing]="processing()"
      [disabled]="disabled || processing()"
      (click)="onClick()"
    >
      <div class="btn-content" *ngIf="!processing()">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4-4-4"/><path d="M3 3h1v18h-1"/><path d="m21 21-4-4 4-4"/><path d="M12 10H4"/><path d="M20 14h-8"/></svg>
        <span>Distribute Impact</span>
      </div>
      <div class="loader-container" *ngIf="processing()">
        <span class="loader"></span>
        <span>Processing...</span>
      </div>
    </button>
  `,
  styles: [`
    .distribute-btn {
      background: #111815;
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 180px;
      font-family: 'Public Sans', sans-serif;
    }
    .distribute-btn:hover:not(:disabled) {
      background: #10b981;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    .distribute-btn:disabled {
      background: #f1f5f9;
      color: #cbd5e1;
      cursor: not-allowed;
    }
    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .loader-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .loader {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DistributeImpactButtonComponent {
  @Input() marketId!: string;
  @Input() disabled = false;
  @Output() distributed = new EventEmitter<any>();

  private adminService = inject(AdminService);
  private notify = inject(NotificationService);

  processing = signal(false);

  onClick() {
    if (!confirm('Are you sure you want to distribute impact for this market? This action is irreversible and will distribute funds to the associated NGO.')) {
      return;
    }

    this.processing.set(true);
    this.adminService.distributeImpact(this.marketId).subscribe({
      next: (res: any) => {
        this.distributed.emit(res);
        this.processing.set(false);
      },
      error: (err: any) => {
        this.notify.error('Failed to distribute impact. Please check blockchain status.');
        this.processing.set(false);
      }
    });
  }
}
