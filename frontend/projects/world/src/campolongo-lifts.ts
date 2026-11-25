import type { BufferGeometry } from 'three/webgpu';
import {
  BoxGeometry,
  BufferAttribute,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
  CylinderGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';

/** Collect rigid parts into one draw while preserving their paint. Coordinates are local metres. */
class Parts {
  private readonly pieces: BufferGeometry[] = [];
  private add(source: BufferGeometry, x: number, y: number, z: number, tint: number, tilt = 0) {
    const geom = source.index ? source.toNonIndexed() : source.clone();
    source.dispose();
    geom.rotateZ(tilt);
    geom.translate(x, y, z);
    const color = new Color(tint);
    const rgb = new Float32Array(geom.getAttribute('position').count * 3);
    for (let i = 0; i < rgb.length; i += 3) color.toArray(rgb, i);
    geom.setAttribute('color', new BufferAttribute(rgb, 3));
    this.pieces.push(geom);
  }
  box(x: number, y: number, z: number, w: number, h: number, d: number, c: number, tilt = 0) {
    this.add(new BoxGeometry(w, h, d), x, y, z, c, tilt);
  }
  oval(x: number, y: number, z: number, w: number, h: number, d: number, c: number, tilt = 0) {
    this.add(new SphereGeometry(1, 12, 8).scale(w, h, d), x, y, z, c, tilt);
  }
  finish() {
    const result = mergeGeometries(this.pieces)!;
    for (const part of this.pieces) part.dispose();
    return result;
  }
}

function carrier(enclosed: boolean) {
  const p = new Parts();
  p.box(0, 2.45, 0, 0.12, 1.73, 0.12, 0x595d55);
  p.box(0, 3.32, 0, 0.4, 0.2, 0.25, 0x53594e);
  if (enclosed) {
    p.oval(0, 0.75, 0, 1.17, 1.08, 1.0, 0xd7a536);
    p.box(0, 1.0, 0, 2.03, 1.03, 1.67, 0x52666b);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++)
        p.box(-0.67 + i * 0.66, 1.2, side * 0.85, 0.57, 0.62, 0.055, 0x8badae);
      p.box(side * 1.03, 1.15, 0, 0.06, 0.66, 1.4, 0x829c9f);
    }
    p.oval(0, 1.67, 0, 1.08, 0.22, 0.92, 0xe8be54);
  } else {
    p.box(0, 0.55, 0, 2.1, 0.22, 0.63, 0x385851);
    p.box(0, 0.93, 0.29, 2.1, 0.59, 0.11, 0x416158);
    for (const x of [-0.94, 0.94]) {
      p.box(x, 0.98, 0.28, 0.09, 0.97, 0.095, 0x89908b);
      p.box(x, 1.55, 0, 0.085, 0.085, 0.7, 0x89908b);
      p.box(x, 0.82, -0.25, 0.085, 0.1, 0.58, 0x77817c);
    }
    p.box(0, 1.57, 0.2, 2.0, 0.11, 0.1, 0x7f8b83);
    p.box(0, 0.89, -0.45, 2.0, 0.095, 0.095, 0x8b9289);
  }
  return p.finish();
}

function cowBody() {
  const p = new Parts();
  p.oval(0, 1.06, 0, 1.01, 0.52, 0.43, 0xa46644);
  p.oval(0.3, 1.14, 0, 0.49, 0.46, 0.44, 0xaf714c);
  for (const side of [-1, 1]) {
    p.oval(-0.38, 1.13, side * 0.37, 0.28, 0.31, 0.07, 0xe9dec5);
    for (const end of [-1, 1]) {
      p.oval(end * 0.57, 0.56, side * 0.24, 0.105, 0.41, 0.113, 0xe0cbb4);
      p.box(end * 0.59, 0.08, side * 0.24, 0.16, 0.12, 0.18, 0x514c42);
    }
  }
  p.box(-0.9, 0.84, 0.09, 0.065, 0.59, 0.07, 0x8d6446, -0.19);
  return p.finish();
}
function cowHead() {
  const p = new Parts();
  p.oval(0.22, -0.04, 0, 0.38, 0.31, 0.26, 0xa3694a);
  p.oval(0.49, -0.12, 0, 0.25, 0.24, 0.21, 0xe4d5bd);
  p.oval(0.67, -0.24, 0, 0.18, 0.13, 0.18, 0xbd9989);
  for (const side of [-1, 1]) {
    p.oval(0.24, 0.12, side * 0.23, 0.14, 0.061, 0.11, 0xb48364);
    p.oval(0.47, -0.03, side * 0.202, 0.03, 0.034, 0.025, 0x332f29);
    p.oval(0.27, 0.2, side * 0.16, 0.039, 0.095, 0.046, 0xe0d6b9);
  }
  return p.finish();
}

interface Lift {
  readonly start: Vector3;
  readonly end: Vector3;
  readonly offset: Vector3;
  readonly chairs: Mesh[];
}

