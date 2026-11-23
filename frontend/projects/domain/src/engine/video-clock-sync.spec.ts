import { VideoClockSync } from './video-clock-sync';

describe('VideoClockSync', () => {
  const sync = new VideoClockSync();

  // L2-088 AC2: the video seeks back to the ride clock plus the offset when it drifts more than 1.5 s either way.
  it.each([
    { video: 434.1, elapsed: 420, offset: 12, seek: 432 },
    { video: 433.5, elapsed: 420, offset: 12, seek: null },
    { video: 433.4, elapsed: 420, offset: 12, seek: null },
    { video: 432, elapsed: 420, offset: 12, seek: null },
    { video: 430.5, elapsed: 420, offset: 12, seek: null },
    { video: 430.4, elapsed: 420, offset: 12, seek: 432 },
    { video: 12, elapsed: 2.5, offset: 12, seek: 14.5 },
    { video: 0, elapsed: 0, offset: 0, seek: null },
  ])(
    'video $video s at $elapsed s with a $offset s offset seeks to $seek',
    ({ video, elapsed, offset, seek }) => {
      expect(sync.check(video, elapsed, offset)).toBe(seek);
    },
  );
});
