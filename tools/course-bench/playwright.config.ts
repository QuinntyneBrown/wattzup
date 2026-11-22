import path from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * The course bench (README.md here): opens a race on a course in the real app, in a real Chromium window drawn by
 * this machine's GPU, and times its frames. It is not a test and not a sweep: neither `npm run e2e` nor CI reads
 * this file, and a person or an agent asked to runs it with `node tools/course-bench/bench.mjs`.
 */
const root = path.resolve(__dirname, '..', '..');
const port = Number(process.env['WZ_BENCH_PORT'] ?? 4330);
const uncapped = process.env['WZ_BENCH_UNCAPPED'] === '1';

export default defineConfig({
  testDir: __dirname,
  testMatch: 'bench.ts',
  outputDir: path.resolve(root, '.cache', 'course-bench'),
  workers: 1,
  reporter: 'list',
  timeout: 240_000,
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'off',
    headless: false,
    // The window's own size, one device pixel a CSS pixel: about 1920 x 1080 real pixels of scene.
    viewport: null,
    launchOptions: {
      args: [
        '--window-position=0,0',
        '--window-size=1936,1167',
        '--force-device-scale-factor=1',
        '--ignore-gpu-blocklist',
        '--enable-gpu',
        '--enable-unsafe-webgpu',
        ...(uncapped ? ['--disable-frame-rate-limit', '--disable-gpu-vsync'] : []),
      ],
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  // The production build, as riders get it, served as the API serves it (ADR 0026).
  webServer: {
    command: `node scripts/serve-dist.mjs ${port}`,
    cwd: path.resolve(root, 'frontend'),
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
