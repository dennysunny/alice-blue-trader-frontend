import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../configs/api.config';
import { ApiResponse } from '../models/api-response.models';
import { Quote, SearchResult } from '../models/instrument.models';

@Injectable({ providedIn: 'root' })
export class MarketService {
  constructor(private api: ApiService) {}

  search(query: string, exchange?: string): Observable<ApiResponse<SearchResult[]>> {
    const params: Record<string, string> = { query };
    if (exchange) params['exchange'] = exchange;
    return this.api.get<ApiResponse<SearchResult[]>>(API_ENDPOINTS.MARKET.SEARCH_SYMBOL, params);
  }

  getQuote(exchange: string, instrumentId: string): Observable<ApiResponse<Quote>> {
    return this.api.get<ApiResponse<Quote>>(API_ENDPOINTS.MARKET.QUOTE, {
      exchange,
      instrumentId,
    });
  }
}
