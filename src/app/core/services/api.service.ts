import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../configs/api.config';
import { StorageService } from './storage.service';
import { StorageKey } from '../enums/app.enums';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient, private storage: StorageService) {}

  private buildHeaders(): HttpHeaders {
    const sessionId = this.storage.get<string>(StorageKey.AUTH_TOKEN);
    const userId = this.storage.get<string>(StorageKey.USER_ID);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(sessionId && userId
        ? { Authorization: `Bearer ${userId} ${sessionId}` }
        : {}),
    });
  }

  get<T>(endpoint: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        httpParams = httpParams.set(k, v);
      });
    }
    return this.http.get<T>(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers: this.buildHeaders(),
      params: httpParams,
    });
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${API_CONFIG.BASE_URL}${endpoint}`, body, {
      headers: this.buildHeaders(),
    });
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${API_CONFIG.BASE_URL}${endpoint}`, body, {
      headers: this.buildHeaders(),
    });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers: this.buildHeaders(),
    });
  }
}
