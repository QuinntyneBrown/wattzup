// Acceptance test
// Traces to: L2-060 AC4; L2-059 AC4, AC5; L2-050 AC4; L2-067 AC2
// Description: a solo race is the rider against the ghost of their best on the map, which with no best yet rides the
// medium pace (190 W): the board reads "You vs your best" with the two rows, and the power panel reads "Ahead" or
// "Behind" with the ghost's gap as "Best".
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

test(
  'with no best the ghost rides the medium pace, and the rider chases it down (L2-060 AC4, L2-059 AC4, L2-050 AC4)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');

    await expect(race.boardTitle).toHaveText('You vs your best');
    await expect(race.boardRows).toHaveCount(2);
    await expect(race.board.getByRole('img', { name: 'Bot' })).toHaveCount(0);

    // A minute stopped: the ghost rides 353 m at 190 W, 88 s at the 4 m/s floor.
    await page.clock.runFor(60_000);
    await expect(race.boardNames).toHaveText(['Your best', 'You']);
    await expect(race.boardGaps).toHaveText(['+2:56', '']);
    await expect(race.you).toHaveText(/^2You$/);
    await expect(race.position).toHaveText('Behind');
    await expect(race.gaps).toHaveText(['Best +2:56']);

    // 661 W closes 3 m/s on the ghost; in three minutes the rider is past it.
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
    for (let second = 0; second < 180; second += 4) {
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
      await page.clock.runFor(4000);
    }
    await expect(race.boardNames).toHaveText(['You', 'Your best']);
    await expect(race.position).toHaveText('Ahead');
    await expect(race.gaps).toHaveText([/^Best −0:\d\d$/]);
  },
);
