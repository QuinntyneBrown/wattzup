import { positionWorld, sin, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 118, 1.2, 1.85],
  [2630, 2722, -72, 2.4],
  [5190, 5225, 13.7, 2.45],
  [8270, 8365, -117, 4.35],
  [12060, 12156, 81, 2.35],
  [16420, 16470, -40, 1.9],
] as const;
function roadsterBody() {
  const vertices: number[] = [],
    indices: number[] = [];
  for (const [i, [z, w, y]] of [
    [-2.15, 0.72, 0.62],
    [-1.81, 0.92, 0.81],
    [-0.74, 0.96, 0.88],
    [0.4, 0.94, 0.83],
    [1.55, 0.92, 0.84],
    [2.06, 0.8, 0.71],
  ].entries()) {
    for (const [x, up] of [
      [-w! * 0.84, 0.33],
      [-w!, y! - 0.13],
      [-w! * 0.85, y!],
      [w! * 0.85, y!],
      [w!, y! - 0.13],
      [w! * 0.84, 0.33],
    ])
      vertices.push(x!, up!, z!);
    if (i)
      for (let j = 0; j < 6; j++) {
        const a = (i - 1) * 6 + j,
          b = (i - 1) * 6 + ((j + 1) % 6);
        indices.push(a, a + 6, b + 6, a, b + 6, b);
      }
  }
  for (let j = 1; j < 5; j++) indices.push(0, j, j + 1, 30, 31 + j, 30 + j);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
export class MulhollandOverlook {
  readonly root = new Group();
  readonly materials = {
    RidgePavement: new MeshBasicNodeMaterial({ side: DoubleSide }),
    CanyonPlants: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    LosAngelesBasin: new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    }),
    ValleyGrid: new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
    MountLeeSlope: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.36 }),
    MountLeeLetters: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    MulhollandSigns: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly car = new Group();
  private readonly sage = new Group();
  private readonly visitor = new Group();
  private readonly shoulders = new Group();
  private readonly body = roadsterBody();
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly wheel = new CylinderGeometry(1, 1, 1, 16);
  private readonly blade = new PlaneGeometry(2.85, 1.65);
  private readonly foliage = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 });
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly shown = {
    carTravel: null as number | null,
    sageSway: null as number | null,
    viewerTurn: null as number | null,
  };
  static async load(course: Course) {
    const res = await Promise.allSettled(
      ['plants', 'downtown', 'valley', 'letters', 'signs', 'lee'].map((n) =>
        new TextureLoader().loadAsync('courses/mulholland-' + n + '.webp'),
      ),
    );
    const imgs = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = res.find((r) => r.status === 'rejected');
    if (fail) {
      for (const img of imgs) img.dispose();
      throw fail.reason;
    }
    return new MulhollandOverlook(course, imgs);
  }
  private material(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshLambertMaterial({ color: c, side: DoubleSide });
      this.paints.set(c, m);
    }
    return m;
  }
  private part(
    g: Group,
    geo: BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const m = new Mesh(geo, this.material(c));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
    return m;
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [plant, basin, valley, letters, signs, lee] = images as [
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
    this.materials.CanyonPlants.map = plant;
    this.materials.LosAngelesBasin.map = basin;
    this.materials.ValleyGrid.map = valley;
    this.materials.MountLeeLetters.map = letters;
    this.materials.MountLeeSlope.map = lee;
    this.materials.MulhollandSigns.map = signs;
    this.materials.RidgePavement.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(72).add(positionWorld.z.mul(89)))
        .mul(0.034)
        .add(0.96),
    );
    this.car.add(new Mesh(this.body, this.material(0xb44032)));
    this.part(this.car, this.cube, 0x363a39, 0, 0.88, 0.2, 1.56, 0.07, 1.19);
    for (const x of [-0.47, 0.47]) {
      this.part(this.car, this.ball, 0x6b4c40, x, 1.02, 0.45, 0.28, 0.28, 0.18);
      this.part(this.car, this.ball, 0x594035, x, 1.24, 0.53, 0.18, 0.14, 0.12);
    }
    this.part(this.car, this.ball, 0xad8066, -0.45, 1.38, 0.37, 0.12, 0.15, 0.12);
    this.part(this.car, this.cube, 0x91a9a7, 0, 1.09, -0.53, 1.59, 0.53, 0.065).rotation.x = -0.39;
    for (const x of [-1, 1]) {
      for (const z of [-1.28, 1.29]) {
        this.part(this.car, this.wheel, 0x302f2e, x * 0.85, 0.41, z, 0.36, 0.22, 0.36).rotation.z =
          Math.PI / 2;
        this.part(this.car, this.wheel, 0xa29e94, x * 0.96, 0.41, z, 0.19, 0.045, 0.19).rotation.z =
          Math.PI / 2;
      }
      this.part(this.car, this.cube, 0xe4be82, x * 0.61, 0.64, -2.14, 0.37, 0.13, 0.05);
      this.part(this.car, this.cube, 0x862e32, x * 0.58, 0.62, 2.07, 0.4, 0.13, 0.05);
    }
    this.foliage.map = plant;
    const uv = this.blade.attributes['uv']!;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, 2 / 3 + uv.getX(i) / 3, 1 - uv.getY(i));
    }
    const sage = course.place(5220, 5.95, this.p);
    this.sage.position.set(sage.x, sage.y + 0.03, sage.z);
    for (let i = 0; i < 4; i++) {
      const m = new Mesh(this.blade, this.foliage);
      m.position.set(i * 0.58, 0.78, -i * 0.67);
      m.rotation.y = 0.55 * i;
      this.sage.add(m);
    }
    const v = course.place(16462, -12.8, this.p);
    this.visitor.position.set(v.x, v.y + 0.09, v.z);
    this.visitor.rotation.y = v.heading + 1.15;
    this.visitor.add(this.shoulders);
    for (const s of [-1, 1])
      this.part(this.visitor, this.cube, 0x565652, s * 0.115, 0.46, 0, 0.15, 0.9, 0.19);
    this.shoulders.position.y = 0.91;
    this.part(this.shoulders, this.ball, 0x668985, 0, 0.26, 0, 0.235, 0.34, 0.16);
    this.part(this.shoulders, this.ball, 0xbf9575, 0, 0.72, 0, 0.145, 0.17, 0.14);
    this.part(this.shoulders, this.ball, 0x78604d, 0, 0.84, 0, 0.172, 0.08, 0.15);
    for (const s of [-1, 1]) {
      this.part(
        this.shoulders,
        this.ball,
        0xb88b6f,
        s * 0.21,
        0.43,
        -0.1,
        0.076,
        0.16,
        0.083,
      ).rotation.x = 0.6;
      this.part(this.shoulders, this.ball, 0xb88b6f, s * 0.15, 0.49, -0.23, 0.12, 0.067, 0.096);
    }
    this.part(this.shoulders, this.cube, 0x363937, 0, 0.59, -0.27, 0.23, 0.13, 0.12);
    this.root.add(this.car, this.sage, this.visitor);
  }
  update(metres: number, time: number) {
    this.car.visible = metres < 650 || Math.abs(metres - 8300) < 160;
    this.shown.carTravel = null;
    if (this.car.visible) {
      const d = metres + 18 + 4 * Math.sin(time * 0.16),
        p = this.course.place(d, -1.96, this.p);
      this.car.position.set(p.x, p.y + 0.035, p.z);
      this.car.rotation.set(-p.pitch, p.heading, 0, 'YXZ');
      this.shown.carTravel = d;
    }
    this.sage.visible = Math.abs(metres - 5220) < 175;
    this.shown.sageSway = null;
    if (this.sage.visible) {
      this.sage.rotation.z = 0.058 * Math.sin(time * 1.77);
      this.shown.sageSway = this.sage.rotation.z;
    }
    this.visitor.visible = Math.abs(metres - 16462) < 190;
    this.shown.viewerTurn = null;
    if (this.visitor.visible) {
      this.shoulders.rotation.y = 0.4 * Math.sin(time * 0.68);
      this.shown.viewerTurn = this.shoulders.rotation.y;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = stops.find((s) => Math.abs(metres - s[0]) < 90);
    if (!s) return;
    const blend = Math.min(1, (1 - Math.abs(metres - s[0]) / 90) * 1.65);
    const p = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.t),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.16 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + s[3] + (14 * (t.y - p.y)) / len - ahead.y) * blend;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    for (const g of [this.car, this.sage, this.visitor, this.shoulders]) g.clear();
    for (const item of [
      this.body,
      this.cube,
      this.ball,
      this.wheel,
      this.blade,
      this.foliage,
      ...this.paints.values(),
      ...this.images,
      ...Object.values(this.materials),
    ])
      item.dispose();
    this.paints.clear();
  }
}
