import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, texture } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const views = [
  [120, 173, -6, 5],
  [2230, 2243, -3, 2.2],
  [4540, 4551, -7.9, 1.6],
  [6910, 6944, -42, 6.5],
  [9120, 9138, 19, 3],
  [12650, 12682, -15, 8],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class StampedeGrounds {
  readonly root = new Group();
  readonly materials = {
    RodeoStand: new MeshBasicMaterial({ side: DoubleSide }),
    WesternShops: new MeshBasicMaterial({ side: DoubleSide }),
    WhiteHats: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.46 }),
    CalgarySkyline: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.38 }),
    RiverCamp: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    ParadeRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly float = new Group();
  private readonly team = new Group();
  private readonly midway = new Group();
  private readonly wheel = new Group();
  private readonly cabins: Group[] = [];
  private readonly legs: Group[] = [];
  private readonly floatWheels: Group[] = [];
  private readonly wagonWheels: Group[] = [];
  private readonly box = new BoxGeometry();
  private readonly cylinder = new CylinderGeometry(1, 1, 1, 12);
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly rim = new TorusGeometry(1, 0.075, 6, 20);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly poses = {
    floatAxle: null as number | null,
    horseStride: null as number | null,
    wheelAngle: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'stampede-fronts',
        'stampede-crowd',
        'stampede-skyline',
        'stampede-riders',
        'fishhill-tarmac',
        'stampede-stand',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = result.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new StampedeGrounds(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    const [shop, hats, sky, camp, road, stand] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    this.materials.WesternShops.map = shop;
    this.materials.WhiteHats.map = hats;
    this.materials.CalgarySkyline.map = sky;
    this.materials.RiverCamp.map = camp;
    this.materials.RodeoStand.map = stand;
    road.wrapS = road.wrapT = RepeatWrapping;
    this.materials.ParadeRoad.colorNode = texture(road, positionWorld.xz.mul(0.13)).rgb;
    this.buildFloat();
    this.buildTeam();
    this.buildWheel();
    this.root.add(this.float, this.team, this.midway);
    this.place(this.midway, 12682, -17);
    this.update(0, 0);
  }
  private part(
    g: Group,
    geo: BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    let material = this.paints.get(c);
    if (!material) {
      material = new MeshLambertMaterial({ color: c });
      this.paints.set(c, material);
    }
    const m = new Mesh(geo, material);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
    return m;
  }
  private axle(g: Group, x: number, y: number, z: number, r: number) {
    const hub = new Group();
    hub.position.set(x, y, z);
    g.add(hub);
    this.part(hub, this.rim, 0x483b32, 0, 0, 0, r, r, r).rotation.y = Math.PI / 2;
    for (let i = 0; i < 5; i++)
      this.part(hub, this.box, 0xae8a57, 0, 0, 0, 0.075, 0.06, 1.91 * r).rotation.x =
        (i * Math.PI) / 5;
    return hub;
  }
  private cowboy(g: Group, x: number, y: number, z: number, shirt: number) {
    this.part(g, this.ball, shirt, x, y + 0.38, z, 0.24, 0.36, 0.17);
    this.part(g, this.ball, 0xa47355, x, y + 0.86, z, 0.14, 0.18, 0.14);
    this.part(g, this.ball, 0xf0dfbd, x, y + 1, z, 0.245, 0.043, 0.23);
    this.part(g, this.ball, 0xeee1cb, x, y + 1.07, z, 0.15, 0.115, 0.15);
  }
  private buildFloat() {
    this.part(this.float, this.box, 0xa63532, 0, 0.88, 0, 2.14, 0.53, 5.35);
    this.part(this.float, this.box, 0xe3b450, 0, 1.18, 0, 2.28, 0.16, 5.52);
    for (const side of [-1, 1]) {
      for (const z of [-1.76, 1.76])
        this.floatWheels.push(this.axle(this.float, side * 1.09, 0.59, z, 0.56));
      for (let j = 0; j < 8; j++)
        this.part(
          this.float,
          this.ball,
          j % 2 ? 0xf1d7a3 : 0xcc463c,
          side * 1.11,
          1.18,
          -2.3 + j * 0.65,
          0.12,
          0.22,
          0.36,
        );
    }
    for (let j = 0; j < 3; j++) {
      const z = 1.46 - j * 1.38;
      this.cowboy(this.float, 0, 1.28, z, j % 2 ? 0x35597c : 0xb7403c);
      const horn = this.part(
        this.float,
        this.cylinder,
        0xe2b44d,
        0.18,
        2.03,
        z - 0.24,
        0.07,
        0.38,
        0.07,
      );
      horn.rotation.x = Math.PI / 2;
      this.part(this.float, this.ball, 0xe9bf61, 0.18, 2.03, z - 0.46, 0.14, 0.14, 0.062);
    }
  }
  private buildTeam() {
    this.part(this.team, this.box, 0x91572e, 0, 0.92, 1.35, 1.69, 0.76, 2.87);
    this.part(this.team, this.ball, 0xded1b5, 0, 1.69, 1.55, 0.87, 0.85, 1.38);
    for (const z of [0.43, 1.4, 2.32]) {
      const hoop = this.part(this.team, this.rim, 0x9e7954, 0, 1.63, z, 0.88, 0.87, 0.86);
      hoop.scale.z = 0.33;
    }
    for (const side of [-1, 1])
      for (const z of [0.25, 2.37])
        this.wagonWheels.push(this.axle(this.team, side * 0.91, 0.63, z, 0.61));
    this.cowboy(this.team, 0, 1.16, -0.23, 0xa93e37);
    for (let i = 0; i < 4; i++) {
      const x = i % 2 === 0 ? -0.65 : 0.65,
        z = -2.35 - Math.floor(i / 2) * 2.28;
      const coat = [0x77523a, 0x78492f, 0x5d4537, 0xac7651][i]!;
      this.part(this.team, this.ball, coat, x, 1.18, z, 0.32, 0.43, 0.81);
      const neck = this.part(this.team, this.ball, coat, x, 1.57, z - 0.57, 0.24, 0.48, 0.29);
      neck.rotation.x = -0.44;
      this.part(this.team, this.ball, coat, x, 1.86, z - 0.83, 0.203, 0.24, 0.39);
      for (const side of [-1, 1])
        this.part(this.team, this.ball, coat, x + 0.103 * side, 2.09, z - 0.7, 0.057, 0.136, 0.071);
      this.part(this.team, this.ball, 0x493b34, x, 1.07, z + 0.78, 0.12, 0.47, 0.15);
      this.part(this.team, this.box, 0x3f3830, x, 1.53, z, 0.67, 0.086, 0.22);
      for (const side of [-1, 1])
        for (const end of [-1, 1]) {
          const leg = new Group();
          leg.position.set(x + side * 0.17, 1.04, z + end * 0.47);
          this.team.add(leg);
          this.legs.push(leg);
          this.part(leg, this.cylinder, coat, 0, -0.28, 0, 0.077, 0.61, 0.082);
          this.part(leg, this.cylinder, coat, 0, -0.72, 0.028, 0.052, 0.36, 0.055);
          this.part(leg, this.ball, 0x332d2a, 0, -0.93, 0.018, 0.077, 0.085, 0.095);
        }
      this.part(this.team, this.box, 0x4f3b2a, x + 0.23, 0.98, z + 1.42, 0.036, 0.037, 2.35);
    }
  }
  private buildWheel() {
    this.midway.add(this.wheel);
    this.wheel.position.y = 8.6;
    this.wheel.rotation.y = 0.52;
    for (const side of [-1, 1]) {
      const leg = this.part(
        this.midway,
        this.box,
        0xb84c3c,
        side * 2.25,
        4.25,
        0,
        0.27,
        9.55,
        0.31,
      );
      leg.rotation.z = side * 0.48;
    }
    this.part(this.wheel, this.rim, 0xe2bc68, 0, 0, 0, 7.4, 7.4, 1.1);
    for (let j = 0; j < 12; j++) {
      const a = (j * Math.PI) / 6;
      this.part(
        this.wheel,
        this.box,
        0xe4c99c,
        3.7 * Math.cos(a),
        3.7 * Math.sin(a),
        0,
        7.4,
        0.1,
        0.12,
      ).rotation.z = a;
      const cab = new Group();
      cab.position.set(7.35 * Math.cos(a), 7.35 * Math.sin(a), 0);
      this.wheel.add(cab);
      this.cabins.push(cab);
      this.part(
        cab,
        this.box,
        [0xb94038, 0xc7a73a, 0x467b8e][j % 3]!,
        0,
        -0.62,
        0,
        1.19,
        0.61,
        1.05,
      );
      this.part(cab, this.box, 0xe1d2a5, 0, 0.05, 0, 1.26, 0.09, 1.12);
    }
  }
  private place(g: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.point);
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.heading;
  }
  update(metres: number, time: number) {
    this.float.visible = Math.abs(metres - 2243) < 190;
    this.team.visible = Math.abs(metres - 4558) < 210;
    this.midway.visible = Math.abs(metres - 12682) < 265;
    if (this.float.visible) {
      this.place(this.float, 2243 + 6 * Math.sin(0.16 * time), -3.4);
      for (const axle of this.floatWheels) axle.rotation.x = -10.7 * Math.sin(time * 0.16);
    }
    if (this.team.visible) {
      this.place(this.team, 4552 + 4.4 * Math.sin(time * 0.2), -7.9);
      this.legs.forEach((leg, j) => {
        leg.rotation.x =
          0.53 * Math.sin(time * 5.6 + Math.floor(j / 4) * 0.46 + (j % 3) * Math.PI * 0.64);
      });
      for (const axle of this.wagonWheels) axle.rotation.x = -19.7 * Math.sin(time * 0.2);
    }
    this.wheel.rotation.z = time * 0.073;
    for (const cab of this.cabins) cab.rotation.z = -this.wheel.rotation.z;
    this.poses.floatAxle = this.float.visible ? this.floatWheels[0]!.rotation.x : null;
    this.poses.horseStride = this.team.visible ? this.legs[0]!.rotation.x : null;
    this.poses.wheelAngle = this.midway.visible ? this.wheel.rotation.z : null;
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
      this.cylinder,
      this.ball,
      this.rim,
      ...this.maps,
      ...this.paints.values(),
      ...Object.values(this.materials),
    ])
      resource.dispose();
    this.paints.clear();
  }
}
