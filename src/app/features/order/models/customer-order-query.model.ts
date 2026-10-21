import { OrderQuery } from '@features/order/models/order-query.model';

export type CustomerOrderQuery = Omit<OrderQuery, 'customerId' | 'operatorId'>;
