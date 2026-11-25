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

/** Small groups of visitors gather on the quay. Sheltered hedges and trees mark the inland lanes. */
export async function cornwallVisitors(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/cornwall-visitors.webp');
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2107),
    tint = new Color();
  const lap = 2400;
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
    for (const d of [
      69, 91, 358, 559, 609, 639, 662, 721, 833, 861, 889, 1008, 1090, 1125, 1164, 1207, 1273, 1370,
      1689, 1733, 2020,
    ]) {
      if (d < section || d >= section + 100) continue;
      const quay = d > 510 && d < 1340;
      panel(d, quay ? 5.35 : -3.7, 0.32, 4.25, 3.55, 3, 0xe0d5c5);
    }
    for (let d = section + 3; d < section + 100; d += 19) {
      const quay = d > 510 && d < 1340;
      if (quay && Math.sin(d) < 0.7) continue;
      const side = quay ? -25 : Math.floor(d / 19) % 3 === 0 ? -15 : 16;
      const h = 3.6 + rng() * 2.5;
      for (const a of [0.13, 1.65]) panel(d, side, a, h * 1.32, h, Math.floor(d) % 2, 0xbac0a2);
    }
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
    d = d % lap;
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
