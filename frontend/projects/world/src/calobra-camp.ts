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
import type { CourseCyclistKit, RiderModel } from './course-cyclist';
import type { RiderBatch } from './rider-batch';

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

/** Local axes match the course cyclist, with the front facing -Z. */
function coachBody() {
  const p = new Parts();
  p.box(0, 1.59, 0, 2.29, 2.13, 9.42, 0xdedbc8);
  p.box(0, 2.89, -0.14, 2.2, 0.62, 8.93, 0xe4e2d4);
  p.box(0, 2.2, -4.72, 2.09, 1.25, 0.1, 0x3c5663);
  p.box(0, 0.96, -4.72, 1.24, 0.24, 0.11, 0x636865);
  p.box(0, 3.28, 0.35, 1.67, 0.22, 3.8, 0xc2bfb1);
  for (const side of [-1, 1]) {
    p.box(side * 1.155, 1.19, 0.05, 0.045, 0.22, 9.08, 0x466c7c);
    for (let j = 0; j < 8; j++)
      p.box(side * 1.153, 2.34, -3.92 + j * 1.06, 0.048, 0.83, 0.9, 0x405a65);
    for (const z of [-3.2, 3.05]) {
      p.oval(side * 1.07, 0.52, z, 0.19, 0.51, 0.52, 0x282b2b);
      p.oval(side * 1.238, 0.52, z, 0.038, 0.28, 0.28, 0xacb0a7);
    }
    p.box(side * 0.84, 1.02, -4.78, 0.4, 0.16, 0.07, 0xf3e5b6);
    p.box(side * 0.96, 1.2, 4.72, 0.18, 0.58, 0.07, 0xa64c3e);
  }
  return p.finish();
}

function goatBody() {
  const p = new Parts();
  p.oval(0, 0.72, 0, 0.3, 0.31, 0.53, 0x927453);
  for (const x of [-0.15, 0.15])
    for (const z of [-0.34, 0.34]) {
      p.box(x, 0.31, z, 0.073, 0.6, 0.082, 0x584a3c);
    }
  return p.finish();
}
function goatHead() {
  const p = new Parts();
  p.oval(0, 0.13, -0.12, 0.14, 0.16, 0.22, 0x8c7050);
  for (const x of [-0.1, 0.1]) {
    p.oval(x, 0.31, -0.035, 0.038, 0.15, 0.042, 0x625849, -0.22);
    p.oval(x, 0.405, 0.03, 0.031, 0.08, 0.079, 0x958467);
  }
  return p.finish();
}

const PACK_STARTS = [85, 1285, 4050, 7280, 9780];
const COACH_STARTS = [1890, 10105];
const PAINT = [0x267196, 0xf4e4c5, 0xd77837, 0x246b91, 0xe3c14e, 0x8a3440];

export class CalobraCamp {
  readonly root = new Group();
  private readonly paint = new MeshStandardMaterial({ vertexColors: true, roughness: 0.77 });
  private readonly shell = coachBody();
  private readonly goat = goatBody();
  private readonly head = goatHead();
  private readonly coaches = COACH_STARTS.map(() => new Mesh(this.shell, this.paint));
  private readonly heads: Mesh[] = [];
  private readonly riders: RiderModel[] = [];
  private readonly at;
  packDistance = 0;
  coachDistance = 0;
  constructor(
    private readonly course: Course,
    kit: CourseCyclistKit,
    batch: RiderBatch,
  ) {
    this.at = course.place(0);
    this.root.add(...this.coaches);
    for (let i = 0; i < PAINT.length; i++) {
      const rider = kit.make(new Color(PAINT[i]!), 31 + i, true, 0.35);
      this.root.add(rider.group);
      batch.add(rider);
      this.riders.push(rider);
    }
    for (const [metres, lane] of [
      [348, 4.25],
      [1398, 4.16],
      [1422, 4.11],
      [5090, 4.16],
      [9744, 4.21],
    ]) {
      const p = course.place(metres!, lane!),
        animal = new Group();
      animal.position.set(p.x, p.y - 0.09, p.z);
      animal.rotation.y = p.heading + 1.1;
      const head = new Mesh(this.head, this.paint);
      head.position.set(0, 0.83, -0.41);
      animal.add(new Mesh(this.goat, this.paint), head);
      this.heads.push(head);
      this.root.add(animal);
    }
    this.update(0, 0, false);
  }
  update(t: number, ridden: number, reduced: boolean) {
    const time = reduced ? 0 : t,
      length = this.course.length;
    // Traffic wraps at the course endpoints, beyond the two mountain viewpoints.
    let gap = Infinity,
      lead = 0;
    for (const start of PACK_STARTS) {
      const d = (start + time * 5.3) % length;
      if (Math.abs(d - ridden) < gap) {
        lead = d;
        gap = Math.abs(d - ridden);
      }
    }
    const regroup = Math.abs(11666 - ridden) < gap;
    if (regroup) {
      lead = 11666;
      gap = Math.abs(lead - ridden);
    }
    this.packDistance = lead;
    for (const [i, rider] of this.riders.entries()) {
      rider.group.visible = gap < 420;
      if (!rider.group.visible) continue;
      const d = lead - Math.floor(i / 2) * 3.4 - (i % 2) * 0.74;
      const lane = regroup ? 3.81 + (i % 2) * 0.87 : 1.02 + (i % 2) * 0.85;
      const at = this.course.place(d, lane, this.at);
      rider.group.position.set(at.x, at.y + (regroup ? -0.055 : 0.02), at.z);
      rider.group.rotation.set(at.pitch, at.heading, 0, 'YXZ');
      rider.pose(regroup || reduced ? 0.67 + i : time * 8.1 + i * 0.82, 0);
    }
    let nearest = Infinity;
    for (const [i, bus] of this.coaches.entries()) {
      const d = (((COACH_STARTS[i]! - time * 4.12) % length) + length) % length;
      if (Math.abs(d - ridden) < nearest) {
        nearest = Math.abs(d - ridden);
        this.coachDistance = d;
      }
      bus.visible = Math.abs(d - ridden) < 650;
      if (bus.visible) {
        const at = this.course.place(d, -1.69, this.at);
        bus.position.set(at.x, at.y + 0.02, at.z);
        bus.rotation.set(-at.pitch, at.heading + Math.PI, 0, 'YXZ');
      }
    }
    this.heads.forEach((h, i) => {
      h.rotation.x = 0.4 + Math.sin(time * 1.2 + i) * 0.35;
    });
  }
  dispose() {
    this.root.clear();
    for (const rider of this.riders) for (const owned of rider.owned) owned.dispose();
    this.shell.dispose();
    this.head.dispose();
    this.goat.dispose();
    this.paint.dispose();
  }
}
