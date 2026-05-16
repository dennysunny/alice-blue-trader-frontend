import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { DayReport, CalendarDay, DayOutcome } from '../../../../core/models/reports.model';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'app-reports-calendar',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './reports-calendar.html',
  styleUrl: './reports-calendar.scss',
})
export class ReportsCalendarComponent {
  @Input() set year(v: number) {
    this._year.set(v);
  }
  @Input() set month(v: number) {
    this._month.set(v);
  }
  @Input() set reports(v: DayReport[]) {
    this._reports.set(v);
  }
  @Input() selectedDate = '';
  @Output() dateSelected = new EventEmitter<string>();

  readonly dayLabels = DAY_LABELS;
  readonly DayOutcome = DayOutcome;

  private _year = signal(new Date().getFullYear());
  private _month = signal(new Date().getMonth());
  private _reports = signal<DayReport[]>([]);

  readonly days = computed<CalendarDay[]>(() => {
    const year = this._year();
    const month = this._month();
    const reports = this._reports();
    const today = new Date().toISOString().slice(0, 10);

    const reportMap = new Map(reports.map((r) => [r.date, r]));

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Pad start with prev month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells: CalendarDay[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const date = this.toDateStr(year, month - 1, d);
      const report = reportMap.get(date);
      cells.push({
        date,
        dayOfMonth: d,
        isToday: date === today,
        isCurrentMonth: false,
        report,
        hasViolation: (report?.ruleViolations?.length ?? 0) > 0,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = this.toDateStr(year, month, d);
      const report = reportMap.get(date);
      cells.push({
        date,
        dayOfMonth: d,
        isToday: date === today,
        isCurrentMonth: true,
        report,
        hasViolation: (report?.ruleViolations?.length ?? 0) > 0,
      });
    }

    // Pad end with next month days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const date = this.toDateStr(year, month + 1, d);
      const report = reportMap.get(date);
      cells.push({
        date,
        dayOfMonth: d,
        isToday: date === today,
        isCurrentMonth: false,
        report,
        hasViolation: (report?.ruleViolations?.length ?? 0) > 0,
      });
    }

    return cells;
  });

  private toDateStr(year: number, month: number, day: number): string {
    const d = new Date(year, month, day);
    return d.toISOString().slice(0, 10);
  }

  outcomeClass(day: CalendarDay): string {
    if (!day.isCurrentMonth) return 'day--other-month';
    if (!day.report) return '';
    switch (day.report.outcome) {
      case DayOutcome.PROFIT:
        return 'day--profit';
      case DayOutcome.LOSS:
        return 'day--loss';
      case DayOutcome.BREAKEVEN:
        return 'day--breakeven';
      default:
        return '';
    }
  }

  select(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    this.dateSelected.emit(day.date);
  }
}
