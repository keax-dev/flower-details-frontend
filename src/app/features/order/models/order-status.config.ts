import { FulfillmentType } from '@features/order/models/fulfillment-type.model';
import { OrderStatus } from '@features/order/models/order-status.model';

export const ORDER_STATUS_OPTIONS: readonly { value: OrderStatus; label: string }[] = [
  { value: 'GENERATED', label: 'Generado' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'IN_PREPARATION', label: 'En Preparación' },
  { value: 'READY_FOR_DELIVERY', label: 'Listo para Entrega' },
  { value: 'ON_THE_WAY', label: 'En Camino' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export const FULFILLMENT_TYPE_OPTIONS: readonly { value: FulfillmentType; label: string }[] = [
  { value: 'PICKUP', label: 'Retiro en Local' },
  { value: 'DELIVERY', label: 'Entrega a Domicilio' },
];

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function fulfillmentTypeLabel(type: FulfillmentType): string {
  return FULFILLMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function nextOrderStatus(status: OrderStatus, fulfillmentType: FulfillmentType): OrderStatus | null {
  switch (status) {
    case 'ASSIGNED':
      return 'IN_PREPARATION';
    case 'IN_PREPARATION':
      return 'READY_FOR_DELIVERY';
    case 'READY_FOR_DELIVERY':
      return fulfillmentType === 'DELIVERY' ? 'ON_THE_WAY' : 'DELIVERED';
    case 'ON_THE_WAY':
      return 'DELIVERED';
    default:
      return null;
  }
}
