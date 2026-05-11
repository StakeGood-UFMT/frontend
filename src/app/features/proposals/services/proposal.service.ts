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
  ngo_candidate_ids: number[];
  image_url?: string;
  oracle_url?: string;
}

export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProposalUserSummary {
  id: string;
  primaryWallet: string;
  role?: string;
}

export interface ProposalSummary {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status: ProposalStatus;
  rejectionReason?: string | null;
  imageUrl?: string | null;
  oracleUrl?: string | null;
  resolutionRule?: string | null;
  resolutionSource?: string | null;
  reservedOnChainId?: string | null;
  marketId?: string | null;
  lockAt: string;
  resolveAt: string;
  createdAt: string;
  updatedAt: string;
  user?: ProposalUserSummary;
}

export interface BuildApprovalResponse {
  xdr: string;
  txHash: string;
  onChainId: string;
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
      ngoCandidateIds: proposal.ngo_candidate_ids,
    });
  }

  listMine(status?: ProposalStatus): Observable<ProposalSummary[]> {
    return this.http.get<ProposalSummary[]>(
      `${this.baseUrl}${this.endpoint}/mine`,
      {
        params: status ? { status } : {},
      },
    );
  }

  listAll(status?: ProposalStatus): Observable<ProposalSummary[]> {
    return this.http.get<ProposalSummary[]>(
      `${this.baseUrl}${this.endpoint}`,
      {
        params: status ? { status } : {},
      },
    );
  }

  moderate(
    id: string,
    payload: { status: ProposalStatus; rejectionReason?: string },
  ): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}${this.endpoint}/${id}/moderate`,
      payload,
    );
  }

  buildApprovalXdr(id: string): Observable<BuildApprovalResponse> {
    return this.http.post<BuildApprovalResponse>(
      `${this.baseUrl}${this.endpoint}/${id}/build-approval`,
      {},
    );
  }
}
