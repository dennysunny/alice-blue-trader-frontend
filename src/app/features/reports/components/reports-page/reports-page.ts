import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import {
  DayOutcome,
  DayReport,
  MonthSummary,
  ReportTab,
  YearSummary,
} from '../../../../core/models/reports.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReportsService } from '../../../../core/services/reports.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ExcelImportService } from '../../services/excel-import';
import { DailySummaryComponent } from '../daily-summary/daily-summary';
import { ReportsCalendarComponent } from '../reports-calendar/reports-calendar';
import { ReportsChartsComponent } from '../reports-chart/reports-chart';
import { ReportsLedgerComponent } from '../reports-ledger/reports-ledger';
import { TradingRulesComponent } from '../trading-rules/trading-rules';

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
  private readonly excelImport = inject(ExcelImportService);
  private readonly notify = inject(NotificationService);

  readonly ReportTab = ReportTab;
  readonly DayOutcome = DayOutcome;

  readonly yearTotalBrokerage = computed(() => {
    const y = this.yearSummary();
    if (!y) return 0;

    return y.months.reduce(
      (monthAcc, month) =>
        monthAcc + month.days.reduce((dayAcc, day) => dayAcc + day.total_brokerage, 0),
      0,
    );
  });

  readonly yearProfitFactor = computed(() => {
    const y = this.yearSummary();
    if (!y) return 0;

    const grossProfit = y.months.reduce(
      (monthAcc, month) =>
        monthAcc + month.days.reduce((dayAcc, day) => dayAcc + day.gross_profit, 0),
      0,
    );

    const grossLoss = y.months.reduce(
      (monthAcc, month) =>
        monthAcc + month.days.reduce((dayAcc, day) => dayAcc + day.gross_loss, 0),
      0,
    );

    return grossLoss > 0 ? grossProfit / grossLoss : 0;
  });

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
  selectedFileName = signal<string | null>(null);

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

  onFileSelected(event: Event) {
    const file = (<HTMLInputElement>event.target).files?.[0];

    if (!file) {
      return;
    }

    this.selectedFileName.set(file.name);

    this.excelImport.importExcel(file).subscribe({
      next: () => {
        this.notify.success('Trades Imported');
      },

      error: console.error,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
