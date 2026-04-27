import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Position } from '../../../../core/models/portfolio.models';

@Component({
  selector  : 'app-detail-positions',
  standalone: true,
  imports   : [DecimalPipe],
  template  : `
    <div class="detail-card">
      <div class="detail-card__title">My Positions</div>
      <table class="dt">
        <thead>
          <tr>
            <th>Product</th>
            <th class="tr">Net Qty</th>
            <th class="tr">Buy Avg</th>
            <th class="tr">Sell Avg</th>
            <th class="tr">Unreal P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          @for (p of positions; track p.instrumentId + p.product) {
            <tr>
              <td><span class="tag">{{ p.product }}</span></td>
              <td class="tr num" [class]="p.netQuantity > 0 ? 'text-up' : p.netQuantity < 0 ? 'text-down' : ''">
                {{ p.netQuantity > 0 ? '+' : '' }}{{ p.netQuantity }}
              </td>
              <td class="tr num">{{ p.buyAvgPrice  | number:'1.2-2' }}</td>
              <td class="tr num">{{ p.sellAvgPrice | number:'1.2-2' }}</td>
              <td class="tr num" [class]="p.unrealizedPnl >= 0 ? 'text-up' : 'text-down'">
                {{ p.unrealizedPnl >= 0 ? '+' : '' }}{{ p.unrealizedPnl | number:'1.2-2' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './detail-positions.component.scss',
})
export class DetailPositionsComponent {
  @Input({ required: true }) positions: Position[] = [];
}
