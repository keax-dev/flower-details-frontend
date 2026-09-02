import { expect, test } from '@playwright/test';

const ADMIN = {
  id: 1,
  personId: 10,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  documentNumber: '0102030405',
  role: 'ADMIN',
};

test('lets an administrator create a category', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: ADMIN }));
  await page.route('**/api/categories**', async (route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON();
      expect(payload).toMatchObject({
        title: 'Cumpleaños',
        active: true,
      });
      expect(payload.description.replaceAll('&nbsp;', ' ')).toBe('<p>Arreglos para celebrar</p>');
      await route.fulfill({
        json: {
          id: 1,
          title: 'Cumpleaños',
          description: 'Arreglos para celebrar',
          active: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      });
      return;
    }

    await route.fulfill({
      json: { items: [], page: 0, size: 10, totalElements: 0, totalPages: 1 },
    });
  });

  await page.goto('/admin/categories');
  await page.getByRole('button', { name: 'Nueva categoría' }).click();
  await page.getByLabel('Título').fill('Cumpleaños');
  await page.locator('#category-description .ql-editor').fill('Arreglos para celebrar');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('Categoría creada correctamente.')).toBeVisible();
});
