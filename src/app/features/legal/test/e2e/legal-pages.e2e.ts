import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: { message: 'No autorizado' } }));
});

test('shows public terms from registration and keeps legal contact available', async ({ page }) => {
  await page.goto('/auth/register');
  await page.getByRole('link', { name: 'Términos y condiciones' }).first().click();

  await expect(page).toHaveURL(/\/legal\/terms$/);
  await expect(page.getByRole('heading', { name: 'Términos y condiciones' })).toBeVisible();
  await expect(page.getByText('1754328122001')).toBeVisible();
  await expect(page.getByText(/efectivo o por transferencia/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'alexgarden@gmail.com' })).toHaveAttribute('href', 'mailto:alexgarden@gmail.com');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('shows the privacy policy through the persistent legal footer', async ({ page }) => {
  await page.goto('/home');
  await page.getByRole('navigation', { name: 'Información legal' }).getByRole('link', { name: 'Política de privacidad' }).click();

  await expect(page).toHaveURL(/\/legal\/privacy$/);
  await expect(page.getByRole('heading', { name: 'Política de privacidad' })).toBeVisible();
  await expect(page.getByText(/no compartimos tus datos de entrega con repartidores externos/)).toBeVisible();
  await expect(page.getByText(/Puedes solicitar acceso, rectificación/)).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
