// Acceptance test
// Traces to: L2-069 AC1, AC2; L2-068 AC3
// Description: a bots race has Leave and no Pause; Leave ends it at once, with no confirmation, and Race Setup opens. A
// solo race has Pause and End; End discards it and Race Setup opens. Neither submits a ride, so neither earns XP.
import type { Page } from '@playwright/test';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { RaceSetupPage } from './pages/race-setup.page';

/** Race Setup loads lazily, so the paused clock steps a frame at a time until it shows (L43). */
async function raceSetupShown(page: Page): Promise<void> {
  const title = new RaceSetupPage(page).title;
  await expect(async () => {
    await page.clock.runFor(16);
    await expect(title).toHaveText('Old Town Criterium', { timeout: 50 });
  }).toPass();
}

test(
  'a bots race has no Pause, and Leave opens Race Setup at once (L2-069 AC1, L2-068 AC3)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );
    await page.clock.runFor(10_000);

    await expect(race.pause).toHaveCount(0);
    await expect(race.end).toHaveCount(0);
    await race.leave.click();

    await expect(page).toHaveURL('/race/old-town-criterium');
    await raceSetupShown(page);
    // No ride is submitted: the API fixture would fail the spec on an unanswered POST /api/rides.
  },
);

test('a solo race has Pause, and End discards it and opens Race Setup (L2-069 AC2, L2-068)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
  await page.clock.runFor(10_000);

  await expect(race.pause).toBeVisible();
  await expect(race.leave).toHaveCount(0);
  await race.end.click();

  await expect(page).toHaveURL('/race/old-town-criterium');
  await raceSetupShown(page);
});
