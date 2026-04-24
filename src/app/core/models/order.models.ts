import {
  Exchange,
  OrderComplexity,
  OrderStatus,
  OrderType,
  ProductType,
  TransactionType,
  Validity,
} from '../enums/api.enums';

export interface PlaceOrderRequest {
  exchange: Exchange;
  instrumentId: string;
  transactionType: TransactionType;
  quantity: number;
  product: ProductType;
  orderComplexity: OrderComplexity;
  orderType: OrderType;
  validity: Validity;
  price: string;
  slLegPrice?: string;
  targetLegPrice?: string;
  slTriggerPrice?: string;
  disclosedQuantity?: string;
  marketProtectionPercent?: string;
  deviceId?: string;
  trailingSlAmount?: string;
  orderTag?: string;
}

export interface ModifyOrderRequest {
  brokerOrderId: string;
  exchange: Exchange;
  instrumentId: string;
  transactionType: TransactionType;
  quantity: number;
  product: ProductType;
  orderType: OrderType;
  validity: Validity;
  price: string;
  slTriggerPrice?: string;
  disclosedQuantity?: string;
}

export interface Order {
  brokerOrderId: string;
  exchangeOrderId?: string;
  exchangeTradeId?: string;
  clientId: string;
  placedBy: string;
  formattedInstrumentName: string;
  tradingSymbol: string;
  instrumentId: string;
  exchange: Exchange;
  transactionType: TransactionType;
  product: ProductType;
  orderComplexity: OrderComplexity;
  orderType: OrderType;
  validity: Validity;
  price: number;
  quantity: number;
  filledQuantity: number;
  pendingQuantity: number;
  cancelledQuantity?: number;
  tradedPrice?: number;
  avgPrice?: number;
  status: OrderStatus;
  orderTime: string;
  fillTimestamp?: string;
  rejectionReason?: string;
  orderTag?: string;
  algoId?: string;
}

export interface PlaceOrderResponse {
  requestTime: string;
  brokerOrderId: string;
}

export interface OrderHistoryEntry {
  brokerOrderId: string;
  status: OrderStatus;
  orderTime: string;
  price: number;
  quantity: number;
  rejectionReason?: string;
}

export interface Trade {
  brokerOrderId: string;
  exchangeOrderId: string;
  exchangeTradeId: string;
  clientId: string;
  formattedInstrumentName: string;
  tradingSymbol: string;
  instrumentId: string;
  exchange: Exchange;
  transactionType: TransactionType;
  product: ProductType;
  orderComplexity: OrderComplexity;
  orderType: OrderType;
  validity: Validity;
  tradedPrice: number;
  filledQuantity: number;
  orderTime: string;
  fillTimestamp: string;
  orderTag?: string;
  algoId?: string;
}
