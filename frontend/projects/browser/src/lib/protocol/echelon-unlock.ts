// The unlock handshake of newer Echelon firmware (L2-002 criteria 5 to 8). The rule is
// re-implemented from the handshake documented in qdomyos-zwift (`echelonunlock.cpp`, which credits
// Christian Emerson with finding it); no code is copied. See docs/protocol/echelon-ble-frames.md.
import { checksum } from './echelon-commands';
import { MARKER } from './packet-decoder';

export const UNLOCK = 0xe0;
export const UNLOCK_ACK = Uint8Array.of(0xf0, 0xa5, 0x01, 0x0e, 0xa4);

export type UnlockRefusal = 'length' | 'prefix' | 'no-digits' | 'zero-divisor';
export type UnlockAnswer =
  { ok: true; response: Uint8Array } | { ok: false; reason: UnlockRefusal };

/** A frame of type `E0`: a challenge, well formed or not. */
export function isUnlockChallenge(frame: Uint8Array): boolean {
  return frame.length >= 2 && frame[0] === MARKER && frame[1] === UNLOCK;
}

/** `F0 A5 01 0E A4`, which confirms an unlock. */
export function isUnlockAck(frame: Uint8Array): boolean {
  return frame.length === UNLOCK_ACK.length && UNLOCK_ACK.every((b, i) => frame[i] === b);
}

/** The response to an 8-byte challenge `F0 E0 c2 c3 c4 c5 c6 cs`, or why there is none. */
export function unlockResponse(challenge: Uint8Array): UnlockAnswer {
  if (challenge.length !== 8) return { ok: false, reason: 'length' };
  if (!isUnlockChallenge(challenge)) return { ok: false, reason: 'prefix' };
  const a = leadingNumber(challenge[4], challenge[2]);
  const b = leadingNumber(challenge[3], challenge[5]);
  const c = leadingNumber(challenge[6]);
  if (a === null || b === null || c === null) return { ok: false, reason: 'no-digits' };
  if (c === 0) return { ok: false, reason: 'zero-divisor' };
  const auth = (a * b) % c;
  const body = [MARKER, UNLOCK, 0x00, 0x00, (Math.floor(auth / 10) << 4) | (auth % 10), 0x00, 0x00];
  return { ok: true, response: Uint8Array.of(...body, checksum(Uint8Array.from(body))) };
}

/** The bytes written as two-digit upper-case hex, read for the decimal digits they start with. */
function leadingNumber(...bytes: number[]): number | null {
  const text = bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  const digits = /^\d+/.exec(text);
  return digits ? Number(digits[0]) : null;
}
