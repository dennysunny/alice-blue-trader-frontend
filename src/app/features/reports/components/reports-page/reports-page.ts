import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ReportsService } from '../../../../core/services/reports.service';
import { ReportsCalendarComponent } from '../reports-calendar/reports-calendar';
import { ReportsChartsComponent } from '../reports-chart/reports-chart';
import { ReportsLedgerComponent } from '../reports-ledger/reports-ledger';
import { TradingRulesComponent } from '../trading-rules/trading-rules';
import { DailySummaryComponent } from '../daily-summary/daily-summary';
import {
  DayOutcome,
  DayReport,
  MonthSummary,
  YearSummary,
  ReportTab,
} from '../../../../core/models/reports.model';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    SpinnerComponent,
    ReportsCalendarComponent,
    ReportsChartsComponent,
    ReportsLedgerComponent,
    TradingRulesComponent,
    DailySummaryComponent,
    DecimalPipe,
  ],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
})
export class ReportsPage implements OnInit, OnDestroy {
  private readonly svc = inject(ReportsService);

  readonly ReportTab = ReportTab;
  readonly DayOutcome = DayOutcome;

  // ── Navigation state ───────────────────────────────────────────
  activeTab = signal<ReportTab>(ReportTab.CALENDAR);
  selectedDate = signal<string>(this.todayStr());
  viewYear = signal<number>(new Date().getFullYear());
  viewMonth = signal<number>(new Date().getMonth());

  // ── Data signals ───────────────────────────────────────────────
  yearSummary = signal<YearSummary | null>(null);
  monthReports = signal<DayReport[]>([]);
  selectedReport = signal<DayReport | null>(null);
  loading = signal(false);

  // ── Computed month summary ─────────────────────────────────────
  currentMonthSummary = computed<MonthSummary | null>(() => {
    const year = this.yearSummary();
    if (!year) return null;
    return year.months[this.viewMonth()] ?? null;
  });

  // ── Year-level stats for header ────────────────────────────────
  yearTotalPnl = computed(() => this.yearSummary()?.totalPnl ?? 0);
  yearWinRate = computed(() => this.yearSummary()?.winRate ?? 0);
  yearTrades = computed(() => this.yearSummary()?.totalTrades ?? 0);

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadYear(this.viewYear());
  }

  // ── Navigation ─────────────────────────────────────────────────
  setTab(tab: ReportTab): void {
    this.activeTab.set(tab);
  }

  prevMonth(): void {
    let m = this.viewMonth() - 1;
    let y = this.viewYear();
    if (m < 0) {
      m = 11;
      y--;
    }
    this.viewMonth.set(m);
    this.viewYear.set(y);
    if (y !== (this.yearSummary()?.year ?? 0)) this.loadYear(y);
  }

  nextMonth(): void {
    let m = this.viewMonth() + 1;
    let y = this.viewYear();
    if (m > 11) {
      m = 0;
      y++;
    }
    this.viewMonth.set(m);
    this.viewYear.set(y);
    if (y !== (this.yearSummary()?.year ?? 0)) this.loadYear(y);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.loadDayReport(date);
  }

  // ── Data loading ───────────────────────────────────────────────
  private loadYear(year: number): void {
    this.loading.set(true);
    this.svc
      .getReportsForYear(year)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (s) => {
          this.yearSummary.set(s);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadDayReport(date: string): void {
    this.svc
      .getDailyReport(date)
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => this.selectedReport.set(r));
  }

  // ── Helpers ────────────────────────────────────────────────────
  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  monthLabel(): string {
    const MONTHS = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${MONTHS[this.viewMonth()]} ${this.viewYear()}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
