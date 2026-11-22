// The detail a course's ground is drawn with (L2-166 AC13): one small square of texels that repeats without a seam,
// worked out on the device, so the map's file carries no picture. Each channel is one kind of detail the ground's
// material reads at its own scale: the grain of the aggregate, patches of older and newer surface, cracks, and
// pale stones. No Three.js here.

/** Texels along each side: a power of two, so the GPU can mip it. */
export const SURFACE_DETAIL_SIZE = 256;

/** A number from 0 to 1 for a lattice point, the same on every device. */
function hash(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Smooth noise that repeats every `period` lattice cells; `x` and `y` are in cells. */
function valueNoise(x: number, y: number, period: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const corner = (dx: number, dy: number) =>
    hash((((x0 + dx) % period) + period) % period, (((y0 + dy) % period) + period) % period, seed);
  const top = corner(0, 0) + (corner(1, 0) - corner(0, 0)) * ux;
  const bottom = corner(0, 1) + (corner(1, 1) - corner(0, 1)) * ux;
  return top + (bottom - top) * uy;
}

/**
 * How near the edge between two cells of a repeating scatter of points `x`, `y` is: 0 on the edge, growing away
 * from it. The edges are the cracks.
 */
function cellEdge(x: number, y: number, period: number, seed: number): number {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  let nearest = Infinity;
  let second = Infinity;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const wx = (((cx + dx) % period) + period) % period;
      const wy = (((cy + dy) % period) + period) % period;
      const px = cx + dx + hash(wx, wy, seed);
      const py = cy + dy + hash(wx, wy, seed + 1);
      const d = Math.hypot(px - x, py - y);
      if (d < nearest) {
        second = nearest;
        nearest = d;
      } else if (d < second) second = d;
    }
  }
  return second - nearest;
}

const byte = (v: number) => Math.round(Math.min(Math.max(v, 0), 1) * 255);

/** The texels, four bytes each: grain, patches, cracks, stones. */
export function surfaceDetail(): Uint8Array {
  const size = SURFACE_DETAIL_SIZE;
  const texels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // Grain: the aggregate, a texel or two across, over a slightly coarser mottle.
      const grain =
        0.55 * hash(x, y, 1) +
        0.3 * valueNoise(u * 64, v * 64, 64, 2) +
        0.15 * valueNoise(u * 16, v * 16, 16, 3);
      // Patches: broad, soft, in three sizes.
      const patches =
        0.5 * valueNoise(u * 4, v * 4, 4, 4) +
        0.3 * valueNoise(u * 8, v * 8, 8, 5) +
        0.2 * valueNoise(u * 16, v * 16, 16, 6);
      // Cracks: the edges of a scatter of cells, wavering, and only where the surface is tired.
      const wx = u * 5 + 0.25 * (valueNoise(u * 16, v * 16, 16, 7) - 0.5);
      const wy = v * 5 + 0.25 * (valueNoise(u * 16, v * 16, 16, 8) - 0.5);
      const tired = Math.min(Math.max((valueNoise(u * 4, v * 4, 4, 9) - 0.42) * 5, 0), 1);
      const cracks = Math.max(1 - cellEdge(wx, wy, 5, 10) / 0.035, 0) * tired;
      // Stones: a pale chip here and there.
      const chip = hash(x, y, 11);
      const stones = chip > 0.93 ? (chip - 0.93) / 0.07 : 0;
      texels.set(
        [byte((grain - 0.2) / 0.6), byte((patches - 0.25) / 0.5), byte(cracks), byte(stones)],
        (y * size + x) * 4,
      );
    }
  }
  return texels;
}
