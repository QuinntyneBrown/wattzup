// Acceptance test
// Traces to: L2-062 AC1, AC2
// Description: the route panel reads the grade and the metres climbed at the rider's place on the route profile,
// which is main's, and the distance ridden at the virtual speed from power; the profile is one image with the
// rider's place marked.
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

test(
  'the route panel reads the grade, metres climbed and distance ridden on the profile (L2-062 AC1, AC2)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );

    await expect(race.grade).toHaveText('+0.5%');
    await expect(race.climbed).toHaveText('0 m climbed');
    await expect(race.distance).toHaveText('0.00 km');
    await expect(race.profile).toHaveRole('img');
    await expect(race.profile).toHaveAccessibleName('Route profile, 43 m of elevation');

    // A minute at 80 rpm on level 8 is 143 W: 38.5 km/h, 642 m.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
    for (let second = 0; second < 60; second++) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
      await page.clock.runFor(1000);
    }
    await expect(race.distance).toHaveText('0.64 km');

    await page.clock.fastForward('04:01');
    await page.clock.runFor(100);
    await expect(race.grade).toHaveText('+2.2%');
    await expect(race.climbed).toHaveText('10 m climbed');
    await expect(race.here).toHaveAttribute('x1', '301');
    // Stopped, the rider rides no further.
    await expect(race.distance).toHaveText('0.64 km');
  },
);
