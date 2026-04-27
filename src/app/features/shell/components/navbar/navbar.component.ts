import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  standalone: true,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();

  readonly marketTime = new Date();

  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.getUserInfo();
  }

  getUserInfo(): void {
    this.authService.getUserInfo();
  }

  logout(): void {
    this.authService.logout();
  }
}
