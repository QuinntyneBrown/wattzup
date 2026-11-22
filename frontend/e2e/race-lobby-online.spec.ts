// Acceptance test
// Traces to: L2-051 AC1, AC2, AC3, AC4, AC5; L2-052 AC1, AC2, AC4, AC5; L2-053 AC1; L2-054 AC1; L2-055 AC1, AC3;
// L2-057 AC1; L2-121 AC1
// Description: a riders-online lobby asks the ride hub for a seat in a race on the map and draws the session's grid,
// You first at your level, then the riders online by seat, then the open seats. The clock counts down to the session's
// server-time start. The grid follows the hub: a rider joining takes an open seat, a rider leaving opens theirs with a
// notice naming them, and at 0:10 the bots fill it, putting the rider on the start line with the first stretch's level
// sent. "I'm ready" tells the hub; Leave tells it and returns to Race Setup with Riders online.
import type { Page } from '@playwright/test';
import { echelonBike, targetResistanceWrite } from './fixtures/echelon';
import type { HubFixture } from './fixtures/hub';
import { midRiderProgress } from './fixtures/progress';
import {
  RACE_SESSION,
  bot,
  found,
  lobbyOfSix,
  open,
  rider,
  seatsChanged,
  withSeat,
} from './fixtures/race-lobby';
import { expect, test } from './fixtures/test';
import { RaceLobbyPage } from './pages/race-lobby.page';
import { RaceSetupPage } from './pages/race-setup.page';

const NOW = new Date('2026-11-22T18:00:00Z').getTime();

/**
 * Opens a riders-online lobby whose session starts 23.5 seconds after the hub answers, on the page's clock, then
 * pauses the clock once seated: the clock reads 0:24 and flips half a second later (L154). The hub answers ServerTime
 * from the page (L153).
 */
async function openLobby(
  page: Page,
  hub: HubFixture,
  bluetooth: { remember: (bike: typeof echelonBike) => Promise<void> },
): Promise<RaceLobbyPage> {
  hub.open();
  hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
  hub.answer('FindRace', async () =>
    found((await page.evaluate(() => Date.now())) + 23_500, 6, lobbyOfSix),
  );
  await page.clock.install({ time: NOW });
  await bluetooth.remember(echelonBike);
  const lobby = new RaceLobbyPage(page);
  await lobby.open('old-town-criterium', 'mode=online');
  await expect(lobby.count).toHaveText('6 / 10');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await page.clock.runFor(100);
  return lobby;
}

/** The hub sends a new grid; the paused clock runs a frame so the page draws it (L157). */
async function change(page: Page, hub: HubFixture, message: ReturnType<typeof seatsChanged>) {
  await hub.send('SeatsChanged', message);
  await page.clock.runFor(100);
}

test.beforeEach(({ api }) => api.answer('GET', '/api/progress', midRiderProgress));

test(
  'a riders-online lobby seats the rider in a race and draws its grid, waiting for riders (L2-051, L2-052, L2-121 AC1)',
  { tag: '@critical' },
  async ({ page, hub, bluetooth }) => {
    const lobby = await openLobby(page, hub, bluetooth);

    expect(hub.invocations('FindRace')).toEqual([['old-town-criterium']]);
    await expect(lobby.heading).toHaveText('Race lobby, Old Town Criterium');
    await expect(lobby.title).toHaveText('Old Town Criterium · 14.2 km · Riders online');
    await expect(lobby.status).toHaveText('Waiting for riders');
    await expect(lobby.clock).toHaveText('0:24');
    await expect(lobby.clock).toHaveAttribute('aria-label', 'Starts in 24 seconds');
    await expect(lobby.hint).toHaveText(
      '6 of 10 seats taken. At 0:10 bots fill the rest so the race starts full.',
    );
    await expect(lobby.ready).toHaveText("I'm ready");
    expect(await lobby.seatLines()).toEqual([
      '1 You Lv 7',
      '2 lena.k Lv 4 ready',
      '3 MarcoVelo Lv 11 ready',
      '4 priya_spins Lv 18 ready',
      '5 jwatts Lv 7 ready',
      '6 Ollie R. Lv 14 ready',
      '7 Open seat',
      '8 Open seat',
      '9 Open seat',
      '10 Open seat',
    ]);

    await page.clock.runFor(1_000);
    await expect(lobby.clock).toHaveText('0:23');
    // Waiting for riders, nothing goes to the bike yet.
    expect(bluetooth.writes().map((write) => write.hex)).not.toContain(targetResistanceWrite(8));
  },
);

