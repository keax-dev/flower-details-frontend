import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationService } from '@core/notification/notification.service';
import { AuthService } from '@features/auth/application/auth.service';
import { Order } from '@features/order/models/order.model';
import { OrderDetailDialog } from '@features/order/presentation/order-detail-dialog/order-detail-dialog';
import { OrderApiService } from '@features/order/services/order-api.service';
import { OperatorApiService } from '@features/operator/services/operator-api.service';
import { of } from 'rxjs';

const ORDER: Order = {
  id: 12,
  orderNumber: 'PED-000012',
  customerId: 3,
  assignedOperatorId: 5,
  status: 'ASSIGNED',
  fulfillmentType: 'DELIVERY',
  total: 45,
  contactName: 'Maria Perez',
  contactPhone: '0999999999',
  deliveryAddress: 'Av. Principal 123',
  additionalInstructions: null,
  cancellationReason: null,
  createdAt: '2026-01-01T00:00:00Z',
  assignedAt: '2026-01-01T00:10:00Z',
  preparationStartedAt: null,
  readyAt: null,
  dispatchedAt: null,
  deliveredAt: null,
  cancelledAt: null,
  items: [],
};

async function createComponent(role: 'ADMIN' | 'OPERATOR' = 'ADMIN') {
  const user = signal({
    id: role === 'ADMIN' ? 1 : 5,
    personId: 10,
    names: 'Ana',
    lastNames: 'Perez',
    email: 'ana@example.com',
    phone: '0999999999',
    role,
  });
  const orderApiService = {
    getById: vi.fn(() => of(ORDER)),
    getAuditTrail: vi.fn(() => of([])),
    assign: vi.fn(() => of(ORDER)),
    changeStatus: vi.fn(() => of(ORDER)),
    cancel: vi.fn(() => of(void 0)),
  };
  const operatorApiService = { list: vi.fn(() => of({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 })) };
  const notificationService = { success: vi.fn(), errorApi: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [OrderDetailDialog],
    providers: [
      { provide: AuthService, useValue: { user } },
      { provide: OrderApiService, useValue: orderApiService },
      { provide: OperatorApiService, useValue: operatorApiService },
      { provide: NotificationService, useValue: notificationService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(OrderDetailDialog);
  return { fixture, notificationService, operatorApiService, orderApiService };
}

describe('OrderDetailDialog', () => {
  it('loads the order, audit trail and active operators when an administrator opens it', async () => {
    const { fixture, operatorApiService, orderApiService } = await createComponent();
    fixture.componentInstance['loadOrder'](ORDER.id);
    fixture.componentInstance['loadOperators']();

    expect(orderApiService.getById).toHaveBeenCalledWith(ORDER.id);
    expect(orderApiService.getAuditTrail).toHaveBeenCalledWith(ORDER.id);
    expect(operatorApiService.list).toHaveBeenCalledWith(0, 100);
    expect(fixture.componentInstance['order']()).toEqual(ORDER);
  });

  it('assigns an order only after an administrator selects an operator', async () => {
    const { fixture, notificationService, orderApiService } = await createComponent();
    fixture.componentInstance['order'].set({ ...ORDER, status: 'GENERATED', assignedOperatorId: null });

    fixture.componentInstance['assign']();
    expect(orderApiService.assign).not.toHaveBeenCalled();

    fixture.componentInstance['actionForm'].controls.operatorId.setValue(7);
    fixture.componentInstance['assign']();

    expect(orderApiService.assign).toHaveBeenCalledWith(ORDER.id, 7);
    expect(notificationService.success).toHaveBeenCalledWith('Pedido asignado correctamente.');
  });

  it('lets the assigned operator advance the order but not cancel it', async () => {
    const { fixture, orderApiService } = await createComponent('OPERATOR');
    fixture.componentInstance['order'].set(ORDER);

    expect(fixture.componentInstance['canChangeStatus']()).toBe(true);
    expect(fixture.componentInstance['canCancel']()).toBe(false);
    fixture.componentInstance['advanceStatus']();

    expect(orderApiService.changeStatus).toHaveBeenCalledWith(ORDER.id, 'IN_PREPARATION');
  });

  it('requires a cancellation reason before an administrator can cancel an order', async () => {
    const { fixture, orderApiService } = await createComponent();
    fixture.componentInstance['order'].set(ORDER);

    fixture.componentInstance['cancel']();
    expect(orderApiService.cancel).not.toHaveBeenCalled();

    fixture.componentInstance['actionForm'].controls.cancellationReason.setValue('El cliente cambió de planes.');
    fixture.componentInstance['cancel']();
    expect(orderApiService.cancel).toHaveBeenCalledWith(ORDER.id, 'El cliente cambió de planes.');
  });
});
