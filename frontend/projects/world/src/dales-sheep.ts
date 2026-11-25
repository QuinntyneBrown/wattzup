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

const herds = [610, 3275, 7488, 12440, 14545, 18210, 22722];
/** Nearby livestock share a single instanced draw. Each hoof follows the local road height. */
export class DalesSheep {
  private readonly geometry = new SphereGeometry(1, 9, 6);
  private readonly material = new MeshStandardMaterial({ roughness: 0.94 });
  readonly mesh = new InstancedMesh(this.geometry, this.material, 740);
  private readonly animal = new Group();
  private readonly part = new Object3D();
  private readonly axis = new Vector3(0, 1, 0);
  private readonly direction = new Vector3();
  private readonly colour = new Color();
  private readonly place = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private index = 0;
  private painted = false;
  sheepX: number | null = null;

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
    this.sheepX = null;
    if (herd === undefined) return;
    this.index = 0;
    for (let i = 0; i < 10; i++) {
      const phase = seconds * 0.65 + i * 1.53;
      const crosses = i === 0 || i === 6;
      const lane = crosses
        ? 4.25 * Math.sin(phase * 0.19)
        : (i % 2 === 0 ? 1 : -1) * (4.65 + (i % 4) * 0.58);
      const station = herd + i * 3.4 + Math.cos(phase * 0.38) * 0.68;
      this.course.place(station, lane, this.place);
      this.animal.position.set(this.place.x, this.place.y - 0.05, this.place.z);
      this.animal.rotation.y =
        this.place.heading +
        (crosses ? (Math.cos(phase * 0.19) > 0 ? 0 : Math.PI) : 1.16) +
        0.14 * Math.sin(phase);
      this.animal.scale.setScalar(0.68 + 0.039 * (i % 4));
      this.animal.updateMatrixWorld();
      const fleece = i % 3 === 0 ? 0xe6dfc5 : i % 3 === 1 ? 0xd5cfb5 : 0xdad5c1;
      const dark = 0x393834,
        nose = 0.65 + (crosses ? 0.32 : 0.29 * Math.sin(phase));
      this.oval(0, 0.85, 0, 0.77, 0.43, 0.38, fleece);
      if (i === 0) this.sheepX = this.part.matrixWorld.elements[12]!;
      for (let curl = 0; curl < 10; curl++) {
        const x = -0.48 + (curl % 5) * 0.23,
          z = curl < 5 ? -0.25 : 0.25;
        this.oval(x, 0.93 + 0.06 * Math.cos(curl), z, 0.28, 0.265, 0.18, fleece);
      }
      this.line(0.43, 0.87, 0, 0.73, nose + 0.09, 0, 0.19, fleece);
      this.oval(0.83, nose, 0, 0.23, 0.22, 0.16, dark);
      this.oval(1.0, nose - 0.12, 0, 0.18, 0.106, 0.12, dark);
      this.oval(0.98, nose - 0.02, 0, 0.11, 0.105, 0.153, 0xdfd8c1);
      for (const side of [-1, 1]) {
        this.oval(0.74, nose + 0.1, side * 0.19, 0.15, 0.058, 0.12, dark);
        this.oval(0.91, nose + 0.06, side * 0.145, 0.034, 0.034, 0.02, 0x1f201d);
        // Broad pale ram horns curl down and back around the dark cheek.
        for (let j = 0; j < 7; j++) {
          const t = j * 0.58,
            next = t + 0.58;
          this.line(
            0.73 + 0.19 * Math.cos(t),
            nose + 0.055 + 0.16 * Math.sin(t),
            side * (0.16 + j * 0.008),
            0.73 + 0.19 * Math.cos(next),
            nose + 0.055 + 0.16 * Math.sin(next),
            side * (0.168 + j * 0.008),
            0.041,
            0xc3b99a,
          );
        }
      }
      for (let leg = 0; leg < 4; leg++) {
        const x = leg < 2 ? -0.49 : 0.43,
          z = leg % 2 ? 0.195 : -0.195;
        const foot =
          x +
          (crosses ? 0.14 : 0.031) * Math.sin(phase * 2.5 + (leg === 0 || leg === 3 ? 0 : Math.PI));
        this.line(x, 0.66, z, x, 0.36, z, 0.095, fleece);
        this.line(x, 0.36, z, foot, 0.07, z, 0.053, dark);
        this.oval(foot, 0.05, z, 0.075, 0.05, 0.055, dark);
      }
      this.oval(-0.65, 0.73, 0, 0.19, 0.14, 0.11, fleece);
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
