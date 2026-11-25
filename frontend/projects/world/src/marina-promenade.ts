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
  RepeatWrapping,
  TextureLoader,
} from 'three/webgpu';
import type { Course } from './course';
import { seeded } from './world-kit';

function sponsorBoard() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const c = canvas.getContext('2d')!;
  for (const [i, [name, fill, ink]] of [
    ['DUBAI MARINA', '#183342', '#efce83'],
    ['MARINA WALK', '#24664c', '#fff7d6'],
    ['SPRINT', '#ece7d9', '#232331'],
  ].entries()) {
    c.fillStyle = fill!;
    c.fillRect(0, i * 128, 768, 128);
    c.fillStyle = ink!;
    c.font = 'bold 74px sans-serif';
    c.textAlign = 'center';
    c.fillText(name!, 384, i * 128 + 90, 690);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}
export async function marinaPromenade(course: Course) {
  const crowdMap = await new TextureLoader().loadAsync('courses/dubai-spectators.webp');
  crowdMap.colorSpace = SRGBColorSpace;
  const loader = new TextureLoader();
  const pavingMap = await loader
    .loadAsync('courses/dubai-limestone.webp')
    .catch((error: unknown) => {
      crowdMap.dispose();
      throw error;
    });
  const shopMap = await loader.loadAsync('courses/dubai-cafes.webp').catch((error: unknown) => {
    crowdMap.dispose();
    pavingMap.dispose();
    throw error;
  });
  pavingMap.colorSpace = shopMap.colorSpace = SRGBColorSpace;
  pavingMap.wrapS = pavingMap.wrapT = RepeatWrapping;
  pavingMap.anisotropy = 4;
  const paving = new MeshBasicMaterial({ map: pavingMap, side: DoubleSide, color: 0xcbada3 });
  const shops = new MeshBasicMaterial({ map: shopMap, side: DoubleSide, color: 0xffe2cc });
  const board = sponsorBoard();
  const people = new MeshBasicMaterial({
    map: crowdMap,
    alphaTest: 0.46,
    side: DoubleSide,
    color: 0xf1d1be,
  });
  const panels = new MeshBasicMaterial({ map: board, side: DoubleSide });
  const silk = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  const lights = new MeshBasicMaterial({
    vertexColors: true,
    side: DoubleSide,
    transparent: true,
    opacity: 0.49,
    depthWrite: false,
    toneMapped: false,
  });
  const shapes: BufferGeometry[] = [];
  const group = new Group();
  const rng = seeded(2115);
  const tint = new Color();
  for (let start = 0; start < course.length; start += 108) {
    const section = new Group();
    section.userData['at'] = start + 54;
    group.add(section);
    const pos: number[] = [],
      uv: number[] = [],
      col: number[] = [],
      idx: number[] = [];
    function finish(material: MeshBasicMaterial) {
      if (!idx.length) return;
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(pos, 3));
      if (uv.length) g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      if (col.length) g.setAttribute('color', new Float32BufferAttribute(col, 3));
      g.setIndex([...idx]);
      shapes.push(g);
      section.add(new Mesh(g, material));
      pos.length = uv.length = col.length = idx.length = 0;
    }
    // Four metres per texture repeat keeps the limestone joints in physical scale through bends.
    for (let d = start; d < Math.min(start + 108, course.length); d += 4) {
      const end = Math.min(d + 4, course.length);
      for (const [left, right] of [
        [-11.75, -5.71],
        [-5.36, 5.36],
        [5.71, 18.65],
      ] as const) {
        const n = pos.length / 3;
        for (const [m, l] of [
          [d, left],
          [d, right],
          [end, right],
          [end, left],
        ] as const) {
          const p = course.place(m, l);
          pos.push(p.x, p.y + 0.044, p.z);
          uv.push(l / 4, m / 4);
        }
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      }
    }
    finish(paving);
    for (let j = Math.max(0, Math.ceil((start + 36) / 39)); j * 39 - 36 < start + 108; j++) {
      const d = j * 39 - 36,
        at = course.place(d, 16.84);
      const dx = -Math.sin(at.heading) * 17.1,
        dz = -Math.cos(at.heading) * 17.1;
      const n = pos.length / 3,
        y = at.y + 0.09;
      pos.push(
        at.x - dx,
        y,
        at.z - dz,
        at.x + dx,
        y,
        at.z + dz,
        at.x + dx,
        y + 7.44,
        at.z + dz,
        at.x - dx,
        y + 7.44,
        at.z - dz,
      );
      const u = (j % 4) / 4;
      uv.push(u + 0.25, 0, u, 0, u, 1, u + 0.25, 1);
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    finish(shops);
    const busy = start < 490 || Math.abs(start - 3440) < 420 || start > 7850;
    for (let j = 0; j < (busy ? 46 : 17); j++) {
      const d = start + rng() * 107;
      const bank = j % 5 === 0 ? -1 : 1;
      const lane = bank * (bank === 1 ? 5.2 + rng() * 1.8 : 5.1 + rng() * 1.2);
      const p = course.place(d, lane),
        a = p.heading + (bank > 0 ? 1 : -1) * (0.5 + rng() * 0.6);
      const half = 1.25 + rng() * 0.18,
        dx = Math.cos(a) * half,
        dz = -Math.sin(a) * half,
        y = p.y + 0.03;
      const n = pos.length / 3,
        h = 1.69 + rng() * 0.27;
      pos.push(
        p.x - dx,
        y,
        p.z - dz,
        p.x + dx,
        y,
        p.z + dz,
        p.x + dx,
        y + h,
        p.z + dz,
        p.x - dx,
        y + h,
        p.z - dz,
      );
      const tile = Math.floor(rng() * 8),
        u = (tile % 4) / 4,
        v = tile < 4 ? 0.5 : 0;
      uv.push(u, v, u + 0.25, v, u + 0.25, v + 0.5, u, v + 0.5);
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    finish(people);
    for (let j = 0; j < 18; j++) {
      const d = start + j * 6;
      for (const side of [-1, 1]) {
        if (side < 0 && !busy && j % 6 > 1) continue;
        const a = course.place(d, side * 4.48),
          b = course.place(d + 5.82, side * 4.48),
          n = pos.length / 3;
        pos.push(
          a.x,
          a.y + 0.22,
          a.z,
          b.x,
          b.y + 0.22,
          b.z,
          b.x,
          b.y + 1.08,
          b.z,
          a.x,
          a.y + 1.08,
          a.z,
        );
        const v = 1 - ((j % 3) + 1) / 3;
        const u = side > 0 ? 1 : 0;
        uv.push(u, v, 1 - u, v, 1 - u, v + 1 / 3, u, v + 1 / 3);
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      }
    }
    finish(panels);
    // The class's UAE-coloured bunting spans the sprint enclosure, leaving the ordinary quay open.
    if (busy)
      for (let j = 0; j < 4; j++) {
        const d = start + 8 + j * 27;
        for (let flag = 0; flag < 22; flag++) {
          const lane = -8 + flag * 0.72,
            a = course.place(d, lane),
            b = course.place(d, lane + 0.6);
          const y = a.y + 5.8 + Math.abs(lane) * 0.09,
            n = pos.length / 3;
          pos.push(a.x, y, a.z, b.x, y, b.z, (a.x + b.x) / 2, y - 0.62, (a.z + b.z) / 2 + 0.12);
          tint.setHex([0x226943, 0xe2e2d3, 0xc73c3a, 0x32323e][flag % 4]!);
          for (let v = 0; v < 3; v++) col.push(tint.r, tint.g, tint.b);
          idx.push(n, n + 1, n + 2);
        }
      }
    finish(silk);
    // Reflected deck lights form broken strips, anchored to the same mooring fingers as the yachts.
    for (let d = Math.ceil(start / 86) * 86 + 36; d < start + 108; d += 86) {
      for (let i = 0; i < 32; i++) {
        const a = course.place(d + (rng() - 0.5) * 1.7, -16 - rng() * 31);
        const n = pos.length / 3,
          w = 0.25 + rng() * 1.4,
          h = 0.06 + rng() * 0.28;
        pos.push(
          a.x - w,
          0.39,
          a.z - h,
          a.x + w,
          0.39,
          a.z - h,
          a.x + w,
          0.39,
          a.z + h,
          a.x - w,
          0.39,
          a.z + h,
        );
        tint.setHex(i % 3 ? 0xe6b16e : 0x96b9ce);
        for (let v = 0; v < 4; v++) col.push(tint.r, tint.g, tint.b);
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      }
    }
    finish(lights);
  }
  let last = -Infinity;
  return {
    group,
    follow(d: number, time: number) {
      lights.opacity = 0.44 + 0.075 * Math.sin(time * 1.9);
      if (Math.abs(d - last) < 18) return;
      last = d;
      for (const section of group.children) {
        const delta = Math.abs(Number(section.userData['at']) - d);
        section.visible = Math.min(delta, course.length - delta) < 390;
      }
    },
    dispose() {
      group.removeFromParent();
      shapes.forEach((g) => g.dispose());
      crowdMap.dispose();
      board.dispose();
      paving.dispose();
      shops.dispose();
      pavingMap.dispose();
      shopMap.dispose();
      people.dispose();
      panels.dispose();
      silk.dispose();
      lights.dispose();
    },
  };
}
