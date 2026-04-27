import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  SimpleChanges,
  signal,
} from '@angular/core';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  Time,
} from 'lightweight-charts';
import { ThemeService } from '../../../../core/services/theme.service';
import { effect } from '@angular/core';
import { ChartResolution } from '../../../../core/enums/app.enums';
import { Candle } from '../../../../core/models/chart.model';

@Component({
  selector: 'app-candle-chart',
  standalone: true,
  template: `
    <div class="chart-wrap">
      <div #chartEl class="chart-canvas"></div>
      <div #volumeEl class="volume-canvas"></div>
    </div>
  `,
  styles: [
    `
      .chart-wrap {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 4px;
      }
      .chart-canvas {
        width: 100%;
        height: 380px;
      }
      .volume-canvas {
        width: 100%;
        height: 380px;
      }
    `,
  ],
  imports: [],
})
export class CandleChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() candles: Candle[] = [];
  @Input() resolution: ChartResolution = ChartResolution.FIVE_MIN;

  @ViewChild('chartEl', { static: true }) chartEl!: ElementRef<HTMLDivElement>;
  @ViewChild('volumeEl', { static: true }) volumeEl!: ElementRef<HTMLDivElement>;

  private readonly theme = inject(ThemeService);

  private chart!: IChartApi;
  private volChart!: IChartApi;
  private candleSeries!: ISeriesApi<'Candlestick'>;
  private volumeSeries!: ISeriesApi<'Histogram'>;

  private chartReady = signal(false);

  constructor() {
    effect(() => {
      if (!this.chartReady()) return;
      const dark = this.theme.isDark();
      this.applyTheme(dark);
    });
  }

  ngAfterViewInit(): void {
    this.initCharts();
    this.chartReady.set(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.candleSeries) return;
    if (changes['candles']) this.renderCandles();
  }

  private initCharts(): void {
    const dark = this.theme.isDark();
    const options = this.chartOptions(dark);

    this.chart = createChart(this.chartEl.nativeElement, { ...options, height: 380 });
    this.volChart = createChart(this.volumeEl.nativeElement, { ...options, height: 80 });

    this.candleSeries = this.chart.addSeries(CandlestickSeries, {
      upColor: 'var(--color-up)',
      downColor: 'var(--color-down)',
      borderUpColor: 'var(--color-up)',
      borderDownColor: 'var(--color-down)',
      wickUpColor: 'var(--color-up)',
      wickDownColor: 'var(--color-down)',
    });

    this.volumeSeries = this.volChart.addSeries(HistogramSeries, {
      color: 'rgba(79,135,255,0.4)',
      priceFormat: { type: 'volume' },
    });

    this.renderCandles();
  }

  private renderCandles(): void {
    if (!this.candles.length) return;

    const candleData: CandlestickData[] = this.candles.map((c) => ({
      time: c.time as unknown as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData: HistogramData[] = this.candles.map((c) => ({
      time: c.time as unknown as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(38,216,124,0.5)' : 'rgba(255,77,106,0.5)',
    }));

    this.candleSeries.setData(candleData);
    this.volumeSeries.setData(volumeData);
    this.chart.timeScale().fitContent();
    this.volChart.timeScale().fitContent();
  }

  private applyTheme(dark: boolean): void {
    if (!this.chart) return;
    const opts = this.chartOptions(dark);
    this.chart.applyOptions(opts);
    this.volChart.applyOptions(opts);
  }

  private chartOptions(dark: boolean) {
    const bg = dark ? '#141720' : '#ffffff';
    const text = dark ? '#8891a8' : '#5c6680';
    const grid = dark ? '#1c2030' : '#eef1f8';
    const border = dark ? '#2a2f42' : '#dde2ee';

    return {
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      rightPriceScale: { borderColor: border },
      timeScale: { borderColor: border, timeVisible: true },
      crosshair: { mode: 1 },
      handleScroll: true,
      handleScale: true,
    };
  }

  ngOnDestroy(): void {
    this.chart?.remove();
    this.volChart?.remove();
  }
}
