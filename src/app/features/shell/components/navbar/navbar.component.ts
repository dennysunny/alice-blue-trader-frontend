import { Component, Output, EventEmitter, inject } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  standalone: true,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  readonly marketTime = new Date();

  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);

  get userName(): string {
    return (
      this.authService.currentUser?.userName ?? this.authService.currentUser?.userId ?? 'Trader'
    );
  }

  goToProfile(): void {
    this.authService.getUserInfo();
  }

  logout(): void {
    this.authService.logout();
  }
}
