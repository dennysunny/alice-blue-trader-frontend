import { FundsRow } from '../../../core/models/funds.models';
import { FundsField, FundsLabel } from './funds.enum';

export const fundRowsConfig: FundsRow[] = [
  {
    key: FundsField.TRADING_LIMIT,
    label: FundsLabel.TRADING_LIMIT,
    highlight: true,
  },
  {
    key: FundsField.OPENING_CASH_LIMIT,
    label: FundsLabel.OPENING_CASH_LIMIT,
  },
  {
    key: FundsField.UTILIZED_MARGIN,
    label: FundsLabel.UTILIZED_MARGIN,
  },
  {
    key: FundsField.UTILIZED_SPAN_MARGIN,
    label: FundsLabel.UTILIZED_SPAN_MARGIN,
  },
  {
    key: FundsField.UTILIZED_EXPOSURE_MARGIN,
    label: FundsLabel.UTILIZED_EXPOSURE_MARGIN,
  },
  {
    key: FundsField.COLLATERAL_MARGIN,
    label: FundsLabel.COLLATERAL_MARGIN,
  },
  {
    key: FundsField.ADHOC_MARGIN,
    label: FundsLabel.ADHOC_MARGIN,
  },
] as const;
