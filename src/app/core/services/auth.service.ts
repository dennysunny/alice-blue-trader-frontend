import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';

import { API_CONFIG, API_ENDPOINTS, API_METHODS } from '../configs/api.config';
import { ApiStatus } from '../enums/api.enums';
import { RouteSegment, StorageKey } from '../enums/app.enums';
import { UserSessionApiResponse } from '../models/api-response.models';
import { AuthState, UserSession } from '../models/auth.models';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';

const INITIAL_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  sessionId: null,
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authState = new BehaviorSubject<AuthState>(INITIAL_AUTH_STATE);
  readonly authState$ = this.authState.asObservable();

  loggedInUser = signal<UserSession | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService,
    private apiService: ApiService,
  ) {
    this.rehydrateSession();
  }

  get isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  get sessionId(): string | null {
    return this.authState.value.sessionId;
  }

  get currentUser(): UserSession | null {
    return this.authState.value.user;
  }

  initiateLogin(appCode: string): void {
    window.location.href = `${API_CONFIG.AUTH_URL}${API_ENDPOINTS.AUTH.LOGIN_REDIRECT}${appCode}`;
  }

  createSession(
    userId: string,
    authCode: string,
    apiSecret: string,
  ): Observable<UserSessionApiResponse> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.BE_GET_USER_DETAILS}`;

    this.setLoading(true);

    return this.http.post<UserSessionApiResponse>(url, { userId, authCode }).pipe(
      tap((res) => {
        if (res.stat === ApiStatus.OK) {
          this.setAuthSuccess({ userId: res.clientId }, res.clientId);
          this.loggedInUser.set({ userId: res.clientId } as UserSession);
          this.storage.set(StorageKey.AUTH_TOKEN, res.userSession);
          this.storage.set(StorageKey.USER_ID, res.clientId);
        }
      }),
      catchError((err) => {
        console.log('err', err);
        this.setError(err.message ?? 'Authentication failed');
        return throwError(() => err);
      }),
    );
  }

  logout(): void {
    this.storage.clear();
    this.authState.next(INITIAL_AUTH_STATE);
    this.router.navigate([RouteSegment.AUTH, RouteSegment.LOGIN]);
  }

  private rehydrateSession(): void {
    const sessionId = this.storage.get<string>(StorageKey.AUTH_TOKEN);
    const userId = this.storage.get<string>(StorageKey.USER_ID);
    if (sessionId && userId) {
      this.authState.next({
        ...INITIAL_AUTH_STATE,
        isAuthenticated: true,
        sessionId,
        user: { userId } as UserSession,
      });
    }
  }

  private setAuthSuccess(user: UserSession, sessionId: string): void {
    this.authState.next({
      isAuthenticated: true,
      user,
      sessionId,
      loading: false,
      error: null,
    });
  }

  private setLoading(loading: boolean): void {
    this.authState.next({ ...this.authState.value, loading });
  }

  private setError(error: string): void {
    this.authState.next({ ...this.authState.value, loading: false, error });
  }

  getUserInfo(): void {
    this.apiService
      .post(API_CONFIG.PROXY_URL, {
        method: API_METHODS.GET,
        endpoint: API_ENDPOINTS.PROFILE.GET_PROFILE,
        session: this.sessionId,
      })
      .subscribe({
        next: (response: any) => {
          if (response.result.length) {
            const { clientId, clientName, accountStatus, exchanges, products } = response.result[0];
            const user = {
              userId: clientId,
              userName: clientName,
              accountStatus,
              enabledExchanges: exchanges,
              enabledProducts: products,
            };
            this.loggedInUser.set(user as UserSession);
            this.authState.next({
              ...this.authState.value,
              user: user as UserSession,
            });
          }
        },
        error: (err) => {
          console.error(err);
        },
      });
  }
}
