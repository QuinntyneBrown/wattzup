import type { Page, Route } from '@playwright/test';

/** Where the app keeps the rider's Google Maps Platform key (L2-066 AC3). */
const KEY_STORAGE = 'telo-ride.maps-key';

/**
 * Google's Map Tiles API as the page sees it (L2-066), with no request leaving the machine (AGENTS.md, E2E): a spec
 * says whether Google accepts the key, with a root tileset holding no tiles yet, or refuses it with 403. Every request
 * the page sends anywhere is kept, so a spec can show the key reached Google's tiles and nothing else.
 */
export class MapTilesFixture {
  private reply: 'accept' | 'refuse' | null = null;
  private readonly tiles: URL[] = [];
  private readonly missed: string[] = [];
  private readonly sent: { url: string; body: string; headers: string }[] = [];

  private constructor(private readonly page: Page) {}

  /** Whether a request is to Google's Map Tiles API, which this fixture answers. */
  static answers(url: URL): boolean {
    return url.hostname === 'tile.googleapis.com';
  }

  static async install(page: Page): Promise<MapTilesFixture> {
    const fixture = new MapTilesFixture(page);
    page.on('request', (request) =>
      fixture.sent.push({
        url: request.url(),
        body: request.postData() ?? '',
        headers: JSON.stringify(request.headers()),
      }),
    );
    await page.route(
      (url) => MapTilesFixture.answers(url),
      (route) => fixture.answer(route),
    );
    return fixture;
  }

  /** Google accepts the key: the root tileset, with its session, and no tiles in it. */
  accept(): void {
    this.reply = 'accept';
  }

  /** Google refuses the key with 403. */
  refuse(): void {
    this.reply = 'refuse';
  }

  /** Stores `key` on this device before the app loads, as an earlier race would have (L2-066 AC8). */
  async remember(key: string): Promise<void> {
    await this.page.addInitScript(([storage, value]) => localStorage.setItem(storage, value), [
      KEY_STORAGE,
      key,
    ] as const);
  }

  /** The key the app stored on this device, or null. */
  storedKey(): Promise<string | null> {
    return this.page.evaluate((storage) => localStorage.getItem(storage), KEY_STORAGE);
  }

  /** The requests the page sent to Google's Map Tiles API, oldest first. */
  requests(): URL[] {
    return [...this.tiles];
  }

  /** Every request to anywhere but Google's tiles whose address, body or headers carry `key`. */
  leaks(key: string): string[] {
    return this.sent
      .filter(({ url }) => !MapTilesFixture.answers(new URL(url)))
      .filter(({ url, body, headers }) => [url, body, headers].some((part) => part.includes(key)))
      .map(({ url }) => url);
  }

  /** The tile requests sent before the spec said how Google answers. */
  unanswered(): string[] {
    return [...this.missed];
  }

  private async answer(route: Route): Promise<void> {
    const url = new URL(route.request().url());
    this.tiles.push(url);
    const headers = { 'access-control-allow-origin': '*' };
    if (this.reply === 'refuse') {
      await route.fulfill({
        status: 403,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 403,
            message: 'API key not valid. Please pass a valid API key.',
            status: 'PERMISSION_DENIED',
          },
        }),
      });
    } else if (this.reply === 'accept' && url.pathname === '/v1/3dtiles/root.json') {
      await route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({
          asset: { version: '1.0' },
          geometricError: 10_000,
          root: {
            boundingVolume: { box: [0, 0, 0, 100, 0, 0, 0, 100, 0, 0, 0, 100] },
            geometricError: 0,
            refine: 'REPLACE',
            children: [],
          },
        }),
      });
    } else {
      this.missed.push(url.href);
      await route.abort();
    }
  }
}
