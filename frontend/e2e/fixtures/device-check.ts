// The device check's trial length, shortened for a spec (L2-162 AC2). A real trial rides about 30 seconds of the test
// world at each level; a spec steps its frames one at a time under the paused clock, so a trial of a few seconds says
// the same at a fraction of the frames.
import type { Page } from '@playwright/test';

/** Call before the page loads: each trial of "Check this device" rides `seconds` instead of 30. */
export async function shortTrials(page: Page, seconds: number): Promise<void> {
  await page.addInitScript((trialSeconds) => {
    (window as unknown as { __wzDeviceCheck: unknown }).__wzDeviceCheck = { trialSeconds };
  }, seconds);
}
