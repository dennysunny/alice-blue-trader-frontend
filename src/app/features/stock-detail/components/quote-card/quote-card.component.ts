import { Component, Input } from '@angular/core';
import { Quote } from '../../../../core/models/instrument.models';

interface QuoteRow {
  label: string;
  value: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-quote-card',
  standalone: true,
  imports: [],
  template: `
    <div class="quote-card">
      <div class="quote-card__title">Market Info</div>
      <div class="quote-card__grid">
        @for (row of rows; track row.label) {
          <div class="quote-card__row">
            <span class="quote-card__label">{{ row.label }}</span>
            <span class="quote-card__value" [class.highlight]="row.highlight">{{ row.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './quote-card.component.scss',
})
export class QuoteCardComponent {
  @Input({ required: true }) set quote(q: Quote) {
    this.buildRows(q);
  }

  rows: QuoteRow[] = [];

  private fmt(n: number): string {
    return (
      n?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'
    );
  }

  private buildRows(q: Quote): void {
    this.rows = [
      { label: 'Open', value: `₹${this.fmt(q.open)}` },
      { label: 'High', value: `₹${this.fmt(q.high)}` },
      { label: 'Low', value: `₹${this.fmt(q.low)}` },
      { label: 'Prev Close', value: `₹${this.fmt(q.close)}` },
      { label: 'Avg Price', value: `₹${this.fmt(q.avgPrice)}` },
      { label: 'Volume', value: q.volume?.toLocaleString('en-IN') ?? '—' },
      { label: 'Buy Qty', value: q.totalBuyQty?.toLocaleString('en-IN') ?? '—' },
      { label: 'Sell Qty', value: q.totalSellQty?.toLocaleString('en-IN') ?? '—' },
      { label: '52W High', value: q.weekHigh52 ? `₹${this.fmt(q.weekHigh52)}` : '—' },
      { label: '52W Low', value: q.weekLow52 ? `₹${this.fmt(q.weekLow52)}` : '—' },
      {
        label: 'Upper Circuit',
        value: q.upperCircuit ? `₹${this.fmt(q.upperCircuit)}` : '—',
        highlight: true,
      },
      {
        label: 'Lower Circuit',
        value: q.lowerCircuit ? `₹${this.fmt(q.lowerCircuit)}` : '—',
        highlight: true,
      },
    ];
  }
}
