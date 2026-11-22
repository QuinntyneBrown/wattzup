import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// The heap checks (L2-138 AC1, AGENTS.md "Prove it"): run only when a person asks, with `npm run heap`, never by verify,
// CI or an agent. One at a time against the production build, each reading the page's JavaScript heap after a forced
// garbage collection through the Chrome DevTools Protocol, so nothing else in the browser moves the reading.
const [production] = Array.isArray(base.webServer) ? base.webServer : [base.webServer];

export default defineConfig({
  ...base,
  testMatch: '**/*.heap.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 20 * 60_000,
  reporter: 'list',
  projects: [{ name: 'heap' }],
  webServer: production,
});
