import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { TxToastComponent } from '../tx-toast/tx-toast.component';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule, TxToastComponent],
  template: `
    <div class="notification-container">
      @for (notification of notificationService.notifications$(); track notification.id) {
        <app-tx-toast 
          [notification]="notification" 
          (close)="notificationService.remove(notification.id)"
        />
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
  `]
})
export class NotificationContainerComponent {
  public notificationService = inject(NotificationService);
}
