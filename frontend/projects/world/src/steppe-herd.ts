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

const herds = [180, 6550, 13420, 18740];
/** Nearby livestock share a single instanced draw. Each hoof follows the local road height. */
export class SteppeHerd {
  private readonly geometry = new SphereGeometry(1, 9, 6);
  private readonly material = new MeshStandardMaterial({ roughness: 0.94 });
  readonly mesh = new InstancedMesh(this.geometry, this.material, 720);
  private readonly animal = new Group();
  private readonly part = new Object3D();
  private readonly axis = new Vector3(0, 1, 0);
  private readonly direction = new Vector3();
  private readonly colour = new Color();
  private readonly place = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private index = 0;
  private coloursAt = -1;
  private paint = true;
  horseStride: number | null = null;
  herderTravel: number | null = null;

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
    if (this.paint) this.mesh.setColorAt(this.index, this.colour.setHex(tint));
    this.index++;
  }

  update(rider: number, seconds: number) {
    const station = herds.find((d) => Math.abs(rider - d) < 230);
    this.horseStride = this.herderTravel = null;
    this.mesh.visible = station !== undefined;
    if (station === undefined) return;
    this.paint = this.coloursAt !== station;
    this.index = 0;
    const flock = station === 13420,
      running = station === 6550;
    const count = flock ? 14 : running ? 10 : 5;
    for (let i = 0; i < count; i++) {
      const mounted = flock && i === 0,
        goat = flock && i > 0 && i % 3 === 1,
        yak = flock && i > 0 && i % 3 === 2;
      const horse = !flock || mounted;
      const phase = seconds * (running ? 5.9 : mounted ? 3.4 : 1.1) + i * 1.54;
      const along =
        station +
        12 +
        i * 2.4 +
        (running ? 8.2 : mounted ? 4 : 1.65) *
          Math.sin(seconds * (running ? 0.136 : 0.16) + i * 0.23);
      const lane =
        (running ? -1 : 1) * (3.7 + (i % 4) * 1.35) +
        (running ? 3.2 * Math.sin(seconds * 0.12 + i * 0.32) : 0.47 * Math.cos(phase * 0.34));
      this.course.place(along, lane, this.place);
      this.animal.position.set(
        this.place.x,
        this.place.y + (running ? 0.1 * Math.max(0, Math.sin(phase)) : 0),
        this.place.z,
      );
      this.animal.rotation.y =
        this.place.heading +
        Math.PI / 2 +
        (running ? 0.19 * Math.sin(seconds * 0.12 + i * 0.32) : 0.13 * Math.sin(i));
      this.animal.scale.setScalar(horse ? 1 : yak ? 0.99 : goat ? 0.61 : 0.65);
      this.animal.updateMatrixWorld();
      const shadowLength = station === 18740 ? 2.7 : 1.1;
      this.oval(-shadowLength * 0.43, -0.085, 0, shadowLength, 0.022, 0.49, 0x545837);
      const hide = horse
        ? [0xb39566, 0x9d6a43, 0xc59b67, 0x80513a][i % 4]!
        : yak
          ? 0x493d32
          : goat
            ? 0xa59a7e
            : 0xd7ccb3;
      const dark = horse ? 0x48382b : yak ? 0x322e2b : 0x635542;
      const back = horse ? 1.17 : yak ? 1.02 : 0.94,
        neck = horse ? 1.48 : 1.13;
      this.oval(0, back, 0, 0.81, horse ? 0.36 : 0.46, horse ? 0.3 : 0.41, hide);
      this.line(0.42, back + 0.07, 0, 0.78, neck + 0.12, 0, horse ? 0.22 : 0.25, hide);
      this.oval(0.91, neck + 0.1, 0, 0.245, 0.17, 0.16, hide);
      this.oval(1.095, neck + 0.04, 0, 0.18, 0.12, 0.131, horse ? 0xd4bd95 : dark);
      for (const side of [-1, 1]) {
        this.line(0.78, neck + 0.17, side * 0.09, 0.76, neck + 0.44, side * 0.14, 0.056, hide);
        this.oval(1.02, neck + 0.14, side * 0.139, 0.034, 0.035, 0.02, 0x2f2925);
        if (yak || goat)
          this.line(0.84, neck + 0.18, side * 0.11, 0.79, neck + 0.4, side * 0.32, 0.057, 0xc9bea4);
      }
      if (horse) this.line(0.34, back + 0.29, 0, 0.77, neck + 0.29, 0, 0.105, dark);
      if (yak)
        for (let j = 0; j < 5; j++)
          this.oval(-0.53 + j * 0.26, back - 0.28, 0, 0.18, 0.43, 0.34, hide);
      for (let j = 0; j < 4; j++) {
        const x = j < 2 ? -0.53 : 0.49,
          z = j % 2 ? -0.19 : 0.19;
        const stride = Math.sin(phase + (j < 2 ? 2.95 : 0) + (j % 2) * 0.81),
          swing = running ? 0.47 : mounted ? 0.23 : 0.09;
        const knee = x + swing * stride * 0.58,
          foot = x + swing * stride;
        const lift = (running ? 0.29 : 0.12) * Math.max(0, -Math.cos(phase + j * 1.1));
        this.line(x, back - 0.06, z, knee, 0.52 + lift * 0.42, z, 0.085, hide);
        this.line(knee, 0.54 + lift * 0.42, z, foot, 0.12 + lift, z, 0.05, dark);
        this.oval(foot + 0.025, 0.075 + lift, z, 0.09, 0.071, 0.064, dark);
        if (running && i === 0 && j === 0) this.horseStride = knee;
      }
      this.line(
        -0.69,
        back + 0.17,
        0,
        -1.0,
        back - (running ? 0.3 : 0.55),
        Math.sin(phase) * 0.11,
        0.105,
        dark,
      );
      if (mounted) {
        this.oval(0, 1.51, 0, 0.3, 0.09, 0.31, 0x715035);
        this.oval(0, 1.83, 0, 0.22, 0.35, 0.18, 0x3b677c);
        this.oval(0, 2.26, 0, 0.138, 0.17, 0.13, 0xaf8061);
        this.oval(0, 2.39, 0, 0.18, 0.08, 0.17, 0x634831);
        this.oval(0, 1.79, 0, 0.22, 0.045, 0.18, 0x9a5c42);
        for (const side of [-1, 1]) {
          this.line(-0.06, 1.62, side * 0.13, 0.14, 1.16, side * 0.3, 0.082, 0x435865);
          this.line(0.03, 1.99, side * 0.17, 0.28, 1.81, side * 0.18, 0.058, 0x3b677c);
        }
        this.herderTravel = this.animal.position.x;
      }
    }
    this.mesh.count = this.index;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.paint && this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.coloursAt = station;
  }
  dispose() {
    this.mesh.removeFromParent();
    this.mesh.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
