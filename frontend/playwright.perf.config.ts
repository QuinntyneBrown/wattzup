import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// The performance checks (L2-136 AC2, AC3): run only when a person asks, with `npm run perf`, on the device being
// measured, never by verify, CI or an agent. One at a time against the production build. The race's frames are only
// as real as the GPU Chromium draws with: on the reference laptop, run headed (`npm run perf -- --headed`).
const [production] = Array.isArray(base.webServer) ? base.webServer : [base.webServer];

export default defineConfig({
  ...base,
  testMatch: '**/*.perf.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 5 * 60_000,
  reporter: 'list',
  projects: [{ name: 'perf' }],
  webServer: production,
});
