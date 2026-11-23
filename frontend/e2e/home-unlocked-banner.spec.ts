// Acceptance test
// Traces to: L2-036 AC1 to AC3
// Description: once a ride has opened Neon Docklands, Home announces it once with a gold status banner above the card,
// "Neon Docklands is open." with its place and length and "Ride it" to Race Setup, while the card has already moved on
// to the next unlock. Home tells the backend the banner was seen, so the next time Home opens it is gone.
import { echelonBike } from './fixtures/echelon';
import { docklandsUnseenProgress } from './fixtures/progress';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';
import { RaceSetupPage } from './pages/race-setup.page';

const SEEN = '/api/progress/unlocks/neon-docklands/seen';

test.beforeEach(async ({ api, bluetooth }) => {
  await bluetooth.remember(echelonBike);
  api.answer('GET', '/api/progress', docklandsUnseenProgress);
  api.answer('POST', SEEN, () => ({ status: 204 }));
});

test('Home announces Neon Docklands once, above a card that has moved on, and Ride it opens it (L2-036 AC1, AC2) @critical', async ({
  page,
  api,
}) => {
  const home = new HomePage(page);
  await home.open();

  await expect(home.banner).toHaveRole('status');
  await expect(home.bannerBody).toHaveText(
    'Neon Docklands is open. A harbour city after dark, 21.6 km.',
  );
  await expect(home.bannerAction).toHaveText('Ride it');
  const banner = (await home.banner.boundingBox())!;
  expect(banner.y).toBeLessThan((await home.card.boundingBox())!.y);
  await expect(home.cardGoal).toHaveText('Earn 2★ on Cliffside Coast');
  await expect(home.rewardTitle).toHaveText('Opens Dolomites');
  await expect.poll(() => api.requests()).toContain(`POST ${SEEN}`);

  await home.bannerAction.click();
  await expect(page).toHaveURL('/race/neon-docklands');
  await expect(new RaceSetupPage(page).mode('Bots')).toBeChecked();
});

test('once seen, the banner is gone the next time Home opens (L2-036 AC3)', async ({
  page,
  api,
}) => {
  const home = new HomePage(page);
  await home.open();
  await expect(home.banner).toBeVisible();
  await expect.poll(() => api.requests()).toContain(`POST ${SEEN}`);

  api.answer('GET', '/api/progress', { ...docklandsUnseenProgress, unseenUnlockId: null });
  await home.open();
  await expect(home.card).toBeVisible();
  await expect(home.banner).toHaveCount(0);
});
