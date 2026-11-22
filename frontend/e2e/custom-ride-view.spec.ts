// Acceptance test
// Traces to: L2-103 AC1, AC3, AC4; L2-104 AC1; L2-098 AC6
// Description: the custom ride's main view and metrics. Without a video the main view is "Power vs. plan" alone: the
// rider's power against the plan's target blocks, its legend, its maximum and its label, over a time tick every 5:00.
// The metrics read heart rate, average power, speed, distance and energy from the seconds ridden.
//
// Given a ride without a video, when it opens, then the tab list "Main view" holds "Power vs. plan", selected, with the
// legend Actual, Work target and Recover, "600 W" at the top and ticks 0:00 to 30:00.
// Given 20 seconds at 72 rpm on level 6, when the trace and metrics show, then the label reads "Power against the plan:
// 107 watts now against a 143 watt target, 0:20 of 30:00 ridden" and the metrics read "—" bpm, 107 W, 27.0 km/h,
// 0.15 km and 2 kcal.
// Given flat resistance, when the trace shows, then its maximum is 300 W.
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startCustomRide } from './fixtures/custom-ride';
import { expect, test } from './fixtures/test';

test('without a video the main view is Power vs. plan, over a tick every 5:00 (L2-103 AC1, AC3, AC4, L2-098 AC6)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);

  await expect(ride.tabs).toHaveText(['Power vs. plan']);
  await expect(ride.chartTab).toHaveAttribute('aria-selected', 'true');
  await expect(ride.legend).toHaveText(['Actual', 'Work target', 'Recover']);
  await expect(ride.traceMax).toHaveText('600 W');
  await expect(ride.trace).toHaveAccessibleName(
    'Power against the plan: no power yet against a 143 watt target, 0:00 of 30:00 ridden',
  );
  await expect(ride.ticks).toHaveText([
    '0:00',
    '5:00',
    '10:00',
    '15:00',
    '20:00',
    '25:00',
    '30:00',
  ]);
});

test('the trace and the metrics follow the seconds ridden (L2-103 AC3, L2-104 AC1)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);

  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  // The bike reports its cadence each second; five seconds without it would blank power (L2-020 AC5).
  for (let second = 0; second < 20; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(72));
    await page.clock.runFor(1000);
  }

  await expect(ride.trace).toHaveAccessibleName(
    'Power against the plan: 107 watts now against a 143 watt target, 0:20 of 30:00 ridden',
  );
  await expect(ride.metricLabels).toHaveText([
    'Heart rate',
    'Avg power',
    'Speed',
    'Distance',
    'Energy',
  ]);
  await expect(ride.metricValues).toHaveText(['—bpm', '107W', '27.0km/h', '0.15km', '2kcal']);
});

test('flat resistance draws to 300 W (L2-103 AC3)', async ({ page, bluetooth }) => {
  const ride = await startCustomRide(page, bluetooth, {
    setUp: (custom) => custom.flat.click(),
    first: 12,
  });

  await expect(ride.traceMax).toHaveText('300 W');
  await expect(ride.legend).toHaveText(['Actual', 'Work target', 'Recover']);
});
