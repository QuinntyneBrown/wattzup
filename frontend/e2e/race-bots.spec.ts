// Acceptance test
// Traces to: L2-060 AC1, AC2, AC5; L2-059 AC1, AC5; L2-067 AC1
// Description: a bots race runs nine bots around the pack strength: the board lists the ten riders by place with each
// bot's gap to the rider, the rider's row current, and the power panel reads the rider's place with the gaps to the
// riders either side.
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

const BOTS = ['Nova', 'Rook', 'Juno', 'Atlas', 'Kite', 'Vale', 'Moss', 'Flint', 'Echo'].map(
  (name) => `Pacer ${name}`,
);

test(
  'nine bots ride away from a rider who stays still, and the board ranks the ten (L2-060, L2-059 AC1, L2-067 AC1)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );

    await expect(race.board).toBeVisible();
    await expect(race.boardTitle).toHaveText('Standings · 10 riders');
    await expect(race.boardRows).toHaveCount(10);
    await expect(race.board.getByRole('img', { name: 'Bot' })).toHaveCount(9);

    await page.clock.runFor(60_000);

    await expect(race.boardNames).toHaveText([...BOTS.map(() => /^Pacer /), 'You']);
    expect((await race.boardNames.allTextContents()).slice(0, 9).sort()).toEqual([...BOTS].sort());
    await expect(race.you).toHaveText(/^10You$/);
    await expect(race.place).toHaveText('10th');
    await expect(race.position).toHaveText('10th/ 10');
    await expect(race.gaps).toHaveCount(1);
    await expect(race.gaps).toHaveText(/^Ahead \+\d:\d\d$/);
    for (const gap of (await race.boardGaps.allTextContents()).slice(0, 9))
      expect(gap).toMatch(/^\+\d:\d\d$/);
  },
);

test('a rider at 661 W rides through the pack to first (L2-060 AC1, L2-059 AC1, AC5)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  // 120 rpm on level 32 is 661 W, 64.2 km/h; the medium pack rides about 42 km/h.
  for (let second = 0; second < 240; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await page.clock.runFor(4000);
  }

  await expect(race.you).toHaveText(/^1You$/);
  await expect(race.position).toHaveText('1st/ 10');
  await expect(race.gaps).toHaveText([/^Behind −\d:\d\d$/]);
  for (const gap of (await race.boardGaps.allTextContents()).slice(1))
    expect(gap).toMatch(/^−\d:\d\d$/);
});
