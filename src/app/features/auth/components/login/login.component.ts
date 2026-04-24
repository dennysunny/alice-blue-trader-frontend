import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  readonly form: FormGroup;
  showApiKey = false;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    public themeService: ThemeService
  ) {
    this.form = this.fb.group({
      appCode: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  get isDark(): boolean { return this.themeService.isDark; }

  login(): void {
    if (this.form.invalid) return;
    const { appCode } = this.form.value as { appCode: string };
    this.authService.initiateLogin(appCode.trim());
  }

  toggleTheme(): void { this.themeService.toggle(); }
}
