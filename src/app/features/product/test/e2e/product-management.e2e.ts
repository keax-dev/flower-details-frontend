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

test('lets an administrator create a product without images', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: ADMIN }));
  await page.route('**/api/categories**', (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: 2,
            title: 'Cumpleaños',
            description: 'Arreglos para celebrar',
            active: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      },
    }),
  );
  await page.route('**/api/products**', async (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        categoryId: 2,
        title: 'Ramo de rosas',
        description: 'Docena de rosas rojas',
        price: 25,
        active: true,
      });
      await route.fulfill({
        json: {
          id: 1,
          category: { id: 2, title: 'Cumpleaños' },
          title: 'Ramo de rosas',
          description: 'Docena de rosas rojas',
          price: 25,
          active: true,
          images: [],
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

  await page.goto('/admin/products');
  await page.getByRole('button', { name: 'Nuevo producto' }).click();
  await page.locator('#product-category').click();
  await page.getByRole('option', { name: 'Cumpleaños' }).click();
  await page.getByLabel('Título').fill('Ramo de rosas');
  await page.getByLabel('Descripción').fill('Docena de rosas rojas');
  await page.getByLabel('Precio').fill('25');
  await page.getByRole('button', { name: 'Guardar producto' }).click();

  await expect(page.getByText('Producto creado correctamente.')).toBeVisible();
});
