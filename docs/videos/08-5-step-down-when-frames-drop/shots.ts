import type { Page } from "@playwright/test";
import { startRace, stepUntil } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { type Size, frame, pictures, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 8.5, Step down when frames drop, in the running app: a solo race on Old Town
 * Criterium opened at High and judged as a rider's ride is, before and after frames run slow (at 1.5 × the frame
 * period it drops to Medium; at 3.6 × straight to Low), at 1440 px; and the dropped race at 390, 768 and 1024 px.
 * `main`'s test-only hook opens the level; the paused clock's `fastForward` makes each frame arrive late. The browser
 * has no WebGPU (the shared fixture's `webgl`), so the world draws with WebGL 2, in software. Not a test and not a
 * sweep: only `node tools/video-record/record.mjs docs/videos/08-5-step-down-when-frames-drop`.
 */

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

/** Draws `seconds` of frames, each `ms` after the one before. */
async function frames(page: Page, ms: number, seconds: number): Promise<void> {
  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += ms) await page.clock.fastForward(ms);
}

async function opened(page: Page, fixtures: Parameters<Parameters<typeof test>[2]>[0], size: Size) {
  const { bluetooth, api, webgl, worldRide } = fixtures;
  await webgl.withoutWebGpu();
  await worldRide.open("high");
  await frame(page, size);
  const race = await startRace(page, bluetooth, api, "old-town-criterium", "mode=solo", { world: true });
  await stepUntil(page, () => expect(race.backend).toHaveCount(1, { timeout: 50 }));
  return race;
}

test("before and after the drops at XL", async ({ page, bluetooth, api, webgl, worldRide }) => {
  test.setTimeout(600_000);
  await opened(page, { page, bluetooth, api, webgl, worldRide } as never, "XL");
  await still(page, () => pictures(page));
  await shot(page, "high-xl");
  await frames(page, 25, 4.3);
  expect((await worldRide.report())?.tier).toBe("medium");
  await still(page, () => pictures(page));
  await shot(page, "medium-xl");
  await frames(page, 60, 4.3);
  expect((await worldRide.report())?.tier).toBe("low");
  await still(page, () => pictures(page));
  await shot(page, "low-xl");
});

for (const size of ["XS", "M", "L"] as Size[]) {
  test(`dropped to Low at ${size}`, async ({ page, bluetooth, api, webgl, worldRide }) => {
    test.setTimeout(600_000);
    await opened(page, { page, bluetooth, api, webgl, worldRide } as never, size);
    await frames(page, 60, 4.3);
    expect((await worldRide.report())?.tier).toBe("low");
    await still(page, () => pictures(page));
    await shot(page, `low-${size.toLowerCase()}`);
  });
}
