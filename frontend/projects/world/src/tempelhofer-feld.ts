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
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Texture,
} from 'three/webgpu';
import { mix, positionWorld, sin, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const views = [
  [120, 180, 0, 3],
  [2480, 2565, 65, 5.5],
  [4910, 4940, -5, 6],
  [7160, 7188, -9, 1.2],
  [9520, 9760, -270, 23],
  [12640, 12678, 7, 5.5],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class TempelhoferFeld {
  readonly root = new Group();
  readonly materials = {
    RunwaySlabs: new MeshBasicNodeMaterial({ side: DoubleSide }),
    TempelGrass: new MeshBasicNodeMaterial({ side: DoubleSide }),
    BerlinHorizon: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    TerminalBays: new MeshBasicMaterial({ side: DoubleSide }),
    SkylarkGrass: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    AllmendeBeds: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    FieldVisitors: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    AirfieldSigns: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly box = new BoxGeometry();
  private readonly sphere = new SphereGeometry(1, 12, 8);
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly owned: BufferGeometry[] = [];
  private readonly time = uniform(0);
  private readonly kiteGroups: Group[] = [];
  private readonly cords: Mesh[] = [];
  private readonly skater = new Group();
  private readonly runners: Group[] = [];
  private readonly legs: Group[] = [];
  private readonly socks: Group[] = [];
  private readonly sockSegments: Group[][] = [];
  private readonly a = new Vector3();
  private readonly b = new Vector3();
  private readonly dir = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    kiteBank: null as number | null,
    runnerStride: null as number | null,
    windsockYaw: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'tempelhof-terminal',
        'tempelhof-meadow',
        'tempelhof-garden',
        'tempelhof-sky',
        'tempelhof-concrete',
        'tempelhof-sign',
        'tempelhof-park',
        'tempelhof-turf',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      err = results.find((r) => r.status === 'rejected');
    if (err) {
      for (const m of maps) m.dispose();
      throw err.reason;
    }
    return new TempelhoferFeld(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
    }
    this.materials.TerminalBays.map = maps[0]!;
    this.materials.SkylarkGrass.map = maps[1]!;
    this.materials.AllmendeBeds.map = maps[2]!;
    this.materials.AirfieldSigns.map = maps[5]!;
    this.materials.FieldVisitors.map = maps[6]!;
    for (const i of [4, 7]) maps[i]!.wrapS = maps[i]!.wrapT = RepeatWrapping;
    const xy = positionWorld.xz,
      concrete = texture(maps[4]!, xy.mul(0.165)).rgb;
    const grid = uv()
      .mul(vec2(1 / 5.5, 1 / 8.3))
      .fract();
    const joint = smoothstep(0.004, 0.013, grid.x).mul(smoothstep(0.005, 0.017, grid.y));
    const d = uv().y.abs();
    const taxi = smoothstep(1820, 1915, d)
      .mul(smoothstep(4500, 4410, d))
      .add(smoothstep(6210, 6320, d).mul(smoothstep(10810, 10650, d)))
      .add(smoothstep(12220, 12330, d));
    this.materials.RunwaySlabs.colorNode = mix(
      concrete.mul(joint.mul(0.21).add(0.79)),
      concrete.mul(0.49),
      taxi,
    );
    this.materials.TempelGrass.colorNode = texture(maps[7]!, xy.mul(0.24)).rgb;
    const sky = uv().add(
      vec2(
        sin(this.time.mul(0.018))
          .mul(0.009)
          .mul(smoothstep(0.18, 0.44, uv().y.oneMinus())),
        0,
      ),
    );
    this.materials.BerlinHorizon.colorNode = texture(maps[3]!, sky).rgb;
    for (let i = 0; i < 4; i++) {
      const kite = new Group(),
        span = i ? 3.3 : 5.2;
      for (let j = 0; j < 10; j++) {
        const u = (j - 5) / 5,
          v = (j - 4) / 5;
        const point = (x: number, back: number) => [
          x * span,
          2.1 * (1 - x * x) - back * 1.4,
          back - 0.48 * x * x,
        ];
        const a = point(u, 0),
          b = point(v, 0),
          c = point(v, 1.85),
          e = point(u, 1.85);
        const g = new BufferGeometry();
        g.setAttribute(
          'position',
          new Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...e], 3),
        );
        this.owned.push(g);
        kite.add(
          new Mesh(
            g,
            this.paint([0xc45245, 0xe5ad51, 0x4c8394, 0xeee2ba][(i + Math.floor(j / 2)) % 4]!),
          ),
        );
      }
      this.kiteGroups.push(kite);
      this.root.add(kite);
      for (let side = 0; side < 2; side++) {
        const line = new Mesh(this.box, this.paint(0x716d63));
        this.cords.push(line);
        this.root.add(line);
      }
    }
    this.person(this.skater, 0x598778, false);
    this.shape(this.skater, 0, 0.105, 0, 0.41, 0.12, 1.32, 0x745a42, true);
    for (const z of [-0.43, 0.43])
      for (const x of [-0.23, 0.23])
        this.shape(this.skater, x, 0.092, z, 0.087, 0.088, 0.09, 0x403f3b);
    this.root.add(this.skater);
    for (let i = 0; i < 3; i++) {
      const r = new Group();
      this.person(r, [0xc0674b, 0x5b80a6, 0xc49940][i]!, true);
      this.root.add(r);
      this.runners.push(r);
    }
    for (const [i, d] of [4924, 12678].entries()) {
      const p = course.place(d, i ? 7.0 : 26.3);
      const root = new Group();
      root.position.set(p.x, p.y + 8.02, p.z);
      const segments: Group[] = [];
      let parent = root;
      for (let j = 0; j < 6; j++) {
        const part = new Group();
        if (j) part.position.z = 0.58;
        const geo = new CylinderGeometry(
          0.49 - j * 0.055 - 0.055,
          0.49 - j * 0.055,
          0.61,
          12,
          1,
          true,
        );
        this.owned.push(geo);
        const mesh = new Mesh(geo, this.paint(j % 2 ? 0xf2e3cb : 0xd86345));
        mesh.rotation.x = Math.PI / 2;
        mesh.position.z = 0.29;
        part.add(mesh);
        parent.add(part);
        segments.push(part);
        parent = part;
      }
      this.socks.push(root);
      this.sockSegments.push(segments);
      this.root.add(root);
    }
    this.update(0, 0);
  }
  private paint(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshBasicMaterial({ color: c, side: DoubleSide });
      this.paints.set(c, m);
    }
    return m;
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
    const part = new Mesh(box ? this.box : this.sphere, this.paint(c));
    part.position.set(x, y, z);
    part.scale.set(w, h, d);
    parent.add(part);
    return part;
  }
  private person(g: Group, shirt: number, runs: boolean) {
    for (const side of [-1, 1]) {
      const leg = new Group();
      leg.position.set(side * 0.116, 0.91, side * 0.006);
      this.shape(leg, 0, -0.2, 0, 0.136, 0.235, 0.146, 0x46525e);
      this.shape(leg, 0, -0.53, 0.008, 0.096, 0.246, 0.105, 0xbb8b69);
      this.shape(leg, 0, -0.84, -0.078, 0.105, 0.089, 0.183, 0x6c625c);
      g.add(leg);
      if (runs) this.legs.push(leg);
      this.shape(g, side * 0.29, 1.28, runs ? side * 0.1 : -0.06, 0.103, 0.24, 0.103, 0xbe916d);
      this.shape(g, side * 0.33, 1.13, -0.16, 0.09, 0.095, 0.19, 0xbb8b69);
    }
    this.shape(g, 0, 1.23, 0, 0.284, 0.38, 0.18, shirt);
    this.shape(g, 0, 1.76, -0.01, 0.151, 0.184, 0.15, 0xc39a7a);
    this.shape(g, 0, 1.87, 0.016, 0.16, 0.105, 0.157, runs ? 0x62534a : 0x4d6167);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.poses.kiteBank = this.poses.runnerStride = this.poses.windsockYaw = null;
    const near = Math.abs(metres - 4910) < 420;
    this.skater.visible = near;
    const p = this.course.place(
      4931 + 7 * Math.sin(t * 0.16),
      -4.2 + 1.1 * Math.cos(t * 0.17),
      this.point,
    );
    this.skater.position.set(p.x, p.y + 0.1, p.z);
    this.skater.rotation.set(0, p.heading + 0.45, 0.09 * Math.sin(t * 0.46));
    for (const [i, kite] of this.kiteGroups.entries()) {
      kite.visible = near;
      const l = this.cords[i * 2]!,
        r = this.cords[i * 2 + 1]!;
      l.visible = r.visible = near;
      if (!near) continue;
      const q = this.course.place(
        4947 + i * 16 + 3.7 * Math.sin(t * 0.37 + i),
        -8 - i * 4 + 3.8 * Math.cos(t * 0.41 + i),
        this.point,
      );
      kite.position.set(q.x, q.y + 9 + i * 1.7 + 1.1 * Math.sin(t * 0.63 + i), q.z);
      kite.rotation.set(
        0.21 * Math.sin(t * 0.46 + i),
        q.heading + 0.43,
        0.31 * Math.sin(t * 0.61 + i),
      );
      if (i === 0) this.poses.kiteBank = kite.rotation.z;
      for (const [s, line] of [
        [-1, l],
        [1, r],
      ] as const) {
        if (!i) this.a.copy(this.skater.position);
        else {
          const a = this.course.place(4941 + i * 15, -9 - i * 3, this.target);
          this.a.set(a.x, a.y, a.z);
        }
        this.a.y += 1.38;
        this.b
          .set(s * (i ? 2.5 : 4.3), 0.52, 0.27)
          .applyEuler(kite.rotation)
          .add(kite.position);
        this.dir.copy(this.b).sub(this.a);
        line.position.copy(this.a).lerp(this.b, 0.5);
        line.scale.set(0.025, this.dir.length(), 0.025);
        line.quaternion.setFromUnitVectors(this.up, this.dir.normalize());
      }
    }
    for (const [i, runner] of this.runners.entries()) {
      runner.visible = Math.abs(metres - 7160) < 360;
      if (!runner.visible) continue;
      const q = this.course.place(
          7180 + i * 6.1 + 6.3 * Math.sin(t * 0.19 + i),
          -3.4 - i * 0.48,
          this.point,
        ),
        phase = t * 5.4 + i;
      runner.position.set(q.x, q.y + 0.05 + 0.065 * Math.abs(Math.cos(phase)), q.z);
      runner.rotation.y = q.heading + 0.19;
      this.legs[2 * i]!.rotation.x = 0.54 * Math.sin(phase);
      this.legs[2 * i + 1]!.rotation.x = -0.54 * Math.sin(phase);
      if (!i) this.poses.runnerStride = this.legs[0]!.rotation.x;
    }
    for (const [i, sock] of this.socks.entries()) {
      sock.visible = Math.abs(metres - (i ? 12640 : 4910)) < 380;
      if (!sock.visible) continue;
      sock.rotation.y = 0.94 + 0.32 * Math.sin(t * 0.7 + i);
      for (const [j, s] of this.sockSegments[i]!.entries()) {
        s.rotation.x = 0.052 + 0.075 * Math.sin(t * 2.7 - j * 0.63);
        s.rotation.y = 0.065 * Math.sin(t * 1.9 - j * 0.64);
      }
      if (i === 1) this.poses.windsockYaw = sock.rotation.y;
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
      ...this.owned,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      item.dispose();
  }
}
