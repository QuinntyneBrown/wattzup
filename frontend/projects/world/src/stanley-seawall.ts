import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { mix, positionWorld, sin, texture, uniform, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const views = [
  [100, 135, 2.6, 0.8],
  [1090, 1106, -12, 4],
  [2040, 2068, 7.4, 5.2],
  [3220, 3258, 30, 2.2],
  [4480, 4504, 19, 6],
  [5910, 6005, 48, 24],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class StanleySeawall {
  readonly root = new Group();
  readonly materials = {
    SeawallPath: new MeshBasicNodeMaterial({ side: DoubleSide }),
    BurrardWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ParkCedars: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    BrocktonPoles: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    NorthShoreRidges: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4, fog: false }),
    StanleyCliffs: new MeshBasicMaterial({ side: DoubleSide, color: 0x929f8e }),
    SiwashBasalt: new MeshBasicMaterial({ side: DoubleSide, color: 0xc9c5b9 }),
    SeawallPaint: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.36 }),
  };
  private readonly ship = new Group();
  private readonly boat = new Group();
  private readonly boom = new Group();
  private readonly foam = new Group();
  private readonly splash = new TorusGeometry(1, 0.03, 5, 36);
  private readonly box = new BoxGeometry();
  private readonly sail = new BufferGeometry();
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly tide = uniform(0);
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    boomAngle: null as number | null,
    shipTravel: null as number | null,
    washHeight: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'stanleypark-cedars',
        'stanleypark-poles',
        'stanleypark-mountains',
        'stanleypark-paint',
        'fishhill-tarmac',
        'stanleypark-water',
        'hoover-volcanic-rock',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = result.find((r) => r.status === 'rejected');
    if (err) {
      for (const m of maps) m.dispose();
      throw err.reason;
    }
    return new StanleySeawall(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
    }
    const [cedar, poles, ridge, paint, path, water, basalt] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    basalt.wrapS = basalt.wrapT = RepeatWrapping;
    this.materials.SiwashBasalt.map = basalt;
    this.materials.StanleyCliffs.map = basalt;
    this.materials.ParkCedars.map = cedar;
    this.materials.BrocktonPoles.map = poles;
    this.materials.NorthShoreRidges.map = ridge;
    this.materials.SeawallPaint.map = paint;
    path.wrapS = path.wrapT = RepeatWrapping;
    this.materials.SeawallPath.colorNode = texture(path, positionWorld.xz.mul(0.21)).rgb;
    water.wrapS = water.wrapT = RepeatWrapping;
    water.anisotropy = 4;
    const drift = vec2(this.tide.mul(0.006), this.tide.mul(0.0025));
    const coast = positionWorld.xz;
    const near = texture(water, coast.mul(0.049).add(drift)).rgb;
    const far = texture(water, vec2(coast.y, coast.x.negate()).mul(0.019).sub(drift)).rgb;
    this.materials.BurrardWater.colorNode = mix(
      near,
      far,
      sin(coast.x.mul(0.012)).mul(0.14).add(0.38),
    );
    this.sail.setAttribute(
      'position',
      new Float32BufferAttribute([0, 0.4, 0, 0, 6.3, 0, 0, 0.69, 2.72], 3),
    );
    this.sail.computeVertexNormals();
    this.part(this.boat, this.box, 0xe7e4d4, 0, 0.39, 0, 1.18, 0.59, 4.46);
    this.part(this.boat, this.box, 0x3b5869, 0, 0.25, 0, 1.21, 0.12, 4.5);
    this.part(this.boat, this.box, 0x938978, 0, 3.51, -0.44, 0.055, 6.5, 0.055);
    this.boat.add(this.boom);
    this.boom.position.set(0, 0.36, -0.44);
    this.part(this.boom, this.box, 0x80776a, 0, 0.65, 1.31, 0.065, 0.062, 2.7);
    this.part(this.boom, this.sail, 0xfcf9e8, 0, 0, 0, 1, 1, 1);
    this.part(this.ship, this.box, 0x5c3830, 0, 0.86, 0, 6.6, 2.1, 37);
    this.part(this.ship, this.box, 0x3c484c, 0, 2.08, 0, 6.8, 1.1, 36.8);
    this.part(this.ship, this.box, 0xe0ded0, 0, 4.1, 12.7, 5.2, 3.1, 5.4);
    this.part(this.ship, this.box, 0x526873, 0, 5.32, 12.5, 5.3, 0.58, 5.5);
    this.part(this.ship, this.box, 0xae624f, -1, 6, 14.2, 1.1, 2.5, 1.4);
    for (let j = 0; j < 5; j++) {
      this.part(
        this.ship,
        this.box,
        j % 2 ? 0x99594b : 0x66777b,
        0,
        2.88,
        -13 + j * 4.2,
        5.7,
        1.07,
        3.82,
      );
    }
    for (let i = 0; i < 3; i++) {
      const rim = this.part(
        this.foam,
        this.splash,
        0xd8e4db,
        0,
        0.03 + i * 0.02,
        0,
        6.35 + i * 0.53,
        5.28 + i * 0.57,
        1,
      );
      rim.rotation.x = -Math.PI / 2;
    }
    this.root.add(this.boat, this.ship, this.foam);
    this.update(0, 0);
  }
  private part(
    g: Group,
    geo: BufferGeometry,
    tint: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    let mat = this.paints.get(tint);
    if (!mat) {
      mat = new MeshLambertMaterial({ color: tint, side: DoubleSide });
      this.paints.set(tint, mat);
    }
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    g.add(mesh);
    return mesh;
  }
  private locate(g: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.point);
    g.position.set(p.x, -1, p.z);
    g.rotation.y = p.heading;
  }
  update(metres: number, time: number) {
    this.tide.value = time * 0.82;
    this.boat.visible = Math.abs(metres - 2040) < 350;
    this.ship.visible = Math.abs(metres - 3220) < 440;
    this.foam.visible = Math.abs(metres - 4480) < 200;
    if (this.boat.visible) {
      this.locate(this.boat, 2061 + 5 * Math.sin(time * 0.13), 19);
      this.boat.rotation.y += 0.98;
      this.boat.rotation.z = 0.042 * Math.sin(time * 1.31);
      this.boom.rotation.y = 0.42 + 0.19 * Math.sin(time * 0.82);
    }
    if (this.ship.visible) {
      this.locate(this.ship, 3274 + 21 * Math.sin(time * 0.051), 61);
      this.ship.rotation.y += 0.37;
    }
    if (this.foam.visible) {
      this.locate(this.foam, 4504, 19);
      const rise = 0.5 + 0.5 * Math.sin(time * 1.23);
      this.foam.position.y += 0.03 + 0.29 * rise;
      this.foam.scale.set(1 + 0.11 * rise, 1, 1 + 0.11 * rise);
    }
    this.poses.boomAngle = this.boat.visible ? this.boom.rotation.y : null;
    this.poses.shipTravel = this.ship.visible ? this.ship.position.x : null;
    this.poses.washHeight = this.foam.visible ? this.foam.position.y : null;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = metres;
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - d);
      if (gap > 49) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (49 - gap) / 24);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
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
    for (const resource of [
      this.box,
      this.sail,
      this.splash,
      ...this.maps,
      ...this.paints.values(),
      ...Object.values(this.materials),
    ])
      resource.dispose();
    this.paints.clear();
  }
}
