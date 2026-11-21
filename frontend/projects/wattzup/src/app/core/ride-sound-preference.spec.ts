import { TestBed } from '@angular/core/testing';
import { RIDE_SOUND_VOLUME_KEY, RideSoundPreference } from './ride-sound-preference';

describe('RideSoundPreference (L2-129 AC3)', () => {
  beforeEach(() => localStorage.clear());

  it('is 60 % when no volume is kept', () => {
    expect(TestBed.inject(RideSoundPreference).volume()).toBe(60);
  });

  it('keeps a chosen volume', () => {
    TestBed.inject(RideSoundPreference).setVolume(35);
    expect(localStorage.getItem(RIDE_SOUND_VOLUME_KEY)).toBe('35');
  });

  it('reads a kept volume', () => {
    localStorage.setItem(RIDE_SOUND_VOLUME_KEY, '80');
    expect(TestBed.inject(RideSoundPreference).volume()).toBe(80);
  });

  it.each([
    [-10, 0],
    [0, 0],
    [42, 40],
    [43, 45],
    [100, 100],
    [130, 100],
  ])('holds %d as %d: 0 to 100 in steps of 5', (asked, kept) => {
    const sound = TestBed.inject(RideSoundPreference);
    sound.setVolume(asked);
    expect(sound.volume()).toBe(kept);
  });

  it.each(['loud', '', '250'])('reads a kept %j as 60 % or within range', (kept) => {
    localStorage.setItem(RIDE_SOUND_VOLUME_KEY, kept);
    const volume = TestBed.inject(RideSoundPreference).volume();
    expect(volume).toBe(kept === '250' ? 100 : 60);
  });
});
