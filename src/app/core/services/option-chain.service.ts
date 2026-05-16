import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  OptionChainExchange,
  OptionChainInterval,
} from '../../features/stock-detail/configs/stock.enum';
import { API_CONFIG, API_ENDPOINTS, API_METHODS } from '../configs/api.config';
import {
  GetOptionChainRequest,
  GetUnderlyingExpiryRequest,
  GetUnderlyingRequest,
  OptionChainRowView,
  OptionContractRaw,
  OptionContractView,
} from '../models/option-chain.model';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OptionChainService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  getUnderlyings(exch: OptionChainExchange): Observable<string[]> {
    const body: GetUnderlyingRequest = { exch };
    return this.api
      .post(API_CONFIG.PROXY_URL, {
        method: API_METHODS.POST,
        endpoint: API_ENDPOINTS.OPTION_CHAIN.UNDERLYING,
        session: this.authService.sessionId,
        data: body,
        isOptionChain: true,
      })
      .pipe(map((r: any) => r.result?.[0]?.list_underlying ?? []));
  }

  getExpiries(underlying: string, exch: OptionChainExchange): Observable<string[]> {
    const body: GetUnderlyingExpiryRequest = { underlying, exch };
    return this.api
      .post(API_CONFIG.PROXY_URL, {
        method: API_METHODS.POST,
        endpoint: API_ENDPOINTS.OPTION_CHAIN.UNDERLYING_EXPIRIES,
        session: this.authService.sessionId,
        data: body,
        isOptionChain: true,
      })
      .pipe(map((r: any) => r.result?.[0]?.underlying_expiry ?? []));
  }

  getOptionChain(
    underlying: string,
    expiry: string,
    interval: OptionChainInterval,
    exch: OptionChainExchange,
    spotPrice: number,
  ): Observable<OptionChainRowView[]> {
    const body: GetOptionChainRequest = { underlying, expiry, interval, exch };
    return this.api
      .post(API_CONFIG.PROXY_URL, {
        method: API_METHODS.POST,
        endpoint: API_ENDPOINTS.OPTION_CHAIN.OPTION_CHAIN,
        session: this.authService.sessionId,
        data: body,
        isOptionChain: true,
      })
      .pipe(
        map((r: any) => {
          const rows = r.result?.[0]?.data ?? [];
          return this.parseRows(rows, spotPrice);
        }),
      );
  }

  private parseRows(
    rows: Array<{ CE?: OptionContractRaw; PE?: OptionContractRaw }>,
    spotPrice: number,
  ): OptionChainRowView[] {
    const parsed: OptionChainRowView[] = rows.map((row) => {
      const ce = row.CE ? this.parseContract(row.CE) : undefined;
      const pe = row.PE ? this.parseContract(row.PE) : undefined;

      // ── Strike priority ──────────────────────────────────────────
      // 1. gval — AliceBlue stores the strike price here for NSE/MCX.
      //    The docs label it "Greeks or calculated value" but in practice
      //    it is the numeric strike (e.g. "24700", "52000").
      // 2. tradingsymbol regex — fallback for BSE and edge cases.
      const rawGval = parseFloat(row.CE?.gval ?? row.PE?.gval ?? '0');
      const strike =
        rawGval > 0
          ? rawGval
          : this.extractStrike(row.CE?.tradingsymbol ?? row.PE?.tradingsymbol ?? '');

      return { strikePrice: strike, CE: ce, PE: pe, isAtm: false } satisfies OptionChainRowView;
    });

    // Mark ATM row — closest strike to spot price
    if (parsed.length > 0) {
      const atmRow =
        spotPrice > 0
          ? parsed.reduce((best, cur) =>
              Math.abs(cur.strikePrice - spotPrice) < Math.abs(best.strikePrice - spotPrice)
                ? cur
                : best,
            )
          : parsed[Math.floor(parsed.length / 2)]; // fallback: middle row

      atmRow.isAtm = true;
    }

    return parsed;
  }

  private parseContract(raw: OptionContractRaw): OptionContractView {
    const ltp = parseFloat(raw.ltp) || 0;
    const pdc = parseFloat(raw.pdc) || 0;
    const oi = parseFloat(raw.oi) || 0;
    const pdoi = parseFloat(raw.pdoi) || 0;

    return {
      token: raw.token,
      tradingsymbol: raw.tradingsymbol,
      forInsName: raw.forInsName,
      ltp,
      pdc,
      change: parseFloat((ltp - pdc).toFixed(2)),
      changePct: pdc > 0 ? parseFloat((((ltp - pdc) / pdc) * 100).toFixed(2)) : 0,
      oi,
      pdoi,
      oiChange: parseFloat((oi - pdoi).toFixed(0)),
      // gval is strike for NSE/MCX — store it raw so component can debug if needed
      gval: parseFloat(raw.gval) || 0,
    };
  }

  /**
   * Fallback: extract strike from trading symbol string.
   *
   * NSE monthly : NIFTY25APR24700CE  → last digit block before CE/PE = '24700' (5 chars) → 24700
   * NSE weekly  : NIFTY2642524700CE  → last digit block = '2642524700' (len > 5) → last 5 = '24700'
   * BSE monthly : SENSEX25APR80000CE → '80000' (5 chars) → 80000
   * MCX decimal : GOLD25APR73000CE   → '73000' → 73000
   */
  private extractStrike(symbol: string): number {
    if (!symbol) return 0;
    const match = symbol.match(/(\d+(?:\.\d+)?)(CE|PE)$/i);
    if (!match) return 0;
    const raw = match[1];
    if (raw.includes('.')) return parseFloat(raw);
    if (raw.length > 5) return parseFloat(raw.slice(-5));
    return parseFloat(raw);
  }
}
