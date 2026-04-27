import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LedgerFilters } from '../models/ledger.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-container glass-card">
      <div class="filter-group">
        <label>Search</label>
        <input 
          type="text" 
          [(ngModel)]="filters.search" 
          (ngModelChange)="onFilterChange()" 
          placeholder="NGO, project, or hash..."
        />
      </div>

      <div class="filter-group">
        <label>Min Amount</label>
        <input 
          type="number" 
          [(ngModel)]="filters.min_amount" 
          (ngModelChange)="onFilterChange()" 
          placeholder="0.00"
        />
      </div>

      <div class="filter-group">
        <label>Date From</label>
        <input 
          type="date" 
          [(ngModel)]="filters.date_from" 
          (ngModelChange)="onFilterChange()"
        />
      </div>

      <div class="filter-group">
        <label>Date To</label>
        <input 
          type="date" 
          [(ngModel)]="filters.date_to" 
          (ngModelChange)="onFilterChange()"
        />
      </div>

      <div class="filter-actions">
        <button class="btn-reset" (click)="resetFilters()">Reset</button>
      </div>
    </div>
  `,
  styles: [`
    .filter-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 24px;
      margin-bottom: 24px;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
      }

      input {
        background: #f9fafb;
        border: 2px solid transparent;
        border-radius: 10px;
        padding: 10px 14px;
        font-family: inherit;
        font-size: 0.95rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          background: #fff;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(17, 212, 138, 0.1);
        }
      }
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-reset {
      background: none;
      border: 1px solid #e5e7eb;
      color: var(--text-muted);
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: var(--secondary-color);
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
export class FilterBarComponent {
  @Output() filtersChange = new EventEmitter<LedgerFilters>();

  filters: LedgerFilters = {
    search: '',
    min_amount: undefined,
    date_from: '',
    date_to: ''
  };

  onFilterChange() {
    this.filtersChange.emit({ ...this.filters });
  }

  resetFilters() {
    this.filters = {
      search: '',
      min_amount: undefined,
      date_from: '',
      date_to: ''
    };
    this.onFilterChange();
  }
}
