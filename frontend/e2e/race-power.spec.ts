// Acceptance test
// Traces to: L2-059 AC1, AC2, AC3
// Description: the power panel reads the rider's place in the field, power against the segment's target with the
// delta or "On target", and cadence, heart rate ("—" with none) and the virtual speed from power.
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

test(
  'at 87 rpm in an effort at level 24 the power panel reads “371 W”, “Target 418 W” and “-47 W” (L2-059)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    const race = await startRace(
      page,
      bluetooth,
      api,
      'old-town-criterium',
      'mode=bots&pack=medium',
    );
    await page.clock.fastForward('05:01');
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(24));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(87));
    await page.clock.runFor(100);

    await expect(race.power).toBeVisible();
    // Stopped through the warm-up, the rider is last of the ten (race-bots.spec.ts ranks the field).
    await expect(race.position).toHaveText('10th/ 10');
    await expect(race.watts).toHaveText('371W');
    await expect(race.target).toHaveText('Target 418 W');
    await expect(race.delta).toHaveText('-47 W');
    await expect(race.delta).toHaveClass(/race-power__delta--under/);
    await expect(race.statLabels).toHaveText(['Cadence', 'Heart', 'Speed']);
    await expect(race.stats).toHaveText(['87rpm', '—bpm', '52.9km/h']);

    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(95));
    await page.clock.runFor(100);
    await expect(race.watts).toHaveText('406W');
    await expect(race.delta).toHaveText('On target');
    await expect(race.delta).toHaveClass(/race-power__delta--on/);
  },
);
