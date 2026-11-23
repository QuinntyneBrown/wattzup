import type { BrowserContext, Locator, Page } from '@playwright/test';

/**
 * A new version of Telo Ride (L2-150 AC2, docs/mocks/pages/home/update-ready.html): the toast that offers it, and the
 * deploy and the service worker's check that bring it. A new version is the build's own `ngsw.json` with a change the
 * worker sees (`appData`), so every file it lists is the one already cached: the worker installs it at once.
 */
export class AppUpdate {
  readonly toast: Locator;
  readonly title: Locator;
  readonly text: Locator;
  readonly reload: Locator;
  readonly dismiss: Locator;

  constructor(private readonly page: Page) {
    this.toast = page.locator('.toast', { hasText: 'A new version is ready' });
    this.title = this.toast.locator('.toast__title');
    this.text = this.toast.locator('.toast__text');
    this.reload = this.toast.getByRole('button', { name: 'Reload' });
    this.dismiss = this.toast.getByRole('button', { name: 'Dismiss' });
  }

  /**
   * Deploys a new version: from now on the host answers the worker's `ngsw.json` with the next build's. The page starts
   * listening for the worker's word first, since the worker may find the version on its own check before `checkNow`.
   */
  async deploy(context: BrowserContext, version = 'next'): Promise<void> {
    await this.page.evaluate(() => {
      const page = window as { wzVersionReady?: Promise<void> };
      page.wzVersionReady = new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          'message',
          (event: MessageEvent<{ type?: string }>) => {
            if (event.data?.type === 'VERSION_READY') resolve();
          },
        ),
      );
    });
    await context.route(
      (url) => url.pathname === '/ngsw.json',
      async (route) => {
        const answer = await route.fetch();
        const manifest = (await answer.json()) as Record<string, unknown>;
        await route.fulfill({ response: answer, json: { ...manifest, appData: { version } } });
      },
    );
  }

  /**
   * Has the worker look for a new version now, as it does when the app opens, and resolves once it has told the page,
   * since `deploy`, that the new version is ready (`VERSION_READY`). The worker tells only pages it served, so the page
   * must have been loaded through it.
   */
  async checkNow(): Promise<void> {
    await this.page.evaluate(async () => {
      const ready = (window as { wzVersionReady?: Promise<void> }).wzVersionReady;
      const worker = navigator.serviceWorker.controller;
      if (!ready) throw new Error('deploy a new version before checking for it');
      if (!worker) throw new Error('no service worker controls the page');
      worker.postMessage({ action: 'CHECK_FOR_UPDATES', nonce: 27_2 });
      await ready;
    });
  }

  /** Marks the loaded page, so `reloaded` can tell whether it has been loaded again since. */
  async markPage(): Promise<void> {
    await this.page.evaluate(() => ((window as { wzMarked?: boolean }).wzMarked = true));
  }

  /** Whether the page has been loaded again since `markPage`. */
  reloaded(): Promise<boolean> {
    return this.page.evaluate(() => (window as { wzMarked?: boolean }).wzMarked !== true);
  }
}
