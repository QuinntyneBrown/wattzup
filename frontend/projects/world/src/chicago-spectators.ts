import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import type { Course } from './course';
import { seeded } from './world-kit';

/** Spectators share the existing Caribana cutouts and stand in short rows behind the crit barriers. */
export async function chicagoSpectators(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/chicago-spectators.webp');
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2098),
    tint = new Color();
  const lap = course.length / 5;
  for (let section = 0; section < lap; section += 135) {
    const pos: number[] = [],
      uv: number[] = [],
      colour: number[] = [],
      idx: number[] = [];
    function panel(
      d: number,
      lane: number,
      angle: number,
      width: number,
      high: number,
      tile: number,
      shade: number,
    ) {
      const at = course.place(d, lane),
        a = at.heading + angle;
      const x = (Math.cos(a) * width) / 2,
        z = (-Math.sin(a) * width) / 2,
        y = at.y - 0.09;
      const start = pos.length / 3;
      pos.push(
        at.x - x,
        y,
        at.z - z,
        at.x + x,
        y,
        at.z + z,
        at.x + x,
        y + high,
        at.z + z,
        at.x - x,
        y + high,
        at.z - z,
      );
      const u = tile * 0.5;
      uv.push(u + 0.002, 0.002, u + 0.498, 0.002, u + 0.498, 0.998, u + 0.002, 0.998);
      tint.setHex(shade);
      for (let i = 0; i < 4; i++) colour.push(tint.r, tint.g, tint.b);
      idx.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
    for (let d = section; d < Math.min(lap, section + 135); d += 6.75) {
      if ((d > 412 && d < 496) || (d > 835 && d < 930)) continue;
      const crowded = d < 305 || (d > 1060 && d < 1280) || d > 1490;
      if (!crowded && rng() > 0.45) continue;
      panel(
        d,
        -8.25,
        0.57 + rng() * 0.58,
        3.35 + rng() * 0.7,
        1.72 + rng() * 0.21,
        rng() < 0.5 ? 0 : 1,
        0xe6ded8,
      );
      if (crowded && rng() < 0.65)
        panel(d + 2.2, 8.45, -0.81, 3.85, 1.82, rng() < 0.5 ? 1 : 0, 0xd4d2c9);
    }
    if (!pos.length) continue;
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new Float32BufferAttribute(colour, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    chunks.push(g);
    root.add(new Mesh(g, material));
  }
  return {
    root,
    dispose() {
      root.clear();
      for (const g of chunks) g.dispose();
      material.dispose();
      atlas.dispose();
    },
  };
}
