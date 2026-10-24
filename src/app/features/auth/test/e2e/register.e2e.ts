import { expect, Page, test } from '@playwright/test';

const CUSTOMER = {
  id: 3,
  personId: 9,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  documentNumber: '',
  role: 'CUSTOMER',
};

async function fillRegistration(page: Page): Promise<void> {
  await page.getByLabel('Nombres *').fill('Ana');
  await page.getByLabel('Apellidos *').fill('Pérez');
  await page.getByLabel('Correo electrónico *').fill(CUSTOMER.email);
  await page.getByLabel('Teléfono (opcional)').fill(CUSTOMER.phone);
  await page.getByLabel('Contraseña *', { exact: true }).fill('Password123');
  await page.getByLabel('Confirmar contraseña *').fill('Password123');
  await page.getByLabel(/He leído y acepto los Términos/).check();
}

test('registers a customer and keeps the new session active', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/auth/register', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      names: 'Ana',
      lastNames: 'Pérez',
      email: CUSTOMER.email,
      password: 'Password123',
      phone: CUSTOMER.phone,
      documentNumber: '',
      termsAccepted: true,
      termsVersion: '2026-10-22',
    });
    await route.fulfill({ status: 201, json: { expiresInSeconds: 3600, user: CUSTOMER } });
  });

  await page.goto('/home');
  await page.getByRole('link', { name: 'Crear cuenta' }).click();
  await fillRegistration(page);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
});

test('shows password validation and a duplicate-email error without leaving registration', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/auth/register', (route) => route.fulfill({ status: 409, json: { message: 'El correo ya está registrado.' } }));

  await page.goto('/auth/register');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByLabel('Nombres *')).toBeFocused();
  await fillRegistration(page);
  await page.getByLabel('Confirmar contraseña *').fill('Different123');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText('Las contraseñas no coinciden.')).toBeVisible();

  await page.getByLabel('Confirmar contraseña *').fill('Password123');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('alert')).toHaveText('El correo ya está registrado.');
  await expect(page).toHaveURL(/\/auth\/register$/);
});
