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

/** Dry forest stands in three layers. Gaps open towards the cenote, the colonnade and the plaza. */
export async function chichenForest(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/chichen-forest.webp');
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2099),
    tint = new Color();
  const lap = course.length + 160;
  for (let section = 0; section < lap; section += 100) {
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
    for (let d = section; d < Math.min(lap, section + 100); d += 5.2) {
      const cenote = d > 3100 && d < 3320,
        ruins = d > 7110 && d < 8430,
        plaza = d > 12190;
      for (const side of [-1, 1]) {
        if ((side < 0 && (cenote || ruins)) || plaza) continue;
        const lane = side * (6.2 + rng() * 4.1),
          tile = Math.floor(rng() * 2.6);
        const height = 6.3 + rng() * 5.4;
        if (d < 583 || d > 719 || side < 0) {
          for (const yaw of [0.19, 1.61])
            panel(d, lane, yaw, height * (tile === 2 ? 0.82 : 1.05), height, tile, 0xcacba9);
        }
        panel(
          d + 1.4,
          side * (14 + rng() * 6),
          0.52,
          11 + rng() * 4,
          10 + rng() * 5,
          rng() < 0.6 ? 0 : 1,
          0xb4bd9e,
        );
        if (!ruins && !plaza) {
          panel(
            d + 2.4,
            side * (9 + rng() * 4),
            1.33,
            6 + rng() * 4,
            2.4 + rng() * 2.3,
            0,
            0x9dab83,
          );
          if (rng() < 0.56)
            panel(d + 3.1, side * (4.2 + rng() * 2.2), 0.33, 2.8, 1.08 + rng() * 0.8, 1, 0xa7b28b);
        }
        if (rng() < 0.38) panel(d + 2, side * (4.1 + rng() * 2), 0.86, 2.6, 2.15, 2, 0xacba83);
      }
      if (d % 20 < 6) {
        for (const sign of [-1, 1]) {
          const lane = sign * ((plaza || ruins ? 70 : 30) + rng() * 13);
          if (cenote && sign < 0) continue;
          panel(d, lane, 0.58, 15 + rng() * 5, 12 + rng() * 3, rng() < 0.55 ? 0 : 1, 0xa8b094);
        }
      }
      if ((d > 603 && d < 697) || (ruins && d % 29 < 11) || (plaza && d < 12690 && d % 41 < 10))
        panel(d, 5.4 + rng() * 2, 0.54, 5.3, 1.73 + rng() * 0.18, 3, 0xdfd6c9);
    }
    if (!pos.length) continue;
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new Float32BufferAttribute(colour, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    chunks.push(g);
    const mesh = new Mesh(g, material);
    mesh.userData['station'] = section + 50;
    root.add(mesh);
  }
  let previous = -Infinity;
  function follow(d: number) {
    if (Math.abs(d - previous) < 24) return;
    previous = d;
    for (const mesh of root.children)
      mesh.visible = Math.abs(Number(mesh.userData['station']) - d) < 520;
  }
  follow(0);
  return {
    root,
    follow,
    dispose() {
      root.clear();
      for (const g of chunks) g.dispose();
      material.dispose();
      atlas.dispose();
    },
  };
}
