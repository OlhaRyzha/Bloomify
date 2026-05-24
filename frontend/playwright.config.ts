import { defineConfig, devices } from '@playwright/test';

import { apiBaseUrl, frontendBaseUrl } from './e2e/config/env';

if (process.env.FORCE_COLOR && process.env.NO_COLOR) {
  delete process.env.NO_COLOR;
}

const shouldStartWebServer = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(
  frontendBaseUrl
);
const shouldStartMockApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(
  apiBaseUrl
);
const shouldSkipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';
const frontendUrl = new URL(frontendBaseUrl);
const webServerHealthUrl = new URL('/uk/sign-in', frontendBaseUrl).toString();
const mockApiHealthUrl = new URL('/site/languages', apiBaseUrl).toString();
const frontendPort = frontendUrl.port || '3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: frontendBaseUrl,
    trace: 'on-first-retry',
  },
  webServer: [
    shouldStartMockApi && !shouldSkipWebServer
      ? {
          command: 'node e2e/mock-api/server.mjs',
          url: mockApiHealthUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        }
      : null,
    shouldStartWebServer && !shouldSkipWebServer
      ? {
          command: `npm run dev -- --hostname ${frontendUrl.hostname} --port ${frontendPort}`,
          env: {
            NEXT_PUBLIC_API_URL: apiBaseUrl,
            NEXT_PUBLIC_SENTRY_DSN: '',
            NEXT_PUBLIC_MEDIA_HOST: apiBaseUrl,
            SENTRY_AUTH_TOKEN: '',
          },
          url: webServerHealthUrl,
          reuseExistingServer: false,
          timeout: 120_000,
        }
      : null,
  ].filter((server) => server !== null),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
