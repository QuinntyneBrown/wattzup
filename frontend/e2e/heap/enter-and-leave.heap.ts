// Heap check, run only when a person asks (`npm run heap`)
// Traces to: L2-138 AC1; AGENTS.md "Prove it"
// Description: leaving a screen returns its memory. The race with its 3D world, and a class ride with its world loading,
// are each entered and left six times in one page on the running clock; after the first leave every lazy chunk and
// cache is warm, so five more rounds may grow the used heap by at most 5 MB. A leaked world (its scene, materials and
// renderer) or a leaked ride (its ticker, recorder and listeners) costs far more than that each round.
import { startClassRide } from '../fixtures/class-ride';
import { startRace } from '../fixtures/race';
import { expect, test } from '../fixtures/test';
import { ClassStartPage } from '../pages/class-start.page';
import { RaceSetupPage } from '../pages/race-setup.page';
import { WorldLoadingPage } from '../pages/world-loading.page';
import { expectHeldHeap, usedHeap } from './heap';

const ROUNDS = 5;
const LIMIT_MB = 5;
const WORLD_DRAWN = 60_000;

test('the race and its world, entered and left six times, hold the heap', async ({
  page,
  bluetooth,
  api,
  webgl,
}) => {
  await webgl.withoutWebGpu();
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo', {
    world: true,
  });
  await page.clock.resume();
  const setup = new RaceSetupPage(page);
  const leave = async () => {
    await expect(race.backend).toBeVisible({ timeout: WORLD_DRAWN });
    await race.leave.click();
    await expect(setup.title).toBeVisible();
    await expect(race.world).toHaveCount(0);
  };

  await leave();
  const first = await usedHeap(page);
  for (let round = 0; round < ROUNDS; round++) {
    await setup.mode('Your best time').click();
    await setup.start.click();
    await expect(page).toHaveURL('/race/old-town-criterium/ride?mode=solo');
    await leave();
  }

  expectHeldHeap('The race', first, await usedHeap(page), LIMIT_MB);
});

test('a class ride, entered and left six times, holds the heap', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api);
  await page.clock.resume();
  const start = new ClassStartPage(page);
  const loading = new WorldLoadingPage(page);
  const leave = async () => {
    await expect(ride.clock).toBeVisible();
    await ride.leave.click();
    await expect(start.start).toBeVisible();
  };

  await leave();
  const first = await usedHeap(page);
  for (let round = 0; round < ROUNDS; round++) {
    await start.start.click();
    await expect(loading.start).toBeEnabled({ timeout: WORLD_DRAWN });
    await loading.start.click();
    await leave();
  }

  expectHeldHeap('The class ride', first, await usedHeap(page), LIMIT_MB);
});
