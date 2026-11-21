import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  testMatch: ['**/test/e2e/security.e2e.ts', '**/test/e2e/accessibility.e2e.ts', '**/test/e2e/production-security.browser.ts'],
  use: { ...config.use, baseURL: 'http://127.0.0.1:14202' },
  webServer: undefined,
});
