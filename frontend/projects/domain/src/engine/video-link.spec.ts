// Unit test
// Traces to: L2-098 AC2, AC3, AC4
// Description: a YouTube link's id from its three forms, every other link refused; the offset read and written to a
// tenth, and held between 0 and 12 hours.
import { clampOffset, formatOffset, parseOffset, videoIdOf } from './video-link';

describe('video link', () => {
  it.each([
    ['https://www.youtube.com/watch?v=QUoToFsMNig', 'QUoToFsMNig'],
    ['youtube.com/watch?feature=share&v=QUoToFsMNig&t=12', 'QUoToFsMNig'],
    ['https://m.youtube.com/watch?v=QUoToFsMNig', 'QUoToFsMNig'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  https://youtu.be/dQw4w9WgXcQ  ', 'dQw4w9WgXcQ'],
  ])('reads the id of %s (L2-098 AC2)', (link, id) => {
    expect(videoIdOf(link)).toBe(id);
  });

  it.each([
    [''],
    ['https://vimeo.com/76979871'],
    ['https://www.youtube.com/watch?v=short'],
    ['https://www.youtube.com/watch?list=PL123'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQextra'],
    ['https://evil.example/?u=youtube.com/watch?v=dQw4w9WgXcQ'],
  ])('refuses %j (L2-098 AC2)', (link) => {
    expect(videoIdOf(link)).toBeNull();
  });

  it.each([
    [0, '0:00.0'],
    [12, '0:12.0'],
    [12.04, '0:12.0'],
    [62.5, '1:02.5'],
    [3723.5, '1:02:03.5'],
  ])('writes %d s as %s', (seconds, text) => {
    expect(formatOffset(seconds)).toBe(text);
  });

  it.each([
    ['0:12.0', 12],
    ['12.5', 12.5],
    ['1:02.5', 62.5],
    ['1:02:03.5', 3723.5],
    ['soon', null],
    ['1:75', null],
    ['13:00:00', null],
  ])('reads %s', (text, seconds) => {
    expect(parseOffset(text)).toBe(seconds);
  });

  it('holds the offset at 0 or above, to a tenth (L2-098 AC3, AC4)', () => {
    expect(clampOffset(-0.5)).toBe(0);
    expect(clampOffset(12.04)).toBe(12);
    expect(clampOffset(50_000)).toBe(43_200);
  });
});
