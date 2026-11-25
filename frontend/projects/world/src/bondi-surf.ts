import {
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

const BEACHES = [
  [103, 251, 64],
  [2235, 235, 53],
  [3476, 322, 62],
  [5610, 238, 50],
] as const;
const SKIN = [0x96664e, 0xc28b66, 0x79513e, 0xd9a881];
const SHIRTS = [0x447b97, 0xc4504a, 0xdb9760, 0x535b75, 0x4c9282, 0xdeb954];

function shoreline(metres: number): number {
  let lane = 16 + 5 * Math.sin(metres / 80);
  for (const [c, r, w] of BEACHES) lane += w * Math.exp(-(((metres - c) / r) ** 2));
  return lane;
}

/** Swell wraps the headlands, crosses the ocean pool walls, and carries the surfers outside the baths. */
export class BondiSurf {
  readonly group = new Group();
  private readonly at: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly part = new Object3D();
  private readonly tint = new Color();
  private readonly wash = canvasTexture(160, 48, (ctx) => {
    for (let x = 0; x < 160; x++) {
      const crest = 10 + 2.9 * Math.sin(x * 0.076) + 1.4 * Math.sin(x * 0.41);
      for (let j = 0; j < 24; j++) {
        const speck = 0.5 + 0.5 * Math.sin(x * 38.9 + j * 153.3);
        const edge = Math.sin((Math.PI * x) / 160) ** 0.4;
        ctx.fillStyle =
          'rgba(240,250,241,' + edge * Math.exp(-j * 0.142) * (0.31 + 0.69 * speck) + ')';
        ctx.fillRect(x, crest + j + speck, 1, 1.6);
      }
    }
  });
  private readonly sheet = new PlaneGeometry(1, 1);
  private readonly foam = new MeshBasicMaterial({
    map: this.wash,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly breaking = new InstancedMesh(this.sheet, this.foam, 72);
  private readonly rounded = new SphereGeometry(1, 9, 7);
  private readonly fabric = new MeshStandardMaterial({ roughness: 0.86 });
  private readonly people = new InstancedMesh(this.rounded, this.fabric, 310);
  private count = 0;
  foamAdvance = 0;
  walkerStride = 0;

  constructor(private readonly course: Course) {
    this.breaking.frustumCulled = this.people.frustumCulled = false;
    this.group.add(this.breaking, this.people);
  }

  update(metres: number, time: number): void {
    let waves = 0;
    this.count = 0;
    const first = Math.floor(metres / 15) - 5;
    for (let i = 0; i < 23; i++) {
      const d = (first + i) * 15;
      for (let band = 0; band < 2; band++) {
        const phase = (time * 0.165 + band * 0.5 + 0.047 * Math.sin(d * 0.027)) % 1;
        const lane = shoreline(d) + 5 + (1 - phase) * 22;
        this.course.place(d, lane, this.at);
        const rise = Math.sin(phase * Math.PI);
        this.washAt(
          waves++,
          this.at.x,
          0.16 + rise * 0.37,
          this.at.z,
          this.at.heading,
          17.6,
          2.6 + rise * 3.4,
        );
        if (i === 6 && band === 0) this.foamAdvance = lane;
      }
      if ((first + i) % 3 === 0) {
        this.course.place(d, shoreline(d) + 17 + 3 * Math.sin(time * 0.81 + d), this.at);
        const wave = 0.26 * Math.sin(time * 1.1 + d);
        this.shape(0, 0.53 + wave, 0, 0.28, 0.08, 1.17, 0xe0b268);
        this.shape(0, 1.12 + wave, 0, 0.19, 0.39, 0.14, 0x394b51);
        this.shape(
          0,
          1.58 + wave,
          -0.04,
          0.14,
          0.18,
          0.14,
          SKIN[Math.abs(first + i) % SKIN.length]!,
        );
      }
    }
    for (const site of [483, 6093]) {
      if (Math.abs(metres - site) > 205) continue;
      const width = site === 483 ? 20 : 16;
      const length = site === 483 ? 50 : 37;
      const lane = shoreline(site) + width * 0.53 + 2;
      this.course.place(site, lane, this.at);
      const originX = this.at.x,
        originZ = this.at.z,
        h = this.at.heading;
      const c = Math.cos(h),
        s = Math.sin(h);
      const phase = (time * 0.19) % 1;
      const cross = width * 0.5 + 1.8 - phase * 8.9;
      const rise = Math.sin(Math.PI * phase);
      for (let i = 0; i < 5; i++) {
        const along = (i - 2) * length * 0.18;
        this.washAt(
          waves++,
          originX + c * cross - s * along,
          1.4 + rise * 0.32,
          originZ - s * cross - c * along,
          h,
          length * 0.22,
          3.4 * rise + 0.02,
        );
      }
      for (let i = 0; i < 6; i++) {
        const position = (time * 0.37 + i * 3.91) % (length * 1.64);
        const along = length * 0.41 - Math.abs(position - length * 0.82);
        const across = -width * 0.41 + i * width * 0.152;
        this.at.x = originX + c * across - s * along;
        this.at.z = originZ - s * across - c * along;
        this.shape(0, 1.27, 0, 0.14, 0.13, 0.15, SHIRTS[i]!);
        this.shape(0, 1.21, 0.28, 0.17, 0.07, 0.35, SKIN[i % SKIN.length]!);
        this.shape(
          0.2,
          1.27 + 0.12 * Math.sin(time * 3 + i),
          0.32,
          0.07,
          0.075,
          0.26,
          SKIN[i % SKIN.length]!,
        );
      }
    }
    for (let family = 0; family < 2; family++) {
      const speed = family === 0 ? 2.46 : -1.13;
      const origin = time * speed + family * 11;
      const start = Math.floor((metres - origin) / 34) - 2;
      for (let j = 0; j < 9; j++) {
        const index = start + j;
        const d = origin + index * 34;
        if (d < 2 || d > 6145) continue;
        const lane = (family === 0 ? -1 : 1) * (1.31 + 0.13 * Math.sin(index * 4.1));
        this.course.place(d, lane, this.at);
        const roadY = this.at.y;
        const step = Math.sin(time * (family === 0 ? 7.0 : 4.35) + index);
        const size = family === 1 && Math.abs(index) % 5 === 0 ? 0.72 : 1;
        const skin = SKIN[Math.abs(index + family) % SKIN.length]!;
        const shirt = SHIRTS[Math.abs(index + 2 * family) % SHIRTS.length]!;
        this.shape(
          0,
          roadY + size * (1.16 + 0.045 * Math.abs(step)),
          0,
          0.21 * size,
          0.35 * size,
          0.145 * size,
          shirt,
        );
        this.shape(
          0,
          roadY + size * (1.64 + 0.045 * Math.abs(step)),
          0,
          0.142 * size,
          0.182 * size,
          0.14 * size,
          skin,
        );
        for (let side = -1; side <= 1; side += 2) {
          this.shape(
            side * 0.104 * size,
            roadY + 0.57 * size,
            0.095 * side * step * size,
            0.097 * size,
            0.36 * size,
            0.112 * size,
            0x3e4750,
            side * step * 0.37,
          );
          this.shape(
            side * 0.101 * size,
            roadY + 0.18 * size,
            0.2 * side * step * size,
            0.073 * size,
            0.16 * size,
            0.093 * size,
            skin,
          );
          this.shape(
            side * 0.231 * size,
            roadY + 1.12 * size,
            -0.15 * side * step * size,
            0.068 * size,
            0.25 * size,
            0.08 * size,
            skin,
            -side * step * 0.45,
          );
        }
        if (family === 0 && j === 3) this.walkerStride = this.part.rotation.x;
      }
    }
    this.breaking.count = waves;
    this.people.count = this.count;
    this.people.instanceMatrix.needsUpdate = this.breaking.instanceMatrix.needsUpdate = true;
    if (this.people.instanceColor) this.people.instanceColor.needsUpdate = true;
  }

  private washAt(
    i: number,
    x: number,
    y: number,
    z: number,
    h: number,
    length: number,
    width: number,
  ): void {
    this.part.position.set(x, y, z);
    this.part.rotation.set(-Math.PI / 2, 0, Math.PI / 2 - h);
    this.part.scale.set(length, width, 1);
    this.part.updateMatrix();
    this.breaking.setMatrixAt(i, this.part.matrix);
  }

  private shape(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    pitch = 0,
  ): void {
    const yaw = this.at.heading,
      c = Math.cos(yaw),
      s = Math.sin(yaw);
    this.part.position.set(this.at.x + c * x + s * z, y, this.at.z - s * x + c * z);
    this.part.rotation.set(pitch, yaw, 0, 'YXZ');
    this.part.scale.set(w, h, d);
    this.part.updateMatrix();
    this.people.setMatrixAt(this.count, this.part.matrix);
    this.people.setColorAt(this.count++, this.tint.setHex(color));
  }

  dispose(): void {
    this.group.removeFromParent();
    this.breaking.dispose();
    this.people.dispose();
    this.rounded.dispose();
    this.sheet.dispose();
    this.fabric.dispose();
    this.foam.dispose();
    this.wash.dispose();
  }
}
