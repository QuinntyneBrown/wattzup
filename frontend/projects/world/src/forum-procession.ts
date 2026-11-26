import {
  BoxGeometry,
  ConeGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
const lap = 14980.8333333333 / 3;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const surface = (cutout = false) =>
  new MeshBasicMaterial({ side: DoubleSide, alphaTest: cutout ? 0.49 : 0 });
const views = [
  [80, 101, 40, 17],
  [520, 544, -63, 10],
  [910, 1185, -64, 23],
  [1370, 1386, -17.5, 9],
  [2210, 2240, 7.0, 2.5],
  [11150 - 2 * lap, 1195, -64, 23],
] as const;

export class ForumProcession {
  readonly root = new Group();
  readonly materials = {
    Sampietrini: surface(),
    RomanTravertine: surface(),
    ImperialBrick: surface(),
    ArchReliefs: surface(),
    RomanPines: surface(true),
    RomanWalkers: surface(true),
  };
  private readonly box = new BoxGeometry();
  private readonly oval = new SphereGeometry(1, 14, 9);
  private readonly canopy = new ConeGeometry(0.7, 0.36, 12);
  private readonly figures = new PlaneGeometry(3.4, 2.08);
  private readonly colours = new Map<number, MeshBasicMaterial>();
  private readonly guides: Group[] = [];
  private readonly parasols: Group[] = [];
  private readonly vespa = new Group();
  private readonly taxi = new Group();
  private readonly roadPoint = point();
  private readonly sight = point();
  private readonly readings = {
    romeStation: 0,
    guideUmbrella: null as number | null,
    vespaTravel: null as number | null,
    taxiTravel: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['setts', 'travertine', 'brick', 'relief', 'pines', 'tourists'].map((name) =>
        loader.loadAsync('courses/rome-' + name + '.webp'),
      ),
    );
    const textures = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = result.find((r) => r.status === 'rejected');
    if (failure) {
      for (const t of textures) t.dispose();
      throw failure.reason;
    }
    return new ForumProcession(course, textures);
  }
  private colour(value: number) {
    let m = this.colours.get(value);
    if (!m) {
      m = new MeshBasicMaterial({ color: value, side: DoubleSide });
      this.colours.set(value, m);
    }
    return m;
  }
  private part(
    group: Group,
    value: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    round = false,
  ) {
    const m = new Mesh(round ? this.oval : this.box, this.colour(value));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    group.add(m);
    return m;
  }
  private place(group: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.roadPoint);
    group.position.set(p.x, p.y + 0.2, p.z);
    group.rotation.y = p.heading;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    Object.values(this.materials).forEach((m, i) => {
      const t = textures[i]!;
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
      if (i < 3) {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.anisotropy = 4;
      }
      m.map = t;
    });
    // The middle atlas cell holds the guide and tourists. The hand-carried umbrella is articulated.
    const uv = this.figures.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (1 + uv.getX(i)) / 3, uv.getY(i));
    for (const [d, lane] of [
      [1169, -10],
      [1380, -10],
    ] as const) {
      const g = new Group();
      this.place(g, d, lane);
      g.rotation.y += 0.65;
      const walkers = new Mesh(this.figures, this.materials.RomanWalkers);
      walkers.position.y = 1.04;
      g.add(walkers);
      const parasol = new Group();
      parasol.position.set(0.96, 1.46, 0);
      g.add(parasol);
      this.part(parasol, 0x80553b, 0, 0.47, 0, 0.033, 0.95, 0.033);
      const shade = new Mesh(this.canopy, this.colour(0xd9902f));
      shade.position.y = 0.96;
      parasol.add(shade);
      this.guides.push(g);
      this.parasols.push(parasol);
      this.root.add(g);
    }
    const v = this.vespa;
    for (const z of [-0.63, 0.61]) {
      this.part(v, 0x36383b, 0, 0.29, z, 0.13, 0.28, 0.28, true);
      this.part(v, 0xaaa69a, 0.06, 0.29, z, 0.08, 0.16, 0.16, true);
    }
    this.part(v, 0xba3f39, 0, 0.52, 0.32, 0.35, 0.31, 0.51, true);
    this.part(v, 0xc5483e, 0, 0.72, -0.43, 0.33, 0.48, 0.2, true);
    this.part(v, 0xa8a193, 0, 0.28, -0.08, 0.5, 0.08, 0.65);
    this.part(v, 0x493e37, 0, 0.91, 0.29, 0.42, 0.12, 0.53);
    this.part(v, 0xcabdb0, 0, 1.15, -0.51, 0.69, 0.07, 0.13);
    this.part(v, 0xf3dbab, 0, 1.13, -0.61, 0.14, 0.13, 0.09, true);
    this.part(v, 0x5c6471, 0, 0.83, 0.1, 0.27, 0.24, 0.33, true);
    this.part(v, 0x735b48, 0, 1.19, 0.16, 0.27, 0.35, 0.21, true);
    this.part(v, 0xb78a6a, 0, 1.62, 0.12, 0.16, 0.19, 0.15, true);
    this.part(v, 0xeee4cd, 0, 1.72, 0.14, 0.175, 0.15, 0.17, true);
    for (const x of [-0.23, 0.23]) {
      const arm = this.part(v, 0x85634c, x, 1.2, -0.14, 0.11, 0.13, 0.39);
      arm.rotation.x = -0.31;
    }
    this.root.add(v);
    const taxi = this.taxi;
    this.part(taxi, 0xede9db, 0, 0.72, 0, 1.8, 0.7, 4.25);
    this.part(taxi, 0x5e6f77, 0, 1.24, 0.08, 1.55, 0.66, 2.31);
    this.part(taxi, 0xe4e1d6, 0, 1.59, 0.1, 1.58, 0.12, 2.19);
    this.part(taxi, 0xd7be6a, 0, 1.73, 0.11, 0.57, 0.19, 0.24);
    for (const x of [-0.88, 0.88])
      for (const z of [-1.26, 1.21]) this.part(taxi, 0x36393b, x, 0.4, z, 0.115, 0.36, 0.36, true);
    for (const x of [-0.63, 0.63]) {
      this.part(taxi, 0xebdcb2, x, 0.77, -2.14, 0.37, 0.15, 0.06);
      this.part(taxi, 0xb54b38, x, 0.79, 2.14, 0.35, 0.15, 0.06);
    }
    this.root.add(taxi);
  }
  update(metres: number, time: number) {
    this.readings.romeStation = metres;
    const d = ((metres % lap) + lap) % lap;
    this.readings.guideUmbrella = this.readings.vespaTravel = this.readings.taxiTravel = null;
    for (const [i, g] of this.guides.entries()) {
      g.visible = Math.abs(d - (i === 0 ? 1169 : 1380)) < 170;
      if (g.visible) {
        const u = this.parasols[i]!;
        u.rotation.z = 0.1 + 0.17 * Math.sin(time * 0.9 + i);
        this.readings.guideUmbrella = u.rotation.z;
      }
    }
    this.vespa.visible = this.taxi.visible = Math.abs(d - 2210) < 230;
    if (this.vespa.visible) {
      // Two small service-road circuits keep the wrap continuous in position and heading.
      for (const [g, phase, length, lane] of [
        [this.vespa, time * 0.097, 48, 4.55],
        [this.taxi, time * 0.076 + 2.1, 62, -4.48],
      ] as const) {
        const s = 2218 + length * Math.sin(phase);
        this.place(g, s, lane + 1.04 * Math.cos(phase));
        g.rotation.y += Math.atan2(1.04 * Math.sin(phase), length * Math.cos(phase));
        if (g === this.vespa) this.readings.vespaTravel = s;
        else this.readings.taxiTravel = s;
      }
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = ((metres % lap) + lap) % lap;
    const v = views.find((row) => Math.abs(d - row[0]) < 53);
    if (!v) return;
    const f = Math.min(1, (1 - Math.abs(d - v[0]) / 53) * 1.65);
    const r = this.course.place(metres, 0, this.roadPoint),
      t = this.course.place(v[1], v[2], this.sight);
    if (v[0] === 910 || v === views[5]) {
      t.x = 1190;
      t.z = -63;
      t.y = 24;
    }
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.35 - camera.y) * f;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.35 + (19 * (t.y + v[3] - r.y - 2.35)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.box,
      this.oval,
      this.canopy,
      this.figures,
      ...this.colours.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
