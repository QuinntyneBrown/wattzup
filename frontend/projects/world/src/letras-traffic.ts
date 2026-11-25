import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  type Texture,
} from 'three/webgpu';

function timberPanels() {
  const position: number[] = [],
    uv: number[] = [],
    index: number[] = [];
  const face = (corners: number[][], u: number) => {
    const start = position.length / 3;
    for (const corner of corners) position.push(...corner);
    uv.push(u + 0.004, 0.504, u + 0.496, 0.504, u + 0.496, 0.996, u + 0.004, 0.996);
    index.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  for (const side of [-1, 1]) {
    const x = side * 1.15;
    face(
      [
        [x, 0.77, -2.05],
        [x, 0.77, 3.05],
        [x, 2.57, 3.05],
        [x, 2.57, -2.05],
      ],
      0,
    );
  }
  face(
    [
      [1.15, 0.77, 3.06],
      [-1.15, 0.77, 3.06],
      [-1.15, 2.57, 3.06],
      [1.15, 2.57, 3.06],
    ],
    0.5,
  );
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(position, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}

/** The chiva's painted timber body and a tarpaulin-covered local delivery lorry share their running gear. */
export class LetrasTraffic {
  readonly body = new Group();
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly tire = new CylinderGeometry(0.48, 0.48, 0.3, 12);
  private readonly panels = timberPanels();
  private readonly paint: MeshBasicMaterial;
  private readonly solid = new MeshBasicMaterial();
  private readonly pieces: InstancedMesh;
  private readonly wheels: InstancedMesh;
  constructor(atlas: Texture, chiva: boolean) {
    this.paint = new MeshBasicMaterial({ map: atlas, side: DoubleSide });
    const elements: [number, number, number, number, number, number, number][] = [];
    const box = (x: number, y: number, z: number, w: number, h: number, l: number, c: number) =>
      elements.push([x, y, z, w, h, l, c]);
    box(0, 0.65, 0, 2.1, 0.34, 6.1, 0x4d5150);
    box(0, 1.15, -2.7, 2.1, 0.72, 1.63, chiva ? 0xba4438 : 0x50758a);
    box(0, 1.83, -1.89, 2.08, 1.18, 1.05, chiva ? 0xe2b744 : 0x68818b);
    box(0, 1.97, -2.44, 1.81, 0.58, 0.04, 0x54737b);
    box(0, 1.2, -3.55, 1.12, 0.36, 0.04, 0x515a5c);
    box(0, 0.76, -3.59, 2.21, 0.15, 0.18, 0xafafa6);
    for (const side of [-1, 1]) {
      box(side * 0.83, 1.26, -3.56, 0.27, 0.19, 0.05, 0xffe9bb);
      box(side * 1.05, 1.29, -2.97, 0.34, 0.16, 1.03, chiva ? 0xd5a23a : 0x414f58);
      box(side * 1.22, 2.05, -2.1, 0.14, 0.24, 0.12, 0x404549);
    }
    if (chiva) {
      this.body.add(new Mesh(this.panels, this.paint));
      box(0, 2.62, 0.42, 2.36, 0.13, 5.36, 0xc8a343);
      box(0, 2.74, 0.45, 2.02, 0.1, 4.92, 0x66855c);
      for (let i = 0; i < 4; i++)
        box(
          -0.57 + i * 0.35,
          2.97,
          -0.43 + i * 0.56,
          0.68,
          0.43,
          0.98,
          [0x75644f, 0x8c7464, 0x5b746e, 0x8c6955][i]!,
        );
      for (const side of [-1, 1]) {
        box(side * 1.07, 2.97, 0.45, 0.048, 0.05, 5.08, 0xcb5746);
        for (let i = 0; i < 6; i++)
          box(side * 1.07, 2.84, -1.9 + i * 0.9, 0.044, 0.32, 0.044, 0xd3bc82);
      }
    } else {
      box(0, 1.3, 0.71, 2.22, 1.05, 4.85, 0x986a43);
      box(0, 2.1, 0.71, 2.17, 0.77, 4.77, 0x697c65);
      box(0, 2.6, 0.71, 1.74, 0.29, 4.66, 0x758968);
      for (let i = 0; i < 5; i++) box(0, 2.46, -1.19 + i * 0.94, 2.23, 0.07, 0.07, 0x4c5546);
    }
    this.pieces = new InstancedMesh(this.cube, this.solid, elements.length);
    const pose = new Object3D();
    for (const [i, [x, y, z, w, h, l, c]] of elements.entries()) {
      pose.position.set(x, y, z);
      pose.scale.set(w, h, l);
      pose.updateMatrix();
      this.pieces.setMatrixAt(i, pose.matrix);
      this.pieces.setColorAt(i, new Color(c));
    }
    this.wheels = new InstancedMesh(this.tire, this.solid, 4);
    let n = 0;
    for (const side of [-1, 1])
      for (const z of [-2.51, 2.21]) {
        pose.position.set(side * 1.04, 0.49, z);
        pose.rotation.z = Math.PI / 2;
        pose.scale.set(1, 1, 1);
        pose.updateMatrix();
        this.wheels.setMatrixAt(n, pose.matrix);
        this.wheels.setColorAt(n++, new Color(0x343839));
      }
    this.body.add(this.pieces, this.wheels);
  }
  dispose() {
    this.body.clear();
    for (const item of [
      this.cube,
      this.tire,
      this.panels,
      this.paint,
      this.solid,
      this.pieces,
      this.wheels,
    ])
      item.dispose();
  }
}
