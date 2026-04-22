import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Market, MarketListResponse, MarketCategory, MarketHistoryPoint } from '../models/market.model';

export interface MarketFiltersState {
  search: string;
  category: MarketCategory;
}

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/markets`;

  // State signals
  private _markets = signal<Market[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _filters = signal<MarketFiltersState>({ search: '', category: 'ALL' });

  // Public read-only signals
  public markets = this._markets.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();
  public filters = this._filters.asReadonly();

  // Computed: filtered markets (client-side filtering)
  public filteredMarkets = computed(() => {
    let list = this._markets();
    const { search, category } = this._filters();

    if (category !== 'ALL') {
      list = list.filter(m => m.category === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    }

    return list;
  });

  // Computed: empty state
  public isEmpty = computed(() => !this._loading() && !this._error() && this.filteredMarkets().length === 0);

  async fetchMarkets(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await lastValueFrom(
        this.http.get<MarketListResponse>(this.baseUrl)
      );
      this._markets.set(response.markets);
    } catch (err: any) {
      console.error('[MarketService] Failed to fetch markets', err);
      this._error.set(err?.message || 'Failed to load markets. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  setSearch(search: string): void {
    this._filters.update(f => ({ ...f, search }));
  }

  setCategory(category: MarketCategory): void {
    this._filters.update(f => ({ ...f, category }));
  }

  clearFilters(): void {
    this._filters.set({ search: '', category: 'ALL' });
  }

  // FE-6 Methods
  getMarket(id: string) {
    return this.http.get<Market>(`${this.baseUrl}/${id}`);
  }

  getMarketHistory(id: string, range: string = '1D') {
    const params = new HttpParams().set('range', range);
    return this.http.get<MarketHistoryPoint[]>(`${this.baseUrl}/${id}/history`, { params });
  }
}
