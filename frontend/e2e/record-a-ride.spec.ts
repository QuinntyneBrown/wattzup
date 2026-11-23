// Acceptance test
// Traces to: L2-044 AC2, AC4; L2-125 AC2, AC3; L2-037 AC3
// Description: a finished ride is submitted to the backend once, as it ends, with the ride id the app gave it when it
// started: a race with its map, mode, pack, place and field, a class with its class, and both with their seconds,
// distance, output, highest power and speed, the share of running seconds within 10 % of target power (for its XP),
// the speed of each second ridden (which add up to the distance, so the backend can check it), the finish instant
// and the device's time zone. It carries no XP, stars or unlocks.
// Old Town Criterium is served 0.5 km long, so the line is reached in a spec's minute.
import type { Page } from '@playwright/test';
import { startClassRide } from './fixtures/class-ride';
import { hiitCardio } from './fixtures/classes';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { maps } from './fixtures/maps';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

interface SubmittedRide {
  readonly rideId: string;
  readonly distanceMeters: number;
  readonly speedSamplesKmh: readonly number[];
  readonly [fact: string]: unknown;
}

const shortCriterium = maps.map((map) =>
  map.id === 'old-town-criterium' ? { ...map, distanceKm: 0.5 } : map,
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Rides 661 W (120 rpm on level 32, 64.18 km/h) until Results opens, a frame every 4 s. */
async function rideToTheLine(page: Page, bluetooth: FakeBluetooth) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  for (let second = 0; second < 120 && !page.url().endsWith('/results'); second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await page.clock.runFor(4000);
  }
}

/** The metres the ride's per-second speeds add up to. */
const sampledMeters = (ride: SubmittedRide) =>
  ride.speedSamplesKmh.reduce((metres, kmh) => metres + kmh / 3.6, 0);

test(
  'a finished race is submitted once, with its facts and the ride id it started with (L2-044 AC2)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium', {
      catalogue: shortCriterium,
    });

    await rideToTheLine(page, bluetooth);

    await expect(page).toHaveURL('/results');
    await expect.poll(() => api.sentBodies('POST', '/api/rides')).toHaveLength(1);
    const [ride] = api.sentBodies('POST', '/api/rides') as SubmittedRide[];
    const timeZoneId = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(ride).toEqual({
      rideId: expect.stringMatching(UUID),
      kind: 'race',
      mapId: 'old-town-criterium',
      mode: 'bots',
      pack: 'medium',
      place: 1,
      fieldSize: 10,
      elapsedSeconds: 29,
      distanceMeters: expect.any(Number),
      outputKj: expect.any(Number),
      maxPowerWatts: 661,
      maxSpeedKmh: 64.18,
      // 661 W against the warm-up's 143 W target is never within 10 %.
      onTargetShare: 0,
      speedSamplesKmh: expect.any(Array),
      finishedAt: expect.stringMatching(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/),
      timeZoneId,
    });
    // 29 s at 64.18 km/h is 517 m, the first second past 500 m, and each second adds its speed.
    expect(ride.speedSamplesKmh).toHaveLength(29);
    expect(ride.distanceMeters).toBeCloseTo(517, 0);
    expect(sampledMeters(ride)).toBeCloseTo(ride.distanceMeters, 0);
    expect(ride['outputKj']).toBeCloseTo((661 * 29) / 1000, 1);
  },
);

test('a finished class is submitted once, with its class and the distance of the bike’s speed (L2-044 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startClassRide(page, bluetooth, api);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(24));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
  await page.clock.runFor(1000);

  await page.clock.fastForward('29:58');
  await page.clock.runFor(2000);

  await expect(page).toHaveURL('/results');
  await expect.poll(() => api.sentBodies('POST', '/api/rides')).toHaveLength(1);
  const [ride] = api.sentBodies('POST', '/api/rides') as SubmittedRide[];
  expect(ride).toEqual(
    expect.objectContaining({
      rideId: expect.stringMatching(UUID),
      kind: 'class',
      classId: hiitCardio.id,
      elapsedSeconds: 1800,
    }),
  );
  expect(ride).not.toHaveProperty('mapId');
  expect(ride.speedSamplesKmh).toHaveLength(1800);
  expect(ride.distanceMeters).toBeGreaterThan(0);
  expect(sampledMeters(ride)).toBeCloseTo(ride.distanceMeters, 0);
});

test('a ride carries no XP, stars or unlocks, which the backend computes (L2-044 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo', {
    catalogue: shortCriterium,
  });

  await rideToTheLine(page, bluetooth);

  await expect.poll(() => api.sentBodies('POST', '/api/rides')).toHaveLength(1);
  const [ride] = api.sentBodies('POST', '/api/rides') as SubmittedRide[];
  // Facts only: nothing else is sent.
  expect(Object.keys(ride).sort()).toEqual(
    [
      'rideId',
      'kind',
      'mapId',
      'mode',
      'pack',
      'place',
      'fieldSize',
      'elapsedSeconds',
      'distanceMeters',
      'outputKj',
      'maxPowerWatts',
      'maxSpeedKmh',
      'onTargetShare',
      'speedSamplesKmh',
      'finishedAt',
      'timeZoneId',
    ].sort(),
  );
  expect(ride).toEqual(expect.objectContaining({ mode: 'solo', pack: null }));
});

test('the share of running seconds within 10 % of target power goes with the ride (L2-037 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo', {
    catalogue: shortCriterium,
  });
  // The warm-up's level 8 at its 80 rpm aim is its target, 143 W, for 40 seconds; then 661 W to the line.
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
  for (let second = 0; second < 40; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
    await page.clock.runFor(4000);
  }

  await rideToTheLine(page, bluetooth);

  await expect.poll(() => api.sentBodies('POST', '/api/rides')).toHaveLength(1);
  const [ride] = api.sentBodies('POST', '/api/rides') as SubmittedRide[];
  expect(ride['onTargetShare']).toBeCloseTo(40 / (ride['elapsedSeconds'] as number), 3);
  expect(ride['onTargetShare']).toBeGreaterThan(0.5);
});
