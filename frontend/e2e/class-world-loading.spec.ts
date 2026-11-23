// Acceptance test
// Traces to: L2-151 AC1, AC2, AC3, AC5; L2-152 AC1, AC2, AC3, AC6, AC7; L2-153 AC1, AC2; L2-156 AC1, AC2, AC4
// Description: a solo world class opens World loading before the class ride: 30 Minute HIIT Cardio over Old Town
// Criterium's panorama, and the load card downloading the world (its panorama, served by the spec so it can be held,
// stopped part way and resumed), building the shaders and warming up the first frames with `main`'s renderer, then
// Start riding. A world downloaded once is saved on the device, and Back to class stops the download.
import { catalogue, hiitCardio } from './fixtures/classes';
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
} from './fixtures/echelon';
import { connectBike } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { OLDTOWN_PANORAMA, WorldAssets, megabytes } from './fixtures/world-assets';
import { ClassRidePage } from './pages/class-ride.page';
import { ClassStartPage } from './pages/class-start.page';
import { WorldLoadingPage } from './pages/world-loading.page';

const TOTAL = megabytes(OLDTOWN_PANORAMA.length);
const PLAN =
  'GCN Training · HIIT · 5:00 warm-up, 8 × 0:30 efforts with 3:00 → 1:30 recoveries, 6:00 cool-down';

