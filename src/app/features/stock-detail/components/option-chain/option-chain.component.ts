import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject, takeUntil, switchMap, of } from 'rxjs';

import { OptionChainExchange, OptionChainInterval } from '../../configs/stock.enum';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { OptionChainService } from '../../../../core/services/option-chain.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { OptionChainRowView, OptionContractView } from '../../../../core/models/option-chain.model';
import { Exchange } from '../../../../core/enums/api.enums';

interface ExchOption {
  label: string;
  value: OptionChainExchange;
}
interface IntervalOption {
  label: string;
  value: OptionChainInterval;
}

const EXCH_OPTIONS: ExchOption[] = [
  { label: 'NSE F&O', value: OptionChainExchange.NSE_FO },
  { label: 'BSE F&O', value: OptionChainExchange.BSE_FO },
  { label: 'MCX F&O', value: OptionChainExchange.MCX_FO },
];

const INTERVAL_OPTIONS: IntervalOption[] = [
  { label: '5', value: OptionChainInterval.FIVE },
  { label: '10', value: OptionChainInterval.TEN },
  { label: '15', value: OptionChainInterval.FIFTEEN },
  { label: '20', value: OptionChainInterval.TWENTY },
  { label: '25', value: OptionChainInterval.TWENTY_FIVE },
];

@Component({
  selector: 'app-option-chain',
  standalone: true,
  imports: [DecimalPipe, SpinnerComponent],
  templateUrl: './option-chain.component.html',
  styleUrl: './option-chain.component.scss',
})
export class OptionChainComponent implements OnInit, OnDestroy {
  private readonly svc = inject(OptionChainService);
  private readonly ws = inject(WebSocketService);
  private readonly notify = inject(NotificationService);
  readonly nav = inject(NavigationService);

  // ── Selectors ──────────────────────────────────────────────────
  readonly exchOptions = EXCH_OPTIONS;
  readonly intervalOptions = INTERVAL_OPTIONS;

  selectedExch = signal<OptionChainExchange>(OptionChainExchange.NSE_FO);
  selectedUnderlying = signal<string>('');
  selectedExpiry = signal<string>('');
  selectedInterval = signal<OptionChainInterval>(OptionChainInterval.TEN);

  // ── Data ───────────────────────────────────────────────────────
  underlyings = signal<string[]>([]);
  expiries = signal<string[]>([]);
  rows = signal<OptionChainRowView[]>([]);
  spotPrice = signal<number>(0);

  // ── Loading states ─────────────────────────────────────────────
  loadingUnderlyings = signal(false);
  loadingExpiries = signal(false);
  loadingChain = signal(false);

  // ── Computed stats ─────────────────────────────────────────────
  readonly totalCeOi = computed(() => this.rows().reduce((s, r) => s + (r.CE?.oi ?? 0), 0));
  readonly totalPeOi = computed(() => this.rows().reduce((s, r) => s + (r.PE?.oi ?? 0), 0));
  readonly pcr = computed(() => {
    const ce = this.totalCeOi();
    return ce > 0 ? (this.totalPeOi() / ce).toFixed(2) : '—';
  });
  readonly atmRow = computed(() => this.rows().find((r) => r.isAtm));

