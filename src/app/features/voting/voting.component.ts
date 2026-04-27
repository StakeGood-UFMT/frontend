import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteService } from './services/vote.service';
import { NgoOrganization, VoteAllocation } from '../../core/models/governance.model';
import { NgoVoteCardComponent } from './components/ngo-vote-card/ngo-vote-card.component';
import { VoteSummaryBarComponent } from './components/vote-summary-bar/vote-summary-bar.component';
import { AuthService } from '../../core/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-voting',
  standalone: true,
  imports: [CommonModule, NgoVoteCardComponent, VoteSummaryBarComponent],
  template: `
    <div class="voting-page">
      <header class="page-header">
        <h1 class="page-title">Impact Governance</h1>
        <p class="page-description">
          Allocate your <strong>Voice Credits</strong> to support the NGOs you believe in. 
          Remember: StakeGood uses <strong>Quadratic Voting</strong> to ensure fair influence.
        </p>
      </header>

      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Loading organizations...</p>
      </div>

      <div *ngIf="!loading() && organizations().length === 0" class="empty-state">
        <p>No organizations available for voting right now.</p>
      </div>

      <div *ngIf="!loading() && organizations().length > 0" class="ngo-grid">
        <app-ngo-vote-card
          *ngFor="let ngo of organizations()"
          [ngo]="ngo"
          [votes]="getVotesForNgo(ngo.id)"
          [maxPossibleVotes]="maxVotesPerNgo()"
          [disabled]="hasVoted()"
          (votesChange)="updateAllocation(ngo.id, $event)"
        ></app-ngo-vote-card>
      </div>

      <!-- Spacer for the summary bar -->
      <div class="page-footer-spacer"></div>

      <app-vote-summary-bar
        *ngIf="!loading() && organizations().length > 0"
        [credits]="voiceCredits()"
        [totalCost]="totalCost()"
        [disabled]="hasVoted()"
        (onSubmit)="confirmAndSubmit()"
      ></app-vote-summary-bar>
    </div>
  `,
  styles: [`
    .voting-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 40px 20px;
      animation: fadeIn 0.6s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      margin-bottom: 48px;
      text-align: center;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--secondary-color, #111815);
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .page-description {
      font-size: 1.1rem;
      color: var(--text-muted, #6B7280);
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }

    .page-description strong {
      color: var(--primary-color, #11D48A);
      font-weight: 700;
    }

    .ngo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
      color: var(--text-muted, #6B7280);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(17, 212, 138, 0.1);
      border-top-color: var(--primary-color, #11D48A);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .page-footer-spacer {
      height: 120px;
    }

    @media (max-width: 768px) {
      .voting-page {
        padding: 24px 16px;
      }
      .page-title {
        font-size: 1.8rem;
      }
      .ngo-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VotingPage implements OnInit {
  private voteService = inject(VoteService);
  private authService = inject(AuthService);

  organizations = signal<NgoOrganization[]>([]);
  allocations = signal<VoteAllocation[]>([]);
  voiceCredits = signal<number>(0);
  hasVoted = signal<boolean>(false);
  loading = signal<boolean>(true);

  totalCost = computed(() => {
    return this.voteService.calculateTotalCost(this.allocations());
  });

  maxVotesPerNgo = computed(() => {
    // Math.floor(Math.sqrt(total_credits))
    return Math.floor(Math.sqrt(this.voiceCredits()));
  });

  ngOnInit() {
    this.loadInitialData();
  }

  private async loadInitialData() {
    this.loading.set(true);
    try {
      // 1. Load NGOs
      const ngos = await this.voteService.getOrganizations().toPromise() || [];
      this.organizations.set(ngos);

      // 2. Load Voting Profile (credits and status)
      // If endpoint fails, we'll try to fallback to profile calculation
      try {
        const profile = await this.voteService.getVotingProfile().toPromise();
        if (profile) {
          this.voiceCredits.set(profile.voice_credits);
          this.hasVoted.set(profile.has_voted);
        }
      } catch (e) {
        console.warn('Voting profile endpoint not available, falling back...');
        // Fallback: Use voice_credits from auth profile if available, else 0
        // this.voiceCredits.set(100); // Mock for now
      }

    } catch (error) {
      console.error('Failed to load voting data', error);
    } finally {
      this.loading.set(false);
    }
  }

  getVotesForNgo(ngoId: string): number {
    const allocation = this.allocations().find(a => a.organization_id === ngoId);
    return allocation ? allocation.votes : 0;
  }

  updateAllocation(ngoId: string, votes: number) {
    if (this.hasVoted()) return;

    this.allocations.update(current => {
      const filtered = current.filter(a => a.organization_id !== ngoId);
      if (votes > 0) {
        return [...filtered, { 
          organization_id: ngoId, 
          votes, 
          cost: this.voteService.calculateCost(votes) 
        }];
      }
      return filtered;
    });
  }

  async confirmAndSubmit() {
    if (this.totalCost() > this.voiceCredits()) {
      alert('You have exceeded your Voice Credits!');
      return;
    }

    const confirmed = confirm(`Are you sure you want to submit your votes? This action cannot be undone.`);
    
    if (confirmed) {
      try {
        await this.voteService.submitVotes(this.allocations());
        this.hasVoted.set(true);
      } catch (error) {
        // Error is handled in service toast
      }
    }
  }
}
