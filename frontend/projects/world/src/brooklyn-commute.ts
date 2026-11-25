import {
  BoxGeometry,
  BufferAttribute,
  type BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';

function hull(ferry: boolean, body: number, taxi = false): BufferGeometry {
  const parts: BufferGeometry[] = [];
  function paint(source: BufferGeometry, x: number, y: number, z: number, colour: number) {
    const geom = source.index ? source.toNonIndexed() : source.clone();
    source.dispose();
    geom.translate(x, y, z);
    const tint = new Color(colour),
      rgb = new Float32Array(geom.getAttribute('position').count * 3);
    for (let i = 0; i < rgb.length; i += 3) tint.toArray(rgb, i);
    geom.setAttribute('color', new BufferAttribute(rgb, 3));
    parts.push(geom);
  }
  function block(x: number, y: number, z: number, l: number, h: number, w: number, colour: number) {
    paint(new BoxGeometry(l, h, w), x, y, z, colour);
  }
  if (ferry) {
    paint(new SphereGeometry(1, 16, 8).scale(12.9, 1.92, 3.76), 0, 0.53, 0, 0x414e55);
    block(0, 1.64, 0, 21.6, 0.58, 6.91, 0xd9d9cd);
    block(-0.63, 2.95, 0, 17.3, 2.22, 5.6, 0xeee8d7);
    block(-1.14, 4.17, 0, 18.63, 0.32, 6.03, 0x58788a);
    for (let j = 0; j < 9; j++)
      for (const side of [-1, 1])
        block((j - 4) * 1.73 - 0.6, 3.08, side * 2.84, 1.38, 1.23, 0.09, 0x596f79);
    block(0.75, 4.96, 0, 8.9, 1.4, 4.85, 0xdbe2d9);
    block(4.92, 5.19, 0, 0.24, 0.69, 4.4, 0x607b84);
    block(0.7, 5.76, 0, 9.4, 0.23, 5.35, 0x6c8590);
    block(-2.5, 6.46, 0, 0.16, 1.54, 0.15, 0x808780);
  } else {
    block(0, 0.7, 0, 4.45, 0.59, 1.84, body);
    paint(new SphereGeometry(1, 10, 6).scale(1.44, 0.68, 0.82), -0.15, 1.04, 0, 0x647c85);
    block(-0.15, 1.63, 0, 1.23, 0.13, 1.11, body);
    if (taxi) block(-0.16, 1.84, 0, 0.94, 0.32, 0.36, 0xf1d493);
    for (const x of [-1.33, 1.31])
      for (const side of [-1, 1]) {
        paint(
          new CylinderGeometry(0.34, 0.34, 0.13, 8).rotateX(Math.PI / 2),
          x,
          0.35,
          side * 0.91,
          0x35363a,
        );
      }
    for (const side of [-1, 1]) {
      block(2.24, 0.8, side * 0.66, 0.07, 0.16, 0.31, 0xe8e3b6);
      block(-2.24, 0.8, side * 0.66, 0.07, 0.16, 0.31, 0xaa5145);
    }
  }
  const result = mergeGeometries(parts)!;
  for (const part of parts) part.dispose();
  return result;
}

const WEAR = [0x566e83, 0x924f48, 0x586754, 0xa59172, 0x484859, 0xd5b469];
const SKIN = [0xbb8567, 0xd1a183, 0x906445, 0xa1785d];
const COUNT = 84;
const CYCLISTS = Math.ceil(COUNT / 5);

/** Road traffic, ferry crossings and promenade traffic remain in their own lanes. */
export class BrooklynCommute {
  readonly root = new Group();
  private readonly paint = new MeshStandardMaterial({ vertexColors: true, roughness: 0.69 });
  private readonly streetPaint = new MeshStandardMaterial({ roughness: 0.78 });
  private readonly taxis = new InstancedMesh(hull(false, 0xd6a22d, true), this.paint, 9);
  private readonly cars = new InstancedMesh(hull(false, 0x798a95), this.paint, 19);
  private readonly ferry = new Mesh(hull(true, 0), this.paint);
  private readonly people = new InstancedMesh(
    new SphereGeometry(1, 7, 5),
    this.streetPaint,
    COUNT * 9,
  );
  private readonly tyres = new InstancedMesh(
    new TorusGeometry(0.33, 0.035, 5, 16),
    new MeshStandardMaterial({ color: 0x33393a }),
    CYCLISTS * 2,
  );
  private readonly bicycle = new InstancedMesh(
    new CylinderGeometry(0.026, 0.026, 1, 6),
    new MeshStandardMaterial({ color: 0x526d7b }),
    CYCLISTS * 5,
  );
  private readonly pose = new Object3D();
  private readonly colour = new Color();
  private readonly point;
  cabPosition = 0;
  get ferryPosition(): number {
    return this.ferry.position.z;
  }
  constructor(private readonly course: Course) {
    this.point = course.place(0);
    for (let i = 0; i < COUNT; i++) {
      const shirt = WEAR[i % WEAR.length]!,
        skin = SKIN[i % SKIN.length]!;
      const palette = [
        shirt,
        skin,
        i % 5 === 0 ? 0xd3a443 : 0x554638,
        skin,
        skin,
        0x404c59,
        0x404c59,
        0x514f45,
        0x514f45,
      ];
      palette.forEach((c, j) => this.people.setColorAt(i * 9 + j, this.colour.setHex(c)));
    }
    for (const mesh of [this.people, this.taxis, this.cars, this.tyres, this.bicycle])
      mesh.frustumCulled = false;
    this.root.add(this.people, this.taxis, this.cars, this.ferry, this.tyres, this.bicycle);
    this.update(0, 0);
  }

  update(seconds: number, metres: number): void {
    const viewer = this.course.place(metres, 0, this.point).x;
    this.root.visible = viewer > 220 && viewer < 3070;
    if (!this.root.visible) return;
    for (const [mesh, isTaxi] of [
      [this.taxis, true],
      [this.cars, false],
    ] as const) {
      for (let i = 0; i < mesh.count; i++) {
        const sign = i % 2 ? -1 : 1;
        const position =
          560 +
          ((seconds * (isTaxi ? 12 : 14.3) * sign + (isTaxi ? 955 : 518) + i * 121.75 + 205000) %
            2050);
        const level = this.course.place(position, 0, this.point);
        const lane = sign * (i % 4 < 2 ? 7.8 : 13.8);
        this.pose.position.set(position, level.y - 3.99, lane);
        this.pose.rotation.set(0, sign > 0 ? 0 : Math.PI, sign * level.pitch);
        this.pose.scale.setScalar(1);
        this.pose.updateMatrix();
        mesh.setMatrixAt(i, this.pose.matrix);
        if (isTaxi && i === 0) this.cabPosition = this.pose.position.x;
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    const tide = seconds / 94;
    this.ferry.position.set(
      1560 + 44 * Math.sin(tide * 0.5),
      0.64 + 0.12 * Math.sin(seconds * 1.9),
      -135 + 335 * Math.sin(tide),
    );
    this.ferry.rotation.set(
      0.018 * Math.sin(seconds * 0.9),
      Math.cos(tide) > 0 ? -Math.PI / 2 : Math.PI / 2,
      0,
    );
    this.ferry.visible = Math.abs(viewer - 1550) < 880;
    for (let i = 0; i < COUNT; i++) {
      const cycling = i % 5 === 0,
        run = i % 4 === 0;
      const sign = i % 2 === 0 ? 1 : -1;
      const speed = cycling ? 4.7 : run ? 2.64 : 1.22;
      const pos =
        580 +
        ((Math.floor(i / 3) * 70.73 + (i % 3) * 3.8 + seconds * speed * sign + 198000) % 1980);
      const road = this.course.place(
        pos,
        sign * (cycling ? 1.3 : 1.91) + (i % 3) * 0.13,
        this.point,
      );
      const x = road.x,
        y = road.y,
        z = road.z;
      const stride = Math.sin(seconds * speed * (cycling ? 1.43 : 3.09) + i);
      const bob = cycling ? 0 : Math.abs(stride) * (run ? 0.093 : 0.045);
      const torso = cycling ? 1.15 : 1.2,
        lean = cycling ? -0.53 * sign : -0.07 * sign;
      this.shape(this.people, i * 9, x, y + torso + bob, z, 0.215, 0.345, 0.178, lean);
      this.shape(
        this.people,
        i * 9 + 1,
        x + (cycling ? 0.225 : 0.04) * sign,
        y + 1.68 + bob - (cycling ? 0.17 : 0),
        z,
        0.146,
        0.17,
        0.14,
        0,
      );
      this.shape(
        this.people,
        i * 9 + 2,
        x + (cycling ? 0.225 : 0.034) * sign,
        y + 1.78 + bob - (cycling ? 0.17 : 0),
        z,
        0.155,
        0.1,
        0.145,
        0,
      );
      for (let j = 0; j < 2; j++) {
        const side = 2 * j - 1,
          phase = side * stride;
        this.shape(
          this.people,
          i * 9 + 3 + j,
          x + (cycling ? 0.28 * sign : 0.12 * phase),
          y + 1.16 + bob,
          z + side * 0.205,
          0.069,
          0.225,
          0.071,
          cycling ? 0.72 * sign : 0.47 * phase,
        );
        const step = cycling ? 0.13 : 0.19;
        this.shape(
          this.people,
          i * 9 + 5 + j,
          x + step * phase,
          y + 0.58 + bob + (cycling ? 0.09 * phase : 0),
          z + side * 0.105,
          0.09,
          0.41,
          0.096,
          -0.42 * phase,
        );
        this.shape(
          this.people,
          i * 9 + 7 + j,
          x + 0.21 * phase + 0.04 * sign,
          y + (cycling ? 0.38 + 0.13 * phase : 0.145) + bob,
          z + side * 0.105,
          0.142,
          0.078,
          0.092,
          0,
        );
      }
      if (cycling) {
        const index = i / 5;
        for (let j = 0; j < 2; j++)
          this.shape(this.tyres, index * 2 + j, x + (j - 0.5) * 1.01, y + 0.34, z, 1, 1, 1, 0);
        for (const [j, dx, dy, long, tilt] of [
          [0, -0.26, 0.49, 0.59, -0.95],
          [1, -0.1, 0.62, 0.62, 0.25],
          [2, 0.09, 0.79, 0.58, -1.38],
          [3, 0.29, 0.62, 0.61, -0.88],
          [4, 0.44, 0.62, 0.59, 0.25],
        ] as const) {
          this.shape(
            this.bicycle,
            index * 5 + j,
            x + dx * sign,
            y + dy,
            z,
            1,
            long,
            1,
            tilt * sign,
          );
        }
      }
    }
    for (const mesh of [this.people, this.tyres, this.bicycle])
      mesh.instanceMatrix.needsUpdate = true;
  }
  private shape(
    mesh: InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rot: number,
  ): void {
    this.pose.position.set(x, y, z);
    this.pose.rotation.set(0, 0, rot);
    this.pose.scale.set(w, h, d);
    this.pose.updateMatrix();
    mesh.setMatrixAt(i, this.pose.matrix);
  }
  dispose(): void {
    this.root.removeFromParent();
    for (const mesh of [this.people, this.taxis, this.cars, this.tyres, this.bicycle]) {
      mesh.geometry.dispose();
      mesh.dispose();
    }
    this.ferry.geometry.dispose();
    this.paint.dispose();
    this.streetPaint.dispose();
    this.tyres.material.dispose();
    this.bicycle.material.dispose();
    this.root.clear();
  }
}
