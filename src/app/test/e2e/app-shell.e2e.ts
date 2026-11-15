import { expect, test } from '@playwright/test';

test('lets a guest navigate from the public shell to the login page', async ({ page }) => {
  let csrfRequests = 0;
  await page.route('**/api/auth/csrf', (route) => {
    csrfRequests += 1;
    return route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } });
  });
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: { message: 'No autorizado' } }));
  await page.goto('/home');

  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  await page.getByRole('link', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(csrfRequests).toBe(0);
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
});
