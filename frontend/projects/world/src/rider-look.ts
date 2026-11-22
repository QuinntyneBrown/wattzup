// What each rider looks like beyond their jersey (L2-166 AC30): a skin tone, a hair colour, a bike's colour, shoes,
// socks and a height, chosen from the rider's race number so the same rider looks the same every time and a pack is
// not one person twelve times.

/** A rider's look: colours as 0xRRGGBB, and their height against the middling rider's. */
export interface RiderLook {
  readonly skin: number;
  readonly hair: number;
  readonly frame: number;
  readonly shoe: number;
  readonly sock: number;
  readonly scale: number;
}

const SKINS = [0xc08a68, 0x8d5a3c, 0xe0b08e, 0x6a4230, 0xd39e78, 0xa9744f];
const HAIRS = [0x2b2019, 0x15120f, 0x6b4a2a, 0xb08a4e, 0x4a2c1a];
const FRAMES = [0x16181d, 0xd8dade, 0x7a1f22, 0x1f3f6e, 0x1e5a44, 0x2a2c31, 0xc8a23a];
const SHOES = [0xe9e9e4, 0x17181b, 0xd23a2e, 0xe9e9e4];
const SOCKS = [0xf2f2ee, 0xf2f2ee, 0x16171a];
const SCALES = [1, 0.96, 1.04, 0.98, 1.06, 0.94, 1.02];

/** The look of the rider wearing race `number`. */
export function riderLook(number: number): RiderLook {
  const n = Math.abs(Math.trunc(number));
  // Each list is stepped through at its own pace, so the lists do not fall into step with one another.
  const pick = <T>(list: readonly T[], pace: number, offset: number): T =>
    list[(n * pace + offset) % list.length]!;
  return {
    skin: pick(SKINS, 1, 2),
    hair: pick(HAIRS, 2, 1),
    frame: pick(FRAMES, 3, 4),
    shoe: pick(SHOES, 1, 0),
    sock: pick(SOCKS, 1, 1),
    scale: pick(SCALES, 1, 3),
  };
}
