import {
  BoxGeometry,
  BufferAttribute,
  type BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';
import { canvasTexture } from './world-kit';

const colours = [0xc9404d, 0xe98b46, 0xf0c84b, 0x369061, 0x3e78a9, 0x775596];
const skin = [0xd5a183, 0xb88765, 0x9f6f55, 0x805641];

/** The decorated open-top bus and Volk’s railway carriage each submit as one mesh. */
function coach(railway: boolean): BufferGeometry {
  const parts: BufferGeometry[] = [];
  function add(geometry: BufferGeometry, x: number, y: number, z: number, paint: number) {
    const part = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    geometry.dispose();
    part.translate(x, y, z);
    const tint = new Color(paint);
    const buffer = new Float32Array(part.getAttribute('position').count * 3);
    for (let i = 0; i < buffer.length; i += 3) tint.toArray(buffer, i);
    part.setAttribute('color', new BufferAttribute(buffer, 3));
    parts.push(part);
  }
  function box(x: number, y: number, z: number, l: number, h: number, w: number, paint: number) {
    add(new BoxGeometry(l, h, w), x, y, z, paint);
  }
  const length = railway ? 8.6 : 10.4;
  const width = railway ? 1.75 : 2.42;
  const body = railway ? 0x763f35 : 0xbe4247;
  box(0, 0.91, 0, length, 1.05, width, body);
  for (const x of [-length * 0.32, length * 0.32])
    for (const side of [-1, 1]) {
      const wheel = new CylinderGeometry(
        railway ? 0.31 : 0.48,
        railway ? 0.31 : 0.48,
        0.21,
        12,
      ).rotateX(Math.PI / 2);
      add(wheel, x, 0.45, side * width * 0.48, 0x343739);
    }
  box(0, 2.13, 0, length - 0.18, 1.31, width - 0.16, railway ? 0xd5c38d : 0x547781);
  for (let j = 0; j < 8; j++)
    for (const side of [-1, 1]) {
      const x = ((j - 3.5) * length) / 8;
      box(x, 2.15, side * width * 0.48, 0.094, 1.45, 0.08, railway ? 0x875343 : 0xe1d9bf);
    }
  if (railway) {
    box(0, 2.98, 0, length + 0.32, 0.31, width + 0.25, 0xefe8cc);
    for (let j = 0; j < 7; j++) box((j - 3) * 1.03, 2.1, 0, 0.22, 0.78, 1.25, 0x775443);
  } else {
    box(0, 2.93, 0, length + 0.06, 0.23, width + 0.08, 0xe4d9bc);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++)
        box(
          0,
          1.46 - i * 0.144,
          side * (width * 0.5 + 0.025),
          length - 0.1,
          0.145,
          0.07,
          colours[i]!,
        );
      box(-0.37, 3.37, side * width * 0.48, length - 0.94, 0.12, 0.095, 0xebddbb);
      for (let i = 0; i < 8; i++)
        box((i - 3.5) * 1.1 - 0.38, 3.15, side * width * 0.48, 0.055, 0.53, 0.055, 0xbfb7a5);
    }
    for (let i = 0; i < 13; i++) {
      const x = ((i % 7) - 3) * 1.23,
        z = ((i % 2) - 0.5) * 1.15,
        h = 3.42 + (i % 3) * 0.08;
      add(new SphereGeometry(0.34, 7, 5).scale(0.82, 1.26, 0.73), x, h, z, colours[i % 6]!);
      add(new SphereGeometry(0.2, 7, 5), x, h + 0.57, z, skin[i % 4]!);
      add(new SphereGeometry(0.21, 7, 4).scale(1, 0.47, 1), x, h + 0.72, z, 0x574337);
    }
  }
  const merged = mergeGeometries(parts)!;
  for (const part of parts) part.dispose();
  return merged;
}

/** Banners, a marching colour guard, the open-top bus and the narrow-gauge car share the ride clock. */
export class BrightonParade {
  readonly root = new Group();
  private readonly procession = new Group();
  private readonly vehiclePaint = new MeshStandardMaterial({ vertexColors: true, roughness: 0.68 });
  readonly float = new Mesh(coach(false), this.vehiclePaint);
  private readonly tram = new Mesh(coach(true), this.vehiclePaint);
  private readonly bannerTexture = canvasTexture(256, 160, (g) => {
    for (const [i, paint] of [
      '#c9404d',
      '#e98b46',
      '#f0c84b',
      '#369061',
      '#3e78a9',
      '#775596',
    ].entries()) {
      g.fillStyle = paint;
      g.fillRect(0, (i * 160) / 6, 256, Math.ceil(160 / 6));
    }
    for (const [i, paint] of ['#26272a', '#84563f', '#75c7dc', '#e4a9bd', '#f4eee4'].entries()) {
      const tip = 122 - i * 15;
      g.fillStyle = paint;
      g.beginPath();
      g.moveTo(0, 80 - tip);
      g.lineTo(tip, 80);
      g.lineTo(0, 80 + tip);
      g.fill();
    }
  });
  private readonly cloth = new PlaneGeometry(2.26, 1.39, 9, 3);
  private readonly banners = new InstancedMesh(
    this.cloth,
    new MeshBasicMaterial({ map: this.bannerTexture, side: DoubleSide }),
    10,
  );
  private readonly rest = this.cloth.getAttribute('position').clone();
  private readonly people = new InstancedMesh(
    new SphereGeometry(1, 7, 5),
    new MeshStandardMaterial({ roughness: 0.84 }),
    18 * 8,
  );
  private readonly poles = new InstancedMesh(
    new CylinderGeometry(0.032, 0.043, 2.74, 6),
    new MeshStandardMaterial({ color: 0xd7cdaf }),
    10,
  );
  private readonly pose = new Object3D();
  private readonly tint = new Color();
  get bannerTip(): number {
    return this.cloth.getAttribute('position').getZ(9);
  }

