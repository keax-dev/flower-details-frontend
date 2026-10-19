import { expect, Page, test } from '@playwright/test';

const ADMIN = {
  id: 1,
  personId: 10,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  role: 'ADMIN',
};

const CUSTOMER = {
  id: 7,
  personId: 17,
  names: 'María',
  lastNames: 'Flores',
  email: 'maria@example.com',
  phone: '0987654321',
  documentNumber: '1712345678',
  role: 'CUSTOMER',
  active: true,
  createdAt: '2026-01-01T12:00:00Z',
  updatedAt: '2026-01-01T12:00:00Z',
};

async function mockSession(page: Page, user: typeof ADMIN | typeof CUSTOMER): Promise<void> {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: user }));
}

test('lets an administrator inspect, deactivate and delete a customer', async ({ page }) => {
  let customers = [CUSTOMER];
  await mockSession(page, ADMIN);
  await page.route('**/api/users/customers**', (route) =>
    route.fulfill({ json: { items: customers, page: 0, size: 10, totalElements: customers.length, totalPages: customers.length ? 1 : 0 } }),
  );
  await page.route('**/api/users/7/deactivate', (route) => {
    customers = [{ ...customers[0], active: false }];
    return route.fulfill({ json: customers[0] });
  });
  await page.route('**/api/users/7', (route) => {
    customers = [];
    return route.fulfill({ status: 204 });
  });

  await page.goto('/admin/customers');
  await expect(page.getByText('maria@example.com')).toBeVisible();
  await page.getByRole('button', { name: 'Ver detalle de María Flores' }).click();
  await expect(page.getByRole('dialog')).toContainText('1712345678');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Desactivar a María Flores' }).click();
  await page.getByRole('button', { name: 'Aceptar', exact: true }).last().click();
  await expect(page.getByText('Cliente desactivado correctamente.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activar a María Flores' })).toBeVisible();

  await page.getByRole('button', { name: 'Eliminar a María Flores' }).click();
  await page.getByRole('button', { name: 'Aceptar', exact: true }).last().click();
  await expect(page.getByText('Todavía no hay clientes registrados.')).toBeVisible();
});

test('blocks customer accounts from the administration route', async ({ page }) => {
  await mockSession(page, CUSTOMER);

  await page.goto('/admin/customers');

  await expect(page).toHaveURL(/\/home$/);
});

test('keeps the customer link available in the collapsed administration menu', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await mockSession(page, ADMIN);
  await page.route('**/api/users/customers**', (route) => route.fulfill({ json: { items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 } }));

  await page.goto('/home');
  await page.getByRole('button', { name: 'Abrir menú de navegación' }).click();
  await page.getByRole('link', { name: 'Clientes' }).click();

  await expect(page).toHaveURL(/\/admin\/customers$/);
  await expect(page.getByRole('heading', { name: 'Clientes', exact: true })).toBeVisible();
});
