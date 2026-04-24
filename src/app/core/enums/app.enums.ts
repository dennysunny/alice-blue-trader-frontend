export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum RouteSegment {
  AUTH = 'auth',
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  WATCHLIST = 'watchlist',
  ORDERS = 'orders',
  PORTFOLIO = 'portfolio',
  POSITIONS = 'positions',
  FUNDS = 'funds',
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
