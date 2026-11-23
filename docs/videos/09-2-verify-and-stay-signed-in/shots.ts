import type { Page } from "@playwright/test";
import type { ApiFixture } from "../../../frontend/e2e/fixtures/api";
import { catalogue } from "../../../frontend/e2e/fixtures/classes";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassLibraryPage } from "../../../frontend/e2e/pages/class-library.page";
import { SignInCodePage } from "../../../frontend/e2e/pages/sign-in-code.page";
import { SignInPage } from "../../../frontend/e2e/pages/sign-in.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 9.2, Verify and stay signed in, in the running app: a visitor sent from the
 * Class Library to sign-in, the code screen at 390, 768, 1024 and 1440 px, five digits typed, the three refusals, and
 * the Class Library again once the code is confirmed. The backend's answers come from the shared fixture's `api`, so
 * no request leaves the machine. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/09-2-verify-and-stay-signed-in`.
 */

const EMAIL = "ada.rider@example.com";
const confirmed = { riderId: "3f2b8c1e-0d6a-4c8e-9b1f-5a7d2e9c4b10", displayName: null, isNewAccount: true };

async function codeScreen(page: Page, api: ApiFixture, size: Size): Promise<SignInCodePage> {
  await page.clock.install();
  api.signedOut();
  api.answer("POST", "/api/auth/code", () => ({ status: 202 }));
  await frame(page, size);
  const signIn = new SignInPage(page);
  await signIn.open();
  await signIn.ask(EMAIL);
  const code = new SignInCodePage(page);
  await expect(code.email).toHaveText(EMAIL);
  await page.clock.runFor(2000);
  await pictures(page);
  return code;
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the code screen at ${size}`, async ({ page, api }) => {
    const code = await codeScreen(page, api, size);
    await code.code.pressSequentially("31415");
    await shot(page, `typing-${size.toLowerCase()}`);
  });
}

for (const refusal of ["code_mismatch", "code_expired", "code_locked"]) {
  test(`${refusal} at XL`, async ({ page, api }) => {
    const code = await codeScreen(page, api, "XL");
    api.answer("POST", "/api/auth/code/confirm", () => ({
      status: 400,
      body: { status: 400, title: "This can’t be done right now.", code: refusal },
    }));
    await code.code.pressSequentially("314159");
    await expect(code.codeError).toBeVisible();
    await shot(page, `${refusal.replace("code_", "")}-xl`);
  });
}

test("sent to sign-in, and back, at XL", async ({ page, api }) => {
  api.signedOut();
  api.answer("GET", "/api/classes", catalogue);
  api.answer("POST", "/api/auth/code", () => ({ status: 202 }));
  api.answer("POST", "/api/auth/code/confirm", () => {
    api.answer("GET", "/api/riders/me", { id: confirmed.riderId, displayName: null });
    return { status: 200, body: confirmed };
  });
  await frame(page, "XL");
  const library = new ClassLibraryPage(page);
  await library.open();
  const signIn = new SignInPage(page);
  await expect(signIn.heading).toBeVisible();
  await pictures(page);
  await shot(page, "sent-xl");

  await signIn.ask(EMAIL);
  await new SignInCodePage(page).code.pressSequentially("314159");
  await expect(library.heading).toBeVisible();
  await pictures(page);
  await shot(page, "back-xl");
});
