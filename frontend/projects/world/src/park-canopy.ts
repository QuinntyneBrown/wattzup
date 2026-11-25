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

/** Original Caribana tree portraits, batched along the fixed edges of Park Drive. */
export async function parkCanopy(course: Course) {
  const texture = await new TextureLoader().loadAsync('courses/centralpark-canopy.webp');
  texture.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: texture,
    vertexColors: true,
    alphaTest: 0.46,
    side: DoubleSide,
  });
  const root = new Group();
  const geometries: BufferGeometry[] = [];
  const rng = seeded(2095);
  const tint = new Color();
  for (let chunk = 0; chunk < course.length; chunk += 240) {
    const positions: number[] = [],
      uv: number[] = [],
      colours: number[] = [],
      indices: number[] = [];
    for (let d = chunk; d < Math.min(course.length, chunk + 240); d += 12) {
      for (const sign of [-1, 1]) {
        if (sign < 0 && ((d > 994 && d < 1182) || (d > 1960 && d < 3340))) continue;
        for (let row = 0; row < 2; row++) {
          const at = course.place(
            d + rng() * 7,
            sign * ((row ? 24 : 7.8) + rng() * (row ? 17 : 3.5)),
          );
          const h = 9 + rng() * 6,
            w = h * (0.56 + rng() * 0.17),
            base = at.y - 0.68;
          const angle = at.heading + rng() * 0.45;
          const tile = rng() < 0.56 ? 0 : 0.5;
          tint.setHex(rng() < 0.27 ? 0xf1cd9f : 0xe8e6c7).multiplyScalar(0.88 + rng() * 0.18);
          for (let plane = 0; plane < 2; plane++) {
            const a = angle + (plane * Math.PI) / 2;
            const x = Math.cos(a) * w,
              z = Math.sin(a) * w;
            const first = positions.length / 3;
            positions.push(
              at.x - x,
              base,
              at.z - z,
              at.x + x,
              base,
              at.z + z,
              at.x + x,
              base + h,
              at.z + z,
              at.x - x,
              base + h,
              at.z - z,
            );
            uv.push(
              tile + 0.001,
              0.001,
              tile + 0.499,
              0.001,
              tile + 0.499,
              0.999,
              tile + 0.001,
              0.999,
            );
            for (let j = 0; j < 4; j++) colours.push(tint.r, tint.g, tint.b);
            indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
          }
        }
      }
    }
    if (!positions.length) continue;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    geometry.setAttribute('color', new Float32BufferAttribute(colours, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    geometries.push(geometry);
    root.add(new Mesh(geometry, material));
  }
  return {
    root,
    dispose() {
      root.clear();
      for (const g of geometries) g.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
