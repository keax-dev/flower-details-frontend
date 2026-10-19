import { FulfillmentType } from '@features/order/models/fulfillment-type.model';
import { OrderStatus } from '@features/order/models/order-status.model';

export interface DashboardStatusCount {
  status: OrderStatus;
  total: number;
}
export interface DashboardRecentOrder {
  id: number;
  orderNumber: string;
  contactName: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  total: number;
  createdAt: string;
}
export interface DashboardOverview {
  ordersInPeriod: number;
  salesInPeriod: number;
  pendingOrders: number;
  cancelledInPeriod: number;
  ordersByStatus: readonly DashboardStatusCount[];
  recentOrders: readonly DashboardRecentOrder[];
}
