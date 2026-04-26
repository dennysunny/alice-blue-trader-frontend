import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showApiKey = false;

  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);
  protected readonly fb = inject(FormBuilder);

  ngOnInit(): void {
    this.createLoginForm();
  }

  createLoginForm(): void {
    this.loginForm = this.fb.group({
      appCode: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }
    const { appCode } = this.loginForm.value as { appCode: string };
    this.authService.initiateLogin(appCode.trim());
  }
}
