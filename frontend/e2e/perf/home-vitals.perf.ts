// Performance check, run only when a person asks (`npm run perf`)
// Traces to: L2-136 AC2
// Description: Home, loaded cold on a mid-range phone over a 4G profile, reaches Largest Contentful Paint within 2.5 s
// and answers each interaction within 200 ms. The phone is Lighthouse's mobile profile: a 412 × 823 screen at 1.75×,
// its CPU 4 times slower than this machine's, and slow 4G at 150 ms round trips, 1.6 Mbit/s down and 750 kbit/s up.
// The page reports its own Web Vitals through PerformanceObserver; the DevTools Protocol throttles it.
import { echelonBike } from '../fixtures/echelon';
import { expect, test } from '../fixtures/test';
import { HomePage } from '../pages/home.page';

const LCP_MS = 2_500;
const INP_MS = 200;

test.use({
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 1.75,
  isMobile: true,
  hasTouch: true,
});

interface Vitals {
  lcp: number;
  inp: number;
}

test('Home, cold on a mid-range phone over 4G, paints within 2.5 s and answers within 200 ms (L2-136 AC2)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  await page.addInitScript(() => {
    const vitals: Vitals = { lcp: 0, inp: 0 };
    (window as unknown as { vitals: Vitals }).vitals = vitals;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) vitals.lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEventTiming[])
        if (entry.interactionId) vitals.inp = Math.max(vitals.inp, entry.duration);
    }).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit);
  });
  const devtools = await page.context().newCDPSession(page);
  await devtools.send('Network.enable');
  await devtools.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1_600 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const home = new HomePage(page);
  await home.open();
  await expect(home.main).toBeAttached();
  await page.waitForLoadState('networkidle');
  // A rider's first interactions: the keyboard's first Tab, which reaches the skip link, then a tap on the page.
  await page.keyboard.press('Tab');
  await expect(home.skipLink).toBeFocused();
  await home.main.tap({ position: { x: 8, y: 8 } });

  const vitals = await page.evaluate(() => (window as unknown as { vitals: Vitals }).vitals);
  expect(
    vitals.lcp,
    `Largest Contentful Paint at ${Math.round(vitals.lcp)} ms`,
  ).toBeLessThanOrEqual(LCP_MS);
  expect(vitals.inp, `Interaction to Next Paint at ${Math.round(vitals.inp)} ms`).toBeLessThan(
    INP_MS,
  );
});
