// Acceptance test
// Traces to: L2-163 AC1, AC3; L2-164 AC1, AC2, AC3, AC4, AC6
// Description: Settings' Sound and Motion and display sections offer ride sound, its volume, world music and muting
// under a class video, then reduce motion, theme, ride numbers, keeping the screen awake and going full screen when a
// ride starts, each at its recommended value and kept on this device. Each applies to the app: reduce motion makes
// every transition instant (or keeps motion the device would reduce), the theme follows the device unless the rider
// picks one, large ride numbers enlarge power, the clock and the target on the ride screens without a sideways scroll,
// Start riding enters full screen when asked, a world class plays no track with World music off, and with ride sound
// off a ride makes no audio context.
//
// Given Settings, when Sound and Motion and display show, then each control reads its words at its recommended value.
// Given a change to each, when the page reloads, then each change is still there.
// Given Reduce motion On, when anything animates, then it ends at once, whatever the device asks; Off keeps motion.
// Given Theme Match device, when the device asks for light, then the app is light, else dark; Dark and Light hold.
// Given Ride numbers Large, when a race or a class rides, then power, the clock and the target read larger, and the
// screen does not scroll sideways.
// Given Go full screen when a ride starts, when the rider presses Start riding or the race's start, then the app
// enters full screen; off, it does not.
// Given World music off, when a class rides in its world, then no track plays.
// Given ride sound off, when a race runs, then no audio context is made; on, one is, and it closes when the rider
// leaves.
import { connectBike, startClassRide } from './fixtures/class-ride';
import { catalogue, hiitCardio } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { maps } from './fixtures/maps';
import { startRace } from './fixtures/race';
import { RideAudio } from './fixtures/ride-audio';
import { storeSettings, storedSettings } from './fixtures/settings-storage';
import { expect, test } from './fixtures/test';
import { WorldMusic } from './fixtures/world-music';
import { AppDocument } from './pages/app-document';
import { ClassRidePage } from './pages/class-ride.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { SettingsPage } from './pages/settings.page';
import { WorldLoadingPage } from './pages/world-loading.page';

const MOTION_TEXT =
  'On stills the wind, motion blur and tyre spray and makes every transition instant.';

