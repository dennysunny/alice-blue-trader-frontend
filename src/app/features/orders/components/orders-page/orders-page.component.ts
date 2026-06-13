import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
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
import { PullToRefreshDirective } from '../../../../shared/directives/app-pull-to-refresh';
import { OrderWebSocketService } from '../../../../core/services/order-websocket.service';
import { SyncButtonComponent } from '../../../../shared/components/sync-trade-button/sync-trade-button';

@Component({
  standalone: true,
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  imports: [
    CommonModule,
    EmptyStateComponent,
    SpinnerComponent,
    BadgeComponent,
    PullToRefreshDirective,
    SyncButtonComponent,
  ],
})
export class OrdersPageComponent implements OnInit, OnDestroy {
  @ViewChild('ptr') ptr!: PullToRefreshDirective;

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
  private readonly orderWsService = inject(OrderWebSocketService);

  ngOnInit(): void {
    this.loadOrders();
    this.listenToOrderUpdates();
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
          this.ptr.complete();
        },
        error: () => {
          this.loading.set(false);
          this.ptr.complete();
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
          this.ptr.complete();
        },
        error: () => {
          this.loading.set(false);
          this.ptr.complete();
        },
      });
  }

  private listenToOrderUpdates(): void {
    this.orderWsService.orderFeed$.pipe(takeUntil(this.destroy$)).subscribe((update: any) => {
      console.log('LIVE ORDER UPDATE', update);

      const index = this.orders.findIndex((o) => o.brokerOrderId === update.norenordno);

      /**
       * Existing order → update it
       */
      if (index !== -1) {
        this.orders[index] = {
          ...this.orders[index],
          status: update.status,
          avgPrice: update.avgprc,
          filledQuantity: update.fillshares,
          rejectionReason: update.rejreason,
          exchangeOrderId: update.exchordid,
        };

        /**
         * Trigger Angular UI refresh
         */
        this.orders = [...this.orders];
      } else {
        /**
         * New order
         * Reload orderbook for consistency
         */
        this.loadOrders();
      }

      /**
       * Optional realtime notifications
       */
      this.showOrderNotification(update);
    });
  }

  private showOrderNotification(update: any): void {
    switch (update.status) {
      case 'COMPLETE':
        this.notifications.success(`${update.tsym} order completed`);
        break;

      case 'REJECTED':
        this.notifications.error(update.rejreason || 'Order rejected');
        break;

      case 'CANCELED':
        this.notifications.warning(`${update.tsym} order cancelled`);
        break;

      case 'OPEN':
        this.notifications.info(`${update.tsym} order placed`);
        break;
    }
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
