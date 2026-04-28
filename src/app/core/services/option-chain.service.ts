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
    const parsed = rows.map((row) => {
      const ce = row.CE ? this.parseContract(row.CE) : undefined;
      const pe = row.PE ? this.parseContract(row.PE) : undefined;

      // Extract strike from tradingsymbol (last numeric segment before C/P)
      const strike = this.extractStrike(row.CE?.tradingsymbol ?? row.PE?.tradingsymbol ?? '');

      return {
        strikePrice: strike,
        CE: ce,
        PE: pe,
        isAtm: false as boolean,
      } satisfies OptionChainRowView;
    });

    // Mark ATM — strike closest to spot
    if (spotPrice > 0 && parsed.length > 0) {
      const atm = parsed.reduce((best, cur) =>
        Math.abs(cur.strikePrice - spotPrice) < Math.abs(best.strikePrice - spotPrice) ? cur : best,
      );
      atm.isAtm = true;
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
      gval: parseFloat(raw.gval) || 0,
    };
  }

  /**
   * Extract strike price from NSE/BSE F&O trading symbols.
   * Monthly: SYMBOL+YYMMMSTRIKE+CE/PE  e.g. NIFTY25APR25000CE
   * Weekly:  SYMBOL+YY+M+DD+STRIKE+CE/PE  e.g. NIFTY2641924700CE
   *
   * The digit block before CE/PE may include an embedded date prefix when > 5 digits.
   * All NSE index strikes fit in 5 digits (≤99999), so we take the last 5 in that case.
   */
  private extractStrike(symbol: string): number {
    if (!symbol) return 0;
    const match = symbol.match(/(\d+(?:\.\d+)?)(CE|PE)$/i);
    if (!match) return 0;
    const raw = match[1];
    if (raw.includes('.')) return parseFloat(raw); // MCX/CDS decimal strikes
    if (raw.length > 5) return parseFloat(raw.slice(-5)); // strip embedded date prefix
    return parseFloat(raw);
  }
}
