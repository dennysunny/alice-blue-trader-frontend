export interface FundsLimits {
  adhocMargin: number;
  blockedForPayout: number;
  collateralMargin: number;
  creditForSell: number;
  intradayPayin: number;
  openingCashLimit: number;
  tradingLimit: number;
  utilizedExposureMargin: number;
  utilizedMargin: number;
  utilizedSpanMargin: number;
}

export interface FundsSummary {
  availableMargin: number;
  usedMargin: number;
  totalBalance: number;
  cashBalance: number;
  collateral: number;
  marginUtilized: number;
  openingBalance: number;
}
