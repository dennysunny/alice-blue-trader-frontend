import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Router } from '@angular/router';
import { RouteSegment } from '../../../../core/enums/app.enums';

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
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.getUserInfo();
  }

  getUserInfo(): void {
    this.authService.getUserInfo();
  }

  goToProfile(): void {
    this.router.navigate([RouteSegment.PROFILE]);
  }
}
