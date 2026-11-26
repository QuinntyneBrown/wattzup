import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  TorusGeometry,
} from 'three/webgpu';

/** The observation cabins stay level as the rim and spoke pairs turn around the fixed axle. */
export class SingaporeFlyer {
  readonly root = new Group();
  private readonly rotating = new Group();
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly tube = new TorusGeometry(39, 0.16, 6, 112);
  private readonly rail = new MeshBasicMaterial({ color: 0xd0b8ea, fog: false });
  private readonly silver = new MeshBasicMaterial({ color: 0xa2a8bb, fog: false });
  private readonly glass = new MeshBasicMaterial({ color: 0xb8cfe0, fog: false });
  private readonly spokes = new InstancedMesh(this.cube, this.silver, 56);
  private readonly cabins = new InstancedMesh(this.cube, this.glass, 28);
  private readonly pose = new Object3D();
  constructor() {
    for (const z of [-1.3, 1.3]) {
      const rim = new Mesh(this.tube, this.rail);
      rim.position.z = z;
      this.rotating.add(rim);
    }
    for (let i = 0; i < 56; i++) {
      const a = (i * Math.PI) / 28;
      this.pose.position.set(19.5 * Math.cos(a), 19.5 * Math.sin(a), (i % 2 ? 1 : -1) * 0.77);
      this.pose.rotation.set(0, 0, a - Math.PI / 2);
      this.pose.scale.set(0.075, 39, 0.075);
      this.pose.updateMatrix();
      this.spokes.setMatrixAt(i, this.pose.matrix);
    }
    this.rotating.add(this.spokes);
    this.root.add(this.rotating, this.cabins);
    this.cabins.frustumCulled = false;
  }
  update(time: number) {
    const rotation = (time * Math.PI) / 720;
    this.rotating.rotation.z = rotation;
    let first = 0;
    for (let i = 0; i < 28; i++) {
      const a = (i * Math.PI) / 14 + rotation;
      this.pose.position.set(39 * Math.cos(a), 39 * Math.sin(a), 0);
      this.pose.rotation.set(0, 0, 0);
      this.pose.scale.set(2.2, 1.4, 3.72);
      this.pose.updateMatrix();
      this.cabins.setMatrixAt(i, this.pose.matrix);
      if (i === 0) first = this.pose.position.y;
    }
    this.cabins.instanceMatrix.needsUpdate = true;
    return first;
  }
  dispose() {
    this.root.clear();
    this.rotating.clear();
    for (const p of [
      this.cube,
      this.tube,
      this.spokes,
      this.cabins,
      this.glass,
      this.rail,
      this.silver,
    ])
      p.dispose();
  }
}
