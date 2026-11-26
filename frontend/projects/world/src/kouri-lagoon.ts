import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 115, 1.3, 1.9],
  [2760, 2790, 9.5, 1.85],
  [5470, 5600, -5, 2.5],
  [8910, 8945, -39, 1.1],
  [11830, 11872, -71, 1.13],
  [16190, 16245, -48, 1.9],
] as const;
function wash() {
  const geo = new BufferGeometry(),
    positions: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30,
      w = 0.16 + 0.68 * Math.sin(Math.PI * t) ** 0.65,
      x = 0.73 * Math.sin(t * 14) + 0.29 * Math.cos(t * 29);
    positions.push(x, 0, (t - 0.5) * 11, x + w, 0.026, (t - 0.5) * 11);
    if (i) {
      const k = i * 2;
      indices.push(k - 2, k - 1, k, k, k - 1, k + 1);
    }
  }
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
export class KouriLagoon {
  readonly root = new Group();
  readonly materials = {
    OkinawaAsphalt: new MeshBasicNodeMaterial({ side: DoubleSide }),
    OkinawaLagoon: new MeshBasicMaterial({ side: DoubleSide, vertexColors: true }),
    RyukyuPlants: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    CoralBlocks: new MeshBasicMaterial({ side: DoubleSide }),
    RyukyuHouses: new MeshBasicMaterial({ side: DoubleSide }),
    ShisaGuardians: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    OkinawaSigns: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    KouriCumulus: new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly cycad = new Group();
  private readonly swimmer = new Group();
  private readonly foam = new Group();
  private readonly arms = [new Group(), new Group()];
  private readonly globe = new SphereGeometry(1, 12, 8);
  private readonly leaves = new PlaneGeometry(2.76, 2.1);
  private readonly leavesPaint = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 });
  private readonly spray = wash();
  private readonly white = new MeshBasicMaterial({
    color: 0xeff9e8,
    side: DoubleSide,
    transparent: true,
    opacity: 0.77,
    depthWrite: false,
  });
  private readonly colours = new Map<number, MeshLambertMaterial>();
  private readonly shown = {
    cycadSway: null as number | null,
    swimmerStroke: null as number | null,
    foamTravel: null as number | null,
  };
  static async load(course: Course) {
    const res = await Promise.allSettled(
      ['lagoon', 'plants', 'walls', 'houses', 'shisa', 'signs', 'clouds'].map((key) =>
        new TextureLoader().loadAsync('courses/okinawa-' + key + '.webp'),
      ),
    );
    const imgs = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = res.find((r) => r.status === 'rejected');
    if (fail) {
      for (const img of imgs) img.dispose();
      throw fail.reason;
    }
    return new KouriLagoon(course, imgs);
  }
  private oval(
    group: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
  ) {
    let paint = this.colours.get(c);
    if (!paint) {
      paint = new MeshLambertMaterial({ color: c });
      this.colours.set(c, paint);
    }
    const m = new Mesh(this.globe, paint);
    m.position.set(x, y, z);
    m.scale.set(w, h, l);
    group.add(m);
    return m;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [water, plants, walls, houses, shisa, signs, clouds] = textures;
    water!.wrapS = water!.wrapT = MirroredRepeatWrapping;
    this.materials.OkinawaLagoon.map = water!;
    this.materials.RyukyuPlants.map = plants!;
    this.materials.CoralBlocks.map = walls!;
    this.materials.RyukyuHouses.map = houses!;
    this.materials.ShisaGuardians.map = shisa!;
    this.materials.OkinawaSigns.map = signs!;
    this.materials.KouriCumulus.map = clouds!;
    this.materials.OkinawaAsphalt.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(78).add(positionWorld.z.mul(67)))
        .mul(0.043)
        .add(0.96),
    );
    this.leavesPaint.map = plants!;
    const uv = this.leaves.attributes['uv']!;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (2 + uv.getX(i)) / 3, 1 - uv.getY(i));
    for (let i = 0; i < 3; i++) {
      const m = new Mesh(this.leaves, this.leavesPaint);
      m.position.set(0.52 * i, 1.03, -i * 0.28);
      m.rotation.y = 0.35 + i * 0.94;
      this.cycad.add(m);
    }
    const palm = course.place(2778, 5.66, this.p);
    this.cycad.position.set(palm.x, palm.y, palm.z);
    this.oval(this.swimmer, 0x49777c, 0, 0.03, 0, 0.21, 0.13, 0.47);
    this.oval(this.swimmer, 0xad7e5c, 0, 0.16, -0.46, 0.14, 0.15, 0.15);
    this.oval(this.swimmer, 0xdfa54a, 0, 0.23, -0.47, 0.145, 0.103, 0.14);
    for (const [i, g] of this.arms.entries()) {
      const side = i === 0 ? -1 : 1;
      g.position.set(side * 0.22, 0.1, -0.23);
      this.swimmer.add(g);
      this.oval(g, 0xb68662, side * 0.1, 0, -0.12, 0.083, 0.087, 0.2);
      this.oval(g, 0xad7e5c, side * 0.18, -0.02, -0.37, 0.071, 0.074, 0.18);
    }
    const island = course.place(16245, -48, this.p);
    this.foam.position.set(island.x, 0.14, island.z);
    this.foam.rotation.y = island.heading;
    for (let i = 0; i < 6; i++) {
      const m = new Mesh(this.spray, this.white);
      m.rotation.y = i * 0.47;
      m.position.set((i - 3) * 1.35, 0, (i - 3) * 2.6);
      this.foam.add(m);
    }
    this.root.add(this.cycad, this.swimmer, this.foam);
  }
  update(metres: number, time: number) {
    this.cycad.visible = Math.abs(metres - 2778) < 155;
    this.shown.cycadSway = null;
    if (this.cycad.visible) {
      this.cycad.rotation.z = 0.058 * Math.sin(time * 1.34);
      this.shown.cycadSway = this.cycad.rotation.z;
    }
    this.swimmer.visible = Math.abs(metres - 11848) < 160;
    this.shown.swimmerStroke = null;
    if (this.swimmer.visible) {
      const p = this.course.place(11858 + 1.7 * Math.sin(time * 0.33), -104, this.p);
      this.swimmer.position.set(p.x, 0.12 + 0.036 * Math.sin(time * 2.45), p.z);
      this.swimmer.rotation.y = p.heading + 0.67;
      for (const [i, g] of this.arms.entries())
        g.rotation.x = 1.35 * Math.sin(time * 2.45 + i * Math.PI);
      this.shown.swimmerStroke = this.arms[0]!.rotation.x;
    }
    this.foam.visible = Math.abs(metres - 16245) < 190;
    this.shown.foamTravel = null;
    if (this.foam.visible) {
      for (const [i, w] of this.foam.children.entries()) {
        const phase = time * 0.77 + i * 0.68;
        w.position.x = (i - 3) * 1.35 + 1.35 * Math.sin(phase);
        w.scale.x = 0.8 + 0.19 * Math.cos(phase);
      }
      this.shown.foamTravel = this.foam.children[0]!.position.x;
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
    const overlook = s[0] >= 8910;
    const cameraHeight = s[0] === 11830 ? 5.4 : overlook ? 3.9 : 2.16;
    camera.y += (p.y + cameraHeight - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    const subjectHeight = overlook ? (s[0] === 16190 ? 7.4 : 2) : t.y + s[3];
    ahead.y +=
      (p.y + cameraHeight + (19 * (subjectHeight - p.y - cameraHeight)) / (len + 5) - ahead.y) *
      blend;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    this.cycad.clear();
    this.swimmer.clear();
    this.foam.clear();
    for (const item of [
      this.globe,
      this.leaves,
      this.leavesPaint,
      this.spray,
      this.white,
      ...this.colours.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
    this.colours.clear();
  }
}
