import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  type BufferGeometry,
} from 'three/webgpu';
import { canvasTexture } from './world-kit';

/** An open-top New York parade bus. All rigid parts stay in three instance buffers. */
export class BroadwayBus {
  readonly root = new Group();
  private readonly coat = new MeshLambertMaterial({ emissive: 0x18151a });
  private readonly joint = new Object3D();
  private readonly ink = new Color();
  private readonly batches: InstancedMesh[] = [];
  private readonly lettering = canvasTexture(1024, 144, (g) => {
    g.fillStyle = '#173e81';
    g.fillRect(0, 0, 1024, 144);
    g.fillStyle = '#f58228';
    g.fillRect(0, 5, 1024, 8);
    g.fillStyle = '#fff0d1';
    g.textAlign = 'center';
    g.font = 'bold 74px sans-serif';
    g.fillText('NEW YORK CHAMPIONS', 512, 101, 940);
  });
  private readonly flankMaterial = new MeshBasicMaterial({ map: this.lettering });
  private readonly flank = new PlaneGeometry(8.7, 0.96);
  private batch(shape: BufferGeometry, limit: number) {
    const mesh = new InstancedMesh(shape, this.coat, limit);
    mesh.count = 0;
    this.root.add(mesh);
    this.batches.push(mesh);
    return mesh;
  }
  private add(
    to: InstancedMesh,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    colour: number,
    roll = 0,
    yaw = 0,
  ) {
    this.joint.position.set(x, y, z);
    this.joint.rotation.set(0, yaw, roll, 'YXZ');
    this.joint.scale.set(w, h, d);
    this.joint.updateMatrix();
    to.setMatrixAt(to.count, this.joint.matrix);
    to.setColorAt(to.count++, this.ink.setHex(colour));
  }
  constructor() {
    const boxes = this.batch(new BoxGeometry(), 120),
      round = this.batch(new SphereGeometry(1, 12, 9), 190);
    const wheel = new CylinderGeometry(1, 1, 1, 18);
    wheel.rotateZ(Math.PI / 2);
    const wheels = this.batch(wheel, 12);
    this.add(boxes, 0, 0.96, 0, 2.52, 0.84, 10.3, 0x1f407b);
    this.add(boxes, 0, 1.83, 0, 2.48, 1.37, 10.18, 0xf0e2cc);
    this.add(boxes, 0, 2.79, 0, 2.53, 0.46, 10.25, 0xe7772e);
    this.add(boxes, 0, 2.19, -5.11, 2.05, 0.97, 0.055, 0x496275);
    this.add(boxes, 0, 2.13, 5.11, 2.12, 0.91, 0.055, 0x455565);
    this.add(boxes, 0, 1.04, 5.15, 2.09, 0.13, 0.07, 0xaba6a0);
    for (const x of [-1.25, 1.25]) {
      this.add(boxes, x, 3.1, 0, 0.07, 0.48, 9.95, 0x244689);
      this.add(boxes, x, 3.74, 0, 0.065, 0.062, 9.94, 0xc6beb1);
      for (let i = 0; i < 9; i++) {
        const z = -4.42 + i * 1.105;
        this.add(boxes, x, 2.08, z, 0.042, 0.75, 0.92, 0x506b79);
        this.add(boxes, x, 3.44, z, 0.056, 0.62, 0.064, 0xc9bba2);
      }
      for (const z of [-3.25, 2.62, 3.73]) {
        this.add(wheels, x, 0.56, z, 0.25, 0.55, 0.55, 0x25262e);
        this.add(wheels, x * 1.075, 0.56, z, 0.12, 0.265, 0.265, 0xb0a99e);
      }
      const panel = new Mesh(this.flank, this.flankMaterial);
      panel.position.set(x * 1.025, 1.14, 0);
      panel.rotation.y = (Math.sign(x) * Math.PI) / 2;
      this.root.add(panel);
    }
    for (let i = 0; i < 16; i++) {
      const x = i % 2 ? 0.64 : -0.65,
        z = -4 + Math.floor(i / 2) * 1.13,
        skin = [0x784f39, 0xa77354, 0xcc9974, 0x694833][i % 4]!;
      const shirt = i % 3 ? 0x315796 : 0xe88941;
      this.add(round, x, 3.48, z, 0.205, 0.36, 0.166, shirt);
      this.add(round, x, 3.99, z, 0.143, 0.171, 0.135, skin);
      this.add(round, x, 4.12, z, 0.148, 0.08, 0.14, i % 3 ? 0x43362e : 0xe87b3a);
      for (const side of [-1, 1]) {
        const lift = i % 3 === 0 && side === 1;
        this.add(
          round,
          x + side * 0.24,
          lift ? 3.96 : 3.59,
          z,
          0.08,
          0.22,
          0.09,
          skin,
          side * (lift ? 0.36 : 0.55),
        );
      }
    }
  }
  dispose() {
    for (const b of this.batches) {
      b.geometry.dispose();
      b.dispose();
    }
    this.coat.dispose();
    this.flank.dispose();
    this.flankMaterial.dispose();
    this.lettering.dispose();
  }
}
