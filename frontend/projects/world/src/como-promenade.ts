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

/** Pollarded plane trees line the waterfront. Garden trees leave a sightline to the villa façades. */
export async function comoPromenade(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/como-promenade.webp');
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2102),
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
    for (let d = section; d < Math.min(lap, section + 100); d += 8.5) {
      if (d >= 4490 && d < 4630) continue;
      const town = [240, 1430, 2210, 5530, 8720, 10650].some((c) => Math.abs(d - c) < 108);
      const garden = (d > 1170 && d < 1390) || (d > 6380 && d < 6730);
      if (town || d < 135) {
        const h = 5.8 + rng() * 2.7;
        for (const angle of [0.09, 1.56])
          panel(d, 8.8, angle, h * 0.96, h, Math.floor(d) % 2, 0xe1e4be);
        if (Math.floor(d) % 3 === 0) panel(d + 2, 8.15, 0.36, 9, 6.2, 3, 0xf0e2d3);
      }
      if (!town || garden) {
        const h = 7 + rng() * 5;
        for (const angle of [0.21, 1.63])
          panel(d, -(10 + rng() * 2), angle, h * 0.89, h, Math.floor(d) % 2, 0xc6cfab);
      }
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
