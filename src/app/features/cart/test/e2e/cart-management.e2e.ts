import { expect, test } from '@playwright/test';

import { CartItem } from '@features/cart/models/cart.model';

const PRODUCT = {
  id: 1,
  category: { id: 2, title: 'Rosas' },
  title: 'Ramo de rosas',
  description: '<p>Doce rosas rojas</p>',
  price: 25,
  active: true,
  images: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

test('a customer can add, update, remove and clear cart items', async ({ page }) => {
  let cartItems: CartItem[] = [
    { id: 20, product: { id: 2, title: 'Girasoles', imageUrl: null, available: true }, quantity: 1, unitPrice: 10, subtotal: 10 },
  ];
  const cartResponse = () => ({ id: 1, items: cartItems, total: cartItems.reduce((total, item) => total + item.subtotal, 0) });

  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) =>
    route.fulfill({ json: { id: 3, personId: 4, names: 'Ana', lastNames: 'Pérez', email: 'ana@example.com', role: 'CUSTOMER' } }),
  );
  await page.route('**/api/products/1', (route) => route.fulfill({ json: PRODUCT }));
  await page.route('**/api/cart/items/*', (route) => {
    const itemId = Number(new URL(route.request().url()).pathname.split('/').at(-1));
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as { quantity: number };
      cartItems = cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: body.quantity, subtotal: body.quantity * item.unitPrice } : item,
      );
      return route.fulfill({ json: cartResponse() });
    }
    cartItems = cartItems.filter((item) => item.id !== itemId);
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/cart/items', (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { productId: number; quantity: number };
      cartItems = [
        ...cartItems,
        {
          id: 11,
          product: { id: body.productId, title: PRODUCT.title, imageUrl: null, available: true },
          quantity: body.quantity,
          unitPrice: PRODUCT.price,
          subtotal: body.quantity * PRODUCT.price,
        },
      ];
      return route.fulfill({ status: 201, json: cartResponse() });
    }
    cartItems = [];
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/cart', (route) => route.fulfill({ json: cartResponse() }));

  await page.goto('/catalog/1');
  await expect(page.getByRole('button', { name: 'Agregar al carrito' })).toBeVisible();
  await page.getByLabel('Cantidad').fill('2');
  const addRequest = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/cart/items' && request.method() === 'POST');
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  expect((await addRequest).postDataJSON()).toEqual({ productId: 1, quantity: 2 });
  await expect(page.getByText('Producto agregado.')).toBeVisible();
  await page.getByRole('link', { name: 'Ver carrito' }).click();

  await expect(page.getByRole('heading', { name: 'Tu carrito' })).toBeVisible();
  const roses = page.getByRole('article').filter({ hasText: PRODUCT.title });
  await expect(roses).toBeVisible();
  await roses.getByLabel('Cantidad').fill('3');
  const updateRequest = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/cart/items/11' && request.method() === 'PUT');
  await roses.getByRole('button', { name: 'Actualizar' }).click();
  expect((await updateRequest).postDataJSON()).toEqual({ quantity: 3 });
  await expect(page.getByRole('heading', { name: 'Productos (4)' })).toBeVisible();

  await roses.getByRole('button', { name: 'Quitar producto' }).click();
  await expect(roses).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Productos (1)' })).toBeVisible();

  await page.getByRole('button', { name: 'Vaciar carrito' }).click();
  await expect(page.getByText('Tu carrito está vacío.')).toBeVisible();
});

test('a visitor is redirected to login before opening the cart', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: {} }));

  await page.goto('/cart');
  await expect(page).toHaveURL(/\/auth\/login\?returnUrl=%2Fcart$/);
});
