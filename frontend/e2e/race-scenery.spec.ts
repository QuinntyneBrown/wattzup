// Acceptance test
// Traces to: L2-066 AC1, AC2, AC3, AC4, AC5, AC7, AC8, AC9
// Description: on a map that follows a real place, while its world draws, the race offers to stream the place as
// photorealistic 3D Tiles with the rider's own Google Maps Platform key; a map with no real place, or a race on its
// panorama, offers nothing. The key goes to Google's Map Tiles API and this device's storage only; Google refusing it
// leaves the built-in world. Google's answers come from the shared fixture's `mapTiles`.
import type { Page } from '@playwright/test';
import type { ApiFixture } from './fixtures/api';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import type { FakeWebGl } from './fixtures/webgl';
import type { WorldRideProbe } from './fixtures/world-ride-probe';

const KEY = 'AIzaSyD-telo-ride-test';

/** A solo race on Old Town Criterium, its world drawn at Low with WebGL 2. */
async function oldTown(fixtures: {
  page: Page;
  bluetooth: FakeBluetooth;
  api: ApiFixture;
  webgl: FakeWebGl;
  worldRide: WorldRideProbe;
}) {
  const { page, bluetooth, api, webgl, worldRide } = fixtures;
  await webgl.withoutWebGpu();
  await worldRide.pin('low');
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo', {
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  return race;
}

test.describe('the real-world scenery panel', () => {
  test.slow();

  test('offers the real Bruges on Old Town Criterium, with Stream it disabled until there is a key (L2-066 AC1, AC2)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await webgl.withoutWebGpu();
    await worldRide.pin('low');
    const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo', {
      world: true,
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));

    await expect(race.sceneryTitle).toHaveText('Ride the real Bruges · Steenstraat to the Markt');
    await expect(race.sceneryBody).toHaveText(
      'Paste a Google Maps Platform key to stream it as photorealistic 3D Tiles. It stays on this device.',
    );
    await expect(race.sceneryKey).toHaveAttribute('placeholder', 'AIza…');
    await expect(race.streamIt).toBeDisabled();

    // The race's clock is paused, so the page renders as the clock steps.
    await race.sceneryKey.fill('AIzaSyD-telo-ride-test');
    await stepUntil(page, () => expect(race.streamIt).toBeEnabled({ timeout: 50 }));
    await race.sceneryKey.fill('   ');
    await stepUntil(page, () => expect(race.streamIt).toBeDisabled({ timeout: 50 }));
  });

  test('offers nothing on a map with no real place (L2-066 AC5)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await webgl.withoutWebGpu();
    await worldRide.pin('low');
    const race = await startRace(page, bluetooth, api, 'prairie-paceline', 'mode=solo', {
      world: true,
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));

    await expect(race.scenery).toHaveCount(0);
  });

  test('offers nothing over the panorama, where no world draws (L2-066 AC9)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
    await stepUntil(page, () => expect(race.world).toHaveCount(0, { timeout: 50 }));
    await page.clock.runFor(2000);

    await expect(race.panorama).toBeVisible();
    await expect(race.scenery).toHaveCount(0);
  });

  test('streams the real Bruges with the key, which goes to Google and this device only (L2-066 AC3, AC7)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
    mapTiles,
  }) => {
    mapTiles.accept();
    const race = await oldTown({ page, bluetooth, api, webgl, worldRide });

    await race.sceneryKey.fill(KEY);
    await stepUntil(page, () => expect(race.streamIt).toBeEnabled({ timeout: 50 }));
    await race.streamIt.click();

    await stepUntil(page, () =>
      expect(race.sceneryTitle).toHaveText('Streaming the real Bruges · Steenstraat to the Markt', {
        timeout: 50,
      }),
    );
    await expect(race.sceneryCredit).toContainText('Google');
    const [root] = mapTiles.requests();
    expect(root.pathname).toBe('/v1/3dtiles/root.json');
    expect(root.searchParams.get('key')).toBe(KEY);
    expect(await mapTiles.storedKey()).toBe(KEY);
    expect(mapTiles.leaks(KEY), 'requests elsewhere carrying the key').toEqual([]);
  });

  test('says Google refused the key, and the built-in world stays (L2-066 AC4)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
    mapTiles,
  }) => {
    mapTiles.refuse();
    const race = await oldTown({ page, bluetooth, api, webgl, worldRide });

    await race.sceneryKey.fill(KEY);
    await stepUntil(page, () => expect(race.streamIt).toBeEnabled({ timeout: 50 }));
    await race.streamIt.click();

    await stepUntil(page, () =>
      expect(race.sceneryError).toHaveText('Google refused that key. The built-in world stays.', {
        timeout: 50,
      }),
    );
    await expect(race.sceneryKey).toHaveAttribute('aria-invalid', 'true');
    await expect(race.world).toBeVisible();
    await expect(race.backend).toHaveText('WebGL 2');
  });

  test('holds the key this device stored, and streams nothing until Stream it (L2-066 AC8)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
    mapTiles,
  }) => {
    await mapTiles.remember(KEY);
    const race = await oldTown({ page, bluetooth, api, webgl, worldRide });
    await page.clock.runFor(2000);

    await expect(race.sceneryKey).toHaveValue(KEY);
    await expect(race.streamIt).toBeEnabled();
    expect(mapTiles.requests()).toEqual([]);
  });
});
