import { FulfillmentType } from '@features/order/models/fulfillment-type.model';
import { OrderStatus } from '@features/order/models/order-status.model';

export interface OrderQuery {
  q?: string;
  customerId?: number;
  operatorId?: number;
  status?: OrderStatus;
  fulfillmentType?: FulfillmentType;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'createdAt' | 'total' | 'status';
  direction?: 'asc' | 'desc';
}
