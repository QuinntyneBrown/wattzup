import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { FeedbackDialog } from "../../../frontend/e2e/pages/feedback.dialog";
import { type Size, SIZES, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 26.2, Receive feedback, in the running app, through the page objects of
 * e2e/feedback.spec.ts: a bug report the backend accepts with 201 at 1440 px and its thanks, the failed state when the
 * backend refuses an 11th report in the hour with 429 rate_limited, and the thanks at 390, 768, 1024 and 1440 px. The
 * API fixture answers as the backend of this slice answers; no real backend ran. Not a test: only
 * `node tools/video-record/record.mjs docs/videos/26-2-receive-feedback`.
 */

const NOTE = "Resistance stayed at L8 after the sprint ended — it only dropped when I tapped minus.";

test("a bug report accepted with 201 at 1440 px", async ({ page, bluetooth, api }) => {
  api.answer("POST", "/api/feedback", () => ({ status: 201, body: { id: "0b6f0f43-2a1e-4c43-9a51-7d3c3f6a2b10" } }));
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await page.clock.runFor(6000);
  await ride.feedback.click();
  const feedback = new FeedbackDialog(page);
  await feedback.message.fill(NOTE);
  await page.mouse.move(0, 0);
  await detail(feedback.panel, "form-bug", 0);
  await feedback.send.click();
  await expect(feedback.thanks).toBeVisible();
  await page.mouse.move(0, 0);
  await shot(page, "ride-sent-xl");
  await detail(feedback.panel, "form-sent", 0);
});

test("an 11th report in the hour refused with 429", async ({ page, bluetooth, api }) => {
  api.answer("POST", "/api/feedback", () => ({
    status: 429,
    headers: { "Retry-After": "2700" },
    body: { status: 429, title: "Too much feedback sent this hour.", code: "rate_limited" },
  }));
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await ride.feedback.click();
  const feedback = new FeedbackDialog(page);
  await feedback.kind("Improvement").click();
  await feedback.message.fill("Let me save a custom ride so I don’t rebuild it every week.");
  await feedback.send.click();
  await expect(feedback.error).toBeVisible();
  await page.mouse.move(0, 0);
  await detail(feedback.panel, "form-limited", 0);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the thanks at ${SIZES[size].width} px`, async ({ page, bluetooth, api }) => {
    api.answer("POST", "/api/feedback", () => ({ status: 201, body: { id: "0b6f0f43-2a1e-4c43-9a51-7d3c3f6a2b10" } }));
    await frame(page, size);
    const ride = await startCustomRide(page, bluetooth);
    await page.clock.resume();
    await page.clock.runFor(6000);
    await ride.feedback.click();
    const feedback = new FeedbackDialog(page);
    await feedback.message.fill(NOTE);
    await feedback.send.click();
    await expect(feedback.thanks).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, `sent-${size.toLowerCase()}`);
  });
}
