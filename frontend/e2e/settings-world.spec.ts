// Acceptance test
// Traces to: L2-159 AC1, AC2, AC3, AC6, L2-160 AC1, AC2, AC4, AC5, L2-161 AC1, AC2, AC4
// Description: Settings' World section names the graphics API in use and offers Quality as five cards, Auto first and
// chosen, Ultra needing WebGPU; Step down when frames drop, always on with Auto and the rider's to turn off with a
// fixed level; Frame rate; Resolution; and Graphics, which offers WebGL 2 where WebGPU is there. A browser that can't
// draw 3D gets a notice and every World control disabled, while the other sections still work. What the world does
// with them is in race-world-settings.spec.ts.
import { expect, test } from './fixtures/test';
import { SettingsPage } from './pages/settings.page';

const QUALITIES = [
  'Auto Recommended Starts at Low, the drawn look, or at the level this device’s check found, and steps down a level whenever frames drop, so the ride stays smooth.',
  'Ultra Needs WebGPU Volumetric clouds and fog, ray-traced reflections and global light. For a strong graphics card.',
  'High Reflections, motion blur, ambient occlusion and contact shadows.',
  'Medium Shadows, physically based materials, foliage and wind.',
  'Low The drawn look: toon shading and ink outlines. Lightest on battery and older laptops.',
];

test('the World section without WebGPU: Auto chosen, Ultra needs WebGPU, and every control at its default (L2-159 AC1, AC2, AC3, AC6) @critical', async ({
  page,
  webgl,
}) => {
  await webgl.withoutWebGpu();
  const settings = new SettingsPage(page);
  await settings.open();

  await expect(settings.graphicsApi).toHaveText('WebGL 2');
  await expect(settings.section('World')).toContainText(
    'How the 3D world is drawn in races and world classes. Smoothness comes first: power and the clock never wait for the picture.',
  );
  await expect(settings.qualities).toHaveCount(5);
  for (const [index, name] of QUALITIES.entries()) {
    await expect(settings.qualities.nth(index)).toHaveAccessibleName(name);
  }
  await expect(settings.quality('Auto')).toBeChecked();
  await expect(settings.quality('Ultra')).toBeDisabled();

  await expect(settings.stepDown).toHaveAttribute('aria-checked', 'true');
  await expect(settings.stepDown).toBeDisabled();
  await expect(settings.stepDownText).toHaveText(
    'Always on with Auto: four slow seconds in a row drop one level for the rest of the ride.',
  );
  await expect(settings.frameRate.getByRole('radio', { name: 'Match display' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.resolution).toHaveValue('100');
  await expect(settings.resolutionValue).toHaveText('100 %');
  await expect(settings.graphics.locator('option:checked')).toHaveText('Automatic · WebGL 2');
  await expect(
    settings.graphics.getByRole('option', { name: 'WebGPU · not available here' }),
  ).toBeDisabled();
  await expect(settings.graphicsHint).toHaveText(
    'This browser has no WebGPU, so worlds use WebGL 2 and go up to High.',
  );
});

test('a fixed level lets the rider turn step-down off, and the frame rate, resolution and graphics API are kept (L2-160 AC2, AC4, AC5, L2-161 AC1)', async ({
  page,
  webgl,
}) => {
  await webgl.withWebGpu();
  const settings = new SettingsPage(page);
  await settings.open();
  await expect(settings.graphicsApi).toHaveText('WebGPU');
  await expect(settings.quality('Ultra')).toBeEnabled();
  await expect(settings.graphics.locator('option:checked')).toHaveText('Automatic · WebGPU');
  await expect(settings.graphicsHint).toHaveText(
    'Choose WebGL 2 if the world flickers or won’t load. WebGL 2 goes up to High.',
  );

  await settings.quality('High').check();
  await expect(settings.stepDown).toBeEnabled();
  await expect(settings.stepDown).toHaveAttribute('aria-checked', 'true');
  await expect(settings.stepDownText).toHaveText(
    'Four slow seconds in a row drop one level for the rest of the ride. Turn it off to keep High even if the world stutters.',
  );
  await settings.stepDown.click();
  await expect(settings.stepDown).toHaveAttribute('aria-checked', 'false');

  // The frame rate by keyboard, as a radio group: an arrow moves the choice.
  await settings.frameRate.getByRole('radio', { name: 'Match display' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(settings.frameRate.getByRole('radio', { name: '30 fps' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.frameRate.getByRole('radio', { name: '30 fps' })).toBeFocused();

  await settings.resolution.focus();
  for (let step = 0; step < 10; step++) await page.keyboard.press('ArrowLeft');
  await expect(settings.resolution).toHaveValue('50');
  await expect(settings.resolutionValue).toHaveText('50 %');

  await settings.graphics.selectOption({ label: 'WebGL 2' });

  await page.reload();
  await expect(settings.quality('High')).toBeChecked();
  await expect(settings.stepDown).toHaveAttribute('aria-checked', 'false');
  await expect(settings.frameRate.getByRole('radio', { name: '30 fps' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.resolution).toHaveValue('50');
  await expect(settings.graphics.locator('option:checked')).toHaveText('WebGL 2');
});

test('a browser that can’t draw 3D gets a notice, every World control disabled, and the other sections still work (L2-161 AC4)', async ({
  page,
  webgl,
}) => {
  await webgl.disable();
  const settings = new SettingsPage(page);
  await settings.open();

  await expect(settings.graphicsApi).toHaveText('Panorama only');
  await expect(settings.noWorlds).toHaveText(
    'This browser can’t draw 3D worlds. Races and world classes use each map’s panorama. Turn on graphics acceleration in Chrome or Edge to bring the worlds back.',
  );
  for (const quality of await settings.qualities.all()) await expect(quality).toBeDisabled();
  await expect(settings.stepDown).toBeDisabled();
  await expect(settings.stepDownText).toHaveText(
    'Comes back when this browser can draw 3D worlds.',
  );
  for (const option of await settings.frameRate.getByRole('radio').all()) {
    await expect(option).toBeDisabled();
  }
  await expect(settings.resolution).toBeDisabled();
  await expect(settings.graphics).toBeDisabled();
  await expect(settings.graphics.locator('option:checked')).toHaveText('Not available');

  await settings.keepAwake.click();
  await expect(settings.keepAwake).toHaveAttribute('aria-checked', 'false');
});
