// Acceptance test
// Traces to: L2-065 AC1, AC2; L2-064 AC4
// Description: the race's world loads in its own chunk and draws on a canvas in the race scene, with WebGL 2 where the
// browser has no WebGPU, and the bar's tag names the GPU API drawing it. With neither, the map's panorama stays and
// the race still runs. Leaving the race takes the world away with it.
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { RaceSetupPage } from './pages/race-setup.page';

// The world builds in software here, which takes CI's shared runners up to half a minute alongside other worlds (L202).
test.describe.configure({ timeout: 120_000 });

test(
  'draws the world with WebGL 2 where WebGPU is missing, and the tag names it (L2-065 AC1)',
  { tag: '@critical' },
  async ({ page, bluetooth, api, webgl }) => {
    await webgl.withoutWebGpu();
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
      { world: true },
    );

    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    await expect(race.backend).toHaveText('WebGL 2');
    await expect(race.backend).toHaveAttribute('title', 'The GPU API drawing this world');
    await expect(race.world).toBeVisible();
    // The scene is one image for assistive technology (L2-064 AC4): the canvas inside it is not another.
    await expect(race.scene).toHaveAttribute('role', 'img');
    await expect(race.world).toHaveAttribute('aria-hidden', 'true');
  },
);

test('shows the panorama and still runs the race where neither WebGPU nor WebGL 2 can draw (L2-065 AC2)', async ({
  page,
  bluetooth,
  api,
  webgl,
}) => {
  await webgl.disable();
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');
  // The world tries to start, finds neither backend and goes.
  await stepUntil(page, () => expect(race.world).toHaveCount(0, { timeout: 50 }));
  const before = await race.clock.textContent();
  await page.clock.runFor(10_000);

  await expect(race.backend).toHaveCount(0);
  await expect(race.panorama).toBeVisible();
  // The race runs on: ten seconds later, the clock has moved on.
  await expect(race.clock).not.toHaveText(before ?? '');
});

test('leaving the race takes its world away', async ({ page, bluetooth, api, webgl }) => {
  await webgl.withoutWebGpu();
  const race = await startRace(
    page,
    bluetooth,
    api,
    'old-town-criterium',
    'mode=bots&pack=medium',
    {
      world: true,
    },
  );
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));

  await race.leave.click();

  await expect(page).toHaveURL('/race/old-town-criterium');
  await stepUntil(page, () => expect(new RaceSetupPage(page).title).toBeVisible({ timeout: 50 }));
  await expect(race.world).toHaveCount(0);
  await expect(race.backend).toHaveCount(0);
});
