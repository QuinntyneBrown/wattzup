import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
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
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
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
} from 'three/tsl';
import { caribanaCyclists, type SceneRider } from './caribana-cyclists';
import type { Course, CoursePlace } from './course';
type Riders = Awaited<ReturnType<typeof caribanaCyclists>>;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 169, -3.7, 1.5],
  [2340, 2390, -135, -19],
  [4610, 4643, -18, -0.1],
  [6550, 6550, 104, -16],
  [8460, 8493, 1.5, 1.8],
  [10690, 10734, 26, 7.7],
] as const;
export class ValTremola {
  readonly root = new Group();
  readonly materials: Record<
    string,
    MeshBasicMaterial | MeshBasicNodeMaterial | MeshStandardMaterial
  >;
  private readonly geo = new Set<BufferGeometry>();
  private readonly local: MeshBasicMaterial[] = [];
  private readonly time = uniform(0);
  private readonly bus = new Group();
  private readonly tourer = new Group();
  private readonly cyclists: SceneRider[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    busTravel: null as number | null,
    tourerTravel: null as number | null,
    pedalAngle: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const plain = new MeshStandardMaterial({ color: 0xffffff });
    const res = await Promise.allSettled(
      [
        'setts',
        'granite',
        'valley',
        'hospice',
        'riders',
        'postauto',
        'tourer',
        'alpine-turf',
        'sign',
        'bus-front',
        'car-front',
      ].map((n) => loader.loadAsync('courses/tremola-' + n + '.webp')),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = res.find((r) => r.status === 'rejected');
    try {
      if (err) throw err.reason;
      const kit = await caribanaCyclists(plain, low);
      try {
        return new ValTremola(course, maps, kit, plain);
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
    const [setts, granite, sky, homes, riders, bus, car, grass, sign, busFront, carFront] = maps;
    for (const map of [setts!, granite!, grass!]) map.wrapS = map.wrapT = RepeatWrapping;
    const turf = new MeshBasicNodeMaterial({ side: DoubleSide });
    const xz = positionWorld.xz;
    const pasture = texture(grass!, xz.mul(0.147)).rgb,
      stone = texture(granite!, xz.mul(0.09)).rgb;
    const exposed = smoothstep(
      0.16,
      0.71,
      normalWorld.y
        .abs()
        .oneMinus()
        .add(sin(xz.x.mul(0.029)).mul(0.18)),
    );
    turf.colorNode = mix(pasture, stone, exposed);
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ripple = sin(xz.x.mul(0.57).add(xz.y.mul(0.83)).add(this.time.mul(1.9))).add(
      sin(xz.y.mul(0.46).sub(this.time.mul(1.51))),
    );
    water.colorNode = mix(color(0x456f74), color(0x8ca4a0), ripple.mul(0.2).add(0.52)).add(
      color(0xe4ece6)
        .mul(smoothstep(1.76, 1.96, ripple))
        .mul(0.47),
    );
    this.materials = {
      FanSetts: new MeshStandardMaterial({
        map: setts,
        bumpMap: setts,
        bumpScale: 0.026,
        emissiveMap: setts,
        emissive: 0xbfbdb3,
        emissiveIntensity: 0.61,
        roughness: 0.86,
        side: DoubleSide,
      }),
      TerraceStone: new MeshStandardMaterial({
        map: granite,
        bumpMap: granite,
        bumpScale: 0.058,
        roughness: 1,
        emissiveMap: granite,
        emissive: 0xada999,
        emissiveIntensity: 0.42,
        side: DoubleSide,
      }),
      AlpineGraniteTurf: turf,
      TicinoWater: water,
      GotthardHospice: new MeshBasicMaterial({ map: homes, side: DoubleSide }),
      GotthardVisitors: new MeshBasicMaterial({ map: riders, side: DoubleSide, alphaTest: 0.47 }),
      LeventinaSky: new MeshBasicMaterial({ map: sky, side: DoubleSide, fog: false }),
      TremolaSigns: new MeshBasicMaterial({ map: sign, side: DoubleSide }),
    };
    const unit = new BoxGeometry();
    this.geo.add(unit);
    const paint = (hex: number) => {
      const m = new MeshBasicMaterial({ color: hex, side: DoubleSide });
      this.local.push(m);
      return m;
    };
    const black = paint(0x404449),
      gold = paint(0xe0a52f),
      red = paint(0x833d41),
      silver = paint(0xb3b1a9),
      glass = paint(0x768590);
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
    const skin = (g: Group, map: Texture, l: number, h: number, w: number, front: Texture) => {
      const mat = new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: 0.44 });
      this.local.push(mat);
      const geo = new PlaneGeometry(l, h);
      const uv = geo.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
      this.geo.add(geo);
      for (const s of [-1, 1]) {
        const m = new Mesh(geo, mat);
        m.rotation.y = (s * Math.PI) / 2;
        m.position.set(s * w * 0.5, h * 0.5, 0);
        g.add(m);
      }
      const noseGeometry = new PlaneGeometry(w, h);
      const noseUv = noseGeometry.getAttribute('uv');
      for (let i = 0; i < noseUv.count; i++) noseUv.setY(i, 1 - noseUv.getY(i));
      this.geo.add(noseGeometry);
      const noseMaterial = new MeshBasicMaterial({ map: front, side: DoubleSide, alphaTest: 0.44 });
      this.local.push(noseMaterial);
      const nose = new Mesh(noseGeometry, noseMaterial);
      nose.position.set(0, h / 2, -l / 2);
      g.add(nose);
    };
    box(this.bus, 0, 1.47, 0, 2.29, 1.98, 8.91, gold);
    box(this.bus, 0, 2.51, 0.28, 2.24, 0.2, 8.38, gold);
    for (const s of [-1, 1]) {
      box(this.bus, 0, 1.93, s * 4.48, 2.18, 0.83, 0.11, glass);
      box(this.bus, 0, 0.58, s * 4.5, 2.31, 0.15, 0.12, silver);
      for (const x of [-0.89, 0.89]) box(this.bus, x, 0.91, s * 4.53, 0.22, 0.16, 0.1, silver);
    }
    skin(this.bus, bus!, 9.53, 2.94, 2.42, busFront!);
    box(this.tourer, 0, 0.67, 0, 1.66, 0.68, 4.32, red);
    box(this.tourer, 0, 1.13, 0.22, 1.43, 0.53, 2.29, glass);
    box(this.tourer, 0, 1.43, 0.22, 1.43, 0.11, 2.16, red);
    box(this.tourer, 0, 0.52, -2.19, 1.71, 0.13, 0.12, silver);
    box(this.tourer, 0, 0.55, 2.19, 1.71, 0.11, 0.12, black);
    skin(this.tourer, car!, 4.59, 1.57, 1.79, carFront!);
    this.root.add(this.bus, this.tourer);
    for (const [i, hex] of [0xb64d40, 0x475f92].entries()) {
      const r = kit.make(new Color(hex), i + 5);
      r.setCastShadow(false);
      this.root.add(r.group);
      this.cyclists.push(r);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.bus.visible = Math.abs(metres - 8460) < 370;
    this.tourer.visible = Math.abs(metres - 8390) < 430;
    if (this.bus.visible) {
      const p = this.course.place(8496 + 13 * Math.sin(t * 0.12), 1.56, this.point);
      this.bus.position.set(p.x, p.y + 0.096, p.z);
      this.bus.rotation.set(-p.pitch, p.heading + Math.PI, 0, 'YXZ');
      this.poses.busTravel = this.bus.position.x;
    }
    if (this.tourer.visible) {
      const p = this.course.place(8388 + 18 * Math.sin(t * 0.093), 1.48, this.point);
      this.tourer.position.set(p.x, p.y + 0.1, p.z);
      this.tourer.rotation.set(-p.pitch, p.heading + Math.PI, 0, 'YXZ');
      this.poses.tourerTravel = this.tourer.position.x;
    }
    for (const [i, r] of this.cyclists.entries()) {
      r.group.visible = metres < 625 || Math.abs(metres - 8525) < 350;
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
      const height = at === 6550 ? 8 : at === 2340 ? 5 : 2.35;
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
