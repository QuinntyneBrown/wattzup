// Unit test
// Traces to: L2-174 AC2
import { sanitizeCalloutLabel } from './callout-sanitizer';

describe('sanitizeCalloutLabel (L2-174 AC2)', () => {
  it.each([
    ['plain rider name', 'MarcoVelo', 'MarcoVelo'],
    ['HTML and script tags', '<img src=x onerror=alert(1)>Marco', 'Marco'],
    ['SSML markup', '<break time="5s"/>Fast<phoneme ph="x">Rider</phoneme>', 'Fast Rider'],
    ['control characters', 'A\u0000B\u0007\n\tC', 'A B C'],
    [
      'long label clamped to 24 chars',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234',
      'ABCDEFGHIJKLMNOPQRSTUVWX',
    ],
    ['empty or null falls back', '   ', 'Rider'],
  ])('sanitizes %s', (_, raw, expected) => {
    expect(sanitizeCalloutLabel(raw)).toBe(expected);
  });
});
