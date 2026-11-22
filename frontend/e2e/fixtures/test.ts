import { test as base, expect } from '@playwright/test';
import { ApiFixture } from './api';
import { ContentSecurityPolicyFixture } from './content-security-policy';
import { FakeBluetooth } from './fake-bluetooth';
import { HubFixture } from './hub';
import { MapTilesFixture } from './map-tiles';
import { WakeLockFixture } from './wake-lock';
import { FakeWebGl } from './webgl';
import { WorldRideProbe } from './world-ride-probe';
import { YouTubeFixture } from './youtube';

interface Fixtures {
  /** The fake `navigator.bluetooth`; a spec offers a bike, reads the writes and pushes notifications. */
  bluetooth: FakeBluetooth;
  /** The backend's answers; a request no answer matches fails the spec. */
  api: ApiFixture;
  /** The ride hub, speaking SignalR's JSON protocol once the spec opens it. */
  hub: HubFixture;
  /** The YouTube IFrame API and the class covers, answered by a fake player and a local picture. */
  youtube: YouTubeFixture;
  /** Google's Map Tiles API: accepts or refuses the rider's key, and keeps every request the page sent. */
  mapTiles: MapTilesFixture;
  /** The Content Security Policy's refusals in the page; any the spec does not take fails it. */
  policy: ContentSecurityPolicyFixture;
  /** The fake Screen Wake Lock API: the locks the app took, and the tab hidden or shown. */
  wakeLock: WakeLockFixture;
  /** Takes WebGPU, or WebGPU and WebGL, away from the browser before the app loads. */
  webgl: FakeWebGl;
  /** `main`'s test-only hook into the world's renderer: pins its quality tier and reads what it draws. */
  worldRide: WorldRideProbe;
  guard: void;
}

/**
 * The shared fixture every spec imports (AGENTS.md, E2E; L2-148 AC1). It installs the fake Bluetooth stack and Screen Wake Lock API before
 * the app loads and answers backend and ride hub requests as the spec declares. It fails the spec on a page error, a request
 * off localhost (YouTube's player script and covers, and Google's Map Tiles API, excepted, which fakes answer), an unanswered backend or hub request, a Content Security Policy
 * refusal, or a Bluetooth call the spec did not expect.
 */
export const test = base.extend<Fixtures>({
  bluetooth: async ({ page }, use) => {
    await use(await FakeBluetooth.install(page));
  },
  api: async ({ page }, use) => {
    await use(await ApiFixture.install(page));
  },
  hub: async ({ page }, use) => {
    await use(await HubFixture.install(page));
  },
  youtube: async ({ page }, use) => {
    await use(await YouTubeFixture.install(page));
  },
  mapTiles: async ({ page }, use) => {
    await use(await MapTilesFixture.install(page));
  },
  policy: async ({ page }, use) => {
    await use(await ContentSecurityPolicyFixture.install(page));
  },
  webgl: async ({ page }, use) => {
    await use(new FakeWebGl(page));
  },
  worldRide: async ({ page }, use) => {
    await use(new WorldRideProbe(page));
  },
  wakeLock: [
    async ({ page }, use) => {
      await use(await WakeLockFixture.install(page));
    },
    { auto: true },
  ],
  guard: [
    async ({ page, bluetooth, api, hub, youtube, mapTiles, policy }, use) => {
      // Installed first, so this catch-all, registered after them, can hand their requests back.
      void youtube;
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
      await page.route(
        (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
        async (route) => {
          const url = new URL(route.request().url());
          if (YouTubeFixture.answers(url) || MapTilesFixture.answers(url)) return route.fallback();
          problems.push(`request off localhost: ${route.request().url()}`);
          await route.abort();
        },
      );
      await use();
      problems.push(...api.unanswered().map((request) => `unanswered request: ${request}`));
      problems.push(...hub.unanswered().map((request) => `unanswered hub request: ${request}`));
      problems.push(
        ...mapTiles.unanswered().map((request) => `unanswered tile request: ${request}`),
      );
      problems.push(...policy.untaken().map((refusal) => `policy refusal: ${refusal}`));
      problems.push(...bluetooth.unexpected().map((call) => `unexpected Bluetooth call: ${call}`));
      expect(
        problems,
        'unexpected page errors, requests, policy refusals or Bluetooth calls',
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
