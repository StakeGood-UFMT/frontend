import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../../core/config/api.config';
import { LedgerResponse, LedgerFilters, ExportJobStatus } from '../models/ledger.model';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.baseUrl}/impact/ledger`;

  getLedger(page: number = 1, limit: number = 10, filters: LedgerFilters = {}): Observable<LedgerResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<LedgerResponse>(this.apiUrl, { params });
  }

  requestExport(filters: LedgerFilters): Observable<{ job_id: string }> {
    return this.http.post<{ job_id: string }>(`${this.apiUrl}/export`, filters);
  }

  getExportStatus(jobId: string): Observable<ExportJobStatus> {
    return this.http.get<ExportJobStatus>(`${this.apiUrl}/export/${jobId}`);
  }
}
