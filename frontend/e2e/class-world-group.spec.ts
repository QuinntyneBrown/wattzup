// Acceptance test
// Traces to: L2-154 AC1, AC2, AC3, AC4; L2-157 AC4
// Description: a group world class waits for its session on World loading. The facts name the group, a notice counts
// down to the start, and the action is disabled until then. At the session's start the class ride starts with
// everyone whether the world is ready or not; a world that was still loading fades in when it is ready, and the ride's
// clock and bike carry on. With no bike at the start, the class ride starts with the lost-bike alert.
//
// Given a group world class 9 minutes before its session, when World loading shows, then the facts read
// "Group · 7:39 PM · 6 of 10", the notice reads "The group starts in 9:00." counting down each second with its
// explanation, and the action is disabled, reading "Starts with the group at 7:39 PM" over "Pedal easy: everyone’s
// warm-up starts together."
// Given the session's start while the world is still loading, when it arrives, then the class ride starts on the
// panorama with its first target resistance; when the world is ready, it fades in, and the clock carries on with no
// second first command.
// Given no bike at the session's start, when the class ride starts, then it shows "Lost the bike" with the group's words.
import type { Locator, Page } from '@playwright/test';
import { connectBike } from './fixtures/class-ride';
import {
  catalogue,
  hiitCardio,
  hiitSession,
  hiitSessions,
  seated,
  SESSIONS_NOW,
} from './fixtures/classes';
import { echelonBike, targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { WorldAssets } from './fixtures/world-assets';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';

/** Steps the paused clock a tenth of a second at a time until `shown` is: change detection waits on a timer (L157). */
async function untilShown(page: Page, shown: Locator): Promise<void> {
  await expect(async () => {
    await page.clock.runFor(100);
    await expect(shown).toBeVisible({ timeout: 100 });
  }).toPass();
}

/** Stands the page's clock half a second past SESSIONS_NOW once World loading is counting down (group-class-start). */
async function standAtNow(page: Page, loading: WorldLoadingPage): Promise<void> {
  await expect(loading.groupTimer).toBeVisible();
  await page.clock.pauseAt(SESSIONS_NOW - 500);
  await page.clock.runFor(1_000);
}

test.describe('Joining a group world class', () => {
  let assets: WorldAssets;
  let loading: WorldLoadingPage;
  let ride: ClassRidePage;

  test.beforeEach(async ({ page, api, bluetooth, hub }) => {
    // The clock runs while the page loads, then stands at SESSIONS_NOW, so the times read are exact.
    await page.clock.install({ time: SESSIONS_NOW - 10_000 });
    api.answer('GET', '/api/classes', catalogue);
    api.answer('GET', `/api/classes/${hiitCardio.id}/sessions`, hiitSessions);
    await bluetooth.remember(echelonBike);
    hub.open();
    hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
    assets = await WorldAssets.install(page);
    loading = new WorldLoadingPage(page);
    ride = new ClassRidePage(page);
  });

  test.afterEach(async () => {
    await assets.dispose();
  });

  test('World loading counts down to the group’s start with the action disabled (L2-154 AC1, AC2) @critical', async ({
    page,
    bluetooth,
    hub,
    webgl,
  }) => {
    await webgl.disable();
    const session = hiitSessions[0];
    hub.answer('JoinClassSession', () => seated(session));
    await ride.openGroup(hiitCardio.id, session.id);
    await connectBike(bluetooth);

    await standAtNow(page, loading);

    await expect(loading.facts.first()).toHaveText('Group · 7:39 PM · 6 of 10');
    await expect(loading.groupNotice).toContainText('The group starts in 9:00.');
    await expect(loading.groupTimer).toHaveText('9:00');
    await expect(loading.groupNotice).toContainText(
      'You start with everyone. If the world isn’t ready by then, you ride the panorama and the world fades in when it is.',
    );
    await expect(loading.eyebrow).toHaveText(
      'Old Town Criterium · Cathedral Circuit · Group class',
    );
    await expect(loading.groupStart).toHaveText('Starts with the group at 7:39 PM');
    await expect(loading.groupStart).toBeDisabled();
    await expect(loading.start).toHaveCount(0);
    await expect(loading.hint).toHaveText('Pedal easy: everyone’s warm-up starts together.');

    await page.clock.runFor(60_000);

    await expect(loading.groupTimer).toHaveText('8:00');
    await expect(loading.groupStart).toBeDisabled();
  });

  test('at the start the class ride starts on the panorama, and the world fades in when it is ready (L2-154 AC3, AC4)', async ({
    page,
    bluetooth,
    hub,
  }) => {
    const session = hiitSession('2026-11-21T19:30:30Z', []);
    hub.answer('JoinClassSession', () => seated(session));
    assets.hold();
    await ride.openGroup(hiitCardio.id, session.id);
    await connectBike(bluetooth);
    await standAtNow(page, loading);
    await expect(loading.groupTimer).toHaveText('0:30');

    await page.clock.runFor(30_000);
    await untilShown(page, ride.name);

    await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Group');
    await expect(ride.worldPanorama).toBeVisible();
    await expect(ride.worldScene).toHaveCount(0);
    await expect
      .poll(() => bluetooth.writes().map((write) => write.hex))
      .toContain(targetResistanceWrite(8));
    // The world draws on the display's frames, which a paused clock holds back (L157): time flows again.
    await page.clock.resume();
    await assets.release();

    await expect(ride.worldScene).toHaveCSS('opacity', '1', { timeout: 30_000 });
    await expect(ride.clock).not.toHaveText(/^0:00/);
    const firsts = bluetooth.writes().filter((write) => write.hex === targetResistanceWrite(8));
    expect(firsts).toHaveLength(1);
  });

  test('with no bike at the start the class ride starts with the lost-bike alert (L2-157 AC4)', async ({
    page,
    bluetooth,
    hub,
    webgl,
  }) => {
    await webgl.disable();
    await bluetooth.switchOff();
    const session = hiitSession('2026-11-21T19:30:30Z', []);
    hub.answer('JoinClassSession', () => seated(session));
    await ride.openGroup(hiitCardio.id, session.id);
    await standAtNow(page, loading);
    await expect(loading.facts).toContainText(['No bike']);

    await page.clock.runFor(30_000);
    await untilShown(page, ride.name);

    await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Group');
    await expect(ride.lost).toContainText(
      'The class keeps going. Pedal to wake the bike and you’ll rejoin where everyone is.',
    );
    const before = await ride.clock.textContent();
    await page.clock.runFor(5_000);
    await expect(ride.clock).not.toHaveText(before!);
  });
});
