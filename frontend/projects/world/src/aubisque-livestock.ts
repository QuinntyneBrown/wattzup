import {
  Color,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three/webgpu';

import { Course } from './course';

const herds = [158, 3170, 8160, 12412];
/** Nearby livestock share a single instanced draw. Each hoof follows the local road height. */
export class AubisqueLivestock {
  private readonly geometry = new SphereGeometry(1, 9, 6);
  private readonly material = new MeshStandardMaterial({ roughness: 0.94 });
  readonly mesh = new InstancedMesh(this.geometry, this.material, 180);
  private readonly animal = new Group();
  private readonly part = new Object3D();
  private readonly axis = new Vector3(0, 1, 0);
  private readonly direction = new Vector3();
  private readonly colour = new Color();
  private readonly place = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private index = 0;
  private painted = false;
  horseLane: number | null = null;

  constructor(private readonly course: Course) {
    this.animal.add(this.part);
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
    if (!this.painted) this.mesh.setColorAt(this.index, this.colour.setHex(tint));
    this.index++;
  }

  update(rider: number, seconds: number): void {
    const herd = herds.find((distance) => Math.abs(distance - rider) < 200);
    this.mesh.visible = herd !== undefined;
    this.horseLane = null;
    if (herd === undefined) return;
    this.index = 0;
    for (let i = 0; i < 6; i++) {
      const horse = i === 0 || i === 4;
      const sheep = i === 2 || i === 3;
      const phase = seconds * 1.4 + i * 1.5;
      const approach = Math.min(1, Math.max(0, (55 - Math.abs(herd + i * 4 - rider)) / 44));
      const lane =
        (i % 2 ? -1 : 1) * (1.2 + (i % 3) * 0.65 + 1.65 * approach + 0.38 * Math.sin(phase * 0.65));
      this.course.place(herd + i * 4 + 0.55 * Math.cos(phase * 0.65), lane, this.place);
      this.animal.position.set(this.place.x, this.place.y, this.place.z);
      this.animal.rotation.y = this.place.heading + (i % 2 ? 0.5 : -0.6) + 0.1 * Math.sin(phase);
      this.animal.scale.setScalar(sheep ? 0.65 : 1);
      this.animal.updateMatrixWorld();
      if (i === 0) this.horseLane = lane;
      const hide = sheep ? 0xdad4ba : horse ? (i === 0 ? 0x8e5032 : 0xb88b5e) : 0xa78359;
      const dark = sheep ? 0x554c42 : 0x423126;
      const back = sheep ? 0.93 : horse ? 1.27 : 1.12;
      const nose = back + 0.23 + 0.27 * Math.sin(phase * 0.47);
      this.oval(0, back, 0, 0.83, sheep ? 0.5 : 0.39, sheep ? 0.44 : 0.32, hide);
      this.line(0.51, back + 0.05, 0, 0.88, nose + 0.22, 0, horse ? 0.19 : 0.23, hide);
      this.oval(0.99, nose + 0.16, 0, 0.24, 0.19, 0.155, sheep ? dark : hide);
      this.oval(1.16, nose + 0.04, 0, 0.19, 0.125, 0.145, dark);
      for (let leg = 0; leg < 4; leg++) {
        const x = leg < 2 ? -0.56 : 0.53,
          z = leg % 2 ? -0.21 : 0.21;
        const gait = Math.sin(phase + (leg === 0 || leg === 3 ? 0 : Math.PI));
        const foot = x + 0.14 * gait;
        this.line(x, back - 0.13, z, x - 0.05, 0.45, z, horse ? 0.096 : 0.12, hide);
        this.line(x - 0.05, 0.45, z, foot, 0.09, z, 0.059, dark);
        this.oval(foot, 0.075 + 0.045 * Math.max(0, gait), z, 0.095, 0.074, 0.068, dark);
      }
      for (const side of [-1, 1]) {
        this.line(
          0.87,
          nose + 0.22,
          side * 0.09,
          0.84,
          nose + (horse ? 0.52 : 0.31),
          side * (horse ? 0.12 : 0.34),
          0.07,
          hide,
        );
        this.oval(1.04, nose + 0.23, side * 0.14, 0.035, 0.037, 0.019, 0x241b18);
        if (!sheep && !horse)
          this.line(
            0.94,
            nose + 0.28,
            side * 0.12,
            1.01,
            nose + 0.43,
            side * 0.37,
            0.046,
            0xd9cfad,
          );
      }
      if (horse) this.line(0.37, back + 0.29, 0, 0.84, nose + 0.34, 0, 0.11, dark);
      this.line(
        -0.72,
        back + 0.09,
        0,
        -0.88,
        back - (sheep ? 0.15 : 0.68),
        Math.sin(phase) * 0.1,
        horse ? 0.105 : 0.065,
        sheep ? hide : dark,
      );
    }
    this.mesh.count = this.index;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (!this.painted && this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.painted = true;
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
