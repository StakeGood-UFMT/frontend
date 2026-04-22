import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MarketService } from '../../../../core/services/market.service';
import { MarketCategory } from '../../../../core/models/market.model';

interface CategoryTab {
  value: MarketCategory;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-market-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="filters-container" id="market-filters">
      <!-- Search Input -->
      <div class="search-wrapper">
        <span class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          type="text"
          [formControl]="searchControl"
          placeholder="Search markets..."
          class="search-input"
          id="market-search-input"
        />
        <button
          *ngIf="searchControl.value"
          (click)="clearSearch()"
          class="clear-btn"
          aria-label="Clear search"
        >
          ✕
        </button>
      </div>

      <!-- Category Tabs -->
      <div class="categories-scroll">
        <div class="categories">
          <button
            *ngFor="let cat of categories"
            (click)="selectCategory(cat.value)"
            [class.active]="marketService.filters().category === cat.value"
            class="category-tab"
            [id]="'category-tab-' + cat.value.toLowerCase()"
          >
            <span class="tab-icon">{{ cat.icon }}</span>
            <span class="tab-label">{{ cat.label }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filters-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 14px 44px 14px 48px;
      font-size: 0.95rem;
      font-family: 'Inter', sans-serif;
      border: 2px solid rgba(0, 0, 0, 0.06);
      border-radius: 14px;
      background: #FFFFFF;
      color: #111815;
      outline: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .search-input::placeholder {
      color: #b0b8c1;
    }

    .search-input:focus {
      border-color: #11D48A;
      box-shadow: 0 0 0 4px rgba(17, 212, 138, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 14px;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.7rem;
      color: #6b7280;
      transition: all 0.2s;
    }

    .clear-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #111815;
    }

    .categories-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .categories-scroll::-webkit-scrollbar {
      display: none;
    }

    .categories {
      display: flex;
      gap: 8px;
      padding: 2px 0;
    }

    .category-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border: 1.5px solid rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      background: #FFFFFF;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .category-tab:hover {
      border-color: rgba(17, 212, 138, 0.3);
      color: #11D48A;
      background: rgba(17, 212, 138, 0.04);
    }

    .category-tab.active {
      border-color: #11D48A;
      background: rgba(17, 212, 138, 0.08);
      color: #11D48A;
      box-shadow: 0 2px 8px rgba(17, 212, 138, 0.15);
    }

    .tab-icon {
      font-size: 1rem;
    }

    .tab-label {
      letter-spacing: 0.2px;
    }

    @media (max-width: 640px) {
      .search-input {
        padding: 12px 40px 12px 44px;
        font-size: 0.9rem;
      }
      .category-tab {
        padding: 8px 14px;
        font-size: 0.78rem;
      }
    }
  `]
})
export class MarketFiltersComponent implements OnInit, OnDestroy {
  public marketService = inject(MarketService);

  searchControl = new FormControl('', { nonNullable: true });

  categories: CategoryTab[] = [
    { value: 'ALL', label: 'All', icon: '🌐' },
    { value: 'CRYPTO', label: 'Crypto', icon: '₿' },
    { value: 'SPORTS', label: 'Sports', icon: '⚽' },
    { value: 'POLITICS', label: 'Politics', icon: '🏛' },
    { value: 'SCIENCE', label: 'Science', icon: '🔬' },
    { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬' },
    { value: 'ECONOMICS', label: 'Economics', icon: '📈' }
  ];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.marketService.setSearch(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectCategory(cat: MarketCategory): void {
    this.marketService.setCategory(cat);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}
