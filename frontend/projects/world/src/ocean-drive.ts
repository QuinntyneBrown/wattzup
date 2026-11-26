import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, smoothstep, texture, uv } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const views = [
  [100, 146, -14, 6],
  [1340, 1351, -8, 2],
  [2640, 2668, -14, 7],
  [4010, 4025, 12, 1.7],
  [5150, 5183, 30, 3],
  [6820, 7004, 0, 16],
] as const;
const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class OceanDrive {
  readonly root = new Group();
  readonly materials = {
    OceanDrive: new MeshBasicNodeMaterial({ side: DoubleSide }),
    DecoHotels: new MeshBasicMaterial({ side: DoubleSide }),
    RoyalPalms: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    LifeguardTowers: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    SprintPaint: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.35 }),
    AtlanticDawn: new MeshBasicNodeMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  };
  private readonly cleaner = new Group();
  private readonly broom = new Group();
  private readonly skater = new Group();
  private readonly legs = [new Group(), new Group()];
  private readonly walker = new Group();
  private readonly sign = new Group();
  private readonly blocks = new BoxGeometry();
  private readonly round = new SphereGeometry(1, 10, 8);
  private readonly tube = new CylinderGeometry(1, 1, 1, 9);
  private readonly colours = new Map<number, MeshBasicMaterial>();
  private readonly neon = new MeshBasicMaterial({
    color: 0x76f9fe,
    transparent: true,
    depthWrite: false,
  });
  private readonly point = place();
  private readonly target = place();
  private readonly poses = {
    broomAngle: null as number | null,
    neonGlow: null as number | null,
    skaterKnee: null as number | null,
  };

  static async load(course: Course) {
    const loader = new TextureLoader();
    const loaded = await Promise.allSettled(
      [
        'fishhill-tarmac',
        'southbeach-hotels',
        'southbeach-royals',
        'southbeach-stands',
        'southbeach-paint',
        'southbeach-atlantic',
      ].map((name) => loader.loadAsync('courses/' + name + '.webp')),
    );
    const maps = loaded.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = loaded.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new OceanDrive(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    const [road, hotel, palm, tower, paint, sky] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    road.wrapS = road.wrapT = RepeatWrapping;
    this.materials.OceanDrive.colorNode = texture(road, positionWorld.xz.mul(0.18)).rgb;
    this.materials.DecoHotels.map = hotel;
    this.materials.RoyalPalms.map = palm;
    this.materials.LifeguardTowers.map = tower;
    this.materials.SprintPaint.map = paint;
    this.materials.AtlanticDawn.colorNode = texture(sky).rgb;
    this.materials.AtlanticDawn.opacityNode = smoothstep(0, 0.38, uv().y)
      .mul(smoothstep(0, 0.19, uv().x))
      .mul(smoothstep(0, 0.19, uv().x.oneMinus()));
    this.root.add(this.cleaner, this.skater, this.walker, this.sign);
    this.person(this.cleaner, 0x658d8b);
    this.cleaner.add(this.broom);
    this.broom.position.set(0.34, 1.17, 0.09);
    this.part(this.broom, this.tube, 0xb29c71, 0, -0.32, 0, 0.023, 1.64, 0.023);
    this.part(this.broom, this.blocks, 0x99673d, 0, -1.13, 0, 0.43, 0.14, 0.15);
    for (const side of [-1, 1])
      this.part(this.cleaner, this.tube, 0x3f5051, side * 0.14, 0.44, 0, 0.095, 0.82, 0.093);
    this.person(this.skater, 0xd67185);
    this.legs.forEach((leg, i) => {
      this.skater.add(leg);
      leg.position.set(i === 0 ? -0.14 : 0.14, 0.91, 0);
      this.part(leg, this.tube, 0x946647, 0, -0.18, 0, 0.089, 0.38, 0.083);
      const shin = this.part(leg, this.tube, 0x996f53, 0, -0.52, 0.09, 0.075, 0.37, 0.072);
      shin.rotation.x = -0.34;
      this.part(leg, this.blocks, 0x315562, 0, -0.71, 0.057, 0.18, 0.18, 0.41);
      for (const z of [-0.095, 0.02, 0.14, 0.25])
        this.part(leg, this.round, 0xdda86e, 0, -0.81, z, 0.052, 0.061, 0.061);
    });
    this.person(this.walker, 0x9caec4);
    for (const side of [-1, 1])
      this.part(
        this.walker,
        this.tube,
        0xa97b60,
        side * 0.14,
        0.45,
        side * 0.09,
        0.085,
        0.86,
        0.084,
      );
    this.part(this.walker, this.round, 0xb88055, 0.58, 0.43, -1.65, 0.19, 0.22, 0.44);
    this.part(this.walker, this.round, 0xa57149, 0.58, 0.65, -1.99, 0.16, 0.17, 0.2);
    for (const x of [0.46, 0.7])
      for (const z of [-1.4, -1.89])
        this.part(this.walker, this.tube, 0x936443, x, 0.23, z, 0.05, 0.42, 0.057);
    const leash = this.part(
      this.walker,
      this.tube,
      0x534541,
      0.42,
      0.86,
      -1.02,
      0.012,
      1.98,
      0.012,
    );
    leash.rotation.x = 1.33;
    for (const x of [-0.86, 0.86]) {
      const light = new Mesh(this.blocks, this.neon);
      light.scale.set(0.065, 8, 0.075);
      light.position.set(x, 7.9, 0);
      this.sign.add(light);
    }
    this.locate(this.cleaner, 1351, -8);
    this.locate(this.sign, 2666, -12.48);
    this.sign.rotation.y += Math.PI / 2;
    this.update(0, 0);
  }
  private part(
    parent: Group,
    geo: BufferGeometry,
    tint: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    let mat = this.colours.get(tint);
    if (!mat) {
      mat = new MeshBasicMaterial({ color: tint });
      this.colours.set(tint, mat);
    }
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
    return m;
  }
  private person(g: Group, shirt: number) {
    this.part(g, this.round, shirt, 0, 1.23, 0, 0.255, 0.37, 0.16);
    this.part(g, this.round, 0xb78060, 0, 1.79, 0, 0.143, 0.186, 0.14);
    this.part(g, this.round, 0x513d33, 0, 1.91, 0.015, 0.15, 0.095, 0.145);
    for (const side of [-1, 1]) {
      const arm = this.part(g, this.tube, 0xba8865, side * 0.272, 1.23, -0.045, 0.062, 0.45, 0.067);
      arm.rotation.x = 0.38;
    }
  }
  private locate(g: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.point);
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.heading;
  }
  update(metres: number, time: number) {
    this.cleaner.visible = Math.abs(metres - 1351) < 115;
    this.skater.visible = this.walker.visible = Math.abs(metres - 4025) < 135;
    this.sign.visible = Math.abs(metres - 2666) < 200;
    this.broom.rotation.z = 0.22 + 0.46 * Math.sin(time * 2.35);
    this.poses.broomAngle = this.cleaner.visible ? this.broom.rotation.z : null;
    this.neon.opacity = Math.max(0.04, 1 - metres / 4200) * (0.82 + 0.18 * Math.cos(time * 0.81));
    this.poses.neonGlow = this.sign.visible ? this.neon.opacity : null;
    if (this.skater.visible) {
      this.locate(this.skater, 4024 + 9 * Math.sin(time * 0.18), 11);
      this.locate(this.walker, 4031 + 3 * Math.sin(time * 0.14), 12.2);
      this.legs.forEach((leg, i) => {
        leg.rotation.x = 0.1 + 0.46 * Math.sin(time * 2.4 + i * Math.PI);
        leg.rotation.z = 0.16 * Math.cos(time * 2.4 + i * Math.PI);
      });
    }
    this.poses.skaterKnee = this.skater.visible ? this.legs[0]!.rotation.x : null;
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
      this.blocks,
      this.tube,
      this.round,
      this.neon,
      ...this.maps,
      ...this.colours.values(),
      ...Object.values(this.materials),
    ])
      resource.dispose();
    this.colours.clear();
  }
}
