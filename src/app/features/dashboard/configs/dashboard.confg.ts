import { OrderStatus } from '../../../core/enums/api.enums';
import { StatCardConfig, StatusCard } from '../../../core/models/dashboard.model';
import { BadgeVariant } from '../../../shared/enums/ui.enums';
import { StatusCardLabel } from './dashboard.enum';

export const statusTypes: Record<string, BadgeVariant> = {
  [OrderStatus.COMPLETE]: BadgeVariant.SUCCESS,
  [OrderStatus.OPEN]: BadgeVariant.INFO,
  [OrderStatus.CANCELLED]: BadgeVariant.NEUTRAL,
  [OrderStatus.REJECTED]: BadgeVariant.DANGER,
  [OrderStatus.TRIGGER_PENDING]: BadgeVariant.WARNING,
};

export const mockStatusCards: StatusCard[] = [
  { label: StatusCardLabel.AVAILABLE_MARGIN, value: '—' },
  { label: StatusCardLabel.PORTFOLIO_PNL, value: '—', isPositive: null },
  { label: StatusCardLabel.OPEN_ORDERS, value: '—' },
  { label: StatusCardLabel.HOLDINGS, value: '—' },
];

export const statusCardConfig: StatCardConfig[] = [
  {
    label: StatusCardLabel.AVAILABLE_MARGIN,
    type: 'currency',
    getValue: ({ funds }) => funds?.tradingLimit ?? 0,
  },
  {
    label: StatusCardLabel.PORTFOLIO_PNL,
    type: 'pnl',
    getValue: ({ positions }) => positions.reduce((s, p) => s + p.realizedPnl, 0),
  },
  {
    label: StatusCardLabel.OPEN_ORDERS,
    type: 'count',
    getValue: ({ orders }) => orders.filter((o) => o.status === OrderStatus.OPEN).length,
    getSubValue: ({ orders }) => `${orders.length} total`,
  },
  {
    label: StatusCardLabel.HOLDINGS,
    type: 'count',
    getValue: ({ holdings }) => holdings.length,
    getSubValue: () => 'Instruments',
  },
];
