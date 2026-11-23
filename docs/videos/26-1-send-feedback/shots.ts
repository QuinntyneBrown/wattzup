import type { Request } from "@playwright/test";
import type { ApiReply } from "../../../frontend/e2e/fixtures/api";
import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { FeedbackDialog } from "../../../frontend/e2e/pages/feedback.dialog";
import { type Size, SIZES, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 26.1, Send feedback, in the running app, through the page objects of
 * e2e/feedback.spec.ts: the custom ride at 1440 px with Send feedback open under Feedback, close-ups of the form as a
 * bug, as kudos, with the ride's context open, sending and sent, the bottom sheet on a phone, and the dialog at 390,
 * 768, 1024 and 1440 px. The fake Bluetooth stack and the API fixture stand in, so no real bike or backend ran. Not a
 * test: only `node tools/video-record/record.mjs docs/videos/26-1-send-feedback`.
 */

const NOTE = "Resistance stayed at L8 after the sprint ended — it only dropped when I tapped minus.";

function held(): { handler: (request: Request) => Promise<ApiReply>; release: () => void } {
  let release = (): void => undefined;
  const answer = new Promise<ApiReply>((resolve) => (release = () => resolve({ status: 201, body: { id: "fb-1" } })));
  return { handler: () => answer, release };
}

test("Send feedback on the custom ride at 1440 px", async ({ page, bluetooth, api }) => {
  const answer = held();
  api.answer("POST", "/api/feedback", answer.handler);
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await page.clock.runFor(6000);
  await ride.feedback.click();
  const feedback = new FeedbackDialog(page);
  await feedback.message.fill(NOTE);
  await page.mouse.move(0, 0);
  await shot(page, "ride-feedback-xl");
  await detail(feedback.panel, "form-bug", 0);

  await feedback.kind("Kudos").click();
  await feedback.message.fill("The resistance landing on the beat makes the HIIT videos so much better.");
  await page.mouse.move(0, 0);
  await detail(feedback.panel, "form-kudos", 0);

  await feedback.kind("Bug").click();
  await feedback.message.fill(NOTE);
  await feedback.contextToggle.click();
  await expect(feedback.contextTerms).toHaveCount(14);
  await page.mouse.move(0, 0);
  await detail(feedback.panel, "form-context", 0);
  await feedback.contextToggle.click();

  await feedback.send.click();
  await expect(feedback.send).toHaveText("Sending…");
  await page.mouse.move(0, 0);
  await detail(feedback.panel, "form-sending", 0);
  answer.release();
  await expect(feedback.thanks).toBeVisible();
  await detail(feedback.panel, "form-sent", 0);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Send feedback at ${SIZES[size].width} px`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const ride = await startCustomRide(page, bluetooth);
    await page.clock.resume();
    await page.clock.runFor(6000);
    await ride.feedback.click();
    const feedback = new FeedbackDialog(page);
    await feedback.message.fill(NOTE);
    await page.mouse.move(0, 0);
    await shot(page, `feedback-${size.toLowerCase()}`);
  });
}
