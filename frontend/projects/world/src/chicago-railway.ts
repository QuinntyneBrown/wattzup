import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardNodeMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three/webgpu';
import { positionWorld, texture } from 'three/tsl';
import { chicagoTrainX } from '@telo/api';
import type { Course } from './course';
import { seeded } from './world-kit';

/** A four-metre asphalt tile with a feathered repair edge, aggregate and faint longitudinal wear. */
export function wabashAsphalt() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const g = canvas.getContext('2d')!,
    rng = seeded(2098);
  g.fillStyle = '#787978';
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#6c6e6c';
  g.beginPath();
  g.moveTo(42, 87);
  g.lineTo(161, 59);
  g.lineTo(207, 106);
  g.lineTo(191, 177);
  g.lineTo(56, 184);
  g.closePath();
  g.fill();
  for (let i = 0; i < 36000; i++) {
    g.fillStyle = i % 3 ? 'rgba(38,40,40,.19)' : 'rgba(212,206,182,.29)';
    g.fillRect(rng() * 512, rng() * 512, 0.8 + rng(), 0.8 + rng());
  }
  for (let j = 0; j < 15; j++) {
    const x = rng() * 512;
    g.fillStyle = 'rgba(46,48,48,.055)';
    g.fillRect(x, rng() * 120, 1 + rng() * 4, 240 + rng() * 152);
  }
  const tile = new CanvasTexture(canvas);
  tile.colorSpace = SRGBColorSpace;
  tile.wrapS = tile.wrapT = RepeatWrapping;
  tile.anisotropy = 8;
  const material = new MeshStandardNodeMaterial({ roughness: 0.92 });
  material.colorNode = texture(tile, positionWorld.xz.mul(0.25)).rgb;
  return { tile, material };
}

export class ChicagoRailway {
  readonly root = new Group();
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly silver = new MeshBasicMaterial();
  private readonly train = new InstancedMesh(this.unit, this.silver, 240);
  private readonly crossing: InstancedMesh;
  private readonly p = new Object3D();
  private readonly tint = new Color();
  private readonly vaporQuad = new PlaneGeometry(1, 1);
  private readonly vaporTexture: CanvasTexture;
  private readonly vaporMaterial: MeshBasicMaterial;
  private readonly vapor: InstancedMesh;
  private readonly steamOrigin;
  trainX = 0;
  steamHeight = 0;

  constructor(course: Course) {
    this.train.frustumCulled = false;
    this.root.add(this.train);
    this.steamOrigin = [1171, 228, 1539].map((d) => course.place(d, -4.1));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const g = canvas.getContext('2d')!,
      rng = seeded(539);
    for (let i = 0; i < 18; i++) {
      const x = 27 + rng() * 42,
        y = 28 + rng() * 39,
        r = 9 + rng() * 21;
      const fade = g.createRadialGradient(x, y, 0, x, y, r);
      fade.addColorStop(0, 'rgba(224,226,222,.25)');
      fade.addColorStop(1, 'rgba(224,226,222,0)');
      g.fillStyle = fade;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    this.vaporTexture = new CanvasTexture(canvas);
    this.vaporMaterial = new MeshBasicMaterial({
      map: this.vaporTexture,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: DoubleSide,
    });
    this.vapor = new InstancedMesh(this.vaporQuad, this.vaporMaterial, 18);
    this.vapor.frustumCulled = false;
    this.root.add(this.vapor);
    // All rigid details share the train's transform, including the twin headlights, doors and ribbed skirt.
    let n = 0;
    const p = this.p;
    const block = (
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      hex: number,
    ) => {
      p.position.set(x, y, z);
      p.rotation.set(0, 0, 0);
      p.scale.set(sx, sy, sz);
      p.updateMatrix();
      this.train.setMatrixAt(n, p.matrix);
      this.train.setColorAt(n++, this.tint.setHex(hex));
    };
    for (let car = 0; car < 4; car++) {
      const x = (car - 1.5) * 14.7,
        z = 4.25;
      block(x, 11.25, z, 14.0, 2.5, 2.75, 0xafb7b8);
      block(x, 12.59, z, 13.8, 0.33, 2.58, 0xd3d7d2);
      block(x, 12.83, z, 3.8, 0.21, 1.4, 0x839092);
      block(x, 9.95, z, 11.9, 0.64, 2.17, 0x54585a);
      for (const end of [-1, 1]) {
        block(x + end * 5, 9.69, z, 2.55, 0.57, 2.35, 0x464b4d);
        block(x + end * 7.03, 11.63, z, 0.06, 0.79, 1.85, 0x45555e);
        for (const side of [-1, 1])
          block(x + end * 7.08, 10.79, z + side * 0.93, 0.07, 0.16, 0.22, 0xffe2a0);
      }
      for (const side of [-1, 1]) {
        const face = z + side * 1.39;
        for (let bay = 0; bay < 7; bay++)
          block(x + (bay - 3) * 1.71, 11.71, face, 1.29, 0.78, 0.055, 0x465c68);
        for (const door of [-3.5, 3.5]) {
          block(x + door, 11.17, face + side * 0.04, 0.058, 1.98, 0.05, 0x697579);
        }
        for (let rib = 0; rib < 4; rib++)
          block(x, 10.23 + rib * 0.12, face, 13.68, 0.045, 0.05, 0x838f92);
        block(x, 11.02, face, 13.6, 0.085, 0.07, 0x557a8b);
      }
      block(x + 7.2, 10.6, z, 0.54, 0.47, 1.04, 0x4c5254);
    }
    this.train.count = n;
    this.crossing = this.train.clone();
    this.crossing.rotation.y = Math.PI / 2;
    this.crossing.position.set(355.75, 5.94, 0);
    this.root.add(this.crossing);
    this.update(0);
  }

  update(seconds: number) {
    this.train.position.x = chicagoTrainX(seconds);
    this.trainX = this.train.position.x;
    this.crossing.position.z = 75 * Math.sin(seconds * 0.082 - 0.9);
    for (let i = 0; i < 18; i++) {
      const origin = this.steamOrigin[Math.floor(i / 6)]!;
      const phase = (seconds * 0.24 + (i % 6) / 6) % 1;
      this.p.position.set(
        origin.x + phase * 0.75,
        origin.y + 0.19 + phase * 2.9,
        origin.z + 0.22 * Math.sin(phase * 4 + i),
      );
      this.p.rotation.set(0, origin.heading, Math.sin(phase * 4 + i) * 0.21);
      this.p.scale.set(0.28 + phase * 1.8, 0.45 + phase * 2.1, 1);
      this.p.updateMatrix();
      this.vapor.setMatrixAt(i, this.p.matrix);
      if (!i) this.steamHeight = this.p.position.y;
    }
    this.vapor.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.root.clear();
    this.train.dispose();
    this.crossing.dispose();
    this.vapor.dispose();
    this.unit.dispose();
    this.silver.dispose();
    this.vaporQuad.dispose();
    this.vaporMaterial.dispose();
    this.vaporTexture.dispose();
  }
}
