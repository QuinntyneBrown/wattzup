import { defineConfig, devices } from '@playwright/test';

// E2E_PORT moves the spec servers when another checkout already serves 4300 (and 4301).
const port = Number(process.env['E2E_PORT'] ?? 4300);
const developmentPort = port + 1;

// Behaviour specs only, Chromium only, never retried (AGENTS.md). e2e/fixtures/test.ts fails a spec on a page error,
// a request off localhost, an unanswered backend or hub request, or an unexpected Bluetooth call.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: process.env['CI'] ? '100%' : undefined,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${port}`,
    locale: 'en-US',
    timezoneId: 'UTC',
    // The app follows the device's colour scheme (L2-164 AC3) and Playwright's default asks for light; the design is dark.
    colorScheme: 'dark',
    trace: 'retain-on-failure',
    // A service worker would answer the page's requests before the fixtures could; only the app cache's spec allows it.
    serviceWorkers: 'block',
  },
  projects: [
    // The production build, as riders get it.
    { name: 'chromium', testIgnore: '**/*.development.spec.ts' },
    // The development build, the only one that honours ?simulate (L2-024).
    {
      name: 'development',
      testMatch: '**/*.development.spec.ts',
      use: { baseURL: `http://localhost:${developmentPort}` },
    },
  ],
  // Each build served statically, as the API serves it in production (ADR 0026).
  webServer: [
    {
      command: `npx ng build ride && node scripts/serve-dist.mjs ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
    {
      command: `npx ng build ride --configuration development --output-path dist/ride-development && node scripts/serve-dist.mjs ${developmentPort} dist/ride-development/browser`,
      url: `http://localhost:${developmentPort}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
