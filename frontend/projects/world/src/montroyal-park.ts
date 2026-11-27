import { mix, positionWorld, sin, smoothstep, uniform, vec3, vertexColor } from 'three/tsl';
import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
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
  [80, 109, 3.9, 2],
  [4420, 4470, 0, 2.4],
  [8190, 8226, 8.6, 1.9],
  [13030, 13077, -45, 0.95],
  [18640, 18696, 21, 4.5],
  [24560, 24665, -113, 3.45],
] as const;
export class MontRoyalPark {
  readonly root = new Group();
  private readonly p = point();
  private readonly target = point();
  private readonly phase = uniform(0);
  readonly materials = {
    RoyalWoods: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    ParcSigns: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.55 }),
    BelvedereCity: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.35, fog: false }),
    CastorsWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ParkRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly kit: CourseCyclistKit;
  private readonly cyclists: RiderModel[];
  private readonly kitSurface = new MeshLambertMaterial({ vertexColors: true });
  private readonly runner = new Group();
  private readonly limb = new SphereGeometry(1, 10, 8);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly legs: Group[] = [];
  private readonly arms: Group[] = [];
  private readonly shown = {
    clubStation: null as number | null,
    runnerStride: null as number | null,
    lakePhase: null as number | null,
  };
  static async load(course: Course, body: RiderBody) {
    const results = await Promise.allSettled(
      ['woods', 'signs', 'ville'].map((name) =>
        new TextureLoader().loadAsync('courses/montroyal-' + name + '.webp'),
      ),
    );
    const imgs = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const fail = results.find((r) => r.status === 'rejected');
    if (fail) {
      for (const i of imgs) i.dispose();
      throw fail.reason;
    }
    return new MontRoyalPark(course, body, imgs);
  }
  private part(
    root: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    let mat = this.paints.get(c);
    if (!mat) {
      mat = new MeshLambertMaterial({ color: c });
      this.paints.set(c, mat);
    }
    const m = new Mesh(this.limb, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    root.add(m);
    return m;
  }
  private constructor(
    private readonly course: Course,
    body: RiderBody,
    private readonly images: Texture[],
  ) {
    const [woods, signs, sky] = images as [Texture, Texture, Texture];
    for (const img of images) {
      img.colorSpace = SRGBColorSpace;
      img.flipY = false;
    }
    this.materials.RoyalWoods.map = woods;
    this.materials.ParcSigns.map = signs;
    this.materials.BelvedereCity.map = sky;
    const t = vertexColor().rgb,
      pos = positionWorld,
      ripple = sin(
        pos.x
          .mul(0.81)
          .add(sin(pos.z.mul(0.58)))
          .add(this.phase),
      )
        .mul(0.5)
        .add(0.5);
    this.materials.CastorsWater.colorNode = mix(
      t.mul(vec3(0.72, 0.87, 1)),
      vec3(0.63, 0.72, 0.73),
      smoothstep(0.92, 0.998, ripple).mul(0.4),
    );
    this.materials.ParkRoad.colorNode = t.mul(
      sin(pos.x.mul(57).add(pos.z.mul(77)))
        .mul(0.035)
        .add(0.96),
    );
    this.kit = new CourseCyclistKit(this.kitSurface, body, false, true);
    this.cyclists = [0xad3340, 0x3684a5, 0xebb24c, 0x44806a].map((c, i) => {
      const rider = this.kit.make(new Color(c), 27 + i * 13, false, 0.55);
      this.root.add(rider.group);
      return rider;
    });
    this.part(this.runner, 0x3f8796, 0, 1.16, 0, 0.23, 0.34, 0.155);
    this.part(this.runner, 0xb57e60, 0, 1.62, 0, 0.136, 0.17, 0.14);
    this.part(this.runner, 0x413b34, 0, 1.72, 0.02, 0.14, 0.09, 0.14);
    for (const sign of [-1, 1]) {
      const hip = new Group();
      hip.position.set(sign * 0.103, 0.9, 0);
      this.runner.add(hip);
      this.part(hip, 0x3b3946, 0, -0.19, 0, 0.091, 0.25, 0.103);
      this.part(hip, 0xb78365, 0, -0.59, 0.09, 0.072, 0.245, 0.075).rotation.x = -0.3;
      this.part(hip, 0xd4d0ba, 0, -0.81, 0.12, 0.082, 0.062, 0.16);
      this.legs.push(hip);
      const arm = new Group();
      arm.position.set(sign * 0.199, 1.38, 0);
      this.runner.add(arm);
      this.part(arm, 0xb78365, 0, -0.143, 0.026, 0.068, 0.173, 0.071);
      this.part(arm, 0xb78365, 0, -0.254, -0.105, 0.059, 0.063, 0.18);
      this.arms.push(arm);
    }
    this.root.add(this.runner);
  }
  update(metres: number, time: number) {
    this.phase.value = time * 0.8;
    this.shown.lakePhase = Math.abs(metres - 13077) < 200 ? this.phase.value : null;
    const onClimb = metres < 650 || Math.abs(metres - 4450) < 265;
    this.shown.clubStation = null;
    for (const [i, rider] of this.cyclists.entries()) {
      rider.group.visible = onClimb;
      if (!onClimb) continue;
      const ahead = 11 + Math.floor(i / 2) * 7 + 2 * Math.sin(time * 0.27 + i * 0.46);
      const d = metres + ahead,
        p = this.course.place(d, 2.52 + (i % 2) * 1.12, this.p);
      rider.group.position.set(p.x, p.y + 0.05, p.z);
      rider.group.rotation.set(-p.pitch, p.heading, 0.022 * Math.sin(time * 1.83 + i), 'YXZ');
      rider.pose(time * 6.2 + i, 0.18);
      if (!i) this.shown.clubStation = d;
    }
    this.runner.visible = Math.abs(metres - 8226) < 225;
    this.shown.runnerStride = null;
    if (this.runner.visible) {
      const stride = Math.sin(time * 5.52),
        p = this.course.place(8224 + 5 * Math.sin(time * 0.24), 8.9, this.p);
      this.runner.position.set(p.x, p.y + 0.09 + 0.047 * Math.abs(stride), p.z);
      this.runner.rotation.y = p.heading;
      for (const [i, leg] of this.legs.entries()) {
        const s = i === 0 ? -1 : 1;
        leg.rotation.x = s * 0.61 * stride;
        this.arms[i]!.rotation.x = -s * 0.54 * stride;
      }
      this.shown.runnerStride = this.legs[0]!.rotation.x;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = stops.find((s) => Math.abs(metres - s[0]) < 90);
    if (!stop) return;
    const blend = Math.min(1, (1 - Math.abs(metres - stop[0]) / 90) * 1.65);
    const p = this.course.place(metres, 0, this.p),
      t = this.course.place(stop[1], stop[2], this.target),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.16 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + stop[3] + (14 * (t.y - p.y)) / len - ahead.y) * blend;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    this.runner.clear();
    for (const rider of this.cyclists) for (const item of rider.owned) item.dispose();
    this.kit.dispose();
    for (const item of [
      this.limb,
      this.kitSurface,
      ...this.paints.values(),
      ...this.images,
      ...Object.values(this.materials),
    ])
      item.dispose();
    this.paints.clear();
  }
}
