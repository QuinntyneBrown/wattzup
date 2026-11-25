import {
  Color,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three/webgpu';

/** A flock at each physical lagoon. A single instance buffer carries the nearest flock. */
export class AtacamaFlamingos {
  private readonly geometry = new SphereGeometry(1, 10, 7);
  private readonly material = new MeshStandardMaterial({ roughness: 0.85 });
  readonly mesh = new InstancedMesh(this.geometry, this.material, 22 * 16);
  private readonly bird = new Group();
  private readonly part = new Object3D();
  private readonly axis = new Vector3(0, 1, 0);
  private readonly direction = new Vector3();
  private readonly colour = new Color();
  private index = 0;
  private painted = false;
  billHeight = 0;

  constructor() {
    this.bird.add(this.part);
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
    this.mesh.visible = Math.abs(x - colony) < 470;
    if (!this.mesh.visible) return;
    this.index = 0;
    for (let i = 0; i < 22; i++) {
      const dx = 14 + (i % 7) * 9 + 15 * Math.sin(i * 6.2);
      const cx = colony + dx + (i > 12 ? 51 : 0);
      const z =
        (colony === 8630 ? -1 : 1) *
        (15 + (i % 4) * 2.6 + 6 * Math.abs(Math.sin(i * 2.3)) + (colony === 16740 ? 6 : 0));
      const water = -0.37;
      this.bird.position.set(cx, water, z);
      this.bird.rotation.y = Math.sin(i * 31.5) * 1.5;
      this.bird.updateMatrixWorld();
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
