import { expect, test } from '@playwright/test';

test('production blocks injected scripts and does not expose Angular debug tools', async ({ page }) => {
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: {} }));
  await page.route('**/home', async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({
      response,
      body: html.replace('</head>', '<script>document.documentElement.dataset.securityProbe = "executed"</script></head>'),
    });
  });
  await page.goto('/home');
  await expect(page.locator('app-root')).not.toBeEmpty();
  expect(await page.evaluate(() => 'ng' in globalThis)).toBe(false);
  const probe = await page.evaluate(() => document.documentElement.dataset['securityProbe']);
  expect(probe).toBeUndefined();
});

test('production sends security headers and blocks source and secret paths', async ({ page, request }) => {
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: {} }));
  const response = await page.goto('/auth/login');
  expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['x-frame-options']).toBe('DENY');
  expect(response?.headers()['referrer-policy']).toBe('no-referrer');
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(response?.headers()['cache-control']).toContain('no-cache');
  for (const path of [
    '/.env',
    '/.git/config',
    '/src/main.ts',
    '/package.json',
    '/package-lock.json',
    '/angular.json',
    '/frontend-dev.log',
    '/main.js.map',
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});
