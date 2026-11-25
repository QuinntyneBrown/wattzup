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

/** Beachgoers gather at the kiosk counters. Broad shade trees line the avenue behind the civic frontage. */
export async function copacabanaPromenade(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/copacabana-promenade.webp');
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2105),
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
    for (let d = section; d < Math.min(lap, section + 100); d += 12.5) {
      const sequence = Math.floor(d / 12.5);
      const shadeTree = sequence % 3 === 1;
      const kiosk = [114, 442, 832, 1380, 1690, 2024, 2370, 2780, 3130, 3525, 4028].some(
        (k) => Math.abs(d - k) < 19,
      );
      if (shadeTree) {
        const height = 7.7 + rng() * 2.2;
        const almond = sequence % 4 === 0;
        const lane = sequence % 5 === 0 ? -4.3 : 12.7;
        const tile = almond ? 1 : 0;
        for (const angle of [0.14, 1.65])
          panel(d, lane, angle, height * 1.02, height, tile, 0xf3e2c8);
      }
      if (sequence % 3 === 0) {
        const height = 8.1 + rng() * 2.4;
        for (const angle of [0.22, 1.7]) panel(d, -30.8, angle, height * 1.05, height, 1, 0xdfd9bf);
      }
      if (kiosk && !shadeTree) panel(d, 12.3, 0.24, 6.9, 5.6, 3, 0xf1dfc7);
      if (!kiosk && Math.floor(d / 12.5) % 9 === 0)
        panel(d + 3.4, -31.1, -0.15, 6.1, 5.3, 3, 0xe8d6c5);
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
