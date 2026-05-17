import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import {
  AnalyticsInstrument,
  AnalyticsTimeframe,
  CandleResolution,
  DailyOverview,
  DEFAULT_INSTRUMENTS,
  IntradayAnalysis,
  RESOLUTIONS,
  TrendDirection,
} from '../../../../core/models/analytics.model';
import { AnalyticsService } from '../../../../core/services/analytics.service';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './analytics-page.html',
  styleUrl: './analytics-page.scss',
})
export class AnalyticsPageComponent implements OnInit, OnDestroy {
  private readonly svc = inject(AnalyticsService);

  readonly instruments = DEFAULT_INSTRUMENTS;
  readonly resolutions = RESOLUTIONS;
  readonly AnalyticsTimeframe = AnalyticsTimeframe;
  readonly TrendDirection = TrendDirection;

  // ── Controls ──────────────────────────────────────────────────
  selectedInstrument = signal<AnalyticsInstrument>(DEFAULT_INSTRUMENTS[0]);
  selectedDate = signal<string>(this.prevTradingDay());
  selectedResolution = signal<CandleResolution>(CandleResolution.FIVE_MIN);
  activeFrame = signal<AnalyticsTimeframe>(AnalyticsTimeframe.INTRADAY);

  // ── Data ──────────────────────────────────────────────────────
  intraday = signal<IntradayAnalysis | null>(null);
  dailyData = signal<DailyOverview[]>([]);
  prevClose = signal<number>(0);
  loading = signal(false);
  loadingDaily = signal(false);

  // ── Computed summary ──────────────────────────────────────────
  trendLabel = computed(() => {
    const t = this.intraday()?.overallTrend;
    if (!t) return '—';
    return t === TrendDirection.BULLISH
      ? '↑ Bullish'
      : t === TrendDirection.BEARISH
        ? '↓ Bearish'
        : '→ Sideways';
  });

  trendClass = computed(() => {
    const t = this.intraday()?.overallTrend;
    return t === TrendDirection.BULLISH ? 'up' : t === TrendDirection.BEARISH ? 'down' : 'neutral';
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadDaily();
    this.loadIntraday();
  }

  onInstrumentChange(label: string): void {
    const inst = this.instruments.find((i) => i.label === label) ?? this.instruments[0];
    this.selectedInstrument.set(inst);
    this.loadDaily();
    this.loadIntraday();
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.loadIntraday();
  }

  onResolutionChange(res: CandleResolution): void {
    this.selectedResolution.set(res);
    this.loadIntraday();
  }

  setFrame(f: AnalyticsTimeframe): void {
    this.activeFrame.set(f);
    if (f === AnalyticsTimeframe.DAILY && !this.dailyData().length) this.loadDaily();
  }

  selectDayFromChart(date: string): void {
    this.selectedDate.set(date);
    this.activeFrame.set(AnalyticsTimeframe.INTRADAY);
    this.loadIntraday();
  }

  private loadIntraday(): void {
    this.loading.set(true);
    this.intraday.set(null);

    this.svc
      .analyzeDay(
        this.selectedInstrument(),
        this.selectedDate(),
        this.selectedResolution(),
        this.prevClose(),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (a) => {
          this.intraday.set(a);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadDaily(): void {
    this.loadingDaily.set(true);

    this.svc
      .buildDailyOverview(this.selectedInstrument(), 30)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dailyData.set(data);
          // use last candle's close as prevClose for intraday pivots
          if (data.length > 1) this.prevClose.set(data[data.length - 2].close);
          this.loadingDaily.set(false);
        },
        error: () => this.loadingDaily.set(false),
      });
  }

  prevTradingDay(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    // Skip weekends
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
