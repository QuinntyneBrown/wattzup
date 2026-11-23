/** How the evening stands: what the painted sky's colours are multiplied by, and the sun's light by. */
export interface Dusk {
  sky: [number, number, number];
  light: number;
  /** How far out the stars are, from 0 (none) to 1. */
  stars: number;
}

/** The evening at the start, where the sky is as it was painted (three quarters round), and at the finish. */
const EARLY: Dusk = { sky: [1.16, 1.1, 1], light: 1.14, stars: 0 };
const PAINTED = 0.75;
const LATE: Dusk = { sky: [0.93, 0.8, 0.84], light: 0.8, stars: 1 };
/** The share of the course ridden at which the first stars show. */
const FIRST_STARS = 0.35;

/**
 * The evening drawing in over a ride into the sunset (L2-166 AC64): at the share `ridden` of the course (0 to 1) the
 * sky is lighter and more golden than it was painted at the start, as it was painted three quarters of the way
 * round, and deeper and redder at the finish, with the sun's light going the same way. Writes `out` and returns it.
 */
export function dusk(ridden: number, out: Dusk): Dusk {
  const at = Math.min(Math.max(ridden, 0), 1);
  const [from, to, share] =
    at < PAINTED ? [EARLY, null, at / PAINTED] : [null, LATE, (at - PAINTED) / (1 - PAINTED)];
  // Eased at the painted sky, so the evening does not turn a corner there.
  const k = from ? 1 - (1 - share) * (1 - share) : share * share;
  for (let part = 0; part < 3; part++) {
    out.sky[part] = from
      ? from.sky[part]! + (1 - from.sky[part]!) * k
      : 1 + (to!.sky[part]! - 1) * k;
  }
  out.light = from ? from.light + (1 - from.light) * k : 1 + (to!.light - 1) * k;
  // The stars come out from a third of the way round, slowly at first.
  const out_ = Math.max(0, (at - FIRST_STARS) / (1 - FIRST_STARS));
  out.stars = out_ * out_;
  return out;
}
