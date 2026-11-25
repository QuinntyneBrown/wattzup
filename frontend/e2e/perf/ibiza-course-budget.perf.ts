import { newRiderProgress } from '../fixtures/api';
import { ibizaCourseMap } from '../fixtures/course';
import { echelonBike } from '../fixtures/echelon';
import { expect, test } from '../fixtures/test';
import { RacePage } from '../pages/race.page';

test.use({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

test('Ibiza fits its geometry budget along the strip and at the finish', async ({
  page,
  api,
  bluetooth,
  worldRide,
}) => {
  api.answer('GET', '/api/maps', [ibizaCourseMap]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [ibizaCourseMap.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(ibizaCourseMap.id, 'mode=bots');
  await expect(race.backend).toBeVisible();
  const rows = await page.evaluate(async () => {
    type Frame = { drawCalls: number; triangles: number; metres: number };
    const probe = (window as unknown as { __wzWorldRide: { from: number; course: Frame } })
      .__wzWorldRide;
    const results = [];
    for (const metres of [...Array.from({ length: 15 }, (_, index) => 550 * index), 8433]) {
      probe.from = metres;
      for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);
      const frame = probe.course;
      results.push({ metres: frame.metres, triangles: frame.triangles, calls: frame.drawCalls });
    }
    return results;
  });
  console.log(JSON.stringify({ budget: rows }));
  for (const row of rows) {
    expect(row.calls, 'draw calls at ' + row.metres).toBeLessThanOrEqual(140);
    expect(row.triangles, 'triangles at ' + row.metres).toBeLessThanOrEqual(120000);
  }
  expect(rows.at(-1)!.metres).toBeGreaterThan(8430);
});
