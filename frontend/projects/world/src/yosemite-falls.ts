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
  SphereGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  RepeatWrapping,
} from 'three/webgpu';
import type { BufferGeometry, Texture } from 'three/webgpu';
import {
  color,
  mix,
  normalWorld,
  positionWorld,
  sin,
  texture,
  uniform,
  uv,
  smoothstep,
} from 'three/tsl';
import type { Course, CoursePlace } from './course';
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

const views = [
  [140, 168, 0, 2],
  [2900, 3290, -1100, 410],
  [4820, 4860, 206, 65],
  [6910, 6955, 48, 0.3],
  [9640, 9700, -244, 112],
  [12740, 12950, -1300, 345],
] as const;
export class YosemiteFalls {
  readonly root = new Group();
  readonly materials: Record<string, MeshBasicNodeMaterial | MeshBasicMaterial>;
  private readonly geometries: BufferGeometry[] = [];
  private readonly paint: (MeshBasicMaterial | MeshBasicNodeMaterial)[] = [];
  private readonly point = place();
  private readonly target = place();
  private readonly time = uniform(0);
  private readonly shuttle = new Group();
  private readonly ribbons: { geometry: PlaneGeometry; local: Float32Array; bridal: boolean }[] =
    [];
  private readonly mist: InstancedMesh;
  private readonly matrix = new Matrix4();
  private readonly v = new Vector3();
  private readonly q = new Quaternion();
  private readonly size = new Vector3();
  private readonly poses = { shuttleTravel: 0, veilBend: 0, waterTravel: 0 };
  static async load(course: Course, low: boolean) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      ['granite', 'trees', 'shuttle', 'signs', 'visitors'].map((k) =>
        loader.loadAsync('courses/yosemite-' + k + '.webp'),
      ),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    try {
      const e = result.find((r) => r.status === 'rejected');
      if (e) throw e.reason;
      return new YosemiteFalls(course, maps, low);
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
    const [granite, trees, shuttle, signs, visitors] = maps;
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
      m.anisotropy = low ? 2 : 4;
    }
    granite!.wrapS = granite!.wrapT = RepeatWrapping;
    const xz = positionWorld.xz;
    const meadow = new MeshBasicNodeMaterial({ side: DoubleSide });
    meadow.colorNode = mix(
      color(0x888e53),
      color(0xb6ae72),
      sin(xz.x.mul(0.075).add(sin(xz.y.mul(0.16))))
        .mul(0.34)
        .add(0.5),
    );
    const road = new MeshBasicNodeMaterial({ side: DoubleSide });
    const shade = sin(xz.x.mul(0.14).add(sin(xz.y.mul(0.38))))
      .mul(0.5)
      .add(0.5)
      .pow(3);
    road.colorNode = mix(
      color(0x65686b),
      color(0x8d8c82),
      shade.mul(0.34).add(texture(granite!, xz.mul(0.34)).r.mul(0.28)),
    );
    // Dapple the pavement with overlapping canopy shapes in fixed metre-scale coordinates.
    const canopy = sin(xz.x.mul(0.24).add(sin(xz.y.mul(0.72))))
      .add(sin(xz.y.mul(0.53).add(xz.x.mul(0.1))))
      .add(sin(xz.x.mul(1.45).sub(xz.y.mul(0.8))).mul(0.35));
    const openMeadow = smoothstep(2100, 2600, xz.x);
    road.colorNode = road.colorNode.mul(
      mix(1, 0.62, smoothstep(0.12, 0.8, canopy).mul(openMeadow.oneMinus())),
    );
    const cliff = new MeshBasicNodeMaterial({ side: DoubleSide });
    const east = smoothstep(10800, 12100, xz.x);
    const faceLight = normalWorld.x.mul(0.25).add(normalWorld.y.mul(0.24)).add(0.73);
    const rockGrain = texture(granite!, uv()).rgb;
    cliff.colorNode = rockGrain.mul(faceLight).mul(mix(color(0xbdc8cd), color(0xffcb97), east));
    const water = new MeshBasicNodeMaterial({ side: DoubleSide });
    const ripple = sin(
      xz.x
        .mul(0.56)
        .add(this.time.mul(0.81))
        .add(sin(xz.y.mul(0.46))),
    )
      .mul(0.5)
      .add(0.5);
    water.colorNode = mix(color(0x376c63), color(0x9fb3a1), ripple.pow(6).mul(0.42));
    const flat = (map: Texture, alphaTest = 0.45) =>
      new MeshBasicMaterial({ map, alphaTest, side: DoubleSide });
    this.materials = {
      NorthsideAsphalt: road,
      ValleyMeadow: meadow,
      SierraGranite: cliff,
      YosemiteTrees: flat(trees!),
      ParkSigns: flat(signs!),
      ParkVisitors: flat(visitors!, 0.9),
      MercedWater: water,
    };
    const cube = new BoxGeometry();
    this.geometries.push(cube);
    const paint = (hex: number) => {
      const m = new MeshBasicMaterial({ color: hex });
      this.paint.push(m);
      return m;
    };
    const cream = paint(0xe7e5cf),
      green = paint(0x42735c),
      glass = paint(0x546366),
      light = paint(0xffe7b2);
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      m: MeshBasicMaterial,
    ) => {
      const b = new Mesh(cube, m);
      b.position.set(x, y, z);
      b.scale.set(w, h, l);
      this.shuttle.add(b);
    };
    box(0, 0.87, 0, 2.49, 0.96, 10.9, green);
    box(0, 1.71, 0, 2.48, 0.75, 10.85, cream);
    box(0, 2.38, 0, 2.4, 0.96, 10.85, glass);
    box(0, 2.92, 0, 2.42, 0.21, 10.7, cream);
    for (const sign of [-1, 1]) box(sign * 0.87, 0.97, -5.48, 0.36, 0.18, 0.08, light);
    const side = new PlaneGeometry(11.7, 3.73);
    const tex = side.getAttribute('uv');
    for (let j = 0; j < tex.count; j++) tex.setY(j, 1 - tex.getY(j));
    this.geometries.push(side);
    const shell = flat(shuttle!);
    this.paint.push(shell);
    for (const sign of [-1, 1]) {
      const m = new Mesh(side, shell);
      m.rotation.y = (sign * Math.PI) / 2;
      m.position.set(sign * 1.26, 1.75, 0);
      this.shuttle.add(m);
    }
    this.root.add(this.shuttle);
    const sheet = new MeshBasicNodeMaterial({
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });
    const u = uv().x,
      v = uv().y;
    const stream = sin(u.mul(47).add(sin(v.mul(15).add(this.time.mul(2.4)))))
      .mul(0.5)
      .add(0.5);
    sheet.colorNode = mix(color(0xb6e1eb), color(0xffffff), stream);
    sheet.opacityNode = smoothstep(0, 0.15, u.min(u.oneMinus())).mul(stream.mul(0.19).add(0.79));
    this.paint.push(sheet);
    for (const [d, lane, y, w, h, bridal] of [
      [4860, 181, 76, 14, 147, true],
      [9700, -264, 233, 19, 170, false],
      [9700, -201, 44, 15, 84, false],
    ] as const) {
      const geom = new PlaneGeometry(w, h, 5, 24),
        mesh = new Mesh(geom, sheet),
        p = course.place(d, lane, this.point);
      mesh.frustumCulled = false;
      mesh.position.set(p.x, p.y + y, p.z);
      mesh.rotation.y = Math.PI / 2 + p.heading;
      this.geometries.push(geom);
      this.root.add(mesh);
      this.ribbons.push({
        geometry: geom,
        local: new Float32Array(geom.getAttribute('position').array),
        bridal,
      });
    }
    const geo = new SphereGeometry(1, 8, 5);
    this.geometries.push(geo);
    const fog = new MeshBasicMaterial({
      color: 0xe5ede8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.paint.push(fog);
    this.mist = new InstancedMesh(geo, fog, 18);
    this.mist.frustumCulled = false;
    this.root.add(this.mist);
    this.update(0, 0);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    const d = 149 + t * 3.3;
    const p = this.course.place(d, 2.12, this.point);
    this.shuttle.position.set(p.x, p.y + 0.075, p.z);
    this.shuttle.rotation.set(p.pitch, p.heading, 0, 'YXZ');
    this.shuttle.visible = d < this.course.length && Math.abs(d - metres) < 300;
    this.poses.shuttleTravel = d;
    for (const r of this.ribbons) {
      const p = r.geometry.getAttribute('position'),
        height = r.geometry.parameters.height;
      for (let i = 0; i < p.count; i++) {
        const x = r.local[i * 3]!,
          y = r.local[i * 3 + 1]!,
          fall = 0.5 - y / height;
        p.setX(i, x + (r.bridal ? 8.6 : 1.9) * fall * Math.sin(t * 0.9 + fall * 4.3));
        p.setZ(i, fall * (r.bridal ? 13 : 8) + 0.74 * Math.sin(fall * 18 + t * 3.5));
      }
      p.needsUpdate = true;
      if (r.bridal) this.poses.veilBend = p.getX(p.count - 1);
    }
    for (let i = 0; i < 18; i++) {
      const bridal = i < 7,
        age = (t * 0.26 + i * 0.157) % 1,
        anchor = this.course.place(bridal ? 4860 : 9700, bridal ? 181 : -201, this.point);
      this.v.set(
        anchor.x + Math.sin(i * 2.64) * 8 + age * 8,
        anchor.y + 1.2 + age * 11,
        anchor.z + Math.cos(i * 1.83) * 7,
      );
      this.size.set(2.4 + age * 4.4, 1.5 + age * 3.2, 2.7 + age * 3.4);
      this.mist.setMatrixAt(i, this.matrix.compose(this.v, this.q, this.size));
    }
    this.mist.instanceMatrix.needsUpdate = true;
    this.poses.waterTravel = this.time.value;
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
      const back = 5.0;
      camera.x += (r.x - (back * dx) / len - camera.x) * w;
      camera.z += (r.z - (back * dz) / len - camera.z) * w;
      const height = 2.65;
      camera.y += (r.y + height - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y +=
        (r.y +
          height -
          0.79 +
          ((14 + back) * (p.y + lift - r.y - height)) / (len + back) -
          ahead.y) *
        w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.mist.dispose();
    for (const m of [
      ...this.maps,
      ...this.geometries,
      ...this.paint,
      ...Object.values(this.materials),
    ])
      m.dispose();
  }
}
