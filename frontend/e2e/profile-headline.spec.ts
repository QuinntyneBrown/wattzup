// Acceptance test
// Traces to: L2-109 AC1 to AC3
// Description: Profile's headline names the rider and their level beside the level badge, with an XP bar named by the
// XP, and under it the XP to the next level, the rides and kilometres recorded and the streak: "760 XP to level 8 ·
// 23 rides · 412 km · 4-day streak" for the mid rider, "400 XP to level 2 · 0 rides · 0 km · 0-day streak" for a new
// one. At lg it is two columns, with a 340 px Settings aside.
import { midRiderProgress } from './fixtures/progress';
import { expect, test } from './fixtures/test';
import { ProfilePage } from './pages/profile.page';

test.beforeEach(({ api }) => {
  api.answer('GET', '/api/riders/me', {
    id: 'c0a8e1f2-5b3d-4e6f-9a7b-8c9d0e1f2a3b',
    displayName: 'Sam',
  });
});

test('the mid rider reads level 7 with the XP bar, rides, kilometres and streak (L2-109 AC1) @critical', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/progress', midRiderProgress);
  const profile = new ProfilePage(page);
  await profile.open();

  await expect(profile.heading).toHaveText('Sam · Level 7');
  await expect(profile.xpBar).toHaveAccessibleName('1,840 of 2,600 XP');
  await expect(profile.meta).toHaveText('760 XP to level 8 · 23 rides · 412 km · 4-day streak');
});

test('a new rider reads level 1, an empty XP bar and no rides (L2-109 AC2)', async ({ page }) => {
  const profile = new ProfilePage(page);
  await profile.open();

  await expect(profile.heading).toHaveText('Sam · Level 1');
  await expect(profile.xpBar).toHaveAccessibleName('0 of 400 XP');
  await expect(profile.meta).toHaveText('400 XP to level 2 · 0 rides · 0 km · 0-day streak');
});

test('at lg Profile is two columns with a 340 px Settings aside, and below lg one (L2-109 AC3)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/progress', midRiderProgress);
  await page.setViewportSize({ width: 1024, height: 900 });
  const profile = new ProfilePage(page);
  await profile.open();
  await expect(profile.xpBar).toBeVisible();

  const main = (await profile.mainColumn.boundingBox())!;
  const aside = (await profile.settings.boundingBox())!;
  expect([Math.round(aside.width), aside.x > main.x, Math.abs(aside.y - main.y) < 1]).toEqual([
    340,
    true,
    true,
  ]);

  await page.setViewportSize({ width: 1023, height: 900 });
  const stacked = (await profile.settings.boundingBox())!;
  expect(stacked.y).toBeGreaterThan((await profile.mainColumn.boundingBox())!.y);
});
