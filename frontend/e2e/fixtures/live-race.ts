import type { Page } from '@playwright/test';
import { echelonBike } from './echelon';
import type { HubFixture } from './hub';
import { RACE_SESSION, bot, found, lobbyOfSix } from './race-lobby';
import { expect } from './test';
import { RacePage } from '../pages/race.page';
import { FakeWebGl } from './webgl';

/** When a live race spec's clock is installed. */
export const LIVE_RACE_NOW = new Date('2026-11-22T18:00:30Z').getTime();
/** Where each live race spec stands: far enough ahead that the page opens and joins first. */
export const PAUSED_AT = LIVE_RACE_NOW + 15_000;

/** The session's grid at the start: the mock's riders and the rider in seat 6, the open seats filled by bots. */
export const atTheStart = lobbyOfSix.map((seat, i) =>
  seat.kind === 'open' ? bot(seat.number, ['Nova', 'Rook', 'Juno', 'Atlas'][i - 6]!) : seat,
);

/** The rider's seat in the session. */
export const YOUR_SEAT = 6;

/**
 * Opens the race in the rider's session, then pauses the clock at a fixed moment on the page's installed clock,
 * `fromStart` ms after the session's start (a negative value: still to come), whose start the hub answers. The clock
 * stands half a second into the second it shows (L154), however long the page took to open (L165).
 */
export async function openRace(
  page: Page,
  hub: HubFixture,
  bluetooth: { remember: (bike: typeof echelonBike) => Promise<void> },
  fromStart: number,
): Promise<RacePage> {
  await new FakeWebGl(page).disable();
  hub.open();
  hub.answer('ServerTime', () => page.evaluate(() => Date.now()));
  hub.answer('JoinRace', () => found(PAUSED_AT - fromStart, YOUR_SEAT, atTheStart));
  await page.clock.install({ time: LIVE_RACE_NOW });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open('old-town-criterium', `mode=online&session=${RACE_SESSION}`);
  await expect.poll(() => hub.invocations('JoinRace').length).toBe(1);
  await expect(race.route).toHaveText('Cathedral Circuit · Live race');
  await page.clock.pauseAt(PAUSED_AT);
  await page.clock.runFor(100);
  return race;
}

/** One row of a RaceStandingsUpdated message: the seat's place, distance and seconds behind the leader. */
export interface RaceStandingLine {
  readonly seat: number;
  readonly metres: number;
  readonly gapSeconds: number;
}

/** A RaceStandingsUpdated message for the session, its rows in the order given, each named from the start grid. */
export function raceStandings(lines: readonly RaceStandingLine[]) {
  return {
    sessionId: RACE_SESSION,
    rows: lines.map(({ seat, metres, gapSeconds }, i) => {
      const grid = atTheStart.find((each) => each.number === seat)!;
      return {
        position: i + 1,
        seat,
        name: grid.name,
        jersey: grid.jersey,
        level: grid.level,
        kind: grid.kind === 'bot' ? 'bot' : 'person',
        distanceMetres: metres,
        gapSeconds,
      };
    }),
  };
}

/**
 * The race mock's peers board (docs/mocks/pages/race/peers.html) on this grid, Pacer Atlas in kenji.cyc's place: the
 * rider 5th, seven seconds behind Pacer Rook, so the gaps to the rider read +0:07 to −0:05.
 */
export const peersBoard: readonly RaceStandingLine[] = [
  { seat: 8, metres: 2_140, gapSeconds: 0 },
  { seat: 9, metres: 2_134, gapSeconds: 1 },
  { seat: 7, metres: 2_116, gapSeconds: 4 },
  { seat: 10, metres: 2_110, gapSeconds: 5 },
  { seat: 6, metres: 2_098, gapSeconds: 7 },
  { seat: 5, metres: 2_092, gapSeconds: 8 },
  { seat: 3, metres: 2_074, gapSeconds: 11 },
  { seat: 2, metres: 2_068, gapSeconds: 12 },
  { seat: 4, metres: 2_067, gapSeconds: 12 },
  { seat: 1, metres: 2_066, gapSeconds: 12 },
];
