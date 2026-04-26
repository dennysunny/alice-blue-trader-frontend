import { HistoryResponseTypes } from '../../shared/types/shared-types';
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

export interface Candle {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoryRequest {
  token: string;
  resolution: string;
  from: string; // epoch ms as string
  to: string;
  exchange: string;
}

export interface HistoryResponse {
  s: HistoryResponseTypes;
  t?: number[]; // timestamps (epoch seconds)
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
}

export interface OptionStrike {
  strikePrice: number;
  CE?: OptionContract;
  PE?: OptionContract;
}

export interface OptionContract {
  instrumentId: string;
  tradingSymbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  oi: number;
  oiChange: number;
  volume: number;
  iv: number;
  delta?: number;
  theta?: number;
  vega?: number;
  gamma?: number;
  bidPrice: number;
  askPrice: number;
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
