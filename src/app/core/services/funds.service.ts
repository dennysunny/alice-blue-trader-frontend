import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, API_ENDPOINTS, API_METHODS } from '../configs/api.config';
import { ApiResponse } from '../models/api-response.models';
import { FundsLimits } from '../models/funds.models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FundsService {
  constructor(private api: ApiService, private authService: AuthService) {}

  getFundsLimits(): Observable<ApiResponse<FundsLimits[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.GET,
      endpoint: API_ENDPOINTS.FUNDS.GET_FUNDS,
      session: this.authService.sessionId,
    });
  }
}
