import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';

/** One coloured mesh per vehicle, with its long axis pointing down the straight. */
function vehicle(colour: number, push: boolean, truck = false): BufferGeometry {
  const pieces: BufferGeometry[] = [];
  function piece(
    x: number,
    y: number,
    z: number,
    l: number,
    h: number,
    w: number,
    paint: number,
    rounded = false,
  ) {
    const source = rounded ? new SphereGeometry(0.5, 16, 8) : new BoxGeometry();
    const geometry = source.toNonIndexed();
    source.dispose();
    geometry.scale(l, h, w).translate(x, y, z);
    const tint = new Color(paint);
    const colours = new Float32Array(geometry.getAttribute('position').count * 3);
    for (let i = 0; i < colours.length; i += 3) tint.toArray(colours, i);
    geometry.setAttribute('color', new Float32BufferAttribute(colours, 3));
    pieces.push(geometry);
  }
  function wheels(x: number, width: number) {
    for (const side of [-1, 1]) piece(x, 0.34, side * width, 0.67, 0.67, 0.19, 0x282b2e, true);
  }
  if (truck) {
    piece(-1, 0.95, 0, 8, 1.8, 2.5, 0xe3e1d8);
    piece(4.2, 0.86, 0, 2.1, 1.55, 2.15, colour);
    piece(4.4, 1.56, 0, 1.65, 0.63, 2.04, 0x526674);
    wheels(-3.5, 1.15);
    wheels(4.5, 0.98);
  } else {
    piece(0, 0.63, 0, 8.7, 1.03, 1.44, colour, true);
    piece(-0.55, 1.11, 0, 2.7, 0.65, 0.91, 0x405665, true);
    piece(-3.1, 1.02, 0, 1.62, 1.48, 0.12, colour, true);
    wheels(-2.7, 0.65);
    wheels(2.3, 0.58);
    if (push) {
      piece(-5.1, 0.54, 0, 2, 0.14, 0.19, 0x87929a);
      piece(-7.7, 0.71, 0, 4.45, 0.89, 1.84, 0xbb473b);
      piece(-7.1, 1.35, 0, 1.91, 0.84, 1.66, 0xe6dbbe);
      piece(-7.05, 1.51, 0, 1.69, 0.42, 1.69, 0x536678);
      wheels(-9, 0.86);
      wheels(-6.3, 0.86);
      for (const side of [-1, 1]) {
        piece(-8.5, 1.58, side * 0.55, 0.45, 0.64, 0.4, 0x40516a, true);
        piece(-8.4, 2.02, side * 0.55, 0.3, 0.34, 0.3, 0xc29977, true);
      }
    }
  }
  const result = mergeGeometries(pieces)!;
  for (const piece of pieces) piece.dispose();
  return result;
}

export class SpeedWeek {
  readonly root = new Group();
  private readonly paint = new MeshStandardMaterial({ vertexColors: true, roughness: 0.56 });
  readonly pushCar = new Mesh(vehicle(0xb54832, true), this.paint);
  private readonly racer = new Mesh(vehicle(0xcfa83b, false), this.paint);
  private readonly freight = new Mesh(vehicle(0x536e80, false, true), this.paint);
  private readonly saltWake = new Mesh(
    new SphereGeometry(1, 12, 5),
    new MeshBasicMaterial({ color: 0xe5e2d7, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  readonly mirage: Mesh<ShapeGeometry, MeshBasicMaterial>;
  private readonly place;
  constructor(private readonly course: Course) {
    this.place = course.place(0);
    // The reflection is broad at the salt surface and broken into thin bands below it.
    const shapes: Shape[] = [];
    for (let j = 0; j < 3; j++) {
      const band = new Shape();
      const base = j * 2.2;
      band.moveTo(-1600, base);
      for (let i = 0; i <= 80; i++) {
        const x = -1600 + i * 40;
        const envelope = Math.sin((i * Math.PI) / 80);
        band.lineTo(
          x,
          base + envelope * (j === 2 ? 7 + 3 * Math.cos(i * 0.37) + 2 * Math.sin(i * 1.2) : 1.1),
        );
      }
      band.lineTo(1600, base);
      band.closePath();
      shapes.push(band);
    }
    this.mirage = new Mesh(
      new ShapeGeometry(shapes),
      new MeshBasicMaterial({
        color: 0x9db5bf,
        transparent: true,
        opacity: 0.45,
        side: DoubleSide,
        depthWrite: false,
      }),
    );
    this.mirage.rotation.y = Math.PI / 2;
    this.root.add(this.pushCar, this.racer, this.freight, this.mirage, this.saltWake);
    this.update(0, 0);
  }
  update(seconds: number, metres: number): void {
    const pushAt = 685 + 57 * Math.sin(seconds / 50);
    const raceAt = (seconds * 61 + 175) % 8500;
    const truckAt = 2620 + ((seconds * 25 + 1150) % 2440);
    this.position(this.pushCar, pushAt, 7.2 + 1.3 * Math.cos(seconds / 50), metres, 600);
    this.pushCar.rotation.y -= 0.15 * Math.cos(seconds / 50);
    this.position(this.racer, raceAt, 30, metres, 950);
    this.saltWake.position.copy(this.racer.position);
    this.saltWake.position.x -= 10;
    this.saltWake.position.y += 0.46;
    this.saltWake.scale.set(7.1, 0.62 + 0.13 * Math.sin(seconds * 5), 1.1);
    this.saltWake.visible = this.racer.visible;
    this.position(
      this.freight,
      truckAt,
      235 - 125 * Math.exp(-(((truckAt - 3810) / 260) ** 2)),
      metres,
      720,
    );
    const horizon = this.course.place(Math.min(metres + 1850, this.course.end), -220, this.place);
    this.mirage.position.set(horizon.x, horizon.y + 0.18, horizon.z);
    this.mirage.scale.y = 0.85 + 0.16 * Math.sin(seconds * 1.9) + 0.06 * Math.sin(seconds * 3.3);
  }
  private position(mesh: Mesh, distance: number, lane: number, rider: number, reach: number): void {
    const point = this.course.place(distance, lane, this.place);
    mesh.position.set(point.x, point.y, point.z);
    mesh.rotation.y = point.heading + Math.PI / 2;
    mesh.visible = Math.abs(distance - rider) < reach;
  }
  dispose(): void {
    this.root.removeFromParent();
    for (const mesh of [this.pushCar, this.racer, this.freight, this.mirage])
      mesh.geometry.dispose();
    this.paint.dispose();
    this.mirage.material.dispose();
    this.saltWake.material.dispose();
    this.saltWake.geometry.dispose();
    this.root.clear();
  }
}
