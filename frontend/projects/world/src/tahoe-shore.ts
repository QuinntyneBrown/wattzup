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
import {
  color,
  mix,
  normalWorld,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
} from 'three/tsl';
import type { Course, CoursePlace } from './course';
const lake = 1870;
const views = [
  [120, 185, -4, 1],
  [3820, 3869, -38, -2],
  [7180, 7232, -45, -2],
  [11240, 11345, -235, -13],
  [15630, 15683, -36, 1],
  [19380, 19445, -5, 3],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
function shore(d: number) {
  const factor = Math.exp(
    -((Math.min(Math.abs(d - 3860), Math.abs(d - 7215), Math.abs(d - 15670)) / 230) ** 2),
  );
  return (80 + 17 * Math.sin(d / 135) + 28 * Math.cos(d / 390)) * (1 - factor) + 24 * factor;
}
export class TahoeShore {
  readonly root = new Group();
  readonly materials = {
    ShoreGranite: new MeshBasicNodeMaterial({ side: DoubleSide }),
    TahoePines: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    SierraRim: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    MarinaLodge: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    CurveWarning: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    TahoeWater: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    TahoeVerge: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ShoreHighway: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly box = new BoxGeometry();
  private readonly sphere = new SphereGeometry(1, 12, 8);
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly kayaks: Group[] = [];
  private readonly blades: Group[] = [];
  private readonly boats: Group[] = [];
  private readonly swimmers: Group[] = [];
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly time = uniform(0);
  private readonly poses = {
    shoreRipple: null as number | null,
    paddleAngle: null as number | null,
    mooredHull: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'tahoe-pines',
        'tahoe-sierra',
        'tahoe-lodge',
        'tahoe-curve',
        'tahoe-lakebed',
        'tahoe-needles',
        'galibier-tarmac',
        'tahoe-granite',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new TahoeShore(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    this.materials.TahoePines.map = maps[0]!;
    this.materials.SierraRim.map = maps[1]!;
    this.materials.MarinaLodge.map = maps[2]!;
    this.materials.CurveWarning.map = maps[3]!;
    for (const m of maps.slice(4)) m.wrapS = m.wrapT = RepeatWrapping;
    this.materials.ShoreGranite.colorNode = texture(maps[7]!, uv()).rgb.mul(
      normalWorld.y.mul(0.27).add(normalWorld.x.mul(0.09)).add(0.7),
    );
    const coords = positionWorld.xz,
      warp = sin(coords.x.mul(0.7).add(this.time)).mul(0.038);
    const shallow = texture(maps[4]!, coords.mul(0.13).add(vec2(warp, warp.negate()))).rgb;
    const depth = smoothstep(0.02, 0.66, uv().x);
    const wave = sin(
      coords.x
        .mul(0.28)
        .add(sin(coords.y.mul(0.74).add(this.time)).mul(2.2))
        .add(this.time.mul(0.53)),
    );
    this.materials.TahoeWater.colorNode = mix(
      mix(shallow, color(0x42999d), smoothstep(0, 0.26, uv().x)),
      color(0x195986),
      depth,
    ).add(smoothstep(0.93, 1, wave).mul(0.033));
    this.materials.TahoeVerge.colorNode = texture(maps[5]!, coords.mul(0.19)).rgb;
    this.materials.ShoreHighway.colorNode = texture(maps[6]!, coords.mul(0.22)).rgb.mul(0.76);
    for (let i = 0; i < 5; i++) {
      const kayak = new Group(),
        blade = new Group();
      this.shape(
        kayak,
        0,
        0.12,
        0,
        0.53,
        0.24,
        2.45,
        [0xe99b31, 0x427f98, 0xc15643, 0x60905e, 0xdeb246][i]!,
      );
      this.shape(kayak, 0, 0.33, 0.08, 0.32, 0.11, 0.86, 0x454746);
      this.shape(kayak, 0, 0.77, 0.08, 0.3, 0.42, 0.24, 0xcb5849);
      this.shape(kayak, 0, 1.3, 0.08, 0.16, 0.19, 0.16, 0xbd8d6a);
      blade.position.y = 0.86;
      this.shape(blade, 0, 0, 0, 2.51, 0.042, 0.055, 0x564635, true);
      for (const side of [-1, 1]) this.shape(blade, side * 1.18, 0, 0, 0.35, 0.07, 0.16, 0xe2b043);
      kayak.add(blade);
      this.root.add(kayak);
      this.blades.push(blade);
      this.kayaks.push(kayak);
      const swimmer = new Group();
      this.shape(swimmer, 0, 0.13, 0, 0.14, 0.15, 0.13, 0xc49870);
      this.shape(swimmer, 0.09, -0.04, 0.4, 0.15, 0.1, 0.43, 0x436163);
      this.root.add(swimmer);
      this.swimmers.push(swimmer);
    }
    for (let i = 0; i < 10; i++) {
      const boat = new Group();
      this.shape(boat, 0, 0.3, 0, 1.48, 0.62, 4.85, i % 3 ? 0xf3e9ce : 0xe2ab65);
      this.shape(boat, 0, 0.88, 0.4, 2.18, 0.24, 5.9, 0x8b6350, true);
      this.shape(boat, 0, 1.14, -0.6, 1.71, 0.84, 2.1, 0x8ba4ac, true);
      this.shape(boat, 0, 1.63, -0.6, 1.85, 0.11, 2.18, 0xf1eee0, true);
      this.root.add(boat);
      this.boats.push(boat);
    }
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
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.poses.shoreRipple = Math.abs(metres - 3820) < 500 ? t : null;
    this.poses.paddleAngle = null;
    this.poses.mooredHull = null;
    for (const [i, k] of this.kayaks.entries()) {
      const s = this.swimmers[i]!;
      k.visible = s.visible = Math.abs(metres - 7180) < 380;
      if (!k.visible) continue;
      const d = 7227 + i * 4.5 + 6 * Math.sin(t * 0.14 + i),
        p = this.course.place(d, -shore(d) - 12 - i * 2, this.point);
      k.position.set(p.x, lake + 0.1 + 0.05 * Math.sin(t * 1.6 + i), p.z);
      k.rotation.y = p.heading + 0.58 + i * 0.12;
      const blade = this.blades[i]!;
      blade.rotation.z = 0.57 * Math.sin(t * 2.1 + i);
      blade.rotation.y = 0.4 * Math.cos(t * 2.1 + i);
      if (!i) this.poses.paddleAngle = blade.rotation.z;
      const q = this.course.place(
        7220 + i * 7,
        -shore(7220 + i * 7) - 1.7 * Math.sin(t * 0.5 + i),
        this.point,
      );
      s.position.set(q.x, lake + 0.1 + 0.06 * Math.sin(t + i), q.z);
    }
    for (const [i, b] of this.boats.entries()) {
      b.visible = Math.abs(metres - 15630) < 400;
      if (!b.visible) continue;
      const d = 15675 + (i % 2 ? 1 : -1) * (4 + Math.floor(i / 2) * 2.8),
        p = this.course.place(d, -shore(15675) - 12 - (i % 4) * 6.1, this.point);
      b.position.set(p.x, lake + 0.13 + 0.12 * Math.sin(t * 1.4 + i), p.z);
      b.rotation.set(0.028 * Math.sin(t + i), p.heading + 0.2, 0.055 * Math.sin(t * 1.7 + i));
      if (!i) this.poses.mooredHull = b.rotation.z;
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
      const coastal = at === 3820 || at === 7180 || at === 15630;
      const height = coastal ? 3.1 : 2.35,
        back = coastal ? 6.2 : 4.8;
      camera.x += (r.x - (back * dx) / len - camera.x) * w;
      camera.z += (r.z - (back * dz) / len - camera.z) * w;
      camera.y += (r.y + height - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y +=
        (r.y +
          (coastal ? 1.1 : 1.55) +
          (18.8 * (p.y + lift - r.y - height)) / (len + back) -
          ahead.y) *
        w;
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
