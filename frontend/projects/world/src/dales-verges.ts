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

/** Dales ash trees punctuate the field boundaries. Spectators gather at the final ramps. */
export async function dalesVerges(course: Course) {
  const loader = new TextureLoader();
  const textures = await Promise.all([
    loader.loadAsync('courses/dales-fans.webp'),
    loader.loadAsync('courses/dales-ash.webp'),
    loader.loadAsync('courses/dales-fells.webp'),
  ]);
  textures[2]!.colorSpace = SRGBColorSpace;
  const materials = textures.slice(0, 2).map((map) => {
    map.colorSpace = SRGBColorSpace;
    return new MeshBasicMaterial({ map, alphaTest: 0.49, side: DoubleSide, vertexColors: true });
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2109),
    tint = new Color();
  const lap = course.length + 160;
  for (let section = 0; section < lap; section += 100) {
    for (const trees of [false, true]) {
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
          v = trees ? 0 : tile < 2 ? 0.5 : 0;
        uv.push(
          u + 0.002,
          v + 0.002,
          u + 0.498,
          v + 0.002,
          u + 0.498,
          v + (trees ? 0.998 : 0.498),
          u + 0.002,
          v + (trees ? 0.998 : 0.498),
        );
        tint.setHex(shade);
        for (let i = 0; i < 4; i++) colour.push(tint.r, tint.g, tint.b);
        idx.push(start, start + 1, start + 2, start, start + 2, start + 3);
      }
      const crowd = section >= 8550 && section <= 9470;
      const village =
        section < 220 ||
        (section >= 13000 && section < 13400) ||
        (section >= 22600 && section < 23100);
      const step = trees ? 22 : crowd ? 4.3 : 13;
      for (let d = section + 1; d < section + 100; d += step) {
        for (const side of [-1, 1]) {
          if (trees) {
            if ((d > 6200 && d < 12650) || (village && rng() < 0.8) || rng() > 0.61) continue;
            const h = 5.4 + rng() * 4.3,
              tile = rng() < 0.5 ? 0 : 1;
            const lane = side * (8.3 + rng() * 18);
            for (const a of [0.19, 1.76])
              panel(d + rng() * 0.67, lane, a, h * 1.14, h, tile, 0xbcc2a4);
          } else if (crowd || village) {
            if (rng() > (crowd ? 0.8 : 0.37)) continue;
            const tile = Math.floor(rng() * 4);
            panel(
              d + rng() * 3,
              side * (3.67 + rng() * 0.58),
              side * (0.58 + rng() * 0.34),
              3.0,
              1.93,
              tile,
              0xe2dfd2,
            );
          }
        }
      }
      if (!idx.length) continue;
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new Float32BufferAttribute(colour, 3));
      g.setIndex(idx);
      g.computeBoundingSphere();
      chunks.push(g);
      const mesh = new Mesh(g, materials[trees ? 1 : 0]);
      mesh.userData['station'] = section + 50;
      root.add(mesh);
    }
  }
  // The distant fells surround the rider. Mirroring alternate stretches joins
  // the original landscape at identical pixels all the way around the horizon.
  const fellMaterial = new MeshBasicMaterial({
    map: textures[2],
    side: DoubleSide,
    transparent: true,
    opacity: 0.77,
    depthWrite: false,
    color: 0xd3d5c8,
  });
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= 96; i++) {
    const angle = (i / 96) * 2 * Math.PI;
    const x = 2100 * Math.sin(angle),
      z = 2100 * Math.cos(angle);
    positions.push(x, -250, z, x, 205 + 60 * Math.cos(3 * angle), z);
    const fraction = (i % 24) / 24;
    const u = Math.floor(i / 24) % 2 ? 1 - fraction : fraction;
    uv.push(u, 0, u, 1);
    if (i < 96) {
      const n = 2 * i;
      indices.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  chunks.push(geometry);
  const ridges = new Mesh(geometry, fellMaterial);
  root.add(ridges);
  const at = course.place(0);
  let previous = -Infinity;
  function follow(d: number) {
    course.place(d, 0, at);
    ridges.position.set(at.x, at.y, at.z);
    if (Math.abs(d - previous) < 24) return;
    previous = d;
    for (const mesh of root.children)
      if (mesh !== ridges) mesh.visible = Math.abs(Number(mesh.userData['station']) - d) < 520;
  }
  follow(0);
  return {
    root,
    follow,
    dispose() {
      root.clear();
      for (const g of chunks) g.dispose();
      fellMaterial.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
