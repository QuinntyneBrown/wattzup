// Acceptance test
// Traces to: L2-131 AC1, AC2, AC3, AC4
// Description: the app's pages are served with the Content Security Policy and the headers of L2-131, as the API
// serves them (ADR 0026): scripts and styles from the app's origin and the YouTube player, frames only from
// youtube-nocookie, connections only to the app's origin and Google's Map Tiles API, nothing framing the app, no
// sniffing and the referrer cut to the origin elsewhere. The app runs under it: the shared fixture fails every spec on a
// refusal. A script or a connection to any other origin, such as a tracker's, is refused before it leaves the page.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';

test.describe('Content Security Policy', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test(
    'the app is served with its policy and headers, and runs under them (L2-131 AC1, AC4)',
    { tag: '@critical' },
    async ({ page }) => {
      const home = new HomePage(page);
      const served = page.waitForResponse((response) => response.request().isNavigationRequest());
      await home.open();
      const headers = (await served).headers();

      const policy = headers['content-security-policy'] ?? '';
      expect(policy).toContain("default-src 'self'");
      expect(policy).toContain("script-src 'self' https://www.youtube.com 'wasm-unsafe-eval'");
      expect(policy).toContain('frame-src https://www.youtube-nocookie.com');
      expect(policy).toContain("connect-src 'self' https://tile.googleapis.com blob:");
      expect(policy).toContain(
        "img-src 'self' https://i.ytimg.com https://tile.googleapis.com blob:",
      );
      expect(policy).toContain("font-src 'self'");
      expect(policy).toContain("frame-ancestors 'none'");
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      await expect(home.header.current()).toHaveText('Home');
    },
  );

  test('a script or a connection to another origin is refused before it leaves the page (L2-131 AC2, AC3)', async ({
    page,
    policy,
  }) => {
    const home = new HomePage(page);
    await home.open();
    await expect(home.header.current()).toHaveText('Home');

    const connected = await page.evaluate(async () => {
      const script = document.createElement('script');
      script.src = 'https://tracker.example.com/collect.js';
      const loaded = new Promise<string>((resolve) => {
        script.onload = () => resolve('loaded');
        script.onerror = () => resolve('refused');
      });
      document.head.append(script);
      const sent = await fetch('https://tracker.example.com/collect', { method: 'POST' }).then(
        () => 'sent',
        () => 'refused',
      );
      return { script: await loaded, fetch: sent };
    });

    expect(connected).toEqual({ script: 'refused', fetch: 'refused' });
    await expect
      .poll(() => policy.take().sort())
      .toEqual([
        'connect-src blocked https://tracker.example.com/collect',
        'script-src-elem blocked https://tracker.example.com/collect.js',
      ]);
  });
});
