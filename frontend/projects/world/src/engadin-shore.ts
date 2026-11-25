import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import type { Course } from './course';
import { seeded } from './world-kit';

function chipseal() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!,
    image = c.createImageData(256, 256),
    random = seeded(2117);
  for (let i = 0; i < image.data.length; i += 4) {
    const tone = 82 + random() * 33 + (random() > 0.987 ? 26 : 0);
    image.data[i] = tone;
    image.data[i + 1] = tone + 1;
    image.data[i + 2] = tone + 2;
    image.data[i + 3] = 255;
  }
  c.putImageData(image, 0, 0);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.anisotropy = 4;
  return map;
}
function placeNames() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const c = canvas.getContext('2d')!;
  for (const [i, name] of ['MALOJA', 'SILS / SEGL', 'SILVAPLANA', 'ST. MORITZ'].entries()) {
    c.fillStyle = '#f5f5e6';
    c.fillRect(0, i * 96, 512, 96);
    c.fillStyle = '#254981';
    c.fillRect(4, i * 96 + 4, 504, 88);
    c.strokeStyle = '#fff9e5';
    c.lineWidth = 3;
    c.strokeRect(9, i * 96 + 9, 494, 78);
    c.fillStyle = '#fff9e5';
    c.font = 'bold 53px sans-serif';
    c.textAlign = 'center';
    c.fillText(name, 256, i * 96 + 67, 470);
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}

