import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminMarketTTL } from '../../../../core/models/admin.model';

@Component({
  selector: 'app-keeper-ttl-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <div class="table-actions">
        <div class="selection-info">
          <span class="selection-count">{{ selectedIds().length }}</span>
          <span class="selection-label">markets selected for maintenance</span>
        </div>
        <button 
          class="batch-btn" 
          [disabled]="selectedIds().length === 0"
          (click)="onBatchBump()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          Batch Bump TTL
        </button>
      </div>

      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-check">
                <label class="checkbox-container">
                  <input type="checkbox" (change)="toggleAll($event)" [checked]="isAllSelected()">
                  <span class="checkmark"></span>
                </label>
              </th>
              <th>Market Details</th>
              <th>Status</th>
              <th>TTL Expiry</th>
              <th>Action Required</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of markets" [class.selected]="isSelected(m.id)" (click)="toggleSelection(m.id)">
              <td class="col-check" (click)="$event.stopPropagation()">
                <label class="checkbox-container">
                  <input type="checkbox" [checked]="isSelected(m.id)" (change)="toggleSelection(m.id)">
                  <span class="checkmark"></span>
                </label>
              </td>
              <td>
                <div class="market-info">
                  <span class="market-title">{{ m.title }}</span>
                  <span class="market-id">{{ m.id }}</span>
                </div>
              </td>
              <td>
                <span class="status-badge" [class]="m.status">{{ m.status }}</span>
              </td>
              <td>
                <ng-container *ngIf="m.ttl_ledger_expiry !== null && m.ttl_ledger_expiry !== undefined; else noTtl">
                  <div class="ttl-cell">
                    <span class="ttl-primary">{{ formatLedgersAsDuration(m.ttl_ledger_expiry) }}</span>
                    <span class="ttl-secondary">{{ m.ttl_ledger_expiry | number }} ledgers</span>
                  </div>
                </ng-container>
                <ng-template #noTtl>
                  <span class="ttl-missing">---</span>
                </ng-template>
              </td>
              <td>
                <span class="eligibility-chip" [class.eligible]="m.is_eligible_for_bump">
                  {{ m.is_eligible_for_bump ? 'Priority Bump' : 'Maintained' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
      border: 1px solid #f1f5f9;
      overflow: hidden;
      font-family: 'Public Sans', sans-serif;
    }
    .table-actions {
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
    }
    .selection-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .selection-count {
      background: #10b981;
      color: white;
      padding: 2px 10px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.9rem;
    }
    .selection-label {
      font-weight: 600;
      color: #64748b;
      font-size: 0.95rem;
    }
    .batch-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #111815;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .batch-btn:hover:not(:disabled) {
      background: #10b981;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    .batch-btn:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
    }
    .table-wrapper {
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      padding: 18px 32px;
      background: #f8fafc;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    td {
      padding: 20px 32px;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.2s;
    }
    tr:hover td {
      background: #f8fafc;
      cursor: pointer;
    }
    tr.selected td {
      background: #f0fdf4;
    }
    .col-check {
      width: 60px;
    }
    .market-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .market-title {
      font-weight: 700;
      color: #1e293b;
      font-size: 1rem;
    }
    .market-id {
      font-size: 0.75rem;
      font-family: monospace;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      width: fit-content;
    }
    .status-badge {
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .status-badge.locked { background: #fef9c3; color: #854d0e; }
    .status-badge.resolved { background: #dbeafe; color: #1e40af; }
    
    .ttl-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      line-height: 1.1;
    }
    .ttl-primary {
      font-weight: 800;
      color: #1e293b;
    }
    .ttl-secondary {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 650;
    }
    .ttl-missing {
      font-weight: 700;
      color: #94a3b8;
    }

    .eligibility-chip {
      font-size: 0.75rem;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 700;
      background: #f1f5f9;
      color: #64748b;
    }
    .eligibility-chip.eligible {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    /* Custom Checkbox */
    .checkbox-container {
      display: block;
      position: relative;
      cursor: pointer;
      user-select: none;
      height: 20px;
      width: 20px;
    }
    .checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      height: 20px;
      width: 20px;
      background-color: #e2e8f0;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .checkbox-container:hover input ~ .checkmark {
      background-color: #cbd5e1;
    }
    .checkbox-container input:checked ~ .checkmark {
      background-color: #10b981;
    }
    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
      left: 7px;
      top: 3px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2.5px 2.5px 0;
      transform: rotate(45deg);
    }
    .checkbox-container input:checked ~ .checkmark:after {
      display: block;
    }
  `]
})
export class KeeperTTLTableComponent {
  @Input() markets: AdminMarketTTL[] = [];
  @Output() bumpBatch = new EventEmitter<string[]>();

  selectedIds = signal<string[]>([]);

  isAllSelected = computed(() => 
    this.markets.length > 0 && this.selectedIds().length === this.markets.length
  );

  toggleSelection(id: string) {
    const current = this.selectedIds();
    if (current.includes(id)) {
      this.selectedIds.set(current.filter(i => i !== id));
    } else {
      this.selectedIds.set([...current, id]);
    }
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      this.selectedIds.set(this.markets.map(m => m.id));
    } else {
      this.selectedIds.set([]);
    }
  }

  isSelected(id: string) {
    return this.selectedIds().includes(id);
  }

  onBatchBump() {
    this.bumpBatch.emit(this.selectedIds());
  }

  formatLedgersAsDuration(ledgers: number): string {
    const seconds = Math.max(0, Math.floor(ledgers * 5));
    if (seconds === 0) return 'Expired';

    const month = 30 * 24 * 60 * 60;
    const day = 24 * 60 * 60;
    const hour = 60 * 60;
    const minute = 60;

    const months = Math.floor(seconds / month);
    const days = Math.floor((seconds % month) / day);
    const hours = Math.floor((seconds % day) / hour);
    const minutes = Math.floor((seconds % hour) / minute);
    const secs = seconds % minute;

    if (months > 0) return days > 0 ? `${months}mo ${days}d` : `${months}mo`;
    if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${secs}s`;
  }
}
