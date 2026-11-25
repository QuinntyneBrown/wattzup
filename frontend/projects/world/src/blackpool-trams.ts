import {
  BoxGeometry,
  BufferAttribute,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  type BufferGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course, CoursePlace } from './course';

const stops = [24, 145, 581, 1320, 2140, 3190, 4920, 5580, 4920, 3190, 2140, 1320, 581, 145, 24];
const dwell = 4;
const legs = stops.slice(1).map((to, i) => {
  const from = stops[i]!;
  return { from, to, travel: Math.abs(to - from) / 6.8 };
});
const circuit = legs.reduce((sum, leg) => sum + dwell + leg.travel, 0);

function tramPosition(time: number) {
  let here = time % circuit;
  for (const leg of legs) {
    if (here <= dwell + leg.travel) {
      const t = Math.max(0, (here - dwell) / leg.travel);
      return {
        metres: leg.from + (leg.to - leg.from) * t * t * (3 - 2 * t),
        outbound: leg.to > leg.from,
      };
    }
    here -= dwell + leg.travel;
  }
  return { metres: stops[0]!, outbound: true };
}

/** Bake individually painted panels and lights into one submission per tram. */
function paintedParts(
  build: (
    box: (
      colour: number,
      x: number,
      y: number,
      z: number,
      width: number,
      height: number,
      length: number,
      angle?: number,
    ) => void,
  ) => void,
): BufferGeometry {
  const unit = new BoxGeometry(1, 1, 1);
  const parts: BufferGeometry[] = [];
  const transform = new Object3D();
  const tint = new Color();
  build((colour, x, y, z, width, height, length, angle = 0) => {
    transform.position.set(x, y, z);
    transform.rotation.set(0, 0, angle);
    transform.scale.set(width, height, length);
    transform.updateMatrix();
    const part = unit.clone().applyMatrix4(transform.matrix);
    tint.setHex(colour);
    const values = new Float32Array(part.getAttribute('position').count * 3);
    for (let i = 0; i < values.length; i += 3) tint.toArray(values, i);
    part.setAttribute('color', new BufferAttribute(values, 3));
    parts.push(part);
  });
  const result = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  unit.dispose();
  return result;
}

function buildTram(heritage: boolean) {
  return paintedParts((box) => {
    const body = heritage ? 0x3d7254 : 0xbfb9ab;
    const cream = heritage ? 0xeadcb1 : 0x766299;
    const modules = heritage ? [0] : [-6, 0, 6];
    for (const at of modules) {
      const length = heritage ? 12.5 : 5.74;
      box(body, 0, 1.52, at, 2.46, 2.3, length);
      box(cream, 0, heritage ? 3.45 : 2.66, at, 2.43, heritage ? 1.8 : 0.42, length);
      box(0x8e918b, 0, heritage ? 4.42 : 3.0, at, 2.23, 0.22, length - 0.3);
      for (const side of [-1, 1]) {
        const count = heritage ? 8 : 4;
        for (let i = 0; i < count; i++) {
          const z = at + length * ((i + 0.5) / count - 0.5);
          box(0xffdc98, side * 1.24, 1.99, z, 0.037, 0.77, length / count - 0.2);
          if (heritage) box(0xffe5ae, side * 1.23, 3.64, z, 0.039, 0.98, length / count - 0.25);
        }
        box(0xffb858, side * 1.26, heritage ? 2.64 : 0.95, at, 0.045, 0.073, length);
      }
      for (const end of [-1, 1]) {
        const z = at + end * length * 0.5;
        box(0x858d93, 0, 2.07, z, 1.69, 0.89, 0.09);
        if (heritage) box(0xffdf91, 0, 3.65, z, 1.64, 0.8, 0.09);
        for (const x of [-0.82, 0.82]) box(0xfff0ba, x, 0.97, z, 0.24, 0.22, 0.12);
      }
    }
    if (!heritage) for (const at of [-3, 3]) box(0x4e4b55, 0, 1.68, at, 2.26, 2.39, 0.59);
    for (const z of [-4.1, 4.1]) box(0x30333d, 0, 0.41, z, 2.38, 0.45, 1.52);
    box(0x837b73, 0, heritage ? 4.96 : 3.65, 0, 0.09, 1.3, 0.1, -0.41);
  });
}

export class BlackpoolTrams {
  readonly group = new Group();
  private readonly material = new MeshBasicMaterial({ vertexColors: true });
  private readonly heritage = buildTram(true);
  private readonly flexity = buildTram(false);
  private readonly cars = Array.from(
    { length: 12 },
    (_, i) => new Mesh(i % 2 ? this.flexity : this.heritage, this.material),
  );
  private readonly place: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly wheel = new Group();
  private readonly wheelGeometry = paintedParts((box) => {
    const segments = 48;
    for (let i = 0; i < segments; i++) {
      const a = (2 * Math.PI * i) / segments;
      const x = Math.cos(a) * 16.5,
        y = Math.sin(a) * 16.5;
      box(i % 2 ? 0xfacf82 : 0xf28db8, x, y, 0, 0.26, 2.32, 0.3, a);
      if (i % 3 === 0) {
        box(0xaf9a87, x / 2, y / 2, 0, 16.5, 0.13, 0.16, a);
        box(0xe19477, x, y, 0, 1.26, 0.86, 0.97);
      }
    }
  });
  private readonly rim = new Mesh(this.wheelGeometry, this.material);
  nearestMetres: number | null = null;

  constructor(private readonly course: Course) {
    this.group.add(...this.cars, this.wheel);
    this.wheel.add(this.rim);
    const pier = course.place(610, -20);
    this.wheel.position.set(pier.x, pier.y, pier.z);
    this.wheel.rotation.y = pier.heading;
    this.wheel.translateX(-94 * Math.cos(0.68));
    this.wheel.translateZ(-94 * Math.sin(0.68));
    this.wheel.position.y = 22;
    this.wheel.rotation.y += 0.68;
  }
  update(rider: number, seconds: number): void {
    let nearest = Infinity;
    this.nearestMetres = null;
    for (let i = 0; i < this.cars.length; i++) {
      const pos = tramPosition(seconds + 15 + (i * circuit) / this.cars.length);
      const car = this.cars[i]!;
      const distance = Math.abs(pos.metres - rider);
      car.visible = distance < 275;
      if (!car.visible) continue;
      const at = this.course.place(pos.metres, pos.outbound ? -8.52 : -12.62, this.place);
      car.position.set(at.x, at.y + 0.13, at.z);
      car.rotation.set(0, at.heading + (pos.outbound ? 0 : Math.PI), 0);
      if (distance < nearest) {
        this.nearestMetres = pos.metres;
        nearest = distance;
      }
    }
    this.wheel.visible = Math.abs(rider - 610) < 630;
    this.rim.rotation.z = seconds * 0.083;
  }
  dispose(): void {
    this.group.removeFromParent();
    this.heritage.dispose();
    this.flexity.dispose();
    this.wheelGeometry.dispose();
    this.material.dispose();
  }
}
