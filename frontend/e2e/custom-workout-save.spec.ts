// Acceptance test
// Traces to: L2-099 AC4; L2-094 AC3
// Description: Start ride saves the workout to the rider's account with the plan it expands to, and Custom workout
// opens on the rider's last saved workout, or on GCN 30-min HIIT with none.
//
// Given GCN 30-min HIIT, when the rider presses Start ride, then the workout and its 17 segments are saved.
// Given a saved flat workout at level 15 for 45 minutes, when Custom workout opens, then it opens on it.
// Given none saved, when Custom workout opens, then it opens on GCN 30-min HIIT.
import { startCustomRide } from './fixtures/custom-ride';
import { expect, test } from './fixtures/test';
import { CustomWorkoutPage } from './pages/custom-workout.page';

const PATH = '/api/riders/me/custom-workout';

test('Start ride saves the workout and its plan to the account (L2-099 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  await startCustomRide(page, bluetooth);

  await expect.poll(() => api.sentBodies('PUT', PATH)).toHaveLength(1);
  const [saved] = api.sentBodies('PUT', PATH) as {
    draft: { mode: string; preset: string };
    segments: unknown[];
  }[];
  expect(saved!.draft).toMatchObject({
    mode: 'hiit',
    preset: 'gcn30',
    workLevel: 24,
    recoverLevel: 6,
  });
  expect(saved!.segments).toHaveLength(17);
  expect(saved!.segments[0]).toEqual({ kind: 'warm-up', duration: 300, level: 8, cadenceAim: 80 });
});

test('Custom workout opens on the rider’s last saved workout (L2-094 AC3)', async ({
  page,
  api,
}) => {
  api.answer('GET', PATH, {
    draft: {
      mode: 'flat',
      preset: 'gcn30',
      edited: false,
      rounds: [{ effort: 30, recovery: 180 }],
      workLevel: 24,
      recoverLevel: 6,
      warmUp: 300,
      coolDown: 360,
      flat: { level: 15, minutes: 45, cadence: 90 },
      video: { on: false, link: 'https://www.youtube.com/watch?v=QUoToFsMNig', offset: 0 },
    },
  });
  const custom = new CustomWorkoutPage(page);

  await custom.open();

  await expect(custom.flat).toBeChecked();
  await expect(custom.flatLevelValue).toContainText('15');
  await expect(custom.stepperValue(custom.duration)).toHaveText('45 min');
  await expect(custom.stepperValue(custom.cadenceGoal)).toHaveText('90 rpm');
});

test('with none saved Custom workout opens on GCN 30-min HIIT (L2-094 AC3)', async ({
  page,
  api,
}) => {
  const custom = new CustomWorkoutPage(page);

  await custom.open();

  await expect(custom.hiit).toBeChecked();
  await expect(custom.rounds).toHaveCount(8);
  expect(api.requests()).toContain(`GET ${PATH}`);
});
