import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiService } from './api.service';
import { API_CONFIG, API_ENDPOINTS, API_METHODS } from '../configs/api.config';

@Injectable({
  providedIn: 'root',
})
export class OrderWebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private readonly orderFeedSubject = new Subject<any>();

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);

  readonly orderFeed$ = this.orderFeedSubject.asObservable();

  readonly connected$ = this.connectedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
  ) {}

  // =========================================================
  // START CONNECTION
  // =========================================================

  async connect(bearerToken: string, userId: string): Promise<void> {
    try {
      const orderToken = await this.createOrderWsToken(bearerToken);

      console.log('[ORDER WS] Token created');

      this.initializeSocket(orderToken, userId);
    } catch (error) {
      console.error('[ORDER WS] Failed to connect', error);
    }
  }

  // =========================================================
  // CREATE WS TOKEN
  // =========================================================

  private async createOrderWsToken(bearerToken: string): Promise<string> {
    const response: any = await firstValueFrom(
      this.apiService.post(API_CONFIG.PROXY_URL, {
        method: API_METHODS.GET,
        endpoint: API_ENDPOINTS.ORDERS.CREATE_ORDER_WS_TOKEN,
        session: bearerToken,
        isWs: true,
      }),
    );

    return response.result[0].orderToken;
  }

  // =========================================================
  // SOCKET INIT
  // =========================================================

  private initializeSocket(orderToken: string, userId: string): void {
    this.socket = new WebSocket('wss://a3.aliceblueonline.com/open-api/order-notify/websocket');

    this.socket.onopen = () => {
      console.log('[ORDER WS] Connected');

      this.socket?.send(
        JSON.stringify({
          orderToken,
          userId,
        }),
      );
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log('[ORDER WS] Message', data);

        /**
         * Successful subscription
         */
        if (data.status === 'Ok') {
          this.connectedSubject.next(true);

          this.startHeartbeat(userId);

          return;
        }

        /**
         * Actual order updates
         */
        if (data.t === 'om') {
          this.orderFeedSubject.next(data);
        }
      } catch (error) {
        console.error('[ORDER WS] Parse error', error);
      }
    };

    this.socket.onclose = () => {
      console.warn('[ORDER WS] Closed');

      this.connectedSubject.next(false);

      this.stopHeartbeat();
    };

    this.socket.onerror = (error) => {
      console.error('[ORDER WS] Error', error);
    };
  }

  // =========================================================
  // HEARTBEAT
  // =========================================================

  private startHeartbeat(userId: string): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({
            heartbeat: 'h',
            userId,
          }),
        );
      }
    }, 60000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);

      this.heartbeatTimer = null;
    }
  }

  // =========================================================
  // DISCONNECT
  // =========================================================

  disconnect(): void {
    this.stopHeartbeat();

    this.connectedSubject.next(false);

    this.socket?.close();

    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();

    this.orderFeedSubject.complete();

    this.connectedSubject.complete();
  }
}
