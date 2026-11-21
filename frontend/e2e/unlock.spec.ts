// Acceptance Test
// Traces to: L2-002 (criteria 5 to 8), L2-004 (criterion 2), L2-005 (criterion 5)
// Description: A newer Echelon bike stays locked until Wattzup answers its challenge. The fake bike
// sends the challenge of the protocol reference's worked example; its response is
// `F0 E0 00 00 02 00 00 D2`.
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';

const CHALLENGE = 'F0 E0 12 34 56 78 09 ED';
const RESPONSE = 'F0E00000020000D2';
const START_DATA = 'F0B00101A2';
const WORKOUT_DATA = 'F0 D1 09 00 05 00 00 00 00 00 5F 00 1F';

test('answers the challenge, then starts the data stream 500 ms later, and shows live data', async ({
  page,
  bluetooth,
}) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  await bluetooth.notify(CHALLENGE);
  await expect.poll(async () => (await bluetooth.writes()).map((w) => w.args)).toContain(RESPONSE);
  await expect
    .poll(async () => {
      const writes = await bluetooth.writes();
      const answered = writes.findIndex((w) => w.args === RESPONSE);
      return writes.slice(answered + 1).some((w) => w.args === START_DATA);
    })
    .toBe(true);
  const writes = await bluetooth.writes();
  const answered = writes.find((w) => w.args === RESPONSE)!;
  expect(answered.name).toBe('writeWithResponse');
  const started = writes.slice(writes.indexOf(answered) + 1).find((w) => w.args === START_DATA)!;
  expect(started.at - answered.at).toBeGreaterThanOrEqual(499);

  await bluetooth.notify(WORKOUT_DATA);
  await expect(ride.cadenceValue).toHaveText('95');
  // Past the 2.5 s the bike has to confirm in.
  await page.waitForTimeout(3000);
  await expect(ride.statusState).toHaveText('Connected');
  await expect(ride.unlockBanner).toHaveCount(0);
});

test("a bike that stays locked shows Couldn't unlock the bike, then retries", async ({
  page,
  bluetooth,
}) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  await bluetooth.notify(CHALLENGE);
  await expect(ride.unlockBanner).toBeVisible({ timeout: 5000 });
  await expect(ride.statusState).toHaveText('Error');
  await expect(ride.unlockBanner.getByRole('button', { name: 'Open diagnostics' })).toBeVisible();
  // L2-004 criterion 2: the retry starts 3 s later, without the chooser.
  await expect(ride.statusState).toHaveText('Connected', { timeout: 6000 });
  await expect(ride.unlockBanner).toHaveCount(0);
  expect(await bluetooth.count('requestDevice')).toBe(1);
});

test('a malformed challenge is not answered, and the bike stays connected', async ({
  page,
  bluetooth,
}) => {
  const ride = new RidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');
  // A divisor of 0.
  await bluetooth.notify('F0 E0 12 34 56 78 00 E4');
  await page.waitForTimeout(3000);
  expect((await bluetooth.writes()).filter((w) => String(w.args).startsWith('F0E0'))).toEqual([]);
  await expect(ride.statusState).toHaveText('Connected');
  await expect(ride.unlockBanner).toHaveCount(0);
});
