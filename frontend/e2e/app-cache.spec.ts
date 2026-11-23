// Acceptance test
// Traces to: L2-135 AC3; ADR 0032
// Description: once the app has been opened, its service worker keeps the app on the device: with no network it opens
// again and a solo race starts, its maps read from the catalogue kept on the device and the rider's progress from the
// last answer the worker kept, and a map's cover seen once still shows. The only spec that lets a service worker run
// (playwright.config.ts).
import { appCached } from './fixtures/app-cache';
import { echelonBike } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';

test.use({ serviceWorkers: 'allow' });

test.beforeEach(async ({ bluetooth }) => {
  await bluetooth.remember(echelonBike);
});

test('once opened, the app opens again and a solo race starts with no network (L2-135 AC3) @critical', async ({
  page,
  context,
  bluetooth,
  api,
}) => {
  const select = new MapSelectPage(page);
  await select.open();
  await expect(select.rows).toHaveCount(7);
  await appCached(page);
  await page.reload();
  await expect(select.rows).toHaveCount(7);

  await context.setOffline(true);
  api.offline();
  const race = await startRace(page, bluetooth, api, 'prairie-paceline', 'mode=solo', {
    offline: true,
  });

  await page.clock.runFor(30_000);
  await expect(race.boardNames).toHaveText(['Your best', 'You']);
  await expect(race.position).toHaveText('Behind');
});

test('a map’s cover seen once the app is cached shows with no network (L2-135 AC3)', async ({
  page,
  context,
  api,
}) => {
  const select = new MapSelectPage(page);
  const oldTown = select.row('Old Town Criterium');
  await select.open();
  await expect(select.rows).toHaveCount(7);
  await appCached(page);
  await page.reload();
  await expect.poll(() => oldTown.thumbnailDrawn()).toBe(true);

  await context.setOffline(true);
  api.offline();
  await page.reload();

  await expect(select.rows).toHaveCount(7);
  await expect.poll(() => oldTown.thumbnailDrawn()).toBe(true);
});
