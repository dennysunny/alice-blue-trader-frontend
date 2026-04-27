import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, API_ENDPOINTS, API_METHODS } from '../configs/api.config';
import { ApiResponse } from '../models/api-response.models';
import {
  ConvertPositionRequest,
  Holding,
  Position,
  SquareOffRequest,
} from '../models/portfolio.models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { HoldingsProductType } from '../enums/api.enums';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  constructor(
    private api: ApiService,
    private authService: AuthService,
  ) {}

  getHoldings(holdingType: HoldingsProductType): Observable<ApiResponse<Holding[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.GET,
      endpoint: `${API_ENDPOINTS.PORTFOLIO.GET_HOLDINGS}/${holdingType}`,
      session: this.authService.sessionId,
    });
  }

  getDayPositions(): Observable<ApiResponse<Position[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.GET,
      endpoint: API_ENDPOINTS.PORTFOLIO.GET_POSITIONS,
      session: this.authService.sessionId,
    });
  }

  squareOff(request: SquareOffRequest): Observable<ApiResponse<unknown>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.POST,
      endpoint: API_ENDPOINTS.PORTFOLIO.CLOSE_OPEN_POSITION,
      session: this.authService.sessionId,
      data: request,
    });
  }

  convertPosition(request: ConvertPositionRequest): Observable<ApiResponse<unknown>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.POST,
      endpoint: API_ENDPOINTS.PORTFOLIO.CONVERSION,
      session: this.authService.sessionId,
      data: request,
    });
  }
}
