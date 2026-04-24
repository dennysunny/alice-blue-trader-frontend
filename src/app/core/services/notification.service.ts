import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NotificationType } from '../enums/app.enums';
import { APP_CONSTANTS } from '../configs/api.config';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationSubject = new Subject<Notification>();
  readonly notification$ = this.notificationSubject.asObservable();

  success(message: string, title?: string): void {
    this.emit(NotificationType.SUCCESS, message, title);
  }

  error(message: string, title?: string): void {
    this.emit(NotificationType.ERROR, message, title);
  }

  warning(message: string, title?: string): void {
    this.emit(NotificationType.WARNING, message, title);
  }

  info(message: string, title?: string): void {
    this.emit(NotificationType.INFO, message, title);
  }

  private emit(type: NotificationType, message: string, title?: string): void {
    this.notificationSubject.next({
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      title,
      duration: APP_CONSTANTS.TOAST_DURATION_MS,
    });
  }
}
