import {
  Color,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three/webgpu';

/** The lagoon and grazing groups occupy separate shores. The nearest group uses one draw call. */
export class AtacamaWildlife {
  private readonly geometry = new SphereGeometry(1, 10, 7);
  private readonly material = new MeshStandardMaterial({ roughness: 0.85 });
  readonly mesh = new InstancedMesh(this.geometry, this.material, 22 * 16);
  private readonly animal = new Group();
  private readonly part = new Object3D();
  private readonly axis = new Vector3(0, 1, 0);
  private readonly direction = new Vector3();
  private readonly colour = new Color();
  private index = 0;
  private painted = false;
  private herdVisible = false;
  billHeight = 0;
  headHeight = 0;

  constructor() {
    this.animal.add(this.part);
    this.mesh.frustumCulled = false;
    this.update(1180, 0);
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

  update(x: number, seconds: number): void {
    const colony = x < 4800 ? 1180 : x < 13000 ? 8630 : 16740;
    const herd = x < 5000 ? 2040 : x < 12300 ? 8160 : 17210;
    const nearHerd = Math.abs(x - herd) < Math.abs(x - colony);
    this.mesh.visible = Math.abs(x - (nearHerd ? herd : colony)) < 360;
    if (!this.mesh.visible) return;
    if (this.herdVisible !== nearHerd) this.painted = false;
    this.herdVisible = nearHerd;
    this.index = 0;
    if (nearHerd) this.graze(herd, seconds);
    else this.feed(colony, seconds);
    this.mesh.count = this.index;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (!this.painted && this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.painted = true;
  }

  private graze(herd: number, seconds: number): void {
    const tawny = 0xb48256,
      chest = 0xe1ca9e,
      feet = 0x694d39;
    for (let i = 0; i < 5; i++) {
      this.animal.position.set(
        herd + i * 8.3,
        -0.16,
        herd === 8160 ? -12 - i * 2 : 9.4 + (i % 3) * 2.7,
      );
      this.animal.rotation.y = 1.18 + i * 0.93;
      this.animal.updateMatrixWorld();
      const feed = (1 + Math.sin(seconds * 0.76 + i * 1.8)) / 2;
      const hx = 0.55 + 0.56 * feed,
        hy = 1.76 - 1.3 * feed;
      this.oval(0, 1.01, 0, 0.62, 0.27, 0.202, tawny);
      this.oval(0.29, 0.95, 0, 0.3, 0.32, 0.21, chest);
      this.oval(-0.57, 1.06, 0, 0.15, 0.065, 0.08, 0x97724e);
      for (let leg = 0; leg < 4; leg++) {
        const px = leg < 2 ? -0.39 : 0.4,
          pz = leg % 2 ? 0.12 : -0.12;
        const knee = px + (leg < 2 ? -0.07 : 0.04);
        this.line(px, 0.92, pz, knee, 0.53, pz, 0.062, tawny);
        this.line(knee, 0.53, pz, px + 0.05, 0.035, pz, 0.033, feet);
      }
      this.line(0.41, 1.14, 0, hx - 0.05, hy - 0.05, 0, 0.116, chest);
      this.oval(hx, hy, 0, 0.151, 0.116, 0.091, tawny);
      if (i === 0) this.headHeight = this.part.matrixWorld.elements[13]!;
      this.oval(hx + 0.122, hy - 0.037, 0, 0.112, 0.063, 0.068, 0x9f795a);
      for (const side of [-1, 1]) {
        this.line(
          hx - 0.06,
          hy + 0.06,
          side * 0.044,
          hx - 0.089,
          hy + 0.27,
          side * 0.093,
          0.042,
          tawny,
        );
        this.oval(hx + 0.044, hy + 0.022, side * 0.087, 0.022, 0.023, 0.012, feet);
      }
    }
  }

  private feed(colony: number, seconds: number): void {
    for (let i = 0; i < 22; i++) {
      const dx = 14 + (i % 7) * 9 + 15 * Math.sin(i * 6.2);
      const cx = colony + dx + (i > 12 ? 51 : 0);
      const z =
        (colony === 8630 ? -1 : 1) *
        (15 + (i % 4) * 2.6 + 6 * Math.abs(Math.sin(i * 2.3)) + (colony === 16740 ? 6 : 0));
      const water = -0.37;
      this.animal.position.set(cx, water, z);
      this.animal.rotation.y = Math.sin(i * 31.5) * 1.5;
      this.animal.updateMatrixWorld();
      const rose = [0xf1c3b9, 0xf7c9c3, 0xe8aaa9, 0xe9b2b0][i % 4]!;
      const blush = 0xd67f85,
        black = 0x39383e,
        leg = 0xc49b76;
      const feed = (1 + Math.sin(seconds * 0.95 + i * 1.7)) / 2;
      this.oval(0, 0.73, 0, 0.39, 0.191, 0.174, rose);
      this.oval(-0.08, 0.75, 0.116, 0.32, 0.126, 0.084, blush);
      this.oval(-0.22, 0.724, 0.124, 0.204, 0.078, 0.063, black);
      this.oval(-0.12, 0.77, -0.117, 0.29, 0.112, 0.08, blush);
      for (const side of [-1, 1]) {
        const px = side * 0.096;
        this.line(px, 0.65, side * 0.055, px - 0.05, 0.32, side * 0.07, 0.024, leg);
        this.line(px - 0.05, 0.32, side * 0.07, px + 0.08, 0.004, side * 0.095, 0.018, leg);
      }
      const headX = 0.57 + 0.15 * feed,
        headY = 1.49 - 1.36 * feed;
      const jointX = 0.27 + 0.09 * feed,
        jointY = 0.99 - 0.41 * feed;
      this.line(0.22, 0.79, 0, jointX, jointY, 0, 0.061, rose);
      this.line(jointX, jointY, 0, headX - 0.12, headY - 0.13 + 0.23 * feed, 0, 0.049, rose);
      this.line(headX - 0.12, headY - 0.13 + 0.23 * feed, 0, headX, headY, 0, 0.045, rose);
      this.oval(headX, headY, 0, 0.091, 0.083, 0.073, rose);
      this.line(headX + 0.04, headY, 0, headX + 0.14, headY - 0.049, 0, 0.048, 0xe5ae9c);
      this.line(headX + 0.14, headY - 0.049, 0, headX + 0.14, headY - 0.118, 0, 0.039, black);
      if (i === 0) this.billHeight = this.part.matrixWorld.elements[13]!;
      // Two soft reflected shapes lie on the surface beneath the bird.
      this.oval(0, 0.012, 0.02, 0.4, 0.008, 0.11, 0x9c9d9a);
      this.oval(0.33, 0.014, 0.04, 0.19, 0.007, 0.042, 0xa2a8a2);
    }
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
