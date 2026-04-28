import { FundsLimits } from './funds.models';
import { Order } from './order.models';
import { Holding, Position } from './portfolio.models';

export interface StatusCard {
  label: string;
  value: string;
  subValue?: string;
  isPositive?: boolean | null;
}

export type StatusCardTypes = 'currency' | 'pnl' | 'count';

export interface StatContext {
  holdings: Holding[];
  orders: Order[];
  funds: FundsLimits | null;
  positions: Position[];
}
export interface StatCardConfig {
  label: string;
  type: StatusCardTypes;
  getValue: (ctx: StatContext) => number;
  getSubValue?: (ctx: StatContext) => string;
}
