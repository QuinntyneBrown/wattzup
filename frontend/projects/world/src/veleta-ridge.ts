import type { BufferGeometry, Texture } from 'three/webgpu';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshStandardMaterial,
  LatheGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import { color, mix, normalWorld, positionWorld, texture } from 'three/tsl';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';
import type { Course, CoursePlace } from './course';
type Riders = Awaited<ReturnType<typeof caribanaCyclists>>;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 174, 10, 7],
  [5470, 5529, -18, 7],
  [10620, 10672, 125, -13],
  [15260, 15292, -17, 10],
  [20610, 20642, 3.25, 1.7],
  [24980, 25028, 43, -9],
] as const;
export class VeletaRidge {
  readonly root = new Group();
  readonly materials: Record<
    string,
    MeshBasicMaterial | MeshBasicNodeMaterial | MeshStandardMaterial
  >;
  private readonly geo = new Set<BufferGeometry>();
  private readonly local: MeshBasicMaterial[] = [];
  private readonly cabins: Group[] = [];
  private readonly mount = new Group();
  private readonly dish = new Group();
  private readonly cyclists: SceneRider[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    cabinHeight: null as number | null,
    dishAzimuth: null as number | null,
    pedalAngle: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const plain = new MeshStandardMaterial({ color: 0xffffff });
    const res = await Promise.allSettled(
      ['scree', 'ridge', 'granada', 'flora', 'village', 'sign'].map((n) =>
        loader.loadAsync('courses/veleta-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    try {
      if (err) throw err.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new VeletaRidge(course, maps, kit, plain);
      } catch (error) {
        kit.dispose();
        throw error;
      }
    } catch (error) {
      for (const m of maps) m.dispose();
      plain.dispose();
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
      m.anisotropy = 4;
    }
    const [scree, ridge, valley, flora, village, sign] = maps;
    scree!.wrapS = scree!.wrapT = RepeatWrapping;
    const world = positionWorld.xz;
    const slate = texture(scree!, world.mul(0.12)).rgb;
    const land = new MeshBasicNodeMaterial({ side: DoubleSide });
    land.colorNode = slate.mul(normalWorld.y.abs().mul(0.32).add(0.71));
    const tarmac = new MeshBasicNodeMaterial({ side: DoubleSide });
    tarmac.colorNode = mix(color(0x323536), color(0x8a8983), texture(scree!, world.mul(1.7)).r);
    const track = new MeshBasicNodeMaterial({ side: DoubleSide });
    track.colorNode = mix(color(0x534e49), color(0xb5a78e), texture(scree!, world.mul(0.48)).r);
    this.materials = {
      NevadaSlate: land,
      NevadaSlateBanks: new MeshBasicMaterial({ map: scree, side: DoubleSide, color: 0xb1a89b }),
      VeletaTarmac: tarmac,
      SummitTrack: track,
      Mulhacen: new MeshBasicMaterial({ map: ridge, side: DoubleSide, fog: false }),
      GranadaVega: new MeshBasicMaterial({ map: valley, side: DoubleSide, fog: false }),
      Pradollano: new MeshBasicMaterial({ map: village, side: DoubleSide, alphaTest: 0.5 }),
      NevadaFlora: new MeshBasicMaterial({ map: flora, side: DoubleSide, alphaTest: 0.5 }),
      VeletaPosts: new MeshBasicMaterial({ map: sign, side: DoubleSide, alphaTest: 0.5 }),
    };
    const unit = new BoxGeometry();
    this.geo.add(unit);
    const paint = (hex: number) => {
      const m = new MeshBasicMaterial({ color: hex, side: DoubleSide });
      this.local.push(m);
      return m;
    };
    const iron = paint(0x52565a),
      silver = paint(0xbec4c5),
      panel = paint(0xe1dfd6),
      windows = paint(0x496476),
      cabinRed = paint(0xa73d35);
    const box = (
      g: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      m: MeshBasicMaterial,
    ) => {
      const mesh = new Mesh(unit, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, l);
      g.add(mesh);
    };
    for (let i = 0; i < 4; i++) {
      const cabin = new Group();
      box(cabin, 0, 0, 0, 1.94, 0.92, 2.18, cabinRed);
      box(cabin, 0, 0.85, 0, 1.88, 0.83, 2.12, windows);
      box(cabin, 0, 1.34, 0, 2.02, 0.16, 2.25, silver);
      for (const side of [-1, 1]) box(cabin, side * 0.94, 0.82, 0, 0.07, 0.93, 0.1, iron);
      box(cabin, 0, 2.18, 0, 0.12, 1.6, 0.12, iron);
      this.cabins.push(cabin);
      this.root.add(cabin);
    }
    box(this.mount, 0, 1.7, 0, 7, 3.4, 6.6, panel);
    box(this.mount, 0, 5, 0, 3.6, 4, 3.6, silver);
    const profile = Array.from(
      { length: 13 },
      (_, i) => new Vector2(i * 0.65, (i * 0.65) ** 2 / 22),
    );
    const bowl = new LatheGeometry(profile, 36);
    this.geo.add(bowl);
    const dishFace = new Mesh(bowl, panel);
    this.dish.add(dishFace);
    const rim = new TorusGeometry(7.8, 0.11, 5, 48);
    this.geo.add(rim);
    const rimMesh = new Mesh(rim, silver);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 7.8 ** 2 / 22;
    this.dish.add(rimMesh);
    const axis = new Vector3(0, 1, 0);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const foot = new Vector3(7.55 * Math.cos(angle), 2.65, 7.55 * Math.sin(angle));
      const end = new Vector3(0, 6.5, 0);
      const dir = end.clone().sub(foot);
      const strut = new Mesh(unit, iron);
      strut.position.copy(foot).lerp(end, 0.5);
      strut.scale.set(0.13, dir.length(), 0.13);
      strut.quaternion.setFromUnitVectors(axis, dir.normalize());
      this.dish.add(strut);
    }
    box(this.dish, 0, 6.5, 0, 0.71, 0.45, 0.71, iron);
    for (let i = 0; i < 16; i++) {
      const rib = new Mesh(unit, silver);
      const angle = (i * Math.PI) / 8;
      const tip = new Vector3(7.78 * Math.cos(angle), 2.7, 7.78 * Math.sin(angle));
      const foot = new Vector3(0, -0.16, 0);
      const direction = tip.clone().sub(foot);
      rib.position.copy(foot).lerp(tip, 0.5);
      rib.scale.set(0.065, direction.length(), 0.08);
      rib.quaternion.setFromUnitVectors(axis, direction.normalize());
      this.dish.add(rib);
    }
    this.dish.position.y = 8.3;
    this.mount.add(this.dish);
    this.root.add(this.mount);
    for (const [i, hex] of [0xb64d40, 0x475f92].entries()) {
      const r = kit.make(new Color(hex), i + 5);
      r.setCastShadow(false);
      this.root.add(r.group);
      this.cyclists.push(r);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.materials['GranadaVega']!.visible = Math.abs(metres - 10620) < 420;
    this.cabins.forEach((cabin, i) => {
      cabin.visible = metres < 900;
      if (!cabin.visible) return;
      const progress = (t * 1.7 + i * 72) % 288;
      const p = this.course.place(
        i % 2 ? 110 + progress : 398 - progress,
        i % 2 ? 7.3 : 10.7,
        this.point,
      );
      cabin.position.set(p.x, p.y + 6.6 - 0.62 * Math.sin(((progress % 72) * Math.PI) / 72), p.z);
      cabin.rotation.y = p.heading;
      if (i === 0) this.poses.cabinHeight = cabin.position.y;
    });
    this.mount.visible = Math.abs(metres - 15292) < 400;
    if (this.mount.visible) {
      const p = this.course.place(15292, -17, this.point);
      this.mount.position.set(p.x, p.y, p.z);
      this.mount.rotation.y = p.heading;
      this.dish.rotation.order = 'YXZ';
      this.dish.rotation.set(
        0.95 + 0.06 * Math.cos(t * 0.075),
        2.5 + 0.38 * Math.sin(t * 0.1),
        0,
        'YXZ',
      );
      this.poses.dishAzimuth = this.dish.rotation.y;
    }
    for (const [i, r] of this.cyclists.entries()) {
      r.group.visible = metres > 24000;
      if (!r.group.visible) continue;
      const p = this.course.place(
        metres + 13.5 + i * 4.2 + 1.4 * Math.sin(t * 0.23 + i),
        -0.89 - i * 0.49,
        this.point,
      );
      r.group.position.set(p.x, p.y + 0.09, p.z);
      r.group.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      const crank = t * (5.6 + i * 0.22) + i * 1.67;
      r.pose(crank, 0.033 * Math.sin(crank), 0.27 + 0.09 * Math.sin(t * 0.59));
      if (i === 0) this.poses.pedalAngle = crank;
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
      const height = at === 10620 ? 2.35 : at === 5470 ? 4.4 : 2.35;
      camera.y += (r.y + height - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y +=
        (r.y + height - 0.8 + (18.8 * (p.y + lift - r.y - height)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.kit.dispose();
    this.plain.dispose();
    for (const item of new Set([
      ...this.geo,
      ...this.local,
      ...Object.values(this.materials),
      ...this.maps,
    ]))
      item.dispose();
  }
}
