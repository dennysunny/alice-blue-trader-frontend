import { Component, computed, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import {
  DayReport,
  MonthSummary,
  DayOutcome,
  RuleViolation,
} from '../../../../core/models/reports.model';

@Component({
  selector: 'app-daily-summary',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './daily-summary.html',
  styleUrl: './daily-summary.scss',
})
export class DailySummaryComponent {
  @Input() report?: DayReport;
  @Input() monthSummary?: MonthSummary;

  riskReward = computed(() => this.report?.risk_reward ?? 0);

  expectancy = computed(() => this.report?.expectancy ?? 0);

  readonly DayOutcome = DayOutcome;

  get isDay(): boolean {
    return !!this.report;
  }

  get pnl(): number {
    return this.report?.total_pnl ?? this.monthSummary?.totalPnl ?? 0;
  }

  outcomeLabel(outcome: DayOutcome): string {
    const map: Record<DayOutcome, string> = {
      [DayOutcome.PROFIT]: 'Profit Day ✓',
      [DayOutcome.LOSS]: 'Loss Day ✗',
      [DayOutcome.BREAKEVEN]: 'Breakeven',
      [DayOutcome.NO_TRADE]: 'No Trades',
    };
    return map[outcome] ?? '';
  }

  outcomeClass(outcome: DayOutcome): string {
    const map: Record<DayOutcome, string> = {
      [DayOutcome.PROFIT]: 'outcome--profit',
      [DayOutcome.LOSS]: 'outcome--loss',
      [DayOutcome.BREAKEVEN]: 'outcome--breakeven',
      [DayOutcome.NO_TRADE]: 'outcome--none',
    };
    return map[outcome] ?? '';
  }
}
