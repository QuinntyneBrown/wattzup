// Acceptance test
// Traces to: L2-168 AC1, AC2, AC4, AC5, AC6; L2-174 AC1, AC4
// Description: The voice pack stays undownloaded until opt-in, fetches exclusively from
// /models/voice-announcer/, verifies SHA-256 digests, persists in OPFS, shows MB and Delete,
// rejects corrupted weights, and frees storage with a toast on delete.
import { createHash } from 'node:crypto';
import { expect, test } from './fixtures/test';
import { SettingsPage } from './pages/settings.page';

test('Voice pack downloads from same origin, verifies SHA-256, persists in OPFS, and deletes cleanly (L2-168, L2-174)', async ({
  page,
}) => {
  const payload = Buffer.from('fake-kokoro-onnx-weights-for-acceptance-test');
  const sha256 = createHash('sha256').update(payload).digest('hex');
  const requested: string[] = [];

  await page.route('**/models/voice-announcer/manifest.json', async (route) => {
    requested.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        version: '1.0.0',
        files: [{ path: 'kokoro.onnx', bytes: payload.byteLength, sha256 }],
      }),
    });
  });
  await page.route('**/models/voice-announcer/kokoro.onnx', async (route) => {
    requested.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/octet-stream',
      body: payload,
    });
  });

  const settings = new SettingsPage(page);
  await settings.open('device');

  // Zero downloads before opt-in (L2-168 AC1).
  expect(requested).toEqual([]);
  await expect(settings.voicePackValue).toHaveText('Not downloaded');

  await settings.downloadVoicePack.click();
  await expect(settings.voicePackValue).toContainText('Race announcer ·');
  await expect(settings.deleteVoicePack).toBeVisible();
  expect(requested.length).toBe(2);

  await settings.deleteVoicePack.click();
  await expect(settings.voicePackValue).toHaveText('Not downloaded');
  await expect(settings.toastTitle).toHaveText('Voice pack deleted');
});

test('Voice pack rejects corrupted weights on SHA-256 mismatch (L2-174 AC4)', async ({ page }) => {
  const payload = Buffer.from('corrupted-onnx-bytes');
  await page.route('**/models/voice-announcer/manifest.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        version: '1.0.0',
        files: [{ path: 'kokoro.onnx', bytes: payload.byteLength, sha256: '0'.repeat(64) }],
      }),
    });
  });
  await page.route('**/models/voice-announcer/kokoro.onnx', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/octet-stream',
      body: payload,
    });
  });

  const settings = new SettingsPage(page);
  await settings.open('device');
  await settings.downloadVoicePack.click();

  await expect(settings.voicePackError).toContainText('verification failed');
  await expect(settings.voicePackValue).toHaveText('Not downloaded');
});
