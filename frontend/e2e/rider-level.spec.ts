// Acceptance test
// Traces to: L2-032 AC2; L2-038 AC1; L2-044 AC1
// Description: the header shows the level the backend keeps. For the mid rider the level link to Profile reads "Level
// 7, 1840 of 2600 XP", with the gold badge 7, an XP bar filled to 70.8 % and "1,840 / 2,600 XP"; a new rider reads
// "Level 1, 0 of 400 XP". Profile's headline names the same level. When progress cannot be read, the link is absent.
import { midRiderProgress } from './fixtures/api';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';
import { ProfilePage } from './pages/profile.page';

test.describe('Rider level', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test(
    'the header shows the mid rider at level 7 with 1,840 of 2,600 XP, and goes to Profile (L2-032 AC2)',
    { tag: '@critical' },
    async ({ page, api }) => {
      api.answer('GET', '/api/progress', midRiderProgress);
      const home = new HomePage(page);
      await home.open();

      await expect(home.header.level).toHaveAccessibleName('Level 7, 1840 of 2600 XP');
      await expect(home.header.levelBadge).toHaveText('7');
      await expect(home.header.xpLabel).toHaveText('1,840 / 2,600 XP');
      expect(await home.header.xpFillValue()).toBe('70.8%');

      await home.header.level.click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(new ProfilePage(page).heading).toHaveText('Ada · Level 7');
    },
  );

  test('a new rider is level 1 with 0 of 400 XP (L2-038 AC1)', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(home.header.level).toHaveAccessibleName('Level 1, 0 of 400 XP');
    await expect(home.header.xpLabel).toHaveText('0 / 400 XP');
    expect(await home.header.xpFillValue()).toBe('0%');
  });

  test('when progress cannot be read, the header has no level link', async ({ page, api }) => {
    api.answer('GET', '/api/progress', () => ({ status: 503 }));
    const home = new HomePage(page);
    await home.open();

    await expect(home.main).toBeAttached();
    await expect(home.header.link('Profile')).toBeVisible();
    await expect(home.header.level).toHaveCount(0);
  });
});
