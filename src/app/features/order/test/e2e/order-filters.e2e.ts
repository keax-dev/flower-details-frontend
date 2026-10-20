import { expect, test } from '@playwright/test';

test('lets an operator combine advanced order filters and clear them', async ({ page }) => {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) =>
    route.fulfill({ json: { id: 5, personId: 11, names: 'María', lastNames: 'López', email: 'maria@example.com', role: 'OPERATOR' } }),
  );
  await page.route('**/api/orders?**', (route) => {
    const url = new URL(route.request().url());
    const filtered = url.searchParams.has('customerId');
    return route.fulfill({
      json: {
        items: [
          {
            id: filtered ? 13 : 12,
            orderNumber: filtered ? 'PED-FILTRADO' : 'PED-INICIAL',
            customerId: 3,
            assignedOperatorId: 5,
            status: 'ASSIGNED',
            fulfillmentType: 'DELIVERY',
            total: 45,
            contactName: 'Ana Pérez',
            contactPhone: '0999999999',
            createdAt: '2026-10-10T12:00:00Z',
            items: [],
          },
        ],
        page: Number(url.searchParams.get('page')),
        size: 10,
        totalElements: filtered ? 1 : 11,
        totalPages: filtered ? 1 : 2,
      },
    });
  });

  await page.goto('/orders');
  await expect(page.getByText('PED-INICIAL')).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();

  await page.getByLabel('Buscar').fill(' Ana ');
  await page.getByLabel('Estado').selectOption('ASSIGNED');
  await page.getByLabel('Tipo de entrega').selectOption('DELIVERY');
  await page.getByLabel('ID del cliente').fill('3');
  await page.getByLabel('ID del operador').fill('5');
  await page.getByLabel('Fecha desde').fill('2026-10-20');
  await page.getByLabel('Fecha hasta').fill('2026-10-01');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByText('La fecha final no puede ser anterior a la inicial.')).toBeVisible();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();

  await page.getByLabel('Fecha desde').fill('2026-10-01');
  await page.getByLabel('Ordenar por').selectOption('total');
  await page.getByLabel('Dirección').selectOption('asc');
  const filteredRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/api/orders' && new URL(request.url()).searchParams.has('customerId'),
  );
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  const params = new URL((await filteredRequest).url()).searchParams;
  expect(Object.fromEntries(params)).toMatchObject({
    page: '0',
    size: '10',
    q: 'Ana',
    customerId: '3',
    operatorId: '5',
    status: 'ASSIGNED',
    fulfillmentType: 'DELIVERY',
    createdFrom: '2026-10-01',
    createdTo: '2026-10-01',
    sortBy: 'total',
    direction: 'asc',
  });
  await expect(page.getByText('PED-FILTRADO')).toBeVisible();
  await expect(page.getByText('Página 1 de 1')).toBeVisible();

  const clearedRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/api/orders' && !url.searchParams.has('customerId') && url.searchParams.get('page') === '0';
  });
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await clearedRequest;
  await expect(page.getByText('PED-INICIAL')).toBeVisible();
});
