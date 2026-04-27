import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Order } from '../../../../core/models/order.models';
import { OrderStatus, TransactionType } from '../../../../core/enums/api.enums';
import { BadgeVariant } from '../../../../shared/enums/ui.enums';

const STATUS_MAP: Record<string, BadgeVariant> = {
  [OrderStatus.COMPLETE]: BadgeVariant.SUCCESS,
  [OrderStatus.OPEN]: BadgeVariant.INFO,
  [OrderStatus.CANCELLED]: BadgeVariant.NEUTRAL,
  [OrderStatus.REJECTED]: BadgeVariant.DANGER,
  [OrderStatus.TRIGGER_PENDING]: BadgeVariant.WARNING,
};

@Component({
  selector: 'app-detail-orders',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="detail-card">
      <div class="detail-card__title">My Orders</div>
      <table class="dt">
        <thead>
          <tr>
            <th>Type</th>
            <th>Product</th>
            <th class="tr">Qty</th>
            <th class="tr">Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          @for (o of orders; track o.brokerOrderId) {
            <tr>
              <td>
                <span
                  [class]="
                    o.transactionType === TransactionType.BUY ? 'side side--buy' : 'side side--sell'
                  "
                >
                  {{ o.transactionType }}
                </span>
              </td>
              <td>
                <span class="tag">{{ o.product }}</span>
              </td>
              <td class="tr num">
                {{ o.filledQuantity }}<span class="muted">/{{ o.quantity }}</span>
              </td>
              <td class="tr num">{{ o.price | number: '1.2-2' }}</td>
              <td>
                <span [class]="'badge badge--' + badgeVariant(o.status)">{{ o.status }}</span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './detail-orders.component.scss',
})
export class DetailOrdersComponent {
  @Input({ required: true }) orders: Order[] = [];
  readonly TransactionType = TransactionType;

  badgeVariant(status: string): BadgeVariant {
    return STATUS_MAP[status.toLowerCase()] ?? BadgeVariant.NEUTRAL;
  }
}
