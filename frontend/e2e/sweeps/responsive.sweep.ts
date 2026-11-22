// Responsive sweep
// Traces to: L2-139 AC1
// Description: every screen at each breakpoint from 320 to 2560 px (320, 640, 768, 1024, 1280 and 2560) does not
// scroll sideways. Run only when a person asks, with `npm run sweep:responsive`, never by verify, CI or an agent; the
// behaviour spec e2e/fit-every-width.spec.ts holds the narrowest and the widest.
import { screens } from '../fixtures/screens';
import { expect, test } from '../fixtures/test';
import { AppDocument } from '../pages/app-document';

for (const [screen, open] of Object.entries(screens)) {
  for (const width of [320, 640, 768, 1024, 1280, 2560]) {
    test(`${screen} at ${width} px`, async ({ page, bluetooth, api }) => {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 1000 });
      await expect(await open({ page, bluetooth, api })).toBeAttached();

      expect(await new AppDocument(page).scrollsSideways()).toBe(false);
    });
  }
}
