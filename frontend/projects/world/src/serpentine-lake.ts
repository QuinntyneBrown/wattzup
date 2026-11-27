import {
  BoxGeometry,
  CatmullRomCurve3,
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
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Texture,
} from 'three/webgpu';
import { attribute, color, mix, positionWorld, sin, texture, uniform, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const LAP = 3318.75,
  WATER = 17.65;
const shore = (d: number) =>
  18 +
  4 * Math.sin(d / 106) +
  2.5 * Math.sin(d / 51) -
  12 * Math.exp(-((((d % LAP) - 3042) / 47) ** 2));
const position = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const VIEWS = [
  [80, 110, 14, 1.8],
  [620, 632, -9.8, 0.5],
  [1290, 1330, 47, 5.3],
  [2130, 2150, 13, 2.3],
  [3040, 3048, 10, -1.2],
  [4510, 4650, 90, 4],
] as const;
export class SerpentineLake {
  readonly root = new Group();
  readonly materials = {
    PlaneShade: new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
    BridgeAshlar: new MeshBasicMaterial({ side: DoubleSide }),
    HydeParkLawns: new MeshLambertNodeMaterial({ side: DoubleSide }),
    LidoCafe: new MeshBasicMaterial({ side: DoubleSide }),
    ParkSigns: new MeshBasicMaterial({ side: DoubleSide }),
    ParkTarmac: new MeshLambertNodeMaterial({ side: DoubleSide }),
    LongWater: new MeshLambertNodeMaterial({ side: DoubleSide }),
    LondonPlanes: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    ParkVisitors: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    ParkPavilion: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly time = uniform(0);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly oval = new SphereGeometry(1, 14, 10);
  private readonly box = new BoxGeometry();
  private readonly neck = new TubeGeometry(
    new CatmullRomCurve3([
      new Vector3(0, 0.02, -0.18),
      new Vector3(0, 0.16, -0.25),
      new Vector3(0, 0.37, -0.25),
      new Vector3(0, 0.56, -0.32),
      new Vector3(0, 0.58, -0.43),
      new Vector3(0, 0.5, -0.48),
    ]),
    12,
    0.048,
    6,
    false,
  );
  private readonly birds: Group[] = [];
  private readonly rowboats: { group: Group; oars: Group[]; rower: Group }[] = [];
  private readonly runners: { group: Group; legs: Group[]; arms: Group[] }[] = [];
  private readonly p = position();
  private readonly focus = position();
  private readonly data = {
    swanHeading: null as number | null,
    oarSweep: null as number | null,
    joggerKnee: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'asphalt',
        'planes',
        'pavilion',
        'visitors',
        'ashlar',
        'grass',
        'water',
        'cafe',
        'shade',
        'signs',
      ].map((n) => loader.loadAsync('courses/serpentine-' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const m of maps) m.dispose();
      throw failure.reason;
    }
    return new SerpentineLake(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const t of maps) {
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
    }
    const asphalt = maps[0]!;
    asphalt.wrapS = asphalt.wrapT = RepeatWrapping;
    asphalt.anisotropy = 4;
    this.materials.ParkTarmac.colorNode = texture(asphalt, positionWorld.xz.div(4)).rgb;
    this.materials.LondonPlanes.map = maps[1]!;
    this.materials.ParkPavilion.map = maps[2]!;
    this.materials.ParkVisitors.map = maps[3]!;
    this.materials.BridgeAshlar.map = maps[4]!;
    this.materials.LidoCafe.map = maps[7]!;
    this.materials.PlaneShade.map = maps[8]!;
    this.materials.ParkSigns.map = maps[9]!;
    this.materials.LondonPlanes.color.setHex(0xdbe4cf);
    for (const map of maps.slice(4, 7)) {
      map.wrapS = map.wrapT = RepeatWrapping;
      map.anisotropy = 4;
    }
    this.materials.HydeParkLawns.colorNode = attribute('color', 'vec3').mul(
      texture(maps[5]!, positionWorld.xz.div(3.2)).rgb.mul(1.5).add(0.58),
    );
    const ripple = sin(
      positionWorld.z
        .mul(2.8)
        .add(positionWorld.x.mul(0.5))
        .add(sin(positionWorld.x.mul(0.43).add(this.time.mul(0.69))).mul(2))
        .add(this.time.mul(1.1)),
    );
    const breeze = sin(positionWorld.x.mul(0.078).add(positionWorld.z.mul(0.11)))
      .mul(0.5)
      .add(0.5);
    const reflected = texture(
      maps[6]!,
      positionWorld.xz.div(vec2(9, 3.1)).add(vec2(ripple.mul(0.012), this.time.mul(0.0014))),
    ).rgb;
    this.materials.LongWater.colorNode = mix(
      reflected,
      color(0x869e9f),
      breeze.mul(0.14).add(0.11),
    );
    for (let i = 0; i < 17; i++) this.makeBird(i);
    for (let i = 0; i < 5; i++) this.makeBoat(i);
    for (let i = 0; i < 4; i++) this.makeRunner(i);
    this.update(0, 0);
  }
  private part(
    parent: Group,
    tint: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    geo: BufferGeometry = this.oval,
  ) {
    let material = this.paints.get(tint);
    if (!material) {
      material = new MeshLambertMaterial({ color: tint });
      this.paints.set(tint, material);
    }
    const mesh = new Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  }
  private makeBird(i: number) {
    const g = new Group(),
      swan = i % 5 < 3,
      goose = i % 5 === 3;
    const plumage = swan ? 0xf4f0df : goose ? 0x8c765b : 0x776752;
    this.part(g, plumage, 0, 0.07, 0, 0.18, 0.15, 0.37);
    const wing = this.part(g, plumage, 0, 0.17, 0.04, 0.17, 0.1, 0.24);
    wing.rotation.x = -0.18;
    this.part(
      g,
      swan ? plumage : goose ? 0x4b4842 : 0x456950,
      0,
      0.11,
      -0.05,
      1,
      swan ? 1 : 0.65,
      1,
      this.neck,
    );
    this.part(g, swan ? 0xf6efe1 : 0x4b5148, 0, swan ? 0.65 : 0.48, -0.49, 0.07, 0.068, 0.095);
    this.part(g, swan ? 0xe4904b : 0xba9a53, 0, swan ? 0.636 : 0.46, -0.57, 0.048, 0.028, 0.08);
    for (const side of [-1, 1]) {
      this.part(g, 0x272c29, side * 0.063, swan ? 0.66 : 0.49, -0.505, 0.012, 0.012, 0.012);
      const wake = this.part(g, 0xb6c7be, side * 0.3, -0.046, 0.61, 0.012, 0.008, 0.56);
      wake.rotation.y = side * 0.35;
    }
    g.scale.setScalar(swan ? 1.78 : goose ? 1.2 : 0.84);
    this.birds.push(g);
    this.root.add(g);
  }
  private makeBoat(i: number) {
    const group = new Group(),
      rower = new Group(),
      oars: Group[] = [];
    group.add(rower);
    this.root.add(group);
    this.part(group, 0x315a6c, 0, 0.1, 0, 0.71, 0.27, 2.23);
    this.part(group, 0xc7bb93, 0, 0.29, 0, 0.61, 0.07, 1.9);
    for (const z of [-0.78, 0.18, 0.93])
      this.part(group, 0x87684d, 0, 0.35, z, 1.12, 0.07, 0.27, this.box);
    this.part(rower, i % 2 ? 0xa15f40 : 0x406f79, 0, 0.68, 0.2, 0.23, 0.33, 0.17);
    this.part(rower, 0xba8765, 0, 1.08, 0.2, 0.14, 0.18, 0.15);
    for (const sign of [-1, 1]) {
      const pivot = new Group();
      pivot.position.set(sign * 0.55, 0.45, 0.12);
      group.add(pivot);
      oars.push(pivot);
      this.part(pivot, 0xa5865f, sign * 0.49, 0, 0, 2.1, 0.052, 0.055, this.box);
      this.part(pivot, 0xe5d9bc, sign * 1.54, -0.024, 0, 0.52, 0.064, 0.2, this.box);
      this.part(rower, 0xc59271, sign * 0.22, 0.72, -0.03, 0.075, 0.08, 0.23);
    }
    this.rowboats.push({ group, oars, rower });
  }
  private makeRunner(i: number) {
    const group = new Group(),
      legs: Group[] = [],
      arms: Group[] = [];
    const skin = [0x976044, 0xba8062, 0x84593f, 0xe3aa83][i]!;
    const top = [0x3b8480, 0xb9594a, 0x517198, 0x697849][i]!;
    this.part(group, top, 0, 1.1, 0, 0.205, 0.31, 0.14);
    this.part(group, skin, 0, 1.57, -0.04, 0.128, 0.165, 0.12);
    this.part(group, 0x4f4136, 0, 1.69, -0.03, 0.13, 0.075, 0.125);
    for (const sign of [-1, 1]) {
      const leg = new Group();
      leg.position.set(sign * 0.105, 0.94, 0);
      group.add(leg);
      legs.push(leg);
      this.part(leg, 0x3f4a4c, 0, -0.17, 0, 0.092, 0.235, 0.11);
      this.part(leg, skin, 0, -0.55, 0.065, 0.061, 0.22, 0.067);
      this.part(leg, 0xe5d9c0, 0, -0.76, 0.01, 0.078, 0.052, 0.155);
      const arm = new Group();
      arm.position.set(sign * 0.204, 1.29, 0);
      group.add(arm);
      arms.push(arm);
      this.part(arm, top, 0, -0.085, 0, 0.075, 0.16, 0.077);
      this.part(arm, skin, 0, -0.2, -0.1, 0.058, 0.07, 0.16);
    }
    this.runners.push({ group, legs, arms });
    this.root.add(group);
  }
  update(metres: number, seconds: number) {
    this.time.value = seconds;
    const lap = metres % LAP;
    this.data.swanHeading = this.data.oarSweep = this.data.joggerKnee = null;
    this.birds.forEach((g, i) => {
      const home = [3049, 117, 1214][i % 3]!;
      g.visible = Math.abs(lap - home) < 270;
      if (!g.visible) return;
      const phase = seconds * (0.065 + i * 0.0017) + i * 1.85;
      const station = home + Math.sin(phase) * 6.2 + Math.floor(i / 3) * 3.6;
      const p = this.course.place(
        station,
        shore(station) + 5.5 + (i % 4) * 1.35 + Math.cos(phase) * 2.4,
        this.p,
      );
      g.position.set(p.x, WATER + 0.09 + 0.015 * Math.sin(phase * 3), p.z);
      g.rotation.y = p.heading - Math.atan2(-2.4 * Math.sin(phase), 6.2 * Math.cos(phase));
      if (this.data.swanHeading === null) this.data.swanHeading = g.rotation.y;
    });
    this.rowboats.forEach(({ group, oars, rower }, i) => {
      const home = [1192, 1211, 119, 169, 2136][i]!;
      group.visible = Math.abs(lap - home) < 295;
      if (!group.visible) return;
      const phase = seconds * 0.027 + i * 2.4;
      const station = home + 17 * Math.sin(phase);
      const p = this.course.place(
        station,
        shore(station) + 10 + (i % 3) * 5 + 6 * Math.cos(phase),
        this.p,
      );
      group.position.set(p.x, WATER + 0.04, p.z);
      group.rotation.y = p.heading - Math.atan2(-6 * Math.sin(phase), 17 * Math.cos(phase));
      const stroke = seconds * 2.2 + i * 0.91;
      rower.rotation.x = Math.sin(stroke) * 0.11;
      oars.forEach((o, j) => {
        const side = j ? 1 : -1;
        o.rotation.y = side * 0.65 * Math.sin(stroke);
        o.rotation.z = side * 0.13 * Math.cos(stroke);
      });
      if (this.data.oarSweep === null) this.data.oarSweep = oars[0]!.rotation.y;
    });
    this.runners.forEach(({ group, legs, arms }, i) => {
      const home = i < 2 ? 620 : 2144;
      group.visible = Math.abs(lap - home) < 180;
      if (!group.visible) return;
      const station = home + ((seconds * 2.55 + i * 11) % 144) - 12;
      const p = this.course.place(station, -6.4 - (i % 2) * 1.65, this.p);
      const stride = seconds * (6.3 + i * 0.16) + i;
      group.position.set(p.x, p.y + 0.035 * Math.abs(Math.sin(stride)), p.z);
      group.rotation.y = p.heading;
      legs.forEach((leg, j) => {
        leg.rotation.x = 0.64 * Math.sin(stride + j * Math.PI);
        arms[j]!.rotation.x = -leg.rotation.x * 0.86;
      });
      if (this.data.joggerKnee === null) this.data.joggerKnee = legs[0]!.rotation.x;
    });
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    const v = VIEWS.find((row) => Math.abs(metres - row[0]) < 63);
    if (!v) return;
    const r = this.course.place(metres, 0, this.p);
    const t = this.course.place(v[1], v[2], this.focus);
    if (v[0] === 3040) {
      // At the reed bed, follow the foremost swimming bird rather than the static bank.
      const bird = this.birds[0]!.position;
      t.x = bird.x;
      t.z = bird.z;
      t.y = bird.y + 1.3;
    } else if (v[0] === 4510) {
      const boat = this.rowboats[0]!.group.position;
      t.x = boat.x;
      t.z = boat.z;
      t.y = boat.y - 2.4;
    }
    // Follow the bird flock on the near water and the arch span across the rider's bank.
    const dx = t.x - r.x,
      dz = t.z - r.z,
      dist = Math.max(1, Math.hypot(dx, dz));
    const u = Math.min(1, (63 - Math.abs(metres - v[0])) / 28),
      w = u * u * (3 - 2 * u);
    camera.x += (r.x - (4.8 * dx) / dist - camera.x) * w;
    camera.z += (r.z - (4.8 * dz) / dist - camera.z) * w;
    camera.y += (r.y + (v[0] === 3040 ? 3.2 : 2.25) - camera.y) * w;
    ahead.x += (r.x + (14 * dx) / dist - ahead.x) * w;
    ahead.z += (r.z + (14 * dz) / dist - ahead.z) * w;
    ahead.y += (r.y + 1.55 + (18.8 * (t.y + v[3] - r.y - 2.25)) / (dist + 4.8) - ahead.y) * w;
  }
  report() {
    return this.data;
  }
  dispose() {
    this.root.clear();
    for (const m of [
      this.box,
      this.oval,
      this.neck,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      m.dispose();
  }
}
