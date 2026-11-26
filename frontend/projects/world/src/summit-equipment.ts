import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';

/** A rotating Gemini enclosure with an open observing slit and a four-wheel-drive service pickup. */
export class SummitEquipment {
  readonly dome = new Group();
  readonly truck = new Group();
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly wheel = new CylinderGeometry(0.43, 0.43, 0.27, 12);
  private readonly shell = new SphereGeometry(
    8.35,
    36,
    14,
    0.18,
    Math.PI * 2 - 0.36,
    0,
    Math.PI / 2,
  );
  private readonly rim = new CylinderGeometry(8.47, 8.47, 0.48, 40);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private paint(color: number) {
    let material = this.paints.get(color);
    if (!material) {
      material = new MeshLambertMaterial({ color });
      this.paints.set(color, material);
    }
    return material;
  }
  private box(
    parent: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    color: number,
  ) {
    const mesh = new Mesh(this.cube, this.paint(color));
    mesh.scale.set(w, h, l);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  constructor() {
    const silver = 0xd9dcd9,
      rubber = 0x302e2c,
      white = 0xdcd1b7;
    this.dome.add(
      new Mesh(this.shell, this.paint(silver)),
      new Mesh(this.rim, this.paint(0x898c8b)),
    );
    for (const angle of [-0.18, 0.18]) {
      for (let i = 0; i < 12; i++) {
        const t = ((i + 0.5) * Math.PI) / 24;
        const rail = this.box(
          this.dome,
          -8.39 * Math.cos(t) * Math.cos(angle),
          8.39 * Math.sin(t),
          8.39 * Math.cos(t) * Math.sin(angle),
          0.3,
          0.26,
          1.2,
          0x717779,
        );
        rail.rotation.order = 'YXZ';
        rail.rotation.y = Math.PI / 2 + angle;
        rail.rotation.x = t - Math.PI / 2;
      }
    }
    this.box(this.truck, 0, 0.92, 0, 1.99, 0.65, 4.85, white);
    this.box(this.truck, 0, 1.44, 0.64, 1.82, 0.88, 1.85, 0x47575c);
    this.box(this.truck, 0, 1.94, 0.62, 1.96, 0.14, 1.95, white);
    this.box(this.truck, 0, 1.38, -1.33, 1.75, 0.09, 1.67, 0x625c51);
    for (const x of [-0.89, 0.89]) {
      this.box(this.truck, x, 1.49, -1.31, 0.12, 0.45, 1.8, white);
      this.box(this.truck, x, 1.62, 0.75, 0.11, 0.59, 0.12, white);
      this.box(this.truck, x * 0.8, 1.06, 2.435, 0.36, 0.2, 0.04, 0xffe4a0);
      for (const z of [-1.49, 1.45]) {
        const tire = new Mesh(this.wheel, this.paint(rubber));
        tire.rotation.z = Math.PI / 2;
        tire.position.set(x, 0.46, z);
        this.truck.add(tire);
      }
    }
    this.box(this.truck, 0, 2.1, 0.6, 0.62, 0.2, 0.3, 0xf29522);
  }
  clad(aluminium: Texture) {
    aluminium.repeat.set(3, 1);
    this.paint(0xd9dcd9).map = aluminium;
  }
  dispose() {
    this.truck.clear();
    this.dome.clear();
    for (const resource of [this.cube, this.wheel, this.shell, this.rim, ...this.paints.values()])
      resource.dispose();
  }
}
