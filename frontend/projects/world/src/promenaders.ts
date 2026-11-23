/** Where one of the strollers is: metres up the course, metres right of its middle, and which way they walk. */
export interface Promenader {
  metres: number;
  lane: number;
  /** Up the course, the way the race goes; or down it, coming to meet the rider. */
  forward: boolean;
  /** Not drawn at the start line or in the finish's crowd. */
  shown: boolean;
  /** Where in their stride they are, in radians: once round is two steps. */
  phase: number;
}

/** How many stroll: each is a mesh of its own in the map, and a draw call. */
export const STROLLERS = 4;

/** The stretch of course the strollers are kept in, from behind the rider to ahead of them, in metres. */
const BEHIND = 60;
const AHEAD = 200;
/** Each one's pace in metres a second (down the course if less than 0) and where they set out from. */
const PACE = [1.35, -1.2, 1.5, -1.45] as const;
const FROM = [20, 95, 150, 215] as const;
/** The metres walked in two steps: a foot reaches 0.28 m fore and aft of the hips (walk-material.ts). */
const STRIDE = 1.12;
/** How far left of the kerb they walk, in metres: the sidewalk by the seawall, clear of its poles. */
const KERB = 0.6;
const IN = [1.0, 1.35, 0.85, 1.2] as const;
/** None in the first metres of the course or the last, where the start's gate and the finish's crowd are. */
const START = 30;
const FINISH = 420;

/**
 * Where the strollers are at a second of the ride's clock (L2-166 AC80). Each walks the sidewalk by the seawall at
 * their own pace, some up the course and some down it, whatever the rider does; so that there is always someone to
 * pass, each is kept in a stretch that goes with the rider, and one who leaves it at one end comes into it at the
 * other, out of sight. Writes `out` (one for each of `STROLLERS`).
 */
export function promenaders(
  time: number,
  rider: number,
  end: number,
  half: number,
  out: Promenader[],
): void {
  const stretch = BEHIND + AHEAD;
  const from = rider - BEHIND;
  for (let i = 0; i < out.length; i++) {
    const one = out[i]!;
    const pace = PACE[i % PACE.length]!;
    const walked = FROM[i % FROM.length]! + pace * time;
    // Their own place on the course, brought into the stretch round the rider.
    one.metres = from + ((((walked - from) % stretch) + stretch) % stretch);
    one.lane = -(half + KERB + IN[i % IN.length]!);
    one.forward = pace > 0;
    // Their feet keep pace with the ground: once round for each stride walked.
    one.phase = ((Math.abs(pace) * time) / STRIDE) * Math.PI * 2 + i * 1.7;
    one.shown = one.metres > START && one.metres < end - FINISH;
  }
}
