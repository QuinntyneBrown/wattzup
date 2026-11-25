import {
  Color,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three/webgpu';

import type { Course } from './course';

const LAP = 1545;
const VENUES = [118, 398, 666, 1150];
/** The fixed stages and their listeners share one instanced draw on the low tier. */
export class AustinPerformers {
  private readonly geometry = new SphereGeometry(1, 8, 5);
  private readonly material = new MeshStandardMaterial({ roughness: 0.87 });
  readonly mesh = new InstancedMesh(this.geometry, this.material, 2100);
  private readonly figure = new Group();
  private readonly part = new Object3D();
  private readonly axis = new Vector3(0, 1, 0);
  private readonly direction = new Vector3();
  private readonly colour = new Color();
  private readonly place = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private index = 0;
  guitarHand: number | null = null;

  constructor(private readonly course: Course) {
    this.figure.add(this.part);
    this.mesh.frustumCulled = false;
    this.update(0, 0);
  }
  private oval(
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz: number,
    tint: number,
  ): void {
    this.part.position.set(x, y, z);
    this.part.quaternion.identity();
    this.part.scale.set(rx, ry, rz);
    this.write(tint);
  }

  private line(
    x: number,
    y: number,
    z: number,
    xx: number,
    yy: number,
    zz: number,
    radius: number,
    tint: number,
  ): void {
    this.direction.set(xx - x, yy - y, zz - z);
    const length = this.direction.length();
    this.part.quaternion.setFromUnitVectors(this.axis, this.direction.normalize());
    this.part.position.set((x + xx) / 2, (y + yy) / 2, (z + zz) / 2);
    this.part.scale.set(radius, length / 2 + 0.012, radius);
    this.write(tint);
  }

  private write(tint: number): void {
    this.part.updateWorldMatrix(false, false);
    this.mesh.setMatrixAt(this.index, this.part.matrixWorld);
    this.mesh.setColorAt(this.index, this.colour.setHex(tint));
    this.index++;
  }

  update(metres: number, seconds: number): void {
    const lap = metres % LAP;
    this.index = 0;
    this.guitarHand = null;
    for (const anchor of VENUES) {
      const distance = Math.min(Math.abs(lap - anchor), LAP - Math.abs(lap - anchor));
      if (distance > 130) continue;
      this.person(anchor, -9.4, 1.1, seconds, 0, 'guitar');
      this.person(anchor + 2.4, -10.1, 1.1, seconds, 1, 'drums');
      this.person(anchor - 2.15, -9.65, 1.1, seconds, 2, 'vocals');
    }
    for (let row = 0; row < 78; row++) {
      const d = row * 19.8;
      const gap = Math.abs(lap - d);
      if (Math.min(gap, LAP - gap) > 75) continue;
      for (let i = 0; i < 8; i++) {
        const side = i % 2 ? 1 : -1;
        this.person(
          d + i * 1.83,
          side * (5.5 + 1.2 * Math.sin(row * 7.1 + i * 2.97)),
          0.08,
          seconds,
          row * 8 + i,
          'crowd',
        );
      }
    }
    this.mesh.count = this.index;
    this.mesh.visible = this.index > 0;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  private person(
    d: number,
    lane: number,
    base: number,
    t: number,
    i: number,
    role: 'guitar' | 'drums' | 'vocals' | 'crowd',
  ): void {
    const at = this.course.place(d, lane, this.place);
    const beat = t * 4.1 + i * 1.47;
    const crowd = role === 'crowd';
    const seated = role === 'drums';
    const skin = [0xb78265, 0x865c4c, 0xd4a385, 0x9b6b55][i % 4]!;
    const shirt = [0xb76655, 0x588b96, 0xc0a56a, 0x946781, 0x7e8e59][i % 5]!;
    const jeans = 0x39404c;
    this.figure.position.set(at.x, at.y + base, at.z);
    this.figure.rotation.y = at.heading + (lane < 0 ? -1 : 1) * 1.5 + 0.22 * Math.sin(i * 3.73);
    this.figure.scale.setScalar(0.92 + 0.13 * (0.5 + 0.5 * Math.sin(i * 5.6)));
    this.figure.updateMatrixWorld();
    const hip = seated ? 0.61 : 0.96;
    const sway = 0.052 * Math.sin(beat * 0.5);
    this.oval(sway, hip + 0.26, 0, 0.217, 0.33, 0.148, shirt);
    this.oval(sway, hip + 0.73, 0, 0.142, 0.186, 0.13, skin);
    this.oval(sway, hip + 0.853, -0.025, 0.145, 0.105, 0.128, 0x423535);
    for (const side of [-1, 1]) {
      const kneeZ = seated ? 0.24 : 0.035;
      this.line(side * 0.11, hip, 0, side * 0.145, 0.48, kneeZ, 0.09, jeans);
      this.line(side * 0.145, 0.48, kneeZ, side * 0.17, 0.08, seated ? 0.21 : 0, 0.063, jeans);
      this.oval(side * 0.17, 0.07, seated ? 0.27 : 0.06, 0.077, 0.076, 0.14, 0x3f3b40);
      const handX =
        role === 'guitar'
          ? side * (side === 1 ? 0.1 : 0.41)
          : side * (0.25 + 0.11 * Math.sin(beat * 0.5));
      const handY =
        role === 'guitar'
          ? hip + (side === 1 ? 0.2 + 0.16 * Math.sin(beat * 1.6) : 0.42)
          : seated
            ? hip + 0.24 + 0.23 * Math.sin(beat + side)
            : hip + 0.17 + (crowd && i % 4 === 0 ? 0.48 : 0) + 0.12 * Math.sin(beat + side);
      this.line(sway + side * 0.17, hip + 0.45, 0, side * 0.27, hip + 0.25, 0.08, 0.074, shirt);
      this.line(side * 0.27, hip + 0.25, 0.08, handX, handY, 0.22, 0.055, skin);
      if (role === 'guitar' && side === 1) this.guitarHand = this.part.matrixWorld.elements[13]!;
      if (seated) this.line(handX, handY, 0.22, handX + 0.12, handY + 0.19, 0.41, 0.018, 0xd6b487);
    }
    if (role === 'guitar') {
      this.oval(0.09, hip + 0.07, 0.203, 0.19, 0.22, 0.066, 0xc78648);
      this.oval(-0.08, hip + 0.2, 0.206, 0.143, 0.165, 0.061, 0xc78648);
      this.line(-0.1, hip + 0.24, 0.21, -0.53, hip + 0.48, 0.21, 0.045, 0x72513b);
      this.oval(0.012, hip + 0.155, 0.261, 0.051, 0.055, 0.014, 0x4c3930);
    }
    if (seated) {
      this.oval(0, 0.48, 0.5, 0.33, 0.33, 0.23, 0xb35f47);
      this.oval(-0.35, 0.74, 0.22, 0.22, 0.12, 0.22, 0xba744f);
      this.oval(0.49, 0.94, 0.27, 0.24, 0.025, 0.24, 0xc8aa68);
    }
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
