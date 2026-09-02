import { describe, expect, it } from 'vitest';

import { nextOrderStatus, orderStatusLabel } from '@features/order/models/order-status.config';

describe('order status configuration', () => {
  it('follows the pickup order workflow', () => {
    expect(nextOrderStatus('ASSIGNED', 'PICKUP')).toBe('IN_PREPARATION');
    expect(nextOrderStatus('IN_PREPARATION', 'PICKUP')).toBe('READY_FOR_DELIVERY');
    expect(nextOrderStatus('READY_FOR_DELIVERY', 'PICKUP')).toBe('DELIVERED');
  });

  it('requires delivery orders to go through the dispatch status', () => {
    expect(nextOrderStatus('READY_FOR_DELIVERY', 'DELIVERY')).toBe('ON_THE_WAY');
    expect(nextOrderStatus('ON_THE_WAY', 'DELIVERY')).toBe('DELIVERED');
  });

  it('does not allow a transition from generated or final states', () => {
    expect(nextOrderStatus('GENERATED', 'DELIVERY')).toBeNull();
    expect(nextOrderStatus('DELIVERED', 'DELIVERY')).toBeNull();
    expect(nextOrderStatus('CANCELLED', 'PICKUP')).toBeNull();
    expect(orderStatusLabel('READY_FOR_DELIVERY')).toBe('Listo para Entrega');
  });
});
