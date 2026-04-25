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
