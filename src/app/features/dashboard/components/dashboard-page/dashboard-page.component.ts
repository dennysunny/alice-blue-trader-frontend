import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { HoldingsProductType, OrderStatus } from '../../../../core/enums/api.enums';
import { StatContext } from '../../../../core/models/dashboard.model';
import { FundsLimits } from '../../../../core/models/funds.models';
import { Order } from '../../../../core/models/order.models';
import { Holding, Position } from '../../../../core/models/portfolio.models';
import { FundsService } from '../../../../core/services/funds.service';
import { OrderService } from '../../../../core/services/order.service';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { BadgeVariant } from '../../../../shared/enums/ui.enums';
import { InrPipe } from '../../../../shared/pipes/inr.pipe';
import { statusCardConfig, statusTypes } from '../../configs/dashboard.confg';
import { NavigationService } from '../../../../core/services/navigation.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { StatusCardLabel } from '../../configs/dashboard.enum';
import { PullToRefreshDirective } from '../../../../shared/directives/app-pull-to-refresh';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  imports: [
    CommonModule,
    EmptyStateComponent,
    SpinnerComponent,
    RouterLink,
    InrPipe,
    BadgeComponent,
    PullToRefreshDirective,
  ],
})
export class DashboardPageComponent implements OnInit {
  @ViewChild('ptr') ptr!: PullToRefreshDirective;

  readonly today = new Date();
  recentOrdersCount = 0;

  loading = signal(true);
  holdings = signal<Holding[]>([]);
  recentOrders = signal<Order[]>([]);
  fundsData = signal<FundsLimits | null>(null);
  dayPositions = signal<Position[]>([]);

  readonly statCards = computed(() => {
    const ctx: StatContext = {
      holdings: this.holdings(),
      orders: this.recentOrders(),
      funds: this.fundsData(),
      positions: this.dayPositions(),
    };

    return statusCardConfig.map((config) => {
      const value = config.getValue(ctx);
      const isOrdersCard = config.label === StatusCardLabel.OPEN_ORDERS;
      return {
        label: config.label,
        value,
        type: config.type,
        subValue: isOrdersCard
          ? `Total Orders: ${this.recentOrdersCount}`
          : config.getSubValue?.(ctx),
        isPositive:
          config.type === 'pnl' ? (value > 0 ? true : value < 0 ? false : null) : undefined,
      };
    });
  });

  private readonly portfolioService = inject(PortfolioService);
  private readonly orderService = inject(OrderService);
  private readonly fundsService = inject(FundsService);
  private readonly navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.getDashboardData();
  }

  getDashboardData(): void {
    forkJoin({
      holdings: this.portfolioService
        .getHoldings(HoldingsProductType.MTF)
        .pipe(catchError(() => of({ result: [] }))),
      orders: this.orderService.getOrderBook().pipe(catchError(() => of({ result: [] }))),
      funds: this.fundsService.getFundsLimits().pipe(catchError(() => of({ result: [] }))),
      portfolio: this.portfolioService.getDayPositions().pipe(catchError(() => of({ result: [] }))),
    }).subscribe({
      next: ({ holdings, orders, funds, portfolio }) => {
        this.holdings.set((holdings.result ?? []).slice(0, 5));
        this.recentOrders.set((orders.result ?? []).slice(0, 5));
        this.fundsData.set(funds.result?.[0] ?? null);
        this.dayPositions.set((portfolio.result ?? []).slice(0, 5));
        this.recentOrdersCount = orders.result?.length ?? 0;
        this.loading.set(false);
        this.ptr.complete();
      },
      error: () => {
        this.loading.set(false);
        this.ptr.complete();
      },
    });
  }

  getOrderStatusVariant(status: string): BadgeVariant {
    const key = status?.toLowerCase();

    if (key && key in statusTypes) {
      return statusTypes[key as OrderStatus];
    }

    return BadgeVariant.NEUTRAL;
  }

  goToStock(p: Position): void {
    this.navigationService.toStock({
      instrumentId: p.instrumentId,
      exchange: p.exchange,
      name: p.formattedInstrumentName,
    });
  }
}
