import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TransactionType } from '../../../core/enums/api.enums';
import { SearchResult } from '../../../core/models/instrument.models';
import { WatchlistItem } from '../../../core/models/watchlist.models';
import { MarketService } from '../../../core/services/market.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WatchlistService } from '../../../core/services/watchlist.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { AbbrevNumPipe } from '../../../shared/pipes/abbrev-num.pipe';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { OrderFormComponent } from './order-form.component';

interface WatchlistRow extends WatchlistItem {
  ltp: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  prevLtp: number | null;
}

@Component({
  standalone: true,
  selector: 'app-watchlist-page',
  templateUrl: './watchlist-page.component.html',
  styleUrls: ['./watchlist-page.component.scss'],
  imports: [
    SearchBarComponent,
    AbbrevNumPipe,
    CommonModule,
    SpinnerComponent,
    EmptyStateComponent,
    OrderFormComponent,
  ],
})
export class WatchlistPageComponent implements OnInit, OnDestroy {
  rows: WatchlistRow[] = [];
  searchResults: SearchResult[] = [];
  searching = false;

  orderFormVisible = false;
  selectedItem: WatchlistItem | null = null;
  selectedSide: TransactionType = TransactionType.BUY;

  readonly TransactionType = TransactionType;
  private readonly destroy$ = new Subject<void>();

  constructor(
    public watchlistService: WatchlistService,
    private marketService: MarketService,
    private wsService: WebSocketService,
    private notifications: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.trackWatchListData();
  }

  trackWatchListData(): void {
    this.watchlistService.watchlist$.pipe(takeUntil(this.destroy$)).subscribe((wl) => {
      this.rows = wl.items.map((item) => ({
        ...item,
        ltp: null,
        change: null,
        changePct: null,
        volume: null,
        prevLtp: null,
      }));
      this.subscribeToFeeds();
    });

    this.wsService.connect();
    this.wsService.feed$.pipe(takeUntil(this.destroy$)).subscribe((msg) => {
      if (msg.t === 'tf' || msg.t === 'tk') {
        const row = this.rows.find((r) => r.instrumentId === msg.tk);
        if (row && msg.lp) {
          row.prevLtp = row.ltp;
          row.ltp = parseFloat(msg.lp);
          if (msg.pc) row.changePct = parseFloat(msg.pc);
          if (msg.v) row.volume = parseFloat(msg.v);
          row.change = row.ltp - row.ltp / (1 + (row.changePct ?? 0) / 100);
        }
      }
    });
  }

  private subscribeToFeeds(): void {
    const instruments = this.rows.map((r) => ({
      instrumentId: r.instrumentId,
      exchange: r.exchange,
    }));
    if (instruments.length > 0) this.wsService.subscribe(instruments);
  }

  onSearch(query: string): void {
    this.searching = true;
    this.marketService.search(query).subscribe({
      next: (res) => {
        this.searchResults = res.result ?? [];
        this.searching = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.searching = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSearchCleared(): void {
    this.searchResults = [];
  }

  addToWatchlist(result: SearchResult): void {
    const added = this.watchlistService.addItem({
      instrumentId: result.instrumentId,
      tradingSymbol: result.tradingSymbol,
      formattedName: result.formattedName,
      exchange: result.exchange,
    });
    if (added) {
      this.notifications.success(`${result.formattedName} added to watchlist`);
    } else {
      this.notifications.warning(`${result.formattedName} already in watchlist`);
    }
    this.searchResults = [];
    this.cdr.markForCheck();
  }

  removeFromWatchlist(row: WatchlistRow): void {
    this.watchlistService.removeItem(row.instrumentId, row.exchange);
    this.notifications.info(`${row.formattedName} removed`);
  }

  openOrderForm(item: WatchlistItem, side: TransactionType): void {
    this.selectedItem = item;
    this.selectedSide = side;
    this.orderFormVisible = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
