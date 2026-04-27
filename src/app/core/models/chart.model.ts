import { Time } from 'lightweight-charts';

export interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartHistoryRequest {
  token: string;
  resolution: string;
  from: string;
  to: string;
  exchange: string;
}
