import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, OnInit, computed, inject, signal } from '@angular/core';

import { TradeRow } from '../../../../core/models/reports.model';
import { ReportsService } from '../../../../core/services/reports.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-reports-ledger',
  standalone: true,
  imports: [DecimalPipe, SpinnerComponent],
  templateUrl: './reports-ledger.html',
  styleUrl: './reports-ledger.scss',
})
export class ReportsLedgerComponent implements OnInit, OnChanges {
  @Input({ required: true }) year!: number;
  @Input({ required: true }) month!: number;

  private readonly svc = inject(ReportsService);

  trades = signal<TradeRow[]>([]);
  loading = signal(true);
  groupedByDate = signal<Map<string, TradeRow[]>>(new Map());

  readonly totalCharges = computed(() =>
    this.trades().reduce(
      (a, t) =>
        a +
        (t.brokerage_charges ?? 0) +
        (t.transaction_charges ?? 0) +
        (t.gst ?? 0) +
        (t.stt ?? 0) +
        (t.sebi_charges ?? 0) +
        (t.stamp_duty ?? 0),
      0,
    ),
  );

  readonly totalPnl = computed(() => {
    return this.trades().reduce((s, t) => s + (t.net_pnl ?? 0), 0);
  });

  readonly totalBrokerage = computed(() => {
    return this.trades().reduce((s, t) => s + (t.brokerage ?? 0), 0);
  });

  readonly totalQty = computed(() => {
    return this.trades().reduce((s, t) => s + (t.quantity ?? 0), 0);
  });

  readonly totalTrades = computed(() => {
    return this.trades().length;
  });

  readonly winTrades = computed(() => {
    return this.trades().filter((t) => (t.net_pnl ?? 0) > 0).length;
  });

  readonly lossTrades = computed(() => {
    return this.trades().filter((t) => (t.net_pnl ?? 0) < 0).length;
  });

  ngOnInit(): void {
    this.load();
  }
  ngOnChanges(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getTradesForMonth(this.year, this.month).subscribe({
      next: (trades) => {
        this.trades.set(trades);
        const map = new Map<string, TradeRow[]>();
        trades.forEach((t) => {
          const arr = map.get(t.date) ?? [];
          arr.push(t);
          map.set(t.date, arr);
        });
        this.groupedByDate.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  sortedDates(): string[] {
    return [...this.groupedByDate().keys()].sort((a, b) => b.localeCompare(a));
  }

  dayPnl(date: string): number {
    return (this.groupedByDate().get(date) ?? []).reduce((s, t) => s + (t.net_pnl ?? 0), 0);
  }
}
