import { Component, computed, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';
import { NotificationType } from '../../../core/enums/app.enums';

@Component({
  standalone: true,
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent {
  protected readonly notificationService = inject(NotificationService);

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  iconFor(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      [NotificationType.SUCCESS]: '✓',
      [NotificationType.ERROR]: '✕',
      [NotificationType.WARNING]: '⚠',
      [NotificationType.INFO]: 'ℹ',
    };
    return icons[type];
  }
}
