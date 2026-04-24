import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { StorageKey } from '../enums/app.enums';
import { WatchlistItem, Watchlist } from '../models/watchlist.models';
import { Exchange } from '../enums/api.enums';

const DEFAULT_WATCHLIST: Watchlist = {
  id: 'default',
  name: 'My Watchlist',
  items: [
    { instrumentId: '22', tradingSymbol: 'ACC-EQ', formattedName: 'ACC', exchange: Exchange.NSE },
    { instrumentId: '2885', tradingSymbol: 'TCS-EQ', formattedName: 'TCS', exchange: Exchange.NSE },
    { instrumentId: '1333', tradingSymbol: 'HDFCBANK-EQ', formattedName: 'HDFC Bank', exchange: Exchange.NSE },
    { instrumentId: '11536', tradingSymbol: 'INFY-EQ', formattedName: 'Infosys', exchange: Exchange.NSE },
    { instrumentId: '10999', tradingSymbol: 'RELIANCE-EQ', formattedName: 'Reliance', exchange: Exchange.NSE },
    { instrumentId: '4963', tradingSymbol: 'WIPRO-EQ', formattedName: 'Wipro', exchange: Exchange.NSE },
  ],
};

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly watchlistSubject: BehaviorSubject<Watchlist>;
  readonly watchlist$;

  constructor(private storage: StorageService) {
    const saved = this.storage.get<Watchlist>(StorageKey.WATCHLIST);
    this.watchlistSubject = new BehaviorSubject<Watchlist>(saved ?? DEFAULT_WATCHLIST);
    this.watchlist$ = this.watchlistSubject.asObservable();
  }

  get current(): Watchlist {
    return this.watchlistSubject.value;
  }

  addItem(item: WatchlistItem): boolean {
    const current = this.current;
    const exists = current.items.some(
      (i) => i.instrumentId === item.instrumentId && i.exchange === item.exchange
    );
    if (exists) return false;
    const updated = { ...current, items: [...current.items, item] };
    this.update(updated);
    return true;
  }

  removeItem(instrumentId: string, exchange: Exchange): void {
    const current = this.current;
    const updated = {
      ...current,
      items: current.items.filter(
        (i) => !(i.instrumentId === instrumentId && i.exchange === exchange)
      ),
    };
    this.update(updated);
  }

  isWatched(instrumentId: string, exchange: Exchange): boolean {
    return this.current.items.some(
      (i) => i.instrumentId === instrumentId && i.exchange === exchange
    );
  }

  private update(watchlist: Watchlist): void {
    this.watchlistSubject.next(watchlist);
    this.storage.set(StorageKey.WATCHLIST, watchlist);
  }
}
