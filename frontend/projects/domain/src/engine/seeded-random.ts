/** The FNV-1a hash of a string, as an unsigned 32-bit integer: the seed of a race's draws. */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * A deterministic generator (Mulberry32): the same seed draws the same numbers in the same order, so the same race
 * replays the same way (L2-067 AC1).
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** A number in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** A number in [min, max). */
  between(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}
