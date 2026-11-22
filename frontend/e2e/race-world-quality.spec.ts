// Acceptance test
// Traces to: L2-065 AC4, AC5
// Description: the race's world draws at one of four quality levels, each with its own techniques: Low is the drawn
// look (ink outlines and the flat sky gradient), which no level above draws. Ultra is WebGPU only: with WebGL 2 a world
// asked for at Ultra draws at High. No rider option picks a level until Settings (slice 20.2), so `main`'s test-only
// hook pins one and reports what the renderer draws; nothing reads a pixel (ADR 0021).
import { worldRideMap } from './fixtures/maps';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import type { Tier, WorldRideReport } from './fixtures/world-ride-probe';

test.describe('the race world quality levels', () => {
  test.slow();

  for (const [asked, drawn, drawnLook] of [
    ['low', 'low', true],
    ['medium', 'medium', false],
    ['ultra', 'high', false],
  ] as const satisfies readonly (readonly [Tier, Tier, boolean])[]) {
    test(`draws a world asked for at ${asked} with WebGL 2 at ${drawn} (L2-065 AC4)`, async ({
      page,
      bluetooth,
      api,
      webgl,
      worldRide,
    }) => {
      await webgl.withoutWebGpu();
      await worldRide.pin(asked);
      const race = await startRace(page, bluetooth, api, worldRideMap.id, 'mode=solo', {
        world: true,
        catalogue: [worldRideMap],
      });
      await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));

      const report = (await worldRide.report()) as WorldRideReport;

      expect(report.backend).toBe('webgl2');
      expect(report.tier).toBe(drawn);
      expect({ outlines: report.outlines, skyGradient: report.skyGradient }).toEqual({
        outlines: drawnLook,
        skyGradient: drawnLook,
      });
    });
  }
});
