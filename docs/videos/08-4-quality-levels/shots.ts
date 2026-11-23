import type { Page } from "@playwright/test";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { startRace, stepUntil } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import type { Tier } from "../../../frontend/e2e/fixtures/world-ride-probe";
import { type Size, frame, pictures, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 8.4, Quality levels, in the running app: one solo race on Old Town Criterium
 * drawn at Low, Medium and High at 1440 px, the same race asked for at Ultra (drawn at High, since the browser has
 * WebGL 2 only), and at Low at 390, 768 and 1024 px. No rider option picks a level until Settings, so `main`'s
 * test-only hook pins each. The browser has no WebGPU (the shared fixture's `webgl`), so the world draws with WebGL 2,
 * in software. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/08-4-quality-levels`.
 */

/** A screenshot settles on animation frames the paused clock holds back, so the clock steps 16 ms each 50 ms. */
async function still(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}
const shot = (page: Page, name: string) => still(page, () => shotOf(page, name));

async function ride(page: Page, bluetooth: FakeBluetooth, seconds: number) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(16));
  for (let second = 0; second < seconds; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
    await page.clock.runFor(1000);
  }
}

const shots: [Tier, Size, string][] = [
  ["low", "XL", "low-xl"],
  ["medium", "XL", "medium-xl"],
  ["high", "XL", "high-xl"],
  ["ultra", "XL", "ultra-xl"],
  ["low", "XS", "low-xs"],
  ["low", "M", "low-m"],
  ["low", "L", "low-l"],
];

for (const [tier, size, name] of shots) {
  test(`Old Town Criterium at ${tier}, ${size}`, async ({ page, bluetooth, api, webgl, worldRide }) => {
    test.setTimeout(300_000);
    await webgl.withoutWebGpu();
    await worldRide.pin(tier);
    await frame(page, size);
    const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo", { world: true });
    await stepUntil(page, () => expect(race.backend).toHaveCount(1, { timeout: 50 }));
    await ride(page, bluetooth, 2);
    await expect(race.clock).toBeVisible();
    await still(page, () => pictures(page));
    await shot(page, name);
  });
}
