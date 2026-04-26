export enum Exchange {
  NSE = 'NSE',
  BSE = 'BSE',
  NFO = 'NFO',
  MCX = 'MCX',
  CDS = 'CDS',
  BFO = 'BFO',
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_LOSS = 'SL',
  STOP_LOSS_MARKET = 'SL-M',
}

export enum ProductType {
  INTRADAY = 'INTRADAY',
  DELIVERY = 'DELIVERY',
  LONGTERM = 'LONGTERM',
  COVER_ORDER = 'CO',
  BRACKET_ORDER = 'BO',
  MTF = 'MTF',
}

export enum HoldingsProductType {
  LONGTERM = 'cnc',
  MTF = 'mtf',
  INTRADAY = 'mis',
}

export enum OrderComplexity {
  REGULAR = 'REGULAR',
  AMO = 'AMO',
  CO = 'CO',
  BO = 'BO',
}

export enum Validity {
  DAY = 'DAY',
  IOC = 'IOC',
  EOS = 'EOS',
}

export enum OrderStatus {
  OPEN = 'open',
  COMPLETE = 'complete',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  TRIGGER_PENDING = 'trigger pending',
  MODIFIED = 'modified',
}

export enum ApiStatus {
  OK = 'Ok',
  ERROR = 'error',
}

export enum WebSocketMessageType {
  CONNECTION_ACK = 'ck',
  TOKEN_ACK = 'tk',
  FEED = 'tf',
  DEPTH = 'dp',
  ORDER_UPDATE = 'os',
}

export enum LiveFeedType {
  MARKET_DATA = 'marketdata',
  COMPACT = 'compact',
  SNAPQUOTE = 'snapquote',
  FULL_SNAP_QUOTE = 'fullsnapquote',
}

export enum ErrorCode {
  GENERIC = 'EC003',
  INVALID_EXCHANGE_EMPTY = 'EC900',
  INVALID_EXCHANGE_VALUE = 'EC901',
  TRADING_SYMBOL_EMPTY = 'EC902',
  QUANTITY_EMPTY = 'EC903',
  QUANTITY_INVALID = 'EC904',
  PRODUCT_EMPTY = 'EC906',
  TRANSACTION_TYPE_EMPTY = 'EC907',
  TOKEN_EMPTY = 'EC908',
  DISCLOSED_QTY_EMPTY = 'EC909',
  PRICE_EMPTY = 'EC910',
  TRIGGER_PRICE_EMPTY = 'EC911',
  ORDER_FAILED = 'EC912',
  USER_DETAILS_FAILED = 'EC913',
  REQUEST_PARAM_EMPTY = 'EC914',
  ORDER_BOOK_FAILED = 'EC915',
  NO_ORDERS = 'EC916',
  SESSION_EXPIRED = 'EC087',
}
