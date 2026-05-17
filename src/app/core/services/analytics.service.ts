import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { StorageKey } from '../../core/enums/app.enums';
import { HistoryResponse } from '../../core/models/instrument.models';
import { StorageService } from '../../core/services/storage.service';
import { TradeRow } from '../models/reports.model';
import {
  AnalyticsInstrument,
  CandleResolution,
  DailyOverview,
  IntradayAnalysis,
  OpeningRange,
  OverlaidTrade,
  PivotLevels,
  SessionPhase,
  SessionStats,
  SignalType,
  SupportResistance,
  TradeSignal,
  TrendDirection,
} from '../models/analytics.model';
import { Candle } from '../models/chart.model';
import { ReportsService } from './reports.service';
import { ApiService } from './api.service';
import { API_CONFIG, API_ENDPOINTS, API_METHODS } from '../configs/api.config';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models/api-response.models';

const CHART_BASE = 'https://ant.aliceblueonline.com/open-api/od/v1/charts';
const MARKET_OPEN_H = 9;
const MARKET_OPEN_M = 15;
const MARKET_CLOSE_H = 15;
const MARKET_CLOSE_M = 30;
const OR_MINUTES = 30; // Opening range = first 30 min

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly reports = inject(ReportsService);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  private headers(): HttpHeaders {
    const session = this.storage.get<string>(StorageKey.AUTH_TOKEN);
    const userId = this.storage.get<string>(StorageKey.USER_ID);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(session && userId ? { Authorization: `Bearer ${userId} ${session}` } : {}),
    });
  }

  // ── Fetch candles ─────────────────────────────────────────────

  fetchCandles(
    instrument: AnalyticsInstrument,
    date: string, // YYYY-MM-DD
    resolution: CandleResolution,
  ): Observable<any> {
    const from = this.dayStartMs(date);
    const to = this.dayEndMs(date);

    return this.apiService
      .post<HistoryResponse>(API_CONFIG.PROXY_URL, {
        method: API_METHODS.POST,
        endpoint: API_ENDPOINTS.HISTORY.CHART_HISTORY,
        session: this.authService.sessionId,
        isChart: true,
        data: {
          token: instrument.token,
          resolution,
          from: String(from),
          to: String(to),
          exchange: instrument.exchange,
        },
      })
      .pipe(
        map((r) => {
          if (r.s !== 'ok' || !r.t) return [];
          return r.t.map((t, i) => ({
            time: t,
            open: r.o![i],
            high: r.h![i],
            low: r.l![i],
            close: r.c![i],
            volume: r.v?.[i] ?? 0,
          }));
        }),
      );
  }

  fetchDailyCandles(instrument: AnalyticsInstrument, days: number = 30): Observable<any> {
    const to = Date.now();
    const from = to - days * 24 * 60 * 60 * 1000;
    return this.apiService
      .post<HistoryResponse>(API_CONFIG.PROXY_URL, {
        method: API_METHODS.POST,
        endpoint: API_ENDPOINTS.HISTORY.CHART_HISTORY,
        session: this.authService.sessionId,
        isChart: true,
        data: {
          token: instrument.token,
          resolution: CandleResolution.ONE_DAY,
          from: String(from),
          to: String(to),
          exchange: instrument.exchange,
        },
      })
      .pipe(
        map((r) => {
          if (r.s !== 'ok' || !r.t) return [];
          return r.t.map((t, i) => ({
            time: t,
            open: r.o![i],
            high: r.h![i],
            low: r.l![i],
            close: r.c![i],
            volume: r.v?.[i] ?? 0,
          }));
        }),
      );
  }

  // ── Full intraday analysis ────────────────────────────────────

  analyzeDay(
    instrument: AnalyticsInstrument,
    date: string,
    resolution: CandleResolution,
    prevClose: number,
  ): Observable<IntradayAnalysis> {
    return forkJoin({
      candles: this.fetchCandles(instrument, date, resolution),
      trades: this.reports.getTradesForDate(date),
    }).pipe(
      map(({ candles, trades }) => {
        if (!candles.length) return this.emptyAnalysis(instrument, date, resolution);

        const dayOpen = candles[0].open;
        const dayHigh = Math.max(...candles.map((c: any) => c.high));
        const dayLow = Math.min(...candles.map((c: any) => c.low));
        const dayClose = candles[candles.length - 1].close;
        const priceRange = dayHigh - dayLow;
        const rangePercent = dayOpen > 0 ? (priceRange / dayOpen) * 100 : 0;
        const gapPercent = prevClose > 0 ? ((dayOpen - prevClose) / prevClose) * 100 : 0;

        const openingRange = this.calcOpeningRange(candles, resolution);
        const pivots =
          prevClose > 0 ? this.calcPivots(prevClose, dayHigh, dayLow) : this.emptyPivots(dayOpen);
        const { supports, resistances } = this.findSRLevels(candles);
        const sessionStats = this.calcSessionStats(candles, resolution);
        const overallTrend = this.detectTrend(candles);
        const trendStrength = this.calcTrendStrength(candles);
        const signals = this.generateSignals(
          candles,
          openingRange,
          pivots,
          supports,
          resistances,
          resolution,
        );
        const myTrades = this.mapTradesToCandles(trades, candles);
        const myDayPnl = trades.reduce((s, t) => s + t.pnl, 0);

        const buys = signals.filter((s) => s.type === SignalType.BUY);
        const sells = signals.filter((s) => s.type === SignalType.SELL);

        return {
          date,
          instrument,
          resolution,
          candles,
          dayOpen,
          dayHigh,
          dayLow,
          dayClose,
          priceRange,
          rangePercent,
          openingRange,
          pivots,
          supports,
          resistances,
          signals,
          bestBuySignal: buys.sort((a, b) => b.riskReward - a.riskReward)[0],
          bestSellSignal: sells.sort((a, b) => b.riskReward - a.riskReward)[0],
          overallTrend,
          trendStrength,
          sessionStats,
          gapType: gapPercent > 0.15 ? 'gap_up' : gapPercent < -0.15 ? 'gap_down' : 'flat',
          gapPercent: +gapPercent.toFixed(2),
          myTrades,
          myDayPnl,
        } satisfies IntradayAnalysis;
      }),
    );
  }

  // ── Daily overview (multiple days) ───────────────────────────

  buildDailyOverview(
    instrument: AnalyticsInstrument,
    days: number = 20,
  ): Observable<DailyOverview[]> {
    return forkJoin({
      candles: this.fetchDailyCandles(instrument, days),
      allReports: this.reports.getAllReports(),
    }).pipe(
      map(({ candles, allReports }) => {
        const reportMap = new Map(allReports.map((r) => [r.date, r]));

        return candles.map((c: Candle, i: number) => {
          const date = this.epochToDateStr(c.time);
          const prevClose = i > 0 ? candles[i - 1].close : c.open;
          const change = c.close - prevClose;
          const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
          const report = reportMap.get(date);

          return {
            date,
            instrument,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            change: +change.toFixed(2),
            changePct: +changePct.toFixed(2),
            volume: c.volume,
            trend:
              change > 0
                ? TrendDirection.BULLISH
                : change < 0
                  ? TrendDirection.BEARISH
                  : TrendDirection.SIDEWAYS,
            myTrades: report?.total_trades,
            myPnl: report?.total_pnl,
          } satisfies DailyOverview;
        });
      }),
    );
  }

  // ── Analysis algorithms ───────────────────────────────────────

  private calcOpeningRange(candles: Candle[], res: CandleResolution): OpeningRange {
    const resMin = this.resolutionMinutes(res);
    const orCount = Math.ceil(OR_MINUTES / resMin);
    const orCandles = candles.slice(0, orCount);

    if (!orCandles.length)
      return { high: 0, low: 0, midpoint: 0, rangeSize: 0, breakoutUp: 0, breakoutDown: 0 };

    const high = Math.max(...orCandles.map((c) => c.high));
    const low = Math.min(...orCandles.map((c) => c.low));
    const range = high - low;

    return {
      high,
      low,
      midpoint: (high + low) / 2,
      rangeSize: range,
      breakoutUp: high + range * 0.5,
      breakoutDown: low - range * 0.5,
    };
  }

  private calcPivots(prevClose: number, prevHigh: number, prevLow: number): PivotLevels {
    const pp = (prevHigh + prevLow + prevClose) / 3;
    return {
      pp,
      r1: 2 * pp - prevLow,
      r2: pp + (prevHigh - prevLow),
      r3: prevHigh + 2 * (pp - prevLow),
      s1: 2 * pp - prevHigh,
      s2: pp - (prevHigh - prevLow),
      s3: prevLow - 2 * (prevHigh - pp),
      bc: pp - (prevHigh - prevLow) * 0.382,
      tc: pp + (prevHigh - prevLow) * 0.382,
    };
  }

  private emptyPivots(ref: number): PivotLevels {
    return { pp: ref, r1: ref, r2: ref, r3: ref, s1: ref, s2: ref, s3: ref, bc: ref, tc: ref };
  }

  private findSRLevels(candles: Candle[]): {
    supports: SupportResistance[];
    resistances: SupportResistance[];
  } {
    if (candles.length < 3) return { supports: [], resistances: [] };

    const supports: SupportResistance[] = [];
    const resistances: SupportResistance[] = [];
    const tolerance =
      (Math.max(...candles.map((c) => c.high)) - Math.min(...candles.map((c) => c.low))) * 0.005;

    for (let i = 1; i < candles.length - 1; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      const next = candles[i + 1];

      // Local low = support
      if (curr.low < prev.low && curr.low < next.low) {
        const existing = supports.find((s) => Math.abs(s.level - curr.low) < tolerance);
        if (existing) existing.touchCount++;
        else
          supports.push({ level: curr.low, type: 'support', strength: 'moderate', touchCount: 1 });
      }

      // Local high = resistance
      if (curr.high > prev.high && curr.high > next.high) {
        const existing = resistances.find((r) => Math.abs(r.level - curr.high) < tolerance);
        if (existing) existing.touchCount++;
        else
          resistances.push({
            level: curr.high,
            type: 'resistance',
            strength: 'moderate',
            touchCount: 1,
          });
      }
    }

    // Classify strength by touch count
    const classify = (sr: SupportResistance): SupportResistance => ({
      ...sr,
      strength: sr.touchCount >= 3 ? 'strong' : sr.touchCount >= 2 ? 'moderate' : 'weak',
    });

    return {
      supports: supports
        .map(classify)
        .sort((a, b) => b.touchCount - a.touchCount)
        .slice(0, 5),
      resistances: resistances
        .map(classify)
        .sort((a, b) => b.touchCount - a.touchCount)
        .slice(0, 5),
    };
  }

  private calcSessionStats(candles: Candle[], res: CandleResolution): SessionStats[] {
    const resMin = this.resolutionMinutes(res);
    const sessions: Array<{ phase: SessionPhase; startMin: number; endMin: number }> = [
      { phase: SessionPhase.OPENING_RANGE, startMin: 0, endMin: 30 },
      { phase: SessionPhase.MORNING, startMin: 30, endMin: 135 },
      { phase: SessionPhase.MIDDAY, startMin: 135, endMin: 255 },
      { phase: SessionPhase.AFTERNOON, startMin: 255, endMin: 345 },
      { phase: SessionPhase.CLOSING, startMin: 345, endMin: 375 },
    ];

    return sessions
      .map(({ phase, startMin, endMin }) => {
        const startIdx = Math.floor(startMin / resMin);
        const endIdx = Math.floor(endMin / resMin);
        const slice = candles.slice(startIdx, endIdx);

        if (!slice.length)
          return {
            phase,
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            volume: 0,
            trend: TrendDirection.SIDEWAYS,
            volatility: 0,
            candles: [],
          };

        const open = slice[0].open;
        const close = slice[slice.length - 1].close;
        const high = Math.max(...slice.map((c) => c.high));
        const low = Math.min(...slice.map((c) => c.low));
        const volume = slice.reduce((s, c) => s + c.volume, 0);
        const trend =
          close > open
            ? TrendDirection.BULLISH
            : close < open
              ? TrendDirection.BEARISH
              : TrendDirection.SIDEWAYS;
        const volatility = open > 0 ? +(((high - low) / open) * 100).toFixed(2) : 0;

        return { phase, open, high, low, close, volume, trend, volatility, candles: slice };
      })
      .filter((s) => s.open > 0);
  }

  private detectTrend(candles: Candle[]): TrendDirection {
    if (candles.length < 5) return TrendDirection.SIDEWAYS;
    const first5avg = candles.slice(0, 5).reduce((s, c) => s + c.close, 0) / 5;
    const last5avg = candles.slice(-5).reduce((s, c) => s + c.close, 0) / 5;
    const change = ((last5avg - first5avg) / first5avg) * 100;
    return change > 0.3
      ? TrendDirection.BULLISH
      : change < -0.3
        ? TrendDirection.BEARISH
        : TrendDirection.SIDEWAYS;
  }

  private calcTrendStrength(candles: Candle[]): number {
    if (candles.length < 3) return 0;
    let advances = 0,
      declines = 0;
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].close > candles[i - 1].close) advances++;
      else if (candles[i].close < candles[i - 1].close) declines++;
    }
    const total = candles.length - 1;
    return total > 0 ? Math.round((Math.max(advances, declines) / total) * 100) : 0;
  }

  private generateSignals(
    candles: Candle[],
    or: OpeningRange,
    pivots: PivotLevels,
    supports: SupportResistance[],
    resistances: SupportResistance[],
    res: CandleResolution,
  ): TradeSignal[] {
    const signals: TradeSignal[] = [];
    const resMin = this.resolutionMinutes(res);

    for (let i = 2; i < candles.length; i++) {
      const c = candles[i];
      const prev = candles[i - 1];
      const time = this.epochToTimeStr(c.time);
      const minuteOfDay = i * resMin;
      const session = this.sessionForMinute(minuteOfDay);

      // ── Signal 1: Opening Range Breakout (ORB) ──────────────────
      if (i === Math.ceil(OR_MINUTES / resMin)) {
        if (c.close > or.high && c.close > prev.high) {
          signals.push({
            time,
            session,
            type: SignalType.BUY,
            reason: `ORB Breakout — closed above opening range high (${or.high.toFixed(0)})`,
            entry: or.high,
            target: or.high + or.rangeSize * 1.5,
            stopLoss: or.low,
            riskReward: this.rr(or.high, or.high + or.rangeSize * 1.5, or.low),
          });
        } else if (c.close < or.low && c.close < prev.low) {
          signals.push({
            time,
            session,
            type: SignalType.SELL,
            reason: `ORB Breakdown — closed below opening range low (${or.low.toFixed(0)})`,
            entry: or.low,
            target: or.low - or.rangeSize * 1.5,
            stopLoss: or.high,
            riskReward: this.rr(or.low, or.low - or.rangeSize * 1.5, or.high),
          });
        }
      }

      // ── Signal 2: Pivot Point Bounce ────────────────────────────
      const nearPP = Math.abs(c.low - pivots.pp) / pivots.pp < 0.003;
      if (nearPP && c.close > c.open && c.close > prev.close) {
        signals.push({
          time,
          session,
          type: SignalType.BUY,
          reason: `Pivot Point bounce at PP (${pivots.pp.toFixed(0)})`,
          entry: pivots.pp,
          target: pivots.r1,
          stopLoss: pivots.s1,
          riskReward: this.rr(pivots.pp, pivots.r1, pivots.s1),
        });
      }

      // ── Signal 3: S/R Level Bounce ──────────────────────────────
      for (const sup of supports) {
        if (Math.abs(c.low - sup.level) / sup.level < 0.004 && c.close > c.open) {
          const resistance = resistances[0]?.level ?? c.close * 1.005;
          signals.push({
            time,
            session,
            type: SignalType.BUY,
            reason: `Support bounce at ${sup.level.toFixed(0)} (${sup.strength}, ${sup.touchCount} touches)`,
            entry: sup.level,
            target: resistance,
            stopLoss: sup.level * 0.997,
            riskReward: this.rr(sup.level, resistance, sup.level * 0.997),
          });
          break;
        }
      }

      for (const res2 of resistances) {
        if (Math.abs(c.high - res2.level) / res2.level < 0.004 && c.close < c.open) {
          const support = supports[0]?.level ?? c.close * 0.995;
          signals.push({
            time,
            session,
            type: SignalType.SELL,
            reason: `Resistance rejection at ${res2.level.toFixed(0)} (${res2.strength}, ${res2.touchCount} touches)`,
            entry: res2.level,
            target: support,
            stopLoss: res2.level * 1.003,
            riskReward: this.rr(res2.level, support, res2.level * 1.003),
          });
          break;
        }
      }

      // ── Signal 4: R1/S1 breakout/breakdown ──────────────────────
      if (prev.high < pivots.r1 && c.close > pivots.r1) {
        signals.push({
          time,
          session,
          type: SignalType.BUY,
          reason: `R1 Breakout at ${pivots.r1.toFixed(0)} — momentum signal`,
          entry: pivots.r1,
          target: pivots.r2,
          stopLoss: pivots.pp,
          riskReward: this.rr(pivots.r1, pivots.r2, pivots.pp),
        });
      }
      if (prev.low > pivots.s1 && c.close < pivots.s1) {
        signals.push({
          time,
          session,
          type: SignalType.SELL,
          reason: `S1 Breakdown at ${pivots.s1.toFixed(0)} — momentum signal`,
          entry: pivots.s1,
          target: pivots.s2,
          stopLoss: pivots.pp,
          riskReward: this.rr(pivots.s1, pivots.s2, pivots.pp),
        });
      }
    }

    return signals.slice(0, 12); // cap at 12 signals
  }

  private mapTradesToCandles(trades: TradeRow[], candles: Candle[]): OverlaidTrade[] {
    return trades.map((t) => ({
      time: t.created_at?.slice(11, 16) ?? '09:15',
      type: t.transaction_type.toLowerCase() as 'buy' | 'sell',
      price: t.transaction_type === 'BUY' ? t.buy_price : t.sell_price,
      quantity: t.quantity,
      pnl: t.pnl,
      tradingSymbol: t.trading_symbol,
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────

  private rr(entry: number, target: number, stop: number): number {
    const reward = Math.abs(target - entry);
    const risk = Math.abs(stop - entry);
    return risk > 0 ? +(reward / risk).toFixed(2) : 0;
  }

  private sessionForMinute(min: number): SessionPhase {
    if (min < 30) return SessionPhase.OPENING_RANGE;
    if (min < 135) return SessionPhase.MORNING;
    if (min < 255) return SessionPhase.MIDDAY;
    if (min < 345) return SessionPhase.AFTERNOON;
    return SessionPhase.CLOSING;
  }

  private resolutionMinutes(res: CandleResolution): number {
    const map: Record<string, number> = {
      '1': 1,
      '3': 3,
      '5': 5,
      '15': 15,
      '30': 30,
      '60': 60,
      D: 1440,
    };
    return map[res] ?? 5;
  }

  private dayStartMs(date: string): number {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, MARKET_OPEN_H, MARKET_OPEN_M, 0).getTime();
  }

  private dayEndMs(date: string): number {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d, MARKET_CLOSE_H, MARKET_CLOSE_M, 0).getTime();
  }

  private epochToDateStr(epoch: any): string {
    const ts = Number(epoch);
    const d = new Date(ts * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private epochToTimeStr(epoch: any): string {
    const ts = Number(epoch);
    const d = new Date(ts * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private emptyAnalysis(
    instrument: AnalyticsInstrument,
    date: string,
    resolution: CandleResolution,
  ): IntradayAnalysis {
    const z = 0;
    return {
      date,
      instrument,
      resolution,
      candles: [],
      dayOpen: z,
      dayHigh: z,
      dayLow: z,
      dayClose: z,
      priceRange: z,
      rangePercent: z,
      openingRange: { high: z, low: z, midpoint: z, rangeSize: z, breakoutUp: z, breakoutDown: z },
      pivots: this.emptyPivots(z),
      supports: [],
      resistances: [],
      signals: [],
      overallTrend: TrendDirection.SIDEWAYS,
      trendStrength: z,
      sessionStats: [],
      gapType: 'flat',
      gapPercent: z,
    };
  }
}
