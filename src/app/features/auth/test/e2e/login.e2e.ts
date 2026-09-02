import { expect, Page, test } from '@playwright/test';

const USER = {
  id: 1,
  personId: 10,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  documentNumber: '0102030405',
  role: 'ADMIN',
};

async function mockCsrfToken(page: Page): Promise<void> {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
}

test('redirects an administrator to the requested page after login', async ({ page }) => {
  await mockCsrfToken(page);
  await page.route('**/api/auth/login', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: USER.email,
      password: 'correct-password',
    });
    await route.fulfill({ json: { expiresInSeconds: 3600, user: USER } });
  });

  await page.goto('/auth/login?returnUrl=/admin/categories');
  await page.getByLabel('Correo electrónico').fill(USER.email);
  await page.getByLabel('Contraseña').fill('correct-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/admin\/categories$/);
});

test('shows the server validation error when credentials are rejected', async ({ page }) => {
  await mockCsrfToken(page);
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Credenciales inválidas.' }),
    });
  });

  await page.goto('/auth/login');
  await page.getByLabel('Correo electrónico').fill(USER.email);
  await page.getByLabel('Contraseña').fill('wrong-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page.getByRole('alert')).toHaveText('Credenciales inválidas.');
});
