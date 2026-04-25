import { OrderStatus } from '../../../core/enums/api.enums';
import { BadgeVariant } from '../../../shared/enums/ui.enums';

export const StatusVarientConfig: Record<string, BadgeVariant> = {
  [OrderStatus.COMPLETE]: BadgeVariant.SUCCESS,
  [OrderStatus.OPEN]: BadgeVariant.INFO,
  [OrderStatus.CANCELLED]: BadgeVariant.NEUTRAL,
  [OrderStatus.REJECTED]: BadgeVariant.DANGER,
  [OrderStatus.TRIGGER_PENDING]: BadgeVariant.WARNING,
  [OrderStatus.MODIFIED]: BadgeVariant.INFO,
};
