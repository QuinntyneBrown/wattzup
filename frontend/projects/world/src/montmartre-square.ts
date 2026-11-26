import { positionWorld, texture, vec2 } from 'three/tsl';
import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 112, 9, 2.8],
  [1580, 1610, 8, 2.6],
  [2910, 2940, -10, 2.8],
  [4380, 4408, 9, 2.2],
  [6020, 6051, 8, 2.3],
  [7910, 7970, 22, 5.15],
] as const;

export class MontmartreSquare {
  readonly root = new Group();
  private readonly p = place();
  private readonly t = place();
  private readonly boxShape = new BoxGeometry(1, 1, 1);
  private readonly ball = new SphereGeometry(1, 12, 9);
  private readonly cylinder = new CylinderGeometry(1, 1, 1, 12);
  private readonly batches: InstancedMesh[] = [];
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly brushes: Group[] = [];
  private readonly square = new Group();
  private readonly waiter = new Group();
  private readonly fountain = new Group();
  private readonly streams: Mesh[] = [];
  private readonly shown = {
    waiterStep: null as number | null,
    brushAngle: null as number | null,
    waterPhase: null as number | null,
  };
  readonly materials = {
    MetroSign: new MeshBasicMaterial({ side: DoubleSide }),
    ParisFronts: new MeshBasicMaterial({ side: DoubleSide }),
    PlaneTrees: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    BasilicaFront: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    ButtePaint: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.3 }),
    ParisPaves: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['fronts', 'tree', 'basilica', 'paint', 'paves', 'metro'].map((name) =>
        new TextureLoader().loadAsync('courses/montmartre-' + name + '.webp'),
      ),
    );
    const imgs = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const fail = results.find((r) => r.status === 'rejected');
    if (fail) {
      for (const i of imgs) i.dispose();
      throw fail.reason;
    }
    return new MontmartreSquare(course, imgs);
  }
  private part(
    parent: Group,
    shape: BoxGeometry | SphereGeometry | CylinderGeometry,
    color: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    let material = this.paints.get(color);
    if (!material) {
      material = new MeshLambertMaterial({ color });
      this.paints.set(color, material);
    }
    const m = new Mesh(shape, material);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
    return m;
  }
  private anchor(group: Group, metres: number, side: number) {
    const p = this.course.place(metres, side, this.p);
    group.position.set(p.x, p.y + 0.1, p.z);
    group.rotation.y = p.heading;
    this.root.add(group);
  }
  private person(group: Group, x: number, z: number, coat: number, skin: number) {
    this.part(group, this.ball, skin, x, 1.63, z, 0.14, 0.18, 0.14);
    this.part(group, this.ball, coat, x, 1.11, z, 0.245, 0.38, 0.17);
    for (const side of [-1, 1])
      this.part(group, this.boxShape, 0x393632, x + 0.105 * side, 0.48, z, 0.13, 0.88, 0.17);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [fronts, tree, basilica, paint, paves, metro] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const img of images) {
      img.colorSpace = SRGBColorSpace;
      img.flipY = false;
    }
    this.materials.MetroSign.map = metro;
    this.materials.ParisFronts.map = fronts;
    this.materials.PlaneTrees.map = tree;
    this.materials.BasilicaFront.map = basilica;
    this.materials.ButtePaint.map = paint;
    paves.wrapS = paves.wrapT = RepeatWrapping;
    paves.anisotropy = 4;
    this.materials.ParisPaves.colorNode = texture(
      paves,
      vec2(positionWorld.x.mul(0.71), positionWorld.z.mul(0.71)),
    ).rgb;
    this.anchor(this.waiter, 111, 6.3);
    this.person(this.waiter, 0, 0, 0xece4d1, 0xb98767);
    this.part(this.waiter, this.boxShape, 0x3d4d42, 0, 0.86, -0.16, 0.38, 0.58, 0.05);
    this.part(this.waiter, this.cylinder, 0xb0a392, 0.37, 1.18, -0.1, 0.29, 0.042, 0.29);
    this.part(this.waiter, this.cylinder, 0xd5cdc0, 0.34, 1.27, -0.12, 0.072, 0.15, 0.072);
    this.anchor(this.square, 4407, 7.3);
    for (let n = 0; n < 5; n++) {
      const g = new Group();
      g.position.set(1 + (n % 2) * 1.55, 0, (n - 2) * 3.25);
      g.rotation.y = -0.55 + n * 0.18;
      this.square.add(g);
      for (const side of [-1, 1])
        this.part(g, this.boxShape, 0x957044, side * 0.29, 0.84, 0, 0.07, 1.72, 0.07).rotation.z =
          -side * 0.18;
      this.part(g, this.boxShape, 0x815c39, 0.02, 0.82, 0.41, 0.07, 1.72, 0.07).rotation.x = 0.32;
      this.part(g, this.boxShape, 0x967448, 0, 1.27, 0, 1.02, 0.84, 0.09);
      this.part(g, this.boxShape, 0xd6c6a4, 0, 1.27, -0.061, 0.93, 0.75, 0.04);
      for (let j = 0; j < 9; j++)
        this.part(
          g,
          this.ball,
          [0x698269, 0x748e9b, 0xb49576][j % 3]!,
          Math.sin(j * 2.8) * 0.31,
          1.29 + Math.cos(j * 2.3) * 0.25,
          -0.096,
          0.13,
          0.1,
          0.012,
        );
      this.person(
        g,
        0.66,
        -0.65,
        [0x635a46, 0x935a4e, 0x597987][n % 3]!,
        n % 2 ? 0xcb9c7b : 0x986c4f,
      );
      this.part(g, this.ball, 0x433b36, 0.66, 1.79, -0.65, 0.19, 0.075, 0.18);
      const arm = new Group();
      arm.position.set(0.49, 1.34, -0.64);
      g.add(arm);
      this.part(arm, this.boxShape, 0xad8068, -0.12, -0.05, 0.19, 0.15, 0.16, 0.43);
      this.part(arm, this.boxShape, 0x75472e, -0.17, 0.04, 0.37, 0.026, 0.34, 0.026).rotation.x =
        0.65;
      this.brushes.push(arm);
      if (n % 2 === 0) {
        this.part(g, this.cylinder, 0x78624e, 1.15, 1.24, 0.4, 0.045, 2.48, 0.045);
        this.part(g, this.ball, n % 4 ? 0x896c48 : 0x985a48, 1.15, 2.5, 0.4, 1.46, 0.37, 1.46);
      }
    }
    for (const stand of this.square.children) {
      if (!(stand instanceof Group)) continue;
      const picture = stand.children.filter(
        (piece) => piece instanceof Mesh && piece.position.z < -0.05 && piece.position.z > -0.12,
      );
      for (const piece of picture) {
        const back = piece.clone();
        back.position.z = -piece.position.z;
        stand.add(back);
      }
    }
    this.batchSquare();
    this.anchor(this.fountain, 6051, 5.64);
    const iron = 0x305648;
    this.part(this.fountain, this.cylinder, iron, 0, 0.32, 0, 0.6, 0.63, 0.6);
    this.part(this.fountain, this.cylinder, iron, 0, 0.7, 0, 0.72, 0.13, 0.72);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + 0.6;
      this.part(
        this.fountain,
        this.ball,
        iron,
        0.45 * Math.cos(a),
        1.51,
        0.45 * Math.sin(a),
        0.14,
        0.8,
        0.14,
      );
    }
    this.part(this.fountain, this.ball, iron, 0, 2.32, 0, 0.74, 0.32, 0.74);
    this.part(this.fountain, this.ball, iron, 0, 2.69, 0, 0.11, 0.19, 0.11);
    for (let k = 0; k < 6; k++)
      this.streams.push(
        this.part(this.fountain, this.ball, 0x9daea4, 0, 1.33, 0, 0.029, 0.14, 0.029),
      );
  }
  private batchSquare() {
    // Only the brush arms move. Instance the square’s repeated fixed forms in its local coordinates.
    this.square.updateWorldMatrix(true, true);
    const inverse = this.square.matrixWorld.clone().invert(),
      local = new Matrix4();
    const batches = new Map<string, Mesh[]>();
    this.square.traverse((node) => {
      if (!(node instanceof Mesh) || this.brushes.some((arm) => node.parent === arm)) return;
      const material = node.material as MeshLambertMaterial,
        key = node.geometry.uuid + material.uuid;
      let batch = batches.get(key);
      if (!batch) {
        batch = [];
        batches.set(key, batch);
      }
      batch.push(node);
    });
    for (const batch of batches.values()) {
      const sample = batch[0]!,
        mesh = new InstancedMesh(sample.geometry, sample.material, batch.length);
      batch.forEach((node, index) => {
        mesh.setMatrixAt(index, local.multiplyMatrices(inverse, node.matrixWorld));
        node.removeFromParent();
      });
      mesh.computeBoundingSphere();
      this.square.add(mesh);
      this.batches.push(mesh);
    }
  }
  update(metres: number, time: number) {
    this.waiter.visible = Math.abs(metres - 111) < 140;
    this.square.visible = Math.abs(metres - 4407) < 155;
    this.fountain.visible = Math.abs(metres - 6051) < 145;
    this.shown.waiterStep = this.shown.brushAngle = this.shown.waterPhase = null;
    if (this.waiter.visible) {
      const step = Math.sin(time * 0.56);
      this.shown.waiterStep = step;
      const p = this.course.place(111 + step * 1.55, 6.3, this.p);
      this.waiter.position.set(p.x, p.y + 0.1 + 0.022 * Math.abs(Math.sin(time * 3)), p.z);
    }
    if (this.square.visible) {
      for (const [i, arm] of this.brushes.entries())
        arm.rotation.x = Math.sin(time * 1.41 + i * 1.7) * 0.24;
      this.shown.brushAngle = this.brushes[0]!.rotation.x;
    }
    if (this.fountain.visible) {
      for (const [i, s] of this.streams.entries())
        s.position.y = 2.06 - ((time * 0.92 + i / 6) % 1) * 1.22;
      this.shown.waterPhase = this.streams[0]!.position.y;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = stops.find((s) => Math.abs(metres - s[0]) < 90);
    if (!stop) return;
    const blend = Math.min(1, (1 - Math.abs(metres - stop[0]) / 90) * 1.7),
      p = this.course.place(metres, 0, this.p),
      t = this.course.place(stop[1], stop[2], this.t);
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.14 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + stop[3] + (14 * (t.y - p.y)) / len - ahead.y) * blend;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    for (const batch of this.batches) batch.dispose();
    for (const g of [this.square, this.fountain, this.waiter]) g.clear();
    for (const item of [
      this.boxShape,
      this.ball,
      this.cylinder,
      ...this.paints.values(),
      ...this.images,
      ...Object.values(this.materials),
    ])
      item.dispose();
    this.paints.clear();
  }
}
