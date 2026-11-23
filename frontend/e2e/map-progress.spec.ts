// Acceptance test
// Traces to: L2-041 AC2, AC3, AC4; L2-039 AC1; L2-040 AC5
// Description: Map Select and Race Setup read the rider's maps from the backend. The mid rider has Prairie Paceline,
// Old Town Criterium and Cliffside Coast open with their stars and bests, and Neon Docklands next by "Finish top 3 vs
// Bots on Old Town Criterium", which Old Town Criterium's Race Setup names too. The veteran's next unlock is Col du
// Granit by "Earn 3★ on Dolomites". A map a ride opened opens Race Setup, from its address and from Results' unlock card.
import { echelonBike } from './fixtures/echelon';
import { maps } from './fixtures/maps';
import { docklandsOpenedProgress, midRiderProgress, veteranProgress } from './fixtures/progress';
import { botsRace, openResults, recorded } from './fixtures/results';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { ResultsPage } from './pages/results.page';

test.describe('Stars and map unlocks from the backend', () => {
  test.beforeEach(({ api }) => api.answer('GET', '/api/maps', maps));

  test(
    'the mid rider has three maps open with their stars and best, and Neon Docklands next by its goal (L2-041 AC2, AC4)',
    { tag: '@critical' },
    async ({ page, api }) => {
      api.answer('GET', '/api/progress', midRiderProgress);
      const select = new MapSelectPage(page);
      await select.open();

      const prairie = select.row('Prairie Paceline');
      await expect(prairie.stars).toHaveAccessibleName('3 of 3 stars');
      await expect(prairie.best).toHaveText('Best 31:42');
      const cliffside = select.row('Cliffside Coast');
      await expect(cliffside.root).toHaveAttribute('href', '/race/cliffside-coast');
      await expect(cliffside.stars).toHaveAccessibleName('1 of 3 stars');
      await expect(cliffside.best).toHaveText('Best 58:03');
      const next = select.row('Neon Docklands');
      await expect(next.root).toHaveClass(/map-row--next/);
      await expect(next.goal).toHaveText('Finish top 3 vs Bots on Old Town Criterium');

      const setup = new RaceSetupPage(page);
      await setup.open('old-town-criterium');
      await expect(setup.goal).toHaveText(
        'Finish top 3 vs Bots on Old Town Criterium to open Neon Docklands.',
      );
    },
  );

  test('the veteran’s next unlock is Col du Granit by “Earn 3★ on Dolomites” (L2-041 AC3, AC4)', async ({
    page,
    api,
  }) => {
    api.answer('GET', '/api/progress', veteranProgress);
    const select = new MapSelectPage(page);
    await select.open();

    const next = select.row('Col du Granit');
    await expect(next.root).toHaveClass(/map-row--next/);
    await expect(next.goal).toHaveText('Earn 3★ on Dolomites');
    await expect(select.row('Vice City').root).toHaveAttribute('href', '/race/vice-city');
    // A best of an hour or more reads in minutes, as the mocks write it.
    await expect(select.row('Dolomites').best).toHaveText('Best 71:20');

    const setup = new RaceSetupPage(page);
    await setup.open('dolomites');
    await expect(setup.goal).toHaveText('Earn 3★ on Dolomites to open Col du Granit.');
    await expect(setup.factValues.last()).toHaveText('71:20');
  });

  test('a map a ride opened opens Race Setup, from its address and from the unlock card (L2-040 AC5)', async ({
    page,
    api,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    api.answer('GET', '/api/progress', docklandsOpenedProgress);
    const setup = new RaceSetupPage(page);
    await setup.open('neon-docklands');
    await expect(setup.title).toHaveText('Neon Docklands');

    const state = botsRace();
    api.answer(
      'POST',
      '/api/rides',
      recorded(state.ride, [['Finished', 100]], { held: 2, earned: 2 }, null, 'neon-docklands'),
    );
    await openResults(page, state);
    await new ResultsPage(page).unlockAction.click();
    await expect(page).toHaveURL(/\/race\/neon-docklands$/);
    await expect(setup.title).toHaveText('Neon Docklands');
  });
});
