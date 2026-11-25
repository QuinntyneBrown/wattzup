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

const TERRACES = [80, 660, 1570, 2820, 5280, 7470, 10370, 11900];
const ESCALATORS = [1550, 2810, 4930, 6200, 8230, 10350, 11760];

/** Original painted walls and the occupied terraces, batched into short stretches along the climb. */
export async function comunaStreets(course: Course) {
  const loader = new TextureLoader();
  const murals = await loader.loadAsync('courses/comuna13-murals.webp');
  let neighbours;
  try {
    neighbours = await loader.loadAsync('courses/comuna13-neighbours.webp');
  } catch (error) {
    murals.dispose();
    throw error;
  }
  for (const atlas of [murals, neighbours]) atlas.colorSpace = SRGBColorSpace;
  const paint = new MeshBasicMaterial({ map: murals, side: DoubleSide, vertexColors: true });
  const cutouts = new MeshBasicMaterial({
    map: neighbours,
    side: DoubleSide,
    vertexColors: true,
    alphaTest: 0.45,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2103);
  for (let section = 0; section < course.length; section += 120) {
    for (const type of ['murals', 'neighbours']) {
      const xyz: number[] = [],
        uv: number[] = [],
        idx: number[] = [],
        rgb: number[] = [];
      const tint = new Color();
      function panel(
        d: number,
        lane: number,
        yaw: number,
        w: number,
        h: number,
        tile: number,
        lift: number,
        shade: number,
      ) {
        const p = course.place(d, lane),
          ang = p.heading + yaw;
        const x = w * 0.5 * Math.cos(ang),
          z = -w * 0.5 * Math.sin(ang),
          y = p.y + lift,
          n = xyz.length / 3;
        xyz.push(
          p.x - x,
          y,
          p.z - z,
          p.x + x,
          y,
          p.z + z,
          p.x + x,
          y + h,
          p.z + z,
          p.x - x,
          y + h,
          p.z - z,
        );
        const u = (tile % 2) * 0.5 + 0.001,
          v = tile < 2 ? 0.501 : 0.001;
        uv.push(u, v, u + 0.498, v, u + 0.498, v + 0.498, u, v + 0.498);
        tint.setHex(shade);
        for (let j = 0; j < 4; j++) rgb.push(tint.r, tint.g, tint.b);
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      }
      for (let d = section + 8; d < section + 120; d += 16) {
        const terrace = TERRACES.some((t) => Math.abs(t - d) < 46);
        if (type === 'murals') {
          if (ESCALATORS.some((t) => Math.abs(t - d) < 39)) continue;
          // Retaining walls on the uphill shoulder. Their leading ends turn towards
          // the approaching bicycle so the subject reads before the rider passes it.
          const w = 5.4 + rng() * 2.0;
          panel(d, -5.45, 1.21, w, w * 0.77, Math.floor(d / 16) % 4, -0.08, 0xfbf2de);
          if (terrace)
            panel(d + 1, 8.4, -1.35, 5.1, 4.3, (Math.floor(d / 16) + 1) % 4, -0.35, 0xe2d1bc);
        } else {
          if (terrace) {
            panel(d, 5.4, 0.3, 7.6, 5.7, 3, -0.1, 0xf4dfc8);
            panel(d + 4, 10.6, 0.65, 7.1, 5.5, 3, -0.3, 0xe3ceb8);
          }
          if (!terrace || Math.floor(d / 16) % 3 === 0) {
            const lane = terrace ? 11 : -(10 + rng() * 6),
              h = 4 + rng() * 3.7;
            const lift = lane < 0 ? Math.max(0, -lane - 6) * 0.52 : -1.3;
            for (const angle of [0.07, 1.67])
              panel(d + 5, lane, angle, h * 0.91, h, Math.floor(d / 16) % 2, lift, 0xced49f);
          }
        }
      }
      if (!idx.length) continue;
      const g = new BufferGeometry();
      g.setIndex(idx);
      g.setAttribute('position', new Float32BufferAttribute(xyz, 3));
      g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new Float32BufferAttribute(rgb, 3));
      g.computeBoundingSphere();
      chunks.push(g);
      const mesh = new Mesh(g, type === 'murals' ? paint : cutouts);
      mesh.userData['station'] = section + 60;
      root.add(mesh);
    }
  }
  let last = -Infinity;
  function follow(d: number) {
    if (Math.abs(last - d) < 22) return;
    last = d;
    for (const mesh of root.children) mesh.visible = Math.abs(mesh.userData['station'] - d) < 340;
  }
  follow(0);
  return {
    root,
    follow,
    dispose() {
      root.removeFromParent();
      root.clear();
      chunks.forEach((g) => g.dispose());
      paint.dispose();
      cutouts.dispose();
      murals.dispose();
      neighbours.dispose();
    },
  };
}
