import {
  BufferGeometry,
  CanvasTexture,
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

function festivalBoard() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#504a44';
  ctx.fillRect(0, 0, 768, 512);
  const titles = [
    'AFTER THE BELL',
    'UP THE CLOSE',
    'NIGHT BUS',
    'HIGH WIRE',
    'LAST LAUGH',
    'FIRE WALK',
  ];
  const colours = ['#a21d49', '#16535f', '#f0bc58', '#423c75', '#d15b3f', '#2e6862'];
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.translate((i % 3) * 252 + 12, Math.floor(i / 3) * 244 + 8);
    ctx.rotate(((i % 3) - 1) * 0.035);
    ctx.fillStyle = colours[i]!;
    ctx.fillRect(0, 0, 247, 244);
    ctx.fillStyle = '#fff0c9';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText('FESTIVAL FRINGE', 12, 33);
    ctx.beginPath();
    ctx.arc(122, 98, 42, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = 'bold 31px sans-serif';
    ctx.fillText(titles[i]!, 12, 186, 222);
    ctx.font = '19px sans-serif';
    ctx.fillText('HIGH STREET  ·  AUGUST', 12, 224);
    ctx.restore();
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}

function heartMosaic() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 384;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(192, 188);
  const outline = new Path2D();
  outline.moveTo(0, -78);
  outline.bezierCurveTo(-100, -199, -244, -46, 0, 162);
  outline.bezierCurveTo(244, -46, 100, -199, 0, -78);
  outline.closePath();
  ctx.fillStyle = '#544b48';
  ctx.fill(outline);
  ctx.save();
  ctx.clip(outline);
  const random = seeded(5430);
  for (let row = -8; row < 11; row++)
    for (let col = -10; col < 11; col++) {
      ctx.fillStyle = ['#a57664', '#ae887a', '#986d5f', '#b79886', '#887069'][
        Math.floor(random() * 5)
      ]!;
      ctx.fillRect(col * 20 + (row & 1) * 10, row * 16, 18.5, 14.7);
    }
  ctx.restore();
  ctx.lineWidth = 13;
  ctx.strokeStyle = '#6f6660';
  ctx.stroke(outline);
  ctx.setLineDash([13, 2]);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#d0c5af';
  ctx.stroke(outline);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}

