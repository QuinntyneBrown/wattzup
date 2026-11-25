import {
  BoxGeometry,
  BufferAttribute,
  type BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';

/** Two decks of illuminated windows on the excursion boat; hold covers and a stern wheelhouse on the barge. */
function vessel(passenger: boolean) {
  const parts: BufferGeometry[] = [];
  function put(source: BufferGeometry, x: number, y: number, z: number, colour: number) {
    const tint = new Color(colour);
    const geom = source.index ? source.toNonIndexed() : source.clone();
    source.dispose();
    geom.translate(x, y, z);
    const rgb = new Float32Array(geom.getAttribute('position').count * 3);
    for (let i = 0; i < rgb.length; i += 3) tint.toArray(rgb, i);
    geom.setAttribute('color', new BufferAttribute(rgb, 3));
    parts.push(geom);
  }
  function box(x: number, y: number, z: number, w: number, h: number, d: number, c: number) {
    put(new BoxGeometry(w, h, d), x, y, z, c);
  }
  put(
    new SphereGeometry(1, 20, 7).scale(
      passenger ? 17 : 23,
      passenger ? 2.18 : 1.71,
      passenger ? 4.54 : 5.62,
    ),
    0,
    0.44,
    0,
    passenger ? 0x738388 : 0x605e5f,
  );
  if (passenger) {
    for (let deck = 0; deck < 2; deck++) {
      const z = 2.52 + deck * 2.53,
        w = 28 - deck * 4.4;
      box(-0.4, z, 0, w, 2.47, 6.82 - deck * 0.54, 0xb9b5a1);
      for (const side of [-1, 1]) {
        for (let i = 0; i < 10; i++)
          box(
            -w * 0.43 + i * w * 0.095,
            z + 0.15,
            side * (3.45 - deck * 0.27),
            w * 0.065,
            1.28,
            0.08,
            i % 3 === 0 ? 0xebcb94 : 0x7facc1,
          );
        box(
          -0.4,
          z + 1.18,
          side * (3.47 - deck * 0.27),
          w + 0.47,
          0.16,
          0.13,
          deck ? 0xd795c3 : 0x80a7d2,
        );
      }
      box(-0.4, z + 1.39, 0, w + 1.08, 0.24, 7.32 - deck * 0.41, 0xead6b0);
    }
    box(3.72, 6.79, 0, 11.32, 1.37, 5.61, 0xa4b8bb);
    box(3.47, 7.53, 0, 12, 0.19, 5.94, 0xddc49e);
  } else {
    for (let i = 0; i < 5; i++)
      box(-11.7 + i * 5.36, 1.74, 0, 5.04, 0.69, 7.84, i % 2 ? 0x7d7067 : 0x777b75);
    box(-17.1, 2.89, 0, 5.56, 3.2, 6.72, 0xb6b2a2);
    for (const side of [-1, 1]) box(-17.1, 3.62, side * 3.42, 4.36, 0.81, 0.12, 0xe0b77f);
  }
  const geom = mergeGeometries(parts)!;
  for (const part of parts) part.dispose();
  return geom;
}

const COATS = [0xc28373, 0x668399, 0xaea088, 0x708e7e, 0x877a96, 0xb3b1ab];
const PEOPLE = 36;

export class BundCruise {
  readonly root = new Group();
  private readonly cabinPaint = new MeshBasicMaterial({ vertexColors: true });
  private readonly cruise = new Mesh(vessel(true), this.cabinPaint);
  private readonly barge = new Mesh(vessel(false), this.cabinPaint);
  private readonly tourists = new InstancedMesh(
    new SphereGeometry(1, 7, 5),
    new MeshStandardMaterial({ roughness: 0.75 }),
    PEOPLE * 7,
  );
  private readonly taxis = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ roughness: 0.61 }),
    24 * 7,
  );
  private readonly glitter = new InstancedMesh(
    new SphereGeometry(1, 7, 4),
    new MeshBasicMaterial({ transparent: true, opacity: 0.41, depthWrite: false }),
    110,
  );
  private readonly pose = new Object3D();
  private readonly tint = new Color();
  private readonly point;
  touristPosition = 0;
  get boatPosition(): number {
    return this.cruise.position.x;
  }
  constructor(private readonly course: Course) {
    this.point = course.place(0);
    for (let i = 0; i < PEOPLE; i++) {
      const skin = [0xce9f7c, 0xaa856c, 0xbe9276][i % 3]!;
      const shaded = [COATS[i % 6]!, skin, 0x494047, skin, skin, 0x45455a, 0x45455a];
      shaded.forEach((c, j) => this.tourists.setColorAt(i * 7 + j, this.tint.setHex(c)));
    }
    for (let i = 0; i < 24; i++) {
      const paint = [0x7b887f, 0x9c6668, 0xcdbc94, 0x6b809a][i % 4]!;
      const tints = [paint, 0x617482, paint, 0xe8d8a7, 0xe8d8a7, 0xc2605f, 0xc2605f];
      tints.forEach((c, j) => this.taxis.setColorAt(i * 7 + j, this.tint.setHex(c)));
    }
    for (let i = 0; i < this.glitter.count; i++)
      this.glitter.setColorAt(
        i,
        this.tint.setHex([0xd082ba, 0x8caade, 0xdaaf72, 0xb8c5be, 0xe8bd8a][i % 5]!),
      );
    for (const mesh of [this.tourists, this.taxis, this.glitter]) mesh.frustumCulled = false;
    this.root.add(this.cruise, this.barge, this.tourists, this.taxis, this.glitter);
    this.update(0);
  }
  update(seconds: number): void {
    this.ship(this.cruise, 480 + ((seconds * 5.43 + 580) % 1660), 128, seconds);
    this.ship(this.barge, 2300 - ((seconds * 3.05 + 127) % 1850), 238, seconds);
    this.barge.rotation.y += Math.PI;
    for (let i = 0; i < PEOPLE; i++) {
      const sign = i % 3 ? 1 : -1;
      const at = 140 + ((i * 45.63 + seconds * sign * (0.77 + (i % 3) * 0.17) + 172000) % 1720);
      const s = this.course.place(at, sign * (3.02 + (i % 4) * 0.41), this.point);
      const swing = Math.sin(seconds * 3.33 + i) * sign,
        bob = 0.04 * Math.abs(swing);
      this.shape(this.tourists, i * 7, s.x, s.y + 1.09 + bob, s.z, 0.24, 0.36, 0.19, 0.035 * swing);
      this.shape(
        this.tourists,
        i * 7 + 1,
        s.x + 0.035,
        s.y + 1.58 + bob,
        s.z,
        0.16,
        0.192,
        0.146,
        0,
      );
      this.shape(this.tourists, i * 7 + 2, s.x + 0.017, s.y + 1.7 + bob, s.z, 0.163, 0.1, 0.15, 0);
      for (let j = 0; j < 2; j++) {
        const side = j * 2 - 1;
        this.shape(
          this.tourists,
          i * 7 + 3 + j,
          s.x + side * 0.099 * swing,
          s.y + 1.17 + bob,
          s.z + side * 0.238,
          0.078,
          0.26,
          0.08,
          side * swing * 0.48,
        );
        this.shape(
          this.tourists,
          i * 7 + 5 + j,
          s.x - side * 0.15 * swing,
          s.y + 0.46 + bob,
          s.z + side * 0.108,
          0.093,
          0.445,
          0.105,
          -side * swing * 0.44,
        );
      }
      if (i === 12) this.touristPosition = s.x;
    }
    for (let i = 0; i < 24; i++) {
      const sign = i % 2 ? 1 : -1,
        d = 85 + ((i * 82 + seconds * sign * (8.7 + (i % 3)) + 190000) % 1900);
      const at = this.course.place(d, 0, this.point);
      const x = at.x,
        z = at.z - 32 - sign * 4;
      this.shape(this.taxis, i * 7, x, 5.78, z, 4.56, 0.7, 1.8, 0);
      this.shape(this.taxis, i * 7 + 1, x, 6.34, z, 2.46, 0.63, 1.63, 0);
      this.shape(this.taxis, i * 7 + 2, x, 6.69, z, 1.67, 0.12, 1.46, 0);
      for (let j = 0; j < 2; j++) {
        const l = (j * 2 - 1) * 0.58;
        this.shape(this.taxis, i * 7 + 3 + j, x + sign * 2.29, 5.87, z + l, 0.08, 0.18, 0.37, 0);
        this.shape(this.taxis, i * 7 + 5 + j, x - sign * 2.29, 5.87, z + l, 0.08, 0.15, 0.28, 0);
      }
    }
    for (let i = 0; i < this.glitter.count; i++) {
      const band = i % 5,
        row = Math.floor(i / 5),
        wave = Math.sin(row * 1.8 + seconds * 0.94);
      const x = 1040 + band * 151 + row * 10 + Math.sin(i * 2.37) * 13;
      this.shape(
        this.glitter,
        i,
        x,
        0.11 + wave * 0.035,
        190 + row * 22 + band * 12,
        3.6 + wave * 1.6,
        0.054,
        1.7 + row * 0.09,
        0,
      );
    }
    for (const mesh of [this.tourists, this.taxis, this.glitter])
      mesh.instanceMatrix.needsUpdate = true;
  }
  private ship(mesh: Mesh, x: number, offshore: number, t: number): void {
    const on = this.course.place(Math.min(x, 2030), 0, this.point);
    mesh.position.set(x, 0.43 + 0.13 * Math.sin(t * 1.56 + x * 0.004), on.z + offshore);
    mesh.rotation.set(0.011 * Math.sin(t), on.heading + Math.PI / 2, 0.008 * Math.cos(t * 0.83));
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
    this.cruise.geometry.dispose();
    this.barge.geometry.dispose();
    this.cabinPaint.dispose();
    for (const mesh of [this.taxis, this.tourists, this.glitter]) {
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.dispose();
    }
    this.root.clear();
  }
}
