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

/** Paint a bicycle stencil like the crossing markings in the Copenhagen reference photos. */
function stencil(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 192;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#ebe9de';
  g.fillStyle = '#ebe9de';
  g.lineWidth = 6;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (const x of [51, 141]) {
    g.beginPath();
    g.arc(x, 116, 25, 0, Math.PI * 2);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(51, 116);
  g.lineTo(76, 72);
  g.lineTo(94, 116);
  g.closePath();
  g.lineTo(123, 77);
  g.lineTo(141, 116);
  g.moveTo(76, 72);
  g.lineTo(123, 77);
  g.lineTo(117, 63);
  g.lineTo(130, 63);
  g.moveTo(76, 72);
  g.lineTo(73, 65);
  g.moveTo(64, 65);
  g.lineTo(80, 65);
  g.stroke();
  g.beginPath();
  g.moveTo(76, 35);
  g.lineTo(96, 14);
  g.lineTo(116, 35);
  g.lineTo(102, 32);
  g.lineTo(102, 48);
  g.lineTo(90, 48);
  g.lineTo(90, 32);
  g.closePath();
  g.fill();
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

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
    g.fillStyle = rnd() < 0.52 ? 'rgba(40,45,49,.24)' : 'rgba(226,218,200,.27)';
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
  const texture = new CanvasTexture(c);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 4;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export class CopenhagenTrack {
  private readonly meshes: Mesh<BufferGeometry, MeshBasicMaterial>[] = [];
  constructor(course: Course, scene: Scene) {
    for (const markings of [false, true]) {
      const p: number[] = [],
        uv: number[] = [],
        indices: number[] = [];
      function quad(d: number, end: number, right: number, left: number) {
        const n = p.length / 3;
        for (const [station, side, u, v] of [
          [d, left, 0, 0],
          [d, right, 1, 0],
          [end, left, 0, 1],
          [end, right, 1, 1],
        ] as const) {
          const at = course.place(station, side);
          p.push(at.x, at.y + (markings ? 0.038 : 0.022), at.z);
          uv.push(markings ? u : side / 2.1, markings ? v : station / 2.1);
        }
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
      if (markings) {
        for (let d = 42; d < course.end; d += 65) {
          quad(d, d + 2.3, 2.12, 0.46);
          quad(d + 2.3, d, -2.12, -0.46);
        }
      } else {
        for (let d = -40; d < course.end + 40; d += 4) quad(d, d + 4, 2.835, -2.835);
      }
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(p, 3));
      g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      g.setIndex(indices);
      const m = new MeshBasicMaterial({
        map: markings ? stencil() : grit(),
        transparent: true,
        depthWrite: false,
      });
      const mesh = new Mesh(g, m);
      mesh.renderOrder = markings ? 2 : 1;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
  }
  dispose(): void {
    for (const mesh of this.meshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
  }
}
