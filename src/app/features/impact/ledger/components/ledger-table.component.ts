import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImpactLedgerEntry } from '../models/ledger.model';

@Component({
  selector: 'app-ledger-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container glass-card">
      <table class="ledger-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Organization</th>
            <th>Project</th>
            <th>Amount</th>
            <th>Impact</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let entry of data">
            <td class="date-cell">{{ entry.timestamp | date:'short' }}</td>
            <td class="ngo-cell">
              <span class="ngo-name">{{ entry.ngo_name }}</span>
            </td>
            <td>{{ entry.project_name }}</td>
            <td class="amount-cell">
              <span class="amount">{{ entry.amount | currency:entry.currency }}</span>
            </td>
            <td>
              <div class="impact-badge">
                <span class="value">{{ entry.impact_value }}</span>
                <span class="metric">{{ entry.impact_metric }}</span>
              </div>
            </td>
            <td>
              <span class="status-badge" [class.confirmed]="entry.status === 'confirmed'">
                {{ entry.status }}
              </span>
            </td>
          </tr>
          <tr *ngIf="!data || data.length === 0">
            <td colspan="6" class="empty-row">No impact records found matching your filters.</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page === 1" (click)="onPageChange(page - 1)">Previous</button>
        <span class="page-info">Page {{ page }} of {{ Math.ceil(total / limit) }}</span>
        <button [disabled]="page * limit >= total" (click)="onPageChange(page + 1)">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      overflow-x: auto;
      padding: 0;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
    }

    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        padding: 16px 24px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }

      td {
        padding: 16px 24px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
        font-size: 0.95rem;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover {
        background: rgba(17, 212, 138, 0.02);
      }
    }

    .ngo-name {
      font-weight: 600;
      color: var(--secondary-color);
    }

    .amount {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: var(--primary-color);
    }

    .impact-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f3f4f6;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.85rem;

      .value { font-weight: 700; }
      .metric { color: var(--text-muted); }
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 4px;
      background: #fee2e2;
      color: #991b1b;

      &.confirmed {
        background: #dcfce7;
        color: #166534;
      }
    }

    .empty-row {
      text-align: center;
      padding: 60px !important;
      color: var(--text-muted);
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      padding: 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);

      button {
        background: white;
        border: 1px solid #e5e7eb;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &:hover:not(:disabled) {
          background: #f9fafb;
        }
      }

      .page-info {
        font-size: 0.9rem;
        color: var(--text-muted);
      }
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(17, 212, 138, 0.15);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
    }
  `]
})
export class LedgerTableComponent {
  @Input() data: ImpactLedgerEntry[] = [];
  @Input() total: number = 0;
  @Input() page: number = 1;
  @Input() limit: number = 10;
  @Output() pageChange = new EventEmitter<number>();

  Math = Math;

  onPageChange(newPage: number) {
    this.pageChange.emit(newPage);
  }
}
