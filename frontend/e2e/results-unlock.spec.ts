// Acceptance test
// Traces to: L2-076 AC1, AC2, AC3; L2-040 AC5
// Description: when the backend's answer names a map the ride opened, Results shows a gold card at the top of what was
// earned: "Neon Docklands is open", "A harbour city after dark." and "Ride Neon Docklands", a link to Race Setup for
// it. The card fades in and scales from 0.96 over 250 ms after 200 ms, and its photo comes from grey into colour
// over 250 ms after 350 ms; with reduced motion only the card's opacity changes. With no map opened there is no card,
// and the map catalogue is not asked for. Each Results is opened as a reload finds it.
import { echelonBike } from './fixtures/echelon';
import { maps } from './fixtures/maps';
import { botsRace, openResults, recorded } from './fixtures/results';
import { expect, test } from './fixtures/test';
import { ResultsPage } from './pages/results.page';

const LINES: [string, number][] = [
  ['Finished', 100],
  ['2nd of 10', 160],
  ['Podium', 75],
  ['84% on target', 67],
  ['4-day streak', 40],
];
const STARS = { held: 2, earned: 2 };
const BEST = { bestSeconds: 1598, previousBestSeconds: null, isNewBest: false };

test.describe('The unlock moment', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test(
    'a ride that opened Neon Docklands shows its gold card, which leads to Race Setup for it (L2-076 AC1)',
    { tag: '@critical' },
    async ({ page, api }) => {
      const state = botsRace();
      api.answer('POST', '/api/rides', recorded(state.ride, LINES, STARS, BEST, 'neon-docklands'));
      api.answer('GET', '/api/maps', maps);
      await openResults(page, state);
      const results = new ResultsPage(page);

      await expect(results.unlockTitle).toHaveText('Neon Docklands is open');
      await expect(results.unlockPlace).toHaveText('A harbour city after dark.');
      await expect(results.unlockAction).toHaveText('Ride Neon Docklands');
      // Race Setup opens for it once the app reads the open maps from the backend (slice 12.1).
      await expect(results.unlockAction).toHaveAttribute('href', '/race/neon-docklands');
    },
  );

  test('the card fades in and scales up, then its photo comes into colour; with reduced motion it only fades (L2-076 AC2)', async ({
    page,
    api,
  }) => {
    const state = botsRace();
    api.answer('POST', '/api/rides', recorded(state.ride, LINES, STARS, BEST, 'neon-docklands'));
    api.answer('GET', '/api/maps', maps);
    await openResults(page, state);
    const results = new ResultsPage(page);
    await expect(results.unlockCard).toBeVisible();

    expect(await results.unlockEntrance()).toEqual({
      card: [{ duration: 250, delay: 200, properties: ['opacity', 'scale'] }],
      photo: [{ duration: 250, delay: 350, properties: ['filter'] }],
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(results.unlockCard).toBeVisible();
    expect(await results.unlockEntrance()).toEqual({
      card: [{ duration: 250, delay: 0, properties: ['opacity'] }],
      photo: [],
    });
  });

  test('with no map opened there is no unlock card (L2-076 AC3)', async ({ page, api }) => {
    const state = botsRace();
    api.answer('POST', '/api/rides', recorded(state.ride, LINES, STARS, BEST));
    await openResults(page, state);
    const results = new ResultsPage(page);

    await expect(results.xpTotal).toHaveText('+442');
    await expect(results.unlockCard).toHaveCount(0);
  });
});
