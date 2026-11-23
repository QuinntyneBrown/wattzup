# video-record

Saves a video's screenshots: runs the folder's `shots.ts` in Chromium against the running app and
writes PNGs at double density into the folder's `shots/`. Standard: `docs/videos/README.md`,
"Screenshots".

```
node tools/video-record/record.mjs docs/videos/S-s-slice-name
```

It is not a test and not a sweep. It has its own Playwright config (`playwright.config.ts` here,
matching only `shots.ts` in the given folder), compares nothing, and is not run by `npm run e2e` or
CI. The app on `:4310` is reused when it is running and started with `ng serve` otherwise. It
imports the shared fixture of `frontend/e2e/fixtures/test.ts`, as every spec does, which fails on
a page error or a request off this machine; no backend and no bike are involved.

## Writing `shots.ts`

```ts
import { expect, test } from '../../../frontend/e2e/fixtures/test';
import { NotFoundPage } from '../../../frontend/e2e/pages/not-found.page';
import { detail, frame, shot } from '../../../tools/video-record/shots';

test('not found', async ({ page }) => {
  await frame(page, 'XL'); // 1440×900, dark
  const notFound = new NotFoundPage(page);
  await notFound.open('/no-such-screen');
  await expect(notFound.heading).toHaveText('This page doesn’t exist.');
  await shot(page, 'not-found-xl'); // shots/not-found-xl.png
  await detail(notFound.backHome, 'back-home', 20); // a close-up
});
```

| Helper | What it does |
|--------|--------------|
| `frame(page, size, theme = 'dark')` | Sets the window (`'XS'` 390×780, `'M'` 768×1024, `'L'` 1024×768, `'XL'` 1440×900) and the device's colour scheme, with reduced motion. Call it before opening a screen. |
| `shot(page, name)` | Saves the window as `shots/<name>.png`, once the fonts have settled, with animations disabled and the caret hidden. |
| `detail(locator, name, pad = 16)` | Saves one region with `pad` CSS pixels of air around it: the close-up of a scene. |
| `detailAll(locators, name, pad = 16)` | The same for the smallest region holding several. |
| `bringToTop(locator, offset = 96)` | Scrolls a region to the top of the window before a shot. |
| `traceSamples(segments, upTo)` | A seeded power history that follows a plan's segments. |
| `pictures(page)` | Waits until every picture on the page has arrived. |
| `SIZES`, `shotsDir` | The four windows, and where the pictures go. |

Selectors stay in the page objects of `frontend/e2e/pages/`; `shots.ts` names regions, as a spec
does.
