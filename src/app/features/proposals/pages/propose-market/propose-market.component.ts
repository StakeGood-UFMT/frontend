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
  showJsonModal = false;
  jsonText = '';

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
      resolve_at: ['', [Validators.required]],
      resolution_rule: ['', [Validators.required]],
      resolution_source: ['', [Validators.required]],
      oracle_url: ['', [Validators.pattern(/^https?:\/\/[^\s`"]+$/)]],
      image_url: ['', [Validators.pattern(/^https?:\/\/[^\s`"]+$/)]]
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

  get exampleProposalJson(): string {
    const example: MarketProposal = {
      title: 'Will NASA land humans on Mars by 2030?',
      category: 'Science',
      lock_at: '2029-12-31T23:59',
      resolve_at: '2030-12-31T23:59',
      description: 'Provide background information about this market, including context, key sources, and why it matters.',
      resolution_rule: 'YES if NASA publishes an official statement confirming humans landed on Mars by 2030; otherwise NO.',
      resolution_source: 'nasa.gov',
      oracle_url: 'https://example.com/oracle',
      image_url: 'https://example.com/image.png'
    };

    return JSON.stringify(example, null, 2);
  }

  openJsonModal() {
    this.showJsonModal = true;
    if (!this.jsonText.trim()) {
      this.jsonText = this.exampleProposalJson;
    }
  }

  closeJsonModal() {
    this.showJsonModal = false;
  }

  setExampleJson() {
    this.jsonText = this.exampleProposalJson;
  }

  onJsonTextChange(event: Event) {
    const target = event.target as HTMLTextAreaElement | null;
    this.jsonText = (target?.value ?? '').toString();
  }

  async pasteJsonFromClipboard() {
    try {
      const nav = (globalThis as any).navigator as Navigator | undefined;
      const text = await nav?.clipboard?.readText?.();
      if (!text) {
        this.notificationService.error('Clipboard is empty or access was denied. Paste manually into the field.');
        return;
      }
      this.jsonText = text;
      this.notificationService.success('JSON pasted from clipboard.');
    } catch {
      this.notificationService.error('Could not read from clipboard. Paste manually into the field.');
    }
  }

  private toDatetimeLocal(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const raw = value.trim();
    if (!raw) return null;

    const already = raw.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    if (already) return raw.slice(0, 16);

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 16);
  }

  importJson() {
    try {
      const parsed = JSON.parse(this.jsonText || '{}') as any;
      if (!parsed || typeof parsed !== 'object') {
        this.notificationService.error('Invalid JSON.');
        return;
      }

      const title = (parsed.title ?? '').toString();
      const category = (parsed.category ?? '').toString();
      const description = (parsed.description ?? '').toString();
      const resolutionRule = (parsed.resolution_rule ?? parsed.resolutionRule ?? '').toString();
      const resolutionSource = (parsed.resolution_source ?? parsed.resolutionSource ?? '').toString();
      const oracleUrl = (parsed.oracle_url ?? parsed.oracleUrl ?? '').toString();
      const imageUrl = (parsed.image_url ?? parsed.imageUrl ?? '').toString();
      const lockAt = this.toDatetimeLocal(parsed.lock_at ?? parsed.lockAt);
      const resolveAt = this.toDatetimeLocal(parsed.resolve_at ?? parsed.resolveAt);

      this.proposalForm.patchValue({
        title,
        category,
        description,
        resolution_rule: resolutionRule,
        resolution_source: resolutionSource,
        oracle_url: oracleUrl,
        image_url: imageUrl,
        lock_at: lockAt ?? '',
        resolve_at: resolveAt ?? '',
      });

      this.proposalForm.markAllAsTouched();
      this.notificationService.success('JSON imported into the form.');
      this.closeJsonModal();
    } catch {
      this.notificationService.error('Could not import. Please check that the JSON is well-formed.');
    }
  }

  async copyExampleJson() {
    try {
      const text = this.exampleProposalJson;
      const nav = (globalThis as any).navigator as Navigator | undefined;

      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      this.notificationService.success('JSON copied to clipboard.');
    } catch {
      this.notificationService.error('Could not copy JSON. Please try manually.');
    }
  }
}
