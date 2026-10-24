import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('registers and updates a customer through the real API', async ({ page }) => {
  const email = `customer-${randomUUID()}@flowerdetails.test`;
  const updatedEmail = `updated-${randomUUID()}@flowerdetails.test`;

  await page.goto('/auth/register');
  await page.getByLabel('Nombres *').fill('Ana');
  await page.getByLabel('Apellidos *').fill('Flores');
  await page.getByLabel('Correo electrónico *').fill(email);
  await page.getByLabel('Contraseña *', { exact: true }).fill('Password123');
  await page.getByLabel('Confirmar contraseña *').fill('Password123');
  await page.getByLabel(/He leído y acepto los Términos/).check();
  const registerResponse = page.waitForResponse((response) => response.url().endsWith('/api/auth/register'));
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  expect((await registerResponse).status()).toBe(201);

  await page.goto('/profile');
  await expect(page.getByLabel('Correo electrónico *')).toHaveValue(email);
  await page.getByLabel('Nombres *').fill('Lucía');
  await page.getByLabel('Correo electrónico *').fill(updatedEmail);
  const updateResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/me') && response.request().method() === 'PUT' && response.status() === 200,
  );
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  expect((await updateResponse).status()).toBe(200);
  await expect(page.getByRole('status')).toHaveText('Tus datos se guardaron correctamente.');

  await page.reload();
  await expect(page.getByLabel('Nombres *')).toHaveValue('Lucía');
  await expect(page.getByLabel('Correo electrónico *')).toHaveValue(updatedEmail);
  const logoutResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/auth/logout') && response.request().method() === 'POST' && response.status() === 204,
  );
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  expect((await logoutResponse).status()).toBe(204);
  await expect(page).toHaveURL(/\/home$/);
  await page.goto('/auth/login');
  await page.getByLabel('Correo electrónico').fill(updatedEmail);
  await page.getByLabel('Contraseña').fill('Password123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('.application-navigation__user')).toHaveText('Lucía');
});
