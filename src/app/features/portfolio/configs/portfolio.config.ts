import { HoldingsProductType, ProductType } from '../../../core/enums/api.enums';
import { SelectionConfig } from '../../../shared/models/ui.models';

export const holdingTypesConfig: SelectionConfig[] = [
  {
    id: HoldingsProductType.INTRADAY,
    text: ProductType.INTRADAY,
  },
  {
    id: HoldingsProductType.LONGTERM,
    text: ProductType.LONGTERM,
  },
  {
    id: HoldingsProductType.MTF,
    text: ProductType.MTF,
  },
];
