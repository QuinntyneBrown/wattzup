import { library } from "../../../frontend/e2e/fixtures/library";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassLibraryPage } from "../../../frontend/e2e/pages/class-library.page";
import { SignInPage } from "../../../frontend/e2e/pages/sign-in.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 22.1, Authenticate every request, in the running app. The slice changes the
 * backend only, so the film shows the two doors a visitor without a session may open: sign-in at 390, 768, 1024 and
 * 1440 px, and the public Class Library at 1440 px. The shared fixture answers the API, so no request leaves the
 * machine. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/22-1-authenticate-every-request`.
 */

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`sign-in at ${size}`, async ({ page }) => {
    await frame(page, size);
    const screen = new SignInPage(page);
    await screen.open();
    await expect(screen.heading).toBeVisible();
    await pictures(page);
    await shot(page, `sign-in-${size.toLowerCase()}`);
  });
}

test("the public Class Library at XL", async ({ page, api }) => {
  api.answer("GET", "/api/classes", library);
  await frame(page, "XL");
  const classes = new ClassLibraryPage(page);
  await classes.open();
  await expect(classes.cardTitles).toHaveCount(7);
  await pictures(page);
  await expect
    .poll(() => page.locator(".class-card img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)))
    .toBe(true);
  await shot(page, "library-xl");
});
