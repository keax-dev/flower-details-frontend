import { expect, test } from '@playwright/test';

const PRODUCT = {
  id: 1,
  category: { id: 2, title: 'Rosas' },
  title: 'Ramo de rosas',
  description: '<p>Doce rosas rojas</p>',
  price: 25,
  active: true,
  images: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

test('a visitor can filter the public catalog and view a product', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/categories?**', (route) =>
    route.fulfill({
      json: {
        items: [{ id: 2, title: 'Rosas', description: '', active: true, createdAt: '', updatedAt: '' }],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      },
    }),
  );
  await page.route('**/api/products?**', (route) => {
    const url = new URL(route.request().url());
    return route.fulfill({
      json: {
        items: url.searchParams.has('q') ? [PRODUCT] : [],
        page: 0,
        size: 12,
        totalElements: url.searchParams.has('q') ? 1 : 0,
        totalPages: url.searchParams.has('q') ? 1 : 0,
      },
    });
  });
  await page.route('**/api/products/1', (route) => route.fulfill({ json: PRODUCT }));

  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'Catálogo floral' })).toBeVisible();
  await expect(page.getByText('No hay productos que coincidan con los filtros.')).toBeVisible();

  await page.getByLabel('Buscar').fill(' rosas ');
  await page.getByLabel('Categoría').selectOption('2');
  await page.getByLabel('Precio mínimo').fill('60');
  await page.getByLabel('Precio máximo').fill('50');
  await page.getByLabel('Ordenar por').selectOption('price');
  await page.getByLabel('Dirección').selectOption('asc');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByText('El máximo debe ser mayor o igual al mínimo.')).toBeVisible();
  await page.getByLabel('Precio mínimo').fill('0');

  const filteredRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/api/products' && new URL(request.url()).searchParams.has('q'),
  );
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  const params = new URL((await filteredRequest).url()).searchParams;
  expect(Object.fromEntries(params)).toMatchObject({
    page: '0',
    size: '12',
    q: 'rosas',
    categoryId: '2',
    minPrice: '0',
    maxPrice: '50',
    sortBy: 'price',
    direction: 'asc',
  });
  await expect(page.getByRole('heading', { name: PRODUCT.title })).toBeVisible();

  await page.getByRole('link', { name: `Ver detalle de ${PRODUCT.title}` }).click();
  await expect(page).toHaveURL(/\/catalog\/1$/);
  await expect(page.getByRole('heading', { level: 1, name: PRODUCT.title })).toBeVisible();
  await expect(page.getByText('Doce rosas rojas')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver al catálogo' })).toBeVisible();
});
