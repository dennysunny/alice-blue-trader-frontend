import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { API_CONFIG, APP_CONSTANTS } from '../configs/api.config';
import { WebSocketFeed } from '../models/instrument.models';
import { WebSocketMessageType, Exchange } from '../enums/api.enums';
import { StorageService } from './storage.service';
import { StorageKey } from '../enums/app.enums';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly feedSubject = new Subject<WebSocketFeed>();
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);

  readonly feed$ = this.feedSubject.asObservable();
  readonly connected$ = this.connectedSubject.asObservable();

  constructor(private storage: StorageService) {}

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    const userId = this.storage.get<string>(StorageKey.USER_ID);
    const sessionId = this.storage.get<string>(StorageKey.AUTH_TOKEN);
    if (!userId || !sessionId) return;

    const url = `${API_CONFIG.WEBSOCKET_URL}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.connectedSubject.next(true);
      this.sendConnectionRequest(userId, sessionId);
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as WebSocketFeed;
        this.feedSubject.next(data);
      } catch {}
    };

    this.socket.onclose = () => {
      this.connectedSubject.next(false);
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.connectedSubject.next(false);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
    this.connectedSubject.next(false);
  }

  subscribe(instruments: Array<{ instrumentId: string; exchange: Exchange }>): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    const payload = {
      k: instruments.map((i) => `${i.exchange}|${i.instrumentId}`).join('#'),
      t: 't',
    };
    this.socket.send(JSON.stringify(payload));
  }

  unsubscribe(instruments: Array<{ instrumentId: string; exchange: Exchange }>): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    const payload = {
      k: instruments.map((i) => `${i.exchange}|${i.instrumentId}`).join('#'),
      t: 'u',
    };
    this.socket.send(JSON.stringify(payload));
  }

  feedFor(instrumentId: string, exchange: Exchange): Observable<WebSocketFeed> {
    return this.feed$.pipe(
      filter(
        (msg) =>
          msg.t === WebSocketMessageType.FEED &&
          msg.tk === instrumentId &&
          msg.e === exchange
      )
    );
  }

  ltpFor(instrumentId: string, exchange: Exchange): Observable<number> {
    return this.feedFor(instrumentId, exchange).pipe(
      filter((msg) => !!msg.lp),
      map((msg) => parseFloat(msg.lp!))
    );
  }

  private sendConnectionRequest(userId: string, sessionId: string): void {
    const payload = {
      t: 'c',
      uid: userId,
      actid: userId,
      susertoken: sessionId,
      source: 'API',
    };
    this.socket?.send(JSON.stringify(payload));
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= APP_CONSTANTS.WEBSOCKET_MAX_RECONNECT_ATTEMPTS) return;
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, APP_CONSTANTS.WEBSOCKET_RECONNECT_DELAY_MS);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
