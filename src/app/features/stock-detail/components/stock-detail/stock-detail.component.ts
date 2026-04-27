import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { APP_CONSTANTS } from '../../../../core/configs/api.config';
import { Exchange, TransactionType } from '../../../../core/enums/api.enums';
import { ChartResolution, RouteSegment } from '../../../../core/enums/app.enums';
import { MarketDepth, OptionStrike, Quote } from '../../../../core/models/instrument.models';
import { Order } from '../../../../core/models/order.models';
import { Position } from '../../../../core/models/portfolio.models';
import { MarketService } from '../../../../core/services/market.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { OrderService } from '../../../../core/services/order.service';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { ActiveTab } from '../../configs/stock.types';
import { CandleChartComponent } from '../chart/candle-chart.component';
import { DepthChartComponent } from '../depth/depth-chart.component';
import { DetailOrdersComponent } from '../detail-orders/detail-orders.component';
import { DetailPositionsComponent } from '../detail-positions/detail-positions.component';
import { OptionChainComponent } from '../option-chain/option-chain.component';
import { OrderFormComponent } from '../order-form/order-form.component';
import { QuoteCardComponent } from '../quote-card/quote-card.component';
import { ChartResolutionConfig } from '../../configs/stock.config';
import { ChartService } from '../../../../core/services/chart.service';
import { Candle, ChartHistoryRequest } from '../../../../core/models/chart.model';
import { Time } from 'lightweight-charts';
import { Location } from '@angular/common';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [
    CandleChartComponent,
    DepthChartComponent,
    QuoteCardComponent,
    OptionChainComponent,
    DetailOrdersComponent,
    DetailPositionsComponent,
    OrderFormComponent,
    SpinnerComponent,
  ],
  templateUrl: './stock-detail.component.html',
  styleUrl: './stock-detail.component.scss',
})
export class StockDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orders = inject(OrderService);
  private readonly portfolio = inject(PortfolioService);
  private readonly ws = inject(WebSocketService);
  private readonly notify = inject(NotificationService);
  private readonly chartService = inject(ChartService);
  private readonly location = inject(Location);

  exchange = signal<Exchange>(Exchange.NSE);
  instrumentId = signal<string>('');
  name = signal<string>('');

  quote = signal<Quote | null>(null);
  depth = signal<MarketDepth | null>(null);
  candles = signal<Candle[]>([]);
  optionStrikes = signal<OptionStrike[]>([]);
  myOrders = signal<Order[]>([]);
  myPositions = signal<Position[]>([]);

  loading = signal(true);
  activeTab = signal<ActiveTab>('chart');
  resolution = signal<ChartResolution>(ChartResolution.ONE_DAY);
  orderFormVisible = signal(false);
  orderSide = signal<TransactionType>(TransactionType.BUY);

  isFno = computed(() => this.exchange() === Exchange.NFO || this.exchange() === Exchange.MCX);

  resolutions = ChartResolutionConfig;

  readonly AppRoute = RouteSegment;
  readonly TransactionType = TransactionType;

  private readonly destroy$ = new Subject<void>();

  constructor() {
    // reload candles whenever resolution changes
    effect(() => {
      const res = this.resolution();
      const id = this.instrumentId();
      if (id) {
        this.loadCandles(res);
      }
    });
  }

  ngOnInit(): void {
    const params = this.route.snapshot.params as { exchange: string; instrumentId: string };
    const qp = this.route.snapshot.queryParams as { name?: string };

    this.exchange.set(params['exchange'] as Exchange);
    this.instrumentId.set(params['instrumentId']);
    this.name.set(qp['name'] ?? params['instrumentId']);

    this.loadAll();
    this.subscribeWs();
  }

  // ── data loading ──────────────────────────────────────────────────
  private loadAll(): void {
    this.loading.set(true);

    forkJoin({
      //quote: this.market.getQuote(this.exchange(), this.instrumentId()),
      //depth: this.market.getDepth(this.exchange(), this.instrumentId()),
      orders: this.orders.getOrderBook(),
      positions: this.portfolio.getDayPositions(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ orders, positions }) => {
          //this.quote.set(quote.result);
          //this.depth.set(depth.result);
          // this.myOrders.set(
          //   this.orders.ordersForInstrument(orders.result ?? [], this.instrumentId()),
          // );
          // this.myPositions.set(
          //   this.portfolio.positionsForInstrument(positions.result ?? [], this.instrumentId()),
          // );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadCandles(res: ChartResolution): void {
    const now = Date.now();
    const rangeMs =
      res === ChartResolution.ONE_DAY
        ? 365 * 24 * 60 * 60 * 1000
        : APP_CONSTANTS.CHART_CANDLE_LIMIT * this.resolutionToMs(res);

    const chartHistoryRequest: ChartHistoryRequest = {
      token: this.instrumentId(),
      resolution: res,
      from: String(now - rangeMs),
      to: new Date().getTime().toString(),
      exchange: this.exchange(),
    };

    this.chartService
      .getChartData(chartHistoryRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Chart API response:', response);
          const candles = this.mapToCandles(response.result);
          this.candles.set(candles);
        },
        error: () => {
          this.candles.set([]);
        },
      });
  }

  mapToCandles(apiData: Candle[]): Candle[] {
    if (!apiData) return [];

    return apiData.map((d) => ({
      time: (new Date(d.time as string).getTime() / 1000) as Time,
      open: +d.open,
      high: +d.high,
      low: +d.low,
      close: +d.close,
      volume: +d.volume,
    }));
  }

  loadOptionChain(): void {
    const q = this.quote();
    if (!q) return;
    const expiry = (this.route.snapshot.queryParams['expiry'] as string) ?? '';
    // this.market
    //   .getOptionChain(this.exchange(), q.tradingSymbol.replace(/-EQ$/, ''), expiry)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({ next: (r) => this.optionStrikes.set(r.result ?? []) });
  }

  // ── WebSocket ─────────────────────────────────────────────────────
  private subscribeWs(): void {
    this.ws.connect();
    this.ws.subscribe([{ instrumentId: this.instrumentId(), exchange: this.exchange() }]);

    this.ws
      .feedFor(this.instrumentId(), this.exchange())
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg) => {
        this.quote.update((q) => {
          if (!q) return q;
          const ltp = msg.lp ? parseFloat(msg.lp) : q.ltp;
          const pct = msg.pc ? parseFloat(msg.pc) : q.changePercent;
          return { ...q, ltp, changePercent: pct, change: ltp - q.close };
        });
      });
  }

  // ── UI actions ────────────────────────────────────────────────────
  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'options' && this.optionStrikes().length === 0) this.loadOptionChain();
  }

  setResolution(r: ChartResolution): void {
    this.resolution.set(r);
  }

  openBuy() {
    this.orderSide.set(TransactionType.BUY);
    this.orderFormVisible.set(true);
  }
  openSell() {
    this.orderSide.set(TransactionType.SELL);
    this.orderFormVisible.set(true);
  }

  goBack(): void {
    this.location.back();
  }

  private resolutionToMs(r: ChartResolution): number {
    const mins: Record<ChartResolution, number> = {
      [ChartResolution.ONE_MIN]: 1,
      [ChartResolution.FIVE_MIN]: 5,
      [ChartResolution.FIFTEEN_MIN]: 15,
      [ChartResolution.THIRTY_MIN]: 30,
      [ChartResolution.ONE_HOUR]: 60,
      [ChartResolution.ONE_DAY]: 1440,
    };
    return (mins[r] ?? 5) * 60 * 1000;
  }

  ngOnDestroy(): void {
    this.ws.unsubscribe([{ instrumentId: this.instrumentId(), exchange: this.exchange() }]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
