import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Saves the screenshots of a video (docs/videos/README.md, "Screenshots"). It is not a test run
 * and not a sweep: it borrows Playwright to open the running Angular app and save pictures of it.
 * The video folder's `shots.ts` says which states to open, with the shared fixture and page objects
 * of `frontend/e2e/`, as every spec does. Neither `npm run e2e` nor CI reads this file. Run it with
 * `node tools/video-record/record.mjs <folder>`.
 */
const folder = process.env["WZ_VIDEO_DIR"];
if (!folder)
  throw new Error(
    "Run this through tools/video-record/record.mjs <video folder>.",
  );
const root = path.resolve(__dirname, "..", "..");

export default defineConfig({
  testDir: path.resolve(root, folder),
  testMatch: "shots.ts",
  outputDir: path.resolve(root, ".cache", "video-record"),
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:4310",
    locale: "en-US",
    timezoneId: "UTC",
    trace: "off",
  },
  // Chromium only (AGENTS.md). Double density, the phone window, the dark theme and no motion
  // are the defaults; `frame(page, 'XL', 'light')` in shots.ts changes the window and the theme.
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 780 },
        deviceScaleFactor: 2,
        colorScheme: "dark",
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],
  webServer: {
    command: "npx ng serve ride --port 4310",
    cwd: path.resolve(root, "frontend"),
    url: "http://localhost:4310",
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
