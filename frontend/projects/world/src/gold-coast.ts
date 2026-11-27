import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const views = [
  [120, 156, 1, 3],
  [2230, 2590, -36, 70],
  [4420, 4448, 76, -1],
  [6630, 6662, 11, 4.6],
  [9050, 9068, 25, 2.2],
  [12880, 12904, -6.5, 2.8],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class GoldCoast {
  readonly root = new Group();
  readonly materials = {
    GoldBalconies: new MeshBasicMaterial({ side: DoubleSide }),
    ForeshorePalms: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    PacificRim: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    CavillArch: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    GoldWash: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PatrolNotice: new MeshBasicMaterial({ side: DoubleSide }),
    GoldSand: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PacificSwell: new MeshBasicNodeMaterial({ side: DoubleSide }),
    EsplanadeRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly box = new BoxGeometry();
  private readonly sphere = new SphereGeometry(1, 10, 7);
  private readonly panel = new PlaneGeometry(1, 1);
  private readonly side = new MeshBasicMaterial({ side: DoubleSide });
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly cloth = [
    new MeshBasicMaterial({ color: 0xe14335, side: DoubleSide }),
    new MeshBasicMaterial({ color: 0xffda4d, side: DoubleSide }),
  ];
  private readonly flags: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly train = new Group();
  private readonly surfers: Group[] = [];
  private readonly time = uniform(0);
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    breakerTravel: null as number | null,
    patrolFold: null as number | null,
    tramTravel: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      r = await Promise.allSettled(
        [
          'surfers-balconies',
          'surfers-palms',
          'surfers-pacific',
          'surfers-arch',
          'surfers-sand',
          'galibier-tarmac',
          'surfers-tram',
          'surfers-shore',
          'surfers-patrol',
        ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
      );
    const maps = r.flatMap((x) => (x.status === 'fulfilled' ? [x.value] : [])),
      error = r.find((x) => x.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new GoldCoast(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    const [towers, palms, sky, arch, sand, road, tram] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    const shore = maps[7]!;
    shore.wrapS = RepeatWrapping;
    this.materials.PatrolNotice.map = maps[8]!;
    const waveUV = uv().add(vec2(0, sin(this.time.add(uv().x.mul(0.43))).mul(0.033)));
    this.materials.GoldWash.colorNode = texture(shore, waveUV).rgb;
    this.materials.GoldBalconies.map = towers;
    this.materials.ForeshorePalms.map = palms;
    this.materials.PacificRim.map = sky;
    this.materials.CavillArch.map = arch;
    sand.wrapS = sand.wrapT = road.wrapS = road.wrapT = RepeatWrapping;
    this.side.map = tram;
    this.side.map.flipY = true;
    this.materials.EsplanadeRoad.colorNode = texture(road, positionWorld.xz.mul(0.16)).rgb;
    const sandgrain = texture(sand, positionWorld.xz.mul(0.54)).rgb;
    this.materials.GoldSand.colorNode = mix(
      sandgrain,
      color(0xb6aaa0),
      smoothstep(1.2, 3.85, positionWorld.y.negate().add(2)).mul(0.48),
    );
    const phase = uv()
      .y.mul(3.34)
      .add(sin(uv().x.mul(0.46)).mul(0.64))
      .add(this.time);
    const ripple = sin(phase),
      edge = smoothstep(0.73, 0.97, ripple);
    const sea = mix(color(0x378b9f), color(0x72b5b6), ripple.mul(0.5).add(0.5));
    this.materials.PacificSwell.colorNode = mix(sea, color(0xe7f2e9), edge.mul(0.39));
    for (const [j, d] of [4450, 9068, 9168].entries()) {
      const p = course.place(d, 25, this.point);
      for (let i = 0; i < 2; i++) {
        const g = new PlaneGeometry(1.41, 0.42, 7, 1);
        g.translate(0.705, 0, 0);
        const strip = new Mesh(g, this.cloth[i]!);
        strip.position.set(p.x, p.y + 2.99 - i * 0.42, p.z);
        strip.rotation.y = p.heading + 0.45 + j * 0.26;
        this.flags.push(strip);
        this.root.add(strip);
      }
    }
    for (let i = 0; i < 6; i++) {
      const person = new Group();
      this.shape(person, 0, 0, 0, 0.33, 0.07, 1.32, i % 2 ? 0xe1af67 : 0xc95851);
      this.shape(person, 0.08, 0.4, -0.29, 0.1, 0.32, 0.13, 0x3b4649);
      this.shape(person, -0.09, 0.39, 0.23, 0.1, 0.31, 0.13, 0x3b4649);
      this.shape(person, 0, 0.88, 0, 0.22, 0.33, 0.14, 0x426571);
      this.shape(person, 0, 1.3, 0, 0.131, 0.16, 0.128, 0xc89976);
      for (const v of [-1, 1]) {
        const m = this.shape(person, v * 0.31, 1.01, 0.06, 0.26, 0.067, 0.074, 0xaf805f);
        m.rotation.z = v * 0.18;
      }
      this.surfers.push(person);
      this.root.add(person);
    }
    for (let i = 0; i < 3; i++) {
      const z = (i - 1) * 8.2;
      this.shape(this.train, 0, 1.52, z, 2.58, 2.23, 7.85, 0xe9bc40, true);
      this.shape(this.train, 0, 2.74, z, 2.48, 0.25, 7.7, 0xb5b7af, true);
      this.shape(this.train, 0, 0.49, z, 2.54, 0.38, 7.75, 0x40607e, true);
      for (const s of [-1, 1]) {
        const face = new Mesh(this.panel, this.side);
        face.scale.set(7.82, 2.42, 1);
        face.position.set(s * 1.302, 1.48, z);
        face.rotation.y = (s * Math.PI) / 2;
        this.train.add(face);
      }
      if (i < 2) this.shape(this.train, 0, 1.5, z + 4.1, 2.4, 2.2, 0.49, 0x57575b, true);
    }
    for (const s of [-1, 1]) {
      this.shape(this.train, 0, 1.45, s * 12.31, 1.28, 1.15, 1.01, 0xe8b734);
      this.shape(this.train, 0, 1.79, s * 12.69, 1.12, 0.65, 0.7, 0x415d6b);
      for (const x of [-0.81, 0.81])
        this.shape(this.train, x, 0.91, s * 12.91, 0.19, 0.085, 0.12, 0xffe5a0);
    }
    this.root.add(this.train);
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
    let mat = this.paints.get(c);
    if (!mat) {
      mat = new MeshBasicMaterial({ color: c });
      this.paints.set(c, mat);
    }
    const m = new Mesh(box ? this.box : this.sphere, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
    return m;
  }
  update(metres: number, t: number) {
    this.time.value = t * 1.17;
    this.poses.breakerTravel = metres > 3900 && metres < 4900 ? this.time.value : null;
    for (const [i, p] of this.surfers.entries()) {
      p.visible = Math.abs(metres - 4420) < 200;
      if (!p.visible) continue;
      const phase = t * 1.17 + i * 0.88,
        place = this.course.place(
          4446 + i * 4.5,
          72 + i * 2.7 - 1.48 * Math.sin(phase),
          this.point,
        );
      p.position.set(place.x, place.y - 3.65 + 0.39 * Math.sin(phase), place.z);
      p.rotation.set(0, place.heading + 0.92, 0.12 * Math.sin(phase));
    }
    this.poses.patrolFold = null;
    for (const [j, strip] of this.flags.entries()) {
      strip.visible = Math.abs(metres - [4450, 9068, 9168][Math.floor(j / 2)]!) < 170;
      if (!strip.visible) continue;
      const pos = strip.geometry.attributes['position']!;
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v);
        pos.setZ(v, x * 0.24 * Math.sin(t * 2.7 + x * 4.1 + Math.floor(j / 2)));
      }
      pos.needsUpdate = true;
      if (j % 2 === 0) this.poses.patrolFold = pos.getZ(7);
    }
    this.train.visible = Math.abs(metres - 12880) < 235;
    this.poses.tramTravel = null;
    if (this.train.visible) {
      const p = this.course.place(12906 + 15 * Math.sin(t * 0.13), -6.5, this.point);
      this.train.position.set(p.x, p.y + 0.15, p.z);
      this.train.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      this.poses.tramTravel = p.x;
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to + metres - at, lane, this.target);
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
    for (const f of this.flags) f.geometry.dispose();
    for (const m of [
      this.box,
      this.sphere,
      this.panel,
      this.side,
      ...this.paints.values(),
      ...this.cloth,
      ...this.maps,
      ...Object.values(this.materials),
    ])
      m.dispose();
    this.paints.clear();
  }
}
