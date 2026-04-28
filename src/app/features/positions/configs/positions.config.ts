import { SelectionConfig } from '../../../shared/models/ui.models';
import { PositionTabNames } from './positions.enum';

export const positionTypesConfig: SelectionConfig[] = [
  {
    id: 'day',
    text: PositionTabNames.DAY,
  },
  {
    id: 'net',
    text: PositionTabNames.NET,
  },
];
