import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineEvent } from '../../../../core/models/ngo.model';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      <div class="timeline-header">
        <h2 class="section-title">Impact Timeline</h2>
        <p class="section-desc">Historical record of real-world impact verified on-chain.</p>
      </div>

      <div class="timeline" *ngIf="events && events.length > 0; else emptyTimeline">
        <div class="timeline-item" *ngFor="let event of events; let last = last">
          <div class="timeline-marker">
            <div class="marker-dot"></div>
            <div class="marker-line" *ngIf="!last"></div>
          </div>
          <div class="timeline-content">
            <div class="event-header">
              <span class="event-date">{{ event.date | date:'MMM d, y' }}</span>
              <span class="impact-badge">+{{ event.impact_value }} Impact</span>
            </div>
            <h3 class="event-title">{{ event.title }}</h3>
            <p class="event-description">{{ event.description }}</p>
            <div class="event-footer">
              <a [href]="'https://stellar.expert/explorer/public/tx/' + event.tx_hash" 
                 target="_blank" 
                 class="tx-link">
                View on StellarExpert ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyTimeline>
        <div class="empty-timeline">
          <p>No impact events recorded yet.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .timeline-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #111815;
      margin: 0;
    }

    .section-desc {
      font-size: 0.95rem;
      color: #6b7280;
      margin: 4px 0 0;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      padding-left: 8px;
    }

    .timeline-item {
      display: flex;
      gap: 24px;
    }

    .timeline-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 12px;
      flex-shrink: 0;
    }

    .marker-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #11D48A;
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 0 1px #11D48A;
      z-index: 1;
    }

    .marker-line {
      flex: 1;
      width: 2px;
      background: rgba(17, 212, 138, 0.2);
      margin: 4px 0;
    }

    .timeline-content {
      flex: 1;
      padding-bottom: 32px;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .event-date {
      font-size: 0.85rem;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .impact-badge {
      font-size: 0.75rem;
      font-weight: 800;
      background: rgba(17, 212, 138, 0.1);
      color: #11D48A;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .event-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #111815;
      margin: 0 0 8px;
    }

    .event-description {
      font-size: 0.95rem;
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 12px;
    }

    .tx-link {
      font-size: 0.8rem;
      font-weight: 600;
      color: #11D48A;
      text-decoration: none;
      transition: color 0.2s;
    }

    .tx-link:hover {
      color: #0d9b66;
      text-decoration: underline;
    }

    .empty-timeline {
      padding: 32px;
      text-align: center;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px dashed rgba(0, 0, 0, 0.1);
      color: #6b7280;
    }
  `]
})
export class TimelineComponent {
  @Input() events: TimelineEvent[] = [];
}
