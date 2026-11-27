import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Shape,
  ExtrudeGeometry,
} from 'three/webgpu';

/** Open 1950s cruiser with a long hood, chromed bumpers and raised rear fins. */
export class OceanDriveConvertible {
  readonly root = new Group();
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly tire = new CylinderGeometry(0.4, 0.4, 0.23, 16);
  private readonly sidewall = new CylinderGeometry(0.31, 0.31, 0.025, 16);
  private readonly hub = new CylinderGeometry(0.17, 0.17, 0.033, 12);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly lamps = new MeshBasicMaterial({ color: 0xffe6ad });
  private readonly tail = new MeshBasicMaterial({ color: 0xff3d59 });
  private readonly body: ExtrudeGeometry;
  private paint(color: number) {
    let mat = this.paints.get(color);
    if (!mat) {
      mat = new MeshLambertMaterial({ color });
      this.paints.set(color, mat);
    }
    return mat;
  }
  constructor() {
    const white = this.paint(0xe4dacc),
      coral = this.paint(0xf0826c),
      chrome = this.paint(0xb7c2d0),
      rubber = this.paint(0x25202b);
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      material = chrome,
    ) => {
      const part = new Mesh(this.cube, material);
      part.scale.set(w, h, l);
      part.position.set(x, y, z);
      this.root.add(part);
      return part;
    };
    const shape = new Shape();
    shape.moveTo(-2.53, 0.51);
    shape.lineTo(-2.41, 1.26);
    shape.lineTo(-2.27, 1.31);
    shape.lineTo(-1.4, 1.02);
    shape.lineTo(0.43, 0.99);
    shape.lineTo(1.12, 1.08);
    shape.lineTo(2.15, 1.0);
    shape.lineTo(2.51, 0.83);
    shape.lineTo(2.49, 0.5);
    shape.closePath();
    this.body = new ExtrudeGeometry(shape, {
      depth: 1.82,
      bevelEnabled: true,
      bevelSize: 0.055,
      bevelThickness: 0.045,
      bevelSegments: 2,
    });
    this.body.rotateY(-Math.PI / 2);
    this.body.translate(0.91, 0, 0);
    this.root.add(new Mesh(this.body, coral));
    box(0, 1.035, -0.21, 1.61, 0.09, 1.92, rubber);
    box(0, 1.25, -0.76, 1.52, 0.42, 0.22, white);
    box(0, 1.24, 0.32, 1.5, 0.4, 0.23, white);
    const windshield = box(0, 1.44, 0.65, 1.78, 0.62, 0.07, this.paint(0x85b8c4));
    windshield.rotation.x = -0.23;
    for (const x of [-0.92, 0.92]) {
      box(x, 0.78, 0, 0.065, 0.08, 4.78);
      box(x * 0.93, 1.4, 0.69, 0.055, 0.78, 0.065);
      for (const z of [-1.49, 1.41]) {
        for (const [geometry, material, spread] of [
          [this.tire, rubber, 1],
          [this.sidewall, white, 1.13],
          [this.hub, chrome, 1.16],
        ] as const) {
          const wheel = new Mesh(geometry, material);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(x * spread, 0.47, z);
          this.root.add(wheel);
        }
      }
      const front = new Mesh(this.cube, this.lamps);
      front.scale.set(0.32, 0.19, 0.06);
      front.position.set(x * 0.83, 0.93, 2.46);
      this.root.add(front);
      const rear = new Mesh(this.cube, this.tail);
      rear.scale.set(0.21, 0.13, 0.06);
      rear.position.set(x * 0.85, 0.99, -2.46);
      this.root.add(rear);
    }
    box(0, 0.53, -2.56, 1.99, 0.14, 0.15);
    box(0, 0.53, 2.55, 1.99, 0.14, 0.15);
    box(0, 1.72, 0.58, 1.83, 0.055, 0.075);
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.cube,
      this.tire,
      this.sidewall,
      this.hub,
      this.body,
      this.lamps,
      this.tail,
      ...this.paints.values(),
    ])
      item.dispose();
  }
}
