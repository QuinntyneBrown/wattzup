import {
  Color,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from 'three/webgpu';

/** Three runners share a single draw call on the museum's six flights. */
export class ArtMuseumJoggers {
  private readonly geometry = new SphereGeometry(1, 8, 6);
  private readonly material = new MeshStandardMaterial({ roughness: 0.9 });
  readonly mesh = new InstancedMesh(this.geometry, this.material, 36);
  private readonly root = new Group();
  private readonly part = new Object3D();
  private index = 0;
  height = 0;

  constructor() {
    this.root.add(this.part);
    this.update(0);
    this.mesh.computeBoundingSphere();
    // All poses stay inside the flight and its two landings.
    this.mesh.boundingSphere!.center.set(-39, 6, 0);
    this.mesh.boundingSphere!.radius = 44;
    const shirts = [0xa94532, 0x557e87, 0xe4b74f];
    const skins = [0xac785b, 0x805944, 0xc69b76];
    for (let i = 0; i < 3; i++) {
      const colours = [shirts[i], skins[i]];
      for (let side = 0; side < 2; side++)
        colours.push(0x424954, skins[i], 0xdfdcd2, shirts[i], skins[i]);
      colours.forEach((value, j) => this.mesh.setColorAt(i * 12 + j, new Color(value)));
    }
  }

  private limb(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    angle = 0,
  ): void {
    this.part.position.set(x, y, z);
    this.part.scale.set(width, height, depth);
    this.part.rotation.z = angle;
    this.part.updateWorldMatrix(false, false);
    this.mesh.setMatrixAt(this.index++, this.part.matrixWorld);
  }

  update(seconds: number): void {
    this.index = 0;
    for (let i = 0; i < 3; i++) {
      const t = (seconds + 4 + 17 * i) % 70;
      const forward = t < 35;
      const travelled = Math.min(1, forward ? t / 30 : (70 - t) / 35);
      const span = 71.84 * travelled;
      const flight = Math.min(5, Math.floor(span / 12.64));
      const ground = 0.17 * (flight * 12 + Math.min(12, (span - 12.64 * flight) / 0.72));
      const cheer = Math.max(0, Math.min(1, t - 30, 35 - t));
      const stride = Math.sin(t * 9) * (1 - cheer);
      this.root.position.set(-75.84 + span, ground + Math.abs(stride) * 0.055, (i - 1) * 3.6 + 2.3);
      this.root.rotation.y = forward ? 0 : Math.PI;
      this.root.updateMatrixWorld();
      if (i === 0) this.height = this.root.position.y;
      this.limb(0.03, 1.17, 0, 0.155, 0.32, 0.226, -0.12);
      this.limb(0.09, 1.66, 0, 0.123, 0.156, 0.12);
      for (const side of [-1, 1]) {
        const swing = side * stride;
        const hip = 0.62 * swing;
        const shin = hip - 0.38 - Math.max(0, -swing) * 0.55;
        const kneeX = 0.42 * Math.sin(hip);
        const kneeY = 0.9 - 0.42 * Math.cos(hip);
        this.limb(kneeX / 2, (0.9 + kneeY) / 2, side * 0.108, 0.099, 0.25, 0.099, hip);
        this.limb(
          kneeX + 0.2 * Math.sin(shin),
          kneeY - 0.2 * Math.cos(shin),
          side * 0.108,
          0.073,
          0.22,
          0.075,
          shin,
        );
        this.limb(
          kneeX + 0.4 * Math.sin(shin) + 0.055,
          kneeY - 0.4 * Math.cos(shin),
          side * 0.108,
          0.14,
          0.066,
          0.08,
        );
        const arm = -0.42 * swing + 2.55 * cheer;
        const elbowX = 0.24 * Math.sin(arm);
        const elbowY = 1.38 - 0.24 * Math.cos(arm);
        this.limb(elbowX / 2, (elbowY + 1.38) / 2, side * 0.215, 0.075, 0.15, 0.075, arm);
        this.limb(
          elbowX + 0.13 * Math.sin(arm + 1.15),
          elbowY - 0.13 * Math.cos(arm + 1.15),
          side * 0.22,
          0.06,
          0.15,
          0.06,
          arm + 1.15,
        );
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}
