// Acceptance test
// Traces to: L2-033 AC1 to AC6
// Description: Home greets the rider by the time of day, or welcomes a new rider, and its Next ride card offers the map
// that moves them on: the mid rider is sent to Old Town Criterium to open Neon Docklands, with their best there; a new
// rider to Prairie Paceline, with no best; a level goal reads the levels still to climb; with every map open, the card
// asks for one more star on the map with the fewest. At lg the card is split 3 : 2; on a phone nothing overflows.
import { echelonBike } from './fixtures/echelon';
import { allOpenProgress, levelGoalProgress, midRiderProgress } from './fixtures/progress';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';
import { RaceSetupPage } from './pages/race-setup.page';

// The browser runs in UTC (playwright.config.ts), so the times are written in UTC.
const evening = new Date('2026-11-20T19:30:00Z');

test.beforeEach(async ({ page, api, bluetooth }) => {
  await bluetooth.remember(echelonBike);
  await page.clock.setFixedTime(evening);
  api.answer('GET', '/api/riders/me', {
    id: 'c0a8e1f2-5b3d-4e6f-9a7b-8c9d0e1f2a3b',
    displayName: 'Sam',
  });
});

test('the mid rider is greeted for the evening and sent to Old Town Criterium to open Neon Docklands (L2-033 AC1, AC2) @critical', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/progress', midRiderProgress);
  const home = new HomePage(page);
  await home.open();

  await expect(home.greeting).toHaveText('Evening, Sam.');
  await expect(home.cardTag).toHaveText('Old Town Criterium · 14.2 km · Easy');
  await expect(home.cardEyebrow).toHaveText('Your next unlock');
  await expect(home.cardGoal).toHaveText('Finish top 3 vs Bots on Old Town Criterium');
  await expect(home.rewardTitle).toHaveText('Opens Neon Docklands');
  await expect(home.rewardPlace).toHaveText('A harbour city after dark');
  await expect(home.cardBest).toHaveText('Your best here: 27:10');
  await expect(home.cardAction).toHaveText('Race Old Town Criterium');

  await home.cardAction.click();
  await expect(page).toHaveURL('/race/old-town-criterium');
  await expect(new RaceSetupPage(page).mode('Bots')).toBeChecked();
});

test('the greeting follows the time of day (L2-033 AC1)', async ({ page, api }) => {
  api.answer('GET', '/api/progress', midRiderProgress);
  const home = new HomePage(page);

  await page.clock.setFixedTime(new Date('2026-11-20T08:15:00Z'));
  await home.open();
  await expect(home.greeting).toHaveText('Morning, Sam.');

  await page.clock.setFixedTime(new Date('2026-11-20T16:59:00Z'));
  await home.open();
  await expect(home.greeting).toHaveText('Afternoon, Sam.');
});

test('a new rider is welcomed and offered Prairie Paceline, with no best (L2-033 AC3)', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.open();

  await expect(home.greeting).toHaveText('Welcome, Sam. Your first race opens a new map.');
  await expect(home.cardGoal).toHaveText('Finish top 3 vs Bots on Prairie Paceline');
  await expect(home.rewardTitle).toHaveText('Opens Cliffside Coast');
  await expect(home.rewardPlace).toHaveText('A clifftop road above the sea at sunset');
  await expect(home.cardAction).toHaveText('Race Prairie Paceline');
  await expect(home.cardBest).toHaveCount(0);
});

test('a level goal reads the levels still to climb, and the card offers the last map opened (L2-033 AC4)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/progress', levelGoalProgress);
  const home = new HomePage(page);
  await home.open();

  await expect(home.cardGoal).toHaveText('Reach rider level 10 · 3 to go');
  await expect(home.rewardTitle).toHaveText('Opens Vice City');
  await expect(home.cardAction).toHaveText('Race Neon Docklands');
});

test('with every map open, the card asks for one more star on the map with the fewest (L2-033 AC5)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/progress', allOpenProgress);
  const home = new HomePage(page);
  await home.open();

  await expect(home.cardGoal).toHaveText('Earn 2★ on Dolomites');
  await expect(home.reward).toHaveCount(0);
  await expect(home.cardBest).toHaveText('Your best here: 71:20');
  await expect(home.cardAction).toHaveText('Race Dolomites');
});

test('at lg the card is split 3 : 2, photo to text, and on a phone nothing overflows (L2-033 AC6)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/progress', midRiderProgress);
  await page.setViewportSize({ width: 1440, height: 900 });
  const home = new HomePage(page);
  await home.open();

  const photo = (await home.cardPhoto.boundingBox())!;
  const body = (await home.cardBody.boundingBox())!;
  expect(photo.width / body.width).toBeCloseTo(1.5, 1);
  expect(Math.abs(photo.y - body.y)).toBeLessThan(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(home.cardAction).toBeVisible();
  expect(await home.overflows()).toBe(false);
});