test.describe('World loading', () => {
  let assets: WorldAssets;
  let loading: WorldLoadingPage;

  test.beforeEach(async ({ page, bluetooth, api }) => {
    api.answer('GET', '/api/classes', catalogue);
    await bluetooth.remember(echelonBike);
    assets = await WorldAssets.install(page);
    loading = new WorldLoadingPage(page);
  });

  test.afterEach(async () => {
    await assets.dispose();
  });

  test(
    'a solo world class downloads its world, builds its shaders and warms up, then Start riding takes focus (L2-151 AC1, AC2, L2-152 AC1, AC2, AC6, AC7, L2-153 AC1, AC2)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      assets.hold();
      await new ClassRidePage(page).open(hiitCardio.id);

      await expect(loading.eyebrow).toHaveText('Old Town Criterium · Cathedral Circuit · Solo');
      await expect(loading.title).toHaveText('30 Minute HIIT Cardio');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(loading.about).toHaveText(
        'Cobbled streets on race day. Each of the eight sprints is a kick up to the cathedral.',
      );
      await expect(loading.planTotal).toHaveText('30:00');
      await expect(loading.planSummary).toHaveText(PLAN);
      await expect(loading.panorama).toHaveAccessibleName(
        'The Old Town Criterium world: cobbled streets on race day, the cathedral at the top of the climb',
      );
      await expect(loading.cardTitle).toHaveText('Getting Old Town Criterium ready');
      await expect(loading.steps).toHaveCount(3);
      await expect(loading.step(0).label).toHaveText('Download the world: In progress');
      await expect(loading.step(0).root).toHaveAttribute('aria-current', 'step');
      await expect(loading.step(1).label).toHaveText('Build the shaders: Waiting');
      await expect(loading.step(2).label).toHaveText('Warm up the first frames: Waiting');
      await expect(loading.progress).toHaveAccessibleName('Loading Old Town Criterium');
      await expect(loading.progress).toHaveAttribute('aria-valuenow', '0');
      await expect(loading.percent).toHaveText('0%');
      // The bike has not answered yet: the load carries on and says so (L2-157 AC1, AC2).
      await expect(loading.status).toHaveText(
        'Downloading the world, 0 percent. The bike is not connected.',
      );
      await expect(loading.start).toBeDisabled();
      await expect(loading.hint).toHaveText(
        'Start riding turns on when the bike is connected and the world is ready.',
      );
      await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
      await expect(loading.facts.first()).toHaveText('No bike');
      // The bike is connected once it answers its initialisation.
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
      await expect(loading.facts.first()).toHaveText('Echelon EX-5s');
      await expect(loading.status).toHaveText('Downloading the world, 0 percent.');
      await expect(loading.hint).toHaveText(
        'The first time takes longest. Next time this world opens from this device.',
      );

      await assets.release();

      await expect(loading.cardTitle).toHaveText('Old Town Criterium is ready', {
        timeout: 30_000,
      });
      await expect(loading.step(0).label).toHaveText('Download the world: Done');
      await expect(loading.step(0).detail).toHaveText(
        `${TOTAL} MB · saved on this device for next time`,
      );
      await expect(loading.step(1).label).toHaveText('Build the shaders: Done');
      await expect(loading.step(2).label).toHaveText('Warm up the first frames: Done');
      await expect(loading.progress).toHaveAttribute('aria-valuenow', '100');
      await expect(loading.percent).toHaveText('100%');
      await expect(loading.status).toHaveText('Old Town Criterium is ready.');
      await expect(loading.facts.last()).toHaveText(/^(WebGPU|WebGL 2)$/);
      await expect(loading.start).toBeEnabled();
      await expect(loading.start).toBeFocused();
      await expect(loading.hint).toHaveText('Your 5:00 warm-up starts the moment you press Start.');
      // Pedalling does not start a solo class: nothing is sent until the rider presses Start riding (L2-153 AC4).
      expect(bluetooth.writes().map((write) => write.hex)).not.toContain(targetResistanceWrite(8));

      await loading.start.click();

      const ride = new ClassRidePage(page);
      await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Solo');
      await expect
        .poll(() => bluetooth.writes().map((write) => write.hex))
        .toContain(targetResistanceWrite(8));
    },
  );

  test('without WebGPU or WebGL 2 the class is ready as a panorama (L2-156 AC4)', async ({
    page,
    bluetooth,
    webgl,
  }) => {
    await webgl.disable();
    await new ClassRidePage(page).open(hiitCardio.id);
    await connectBike(bluetooth);

    await expect(loading.cardTitle).toHaveText('Old Town Criterium is ready as a panorama');
    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');
    await expect(loading.step(0).detail).toHaveText(`${TOTAL} MB`);
    await expect(loading.step(1).label).toHaveText('Build the shaders: Not needed');
    await expect(loading.step(1).detail).toHaveText('Not needed for the panorama');
    await expect(loading.step(2).label).toHaveText('Warm up the first frames: Not needed');
    await expect(loading.facts.last()).toHaveText('Panorama');
    await expect(loading.notice).toContainText('This browser can’t draw 3D worlds.');
    await expect(loading.notice).toContainText(
      'Neither WebGPU nor WebGL 2 is on here, so you ride with the world’s panorama. The plan, clock and bike work the same.',
    );
    await expect(loading.progress).toHaveAttribute('aria-valuenow', '100');
    await expect(loading.start).toBeEnabled();
    await expect(loading.hint).toHaveText(
      'Turn on graphics acceleration in Chrome or Edge to ride the 3D world.',
    );
  });

  test('a world downloaded once is saved on this device, so the next load skips its download (L2-152 AC3)', async ({
    page,
    bluetooth,
    webgl,
  }) => {
    await webgl.disable();
    await new ClassRidePage(page).open(hiitCardio.id);
    await connectBike(bluetooth);
    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');
    await loading.back.click();
    await expect(new ClassStartPage(page).start).toBeVisible();

    assets.hold();
    await new ClassStartPage(page).start.click();

    await expect(loading.step(0).label).toHaveText('Download the panorama: Done');
    await expect(loading.start).toBeEnabled();
    expect(assets.requests).toHaveLength(1);
  });

  test('a stopped download shows why, and Try again resumes it from the bytes received (L2-156 AC1, AC2)', async ({
    page,
    webgl,
  }) => {
    await webgl.disable();
    const half = Math.floor(OLDTOWN_PANORAMA.length / 2);
    assets.stopAfter(half);
    await new ClassRidePage(page).open(hiitCardio.id);

    await expect(loading.cardTitle).toHaveText('Couldn’t load Old Town Criterium');
    await expect(loading.step(0).label).toHaveText('Download the panorama: Failed');
    await expect(loading.step(0).detail).toHaveText(`Stopped at ${megabytes(half)} of ${TOTAL} MB`);
    await expect(loading.alert).toContainText('The download stopped.');
    await expect(loading.alert).toContainText(
      'Check your connection and try again, or ride with the panorama: the plan, clock and bike work the same.',
    );
    await expect(loading.panoramaRide).toBeVisible();
    await expect(loading.start).toHaveCount(0);

    await loading.tryAgain.click();

    await expect(loading.cardTitle).toHaveText('Old Town Criterium is ready as a panorama');
    expect(assets.requests).toHaveLength(2);
    expect(assets.requests[1]!.headers()['range']).toBe(`bytes=${half}-`);
  });

  test('Back to class stops the download and opens Class Start (L2-151 AC5)', async ({ page }) => {
    assets.hold();
    await new ClassRidePage(page).open(hiitCardio.id);
    await expect(loading.step(0).root).toHaveAttribute('aria-current', 'step');
    await expect.poll(() => assets.requests.length).toBe(1);

    await loading.back.click();

    await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);
    await expect(new ClassStartPage(page).start).toBeVisible();
    await expect.poll(() => assets.aborted(0)).toBe(true);
  });
});
