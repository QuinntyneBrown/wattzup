import type { Page } from '@playwright/test';
import { ECHELON_INITIALISED, echelonBike, targetResistanceWrite } from './echelon';
import { maps } from './maps';
import { type ApiFixture, newRiderProgress } from './api';
import type { FakeBluetooth } from './fake-bluetooth';
import { expect } from './test';
import { RacePage } from '../pages/race.page';
import { FakeWebGl } from './webgl';

/** When a race spec's clock starts; the race itself starts a minute later, on a paused clock. */
export const RACE_START = new Date('2026-11-21T18:00:00Z').getTime();

/**
 * Opens a race with the remembered Echelon and starts it on Playwright's paused clock: the map catalogue's answer is
 * held until the bike is initialised and the clock paused, so the race starts at a known time and the spec moves it on
 * by hand. Resolves once the race's first command (the warm-up's level 8) has gone and the page has rendered. With
 * `offline`, the backend answers the catalogue with 503, as when it cannot be reached; `catalogue` serves other maps.
 * The world is drawn only with `world`: drawn in software, its scene slows every step of a spec about the HUD, so
 * otherwise the browser offers neither WebGPU nor WebGL 2 and the map's panorama stands in (L2-065 AC2), as `main`'s
 * HUD specs do. A map the new rider's progress does not hold (a test-only map, or one still locked) is opened to the
 * rider, so its race opens rather than Map Select (L2-047 AC5).
 */
export async function startRace(
  page: Page,
  bluetooth: FakeBluetooth,
  api: ApiFixture,
  mapId: string,
  query: string,
  { offline = false, catalogue = maps as readonly unknown[], world = false } = {},
): Promise<RacePage> {
  let answer: () => void = () => undefined;
  const held = new Promise<void>((resolve) => (answer = resolve));
  api.answer('GET', '/api/maps', async () => {
    await held;
    return offline ? { status: 503 } : { body: catalogue };
  });
  if (!newRiderProgress.openMapIds.includes(mapId)) {
    api.answer('GET', '/api/progress', {
      ...newRiderProgress,
      openMapIds: [...newRiderProgress.openMapIds, mapId],
    });
  }
  if (!world) await new FakeWebGl(page).disable();
  await page.clock.install({ time: RACE_START });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(mapId, query);
  await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
  await page.clock.pauseAt(RACE_START + 60_000);
  answer();
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex))
    .toContain(targetResistanceWrite(8));
  await page.clock.runFor(100);
  return race;
}

/**
 * The world loads lazily and measures the display's frame period over 30 frames before it starts, so the paused clock
 * steps a frame at a time until `shown` holds (L43), retrying at once: toPass's default backoff waits up to a second
 * between frames, too slow for the 31 frames the start takes (L78).
 */
export async function stepUntil(page: Page, shown: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await page.clock.runFor(16);
    await shown();
  }).toPass({ intervals: [0] });
}
