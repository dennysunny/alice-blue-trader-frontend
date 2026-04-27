import { Injectable, signal } from '@angular/core';

import { NotificationType } from '../enums/app.enums';
import { APP_CONSTANTS } from '../configs/api.config';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toasts = signal<Notification[]>([]);

  success(message: string, title?: string): void {
    this.push(NotificationType.SUCCESS, message, title);
  }
  error(message: string, title?: string): void {
    this.push(NotificationType.ERROR, message, title);
  }
  warning(message: string, title?: string): void {
    this.push(NotificationType.WARNING, message, title);
  }
  info(message: string, title?: string): void {
    this.push(NotificationType.INFO, message, title);
  }

  dismiss(id: string): void {
    this.toasts.update((ts) => ts.filter((t) => t.id !== id));
  }

  private push(type: NotificationType, message: string, title?: string): void {
    const id = `${Date.now()}-${Math.random()}`;
    this.toasts.update((ts) => [...ts, { id, type, message, title }]);
    setTimeout(() => this.dismiss(id), APP_CONSTANTS.TOAST_DURATION_MS);
  }
}
