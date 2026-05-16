import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {
  ColorType,
  createChart,
  HistogramData,
  HistogramSeries,
  IChartApi,
  LineData,
  LineSeries,
} from 'lightweight-charts';

import { ChartPeriod, DayReport, YearSummary } from '../../../../core/models/reports.model';
import { ThemeService } from '../../../../core/services/theme.service';

type Time = import('lightweight-charts').Time;

@Component({
  selector: 'app-reports-chart',
  standalone: true,
  templateUrl: './reports-chart.html',
  styleUrl: './reports-chart.scss',
  imports: [DecimalPipe],
})
export class ReportsChartsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) yearSummary!: YearSummary;
  @Input() currentMonth = new Date().getMonth();

  @ViewChild('pnlChart') pnlEl!: ElementRef<HTMLDivElement>;
  @ViewChild('dailyChart') dailyEl!: ElementRef<HTMLDivElement>;
  @ViewChild('monthlyChart') monthlyEl!: ElementRef<HTMLDivElement>;
  @ViewChild('tradesChart') tradesEl!: ElementRef<HTMLDivElement>;

  private readonly theme = inject(ThemeService);

  activePeriod = signal<ChartPeriod>(ChartPeriod.MONTH);
  viewYear = new Date().getFullYear();

  readonly periods = [
    { label: 'This Month', value: ChartPeriod.MONTH },
    { label: 'This Year', value: ChartPeriod.YEAR },
    { label: 'All Time', value: ChartPeriod.ALL },
  ];

  private charts: IChartApi[] = [];

  ngAfterViewInit(): void {
    setTimeout(() => this.buildCharts(), 50);
    effect(() => {
      if (this.theme.isDark()) this.applyTheme();
    });
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['yearSummary'] && !ch['yearSummary'].firstChange) {
      this.destroyCharts();
      setTimeout(() => this.buildCharts(), 50);
    }
  }

  setPeriod(p: ChartPeriod): void {
    this.activePeriod.set(p);
    this.destroyCharts();
    setTimeout(() => this.buildCharts(), 50);
  }

  chartSubtitle(): string {
    const MONTHS = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    switch (this.activePeriod()) {
      case ChartPeriod.MONTH:
        return `${MONTHS[this.currentMonth]} ${this.yearSummary.year}`;
      case ChartPeriod.YEAR:
        return `${this.yearSummary.year}`;
      default:
        return 'All time';
    }
  }

  // ── Computed helpers ───────────────────────────────────────────
  bestMonth() {
    return [...this.yearSummary.months]
      .filter((m) => m.tradingDays > 0)
      .sort((a, b) => b.totalPnl - a.totalPnl)[0];
  }

  worstMonth() {
    return [...this.yearSummary.months]
      .filter((m) => m.tradingDays > 0)
      .sort((a, b) => a.totalPnl - b.totalPnl)[0];
  }

  activeMonths() {
    return this.yearSummary.months.filter((m) => m.tradingDays > 0).length;
  }

  barPct(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }

  // ── Chart building ─────────────────────────────────────────────
  private getDayReports(): DayReport[] {
    const p = this.activePeriod();
    if (p === ChartPeriod.MONTH) {
      return this.yearSummary.months[this.currentMonth]?.days ?? [];
    }
    // Year or All: flatten all months
    return this.yearSummary.months.flatMap((m) => m.days);
  }

  private buildCharts(): void {
    if (!this.pnlEl) return;
    const dark = this.theme.isDark();
    const days = this.getDayReports();

    this.buildPnlCumulative(days, dark);
    this.buildDailyPnl(days, dark);
    this.buildMonthlyPnl(dark);
    this.buildTrades(days, dark);
  }

  private buildPnlCumulative(days: DayReport[], dark: boolean): void {
    const chart = this.makeChart(this.pnlEl.nativeElement, dark, 200);
    const series = chart.addSeries(LineSeries, {
      color: 'var(--color-primary)',
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    let cumulative = 0;
    const data: LineData[] = days.map((d) => {
      cumulative += d.total_pnl;
      return { time: d.date as Time, value: +cumulative.toFixed(2) };
    });
    series.setData(data);
    chart.timeScale().fitContent();
    this.charts.push(chart);
  }

  private buildDailyPnl(days: DayReport[], dark: boolean): void {
    const chart = this.makeChart(this.dailyEl.nativeElement, dark, 200);
    const series = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });

    const data: HistogramData[] = days.map((d) => ({
      time: d.date as Time,
      value: d.total_pnl,
      color: d.total_pnl >= 0 ? 'rgba(38,216,124,0.75)' : 'rgba(255,77,106,0.75)',
    }));
    series.setData(data);
    chart.timeScale().fitContent();
    this.charts.push(chart);
  }

  private buildMonthlyPnl(dark: boolean): void {
    const chart = this.makeChart(this.monthlyEl.nativeElement, dark, 200);
    const series = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });

    const data: HistogramData[] = this.yearSummary.months
      .filter((m) => m.tradingDays > 0)
      .map((m) => ({
        time: `${this.yearSummary.year}-${String(m.month + 1).padStart(2, '0')}-01` as Time,
        value: m.totalPnl,
        color: m.totalPnl >= 0 ? 'rgba(38,216,124,0.75)' : 'rgba(255,77,106,0.75)',
      }));
    series.setData(data);
    chart.timeScale().fitContent();
    this.charts.push(chart);
  }

  private buildTrades(days: DayReport[], dark: boolean): void {
    const chart = this.makeChart(this.tradesEl.nativeElement, dark, 200);
    const series = chart.addSeries(HistogramSeries, {
      color: 'rgba(79,135,255,0.6)',
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });

    const data: HistogramData[] = days.map((d) => ({
      time: d.date as Time,
      value: d.total_trades,
    }));
    series.setData(data);
    chart.timeScale().fitContent();
    this.charts.push(chart);
  }

  private makeChart(el: HTMLDivElement, dark: boolean, height: number): IChartApi {
    const bg = dark ? '#141720' : '#ffffff';
    const text = dark ? '#8891a8' : '#5c6680';
    const grid = dark ? '#1c2030' : '#f0f3f9';

    return createChart(el, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      rightPriceScale: { borderColor: grid },
      timeScale: { borderColor: grid, timeVisible: true, fixLeftEdge: true },
      handleScroll: true,
      handleScale: true,
      crosshair: { mode: 1 },
    });
  }

  private applyTheme(): void {
    if (!this.pnlEl) return;
    this.destroyCharts();
    setTimeout(() => this.buildCharts(), 20);
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => {
      try {
        c.remove();
      } catch {}
    });
    this.charts = [];
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }
}
