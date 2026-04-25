import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { NotificationService, Notification } from '../../../core/services/notification.service';
import { NotificationType } from '../../../core/enums/app.enums';

@Component({
  standalone: false,
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Notification[] = [];
  private sub!: Subscription;

  private readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.sub = this.notificationService.notification$.subscribe((n) => {
      this.toasts.push(n);
      setTimeout(() => this.dismiss(n.id), n.duration ?? 4000);
    });
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
