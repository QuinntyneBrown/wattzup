import {
  BufferGeometry,
  CanvasTexture,
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

function rangoli() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.translate(128, 128);
  const shades = ['#fff3c9', '#ffbc35', '#e4557d', '#6ec4bf', '#ee7f39'];
  for (let ring = 4; ring >= 0; ring--) {
    const r = 17 + ring * 22;
    for (let k = 0; k < 12; k++) {
      c.save();
      c.rotate((k * Math.PI) / 6 + ((ring % 2) * Math.PI) / 12);
      c.fillStyle = shades[ring]!;
      c.beginPath();
      c.ellipse(0, -r, 9 + ring * 2, 15 + ring * 1.5, 0, 0, Math.PI * 2);
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = '#fff4e1';
      c.stroke();
      c.restore();
    }
  }
  c.fillStyle = '#f6c548';
  c.beginPath();
  c.arc(0, 0, 14, 0, Math.PI * 2);
  c.fill();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Families, paper lanterns and pavement decoration share section-sized batches. */
export async function diwaliPromenade(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/diwali-families.webp');
  atlas.colorSpace = SRGBColorSpace;
  const facadeMap = await new TextureLoader()
    .loadAsync('courses/diwali-balconies.webp')
    .catch((e: unknown) => {
      atlas.dispose();
      throw e;
    });
  facadeMap.colorSpace = SRGBColorSpace;
  const shoreMap = await new TextureLoader()
    .loadAsync('courses/diwali-bay.webp')
    .catch((error: unknown) => {
      atlas.dispose();
      facadeMap.dispose();
      throw error;
    });
  shoreMap.colorSpace = SRGBColorSpace;
  const shore = new MeshBasicMaterial({
    map: shoreMap,
    alphaTest: 0.24,
    side: DoubleSide,
    fog: false,
    toneMapped: false,
  });
  const balconies = new MeshBasicMaterial({ map: facadeMap, side: DoubleSide, color: 0xf5ddc8 });
  const powder = rangoli();
  const people = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.42,
    side: DoubleSide,
    color: 0xe3c7b6,
  });
  const lamps = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, toneMapped: false });
  const sparks = new MeshBasicMaterial({
    vertexColors: true,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const pattern = new MeshBasicMaterial({ map: powder, alphaTest: 0.33, side: DoubleSide });
  const shapes: BufferGeometry[] = [];
  const group = new Group(),
    random = seeded(2112);
  const palette = [0xffbe38, 0xff775a, 0xf23e86, 0x62bfc3, 0xf17b37];
  for (let start = -90; start < course.length + 100; start += 145) {
    const section = new Group();
    section.userData['metres'] = start + 72;
    group.add(section);
    const pos: number[] = [],
      uv: number[] = [],
      idx: number[] = [],
      rgb: number[] = [];
    function mesh(material: MeshBasicMaterial) {
      if (!idx.length) return;
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(pos, 3));
      if (uv.length) g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      if (rgb.length) g.setAttribute('color', new Float32BufferAttribute(rgb, 3));
      g.setIndex(idx.slice());
      shapes.push(g);
      section.add(new Mesh(g, material));
      pos.length = uv.length = rgb.length = idx.length = 0;
    }
    // Each stretch follows the opposite coast in world coordinates. Its varying height and
    // shore distance give the north headland a distinct silhouette as the rider rounds the bay.
    const island = (d: number) =>
      course.place(d, -255 - 48 * Math.sin(d / 540) - 24 * Math.cos(d / 290));
    for (let j = 0; j < 5; j++) {
      const d = start + j * 29,
        a = island(d),
        b = island(d + 29);
      const n = pos.length / 3;
      const height = (chainage: number) =>
        48 + 15 * Math.sin(chainage / 670) + 10 * Math.cos(chainage / 425);
      pos.push(
        a.x,
        a.y - 2.41,
        a.z,
        b.x,
        b.y - 2.41,
        b.z,
        b.x,
        b.y - 2.41 + height(d + 29),
        b.z,
        a.x,
        a.y - 2.41 + height(d),
        a.z,
      );
      const tile = Math.floor((d + 90) / 725),
        u = ((d + 90) % 725) / 725,
        v = u + 29 / 725;
      const left = tile % 2 ? 1 - u : u,
        right = tile % 2 ? 1 - v : v;
      uv.push(left, 0, right, 0, right, 1, left, 1);
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    mesh(shore);
    const coast = section.children[0]!;
    // The distant shore has a longer sightline than the people and lanterns.
    group.add(coast);
    coast.userData['metres'] = start + 72;
    coast.userData['reach'] = 1700;
    const crowded = (start > 5500 && start < 7500) || (start > 2100 && start < 3200);
    for (let i = 0; i < (crowded ? 35 : 12); i++) {
      const d = start + random() * 145,
        side = i % 5 === 0 ? 1 : -1;
      const lane = side * (side < 0 ? 8.45 + random() * 6.6 : 8.5 + random() * 5);
      const at = course.place(d, lane),
        angle = at.heading + (random() - 0.5) * 0.85;
      const height = 1.69 + random() * 0.15,
        half = height * 0.56;
      const x = half * Math.cos(angle),
        z = -half * Math.sin(angle),
        base = at.y + 0.21;
      const n = pos.length / 3;
      pos.push(
        at.x - x,
        base,
        at.z - z,
        at.x + x,
        base,
        at.z + z,
        at.x + x,
        base + height,
        at.z + z,
        at.x - x,
        base + height,
        at.z - z,
      );
      const tile = Math.floor(random() * 4),
        u = (tile % 2) * 0.5,
        v = tile < 2 ? 0.5 : 0;
      uv.push(u, v, u + 0.5, v, u + 0.5, v + 0.5, u, v + 0.5);
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    mesh(people);
    // Follow each fixed building's own orientation, including the inside of the bay.
    for (let j = Math.max(0, Math.ceil((start + 70) / 39)); -70 + j * 39 < start + 145; j++) {
      const d = -70 + j * 39,
        at = course.place(d, 18.3);
      const dx = -Math.sin(at.heading) * 16.2,
        dz = -Math.cos(at.heading) * 16.2;
      const y = at.y + 0.43,
        h = (4 + (j % 4)) * 3.13 - 0.35;
      const n = pos.length / 3,
        u = (j % 4) / 4;
      pos.push(
        at.x - dx,
        y,
        at.z - dz,
        at.x + dx,
        y,
        at.z + dz,
        at.x + dx,
        y + h,
        at.z + dz,
        at.x - dx,
        y + h,
        at.z - dz,
      );
      uv.push(u, 0, u + 0.25, 0, u + 0.25, 1, u, 1);
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    mesh(balconies);
    const color = new Color();
    function vertex(x: number, y: number, z: number, tint: number, power: number) {
      pos.push(x, y, z);
      color.setHex(tint);
      rgb.push(color.r * power, color.g * power, color.b * power);
      return pos.length / 3 - 1;
    }
    // The family faces inland with their knees over the coping and their feet above the pavement.
    const family = start + 68;
    for (let person = 0; person < 3; person++) {
      const d = family + person * 0.62;
      const child = person === 1 ? 0.73 : 1;
      const cloth = palette[(person + Math.floor((start + 90) / 145)) % palette.length]!;
      function oval(
        along: number,
        lane: number,
        height: number,
        width: number,
        depth: number,
        tall: number,
        tint: number,
      ) {
        const p = course.place(d + along * child, -16.04 + lane * child);
        const off = pos.length / 3;
        for (let ring = 0; ring < 5; ring++) {
          const angle = ((ring - 2) * Math.PI) / 4;
          for (let j = 0; j < 8; j++) {
            const a = (j * Math.PI) / 4;
            const dx = width * child * Math.cos(a) * Math.cos(angle);
            const dz = depth * child * Math.sin(a) * Math.cos(angle);
            vertex(
              p.x + dx * Math.cos(p.heading) - dz * Math.sin(p.heading),
              p.y + 0.89 + child * (height + tall * Math.sin(angle)),
              p.z - dx * Math.sin(p.heading) - dz * Math.cos(p.heading),
              tint,
              0.63 + 0.23 * Math.sin(angle),
            );
            if (ring < 4) {
              const i = off + ring * 8 + j,
                k = off + ring * 8 + ((j + 1) % 8);
              idx.push(i, k, k + 8, i, k + 8, i + 8);
            }
          }
        }
      }
      oval(0, 0, 0.32, 0.18, 0.23, 0.38, cloth);
      oval(0, 0, 0.78, 0.14, 0.15, 0.18, 0xb98260);
      oval(0, -0.025, 0.87, 0.146, 0.16, 0.12, 0x392b28);
      for (const side of [-1, 1]) {
        oval(0.116 * side, 0.18, 0.05, 0.26, 0.09, 0.12, cloth);
        oval(0.116 * side, 0.415, -0.17, 0.082, 0.08, 0.22, 0x554956);
        oval(0.2 * side, 0.08, 0.36, 0.094, 0.087, 0.24, cloth);
      }
    }
    for (let j = 0; j < 25; j++) {
      const d = start + j * 5.8;
      const lane = j % 3 === 0 ? -15.9 : 9.55;
      const at = course.place(d, lane);
      const y = at.y + (lane < 0 ? 0.95 : 0.24);
      // The shallow earthen bowl has a raised lip and a small cotton wick.
      const n = pos.length / 3;
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        vertex(at.x + 0.145 * Math.cos(a), y + 0.075, at.z + 0.096 * Math.sin(a), 0xd58948, 0.72);
      }
      const foot = vertex(at.x, y, at.z, 0x8e4e31, 0.56);
      const flame = vertex(at.x + 0.053, y + 0.22, at.z, 0xffe5a5, 1.9);
      for (let k = 0; k < 8; k++) {
        idx.push(foot, n + ((k + 1) % 8), n + k);
        if (k === 1 || k === 5) idx.push(n + k, flame, n + ((k + 1) % 8));
      }
      if (j % 3 === 1) {
        const p = course.place(d, j % 2 === 0 ? -9.15 : 13);
        const high = 4.0 + random() * 0.6,
          tint = palette[j % palette.length]!;
        const point = vertex(p.x, p.y + high + 0.38, p.z, tint, 1.36);
        const ring = pos.length / 3;
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          vertex(
            p.x + 0.34 * Math.cos(a),
            p.y + high,
            p.z + 0.34 * Math.sin(a),
            tint,
            k % 2 ? 0.85 : 1.4,
          );
        }
        const lower = vertex(p.x, p.y + high - 0.43, p.z, tint, 0.98);
        for (let k = 0; k < 8; k++) {
          idx.push(point, ring + k, ring + ((k + 1) % 8), lower, ring + ((k + 1) % 8), ring + k);
          const a = (k * Math.PI) / 4,
            x = p.x + 0.19 * Math.cos(a),
            z = p.z + 0.19 * Math.sin(a);
          const ribbon = vertex(x, p.y + high - 0.3, z, tint, 0.92);
          vertex(x + 0.035, p.y + high - 0.3, z, tint, 0.88);
          vertex(x + 0.022, p.y + high - 0.85, z + 0.039, tint, 0.62);
          idx.push(ribbon, ribbon + 1, ribbon + 2);
        }
        // Fine cross wires attach the lanterns to palms and balconies.
        for (const side of [-1, 1]) {
          const a = vertex(p.x, p.y + high + 0.38, p.z, 0x796852, 0.44);
          vertex(p.x + 0.028, p.y + high + 0.38, p.z, 0x796852, 0.44);
          vertex(p.x + 2.8 * side, p.y + high + 0.85, p.z + 1.5, 0x796852, 0.44);
          idx.push(a, a + 1, a + 2);
        }
      }
    }
    mesh(lamps);
    const hand = course.place(family + 0.8, -15.72);
    for (let ray = 0; ray < 13; ray++) {
      const a = (ray * Math.PI * 2) / 13;
      const n = vertex(hand.x, hand.y + 1.23, hand.z, 0xfff2b3, 2.1);
      vertex(hand.x + 0.017, hand.y + 1.255, hand.z + 0.01, 0xffe598, 2.0);
      vertex(
        hand.x + 0.23 * Math.cos(a),
        hand.y + 1.23 + 0.22 * Math.sin(a),
        hand.z + 0.16 * Math.sin(a * 3),
        0xffbf61,
        1.5,
      );
      idx.push(n, n + 1, n + 2);
    }
    mesh(sparks);
    for (let j = 0; j < 4; j++) {
      const d = start + 24 + j * 34,
        lane = j % 2 === 0 ? -9.45 : 10.2;
      const radius = 1.2 + random() * 0.7,
        n = pos.length / 3;
      for (const [dx, dz, u, v] of [
        [-1, -1, 0, 0],
        [1, -1, 1, 0],
        [1, 1, 1, 1],
        [-1, 1, 0, 1],
      ]) {
        const p = course.place(d + dz! * radius, lane + dx! * radius);
        pos.push(p.x, p.y + 0.265, p.z);
        uv.push(u!, v!);
      }
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    mesh(pattern);
  }
  let previous = -Infinity;
  return {
    group,
    follow(d: number, time: number) {
      sparks.opacity = 0.66 + 0.33 * Math.sin(time * 10) * Math.cos(time * 17);
      if (Math.abs(d - previous) < 12) return;
      previous = d;
      for (const s of group.children)
        s.visible = Math.abs(Number(s.userData['metres']) - d) < Number(s.userData['reach'] ?? 420);
    },
    dispose() {
      group.removeFromParent();
      shapes.forEach((g) => g.dispose());
      atlas.dispose();
      powder.dispose();
      facadeMap.dispose();
      shoreMap.dispose();
      shore.dispose();
      balconies.dispose();
      people.dispose();
      lamps.dispose();
      pattern.dispose();
      sparks.dispose();
    },
  };
}
