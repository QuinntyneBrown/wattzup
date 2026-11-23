import type { Page } from "@playwright/test";
import type { ApiFixture } from "../../../frontend/e2e/fixtures/api";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { SignInCodePage } from "../../../frontend/e2e/pages/sign-in-code.page";
import { SignInPage } from "../../../frontend/e2e/pages/sign-in.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 9.1, Request an email code, in the running app: sign-in at 390, 768, 1024 and
 * 1440 px, and at 1440 px sending, an address that is not one, too many codes, the code screen counting down and a new
 * code sent. The backend's answers come from the shared fixture's `api`, so no request leaves the machine. Not a test
 * and not a sweep: only `node tools/video-record/record.mjs docs/videos/09-1-request-an-email-code`.
 */

const EMAIL = "ada.rider@example.com";

async function signIn(page: Page, size: Size): Promise<SignInPage> {
  await frame(page, size);
  const screen = new SignInPage(page);
  await screen.open();
  await expect(screen.heading).toBeVisible();
  await pictures(page);
  return screen;
}

const accept = (api: ApiFixture) => api.answer("POST", "/api/auth/code", () => ({ status: 202 }));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`sign-in at ${size}`, async ({ page }) => {
    await signIn(page, size);
    await shot(page, `sign-in-${size.toLowerCase()}`);
  });
}

test("sending at XL", async ({ page, api }) => {
  let release = (): void => undefined;
  const answer = new Promise<{ status: number }>((resolve) => (release = () => resolve({ status: 202 })));
  api.answer("POST", "/api/auth/code", () => answer);
  const screen = await signIn(page, "XL");
  await screen.ask(EMAIL);
  await expect(screen.send).toHaveText("Sending your code…");
  await shot(page, "sending-xl");
  release();
});

test("invalid at XL", async ({ page }) => {
  const screen = await signIn(page, "XL");
  await screen.ask("ada.rider@example");
  await expect(screen.emailError).toBeVisible();
  await shot(page, "invalid-xl");
});

test("too many codes at XL", async ({ page, api }) => {
  api.answer("POST", "/api/auth/code", () => ({
    status: 429,
    headers: { "Retry-After": "2501" },
    body: { status: 429, title: "This can’t be done right now.", code: "rate_limited" },
  }));
  const screen = await signIn(page, "XL");
  await screen.ask(EMAIL);
  await expect(screen.message).toBeVisible();
  await shot(page, "limited-xl");
});

test("the code screen at XL", async ({ page, api }) => {
  await page.clock.install();
  accept(api);
  const screen = await signIn(page, "XL");
  await screen.ask(EMAIL);
  const code = new SignInCodePage(page);
  await expect(code.email).toHaveText(EMAIL);
  await page.clock.runFor(2000);
  await expect(code.resend).toHaveText("Send a new code in 0:28");
  await shot(page, "code-xl");

  await page.clock.runFor(28_000);
  await code.resend.click();
  await expect(code.message).toBeVisible();
  await shot(page, "resent-xl");
});
