import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { RouteSegment } from '../enums/app.enums';
import { StockNavParams } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);

  /**
   * Navigate to the stock detail page.
   * Call this from orders, positions, watchlist
   *
   * Example:
   *   this.nav.toStock({ instrumentId: '2885', exchange: Exchange.NSE, name: 'TCS' });
   */
  toStock(params: StockNavParams): void {
    const queryParams: Record<string, string> = { name: params.name };
    if (params.expiry) queryParams['expiry'] = params.expiry;

    this.router.navigate([RouteSegment.STOCK_DETAIL, params.exchange, params.instrumentId], {
      queryParams,
    });
  }

  /**
   * Build a routerLink array for use in templates.
   * Example:  [routerLink]="nav.stockLink(row)"
   */
  stockLink(params: StockNavParams): (string | Record<string, string>)[] {
    return [RouteSegment.STOCK_DETAIL, params.exchange, params.instrumentId];
  }

  stockQueryParams(params: StockNavParams): Record<string, string> {
    const qp: Record<string, string> = { name: params.name };
    if (params.expiry) qp['expiry'] = params.expiry;
    return qp;
  }
}
