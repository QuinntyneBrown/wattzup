// The shared fixture (L2-088, L2-097): navigator.bluetooth is always the fake, an error in the page
// fails the spec, and the YouTube fake fails any request off localhost.
import { test as base, expect } from '@playwright/test';
import { FakeAudio } from './fake-audio';
import { FakeYouTube } from './fake-youtube';
import { FakeBluetooth } from './fake-bluetooth';
import { FakeWebGl } from './fake-webgl';
import { WorldRideProbe } from './world-ride-probe';

export { expect };

export const test = base.extend<{
  /** The page's AudioContexts and the sounds they start, seen but not faked (L2-129). */
  audio: FakeAudio;
  bluetooth: FakeBluetooth;
  pageErrors: string[];
  youtube: FakeYouTube;
  webgl: FakeWebGl;
  /** The test-only World Ride hook, for the performance sweep only (#672). */
  worldRide: WorldRideProbe;
}>({
  // Automatic: an uncaught error in the page (a rejected call, a thrown handler) fails the spec.
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await use(errors);
      expect(errors, 'errors in the page').toEqual([]);
    },
    { auto: true },
  ],
  audio: async ({ page }, use) => {
    const audio = new FakeAudio(page);
    await audio.install();
    await use(audio);
  },
  // Automatic: navigator.bluetooth is always the fake; no spec reaches a real adapter or bike.
  bluetooth: [
    async ({ page }, use) => {
      const bluetooth = new FakeBluetooth(page);
      await bluetooth.install();
      await use(bluetooth);
    },
    { auto: true },
  ],
  youtube: [
    async ({ page }, use) => {
      const youtube = new FakeYouTube(page);
      await youtube.install();
      await use(youtube);
      expect(youtube.offsite, 'requests off localhost').toEqual([]);
    },
    { auto: true },
  ],
  webgl: async ({ page }, use) => {
    await use(new FakeWebGl(page));
  },
  worldRide: async ({ page }, use) => {
    await use(new WorldRideProbe(page));
  },
});
