import { expect, test } from './fixtures/test';
import { AppInstall } from './pages/app-install';
import { HomePage } from './pages/home.page';

// Slice 27.1, Installable app (L2-150 AC1).
//
// Given Chrome or Edge, when the rider opens Telo Ride, then the browser finds it installable: the page links a web app
//   manifest named "Telo Ride", opening at / in its own window (standalone), in the dark theme colour #0a0b0d, with
//   192 px and 512 px icons and a maskable one; and the page's theme colour is the same dark ink.
// Given the manifest's icons, when the browser loads them, then each is a PNG of the size it declares.

const INK = '#0a0b0d';

test('Chrome finds Telo Ride installable from its manifest, with its name, icons and dark theme colour (L2-150 AC1) @critical', async ({
  page,
}) => {
  await new HomePage(page).open();
  const install = new AppInstall(page);

  const { url, errors, manifest } = await install.manifest();
  expect(new URL(url).pathname).toBe('/manifest.webmanifest');
  expect(errors).toEqual([]);
  expect(manifest).toMatchObject({
    name: 'Telo Ride',
    short_name: 'Telo Ride',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: INK,
    background_color: INK,
  });
  expect(manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose ?? 'any'}`)).toEqual([
    '192x192 any',
    '512x512 any',
    '512x512 maskable',
  ]);
  await expect(install.themeColor).toHaveAttribute('content', INK);
  expect(await install.installabilityErrors()).toEqual([]);
});

test('each icon in the manifest is a PNG of the size it declares (L2-150 AC1)', async ({
  page,
}) => {
  await new HomePage(page).open();
  const install = new AppInstall(page);
  const { manifest } = await install.manifest();

  for (const icon of manifest.icons) {
    expect(icon.type).toBe('image/png');
    expect(await install.iconSize(icon.src)).toBe(icon.sizes);
  }
});