test('Sound and Motion and display offer every control at its recommended value, and each change is kept (L2-163 AC1, L2-164 AC1 to AC4, AC6) @critical', async ({
  page,
}) => {
  const settings = new SettingsPage(page);
  await settings.open('sound');

  await expect(settings.soundText).toHaveText(
    'Made in the browser as you ride; nothing is downloaded.',
  );
  await expect(settings.rideSound).toHaveAttribute('aria-checked', 'true');
  await expect(settings.rideSoundText).toHaveText(
    'Chain, freewheel, tyres and wind that follow your pedalling.',
  );
  await expect(settings.volume).toHaveValue('70');
  await expect(settings.volume).toHaveAttribute('min', '0');
  await expect(settings.volume).toHaveAttribute('max', '100');
  await expect(settings.volume).toHaveAttribute('step', '5');
  await expect(settings.volume).toHaveAttribute('aria-valuetext', '70 percent');
  await expect(settings.volumeValue).toHaveText('70 %');
  await expect(settings.volumeScale).toHaveText('QuietLoud');
  await expect(settings.volumeHint).toHaveText('Changes as you drag, so you can set it mid-ride.');
  await expect(settings.worldMusic).toHaveAttribute('aria-checked', 'true');
  await expect(settings.worldMusicText).toHaveText(
    'Each world’s own background track, under the ride sound.',
  );
  await expect(settings.muteUnderVideo).toHaveAttribute('aria-checked', 'true');
  await expect(settings.muteUnderVideoText).toHaveText(
    'A class video has its own sound. Ride sound comes back when the video pauses.',
  );

  await expect(settings.displayText).toHaveText(
    'For reading from the saddle and riding for an hour.',
  );
  await expect(settings.reduceMotion.getByRole('radio')).toHaveText(['Match device', 'On', 'Off']);
  await expect(settings.option(settings.reduceMotion, 'Match device')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.reduceMotionHint).toHaveText(
    `${MOTION_TEXT} This device doesn’t ask for it.`,
  );
  await expect(settings.theme.getByRole('radio')).toHaveText(['Match device', 'Dark', 'Light']);
  await expect(settings.option(settings.theme, 'Match device')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.themeHint).toHaveText(
    'Match device is dark unless this device asks for light.',
  );
  await expect(settings.rideNumbers.getByRole('radio')).toHaveText(['Standard', 'Large']);
  await expect(settings.option(settings.rideNumbers, 'Standard')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.rideNumbersHint).toHaveText(
    'Large makes power, the clock and the target bigger on every ride screen.',
  );
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'true');
  await expect(settings.keepAwakeText).toHaveText(
    'Stops the screen dimming or locking while a ride runs.',
  );
  await expect(settings.fullScreenOnStart).toHaveAttribute('aria-checked', 'false');
  await expect(settings.fullScreenOnStartText).toHaveText(
    'Leave full screen with Esc or the button in the header.',
  );

  // Each change applies at once, with no Save, and is kept on this device.
  await settings.rideSound.click();
  await settings.volume.fill('40');
  await expect(settings.volumeValue).toHaveText('40 %');
  await expect(settings.volume).toHaveAttribute('aria-valuetext', '40 percent');
  await settings.worldMusic.click();
  await settings.muteUnderVideo.click();
  await settings.option(settings.reduceMotion, 'On').click();
  await settings.option(settings.theme, 'Light').click();
  await settings.option(settings.rideNumbers, 'Large').click();
  await settings.fullScreenOnStart.click();
  await expect(settings.fullScreenOnStart).toHaveAttribute('aria-checked', 'true');
  expect(await storedSettings(page)).toMatchObject({
    rideSound: false,
    rideSoundVolume: 40,
    worldMusic: false,
    muteUnderVideo: false,
    reduceMotion: 'on',
    theme: 'light',
    rideNumbers: 'large',
    fullScreenOnStart: true,
  });

  await page.reload();
  await expect(settings.rideSound).toHaveAttribute('aria-checked', 'false');
  await expect(settings.volume).toHaveValue('40');
  await expect(settings.worldMusic).toHaveAttribute('aria-checked', 'false');
  await expect(settings.muteUnderVideo).toHaveAttribute('aria-checked', 'false');
  await expect(settings.option(settings.reduceMotion, 'On')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.option(settings.theme, 'Light')).toHaveAttribute('aria-checked', 'true');
  await expect(settings.option(settings.rideNumbers, 'Large')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.fullScreenOnStart).toHaveAttribute('aria-checked', 'true');
});

test('Reduce motion On makes every transition instant whatever the device asks, and Off keeps motion it would reduce (L2-164 AC2)', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const settings = new SettingsPage(page);
  const app = new AppDocument(page);
  await settings.open('display');

  // Match device follows this device, which asks for reduced motion.
  await expect(settings.reduceMotionHint).toHaveText(`${MOTION_TEXT} This device asks for it.`);
  await expect.poll(() => app.duration('--duration-base')).toBe(0);

  await settings.option(settings.reduceMotion, 'Off').click();
  await expect.poll(() => app.duration('--duration-base')).toBe(200);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(settings.reduceMotionHint).toHaveText(
    `${MOTION_TEXT} This device doesn’t ask for it.`,
  );
  await settings.option(settings.reduceMotion, 'Match device').click();
  await expect.poll(() => app.duration('--duration-base')).toBe(200);

  await settings.option(settings.reduceMotion, 'On').click();
  await expect.poll(() => app.duration('--duration-base')).toBe(0);
});

test('Theme Match device is dark unless the device asks for light, and Dark or Light holds whatever it asks (L2-164 AC3)', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  const settings = new SettingsPage(page);
  const app = new AppDocument(page);
  await settings.open('display');

  await expect(app.root).toHaveAttribute('data-theme', 'light');
  const light = await app.background();
  // Chromium reads a device with no preference as light; one that asks for dark gets dark.
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(app.root).toHaveAttribute('data-theme', 'dark');
  expect(await app.background()).not.toBe(light);

  await settings.option(settings.theme, 'Light').click();
  await expect(app.root).toHaveAttribute('data-theme', 'light');
  expect(await app.background()).toBe(light);

  await page.emulateMedia({ colorScheme: 'light' });
  await settings.option(settings.theme, 'Dark').click();
  await expect(app.root).toHaveAttribute('data-theme', 'dark');
});

