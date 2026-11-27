import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform, uv } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const views = [
  [120, 164, 0, 2],
  [2080, 2133, 25, -2],
  [4250, 4280, 22, 1],
  [6470, 6506, 16, 1.1],
  [8360, 8420, 220, 1],
  [10410, 10565, 26, 10],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
function shore(d: number) {
  return 48 + 9 * Math.sin(d / 152) + 6 * Math.cos(d / 318);
}
function sand(d: number, v: number, z: number) {
  const f = Math.max(0, Math.min(1, (v - 7) / (shore(d) - 7)));
  return z - 0.19 + (0.12 - z) * f - Math.max(0, v - shore(d)) * 0.14;
}
export class Tayelet {
  readonly root = new Group();
  readonly materials = {
    TayeletCafe: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    TayeletPaving: new MeshBasicNodeMaterial({ side: DoubleSide }),
    LevantSand: new MeshBasicNodeMaterial({ side: DoubleSide }),
    LevantSea: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    SeaWash: new MeshBasicNodeMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
    TelAvivHotels: new MeshBasicMaterial({ side: DoubleSide }),
    DatePalms: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    JaffaStone: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    WesternSky: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    GordonPool: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly time = uniform(0);
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly box = new BoxGeometry();
  private readonly sphere = new SphereGeometry(1, 12, 8);
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly boats: Group[] = [];
  private readonly players: Group[] = [];
  private readonly arms: Group[] = [];
  private readonly volleyball = new Group();
  private readonly matkotBall = new Group();
  private readonly poses = {
    gordonRoll: null as number | null,
    beachBall: null as number | null,
    swashTravel: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'telaviv-hotels',
        'telaviv-palms',
        'telaviv-jaffa',
        'telaviv-sunset',
        'telaviv-circles',
        'telaviv-sand',
        'galibier-tarmac',
        'telaviv-cafe',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      err = results.find((r) => r.status === 'rejected');
    if (err) {
      for (const m of maps) m.dispose();
      throw err.reason;
    }
    return new Tayelet(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
    }
    this.materials.TayeletCafe.map = maps[7]!;
    this.materials.TelAvivHotels.map = maps[0]!;
    this.materials.DatePalms.map = maps[1]!;
    this.materials.JaffaStone.map = maps[2]!;
    this.materials.WesternSky.map = maps[3]!;
    for (const m of maps.slice(4)) m.wrapS = m.wrapT = RepeatWrapping;
    const xy = positionWorld.xz,
      grain = texture(maps[6]!, xy.mul(0.28)).r;
    const path = texture(maps[4]!, uv().mul(0.19)).rgb,
      lane = color(0xb55f52).mul(grain.mul(0.32).add(0.86));
    const white = smoothstep(1.52, 1.54, uv().x.abs()).mul(smoothstep(1.63, 1.61, uv().x.abs()));
    this.materials.TayeletPaving.colorNode = mix(
      mix(lane, path, smoothstep(1.63, 1.66, uv().x.abs())),
      color(0xe7d9bf),
      white,
    );
    this.materials.LevantSand.colorNode = texture(maps[5]!, xy.mul(0.31)).rgb;
    const swell = sin(
      xy.y
        .mul(0.37)
        .add(sin(xy.x.mul(0.14)).mul(1.2))
        .add(this.time),
    );
    this.materials.LevantSea.colorNode = mix(
      color(0x4ba69b),
      color(0x337888),
      smoothstep(0.03, 0.7, uv().x),
    ).add(smoothstep(0.87, 1, swell).mul(0.057));
    const wash = sin(
      uv()
        .x.mul(11)
        .add(this.time.mul(1.3))
        .add(sin(uv().y.mul(0.58)).mul(0.86)),
    );
    this.materials.SeaWash.colorNode = color(0xf2ecdf);
    this.materials.SeaWash.opacityNode = smoothstep(0.52, 0.94, wash)
      .mul(sin(uv().x.mul(Math.PI)))
      .mul(0.74);
    this.materials.GordonPool.colorNode = mix(
      color(0x469baf),
      color(0x87c5c6),
      swell.mul(0.27).add(0.46),
    );
    for (let i = 0; i < 9; i++) {
      const boat = new Group();
      this.shape(boat, 0, 0.3, 0, 1.22, 0.54, 3.95, i % 2 ? 0xeee8d8 : 0xc38a62);
      this.shape(boat, 0, 0.78, -0.23, 1.52, 0.35, 2.6, 0x8a8f87, true);
      this.shape(boat, 0, 3.92, -0.36, 0.07, 6.3, 0.07, 0xa5a29b, true);
      this.shape(boat, 0, 1.56, 1.07, 0.08, 0.09, 2.65, 0x6b7676, true);
      this.boats.push(boat);
      this.root.add(boat);
    }
    for (let i = 0; i < 8; i++) {
      const g = new Group(),
        arm = new Group(),
        skin = [0xb67e59, 0xc39272, 0xad7859, 0xd6a683][i % 4]!;
      for (const side of [-1, 1]) {
        this.shape(g, 0.13 * side, 0.48, side * 0.15, 0.11, 0.42, 0.13, skin);
        this.shape(g, 0.13 * side, 0.09, side * 0.15 - 0.08, 0.115, 0.08, 0.18, 0xc8b5a0);
        this.shape(
          g,
          0.13 * side,
          0.85,
          side * 0.07,
          0.14,
          0.23,
          0.16,
          i % 2 ? 0x426d84 : 0x59565a,
        );
      }
      this.shape(g, 0, 1.2, 0, 0.32, 0.39, 0.2, [0xd36144, 0xe6b74f, 0x49858c, 0x71819c][i % 4]!);
      this.shape(g, 0, 1.77, 0, 0.151, 0.18, 0.15, skin);
      this.shape(g, 0, 1.88, 0.022, 0.156, 0.11, 0.16, 0x55423b);
      arm.position.set(0.26, 1.48, -0.05);
      this.shape(arm, 0.17, 0, -0.14, 0.23, 0.077, 0.095, skin);
      this.shape(arm, 0.35, 0.095, -0.25, 0.085, 0.18, 0.091, skin);
      if (i > 5) {
        this.shape(arm, 0.37, 0.32, -0.23, 0.041, 0.18, 0.052, 0x90674e);
        this.shape(arm, 0.37, 0.52, -0.23, 0.18, 0.23, 0.044, 0xd3ab73);
      }
      this.shape(g, -0.31, 1.29, -0.06, 0.103, 0.26, 0.1, skin);
      g.add(arm);
      this.players.push(g);
      this.arms.push(arm);
      this.root.add(g);
    }
    this.shape(this.volleyball, 0, 0, 0, 0.17, 0.17, 0.17, 0xf3cd65);
    this.shape(this.volleyball, 0, 0.03, 0.02, 0.177, 0.075, 0.167, 0x4a80a1);
    this.shape(this.matkotBall, 0, 0, 0, 0.065, 0.065, 0.065, 0x413a39);
    this.root.add(this.volleyball, this.matkotBall);
    this.update(0, 0);
  }
  private shape(
    parent: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: number,
    box = false,
  ) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshBasicMaterial({ color: c });
      this.paints.set(c, m);
    }
    const part = new Mesh(box ? this.box : this.sphere, m);
    part.position.set(x, y, z);
    part.scale.set(w, h, d);
    parent.add(part);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.poses.swashTravel = Math.abs(metres - 8360) < 450 ? t * 1.3 : null;
    this.poses.beachBall = this.poses.gordonRoll = null;
    for (const [i, b] of this.boats.entries()) {
      b.visible = Math.abs(metres - 2080) < 460;
      if (!b.visible) continue;
      const d = 2106 + 7.7 * i,
        p = this.course.place(d, shore(d) + 7 + (i % 3) * 3.9, this.point);
      b.position.set(p.x, 0.13 + 0.085 * Math.sin(t * 1.4 + i), p.z);
      b.rotation.set(0.03 * Math.sin(t + i), p.heading + 0.45, 0.059 * Math.sin(t * 1.5 + i));
      if (i === 0) this.poses.gordonRoll = b.rotation.z;
    }
    const play = Math.abs(metres - 4250) < 340;
    this.volleyball.visible = this.matkotBall.visible = play;
    for (const [i, g] of this.players.entries()) {
      g.visible = play;
      if (!play) continue;
      const near = i < 6,
        d = near ? 4280 + (i % 2 ? 4 : -4) + Math.floor(i / 2) * 0.65 : 4260 + (i % 2 ? 3.4 : -3.4);
      const lane = near ? 19 + Math.floor(i / 2) * 2.9 : 13.4;
      const p = this.course.place(d, lane, this.point);
      const phase = t * 2.3 + i * 0.8;
      g.position.set(
        p.x,
        sand(d, lane, p.y) + (near ? 0.18 * Math.max(0, Math.sin(phase)) : 0),
        p.z,
      );
      g.rotation.y = p.heading + (i % 2 ? Math.PI : 0);
      this.arms[i]!.rotation.z = 0.55 + 0.69 * Math.sin(phase);
    }
    if (play) {
      const f = (Math.sin(t * 1.92) + 1) / 2,
        d = 4276 + 8 * f,
        p = this.course.place(d, 22, this.point),
        h = 2.22 + 2.45 * 4 * f * (1 - f);
      this.volleyball.position.set(p.x, sand(d, 22, p.y) + h, p.z);
      this.volleyball.rotation.y = t * 2.7;
      this.poses.beachBall = this.volleyball.position.y;
      const n = 4260 + 3.2 * Math.sin(t * 2.7),
        q = this.course.place(n, 13.4, this.point);
      this.matkotBall.position.set(q.x, sand(n, 13.4, q.y) + 1.51 + 0.28 * Math.cos(t * 5.4), q.z);
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 23);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.35 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.55 + (18.8 * (p.y + lift - r.y - 2.35)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.box,
      this.sphere,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      item.dispose();
  }
}
