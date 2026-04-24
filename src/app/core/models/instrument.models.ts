import { Exchange } from '../enums/api.enums';

export interface Instrument {
  instrumentId: string;
  tradingSymbol: string;
  formattedName: string;
  exchange: Exchange;
  isin?: string;
  lotSize?: number;
  tickSize?: number;
  instrumentType?: string;
  expiry?: string;
  strikePrice?: number;
  optionType?: string;
}

export interface Quote {
  instrumentId: string;
  tradingSymbol: string;
  exchange: Exchange;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  avgPrice: number;
  buyQty: number;
  sellQty: number;
  upperCircuit?: number;
  lowerCircuit?: number;
  weekHigh52?: number;
  weekLow52?: number;
  totalBuyQty?: number;
  totalSellQty?: number;
}

export interface MarketDepthEntry {
  price: number;
  quantity: number;
  orders: number;
}

export interface MarketDepth {
  instrumentId: string;
  exchange: Exchange;
  buy: MarketDepthEntry[];
  sell: MarketDepthEntry[];
}

export interface WebSocketFeed {
  t: string;
  e?: string;
  tk?: string;
  ts?: string;
  lp?: string;
  pc?: string;
  v?: string;
  o?: string;
  h?: string;
  l?: string;
  c?: string;
  ap?: string;
  tbq?: string;
  tsq?: string;
  bp1?: string;
  sp1?: string;
  bq1?: string;
  sq1?: string;
  s?: string;
}

export interface SearchResult {
  instrumentId: string;
  tradingSymbol: string;
  formattedName: string;
  exchange: Exchange;
  instrumentType: string;
}
