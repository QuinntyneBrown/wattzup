import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// The sweeps (AGENTS.md, E2E): written and kept current, but run only when a person asks, never by verify, CI or an
// agent. `npm run sweep:responsive` checks every screen at every breakpoint (L2-139 AC1) against the production build.
const [production] = Array.isArray(base.webServer) ? base.webServer : [base.webServer];

export default defineConfig({
  ...base,
  testMatch: '**/*.sweep.ts',
  projects: [{ name: 'sweeps' }],
  webServer: production,
});
