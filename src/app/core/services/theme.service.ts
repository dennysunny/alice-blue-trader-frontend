import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Theme, StorageKey } from '../enums/app.enums';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);

  readonly theme = signal<Theme>(this.storage.get<Theme>(StorageKey.THEME) ?? Theme.DARK);
  readonly isDark = computed(() => this.theme() === Theme.DARK);
  readonly themeConfig = computed(() => {
    const isDark = this.theme() === Theme.DARK;
    return {
      icon: isDark ? '☀️' : '🌙',
      label: isDark ? 'Light mode' : 'Dark mode',
    };
  });

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
      this.storage.set(StorageKey.THEME, this.theme());
    });
  }

  toggle(): void {
    this.theme.set(this.isDark() ? Theme.LIGHT : Theme.DARK);
  }
}
