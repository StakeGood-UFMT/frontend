import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';

export interface MarketProposal {
  title: string;
  description: string;
  category: string;
  lock_at: string;
  resolve_at: string;
  resolution_rule: string;
  resolution_source: string;
  image_url?: string;
  oracle_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProposalService {
  private http = inject(HttpClient);
  private baseUrl = API_CONFIG.baseUrl;
  private endpoint = API_CONFIG.endpoints.proposals.base;

  private normalizeUrl(raw?: string): string | undefined {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;

    const unwrapped =
      (trimmed.startsWith('`') && trimmed.endsWith('`')) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ? trimmed.slice(1, -1).trim()
        : trimmed;

    try {
      const url = new URL(unwrapped);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
      return url.toString();
    } catch {
      return undefined;
    }
  }

  submitProposal(proposal: MarketProposal): Observable<any> {
    const lockAtIso = new Date(proposal.lock_at).toISOString();
    const resolveAtIso = new Date(proposal.resolve_at).toISOString();

    const imageUrl = this.normalizeUrl(proposal.image_url);
    const oracleUrl = this.normalizeUrl(proposal.oracle_url);

    return this.http.post(`${this.baseUrl}${this.endpoint}`, {
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      imageUrl,
      oracleUrl,
      lockAt: lockAtIso,
      resolveAt: resolveAtIso,
      resolutionRule: proposal.resolution_rule,
      resolutionSource: proposal.resolution_source,
    });
  }
}
