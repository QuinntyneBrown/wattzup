// Acceptance test
// Traces to: L2-170, L2-171, L2-172, L2-175
// Description: During a race with the race announcer enabled, live race events trigger sanitized
// play-by-play callouts through the FakeAiWorker fixture, show the responsive callout banner
// without horizontal overflow, and gracefully degrade on worker errors without harming the race.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { installFakeAiWorker } from './fixtures/fake-ai-worker';
import { startRace } from './fixtures/race';
import { storeSettings } from './fixtures/settings-storage';
import { expect, test } from './fixtures/test';
import { SettingsPage } from './pages/settings.page';

test('Race announcer degrades gracefully on worker error without interrupting the race (L2-175 AC2, AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  await installFakeAiWorker(page, { fail: true });
  await storeSettings(
    page,
    JSON.stringify({
      raceAnnouncer: true,
      announcerCaptions: true,
      announcerVoice: 'arcade',
      announcerVolume: 85,
    }),
  );

  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');
  await expect(race.heading).toHaveText('Race, Old Town Criterium');
  // Confirm zero horizontal scroll on desktop and no page errors despite simulated worker failure.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('An evicted voice pack leaves climb captions on and synthesis silent (L2-168 AC7)', async ({
  page,
  bluetooth,
  api,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'PressureObserver', { value: undefined });
  });
  await installFakeAiWorker(page);
  await storeSettings(page, JSON.stringify({ raceAnnouncer: true, announcerCaptions: true }));
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
  await expect(race.intervalLabel).toHaveText('Warm-up');

  await page.clock.fastForward('05:01');
  await page.clock.runFor(100);

  await expect(race.callout).toContainText('Target resistance up to 24');
  const spoken = await page.evaluate(
    () => (globalThis as Record<string, unknown>)['__teloAiWorkerCalls'],
  );
  expect(spoken).toEqual([]);
});

test(
  'A downloaded voice pack speaks a climb with the pack server unavailable (L2-168 AC4)',
  { tag: '@critical' },
  async ({ page, bluetooth, api }) => {
    // This small ONNX graph accepts the Kokoro inputs and returns a fixed three-sample waveform.
    const onnx = Buffer.from(
      'CAgSDHdhdHR6dXAtdGVzdDq/AQodCgdzYW1wbGVzEgh3YXZlZm9ybSIISWRlbnRpdHkSD3Rlc3Qtdm9pY2UtcGFjayodCAEIAxABQgdzYW1wbGVzSgwAAIA+AACAvgAAAD5aIwoJaW5wdXRfaWRzEhYKFAgHEhAKAggBCgoSCHNlcXVlbmNlWhgKBXN0eWxlEg8KDQgBEgkKAggBCgMIgAJaEwoFc3BlZWQSCgoICAESBAoCCAFiGgoId2F2ZWZvcm0SDgoMCAESCAoCCAEKAggDQgIQDQ==',
      'base64',
    );
    const wasm = await readFile('node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm');
    const payloads = new Map([
      ['kokoro.onnx', onnx],
      ['tokenizer.json', Buffer.from(JSON.stringify({ model: { vocab: { $: 0, a: 43 } } }))],
      ['af_bella.bin', Buffer.alloc(510 * 256 * 4)],
      ['ort-wasm-simd-threaded.wasm', wasm],
    ]);

    let available = true;
    const afterDownload: string[] = [];
    await page.context().route('**/models/voice-announcer/**', async (route) => {
      const name = new URL(route.request().url()).pathname.split('/').at(-1)!;
      if (!available) {
        afterDownload.push(name);
        await route.abort();
      } else if (name === 'manifest.json') {
        await route.fulfill({
          json: {
            version: 'test',
            files: [...payloads].map(([path, contents]) => ({
              path,
              bytes: contents.length,
              sha256: createHash('sha256').update(contents).digest('hex'),
            })),
          },
        });
      } else {
        const body = payloads.get(name);
        if (body) await route.fulfill({ body });
        else await route.abort();
      }
    });
    await page.addInitScript(() => {
      Object.defineProperty(globalThis, 'PressureObserver', { value: undefined });
      // The test observes PCM and does not depend on the browser's autoplay policy.
      AudioContext.prototype.resume = () => Promise.resolve();
      const samples: number[][] = [];
      const createBuffer = AudioContext.prototype.createBuffer;
      AudioContext.prototype.createBuffer = function (channels, length, rate) {
        const buffer = createBuffer.call(this, channels, length, rate);
        if (channels === 1 && length === 3 && rate === 24_000) {
          queueMicrotask(() => samples.push(Array.from(buffer.getChannelData(0))));
        }
        return buffer;
      };
      Object.assign(globalThis, { __announcerTestSamples: samples });
    });
    await storeSettings(page, JSON.stringify({ raceAnnouncer: true, announcerCaptions: true }));
    const settings = new SettingsPage(page);
    await settings.open('device');
    await settings.downloadVoicePack.click();
    await expect(settings.deleteVoicePack).toBeVisible();
    available = false;

    const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
    await page.clock.fastForward('05:01');
    await page.clock.runFor(100);
    await expect(race.callout).toContainText('Target resistance up to 24');
    await expect
      .poll(() =>
        page.evaluate(() => (globalThis as Record<string, unknown>)['__announcerTestSamples']),
      )
      .toEqual([[0.25, -0.25, 0.125]]);
    expect(afterDownload).toEqual([]);
  },
);
