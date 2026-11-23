// Acceptance test
// Traces to: L2-169 AC1, AC4, AC5, AC6, AC7
// Description: Settings' Sound section offers Race announcer (off by default), Announcer voice
// (three presets, default Arcade hype), Announcer volume (0 to 100 % in steps of 5, default 85 %),
// and Announcer captions (on by default). Changes persist locally only, malformed storage falls
// back to recommended values, Reset to recommended restores defaults, and targets are >= 44 px.
import { storeSettings, storedSettings } from './fixtures/settings-storage';
import { expect, test } from './fixtures/test';
import { SettingsPage } from './pages/settings.page';

test('Sound offers Race announcer controls at recommended values and keeps changes locally (L2-169 AC1, AC4, AC7)', async ({
  page,
}) => {
  const settings = new SettingsPage(page);
  await settings.open('sound');

  await expect(settings.raceAnnouncer).toHaveAttribute('aria-checked', 'false');
  await expect(settings.raceAnnouncerText).toHaveText(
    'Play-by-play commentary for overtakes, climbs, ghost gaps and the final sprint. Runs on this device.',
  );
  await expect(settings.announcerVoice.getByRole('radio')).toHaveText([
    'Arcade hype',
    'Cycling commentator',
    'Calm coach',
  ]);
  await expect(settings.option(settings.announcerVoice, 'Arcade hype')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.announcerVolume).toHaveValue('85');
  await expect(settings.announcerVolume).toHaveAttribute('min', '0');
  await expect(settings.announcerVolume).toHaveAttribute('max', '100');
  await expect(settings.announcerVolume).toHaveAttribute('step', '5');
  await expect(settings.announcerVolumeValue).toHaveText('85 %');
  await expect(settings.announcerCaptions).toHaveAttribute('aria-checked', 'true');

  // Touch target >= 44 px on the slider, and keyboard activation on the switch (L2-169 AC7).
  const sliderBox = await settings.announcerVolume.boundingBox();
  expect(sliderBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  await settings.announcerCaptions.focus();
  await page.keyboard.press('Space');
  await expect(settings.announcerCaptions).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Space');
  await expect(settings.announcerCaptions).toHaveAttribute('aria-checked', 'true');

  // Change controls and verify local persistence across reload with zero backend requests.
  await settings.option(settings.announcerVoice, 'Calm coach').click();
  await settings.announcerVolume.fill('60');
  await settings.announcerCaptions.click();

  await expect(settings.announcerVolumeValue).toHaveText('60 %');
  await expect(settings.announcerCaptions).toHaveAttribute('aria-checked', 'false');

  const kept = (await storedSettings(page)) as Record<string, unknown>;
  expect(kept['announcerVoice']).toBe('coach');
  expect(kept['announcerVolume']).toBe(60);
  expect(kept['announcerCaptions']).toBe(false);

  await page.reload();
  await expect(settings.option(settings.announcerVoice, 'Calm coach')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.announcerVolume).toHaveValue('60');
  await expect(settings.announcerCaptions).toHaveAttribute('aria-checked', 'false');

  // Reset to recommended restores defaults (L2-169 AC6).
  await settings.reset.click();
  await expect(settings.raceAnnouncer).toHaveAttribute('aria-checked', 'false');
  await expect(settings.option(settings.announcerVoice, 'Arcade hype')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.announcerVolume).toHaveValue('85');
  await expect(settings.announcerCaptions).toHaveAttribute('aria-checked', 'true');
});

test('Malformed announcer settings fall back to recommended values (L2-169 AC5)', async ({
  page,
}) => {
  await storeSettings(
    page,
    JSON.stringify({
      raceAnnouncer: 'yes',
      announcerVoice: 'robot',
      announcerVolume: 73,
      announcerCaptions: 1,
    }),
  );
  const settings = new SettingsPage(page);
  await settings.open('sound');

  await expect(settings.raceAnnouncer).toHaveAttribute('aria-checked', 'false');
  await expect(settings.option(settings.announcerVoice, 'Arcade hype')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(settings.announcerVolume).toHaveValue('85');
  await expect(settings.announcerCaptions).toHaveAttribute('aria-checked', 'true');
});
