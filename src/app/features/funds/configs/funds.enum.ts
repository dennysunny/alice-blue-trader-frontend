export enum FundsField {
  // Core balances
  TRADING_LIMIT = 'tradingLimit',
  OPENING_CASH_LIMIT = 'openingCashLimit',

  // Credits & inflows
  INTRADAY_PAYIN = 'intradayPayin',
  CREDIT_FOR_SELL = 'creditForSell',

  // Margins
  COLLATERAL_MARGIN = 'collateralMargin',
  ADHOC_MARGIN = 'adhocMargin',

  // Utilization
  UTILIZED_MARGIN = 'utilizedMargin',
  UTILIZED_SPAN_MARGIN = 'utilizedSpanMargin',
  UTILIZED_EXPOSURE_MARGIN = 'utilizedExposureMargin',

  // Blocks
  BLOCKED_FOR_PAYOUT = 'blockedForPayout',
}

export enum FundsLabel {
  // Core balances
  TRADING_LIMIT = 'Available Margin',
  OPENING_CASH_LIMIT = 'Opening Balance',

  // Credits & inflows
  INTRADAY_PAYIN = 'Intraday Payin',
  CREDIT_FOR_SELL = 'Credit for Sell',

  // Margins
  COLLATERAL_MARGIN = 'Collateral',
  ADHOC_MARGIN = 'Adhoc Margin',

  // Utilization
  UTILIZED_MARGIN = 'Utilized Margin',
  UTILIZED_SPAN_MARGIN = 'SPAN Margin',
  UTILIZED_EXPOSURE_MARGIN = 'Exposure Margin',

  // Blocks
  BLOCKED_FOR_PAYOUT = 'Blocked for Payout',
}
