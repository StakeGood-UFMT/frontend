import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgoOrganization } from '../../../../core/models/governance.model';

@Component({
  selector: 'app-ngo-vote-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ngo-card" [class.disabled]="disabled" [class.has-votes]="votes > 0">
      <div class="card-header">
        <div class="logo-container">
          <img [src]="ngo.logo_url" [alt]="ngo.name" class="ngo-logo">
        </div>
        <div class="ngo-info">
          <h3 class="ngo-name">{{ ngo.name }}</h3>
          <span class="impact-badge" *ngIf="ngo.impact_area">{{ ngo.impact_area }}</span>
        </div>
      </div>
      
      <p class="ngo-description">{{ ngo.description }}</p>
      
      <div class="voting-controls">
        <div class="slider-header">
          <span class="label">Allocate Impact</span>
          <span class="vote-count">{{ votes }} Votes</span>
        </div>
        
        <input 
          type="range" 
          [min]="0" 
          [max]="maxPossibleVotes" 
          [(ngModel)]="votes" 
          (ngModelChange)="onVotesChange($event)"
          class="vote-slider"
          [disabled]="disabled"
        >
        
        <div class="cost-summary">
          <span class="cost-label">Cost:</span>
          <span class="cost-value">{{ votes * votes }} Credits</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ngo-card {
      background: var(--surface-color, #ffffff);
      border-radius: 20px;
      padding: 24px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      overflow: hidden;
    }

    .ngo-card:hover:not(.disabled) {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
      border-color: rgba(17, 212, 138, 0.2);
    }

    .ngo-card.has-votes {
      border-color: rgba(17, 212, 138, 0.4);
      background: linear-gradient(to bottom right, #ffffff, #f9fffb);
    }

    .ngo-card.disabled {
      opacity: 0.6;
      filter: grayscale(0.8);
      pointer-events: none;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-container {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .ngo-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .ngo-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ngo-name {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--secondary-color, #111815);
    }

    .impact-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 2px 8px;
      border-radius: 99px;
      width: fit-content;
    }

    .ngo-description {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted, #6B7280);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .voting-controls {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--secondary-color, #111815);
    }

    .vote-count {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--primary-color, #11D48A);
    }

    .vote-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: #e5e7eb;
      outline: none;
      transition: background 0.2s;
    }

    .vote-slider::-webkit-slider-runnable-track {
      width: 100%;
      height: 8px;
      cursor: pointer;
      border-radius: 4px;
    }

    .vote-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary-color, #11D48A);
      cursor: pointer;
      border: 3px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      margin-top: -6px;
      transition: transform 0.2s;
    }

    .vote-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    /* Range input fill effect (standard way is hard with pure CSS across browsers, 
       but we can use background-image or linear-gradient trick) */
    .vote-slider {
      background: linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) var(--fill-percent, 0%), #e5e7eb var(--fill-percent, 0%), #e5e7eb 100%);
    }

    .cost-summary {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      font-size: 0.8rem;
    }

    .cost-label {
      color: var(--text-muted, #6B7280);
      font-weight: 600;
    }

    .cost-value {
      color: var(--secondary-color, #111815);
      font-weight: 700;
    }
  `]
})
export class NgoVoteCardComponent {
  @Input({ required: true }) ngo!: NgoOrganization;
  @Input() votes = 0;
  @Input() maxPossibleVotes = 100;
  @Input() disabled = false;
  
  @Output() votesChange = new EventEmitter<number>();

  onVotesChange(value: number) {
    this.votes = value;
    this.votesChange.emit(value);
    
    // Update fill percent for CSS
    const percent = (value / this.maxPossibleVotes) * 100;
    const element = document.querySelector(`.ngo-card:has(img[alt="${this.ngo.name}"]) .vote-slider`) as HTMLElement;
    if (element) {
      element.style.setProperty('--fill-percent', `${percent}%`);
    }
  }
}
