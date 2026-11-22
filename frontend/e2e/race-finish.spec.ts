// Acceptance test
// Traces to: L2-071 AC1, AC2
// Description: the race ends for the rider at the map's distance: their finish time is the race clock, their place is
// where they crossed the line, the bots that crossed it first ahead of them, and Results opens with the race's result.
// When the plan runs out before the line, nothing more is sent, so the last segment's level holds until the finish.
// Old Town Criterium is served 0.5 km long, so the line is reached in a spec's minute or two.
import type { Page } from '@playwright/test';
import {
  ECHELON_NOTIFY,
  resistanceFrame,
  targetResistanceWrite,
  workoutFrame,
} from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { maps } from './fixtures/maps';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { ResultsPage } from './pages/results.page';

const shortCriterium = maps.map((map) =>
  map.id === 'old-town-criterium' ? { ...map, distanceKm: 0.5 } : map,
);

/** Rides 661 W (120 rpm on level 32, 8.92 m/s) until Results opens, a frame every 4 s. */
async function rideToTheLine(page: Page, bluetooth: FakeBluetooth) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  for (let second = 0; second < 120 && !page.url().endsWith('/results'); second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await page.clock.runFor(4000);
  }
}

/** The race's result Results opens with, from the navigation's state. */
const result = (page: Page) =>
  page.evaluate(() => (history.state as { raceResult?: unknown }).raceResult);

/** Results opens, loaded lazily on the paused clock. */
async function resultsOpened(page: Page) {
  await expect(page).toHaveURL('/results');
  await new ResultsPage(page).shown();
}

test(
  'crossing the line first, the rider finishes 1st at the race clock, and Results opens (L2-071 AC1)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium', {
      catalogue: shortCriterium,
    });

    await rideToTheLine(page, bluetooth);

    await resultsOpened(page);
    // 29 s at 17.83 m/s is 517 m, the first second past 500 m.
    expect(await result(page)).toEqual({
      mapId: 'old-town-criterium',
      mapName: 'Old Town Criterium',
      mode: 'bots',
      pack: 'medium',
      finishTimeS: 29,
      place: 1,
      field: 10,
      standings: expect.any(Array),
    });
  },
);

test('bots that crossed the line first finish ahead of the rider (L2-071 AC1)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium', {
    catalogue: shortCriterium,
  });
  // Two minutes stopped: every bot of the medium pack rides 0.5 km well inside them.
  await page.clock.runFor(120_000);

  await rideToTheLine(page, bluetooth);

  await resultsOpened(page);
  expect(await result(page)).toEqual(
    expect.objectContaining({ finishTimeS: 149, place: 10, field: 10 }),
  );
});

test('when the plan runs out before the line, the last level holds until the finish (L2-071 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo', {
    catalogue: shortCriterium,
  });
  // Into the cool-down, whose level 6 goes as the hidden-tab catch-up sends the segment of the moment.
  await page.clock.fastForward('29:57');
  await page.clock.runFor(1000);
  await expect(race.clock).toHaveText('29:58 / 30:00');
  await page.clock.runFor(7000);
  await expect(race.clock).toHaveText('30:05 / 30:00');
  await expect(race.intervalLabel).toHaveText('Cool-down');
  await expect(race.intervalLeft).toHaveText('0:00');
  const writes = bluetooth.writes().map((write) => write.hex);
  expect(writes.at(-1)).toBe(targetResistanceWrite(6));

  await page.clock.runFor(10_000);
  await expect(race.clock).toHaveText('30:15 / 30:00');
  expect(bluetooth.writes().map((write) => write.hex)).toEqual(writes);

  await rideToTheLine(page, bluetooth);
  await resultsOpened(page);
  // The ghost rode the 0.5 km at the medium pace in the first minute and a half, so the rider is 2nd of the two.
  expect(await result(page)).toEqual(
    expect.objectContaining({ mode: 'solo', pack: null, place: 2, field: 2 }),
  );
});
