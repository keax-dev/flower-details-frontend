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

test('a customer confirms a delivery order and can reopen its confirmation', async ({ page }) => {
  let cartItems = [
    {
      id: 11,
      product: { id: 1, title: 'Ramo de rosas', imageUrl: null, available: true },
      quantity: 2,
      unitPrice: 25,
      subtotal: 50,
    },
  ];
  const order = {
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
    additionalInstructions: 'Tocar el timbre',
    cancellationReason: null,
    createdAt: '2026-10-21T12:00:00Z',
    assignedAt: null,
    preparationStartedAt: null,
    readyAt: null,
    dispatchedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    items: [{ id: 91, productId: 1, productTitle: 'Ramo de rosas', productImageUrl: null, quantity: 2, unitPrice: 25, subtotal: 50 }],
  };

  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: CUSTOMER }));
  await page.route('**/api/cart', (route) => route.fulfill({ json: { id: 1, items: cartItems, total: cartItems.length ? 50 : 0 } }));
  await page.route('**/api/orders/42', (route) => route.fulfill({ json: order }));
  await page.route('**/api/orders', (route) => {
    cartItems = [];
    return route.fulfill({ status: 201, json: order });
  });

  await page.goto('/cart');
  await page.getByRole('link', { name: 'Confirmar pedido' }).click();
  await expect(page.getByRole('heading', { name: 'Datos del pedido' })).toBeVisible();
  await expect(page.getByLabel('Nombre de contacto')).toHaveValue('Ana Pérez');
  await expect(page.getByLabel('Teléfono de contacto')).toHaveValue(CUSTOMER.phone);

  await page.getByLabel('Entrega a domicilio').check();
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await expect(page.getByText('Ingresa una dirección de hasta 500 caracteres.')).toBeVisible();
  await page.getByLabel('Dirección de entrega').fill(' Calle Flores 123 ');
  await page.getByLabel('Indicaciones adicionales (opcional)').fill(' Tocar el timbre ');

  const createRequest = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/orders' && request.method() === 'POST');
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  expect((await createRequest).postDataJSON()).toEqual({
    fulfillmentType: 'DELIVERY',
    contactName: 'Ana Pérez',
    contactPhone: CUSTOMER.phone,
    deliveryAddress: 'Calle Flores 123',
    additionalInstructions: 'Tocar el timbre',
  });
  await expect(page).toHaveURL(/\/cart\/confirmation\/42$/);
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible();
  await expect(page.getByText('FD-42')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible();
  await page.getByRole('link', { name: 'Carrito' }).click();
  await expect(page.getByText('Tu carrito está vacío.')).toBeVisible();
});

test('pickup confirmation does not send a delivery address', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: CUSTOMER }));
  await page.route('**/api/cart', (route) =>
    route.fulfill({
      json: {
        id: 1,
        items: [
          {
            id: 11,
            product: { id: 1, title: 'Ramo de rosas', imageUrl: null, available: true },
            quantity: 1,
            unitPrice: 25,
            subtotal: 25,
          },
        ],
        total: 25,
      },
    }),
  );
  await page.route('**/api/orders', (route) => route.fulfill({ status: 201, json: { id: 43 } }));
  await page.route('**/api/orders/43', (route) =>
    route.fulfill({
      json: {
        id: 43,
        orderNumber: 'FD-43',
        fulfillmentType: 'PICKUP',
        contactName: 'Ana Pérez',
        contactPhone: CUSTOMER.phone,
        deliveryAddress: null,
        additionalInstructions: null,
        total: 25,
        items: [{ id: 91, productTitle: 'Ramo de rosas', quantity: 1, subtotal: 25 }],
      },
    }),
  );

  await page.goto('/cart/checkout');
  await expect(page.getByLabel('Retiro en local')).toBeChecked();
  await expect(page.getByLabel('Dirección de entrega')).toHaveCount(0);
  const createRequest = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/orders' && request.method() === 'POST');
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  expect((await createRequest).postDataJSON()).toEqual({
    fulfillmentType: 'PICKUP',
    contactName: 'Ana Pérez',
    contactPhone: CUSTOMER.phone,
    deliveryAddress: null,
    additionalInstructions: null,
  });
  await expect(page.getByText('FD-43')).toBeVisible();
});
