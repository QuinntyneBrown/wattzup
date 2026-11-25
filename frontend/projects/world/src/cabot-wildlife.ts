import type { BufferGeometry } from 'three/webgpu';
import {
  BoxGeometry,
  BufferAttribute,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
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

function bullBody() {
  const p = new Parts();
  p.oval(-0.12, 1.45, 0, 1.01, 0.51, 0.38, 0x574536);
  p.oval(0.4, 1.74, 0, 0.58, 0.49, 0.4, 0x4e4034, 0.25);
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const z = side * 0.225,
        x = end * 0.62 + side * 0.08;
      p.oval(x, 0.94, z, 0.14, 0.46, 0.12, 0x58483a, -end * 0.12);
      p.oval(x + end * 0.08, 0.4, z, 0.075, 0.38, 0.074, 0x897968, end * 0.11);
      p.oval(x + end * 0.07 + 0.04, 0.075, z, 0.12, 0.076, 0.082, 0x403b34);
    }
  }
  p.oval(-1.01, 1.45, 0, 0.15, 0.22, 0.11, 0x403a32, 0.26);
  return p.finish();
}

function bullHead() {
  const p = new Parts();
  p.oval(0.23, -0.13, 0, 0.49, 0.31, 0.29, 0x554338, -0.35);
  p.oval(0.67, -0.29, 0, 0.37, 0.23, 0.21, 0x695343, -0.32);
  p.oval(0.91, -0.39, 0, 0.21, 0.18, 0.2, 0x775f4c);
  p.oval(0.46, -0.44, 0, 0.09, 0.22, 0.07, 0x483a31);
  for (const side of [-1, 1]) {
    p.oval(0.4, 0.1, side * 0.23, 0.16, 0.09, 0.12, 0x695344, 0.55);
    p.oval(0.69, -0.2, side * 0.186, 0.038, 0.04, 0.027, 0x242320);
    p.oval(0.39, 0.21, side * 0.31, 0.12, 0.2, 0.1, 0x9b805f);
    p.oval(0.36, 0.36, side * 0.47, 0.25, 0.11, 0.19, 0xb09976);
    for (let i = 0; i < 4; i++)
      p.oval(
        0.17 + i * 0.12,
        0.47 + i * 0.011,
        side * (0.54 + 0.025 * i),
        0.038,
        0.14,
        0.037,
        0xbba787,
        i * 0.1,
      );
  }
  return p.finish();
}

function fishingBoat() {
  const p = new Parts();
  // Rounded hull below the deck, flared bow, forward pilothouse and open working stern.
  p.oval(0, 0.22, 0, 6.55, 1.27, 2.12, 0x963f33);
  p.oval(0.07, 0.66, 0, 6.51, 0.97, 2.16, 0xe1dcc5);
  p.oval(5.27, 1.12, 0, 1.55, 0.63, 1.0, 0xe1dcc5, 0.21);
  p.box(-0.38, 1.3, 0, 8.72, 0.21, 3.56, 0x987651);
  p.box(1.49, 2.08, 0, 3.09, 1.74, 2.91, 0xe1decb);
  p.box(1.43, 3.05, 0, 3.56, 0.22, 3.16, 0xccba9c);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++)
      p.box(0.55 + i * 0.87, 2.45, side * 1.47, 0.68, 0.68, 0.065, 0x405b62);
    p.box(-2.6, 1.66, side * 1.67, 4.72, 0.52, 0.14, 0xc9c3aa);
    for (let i = 0; i < 3; i++)
      p.box(-3.75 + i * 0.95, 1.66, side * 0.75, 0.77, 0.55, 1.13, 0x9b793f);
  }
  p.box(2.99, 2.46, 0, 0.12, 0.69, 2.32, 0x465f67);
  p.box(0.46, 4.1, 0, 0.1, 2.2, 0.1, 0x746756);
  p.box(0.46, 4.58, 0, 0.12, 0.09, 1.28, 0xd2c5a9);
  p.oval(-10.0, 0.38, -0.53, 1.86, 0.43, 0.71, 0xd5cbb4);
  p.oval(-10.0, 0.54, -0.53, 1.51, 0.27, 0.5, 0x8d826a);
  p.box(-7.4, 0.55, -0.33, 2.75, 0.032, 0.032, 0x8d7958);
  return p.finish();
}

export class CabotWildlife {
  readonly root = new Group();
  private readonly material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.84 });
  private readonly body = bullBody();
  private readonly head = bullHead();
  private readonly hull = fishingBoat();
  private readonly heads: Mesh[] = [];
  private readonly boats: Mesh[] = [];
  private readonly seaLevel: number;
  get moosePitch() {
    return this.heads[0]!.rotation.z;
  }
  get boatHeel() {
    return this.boats[1]!.rotation.z;
  }
  constructor(course: Course) {
    // Blender elevations survive export in the course's Y coordinates.
    this.seaLevel = course.place(0).y - 9;
    for (const [d, lane] of [
      [10483, 7.3],
      [10502, 9.8],
      [10975, 8.4],
    ] as const) {
      const pos = course.place(d, lane),
        animal = new Group();
      animal.position.set(
        pos.x,
        pos.y - (lane - 5) * (0.36 + 0.13 * Math.cos(d / 370)) - 0.15,
        pos.z,
      );
      animal.rotation.y = pos.heading + 1.2 + lane * 0.13;
      const head = new Mesh(this.head, this.material);
      head.position.set(0.5, 1.76, 0);
      animal.add(new Mesh(this.body, this.material), head);
      this.heads.push(head);
      this.root.add(animal);
    }
    for (const [d, lane] of [
      [247, 86],
      [24512, 92],
      [24549, 105],
    ] as const) {
      const pos = course.place(d, lane),
        boat = new Mesh(this.hull, this.material);
      boat.position.set(pos.x, this.seaLevel + 0.16, pos.z);
      boat.rotation.y = pos.heading + Math.PI * 0.52;
      this.boats.push(boat);
      this.root.add(boat);
    }
    this.update(0);
  }
  update(t: number) {
    this.heads.forEach((h, i) => {
      h.rotation.z = -0.68 + 0.3 * Math.sin(0.74 * t + i * 1.9);
    });
    this.boats.forEach((b, i) => {
      b.rotation.z = 0.053 * Math.sin(0.91 * t + i * 0.62);
      b.rotation.x = 0.041 * Math.cos(0.71 * t + i * 0.78);
      b.position.y = this.seaLevel + 0.21 + 0.16 * Math.sin(1.19 * t + i);
    });
  }
  dispose() {
    this.root.clear();
    this.body.dispose();
    this.head.dispose();
    this.hull.dispose();
    this.material.dispose();
  }
}
