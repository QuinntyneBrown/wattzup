import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Scene,
} from 'three/webgpu';
import type { Course } from './course';

function grit(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  let seed = 607;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let n = 0; n < 13000; n++) {
    g.fillStyle = rnd() < 0.52 ? 'rgba(40,45,49,.17)' : 'rgba(226,218,200,.19)';
    g.fillRect(rnd() * 256, rnd() * 256, 0.4 + 1.6 * rnd(), 0.45 + 1.4 * rnd());
  }
  for (let n = 0; n < 4; n++) {
    const x = rnd() * 256,
      y = rnd() * 256;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 5, y + 5);
    g.lineTo(x + 4, y + 8);
    g.lineTo(x + 11, y + 15);
    g.strokeStyle = 'rgba(35,39,40,.17)';
    g.lineWidth = 0.8;
    g.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x = rnd() * 256,
      y = rnd() * 256;
    const gradient = g.createRadialGradient(x, y, 0, x, y, 19);
    gradient.addColorStop(0, 'rgba(140,166,168,.29)');
    gradient.addColorStop(1, 'rgba(140,166,168,0)');
    g.save();
    g.translate(0, y * 0.68);
    g.scale(1, 0.32);
    g.fillStyle = gradient;
    g.fillRect(x - 19, y - 19, 38, 38);
    g.restore();
  }
  const texture = new CanvasTexture(c);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 4;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** One overlay for the physical circuit, shared by all three laps. */
export function harbourAsphalt(course: Course, scene: Scene) {
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let d = 0; d <= 2400; d += 4) {
    for (const lane of [-2.73, 2.73]) {
      const p = course.place(d, lane);
      positions.push(p.x, p.y + 0.027, p.z);
      uv.push(lane / 2.8, d / 2.8);
    }
    if (d === 2400) break;
    const n = d / 2;
    indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  const texture = grit();
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);
  return {
    dispose() {
      mesh.removeFromParent();
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