/** Fixed towers and sagging wire share their endpoints with each moving carrier. */
export class CampolongoLifts {
  readonly root = new Group();
  private readonly paint = new MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
  private readonly steel = new MeshStandardMaterial({ color: 0x6e7770, roughness: 0.72 });
  private readonly wire = new MeshStandardMaterial({ color: 0x444b46 });
  private readonly pole = new CylinderGeometry(1, 1, 1, 7);
  private readonly seat = carrier(false);
  private readonly cabin = carrier(true);
  private readonly body = cowBody();
  private readonly head = cowHead();
  private readonly heads: Mesh[] = [];
  private readonly lines: Lift[] = [];
  private readonly point = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  chairDistance = 0;
  get cowPitch() {
    return this.heads[0]!.rotation.z;
  }
  constructor(course: Course) {
    for (const [station, enclosed] of [
      [5180, false],
      [6180, true],
    ] as const) {
      const a = course.place(station - 32, 47),
        b = course.place(station + 36, -57);
      const start = new Vector3(a.x, a.y + 5.9, a.z),
        end = new Vector3(b.x, b.y + 25.5, b.z);
      const offset = end.clone().sub(start).cross(this.up).normalize().multiplyScalar(1.5);
      const chairs = Array.from(
        { length: enclosed ? 6 : 12 },
        () => new Mesh(enclosed ? this.cabin : this.seat, this.paint),
      );
      const line = { start, end, offset, chairs };
      this.lines.push(line);
      for (const u of [0, 0.52, 1]) {
        const top = this.onLine(line, u, 0, new Vector3());
        const bottom = top.clone();
        bottom.y -= u < 0.1 ? 28 : 35;
        this.strut(bottom, top, 0.34, this.steel);
        this.strut(
          top.clone().addScaledVector(offset, -1.3),
          top.clone().addScaledVector(offset, 1.3),
          0.22,
          this.steel,
        );
      }
      for (const side of [-1, 1]) {
        let prev = this.onLine(line, 0, side, new Vector3());
        for (let i = 1; i <= 24; i++) {
          const next = this.onLine(line, i / 24, side, new Vector3());
          this.strut(prev, next, 0.052, this.wire);
          prev = next;
        }
      }
      this.root.add(...chairs);
    }
    for (const [i, d] of [6455, 6466, 6481, 6512, 6550, 6762].entries()) {
      const l = 9.8 + (i % 3) * 2.1,
        at = course.place(d, l);
      const animal = new Group();
      // The near edge of the fenced meadow follows the road, then falls away with the slope.
      const w = Math.min(1, Math.max(0, (l - 4.55) / (17 - 4.55))),
        blend = w * w * (3 - 2 * w);
      animal.position.set(
        at.x,
        at.y - 0.17 + blend * (-0.18 * l + 2.5 * Math.sin(d / 168 - l / 55)),
        at.z,
      );
      animal.rotation.y = at.heading + 0.63 + i * 0.52;
      const head = new Mesh(this.head, this.paint);
      head.position.set(0.67, 1.2, 0);
      animal.add(new Mesh(this.body, this.paint), head);
      this.heads.push(head);
      this.root.add(animal);
    }
    this.update(0);
  }
  private strut(a: Vector3, b: Vector3, radius: number, mat: MeshStandardMaterial) {
    const mesh = new Mesh(this.pole, mat),
      axis = b.clone().sub(a);
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.scale.set(radius, axis.length(), radius);
    mesh.quaternion.setFromUnitVectors(this.up, axis.normalize());
    this.root.add(mesh);
  }
  private onLine(l: Lift, u: number, side: number, out: Vector3) {
    const local = u <= 0.52 ? u / 0.52 : (u - 0.52) / 0.48;
    out.copy(l.start).lerp(l.end, u).addScaledVector(l.offset, side);
    out.y -= 2.75 * local * (1 - local);
    return out;
  }
  update(t: number) {
    for (const [j, line] of this.lines.entries()) {
      for (const [i, chair] of line.chairs.entries()) {
        const phase = (t * (j ? 0.018 : 0.026) + (i * 2) / line.chairs.length) % 2;
        const u = phase <= 1 ? phase : 2 - phase,
          side = phase <= 1 ? 1 : -1;
        chair.position.copy(this.onLine(line, u, side, this.point));
        chair.position.y -= 3.32;
        chair.rotation.y =
          Math.atan2(line.end.x - line.start.x, line.end.z - line.start.z) +
          (side > 0 ? 0 : Math.PI);
        chair.rotation.z = 0.017 * Math.sin(t * 0.75 + i * 0.32);
        if (!j && !i) this.chairDistance = chair.position.x;
      }
    }
    this.heads.forEach((h, i) => {
      h.rotation.z = -0.67 + 0.29 * Math.sin(t * 0.72 + i * 1.7);
    });
  }
  dispose() {
    this.root.clear();
    for (const g of [this.pole, this.seat, this.cabin, this.body, this.head]) g.dispose();
    this.paint.dispose();
    this.steel.dispose();
    this.wire.dispose();
  }
}
