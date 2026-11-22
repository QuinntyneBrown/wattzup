// Acceptance test
// Traces to: L2-153 AC2, AC3, AC5; L2-157 AC1, AC2, AC3; L2-163 AC1
// Description: a solo world class starts when its world is ready and its bike connected. World loading hands its warm
// renderer to the class ride, whose stage shows the world over its panorama, faded in, with the class video in the
// corner. The world's track plays while no class video does.
//
// Given World loading with no bike connected, when the world is ready, then the facts read "No bike", an alert says the
// bike isn't connected with Connect bike, and Start riding stays disabled until the bike connects.
// Given the world is ready and the bike connected, when the rider presses Start riding, then the class ride shows the
// world over its panorama with the video in the corner, faded in, drawn by the renderer World loading warmed up (no
// second graphics context), and the first target resistance is sent.
// Given reduced motion, when the world comes in, then it does so at once.
// Given the class video cannot play, when the class rides in its world, then the world's own track plays.
import { catalogue, hiitCardio } from './fixtures/classes';
import { connectBike } from './fixtures/class-ride';
import { echelonBike, targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { WorldAssets } from './fixtures/world-assets';
import { WorldMusic } from './fixtures/world-music';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';

test.describe('Starting a world class', () => {
  let assets: WorldAssets;
  let loading: WorldLoadingPage;
  let ride: ClassRidePage;

  test.beforeEach(async ({ page, bluetooth, api }) => {
    api.answer('GET', '/api/classes', catalogue);
    await bluetooth.remember(echelonBike);
    assets = await WorldAssets.install(page);
    loading = new WorldLoadingPage(page);
    ride = new ClassRidePage(page);
  });

  test.afterEach(async () => {
    await assets.dispose();
  });

  test('with no bike the world keeps loading, and Start riding waits for the bike (L2-157 AC1, AC2, AC3)', async ({
    page,
    bluetooth,
    webgl,
  }) => {
    await webgl.disable();
    await ride.open(hiitCardio.id);

    await expect(loading.cardTitle).toHaveText('Old Town Criterium is ready as a panorama');
    await expect(loading.facts.first()).toHaveText('No bike');
    await expect(loading.alert).toContainText('Your bike isn’t connected.');
    await expect(loading.alert).toContainText(
      'The world keeps loading. Pedal once to wake the bike, then connect it.',
    );
    await expect(loading.connectBike).toBeVisible();
    await expect(loading.start).toBeDisabled();
    await expect(loading.hint).toHaveText(
      'Start riding turns on when the bike is connected and the world is ready.',
    );

    await connectBike(bluetooth);

    await expect(loading.facts.first()).toHaveText('Echelon EX-5s');
    await expect(loading.alert).toHaveCount(0);
    await expect(loading.start).toBeEnabled();
    await expect(loading.start).toBeFocused();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('30 Minute HIIT Cardio');
  });

  test('Start riding hands the warm world to the class ride, faded in over its panorama with the video in the corner (L2-153 AC2, AC3, AC5)', async ({
    page,
    bluetooth,
    webgl,
  }) => {
    await webgl.countContexts();
    const music = await WorldMusic.install(page);
    await ride.open(hiitCardio.id);
    await connectBike(bluetooth);
    await expect(loading.cardTitle).toHaveText('Old Town Criterium is ready', { timeout: 30_000 });
    const contexts = await webgl.contexts();
    expect(contexts).toBeGreaterThan(0);

    await loading.start.click();

    await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Solo');
    await expect(ride.worldPanorama).toBeVisible();
    await expect(ride.worldScene).toBeVisible();
    // The world fades in once `main`'s scene has measured the display's frame period, 30 frames on a busy machine.
    await expect(ride.worldScene).toHaveCSS('opacity', '1', { timeout: 30_000 });
    await expect(ride.worldScene).toHaveCSS('transition-duration', '0.2s');
    await expect(ride.worldVideo).toBeVisible();
    await expect
      .poll(() => bluetooth.writes().map((write) => write.hex))
      .toContain(targetResistanceWrite(8));
    // Drawn by the renderer World loading warmed up: no second graphics context (L2-153 AC5).
    expect(await webgl.contexts()).toBe(contexts);
    // The class video plays with its own sound, so the world's track does not (L2-163 AC1).
    expect(await music.played()).toEqual([]);
  });

  test('with reduced motion the world comes in at once (L2-153 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ride.open(hiitCardio.id);
    await connectBike(bluetooth);
    await expect(loading.cardTitle).toHaveText('Old Town Criterium is ready', { timeout: 30_000 });

    await loading.start.click();

    // The world fades in once `main`'s scene has measured the display's frame period, 30 frames on a busy machine.
    await expect(ride.worldScene).toHaveCSS('opacity', '1', { timeout: 30_000 });
    await expect(ride.worldScene).toHaveCSS('transition-duration', '0s');
  });

  test('without the class video the world’s own track plays (L2-163 AC1)', async ({
    page,
    bluetooth,
    webgl,
    youtube,
  }) => {
    await webgl.disable();
    youtube.block();
    const music = await WorldMusic.install(page);
    await ride.open(hiitCardio.id);
    await connectBike(bluetooth);
    await expect(loading.start).toBeEnabled();

    await loading.start.click();

    await expect(ride.videoNotice).toBeVisible();
    await expect(ride.worldPanorama).toBeVisible();
    await expect.poll(() => music.played()).toContain('music/oldtown.ogg');
  });
});
