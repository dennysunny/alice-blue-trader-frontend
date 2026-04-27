import { Component, Input, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MarketDepth, MarketDepthEntry } from '../../../../core/models/instrument.models';
import { APP_CONSTANTS } from '../../../../core/configs/api.config';

@Component({
  selector: 'app-depth-chart',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="depth">
      <!-- Header row -->
      <div class="depth__header">
        <div class="depth__col depth__col--bid">
          <span>Orders</span><span>Qty</span><span>Bid</span>
        </div>
        <div class="depth__mid">LTP {{ ltp | number: '1.2-2' }}</div>
        <div class="depth__col depth__col--ask">
          <span>Ask</span><span>Qty</span><span>Orders</span>
        </div>
      </div>

      <!-- Ladder rows -->
      @for (i of rowIndices; track i) {
        <div class="depth__row">
          <!-- Bid side -->
          <div class="depth__side depth__side--bid">
            @if (buyRows()[i]; as b) {
              <div class="depth__bar-wrap depth__bar-wrap--bid">
                <div
                  class="depth__bar depth__bar--bid"
                  [style.width.%]="barWidth(b.quantity, maxBuyQty())"
                ></div>
              </div>
              <span class="depth__orders text-muted">{{ b.orders }}</span>
              <span class="depth__qty text-up">{{ b.quantity | number }}</span>
              <span class="depth__price text-up fw-bold">{{ b.price | number: '1.2-2' }}</span>
            }
          </div>

          <!-- Ask side -->
          <div class="depth__side depth__side--ask">
            @if (sellRows()[i]; as s) {
              <span class="depth__price text-down fw-bold">{{ s.price | number: '1.2-2' }}</span>
              <span class="depth__qty text-down">{{ s.quantity | number }}</span>
              <span class="depth__orders text-muted">{{ s.orders }}</span>
              <div class="depth__bar-wrap depth__bar-wrap--ask">
                <div
                  class="depth__bar depth__bar--ask"
                  [style.width.%]="barWidth(s.quantity, maxSellQty())"
                ></div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Totals -->
      <div class="depth__totals">
        <span class="text-up">Total: {{ totalBuy() | number }}</span>
        <span></span>
        <span class="text-down">Total: {{ totalSell() | number }}</span>
      </div>
    </div>
  `,
  styleUrl: './depth-chart.component.scss',
})
export class DepthChartComponent {
  @Input({ required: true }) depth!: MarketDepth;
  @Input() ltp = 0;

  readonly rowIndices = Array.from({ length: APP_CONSTANTS.MAX_DEPTH_ROWS }, (_, i) => i);

  get buyRows(): () => MarketDepthEntry[] {
    return () => this.depth?.buy ?? [];
  }
  get sellRows(): () => MarketDepthEntry[] {
    return () => this.depth?.sell ?? [];
  }

  maxBuyQty = () => Math.max(...(this.depth?.buy ?? []).map((r) => r.quantity), 1);
  maxSellQty = () => Math.max(...(this.depth?.sell ?? []).map((r) => r.quantity), 1);
  totalBuy = () => (this.depth?.buy ?? []).reduce((s, r) => s + r.quantity, 0);
  totalSell = () => (this.depth?.sell ?? []).reduce((s, r) => s + r.quantity, 0);

  barWidth(qty: number, max: number): number {
    return max > 0 ? Math.min((qty / max) * 100, 100) : 0;
  }
}
