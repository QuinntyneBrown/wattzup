// Acceptance test
// Traces to: L2-064 AC3
// Description: the race's other riders within view are drawn in the world at their places on the route, each in its
// jersey colour; the ghost of a solo race is drawn translucent gold. `main`'s test hook reports what the renderer
// drew (the riders, their colours and opacity), so nothing reads a pixel (ADR 0021); the world draws at low, its
// cheapest tier, in software.
import type { Page } from '@playwright/test';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { worldRideMap } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import type { DrawnRider, WorldRideProbe } from './fixtures/world-ride-probe';

/** Rides `rpm` for a second, so the field moves off the start line. */
async function ride(page: Page, bluetooth: FakeBluetooth, rpm: number): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(16));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
  await page.clock.runFor(1000);
}

/** The riders the latest frame drew, once it has drawn any. */
async function drawn(page: Page, worldRide: WorldRideProbe): Promise<DrawnRider[]> {
  let riders: DrawnRider[] = [];
  await stepUntil(page, async () => {
    riders = (await worldRide.report())?.riders ?? [];
    expect(riders.length, 'race riders drawn').toBeGreaterThan(0);
  });
  return riders;
}

/** The design system's colour for `jersey`, `#rrggbb`, as the page resolves it. */
function jerseyColour(page: Page, jersey: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('i');
    probe.style.color = `var(--jersey-${name})`;
    document.body.append(probe);
    const [r, g, b] = getComputedStyle(probe).color.match(/\d+/g)!.map(Number);
    probe.remove();
    return `#${[r, g, b].map((c) => c!.toString(16).padStart(2, '0')).join('')}`;
  }, jersey);
}

test.describe('the race world', () => {
  test.slow();

  test('draws the bots in view in their jersey colours at their places (L2-064 AC3)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await webgl.withoutWebGpu();
    await worldRide.pin('low');
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=bots&pack=medium', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    await ride(page, bluetooth, 90);

    const riders = await drawn(page, worldRide);

    const bots = ['nova', 'rook', 'juno', 'atlas', 'kite', 'vale', 'moss', 'flint', 'echo'];
    for (const rider of riders) {
      expect(bots).toContain(rider.jersey);
      expect(rider.colour, rider.jersey).toBe(await jerseyColour(page, rider.jersey));
      expect(rider.opacity, rider.jersey).toBe(1);
    }
    // From furthest ahead, each at its place on the route.
    const metres = riders.map((rider) => rider.metres);
    expect(metres).toEqual([...metres].sort((a, b) => b - a));
    expect((await worldRide.report())!.pacers).toBe(0);
  });

  test('draws the ghost of a solo race translucent gold (L2-064 AC3)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await webgl.withoutWebGpu();
    await worldRide.pin('low');
    const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
      world: true,
      catalogue: [worldRideMap],
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    await ride(page, bluetooth, 90);

    const [ghost] = await drawn(page, worldRide);

    expect(ghost!.jersey).toBe('ghost');
    expect(ghost!.colour).toBe(await jerseyColour(page, 'ghost'));
    expect(ghost!.opacity).toBeLessThan(1);
    // The ghost rides alone: none of `main`'s simulated pacers ride a race.
    expect((await worldRide.report())!.pacers).toBe(0);
  });
});
