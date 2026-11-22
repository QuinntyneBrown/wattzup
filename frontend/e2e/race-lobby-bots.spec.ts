// Acceptance test
// Traces to: L2-050 AC1; L2-051 AC1, AC2, AC4; L2-052 AC1, AC3, AC5; L2-053 AC1, AC2, AC3; L2-057 AC1
// Description: Go to the start line opens a bots lobby: nine bots on the start grid behind You, on the start line with
// the first stretch's resistance sent and the clock held at 0:05. "I'm ready" readies every bot and runs the clock, and
// the race opens at 0:00; pressed again it holds the clock. Leave goes back to Race Setup with the same choice.
import type { Page } from '@playwright/test';
import { echelonBike, targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { FakeWebGl } from './fixtures/webgl';
import { RaceLobbyPage } from './pages/race-lobby.page';
import { RaceSetupPage } from './pages/race-setup.page';

const BOTS = ['Nova', 'Rook', 'Juno', 'Atlas', 'Kite', 'Vale', 'Moss', 'Flint', 'Echo'];
const NOW = new Date('2026-11-22T18:00:00Z').getTime();

/**
 * Opens the lobby against medium bots with the remembered Echelon, then pauses the clock once it shows 0:05: the
 * paused clock moves only by hand, and the page draws on a frame the spec runs (L157).
 */
async function openLobby(
  page: Page,
  bluetooth: { remember: (bike: typeof echelonBike) => Promise<void> },
): Promise<RaceLobbyPage> {
  await page.clock.install({ time: NOW });
  await bluetooth.remember(echelonBike);
  const lobby = new RaceLobbyPage(page);
  await lobby.open('old-town-criterium', 'mode=bots&pack=medium');
  await expect(lobby.clock).toHaveText('0:05');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await page.clock.runFor(100);
  return lobby;
}

/** Presses the toggle and runs a frame, so the page draws the press under the paused clock (L157). */
async function press(page: Page, lobby: RaceLobbyPage): Promise<void> {
  await lobby.ready.click();
  await page.clock.runFor(100);
}

test(
  'Go to the start line opens a lobby of nine bots on the start line, the clock held at 0:05 (L2-050 AC1, L2-051, L2-052, L2-053 AC3)',
  { tag: '@critical' },
  async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    const setup = new RaceSetupPage(page);
    await setup.open('old-town-criterium');
    await setup.start.click();

    await expect(page).toHaveURL('/race/old-town-criterium/lobby?mode=bots&pack=medium');
    const lobby = new RaceLobbyPage(page);
    await expect(lobby.heading).toHaveText('Race lobby, Old Town Criterium');
    await expect(lobby.title).toHaveText('Old Town Criterium · 14.2 km · Bots, medium');
    await expect(lobby.leave).toBeVisible();
    await expect(lobby.status).toHaveText('On the start line');
    await expect(lobby.clock).toHaveText('0:05');
    await expect(lobby.clock).toHaveAttribute('aria-label', 'Starts in 5 seconds');
    await expect(lobby.hint).toHaveText(
      'Keep pedalling easy. Resistance is set for the first stretch.',
    );
    await expect(lobby.ready).toHaveText("I'm ready");
    await expect(lobby.ready).toHaveAttribute('aria-pressed', 'false');
    await expect(lobby.gridTitle).toHaveText('Start grid');
    await expect(lobby.count).toHaveText('10 / 10');
    expect(await lobby.seatLines()).toEqual([
      '1 You Lv 1',
      ...BOTS.map((name, i) => `${i + 2} Pacer ${name} Bot`),
    ]);
    // The first stretch's level goes to the bike while the rider waits on the start line (L2-051 AC4).
    await expect
      .poll(() => bluetooth.writes().map((write) => write.hex))
      .toContain(targetResistanceWrite(8));
  },
);

