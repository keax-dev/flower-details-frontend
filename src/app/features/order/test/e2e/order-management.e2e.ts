import { expect, Page, test } from '@playwright/test';

const ADMIN = {
  id: 1,
  personId: 10,
  names: 'Ana',
  lastNames: 'Perez',
  email: 'ana@example.com',
  phone: '0999999999',
  role: 'ADMIN',
};

const OPERATOR = { ...ADMIN, id: 5, personId: 11, names: 'Maria', lastNames: 'Lopez', email: 'maria@example.com', role: 'OPERATOR' };

function order(status = 'GENERATED', assignedOperatorId: number | null = null) {
  return {
    id: 12,
    orderNumber: 'PED-000012',
    customerId: 3,
    assignedOperatorId,
    status,
    fulfillmentType: 'DELIVERY',
    total: 45,
    contactName: 'Maria Perez',
    contactPhone: '0999999999',
    deliveryAddress: 'Av. Principal 123',
    additionalInstructions: 'Llamar al llegar.',
    cancellationReason: null,
    createdAt: '2026-01-01T00:00:00Z',
    assignedAt: null,
    preparationStartedAt: null,
    readyAt: null,
    dispatchedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    items: [
      { id: 20, productId: 8, productTitle: 'Ramo de rosas', productImageUrl: '/uploads/roses.jpg', quantity: 2, unitPrice: 22.5, subtotal: 45 },
    ],
  };
}

async function mockSession(page: Page, user: typeof ADMIN | typeof OPERATOR): Promise<void> {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: user }));
}

async function selectOperator(page: Page, label: string): Promise<void> {
  await page.locator('#assigned-operator').click();
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText(label, { exact: true }).click();
}

test('lets an administrator assign an order and see its product image', async ({ page }) => {
  let currentOrder = order();
  await mockSession(page, ADMIN);
  await page.route('**/api/users/staff**', (route) =>
    route.fulfill({ json: { items: [{ ...OPERATOR, active: true }], page: 0, size: 100, totalElements: 1, totalPages: 1 } }),
  );
  await page.route('**/api/orders**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/orders') {
      await route.fulfill({ json: { items: [currentOrder], page: 0, size: 10, totalElements: 1, totalPages: 1 } });
      return;
    }
    if (pathname === '/api/orders/12/audit') {
      await route.fulfill({ json: [] });
      return;
    }
    if (pathname === '/api/orders/12/assign') {
      expect(request.postDataJSON()).toEqual({ operatorId: OPERATOR.id });
      currentOrder = order('ASSIGNED', OPERATOR.id);
      await route.fulfill({ json: currentOrder });
      return;
    }
    await route.fulfill({ json: currentOrder });
  });

  await page.goto('/orders');
  await page.getByRole('button', { name: 'Ver pedido PED-000012' }).click();
  await expect(page.getByRole('img', { name: 'Ramo de rosas' })).toBeVisible();
  await selectOperator(page, 'Maria Lopez');
  await page.getByRole('button', { name: 'Asignar pedido' }).click();

  await expect(page.getByText('Pedido asignado correctamente.')).toBeVisible();
});

test('lets the assigned operator take and advance a generated order', async ({ page }) => {
  let currentOrder = order();
  await mockSession(page, OPERATOR);
  await page.route('**/api/orders**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/orders') {
      await route.fulfill({ json: { items: [currentOrder], page: 0, size: 10, totalElements: 1, totalPages: 1 } });
      return;
    }
    if (pathname === '/api/orders/12/audit') {
      await route.fulfill({ json: [] });
      return;
    }
    if (pathname === '/api/orders/12/assign') {
      expect(request.postDataJSON()).toEqual({});
      currentOrder = order('ASSIGNED', OPERATOR.id);
      await route.fulfill({ json: currentOrder });
      return;
    }
    if (pathname === '/api/orders/12/status') {
      expect(request.postDataJSON()).toEqual({ status: 'IN_PREPARATION' });
      currentOrder = order('IN_PREPARATION', OPERATOR.id);
      await route.fulfill({ json: currentOrder });
      return;
    }
    await route.fulfill({ json: currentOrder });
  });

  await page.goto('/orders');
  await page.getByRole('button', { name: 'Ver pedido PED-000012' }).click();
  await page.getByRole('button', { name: 'Tomar pedido' }).click();
  await expect(page.getByText('Pedido tomado correctamente.')).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como En Preparación' }).click();

  await expect(page.getByText('Estado del pedido actualizado correctamente.')).toBeVisible();
});

test('lets an administrator cancel an active order with a reason', async ({ page }) => {
  const currentOrder = order('ASSIGNED', OPERATOR.id);
  await mockSession(page, ADMIN);
  await page.route('**/api/users/staff**', (route) => route.fulfill({ json: { items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 } }));
  await page.route('**/api/orders**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/orders') {
      await route.fulfill({ json: { items: [currentOrder], page: 0, size: 10, totalElements: 1, totalPages: 1 } });
      return;
    }
    if (pathname === '/api/orders/12/audit') {
      await route.fulfill({ json: [] });
      return;
    }
    if (pathname === '/api/orders/12/cancel') {
      expect(request.postDataJSON()).toEqual({ reason: 'El cliente solicitó cancelar.' });
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ json: currentOrder });
  });

  await page.goto('/orders');
  await page.getByRole('button', { name: 'Ver pedido PED-000012' }).click();
  await page.getByLabel('Motivo de cancelación').fill('El cliente solicitó cancelar.');
  await page.getByRole('button', { name: 'Cancelar pedido' }).click();
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();

  await expect(page.getByText('Pedido cancelado correctamente.')).toBeVisible();
});
