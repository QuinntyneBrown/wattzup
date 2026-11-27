import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';
import type { Course, CoursePlace } from './course';
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [120, 290, 0, 21],
  [2780, 2850, -510, 1],
  [5310, 5353, 6, 2.5],
  [7930, 7994, -26, 10],
  [10480, 10557, -28, 15],
  [13190, 13244, 20, 7],
] as const;
type Riders = Awaited<ReturnType<typeof caribanaCyclists>>;
export class LasCanadas {
  readonly root = new Group();
  readonly materials = {
    FrozenLava: new MeshBasicNodeMaterial({ side: DoubleSide }),
    TradeHorizon: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    IzanaDrum: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    PicoTeide: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.35, fog: false }),
    CanaryPlants: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    Tajinaste: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    CloudSea: new MeshBasicNodeMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
    RoqueTuff: new MeshBasicNodeMaterial({ side: DoubleSide }),
    CalderaRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    Malpais: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly club: SceneRider[] = [];
  private readonly time = uniform(0);
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly cabin = new Group();
  private readonly box = new BoxGeometry();
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly poses = {
    trainingCrank: null as number | null,
    tradeCloud: null as number | null,
    cabinTravel: null as number | null,
  };
  private readonly lower: CoursePlace;
  private readonly upper: CoursePlace;
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader(),
      plain = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
    const results = await Promise.allSettled(
      [
        'teide-cone',
        'teide-canarias',
        'teide-lava',
        'galibier-tarmac',
        'galibier-cloud',
        'teide-observatory',
        'teide-inversion',
        'teide-tuff',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      failure = results.find((r) => r.status === 'rejected');
    try {
      if (failure) throw failure.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new LasCanadas(course, maps, kit, plain);
      } catch (error) {
        kit.dispose();
        throw error;
      }
    } catch (error) {
      plain.dispose();
      for (const m of maps) m.dispose();
      throw error;
    }
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
    private readonly kit: Riders,
    private readonly plain: MeshStandardMaterial,
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
    }
    this.materials.PicoTeide.map = maps[0]!;
    this.materials.CanaryPlants.map = this.materials.Tajinaste.map = maps[1]!;
    for (const m of maps.slice(2)) m.wrapS = m.wrapT = RepeatWrapping;
    const xy = positionWorld.xz,
      stone = texture(maps[2]!, xy.mul(0.19)).rgb;
    const band = sin(xy.y.mul(0.023).add(sin(xy.x.mul(0.009)).mul(3.8)))
      .mul(0.5)
      .add(0.5);
    this.materials.Malpais.colorNode = mix(
      stone.mul(color(0x857268)),
      stone.mul(1.1).add(color(0x796140)),
      smoothstep(0.13, 0.87, band),
    );
    this.materials.IzanaDrum.map = maps[5]!;
    this.materials.TradeHorizon.colorNode = texture(
      maps[6]!,
      uv().add(vec2(sin(this.time.mul(0.085)).mul(0.006), 0)),
    ).rgb;
    this.materials.FrozenLava.colorNode = texture(maps[2]!, uv()).rgb.mul(0.67);
    this.materials.RoqueTuff.colorNode = texture(maps[7]!, uv().mul(0.61)).rgb.mul(0.95);
    this.materials.CalderaRoad.colorNode = texture(maps[3]!, xy.mul(0.19)).rgb.mul(0.64);
    const cloud = texture(
      maps[4]!,
      xy.mul(0.0038).add(vec2(this.time.mul(0.015), this.time.mul(0.004))),
    );
    const edges = sin(uv().x.mul(Math.PI)).mul(sin(uv().y.mul(Math.PI)));
    this.materials.CloudSea.colorNode = mix(color(0xa5b7c3), color(0xfff7e8), cloud.r);
    this.materials.CloudSea.opacityNode = edges
      .mul(0.91)
      .mul(smoothstep(0.01, 0.45, cloud.r).mul(0.5).add(0.5));
    for (const [i, jersey] of [0xc4473b, 0x2f6983, 0xe4ac43].entries()) {
      const r = kit.make(new Color(jersey), i + 5);
      r.setCastShadow(false);
      this.club.push(r);
      this.root.add(r.group);
    }
    this.lower = course.place(10531, -24);
    this.upper = course.place(10890, -93);
    this.part(0, -0.43, 0, 2.59, 0.93, 3.9, 0xd69438);
    this.part(0, 0.47, 0, 2.48, 1.03, 3.78, 0x526875);
    this.part(0, 1.07, 0, 2.66, 0.17, 4, 0xf0e9d9);
    for (const side of [-1, 1])
      for (let j = -1; j <= 1; j++)
        this.part(side * 1.26, 0.49, j * 1.5, 0.09, 0.99, 0.08, 0xe9dbbc);
    this.part(0, 2.19, 0, 0.19, 2.11, 0.21, 0x4a4c4f);
    this.root.add(this.cabin);
    this.update(0, 0);
  }
  private part(x: number, y: number, z: number, w: number, h: number, d: number, c: number) {
    let mat = this.paints.get(c);
    if (!mat) {
      mat = new MeshBasicMaterial({ color: c });
      this.paints.set(c, mat);
    }
    const m = new Mesh(this.box, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    this.cabin.add(m);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.poses.tradeCloud = Math.abs(metres - 2780) < 1100 ? t * 0.015 : null;
    this.poses.trainingCrank = null;
    for (const [i, r] of this.club.entries()) {
      r.group.visible = Math.abs(metres - 5310) < 510;
      if (!r.group.visible) continue;
      const p = this.course.place(
        metres + 9 + i * 3.4 + 1.4 * Math.sin(t * 0.17),
        0.75 + (i % 2) * 0.87,
        this.point,
      );
      r.group.position.set(p.x, p.y + 0.065, p.z);
      r.group.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      const angle = t * (7.6 + i * 0.14) + i * 1.7;
      r.pose(angle, 0.024 * Math.sin(t * 1.7 + i), 0.12 + 0.065 * Math.sin(t * 0.72 + i));
      if (i === 0) this.poses.trainingCrank = angle;
    }
    this.cabin.visible = Math.abs(metres - 10480) < 650;
    this.poses.cabinTravel = null;
    if (this.cabin.visible) {
      const a = this.lower,
        b = this.upper,
        f = 0.09 + 0.083 * Math.sin(t * 0.13);
      this.cabin.position.set(
        a.x + (b.x - a.x) * f,
        a.y + 11.13 + (b.y + 18 - a.y) * f,
        a.z + (b.z - a.z) * f,
      );
      this.cabin.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      this.poses.cabinTravel = this.cabin.position.x;
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
    this.kit.dispose();
    this.plain.dispose();
    for (const item of [
      this.box,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      item.dispose();
  }
}
