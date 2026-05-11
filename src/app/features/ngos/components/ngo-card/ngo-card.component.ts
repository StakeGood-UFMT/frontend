import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Ngo } from '../../../../core/models/ngo.model';

@Component({
  selector: 'app-ngo-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="ngo-card" [routerLink]="['/ngos', ngo.id]" id="ngo-card-{{ngo.id}}">
      <div class="card-header">
        <div class="ngo-info">
          <img [src]="ngo.logo_url || '/logo.webp'" [alt]="ngo.name" class="ngo-logo">
          <div class="name-container">
            <h3 class="ngo-name">{{ ngo.name }}</h3>
            <div class="badges">
              <span class="cause-badge">{{ ngo.cause }}</span>
              <span class="verified-badge" *ngIf="ngo.verified">
                <span class="verified-icon">✓</span> Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      <p class="ngo-description">{{ ngo.description }}</p>

      <div class="card-footer">
        <div class="impact-stats">
          <span class="impact-label">Total Impact</span>
          <span class="impact-value">{{ ngo.total_impact || '0 XLM' }}</span>
        </div>
        <div class="view-profile">
          <span>View Profile</span>
          <span class="arrow">→</span>
        </div>
      </div>
    </a>
  `,
  styles: [`
    .ngo-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      text-decoration: none;
      color: inherit;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
    }

    .ngo-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(17, 212, 138, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
      border-color: rgba(17, 212, 138, 0.2);
    }

    .ngo-info {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .ngo-logo {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      object-fit: cover;
      background: #f3f4f6;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .name-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ngo-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #111815;
      margin: 0;
    }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .cause-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(17, 212, 138, 0.08);
      color: #0d9b66;
    }

    .verified-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(14, 165, 233, 0.08);
      color: #0284c7;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .verified-icon {
      font-weight: 900;
    }

    .ngo-description {
      font-size: 0.85rem;
      color: #6b7280;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 3.8rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.04);
    }

    .impact-stats {
      display: flex;
      flex-direction: column;
    }

    .impact-label {
      font-size: 0.7rem;
      color: #9ca3af;
      font-weight: 600;
      text-transform: uppercase;
    }

    .impact-value {
      font-size: 0.95rem;
      font-weight: 800;
      color: #111815;
    }

    .view-profile {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #11D48A;
      transition: gap 0.2s;
    }

    .ngo-card:hover .view-profile {
      gap: 10px;
    }

    @media (max-width: 480px) {
      .ngo-card {
        padding: 18px;
      }
    }
  `]
})
export class NgoCardComponent {
  @Input({ required: true }) ngo!: Ngo;
}
