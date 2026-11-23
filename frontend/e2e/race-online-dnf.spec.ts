// Acceptance test
// Traces to: L2-124 AC1, AC2; L2-060 AC1
// Description: in a riders-online race, a rider the service marks DNF, having left or gone silent, shows on the board
// in last place, the row faint and "DNF" in place of the gap; the rider's own Leave tells the session at once, then
// goes to Race Setup.
import { openRace, someoneLeftBoard, raceStandings } from './fixtures/live-race';
import { RACE_SESSION } from './fixtures/race-lobby';
import { expect, test } from './fixtures/test';

test(
  'a rider the service marks DNF shows last on the board, "DNF" in place of the gap (L2-124 AC1, AC2)',
  { tag: '@critical' },
  async ({ page, hub, bluetooth }) => {
    const race = await openRace(page, hub, bluetooth, 4_500);

    await hub.send('RaceStandingsUpdated', raceStandings(someoneLeftBoard));
    await page.clock.runFor(1_000);

    await expect(race.boardNames.last()).toHaveText('MarcoVelo');
    await expect(race.boardGaps.last()).toHaveText('DNF');
    await expect(race.boardDnf).toHaveCount(1);
    await expect(race.boardDnf).toContainText('MarcoVelo');
    await expect(race.you).toHaveText(/^5You$/);
    await expect(race.gaps).toHaveText(['Ahead +0:02', 'Behind −0:01']);
  },
);

test('Leave tells the session the rider left, then goes to Race Setup (L2-124 AC1)', async ({
  page,
  hub,
  bluetooth,
}) => {
  const race = await openRace(page, hub, bluetooth, 4_500);

  await race.leave.click();
  await page.clock.resume();

  await expect(page).toHaveURL(/\/race\/old-town-criterium$/);
  expect(hub.invocations('LeaveRace')).toEqual([[RACE_SESSION]]);
});
