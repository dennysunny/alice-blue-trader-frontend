import { Injectable } from '@angular/core';
import { StorageKey } from '../enums/app.enums';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: StorageKey): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error(`Failed to store key: ${key}`);
    }
  }

  remove(key: StorageKey): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    Object.values(StorageKey).forEach((k) => localStorage.removeItem(k));
  }
}
