import {
  BoxGeometry,
  Color,
  CylinderGeometry,
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
  type Vector3,
} from 'three/webgpu';
import { positionWorld, texture, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';

const names = [
  'gardena-tarmac',
  'gardena-turf',
  'gardena-limestone',
  'gardena-larches',
  'gardena-rifugi',
  'gardena-sassolungo',
  'gardena-sella',
  'sella-signs',
] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const mask = (cut = false) => new MeshBasicMaterial({ side: DoubleSide, alphaTest: cut ? 0.4 : 0 });
const VIEWS = [
  [80, 115, 1, 2],
  [2460, 2495, 2, 2],
  [4920, 4945, 7, 0.8],
  [9740, 9764, -8, 3],
  [11580, 11608, 5.55, 2.6],
] as const;
export class SellaClimb {
  readonly root = new Group();
  readonly materials = {
    Tarmac: new MeshLambertNodeMaterial({ side: DoubleSide, flatShading: true }),
    Pasture: new MeshLambertNodeMaterial({ side: DoubleSide, flatShading: true }),
    Scree: new MeshLambertNodeMaterial({ side: DoubleSide, flatShading: true }),
    SellaBlocks: mask(),
    SellaForest: mask(true),
    SellaRifugi: mask(),
    Langkofel: mask(true),
    SellaPlateau: mask(true),
    PassSigns: mask(true),
  };
  private readonly box = new BoxGeometry();
  private readonly oval = new SphereGeometry(1, 12, 8);
  private readonly wheelGeometry = new TorusGeometry(0.295, 0.082, 7, 20);
  private readonly axle = new CylinderGeometry(1, 1, 1, 10);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly motorbike = new Group();
  private readonly wheels: Group[] = [];
  private readonly cattle = new Group();
  private readonly necks: Group[] = [];
  private readonly riders: SceneRider[] = [];
  private readonly pose = point();
  private readonly focus = point();
  private readonly reads = {
    sellaStation: 0,
    motoLean: null as number | null,
    grazingPitch: null as number | null,
    pelotonCrank: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      plain = new MeshLambertMaterial({ vertexColors: true });
    const results = await Promise.allSettled(
      names.map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      plain.dispose();
      for (const map of maps) map.dispose();
      throw failure.reason;
    }
    try {
      return new SellaClimb(course, maps, plain, await caribanaCyclists(plain, true));
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
    const surfaces = [this.materials.Tarmac, this.materials.Pasture, this.materials.Scree];
    for (const [i, m] of surfaces.entries()) {
      const t = maps[i]!;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = 4;
      m.colorNode = texture(
        t,
        positionWorld.xz.add(positionWorld.y.mul(vec2(0.19, 0.31))).div([2, 4.5, 2.4][i]!),
      ).rgb;
    }
    const faces = [
      this.materials.SellaBlocks,
      this.materials.SellaForest,
      this.materials.SellaRifugi,
      this.materials.Langkofel,
      this.materials.SellaPlateau,
      this.materials.PassSigns,
    ];
    for (const [i, m] of faces.entries()) {
      m.map = maps[i + 2]!;
      m.fog = i !== 3 && i !== 4;
    }
    this.root.add(this.cattle, this.motorbike);
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
    for (let i = 0; i < 7; i++) {
      const cow = new Group(),
        p = course.place(4943 + (i % 3) * 8 + Math.floor(i / 3) * 4, 6.2 + (i % 4) * 2.1);
      cow.position.set(p.x, p.y - 0.14, p.z);
      cow.rotation.y = p.heading + 0.65 + i * 0.79;
      this.cattle.add(cow);
      const hide = i % 3 ? 0x9c6849 : 0x6e543f;
      this.part(cow, hide, 0, 1.12, 0, 0.47, 0.45, 0.9, this.oval);
      this.part(cow, 0xddd3b7, 0.09, 1.41, 0.24, 0.37, 0.2, 0.43, this.oval);
      for (const x of [-0.29, 0.29])
        for (const z of [-0.5, 0.54]) {
          this.part(cow, hide, x, 0.6, z, 0.14, 0.72, 0.15, this.axle);
          this.part(cow, 0x514b41, x, 0.19, z, 0.14, 0.13, 0.15);
        }
      const neck = new Group();
      neck.position.set(0, 1.34, -0.69);
      cow.add(neck);
      this.necks.push(neck);
      this.part(neck, hide, 0, -0.12, -0.24, 0.26, 0.25, 0.39, this.oval);
      this.part(neck, 0xe2d8bf, 0, -0.18, -0.59, 0.18, 0.2, 0.27, this.oval);
      this.part(neck, 0x9e8d77, 0, -0.24, -0.78, 0.185, 0.12, 0.135, this.oval);
      for (const x of [-0.22, 0.22])
        this.part(neck, hide, x, -0.08, -0.52, 0.15, 0.055, 0.085, this.oval);
    }
    for (const [i, c] of [0x805491, 0xc65340, 0x387f93, 0xd4ac52].entries()) {
      const rider = kit.make(new Color(c), 2204 + i);
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
    state.sellaStation = metres;
    state.motoLean = state.grazingPitch = state.pelotonCrank = null;
    this.motorbike.visible = Math.abs(metres - 2480) < 125;
    if (this.motorbike.visible) {
      const period = 220;
      const gap = ((((15 + time * 11.2 - metres + 2460) % period) + period) % period) - 14;
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
      state.motoLean = this.motorbike.rotation.z;
    }
    this.cattle.visible = Math.abs(metres - 4940) < 210;
    if (this.cattle.visible) {
      this.necks.forEach((g, i) => (g.rotation.x = -0.63 + 0.43 * Math.sin(time * 0.85 + i * 1.8)));
      state.grazingPitch = this.necks[0]!.rotation.x;
    }
    for (const [i, rider] of this.riders.entries()) {
      rider.group.visible = Math.abs(metres - 7290) < 190;
      if (!rider.group.visible) continue;
      const gap = ((((time * 5.4 + i * 6 + 9 - (metres - 7290)) % 105) + 105) % 105) - 8;
      const p = this.course.place(metres + gap, i % 2 ? 1.5 : -0.94, this.pose);
      rider.group.position.set(p.x, p.y + 0.11, p.z);
      rider.group.rotation.order = 'YXZ';
      rider.group.rotation.set(p.pitch, p.heading, 0);
      const crank = time * (7.7 + i * 0.17) + i;
      rider.pose(crank, 0.01 * Math.sin(crank), 0.06);
      if (!i) state.pelotonCrank = crank;
    }
    this.kit.roll(time * 5.4);
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const v = VIEWS.find((row) => Math.abs(metres - row[0]) < 49);
    let x, y, z, w;
    if (v) {
      const t = this.course.place(v[1], v[2], this.focus);
      x = t.x;
      y = t.y + v[3];
      z = t.z;
      w = Math.min(1, (1 - Math.abs(metres - v[0]) / 49) * 1.55);
    } else if (Math.abs(metres - 7290) < 92) {
      const t = this.course.place(7290, -370, this.focus);
      x = t.x - 1480 * Math.sin(t.heading);
      z = t.z - 1480 * Math.cos(t.heading);
      y = 2470;
      w = Math.min(1, (1 - Math.abs(metres - 7290) / 92) * 1.5);
    } else return;
    const r = this.course.place(metres, 0, this.pose),
      dx = x - r.x,
      dz = z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5.1 * dx) / len - camera.x) * w;
    camera.z += (r.z - (5.1 * dz) / len - camera.z) * w;
    camera.y += (r.y + 2.36 - camera.y) * w;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
    ahead.y += (r.y + 2.36 + (19 * (y - r.y - 2.36)) / (len + 5.1) - 0.75 - ahead.y) * w;
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
      this.axle,
      this.kit,
      this.plain,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      item.dispose();
  }
}