export async function engadinShore(course: Course) {
  const textures: Texture[] = [],
    loader = new TextureLoader();
  try {
    for (const name of ['larches', 'sgraffito', 'moritz', 'water', 'hillside']) {
      const map = await loader.loadAsync('courses/engadin-' + name + '.webp');
      map.colorSpace = SRGBColorSpace;
      textures.push(map);
    }
  } catch (error) {
    for (const t of textures) t.dispose();
    throw error;
  }
  textures.splice(2, 0, chipseal(), placeNames());
  const waterMap = textures[5]!;
  waterMap.wrapS = waterMap.wrapT = RepeatWrapping;
  waterMap.anisotropy = 4;
  const hillMap = textures[6]!;
  hillMap.wrapS = hillMap.wrapT = RepeatWrapping;
  hillMap.anisotropy = 4;
  const materials = textures.map(
    (map, i) =>
      new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: i === 0 || i === 4 ? 0.52 : 0 }),
  );
  const glints = new MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: DoubleSide,
  });
  const geometries: BufferGeometry[] = [],
    group = new Group();
  const sections: { centre: number; node: Group; terrain: Group; facades: number }[] = [];
  const random = seeded(2117),
    tint = new Color();
  for (let start = 0; start < course.length; start += 160) {
    const end = Math.min(start + 160, course.length),
      node = new Group(),
      terrain = new Group();
    group.add(node, terrain);
    const positions: number[] = [],
      uv: number[] = [],
      index: number[] = [],
      colours: number[] = [];
    function finish(material: MeshBasicMaterial, parent = node) {
      if (!index.length) return;
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(positions, 3));
      if (uv.length) g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      if (colours.length) g.setAttribute('color', new Float32BufferAttribute(colours, 3));
      g.setIndex([...index]);
      geometries.push(g);
      parent.add(new Mesh(g, material));
      positions.length = uv.length = index.length = colours.length = 0;
    }
    function quad() {
      const n = positions.length / 3 - 4;
      index.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    function upright(
      d: number,
      l: number,
      floor: number,
      w: number,
      h: number,
      angle: number,
      u0: number,
      u1: number,
      v0 = 0,
      v1 = 1,
    ) {
      const p = course.place(d, l),
        a = p.heading + angle,
        dx = (Math.cos(a) * w) / 2,
        dz = (-Math.sin(a) * w) / 2;
      positions.push(
        p.x - dx,
        floor,
        p.z - dz,
        p.x + dx,
        floor,
        p.z + dz,
        p.x + dx,
        floor + h,
        p.z + dz,
        p.x - dx,
        floor + h,
        p.z - dz,
      );
      uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
      quad();
    }
    for (let d = start; d < end; d += 4) {
      for (const [l0, l1] of [
        [-6.66, -5.24],
        [-5.05, -0.081],
        [0.081, 5.05],
        [5.24, 6.66],
      ]) {
        for (const [m, l] of [
          [d, l0!],
          [d, l1!],
          [Math.min(d + 4, end), l1!],
          [Math.min(d + 4, end), l0!],
        ] as const) {
          const p = course.place(m, l);
          positions.push(p.x, p.y + 0.089 - 0.006 * Math.abs(l), p.z);
          uv.push(l / 0.92, m / 0.92);
        }
        quad();
      }
    }
    finish(materials[2]!);
    let facades = 0;
    for (const centre of [7440, 12910, 23400]) {
      for (let j = -6; j < 12; j++) {
        const d = centre + j * 29;
        if (d < start || d >= end) continue;
        const side = j % 4 !== 0 ? -1 : 1,
          l = side * (19 + (((j % 3) + 3) % 3) * 3),
          h = (centre === 23400 ? 9 : 6.8) + (((j % 3) + 3) % 3),
          sideU = (((j % 4) + 4) % 4) / 4;
        if (centre === 12910 && side > 0) continue;
        const floor = course.place(d).y;
        upright(
          d,
          -l + side * 5.35,
          floor,
          15.05,
          h,
          Math.PI / 2,
          side < 0 ? sideU : sideU + 0.25,
          side < 0 ? sideU + 0.25 : sideU,
        );
        upright(d - 7.64, -l, floor, 10.09, h, 0, sideU, sideU + 0.25);
        facades++;
      }
    }
    finish(materials[1]!);
    for (const [d, tile] of [
      [145, 0],
      [7440, 1],
      [12872, 2],
      [23970, 3],
    ] as const) {
      if (d >= start && d < end)
        upright(
          d,
          8.3,
          course.place(d).y + 1.3,
          3.4,
          0.78,
          0.12,
          0,
          1,
          1 - (tile + 1) / 4,
          1 - tile / 4,
        );
    }
    finish(materials[3]!);
    const lake =
      start < 6860
        ? [-310, 6860, 1797]
        : start > 8800 && start < 16250
          ? [8800, 16250, 1790]
          : start > 18140
            ? [18140, 25210, 1766]
            : null;
    // The shore, roadcut and high valley wall use the same cross-section as the authored land.
    function slopes(m: number) {
      const base = course.place(m).y,
        edge = 14 + 5 * (1 + Math.sin(m / 237)) + 4 * (1 + Math.cos(m / 465));
      const t = lake ? Math.max(0, Math.min(1, (m - lake[0]!) / (lake[1]! - lake[0]!))) : 0;
      const coast = lake ? edge : 60,
        width = lake ? 28 + 630 * Math.sin(Math.PI * t) ** 0.65 : 4,
        z = lake ? lake[2]! : base - 2;
      return [
        [7.38, base - 0.015],
        [19, base + (m > 17700 && m < 21110 ? 0.19 : 0.8)],
        [46, base + 6],
        [110, base + 27],
        [330, base + 78],
        [800, base + 205],
        [-7.38, base - 0.015],
        [-coast, z + 0.34],
        [-coast - width - 5, z + 0.43],
        [-coast - width - 65, z + 18],
        [-coast - width - 280, z + 92 + 48 * Math.sin(m / 430) + 21 * Math.cos(m / 193)],
      ];
    }
    for (let m = start; m < end; m += 10) {
      const b = Math.min(end, m + 10),
        rows = [slopes(m), slopes(b)];
      for (const j of [0, 1, 2, 3, 4, 6, 8, 9]) {
        for (const [k, v] of [
          [0, j],
          [0, j + 1],
          [1, j + 1],
          [1, j],
        ] as const) {
          const [lane, z] = rows[k]![v]!,
            d = k ? b : m,
            p = course.place(d, lane);
          positions.push(p.x, z! + 0.1, p.z);
          uv.push(p.x / 72, p.z / 72);
        }
        quad();
      }
    }
    finish(materials[6]!, terrain);
    for (let i = 0; i < 40; i++) {
      const d = start + random() * (end - start),
        centre = course.place(d),
        edge = 14 + 5 * (1 + Math.sin(d / 237)) + 4 * (1 + Math.cos(d / 465));
      const forest = i < 23,
        far = i % 3 === 0 && lake !== null,
        side = i % 5 === 0 ? -1 : 1;
      let l = side * (forest ? 43 + random() * 95 : 9.2 + random() * 17),
        floor = centre.y;
      if (far && lake) {
        const t = Math.min(1, Math.max(0, (d - lake[0]!) / (lake[1]! - lake[0]!)));
        const away = random() * 64;
        l = -(edge + 28 + 630 * Math.sin(t * Math.PI) ** 0.65 + 5 + away);
        floor = lake[2]! + 0.45 + away * 0.27;
      } else if (l < 0) {
        if (lake && -l >= edge - 1) continue;
        floor -= lake ? ((-l - 7.25) / (edge - 7.25)) * (centre.y - lake[2]! - 0.34) : 0.25;
      } else {
        floor +=
          l < 19
            ? Math.max(0, ((l - 7.25) / 11.75) * 0.82)
            : l < 46
              ? 0.8 + (l - 19) * 0.19
              : 6 + (l - 46) * 0.33;
      }
      if (
        !far &&
        (Math.abs(d - 7440) < 420 || Math.abs(d - 12910) < 420 || Math.abs(d - 23400) < 460) &&
        l < 38 &&
        l > -38
      )
        continue;
      if (d > 23860 && d < 24190 && l > 0 && l < 78) continue;
      if (l > 10 && l < 23 && d > 17650 && d < 21150) continue;
      const tile = Math.floor(random() * 4),
        h = (far ? 7 : 6) + random() * 9;
      upright(
        d,
        l,
        floor - 0.13,
        h * (tile === 2 ? 0.92 : 0.71),
        h,
        (random() - 0.5) * 0.85,
        tile / 4,
        (tile + 1) / 4,
      );
    }
    finish(materials[0]!);
    if (start <= 24175 && end > 24175) {
      upright(24175, 52, course.place(24175).y + 0.5, 116, 46, 0.65, 0, 1);
      finish(materials[4]!);
    }
    if (lake) {
      for (let d = Math.max(start, lake[0]!); d < Math.min(end, lake[1]!); d += 10) {
        const b = Math.min(d + 10, end, lake[1]!);
        for (const [m, far] of [
          [d, false],
          [d, true],
          [b, true],
          [b, false],
        ] as const) {
          const t = Math.min(1, Math.max(0, (m - lake[0]!) / (lake[1]! - lake[0]!)));
          const edge = 14 + 5 * (1 + Math.sin(m / 237)) + 4 * (1 + Math.cos(m / 465));
          const lane = edge + (far ? 27 + 630 * Math.sin(t * Math.PI) ** 0.65 : 2.1);
          const p = course.place(m, -lane);
          positions.push(p.x, lake[2]! + 0.036, p.z);
          uv.push(p.x / 11, p.z / 11);
        }
        quad();
      }
      finish(materials[5]!);
      for (let i = 0; i < 55; i++) {
        const d = start + random() * (end - start),
          edge = 14 + 5 * (1 + Math.sin(d / 237)) + 4 * (1 + Math.cos(d / 465));
        const p = course.place(d, -edge - 7 - random() * 170),
          z = lake[2]! + 0.065,
          w = 0.45 + random() * 3,
          h = 0.04 + random() * 0.22;
        positions.push(p.x - w, z, p.z, p.x, z, p.z - h, p.x + w, z, p.z, p.x, z, p.z + h);
        quad();
        tint.setHex(i % 4 ? 0xb9d9d3 : 0xf8f4c9);
        for (let q = 0; q < 4; q++) colours.push(tint.r, tint.g, tint.b);
      }
      finish(glints);
    }
    sections.push({ centre: start + 80, node, terrain, facades });
  }
  return {
    group,
    villageFronts: 0,
    at(metres: number, time = 0) {
      waterMap.offset.x = (time * 0.009) % 1;
      this.villageFronts = 0;
      for (const s of sections) {
        s.terrain.visible = Math.abs(metres - s.centre) < 1850;
        s.node.visible = Math.abs(metres - s.centre) < 580;
        if (s.node.visible) this.villageFronts += s.facades;
      }
    },
    dispose() {
      group.removeFromParent();
      for (const t of textures) t.dispose();
      for (const m of materials) m.dispose();
      for (const g of geometries) g.dispose();
      glints.dispose();
    },
  };
}
