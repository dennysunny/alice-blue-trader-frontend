import { inject, Injectable } from '@angular/core';

import { ApiService } from './api.service';
import { Observable } from 'rxjs';

import { ApiResponse } from '../models/api-response.models';
import { API_CONFIG, API_ENDPOINTS, API_METHODS } from '../configs/api.config';
import { AuthService } from './auth.service';
import { Candle, ChartHistoryRequest } from '../models/chart.model';

@Injectable({ providedIn: 'root' })
export class ChartService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  getChartData(request: ChartHistoryRequest): Observable<ApiResponse<Candle[]>> {
    return this.apiService.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.POST,
      endpoint: API_ENDPOINTS.HISTORY.CHART_HISTORY,
      session: this.authService.sessionId,
      data: request,
      isChart: true,
    });
  }
}