  // ── Max OI for bar widths ──────────────────────────────────────
  readonly maxCeOi = computed(() => Math.max(...this.rows().map((r) => r.CE?.oi ?? 0), 1));
  readonly maxPeOi = computed(() => Math.max(...this.rows().map((r) => r.PE?.oi ?? 0), 1));

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadUnderlyings(this.selectedExch());
  }

  // ── Step 1: load underlyings ───────────────────────────────────
  loadUnderlyings(exch: OptionChainExchange): void {
    this.selectedExch.set(exch);
    this.selectedUnderlying.set('');
    this.selectedExpiry.set('');
    this.rows.set([]);
    this.expiries.set([]);
    this.loadingUnderlyings.set(true);

    this.svc
      .getUnderlyings(exch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.underlyings.set(list);
          this.loadingUnderlyings.set(false);
          if (list.length > 0) this.loadExpiries(list[0]);
        },
        error: () => {
          this.loadingUnderlyings.set(false);
          this.notify.error('Failed to load underlyings');
        },
      });
  }

  // ── Step 2: load expiries ──────────────────────────────────────
  loadExpiries(underlying: string): void {
    this.selectedUnderlying.set(underlying);
    this.selectedExpiry.set('');
    this.rows.set([]);
    this.loadingExpiries.set(true);

    this.svc
      .getExpiries(underlying, this.selectedExch())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.expiries.set(list);
          this.loadingExpiries.set(false);
          if (list.length > 0) this.loadChain(list[0]);
        },
        error: () => {
          this.loadingExpiries.set(false);
          this.notify.error('Failed to load expiries');
        },
      });
  }

  // ── Step 3: load option chain ──────────────────────────────────
  loadChain(expiry?: string): void {
    const exp = expiry ?? this.selectedExpiry();
    if (!exp || !this.selectedUnderlying()) return;

    this.selectedExpiry.set(exp);
    this.loadingChain.set(true);

    this.svc
      .getOptionChain(
        this.selectedUnderlying(),
        exp,
        this.selectedInterval(),
        this.selectedExch(),
        this.spotPrice(),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.loadingChain.set(false);
          this.subscribeToWsFeed(rows);
        },
        error: () => {
          this.loadingChain.set(false);
          this.notify.error('Failed to load option chain');
        },
      });
  }

  setInterval(interval: OptionChainInterval): void {
    this.selectedInterval.set(interval);
    this.loadChain();
  }

  // ── Live price updates via WebSocket ──────────────────────────
  private subscribeToWsFeed(rows: OptionChainRowView[]): void {
    const tokens: { instrumentId: string; exchange: Exchange }[] = [];

    rows.forEach((r) => {
      if (r.CE?.token) tokens.push({ instrumentId: r.CE.token, exchange: Exchange.NFO });
      if (r.PE?.token) tokens.push({ instrumentId: r.PE.token, exchange: Exchange.NFO });
    });

    console.log('rows', rows);

    if (tokens.length > 0) {
      this.ws.connect();
      this.ws.subscribe(tokens);
    }

    this.ws.feed$.pipe(takeUntil(this.destroy$)).subscribe((msg) => {
      if ((msg.t !== 'tf' && msg.t !== 'tk') || !msg.tk || !msg.lp) return;

      console.log('ws msg', msg);

      this.rows.update((current) =>
        current.map((row) => {
          let updated = false;
          let ce = row.CE;
          let pe = row.PE;

          if (ce?.token === msg.tk) {
            const ltp = parseFloat(msg.lp!);
            ce = {
              ...ce,
              ltp,
              change: ltp - ce!.pdc,
              changePct: ce!.pdc > 0 ? ((ltp - ce!.pdc) / ce!.pdc) * 100 : 0,
            } as OptionContractView;
            updated = true;
          }
          if (pe?.token === msg.tk) {
            const ltp = parseFloat(msg.lp!);
            pe = {
              ...pe,
              ltp,
              change: ltp - pe!.pdc,
              changePct: pe!.pdc > 0 ? ((ltp - pe!.pdc) / pe!.pdc) * 100 : 0,
            } as OptionContractView;
            updated = true;
          }

          return updated ? { ...row, CE: ce, PE: pe } : row;
        }),
      );
    });
  }

  // ── UI helpers ─────────────────────────────────────────────────
  oiBarWidth(oi: number, max: number): number {
    return max > 0 ? Math.min((oi / max) * 100, 100) : 0;
  }

  ltpClass(change?: number): string {
    if (change == null) return '';
    return change > 0 ? 'up' : change < 0 ? 'down' : '';
  }

  oiChangeClass(change?: number): string {
    if (!change) return '';
    return change > 0 ? 'up' : 'down';
  }

  goToStock(token: string, name: string): void {
    let exchange = Exchange.NSE;
    if (this.selectedExch() === OptionChainExchange.NSE_FO) {
      exchange = Exchange.NSE;
    } else if (this.selectedExch() === OptionChainExchange.BSE_FO) {
      exchange = Exchange.BSE;
    } else if (this.selectedExch() === OptionChainExchange.MCX_FO) {
      exchange = Exchange.MCX;
    }
    this.nav.toStock({ instrumentId: token, exchange, name });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
