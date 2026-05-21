import { defineConfig, devices } from '@playwright/test';

import { frontendBaseUrl } from './e2e/config/env';

const shouldStartWebServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: frontendBaseUrl,
    trace: 'on-first-retry',
  },
  webServer: shouldStartWebServer
    ? {
        command: 'npm run dev',
        url: frontendBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
