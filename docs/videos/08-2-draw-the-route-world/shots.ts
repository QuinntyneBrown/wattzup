import type { Page } from "@playwright/test";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { maps } from "../../../frontend/e2e/fixtures/maps";
import { startRace, stepUntil } from "../../../frontend/e2e/fixtures/race";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import type { RacePage } from "../../../frontend/e2e/pages/race.page";
import { type Size, frame, pictures, shot as shotOf } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 8.2, Draw the route world, in the running app: a solo race on Old Town
 * Criterium with `main`'s world drawn behind the HUD at 390, 768, 1024 and 1440 px; the same race a few seconds of
 * riding apart; and four more maps' worlds at 1440 px (Neon Docklands, Vice City, Prairie Paceline and Dolomites).
 * The browser has no WebGPU (the shared fixture's `webgl`), so the world draws with WebGL 2, in software. The fake
 * Bluetooth plays the bike and the API fixture serves the map catalogue. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/08-2-draw-the-route-world`.
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

/** Rides 90 rpm for `seconds`, a frame every second; every frame of it draws the world. */
async function ride(page: Page, bluetooth: FakeBluetooth, seconds: number) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(16));
  for (let second = 0; second < seconds; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
    await page.clock.runFor(1000);
  }
}

/**
 * Opens a solo race with its world drawn. A new rider has only Prairie Paceline and Old Town Criterium open, so to film
 * another map's world the catalogue serves that map in Old Town Criterium's open place, on its plan, whose warm-up's
 * level 8 the race fixture waits for.
 */
async function raceWithWorld(
  page: Page,
  bluetooth: FakeBluetooth,
  api: Parameters<typeof startRace>[2],
  mapId: string,
): Promise<RacePage> {
  const oldTown = maps.find((map) => map.id === "old-town-criterium")!;
  const shown = maps.find((map) => map.id === mapId)!;
  const catalogue = maps.map((map) =>
    map.id === oldTown.id ? { ...shown, id: oldTown.id, plan: oldTown.plan, unlockGoal: null, unlockMapId: null } : map,
  );
  const race = await startRace(page, bluetooth, api, oldTown.id, "mode=solo", { world: true, catalogue });
  await stepUntil(page, () => expect(race.backend).toHaveCount(1, { timeout: 50 }));
  return race;
}

const settle = async (page: Page, race: RacePage) => {
  await expect(race.clock).toBeVisible();
  await still(page, () => pictures(page));
};

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Old Town Criterium's world at ${size}`, async ({ page, bluetooth, api, webgl }) => {
    test.setTimeout(300_000);
    await webgl.withoutWebGpu();
    await frame(page, size);
    const race = await raceWithWorld(page, bluetooth, api, "old-town-criterium");
    await ride(page, bluetooth, 3);
    await settle(page, race);
    await shot(page, `world-${size.toLowerCase()}`);
    if (size === "XL") {
      await ride(page, bluetooth, 3);
      await settle(page, race);
      await shot(page, "later-xl");
    }
  });
}

for (const mapId of ["neon-docklands", "vice-city", "prairie-paceline", "dolomites"]) {
  test(`${mapId}'s world at XL`, async ({ page, bluetooth, api, webgl }) => {
    test.setTimeout(300_000);
    await webgl.withoutWebGpu();
    await frame(page, "XL");
    const race = await raceWithWorld(page, bluetooth, api, mapId);
    await ride(page, bluetooth, 3);
    await settle(page, race);
    await shot(page, `${mapId}-xl`);
  });
}
