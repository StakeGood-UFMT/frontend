import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { AdminMarketTTL, BatchBumpTTLRequest, DistributeImpactResponse } from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);

  getEligibleMarkets(): Observable<AdminMarketTTL[]> {
    return this.http.get<AdminMarketTTL[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.base}/keeper/eligible-markets`);
  }

  batchBumpTTL(marketIds: string[]): Observable<any> {
    const payload: BatchBumpTTLRequest = { market_ids: marketIds };
    return this.http.post(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.keeperBatchBump}`, payload);
  }

  distributeImpact(marketId: string): Observable<DistributeImpactResponse> {
    return this.http.post<DistributeImpactResponse>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.distributeImpact(marketId)}`, 
      {}
    );
  }

  resolveMarket(marketId: string, outcome: 'YES' | 'NO'): Observable<{ xdr: string; action: string }> {
    return this.http.post<{ xdr: string; action: string }>(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.resolveMarket(marketId)}`,
      { outcome },
    );
  }
}
