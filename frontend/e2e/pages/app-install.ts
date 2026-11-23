import type { Locator, Page } from '@playwright/test';

/** One icon as the browser read it from the manifest. */
export interface ManifestIcon {
  readonly src: string;
  readonly sizes: string;
  readonly type: string;
  readonly purpose?: string;
}

/** The web app manifest as Chromium parsed it (L2-150 AC1). */
export interface AppManifest {
  readonly name: string;
  readonly short_name: string;
  readonly id: string;
  readonly start_url: string;
  readonly scope: string;
  readonly display: string;
  readonly theme_color: string;
  readonly background_color: string;
  readonly icons: readonly ManifestIcon[];
}

/**
 * What Chrome and Edge read to offer "Install Telo Ride" (L2-150 AC1, docs/detailed-designs/platform/install-the-app):
 * the page's theme colour, the manifest Chromium parsed, whether it finds the app installable, and the icons' sizes as
 * the page decodes them. Asked through the DevTools protocol, as the browser's own install check.
 */
export class AppInstall {
  /** `<meta name="theme-color">`, the colour of the window's title bar. */
  readonly themeColor: Locator;

  constructor(private readonly page: Page) {
    this.themeColor = page.locator('meta[name="theme-color"]');
  }

  /** Chromium's reasons the app cannot be installed; none when it can. */
  async installabilityErrors(): Promise<string[]> {
    const devtools = await this.page.context().newCDPSession(this.page);
    const { installabilityErrors } = (await devtools.send('Page.getInstallabilityErrors')) as {
      installabilityErrors: { errorId: string }[];
    };
    await devtools.detach();
    return installabilityErrors.map((error) => error.errorId);
  }

  /** The manifest Chromium read from the page's link, with its URL and any parse errors; empty when there is none. */
  async manifest(): Promise<{ url: string; errors: string[]; manifest: AppManifest }> {
    const devtools = await this.page.context().newCDPSession(this.page);
    const read = (await devtools.send('Page.getAppManifest')) as {
      url: string;
      errors: { message: string }[];
      data?: string;
    };
    await devtools.detach();
    return {
      url: read.url,
      errors: read.errors.map((error) => error.message),
      manifest: (read.data ? JSON.parse(read.data) : {}) as AppManifest,
    };
  }

  /** The decoded size of an image, "192x192", as the browser draws it. */
  iconSize(src: string): Promise<string> {
    return this.page.evaluate(
      (url) =>
        new Promise<string>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(`${image.naturalWidth}x${image.naturalHeight}`);
          image.onerror = () => reject(new Error(`${url} did not load as an image`));
          image.src = url;
        }),
      src,
    );
  }
}