test("the clock holds at 0:05 until I'm ready, which readies every bot and runs it (L2-053 AC1, AC3)", async ({
  page,
  bluetooth,
}) => {
  const lobby = await openLobby(page, bluetooth);
  await page.clock.runFor(3_000);
  await expect(lobby.clock).toHaveText('0:05');

  await press(page, lobby);

  await expect(lobby.ready).toHaveText("You're ready");
  await expect(lobby.ready).toHaveAttribute('aria-pressed', 'true');
  await expect(lobby.readyChecks).toHaveCount(10);
  await page.clock.runFor(1_000);
  await expect(lobby.clock).toHaveText('0:04');
  await expect(lobby.clock).toHaveAttribute('aria-label', 'Starts in 4 seconds');
});

test("pressing You're ready again holds the clock at 0:05 once more (L2-053 AC2, AC3)", async ({
  page,
  bluetooth,
}) => {
  const lobby = await openLobby(page, bluetooth);
  await press(page, lobby);
  // Before 0:03, when the countdown makes the lobby inert (L2-056 AC1).
  await page.clock.runFor(1_000);
  await expect(lobby.clock).toHaveText('0:04');

  await press(page, lobby);

  await expect(lobby.ready).toHaveText("I'm ready");
  await expect(lobby.ready).toHaveAttribute('aria-pressed', 'false');
  await expect(lobby.clock).toHaveText('0:05');
  await page.clock.runFor(2_000);
  await expect(lobby.clock).toHaveText('0:05');
});

test('at 0:03 the countdown covers the lobby, 3, 2, 1 and Go, and at Go the race opens (L2-056 AC1, AC2, AC3)', async ({
  page,
  bluetooth,
}) => {
  await new FakeWebGl(page).disable();
  const lobby = await openLobby(page, bluetooth);
  await press(page, lobby);
  await expect(lobby.countdown).toHaveCount(0);

  await page.clock.runFor(2_000);
  await expect(lobby.countdown).toHaveAttribute('role', 'timer');
  await expect(lobby.countdown).toHaveAttribute('aria-live', 'assertive');
  await expect(lobby.countdown).toHaveAttribute('aria-label', 'Race starts in 3');
  await expect(lobby.countdownStep).toHaveText('3');
  await expect(lobby.behind).toHaveAttribute('inert', '');
  await page.clock.runFor(1_000);
  await expect(lobby.countdownStep).toHaveText('2');
  await expect(lobby.countdown).toHaveAttribute('aria-label', 'Race starts in 2');
  await page.clock.runFor(1_000);
  await expect(lobby.countdownStep).toHaveText('1');
  await page.clock.runFor(1_000);
  await expect(lobby.countdownStep).toHaveText('Go');
  await expect(lobby.countdown).toHaveAttribute('aria-label', 'Go');

  // The race loads on the running clock, which the paused one would hold (L161).
  await page.clock.resume();
  await expect(page).toHaveURL('/race/old-town-criterium/ride?mode=bots&pack=medium');
});

test('at 0:00 the race opens against the same bots (L2-053 AC3)', async ({ page, bluetooth }) => {
  await new FakeWebGl(page).disable();
  const lobby = await openLobby(page, bluetooth);
  await press(page, lobby);
  await page.clock.runFor(5_000);

  await expect(page).toHaveURL('/race/old-town-criterium/ride?mode=bots&pack=medium');
});

test('Leave goes back to Race Setup with the same mode and pack, without a confirmation (L2-057 AC1)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const lobby = new RaceLobbyPage(page);
  await lobby.open('old-town-criterium', 'mode=bots&pack=hard');
  await expect(lobby.title).toHaveText('Old Town Criterium · 14.2 km · Bots, hard');

  await lobby.leave.click();

  await expect(page).toHaveURL('/race/old-town-criterium?mode=bots&pack=hard');
  const setup = new RaceSetupPage(page);
  await expect(setup.mode('Bots')).toBeChecked();
  await expect(setup.packStrength('hard')).toBeChecked();
});
