import { Component, Output, EventEmitter } from '@angular/core';

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

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
  ) {}

  get userName(): string {
    return (
      this.authService.currentUser?.userName ?? this.authService.currentUser?.userId ?? 'Trader'
    );
  }

  get isDark(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  goToProfile(): void {
    console.log('get profile');
    this.authService.getUserInfo();
  }

  logout(): void {
    this.authService.logout();
  }
}
