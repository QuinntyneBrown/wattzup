import type { Page } from "@playwright/test";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { maps } from "../../../frontend/e2e/fixtures/maps";
import { startRace, stepUntil } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import type { RacePage } from "../../../frontend/e2e/pages/race.page";
import { type Size, frame, pictures, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 8.3, Draw riders and ghost, in the running app: a bots race on Old Town
 * Criterium with the nine bots drawn in their jerseys at 390, 768, 1024 and 1440 px; a solo race with the translucent
 * gold ghost beside the rider; and the bots in Neon Docklands' world. The browser has no WebGPU (the shared fixture's
 * `webgl`), so the world draws with WebGL 2, in software. The fake Bluetooth plays the bike and the API fixture serves
 * the map catalogue. Not a test and not a sweep: only `node tools/video-record/record.mjs
 * docs/videos/08-3-draw-riders-and-ghost`.
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

/** Rides `rpm` for `seconds`, a frame every second; every frame of it draws the world. */
async function ride(page: Page, bluetooth: FakeBluetooth, rpm: number, seconds: number) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(16));
  for (let second = 0; second < seconds; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
    await page.clock.runFor(1000);
  }
}

/**
 * Opens a race with its world drawn. A new rider has only Prairie Paceline and Old Town Criterium open, so another
 * map's world is filmed by serving that map in Old Town Criterium's open place, on its plan (L82).
 */
async function raceWithWorld(
  page: Page,
  bluetooth: FakeBluetooth,
  api: Parameters<typeof startRace>[2],
  mapId: string,
  query: string,
): Promise<RacePage> {
  const oldTown = maps.find((map) => map.id === "old-town-criterium")!;
  const shown = maps.find((map) => map.id === mapId)!;
  const catalogue = maps.map((map) =>
    map.id === oldTown.id ? { ...shown, id: oldTown.id, plan: oldTown.plan, unlockGoal: null, unlockMapId: null } : map,
  );
  const race = await startRace(page, bluetooth, api, oldTown.id, query, { world: true, catalogue });
  await stepUntil(page, () => expect(race.backend).toHaveCount(1, { timeout: 50 }));
  return race;
}

const settle = async (page: Page, race: RacePage) => {
  await expect(race.clock).toBeVisible();
  await still(page, () => pictures(page));
};

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the bots on Old Town Criterium at ${size}`, async ({ page, bluetooth, api, webgl }) => {
    test.setTimeout(300_000);
    await webgl.withoutWebGpu();
    await frame(page, size);
    const race = await raceWithWorld(page, bluetooth, api, "old-town-criterium", "mode=bots&pack=medium");
    await ride(page, bluetooth, 80, 6);
    await settle(page, race);
    await shot(page, `bots-${size.toLowerCase()}`);
  });
}

test("the ghost of a solo race at XL", async ({ page, bluetooth, api, webgl }) => {
  test.setTimeout(300_000);
  await webgl.withoutWebGpu();
  await frame(page, "XL");
  const race = await raceWithWorld(page, bluetooth, api, "old-town-criterium", "mode=solo");
  await ride(page, bluetooth, 80, 3);
  await settle(page, race);
  await shot(page, "ghost-xl");
});

test("the bots in Neon Docklands at XL", async ({ page, bluetooth, api, webgl }) => {
  test.setTimeout(300_000);
  await webgl.withoutWebGpu();
  await frame(page, "XL");
  const race = await raceWithWorld(page, bluetooth, api, "neon-docklands", "mode=bots&pack=medium");
  await ride(page, bluetooth, 80, 6);
  await settle(page, race);
  await shot(page, "docklands-xl");
});
