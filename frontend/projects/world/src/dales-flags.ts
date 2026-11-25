import { dalesPaint } from './dales-paint';
import { dalesRoad } from './dales-road';
import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  type Scene,
} from 'three/webgpu';
import type { Course } from './course';

/** The five-petalled white Yorkshire rose, painted on both faces of each blue flag. */
function rose() {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 128;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#397a9d';
  g.fillRect(0, 0, 192, 128);
  g.translate(96, 64);
  for (let i = 0; i < 5; i++) {
    g.save();
    g.rotate((i * Math.PI * 2) / 5);
    g.fillStyle = '#70874b';
    g.beginPath();
    g.moveTo(0, -51);
    g.lineTo(12, -20);
    g.lineTo(-12, -20);
    g.closePath();
    g.fill();
    g.rotate(Math.PI / 5);
    g.fillStyle = '#eee9d8';
    g.beginPath();
    g.moveTo(0, -9);
    g.bezierCurveTo(-27, -23, -26, -53, -4, -43);
    g.bezierCurveTo(8, -60, 30, -37, 15, -21);
    g.closePath();
    g.fill();
    g.strokeStyle = '#b2aa91';
    g.lineWidth = 2;
    g.stroke();
    g.restore();
  }
  g.fillStyle = '#ccac52';
  g.beginPath();
  g.arc(0, 0, 10, 0, Math.PI * 2);
  g.fill();
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}
export class DalesFlags {
  private readonly signs;
  private readonly asphalt;
  private readonly root = new Group();
  private readonly texture = rose();
  private readonly material = new MeshBasicMaterial({ map: this.texture, side: DoubleSide });
  private readonly flags;
  constructor(course: Course, scene: Scene) {
    this.signs = dalesPaint(course, scene);
    this.asphalt = dalesRoad(course, scene);
    const stations = [
      38, 91, 137, 199, 8730, 8795, 8860, 8904, 8948, 8997, 9033, 9072, 9111, 9135, 9154, 9176,
      9198, 9223, 9250, 9286, 9327, 9370, 13175, 22856, 22927,
    ];
    this.flags = stations.map((station, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const p = course.place(station, side * (3.65 + (i % 3) * 0.19));
      const geometry = new BufferGeometry(),
        xyz: number[] = [],
        uv: number[] = [],
        idx: number[] = [];
      for (let j = 0; j <= 8; j++) {
        const x = j / 8;
        xyz.push(1.25 * x, -0.77, 0, 1.25 * x, 0, 0);
        uv.push(x, 0, x, 1);
        if (j < 8) {
          const n = 2 * j;
          idx.push(n, n + 2, n + 1, n + 2, n + 3, n + 1);
        }
      }
      geometry.setAttribute('position', new Float32BufferAttribute(xyz, 3));
      geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
      geometry.setIndex(idx);
      const mesh = new Mesh(geometry, this.material);
      mesh.position.set(p.x, p.y + 3.05, p.z);
      mesh.rotation.y = p.heading + 0.54 * side;
      this.root.add(mesh);
      return { station, mesh };
    });
    scene.add(this.root);
  }
  get tip() {
    const flag = this.flags.find((f) => f.mesh.visible);
    return flag?.mesh.geometry.getAttribute('position').getZ(16) ?? null;
  }
  update(seconds: number, metres: number) {
    for (const [i, flag] of this.flags.entries()) {
      flag.mesh.visible = Math.abs(flag.station - metres) < 140;
      if (!flag.mesh.visible) continue;
      const attr = flag.mesh.geometry.getAttribute('position');
      for (let j = 0; j <= 8; j++) {
        const u = j / 8;
        const sway =
          u *
          (0.14 * Math.sin(seconds * 3.1 - u * 5.1 + i) + 0.065 * Math.sin(seconds * 2.18 - u * 8));
        attr.setZ(j * 2, sway);
        attr.setZ(j * 2 + 1, sway * 0.83);
      }
      attr.needsUpdate = true;
    }
  }
  dispose() {
    this.asphalt.dispose();
    this.signs.dispose();
    this.root.removeFromParent();
    for (const f of this.flags) f.mesh.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
