import { ChartResolution } from '../../../core/enums/app.enums';
import { ExchOption, IntervalOption } from '../../../core/models/option-chain.model';
import { OptionChainExchange, OptionChainInterval } from './stock.enum';

export const ChartResolutionConfig: { label: string; value: ChartResolution }[] = [
  { label: '1m', value: ChartResolution.ONE_MIN },
  // { label: '5m', value: ChartResolution.FIVE_MIN },
  // { label: '15m', value: ChartResolution.FIFTEEN_MIN },
  // { label: '30m', value: ChartResolution.THIRTY_MIN },
  // { label: '1h', value: ChartResolution.ONE_HOUR },
  { label: '1D', value: ChartResolution.ONE_DAY },
];

export const ExchangeOptions: ExchOption[] = [
  { label: 'NSE F&O', value: OptionChainExchange.NSE_FO },
  { label: 'BSE F&O', value: OptionChainExchange.BSE_FO },
  { label: 'MCX F&O', value: OptionChainExchange.MCX_FO },
];

export const IntervalOptions: IntervalOption[] = [
  { label: '5', value: OptionChainInterval.FIVE },
  { label: '10', value: OptionChainInterval.TEN },
  { label: '15', value: OptionChainInterval.FIFTEEN },
  { label: '20', value: OptionChainInterval.TWENTY },
  { label: '25', value: OptionChainInterval.TWENTY_FIVE },
];
