import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
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

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const surface = (cutout = false) =>
  new MeshBasicMaterial({ side: DoubleSide, alphaTest: cutout ? 0.49 : 0 });
const views = [
  [80, 129, 0, 2.5],
  [1160, 1176, 20, 4.7],
  [2640, 2660, 13, 3.0],
  [3860, 3879, 13, 3.2],
  [5130, 5149, 15.8, 3.3],
  [7260, 7282, 10, 2.25],
] as const;

export class ArizonaRoadside {
  readonly root = new Group();
  readonly materials = {
    ArizonaHighway: surface(),
    MotherRoadShops: surface(),
    ArizonaScrub: surface(true),
    HighwayShields: surface(true),
  };
  private readonly box = new BoxGeometry();
  private readonly ellipsoid = new SphereGeometry(1, 18, 9);
  private readonly colours = new Map<number, MeshBasicMaterial>();
  private readonly burro = new Group();
  private readonly body = new PlaneGeometry(2.47, 1.58, 24, 12);
  private readonly rest: Float32Array;
  private readonly weed = new Group();
  private readonly twigs = new BufferGeometry();
  private readonly twigPaint = new LineBasicMaterial({ color: 0x89653f });
  private readonly car = new Group();
  private readonly station = point();
  private readonly target = point();
  private readonly reportValues = {
    route66Station: 0,
    burroStep: null as number | null,
    weedRoll: null as number | null,
    chevyTravel: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['highway', 'frontages', 'scrub', 'signs'].map((k) =>
        loader.loadAsync('courses/route66-' + k + '.webp'),
      ),
    );
    const textures = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = result.find((r) => r.status === 'rejected');
    if (failure) {
      for (const t of textures) t.dispose();
      throw failure.reason;
    }
    return new ArizonaRoadside(course, textures);
  }
  private part(
    g: Group,
    tint: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    round = false,
  ) {
    let material = this.colours.get(tint);
    if (!material) {
      material = new MeshBasicMaterial({ color: tint });
      this.colours.set(tint, material);
    }
    const m = new Mesh(round ? this.ellipsoid : this.box, material);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
    return m;
  }
  private place(g: Group, d: number, lane: number, up = 0) {
    const p = this.course.place(d, lane, this.station);
    g.position.set(p.x, p.y + up, p.z);
    g.rotation.y = p.heading;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    Object.values(this.materials).forEach((m, i) => {
      const t = textures[i]!;
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
      m.map = t;
    });
    textures[0]!.wrapS = textures[0]!.wrapT = RepeatWrapping;
    textures[0]!.anisotropy = 4;
    const uv = this.body.getAttribute('uv');
    // A standalone Three.js plane starts at its top edge; the native atlas uses glTF's top-left UV origin.
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (0.003 + 0.994 * uv.getX(i)) / 3, (1.003 + 0.994 * (1 - uv.getY(i))) / 2);
    this.body.translate(0, 0.79, 0);
    this.rest = new Float32Array(this.body.getAttribute('position').array);
    this.burro.add(new Mesh(this.body, this.materials.ArizonaScrub));
    this.root.add(this.burro);
    const lines: number[] = [];
    const add = (x: number, y: number, z: number, a: number, b: number, c: number) =>
      lines.push(x, y, z, a, b, c);
    for (let j = 0; j < 79; j++) {
      const yaw = j * 2.399963,
        vertical = (2 * j + 1) / 79 - 1,
        flat = Math.sqrt(1 - vertical * vertical);
      const x = 0.51 * flat * Math.cos(yaw),
        y = 0.46 * vertical,
        z = 0.49 * flat * Math.sin(yaw);
      const a = 0.65 * x + 0.041 * Math.sin(j),
        b = 0.62 * y + 0.055 * Math.cos(j),
        c = 0.57 * z + 0.067 * Math.sin(2 * j);
      add(0.12 * x, 0.12 * y, 0.12 * z, a, b, c);
      add(a, b, c, x, y, z);
      add(a, b, c, x + 0.11 * Math.sin(j), y + 0.082, z - 0.073 * Math.cos(j));
    }
    this.twigs.setAttribute('position', new Float32BufferAttribute(lines, 3));
    this.weed.add(new LineSegments(this.twigs, this.twigPaint));
    this.root.add(this.weed);
    const c = this.car,
      turquoise = 0x4fa9a1,
      cream = 0xe9dfc6,
      chrome = 0xb5c1bb;
    this.part(c, turquoise, 0, 0.79, 0, 1.9, 0.72, 4.85);
    this.part(c, turquoise, 0, 0.94, -1.32, 0.93, 0.21, 1.18, true);
    this.part(c, 0x4c6874, 0, 1.3, 0.14, 1.61, 0.62, 2.42);
    this.part(c, cream, 0, 1.64, 0.18, 1.69, 0.14, 2.4);
    for (const side of [-1, 1]) {
      this.part(c, chrome, side * 0.96, 0.86, 0, 0.048, 0.083, 4.64);
      this.part(c, turquoise, side * 0.83, 1.08, 1.81, 0.15, 0.45, 1.02);
      this.part(c, 0xa94136, side * 0.86, 1.22, 2.33, 0.2, 0.18, 0.16, true);
      this.part(c, 0xefe2be, side * 0.72, 0.93, -2.46, 0.17, 0.16, 0.08, true);
      for (const z of [-1.49, 1.46]) {
        this.part(c, 0x333835, side * 0.92, 0.45, z, 0.15, 0.39, 0.39, true);
        this.part(c, cream, side * 1.02, 0.45, z, 0.072, 0.29, 0.29, true);
        this.part(c, chrome, side * 1.069, 0.45, z, 0.04, 0.18, 0.18, true);
      }
    }
    for (const z of [-2.46, 2.46]) this.part(c, chrome, 0, 0.52, z, 1.91, 0.19, 0.15);
    this.part(c, 0x545952, 0, 0.78, -2.434, 0.95, 0.2, 0.07);
    this.root.add(c);
  }
  update(metres: number, time: number) {
    const r = this.reportValues;
    r.route66Station = metres;
    r.burroStep = r.weedRoll = r.chevyTravel = null;
    this.burro.visible = Math.abs(metres - 7260) < 160;
    if (this.burro.visible) {
      const phase = time * 2.4,
        travel = 3.1 * Math.sin(time * 0.14);
      this.place(this.burro, 7272 + travel, 5.35 + 0.65 * Math.cos(time * 0.14), 0.12);
      this.burro.rotation.y += 0.95 + 0.1 * Math.sin(time * 0.3);
      const p = this.body.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const x = this.rest[i * 3]!,
          y = this.rest[i * 3 + 1]!,
          leg = Math.max(0, 1 - y / 0.58);
        const step = Math.sin(phase + (x > 0 ? Math.PI : 0) + x * 2.4);
        p.setXY(
          i,
          x + 0.14 * leg * step,
          y + 0.05 * leg * Math.max(0, step) + 0.018 * Math.cos(phase * 2),
        );
      }
      p.needsUpdate = true;
      r.burroStep = p.getX(p.count - 4);
    }
    this.weed.visible = Math.abs(metres - 80) < 140;
    if (this.weed.visible) {
      this.place(
        this.weed,
        96 + 3 * Math.cos(time * 0.43),
        7 * Math.sin(time * 0.43),
        0.58 + 0.14 * Math.abs(Math.sin(time * 2.1)),
      );
      this.weed.rotation.z = time * 2.24;
      r.weedRoll = this.weed.rotation.z;
    }
    this.car.visible = Math.abs(metres - 5130) < 230;
    if (this.car.visible) {
      const phase = time * 0.086 + 0.32,
        d = 5142 + 57 * Math.sin(phase);
      this.place(this.car, d, -2.25 + 0.93 * Math.cos(phase), 0.13);
      this.car.rotation.y += Math.atan2(0.93 * Math.sin(phase), 57 * Math.cos(phase));
      r.chevyTravel = d;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = views.find((v) => Math.abs(metres - v[0]) < 54);
    if (!view) return;
    const f = Math.min(1, (1 - Math.abs(metres - view[0]) / 54) * 1.65);
    const r = this.course.place(metres, 0, this.station),
      t = this.course.place(view[1], view[2], this.target);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.23 - camera.y) * f;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.23 + (19 * (t.y + view[3] - r.y - 2.23)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.reportValues;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.body,
      this.box,
      this.ellipsoid,
      this.twigs,
      this.twigPaint,
      ...this.colours.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
