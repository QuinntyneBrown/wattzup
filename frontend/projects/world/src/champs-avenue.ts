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

/** Batches the avenue's two experience levels of depth: spectators at the barriers and the plane trees behind them. */
export async function champsAvenue(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/champs-avenue.webp');
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2096),
    tint = new Color();
  const lap = course.length / 3;
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
      const u = (tile % 2) * 0.5,
        v = tile < 2 ? 0.5 : 0;
      uv.push(
        u + 0.002,
        v + 0.002,
        u + 0.498,
        v + 0.002,
        u + 0.498,
        v + 0.498,
        u + 0.002,
        v + 0.498,
      );
      tint.setHex(shade);
      for (let i = 0; i < 4; i++) colour.push(tint.r, tint.g, tint.b);
      idx.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
    for (let d = section; d < Math.min(lap, section + 135); d += 4.5) {
      // The two squares keep their islands open and preserve the view of the monuments.
      if ((d > 1220 && d < 1375) || (d > 2970 && d < 3120)) continue;
      const tile = 2 + (rng() < 0.5 ? 0 : 1);
      panel(
        d,
        8.65,
        0.78 + (rng() - 0.5) * 0.32,
        5.4,
        2.1,
        tile,
        rng() < 0.5 ? 0xe5ddc9 : 0xeddfd4,
      );
      if (d > lap - 350 || d < 150) panel(d, -8.4, -0.74, 5.1, 2.05, 5 - tile, 0xe2d6c5);
      if (Math.round((d - section) / 4.5) % 3 === 0) {
        const t = rng() < 0.45 ? 0 : 1;
        const h = 9.7 + rng() * 1.4;
        for (const yaw of [0.28, 1.85]) panel(d, 12.6, yaw, 12.7, h, t, 0xc8c7a3);
      }
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
