export const API_CONFIG = {
  REST_BASE_URL: 'https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api',
  WEBSOCKET_URL: 'wss://ws1.aliceblueonline.com/NorenWS/',
  AUTH_URL: 'https://ant.aliceblueonline.com',
  REDIRECT_URL: 'https://ant.aliceblueonline.com/plugin/callback',
  GET_USER_DETAILS: 'https://ant.aliceblueonline.com/open-api/od/v1/vendor/getUserDetails',
  CLOUD_API_BASE_URL: 'https://alice-blue-backend.onrender.com',
  BASE_URL: 'http://localhost:3000',
  //BASE_URL: 'https://a3.aliceblueonline.com',
  PROXY_URL: '/api/shell'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN_REDIRECT: '/?appcode=',
    GET_USER_DETAILS: '/vendor/getUserDetails',
    BE_GET_USER_DETAILS: '/api/auth/create-session',
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
  },
  PORTFOLIO: {
    GET_HOLDINGS: '/holdings',
    GET_POSITIONS: '/positions',
    CLOSE_OPEN_POSITION: '/orders/positions/sqroff',
    CONVERSION: '/conversion',
  },
  FUNDS: {
    GET_FUNDS: '/limits'
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
    GET_PROFILE: '/profile'
  }
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
} as const;

export const API_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT"
}
