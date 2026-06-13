import { inject, Injectable } from '@angular/core';
import { from, map, Observable, switchMap, tap } from 'rxjs';

import * as XLSX from 'xlsx';

import { StorageKey } from '../../../core/enums/app.enums';
import { AliceBlueExecution, MatchedTrade, TradeRow } from '../../../core/models/reports.model';
import { ReportsService } from '../../../core/services/reports.service';
import { StorageService } from '../../../core/services/storage.service';
import { BrokerageCalculator } from '../../../core/services/brokerage-calculator';

@Injectable({
  providedIn: 'root',
})
export class ExcelImportService {
  private readonly reportsService = inject(ReportsService);
  private readonly storage = inject(StorageService);
  private readonly brokerageCalculator = inject(BrokerageCalculator);

  private get userId(): string {
    return this.storage.get(StorageKey.USER_ID)!;
  }

  readExcel(file: File): Promise<AliceBlueExecution[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;

          const workbook = XLSX.read(data, {
            type: 'array',
          });

          const sheet = workbook.Sheets[workbook.SheetNames[0]];

          const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
            header: 1,
            defval: null,
          });

          const headerIndex = rows.findIndex((r) => r?.[0] === 'Symbol');

          const executions: AliceBlueExecution[] = rows
            .slice(headerIndex + 1)
            .filter((r) => r[0])
            .map((r) => ({
              symbol: r[0],
              tradeTime: r[1],
              orderId: String(r[2]),
              tradeId: String(r[3]),
              type: r[4] === 'SALE' ? 'SELL' : 'BUY',
              qty: Number(r[5]),
              price: Number(r[6]),
            }));

          resolve(executions);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;

      reader.readAsArrayBuffer(file);
    });
  }

  matchTrades(executions: AliceBlueExecution[]): MatchedTrade[] {
    const groups = new Map<string, AliceBlueExecution[]>();

    executions.forEach((e) => {
      if (!groups.has(e.symbol)) {
        groups.set(e.symbol, []);
      }

      groups.get(e.symbol)!.push(e);
    });

    const results: MatchedTrade[] = [];

    groups.forEach((rows, symbol) => {
      rows.sort((a, b) => new Date(a.tradeTime).getTime() - new Date(b.tradeTime).getTime());

      const buyQueue: any[] = [];

      rows.forEach((exec) => {
        if (exec.type === 'BUY') {
          buyQueue.push({
            qty: exec.qty,
            execution: exec,
          });

          return;
        }

        let remainingQty = exec.qty;

        while (remainingQty > 0 && buyQueue.length) {
          const buy = buyQueue[0];
          const matchedQty = Math.min(buy.qty, remainingQty);
          const pnl = (exec.price - buy.execution.price) * matchedQty;

          results.push({
            symbol,
            quantity: matchedQty,
            buyPrice: buy.execution.price,
            sellPrice: exec.price,
            pnl,
            entryTime: buy.execution.tradeTime,
            exitTime: exec.tradeTime,
            buyOrderId: buy.execution.orderId,
            sellOrderId: exec.orderId,
          });

          buy.qty -= matchedQty;
          remainingQty -= matchedQty;

          if (buy.qty === 0) {
            buyQueue.shift();
          }
        }
      });
    });

    return results;
  }

  toTradeRows(matchedTrades: MatchedTrade[]): TradeRow[] {
    return matchedTrades.map((t, index) => {
      const charges = this.brokerageCalculator.calculateOptionCharges(
        t.buyPrice,
        t.sellPrice,
        t.quantity,
      );
      const grossPnl = t.pnl;
      const netPnl = grossPnl - charges.totalCharges;

      return {
        user_id: this.userId,
        date: this.extractDate(t.entryTime),
        instrument_id: t.symbol,
        trading_symbol: t.symbol,
        exchange: 'NFO',
        transaction_type: 'BUY',
        product: 'MIS',
        quantity: t.quantity,
        buy_price: t.buyPrice,
        sell_price: t.sellPrice,
        pnl: +t.pnl.toFixed(2),
        gross_pnl: grossPnl,
        net_pnl: netPnl,
        brokerage: charges.totalCharges,
        brokerage_charges: charges.brokerageCharges,
        transaction_charges: charges.transactionCharges,
        gst: charges.gst,
        stt: charges.stt,
        sebi_charges: charges.sebiCharges,
        stamp_duty: charges.stampDuty,
        order_id: `${t.buyOrderId}_${t.sellOrderId}_${t.entryTime}_${index}`,
        entry_time: this.toIso(t.entryTime),
        exit_time: this.toIso(t.exitTime),
        status: 'closed',
        trade_side: 'LONG',
      };
    });
  }

  importExcel(file: File): Observable<void> {
    return from(this.readExcel(file)).pipe(
      map((rows) => this.matchTrades(rows)),
      map((trades) => this.toTradeRows(trades)),
      switchMap((trades) => this.reportsService.syncTradesFromFile(trades)),
    );
  }

  private extractDate(tradeTime: string): string {
    const match = tradeTime.match(/(\d{2})-(\d{2})-(\d{4})/);

    if (!match) {
      return '';
    }

    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  private toIso(tradeTime: string): string {
    const parts = tradeTime.match(/(\d{2})-(\d{2})-(\d{4}), (\d{2}):(\d{2}):(\d{2}) (am|pm)/i);

    if (!parts) {
      return new Date().toISOString();
    }

    let hour = +parts[4];

    if (parts[7].toLowerCase() === 'pm' && hour < 12) {
      hour += 12;
    }

    if (parts[7].toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }

    return new Date(+parts[3], +parts[2] - 1, +parts[1], hour, +parts[5], +parts[6]).toISOString();
  }
}
