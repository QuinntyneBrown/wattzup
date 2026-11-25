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

/** Crossed cutouts distinguish fir, cedar and hemlock along the North Shore climb. */
export async function cypressForest(course: Course) {
  const loader = new TextureLoader();
  const [atlas, shore] = await Promise.all([
    loader.loadAsync('courses/cypress-conifers.webp'),
    loader.loadAsync('courses/cypress-inlet.webp'),
  ]);
  shore.colorSpace = SRGBColorSpace;
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2108),
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
        y =
          at.y -
          0.2 +
          Math.max(0, Math.abs(lane) - 6) * (lane * Math.sin(at.heading) > 0 ? 0.14 : -0.27);
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
    for (let d = section; d < section + 100; d += 8.15) {
      for (const side of [-1, 1]) {
        const lookout = d > 5450 && d < 5870;
        const sound = d > 9120 && d < 9630;
        const summit = d > 17830 && d < 18110;
        if (
          (lookout && side === 1) ||
          (sound && side === -1) ||
          (summit && (side < 0 || d < 18035))
        )
          continue;
        for (const row of [0, 1, 2]) {
          const station = d + rng() * 5;
          const lane = side * (9 + row * 14 + rng() * (row === 0 ? 8 : 19));
          if (d > 14340 && d < 14880 && (row === 0 || side < 0 || rng() > 0.27)) continue;
          const tile = Math.floor(rng() * 4);
          const high = (tile === 3 ? 11 : 20) + rng() * 12;
          const angle = rng() * 2.8;
          for (const view of [angle, angle + 1.57])
            panel(
              station,
              lane,
              view,
              high * (tile === 0 ? 0.44 : 0.39),
              high,
              tile,
              row === 0 ? 0xe3e2d5 : 0xc1cfc7,
            );
        }
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
  // Distant shores are fixed across the southern basin. The visible arc moves behind
  // the nearby firs as the rider turns; the matte retains the sky above its ridgeline.
  const vertices: number[] = [],
    coords: number[] = [],
    faces: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const u = i / 64,
      angle = -0.35 + 3.62 * u;
    const x = 1200 + 2450 * Math.cos(angle),
      z = -1450 + 2450 * Math.sin(angle);
    vertices.push(x, 65, z, x, 1030, z);
    coords.push(u, 0, u, 1);
    if (i < 64) {
      const n = i * 2;
      faces.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
    }
  }
  const basin = new BufferGeometry();
  basin.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  basin.setAttribute('uv', new Float32BufferAttribute(coords, 2));
  basin.setIndex(faces);
  const shorePaint = new MeshBasicMaterial({
    map: shore,
    alphaTest: 0.48,
    side: DoubleSide,
    fog: false,
    color: 0xe8e8df,
  });
  const horizon = new Mesh(basin, shorePaint);
  root.add(horizon);
  let previous = -Infinity;
  function follow(d: number) {
    if (Math.abs(d - previous) < 24) return;
    previous = d;
    for (const mesh of root.children)
      if (mesh !== horizon) mesh.visible = Math.abs(Number(mesh.userData['station']) - d) < 520;
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
      shore.dispose();
      basin.dispose();
      shorePaint.dispose();
    },
  };
}
