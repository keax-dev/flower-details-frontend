import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const backendDirectory = resolve(__dirname, '../flower-details-backend');
const frontendDirectory = __dirname;
const backendWrapper =
  process.platform === 'win32' ? `"${process.env['FLOWER_DETAILS_BASH'] ?? 'C:\\Program Files\\Git\\bin\\bash.exe'}" ./mvnw` : './mvnw';

export default defineConfig({
  testDir: './full-stack-tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:14200',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: `${backendWrapper} -q -DskipTests -Dspring-boot.run.useTestClasspath=true -Dspring-boot.run.arguments=--server.port=18080 spring-boot:run`,
      cwd: backendDirectory,
      env: {
        SPRING_CONFIG_ADDITIONAL_LOCATION: 'file:src/test/resources/application.properties',
        SECURITY_CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:14200',
      },
      url: 'http://127.0.0.1:18080/actuator/health',
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: 'npm run start -- --host 127.0.0.1 --port 14200 --proxy-config proxy.full-stack.conf.json',
      cwd: frontendDirectory,
      url: 'http://127.0.0.1:14200',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
