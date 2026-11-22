import { screens } from './fixtures/screens';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';

// Slice 24.1, Switch theme (L2-143). Telo Ride is dark unless the device asks for light, and each sees its theme from
// the first paint, before the app's scripts run, not dark first and light a moment later. Every text role reads at
// 4.5:1 on every surface in both themes (L2-141 AC5).
//
// Given a device that asks for dark (AC1) or light (AC2), when the app opens, then its first paint already has that
//   theme, the one the app settles on. Chromium reports a device with no preference as light, so no test can give the
//   app "no preference"; where the browser cannot tell at all, the app is dark.
// Given the light or the dark theme, when text of any role sits on any surface, then it contrasts at 4.5:1 or more.

const TEXT = [
  '--color-fg',
  '--color-muted',
  '--color-faint',
  '--color-volt-fg',
  '--color-gold-fg',
  '--color-rest-fg',
  '--color-heart-fg',
  '--color-warn-fg',
  '--color-ok-fg',
  '--color-info-fg',
  '--color-success-fg',
  '--color-danger-fg',
  '--color-warning-fg',
];
const SURFACES = ['--color-ink', '--color-panel', '--color-raised'];

for (const scheme of ['light', 'dark'] as const) {
  test(`A device that asks for ${scheme} gets the ${scheme} theme from the first paint (L2-143 AC2)`, async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    await page.emulateMedia({ colorScheme: scheme });
    const app = new AppDocument(page);
    const first = await app.firstPaint('/');
    await expect(app.root).toHaveAttribute('data-theme', scheme);
    expect(first).toBe(await app.background());
  });

  test(`In the ${scheme} theme every text role reads at 4.5:1 on every surface (L2-143 AC2, L2-141 AC5)`, async ({
    page,
    bluetooth,
    api,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await screens['Home']!({ page, bluetooth, api });
    const app = new AppDocument(page);
    await expect(app.root).toHaveAttribute('data-theme', scheme);
    expect(await app.lowContrast(TEXT, SURFACES, 4.5)).toEqual([]);
  });
}
