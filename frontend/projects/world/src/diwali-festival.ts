import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  type Scene,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course, CoursePlace } from './course';

function paint(shape: BufferGeometry, tint: number) {
  const geometry = shape.index ? shape.toNonIndexed() : shape;
  if (geometry !== shape) shape.dispose();
  geometry.deleteAttribute('uv');
  const tones = geometry.getAttribute('position').clone();
  const c = new Color(tint);
  for (let i = 0; i < tones.count; i++) tones.setXYZ(i, c.r, c.g, c.b);
  geometry.setAttribute('color', tones);
  return geometry;
}

/** The Padmini's upright glasshouse and yellow roof over a black four-door body. */
function padmini() {
  const pieces: BufferGeometry[] = [];
  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tint: number,
    slope = 0,
  ) {
    pieces.push(paint(new BoxGeometry(w, h, d).rotateX(slope).translate(x, y, z), tint));
  }
  const black = 0x222127,
    chrome = 0xc5bcb1,
    gold = 0xffc536,
    glass = 0x465362;
  box(0, 0.63, 0, 1.6, 0.59, 3.99, black);
  box(0, 0.93, -1.28, 1.53, 0.17, 1.34, black, -0.05);
  box(0, 1.23, 0.12, 1.4, 0.59, 1.74, glass);
  box(0, 1.2, -0.83, 1.41, 0.54, 0.11, glass, -0.36);
  box(0, 1.2, 1.0, 1.4, 0.48, 0.12, glass, 0.33);
  box(0, 1.55, 0.11, 1.45, 0.13, 1.82, gold);
  box(0, 1.5, -0.8, 1.37, 0.08, 0.15, gold);
  box(0, 1.67, 0.08, 0.46, 0.18, 0.29, 0xe5ba60);
  for (const side of [-1, 1]) {
    for (const z of [-0.76, 0.08, 0.95]) box(side * 0.713, 1.23, z, 0.051, 0.54, 0.056, gold);
    box(side * 0.803, 0.91, 0, 0.027, 0.037, 3.73, chrome);
    for (const z of [-0.24, 0.64]) box(side * 0.821, 0.9, z, 0.032, 0.055, 0.17, chrome);
    box(side * 0.53, 0.75, -2.005, 0.26, 0.23, 0.054, 0xffe5b1);
    box(side * 0.61, 0.76, 2.006, 0.15, 0.23, 0.048, 0xb65348);
    for (const z of [-1.21, 1.21]) {
      pieces.push(
        paint(
          new CylinderGeometry(0.314, 0.314, 0.185, 14)
            .rotateZ(Math.PI / 2)
            .translate(side * 0.766, 0.335, z),
          0x181719,
        ),
      );
      pieces.push(
        paint(
          new CylinderGeometry(0.161, 0.161, 0.024, 12)
            .rotateZ(Math.PI / 2)
            .translate(side * 0.869, 0.335, z),
          chrome,
        ),
      );
    }
  }
  for (const z of [-2.04, 2.04]) box(0, 0.43, z, 1.63, 0.105, 0.1, chrome);
  for (const h of [0.62, 0.68, 0.74, 0.8]) box(0, h, -2.012, 0.7, 0.019, 0.035, chrome);
  box(0, 0.6, 2.012, 0.42, 0.145, 0.04, 0xd6a534);
  const taxi = mergeGeometries(pieces)!;
  pieces.forEach((g) => g.dispose());
  return taxi;
}

