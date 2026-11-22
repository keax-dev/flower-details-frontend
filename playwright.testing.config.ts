import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['TEST_BASE_URL'];
if (!baseURL) throw new Error('Define TEST_BASE_URL with the deployed HTTPS testing origin.');
const origin = new URL(baseURL);
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
  throw new Error('TEST_BASE_URL must be an HTTPS origin without credentials, path, query or fragment.');
}
const ignoreHTTPSErrors = process.env['LOCAL_TEST_TLS'] === 'true';
if (ignoreHTTPSErrors && !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) {
  throw new Error('LOCAL_TEST_TLS is only allowed for a local container smoke test.');
}
process.env['TEST_ACCESS_COOKIE_NAME'] ??= 'flower_details_testing_access_token';

export default defineConfig({
  testDir: './full-stack-tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: origin.origin,
    ignoreHTTPSErrors,
    ...devices['Desktop Chrome'],
  },
});
