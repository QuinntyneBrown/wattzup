import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import type { Course } from './course';
import { seeded } from './world-kit';

export async function badwaterGeology(course: Course) {
  const loader = new TextureLoader();
  const cliff = await loader.loadAsync('courses/deathvalley-schist.webp');
  const scrub = await loader.loadAsync('courses/deathvalley-scrub.webp').catch((error: unknown) => {
    cliff.dispose();
    throw error;
  });
  for (const map of [cliff, scrub]) map.colorSpace = SRGBColorSpace;
  cliff.wrapS = RepeatWrapping;
  cliff.wrapT = RepeatWrapping;
  const rock = new MeshLambertMaterial({ map: cliff, side: DoubleSide });
  const leaves = new MeshBasicMaterial({
    map: scrub,
    alphaTest: 0.42,
    side: DoubleSide,
    color: 0xe6e1d0,
  });
  const group = new Group(),
    geometries: BufferGeometry[] = [];
  const random = seeded(2111);
  for (let start = -100; start < course.length + 120; start += 200) {
    const section = new Group();
    section.userData['metres'] = start + 100;
    group.add(section);
    const pos: number[] = [],
      uv: number[] = [],
      idx: number[] = [];
    function assemble(material: MeshLambertMaterial | MeshBasicMaterial) {
      const shape = new BufferGeometry();
      shape.setAttribute('position', new Float32BufferAttribute(pos, 3));
      shape.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      shape.setIndex(idx.slice());
      if (material === rock) shape.computeVertexNormals();
      geometries.push(shape);
      section.add(new Mesh(shape, material));
      pos.length = 0;
      uv.length = 0;
      idx.length = 0;
    }
    const widths = [0, 10, 22, 37, 53, 74, 100, 130, 167, 208, 260, 315, 381, 490, 620];
    for (let row = 0; row <= 20; row++) {
      const d = start + row * 10;
      const toe = 46 + 13 * Math.sin(d / 235) + 8 * Math.cos(d / 101);
      for (let col = 0; col < widths.length; col++) {
        const w = widths[col]!,
          lane = toe + w;
        const at = course.place(d, lane);
        const fold = 0.74 + 0.22 * Math.sin(d / 133 + w / 118) + 0.16 * Math.cos(d / 323);
        const gullies = Math.cos(d / 19 + w / 18) * Math.sin(d / 43 - w / 32) * 4.6;
        const height = w * fold + Math.min(1, w / 22) * (5.6 * Math.sin(w / 12 + d / 53) + gullies);
        pos.push(at.x, at.y - 0.18 + height, at.z);
        uv.push(
          d / 177 + 0.08 * Math.sin(w / 41),
          (w + height * 0.75) / 150 + 0.14 * Math.sin(d / 88),
        );
        if (row < 20 && col + 1 < widths.length) {
          const n = row * widths.length + col;
          idx.push(n, n + 1, n + widths.length, n + widths.length, n + 1, n + widths.length + 1);
        }
      }
    }
    assemble(rock);
    for (let j = 0; j < 106; j++) {
      const d = start + random() * 200;
      const left = j % 6 === 0;
      const lane = left ? -(4.7 + random() * 7) : 4.8 + random() ** 1.25 * 39;
      const t = Math.floor(random() * 3),
        high = 0.42 + random() ** 1.8 * 0.95;
      const w = high * (1.38 + random() * 0.35),
        at = course.place(d, lane);
      for (const turn of [-0.5, 0.85]) {
        const a = at.heading + turn,
          x = (w * Math.cos(a)) / 2,
          z = (-w * Math.sin(a)) / 2;
        const n = pos.length / 3,
          y = at.y + 0.016;
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
        uv.push(t / 3, 0, (t + 1) / 3, 0, (t + 1) / 3, 1, t / 3, 1);
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      }
    }
    assemble(leaves);
  }
  let previous = -Infinity;
  return {
    group,
    follow(d: number) {
      if (Math.abs(d - previous) < 20) return;
      previous = d;
      for (const section of group.children)
        section.visible = Math.abs(Number(section.userData['metres']) - d) < 1450;
    },
    dispose() {
      group.removeFromParent();
      geometries.forEach((g) => g.dispose());
      rock.dispose();
      leaves.dispose();
      cliff.dispose();
      scrub.dispose();
    },
  };
}
