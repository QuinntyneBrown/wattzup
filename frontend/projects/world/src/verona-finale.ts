import type { BufferGeometry, Texture } from 'three/webgpu';
import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  type Vector3,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import { color, mix, positionWorld, smoothstep, texture, sin, uniform } from 'three/tsl';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';
import type { Course, CoursePlace } from './course';
type Riders = Awaited<ReturnType<typeof caribanaCyclists>>;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 170, -1, 2],
  [6310, 6361, 70, -20],
  [11430, 11509, 10, 1.8],
  [16720, 16801, -26, 13],
  [21850, 21903, 0, 7.5],
  [23970, 24025, -10, 5.4],
] as const;
function waterVisible(metres: number) {
  return Math.abs(metres - 11460) < 250 || Math.abs(metres - 6310) < 260;
}
export class VeronaFinale {
  readonly root = new Group();
  readonly materials: Record<
    string,
    MeshBasicMaterial | MeshBasicNodeMaterial | MeshStandardMaterial
  >;
  private readonly geo = new Set<BufferGeometry>();
  private readonly local: MeshBasicMaterial[] = [];
  private readonly scarves: { cloth: PlaneGeometry; group: Group; station: number }[] = [];
  private readonly time = uniform(0);
  private readonly cyclists: SceneRider[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    scarfTip: null as number | null,
    waterPhase: null as number | null,
    pedalAngle: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const plain = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
    const res = await Promise.allSettled(
      ['paving', 'facades', 'tifosi', 'hills', 'signs'].map((n) =>
        loader.loadAsync('courses/verona-' + n + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    try {
      if (err) throw err.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new VeronaFinale(course, maps, kit, plain);
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
    const [paving, facades, tifosi, hills, signs] = maps;
    paving!.wrapS = paving!.wrapT = RepeatWrapping;
    const world = positionWorld.xz;
    const marble = new MeshBasicNodeMaterial({ side: DoubleSide });
    marble.colorNode = texture(paving!, world.mul(0.27)).rgb;
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    road.colorNode = mix(color(0x484946), color(0x828077), texture(paving!, world.mul(1.45)).r);
    const land = new MeshBasicNodeMaterial({ side: DoubleSide });
    land.colorNode = mix(
      color(0x687744),
      color(0xa39c6b),
      texture(paving!, world.mul(0.105)).r,
    ).mul(smoothstep(60, 170, positionWorld.y).mul(0.19).add(0.82));
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ripple = sin(
      world.x
        .mul(0.73)
        .add(this.time.mul(1.2))
        .add(sin(world.y.mul(0.84).add(this.time.mul(0.64)))),
    );
    water.colorNode = mix(color(0x4a7771), color(0xb7c8b4), ripple.mul(0.5).add(0.5).pow(6));
    const cut = (m: Texture) =>
      new MeshBasicMaterial({ map: m, side: DoubleSide, alphaTest: 0.46 });
    this.materials = {
      TorricelleRoad: road,
      VeronaMarble: marble,
      ArenaStone: new MeshBasicMaterial({ map: paving, side: DoubleSide, color: 0xd9b79c }),
      ListonPaving: marble,
      VeronaLand: land,
      VeronaFacades: cut(facades!),
      VeronaTifosi: cut(tifosi!),
      VeronaSigns: new MeshBasicMaterial({ map: signs, side: DoubleSide }),
      TorricelleVista: new MeshBasicMaterial({ map: hills, fog: false, side: DoubleSide }),
      AdigeWater: water,
    };
    const trim = new MeshBasicMaterial({ color: 0xf0d3db, side: DoubleSide });
    const pink = new MeshBasicMaterial({ color: 0xc34375, side: DoubleSide });
    this.local.push(trim, pink);
    for (const station of [21884, 23991, 23993, 23998]) {
      const group = new Group();
      const p = course.place(station, station % 2 ? 4.22 : -4.22, this.point);
      group.position.set(p.x, p.y + 1.98, p.z);
      group.rotation.y = p.heading + 0.25;
      const cloth = new PlaneGeometry(1.48, 0.26, 16, 2);
      cloth.clearGroups();
      for (let row = 0; row < 2; row++)
        for (let i = 0; i < 16; i++) cloth.addGroup((row * 16 + i) * 6, 6, i < 2 || i > 13 ? 0 : 1);
      this.geo.add(cloth);
      group.add(new Mesh(cloth, [trim, pink]));
      this.scarves.push({ station, cloth, group });
      this.root.add(group);
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
    this.materials['TorricelleVista']!.visible = metres < 9800;
    this.time.value = t;
    this.poses.waterPhase = waterVisible(metres) ? this.time.value : null;
    for (const { station, cloth, group } of this.scarves) {
      group.visible = Math.abs(metres - station) < 200;
      if (!group.visible) continue;
      const pos = cloth.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        pos.setZ(i, 0.13 * Math.sin(t * 4.6 + x * 4 + station) + 0.07 * Math.cos(t * 3 + x * 6));
      }
      pos.needsUpdate = true;
      group.rotation.z = 0.12 * Math.sin(t * 3.2 + station);
      if (station === 23991) this.poses.scarfTip = pos.getZ(0);
    }
    for (const [i, r] of this.cyclists.entries()) {
      r.group.visible = metres < 7400 || (metres > 19000 && metres < 23900);
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
      const height = at === 6310 ? 3.7 : 2.35;
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
