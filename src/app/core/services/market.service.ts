import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_CONFIG } from '../config/api.config';
import { Market, MarketListResponse, MarketCategory, MarketHistoryPoint, MarketHistoryResponse, MarketResults } from '../models/market.model';

export interface MarketFiltersState {
  search: string;
  category: MarketCategory;
}

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.base}`;

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
    const allMarkets = this._markets();
    const { search, category } = this._filters();

    // Filter out ghost markets (those with default/missing metadata from incomplete chain ingestion)
    let filtered = allMarkets.filter((m: Market) => {
      const isGhostTitle = m.title && m.title.startsWith('Market ') && m.title.includes('0');
      const isDefaultDate = m.lock_at && (m.lock_at.startsWith('1970') || m.lock_at.startsWith('1969'));
      return !(isGhostTitle && isDefaultDate);
    });

    if (category !== 'ALL') {
      filtered = filtered.filter((m: Market) => m.category === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((m: Market) =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q)
      );
    }

    return filtered;
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
  getMarkets() {
    return this.http.get<MarketListResponse>(this.baseUrl);
  }

  getMarket(id: string) {
    return this.http.get<Market>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.detail(id)}`);
  }

  getMarketHistory(id: string, range: string = '1D') {
    const params = new HttpParams().set('range', range);
    return this.http.get<MarketHistoryResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.history(id)}`, { params })
      .pipe(map(res => res.snapshots));
  }

  getMarketPositions(id: string, limit = 25, offset = 0) {
    const params = new HttpParams()
      .set('limit', String(limit))
      .set('offset', String(offset));
    return this.http.get<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.positions(id)}`,
      { params },
    );
  }

  getMarketResults(id: string) {
    return this.http.get<MarketResults>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.results(id)}`,
    );
  }

  getMarketVoting(id: string) {
    return this.http.get<any[]>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.detail(id)}/voting`,
    );
  }
}
