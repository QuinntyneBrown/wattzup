// Acceptance test
// Traces to: L2-099 AC1, AC2, AC3, AC5; L2-100 AC1
// Description: "Your ride" beside Custom workout's settings reads the plan's total, draws its resistance profile from
// 0:00 to the total and lists its facts: GCN 30-min HIIT with a 5:00 warm-up and 6:00 cool-down is 30:00 in 17 bars,
// "8 × 0:30 · 3:00 → 1:30 recover", 4:00 under load, Level 24, ~154 W and ~276 kcal; flat at level 12 for 30 min at
// 85 rpm reads "Level 12 throughout", Level 12, ~205 W and ~367 kcal, with no time under load. It follows every change
// at once.
//
// Given GCN 30-min HIIT, when Your ride shows, then it reads 30:00, its profile has 17 bars and its facts read as above,
// with Video "Off".
// Given a change, when the rider removes a round or adds a minute of warm-up, then the total and facts follow at once.
// Given flat resistance, when it is chosen, then the facts read as above with no time under load.
import { expect, test } from './fixtures/test';
import { CustomWorkoutPage } from './pages/custom-workout.page';

test('Your ride previews GCN 30-min HIIT: 30:00, its profile and its facts (L2-099 AC1, AC3, AC5, L2-100 AC1)', async ({
  page,
}) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();

  await expect(custom.previewTotal).toHaveText('30:00');
  await expect(custom.profileBars).toHaveCount(17);
  await expect(custom.axis).toHaveText(['0:00', '30:00']);
  await expect(custom.factNames).toHaveText([
    'Structure',
    'Time under load',
    'Video',
    'Peak resistance',
    'Expected avg power',
    'Expected energy',
  ]);
  await expect(custom.fact('Structure')).toHaveText('8 × 0:30 · 3:00 → 1:30 recover');
  await expect(custom.fact('Time under load')).toHaveText('4:00');
  await expect(custom.fact('Video')).toHaveText('Off');
  await expect(custom.fact('Peak resistance')).toHaveText('Level 24');
  await expect(custom.fact('Expected avg power')).toHaveText('~154 W');
  await expect(custom.fact('Expected energy')).toHaveText('~276 kcal');
});

test('Your ride follows every change at once (L2-095 AC6, L2-099 AC1)', async ({ page }) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();

  await custom.ladder('Remove round 1').click();
  await expect(custom.previewTotal).toHaveText('26:30');
  await expect(custom.profileBars).toHaveCount(15);
  await expect(custom.fact('Structure')).toHaveText('7 × 0:30 · 2:30 → 1:30 recover');
  await expect(custom.fact('Time under load')).toHaveText('3:30');

  await custom.more(custom.warmUp).click();
  await expect(custom.previewTotal).toHaveText('27:30');
  await expect(custom.axis.last()).toHaveText('27:30');

  await custom.workLevel.fill('30');
  await expect(custom.fact('Peak resistance')).toHaveText('Level 30');
});

test('Your ride previews flat resistance with no time under load (L2-099 AC2)', async ({
  page,
}) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();

  await custom.flat.click();

  await expect(custom.previewTotal).toHaveText('30:00');
  await expect(custom.profileBars).toHaveCount(1);
  await expect(custom.factNames).toHaveText([
    'Structure',
    'Video',
    'Peak resistance',
    'Expected avg power',
    'Expected energy',
  ]);
  await expect(custom.fact('Structure')).toHaveText('Level 12 throughout');
  await expect(custom.fact('Peak resistance')).toHaveText('Level 12');
  await expect(custom.fact('Expected avg power')).toHaveText('~205 W');
  await expect(custom.fact('Expected energy')).toHaveText('~367 kcal');
});
