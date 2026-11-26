import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Object3D,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 108, -5.5, 1.9],
  [1330, 1360, -2.4, 2.0],
  [2860, 2918, -38, 2.1],
  [4490, 4544, -47, 1.7],
  [6560, 6599, -8, 2.25],
  [8490, 8524, 14, 2.05],
] as const;
function winterSwell() {
  const geo = new BufferGeometry(),
    xyz: number[] = [],
    rgb: number[] = [],
    idx: number[] = [];
  const cross = [
    [0, 0, 0x318e9a],
    [2.9, 0.5, 0x2698a4],
    [4.6, 1.9, 0x208793],
    [5.5, 3.3, 0x218b94],
    [6.1, 3.8, 0xa8dcd4],
    [7.3, 3.34, 0xe4f4e8],
    [7.85, 2.16, 0xd9eee5],
    [7.22, 2.21, 0x9ccbc2],
  ];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30,
      taper = Math.pow(Math.sin(Math.PI * u), 0.7);
    for (const [j, [x, y, tint]] of cross.entries()) {
      xyz.push(
        (x! - 4) * (0.53 + taper * 0.47) + 1.7 * Math.cos(u * 8),
        y! * taper * (1 + 0.1 * Math.sin(u * 13)),
        (u - 0.5) * 42,
      );
      const c = new Color(tint!);
      rgb.push(c.r, c.g, c.b);
      if (i > 0 && j > 0) {
        const n = i * cross.length + j,
          b = n - cross.length;
        idx.push(n, n - 1, b - 1, n, b - 1, b);
      }
    }
  }
  geo.setAttribute('position', new Float32BufferAttribute(xyz, 3));
  geo.setAttribute('color', new Float32BufferAttribute(rgb, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
export class NorthShoreSurf {
  readonly root = new Group();
  readonly materials = {
    KamHighway: new MeshBasicNodeMaterial({ side: DoubleSide }),
    NorthShoreSea: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ShoreFlora: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    HaleiwaFronts: new MeshBasicMaterial({ side: DoubleSide }),
    KahukuTruck: new MeshBasicMaterial({ side: DoubleSide }),
    NorthShoreSigns: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    KoolauRidges: new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
    OahuBreakers: new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
  };
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly tyre = new CylinderGeometry(1, 1, 1, 14);
  private readonly swellGeo = winterSwell();
  private readonly swellPaint = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  private readonly swell = new Mesh(this.swellGeo, this.swellPaint);
  private readonly surfer = new Group();
  private readonly customer = new Group();
  private readonly shoulders = new Group();
  private readonly legs = [new Group(), new Group()];
  private readonly dyes = new Map<number, MeshLambertMaterial>();
  private readonly p = point();
  private readonly t = point();
  private readonly shown = {
    waveCrest: null as number | null,
    surferStride: null as number | null,
    queueTurn: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['flora', 'shops', 'trucks', 'signs', 'ridges', 'breakers'].map((key) =>
        new TextureLoader().loadAsync('courses/northshore-' + key + '.webp'),
      ),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) {
      for (const t of textures) t.dispose();
      throw failed.reason;
    }
    return new NorthShoreSurf(course, textures);
  }
  private piece(
    group: Group,
    geo: BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
  ) {
    let paint = this.dyes.get(c);
    if (!paint) {
      paint = new MeshLambertMaterial({ color: c, side: DoubleSide });
      this.dyes.set(c, paint);
    }
    const m = new Mesh(geo, paint);
    m.position.set(x, y, z);
    m.scale.set(w, h, l);
    group.add(m);
    return m;
  }
  private stand(group: Object3D, d: number, off: number, up = 0) {
    const p = this.course.place(d, off, this.p);
    group.position.set(p.x, p.y + up, p.z);
    group.rotation.y = p.heading;
  }
  private torso(group: Group, shirt: number, skin: number) {
    this.piece(group, this.ball, shirt, 0, 1.15, 0, 0.245, 0.35, 0.175);
    this.piece(group, this.ball, skin, 0, 1.63, 0, 0.138, 0.17, 0.13);
    this.piece(group, this.ball, 0x46372b, 0, 1.74, 0.012, 0.14, 0.085, 0.137);
    for (const side of [-1, 1])
      this.piece(group, this.ball, skin, side * 0.24, 1.12, -0.045, 0.07, 0.24, 0.073).rotation.x =
        0.18;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [flora, shop, truck, signs, ridge, breaker] = textures;
    this.materials.ShoreFlora.map = flora!;
    this.materials.HaleiwaFronts.map = shop!;
    this.materials.KahukuTruck.map = truck!;
    this.materials.NorthShoreSigns.map = signs!;
    this.materials.KoolauRidges.map = ridge!;
    this.materials.OahuBreakers.map = breaker!;
    this.materials.KamHighway.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(68).add(positionWorld.z.mul(59)))
        .mul(0.053)
        .add(0.94),
    );
    this.materials.NorthShoreSea.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(2.7).add(sin(positionWorld.z.mul(0.75))))
        .mul(0.035)
        .add(0.97),
    );
    this.torso(this.surfer, 0x4b858f, 0xaa7958);
    for (const [i, g] of this.legs.entries()) {
      g.position.set(i === 0 ? -0.112 : 0.112, 0.9, 0);
      this.surfer.add(g);
      this.piece(g, this.cube, 0x315b69, 0, -0.16, 0, 0.19, 0.34, 0.23);
      this.piece(g, this.ball, 0xa77552, 0, -0.57, 0, 0.073, 0.31, 0.073);
      this.piece(g, this.ball, 0xaa7958, 0, -0.84, -0.061, 0.08, 0.058, 0.136);
    }
    this.piece(this.surfer, this.ball, 0xe5bd72, 0.34, 0.91, 0, 0.085, 0.29, 1.33).rotation.x = 0.2;
    this.customer.add(this.shoulders);
    this.torso(this.shoulders, 0xe4a746, 0xad795a);
    for (const side of [-1, 1])
      this.piece(this.customer, this.cube, 0x3e5455, side * 0.11, 0.46, 0, 0.17, 0.91, 0.2);
    this.stand(this.customer, 8519, 9.56);
    this.customer.rotation.y -= Math.PI / 2;
    this.root.add(this.customer, this.surfer, this.swell);
    for (const [i, d] of [8491, 8522, 8525, 8529, 8555].entries()) {
      const person = this.customer.clone();
      this.stand(person, d, 9.2 + (i % 2) * 0.85);
      person.rotation.y -= 1.13;
      person.scale.setScalar(0.88 + 0.04 * (i % 4));
      this.root.add(person);
    }
    const pickup = new Group();
    this.stand(pickup, 138, 5.49);
    this.piece(pickup, this.cube, 0x58898b, 0, 0.76, 0, 1.84, 0.56, 4.49);
    this.piece(pickup, this.cube, 0x88aab0, 0, 1.35, -0.44, 1.64, 0.71, 1.61);
    this.piece(pickup, this.cube, 0x477376, 0, 1.74, -0.44, 1.83, 0.13, 1.77);
    for (const x of [-0.9, 0.9])
      for (const z of [-1.37, 1.37])
        this.piece(pickup, this.tyre, 0x383a3a, x, 0.43, z, 0.4, 0.21, 0.4).rotation.z =
          Math.PI / 2;
    for (const x of [-0.41, 0.41])
      this.piece(pickup, this.ball, 0xe6cb8e, x, 1.9, -0.38, 0.26, 0.075, 1.53);
    this.root.add(pickup);
  }
  update(metres: number, time: number) {
    const stop = [2860, 4490, 6560].find((d) => Math.abs(metres - d) < 170);
    this.swell.visible = stop !== undefined;
    this.shown.waveCrest = null;
    if (stop !== undefined) {
      const d = stop + 53 + 3.2 * Math.sin(time * 0.29);
      const width =
        31 +
        8 * Math.sin(d / 99) +
        18 * Math.cos(d / 375) +
        18 * (1 - Math.exp(-(((d - 2920) / 285) ** 2)));
      this.stand(this.swell, d, -width - 13 - 2.2 * Math.cos(time * 0.44));
      this.swell.position.y = 0.21;
      this.swell.scale.y = 0.9 + 0.17 * Math.sin(time * 0.73);
      this.swell.rotation.z = 0.04 * Math.sin(time * 0.55);
      this.shown.waveCrest = this.swell.scale.y;
    }
    this.surfer.visible = Math.abs(metres - 4490) < 150;
    this.shown.surferStride = null;
    if (this.surfer.visible) {
      this.stand(this.surfer, 4505, -6.3 - 1.55 * (1 + Math.sin(time * 0.24)), -0.3);
      this.surfer.rotation.y += 1.36;
      const stride = 0.36 * Math.sin(time * 4.1);
      this.legs[0]!.rotation.x = stride;
      this.legs[1]!.rotation.x = -stride;
      this.shown.surferStride = stride;
    }
    this.customer.visible = Math.abs(metres - 8519) < 150;
    this.shown.queueTurn = null;
    if (this.customer.visible) {
      this.shoulders.rotation.y = 0.4 * Math.sin(time * 0.83);
      this.shown.queueTurn = this.shoulders.rotation.y;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = stops.find((s) => Math.abs(metres - s[0]) < 90);
    if (!s) return;
    const blend = Math.min(1, (1 - Math.abs(metres - s[0]) / 90) * 1.65);
    const p = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.t),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.16 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + s[3] + (14 * (t.y - p.y)) / len - ahead.y) * blend;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    this.surfer.clear();
    this.customer.clear();
    this.shoulders.clear();
    for (const r of [
      this.cube,
      this.ball,
      this.tyre,
      this.swellGeo,
      this.swellPaint,
      ...Object.values(this.materials),
      ...this.dyes.values(),
      ...this.textures,
    ])
      r.dispose();
    this.dyes.clear();
  }
}
