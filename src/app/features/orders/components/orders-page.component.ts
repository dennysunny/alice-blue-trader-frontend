import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Order, Trade } from '../../../core/models/order.models';
import { OrderStatus, TransactionType } from '../../../core/enums/api.enums';
import { BadgeVariant } from '../../../shared/enums/ui.enums';

type ActiveTab = 'orders' | 'trades';

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  [OrderStatus.COMPLETE]:        BadgeVariant.SUCCESS,
  [OrderStatus.OPEN]:            BadgeVariant.INFO,
  [OrderStatus.CANCELLED]:       BadgeVariant.NEUTRAL,
  [OrderStatus.REJECTED]:        BadgeVariant.DANGER,
  [OrderStatus.TRIGGER_PENDING]: BadgeVariant.WARNING,
  [OrderStatus.MODIFIED]:        BadgeVariant.INFO,
};

@Component({
  standalone: false,
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
})
export class OrdersPageComponent implements OnInit, OnDestroy {
  activeTab: ActiveTab = 'orders';
  orders: Order[] = [];
  trades: Trade[] = [];
  loading = true;

  readonly TransactionType = TransactionType;
  readonly BadgeVariant = BadgeVariant;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  setTab(tab: ActiveTab): void {
    this.activeTab = tab;
    if (tab === 'trades' && this.trades.length === 0) this.loadTrades();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrderBook()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.orders = res.result ?? []; this.loading = false; },
        error: () => { this.loading = false; },
      });
  }

  loadTrades(): void {
    this.loading = true;
    this.orderService.getTradeBook()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => { this.trades = res.result ?? []; this.loading = false; },
        error: () => { this.loading = false; },
      });
  }

  cancelOrder(order: Order): void {
    this.orderService.cancelOrder(order.brokerOrderId)
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
    return STATUS_VARIANT_MAP[status?.toLowerCase()] ?? BadgeVariant.NEUTRAL;
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
