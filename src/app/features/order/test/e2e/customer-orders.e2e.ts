import { expect, test } from '@playwright/test';

const CUSTOMER = {
  id: 3,
  personId: 4,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  role: 'CUSTOMER',
};

const ORDER = {
  id: 42,
  orderNumber: 'FD-42',
  customerId: CUSTOMER.id,
  assignedOperatorId: null,
  status: 'GENERATED',
  fulfillmentType: 'DELIVERY',
  total: 50,
  contactName: 'Ana Pérez',
  contactPhone: CUSTOMER.phone,
  deliveryAddress: 'Calle Flores 123',
  additionalInstructions: null,
  cancellationReason: null as string | null,
  createdAt: '2026-10-21T12:00:00Z',
  assignedAt: null,
  preparationStartedAt: null,
  readyAt: null,
  dispatchedAt: null,
  deliveredAt: null,
  cancelledAt: null as string | null,
  items: [{ id: 91, productId: 1, productTitle: 'Ramo de rosas', productImageUrl: null, quantity: 2, unitPrice: 25, subtotal: 50 }],
};

test('a customer filters, tracks and cancels a generated order', async ({ page }) => {
  let currentStatus = 'GENERATED';
  let cancellationReason: string | null = null;
  const orderResponse = () => ({
    ...ORDER,
    status: currentStatus,
    cancellationReason,
    cancelledAt: currentStatus === 'CANCELLED' ? '2026-10-21T13:00:00Z' : null,
  });

  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: CUSTOMER }));
  await page.route('**/api/orders/my?**', (route) => {
    const url = new URL(route.request().url());
    return route.fulfill({
      json: {
        items: url.searchParams.get('page') === '1' ? [] : [orderResponse()],
        page: Number(url.searchParams.get('page')),
        size: 10,
        totalElements: url.searchParams.has('status') ? 1 : 11,
        totalPages: url.searchParams.has('status') ? 1 : 2,
      },
    });
  });
  await page.route('**/api/orders/42/audit', (route) =>
    route.fulfill({
      json: [
        {
          id: 1,
          actorUserId: CUSTOMER.id,
          action: 'CREATED',
          previousStatus: null,
          currentStatus: 'GENERATED',
          details: null,
          createdAt: ORDER.createdAt,
        },
        ...(currentStatus === 'CANCELLED'
          ? [
              {
                id: 2,
                actorUserId: CUSTOMER.id,
                action: 'CANCELLED',
                previousStatus: 'GENERATED',
                currentStatus: 'CANCELLED',
                details: cancellationReason,
                createdAt: '2026-10-21T13:00:00Z',
              },
            ]
          : []),
      ],
    }),
  );
  await page.route('**/api/orders/42/cancel', (route) => {
    const body = route.request().postDataJSON() as { reason: string };
    cancellationReason = body.reason;
    currentStatus = 'CANCELLED';
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/orders/42', (route) => route.fulfill({ json: orderResponse() }));

  await page.goto('/my-orders');
  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible();
  await expect(page.getByText('Página 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Buscar' }).fill(' FD-42 ');
  await page.getByLabel('Estado').selectOption('GENERATED');
  await page.getByLabel('Tipo de entrega').selectOption('DELIVERY');
  await page.getByLabel('Desde').fill('2026-10-01');
  await page.getByLabel('Hasta').fill('2026-10-21');
  await page.getByLabel('Ordenar por').selectOption('total');
  await page.getByLabel('Dirección').selectOption('asc');
  const filteredRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/api/orders/my' && new URL(request.url()).searchParams.has('status'),
  );
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  expect(Object.fromEntries(new URL((await filteredRequest).url()).searchParams)).toMatchObject({
    page: '0',
    size: '10',
    q: 'FD-42',
    status: 'GENERATED',
    fulfillmentType: 'DELIVERY',
    createdFrom: '2026-10-01',
    createdTo: '2026-10-21',
    sortBy: 'total',
    direction: 'asc',
  });
  await page.getByRole('link', { name: 'Ver detalle de FD-42' }).click();
  await expect(page.getByRole('heading', { name: 'Pedido FD-42' })).toBeVisible();
  await expect(page.getByText('Pedido generado')).toBeVisible();

  await page.getByRole('button', { name: 'Solicitar cancelación' }).click();
  await page.getByRole('button', { name: 'Confirmar cancelación' }).click();
  await expect(page.getByText('Ingresa un motivo de hasta 500 caracteres.')).toBeVisible();
  await page.getByLabel('Motivo de cancelación').fill('Ya no lo necesito');
  const cancelRequest = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/orders/42/cancel' && request.method() === 'PATCH');
  await page.getByRole('button', { name: 'Confirmar cancelación' }).click();
  expect((await cancelRequest).postDataJSON()).toEqual({ reason: 'Ya no lo necesito' });
  await expect(page.getByText('Pedido cancelado correctamente.')).toBeVisible();
  await expect(page.getByText('Estado actual: Cancelado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Solicitar cancelación' })).toHaveCount(0);
  await expect(page.getByText('Pedido cancelado', { exact: true })).toBeVisible();
});

test('a customer cannot cancel an order that is already assigned', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: CUSTOMER }));
  await page.route('**/api/orders/42', (route) => route.fulfill({ json: { ...ORDER, status: 'ASSIGNED', assignedOperatorId: 8 } }));
  await page.route('**/api/orders/42/audit', (route) => route.fulfill({ json: [] }));

  await page.goto('/my-orders/42');
  await expect(page.getByText('Estado actual: Asignado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Solicitar cancelación' })).toHaveCount(0);
});
