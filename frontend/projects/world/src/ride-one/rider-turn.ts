// The rider's baked turn of the cranks and the marks on their body (ADR 0045, L2-174 AC11). The rider is built in
// Blender (tools/blender/rider.py): a turn of the cranks is baked into their file as keyframes, and each part of
// their body is marked in its vertices' colour for the app to paint. No Three.js here.

/** The parts of the body the app paints, each in the rider's own colour; `kit` is drawn with the kit's texture. */
export type BodyRegion = 'skin' | 'shorts' | 'gripper' | 'sock' | 'glove' | 'hair' | 'kit';

/**
 * How far into a baked turn of `seconds` the cranks are at `angle` radians: 0 with the crank at the top, running
 * evenly, and beginning again with each turn. Never `seconds` itself, which is the start of the next turn.
 */
export function turnTime(angle: number, seconds: number): number {
  const turn = Math.PI * 2;
  const share = (((angle % turn) + turn) % turn) / turn;
  return share >= 1 ? 0 : share * seconds;
}

/** Each region by the three bits of its marker: red, green, blue (tools/blender/rider.py, MARKERS). */
const MARKED: readonly BodyRegion[] = [
  'skin',
  'gripper',
  'shorts',
  'hair',
  'skin',
  'glove',
  'sock',
  'kit',
];

/** The part of the body a vertex marked `r`, `g`, `b` (each 0 or 1, as near as its file stored it) belongs to. */
export function regionOf(r: number, g: number, b: number): BodyRegion {
  return MARKED[(r > 0.5 ? 4 : 0) + (g > 0.5 ? 2 : 0) + (b > 0.5 ? 1 : 0)]!;
}
