import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { StorageService } from './storage.service';

import { StorageKey } from '../enums/app.enums';

import { Watchlist, WatchlistItem } from '../models/watchlist.models';

import { Exchange } from '../enums/api.enums';

const DEFAULT_WATCHLISTS: Watchlist[] = [
  {
    id: 'default',
    name: 'My Watchlist',

    items: [
      {
        instrumentId: '22',
        tradingSymbol: 'ACC-EQ',
        formattedName: 'ACC',
        exchange: Exchange.NSE,
      },

      {
        instrumentId: '2885',
        tradingSymbol: 'TCS-EQ',
        formattedName: 'TCS',
        exchange: Exchange.NSE,
      },

      {
        instrumentId: '11536',
        tradingSymbol: 'INFY-EQ',
        formattedName: 'Infosys',
        exchange: Exchange.NSE,
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private storage = inject(StorageService);
  // =========================================================
  // SIGNAL STATE
  // =========================================================

  readonly watchlists = signal<Watchlist[]>(
    this.storage.get<Watchlist[]>(StorageKey.WATCHLISTS) ?? DEFAULT_WATCHLISTS,
  );

  readonly activeWatchlistId = signal<string>(
    this.storage.get<string>(StorageKey.ACTIVE_WATCHLIST_ID) ?? 'default',
  );

  readonly activeWatchlist = computed(() => {
    return this.watchlists().find((w) => w.id === this.activeWatchlistId()) ?? this.watchlists()[0];
  });

  readonly activeItems = computed(() => {
    return this.activeWatchlist()?.items ?? [];
  });

  constructor() {
    /**
     * Persist automatically
     */
    effect(() => {
      this.storage.set(StorageKey.WATCHLISTS, this.watchlists());

      this.storage.set(StorageKey.ACTIVE_WATCHLIST_ID, this.activeWatchlistId());
    });
  }

  // =========================================================
  // WATCHLIST MANAGEMENT
  // =========================================================

  createWatchlist(name: string): void {
    const newWatchlist: Watchlist = {
      id: crypto.randomUUID(),
      name,
      items: [],
    };

    this.watchlists.update((list) => [...list, newWatchlist]);
  }

  deleteWatchlist(id: string): void {
    const filtered = this.watchlists().filter((w) => w.id !== id);

    this.watchlists.set(filtered);

    /**
     * Reset active watchlist
     */
    if (this.activeWatchlistId() === id) {
      this.activeWatchlistId.set(filtered[0]?.id ?? '');
    }
  }

  renameWatchlist(id: string, name: string): void {
    this.watchlists.update((list) => list.map((w) => (w.id === id ? { ...w, name } : w)));
  }

  setActiveWatchlist(id: string): void {
    this.activeWatchlistId.set(id);
  }

  // =========================================================
  // ITEM MANAGEMENT
  // =========================================================

  addItem(item: WatchlistItem): boolean {
    const current = this.activeWatchlist();

    if (!current) return false;

    const exists = current.items.some(
      (i) => i.instrumentId === item.instrumentId && i.exchange === item.exchange,
    );

    if (exists) {
      return false;
    }

    this.updateWatchlist(current.id, {
      ...current,

      items: [...current.items, item],
    });

    return true;
  }

  removeItem(instrumentId: string, exchange: Exchange): void {
    const current = this.activeWatchlist();

    if (!current) return;

    this.updateWatchlist(current.id, {
      ...current,

      items: current.items.filter(
        (i) => !(i.instrumentId === instrumentId && i.exchange === exchange),
      ),
    });
  }

  isWatched(instrumentId: string, exchange: Exchange): boolean {
    return this.activeItems().some(
      (i) => i.instrumentId === instrumentId && i.exchange === exchange,
    );
  }

  // =========================================================
  // REORDER SUPPORT
  // =========================================================

  reorderItems(previousIndex: number, currentIndex: number): void {
    const current = this.activeWatchlist();

    if (!current) return;

    const updatedItems = [...current.items];

    const [movedItem] = updatedItems.splice(previousIndex, 1);

    updatedItems.splice(currentIndex, 0, movedItem);

    this.updateWatchlist(current.id, {
      ...current,
      items: updatedItems,
    });
  }

  // =========================================================
  // INTERNAL UPDATE
  // =========================================================

  private updateWatchlist(id: string, updated: Watchlist): void {
    this.watchlists.update((list) => list.map((w) => (w.id === id ? updated : w)));
  }
}
