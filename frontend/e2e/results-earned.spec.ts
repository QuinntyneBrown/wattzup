// Acceptance test
// Traces to: L2-074 AC1, AC2, AC3, AC4; L2-075 AC1, AC2, AC3; L2-077 AC1, AC3, AC4
// Description: Results shows what the ride earned from the backend's answer. The XP panel waits while the ride is
// recorded, then shows "XP earned", the total and each line in the order returned; "Stars on {map}" shows the stars held
// and "+{n} new star(s)" only when some were earned, and a class has no stars panel. A solo race faster than the best
// reads "New personal best" with "Best before", a slower one "You finished" with "Best", and a first finish the time
// alone. With no network the panel says the XP will be added when the rider is back online, and fills once they are; a
// refused ride earned no XP. Old Town Criterium is served 0.5 km long, so the line is reached in a minute or two.
import type { Page, Request } from '@playwright/test';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { maps } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { openResults, recorded, soloClass, soloRace } from './fixtures/results';
import { expect, test } from './fixtures/test';
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

test.describe('XP, stars and personal best', () => {
  test(
    'after a bots race the XP panel waits, then shows the XP line by line and the stars on the map (L2-074 AC1, AC2, L2-075 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      let answer: () => void = () => undefined;
      const held = new Promise<void>((resolve) => (answer = resolve));
      api.answer('POST', '/api/rides', async (request: Request) => {
        await held;
        return {
          status: 201,
          body: recorded(
            request.postDataJSON() as { rideId: string },
            [
              ['Finished', 100],
              ['1st of 10', 200],
              ['Podium', 75],
              ['0% on target', 0],
              ['4-day streak', 40],
            ],
            { held: 2, earned: 2 },
            { bestSeconds: 57, previousBestSeconds: null, isNewBest: false },
          ),
        };
      });
      await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium', {
        catalogue: shortCriterium,
      });
      await rideToTheLine(page, bluetooth);
      const results = new ResultsPage(page);
      await results.shown();

      await expect(results.xpNote).toHaveText('Recording your ride…');
      await expect(results.starsPanel).toHaveCount(0);

      answer();
      // The page's clock is paused, so it is stepped until the answer has rendered.
      await stepUntil(page, () => expect(results.xpTotal).toHaveText('+415', { timeout: 50 }));
      expect(await results.xpLineTexts()).toEqual([
        'Finished +100',
        '1st of 10 +200',
        'Podium +75',
        '0% on target +0',
        '4-day streak +40',
      ]);
      await expect(results.xpNote).toHaveCount(0);
      await expect(results.starsTitle).toHaveText('Stars on Old Town Criterium');
      await expect(results.stars).toHaveAccessibleName('2 of 3 stars');
      await expect(results.newStars).toHaveText('+2 new stars');
      // A bots race keeps its place: the best is for a race against it.
      await expect(results.lead).toHaveText('You finished');
      await expect(results.big).toHaveText('1st');
    },
  );

  test.describe('opened again after a reload', () => {
    test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

    test('a solo race faster than the best reads New personal best and Best before, and +1 new star (L2-077 AC1, L2-075 AC1)', async ({
      page,
      api,
    }) => {
      const state = soloRace(1598);
      api.answer('POST', '/api/rides', {
        ...recorded(
          state.ride,
          [['Finished', 100]],
          { held: 3, earned: 1 },
          {
            bestSeconds: 1598,
            previousBestSeconds: 1630,
            isNewBest: true,
          },
        ),
      });
      await openResults(page, state);
      const results = new ResultsPage(page);

      await expect(results.lead).toHaveText('New personal best');
      await expect(results.big).toHaveText('26:38');
      await expect(results.sub).toHaveText('Best before: 27:10');
      await expect(results.standings).toHaveCount(0);
      await expect(results.newStars).toHaveText('+1 new star');
    });

    test('a solo race slower than the best reads You finished and Best, with no new-star line (L2-077 AC3, L2-075 AC2)', async ({
      page,
      api,
    }) => {
      const state = soloRace(1652);
      api.answer(
        'POST',
        '/api/rides',
        recorded(
          state.ride,
          [['Finished', 100]],
          { held: 3, earned: 0 },
          {
            bestSeconds: 1598,
            previousBestSeconds: 1598,
            isNewBest: false,
          },
        ),
      );
      await openResults(page, state);
      const results = new ResultsPage(page);

      await expect(results.sub).toHaveText('Best: 26:38');
      await expect(results.lead).toHaveText('You finished');
      await expect(results.big).toHaveText('27:32');
      await expect(results.stars).toHaveAccessibleName('3 of 3 stars');
      await expect(results.newStars).toHaveCount(0);
    });

    test('a first solo finish reads You finished and the time alone (L2-077 AC4)', async ({
      page,
    }) => {
      // The shared fixture answers a race with its first best: the ride's own time, no previous best.
      await openResults(page, soloRace(1598));
      const results = new ResultsPage(page);

      await expect(results.xpTotal).toHaveText('+110');
      await expect(results.lead).toHaveText('You finished');
      await expect(results.big).toHaveText('26:38');
      await expect(results.sub).toHaveCount(0);
      await expect(results.newStars).toHaveText('+1 new star');
    });

    test('a class shows its XP and no stars panel (L2-075 AC3)', async ({ page }) => {
      await openResults(page, soloClass());
      const results = new ResultsPage(page);

      await expect(results.xpTotal).toHaveText('+110');
      expect(await results.xpLineTexts()).toEqual(['Finished +100', '1-day streak +10']);
      await expect(results.starsPanel).toHaveCount(0);
    });

    test('with no network the XP panel says it will be added when back online, and fills once the rider is (L2-074 AC3)', async ({
      page,
      api,
    }) => {
      const state = soloRace(1598);
      api.answer('POST', '/api/rides', () => ({ offline: true }));
      await openResults(page, state);
      const results = new ResultsPage(page);

      await expect(results.xpNote).toHaveText('Your XP will be added when you’re back online.');
      await expect(results.starsPanel).toHaveCount(0);

      api.answer(
        'POST',
        '/api/rides',
        recorded(
          state.ride,
          [['Finished', 100]],
          { held: 1, earned: 1 },
          {
            bestSeconds: 1598,
            previousBestSeconds: null,
            isNewBest: false,
          },
        ),
      );
      await page.evaluate(() => window.dispatchEvent(new Event('online')));
      await expect(results.xpTotal).toHaveText('+100');
      await expect(results.xpNote).toHaveCount(0);
    });

    test('a refused ride earned no XP and has no stars panel (L2-074 AC4)', async ({
      page,
      api,
    }) => {
      api.answer('POST', '/api/rides', () => ({
        status: 422,
        body: {
          status: 422,
          title: 'No one could have ridden this ride.',
          code: 'ride_not_plausible',
        },
      }));
      await openResults(page, soloRace(1598));
      const results = new ResultsPage(page);

      await expect(results.xpNote).toHaveText('This ride wasn’t recorded, so it earned no XP.');
      await expect(results.starsPanel).toHaveCount(0);
    });
  });
});
