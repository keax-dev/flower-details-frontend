import { expect, test } from '@playwright/test';

const USER = { id: 1, personId: 1, names: 'Ana', lastNames: 'Flores', email: 'ana@example.test', role: 'CUSTOMER' };

test('stored product HTML cannot create executable elements', async ({ page }) => {
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/api/products/1', (route) =>
    route.fulfill({
      json: {
        id: 1,
        category: { id: 1, title: 'Flores' },
        title: 'Seguridad',
        price: 25,
        active: true,
        images: [],
        description:
          '<p>Contenido seguro</p><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">Enlace peligroso</a><iframe srcdoc="<script>alert(1)</script>"></iframe>',
      },
    }),
  );
  await page.goto('/catalog/1');
  const description = page.locator('.catalog-detail__description');
  await expect(description.getByText('Contenido seguro')).toBeVisible();
  await expect(description.locator('script, iframe, [onerror], [onclick], a[href^="javascript:"]')).toHaveCount(0);
});

test('API error messages are displayed as text instead of phishing links', async ({ page }) => {
  const message = '<a href="https://attacker.example">Inicia sesion para continuar</a>';
  await page.route('**/api/me', (route) => route.fulfill({ json: { ...USER, role: 'ADMIN' } }));
  await page.route('**/api/categories?**', (route) => route.fulfill({ json: { items: [], totalElements: 0 } }));
  await page.route('**/api/products/manage?**', (route) => route.fulfill({ status: 500, json: { message } }));
  await page.goto('/admin/products');
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.locator('a[href="https://attacker.example"]')).toHaveCount(0);
});

for (const role of ['CUSTOMER', 'OPERATOR']) {
  test(`${role} cannot open administrative pages`, async ({ page }) => {
    let managementRequests = 0;
    await page.route('**/api/me', (route) => route.fulfill({ json: { ...USER, role } }));
    await page.route('**/api/products/manage?**', (route) => {
      managementRequests += 1;
      return route.fulfill({ status: 403 });
    });
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/home$/);
    expect(managementRequests).toBe(0);
  });
}
