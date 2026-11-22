// Acceptance test
// Traces to: L2-073 AC1, AC2, AC3; L2-078 AC1; L2-079 AC1
// Description: Results opens when a ride ends, from the result the ride hands over. A bots race reads "You finished",
// the place styled as a podium place, "of 10", the time and the podium line, over the final standings: every rider with
// a finish time, the rider's row current and bots marked. Off the podium the line says how far off. A solo race shows
// the time; a solo class shows the time, its output and its share on target. "Done" goes Home and "Race it again" to
// Race Setup with the same mode and pack; for a class, "Ride it again" goes to Class Start. Results with no ride sends
// the rider Home. Old Town Criterium is served 0.5 km long, so the line is reached in a minute or two.
import type { Page } from '@playwright/test';
import { hiitCardio } from './fixtures/classes';
import { startClassRide } from './fixtures/class-ride';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { maps } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { ResultsPage } from './pages/results.page';

const shortCriterium = maps.map((map) =>
  map.id === 'old-town-criterium' ? { ...map, distanceKm: 0.5 } : map,
);

/** Rides 661 W (120 rpm on level 32, 8.92 m/s) until Results opens, a frame every 4 s. */
async function rideToTheLine(page: Page, bluetooth: FakeBluetooth) {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  for (let second = 0; second < 120 && !page.url().includes('/results'); second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await page.clock.runFor(4000);
  }
}

/** "m:ss" as seconds. */
const seconds = (time: string) => {
  const [m, s] = time.split(':').map(Number);
  return m * 60 + s;
};

test.describe('Results', () => {
  test(
    'crossing first against bots, Results reads 1st of 10 on the podium over the final standings (L2-073 AC1, AC3)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium', {
        catalogue: shortCriterium,
      });
      await rideToTheLine(page, bluetooth);
      const results = new ResultsPage(page);
      await results.shown();

      await expect(results.context).toHaveText('Old Town Criterium · vs Bots');
      await expect(results.heading).toHaveText('Race results');
      await expect(results.lead).toHaveText('You finished');
      await expect(results.big).toHaveText('1st');
      await expect(results.big).toHaveClass(/results__big--podium/);
      await expect(results.of).toHaveText('of 10');
      await expect(results.sub).toHaveText('0:29 · on the podium');

      await expect(results.rows).toHaveCount(10);
      await expect(results.you).toHaveCount(1);
      expect(await results.rowText(results.rows.first())).toBe('You 0:29');
      await expect(results.rows.first()).toHaveAttribute('aria-current', 'true');
      const times: number[] = [];
      for (const row of await results.rows.all()) {
        const [name, time] = (await results.rowText(row)).split(/ (?=\d+:\d\d$)/);
        times.push(seconds(time));
        if (name !== 'You') await expect(results.bot(row)).toBeVisible();
      }
      expect(times).toEqual([...times].sort((a, b) => a - b));

      await results.again.click();
      await expect(page).toHaveURL('/race/old-town-criterium?mode=bots&pack=medium');
      const setup = new RaceSetupPage(page);
      await stepUntil(page, () => expect(setup.mode('Bots')).toBeChecked({ timeout: 50 }));
      await expect(setup.packStrength('medium')).toBeChecked();
    },
  );

  test('off the podium, the line says how many seconds off it (L2-073 AC2)', async ({
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
    const results = new ResultsPage(page);
    await results.shown();

    await expect(results.big).toHaveText('10th');
    await expect(results.big).not.toHaveClass(/results__big--podium/);
    const third = (await results.rowText(results.rows.nth(2))).split(' ').at(-1)!;
    const yours = (await results.rowText(results.you)).split(' ').at(-1)!;
    await expect(results.sub).toHaveText(
      `${yours} · ${seconds(yours) - seconds(third)} s off the podium`,
    );
    expect(await results.rowText(results.rows.last())).toBe(`You ${yours}`);
  });

  test('a solo race shows the time against your best, and Done goes Home (L2-073, L2-079 AC1)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo', {
      catalogue: shortCriterium,
    });
    await rideToTheLine(page, bluetooth);
    const results = new ResultsPage(page);
    await results.shown();

    await expect(results.context).toHaveText('Old Town Criterium · vs your best');
    await expect(results.big).toHaveText('0:29');
    await expect(results.of).toHaveCount(0);
    await expect(results.standings).toHaveCount(0);
    await expect(results.again).toHaveAttribute('href', '/race/old-town-criterium?mode=solo');

    await results.done.click();
    await expect(page).toHaveURL('/');
  });

  test('Race it again opens Race Setup with the mode and pack the race had (L2-079 AC1)', async ({
    page,
    api,
  }) => {
    api.answer('GET', '/api/maps', maps);
    const setup = new RaceSetupPage(page);
    await page.goto('/race/old-town-criterium?mode=bots&pack=hard');
    await expect(setup.mode('Bots')).toBeChecked();
    await expect(setup.packStrength('hard')).toBeChecked();

    await page.goto('/race/old-town-criterium?mode=solo');
    await expect(setup.mode('Your best time')).toBeChecked();
  });

  test('a solo class shows its time, output and share on target, and Ride it again goes to Class Start (L2-078 AC1)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    await startClassRide(page, bluetooth, api);
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await page.clock.runFor(100);
    await page.clock.fastForward('29:58');
    await page.clock.runFor(2100);
    const results = new ResultsPage(page);
    await results.shown();

    await expect(results.context).toHaveText('30 Minute HIIT Cardio · Solo');
    await expect(results.heading).toHaveText('Class results');
    await expect(results.lead).toHaveText('You finished');
    await expect(results.big).toHaveText('30:00');
    await expect(results.sub).toHaveText('0 kJ · 0% on target');
    await expect(results.again).toHaveText('Ride it again');

    await results.again.click();
    await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);
  });

  test('Results with no ride sends the rider Home', async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    await new ResultsPage(page).open();

    await expect(page).toHaveURL('/');
    await expect(new HomePage(page).main).toBeAttached();
  });
});
