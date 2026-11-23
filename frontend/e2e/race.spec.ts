// Acceptance test
// Traces to: L2-058 AC1, AC2; L2-064 AC4
// Description: a race on the fake Bluetooth, started on Playwright's paused clock (startRace): the scene as one
// described image, and the top bar with the lockup, the map and its route line for the mode, the bike and the clock.
import { ECHELON_NOTIFY, workoutFrame } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

test(
  'a race against medium bots opens full screen with its top bar and the clock at 0:00 (L2-058 AC1, L2-064 AC4)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );

    await expect(race.heading).toHaveText('Race, Old Town Criterium');
    await expect(race.scene).toHaveAccessibleName(
      'The Old Town Criterium world: a cobbled European old town on race day',
    );
    await expect(page.locator('.app-header')).toHaveCount(0);
    await expect(race.map).toHaveText('Old Town Criterium');
    await expect(race.route).toHaveText('Cathedral Circuit · vs Bots, medium');
    // The link reads connected on the bike's first notification after it is initialised.
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(80));
    await page.clock.runFor(100);
    await expect(race.bike).toHaveText('Echelon EX-5s connected');
    await expect(race.clock).toHaveText('0:00 / 30:00');
    await expect(race.clock).toHaveAccessibleName('0:00 of 30:00');

    await page.clock.fastForward('05:01');
    await page.clock.runFor(100);
    await expect(race.clock).toHaveText('5:01 / 30:00');
    await expect(page).toHaveTitle('Race · Telo Ride');
  },
);

test('a solo race reads “vs your best” (L2-058 AC2)', async ({ page, bluetooth, api }) => {
  const race = await startRace(page, bluetooth, api, 'prairie-paceline', 'mode=solo');

  await expect(race.map).toHaveText('Prairie Paceline');
  await expect(race.route).toHaveText('Route 9 Wind Farm · vs your best');
});
