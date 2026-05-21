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
      <div class="categories-wrapper">
        <button class="nav-btn prev" (click)="scroll('left')" aria-label="Scroll left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <!-- Status & Stake Filters -->
      <div class="sub-filters-row">
        <!-- Status Filter -->
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <div class="selector-pills">
            <button 
              (click)="setStatus('active')"
              [class.active]="marketService.filters().status === 'active'"
              class="pill-option active-pill"
              id="status-filter-active"
            >
              🟢 Active
            </button>
            <button 
              (click)="setStatus('locked')"
              [class.active]="marketService.filters().status === 'locked'"
              class="pill-option locked-pill"
              id="status-filter-locked"
            >
              🔒 Locked
            </button>
            <button 
              (click)="setStatus('resolved')"
              [class.active]="marketService.filters().status === 'resolved'"
              class="pill-option resolved-pill"
              id="status-filter-resolved"
            >
              🏁 Resolved
            </button>
            <button 
              (click)="setStatus('ALL')"
              [class.active]="marketService.filters().status === 'ALL'"
              class="pill-option all-pill"
              id="status-filter-all"
            >
              🌐 All
            </button>
          </div>
        </div>

        <!-- Staked/Participation Filter -->
        <div class="filter-group" [class.disabled]="!walletService.publicKey()">
          <label class="filter-label">
            My Stakes
            <span *ngIf="!walletService.publicKey()" class="lock-hint" title="Connect wallet to filter by stakes">🔑 Connected wallet only</span>
          </label>
          <div class="selector-pills">
            <button 
              [disabled]="!walletService.publicKey()"
              (click)="setStaked('ALL')"
              [class.active]="marketService.filters().staked === 'ALL'"
              class="pill-option"
              id="staked-filter-all"
            >
              All
            </button>
            <button 
              [disabled]="!walletService.publicKey()"
              (click)="setStaked('STAKED')"
              [class.active]="marketService.filters().staked === 'STAKED'"
              class="pill-option staked-pill"
              id="staked-filter-staked"
            >
              🎯 Staked
            </button>
            <button 
              [disabled]="!walletService.publicKey()"
              (click)="setStaked('NOT_STAKED')"
              [class.active]="marketService.filters().staked === 'NOT_STAKED'"
              class="pill-option not-staked-pill"
              id="staked-filter-not-staked"
            >
              ⏳ Not Staked
            </button>
          </div>
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

    .categories-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 2;
    }

    .nav-btn:hover {
      background: #f9fafb;
      color: #11D48A;
      border-color: #11D48A;
      box-shadow: 0 2px 6px rgba(17, 212, 138, 0.1);
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

    .sub-filters-row {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      align-items: center;
      margin-top: 4px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group.disabled {
      opacity: 0.65;
    }

    .filter-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .lock-hint {
      font-size: 0.65rem;
      font-weight: 500;
      text-transform: none;
      color: #9ca3af;
      background: rgba(0, 0, 0, 0.04);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .selector-pills {
      display: flex;
      gap: 6px;
      background: rgba(0, 0, 0, 0.03);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .pill-option {
      background: transparent;
      border: none;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
    }

    .pill-option:hover:not(:disabled) {
      color: #111815;
      background: rgba(0, 0, 0, 0.02);
    }

    .pill-option:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .pill-option.active {
      background: #FFFFFF;
      color: #111815;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    .pill-option.active.active-pill {
      color: #11D48A;
    }

    .pill-option.active.locked-pill {
      color: #ef4444;
    }

    .pill-option.active.resolved-pill {
      color: #6b7280;
    }

    .pill-option.active.all-pill {
      color: #6366f1;
    }

    .pill-option.active.staked-pill {
      color: #3b82f6;
    }

    .pill-option.active.not-staked-pill {
      color: #f59e0b;
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
      .sub-filters-row {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .filter-group {
        width: 100%;
      }
      .selector-pills {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        text-align: center;
      }
      .filter-group:last-child .selector-pills {
        grid-template-columns: repeat(3, 1fr);
      }
      .pill-option {
        justify-content: center;
        padding: 6px 4px;
        font-size: 0.75rem;
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

  setStatus(status: 'ALL' | 'active' | 'locked' | 'resolved'): void {
    this.marketService.setStatus(status);
  }

  setStaked(staked: 'ALL' | 'STAKED' | 'NOT_STAKED'): void {
    this.marketService.setStaked(staked);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}
