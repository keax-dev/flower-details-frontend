import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

const CUSTOMER = {
  id: 3,
  personId: 4,
  names: 'Ana',
  lastNames: 'Flores',
  email: 'ana@example.com',
  phone: '0999999999',
  documentNumber: '',
  role: 'CUSTOMER',
};

async function expectWcagAa(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) }))).toEqual([]);
}

test('login page passes automated WCAG AA checks', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: { message: 'No autorizado' } }));
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  await expectWcagAa(page);
});

test('customer profile passes automated WCAG AA checks', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: CUSTOMER }));
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible();
  await expectWcagAa(page);
});

test('operator orders page passes automated WCAG AA checks', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: { ...CUSTOMER, role: 'OPERATOR' } }));
  await page.route('**/api/orders?**', (route) => route.fulfill({ json: { items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 } }));
  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
  await expectWcagAa(page);
});

test('administrator dashboard passes automated WCAG AA checks', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: { ...CUSTOMER, role: 'ADMIN' } }));
  await page.route('**/api/dashboard/overview?**', (route) =>
    route.fulfill({
      json: { ordersInPeriod: 0, salesInPeriod: 0, pendingOrders: 0, cancelledInPeriod: 0, ordersByStatus: [], recentOrders: [] },
    }),
  );
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Resumen del período' })).toBeVisible();
  await expectWcagAa(page);
});
