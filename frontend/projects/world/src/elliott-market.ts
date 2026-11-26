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
  MirroredRepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, texture, uniform, uv, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 128, 0, 6.95],
  [1790, 1818, -6.55, 1.8],
  [3380, 3401, 6.63, 2.1],
  [5220, 5260, 13.7, 3.4],
  [7690, 7773, -135, 5.6],
  [10130, 10220, -109, 29],
] as const;
export class ElliottMarket {
  readonly root = new Group();
  readonly materials = {
    MarketBrick: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ElliottWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
    MarketMasonry: new MeshBasicMaterial({ side: DoubleSide, color: 0xb58d7f }),
    SeattleMarket: new MeshBasicMaterial({ side: DoubleSide }),
    ArcadeCounters: new MeshBasicMaterial({ side: DoubleSide }),
    MarketShoppers: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    MarketLettering: new MeshBasicMaterial({ side: DoubleSide }),
    PublicMarketClock: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.37, fog: false }),
    OlympicRidge: new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  };
  private readonly cube = new BoxGeometry();
  private readonly sphere = new SphereGeometry(1, 12, 7);
  private readonly cylinder = new CylinderGeometry(1, 1, 1, 12);
  private readonly shapes = new Set<BufferGeometry>([this.cube, this.sphere, this.cylinder]);
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly steamPaint = new MeshBasicMaterial({
    color: 0xf4e4ca,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  private readonly fish = new Group();
  private readonly steam = new Group();
  private readonly ferry = new Group();
  private readonly wheel = new Group();
  private readonly wave = uniform(0);
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    salmonFlight: null as number | null,
    steamRise: null as number | null,
    ferryTravel: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['fronts', 'counters', 'shoppers', 'lettering', 'clock', 'olympics', 'brick'].map((k) =>
        new TextureLoader().loadAsync('courses/pikeplace-' + k + '.webp'),
      ),
    );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) {
      for (const t of images) t.dispose();
      throw failed.reason;
    }
    return new ElliottMarket(course, images);
  }
  private paint(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshBasicMaterial({ color: c, side: DoubleSide });
      this.paints.set(c, m);
    }
    return m;
  }
  private part(
    g: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    round = false,
  ) {
    const m = new Mesh(round ? this.sphere : this.cube, this.paint(c));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
    return m;
  }
  private triangle(g: Group, c: number, vertices: number[]) {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.shapes.add(geo);
    g.add(new Mesh(geo, this.paint(c)));
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [fronts, counters, shoppers, lettering, clock, olympics, brick] = textures;
    this.materials.SeattleMarket.map = fronts!;
    this.materials.MarketMasonry.map = brick!;
    this.materials.ArcadeCounters.map = counters!;
    this.materials.MarketShoppers.map = shoppers!;
    this.materials.MarketLettering.map = lettering!;
    this.materials.PublicMarketClock.map = clock!;
    this.materials.OlympicRidge.map = olympics!;
    brick!.wrapS = brick!.wrapT = MirroredRepeatWrapping;
    this.materials.MarketBrick.colorNode = texture(brick!, uv()).rgb.mul(
      vertexColor().rgb.mul(0.25).add(0.83),
    );
    const glint = sin(
      positionWorld.x.mul(0.31).add(positionWorld.z.mul(1.6)).add(this.wave.mul(1.21)),
    ).smoothstep(0.77, 0.99);
    this.materials.ElliottWater.colorNode = vertexColor().rgb.add(glint.mul(0.048));
    this.part(this.fish, 0xa7b9b6, 0, 0, 0, 0.58, 0.155, 0.102, true);
    this.part(this.fish, 0x637975, 0.02, 0.066, 0, 0.51, 0.101, 0.1, true);
    this.triangle(this.fish, 0x63736e, [-0.43, 0, 0, -0.8, 0.23, 0, -0.78, -0.16, 0]);
    this.triangle(this.fish, 0x5f746f, [0.04, 0.1, 0, -0.16, 0.3, 0, -0.24, 0.09, 0]);
    this.part(this.fish, 0x384444, 0.45, 0.035, -0.089, 0.026, 0.026, 0.016, true);
    for (let i = 0; i < 13; i++) this.steam.add(new Mesh(this.sphere, this.steamPaint));
    // A double-ended Washington ferry, with paired wheelhouses and an open vehicle deck.
    this.part(this.ferry, 0x42695b, 0, 0.67, 0, 11.2, 1.55, 37.9);
    for (const end of [-1, 1]) {
      this.part(this.ferry, 0x4d7162, 0, 0.76, end * 18.8, 5.6, 0.85, 4.5, true);
      this.part(this.ferry, 0xe4e4d7, 0, 5.85, end * 11.9, 7.3, 1.57, 4.8);
      this.part(this.ferry, 0x65858c, 0, 6.18, end * 14.34, 6.91, 0.68, 0.1);
      this.part(this.ferry, 0x537561, 0, 6.78, end * 11.9, 8.0, 0.27, 5.3);
    }
    this.part(this.ferry, 0xe0e0d3, 0, 2.0, 0, 10.9, 0.32, 36.8);
    this.part(this.ferry, 0xe6e6d9, 0, 4.49, 0, 10.9, 0.43, 33);
    for (const side of [-1, 1])
      for (const z of [-13, -8, -3, 2, 7, 12])
        this.part(this.ferry, 0xc7d1c4, side * 4.76, 3.22, z, 0.27, 2.53, 0.31);
    this.part(this.ferry, 0xb6c7bc, 0, 4.98, 0, 8.1, 0.84, 23.9);
    this.part(this.ferry, 0x476951, 0, 6.48, 0, 2.7, 2.5, 3.95);
    this.part(this.ferry, 0x6e736a, 0, 7.83, 0, 2.89, 0.22, 4.13);
    for (const [j, station] of [146, 1773, 3427, 7120].entries()) {
      const truck = new Group(),
        col = j % 2 ? 0x657c70 : 0xc8c4ac;
      this.part(truck, col, 0, 1.47, 0.85, 1.94, 2.22, 3.55);
      this.part(truck, 0xe1dccc, 0, 1.11, -1.83, 1.89, 1.54, 1.65);
      this.part(truck, 0x8297a0, 0, 1.62, -2.64, 1.65, 0.57, 0.06);
      this.part(truck, 0x5d6263, 0, 0.55, -2.76, 1.94, 0.27, 0.21);
      for (const side of [-1, 1])
        for (const z of [-1.85, 1.7]) {
          const tyre = new Mesh(this.cylinder, this.paint(0x414444));
          tyre.scale.set(0.38, 0.25, 0.38);
          tyre.rotation.z = Math.PI / 2;
          tyre.position.set(side * 0.94, 0.4, z);
          truck.add(tyre);
        }
      const p = course.place(station, j % 2 ? -4.36 : 4.36, this.p);
      truck.position.set(p.x, p.y, p.z);
      truck.rotation.y = p.heading;
      this.root.add(truck);
    }
    const ring = new TorusGeometry(17.9, 0.23, 5, 60);
    this.shapes.add(ring);
    this.wheel.add(new Mesh(ring, this.paint(0xe3ded2)));
    const base = course.place(7843, -128, this.p);
    this.wheel.position.set(base.x, 19.3, base.z);
    this.wheel.rotation.y = base.heading + 1.35;
    for (let j = 0; j < 24; j++) {
      const a = (j * Math.PI) / 12,
        rod = this.part(
          this.wheel,
          0xc1c6c2,
          8.9 * Math.cos(a),
          8.9 * Math.sin(a),
          0,
          17.9,
          0.089,
          0.1,
        );
      rod.rotation.z = a;
      this.part(this.wheel, 0x8a9c9d, 17.4 * Math.cos(a), 17.4 * Math.sin(a), 0, 0.78, 1.02, 1.43);
    }
    this.root.add(this.wheel, this.ferry, this.fish, this.steam);
  }
  update(metres: number, time: number) {
    this.wave.value = time;
    this.fish.visible = Math.abs(metres - 1818) < 170;
    this.readings.salmonFlight = null;
    if (this.fish.visible) {
      const phase = (time * 0.54) % 1,
        p = this.course.place(1817 + phase * 3.7, -6.0 + 0.3 * Math.sin(phase * Math.PI), this.p);
      this.fish.position.set(p.x, p.y + 1.75 + 2.56 * Math.sin(phase * Math.PI), p.z);
      this.fish.rotation.set(0, p.heading + 1.57, 0.7 - 0.99 * phase);
      this.readings.salmonFlight = this.fish.position.y;
    }
    this.steam.visible = Math.abs(metres - 5250) < 180;
    this.readings.steamRise = null;
    if (this.steam.visible) {
      const p = this.course.place(5250, 5.79, this.p);
      this.steam.position.set(p.x, p.y, p.z);
      for (const [i, m] of this.steam.children.entries()) {
        const age = (time * 0.32 + i / 13) % 1;
        m.position.set(0.46 * Math.sin(age * 6 + i * 0.26) * age, 0.28 + age * 3.85, 0.38 * age);
        m.scale.setScalar(0.11 + age * 0.45);
      }
      this.readings.steamRise = this.steam.children[0]!.position.y;
    }
    this.ferry.visible = Math.abs(metres - 7775) < 450;
    this.readings.ferryTravel = null;
    if (this.ferry.visible) {
      const phase = time * 0.021,
        p = this.course.place(7780 + 44 * Math.sin(phase), -155 - 17 * Math.cos(phase), this.p);
      this.ferry.position.set(p.x, 0.55 + 0.09 * Math.sin(time), p.z);
      this.ferry.rotation.y = p.heading + Math.atan2(17 * Math.sin(phase), 44 * Math.cos(phase));
      this.readings.ferryTravel = this.ferry.position.x;
    }
    this.wheel.visible = Math.abs(metres - 7843) < 580;
    this.wheel.rotation.z = time * 0.033;
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((v) => Math.abs(metres - v[0]) < 88);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 88) * 1.45);
    const r = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.q),
      dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5.2 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5.2 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.27 - camera.y) * f;
    ahead.x += (r.x + (13.8 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13.8 * dz) / len - ahead.z) * f;
    const target = s[0] >= 7690 ? s[3] : t.y + s[3];
    ahead.y += (r.y + 2.27 + (19 * (target - r.y - 2.27)) / (len + 5.2) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    this.steamPaint.dispose();
    for (const x of [
      ...this.shapes,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      x.dispose();
  }
}
