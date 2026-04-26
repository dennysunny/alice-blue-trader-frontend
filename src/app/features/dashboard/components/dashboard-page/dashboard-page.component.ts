import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { HoldingsProductType, OrderStatus } from '../../../../core/enums/api.enums';
import { StatContext } from '../../../../core/models/dashboard.model';
import { FundsLimits } from '../../../../core/models/funds.models';
import { Order } from '../../../../core/models/order.models';
import { Holding } from '../../../../core/models/portfolio.models';
import { FundsService } from '../../../../core/services/funds.service';
import { OrderService } from '../../../../core/services/order.service';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { BadgeVariant } from '../../../../shared/enums/ui.enums';
import { statusCardConfig, statusTypes } from '../../configs/dashboard.confg';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  imports: [CommonModule, EmptyStateComponent, SpinnerComponent, RouterLink],
})
export class DashboardPageComponent implements OnInit {
  readonly today = new Date();

  loading = signal(true);
  holdings = signal<Holding[]>([]);
  recentOrders = signal<Order[]>([]);
  fundsData = signal<FundsLimits | null>(null);

  readonly statCards = computed(() => {
    const ctx: StatContext = {
      holdings: this.holdings(),
      orders: this.recentOrders(),
      funds: this.fundsData(),
    };

    return statusCardConfig.map((config) => {
      const value = config.getValue(ctx);

      return {
        label: config.label,
        value,
        type: config.type,
        subValue: config.getSubValue?.(ctx),
        isPositive:
          config.type === 'pnl' ? (value > 0 ? true : value < 0 ? false : null) : undefined,
      };
    });
  });

  private readonly portfolioService = inject(PortfolioService);
  private readonly orderService = inject(OrderService);
  private readonly fundsService = inject(FundsService);

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
    }).subscribe({
      next: ({ holdings, orders, funds }) => {
        this.holdings.set((holdings.result ?? []).slice(0, 5));
        this.recentOrders.set((orders.result ?? []).slice(0, 8));
        this.fundsData.set(funds.result?.[0] ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
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
}
