import { FulfillmentType } from '@features/order/models/fulfillment-type.model';
import { OrderItem } from '@features/order/models/order-item.model';
import { OrderStatus } from '@features/order/models/order-status.model';

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  assignedOperatorId: number | null;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  total: number;
  contactName: string;
  contactPhone: string;
  deliveryAddress: string | null;
  additionalInstructions: string | null;
  cancellationReason: string | null;
  createdAt: string;
  assignedAt: string | null;
  preparationStartedAt: string | null;
  readyAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: readonly OrderItem[];
}
