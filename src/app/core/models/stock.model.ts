import { Exchange } from '../enums/api.enums';

export interface StockNavParams {
  instrumentId: string;
  exchange: Exchange;
  name: string;
  expiry?: string; // for F&O — pre-selects option chain expiry
}
