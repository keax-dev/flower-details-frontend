import { OrderStatus } from '@features/order/models/order-status.model';

export interface OrderAudit {
  id: number;
  actorUserId: number;
  action: 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'CANCELLED';
  previousStatus: OrderStatus | null;
  currentStatus: OrderStatus | null;
  details: string | null;
  createdAt: string;
}
