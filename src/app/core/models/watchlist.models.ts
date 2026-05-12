import { Exchange } from '../enums/api.enums';
import { Quote } from './instrument.models';

export interface WatchlistItem {
  instrumentId: string;
  tradingSymbol: string;
  formattedName: string;
  exchange: Exchange;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
}
