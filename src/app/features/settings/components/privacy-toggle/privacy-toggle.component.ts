import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="privacy-card">
      <div class="privacy-header">
        <span class="privacy-icon">{{ icon() }}</span>
        <div class="privacy-info">
          <h3 class="privacy-title">{{ title() }}</h3>
          <p class="privacy-desc">{{ description() }}</p>
        </div>
        <button
          id="toggle-{{ toggleId() }}"
          class="toggle"
          [class.active]="value()"
          [disabled]="disabled()"
          (click)="onToggle()"
          role="switch"
          [attr.aria-checked]="value()"
          [attr.aria-label]="title()">
          <span class="thumb"></span>
        </button>
      </div>
      <div class="privacy-hint" *ngIf="hint()">
        <span class="hint-icon">ℹ️</span> {{ hint() }}
      </div>
    </div>
  `,
  styles: [`
    .privacy-card {
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      transition: box-shadow 0.2s;
    }
    .privacy-card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .privacy-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .privacy-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .privacy-info {
      flex: 1;
    }
    .privacy-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.2rem 0;
    }
    .privacy-desc {
      font-size: 0.82rem;
      color: #6B7280;
      margin: 0;
      line-height: 1.4;
    }
    /* Toggle Switch */
    .toggle {
      position: relative;
      width: 48px;
      height: 26px;
      background: #D1D5DB;
      border: none;
      border-radius: 99px;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.25s;
      padding: 0;
    }
    .toggle.active {
      background: linear-gradient(135deg, #11D48A, #0fb87a);
    }
    .toggle:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.25s cubic-bezier(.68,-.55,.27,1.55);
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    .toggle.active .thumb {
      transform: translateX(22px);
    }
    .privacy-hint {
      margin-top: 0.75rem;
      font-size: 0.78rem;
      color: #9CA3AF;
      padding-top: 0.75rem;
      border-top: 1px solid #F3F4F6;
    }
  `]
})
export class PrivacyToggleComponent {
  title       = input.required<string>();
  description = input.required<string>();
  icon        = input<string>('🔒');
  toggleId    = input<string>('toggle');
  value       = input<boolean>(false);
  disabled    = input<boolean>(false);
  hint        = input<string>('');

  toggled = output<boolean>();

  onToggle() {
    this.toggled.emit(!this.value());
  }
}
