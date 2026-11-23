import type { Locator, Page } from "@playwright/test";
import { hiitCardio } from "../../../frontend/e2e/fixtures/classes";
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
  workoutFrame,
} from "../../../frontend/e2e/fixtures/echelon";
import type { ApiFixture } from "../../../frontend/e2e/fixtures/api";
import type { FakeBluetooth } from "../../../frontend/e2e/fixtures/fake-bluetooth";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassRidePage } from "../../../frontend/e2e/pages/class-ride.page";
import {
  type Size,
  detail as detailOf,
  detailAll,
  frame,
  shot as shotOf,
} from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 5.2, Class ride screen, in the running app: 30 Minute HIIT Cardio ridden solo
 * at 390, 768, 1024 and 1440 px, at 0:00 on the warm-up and at 7:00 in a recovery with the bike streaming, and
 * close-ups of the header, the segment card, Power on and under target, and the stepper. The shared fixture's fake
 * Bluetooth stands in for the bike and its API fixture answers the class; Playwright's clock moves the ride, as the
 * acceptance spec does. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/05-2-class-ride-screen`.
 */

const START = new Date("2026-11-21T18:00:00Z").getTime();

/**
 * A screenshot settles on two animation frames, which the paused clock holds back, so the clock steps one 16 ms frame
 * for each 50 ms of real time until it is taken: a few frames a shot, so the ride's clock and countdown do not move.
 */
async function still(page: Page, take: () => Promise<void>): Promise<void> {
  let done = false;
  const taken = take().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await taken;
}
const shot = (page: Page, name: string) => still(page, () => shotOf(page, name));
const detail = (region: Locator, name: string, pad: number) =>
  still(region.page(), () => detailOf(region, name, pad));

/** Opens the class ride with the remembered bike, and starts it at a known time on a paused clock. */
async function ride(page: Page, bluetooth: FakeBluetooth, api: ApiFixture): Promise<ClassRidePage> {
  let answer: (body: unknown) => void = () => undefined;
  const held = new Promise((resolve) => (answer = resolve));
  api.answer("GET", `/api/classes/${hiitCardio.id}`, async () => ({ body: await held }));
  await page.clock.install({ time: START });
  await bluetooth.remember(echelonBike);
  const classRide = new ClassRidePage(page);
  await classRide.open(hiitCardio.id);
  await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
  await page.clock.pauseAt(START + 60_000);
  answer(hiitCardio);
  await expect.poll(() => bluetooth.writes().map((write) => write.hex)).toContain(targetResistanceWrite(8));
  await page.clock.runFor(100);
  return classRide;
}

/** Moves the ride to 7:00 with the bike reporting 73 rpm at resistance 6. */
async function atSeven(page: Page, bluetooth: FakeBluetooth, classRide: ClassRidePage): Promise<void> {
  await page.clock.fastForward("07:00");
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(73));
  await page.clock.runFor(100);
  await expect(classRide.powerHint).toHaveText("On target");
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Class ride at 7:00 at ${size}`, async ({ page, bluetooth, api }) => {
    await frame(page, size);
    const classRide = await ride(page, bluetooth, api);
    await atSeven(page, bluetooth, classRide);
    await shot(page, `class-${size.toLowerCase()}`);
    if (size === "XL") {
      await still(page, () => detailAll([page.locator(".class-header .lockup"), classRide.name], "name", 10));
      await detail(page.locator(".class-ride__clock"), "clock", 10);
      await detail(page.locator("wz-class-segment"), "segment", 12);
      await detail(page.locator("wz-class-stat").first(), "power", 12);
      await detail(page.locator("wz-class-stat").nth(1), "cadence", 12);
      await detail(page.locator("wz-class-resist"), "stepper", 12);
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(60));
      await page.clock.runFor(100);
      await expect(classRide.powerHint).toHaveText("-18 W");
      await detail(page.locator("wz-class-stat").first(), "power-under", 12);
    }
    await expect(classRide.clock).toHaveText("7:00 / 30:00");
  });
}

test("Class ride at 0:00 on the warm-up", async ({ page, bluetooth, api }) => {
  await frame(page, "XL");
  const classRide = await ride(page, bluetooth, api);
  await expect(classRide.segmentLeft).toHaveText("5:00");
  await shot(page, "start-xl");
  await detail(page.locator("wz-class-segment"), "warmup", 12);
  await detail(page.locator("wz-class-resist"), "stepper-unknown", 12);
  await expect(classRide.clock).toHaveText("0:00 / 30:00");
});
