// Acceptance test
// Traces to: L2-091 AC1, AC2; L2-088 AC3; L2-092 AC4; L2-017 AC4;
// L2-093 AC1, AC2; L2-133 AC3, AC4
// Description: a solo class ride paused and resumed: the clock, the plan and the video hold together, the video shows
// "Paused", and the ride picks up where it left off. The ride starts on Playwright's paused clock (startClassRide), and
// the shared fixture's fake YouTube player runs on the same clock.
import type { Page } from '@playwright/test';
import { startClassRide } from './fixtures/class-ride';
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  resistanceFrame,
  targetResistanceWrite,
} from './fixtures/echelon';
import { hiitCardio } from './fixtures/classes';
import { expect, test } from './fixtures/test';
import type { YouTubeFixture } from './fixtures/youtube';
import { ClassStartPage } from './pages/class-start.page';
import { ResultsPage } from './pages/results.page';

/** Waits for the fake player, then lets it get ready: its onReady runs on the paused clock. */
async function videoReady(page: Page, youtube: YouTubeFixture): Promise<void> {
  await expect.poll(async () => (await youtube.players()).length).toBe(1);
  await page.clock.runFor(100);
}

test.describe('Pause, leave or finish a class', () => {
  test('Pause holds the clock and the video under "Paused" with the stepper on, and Resume carries on from there (L2-091 AC1, AC2, L2-088 AC3)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoReady(page, youtube);
    await page.clock.fastForward('07:00');
    // The link reads connected from the bike's first notification on.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('7:00 / 30:00');

    await ride.pause.click();
    await page.clock.runFor(10_000);
    await expect(ride.clock).toHaveText('7:00 / 30:00');
    await expect(ride.segmentLeft).toHaveText('1:30');
    await expect(ride.paused).toHaveText('Paused');
    await expect(ride.resume).toBeVisible();
    await expect(ride.pause).toHaveCount(0);
    expect((await youtube.players())[0].playing).toBe(false);
    expect(await youtube.time()).toBeCloseTo(432.2, 0);
    await expect(ride.raise).toBeEnabled();

    await ride.resume.click();
    await page.clock.runFor(2000);
    await expect(ride.clock).toHaveText('7:02 / 30:00');
    await expect(ride.paused).toHaveCount(0);
    expect((await youtube.players())[0].playing).toBe(true);
    expect(await youtube.time()).toBeCloseTo(434.2, 0);
  });

  test('a solo ride pauses while the bike is lost, says so with Reconnect, and carries on once it is back (L2-092 AC4, L2-017 AC4)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoReady(page, youtube);
    await page.clock.fastForward('07:00');
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('7:00 / 30:00');

    await bluetooth.switchOff();
    await bluetooth.drop();
    const afterDrop = bluetooth.log().length;
    await page.clock.runFor(1000);
    await expect(ride.lost).toContainText('Lost the bike');
    await expect(ride.lost).toContainText(
      'Your ride is paused. Pedal to wake the bike and it carries on from here.',
    );
    // The ride holds within a second of the drop.
    const held = await ride.clock.textContent();
    await page.clock.runFor(9000);
    await expect(ride.clock).toHaveText(held!);
    expect((await youtube.players())[0].playing).toBe(false);
    await expect(ride.raise).toBeDisabled();

    // Reconnect tries the bike at once, without waiting for the next retry.
    await bluetooth.switchOn();
    const writes = bluetooth.writes().length;
    await ride.reconnect.click();
    // Initialising waits between commands, so the paused clock steps until it is done; the ride is held meanwhile.
    await expect(async () => {
      await page.clock.runFor(100);
      expect(bluetooth.log().slice(afterDrop)).toEqual(ECHELON_INITIALISED);
    }).toPass();
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
    await page.clock.runFor(2000);
    await expect(ride.lost).toHaveCount(0);
    await expect(ride.clock).not.toHaveText(held!);
    expect((await youtube.players())[0].playing).toBe(true);
    expect(
      bluetooth
        .writes()
        .slice(writes)
        .map((write) => write.hex),
    ).toContain(targetResistanceWrite(6));
  });

  test('Leave goes to Class Start at once and stops the ride and its video (L2-093 AC1)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoReady(page, youtube);
    await page.clock.fastForward('07:00');
    await page.clock.runFor(100);

    await ride.leave.click();
    await page.clock.runFor(100);
    await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);
    const start = new ClassStartPage(page);
    await expect(async () => {
      await page.clock.runFor(16);
      await expect(start.title).toHaveText(hiitCardio.title, { timeout: 50 });
    }).toPass();
    expect((await youtube.players())[0].destroyed).toBe(true);

    // The plan no longer drives the bike: the next interval, at 8:30, never sends its level.
    const writes = bluetooth.writes().length;
    await page.clock.runFor(120_000);
    expect(
      bluetooth
        .writes()
        .slice(writes)
        .map((write) => write.hex),
    ).not.toContain(targetResistanceWrite(24));
  });

  test('at the class length the ride ends and Results opens (L2-093 AC2)', async ({
    page,
    bluetooth,
    api,
    youtube,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await videoReady(page, youtube);
    await page.clock.fastForward('29:58');
    await page.clock.runFor(100);
    await expect(ride.clock).toHaveText('29:58 / 30:00');

    await page.clock.runFor(2000);
    await expect(page).toHaveURL('/results');
    await new ResultsPage(page).shown();
    expect((await youtube.players())[0].destroyed).toBe(true);
  });

  test('the screen stays awake through the ride, is kept awake again when the tab comes back, and is let go on leaving (L2-133 AC3)', async ({
    page,
    bluetooth,
    api,
    wakeLock,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    await expect.poll(() => wakeLock.locks()).toEqual([{ type: 'screen', released: false }]);

    await wakeLock.hide();
    await page.clock.runFor(60_000);
    await wakeLock.show();
    await expect
      .poll(() => wakeLock.locks())
      .toEqual([
        { type: 'screen', released: true },
        { type: 'screen', released: false },
      ]);

    await ride.leave.click();
    await page.clock.runFor(100);
    await expect
      .poll(async () => (await wakeLock.locks()).map((lock) => lock.released))
      .toEqual([true, true]);
  });

  test('closing or reloading the tab mid-ride asks the rider to confirm (L2-133 AC4)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    // The browser asks only on a page the rider has interacted with.
    await ride.pause.click();
    const asked = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const dialog = await asked;
    expect(dialog.type()).toBe('beforeunload');
    await dialog.accept();
  });
});