export async function fringeStreet(course: Course) {
  const loader = new TextureLoader(),
    textures: Texture[] = [];
  try {
    for (const name of ['setts', 'tenements', 'crowds', 'landmarks', 'crags']) {
      const map = await loader.loadAsync('courses/edinburgh-' + name + '.webp');
      map.colorSpace = SRGBColorSpace;
      textures.push(map);
    }
  } catch (error) {
    for (const t of textures) t.dispose();
    throw error;
  }
  const [stone, facade, crowd, landmarks, crags] = textures;
  stone!.wrapS = stone!.wrapT = RepeatWrapping;
  stone!.anisotropy = 4;
  facade!.anisotropy = 4;
  const board = festivalBoard(),
    heart = heartMosaic();
  textures.push(board, heart);
  const materials = [stone, facade, crowd, board, heart, landmarks, crags].map(
    (map, i) =>
      new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: i === 2 || i >= 4 ? 0.4 : 0 }),
  );
  const group = new Group(),
    geometries: BufferGeometry[] = [],
    sections: { centre: number; node: Group; crowds: Mesh }[] = [];
  const random = seeded(2116);
  for (let start = 0; start < course.length; start += 96) {
    const node = new Group();
    group.add(node);
    const pos: number[] = [],
      uv: number[] = [],
      idx: number[] = [];
    function finish(material: number) {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(pos, 3));
      geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      geometry.setIndex([...idx]);
      geometries.push(geometry);
      const mesh = new Mesh(geometry, materials[material]!);
      node.add(mesh);
      pos.length = uv.length = idx.length = 0;
      return mesh;
    }
    function indices() {
      const n = pos.length / 3 - 4;
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    function upright(
      d: number,
      lane: number,
      base: number,
      width: number,
      height: number,
      angle: number,
      u1: number,
      u2: number,
      v1 = 0,
      v2 = 1,
    ) {
      const p = course.place(d, lane),
        a = p.heading + angle,
        dx = (Math.cos(a) * width) / 2,
        dz = (-Math.sin(a) * width) / 2,
        y = p.y + base;
      pos.push(
        p.x - dx,
        y,
        p.z - dz,
        p.x + dx,
        y,
        p.z + dz,
        p.x + dx,
        y + height,
        p.z + dz,
        p.x - dx,
        y + height,
        p.z - dz,
      );
      uv.push(u1, v1, u2, v1, u2, v2, u1, v2);
      indices();
    }
    function ground(a: number, b: number, left: number, right: number, mosaic = false) {
      for (const [d, l, u, v] of [
        [a, left, 0, 0],
        [a, right, 1, 0],
        [b, right, 1, 1],
        [b, left, 0, 1],
      ] as const) {
        const p = course.place(d, l);
        pos.push(p.x, p.y + 0.117 - (0.12 * Math.abs(l)) / 7.45 + (mosaic ? 0.024 : 0), p.z);
        uv.push(mosaic ? u : l / 1.52, mosaic ? v : d / 1.52);
      }
      indices();
    }
    const end = Math.min(start + 96, course.length);
    for (let d = start; d < end; d += 3) {
      ground(d, Math.min(end, d + 3), -7.44, 0);
      ground(d, Math.min(end, d + 3), 0, 7.44);
    }
    finish(0);
    for (let d = start; d < end && d < 8560; d += 24) {
      const j = (d + 72) / 24;
      for (const side of [-1, 1]) {
        if (d > 8210 || (side === -1 && ((d > 1370 && d < 1530) || (d > 4660 && d < 4900))))
          continue;
        if (side === 1 && d > 5180 && d < 5530) continue;
        const tile = (j + side + 4) % 4,
          lo = tile / 4,
          hi = lo + 0.25;
        upright(
          d,
          -side * (20 + (j % 5) * 0.42 - 7.72),
          -0.24,
          j % 4 ? 21.7 : 18.5,
          (4 + ((j + side) % 3)) * 3.13 + 1.29,
          Math.PI / 2,
          side > 0 ? hi : lo,
          side > 0 ? lo : hi,
        );
      }
    }
    if (idx.length) finish(1);
    const pitches = [370, 2550, 2660, 4515, 5420, 7340],
      busy = pitches.some((d) => Math.abs(d - start - 48) < 135);
    for (let i = 0; i < (busy ? 47 : 9); i++) {
      const d = start + random() * (end - start),
        side = i % 2 === 0 ? 1 : -1;
      if (Math.abs(d - 2604) < 8 || Math.abs(d - 2654) < 8) continue;
      const tile = Math.floor(random() * 8),
        u = (tile % 4) / 4,
        v = tile < 4 ? 0.5 : 0;
      upright(
        d,
        side * (busy ? 6.5 + random() * 3 : 8 + random() * 2),
        busy ? 0.14 : 0.24,
        2.5,
        1.77 + random() * 0.18,
        side * (0.3 + random() * 0.6),
        u,
        u + 0.25,
        v,
        v + 0.5,
      );
    }
    for (const [d, l] of [
      [2604, 5.35],
      [2654, -5.4],
    ] as const) {
      if (d < start || d >= end) continue;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 7,
          u = (i % 4) / 4,
          v = i < 4 ? 0.5 : 0;
        upright(
          d + 5.3 * Math.cos(a),
          l + Math.sign(l) * 4.7 * Math.sin(a),
          0.18,
          2.1,
          1.82,
          a - Math.PI / 2,
          u,
          u + 0.25,
          v,
          v + 0.5,
        );
      }
    }
    const crowds = finish(2);
    sections.push({ centre: start + 48, node, crowds });
    for (let d = start + 20; d < end; d += busy ? 17 : 61) {
      const side = d % 3 ? 1 : -1;
      upright(d, side * 8.15, 0.41, 2.3, 1.58, side * 0.83, 0, 1);
    }
    if (idx.length) finish(3);
    // Detailed elevations face approaching riders, with the native landmarks behind them on the climb.
    for (const [d, l, width, height, angle, u0, u1, vTop] of [
      [8528, -42, 76, 42, -0.28, 0, 0.426, 0.61],
      [4760, 22.5, 33, 34, 0.12, 0.44, 0.785, 0.94],
      [1429, 20, 22, 40, 0.05, 0.81, 1, 1],
    ] as const) {
      if (d >= start && d < end) upright(d, l, 0.2, width, height, angle, u0, u1, 0, vTop);
    }
    if (idx.length) finish(5);
    // The Esplanade opens out to distant Old Town roofs and the crags. Keep their bearing fixed.
    if (start <= 8520 && end > 8520) {
      upright(course.length + 70, 0, -18, 575, 142, 0, 0, 1);
      upright(8520, 160, -20, 480, 117, Math.PI / 2, 1, 0);
      finish(6);
    }
    if (start <= 5430 && end > 5430) {
      ground(5431, 5435.8, 0.55, 5.35, true);
      finish(4);
    }
  }
  return {
    group,
    spectatorSections: 0,
    at(metres: number) {
      this.spectatorSections = 0;
      for (const section of sections) {
        section.node.visible = Math.abs(section.centre - metres) < 330;
        if (section.node.visible && section.crowds.geometry.index!.count > 0)
          this.spectatorSections++;
      }
    },
    dispose() {
      group.removeFromParent();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}
