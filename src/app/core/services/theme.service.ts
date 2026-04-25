import { ChangeDetectorRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { StorageKey, Theme } from '../enums/app.enums';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSubject: BehaviorSubject<Theme>;
  readonly theme$;

  constructor(
    private storage: StorageService,
  ) {
    const initialTheme = this.getInitialTheme();
    this.themeSubject = new BehaviorSubject<Theme>(initialTheme);
    this.theme$ = this.themeSubject.asObservable();

    this.applyTheme(this.themeSubject.value);
  }

  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  get isDark(): boolean {
    return this.themeSubject.value === Theme.DARK;
  }

  toggle(): void {
    const next = this.isDark ? Theme.LIGHT : Theme.DARK;
    this.setTheme(next);
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.storage.set(StorageKey.THEME, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }

  private getInitialTheme(): Theme {
    return this.storage.get<Theme>(StorageKey.THEME) ?? Theme.DARK;
  }
}
