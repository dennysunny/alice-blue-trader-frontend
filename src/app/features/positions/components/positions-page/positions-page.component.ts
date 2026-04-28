import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrderType, TransactionType } from '../../../../core/enums/api.enums';
import { Position } from '../../../../core/models/portfolio.models';
import { NavigationService } from '../../../../core/services/navigation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { InrPipe } from '../../../../shared/pipes/inr.pipe';
import { PositionTabs } from '../../../../shared/types/shared-types';
import { PriceTickerComponent } from '../../../../shared/components/price-ticker/price-ticker.component';
import { positionTypesConfig } from '../../configs/positions.config';
import { PullToRefreshDirective } from '../../../../shared/directives/app-pull-to-refresh';

@Component({
  standalone: true,
  selector: 'app-positions-page',
  templateUrl: './positions-page.component.html',
  styleUrls: ['./positions-page.component.scss'],
  imports: [
    SpinnerComponent,
    EmptyStateComponent,
    CommonModule,
    InrPipe,
    PriceTickerComponent,
    PullToRefreshDirective,
  ],
})
export class PositionsPageComponent implements OnInit, OnDestroy {
  @ViewChild('ptr') ptr!: PullToRefreshDirective;

  activeTab = signal<PositionTabs>('day');
  dayPositions = signal<Position[]>([]);
  netPositions = signal<Position[]>([]);

  loading = signal(true);
  squaringOff = signal(false);

  positionTabs = positionTypesConfig;

  private readonly destroy$ = new Subject<void>();

  private readonly portfolioService = inject(PortfolioService);
  private readonly notifications = inject(NotificationService);
  private readonly navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.loadDay();
  }

  loadDay(): void {
    this.loading.set(true);
    this.portfolioService
      .getDayPositions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dayPositions.set(res.result ?? []);
          this.loading.set(false);
          this.ptr.complete();
        },
        error: () => {
          this.loading.set(false);
          this.ptr.complete();
        },
      });
  }

  setTab(tab: PositionTabs): void {
    this.activeTab.set(tab);
    //if (tab === 'net' && this.netPositions.length === 0) this.loadNet();
  }

  get positions(): Position[] {
    return this.activeTab() === 'day' ? this.dayPositions() : this.netPositions();
  }

  get totalUnrealizedPnl(): number {
    return this.positions.reduce((s, p) => s + p.unrealizedPnl, 0);
  }

  get totalRealizedPnl(): number {
    return this.positions.reduce((s, p) => s + p.realizedPnl, 0);
  }

  squareOff(position: Position, event: MouseEvent): void {
    event.stopPropagation();
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

  goToStock(p: Position): void {
    this.navigationService.toStock({
      instrumentId: p.instrumentId,
      exchange: p.exchange,
      name: p.formattedInstrumentName,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
