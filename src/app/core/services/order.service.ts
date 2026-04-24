import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, API_ENDPOINTS, API_METHODS } from '../configs/api.config';
import { ApiResponse } from '../models/api-response.models';
import {
  ModifyOrderRequest,
  Order,
  OrderHistoryEntry,
  PlaceOrderRequest,
  PlaceOrderResponse,
  Trade,
} from '../models/order.models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService, private authService: AuthService) { }

  placeOrder(request: PlaceOrderRequest[]): Observable<ApiResponse<PlaceOrderResponse[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.POST,
      endpoint: API_ENDPOINTS.ORDERS.PLACE_ORDER,
      session: this.authService.sessionId,
      data: request
    });
  }

  modifyOrder(request: ModifyOrderRequest): Observable<ApiResponse<PlaceOrderResponse[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.PUT,
      endpoint: API_ENDPOINTS.ORDERS.MODIFY_ORDER,
      session: this.authService.sessionId,
      data: request
    });
  }

  cancelOrder(brokerOrderId: string): Observable<ApiResponse<PlaceOrderResponse[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.POST,
      endpoint: API_ENDPOINTS.ORDERS.CANCEL_ORDER,
      session: this.authService.sessionId,
      params: [{
        brokerOrderId
      }]
    });
  }

  getOrderBook(): Observable<ApiResponse<Order[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.GET,
      endpoint: API_ENDPOINTS.ORDERS.ORDER_BOOK,
      session: this.authService.sessionId,
    });
  }

  getTradeBook(): Observable<ApiResponse<Trade[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.GET,
      endpoint: API_ENDPOINTS.ORDERS.TRADE_BOOK,
      session: this.authService.sessionId,
    });
  }

  getOrderHistory(brokerOrderId: string): Observable<ApiResponse<OrderHistoryEntry[]>> {
    return this.api.post(API_CONFIG.PROXY_URL, {
      method: API_METHODS.GET,
      endpoint: API_ENDPOINTS.ORDERS.ORDER_HISTORY,
      session: this.authService.sessionId,
      params: {
        brokerOrderId
      }
    });
  }
}
