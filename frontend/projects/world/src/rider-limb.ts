// A limb of one skin over two bones (L2-166 AC26): a leg from the hip to the ankle, an arm from the sleeve to the
// wrist. The limb is made straight, along +y, as one surface; each vertex follows the upper bone, the lower bone, or
// about the joint a share of each, so the skin bends at the knee or the elbow and neither parts nor laps there, as two
// tubes laid end to end do. No Three.js here: a bone is the sixteen numbers of its matrix, column by column.

/**
 * How much of the lower bone the skin `along` metres down a limb follows, 0 to 1: none of it more than `reach` above
 * the joint (`joint` metres down the limb), all of it more than `reach` below, eased between so the bend has no
 * crease at either end.
 */
export function lowerShare(along: number, joint: number, reach: number): number {
  const t = Math.min(Math.max((along - (joint - reach)) / (2 * reach), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * The bones each vertex of a limb hangs on and by how much, as a skinned mesh takes them (four of each a vertex):
 * bone 0 is the upper, bone 1 the lower. `positions` are the limb's at rest, three numbers a vertex.
 */
export function limbSkin(
  positions: ArrayLike<number>,
  joint: number,
  reach: number,
): { index: Uint16Array; weight: Float32Array } {
  const count = positions.length / 3;
  const index = new Uint16Array(count * 4);
  const weight = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const share = lowerShare(positions[i * 3 + 1]!, joint, reach);
    index[i * 4 + 1] = 1;
    weight[i * 4] = 1 - share;
    weight[i * 4 + 1] = share;
  }
  return { index, weight };
}

/**
 * Bends a limb where it lies: moves each of its `positions` and turns each of its `normals` (both at rest, three
 * numbers a vertex) by its share of the `upper` and the `lower` bone, as a skinned mesh's shader does each frame.
 * For a limb that is bent once and never moves again: an arm on the bars.
 */
export function bendLimb(
  positions: Float32Array,
  normals: Float32Array,
  joint: number,
  reach: number,
  upper: ArrayLike<number>,
  lower: ArrayLike<number>,
): void {
  for (let i = 0; i < positions.length; i += 3) {
    const share = lowerShare(positions[i + 1]!, joint, reach);
    const at = (n: number): number => upper[n]! * (1 - share) + lower[n]! * share;
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const z = positions[i + 2]!;
    positions[i] = at(0) * x + at(4) * y + at(8) * z + at(12);
    positions[i + 1] = at(1) * x + at(5) * y + at(9) * z + at(13);
    positions[i + 2] = at(2) * x + at(6) * y + at(10) * z + at(14);
    const nx = normals[i]!;
    const ny = normals[i + 1]!;
    const nz = normals[i + 2]!;
    const tx = at(0) * nx + at(4) * ny + at(8) * nz;
    const ty = at(1) * nx + at(5) * ny + at(9) * nz;
    const tz = at(2) * nx + at(6) * ny + at(10) * nz;
    const size = Math.hypot(tx, ty, tz) || 1;
    normals[i] = tx / size;
    normals[i + 1] = ty / size;
    normals[i + 2] = tz / size;
  }
}
