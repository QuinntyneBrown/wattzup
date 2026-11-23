// Acceptance test
// Traces to: L2-061 AC1, AC2, AC3; L2-063 AC2
// Description: the interval panel names the segment, its round of the plan's efforts, the time left as a timer, its
// progress and the next segment; each segment's level goes to the bike as it starts.
import { targetResistanceWrite } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

test(
  'one second into the first of eight efforts the interval panel reads “Work · 1 of 8 · 0:29” (L2-061, L2-063 AC2)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );
    await expect(race.intervalLabel).toHaveText('Warm-up');
    await expect(race.intervalNext).toHaveText('Next: Work · 0:30 at level 24');

    await page.clock.fastForward('05:01');
    await page.clock.runFor(100);

    expect(bluetooth.writes().map((write) => write.hex)).toContain(targetResistanceWrite(24));
    await expect(race.intervalLabel).toHaveText('Work');
    await expect(race.intervalRound).toHaveText('1 of 8');
    await expect(race.intervalLeft).toHaveText('0:29');
    await expect(race.intervalLeft).toHaveAccessibleName('29 seconds left in this effort');
    await expect(race.intervalFill).toHaveAttribute('width', /^0\.03/);
    await expect(race.intervalNext).toHaveText('Next: Recover · 3:00 at level 6');

    await page.clock.runFor(1000);
    await expect(race.intervalLeft).toHaveText('0:28');

    await page.clock.runFor(29_000);
    expect(
      bluetooth
        .writes()
        .map((write) => write.hex)
        .at(-1),
    ).toBe(targetResistanceWrite(6));
    await expect(race.intervalLabel).toHaveText('Recover');
    await expect(race.intervalRound).toHaveCount(0);
    await expect(race.intervalLeft).toHaveAccessibleName(
      '2 minutes 59 seconds left in this recovery',
    );
    await expect(race.intervalNext).toHaveText('Next: Work · 0:30 at level 24');
  },
);
