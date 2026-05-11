import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { Ngo, TimelineEvent } from '../../../core/models/ngo.model';

export interface NgoFiltersState {
  search: string;
  cause: string;
  sortBy: 'newest' | 'trending';
}

@Injectable({
  providedIn: 'root'
})
export class NgosService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.ngos.base}`;
  private readonly proposalsUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.ngoProposals.base}`;

  // State signals
  private _ngos = signal<Ngo[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _filters = signal<NgoFiltersState>({ search: '', cause: 'ALL', sortBy: 'trending' });

  // Public read-only signals
  public ngos = this._ngos.asReadonly();
  public loading = this._loading.asReadonly();
  public error = this._error.asReadonly();
  public filters = this._filters.asReadonly();

  // Computed: filtered NGOs
  public filteredNgos = computed(() => {
    let list = this._ngos();
    
    // Defensive check to prevent "list is not iterable" errors
    if (!Array.isArray(list)) {
      console.warn('[NgosService] list is not an array:', list);
      return [];
    }

    const { search, cause, sortBy } = this._filters();

    if (cause !== 'ALL') {
      list = list.filter(n => n.cause === cause);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'newest') {
      list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'trending') {
      // Logic for trending (for now same as newest or custom)
      list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  });

  public isEmpty = computed(() => !this._loading() && !this._error() && this.filteredNgos().length === 0);

  async fetchNgos(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await lastValueFrom(
        this.http.get<any>(this.baseUrl)
      );
      
      // Backend returns { ngos: Ngo[], pagination: ... }
      const list = Array.isArray(response) ? response : (response?.ngos || []);
      
      if (Array.isArray(list)) {
        this._ngos.set(list);
      } else {
        console.error('[NgosService] Failed to extract NGOs array from response:', response);
        this._ngos.set([]);
        this._error.set('Server returned invalid data format');
      }
    } catch (err: any) {
      console.error('[NgosService] Failed to fetch NGOs', err);
      this._error.set(err?.message || 'Failed to load NGOs. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  async fetchNgoById(id: string): Promise<Ngo> {
    return lastValueFrom(this.http.get<Ngo>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.ngos.detail(id)}`));
  }

  async fetchNgoTimeline(id: string): Promise<TimelineEvent[]> {
    return lastValueFrom(this.http.get<TimelineEvent[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.ngos.timeline(id)}`));
  }

  setSearch(search: string): void {
    this._filters.update(f => ({ ...f, search }));
  }

  setCause(cause: string): void {
    this._filters.update(f => ({ ...f, cause }));
  }

  setSortBy(sortBy: 'newest' | 'trending'): void {
    this._filters.update(f => ({ ...f, sortBy }));
  }

  clearFilters(): void {
    this._filters.set({ search: '', cause: 'ALL', sortBy: 'trending' });
  }

  async submitNgoProposal(data: {
    name: string;
    description?: string;
    category?: string;
    walletAddress: string;
    website?: string;
    logoUrl?: string;
    coverUrl?: string;
    auditUrl?: string;
    treasuryUrl?: string;
    certificationUrl?: string;
  }): Promise<any> {
    return lastValueFrom(this.http.post<any>(this.proposalsUrl, data));
  }
}
