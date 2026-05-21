import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { AdminMarketTTL, KeeperEligibleMarketsResponse, BatchBumpTTLRequest, DistributeImpactResponse } from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);

  getEligibleMarkets(): Observable<KeeperEligibleMarketsResponse> {
    return this.http.get<KeeperEligibleMarketsResponse>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.base}/keeper/eligible-markets`);
  }

  batchBumpTTL(marketIds: string[]): Observable<any> {
    const payload: BatchBumpTTLRequest = { market_ids: marketIds };
    return this.http.post(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.keeperBatchBump}`, payload);
  }

  distributeImpact(marketId: string): Observable<{ xdr: string; txHash: string; action: string }> {
    return this.http.post<{ xdr: string; txHash: string; action: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.distributeImpact(marketId)}`,
      {},
    );
  }

  resolveMarket(marketId: string, outcome: 'YES' | 'NO'): Observable<{ xdr: string; txHash: string; action: string }> {
    return this.http.post<{ xdr: string; txHash: string; action: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.resolveMarket(marketId)}`,
      { outcome },
    );
  }

  cancelMarket(marketId: string): Observable<{ xdr: string; txHash: string; action: string }> {
    return this.http.post<{ xdr: string; txHash: string; action: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.cancelMarket(marketId)}`,
      {},
    );
  }

  setMarketStatus(marketId: string, status: 'draft' | 'active'): Observable<{ ok: boolean; id: string; status: string }> {
    return this.http.post<{ ok: boolean; id: string; status: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.setMarketStatus(marketId)}`,
      { status },
    );
  }

  getOnChainMarket(marketId: string): Observable<any> {
    return this.http.get<any>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.onChainMarket(marketId)}`,
    );
  }

  getAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.admins}`);
  }

  buildAddAdminXdr(wallet: string): Observable<{ xdr: string; txHash: string }> {
    return this.http.post<{ xdr: string; txHash: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.buildAddAdmin}`,
      { wallet },
    );
  }

  buildRemoveAdminXdr(wallet: string): Observable<{ xdr: string; txHash: string }> {
    return this.http.post<{ xdr: string; txHash: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.buildRemoveAdmin}`,
      { wallet },
    );
  }
}
