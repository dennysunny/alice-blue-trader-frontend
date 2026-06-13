import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map, of, forkJoin } from 'rxjs';

import { OrderService } from '../../core/services/order.service';
import { StorageService } from '../../core/services/storage.service';
import { StorageKey } from '../../core/enums/app.enums';
import { Trade } from '../../core/models/order.models';
import { ReportsService } from './reports.service';
import { TradeRow } from '../models/reports.model';

export interface SyncResult {
  date: string;
  tradesFound: number;
  tradesSynced: number;
  netPnl: number;
  wins: number;
  losses: number;
}

@Injectable({ providedIn: 'root' })
export class TradeSyncService {
  private readonly orderSvc = inject(OrderService);
  private readonly reportsSvc = inject(ReportsService);
  private readonly storage = inject(StorageService);

  private get userId(): string {
    return this.storage.get<string>(StorageKey.USER_ID) ?? '';
  }

  /**
   * Full sync: fetch today's trade book from AliceBlue,
   * match BUY/SELL pairs per symbol, compute P&L,
   * upsert into Supabase trades + daily_reports.
   */
  syncToday(): Observable<SyncResult> {
    const today = this.localDateStr(new Date());
    return this.syncDate(today);
  }

  syncDate(date: string): Observable<SyncResult> {
    return this.orderSvc.getTradeBook().pipe(
      map((res) => res.result ?? []),
      map((trades) => this.filterByDate(trades, date)),
      switchMap((trades) => {
        if (!trades.length) {
          return of({ date, tradesFound: 0, tradesSynced: 0, netPnl: 0, wins: 0, losses: 0 });
        }
        const rows = this.matchAndBuildRows(trades, date);
        return this.reportsSvc.syncTrades(rows).pipe(
          map(() => ({
            date,
            tradesFound: trades.length,
            tradesSynced: rows.length,
            netPnl: +rows.reduce((s, r) => s + r.pnl, 0).toFixed(2),
            wins: rows.filter((r) => r.pnl > 0).length,
            losses: rows.filter((r) => r.pnl < 0).length,
          })),
        );
      }),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────

  /**
   * Filter trades to a specific date using the fillTimestamp field.
   * AliceBlue returns all trades for the session — we isolate by date.
   */
  private filterByDate(trades: Trade[], date: string): Trade[] {
    return trades.filter((t) => {
      const ts = t.fillTimestamp ?? t.orderTime ?? '';
      // AliceBlue timestamps: "18-05-2026 09:26:00" or ISO
      const d = this.parseAliceBlueDate(ts);
      return d ? this.localDateStr(d) === date : true; // include if unparseable
    });
  }

  /**
   * Group trades by trading symbol, then FIFO-match BUY qty vs SELL qty.
   * Returns one TradeRow per matched position.
   */
  private matchAndBuildRows(executions: Trade[], date: string): TradeRow[] {
    const grouped = new Map<string, Trade[]>();

    /**
     * Group executions by symbol
     */
    executions.forEach((t) => {
      const symbol = t.tradingSymbol ?? t.formattedInstrumentName;

      if (!grouped.has(symbol)) {
        grouped.set(symbol, []);
      }

      grouped.get(symbol)!.push(t);
    });

    const rows: TradeRow[] = [];

    grouped.forEach((symbolTrades, symbol) => {
      /**
       * Sort by execution time
       */
      symbolTrades.sort((a, b) => (a.fillTimestamp ?? '').localeCompare(b.fillTimestamp ?? ''));

      /**
       * FIFO open position queue
       */
      const openBuys: {
        qty: number;
        price: number;
        execution: Trade;
      }[] = [];

      symbolTrades.forEach((execution) => {
        const qty = execution.filledQuantity;
        const price = execution.tradedPrice;

        /**
         * BUY → open position
         */
        if (execution.transactionType === 'BUY') {
          openBuys.push({
            qty,
            price,
            execution,
          });

          return;
        }

        /**
         * SELL → close FIFO buys
         */
        let remainingSellQty = qty;

        while (remainingSellQty > 0 && openBuys.length > 0) {
          const buy = openBuys[0];

          const matchedQty = Math.min(buy.qty, remainingSellQty);

          const grossPnl = (price - buy.price) * matchedQty;

          rows.push({
            user_id: this.userId,

            date,

            instrument_id: execution.instrumentId,

            trading_symbol: symbol,

            exchange: execution.exchange as string,

            transaction_type: 'BUY',

            product: execution.product as string,

            quantity: matchedQty,

            buy_price: +buy.price.toFixed(2),

            sell_price: +price.toFixed(2),

            pnl: +grossPnl.toFixed(2),

            gross_pnl: +grossPnl.toFixed(2),

            net_pnl: +grossPnl.toFixed(2),

            brokerage: 0,

            brokerage_charges: 0,

            transaction_charges: 0,

            gst: 0,

            stt: 0,

            sebi_charges: 0,

            stamp_duty: 0,

            order_id: `${buy.execution.brokerOrderId}_${execution.brokerOrderId}`,

            entry_time: buy.execution.fillTimestamp,

            exit_time: execution.fillTimestamp,

            created_at: execution.fillTimestamp,

            strategy: null,

            setup_type: null,

            emotions: null,

            mistakes: null,

            lessons: null,

            tags: [],

            status: 'closed',

            trade_side: 'LONG',
          });

          /**
           * Reduce open qty
           */
          buy.qty -= matchedQty;

          remainingSellQty -= matchedQty;

          /**
           * Fully closed
           */
          if (buy.qty <= 0) {
            openBuys.shift();
          }
        }
      });
    });

    return rows;
  }

  private parseAliceBlueDate(ts: string): Date | null {
    if (!ts) return null;
    // "18-05-2026 09:26:00" or "18-05-2026, 09:26:00 am"
    const m1 = ts.match(/(\d{2})-(\d{2})-(\d{4})[, ]+(\d{2}):(\d{2}):(\d{2})/);
    if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1], +m1[4], +m1[5], +m1[6]);
    // ISO
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  private localDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
