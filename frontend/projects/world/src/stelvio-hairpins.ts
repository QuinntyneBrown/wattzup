import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture } from 'three/tsl';
import type { Course, CoursePlace } from './course';
import type { CourseCyclistKit, RiderModel } from './course-cyclist';
import type { RiderBatch } from './rider-batch';
const views = [
  [100, 121, 1.1, 1.7],
  [1570, 1584, -1.15, 1.5],
  [3830, 2400, 0, -9],
  [5210, 5225, -1.42, 1.8],
  [6730, 6764, 2, 8],
  [8050, 8075, -10, 7],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class StelvioHairpins {
  readonly root = new Group();
  readonly materials = {
    TornanteRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    TrafoiScree: new MeshBasicNodeMaterial({ side: DoubleSide }),
    TornanteMasonry: new MeshBasicMaterial({ side: DoubleSide }),
    TrafoiLarches: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    RiderWriting: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    TornantePlaques: new MeshBasicMaterial({ side: DoubleSide }),
    OrtlerMassif: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.35, fog: false }),
    PassHuts: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly box = new BoxGeometry();
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly ring = new TorusGeometry(1, 0.21, 7, 18);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly motor = new Group();
  private readonly cloudMaterial = new SpriteMaterial({
    transparent: true,
    depthWrite: false,
    opacity: 0.69,
  });
  private readonly clouds: Sprite[] = [];
  private readonly camper = new Group();
  private readonly wheels: Group[] = [];
  private readonly riders: RiderModel[] = [];
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    climberCrank: null as number | null,
    motorbikeLean: null as number | null,
    camperWheel: null as number | null,
    tornanteNumber: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'stelvio-wall',
        'stelvio-plaques',
        'stelvio-huts',
        'stelvio-writing',
        'stelvio-ortler',
        'gardena-larches',
        'galibier-scree',
        'galibier-tarmac',
        'galibier-cloud',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = result.find((r) => r.status === 'rejected');
    if (err) {
      for (const m of maps) m.dispose();
      throw err.reason;
    }
    return new StelvioHairpins(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    const [stone, plaques, huts, writing, ridge, larch, scree, road] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    stone.wrapS =
      stone.wrapT =
      road.wrapS =
      road.wrapT =
      scree.wrapS =
      scree.wrapT =
        RepeatWrapping;
    this.materials.TornanteMasonry.map = stone;
    this.materials.TornantePlaques.map = plaques;
    this.materials.PassHuts.map = huts;
    this.materials.RiderWriting.map = writing;
    this.materials.OrtlerMassif.map = ridge;
    this.materials.TrafoiLarches.map = larch;
    this.materials.TornanteRoad.colorNode = texture(road, positionWorld.xz.mul(0.18)).rgb;
    const earth = texture(scree, positionWorld.xz.mul(0.096)).rgb;
    const low = positionWorld.y.sub(2510).mul(-0.004).add(0.37);
    const grass = smoothstep(0.18, 0.79, sin(positionWorld.x.mul(0.038)).mul(0.22).add(low));
    this.materials.TrafoiScree.colorNode = mix(earth, earth.mul(color(0x769052)), grass.mul(0.91));
    this.cloudMaterial.map = maps[8]!;
    for (const [i, distance] of [3810, 5320, 6740, 7550].entries()) {
      const cloud = new Sprite(this.cloudMaterial);
      const place = course.place(distance, 0, this.point);
      cloud.position.set(place.x + 310 * Math.sin(i * 2), place.y + 48, place.z - 460);
      cloud.scale.set(420 + 35 * i, 85, 1);
      cloud.userData['originX'] = cloud.position.x;
      this.clouds.push(cloud);
      this.root.add(cloud);
    }
    this.root.add(this.motor, this.camper);
    this.motorcycle();
    this.motorhome();
    this.update(0, 0);
  }
  addClimbers(kit: CourseCyclistKit, batch: RiderBatch) {
    for (const [i, tint] of [0xc03e35, 0x3d7790, 0xdbb348].entries()) {
      const rider = kit.make(new Color(tint), 22 + i, true, 0.52);
      this.riders.push(rider);
      this.root.add(rider.group);
      batch.add(rider);
    }
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
      mat = new MeshLambertMaterial({ color: tint });
      this.paints.set(tint, mat);
    }
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    g.add(mesh);
    return mesh;
  }
  private wheel(g: Group, x: number, z: number, r: number) {
    const wheel = new Group();
    wheel.position.set(x, r, z);
    g.add(wheel);
    const tire = this.part(wheel, this.ring, 0x272a2d, 0, 0, 0, r * 0.83, r * 0.83, r * 0.75);
    tire.rotation.y = Math.PI / 2;
    for (let j = 0; j < 5; j++)
      this.part(wheel, this.box, 0xacafb0, 0, 0, 0, 0.07, 0.035, r * 1.39).rotation.x =
        (j * Math.PI) / 5;
    return wheel;
  }
  private motorcycle() {
    const m = this.motor;
    for (const z of [-0.78, 0.79]) this.wheel(m, 0, z, 0.32);
    this.part(m, this.ball, 0x98382e, 0, 0.72, -0.22, 0.23, 0.22, 0.47);
    this.part(m, this.box, 0x33383b, 0, 0.59, 0.22, 0.36, 0.25, 0.77);
    this.part(m, this.box, 0x40484a, 0, 0.83, 0.36, 0.37, 0.14, 0.61);
    this.part(m, this.ball, 0x343c44, 0, 1.17, 0.12, 0.25, 0.39, 0.2).rotation.x = -0.39;
    this.part(m, this.ball, 0xd6d6d0, 0, 1.58, -0.12, 0.17, 0.19, 0.18);
    this.part(m, this.box, 0x3f525c, 0, 1.59, -0.27, 0.25, 0.092, 0.052);
    for (const side of [-1, 1]) {
      this.part(m, this.box, 0xa8a9a5, side * 0.13, 0.52, -0.68, 0.052, 0.62, 0.052).rotation.x =
        0.21;
      this.part(m, this.box, 0x30383b, side * 0.22, 1.11, -0.19, 0.11, 0.12, 0.52).rotation.x =
        -0.2;
      this.part(m, this.box, 0x393c3e, side * 0.19, 0.71, 0.17, 0.14, 0.54, 0.18).rotation.x = 0.45;
    }
    this.part(m, this.box, 0xe6d6a0, 0, 0.91, -0.59, 0.23, 0.15, 0.14);
  }
  private motorhome() {
    const g = this.camper;
    this.part(g, this.box, 0xe1dfcb, 0, 1.55, 0.15, 1.98, 1.92, 4.6);
    this.part(g, this.box, 0xd7d5c3, 0, 1.26, -2.28, 1.87, 1.31, 1.17);
    this.part(g, this.box, 0xe5dfc8, 0, 2.32, -2.06, 1.99, 0.56, 1.95);
    this.part(g, this.box, 0x667b83, 0, 1.57, -2.88, 1.63, 0.65, 0.06);
    for (const side of [-1, 1]) {
      for (const z of [-1.72, 1.58]) this.wheels.push(this.wheel(g, side * 0.97, z, 0.39));
      for (const z of [-0.93, 0.82])
        this.part(g, this.box, 0x667b81, side * 0.998, 1.83, z, 0.035, 0.59, 0.95);
      this.part(g, this.box, 0x738e91, side * 0.998, 1.04, 0.1, 0.035, 0.17, 4.43);
    }
    this.part(g, this.box, 0x526877, 0, 1.8, 2.464, 1.12, 0.55, 0.035);
    for (const side of [-1, 1])
      this.part(g, this.box, 0xb54332, side * 0.85, 0.86, 2.475, 0.15, 0.24, 0.06);
    this.part(g, this.box, 0xe9dcab, 0, 0.75, 2.478, 0.42, 0.13, 0.045);
    this.part(g, this.box, 0x6e7879, 0, 0.69, -2.89, 1.96, 0.19, 0.11);
  }
  private locate(g: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.point);
    g.position.set(p.x, p.y + 0.018, p.z);
    g.rotation.set(p.pitch, p.heading, 0, 'YXZ');
  }
  update(metres: number, time: number) {
    for (const [i, cloud] of this.clouds.entries())
      cloud.position.x = cloud.userData['originX'] + 90 * Math.sin(time * 0.004 + i);
    const turns = this.course.file.tornantiMetres ?? [];
    let turn = 0;
    while (turn < turns.length - 1 && metres > (turns[turn]! + turns[turn + 1]!) * 0.5) turn++;
    this.poses.tornanteNumber = turns.length ? turns.length - turn : null;
    const crank = time * 8.19;
    for (const [i, rider] of this.riders.entries()) {
      const d = metres + 12 + i * 6.1 + 2.35 * Math.sin(time * 0.27 + i);
      rider.group.visible = d < this.course.end;
      if (!rider.group.visible) continue;
      this.locate(rider.group, d, 1.02 + 0.39 * Math.sin(i * 1.52 + time * 0.19));
      rider.pose(crank + i * 1.71, 0.18 + 0.12 * Math.sin(time * 0.52 + i));
    }
    this.poses.climberCrank = this.riders[0]?.group.visible ? crank : null;
    this.motor.visible = Math.abs(metres - 1570) < 130;
    this.camper.visible = Math.abs(metres - 5210) < 125;
    if (this.motor.visible) {
      this.locate(this.motor, 1583 + 5.4 * Math.sin(time * 0.23), -1.27);
      this.motor.rotation.z = 0.16 + 0.19 * Math.sin(time * 0.5);
    }
    if (this.camper.visible) {
      this.locate(this.camper, 5221 + 4 * Math.sin(time * 0.15), -1.47);
      for (const wheel of this.wheels) wheel.rotation.x = -15.4 * Math.sin(time * 0.15);
    }
    this.poses.motorbikeLean = this.motor.visible ? this.motor.rotation.z : null;
    this.poses.camperWheel = this.camper.visible ? this.wheels[0]!.rotation.x : null;
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
    for (const rider of this.riders) for (const item of rider.owned) item.dispose();
    this.riders.length = 0;
    for (const resource of [
      this.cloudMaterial,
      this.box,
      this.ball,
      this.ring,
      ...this.maps,
      ...this.paints.values(),
      ...Object.values(this.materials),
    ])
      resource.dispose();
    this.paints.clear();
  }
}
