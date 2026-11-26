import {
  Color,
  DoubleSide,
  Group,
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
const views = [
  [120, 165, 0, 5],
  [2310, 2339, 0.4, 1.1],
  [4770, 4830, -310, -4],
  [6950, 7075, -350, 20],
  [9420, 9460, -425, -17],
  [11920, 11999, 11, 10],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
type Riders = Awaited<ReturnType<typeof caribanaCyclists>>;

export class MarinHeadlands {
  readonly root = new Group();
  readonly materials = {
    MarinInversion: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    RedwoodBark: new MeshBasicMaterial({ side: DoubleSide }),
    GardnerLookout: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    MuirRedwoods: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    BayHorizon: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    StinsonShore: new MeshBasicNodeMaterial({ side: DoubleSide, fog: false }),
    MarinSigns: new MeshBasicMaterial({ side: DoubleSide }),
    MarinRidge: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PanoramicRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    Inversion: new MeshBasicNodeMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    }),
  };
  private readonly club: SceneRider[] = [];
  private readonly time = uniform(0);
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    clubCrank: null as number | null,
    fogDrift: null as number | null,
    surfTravel: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader(),
      plain = new MeshStandardMaterial({ color: 0xffffff, vertexColors: true });
    const results = await Promise.allSettled(
      [
        'tamalpais-redwoods',
        'tamalpais-bay',
        'tamalpais-stinson',
        'tamalpais-trail',
        'tamalpais-grass',
        'galibier-tarmac',
        'galibier-cloud',
        'tamalpais-bark',
        'tamalpais-lookout',
        'tamalpais-inversion',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      failure = results.find((r) => r.status === 'rejected');
    try {
      if (failure) throw failure.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new MarinHeadlands(course, maps, kit, plain);
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
    this.materials.MuirRedwoods.map = maps[0]!;
    this.materials.BayHorizon.map = maps[1]!;
    this.materials.MarinSigns.map = maps[3]!;
    for (const m of maps.slice(4)) m.wrapS = m.wrapT = RepeatWrapping;
    this.materials.MarinInversion.colorNode = texture(
      maps[9]!,
      uv().add(vec2(sin(this.time.mul(0.047)).mul(0.003), 0)),
    ).rgb;
    this.materials.RedwoodBark.map = maps[7]!;
    this.materials.GardnerLookout.map = maps[8]!;
    const xy = positionWorld.xz,
      alt = smoothstep(300, 455, positionWorld.y);
    const soil = texture(maps[4]!, xy.mul(0.21)).rgb;
    this.materials.MarinRidge.colorNode = mix(soil.mul(color(0x83916b)), soil, alt);
    const canopy = sin(xy.x.mul(0.325).add(sin(xy.y.mul(0.64))))
      .mul(sin(xy.y.mul(0.41)))
      .mul(0.5)
      .add(0.5);
    const light = mix(smoothstep(0.34, 0.79, canopy).mul(0.53).add(0.32), uniform(0.84), alt);
    this.materials.PanoramicRoad.colorNode = texture(maps[5]!, xy.mul(0.22)).rgb.mul(light);
    const cloud = texture(
      maps[6]!,
      xy.mul(0.0038).add(vec2(this.time.mul(0.016), this.time.mul(0.005))),
    );
    const edges = sin(uv().x.mul(Math.PI)).mul(sin(uv().y.mul(Math.PI)));
    this.materials.Inversion.colorNode = mix(color(0xabbac4), color(0xfff3df), cloud.r);
    this.materials.Inversion.opacityNode = smoothstep(0.05, 0.48, cloud.r).mul(edges).mul(0.87);
    const beach = texture(maps[2]!, uv()),
      surf = smoothstep(0.4, 0.76, beach.r).mul(smoothstep(0.4, 0.75, beach.b));
    const line = sin(uv().x.mul(165).add(uv().y.mul(288)).add(this.time.mul(2.3)));
    this.materials.StinsonShore.colorNode = mix(
      beach.rgb,
      color(0xfffaf0),
      surf.mul(smoothstep(0.65, 1, line)).mul(0.3),
    );
    for (const [i, jersey] of [0xc86c42, 0x40858e, 0xd7b146, 0x506b9c].entries()) {
      const rider = kit.make(new Color(jersey), i + 5);
      rider.setCastShadow(false);
      this.club.push(rider);
      this.root.add(rider.group);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.poses.fogDrift = metres > 3650 && metres < 8100 ? t * 0.016 : null;
    this.poses.surfTravel = Math.abs(metres - 9420) < 480 ? t * 2.3 : null;
    this.poses.clubCrank = null;
    for (const [i, r] of this.club.entries()) {
      r.group.visible = metres > 1850 && metres < 2790;
      if (!r.group.visible) continue;
      const d = metres + 11 + i * 2.7 + 1.8 * Math.sin(t * 0.23 + i * 0.18);
      const p = this.course.place(d, 1.14 + (i % 2) * 0.78, this.point);
      r.group.position.set(p.x, p.y + 0.06, p.z);
      r.group.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      const angle = t * (7.35 + i * 0.11) + i * 1.9;
      r.pose(angle, 0.035 * Math.sin(t * 1.4 + i), 0.17 + 0.075 * Math.sin(t * 0.61 + i));
      if (i === 0) this.poses.clubCrank = angle;
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
        w = Math.min(1, (50 - gap) / 10);
      const back = at === 6950 ? 7.3 : 4.8;
      camera.x += (r.x - (back * dx) / len - camera.x) * w;
      camera.z += (r.z - (back * dz) / len - camera.z) * w;
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
    for (const item of [...Object.values(this.materials), ...this.maps]) item.dispose();
  }
}
