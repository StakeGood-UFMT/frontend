import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../../core/services/settings.service';

type ExportStatus = 'idle' | 'loading' | 'done' | 'error';

@Component({
  selector: 'app-compliance-report-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="compliance-card">
      <div class="compliance-header">
        <span class="icon">📄</span>
        <div>
          <h3>Compliance Report</h3>
          <p>Download your complete activity report including transactions, voting history and limits.</p>
        </div>
      </div>

      <div class="compliance-body">
        <div class="info-row">
          <span class="info-label">Format</span>
          <span class="info-value">PDF / JSON</span>
        </div>
        <div class="info-row">
          <span class="info-label">Includes</span>
          <span class="info-value">Transactions · Votes · Monthly Limits</span>
        </div>
      </div>

      <div class="compliance-footer">
        <button
          id="btn-export-compliance"
          class="btn-export"
          [disabled]="status() === 'loading'"
          (click)="doExport()">
          <span *ngIf="status() !== 'loading'">⬇️ Export Report</span>
          <span *ngIf="status() === 'loading'" class="btn-loading">
            <span class="spinner"></span> Generating…
          </span>
        </button>

        <div class="status-msg success" *ngIf="status() === 'done'" role="status" aria-live="polite">
          ✅ Report downloaded successfully!
        </div>
        <div class="status-msg error" *ngIf="status() === 'error'" role="alert" aria-live="assertive">
          ❌ {{ errorMsg() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .compliance-card {
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .compliance-header { display: flex; gap: 0.85rem; align-items: flex-start; }
    .icon { font-size: 1.75rem; flex-shrink: 0; }
    .compliance-header h3 { margin: 0 0 0.2rem; font-size: 1rem; font-weight: 800; color: #111827; }
    .compliance-header p  { margin: 0; font-size: 0.82rem; color: #6B7280; line-height: 1.4; }

    .compliance-body { display: flex; flex-direction: column; gap: 0.5rem; }
    .info-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
    .info-label { color: #9CA3AF; }
    .info-value { color: #374151; font-weight: 600; }

    .compliance-footer { display: flex; flex-direction: column; gap: 0.75rem; }
    .btn-export {
      background: #111827; color: white; border: none; border-radius: 10px;
      padding: 0.7rem 1.5rem; font-weight: 700; font-size: 0.9rem;
      cursor: pointer; transition: opacity 0.2s; width: 100%;
    }
    .btn-export:hover:not(:disabled) { opacity: 0.85; }
    .btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-loading { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .status-msg { font-size: 0.85rem; font-weight: 600; text-align: center; }
    .status-msg.success { color: #059669; }
    .status-msg.error   { color: #DC2626; }
  `]
})
export class ComplianceReportExportComponent {
  private svc = inject(SettingsService);

  status   = signal<ExportStatus>('idle');
  errorMsg = signal('');

  async doExport() {
    this.status.set('loading');
    this.errorMsg.set('');
    try {
      const blob = await this.svc.exportComplianceReport();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `stakegood-compliance-${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      this.status.set('done');
      setTimeout(() => this.status.set('idle'), 4000);
    } catch (e: any) {
      this.errorMsg.set(e?.error?.message ?? 'Failed to generate report');
      this.status.set('error');
    }
  }
}
