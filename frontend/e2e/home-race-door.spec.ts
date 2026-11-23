// Acceptance test
// Traces to: L2-034 AC1 to AC5
// Description: Home's Race door reads "Race" with "All maps" and the mid rider's "3 of 7 maps open · 5 of 21 stars",
// and has tiles for the first four maps in unlock order, each with its name and stars. An open tile opens Race Setup
// for its map; a locked tile is greyed with a lock and opens Map Select. Tiles are four across from sm, two on a phone.
import { echelonBike } from './fixtures/echelon';
import { midRiderProgress } from './fixtures/progress';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';

test.beforeEach(async ({ api, bluetooth }) => {
  await bluetooth.remember(echelonBike);
  api.answer('GET', '/api/progress', midRiderProgress);
});

test('the Race door counts the mid rider maps and stars, and an open tile opens Race Setup (L2-034 AC1 to AC3) @critical', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.open();

  await expect(home.raceSummary).toHaveText('3 of 7 maps open · 5 of 21 stars');
  await expect(home.tileNames).toHaveText([
    'Prairie Paceline',
    'Old Town Criterium',
    'Cliffside Coast',
    'Neon Docklands',
  ]);
  await expect(home.tileStars.nth(0)).toHaveAccessibleName('3 of 3 stars');
  await expect(home.tileStars.nth(1)).toHaveAccessibleName('1 of 3 stars');
  await expect(home.tileStars.nth(3)).toHaveAccessibleName('0 of 3 stars');

  await home.tile('Old Town Criterium').click();
  await expect(page).toHaveURL('/race/old-town-criterium');
  await expect(new RaceSetupPage(page).mode('Bots')).toBeChecked();
});

test('All maps opens Map Select (L2-034 AC1)', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.allMaps.click();
  await expect(page).toHaveURL('/race');
  await expect(new MapSelectPage(page).heading).toBeVisible();
});

test('a locked tile is named as locked and opens Map Select (L2-034 AC4)', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  const locked = home.tile('Neon Docklands');
  await expect(locked).toHaveAccessibleName('Neon Docklands, locked: see how to open it');
  await expect(home.tile('Cliffside Coast')).toHaveAccessibleName(/^Cliffside Coast/);

  await locked.click();
  await expect(page).toHaveURL('/race');
});

test('tiles are four across from sm and two across on a phone (L2-034 AC5)', async ({ page }) => {
  const home = new HomePage(page);
  await page.setViewportSize({ width: 640, height: 900 });
  await home.open();
  const tops = async () =>
    Promise.all((await home.tiles.all()).map(async (tile) => (await tile.boundingBox())!.y));

  await expect(home.tiles).toHaveCount(4);
  expect(new Set(await tops()).size).toBe(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const [a, b, c, d] = await tops();
  expect([a === b, c === d, a < c]).toEqual([true, true, true]);
  expect(await home.overflows()).toBe(false);
});