const RAYS = 52;
const TRAILS = 4;
const FLARES = 5;
const tones = [0xffb947, 0xff7196, 0x88dbff, 0xffdf87, 0xb1ef8d];
export class DiwaliFestival {
  private readonly group = new Group();
  private readonly taxiShape = padmini();
  private readonly enamel = new MeshLambertMaterial({ vertexColors: true });
  private readonly cars = Array.from({ length: 5 }, () => new Mesh(this.taxiShape, this.enamel));
  private readonly trails = new BufferGeometry();
  private readonly light = new LineBasicMaterial({
    vertexColors: true,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly positions = new Float32BufferAttribute(
    new Float32Array(FLARES * RAYS * TRAILS * 4 * 3),
    3,
  );
  private readonly directions = Array.from({ length: RAYS }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / RAYS,
      r = Math.sqrt(1 - y * y),
      a = i * 2.399963;
    return [r * Math.cos(a), y, r * Math.sin(a)] as const;
  });
  private readonly sample: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  constructor(
    private readonly course: Course,
    scene: Scene,
  ) {
    const colours = new Float32BufferAttribute(new Float32Array(this.positions.count * 3), 3);
    for (let f = 0; f < FLARES; f++) {
      const c = new Color(tones[f]!);
      for (let r = 0; r < RAYS; r++)
        for (let t = 0; t < TRAILS; t++) {
          const n = ((f * RAYS + r) * TRAILS + t) * 4;
          for (let j = 0; j < 4; j++) {
            const power = (j < 2 ? 1.8 : 0.42) * (1 - (t + (j % 2) * 0.66) / (TRAILS + 1));
            colours.setXYZ(n + j, c.r * power, c.g * power, c.b * power);
          }
        }
    }
    this.trails.setAttribute('position', this.positions);
    this.trails.setAttribute('color', colours);
    const sparks = new LineSegments(this.trails, this.light);
    sparks.frustumCulled = false;
    this.group.add(...this.cars, sparks);
    scene.add(this.group);
  }
  get taxiZ() {
    return this.cars[0]!.position.z;
  }
  get sparkY() {
    return this.positions.getY(0);
  }
  update(distance: number, seconds: number) {
    for (const [i, car] of this.cars.entries()) {
      const moving = i < 2;
      const origin =
        [1293, 1381, 1330, 1352, 1387][i]! + (moving ? seconds * (i === 0 ? 2.15 : -1.69) : 0);
      const d = origin + Math.ceil((distance - 40 - origin) / 330) * 330;
      const p = this.course.place(d, moving ? 3.5 : 6.26, this.sample);
      car.position.set(p.x, p.y + 0.035, p.z);
      car.rotation.set(p.pitch, p.heading + (i === 1 ? Math.PI : 0), 0, 'YXZ');
    }
    for (let f = 0; f < FLARES; f++) {
      const origin = 185 + f * 101;
      const d = origin + Math.ceil((distance + 52 - origin) / 515) * 515;
      const p = this.course.place(d, -34 - f * 8, this.sample);
      const phase = (seconds + f * 1.69) % (4.7 + f * 0.12);
      const lift = phase < 1 ? phase * 37 : 37;
      const time = Math.max(0, Math.min(3.6, phase - 1));
      for (let r = 0; r < RAYS; r++) {
        const v = this.directions[r]!;
        for (let t = 0; t < TRAILS; t++) {
          const n = ((f * RAYS + r) * TRAILS + t) * 4;
          for (let j = 0; j < 2; j++) {
            const u = Math.max(0, time - (t + j * 0.89) * 0.115);
            const radius = (1 - Math.exp(-u * 0.83)) * (14 + f * 2.7);
            const x = p.x + v[0] * radius,
              z = p.z + v[2] * radius;
            const y = p.y + lift + v[1] * radius - 1.72 * u * u;
            this.positions.setXYZ(n + j, x, y, z);
            // Broken vertical strokes carry the burst colour on the dark water.
            this.positions.setXYZ(
              n + 2 + j,
              x + (r % 3) * 0.27,
              p.y - 2.27,
              z + v[1] * radius * 0.7 + j * 0.6,
            );
          }
        }
      }
    }
    this.positions.needsUpdate = true;
  }
  dispose() {
    this.group.removeFromParent();
    this.taxiShape.dispose();
    this.enamel.dispose();
    this.trails.dispose();
    this.light.dispose();
  }
}
