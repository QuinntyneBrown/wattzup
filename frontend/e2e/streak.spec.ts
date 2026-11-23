// Acceptance test
// Traces to: L2-042 AC4; L2-032 AC2, AC3; L2-038 AC4
// Description: the streak the backend keeps shows the same in the header and on Profile. The mid rider's header shows a
// flame and 4, named "4-day streak", and Profile reads "760 XP to level 8 · 4-day streak"; a rider with no streak has
// none in the header, and Profile reads "0-day streak".
import { midRiderProgress } from './fixtures/api';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';
import { ProfilePage } from './pages/profile.page';

test.describe('Streak', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test(
    'the mid rider’s 4-day streak shows in the header and on Profile (L2-042 AC4, L2-032 AC2)',
    { tag: '@critical' },
    async ({ page, api }) => {
      api.answer('GET', '/api/progress', midRiderProgress);
      const home = new HomePage(page);
      await home.open();

      await expect(home.header.streakCount).toHaveText('4');
      await expect(home.header.streakName(4)).toBeAttached();

      const profile = new ProfilePage(page);
      await home.header.link('Profile').click();
      await expect(profile.meta).toHaveText('760 XP to level 8 · 23 rides · 412 km · 4-day streak');
      await expect(profile.header.streakCount).toHaveText('4');
    },
  );

  test('a rider with no streak has none in the header, and Profile says 0 (L2-032 AC3)', async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.open();

    await expect(profile.meta).toHaveText('400 XP to level 2 · 0 rides · 0 km · 0-day streak');
    await expect(profile.header.level).toBeVisible();
    await expect(profile.header.streak).toHaveCount(0);
  });
});
