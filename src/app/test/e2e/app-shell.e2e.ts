import { expect, test } from '@playwright/test';

test('lets a guest navigate from the public shell to the login page', async ({ page }) => {
  await page.goto('/home');

  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  await page.getByRole('link', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
});
