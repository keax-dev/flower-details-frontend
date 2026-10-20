import { expect, test } from '@playwright/test';

test('filters management products, resets pagination and clears the selection', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      json: { id: 1, personId: 10, names: 'Ana', lastNames: 'Pérez', email: 'ana@example.com', role: 'ADMIN' },
    }),
  );
  await page.route('**/api/categories/administration?**', (route) =>
    route.fulfill({
      json: {
        items: [{ id: 2, title: 'Cumpleaños', description: '', active: false, createdAt: '', updatedAt: '' }],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      },
    }),
  );
  await page.route('**/api/products/manage?**', (route) => {
    const url = new URL(route.request().url());
    const filtered = url.searchParams.has('q');
    return route.fulfill({
      json: {
        items: [
          {
            id: filtered ? 3 : 1,
            category: { id: 2, title: 'Cumpleaños' },
            title: filtered ? 'Ramo filtrado' : 'Ramo inicial',
            description: '<p>Rosas</p>',
            price: 25,
            active: !filtered,
            images: [],
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        page: Number(url.searchParams.get('page')),
        size: 10,
        totalElements: filtered ? 1 : 11,
        totalPages: filtered ? 1 : 2,
      },
    });
  });

  await page.goto('/admin/products');
  await expect(page.getByText('Ramo inicial')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();
  await page.getByLabel('Buscar').fill(' rosas ');
  await page.getByLabel('Categoría').selectOption('2');
  await page.getByLabel('Estado').selectOption('false');
  await page.getByLabel('Precio mínimo').fill('60');
  await page.getByLabel('Precio máximo').fill('50');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByText('El precio máximo debe ser mayor o igual al mínimo y no negativo.')).toBeVisible();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();
  await page.getByLabel('Precio mínimo').fill('0');
  await page.getByLabel('Ordenar por').selectOption('price');
  await page.getByLabel('Dirección').selectOption('asc');

  const filteredRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/api/products/manage' && new URL(request.url()).searchParams.has('q'),
  );
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  const request = await filteredRequest;
  const params = new URL(request.url()).searchParams;
  expect(Object.fromEntries(params)).toMatchObject({
    page: '0',
    size: '10',
    q: 'rosas',
    categoryId: '2',
    minPrice: '0',
    maxPrice: '50',
    active: 'false',
    sortBy: 'price',
    direction: 'asc',
  });
  await expect(page.getByText('Ramo filtrado')).toBeVisible();
  await expect(page.getByText('Página 1 de 1')).toBeVisible();

  const clearedRequest = page.waitForRequest((nextRequest) => {
    const nextUrl = new URL(nextRequest.url());
    return nextUrl.pathname === '/api/products/manage' && !nextUrl.searchParams.has('q') && nextUrl.searchParams.get('page') === '0';
  });
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await clearedRequest;
  await expect(page.getByText('Ramo inicial')).toBeVisible();
});
