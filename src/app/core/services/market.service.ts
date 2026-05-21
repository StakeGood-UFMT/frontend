import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_CONFIG } from '../config/api.config';
import { Market, MarketListResponse, MarketCategory, MarketHistoryPoint, MarketHistoryResponse, MarketResults, derivedStatus } from '../models/market.model';
import { WalletService } from './wallet.service';
import { ClaimService } from '../../features/profile/claims-tab/claim.service';

export interface MarketFiltersState {
  search: string;
  category: MarketCategory;
  status: 'ALL' | 'active' | 'locked' | 'resolved';
  staked: 'ALL' | 'STAKED' | 'NOT_STAKED';
}

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private http = inject(HttpClient);
  private walletService = inject(WalletService);
  private claimService = inject(ClaimService);
  private readonly baseUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.markets.base}`;

  // State signals
  private _markets = signal<Market[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _filters = signal<MarketFiltersState>({
    search: '',
    category: 'ALL',
    status: 'active',
    staked: 'ALL'
  });
  private _stakedMarketIds = signal<Set<string>>(new Set());

  // Public read-only signals
  public markets = this._markets.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();
  public filters = this._filters.asReadonly();
  public stakedMarketIds = this._stakedMarketIds.asReadonly();

  constructor() {
    effect(() => {
      // Reactively fetch user's staked markets whenever public key changes
      const pubKey = this.walletService.publicKey();
      this.fetchStakedMarkets();
    }, { allowSignalWrites: true });
  }

  // Computed: filtered markets (client-side filtering and sorting)
  public filteredMarkets = computed(() => {
    const allMarkets = this._markets();
    const { search, category, status, staked } = this._filters();
    const stakedIds = this._stakedMarketIds();
    const hasWallet = !!this.walletService.publicKey();

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

    // Filter by user stake participation if wallet is connected
    if (hasWallet && staked !== 'ALL') {
      if (staked === 'STAKED') {
        filtered = filtered.filter((m: Market) => stakedIds.has(m.id));
      } else if (staked === 'NOT_STAKED') {
        filtered = filtered.filter((m: Market) => !stakedIds.has(m.id));
      }
    }

    // Filter by status and sort accordingly
    if (status !== 'ALL') {
      filtered = filtered.filter((m: Market) => derivedStatus(m) === status);
      if (status === 'active') {
        // Sort active by lock_at ASC (soonest first)
        filtered.sort((a, b) => new Date(a.lock_at).getTime() - new Date(b.lock_at).getTime());
      } else {
        // Sort locked/resolved by lock_at DESC (most recent first)
        filtered.sort((a, b) => new Date(b.lock_at).getTime() - new Date(a.lock_at).getTime());
      }
    } else {
      // ALL selected: Group by Active, Locked, Resolved and sort each group
      const activeGroup = filtered.filter((m: Market) => derivedStatus(m) === 'active');
      const lockedGroup = filtered.filter((m: Market) => derivedStatus(m) === 'locked');
      const resolvedGroup = filtered.filter((m: Market) => derivedStatus(m) === 'resolved');
      const otherGroup = filtered.filter((m: Market) => {
        const s = derivedStatus(m);
        return s !== 'active' && s !== 'locked' && s !== 'resolved';
      });

      activeGroup.sort((a, b) => new Date(a.lock_at).getTime() - new Date(b.lock_at).getTime());
      lockedGroup.sort((a, b) => new Date(b.lock_at).getTime() - new Date(a.lock_at).getTime());
      resolvedGroup.sort((a, b) => new Date(b.lock_at).getTime() - new Date(a.lock_at).getTime());
      otherGroup.sort((a, b) => new Date(b.lock_at).getTime() - new Date(a.lock_at).getTime());

      filtered = [...activeGroup, ...lockedGroup, ...resolvedGroup, ...otherGroup];
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
      await this.fetchStakedMarkets();
    } catch (err: any) {
      console.error('[MarketService] Failed to fetch markets', err);
      this._error.set(err?.message || 'Failed to load markets. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  async fetchStakedMarkets(): Promise<void> {
    const pubKey = this.walletService.publicKey();
    if (!pubKey) {
      this._stakedMarketIds.set(new Set());
      return;
    }
    try {
      const claims = await this.claimService.getClaims();
      const ids = new Set(claims.map(c => c.market_id));
      this._stakedMarketIds.set(ids);
    } catch (err) {
      console.error('[MarketService] Failed to fetch staked markets', err);
    }
  }

  setSearch(search: string): void {
    this._filters.update(f => ({ ...f, search }));
  }

  setCategory(category: MarketCategory): void {
    this._filters.update(f => ({ ...f, category }));
  }

  setStatus(status: 'ALL' | 'active' | 'locked' | 'resolved'): void {
    this._filters.update(f => ({ ...f, status }));
  }

  setStaked(staked: 'ALL' | 'STAKED' | 'NOT_STAKED'): void {
    this._filters.update(f => ({ ...f, staked }));
  }

  clearFilters(): void {
    this._filters.set({
      search: '',
      category: 'ALL',
      status: 'active',
      staked: 'ALL'
    });
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
