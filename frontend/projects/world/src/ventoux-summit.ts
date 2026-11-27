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
  [140, 169, -0.8, 2.1],
  [1720, 1758, 16, 4.0],
  [3320, 3360, 0.4, 2.7],
  [4940, 4974, -4.5, 3.4],
  [6830, 6860, -7.4, 2.1],
  [8220, 8325, -16, 26],
] as const;
export class VentouxSummit {
  readonly root = new Group();
  readonly materials: Record<
    string,
    MeshBasicMaterial | MeshBasicNodeMaterial | MeshStandardMaterial
  >;
  private readonly geo = new Set<BufferGeometry>();
  private readonly local: MeshBasicMaterial[] = [];
  private readonly flags: { cloth: PlaneGeometry; group: Group; station: number }[] = [];
  private readonly arm = new Group();
  private readonly cyclists: SceneRider[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    flagTip: null as number | null,
    armAngle: null as number | null,
    pedalAngle: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const plain = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
    const res = await Promise.allSettled(
      ['scree', 'panorama', 'chalet', 'markers', 'cedars', 'fans', 'chalk'].map((n) =>
        loader.loadAsync('courses/ventoux-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    try {
      if (err) throw err.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new VentouxSummit(course, maps, kit, plain);
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
    const [scree, panorama, chalet, markers, cedars, fans, chalk] = maps;
    scree!.wrapS = scree!.wrapT = RepeatWrapping;
    const world = positionWorld.xz;
    const limestone = texture(scree!, world.mul(0.39)).rgb.mul(
      normalWorld.y.abs().mul(0.26).add(0.78),
    );
    const land = new MeshBasicNodeMaterial({ side: DoubleSide });
    land.colorNode = mix(
      limestone.mul(color(0x746d45)),
      limestone,
      smoothstep(1414, 1431, positionWorld.y),
    );
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    road.colorNode = mix(color(0x363739), color(0x767574), texture(scree!, world.mul(1.15)).r);
    const cut = (m: Texture) =>
      new MeshBasicMaterial({ map: m, alphaTest: 0.48, side: DoubleSide });
    this.materials = {
      VentouxLimestone: land,
      D974Tarmac: road,
      Vaucluse: new MeshBasicMaterial({ map: panorama, fog: false, side: DoubleSide }),
      VentouxStation: new MeshBasicMaterial({ vertexColors: true, side: DoubleSide }),
      VentouxCedars: cut(cedars!),
      ReynardFacade: cut(chalet!),
      VentouxMarkers: cut(markers!),
      VentouxChalk: cut(chalk!),
      VentouxFans: cut(fans!),
    };
    const unit = new BoxGeometry();
    this.geo.add(unit);
    const paint = (hex: number) => {
      const m = new MeshBasicMaterial({ color: hex, side: DoubleSide });
      this.local.push(m);
      return m;
    };
    const iron = paint(0x535855),
      blue = paint(0x32569c),
      red = paint(0xc84c42),
      white = paint(0xf0ebdd),
      skin = paint(0xbf8d70);
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
    for (const station of [1765, 4974, 8252]) {
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
      const mesh = new Mesh(cloth, [blue, white, red]);
      mesh.position.y = 3.46;
      group.add(mesh);
      this.flags.push({ group, cloth, station });
      this.root.add(group);
    }
    const supporter = new Group();
    const at = course.place(8246, 4.25, this.point);
    supporter.position.set(at.x, at.y, at.z);
    supporter.rotation.y = at.heading + 0.32;
    for (const side of [-1, 1]) box(supporter, side * 0.15, 0.44, 0, 0.19, 0.82, 0.31, iron);
    box(supporter, 0, 1.12, 0, 0.53, 0.66, 0.32, red);
    const head = new SphereGeometry(0.17, 10, 8);
    this.geo.add(head);
    const face = new Mesh(head, skin);
    face.position.y = 1.62;
    supporter.add(face);
    box(supporter, -0.32, 1.14, 0, 0.12, 0.56, 0.13, skin);
    this.arm.position.set(0.27, 1.38, 0);
    box(this.arm, 0.13, 0.22, -0.02, 0.13, 0.49, 0.14, skin);
    box(this.arm, 0.25, 0.45, -0.02, 0.23, 0.12, 0.13, skin);
    supporter.add(this.arm);
    this.root.add(supporter);
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
      if (station === 4974) this.poses.flagTip = pos.getZ(18);
    }
    this.arm.rotation.z = 0.52 + 0.48 * Math.sin(t * 4.8);
    this.poses.armAngle = this.arm.rotation.z;
    for (const [i, r] of this.cyclists.entries()) {
      r.group.visible = metres < 2400 || metres > 6200;
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
      const height = at === 3320 ? 3.3 : 2.35;
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
