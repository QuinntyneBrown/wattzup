import type { BufferGeometry, Texture, MeshBasicNodeMaterial } from 'three/webgpu';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  LatheGeometry,
  CylinderGeometry,
  Vector2,
  type Vector3,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import { PursuitBoard } from './pursuit-board';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import { RiderBody } from './rider-body';
import type { Course, CoursePlace } from './course';

const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [510, 531, 1, 2],
  [1580, 1598, 2, 2],
  [3140, 3154, -10, 1.3],
  [4690, 4712, 2, 8.4],
  [6300, 6323, 9, 6.5],
  [8510, 8500, -3.5, 2.4],
] as const;
export class LeeValleyTrack {
  readonly root = new Group();
  readonly materials: Record<
    string,
    MeshBasicMaterial | MeshBasicNodeMaterial | MeshStandardMaterial
  >;
  private readonly geo = new Set<BufferGeometry>();
  private readonly local: MeshBasicMaterial[] = [];
  private readonly bell = new Group();
  private readonly warmup = new Group();
  private readonly roller = new Group();
  private readonly timing = new PursuitBoard('LEE VALLEY · LONDON');
  private readonly cyclists: RiderModel[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    bellSwing: null as number | null,
    rollerAngle: null as number | null,
    pedalAngle: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const plain = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
    const res = await Promise.allSettled(
      ['pine', 'stands', 'team', 'banners'].map((n) =>
        loader.loadAsync('courses/velodrome-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    try {
      if (err) throw err.reason;
      const body = await RiderBody.load('/riders/rider.glb');
      const kit = new CourseCyclistKit(plain, body, false, low, true);
      try {
        return new LeeValleyTrack(course, maps, kit, plain, body);
      } catch (error) {
        kit.dispose();
        body.dispose();
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
    private readonly kit: CourseCyclistKit,
    private readonly plain: MeshStandardMaterial,
    private readonly body: RiderBody,
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = 4;
    }
    const [pine, stands, team, banners] = maps;
    pine!.wrapS = pine!.wrapT = RepeatWrapping;
    this.materials = {
      LeePine: new MeshBasicMaterial({ map: pine, side: DoubleSide }),
      LeeTeam: new MeshBasicMaterial({ map: team, alphaTest: 0.44, side: DoubleSide }),
      LeeStands: new MeshBasicMaterial({ map: stands, alphaTest: 0.44, side: DoubleSide }),
      LeeGlass: new MeshBasicMaterial({
        color: 0xa3c6d2,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        side: DoubleSide,
      }),
      LeeBanners: new MeshBasicMaterial({ map: banners, side: DoubleSide }),
    };
    const unit = new BoxGeometry();
    this.geo.add(unit);
    const paint = (hex: number) => {
      const m = new MeshBasicMaterial({ color: hex, side: DoubleSide });
      this.local.push(m);
      return m;
    };
    const iron = paint(0x41464c),
      brass = paint(0xc59d52),
      silver = paint(0xc2c9c9),
      red = paint(0xb73c32);
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
    this.root.add(this.timing.group, this.warmup);
    const rack = new Group();
    const p = course.place(0, -3.5, this.point);
    rack.position.set(p.x, p.y, p.z);
    rack.rotation.y = p.heading;
    box(rack, 0, 0.96, 0, 0.1, 2.1, 0.1, iron);
    box(rack, 0.35, 2.03, 0, 0.8, 0.1, 0.11, iron);
    this.bell.position.set(0.68, 1.98, 0);
    const bellProfile = [
      [0.035, 0],
      [0.075, -0.1],
      [0.095, -0.19],
      [0.14, -0.32],
      [0.22, -0.4],
      [0.23, -0.44],
    ];
    const bronze = new LatheGeometry(
      bellProfile.map(([x, y]) => new Vector2(x, y)),
      20,
    );
    this.geo.add(bronze);
    this.bell.add(new Mesh(bronze, brass));
    box(this.bell, 0, -0.44, 0, 0.07, 0.15, 0.07, iron);
    // The ringside repeater shares the main scoreboard display and updates on the same lap.
    const repeater = this.timing.group.children[0]!.clone();
    repeater.position.set(-0.64, 1.55, 0);
    repeater.rotation.set(0, Math.PI, 0);
    repeater.scale.setScalar(0.25);
    const opposite = repeater.clone();
    opposite.rotation.y += Math.PI;
    opposite.position.z += 0.035;
    rack.add(repeater, opposite);
    box(rack, -0.64, 0.74, 0, 0.11, 1.45, 0.12, iron);
    rack.add(this.bell);
    this.root.add(rack);
    const wp = course.place(154, -10, this.point);
    this.warmup.position.set(wp.x, -0.42, wp.z);
    this.warmup.rotation.y = wp.heading;
    for (const x of [-0.37, 0.37]) box(this.warmup, x, 0.12, 0, 0.08, 0.22, 1.98, iron);
    const drum = new CylinderGeometry(0.13, 0.13, 0.78, 12);
    this.geo.add(drum);
    for (const z of [-0.71, 0.51, 0.82]) {
      const roller = new Mesh(drum, silver);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, 0.22, z);
      this.warmup.add(roller);
    }
    this.roller.position.set(0, 0.22, -0.71);
    box(this.roller, 0.405, 0.055, 0, 0.035, 0.1, 0.035, red);
    this.warmup.add(this.roller);
    const disc = new CylinderGeometry(0.301, 0.301, 0.024, 32);
    disc.rotateZ(Math.PI / 2);
    this.geo.add(disc);
    const carbon = paint(0x24282b);
    for (const [i, hex] of [0x2a507b, 0x8c3749, 0xdcaa52, 0x41736e].entries()) {
      const rider = kit.make(new Color(hex), i + 5);

      const rear = new Mesh(disc, carbon);
      rear.position.set(0, 0.34, 0.5);
      rider.group.add(rear);
      this.cyclists.push(rider);
      if (i === 3) {
        rider.group.position.y = 0.355;
        this.warmup.add(rider.group);
      } else this.root.add(rider.group);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.timing.update(metres, t);
    const lap = metres % 250;
    // The official rings as a rider approaches and crosses the home straight.
    const distanceToLine = Math.min(lap, 250 - lap);
    this.bell.rotation.x = 0.57 * Math.sin(t * 11) * Math.max(0, 1 - distanceToLine / 33);
    this.poses.bellSwing = this.bell.rotation.x;
    this.roller.rotation.x = t * 14;
    this.poses.rollerAngle = this.roller.rotation.x;
    for (const [i, rider] of this.cyclists.entries()) {
      const crank = t * (8.8 + i * 0.11) + i * 1.7;
      if (i === 3) {
        rider.pose(crank, 0.03);
        continue;
      }
      const p = this.course.place(
        metres + 10.8 + i * 2.7 + 0.67 * Math.sin(t * 0.38),
        1.4 + i * 0.07,
        this.point,
      );
      rider.group.position.set(p.x, p.y + 0.07, p.z);
      rider.group.rotation.set(p.pitch, p.heading, p.bank ?? 0, 'YXZ');
      rider.pose(crank, 0.04 + 0.02 * Math.sin(crank));
      if (i === 0) this.poses.pedalAngle = crank;
    }
    this.kit.roll(metres);
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      if (at === 3140) p.y = -0.42;
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 23);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      const height = at === 3140 ? 2.9 : at === 4690 ? 3 : 2.15;
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
    this.timing.dispose();
    this.root.clear();
    for (const r of this.cyclists) for (const owned of r.owned) owned.dispose();
    this.kit.dispose();
    this.body.dispose();
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
