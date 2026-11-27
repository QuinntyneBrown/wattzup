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
  PlaneGeometry,
  SphereGeometry,
  type Vector3,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import { color, mix, normalWorld, positionWorld, smoothstep, texture } from 'three/tsl';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';
import type { Course, CoursePlace } from './course';
type Riders = Awaited<ReturnType<typeof caribanaCyclists>>;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 175, 9, 6],
  [2150, 2184, -4, 3],
  [4910, 4939, -0.75, 2.2],
  [9700, 9730, 0, 3.8],
  [10910, 10939, -5, 2],
  [12180, 12308, 0, 4.1],
] as const;
export class CarnicAscent {
  readonly root = new Group();
  readonly materials: Record<
    string,
    MeshBasicMaterial | MeshBasicNodeMaterial | MeshStandardMaterial
  >;
  private readonly geo = new Set<BufferGeometry>();
  private readonly local: MeshBasicMaterial[] = [];
  private readonly flags: { cloth: PlaneGeometry; group: Group; station: number }[] = [];
  private readonly herd: { head: Group; group: Group; station: number }[] = [];
  private readonly cyclists: SceneRider[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    flagTip: null as number | null,
    grazingAngle: null as number | null,
    pedalAngle: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const plain = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
    const res = await Promise.allSettled(
      ['grass', 'alps', 'village', 'murals', 'trees', 'fans', 'chalk'].map((n) =>
        loader.loadAsync('courses/zoncolan-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    try {
      if (err) throw err.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new CarnicAscent(course, maps, kit, plain);
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
    const [grass, panorama, village, murals, trees, fans, chalk] = maps;
    grass!.wrapS = grass!.wrapT = RepeatWrapping;
    const world = positionWorld.xz;
    const land = new MeshBasicNodeMaterial({ side: DoubleSide });
    land.colorNode = texture(grass!, world.mul(0.16)).rgb.mul(
      normalWorld.y.abs().mul(0.21).add(0.79),
    );
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    const patch = texture(grass!, world.mul(0.31)).r;
    road.colorNode = mix(
      color(0x525259),
      color(0x79767a),
      patch.mul(0.55).add(smoothstep(0.46, 0.49, patch).mul(0.19)),
    );
    const cut = (m: Texture, alphaTest = 0.48) =>
      new MeshBasicMaterial({ map: m, alphaTest, side: DoubleSide });
    this.materials = {
      CarnicPasture: land,
      ZoncolanAsphalt: road,
      CarnicPeaks: new MeshBasicMaterial({ map: panorama, fog: false, side: DoubleSide }),
      CarnicVillages: cut(village!),
      CarnicTrees: cut(trees!),
      GiroFans: cut(fans!, 0.9),
      GiroChalk: cut(chalk!),
      ClimberMurals: cut(murals!),
    };
    const unit = new BoxGeometry();
    this.geo.add(unit);
    const paint = (hex: number) => {
      const m = new MeshBasicMaterial({ color: hex, side: DoubleSide });
      this.local.push(m);
      return m;
    };
    const iron = paint(0x535855),
      green = paint(0x298051),
      red = paint(0xc84c42),
      white = paint(0xf0ebdd),
      hide = paint(0xad805a);
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
    for (const station of [11914, 12048, 12211, 12264]) {
      const group = new Group();
      const p = course.place(station, -4.5, this.point);
      group.position.set(p.x, p.y, p.z);
      group.rotation.y = p.heading + 0.25;
      box(group, 0, 2.1, 0, 0.072, 4.2, 0.072, iron);
      const cloth = new PlaneGeometry(2.2, 1.26, 18, 4);
      cloth.translate(1.1, 0, 0);
      cloth.clearGroups();
      for (let row = 0; row < 4; row++)
        for (let part = 0; part < 3; part++) cloth.addGroup((row * 18 + part * 6) * 6, 36, part);
      this.geo.add(cloth);
      const mesh = new Mesh(cloth, [green, white, red]);
      mesh.position.y = 3.46;
      group.add(mesh);
      this.flags.push({ group, cloth, station });
      this.root.add(group);
    }
    const round = new SphereGeometry(1, 12, 9);
    this.geo.add(round);
    const patchFur = paint(0xe3d5b8),
      dark = paint(0x66594d),
      horn = paint(0xc8b294);
    const oval = (
      g: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      m: MeshBasicMaterial,
    ) => {
      const mesh = new Mesh(round, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, l);
      g.add(mesh);
      return mesh;
    };
    for (const [i, [d, lane]] of [
      [10938, -5.3],
      [10948, -7.4],
      [10926, -9.2],
      [11002, 5.9],
      [11220, -9.6],
    ].entries()) {
      const g = new Group(),
        head = new Group(),
        p = course.place(d!, lane!, this.point);
      g.position.set(p.x, p.y - 0.16, p.z);
      g.rotation.y = p.heading + (0.36 + i * 0.82);
      oval(g, 0, 1.08, 0, 0.48, 0.54, 0.99, hide);
      oval(g, 0, 1.3, 0.59, 0.42, 0.29, 0.43, patchFur);
      for (const side of [-1, 1]) {
        oval(g, side * 0.36, 1.16, -0.22, 0.16, 0.3, 0.31, patchFur);
        for (const end of [-1, 1]) {
          box(g, side * 0.25, 0.49, end * 0.62, 0.145, 0.86, 0.19, hide);
          box(g, side * 0.25, 0.11, end * 0.62, 0.15, 0.16, 0.22, dark);
        }
      }
      head.position.set(0, 1.36, -0.72);
      g.add(head);
      oval(head, 0, -0.07, -0.32, 0.25, 0.34, 0.4, hide);
      oval(head, 0, -0.2, -0.59, 0.22, 0.15, 0.2, patchFur);
      for (const side of [-1, 1]) {
        oval(head, side * 0.25, 0.06, -0.19, 0.21, 0.091, 0.12, hide);
        oval(head, side * 0.16, 0.18, -0.25, 0.083, 0.12, 0.1, horn);
        oval(head, side * 0.225, 0.025, -0.41, 0.041, 0.046, 0.046, dark);
      }
      box(g, 0, 0.85, 0.99, 0.071, 0.71, 0.071, hide);
      oval(g, 0, 0.48, 1, 0.071, 0.15, 0.071, dark);
      this.root.add(g);
      this.herd.push({ group: g, head, station: d! });
    }
    for (const [i, hex] of [0xb64d40, 0x475f92].entries()) {
      const r = kit.make(new Color(hex), i + 5);
      r.setCastShadow(false);
      this.root.add(r.group);
      this.cyclists.push(r);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    for (const { cloth, group, station } of this.flags) {
      group.visible = Math.abs(metres - station) < 360;
      if (!group.visible) continue;
      const pos = cloth.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z =
          (x / 2.2) *
          (0.26 * Math.sin(x * 4 - t * 6) + 0.1 * Math.sin(x * 8 + t * 3 + pos.getY(i) * 2));
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
      if (station === 12211) this.poses.flagTip = pos.getZ(18);
    }
    for (const [i, cow] of this.herd.entries()) {
      cow.group.visible = Math.abs(metres - cow.station) < 260;
      if (!cow.group.visible) continue;
      cow.head.rotation.x = -0.83 + 0.51 * Math.sin(t * 0.92 + i * 1.7);
      if (i === 0) this.poses.grazingAngle = cow.head.rotation.x;
    }
    for (const [i, r] of this.cyclists.entries()) {
      r.group.visible = metres > 2800 && metres < 12345;
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
      const height = 2.56;
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
