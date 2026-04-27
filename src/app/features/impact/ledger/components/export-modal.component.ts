import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LedgerService } from '../services/ledger.service';
import { LedgerFilters, ExportJobStatus } from '../models/ledger.model';
import { interval, switchMap, takeWhile, finalize } from 'rxjs';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content glass-card" (click)="$event.stopPropagation()">
        <header>
          <h2>Export Ledger Data</h2>
          <button class="close-btn" (click)="onClose()">&times;</button>
        </header>

        <div class="modal-body">
          <p class="description">
            Generate a detailed report of the filtered impact records. 
            The file will be available for download once processed.
          </p>

          <div class="status-container" *ngIf="jobStatus()">
            <div class="status-indicator" [class]="jobStatus()?.status">
              <span class="spinner" *ngIf="jobStatus()?.status === 'processing' || jobStatus()?.status === 'pending'"></span>
              <span class="status-text">Status: {{ jobStatus()?.status | titlecase }}</span>
            </div>
            
            <p *ngIf="jobStatus()?.status === 'failed'" class="error-msg">
              {{ jobStatus()?.error || 'Failed to generate report. Please try again.' }}
            </p>
          </div>

          <div class="actions">
            <button 
              class="btn-primary" 
              (click)="startExport()" 
              [disabled]="exporting()"
              *ngIf="!jobStatus() || jobStatus()?.status === 'failed'"
            >
              {{ exporting() ? 'Preparing...' : 'Start Export' }}
            </button>

            <button 
              class="btn-success" 
              (click)="downloadFile()" 
              *ngIf="jobStatus()?.status === 'done'"
            >
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    }

    .modal-content {
      width: 100%;
      max-width: 500px;
      padding: 32px;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--secondary-color);
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 2rem;
        line-height: 1;
        cursor: pointer;
        color: var(--text-muted);
        &:hover { color: var(--secondary-color); }
      }
    }

    .description {
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .status-container {
      margin-bottom: 32px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 16px;
      text-align: center;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-weight: 700;

      &.processing { color: var(--primary-color); }
      &.done { color: #059669; }
      &.failed { color: #dc2626; }
    }

    .actions {
      display: flex;
      gap: 16px;

      button {
        flex: 1;
        padding: 14px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .btn-primary {
        background: var(--primary-color);
        color: var(--secondary-color);
        &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(17, 212, 138, 0.3); }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }

      .btn-success {
        background: #059669;
        color: white;
        &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3); }
      }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(17, 212, 138, 0.1);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .glass-card {
      background: white;
      border: 1px solid rgba(17, 212, 138, 0.2);
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
  `]
})
export class ExportModalComponent {
  @Input() filters: LedgerFilters = {};
  @Output() close = new EventEmitter<void>();

  private ledgerService = inject(LedgerService);
  
  exporting = signal(false);
  jobStatus = signal<ExportJobStatus | null>(null);

  onClose() {
    this.close.emit();
  }

  startExport() {
    this.exporting.set(true);
    this.ledgerService.requestExport(this.filters)
      .pipe(
        finalize(() => this.exporting.set(false))
      )
      .subscribe({
        next: (res) => {
          this.pollStatus(res.job_id);
        },
        error: (err) => {
          this.jobStatus.set({ id: '', status: 'failed', error: 'Could not initiate export job.' });
        }
      });
  }

  private pollStatus(jobId: string) {
    interval(2000)
      .pipe(
        switchMap(() => this.ledgerService.getExportStatus(jobId)),
        takeWhile(status => status.status === 'pending' || status.status === 'processing', true)
      )
      .subscribe({
        next: (status) => {
          this.jobStatus.set(status);
        }
      });
  }

  downloadFile() {
    const status = this.jobStatus();
    if (status?.file_url) {
      window.open(status.file_url, '_blank');
      this.onClose();
    }
  }
}
