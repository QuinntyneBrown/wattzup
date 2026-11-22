import type { Page } from "@playwright/test";
import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import type { CustomRidePage } from "../../../frontend/e2e/pages/custom-ride.page";
import { CustomWorkoutPage } from "../../../frontend/e2e/pages/custom-workout.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 21.3, Ride a custom workout, in the running app, through the flows of
 * e2e/custom-ride*.spec.ts and e2e/custom-workout-save.spec.ts: the custom ride at 6:52 at 390, 768, 1024 and 1440 px;
 * its interval card, Power vs. plan and bike control close up; the ride with its video; flat resistance; and Start ride
 * off under a plan Telo Ride refuses. Only `node tools/video-record/record.mjs docs/videos/21-3-ride-a-custom-workout`.
 */

/** Rides to 6:52 on level 6, pedalling at 72 to 74 rpm for the last 22 seconds, so the trace has a line to draw. */
async function rideTo652(page: Page, bluetooth: FakeBluetooth, ride: CustomRidePage): Promise<void> {
  await page.clock.fastForward("05:30");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await page.clock.fastForward("01:00");
  for (let second = 0; second < 22; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(72 + (second % 3)));
    await page.clock.runFor(1000);
  }
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(72));
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveText("6:52 / 30:00");
  await capturable(page);
}

/**
 * Lets the clock run again: a capture waits two animation frames, which the paused clock never gives. The ride moves on
 * by the second or so the captures take.
 */
async function capturable(page: Page): Promise<void> {
  await page.clock.resume();
  await page.mouse.move(0, 0);
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the custom ride at 6:52 at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const ride = await startCustomRide(page, bluetooth);
    await rideTo652(page, bluetooth, ride);
    await shot(page, `ride-${size.toLowerCase()}`);
  });
}

test("the ride's parts close up", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await rideTo652(page, bluetooth, ride);
  await detail(page.locator(".ride-readouts"), "readouts");
  await detail(page.locator("wz-ride-view"), "trace");
  await ride.levels.nth(19).click();
  await page.mouse.move(0, 0);
  await detail(page.getByRole("complementary", { name: "Resistance" }), "control");
});

test("the ride with its video", async ({ page, bluetooth, youtube }) => {
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth, {
    setUp: async (custom) => {
      await custom.videoSwitch.click();
      await custom.offset.fill("0:12.0");
      await custom.offset.press("Tab");
    },
  });
  await expect.poll(async () => (await youtube.players()).filter((player) => !player.destroyed).length).toBe(1);
  await rideTo652(page, bluetooth, ride);
  await shot(page, "video");
});

test("flat resistance", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth, { setUp: (custom) => custom.flat.click(), first: 12 });
  await page.clock.fastForward("06:30");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(12));
  for (let second = 0; second < 22; second++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(85 + (second % 3)));
    await page.clock.runFor(1000);
  }
  await expect(ride.workout).toContainText("Flat · Level 12 · 30 min");
  await capturable(page);
  await shot(page, "flat");
});

test("Start ride off under a plan Telo Ride refuses", async ({ page }) => {
  await frame(page, "XL");
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  for (let n = 8; n > 1; n--) await custom.ladder(`Remove round ${n}`).click();
  for (let i = 0; i < 5; i++) await custom.ladder("Shorter effort 1").click();
  for (let i = 0; i < 5; i++) await custom.less(custom.warmUp).click();
  for (let i = 0; i < 6; i++) await custom.less(custom.coolDown).click();
  await expect(custom.startBlocked).toHaveText("The ride needs to last 1 to 180 minutes.");
  await page.mouse.move(0, 0);
  await detail(custom.preview, "refused");
});
