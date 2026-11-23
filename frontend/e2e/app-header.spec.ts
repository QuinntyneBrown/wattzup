// Acceptance test
// Traces to: L2-032 AC1, AC4; L2-144 AC1, AC2
// Description: the app header offers Full screen, which enters full screen and then reads "Exit full screen" and
// leaves it; where the browser has no Fullscreen API the button is absent. Each page of the shell marks its own item
// current. On a phone the navigation takes its own full-width row of equal items and the level shows only its badge.
import { echelonBike } from './fixtures/echelon';
import { withoutFullscreen } from './fixtures/fullscreen';
import { library } from './fixtures/library';
import { maps } from './fixtures/maps';
import { midRiderProgress } from './fixtures/progress';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { HomePage } from './pages/home.page';
import { MapSelectPage } from './pages/map-select.page';
import { ProfilePage } from './pages/profile.page';

test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

test('Full screen enters full screen, and Exit full screen leaves it (L2-144 AC1) @critical', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.open();

  await home.header.fullScreen.click();
  await expect.poll(() => home.header.inFullScreen()).toBe(true);
  await expect(home.header.exitFullScreen).toBeVisible();
  await expect(home.header.fullScreen).toHaveCount(0);

  await home.header.exitFullScreen.click();
  await expect.poll(() => home.header.inFullScreen()).toBe(false);
  await expect(home.header.fullScreen).toBeVisible();
});

test('where the browser has no Fullscreen API, the button is absent (L2-144 AC2)', async ({
  page,
}) => {
  await withoutFullscreen(page);
  const home = new HomePage(page);
  await home.open();

  await expect(home.header.level).toBeVisible();
  await expect(home.header.fullScreen).toHaveCount(0);
});

test('each page of the shell marks its own item current, and offers Full screen (L2-032 AC1)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/maps', maps);
  api.answer('GET', '/api/classes', library);
  for (const [screen, item] of [
    [new MapSelectPage(page), 'Race'],
    [new ClassLibraryPage(page), 'Classes'],
    [new ProfilePage(page), 'Profile'],
  ] as const) {
    await screen.open();
    await expect(screen.header.current()).toHaveText(item);
    await expect(screen.header.fullScreen).toBeVisible();
  }
});

test('on a phone the navigation takes its own row of equal items, and the level shows only its badge (L2-032 AC4)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/progress', midRiderProgress);
  await page.setViewportSize({ width: 390, height: 844 });
  const home = new HomePage(page);
  await home.open();

  await expect(home.header.levelBadge).toHaveText('7');
  await expect(home.header.xpLabel).toBeHidden();
  await expect(home.header.bike).toBeHidden();
  const brand = await home.header.brand.boundingBox();
  const items = await Promise.all(
    (await home.header.links.all()).map((link) => link.boundingBox()),
  );
  expect(items).toHaveLength(4);
  for (const item of items) {
    expect(item!.y).toBeGreaterThanOrEqual(brand!.y + brand!.height);
    expect(Math.abs(item!.width - items[0]!.width)).toBeLessThan(1);
  }
  expect(items[3]!.x + items[3]!.width - items[0]!.x).toBeGreaterThan(390 - 2 * 24);
});
