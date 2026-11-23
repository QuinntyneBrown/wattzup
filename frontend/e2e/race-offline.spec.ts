// Acceptance test
// Traces to: L2-067 AC4; L2-135 AC3
// Description: a bots or solo race runs in the browser: with the catalogue kept on the device from an earlier visit
// and the backend out of reach, the race starts from the kept copy and its bots or ghost ride as ever.
import { maps } from './fixtures/maps';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((catalogue) => {
    localStorage.setItem('telo-ride.map-catalogue', catalogue);
  }, JSON.stringify(maps));
});

test('without a network a bots race starts from the kept catalogue and its bots ride (L2-067 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=hard', {
    offline: true,
  });

  await expect(race.route).toHaveText('Cathedral Circuit · vs Bots, hard');
  await page.clock.runFor(30_000);
  await expect(race.boardTitle).toHaveText('Standings · 10 riders');
  await expect(race.position).toHaveText('10th/ 10');
});

test('without a network a solo race starts and its ghost rides (L2-067 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'prairie-paceline', 'mode=solo', {
    offline: true,
  });

  await page.clock.runFor(30_000);
  await expect(race.boardNames).toHaveText(['Your best', 'You']);
  await expect(race.position).toHaveText('Behind');
});
