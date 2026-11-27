import type { BufferGeometry, Vector3, Texture } from 'three/webgpu';
import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
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
  uv,
} from 'three/tsl';
import type { Course, CoursePlace } from './course';

const views = [
  [140, 188, 0, 3],
  [2450, 2490, 95, -2],
  [4980, 5060, 33, 10],
  [7280, 7312, 1, 1.7],
  [9450, 9488, -65, 23],
  [11780, 11816, 24, 6],
] as const;

export class TrollstigenPass {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicMaterial | MeshBasicNodeMaterial>;
  private readonly time = uniform(0);
  private readonly geometries: BufferGeometry[] = [];
  private readonly paints: MeshBasicMaterial[] = [];
  private readonly vehicles: Group[] = [];
  private readonly point: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly target = { ...this.point };
  private readonly poses = {
    camperTravel: null as number | null,
    waterPhase: null as number | null,
    cloudTravel: null as number | null,
  };

  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const loaded = await Promise.allSettled(
      [
        'heath',
        'granite',
        'peaks',
        'cascade',
        'visitors',
        'camper',
        'wagon',
        'motorbike',
        'camper-front',
        'wagon-front',
        'motorbike-front',
      ].map((name) => loader.loadAsync('courses/trollstigen-' + name + '.webp')),
    );
    const maps = loaded.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const error = loaded.find((r) => r.status === 'rejected');
      if (error) throw error.reason;
      return new TrollstigenPass(course, maps, low);
    } catch (error) {
      for (const map of maps) map.dispose();
      throw error;
    }
  }

  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
    low: boolean,
  ) {
    for (const map of maps) {
      map.flipY = false;
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = low ? 2 : 4;
    }
    const [heath, granite, peaks, fall, visitors, ...traffic] = maps;
    for (const map of [heath!, granite!]) map.wrapS = map.wrapT = RepeatWrapping;
    const xz = positionWorld.xz;
    const stone = texture(granite!, xz.mul(0.075)).rgb.mul(
      sin(xz.x.mul(0.021).add(xz.y.mul(0.034)))
        .mul(0.17)
        .add(0.87),
    );
    const moss = mix(
      texture(heath!, xz.mul(0.12)).rgb,
      color(0x667745),
      sin(xz.x.mul(0.012)).mul(0.15).add(0.39),
    );
    const slope = new MeshBasicNodeMaterial({ side: DoubleSide });
    slope.colorNode = mix(
      moss,
      stone,
      smoothstep(
        0.13,
        0.68,
        normalWorld.y
          .abs()
          .oneMinus()
          .add(sin(xz.x.mul(0.032)).mul(0.15)),
      ),
    );
    const floor = new MeshBasicNodeMaterial({ side: DoubleSide });
    floor.colorNode = mix(
      color(0x42494b),
      color(0x656867),
      texture(granite!, xz.mul(0.54)).r.mul(3.2),
    );
    const cascade = new MeshBasicNodeMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    });
    const sample = texture(fall!, uv());
    const flow = sin(
      uv()
        .y.mul(141)
        .sub(this.time.mul(5.7))
        .add(sin(uv().x.mul(15))),
    );
    cascade.colorNode = sample.rgb.mul(flow.mul(0.17).add(0.98));
    cascade.opacityNode = sample.a;
    const sky = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
    const cloud = sin(uv().x.mul(18).add(this.time.mul(0.037))).add(
      sin(uv().x.mul(44).sub(this.time.mul(0.021)).add(uv().y.mul(5))),
    );
    sky.colorNode = mix(
      texture(peaks!, uv()).rgb,
      color(0xbac4c7),
      smoothstep(-0.96, 1.38, cloud)
        .mul(smoothstep(0.42, 0.77, uv().y.oneMinus()))
        .mul(0.35),
    );
    this.materials = {
      RaumaAsphalt: floor,
      RaumaSlope: slope,
      RaumaPeaks: sky,
      Stigfossen: cascade,
      RaumaGranite: new MeshBasicMaterial({ map: granite, side: DoubleSide }),
      RaumaVisitors: new MeshBasicMaterial({ map: visitors, side: DoubleSide, alphaTest: 0.42 }),
    };
    const block = new BoxGeometry();
    this.geometries.push(block);
    const dimensions = [
      [5.9, 2.68, 2.18],
      [4.55, 1.52, 1.74],
      [2.09, 1.43, 0.63],
    ];
    for (const [i, map] of traffic.slice(0, 3).entries()) {
      const group = new Group(),
        [length, height, width] = dimensions[i]!;
      const body = new MeshBasicMaterial({ color: [0xcacac4, 0x39576a, 0x353838][i] });
      const image = new MeshBasicMaterial({ map, alphaTest: 0.44, side: DoubleSide });
      const glass = new MeshBasicMaterial({ color: 0x63757d });
      this.paints.push(body, image, glass);
      const core = new Mesh(block, body);
      core.scale.set(width! * 0.91, height! * 0.5, length! * 0.89);
      core.position.y = height! * 0.51;
      group.add(core);
      const cab = new Mesh(block, glass);
      cab.scale.set(width! * 0.87, height! * 0.28, length! * (i === 0 ? 0.87 : 0.5));
      cab.position.y = height! * 0.77;
      group.add(cab);
      const side = new PlaneGeometry(length!, height!);
      this.geometries.push(side);
      const front = new PlaneGeometry(width!, height!);
      this.geometries.push(front);
      const frontUv = front.getAttribute('uv');
      for (let n = 0; n < frontUv.count; n++) {
        frontUv.setX(n, 1 - frontUv.getX(n));
        frontUv.setY(n, 1 - frontUv.getY(n));
      }
      const trim = new MeshBasicMaterial({
        map: this.maps[8 + i],
        side: DoubleSide,
        alphaTest: 0.43,
      });
      this.paints.push(trim);
      const nose = new Mesh(front, trim);
      nose.position.set(0, height! * 0.5, -length! * 0.5);
      group.add(nose);
      const coords = side.getAttribute('uv');
      for (let v = 0; v < coords.count; v++) coords.setY(v, 1 - coords.getY(v));
      for (const dir of [-1, 1]) {
        const mesh = new Mesh(side, image);
        mesh.position.set(dir * width! * 0.5, height! * 0.5, 0);
        mesh.rotation.y = (dir * Math.PI) / 2;
        group.add(mesh);
      }
      this.vehicles.push(group);
      this.root.add(group);
    }
    this.update(0, 0);
  }

  update(metres: number, t: number) {
    this.time.value = t;
    this.poses.waterPhase = Math.abs(metres - 4980) < 480 ? t : null;
    this.poses.cloudTravel = t;
    for (const [i, g] of this.vehicles.entries()) {
      g.visible = Math.abs(metres - 7280) < 420;
      if (!g.visible) continue;
      const p = this.course.place(
        7306 + i * 10 + 12 * Math.sin(t * 0.1 + i * 0.05),
        1.2,
        this.point,
      );
      g.position.set(p.x, p.y + 0.1, p.z);
      g.rotation.set(-p.pitch, p.heading + Math.PI, 0, 'YXZ');
      if (i === 0) this.poses.camperTravel = g.position.x;
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(metres - at);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 25);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.4 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.6 + (18.8 * (p.y + lift - r.y - 2.4)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      ...this.geometries,
      ...this.paints,
      ...this.maps,
      ...Object.values(this.materials),
    ])
      item.dispose();
  }
}
