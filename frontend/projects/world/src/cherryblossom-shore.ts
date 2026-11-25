import {
  BufferGeometry,
  CanvasTexture,
  RepeatWrapping,
  MeshStandardNodeMaterial,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import { positionWorld, texture } from 'three/tsl';
import type { Course } from './course';
import { seeded } from './world-kit';

/** Batches the Yoshino branches and strolling visitors by short sections of the promenade. */
export async function blossomShore(course: Course) {
  const atlas = await new TextureLoader().loadAsync('courses/cherryblossom-shore.webp');
  atlas.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({
    map: atlas,
    alphaTest: 0.46,
    side: DoubleSide,
    vertexColors: true,
  });
  const root = new Group(),
    chunks: BufferGeometry[] = [];
  const rng = seeded(2097),
    tint = new Color();
  const lap = course.length / 5;
  for (let section = 0; section < lap; section += 135) {
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
    for (let d = section; d < Math.min(lap, section + 135); d += 9) {
      const memorialSteps = d > 500 && d < 845;
      const boatLanding = d > 950 && d < 1510;
      const festival = d > 1910 && d < 2330;
      const tile = rng() < 0.5 ? 0 : 1;
      const high = 7.4 + rng() * 2.2;
      const mall = d > 2710 && d < 3140;
      if (!memorialSteps && !festival && !mall) {
        for (const yaw of [0.32, 1.83])
          panel(d, 6.1 + rng() * 1.2, yaw, high * 1.65, high, tile, 0xf2e5e2);
      }
      if (!boatLanding && d % 54 < 32 && !festival && !memorialSteps && !mall) {
        for (const yaw of [0.16, 1.71])
          panel(d + 3, -5.7, yaw, high * 1.45, high * 0.91, 1 - tile, 0xfcece6);
      }
      if (rng() < (festival || boatLanding ? 0.93 : 0.41)) {
        panel(
          d + 2,
          rng() < 0.46 ? -5.1 : 5.2,
          0.72 + (rng() - 0.5) * 1.3,
          3.25,
          1.68 + rng() * 0.23,
          2 + Math.floor(rng() * 2),
          0xe2dada,
        );
      }
    }
    if (!pos.length) continue;
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new Float32BufferAttribute(colour, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    chunks.push(g);
    root.add(new Mesh(g, material));
  }
  return {
    root,
    dispose() {
      root.clear();
      for (const g of chunks) g.dispose();
      material.dispose();
      atlas.dispose();
    },
  };
}

/** Granite aggregate, staggered joints and fallen petals in a four-metre repeat. */
export function promenadeSurface() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const g = canvas.getContext('2d')!;
  const random = seeded(1943);
  g.fillStyle = '#877e78';
  g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) {
    for (let column = -1; column < 5; column++) {
      const x = column * 128 + (row % 2) * 64,
        y = row * 64;
      const grey = Math.floor(155 + 10 * random());
      g.fillStyle = 'rgb(' + grey + ',' + (grey - 4) + ',' + (grey - 7) + ')';
      g.fillRect(x + 0.9, y + 0.9, 126.4, 62.5);
      g.fillStyle = 'rgba(246,234,216,.23)';
      g.fillRect(x + 2, y + 1.6, 124, 1.3);
    }
  }
  for (let i = 0; i < 23000; i++) {
    g.fillStyle = i % 3 ? 'rgba(68,60,59,.21)' : 'rgba(255,250,234,.45)';
    g.fillRect(random() * 512, random() * 512, 1 + random(), 0.8 + random());
  }
  for (let i = 0; i < 64; i++) {
    g.fillStyle = i % 3 ? '#ecd5cc' : '#d4a8b1';
    g.beginPath();
    g.ellipse(random() * 512, random() * 512, 1.8, 1.1, random() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const tile = new CanvasTexture(canvas);
  tile.colorSpace = SRGBColorSpace;
  tile.wrapS = tile.wrapT = RepeatWrapping;
  tile.anisotropy = 8;
  const material = new MeshStandardNodeMaterial({ roughness: 0.94 });
  material.colorNode = texture(tile, positionWorld.xz.mul(0.25)).rgb;
  return { tile, material };
}
