/** Seconds from one flicker to the next in each thunderhead, and where in that each begins. */
const EVERY = [9.7, 13.3] as const;
const BEGINS = [2.1, 6.4] as const;
/** A flicker: when its pulses come (seconds into it), how bright each is, and how long a pulse takes to die. */
const PULSES = [0, 0.14, 0.33] as const;
const BRIGHT = [1, 0.55, 0.85] as const;
const DIES = 0.22;

/** A number from 0 to 1 that is always the same for the same flicker of the same thunderhead. */
function dealt(flicker: number, which: number): number {
  const x = Math.sin(flicker * 127.1 + which * 311.7 + 1.3) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * How brightly sheet lightning lights the inside of a thunderhead at a second of the ride's clock, from 0 (dark) to
 * 1 (L2-166 AC73): dark nearly all the time, then a flicker of two or three pulses, each lit at once and dying in a
 * fifth of a second, and seconds of dark again. `which` is the thunderhead: no two keep the same time. Never more
 * than three pulses in a second, and the same at the same second of every ride.
 */
export function lightning(time: number, which: number): number {
  if (time < 0) return 0;
  const every = EVERY[which % EVERY.length]!;
  const begins = BEGINS[which % BEGINS.length]!;
  const flicker = Math.floor((time - begins) / every);
  if (flicker < 0) return 0;
  // Each flicker comes up to three seconds late, so they do not keep time.
  const into = time - (begins + flicker * every + dealt(flicker, which) * 3);
  if (into < 0) return 0;
  const pulses = dealt(flicker + 0.5, which) < 0.5 ? 2 : 3;
  let light = 0;
  for (let pulse = 0; pulse < pulses; pulse++) {
    const since = into - PULSES[pulse]!;
    if (since < 0 || since >= DIES) continue;
    const left = 1 - since / DIES;
    light = Math.max(light, BRIGHT[pulse]! * left * left);
  }
  return light;
}
