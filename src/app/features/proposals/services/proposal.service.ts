import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';

export interface MarketProposal {
  title: string;
  description: string;
  category: string;
  lock_at: string;
  resolution_rule: string;
  resolution_source: string;
  image_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProposalService {
  private http = inject(HttpClient);
  private baseUrl = API_CONFIG.baseUrl;
  private endpoint = API_CONFIG.endpoints.proposals.base;

  submitProposal(proposal: MarketProposal): Observable<any> {
    return this.http.post(`${this.baseUrl}${this.endpoint}`, proposal);
  }
}
