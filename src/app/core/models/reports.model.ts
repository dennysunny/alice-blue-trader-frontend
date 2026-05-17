// ── Database row shapes (match Supabase table columns exactly) ──────

export interface DailyReportRow {
  id?: string;
  user_id: string;
  date: string; // 'YYYY-MM-DD'
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  total_pnl: number;
  gross_profit: number;
  gross_loss: number;
  total_brokerage: number;
  total_quantity: number;
  max_drawdown: number;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  net_pnl: number;
  avg_win: number;
  avg_loss: number;
  expectancy: number;
  win_rate: number;
  risk_reward: number;
  biggest_win: number;
  biggest_loss: number;
  profit_factor: number;
  trading_time_minutes: number | null;
  psychology_score?: number | null;
  market_condition?: string | null;
}

export interface TradeRow {
  id?: string;
  user_id: string;
  date: string;
  instrument_id: string;
  trading_symbol: string;
  exchange: string;
  transaction_type: 'BUY' | 'SELL';
  product: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
  pnl: number;
  brokerage: number;
  order_id?: string | null;
  created_at?: string | null;
  gross_pnl?: number | null;
  net_pnl?: number | null;
  brokerage_charges?: number | null;
  transaction_charges?: number | null;
  gst?: number | null;
  stt?: number | null;
  sebi_charges?: number | null;
  stamp_duty?: number | null;
  strategy?: string | null;
  setup_type?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
  emotions?: string | null;
  mistakes?: string | null;
  lessons?: string | null;
  tags?: string[] | null;
  status?: string | null;
  trade_side?: string | null;
}

export interface TradingRulesRow {
  id?: string;
  user_id: string;
  max_trades_per_day: number;
  max_loss_per_day: number;
  max_loss_per_trade: number;
  max_quantity_per_trade: number;
  target_per_day?: number | null;
  notes?: string | null;
  updated_at?: string | null;
  allowed_segments?: string[] | null;
  enforce_stoploss?: boolean;
  enforce_target?: boolean;
  allow_revenge_trading?: boolean;
  cooldown_minutes?: number;
  max_consecutive_losses?: number;
  max_daily_drawdown?: number;
}

// ── View models (enriched for UI) ────────────────────────────────

export interface DayReport extends DailyReportRow {
  winRate: number; // %
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  ruleViolations: RuleViolation[];
  outcome: DayOutcome;
}

export interface RuleViolation {
  rule: RuleType;
  limit: number;
  actual: number;
  label: string;
}

export interface MonthSummary {
  year: number;
  month: number; // 0-based
  monthLabel: string;
  tradingDays: number;
  profitDays: number;
  lossDays: number;
  totalPnl: number;
  totalTrades: number;
  totalQuantity: number;
  winRate: number;
  bestDay: DayReport | null;
  worstDay: DayReport | null;
  days: DayReport[];
}

export interface YearSummary {
  year: number;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  months: MonthSummary[];
}

export interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  report?: DayReport;
  hasViolation: boolean;
}

// ── Enums ─────────────────────────────────────────────────────────

export enum DayOutcome {
  PROFIT = 'profit',
  LOSS = 'loss',
  BREAKEVEN = 'breakeven',
  NO_TRADE = 'no_trade',
}

export enum RuleType {
  MAX_TRADES = 'max_trades',
  MAX_LOSS = 'max_loss',
  MAX_LOSS_TRADE = 'max_loss_trade',
  MAX_QUANTITY = 'max_quantity',
}

export enum ReportTab {
  CALENDAR = 'calendar',
  DAILY = 'daily',
  LEDGER = 'ledger',
  CHARTS = 'charts',
}

export enum ChartPeriod {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all',
}
