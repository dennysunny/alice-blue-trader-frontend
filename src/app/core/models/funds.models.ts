import { Segments } from '../../shared/types/shared-types';

export interface FundsLimits {
  // Core balances
  tradingLimit: number;
  openingCashLimit: number;

  // Credits & inflows
  intradayPayin: number;
  creditForSell: number;

  // Margins
  collateralMargin: number;
  adhocMargin: number;

  // Utilization
  utilizedMargin: number;
  utilizedSpanMargin: number;
  utilizedExposureMargin: number;

  // Blocks
  blockedForPayout: number;
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

export interface FundsRow {
  label: string;
  key: keyof FundsLimits;
  value?: number;
  highlight?: boolean;
}

export interface FundGroups {
  segment: Segments;
  rows: FundsRow[];
}
