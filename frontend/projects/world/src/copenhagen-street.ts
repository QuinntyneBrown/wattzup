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

/** Rows of linden trees shade the cycle track. The harbour crossings open towards the quays. */
export async function copenhagenStreet(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/copenhagen-lindens.webp');
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2106),
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
    for (let d = section; d < Math.min(lap, section + 100); d += 16.7) {
      if ((d > 2320 && d < 2840) || (d > 10220 && d < 10710)) continue;
      const harbour = (d > 3920 && d < 4710) || (d > 6970 && d < 8160);
      const h = 5.6 + rng() * 2.2,
        tile = Math.floor(d / 16.7) % 2;
      for (const angle of [0.12, 1.65]) panel(d, -16.1, angle, h * 1.09, h, tile, 0xe4dbbf);
      if (!harbour && Math.floor(d / 16.7) % 3 !== 0) {
        for (const angle of [0.18, 1.7]) panel(d + 4.3, 8.3, angle, h * 1.04, h, tile, 0xe0dbc1);
      }
      if ((harbour || Math.floor(d / 16.7) % 8 === 0) && Math.floor(d / 16.7) % 3 === 0)
        panel(d + 3.6, harbour ? 7.6 : -17.9, 0.22, 6.8, 5.65, 3, 0xe7dfd4);
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
