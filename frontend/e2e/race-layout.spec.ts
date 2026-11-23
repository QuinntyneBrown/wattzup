// Acceptance test
// Traces to: L2-072 AC1, AC2, AC3; L2-058 AC4; L2-060 AC5; L2-062 AC3; L2-063 AC3
// Description: the race's HUD adapts to the width: a phone shows the world, power and interval only, with the clock's
// total and the bar's map, route and bike hidden; md adds the map and route and the board, sm the route panel; lg shows
// every panel,
// the HUD in three columns, with none covering another and 48 px steps.
import type { Locator } from '@playwright/test';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('not laid out');
  return rect;
};

test('on a phone the race shows the world, power and interval only (L2-072 AC1, L2-058 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');

  await expect(race.scene).toBeVisible();
  await expect(race.power).toBeVisible();
  await expect(race.interval).toBeVisible();
  await expect(race.routePanel).toBeHidden();
  await expect(race.resistPanel).toBeHidden();
  await expect(race.board).toBeHidden();
  await expect(race.clock).toBeVisible();
  await expect(race.clockTotal).toBeHidden();
  await expect(race.map).toBeHidden();
  await expect(race.bike).toBeHidden();
});

test('on a phone the bar’s Pause and End are at least 48 px (L2-072 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');

  for (const control of [race.pause, race.end]) {
    const rect = await box(control);
    expect(rect.width).toBeGreaterThanOrEqual(48);
    expect(rect.height).toBeGreaterThanOrEqual(48);
  }
});

test('at md the bar names the map and route, and the route panel and board show (L2-058 AC4, L2-060 AC5, L2-062 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');

  await expect(race.map).toBeVisible();
  await expect(race.route).toBeVisible();
  await expect(race.clockTotal).toBeVisible();
  await expect(race.routePanel).toBeVisible();
  await expect(race.board).toBeVisible();
  await expect(race.bike).toBeHidden();
  await expect(race.resistPanel).toBeHidden();
});

test(
  'at lg every panel shows, the HUD in three columns, none covering another (L2-072 AC2, AC3; L2-063 AC3)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );

    const panels = [
      race.bar,
      race.power,
      race.interval,
      race.routePanel,
      race.resistPanel,
      race.board,
    ];
    for (const panel of panels) await expect(panel).toBeVisible();
    await expect(race.bike).toBeVisible();

    const rects = await Promise.all(panels.map(box));
    rects.forEach((a, i) =>
      rects.slice(i + 1).forEach((b) => {
        const overlaps =
          a.x < b.x + b.width &&
          b.x < a.x + a.width &&
          a.y < b.y + b.height &&
          b.y < a.y + a.height;
        expect(overlaps, `panels ${i} and ${rects.indexOf(b)} overlap`).toBe(false);
      }),
    );

    const [interval, route, resist] = rects.slice(2, 5);
    expect(interval!.y).toBe(route!.y);
    expect(route!.y).toBe(resist!.y);
    expect(interval!.x + interval!.width).toBeLessThan(route!.x);
    expect(route!.x + route!.width).toBeLessThan(resist!.x);

    for (const step of [race.lower, race.raise]) {
      const rect = await box(step);
      expect(rect.width).toBeGreaterThanOrEqual(48);
      expect(rect.height).toBeGreaterThanOrEqual(48);
    }
  },
);
