import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProposalService, MarketProposal } from '../../services/proposal.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MarketCategory } from '../../../../core/models/market.model';

@Component({
  selector: 'app-propose-market',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './propose-market.component.html',
  styleUrls: ['./propose-market.component.scss']
})
export class ProposeMarketComponent {
  private fb = inject(FormBuilder);
  private proposalService = inject(ProposalService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  proposalForm: FormGroup;
  isSubmitting = false;

  categories: MarketCategory[] = [
    'Sports', 'Finance', 'Environment', 'Tech', 'Politics', 
    'Science', 'Health', 'Education', 'Animals', 'Entertainment'
  ];

  constructor() {
    this.proposalForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      category: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(50)]],
      lock_at: ['', [Validators.required]],
      resolution_rule: ['', [Validators.required]],
      resolution_source: ['', [Validators.required]],
      image_url: ['', [Validators.pattern(/https?:\/\/.+/)]]
    });
  }

  onSubmit() {
    if (this.proposalForm.invalid) {
      this.proposalForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const proposal: MarketProposal = this.proposalForm.value;

    this.proposalService.submitProposal(proposal).subscribe({
      next: () => {
        this.notificationService.show('Proposal submitted successfully!', 'success');
        this.router.navigate(['/arena']);
      },
      error: (err) => {
        console.error('Error submitting proposal:', err);
        this.notificationService.show('Failed to submit proposal. Please try again.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  // Helper for validation feedback
  isInvalid(controlName: string): boolean {
    const control = this.proposalForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
