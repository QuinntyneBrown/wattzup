import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MirroredRepeatWrapping,
  Color,
  MeshLambertMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import type { RiderBody } from './rider-body';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 135, -2, 1.6],
  [1460, 1518, -31, 1.72],
  [3120, 3152, 19, 2.1],
  [4630, 4656, -9, 1.85],
  [6180, 6285, 57, 2.5],
  [7840, 7887, 23, 3.2],
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
export class SilveradoTrail {
  readonly root = new Group();
  readonly materials = {
    SilveradoTarmac: new MeshBasicMaterial({ side: DoubleSide, vertexColors: true }),
    TrellisedVines: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.38 }),
    ValleyOaks: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    NapaFlowers: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.39 }),
    WineryStone: new MeshBasicMaterial({ side: DoubleSide }),
    NapaRange: new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
    WinerySigns: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly car = new Group();
  private readonly flowers = new Group();
  private readonly kit: CourseCyclistKit;
  private readonly cyclist: RiderModel;
  private readonly plain = new MeshLambertMaterial({ vertexColors: true });
  private readonly body = roadsterBody();
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly wheel = new CylinderGeometry(1, 1, 1, 16);
  private readonly blade = new PlaneGeometry(2.85, 0.82);
  private readonly foliage = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 });
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly shown = {
    carTravel: null as number | null,
    flowerSway: null as number | null,
    cyclistPedal: null as number | null,
  };
  static async load(course: Course, body: RiderBody) {
    const res = await Promise.allSettled(
      ['tarmac', 'vines', 'oaks', 'flowers', 'stone', 'signs', 'range'].map((n) =>
        new TextureLoader().loadAsync('courses/napa-' + n + '.webp'),
      ),
    );
    const imgs = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = res.find((r) => r.status === 'rejected');
    if (fail) {
      for (const img of imgs) img.dispose();
      throw fail.reason;
    }
    return new SilveradoTrail(course, imgs, body);
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
    body: RiderBody,
  ) {
    for (const img of images) {
      img.colorSpace = SRGBColorSpace;
      img.flipY = false;
    }
    const [road, vines, oaks, flowers, stone, signs, range] = images;
    road!.wrapS = road!.wrapT = MirroredRepeatWrapping;
    this.materials.SilveradoTarmac.map = road!;
    this.materials.TrellisedVines.map = vines!;
    this.materials.ValleyOaks.map = oaks!;
    this.materials.NapaFlowers.map = flowers!;
    this.materials.NapaRange.map = range!;
    this.materials.WineryStone.map = stone!;
    this.materials.WinerySigns.map = signs!;
    this.kit = new CourseCyclistKit(this.plain, body, false, true);
    this.cyclist = this.kit.make(new Color(0x327683), 37, false, 0.65);
    this.car.add(new Mesh(this.body, this.material(0x49796b)));
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
    this.foliage.map = flowers!;
    const uv = this.blade.attributes['uv']!;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i), 1 - uv.getY(i));
    }
    const patch = course.place(1480, -6.34, this.p);
    this.flowers.position.set(patch.x, patch.y + 0.03, patch.z);
    for (let i = 0; i < 4; i++) {
      const m = new Mesh(this.blade, this.foliage);
      m.position.set(i * 0.58, 0.41, -i * 0.67);
      m.rotation.y = 0.55 * i;
      this.flowers.add(m);
    }
    this.root.add(this.car, this.flowers, this.cyclist.group);
    const parked = this.car.clone();
    const v = course.place(3157, 12.6, this.p);
    parked.position.set(v.x, v.y + 0.08, v.z);
    parked.rotation.y = v.heading + 0.96;
    this.root.add(parked);
  }
  update(metres: number, time: number) {
    this.car.visible = Math.abs(metres - 6180) < 290 || Math.abs(metres - 7850) < 140;
    this.shown.carTravel = null;
    if (this.car.visible) {
      const d = metres + 18 + 4 * Math.sin(time * 0.16),
        p = this.course.place(d, -1.96, this.p);
      this.car.position.set(p.x, p.y + 0.035, p.z);
      this.car.rotation.set(-p.pitch, p.heading, 0, 'YXZ');
      this.shown.carTravel = d;
    }
    this.flowers.visible = Math.abs(metres - 1480) < 175;
    this.shown.flowerSway = null;
    if (this.flowers.visible) {
      this.flowers.rotation.z = 0.058 * Math.sin(time * 1.77);
      this.shown.flowerSway = this.flowers.rotation.z;
    }
    const rider = this.cyclist.group;
    rider.visible = Math.abs(metres - 7840) < 245 || Math.abs(metres - 100) < 185;
    this.shown.cyclistPedal = null;
    if (rider.visible) {
      const p = this.course.place(metres + 11.3 + 2.4 * Math.sin(time * 0.23), 4.34, this.p);
      rider.position.set(p.x, p.y + 0.03, p.z);
      rider.rotation.set(-p.pitch, p.heading, 0, 'YXZ');
      const angle = time * 8.1;
      this.cyclist.pose(angle, 0.06);
      this.shown.cyclistPedal = angle;
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
    this.car.clear();
    this.flowers.clear();
    for (const item of this.cyclist.owned) item.dispose();
    this.kit.dispose();
    this.plain.dispose();
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
