// Unit Test
// Traces to: L2-002 (criteria 5 and 8), L2-005 (criterion 5)
// Description: The unlock response computed from a newer bike's challenge, one case per row of the
// protocol reference (docs/protocol/echelon-ble-frames.md, `E0`).
import { isUnlockAck, isUnlockChallenge, unlockResponse } from './echelon-unlock';

const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
const bytes = (text: string): Uint8Array =>
  Uint8Array.from(text.split(' ').map((b) => parseInt(b, 16)));

describe('unlockResponse', () => {
  it.each([
    // a = 5612, b = 3478, c = 9: the worked example.
    ['F0 E0 12 34 56 78 09 ED', 'F0 E0 00 00 02 00 00 D2'],
    // a stops at the letter: "5A12" reads 5; c = 25, auth = 15.
    ['F0 E0 12 34 5A 78 25 00', 'F0 E0 00 00 15 00 00 E5'],
    // The largest divisor, 99: auth = 92, written as packed BCD.
    ['F0 E0 12 34 56 78 99 00', 'F0 E0 00 00 92 00 00 62'],
    // Leading zeros: a = 301, b = 204, c = 7, auth = 0.
    ['F0 E0 01 02 03 04 07 00', 'F0 E0 00 00 00 00 00 D0'],
  ])('answers %s with %s', (challenge, response) => {
    const answer = unlockResponse(bytes(challenge));
    expect(answer.ok).toBe(true);
    if (answer.ok) expect(hex(answer.response)).toBe(response);
  });

  it.each([
    ['too short', 'F0 E0 12 34 56 78 09', 'length'],
    ['too long', 'F0 E0 12 34 56 78 09 ED 00', 'length'],
    ['not a challenge', 'F0 D1 12 34 56 78 09 ED', 'prefix'],
    ['no marker', 'F1 E0 12 34 56 78 09 ED', 'prefix'],
    ['a has no digits', 'F0 E0 12 34 A6 78 09 ED', 'no-digits'],
    ['b has no digits', 'F0 E0 12 B4 56 78 09 ED', 'no-digits'],
    ['c has no digits', 'F0 E0 12 34 56 78 A9 ED', 'no-digits'],
    ['c is 0', 'F0 E0 12 34 56 78 00 ED', 'zero-divisor'],
    ['c reads 0 before a letter', 'F0 E0 12 34 56 78 0A ED', 'zero-divisor'],
  ])('refuses a challenge that is %s', (_, challenge, reason) => {
    expect(unlockResponse(bytes(challenge))).toEqual({ ok: false, reason });
  });
});

describe('unlock frames', () => {
  it.each([
    ['F0 E0 12 34 56 78 09 ED', true],
    ['F0 E0 12', true],
    ['F0 D1 12 34 56 78 09 ED', false],
    ['E0 F0', false],
  ])('%s is a challenge: %s', (frame, expected) => {
    expect(isUnlockChallenge(bytes(frame))).toBe(expected);
  });

  it.each([
    ['F0 A5 01 0E A4', true],
    ['F0 A5 01 0F A5', false],
    ['F0 D2 01 0E A4', false],
  ])('%s is the acknowledgement: %s', (frame, expected) => {
    expect(isUnlockAck(bytes(frame))).toBe(expected);
  });
});