  private readonly point;
  constructor(private readonly course: Course) {
    this.point = course.place(0);
    for (const batch of [this.people, this.poles, this.banners]) {
      batch.instanceMatrix.setUsage(DynamicDrawUsage);
      batch.frustumCulled = false;
      this.procession.add(batch);
    }
    this.float.position.set(0, 4.25, 4.7);
    this.procession.add(this.float);
    this.root.add(this.procession, this.tram);
    const vertices = this.cloth.getAttribute('position');
    if (vertices instanceof BufferAttribute) vertices.setUsage(DynamicDrawUsage);
    for (let i = 0; i < 18; i++) {
      const palette = [
        colours[i % 6]!,
        skin[i % 4]!,
        i % 3 ? 0x58443a : 0xc0a055,
        skin[i % 4]!,
        skin[i % 4]!,
        0x435367,
        0x435367,
        colours[(i + 2) % 6]!,
      ];
      for (let j = 0; j < 8; j++) this.people.setColorAt(i * 8 + j, this.tint.setHex(palette[j]!));
    }
    this.update(0, 0);
  }
  get floatPosition(): number {
    return this.procession.position.x + this.float.position.x;
  }

  update(seconds: number, metres: number): void {
    const station = metres % (13075 / 3);
    const x = 120 + ((715 + seconds * 1.18) % 1510);
    const at = this.course.place(x, 0, this.point);
    this.procession.position.set(at.x, at.y - 4.25, at.z);
    this.procession.rotation.y = at.heading + Math.PI / 2;
    this.procession.visible = Math.abs(station - x) < 360;
    const car = 870 + 615 * Math.sin(seconds / 97);
    const track = this.course.place(car, 0, this.point);
    this.tram.position.set(track.x, track.y - 0.46, track.z - 18.55);
    this.tram.rotation.y = track.heading + Math.PI / 2 + (Math.cos(seconds / 97) < 0 ? Math.PI : 0);
    this.tram.visible = Math.abs(station - car) < 390;
    const pos = this.cloth.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const u = this.rest.getX(i) / 2.26 + 0.5;
      pos.setZ(
        i,
        u * (0.37 * Math.sin(seconds * 4.8 - u * 7) + 0.12 * Math.sin(seconds * 2.6 + u * 4)),
      );
    }
    pos.needsUpdate = true;
    if (!this.procession.visible) return;
    for (let i = 0; i < 18; i++) {
      const x = -10 - Math.floor(i / 3) * 3.27,
        z = 2.7 + (i % 3) * 1.16;
      const step = Math.sin(seconds * 4.8 + i * 0.81),
        y = 4.27 + 0.065 * Math.abs(step);
      this.part(this.people, i * 8, x, y + 1.13, z, 0.23, 0.35, 0.18, 0);
      this.part(this.people, i * 8 + 1, x, y + 1.61, z, 0.15, 0.19, 0.145, 0);
      this.part(this.people, i * 8 + 2, x - 0.017, y + 1.76, z, 0.15, 0.095, 0.145, 0);
      for (let side = 0; side < 2; side++) {
        const direction = side * 2 - 1;
        this.part(
          this.people,
          i * 8 + 3 + side,
          x + step * 0.09 * direction,
          y + 1.23,
          z + direction * 0.24,
          0.073,
          0.225,
          0.075,
          0.38 * direction * step,
        );
        this.part(
          this.people,
          i * 8 + 5 + side,
          x - step * 0.109 * direction,
          y + 0.49,
          z + direction * 0.096,
          0.098,
          0.45,
          0.103,
          0.37 * step * direction,
        );
      }
      this.part(this.people, i * 8 + 7, x, y + 1.04, z, 0.24, 0.078, 0.19, 0);
      if (i < 10) {
        this.part(this.poles, i, x + 0.08, y + 1.45, z + 0.27, 1, 1, 1, step * 0.07);
        this.pose.position.set(x + 0.06, y + 2.85, z - 0.72);
        this.pose.rotation.set(0.1, Math.PI / 2 + step * 0.25, step * 0.13);
        this.pose.scale.setScalar(1);
        this.pose.updateMatrix();
        this.banners.setMatrixAt(i, this.pose.matrix);
      }
    }
    for (const mesh of [this.poles, this.people, this.banners])
      mesh.instanceMatrix.needsUpdate = true;
  }
  private part(
    mesh: InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    swing: number,
  ): void {
    this.pose.position.set(x, y, z);
    this.pose.rotation.set(0, 0, swing);
    this.pose.scale.set(w, h, d);
    this.pose.updateMatrix();
    mesh.setMatrixAt(i, this.pose.matrix);
  }
  dispose(): void {
    this.root.removeFromParent();
    for (const mesh of [this.poles, this.people, this.banners]) {
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.dispose();
    }
    this.float.geometry.dispose();
    this.tram.geometry.dispose();
    this.vehiclePaint.dispose();
    this.bannerTexture.dispose();
    this.root.clear();
  }
}