test('a rider joining takes an open seat for everyone in the session (L2-055 AC3)', async ({
  page,
  hub,
  bluetooth,
}) => {
  const lobby = await openLobby(page, hub, bluetooth);

  await change(page, hub, seatsChanged(withSeat(lobbyOfSix, rider(7, 'kenji.cyc', 'ana', 9))));

  await expect(lobby.count).toHaveText('7 / 10');
  await expect(lobby.hint).toHaveText(
    '7 of 10 seats taken. At 0:10 bots fill the rest so the race starts full.',
  );
  expect((await lobby.seatLines())[6]).toBe('7 kenji.cyc Lv 9');
});

test('MarcoVelo leaving opens their seat again, with a notice naming them (L2-055 AC1)', async ({
  page,
  hub,
  bluetooth,
}) => {
  const lobby = await openLobby(page, hub, bluetooth);

  await change(page, hub, seatsChanged(withSeat(lobbyOfSix, open(2)), 'MarcoVelo'));

  await expect(lobby.notice).toHaveText('MarcoVelo left. Their seat is open again.');
  await expect(lobby.notice).toHaveAttribute('role', 'status');
  await expect(lobby.count).toHaveText('5 / 10');
  expect((await lobby.seatLines()).slice(0, 3)).toEqual([
    '1 You Lv 7',
    '2 lena.k Lv 4 ready',
    '3 Open seat',
  ]);
});

test('at 0:10 bots fill the open seats and the rider is on the start line, its level sent (L2-054 AC1, L2-051 AC4)', async ({
  page,
  hub,
  bluetooth,
}) => {
  const lobby = await openLobby(page, hub, bluetooth);
  await page.clock.runFor(14_000);
  await expect(lobby.clock).toHaveText('0:10');

  const full = lobbyOfSix.map((seat, i) =>
    seat.kind === 'open' ? bot(seat.number, ['Nova', 'Rook', 'Juno', 'Atlas'][i - 6]) : seat,
  );
  await change(page, hub, seatsChanged(full));

  await expect(lobby.status).toHaveText('On the start line');
  await expect(lobby.count).toHaveText('10 / 10');
  await expect(lobby.hint).toHaveText(
    'Keep pedalling easy. Resistance is set for the first stretch.',
  );
  expect((await lobby.seatLines()).slice(6)).toEqual([
    '7 Pacer Nova Bot ready',
    '8 Pacer Rook Bot ready',
    '9 Pacer Juno Bot ready',
    '10 Pacer Atlas Bot ready',
  ]);
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex))
    .toContain(targetResistanceWrite(8));
});

test("I'm ready tells the hub, and the rider's seat shows ready once the hub says so (L2-053 AC1)", async ({
  page,
  hub,
  bluetooth,
}) => {
  const lobby = await openLobby(page, hub, bluetooth);

  await lobby.ready.click();
  await page.clock.runFor(100);

  await expect(lobby.ready).toHaveText("You're ready");
  await expect(lobby.ready).toHaveAttribute('aria-pressed', 'true');
  expect(hub.invocations('SetReady')).toEqual([[RACE_SESSION, true]]);

  await change(page, hub, seatsChanged(withSeat(lobbyOfSix, rider(6, 'quinn', 'kenji', 7, true))));
  expect((await lobby.seatLines())[0]).toBe('1 You Lv 7 ready');
});

test('Leave releases the seat and returns to Race Setup with Riders online (L2-057 AC1)', async ({
  page,
  hub,
  bluetooth,
  api,
}) => {
  api.answer('GET', '/api/maps/old-town-criterium/queue', { riders: 5 });
  const lobby = await openLobby(page, hub, bluetooth);

  await lobby.leave.click();
  // Race Setup loads on the running clock, which the paused one would hold (L157).
  await page.clock.resume();

  await expect(page).toHaveURL('/race/old-town-criterium?mode=online');
  expect(hub.invocations('LeaveRace')).toEqual([[RACE_SESSION]]);
  await expect(new RaceSetupPage(page).mode('Riders online')).toBeChecked();
});
