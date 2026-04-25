import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { HoldingsProductType, OrderStatus } from '../../../core/enums/api.enums';
import { FundsLimits } from '../../../core/models/funds.models';
import { Order } from '../../../core/models/order.models';
import { Holding } from '../../../core/models/portfolio.models';
import { FundsService } from '../../../core/services/funds.service';
import { OrderService } from '../../../core/services/order.service';
import { PortfolioService } from '../../../core/services/portfolio.service';

interface StatCard {
  label: string;
  value: string;
  subValue?: string;
  isPositive?: boolean | null;
}

@Component({
  standalone: false,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  loading = true;
  holdings: Holding[] = [];
  recentOrders: Order[] = [];
  fundsData: FundsLimits | null = null;
  statCards: StatCard[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private portfolioService: PortfolioService,
    private orderService: OrderService,
    private fundsService: FundsService,
    private cdr: ChangeDetectorRef
  ) { }

  readonly today = new Date();

  getOrderStatusVariant(status: string): string {
    const map: Record<string, string> = {
      'complete': 'success',
      'open': 'info',
      'cancelled': 'neutral',
      'rejected': 'danger',
      'trigger pending': 'warning',
    };
    return map[status?.toLowerCase()] ?? 'neutral';
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      holdings: this.portfolioService.getHoldings(HoldingsProductType.MTF).pipe(
        catchError(() => of({ result: [] }))
      ),
      orders: this.orderService.getOrderBook().pipe(
        catchError(() => of({ result: [] }))
      ),
      funds: this.fundsService.getFundsLimits().pipe(
        catchError(() => of({ result: [] }))
      ),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ holdings, orders, funds }) => {
          this.holdings = (holdings.result ?? []).slice(0, 5);
          this.recentOrders = (orders.result ?? []).slice(0, 8);
          this.fundsData = funds.result?.[0] ?? null;
          this.buildStatCards();
          this.loading = false;
          console.log(this.loading)
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
          this.buildMockStatCards();
        },
      });
  }

  private buildStatCards(): void {
    const totalPnl = this.holdings.reduce((sum, h) => sum + (h.pnl ?? 0), 0);
    const openOrders = this.recentOrders.filter((o) => o.status === OrderStatus.OPEN).length;

    this.statCards = [
      {
        label: 'Available Margin',
        value: `₹${(this.fundsData?.tradingLimit ?? 0).toLocaleString('en-IN')}`,
      },
      {
        label: 'Portfolio P&L',
        value: totalPnl >= 0 ? `+₹${totalPnl.toFixed(2)}` : `-₹${Math.abs(totalPnl).toFixed(2)}`,
        isPositive: totalPnl > 0 ? true : totalPnl < 0 ? false : null,
      },
      {
        label: 'Open Orders',
        value: `${openOrders}`,
        subValue: `${this.recentOrders.length} total`,
      },
      {
        label: 'Holdings',
        value: `${this.holdings.length}`,
        subValue: 'Instruments',
      },
    ];
  }

  private buildMockStatCards(): void {
    this.statCards = [
      { label: 'Available Margin', value: '—' },
      { label: 'Portfolio P&L', value: '—', isPositive: null },
      { label: 'Open Orders', value: '—' },
      { label: 'Holdings', value: '—' },
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

