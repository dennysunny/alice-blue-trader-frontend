import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrderStatus, TransactionType } from '../../../../core/enums/api.enums';
import { Order, Trade } from '../../../../core/models/order.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { OrderService } from '../../../../core/services/order.service';
import { BadgeVariant } from '../../../../shared/enums/ui.enums';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ActiveTab } from '../../../../shared/types/shared-types';
import { StatusVarientConfig } from '../../config/order.config';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { Position } from '../../../../core/models/portfolio.models';
import { NavigationService } from '../../../../core/services/navigation.service';

@Component({
  standalone: true,
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  imports: [CommonModule, EmptyStateComponent, SpinnerComponent, BadgeComponent],
})
export class OrdersPageComponent implements OnInit, OnDestroy {
  activeTab: ActiveTab = 'orders';
  orders: Order[] = [];
  trades: Trade[] = [];
  loading = signal<boolean>(true);

  readonly TransactionType = TransactionType;
  readonly BadgeVariant = BadgeVariant;
  private readonly destroy$ = new Subject<void>();

  private readonly orderService = inject(OrderService);
  private readonly notifications = inject(NotificationService);
  private readonly navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.loadOrders();
  }

  setTab(tab: ActiveTab): void {
    this.activeTab = tab;
    if (tab === 'trades' && this.trades.length === 0) this.loadTrades();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService
      .getOrderBook()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.orders = res.result ?? [];
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  loadTrades(): void {
    this.loading.set(true);
    this.orderService
      .getTradeBook()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.trades = res.result ?? [];
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  cancelOrder(order: Order): void {
    this.orderService
      .cancelOrder(order.brokerOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success(`Order cancelled for ${order.formattedInstrumentName}`);
          this.loadOrders();
        },
        error: (err) => this.notifications.error(err?.error?.message ?? 'Cancel failed'),
      });
  }

  canCancel(order: Order): boolean {
    return order.status === OrderStatus.OPEN || order.status === OrderStatus.TRIGGER_PENDING;
  }

  getStatusVariant(status: string): BadgeVariant {
    return StatusVarientConfig[status?.toLowerCase()] ?? BadgeVariant.NEUTRAL;
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
