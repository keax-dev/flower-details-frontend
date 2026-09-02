import { FulfillmentType } from '@features/order/models/fulfillment-type.model';
import { OrderStatus } from '@features/order/models/order-status.model';

export interface OrderQuery {
  q?: string;
  status?: OrderStatus;
  fulfillmentType?: FulfillmentType;
}
