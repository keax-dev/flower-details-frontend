import { expect, test } from '@playwright/test';

test('a customer edits their profile and sees the saved data after reloading', async ({ page }) => {
  let customer = {
    id: 3,
    personId: 4,
    names: 'Ana',
    lastNames: 'Pérez',
    email: 'ana@example.com',
    phone: '0999999999',
    documentNumber: '',
    role: 'CUSTOMER',
  };

  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => {
    if (route.request().method() === 'PUT') {
      const request = route.request().postDataJSON() as typeof customer;
      customer = { ...customer, ...request };
    }
    return route.fulfill({ json: customer });
  });

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible();
  await expect(page.getByLabel('Nombres *')).toHaveValue('Ana');
  await page.getByLabel('Nombres *').fill('Lucía');
  await page.getByLabel('Correo electrónico *').fill('lucia@example.com');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.getByRole('status')).toHaveText('Tus datos se guardaron correctamente.');
  await expect(page.locator('.application-navigation__user')).toHaveText('Lucía');
  await page.reload();
  await expect(page.getByLabel('Nombres *')).toHaveValue('Lucía');
  await expect(page.getByLabel('Correo electrónico *')).toHaveValue('lucia@example.com');
});
