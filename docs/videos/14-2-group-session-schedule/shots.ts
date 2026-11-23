import type { Page } from "@playwright/test";
import {
  hiitCardio,
  hiitSession,
  hiitSessions,
  SESSIONS_NOW,
  sixRiders,
} from "../../../frontend/e2e/fixtures/classes";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { library } from "../../../frontend/e2e/fixtures/library";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassLibraryPage } from "../../../frontend/e2e/pages/class-library.page";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 14.2, Group session schedule, in the running app at 7:30 PM (UTC): Class Start
 * of 30 Minute HIIT Cardio offering its next group session at 7:39 with six riders, at 390, 768, 1024 and 1440 px; its
 * choice when that session is full and when it starts within the minute; and the Class Library with each open card's
 * chip. The shared fixture's API fixture answers the sessions as the backend would, its YouTube fixture the class video
 * and the covers; Playwright's clock sets the time. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/14-2-group-session-schedule`.
 */

const SESSIONS = `/api/classes/${hiitCardio.id}/sessions`;
const choice = (page: Page) => page.locator("wz-ride-choice");

async function openStart(page: Page, size: Size): Promise<ClassStartPage> {
  await frame(page, size);
  await page.clock.install({ time: SESSIONS_NOW });
  const start = new ClassStartPage(page);
  await start.open(hiitCardio.id);
  await expect(start.title).toHaveText("30 Minute HIIT Cardio");
  await page.evaluate(() => document.fonts.ready);
  await pictures(page);
  await page.mouse.move(0, 0);
  return start;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Class Start with the next group session at ${size}`, async ({ page, api, bluetooth }) => {
    api.answer("GET", "/api/classes", library);
    api.answer("GET", SESSIONS, hiitSessions);
    await bluetooth.remember(echelonBike);
    const start = await openStart(page, size);
    await expect(start.join).toHaveText("Join · starts in 9 min");
    await shot(page, `start-${size.toLowerCase()}`);
    if (size === "XL") await detail(choice(page), "group-choice", 16);
  });
}

test("a full session and one starting, at XL", async ({ page, api }) => {
  api.answer("GET", "/api/classes", library);
  let sessions = [hiitSession("2026-11-21T19:39:00Z", sixRiders, true), hiitSessions[1]];
  api.answer("GET", SESSIONS, () => ({ status: 200, body: sessions }));
  const start = await openStart(page, "XL");
  await expect(start.join).toHaveText("Join the next session");
  await detail(choice(page), "full-choice", 16);

  sessions = [hiitSession("2026-11-21T19:30:40Z", sixRiders), hiitSession("2026-11-21T19:45:40Z", [])];
  await page.clock.runFor(30_000);
  await expect(start.join).toHaveText("Join now · starting");
  await page.mouse.move(0, 0);
  await detail(choice(page), "soon-choice", 16);
});

test("the Class Library's group chips at XL", async ({ page, api }) => {
  api.answer("GET", "/api/classes", library);
  const next = (classId: string, startsAt: string, seatsTaken: number) => ({
    classId,
    sessionId: `${classId}@x`,
    startsAt,
    seatsTaken,
    capacity: 10,
  });
  api.answer("GET", "/api/classes/sessions", [
    next("power-intervals-20", "2026-11-21T19:36:00Z", 5),
    next("threshold-builder-20", "2026-11-21T19:32:00Z", 6),
    next("hiit-cardio-30", "2026-11-21T19:39:00Z", 6),
    next("tempo-paceline-30", "2026-11-21T19:39:00Z", 3),
  ]);
  await frame(page, "XL");
  await page.clock.install({ time: SESSIONS_NOW });
  const classes = new ClassLibraryPage(page);
  await classes.open();
  await expect(classes.card("30 Minute HIIT Cardio").group).toHaveText("Group in 9 min · 6/10");
  await page.evaluate(() => document.fonts.ready);
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "library-xl");
  await detail(classes.card("20 Minute Power Intervals").root, "chip", 16);
});
