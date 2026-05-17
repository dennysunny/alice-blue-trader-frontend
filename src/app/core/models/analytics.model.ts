import { Candle } from './chart.model';

// ── Enums ─────────────────────────────────────────────────────────

export enum AnalyticsTimeframe {
  INTRADAY = 'intraday',
  DAILY = 'daily',
}

export enum CandleResolution {
  ONE_MIN = '1',
  THREE_MIN = '3',
  FIVE_MIN = '5',
  FIFTEEN_MIN = '15',
  THIRTY_MIN = '30',
  ONE_HOUR = '60',
  ONE_DAY = 'D',
}

export enum TrendDirection {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  SIDEWAYS = 'sideways',
}

export enum SignalType {
  BUY = 'buy',
  SELL = 'sell',
  CAUTION = 'caution',
}

export enum SessionPhase {
  PRE_MARKET = 'Pre-Market',
  OPENING_RANGE = 'Opening Range', // 9:15–9:45
  MORNING = 'Morning', // 9:45–11:30
  MIDDAY = 'Midday', // 11:30–1:30
  AFTERNOON = 'Afternoon', // 1:30–2:45
  CLOSING = 'Closing', // 2:45–3:30
}

// ── Instrument selector ───────────────────────────────────────────

export interface AnalyticsInstrument {
  label: string;
  symbol: string;
  token: string;
  exchange: string;
  lotSize: number;
}

export const DEFAULT_INSTRUMENTS: AnalyticsInstrument[] = [
  { label: 'NIFTY 50', symbol: 'NIFTY', token: '26000', exchange: 'NSE', lotSize: 75 },
  { label: 'BANK NIFTY', symbol: 'BANKNIFTY', token: '26009', exchange: 'NSE', lotSize: 30 },
  { label: 'FIN NIFTY', symbol: 'FINNIFTY', token: '26037', exchange: 'NSE', lotSize: 65 },
  { label: 'MIDCAP NIFTY', symbol: 'MIDCPNIFTY', token: '26074', exchange: 'NSE', lotSize: 75 },
  { label: 'SENSEX', symbol: 'SENSEX', token: '1', exchange: 'BSE', lotSize: 20 },
  { label: 'BANKEX', symbol: 'BANKEX', token: '12', exchange: 'BSE', lotSize: 15 },
];

export const RESOLUTIONS: { label: string; value: CandleResolution }[] = [
  { label: '1m', value: CandleResolution.ONE_MIN },
  //   { label: '3m', value: CandleResolution.THREE_MIN },
  //   { label: '5m', value: CandleResolution.FIVE_MIN },
  //   { label: '15m', value: CandleResolution.FIFTEEN_MIN },
  //   { label: '30m', value: CandleResolution.THIRTY_MIN },
  //   { label: '1h', value: CandleResolution.ONE_HOUR },
  { label: '1D', value: CandleResolution.ONE_DAY },
];

// ── Technical levels ──────────────────────────────────────────────

export interface SupportResistance {
  level: number;
  type: 'support' | 'resistance';
  strength: 'strong' | 'moderate' | 'weak';
  touchCount: number;
}

export interface PivotLevels {
  pp: number; // Pivot Point
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  bc: number; // Camarilla BC
  tc: number; // Camarilla TC
}

export interface OpeningRange {
  high: number;
  low: number;
  midpoint: number;
  rangeSize: number;
  breakoutUp: number; // OR high + range
  breakoutDown: number; // OR low  - range
}

// ── Signal ────────────────────────────────────────────────────────

export interface TradeSignal {
  time: string; // HH:MM
  type: SignalType;
  reason: string;
  entry: number;
  target: number;
  stopLoss: number;
  riskReward: number;
  session: SessionPhase;
  actualPnl?: number; // filled from trade history if trade was taken
  wasTaken?: boolean;
}

// ── Session stats ─────────────────────────────────────────────────

export interface SessionStats {
  phase: SessionPhase;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trend: TrendDirection;
  volatility: number; // (high - low) / open * 100
  candles: Candle[];
}

// ── Intraday analysis ─────────────────────────────────────────────

export interface IntradayAnalysis {
  date: string;
  instrument: AnalyticsInstrument;
  resolution: CandleResolution;
  candles: Candle[];

  // OHLC
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  dayClose: number;
  priceRange: number;
  rangePercent: number;

  // Opening range (first 30 min)
  openingRange: OpeningRange;

  // Levels
  pivots: PivotLevels;
  supports: SupportResistance[];
  resistances: SupportResistance[];

  // Signals
  signals: TradeSignal[];
  bestBuySignal?: TradeSignal;
  bestSellSignal?: TradeSignal;

  // Market behaviour
  overallTrend: TrendDirection;
  trendStrength: number; // 0-100 ADX-like
  sessionStats: SessionStats[];
  gapType: 'gap_up' | 'gap_down' | 'flat';
  gapPercent: number;

  // Overlaid trades (from Supabase)
  myTrades?: OverlaidTrade[];
  myDayPnl?: number;
}

// ── Daily overview ────────────────────────────────────────────────

export interface DailyOverview {
  date: string;
  instrument: AnalyticsInstrument;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePct: number;
  volume: number;
  trend: TrendDirection;
  myTrades?: number; // count of trades taken
  myPnl?: number;
}

// ── My trades overlaid on chart ───────────────────────────────────

export interface OverlaidTrade {
  time: string; // approximate from order time
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  pnl: number;
  tradingSymbol: string;
}

// ── Page state ────────────────────────────────────────────────────

export interface AnalyticsState {
  instrument: AnalyticsInstrument;
  date: string;
  resolution: CandleResolution;
  activeFrame: AnalyticsTimeframe;
}
