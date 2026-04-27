import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import { NgoOrganization, VoteAllocation, VotingProfile } from '../../../core/models/governance.model';
import { WalletService } from '../../../core/services/wallet.service';
import { NotificationService } from '../../../core/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  private http = inject(HttpClient);
  private walletService = inject(WalletService);
  private notificationService = inject(NotificationService);

  getOrganizations(): Observable<NgoOrganization[]> {
    return this.http.get<NgoOrganization[]>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.governance.organizations}`);
  }

  getVotingProfile(): Observable<VotingProfile> {
    // Note: The endpoint might be /governance/profile or similar. 
    // If not exists, we might need to use a generic user profile.
    return this.http.get<VotingProfile>(`${API_CONFIG.baseUrl}/governance/profile`);
  }

  async submitVotes(allocations: VoteAllocation[]): Promise<void> {
    const toastId = this.notificationService.show('Preparing your vote...', 'pending', undefined, true);

    try {
      // 1. Build XDR
      const response = await firstValueFrom(
        this.http.post<{ xdr: string; txHash: string }>(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.voting.buildVote}`,
          { 
            votes: allocations.map(a => ({
              organization_id: a.organization_id,
              amount: a.votes // Sending the "votes" (sqrt of credits)
            }))
          }
        )
      );

      const { xdr, txHash } = response;

      this.notificationService.update(toastId, { message: 'Awaiting signature...' });

      // 2. Sign XDR
      const { signedTxXdr } = await this.walletService.signTransaction(xdr);

      this.notificationService.update(toastId, { message: 'Submitting vote...' });

      // 3. Submit Transaction
      await firstValueFrom(
        this.http.post(
          `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transactions.base}/submit`,
          { signedXdr: signedTxXdr }
        )
      );

      this.notificationService.update(toastId, { 
        message: 'Vote submitted successfully!', 
        type: 'success',
        persistent: false
      });

    } catch (error: any) {
      console.error('[VoteService] Vote submission failed:', error);
      
      this.notificationService.update(toastId, { 
        message: error.error?.message || 'Failed to submit vote', 
        type: 'error',
        persistent: false 
      });
      
      throw error;
    }
  }

  /**
   * Calculates quadratic cost for a given number of votes.
   * cost = votes^2
   */
  calculateCost(votes: number): number {
    return Math.pow(votes, 2);
  }

  /**
   * Calculates total cost for all allocations.
   */
  calculateTotalCost(allocations: VoteAllocation[]): number {
    return allocations.reduce((sum, a) => sum + this.calculateCost(a.votes), 0);
  }
}
