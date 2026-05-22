import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MarketService } from '../../../../core/services/market.service';
import { WalletService } from '../../../../core/services/wallet.service';
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
      <!-- Row 1: Category Tabs (Borderless, Minimal) -->
      <div class="categories-wrapper">
        <button class="nav-btn prev" (click)="scroll('left')" aria-label="Scroll left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

        <div class="categories-scroll" #scrollContainer>
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

        <button class="nav-btn next" (click)="scroll('right')" aria-label="Scroll right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <!-- Row 2: Search + Select Dropdowns (Combined Row) -->
      <div class="filter-controls-row">
        <!-- Search Input -->
        <div class="search-wrapper">
          <span class="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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

        <!-- Filter Selects -->
        <div class="dropdowns-wrapper">
          <!-- Status Dropdown -->
          <div class="select-wrapper">
            <select
              (change)="onStatusChange($event)"
              [value]="marketService.filters().status"
              class="filter-select"
              id="status-filter-select"
            >
              <option value="active">🟢 Active</option>
              <option value="locked">🔒 Locked</option>
              <option value="resolved">🏁 Resolved</option>
              <option value="ALL">🌐 All Status</option>
            </select>
            <span class="select-chevron">▼</span>
          </div>

          <!-- Staked Dropdown -->
          <div class="select-wrapper" *ngIf="walletService.publicKey()">
            <select
              (change)="onStakedChange($event)"
              [value]="marketService.filters().staked"
              class="filter-select"
              id="staked-filter-select"
            >
              <option value="ALL">🎯 All Participation</option>
              <option value="STAKED">🎯 Staked</option>
              <option value="NOT_STAKED">⏳ Not Staked</option>
            </select>
            <span class="select-chevron">▼</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filters-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 4px;
    }

    /* ---- Row 1: Categories ---- */
    .categories-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .nav-btn {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
      z-index: 2;
    }

    .nav-btn:hover {
      background: #f9fafb;
      color: #11D48A;
      border-color: #11D48A;
    }

    .categories-scroll {
      flex: 1;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
      scroll-behavior: smooth;
    }

    .categories-scroll::-webkit-scrollbar {
      display: none;
    }

    .categories {
      display: flex;
      gap: 6px;
      padding: 2px 0;
    }

    .category-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: none;
      border-radius: 10px;
      background: transparent;
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      font-weight: 600;
      color: #4b5563;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .category-tab:hover {
      color: #11D48A;
      background: rgba(17, 212, 138, 0.04);
    }

    .category-tab.active {
      background: rgba(17, 212, 138, 0.08);
      color: #11D48A;
      font-weight: 700;
    }

    .tab-icon {
      font-size: 0.95rem;
    }

    /* ---- Row 2: Search + Select Dropdowns ---- */
    .filter-controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 10px 38px 10px 38px;
      font-size: 0.88rem;
      font-family: 'Inter', sans-serif;
      border: 1.5px solid rgba(0, 0, 0, 0.06);
      border-radius: 10px;
      background: #FFFFFF;
      color: #111815;
      outline: none;
      transition: all 0.2s ease;
      height: 38px;
    }

    .search-input::placeholder {
      color: #9ca3af;
    }

    .search-input:focus {
      border-color: #11D48A;
      box-shadow: 0 0 0 3px rgba(17, 212, 138, 0.08);
    }

    .clear-btn {
      position: absolute;
      right: 12px;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.65rem;
      color: #6b7280;
      transition: all 0.2s;
    }

    .clear-btn:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #111815;
    }

    .dropdowns-wrapper {
      display: flex;
      gap: 10px;
    }

    .select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .filter-select {
      appearance: none;
      -webkit-appearance: none;
      padding: 0 32px 0 14px;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: #4b5563;
      background: #FFFFFF;
      border: 1.5px solid rgba(0, 0, 0, 0.06);
      border-radius: 10px;
      cursor: pointer;
      outline: none;
      height: 38px;
      min-width: 150px;
      transition: all 0.2s ease;
    }

    .filter-select:hover {
      border-color: rgba(17, 212, 138, 0.3);
      color: #11D48A;
    }

    .filter-select:focus {
      border-color: #11D48A;
      box-shadow: 0 0 0 3px rgba(17, 212, 138, 0.08);
    }

    .select-chevron {
      position: absolute;
      right: 12px;
      font-size: 0.55rem;
      color: #9ca3af;
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .filter-controls-row {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }
      .dropdowns-wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .filter-select {
        width: 100%;
        min-width: unset;
      }
    }
  `]
})
export class MarketFiltersComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  public marketService = inject(MarketService);
  public walletService = inject(WalletService);

  searchControl = new FormControl('', { nonNullable: true });

  categories: CategoryTab[] = [
    { value: 'ALL', label: 'All', icon: '🌐' },
    { value: 'Finance', label: 'Finance', icon: '💰' },
    { value: 'Tech', label: 'Tech', icon: '💻' },
    { value: 'Sports', label: 'Sports', icon: '⚽' },
    { value: 'Environment', label: 'Environment', icon: '🌱' },
    { value: 'Politics', label: 'Politics', icon: '🏛' },
    { value: 'Science', label: 'Science', icon: '🔬' },
    { value: 'Health', label: 'Health', icon: '🏥' },
    { value: 'Education', label: 'Education', icon: '🎓' },
    { value: 'Animals', label: 'Animals', icon: '🐾' }
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

  scroll(direction: 'left' | 'right'): void {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = 200;
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  }

  selectCategory(cat: MarketCategory): void {
    this.marketService.setCategory(cat);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'ALL' | 'active' | 'locked' | 'resolved';
    this.marketService.setStatus(value);
  }

  onStakedChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'ALL' | 'STAKED' | 'NOT_STAKED';
    this.marketService.setStaked(value);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}
