// Acceptance test
// Traces to: L2-166 AC1, AC2
// Description: a race on a map whose world is built as a course draws the course's map, loaded from the app's own
// `courses/` folder, and moves along it as the rider rides: two pictures of the world a few seconds apart
// differ. Comparing two pictures of the same canvas reads no pixel's colour (ADR 0021). The course draws in software
// here, on WebGL2.
import type { Locator, Page } from '@playwright/test';
import { ibizaCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';

/** Rides `rpm` for a second of the ride's clock. */
async function ride(page: Page, bluetooth: FakeBluetooth, rpm: number): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
  await page.clock.runFor(1000);
}

/** A picture of the world alone, as race-world-scene.spec.ts takes it. */
async function picture(page: Page, canvas: Locator): Promise<Buffer> {
  await page.addStyleTag({
    content: '.race > :not(.race-scene) { visibility: hidden !important; }',
  });
  let done = false;
  const taken = canvas.screenshot().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return taken;
}

test.describe('a course', () => {
  // The map is drawn in software here.
  test.slow();

  test("draws the course's map and moves along it as the rider rides (L2-166 AC1, AC2)", async ({
    page,
    bluetooth,
    api,
    webgl,
  }) => {
    await webgl.withoutWebGpu();
    const loaded: string[] = [];
    page.on('requestfinished', (request) => loaded.push(new URL(request.url()).pathname));
    const race = await startRace(page, bluetooth, api, ibizaCourseMap.id, 'mode=solo', {
      catalogue: [ibizaCourseMap],
      world: true,
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    expect(loaded).toContain('/courses/ibiza.glb');
    expect(loaded).toContain('/courses/ibiza.course.json');
    await ride(page, bluetooth, 80);
    const first = await picture(page, race.world);

    await ride(page, bluetooth, 80);

    expect((await picture(page, race.world)).equals(first)).toBe(false);
  });
});
