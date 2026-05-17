import { ErrorCode } from '../enums/api.enums';
import { AuthState } from '../models/auth.models';
import { TradingProfile } from '../models/profile.model';

export const API_CONFIG = {
  REST_BASE_URL: 'https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api',
  WEBSOCKET_URL: 'wss://ws1.aliceblueonline.com/NorenWS/',
  AUTH_URL: 'https://ant.aliceblueonline.com',
  REDIRECT_URL: 'https://ant.aliceblueonline.com/plugin/callback',
  GET_USER_DETAILS: 'https://ant.aliceblueonline.com/open-api/od/v1/vendor/getUserDetails',
  CLOUD_API_BASE_URL: 'https://alice-blue-backend.onrender.com',
  BASE_URL: 'http://localhost:3000',
  //BASE_URL: 'https://aliceblue-trader-backend.onrender.com',
  //BASE_URL: 'https://a3.aliceblueonline.com',
  PROXY_URL: '/api/shell',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN_REDIRECT: '/?appcode=',
    GET_USER_DETAILS: '/vendor/getUserDetails',
    BE_GET_USER_DETAILS: '/api/auth/create-session',
    CREATE_WS_SESSION: '/profile/createWsSess',
    LOGOUT: '/logout',
  },
  ORDERS: {
    PLACE_ORDER: '/orders/placeorder',
    ORDER_BOOK: '/orders/book',
    ORDER_HISTORY: '/orders/history',
    MODIFY_ORDER: '/orders/modify',
    CANCEL_ORDER: '/orders/cancel',
    TRADE_BOOK: '/orders/trades',
    MARGIN_CALCULATOR: '/order/getMarginCalculator',
    CREATE_ORDER_WS_TOKEN: '/order-notify/ws/createWsToken',
  },
  PORTFOLIO: {
    GET_HOLDINGS: '/holdings',
    GET_POSITIONS: '/positions',
    CLOSE_OPEN_POSITION: '/orders/positions/sqroff',
    CONVERSION: '/conversion',
  },
  FUNDS: {
    GET_FUNDS: '/limits',
  },
  MARKET: {
    SEARCH_SYMBOL: '/market/search',
    QUOTE: '/market/quote',
    MASTER_CONTRACT: '/market/masterContract',
  },
  WATCHLIST: {
    GET_ALL: '/marketWatch/fetchMWList',
    GET_SCRIPS: '/marketWatch/fetchMWScrips',
    ADD_SCRIP: '/marketWatch/addScripToMW',
    DELETE_SCRIP: '/marketWatch/deleteMWScrip',
  },
  PROFILE: {
    GET_PROFILE: '/profile',
  },
  HISTORY: {
    CHART_HISTORY: '/chart/history',
  },
  OPTION_CHAIN: {
    UNDERLYING: '/getUnderlying',
    UNDERLYING_EXPIRIES: '/getUnderlyingExp',
    OPTION_CHAIN: '/getOptionChain',
  },
} as const;

export const APP_CONSTANTS = {
  SESSION_VALIDITY_HOURS: 24,
  WEBSOCKET_RECONNECT_DELAY_MS: 3000,
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS: 5,
  TOAST_DURATION_MS: 4000,
  DEBOUNCE_SEARCH_MS: 300,
  MARKET_OPEN_HOUR: 9,
  MARKET_OPEN_MINUTE: 15,
  MARKET_CLOSE_HOUR: 15,
  MARKET_CLOSE_MINUTE: 30,
  DEFAULT_QUANTITY: 1,
  MAX_WATCHLIST_SYMBOLS: 50,
  PRICE_DECIMAL_PLACES: 2,
  PERCENTAGE_DECIMAL_PLACES: 2,
  CHART_CANDLE_LIMIT: 500,
  MAX_DEPTH_ROWS: 5,
} as const;

export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
};

export const ERRORS = {
  HTTP_UNAUTHORIZED: 401,
  HTTP_FORBIDDEN: 403,
  UNAUTHORIZED: 'Unauthorized',
};

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.GENERIC]: 'An error occurred. Please try again later.',
  [ErrorCode.INVALID_EXCHANGE_EMPTY]: "'exchange' cannot be empty or null.",
  [ErrorCode.INVALID_EXCHANGE_VALUE]:
    "'exchange' should be one of the following values: NSE, BSE, MCX, NFO, BFO, CDS, BCD.",
  [ErrorCode.TRADING_SYMBOL_EMPTY]: "'tradingSymbol' cannot be empty or null.",
  [ErrorCode.QUANTITY_EMPTY]: "'quantity' cannot be empty or null.",
  [ErrorCode.QUANTITY_INVALID]: "'quantity' should be a positive number.",
  [ErrorCode.PRODUCT_EMPTY]: "'product' cannot be empty or null.",
  [ErrorCode.TRANSACTION_TYPE_EMPTY]: "'transactionType' cannot be empty or null.",
  [ErrorCode.TOKEN_EMPTY]: "'token' cannot be empty or null.",
  [ErrorCode.DISCLOSED_QTY_EMPTY]: "'disclosedQty' cannot be empty or null.",
  [ErrorCode.PRICE_EMPTY]: "'price' cannot be empty or null.",
  [ErrorCode.TRIGGER_PRICE_EMPTY]: "'triggerPrice' cannot be empty or null.",
  [ErrorCode.ORDER_FAILED]: 'Failed to place the order.',
  [ErrorCode.USER_DETAILS_FAILED]: 'Failed to retrieve user details.',
  [ErrorCode.REQUEST_PARAM_EMPTY]: "'Request parameter' cannot be empty or null.",
  [ErrorCode.ORDER_BOOK_FAILED]: 'Failed to retrieve the order book.',
  [ErrorCode.NO_ORDERS]: 'No orders found for this user.',
  [ErrorCode.SESSION_EXPIRED]: 'Session Expired',
};

export const INITIAL_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  sessionId: null,
  loading: false,
  error: null,
};

export const MOCK_TRADING_PROFILE: TradingProfile = {
  clientId: 'AB123456',
  clientName: 'Denny Sunny',
  isTotpEnabled: 'Y',
  isPoaProvided: 'N',
  accountStatus: 'Activated',
  exchanges: ['NSE', 'NFO', 'BSE', 'BFO', 'MCX', 'CDS'],
  products: ['INTRADAY', 'LONGTERM', 'MTF', 'CO', 'BO'],
  orderComplexity: ['REGULAR', 'AMO', 'BO', 'CO'],
};
