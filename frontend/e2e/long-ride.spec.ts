// Acceptance test
// Traces to: L2-138 AC2; L2-044 AC2
// Description: a long ride keeps its trace bounded: one sample a second in a buffer sized for the longest ride, never
// a list that grows with it. A three-hour class ridden to its end submits exactly 10,800 speed samples, and the
// distance they add up to.
import { startClassRide } from './fixtures/class-ride';
import { enduranceClass } from './fixtures/classes';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';

interface SubmittedRide {
  readonly elapsedSeconds: number;
  readonly distanceMeters: number;
  readonly speedSamplesKmh: readonly number[];
}

test('a three-hour class submits one speed sample a second, 10,800 in all (L2-138 AC2)', async ({
  page,
  bluetooth,
  api,
}) => {
  const ride = await startClassRide(page, bluetooth, api, { ride: enduranceClass });
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85));
  await page.clock.runFor(1000);
  await expect(ride.clock).toHaveText('0:01 / 3:00:00');

  await page.clock.fastForward('02:59:58');
  await page.clock.runFor(2000);

  await expect(page).toHaveURL('/results');
  await expect.poll(() => api.sentBodies('POST', '/api/rides')).toHaveLength(1);
  const [submitted] = api.sentBodies('POST', '/api/rides') as SubmittedRide[];
  expect(submitted!.elapsedSeconds).toBe(10_800);
  expect(submitted!.speedSamplesKmh).toHaveLength(10_800);
  const sampled = submitted!.speedSamplesKmh.reduce((metres, kmh) => metres + kmh / 3.6, 0);
  expect(sampled).toBeCloseTo(submitted!.distanceMeters, 0);
});
