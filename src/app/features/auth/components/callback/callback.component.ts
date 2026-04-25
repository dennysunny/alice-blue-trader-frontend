import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RouteSegment } from '../../../../core/enums/app.enums';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  selector: 'app-callback',
  template: `
    <div class="callback-page">
      <app-spinner size="lg"></app-spinner>
      <p class="callback-page__msg">{{ message }}</p>
    </div>
  `,
  styles: [
    `
      .callback-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        background: var(--color-bg);
      }
      .callback-page__msg {
        font-size: 14px;
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class CallbackComponent implements OnInit {
  message = 'Authenticating…';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notifications: NotificationService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams as Record<string, string>;
    const authCode = params['authCode'];
    const userId = params['userId'];
    const apiSecret = params['apiSecret'] ?? '';

    if (!authCode || !userId) {
      this.notifications.error('Authentication failed. Missing parameters.');
      this.router.navigate([RouteSegment.AUTH, RouteSegment.LOGIN]);
      return;
    }

    this.authService.createSession(userId, authCode, apiSecret).subscribe({
      next: (res) => {
        console.log('res', res);
        this.message = 'Logged in! Redirecting…';
        this.notifications.success('Welcome back!', 'Login successful');
        this.router.navigate([RouteSegment.DASHBOARD]);
      },
      error: (err) => {
        console.log('err', err);
        this.notifications.error('Session creation failed. Please try again.');
        this.router.navigate([RouteSegment.AUTH, RouteSegment.LOGIN]);
      },
    });
  }
}
