import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  CylinderGeometry,
  AdditiveBlending,
} from 'three/webgpu';
import type { BufferGeometry, Texture, Vector3 } from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, uniform } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [140, 177, 9.8, 19],
  [1720, 1760, -52, 2],
  [3380, 3413, -6.6, 2.1],
  [5160, 5208, -53, 6],
  [7180, 7210, -410, 108],
  [9180, 9240, -340, 94],
] as const;
export class VictoriaWaterfront {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: (MeshBasicMaterial | MeshBasicNodeMaterial)[] = [];
  private readonly time = uniform(0);
  private readonly ferry = new Group();
  private readonly junk = new Group();
  private readonly freighter = new Group();
  private readonly tug = new Group();
  private readonly beams: Group[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    ferryTravel: null as number | null,
    junkTravel: null as number | null,
    beamAngle: null as number | null,
  };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['skyline', 'windows', 'fronts', 'plaques', 'visitors', 'ferry', 'junk'].map((k) =>
        loader.loadAsync('courses/victoria-' + k + '.webp'),
      ),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new VictoriaWaterfront(course, maps, low);
    } catch (e) {
      for (const m of maps) m.dispose();
      throw e;
    }
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
    low: boolean,
  ) {
    const [sky, windows, fronts, plaques, visitors, ferry, junk] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    const xz = positionWorld.xz;
    const tiles = new MeshBasicNodeMaterial({ side: DoubleSide });
    const u = xz.x.mul(0.82).fract(),
      v = xz.y.mul(1.65).add(xz.x.mul(0.82).floor().mod(2).mul(0.5)).fract();
    const joint = smoothstep(0.008, 0.031, u.min(v));
    tiles.colorNode = mix(
      color(0x40414d),
      mix(
        color(0x787782),
        color(0x9d9291),
        sin(xz.x.mul(0.17).add(xz.y.mul(0.12)))
          .mul(0.5)
          .add(0.5),
      ),
      joint,
    );
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const travel = xz.y.mul(1.37).add(this.time.mul(0.9));
    const rip = sin(travel.add(sin(xz.x.mul(0.47).add(this.time.mul(0.39))).mul(1.61)))
      .mul(0.5)
      .add(0.5);
    const lanes = sin(
      xz.x
        .mul(0.076)
        .add(sin(xz.y.mul(0.052)))
        .add(rip.mul(0.53)),
    )
      .mul(0.5)
      .add(0.5);
    const glow = mix(color(0xde8f56), color(0x7ebcb8), sin(xz.x.mul(0.093)).mul(0.5).add(0.5));
    water.colorNode = mix(color(0x243347), glow, rip.pow(5).mul(lanes.pow(3)).mul(0.87));
    const flat = (map: Texture) => new MeshBasicMaterial({ map, side: DoubleSide });
    this.materials = {
      KowloonTiles: tiles,
      HarbourGround: new MeshBasicMaterial({ color: 0x46424a, side: DoubleSide }),
      VictoriaWater: water,
      KowloonFronts: flat(fronts!),
      CentralWindows: flat(windows!),
      StarPlaques: flat(plaques!),
      HarbourVisitors: new MeshBasicMaterial({ map: visitors, alphaTest: 0.52, side: DoubleSide }),
      VictoriaPeak: new MeshBasicMaterial({ map: sky, side: DoubleSide, fog: false }),
    };
    const block = new BoxGeometry();
    this.geometries.push(block);
    const mat = (c: number) => {
      const m = new MeshBasicMaterial({ color: c });
      this.paint.push(m);
      return m;
    };
    const cream = mat(0xd9ceb0),
      green = mat(0x3b6455),
      hull = mat(0x302f32);
    const bar = (
      g: Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      m: MeshBasicMaterial,
    ) => {
      const mesh = new Mesh(block, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, l);
      g.add(mesh);
      return mesh;
    };
    const skin = (g: Group, map: Texture, length: number, height: number, width: number) => {
      const geo = new PlaneGeometry(length, height);
      const uv = geo.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
      this.geometries.push(geo);
      const paint = new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: 0.48 });
      this.paint.push(paint);
      for (const side of [-1, 1]) {
        const sheet = new Mesh(geo, paint);
        sheet.position.set(0, height / 2, (side * width) / 2);
        g.add(sheet);
      }
    };
    bar(this.ferry, 0, 0.72, 0, 25.8, 1.32, 5.5, green);
    bar(this.ferry, 0, 2.53, 0, 22.8, 0.3, 5.6, cream);
    bar(this.ferry, 0, 4.13, 0, 21.6, 0.28, 5.47, cream);
    skin(this.ferry, ferry!, 29, 6.9, 6.2);
    bar(this.junk, 0, 0.69, 0, 16.2, 1.2, 3.62, hull);
    skin(this.junk, junk!, 19.8, 14.2, 3.9);
    bar(this.freighter, 0, 1.84, 0, 77, 3.6, 12, hull);
    bar(this.freighter, -28, 6.03, 0, 9.6, 7.3, 10.7, cream);
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 2; j++) {
        const tone = [0x7d584d, 0x586c72, 0x71645a][(i + j) % 3]!;
        bar(this.freighter, -18 + i * 7, 4.7 + j * 2.5, 0, 6.72, 2.38, 9.4, mat(tone));
      }
    bar(this.tug, 0, 0.61, 0, 11.6, 1.1, 4.1, hull);
    bar(this.tug, -0.8, 1.85, 0, 4, 2.36, 3.3, cream);
    this.root.add(this.ferry, this.junk, this.freighter, this.tug);
    // A shared tapered translucent geometry is anchored to each emitting rooftop.
    const shaft = new CylinderGeometry(0.24, 2.1, 240, 5, 1, true);
    shaft.translate(0, 120, 0);
    this.geometries.push(shaft);
    const sites = [
      [7010, -610, 296],
      [7210, -576, 226],
      [7920, -660, 237],
      [8900, -610, 202],
      [9210, -649, 206],
    ];
    for (const [i, [d, lane, height]] of sites.entries()) {
      const p = course.place(d!, lane!, this.point);
      const emitter = new Group();
      emitter.position.set(p.x, p.y + height!, p.z);
      const m = new MeshBasicMaterial({
        color: [0x88dfbd, 0xa5bcec, 0xe8a3cc][i % 3],
        transparent: true,
        opacity: 0.37,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      });
      this.paint.push(m);
      emitter.add(new Mesh(shaft, m));
      this.root.add(emitter);
      this.beams.push(emitter);
    }
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    const boat = (g: Group, d: number, side: number, yaw: number) => {
      const p = this.course.place(d, -side, this.point);
      g.position.set(p.x, p.y - 4.63 + 0.11 * Math.sin(t * 0.8 + d * 0.01), p.z);
      g.rotation.set(
        0.012 * Math.cos(t * 0.63),
        p.heading + Math.PI / 2 + yaw,
        0.012 * Math.sin(t * 0.75),
        'YXZ',
      );
    };
    boat(this.ferry, 1760 + 23 * Math.sin(t * 0.043), 49 + 12 * Math.sin(t * 0.039), 0.28);
    boat(this.junk, 5208 + 18 * Math.sin(t * 0.049), 48 + 5 * Math.cos(t * 0.055), -0.16);
    boat(this.freighter, 7280 + 110 * Math.sin(t * 0.012), 168 + 12 * Math.sin(t * 0.015), 0.03);
    boat(this.tug, 5310 + 36 * Math.cos(t * 0.073), 80, -0.18);
    this.poses.ferryTravel = this.ferry.position.x;
    this.poses.junkTravel = this.junk.position.x;
    for (const [i, emitter] of this.beams.entries()) {
      emitter.rotation.z = 0.37 * Math.sin(t * 0.28 + i * 1.36);
      emitter.rotation.x = 0.24 * Math.cos(t * 0.23 + i);
    }
    this.poses.beamAngle = this.beams[4]!.rotation.z;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 48) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (48 - gap) / 24);
      camera.x += (r.x - (4.9 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.9 * dz) / len - camera.z) * w;
      const height = at === 7180 ? 3.1 : 2.54;
      camera.y += (r.y + height - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y +=
        (r.y + height - 0.79 + (18.9 * (p.y + lift - r.y - height)) / (len + 4.9) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    for (const m of [
      ...this.maps,
      ...this.geometries,
      ...this.paint,
      ...Object.values(this.materials),
    ])
      m.dispose();
  }
}
