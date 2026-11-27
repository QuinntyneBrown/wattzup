import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
} from 'three/webgpu';
function yachtHull() {
  const vertices: number[] = [],
    indices: number[] = [];
  for (const [i, [z, w, rise]] of [
    [-15, 3.65, 0],
    [-13, 4.2, 0],
    [-6, 4.45, 0],
    [4, 4.18, 0.13],
    [10, 3.52, 0.48],
    [14, 1.7, 0.74],
    [16, 0.06, 1.1],
  ].entries()) {
    for (const [x, y] of [
      [-w! * 0.73, -0.73],
      [-w!, 1.4],
      [-w! * 0.98, 2.1],
      [w! * 0.98, 2.1],
      [w!, 1.4],
      [w! * 0.73, -0.73],
    ])
      vertices.push(x!, y! + rise!, z!);
    if (i)
      for (let j = 0; j < 6; j++) {
        const a = (i - 1) * 6 + j,
          b = (i - 1) * 6 + ((j + 1) % 6);
        indices.push(a, a + 6, b + 6, a, b + 6, b);
      }
  }
  for (let j = 1; j < 5; j++) indices.push(0, j + 1, j, 36, 36 + j, 37 + j);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
export class HarbourEquipment {
  readonly yacht = new Group();
  readonly safety = new Group();
  readonly beacon = new MeshBasicMaterial({ color: 0xff9a17 });
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly hull = yachtHull();
  private readonly tire = new CylinderGeometry(0.355, 0.355, 0.235, 14);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private paint(color: number) {
    let p = this.paints.get(color);
    if (!p) {
      p = new MeshLambertMaterial({ color });
      this.paints.set(color, p);
    }
    return p;
  }
  private box(
    parent: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    col: number,
  ) {
    const part = new Mesh(this.cube, this.paint(col));
    part.position.set(x, y, z);
    part.scale.set(w, h, l);
    parent.add(part);
    return part;
  }
  constructor() {
    const white = 0xeeede4,
      glass = 0x334b5a,
      teak = 0xb08c69,
      silver = 0xb8c2c8;
    this.yacht.add(new Mesh(this.hull, this.paint(white)));
    this.box(this.yacht, 0, 2.13, -7.4, 7.25, 0.13, 12.8, teak);
    for (let level = 0; level < 3; level++) {
      const w = 6.85 - level * 1.05,
        l = 18 - level * 3.7,
        z = 1.3 + level * 0.7,
        y = 2.87 + level * 1.62;
      this.box(this.yacht, 0, y, z, w, 1.38, l, glass);
      this.box(this.yacht, 0, y + 0.8, z - 0.5, w + 0.66, 0.22, l + 1.7, white);
      for (const side of [-1, 1])
        for (let j = 0; j < 5; j++)
          this.box(
            this.yacht,
            side * w * 0.502,
            y,
            z + (j - 2) * l * 0.2,
            0.075,
            1.4,
            0.095,
            silver,
          );
    }
    this.box(this.yacht, 0, 8.65, 3, 0.13, 3.7, 0.16, silver);
    this.box(this.yacht, 0, 10.15, 3, 2.4, 0.12, 0.13, silver);
    const car = this.safety;
    this.box(car, 0, 0.7, 0, 1.88, 0.64, 4.49, 0xa6afb6);
    this.box(car, 0, 1.21, -0.22, 1.6, 0.61, 2.05, glass);
    this.box(car, 0, 1.57, -0.24, 1.66, 0.11, 1.86, 0xbfc5c2);
    for (const x of [-0.88, 0.88]) {
      this.box(car, x, 0.83, -0.12, 0.045, 0.13, 2.6, 0xf0ad22);
      this.box(car, x * 0.92, 1.19, -0.13, 0.073, 0.64, 0.13, silver);
      for (const z of [-1.4, 1.35]) {
        const wheel = new Mesh(this.tire, this.paint(0x28282a));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.39, z);
        car.add(wheel);
      }
      this.box(car, x * 0.83, 0.81, 2.26, 0.32, 0.15, 0.055, 0xffedb6);
      this.box(car, x * 0.83, 0.82, -2.26, 0.27, 0.13, 0.045, 0xb42c38);
    }
    const bar = new Mesh(this.cube, this.beacon);
    bar.scale.set(1.14, 0.17, 0.32);
    bar.position.y = 1.72;
    car.add(bar);
  }
  dispose() {
    this.safety.clear();
    this.yacht.clear();
    for (const i of [this.cube, this.hull, this.tire, this.beacon, ...this.paints.values()])
      i.dispose();
  }
}
