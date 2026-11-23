// The shade where parts of a rider meet (L2-166 AC32): under an arm, beneath the seat, round the neck, where the
// bike's tubes join. The sky lights a surface from every side it can see; a surface with another close over it sees
// less sky, and is darker. That is worked out once for the rider's shape, from its own points, and kept in the
// vertices' colours: nothing is worked out in a frame.

/** How much each point counts against one it shades: tuned so a surface 4 cm under a lid is about half shaded. */
const WEIGHT = 7;

/**
 * How shaded each point is, 0 (open to the sky) to 1 (shut in), from the points within `reach` metres that stand in
 * front of it. `positions` and `normals` are x, y, z for each point; the points should be spread about evenly over
 * the surfaces (one a triangle will do).
 */
export function occlusion(
  positions: Float32Array,
  normals: Float32Array,
  reach: number,
  samples: Float32Array = positions,
): Float32Array {
  const count = positions.length / 3;
  const shade = new Float32Array(count);
  // The samples in a grid of cells `reach` across, so each point looks only at the cells about it.
  const cells = new Map<number, number[]>();
  const key = (x: number, y: number, z: number): number =>
    (Math.floor(x / reach) + 512) * 1048576 +
    (Math.floor(y / reach) + 512) * 1024 +
    (Math.floor(z / reach) + 512);
  for (let s = 0; s < samples.length; s += 3) {
    const k = key(samples[s]!, samples[s + 1]!, samples[s + 2]!);
    const cell = cells.get(k);
    if (cell) cell.push(s);
    else cells.set(k, [s]);
  }
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3]!;
    const y = positions[i * 3 + 1]!;
    const z = positions[i * 3 + 2]!;
    const nx = normals[i * 3]!;
    const ny = normals[i * 3 + 1]!;
    const nz = normals[i * 3 + 2]!;
    let covered = 0;
    let near = 0;
    for (let cx = -1; cx <= 1; cx++) {
      for (let cy = -1; cy <= 1; cy++) {
        for (let cz = -1; cz <= 1; cz++) {
          const cell = cells.get(key(x + cx * reach, y + cy * reach, z + cz * reach));
          if (!cell) continue;
          for (const s of cell) {
            const dx = samples[s]! - x;
            const dy = samples[s + 1]! - y;
            const dz = samples[s + 2]! - z;
            const d = Math.hypot(dx, dy, dz);
            if (d > reach || d < 1e-5) continue;
            near++;
            const facing = (dx * nx + dy * ny + dz * nz) / d;
            // Only what stands well in front of the surface covers it: its own neighbours lie along it.
            if (facing > 0.2) covered += (facing - 0.2) * (1 - d / reach);
          }
        }
      }
    }
    // Against how many samples a surface in the open has about it, so a finely made part is not shaded more.
    shade[i] = near ? Math.min((covered / near) * WEIGHT, 1) : 0;
  }
  return shade;
}
