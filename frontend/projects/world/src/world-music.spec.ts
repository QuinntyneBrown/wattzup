import type { WorkoutStatus } from '@telo/api';
import { musicPlays, worldTrack } from './world-music';

describe('worldTrack (L2-128 AC2)', () => {
  it("names the world's own file under music/", () => {
    expect(worldTrack('oldtown')).toBe('music/oldtown.ogg');
    expect(worldTrack('jouvert')).toBe('music/jouvert.ogg');
  });
});

describe('musicPlays (L2-128 AC2, AC3)', () => {
  const rows: readonly (readonly [WorkoutStatus | null, boolean, boolean])[] = [
    ['running', true, true],
    ['running', false, false],
    ['paused', true, false],
    ['paused: bike disconnected', true, false],
    ['ended', true, false],
    ['ended: bike shut off', true, false],
    ['stopped', true, false],
    ['waiting for bike', true, false],
    [null, true, false],
  ];
  for (const [status, on, plays] of rows) {
    it(`${plays ? 'plays' : 'is silent'} with ${status ?? 'no ride'} and music ${on ? 'on' : 'off'}`, () => {
      expect(musicPlays(status, on)).toBe(plays);
    });
  }
});
