import { FulfillmentType } from '@features/order/models/fulfillment-type.model';

export interface CreateOrderRequest {
  fulfillmentType: FulfillmentType;
  contactName: string;
  contactPhone: string;
  deliveryAddress: string | null;
  additionalInstructions: string | null;
}
