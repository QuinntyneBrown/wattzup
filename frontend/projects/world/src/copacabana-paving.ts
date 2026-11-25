import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  RepeatWrapping,
  type Scene,
  SRGBColorSpace,
} from 'three/webgpu';
import type { Course } from './course';

/** Original stone joints for the calçadão and wear for the red cycle lane, sized in metres. */
function surface(stone: boolean): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const g = canvas.getContext('2d')!;
  let seed = 47381;
  function random(): number {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  if (stone) {
    for (let row = -1; row < 20; row++) {
      const y = row * 13;
      let x = -18 + random() * 10;
      while (x < 256) {
        const w = 10 + random() * 9;
        g.beginPath();
        g.moveTo(x + 1, y + 1);
        g.lineTo(x + w - 1, y + 0.6);
        g.lineTo(x + w - 1.2, y + 9 + random() * 2);
        g.lineTo(x + w - 3, y + 12);
        g.lineTo(x + 1, y + 11.6);
        g.closePath();
        g.fillStyle = random() > 0.51 ? 'rgba(251,239,210,0.10)' : 'rgba(42,40,35,0.08)';
        g.fill();
        g.lineWidth = 1.15;
        g.strokeStyle = 'rgba(69,61,50,0.35)';
        g.stroke();
        x += w;
      }
    }
  }
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = random() > 0.49 ? 'rgba(53,46,43,0.18)' : 'rgba(244,218,190,0.20)';
    g.fillRect(random() * 256, random() * 256, random() * 1.7 + 0.4, random() * 1.1 + 0.5);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export class CopacabanaPaving {
  private readonly strips: Mesh<BufferGeometry, MeshBasicMaterial>[] = [];

  constructor(course: Course, scene: Scene) {
    for (const [left, right, stone, lift] of [
      [2.71, 13.17, true, 0.044],
      [-2.69, 2.69, false, 0.016],
    ] as const) {
      const points: number[] = [],
        uv: number[] = [],
        faces: number[] = [];
      const tile = stone ? 2.1 : 2.8;
      for (let i = 0; i <= Math.ceil((course.end + 100) / 4); i++) {
        const d = i * 4 - 50;
        for (const side of [left, right]) {
          const at = course.place(d, side);
          points.push(at.x, at.y + lift, at.z);
          uv.push(side / tile, d / tile);
        }
        if (i) {
          const a = (i - 1) * 2;
          faces.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geo = new BufferGeometry();
      geo.setAttribute('position', new Float32BufferAttribute(points, 3));
      geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      geo.setIndex(faces);
      const mat = new MeshBasicMaterial({
        map: surface(stone),
        transparent: true,
        depthWrite: false,
      });
      const mesh = new Mesh(geo, mat);
      scene.add(mesh);
      this.strips.push(mesh);
    }
  }

  dispose(): void {
    for (const mesh of this.strips) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
  }
}
