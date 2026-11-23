// Acceptance test
// Traces to: L2-035 AC1, AC2 (Ride alone), AC3 (Ride alone), AC4
// Description: Home's Classes door reads "Classes" with "All classes", and its teaser shows the featured class, the
// first open class on the 30 min shelf, with its length and "Ride alone", which opens Class Start with alone chosen.
// Group sessions come with slice 14.2, so the door has no next session and no "Join group" yet
// (docs/mocks/pages/home/no-groups.html). At lg the two doors sit side by side; below lg they stack.
import { echelonBike } from './fixtures/echelon';
import { midRiderProgress } from './fixtures/progress';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassStartPage } from './pages/class-start.page';
import { HomePage } from './pages/home.page';

test.beforeEach(async ({ api, bluetooth }) => {
  await bluetooth.remember(echelonBike);
  api.answer('GET', '/api/progress', midRiderProgress);
});

test('the Classes door features 30 Minute HIIT Cardio, and Ride alone opens Class Start with alone chosen (L2-035 AC1 to AC3) @critical', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.open();

  await expect(home.teaserTitle).toHaveText('30 Minute HIIT Cardio');
  await expect(home.teaserLength).toHaveText('30:00');
  await expect(home.teaserActions).toHaveText(['Ride alone']);
  await expect(home.classSummary).toBeHidden();

  await home.teaserActions.click();
  await expect(page).toHaveURL('/classes/hiit-cardio-30');
  await expect(new ClassStartPage(page).alone).toBeChecked();
});

test('All classes opens the Class Library (L2-035 AC1)', async ({ page }) => {
  const home = new HomePage(page);
  await home.open();

  await home.allClasses.click();
  await expect(page).toHaveURL('/classes');
  await expect(new ClassLibraryPage(page).heading).toBeVisible();
});

test('at lg the doors sit side by side, and below lg they stack (L2-035 AC4)', async ({ page }) => {
  const home = new HomePage(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await home.open();
  await expect(home.teaser).toBeVisible();

  const race = (await home.raceDoor.boundingBox())!;
  const classes = (await home.classDoor.boundingBox())!;
  expect([race.y === classes.y, race.x < classes.x]).toEqual([true, true]);

  await page.setViewportSize({ width: 1023, height: 900 });
  const stackedRace = (await home.raceDoor.boundingBox())!;
  const stackedClasses = (await home.classDoor.boundingBox())!;
  expect(stackedClasses.y).toBeGreaterThan(stackedRace.y + stackedRace.height);
});
