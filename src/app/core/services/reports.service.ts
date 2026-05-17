import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, map, switchMap, of, forkJoin } from 'rxjs';

import { StorageService } from './storage.service';
import {
  DailyReportRow,
  TradeRow,
  TradingRulesRow,
  DayReport,
  MonthSummary,
  YearSummary,
  DayOutcome,
  RuleType,
  RuleViolation,
} from '../models/reports.model';
import { SUPABASE_CONFIG } from '../configs/supabase.config';
import { StorageKey } from '../enums/app.enums';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly storage = inject(StorageService);
  private readonly db: SupabaseClient;

  constructor() {
    this.db = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }

  private get userId(): string {
    return this.storage.get<string>(StorageKey.USER_ID) ?? 'anonymous';
  }

  // ── Sync trades from AliceBlue ───────────────────────────────────

  /**
   * Call this after fetching trade book from AliceBlue.
   * Upserts all trades for a given date into Supabase,
   * then recomputes and saves the daily report.
   */
  syncTrades(trades: TradeRow[]): Observable<void> {
    if (!trades.length) return of(void 0);

    return from(
      this.db.from('trades').upsert(
        trades.map((t) => ({ ...t, user_id: this.userId })),
        { onConflict: 'user_id,order_id' },
      ),
    ).pipe(switchMap(() => this.recomputeDailyReport(trades[0].date)));
  }

  // ── Daily Reports ────────────────────────────────────────────────

  getDailyReport(date: string): Observable<DayReport | null> {
    return from(
      this.db
        .from('daily_reports')
        .select('*')
        .eq('user_id', this.userId)
        .eq('date', date)
        .maybeSingle(),
    ).pipe(
      switchMap(({ data }) =>
        data ? this.getRules().pipe(map((rules) => this.enrichReport(data, rules))) : of(null),
      ),
    );
  }

  getReportsForMonth(year: number, month: number): Observable<DayReport[]> {
    const from_date = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const to_date = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    return from(
      this.db
        .from('daily_reports')
        .select('*')
        .eq('user_id', this.userId)
        .gte('date', from_date)
        .lte('date', to_date)
        .order('date', { ascending: true }),
    ).pipe(
      switchMap(({ data }) =>
        this.getRules().pipe(
          map((rules) => (data ?? []).map((r: DailyReportRow) => this.enrichReport(r, rules))),
        ),
      ),
    );
  }

  getReportsForYear(year: number): Observable<YearSummary> {
    const from_date = `${year}-01-01`;
    const to_date = `${year}-12-31`;

    return from(
      this.db
        .from('daily_reports')
        .select('*')
        .eq('user_id', this.userId)
        .gte('date', from_date)
        .lte('date', to_date)
        .order('date', { ascending: true }),
    ).pipe(
      switchMap(({ data }) =>
        this.getRules().pipe(
          map((rules) => {
            const reports = (data ?? []).map((r: DailyReportRow) => this.enrichReport(r, rules));
            return this.buildYearSummary(year, reports);
          }),
        ),
      ),
    );
  }

  getAllReports(): Observable<DayReport[]> {
    return from(
      this.db
        .from('daily_reports')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false }),
    ).pipe(
      switchMap(({ data }) =>
        this.getRules().pipe(
          map((rules) => (data ?? []).map((r: DailyReportRow) => this.enrichReport(r, rules))),
        ),
      ),
    );
  }

  // ── Ledger (trade list) ──────────────────────────────────────────

  getTradesForDate(date: string): Observable<TradeRow[]> {
    return from(
      this.db
        .from('trades')
        .select('*')
        .eq('user_id', this.userId)
        .eq('date', date)
        .order('created_at', { ascending: true }),
    ).pipe(map(({ data }) => data ?? []));
  }

  getTradesForMonth(year: number, month: number): Observable<TradeRow[]> {
    const from_date = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const to_date = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    return from(
      this.db
        .from('trades')
        .select('*')
        .eq('user_id', this.userId)
        .gte('date', from_date)
        .lte('date', to_date)
        .order('date', { ascending: true }),
    ).pipe(map(({ data }) => data ?? []));
  }

  // ── Rules ────────────────────────────────────────────────────────

  getRules(): Observable<TradingRulesRow> {
    return from(
      this.db.from('trading_rules').select('*').eq('user_id', this.userId).maybeSingle(),
    ).pipe(map(({ data }) => data ?? this.defaultRules()));
  }

  saveRules(rules: Partial<TradingRulesRow>): Observable<TradingRulesRow> {
    const row = { ...rules, user_id: this.userId, updated_at: new Date().toISOString() };
    return from(
      this.db.from('trading_rules').upsert(row, { onConflict: 'user_id' }).select().single(),
    ).pipe(map(({ data }) => data as TradingRulesRow));
  }

  // ── Notes ────────────────────────────────────────────────────────

  saveNotes(date: string, notes: string): Observable<void> {
    return from(
      this.db
        .from('daily_reports')
        .upsert(
          { user_id: this.userId, date, notes, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' },
        ),
    ).pipe(map(() => void 0));
  }

  // ── Internal helpers ─────────────────────────────────────────────

  private recomputeDailyReport(date: string): Observable<void> {
    return this.getTradesForDate(date).pipe(
      switchMap((trades) => {
        const row = this.computeDailyRow(date, trades);
        return from(this.db.from('daily_reports').upsert(row, { onConflict: 'user_id,date' })).pipe(
          map(() => void 0),
        );
      }),
    );
  }

  private computeDailyRow(date: string, trades: TradeRow[]): DailyReportRow {
    const profits = trades.filter((t) => (t.net_pnl ?? t.pnl) > 0);
    const losses = trades.filter((t) => (t.net_pnl ?? t.pnl) < 0);
    const breakeven = trades.filter((t) => (t.net_pnl ?? t.pnl) === 0);

    const grossProfit = profits.reduce((s, t) => s + (t.net_pnl ?? t.pnl), 0);
    const grossLoss = losses.reduce((s, t) => s + Math.abs(t.net_pnl ?? t.pnl), 0);
    const totalPnl = trades.reduce((s, t) => s + (t.net_pnl ?? t.pnl), 0);
    const totalBrokerage = trades.reduce(
      (s, t) =>
        s +
        (t.brokerage_charges ?? 0) +
        (t.transaction_charges ?? 0) +
        (t.gst ?? 0) +
        (t.stt ?? 0) +
        (t.sebi_charges ?? 0) +
        (t.stamp_duty ?? 0),
      0,
    );

    const avgWin = profits.length > 0 ? grossProfit / profits.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const winRate = trades.length > 0 ? (profits.length / trades.length) * 100 : 0;
    const expectancy = trades.length > 0 ? totalPnl / trades.length : 0;
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
    const biggestWin = profits.length > 0 ? Math.max(...profits.map((t) => t.net_pnl ?? t.pnl)) : 0;
    const biggestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.net_pnl ?? t.pnl)) : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // running drawdown
    let peak = 0;
    let runningPnl = 0;
    let maxDrawdown = 0;

    trades.forEach((t) => {
      runningPnl += t.net_pnl ?? t.pnl;

      if (runningPnl > peak) {
        peak = runningPnl;
      }

      const dd = peak - runningPnl;

      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
    });

    return {
      user_id: this.userId,
      date,

      total_trades: trades.length,
      winning_trades: profits.length,
      losing_trades: losses.length,
      breakeven_trades: breakeven.length,

      total_pnl: +totalPnl.toFixed(2),
      net_pnl: +totalPnl.toFixed(2),
      gross_profit: +grossProfit.toFixed(2),
      gross_loss: +grossLoss.toFixed(2),
      total_brokerage: +totalBrokerage.toFixed(2),
      total_quantity: trades.reduce((s, t) => s + t.quantity, 0),
      max_drawdown: +maxDrawdown.toFixed(2),

      avg_win: +avgWin.toFixed(2),
      avg_loss: +avgLoss.toFixed(2),
      win_rate: +winRate.toFixed(2),
      expectancy: +expectancy.toFixed(2),
      risk_reward: +riskReward.toFixed(2),
      biggest_win: +biggestWin.toFixed(2),
      biggest_loss: +biggestLoss.toFixed(2),
      profit_factor: +profitFactor.toFixed(2),

      trading_time_minutes: 0,
      psychology_score: null,
      market_condition: null,
      notes: null,
    };
  }

  private enrichReport(row: DailyReportRow, rules: TradingRulesRow): DayReport {
    const winRate = row.total_trades > 0 ? (row.winning_trades / row.total_trades) * 100 : 0;

    const profitFactor =
      row.gross_loss !== 0
        ? Math.abs(row.gross_profit / row.gross_loss)
        : row.gross_profit > 0
          ? Infinity
          : 0;

    const avgWin = row.winning_trades > 0 ? row.gross_profit / row.winning_trades : 0;
    const avgLoss = row.losing_trades > 0 ? Math.abs(row.gross_loss / row.losing_trades) : 0;

    const violations: RuleViolation[] = [];

    if (row.total_trades > rules.max_trades_per_day) {
      violations.push({
        rule: RuleType.MAX_TRADES,
        limit: rules.max_trades_per_day,
        actual: row.total_trades,
        label: `Trades: ${row.total_trades} (max ${rules.max_trades_per_day})`,
      });
    }
    if (row.total_pnl < -Math.abs(rules.max_loss_per_day)) {
      violations.push({
        rule: RuleType.MAX_LOSS,
        limit: rules.max_loss_per_day,
        actual: row.total_pnl,
        label: `Loss: ₹${Math.abs(row.total_pnl).toFixed(0)} (max ₹${rules.max_loss_per_day})`,
      });
    }

    let outcome: DayOutcome;
    if (row.total_trades === 0) outcome = DayOutcome.NO_TRADE;
    else if (row.total_pnl > 0) outcome = DayOutcome.PROFIT;
    else if (row.total_pnl < 0) outcome = DayOutcome.LOSS;
    else outcome = DayOutcome.BREAKEVEN;

    return { ...row, winRate, profitFactor, avgWin, avgLoss, ruleViolations: violations, outcome };
  }

  private buildYearSummary(year: number, reports: DayReport[]): YearSummary {
    const MONTH_NAMES = [
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

    const months: MonthSummary[] = Array.from({ length: 12 }, (_, m) => {
      const monthReports = reports.filter((r) => new Date(r.date).getMonth() === m);
      const profitDays = monthReports.filter((r) => r.outcome === DayOutcome.PROFIT).length;
      const lossDays = monthReports.filter((r) => r.outcome === DayOutcome.LOSS).length;
      const totalPnl = monthReports.reduce((s, r) => s + r.total_pnl, 0);
      const totalTrades = monthReports.reduce((s, r) => s + r.total_trades, 0);
      const totalWins = monthReports.reduce((s, r) => s + r.winning_trades, 0);
      const totalQty = monthReports.reduce((s, r) => s + r.total_quantity, 0);

      const sorted = [...monthReports].sort((a, b) => b.total_pnl - a.total_pnl);

      return {
        year,
        month: m,
        monthLabel: MONTH_NAMES[m],
        tradingDays: monthReports.length,
        profitDays,
        lossDays,
        totalPnl: +totalPnl.toFixed(2),
        totalTrades,
        totalQuantity: totalQty,
        winRate: totalTrades > 0 ? +((totalWins / totalTrades) * 100).toFixed(1) : 0,
        bestDay: sorted[0] ?? null,
        worstDay: sorted[sorted.length - 1] ?? null,
        days: monthReports,
      };
    });

    const totalPnl = reports.reduce((s, r) => s + r.total_pnl, 0);
    const totalTrades = reports.reduce((s, r) => s + r.total_trades, 0);
    const totalWins = reports.reduce((s, r) => s + r.winning_trades, 0);

    return {
      year,
      totalPnl: +totalPnl.toFixed(2),
      totalTrades,
      winRate: totalTrades > 0 ? +((totalWins / totalTrades) * 100).toFixed(1) : 0,
      months,
    };
  }

  private defaultRules(): TradingRulesRow {
    return {
      user_id: this.userId,
      max_trades_per_day: 5,
      max_loss_per_day: 2000,
      max_loss_per_trade: 500,
      max_quantity_per_trade: 50,
    };
  }
}
