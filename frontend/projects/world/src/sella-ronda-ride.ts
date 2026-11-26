import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type BufferGeometry,
  type Texture,
} from 'three/webgpu';
import { attribute, positionWorld, texture, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';

import { rifugioFlags } from './rifugio-flags';
const names = ['asphalt', 'meadow', 'limestone', 'rifugio', 'pass-plates'] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class SellaRondaRide {
  readonly root = new Group();
  readonly materials = {
    RondaRoad: new MeshLambertNodeMaterial({ side: DoubleSide }),
    RondaMeadow: new MeshLambertNodeMaterial({ side: DoubleSide }),
    Peaks: new MeshLambertNodeMaterial({ side: DoubleSide, fog: false }),
    RondaInns: new MeshBasicMaterial({ side: DoubleSide }),
    RondaPassPlates: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly flags: ReturnType<typeof rifugioFlags>;
  private readonly box = new BoxGeometry();
  private readonly oval = new SphereGeometry(1, 12, 8);
  private readonly wheelGeometry = new TorusGeometry(0.295, 0.082, 7, 20);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly motorbike = new Group();
  private readonly wheels: Group[] = [];
  private readonly riders: SceneRider[] = [];
  private readonly pose = point();
  private readonly focus = point();
  private readonly reads = {
    rondaStation: 0,
    bankAngle: null as number | null,
    flagTip: null as number | null,
    bunchCrank: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      plain = new MeshLambertMaterial({ vertexColors: true });
    const results = await Promise.allSettled(
      names.map((n) => loader.loadAsync('courses/sellaronda-' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      plain.dispose();
      for (const map of maps) map.dispose();
      throw failure.reason;
    }
    try {
      return new SellaRondaRide(course, maps, plain, await caribanaCyclists(plain, true));
    } catch (error) {
      plain.dispose();
      for (const map of maps) map.dispose();
      throw error;
    }
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
    private readonly plain: MeshLambertMaterial,
    private readonly kit: Awaited<ReturnType<typeof caribanaCyclists>>,
  ) {
    for (let i = 0; i < maps.length; i++) {
      maps[i]!.colorSpace = SRGBColorSpace;
      maps[i]!.flipY = false;
    }
    const surfaces = [this.materials.RondaRoad, this.materials.RondaMeadow, this.materials.Peaks];
    for (const [i, m] of surfaces.entries()) {
      const t = maps[i]!;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = 4;
      const sample = texture(
        t,
        positionWorld.xz.add(positionWorld.y.mul(vec2(0.43, 0.82))).div([3, 6, 46][i]!),
      ).rgb;
      // Retain the meadow altitude bands and the massif's baked alpenglow beneath the local surface detail.
      m.colorNode =
        i === 0
          ? sample
          : attribute('color', 'vec3').mul(
              sample.mul(i === 2 ? 1.75 : 1.45).add(i === 2 ? 0.63 : 0.51),
            );
    }
    this.materials.RondaInns.map = maps[3]!;
    this.materials.RondaPassPlates.map = maps[4]!;
    this.flags = rifugioFlags(course);
    this.root.add(this.flags.root, this.motorbike);
    for (const z of [-0.69, 0.69]) {
      const g = new Group();
      g.rotation.y = Math.PI / 2;
      g.position.set(0, 0.39, z);
      const tyre = new Mesh(this.wheelGeometry, this.paint(0x302e2b));
      g.add(tyre);
      for (let i = 0; i < 6; i++) {
        const spoke = this.part(g, 0xafb4aa, 0, 0, 0, 0.028, 0.55, 0.024);
        spoke.rotation.z = (i * Math.PI) / 6;
      }
      this.motorbike.add(g);
      this.wheels.push(g);
    }
    this.part(this.motorbike, 0x485050, 0, 0.66, 0.12, 0.49, 0.43, 0.68, this.oval);
    this.part(this.motorbike, 0x963e32, 0, 0.87, -0.19, 0.35, 0.23, 0.43, this.oval);
    this.part(this.motorbike, 0x393c38, 0, 0.93, 0.26, 0.46, 0.15, 0.69);
    this.part(this.motorbike, 0xb54536, 0, 0.82, -0.73, 0.36, 0.35, 0.2, this.oval);
    this.part(this.motorbike, 0xf1e3ad, 0, 0.84, -0.89, 0.21, 0.16, 0.065, this.oval);
    for (const x of [-0.17, 0.17]) {
      const fork = this.part(this.motorbike, 0x899390, x, 0.64, -0.64, 0.065, 0.66, 0.065);
      fork.rotation.x = -0.17;
      this.part(this.motorbike, 0x424849, x, 0.66, 0.21, 0.13, 0.5, 0.16);
      this.part(this.motorbike, 0x343a39, x, 0.49, 0.13, 0.13, 0.12, 0.31);
    }
    const torso = this.part(this.motorbike, 0x38494a, 0, 1.2, 0.12, 0.25, 0.34, 0.2, this.oval);
    torso.rotation.x = -0.26;
    this.part(this.motorbike, 0xe3ded0, 0, 1.62, -0.035, 0.173, 0.19, 0.19, this.oval);
    this.part(this.motorbike, 0x343f41, 0, 1.65, -0.18, 0.153, 0.065, 0.066, this.oval);
    for (const x of [-0.21, 0.21]) {
      const arm = this.part(this.motorbike, 0x3d4b4a, x, 1.16, -0.17, 0.1, 0.125, 0.27);
      arm.rotation.x = -0.38;
    }
    for (const side of [-1, 1]) {
      this.part(this.motorbike, 0x5d6266, side * 0.3, 0.71, 0.44, 0.24, 0.36, 0.49);
      this.part(this.motorbike, 0xb1aaa1, side * 0.3, 0.9, 0.44, 0.25, 0.045, 0.5);
    }
    for (const [i, c] of [0x805491, 0xc65340, 0x387f93, 0xd4ac52, 0x358c76, 0xe2dede].entries()) {
      const rider = kit.make(new Color(c), 2205 + i);
      this.riders.push(rider);
      this.root.add(rider.group);
    }
    this.update(0, 0);
  }
  private paint(tint: number) {
    let p = this.paints.get(tint);
    if (!p) {
      p = new MeshLambertMaterial({ color: tint });
      this.paints.set(tint, p);
    }
    return p;
  }
  private part(
    group: Group,
    tint: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    geo: BufferGeometry = this.box,
  ) {
    const m = new Mesh(geo, this.paint(tint));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    group.add(m);
    return m;
  }
  update(metres: number, time: number) {
    const state = this.reads;
    state.rondaStation = metres;
    state.bankAngle = state.flagTip = state.bunchCrank = null;
    this.motorbike.visible = Math.abs(metres - 7720) < 125;
    if (this.motorbike.visible) {
      const period = 220;
      const gap = ((((15 + time * 11.2 - metres + 7700) % period) + period) % period) - 14;
      const d = metres + gap,
        p = this.course.place(d, -1.57, this.pose);
      const next = this.course.place(d + 4, -1.57, this.focus),
        delta = next.heading - p.heading;
      this.motorbike.position.set(p.x, p.y + 0.08, p.z);
      this.motorbike.rotation.order = 'YXZ';
      this.motorbike.rotation.set(
        p.pitch,
        p.heading,
        // Banking follows v²/r. A smooth limit keeps the lean changing through the apex.
        0.68 *
          Math.tanh(
            (11.2 * 11.2 * Math.atan2(Math.sin(delta), Math.cos(delta))) / (4 * 9.81 * 0.68),
          ),
      );
      for (const g of this.wheels) g.rotation.z = -time * 21;
      state.bankAngle = this.motorbike.rotation.z;
    }
    state.flagTip = this.flags.update(metres, time);
    const bunchAt = [200, 2060, 4900, 10100].find((station) => Math.abs(station - metres) < 190);
    for (const [i, rider] of this.riders.entries()) {
      rider.group.visible = bunchAt !== undefined;
      if (bunchAt === undefined) continue;
      const gap = ((((time * 5.4 + i * 6 + 9 - (metres - bunchAt)) % 105) + 105) % 105) - 8;
      const p = this.course.place(metres + gap, i % 2 ? 1.5 : -0.94, this.pose);
      rider.group.position.set(p.x, p.y + 0.11, p.z);
      rider.group.rotation.order = 'YXZ';
      rider.group.rotation.set(p.pitch, p.heading, 0);
      const crank = time * (7.7 + i * 0.17) + i;
      rider.pose(crank, 0.01 * Math.sin(crank), 0.06);
      if (!i) state.bunchCrank = crank;
    }
    this.kit.roll(time * 5.4);
  }
  report() {
    return this.reads;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.box,
      this.oval,
      this.wheelGeometry,
      this.flags,
      this.kit,
      this.plain,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      item.dispose();
  }
}
