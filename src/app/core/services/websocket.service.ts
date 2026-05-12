import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';

import { API_CONFIG, APP_CONSTANTS } from '../configs/api.config';
import { WebSocketFeed } from '../models/instrument.models';
import { WebSocketMessageType, Exchange } from '../enums/api.enums';
import { StorageService } from './storage.service';
import { StorageKey } from '../enums/app.enums';

interface InstrumentSubscription {
  instrumentId: string;
  exchange: Exchange;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;

  private reconnectAttempts = 0;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private manuallyDisconnected = false;

  /**
   * Maintain subscriptions across reconnects
   */
  private readonly subscribedMarketInstruments = new Map<string, InstrumentSubscription>();

  private readonly subscribedDepthInstruments = new Map<string, InstrumentSubscription>();

  private readonly feedSubject = new Subject<WebSocketFeed>();

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);

  readonly feed$ = this.feedSubject.asObservable();

  readonly connected$ = this.connectedSubject.asObservable();

  constructor(private storage: StorageService) {}

  // =========================================================
  // CONNECTION
  // =========================================================

  connect(): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manuallyDisconnected = false;

    const userId = this.storage.get<string>(StorageKey.USER_ID);

    const sessionId = this.storage.get<string>(StorageKey.AUTH_TOKEN);

    if (!userId || !sessionId) {
      console.error('Missing userId or sessionId');
      return;
    }

    this.socket = new WebSocket(API_CONFIG.WEBSOCKET_URL);

    this.socket.onopen = () => {
      console.log('[WS] Connected to socket');

      this.sendConnectionRequest(userId, sessionId);
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data);

        this.handleIncomingMessage(data);
      } catch (error) {
        console.error('[WS] Failed to parse message', error);
      }
    };

    this.socket.onclose = (event) => {
      console.warn('[WS] Connection closed', event);

      this.connectedSubject.next(false);

      this.stopHeartbeat();

      this.socket = null;

      if (!this.manuallyDisconnected) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('[WS] Error', error);

      this.connectedSubject.next(false);

      /**
       * Force close so reconnect logic triggers reliably
       */
      if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
      }
    };
  }

  disconnect(): void {
    this.manuallyDisconnected = true;

    this.clearReconnectTimer();

    this.stopHeartbeat();

    this.connectedSubject.next(false);

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // =========================================================
  // MESSAGE HANDLING
  // =========================================================

  private handleIncomingMessage(data: WebSocketFeed): void {
    /**
     * Connection ACK
     * { "t":"cf", "k":"OK" }
     */
    if (data.t === 'cf') {
      if ((data as any).k === 'OK') {
        console.log('[WS] Authentication successful');

        this.connectedSubject.next(true);

        this.reconnectAttempts = 0;

        this.startHeartbeat();

        this.resubscribeAll();
      } else {
        console.error('[WS] Authentication failed', data);

        this.connectedSubject.next(false);
      }

      return;
    }

    /**
     * Market feed ACK
     * tk
     */
    if (data.t === 'tk') {
      console.log('[WS] Market subscription ACK', data);
    }

    /**
     * Depth feed ACK
     * dk
     */
    if (data.t === 'dk') {
      console.log('[WS] Depth subscription ACK', data);
    }

    /**
     * Market feed
     * tf
     *
     * Depth feed
     * df
     */
    this.feedSubject.next(data);
  }

  // =========================================================
  // AUTH
  // =========================================================

  private sendConnectionRequest(userId: string, sessionId: string): void {
    const payload = {
      t: 'c',
      uid: `${userId}_API`,
      actid: `${userId}_API`,
      susertoken: this.generateSusertoken(sessionId),
      source: 'API',
    };

    console.log('[WS] Sending auth payload');

    this.socket?.send(JSON.stringify(payload));
  }

  /**
   * Alice Blue requires:
   * SHA256(SHA256(sessionId))
   */
  private generateSusertoken(sessionId: string): string {
    const firstHash = CryptoJS.SHA256(sessionId).toString();

    return CryptoJS.SHA256(firstHash).toString();
  }

  // =========================================================
  // HEARTBEAT
  // =========================================================

  /**
   * Alice Blue recommends heartbeat every 50s
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({
            k: '',
            t: 'h',
          }),
        );
      }
    }, 50000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);

      this.heartbeatTimer = null;
    }
  }

  // =========================================================
  // MARKET SUBSCRIPTIONS
  // =========================================================

  subscribe(instruments: InstrumentSubscription[]): void {
    if (!instruments.length) return;

    instruments.forEach((instrument) => {
      this.subscribedMarketInstruments.set(
        `${instrument.exchange}|${instrument.instrumentId}`,
        instrument,
      );
    });

    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      k: instruments
        .map((instrument) => `${instrument.exchange}|${instrument.instrumentId}`)
        .join('#'),
      t: 't',
    };

    console.log('[WS] Market subscribe', payload);

    this.socket.send(JSON.stringify(payload));
  }

  unsubscribe(instruments: InstrumentSubscription[]): void {
    if (!instruments.length) return;

    instruments.forEach((instrument) => {
      this.subscribedMarketInstruments.delete(`${instrument.exchange}|${instrument.instrumentId}`);
    });

    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      k: instruments
        .map((instrument) => `${instrument.exchange}|${instrument.instrumentId}`)
        .join('#'),
      t: 'u',
    };

    console.log('[WS] Market unsubscribe', payload);

    this.socket.send(JSON.stringify(payload));
  }

  // =========================================================
  // DEPTH SUBSCRIPTIONS
  // =========================================================

  subscribeDepth(instruments: InstrumentSubscription[]): void {
    if (!instruments.length) return;

    instruments.forEach((instrument) => {
      this.subscribedDepthInstruments.set(
        `${instrument.exchange}|${instrument.instrumentId}`,
        instrument,
      );
    });

    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      k: instruments
        .map((instrument) => `${instrument.exchange}|${instrument.instrumentId}`)
        .join('#'),
      t: 'd',
    };

    console.log('[WS] Depth subscribe', payload);

    this.socket.send(JSON.stringify(payload));
  }

  unsubscribeDepth(instruments: InstrumentSubscription[]): void {
    if (!instruments.length) return;

    instruments.forEach((instrument) => {
      this.subscribedDepthInstruments.delete(`${instrument.exchange}|${instrument.instrumentId}`);
    });

    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      k: instruments
        .map((instrument) => `${instrument.exchange}|${instrument.instrumentId}`)
        .join('#'),
      t: 'ud',
    };

    console.log('[WS] Depth unsubscribe', payload);

    this.socket.send(JSON.stringify(payload));
  }

  // =========================================================
  // RECONNECT
  // =========================================================

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= APP_CONSTANTS.WEBSOCKET_MAX_RECONNECT_ATTEMPTS) {
      console.error('[WS] Max reconnect attempts reached');

      return;
    }

    this.reconnectAttempts++;

    const delay = APP_CONSTANTS.WEBSOCKET_RECONNECT_DELAY_MS * this.reconnectAttempts;

    console.warn(`[WS] Reconnecting attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);

      this.reconnectTimer = null;
    }
  }

  private resubscribeAll(): void {
    const marketInstruments = Array.from(this.subscribedMarketInstruments.values());

    const depthInstruments = Array.from(this.subscribedDepthInstruments.values());

    if (marketInstruments.length) {
      console.log('[WS] Resubscribing market feeds', marketInstruments.length);

      this.subscribe(marketInstruments);
    }

    if (depthInstruments.length) {
      console.log('[WS] Resubscribing depth feeds', depthInstruments.length);

      this.subscribeDepth(depthInstruments);
    }
  }

  // =========================================================
  // OBSERVABLE HELPERS
  // =========================================================

  feedFor(instrumentId: string, exchange: Exchange): Observable<WebSocketFeed> {
    return this.feed$.pipe(
      filter(
        (msg) =>
          (msg.t === WebSocketMessageType.FEED || msg.t === 'df') &&
          msg.tk === instrumentId &&
          msg.e === exchange,
      ),
    );
  }

  ltpFor(instrumentId: string, exchange: Exchange): Observable<number> {
    return this.feedFor(instrumentId, exchange).pipe(
      filter((msg) => !!msg.lp),
      map((msg) => parseFloat(msg.lp!)),
    );
  }

  // =========================================================
  // CLEANUP
  // =========================================================

  ngOnDestroy(): void {
    this.disconnect();

    this.feedSubject.complete();

    this.connectedSubject.complete();
  }
}
