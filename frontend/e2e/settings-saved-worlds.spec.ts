// Acceptance test
// Traces to: L2-165 AC1, AC2, AC3, AC4
// Description: Settings' This device lists the worlds saved on this device with their number, size and names, and
// Clear saved worlds deletes them with a toast of the bytes freed, which closes on its own or with ×. Keep worlds after a
// ride saves each world a class downloads; off, nothing new is saved. A world the browser evicted downloads again.
//
// Given saved worlds, when This device shows, then Saved worlds reads their number and size and names them, with
// Clear saved worlds.
// Given Clear saved worlds, when it is pressed, then they are deleted, the row reads None saved, and a toast reads
// Saved worlds cleared with the bytes freed; it closes after 6 seconds, or with ×.
// Given Keep worlds after a ride on, when a world class downloads its world, then This device lists it; off, the world
// is not saved and the next load downloads it again.
// Given the browser evicted the saved worlds, when the world class opens again, then World loading downloads it and
// the class is ready to ride.
import { catalogue, hiitCardio } from './fixtures/classes';
import { connectBike } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { THREE_WORLDS, evictWorlds, saveWorlds, savedWorldFiles } from './fixtures/saved-worlds';
import { storeSettings } from './fixtures/settings-storage';
import { expect, test } from './fixtures/test';
import { OLDTOWN_PANORAMA, WorldAssets, megabytes } from './fixtures/world-assets';
import { ClassRidePage } from './pages/class-ride.page';
import { ClassStartPage } from './pages/class-start.page';
import { SettingsPage } from './pages/settings.page';
import { WorldLoadingPage } from './pages/world-loading.page';

const NONE_SAVED_HINT = 'Each world downloads again the next time you ride it.';

test('This device lists the saved worlds, and Clear saved worlds deletes them with a toast of the bytes freed (L2-165 AC1, AC2) @critical', async ({
  page,
}) => {
  const settings = new SettingsPage(page);
  await settings.open('device');
  await saveWorlds(page, THREE_WORLDS);
  await page.reload();

  await expect(settings.savedWorlds).toHaveText('3 worlds · 61 MB');
  await expect(settings.savedWorldsHint).toHaveText(
    'Prairie Paceline, Old Town Criterium and Cliffside Coast open in seconds, even offline.',
  );
  await expect(settings.keepWorlds).toHaveAttribute('aria-checked', 'true');
  await expect(settings.keepWorldsText).toHaveText(
    'Saves each world you ride on this device so it opens fast next time.',
  );
  await expect(settings.toast).toHaveCount(0);

  await settings.clearSavedWorlds.click();

  await expect(settings.savedWorlds).toHaveText('None saved');
  await expect(settings.savedWorldsHint).toHaveText(NONE_SAVED_HINT);
  await expect(settings.clearSavedWorlds).toHaveCount(0);
  await expect(settings.toastTitle).toHaveText('Saved worlds cleared');
  await expect(settings.toastText).toHaveText(`61 MB freed. ${NONE_SAVED_HINT}`);
  expect(await savedWorldFiles(page)).toEqual([]);

  await settings.dismissToast.click();
  await expect(settings.toast).toHaveCount(0);
  await page.reload();
  await expect(settings.savedWorlds).toHaveText('None saved');
});

test('the toast closes on its own after 6 seconds (L2-165 AC2)', async ({ page }) => {
  const settings = new SettingsPage(page);
  await settings.open('device');
  await saveWorlds(page, THREE_WORLDS.slice(1, 2));
  await page.clock.install();
  await page.reload();
  await expect(settings.savedWorlds).toHaveText('1 world · 24 MB');
  await expect(settings.savedWorldsHint).toHaveText(
    'Old Town Criterium opens in seconds, even offline.',
  );

  await settings.clearSavedWorlds.click();
  await expect(settings.toastText).toHaveText(`24 MB freed. ${NONE_SAVED_HINT}`);
  await page.clock.runFor(5_900);
  await expect(settings.toast).toBeVisible();
  await page.clock.runFor(200);

  await expect(settings.toast).toHaveCount(0);
});

test('with nothing saved, Saved worlds reads None saved and offers no Clear (L2-165 AC2)', async ({
  page,
}) => {
  const settings = new SettingsPage(page);
  await settings.open('device');

  await expect(settings.savedWorlds).toHaveText('None saved');
  await expect(settings.savedWorldsHint).toHaveText(NONE_SAVED_HINT);
  await expect(settings.clearSavedWorlds).toHaveCount(0);
});

test.describe('a world class', () => {
  let assets: WorldAssets;
  let loading: WorldLoadingPage;

  test.beforeEach(async ({ page, bluetooth, api, webgl }) => {
    api.answer('GET', '/api/classes', catalogue);
    await bluetooth.remember(echelonBike);
    await webgl.disable();
    assets = await WorldAssets.install(page);
    loading = new WorldLoadingPage(page);
  });

  test.afterEach(async () => {
    await assets.dispose();
  });

  test('with Keep worlds after a ride on, the world a class downloads is listed on This device (L2-165 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await new ClassRidePage(page).open(hiitCardio.id);
    await connectBike(bluetooth);
    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');

    const settings = new SettingsPage(page);
    await settings.open('device');

    await expect(settings.savedWorlds).toHaveText(
      `1 world · ${megabytes(OLDTOWN_PANORAMA.length)} MB`,
    );
    await expect(settings.savedWorldsHint).toHaveText(
      'Old Town Criterium opens in seconds, even offline.',
    );
  });

  test('with Keep worlds after a ride off, nothing new is saved and the next load downloads again (L2-165 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await storeSettings(page, JSON.stringify({ keepWorlds: false }));
    await new ClassRidePage(page).open(hiitCardio.id);
    await connectBike(bluetooth);
    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');
    expect(await savedWorldFiles(page)).toEqual([]);

    await loading.back.click();
    await new ClassStartPage(page).start.click();

    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');
    expect(assets.requests).toHaveLength(2);
  });

  test('a world the browser evicted downloads again, and the class is ready to ride (L2-165 AC4)', async ({
    page,
    bluetooth,
  }) => {
    await new ClassRidePage(page).open(hiitCardio.id);
    await connectBike(bluetooth);
    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');
    await loading.back.click();
    await evictWorlds(page);

    await new ClassStartPage(page).start.click();

    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');
    await expect(loading.start).toBeEnabled();
    expect(assets.requests).toHaveLength(2);
  });
});
