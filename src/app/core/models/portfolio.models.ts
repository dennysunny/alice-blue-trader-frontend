import { Exchange, ProductType, TransactionType } from '../enums/api.enums';

export interface Holding {
  isin: string;
  nseInstrumentId: string;
  bseInstrumentId?: string;
  nseTradingSymbol: string;
  bseTradingSymbol?: string;
  formattedInstrumentName: string;
  previousDayClose: number;
  product: ProductType;
  averageTradedPrice: number;
  collateralQuantity: number;
  authorizedQuantity: number;
  dpQuantity: number;
  totalQuantity: number;
  t1Quantity: number;
  currentPrice?: number;
  currentValue?: number;
  investedValue?: number;
  pnl?: number;
  pnlPercent?: number;
}

export interface Position {
  instrumentId: string;
  tradingSymbol: string;
  formattedInstrumentName: string;
  exchange: Exchange;
  product: ProductType;
  netQuantity: number;
  buyQuantity: number;
  sellQuantity: number;
  buyAvgPrice: number;
  sellAvgPrice: number;
  netAvgPrice: number;
  ltp?: number;
  realizedPnl: number;
  unrealizedPnl: number;
  closingPrice: number;
  multiplier?: number;
}

export interface SquareOffRequest {
  exchange: Exchange;
  instrumentId: string;
  product: ProductType;
  quantity: number;
  transactionType: TransactionType;
  orderType: string;
  price?: string;
}

export interface ConvertPositionRequest {
  exchange: Exchange;
  instrumentId: string;
  previousProduct: ProductType;
  currentProduct: ProductType;
  transactionType: TransactionType;
  quantity: number;
}
