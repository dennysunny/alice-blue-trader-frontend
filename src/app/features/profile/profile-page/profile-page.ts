import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.scss'],
})
export class ProfilePageComponent {
  protected readonly authService = inject(AuthService);

  constructor() {
    console.log('Trading Profile:', this.authService.tradingProfile());
  }

  yesNo(v: 'Y' | 'N'): string {
    return v === 'Y' ? 'Enabled' : 'Disabled';
  }

  logout(): void {
    this.authService.logout();
  }
}
