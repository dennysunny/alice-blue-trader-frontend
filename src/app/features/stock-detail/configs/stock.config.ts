import { ChartResolution } from '../../../core/enums/app.enums';

export const ChartResolutionConfig: { label: string; value: ChartResolution }[] = [
  { label: '1m', value: ChartResolution.ONE_MIN },
  // { label: '5m', value: ChartResolution.FIVE_MIN },
  // { label: '15m', value: ChartResolution.FIFTEEN_MIN },
  // { label: '30m', value: ChartResolution.THIRTY_MIN },
  // { label: '1h', value: ChartResolution.ONE_HOUR },
  { label: '1D', value: ChartResolution.ONE_DAY },
];
