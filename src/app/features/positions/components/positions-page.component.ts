import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrderType, TransactionType } from '../../../core/enums/api.enums';
import { Position } from '../../../core/models/portfolio.models';
import { NotificationService } from '../../../core/services/notification.service';
import { PortfolioService } from '../../../core/services/portfolio.service';

type PosTab = 'day' | 'net';

@Component({
  standalone: true,
  selector: 'app-positions-page',
  templateUrl: './positions-page.component.html',
  styleUrls: ['./positions-page.component.scss'],
})
export class PositionsPageComponent implements OnInit, OnDestroy {
  activeTab: PosTab = 'day';
  dayPositions: Position[] = [];
  netPositions: Position[] = [];
  loading = true;
  squaringOff = false;

  get positions(): Position[] {
    return this.activeTab === 'day' ? this.dayPositions : this.netPositions;
  }

  get totalUnrealizedPnl(): number {
    return this.positions.reduce((s, p) => s + p.unrealizedPnl, 0);
  }

  get totalRealizedPnl(): number {
    return this.positions.reduce((s, p) => s + p.realizedPnl, 0);
  }

  private readonly destroy$ = new Subject<void>();

  private readonly portfolioService = inject(PortfolioService);
  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadDay();
  }

  setTab(tab: PosTab): void {
    this.activeTab = tab;
    //if (tab === 'net' && this.netPositions.length === 0) this.loadNet();
  }

  private loadDay(): void {
    this.loading = true;
    this.portfolioService
      .getDayPositions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dayPositions = res.result ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  squareOff(position: Position): void {
    const side = position.netQuantity > 0 ? TransactionType.SELL : TransactionType.BUY;
    this.portfolioService
      .squareOff({
        exchange: position.exchange,
        instrumentId: position.instrumentId,
        product: position.product,
        quantity: Math.abs(position.netQuantity),
        transactionType: side,
        orderType: OrderType.MARKET,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success(`Square off placed for ${position.formattedInstrumentName}`);
          this.loadDay();
        },
        error: (err) => this.notifications.error(err?.error?.message ?? 'Square off failed'),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
