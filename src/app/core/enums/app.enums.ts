export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum RouteSegment {
  AUTH = 'auth',
  LOGIN = 'login',
  CALLBACK = 'callback',
  DASHBOARD = 'dashboard',
  WATCHLIST = 'watchlist',
  ORDERS = 'orders',
  PORTFOLIO = 'portfolio',
  POSITIONS = 'positions',
  FUNDS = 'funds',
  STOCK = 'stock',
}

export enum StorageKey {
  AUTH_TOKEN = 'ant_auth_token',
  USER_ID = 'ant_user_id',
  THEME = 'ant_theme',
  WATCHLIST = 'ant_watchlist',
}

export enum NavItem {
  DASHBOARD = 'Dashboard',
  WATCHLIST = 'Watchlist',
  ORDERS = 'Orders',
  PORTFOLIO = 'Portfolio',
  POSITIONS = 'Positions',
  FUNDS = 'Funds',
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export enum MarketStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PRE_MARKET = 'PRE_MARKET',
  POST_MARKET = 'POST_MARKET',
}

export enum ChartResolution {
  ONE_MIN = '1',
  FIVE_MIN = '5',
  FIFTEEN_MIN = '15',
  THIRTY_MIN = '30',
  ONE_HOUR = '60',
  ONE_DAY = 'D',
}

export enum OptionType {
  CE = 'CE',
  PE = 'PE',
}
