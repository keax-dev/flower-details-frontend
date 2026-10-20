import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@core/notification/notification.service';
import { Order } from '@features/order/models/order.model';
import { OrderList } from '@features/order/presentation/order-list/order-list';
import { OrderApiService } from '@features/order/services/order-api.service';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { of } from 'rxjs';

const ORDER: Order = {
  id: 12,
  orderNumber: 'PED-000012',
  customerId: 3,
  assignedOperatorId: null,
  status: 'GENERATED',
  fulfillmentType: 'DELIVERY',
  total: 45,
  contactName: 'Maria Perez',
  contactPhone: '0999999999',
  deliveryAddress: 'Av. Principal 123',
  additionalInstructions: null,
  cancellationReason: null,
  createdAt: '2026-01-01T00:00:00Z',
  assignedAt: null,
  preparationStartedAt: null,
  readyAt: null,
  dispatchedAt: null,
  deliveredAt: null,
  cancelledAt: null,
  items: [],
};

const PAGE: PageResponse<Order> = { items: [ORDER], page: 0, size: 10, totalElements: 11, totalPages: 2 };

async function createComponent() {
  const orderApiService = { list: vi.fn(() => of(PAGE)) };
  const notificationService = { errorApi: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [OrderList],
    providers: [
      { provide: OrderApiService, useValue: orderApiService },
      { provide: NotificationService, useValue: notificationService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(OrderList);
  fixture.detectChanges();
  return { fixture, orderApiService };
}

describe('OrderList', () => {
  it('loads the first page on initialization', async () => {
    const { fixture, orderApiService } = await createComponent();

    expect(orderApiService.list).toHaveBeenCalledWith(0, 10, {});
    expect(fixture.componentInstance['orders']()).toEqual([ORDER]);
  });

  it('applies the selected filters and resets the page', async () => {
    const { fixture, orderApiService } = await createComponent();
    orderApiService.list.mockClear();
    fixture.componentInstance['filterForm'].patchValue({
      q: ' Maria ',
      customerId: 3,
      operatorId: 5,
      status: 'ASSIGNED',
      fulfillmentType: 'DELIVERY',
      createdFrom: '2026-10-01',
      createdTo: '2026-10-20',
      sortBy: 'total',
      direction: 'asc',
    });

    fixture.componentInstance['applyFilters']();

    expect(orderApiService.list).toHaveBeenCalledWith(0, 10, {
      q: 'Maria',
      customerId: 3,
      operatorId: 5,
      status: 'ASSIGNED',
      fulfillmentType: 'DELIVERY',
      createdFrom: '2026-10-01',
      createdTo: '2026-10-20',
      sortBy: 'total',
      direction: 'asc',
    });
  });

  it('loads the next page when more orders are available', async () => {
    const { fixture, orderApiService } = await createComponent();
    orderApiService.list.mockClear();

    fixture.componentInstance['nextPage']();

    expect(orderApiService.list).toHaveBeenCalledWith(1, 10, {});
  });

  it('rejects invalid IDs and date ranges before sending a request', async () => {
    const { fixture, orderApiService } = await createComponent();
    orderApiService.list.mockClear();
    fixture.componentInstance['filterForm'].patchValue({ customerId: 0, createdFrom: '2026-10-20', createdTo: '2026-10-01' });

    fixture.componentInstance['applyFilters']();

    expect(orderApiService.list).not.toHaveBeenCalled();
    expect(fixture.componentInstance['filterForm'].hasError('dateRange')).toBe(true);
  });

  it('keeps applied filters for pagination until the next submission', async () => {
    const { fixture, orderApiService } = await createComponent();
    fixture.componentInstance['filterForm'].patchValue({ customerId: 3 });
    fixture.componentInstance['applyFilters']();
    fixture.componentInstance['filterForm'].patchValue({ customerId: 5 });
    orderApiService.list.mockClear();

    fixture.componentInstance['nextPage']();

    expect(orderApiService.list).toHaveBeenCalledWith(1, 10, { customerId: 3, sortBy: 'createdAt', direction: 'desc' });
  });
});