test('Large ride numbers make power, the clock and the target bigger on the race, with no sideways scroll (L2-164 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await storeSettings(page, JSON.stringify({ rideNumbers: 'large' }));
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
  const app = new AppDocument(page);

  // A quarter larger than Standard's 64, 20 and 14 px at this width.
  await expect(race.wattsValue).toBeVisible();
  expect(await AppDocument.fontSize(race.wattsValue)).toBe(80);
  expect(await AppDocument.fontSize(race.clock)).toBe(25);
  expect(await AppDocument.fontSize(race.target)).toBe(17.5);
  expect(await app.scrollsSideways()).toBe(false);
});

test('Large ride numbers make power, its target and the clock bigger on a class ride, with no sideways scroll (L2-164 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await storeSettings(page, JSON.stringify({ rideNumbers: 'large' }));
  const ride = await startClassRide(page, bluetooth, api);
  const app = new AppDocument(page);

  // A quarter larger than Standard's 48, 12 and 24 px.
  await expect(ride.power).toBeVisible();
  expect(await AppDocument.fontSize(ride.power)).toBe(60);
  expect(await AppDocument.fontSize(ride.powerHint)).toBe(15);
  expect(await AppDocument.fontSize(ride.clock)).toBe(30);
  expect(await app.scrollsSideways()).toBe(false);
});

test('with Go full screen when a ride starts, Start riding enters full screen (L2-164 AC6)', async ({
  page,
  bluetooth,
  api,
}) => {
  await storeSettings(page, JSON.stringify({ fullScreenOnStart: true }));
  const app = new AppDocument(page);
  await startClassRide(page, bluetooth, api);

  await expect.poll(() => app.inFullScreen()).toBe(true);
});

test('with Go full screen when a ride starts off, Start riding stays in the window (L2-164 AC6)', async ({
  page,
  bluetooth,
  api,
}) => {
  const app = new AppDocument(page);
  const ride = await startClassRide(page, bluetooth, api);

  await expect(ride.clock).toBeVisible();
  expect(await app.inFullScreen()).toBe(false);
});

test('with Go full screen when a ride starts, the race’s start enters full screen (L2-164 AC6)', async ({
  page,
  bluetooth,
  api,
}) => {
  api.answer('GET', '/api/maps', maps);
  await storeSettings(page, JSON.stringify({ fullScreenOnStart: true }));
  await bluetooth.remember(echelonBike);
  const setup = new RaceSetupPage(page);
  const app = new AppDocument(page);
  await setup.open('old-town-criterium');

  await setup.packStrength('hard').click();
  await setup.start.click();
  await expect(page).toHaveURL('/race/old-town-criterium/lobby?mode=bots&pack=hard');
  await expect.poll(() => app.inFullScreen()).toBe(true);
});

test('with World music off, a class riding in its world plays no track (L2-163 AC1)', async ({
  page,
  bluetooth,
  api,
  webgl,
  youtube,
}) => {
  api.answer('GET', '/api/classes', catalogue);
  await bluetooth.remember(echelonBike);
  await storeSettings(page, JSON.stringify({ worldMusic: false }));
  await webgl.disable();
  youtube.block();
  const music = await WorldMusic.install(page);
  const loading = new WorldLoadingPage(page);
  const ride = new ClassRidePage(page);
  await ride.open(hiitCardio.id);
  await connectBike(bluetooth);
  await expect(loading.start).toBeEnabled();

  await loading.start.click();

  await expect(ride.videoNotice).toBeVisible();
  await expect(ride.worldPanorama).toBeVisible();
  // The world's library and its player load once the ride starts; when nothing more is loading, no track has played.
  await page.waitForLoadState('networkidle');
  expect(await music.played()).toEqual([]);
});

test.describe('ride sound', () => {
  test('with ride sound off, a race makes no audio context (L2-163 AC3)', async ({
    page,
    bluetooth,
    api,
  }) => {
    await storeSettings(page, JSON.stringify({ rideSound: false }));
    const audio = await RideAudio.install(page);
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );
    await page.clock.runFor(3_000);

    await expect(race.clock).toHaveText(/^0:03/);
    expect(await audio.counts()).toEqual({ made: 0, closed: 0 });
  });

  test('with ride sound on, a race makes one audio context, and closes it when the rider leaves (L2-163 AC3)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const audio = await RideAudio.install(page);
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );
    await page.clock.runFor(3_000);

    await expect.poll(() => audio.counts()).toEqual({ made: 1, closed: 0 });
    await race.leave.click();
    await expect(page).toHaveURL('/race/old-town-criterium');
    await expect.poll(() => audio.counts()).toEqual({ made: 1, closed: 1 });
  });
});
