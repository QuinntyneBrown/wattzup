import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Texture,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, texture } from 'three/tsl';
import type { Course, CoursePlace } from './course';
import type { CourseCyclistKit, RiderModel } from './course-cyclist';
import type { RiderBatch } from './rider-batch';

const views = [
  [120, 155, 0, 3],
  [1190, 1212, -12, 2.6],
  [2460, 2476, 8, 1.05],
  [3730, 3750, 2.8, 1.45],
  [4910, 4929, -11.8, 1.75],
  [6350, 6380, 0, 1.25],
] as const;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
export class MapleMorning {
  readonly root = new Group();
  readonly materials = {
    MapleRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    MapleLawns: new MeshBasicNodeMaterial({ side: DoubleSide }),
    MapleCanopy: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    MapleShade: new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      alphaTest: 0.035,
    }),
    AvenueCars: new MeshBasicMaterial({ side: DoubleSide }),
    MapleClapboard: new MeshBasicMaterial({ side: DoubleSide }),
    AvenueSigns: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    MapleDawn: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
  };
  private readonly sphere = new SphereGeometry(1, 10, 6);
  private readonly box = new BoxGeometry();
  private readonly boxes = new Map<number, MeshBasicMaterial>();
  private readonly peoplePaint = new MeshStandardMaterial({ roughness: 0.86 });
  private readonly people = new InstancedMesh(this.sphere, this.peoplePaint, 100);
  private readonly dropsPaint = new MeshBasicMaterial({ color: 0xc1d8d5 });
  private readonly drops = new InstancedMesh(this.sphere, this.dropsPaint, 110);
  private readonly actor = new Group();
  private readonly part = new Object3D();
  private readonly joint = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  private readonly tint = new Color();
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly paper = new Group();
  private readonly bag = new Group();
  private cyclist: RiderModel | null = null;
  private count = 0;
  private readonly poses = {
    sprinklerAngle: null as number | null,
    paperHeight: null as number | null,
    neighbourWave: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      results = await Promise.allSettled(
        [
          'suburbia-houses',
          'suburbia-maples',
          'suburbia-signs',
          'suburbia-dawn',
          'galibier-tarmac',
          'gardena-turf',
          'suburbia-shades',
          'suburbia-cars',
        ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
      );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new MapleMorning(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    const [houses, canopy, signs, dawn, road, grass] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    this.materials.AvenueCars.map = maps[7]!;
    this.materials.MapleShade.map = maps[6]!;
    this.materials.MapleClapboard.map = houses;
    this.materials.MapleCanopy.map = canopy;
    this.materials.AvenueSigns.map = signs;
    this.materials.MapleDawn.map = dawn;
    road.wrapS = road.wrapT = grass.wrapS = grass.wrapT = RepeatWrapping;
    this.materials.MapleRoad.colorNode = texture(road, positionWorld.xz.mul(0.18)).rgb.mul(
      color(0xd4c9c3),
    );
    const mowing = sin(positionWorld.x.mul(0.8).add(positionWorld.z.mul(0.35)))
      .mul(0.055)
      .add(0.98);
    this.materials.MapleLawns.colorNode = mix(
      texture(grass, positionWorld.xz.mul(0.14)).rgb,
      color(0x83975a),
      0.49,
    ).mul(mowing);
    this.drops.frustumCulled = this.people.frustumCulled = false;
    this.actor.add(this.part);
    this.root.add(this.people, this.drops, this.paper, this.bag);
    this.block(this.paper, 0, 0, 0, 0.36, 0.078, 0.097, 0xe9e4d3);
    this.block(this.paper, 0, 0, 0, 0.041, 0.083, 0.105, 0x8a5850);
    this.block(this.bag, 0, 0, 0, 0.46, 0.27, 0.23, 0x72634c);
    for (let i = 0; i < 4; i++)
      this.block(this.bag, -0.16 + i * 0.106, 0.16, 0, 0.075, 0.14, 0.155, 0xe7e1cd);
    this.update(0, 0);
  }
  addDelivery(kit: CourseCyclistKit, batch: RiderBatch) {
    const cyclist = kit.make(new Color(0x719287), 47, true, 0.52);
    this.cyclist = cyclist;
    this.root.add(cyclist.group);
    batch.add(cyclist);
  }
  private block(
    parent: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: number,
  ) {
    let paint = this.boxes.get(c);
    if (!paint) {
      paint = new MeshBasicMaterial({ color: c });
      this.boxes.set(c, paint);
    }
    const m = new Mesh(this.box, paint);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
  }
  private locate(d: number, lane: number, y: number, yaw: number) {
    const p = this.course.place(d, lane, this.point);
    this.actor.position.set(p.x, p.y + y, p.z);
    this.actor.rotation.set(0, p.heading + yaw, 0);
    this.actor.updateMatrixWorld();
  }
  private draw(c: number) {
    this.part.updateWorldMatrix(false, false);
    this.people.setMatrixAt(this.count, this.part.matrixWorld);
    this.people.setColorAt(this.count++, this.tint.setHex(c));
  }
  private oval(x: number, y: number, z: number, w: number, h: number, d: number, c: number) {
    this.part.position.set(x, y, z);
    this.part.rotation.set(0, 0, 0);
    this.part.scale.set(w, h, d);
    this.draw(c);
  }
  private limb(
    x: number,
    y: number,
    z: number,
    a: number,
    b: number,
    d: number,
    r: number,
    c: number,
  ) {
    this.joint.set(a - x, b - y, d - z);
    const len = this.joint.length();
    this.part.position.set((x + a) / 2, (y + b) / 2, (z + d) / 2);
    this.part.quaternion.setFromUnitVectors(this.up, this.joint.normalize());
    this.part.scale.set(r, len * 0.52, r);
    this.draw(c);
  }
  private resident(i: number, phase: number) {
    const skin = [0xdbab90, 0xb68871, 0x996f59][i]!,
      shirt = [0x976955, 0x698e8a, 0x697998][i]!;
    const stride = i === 0 ? 0 : Math.sin(phase) * 0.25;
    for (const side of [-1, 1]) {
      this.limb(0.11 * side, 0.8, 0, 0.13 * side, 0.16, stride * side, 0.09, 0x415564);
      this.oval(0.13 * side, 0.09, stride * side - 0.048, 0.094, 0.076, 0.15, 0x544f4a);
    }
    this.oval(0, 1.12, 0, 0.233, 0.37, 0.175, shirt);
    this.oval(0, 1.65, 0, 0.145, 0.18, 0.14, skin);
    this.oval(0, 1.79, 0.016, 0.147, 0.079, 0.145, 0x58473d);
    this.limb(-0.18, 1.4, 0, -0.27, 1.14, -0.06, 0.072, shirt);
    this.limb(-0.27, 1.14, -0.06, -0.21, 1.22, -0.23, 0.054, skin);
    if (i === 0) {
      this.oval(-0.21, 1.28, -0.25, 0.073, 0.084, 0.071, 0xddd6b9);
      const wave = 0.17 * Math.sin(phase);
      this.limb(0.18, 1.41, 0, 0.35, 1.46, -0.08, 0.075, shirt);
      this.limb(0.35, 1.46, -0.08, 0.39 + wave, 1.74, -0.1, 0.06, skin);
      this.poses.neighbourWave = wave;
    } else this.limb(0.18, 1.41, 0, 0.28, 1.15, stride * 0.8, 0.075, shirt);
  }
  update(metres: number, t: number) {
    this.count = 0;
    this.poses.sprinklerAngle = this.poses.paperHeight = this.poses.neighbourWave = null;
    this.drops.visible = Math.abs(metres - 2460) < 125;
    if (this.drops.visible) {
      const p = this.course.place(2474, 8.0, this.point),
        angle = 0.99 * Math.sin(t * 1.22);
      this.poses.sprinklerAngle = angle;
      for (let i = 0; i < 110; i++) {
        const jet = Math.floor(i / 22),
          u = ((i % 22) / 22 + t * 1.32) % 1,
          a = p.heading + angle + jet * 0.16;
        this.part.position.set(
          p.x + Math.cos(a) * u * 3.6,
          p.y + 0.12 + 4.8 * u * (1 - u),
          p.z + Math.sin(a) * u * 3.6,
        );
        this.part.rotation.set(0, a, 0);
        this.part.scale.set(0.027, 0.043, 0.027);
        this.part.updateMatrix();
        this.drops.setMatrixAt(i, this.part.matrix);
      }
      this.drops.instanceMatrix.needsUpdate = true;
    }
    const delivery = Math.abs(metres - 3730) < 140;
    this.paper.visible = this.bag.visible = delivery;
    if (this.cyclist) this.cyclist.group.visible = delivery;
    if (delivery && this.cyclist) {
      const along = metres + 11 + 2 * Math.sin(t * 0.24),
        p = this.course.place(along, 2.55, this.point);
      this.cyclist.group.position.set(p.x, p.y, p.z);
      this.cyclist.group.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      this.cyclist.pose(t * 7.85, 0.15);
      const basket = this.course.place(along - 0.57, 2.55, this.target);
      this.bag.position.set(basket.x, basket.y + 0.89, basket.z);
      this.bag.rotation.y = p.heading;
      const u = Math.min(1, ((t * 0.38) % 1) * 1.48),
        q = this.course.place(along + 1.2 * u, 2.55 + u * 6.8, this.target);
      this.paper.position.set(q.x, q.y + 1.35 * (1 - u) + 4.3 * u * (1 - u) + 0.08, q.z);
      this.paper.rotation.set(u * 4.8, p.heading + 0.41, u * 5.8);
      this.poses.paperHeight = this.paper.position.y;
    }
    this.people.visible = Math.abs(metres - 4910) < 140;
    if (this.people.visible) {
      this.locate(4923, -12.0, 0.45, -1.49);
      this.resident(0, t * 2.24);
      this.locate(4935 + 3 * Math.sin(t * 0.27), 6.88, 0.14, 0);
      this.resident(1, t * 5.8);
      this.locate(4943 + 1.9 * Math.sin(t * 0.23), -6.9, 0.14, 0.14);
      this.resident(2, t * 2.7);
      this.oval(0.68, 0.42, -0.65, 0.18, 0.22, 0.39, 0x957659);
      this.oval(0.68, 0.66, -0.94, 0.14, 0.16, 0.18, 0x8c6d50);
      for (const v of [-0.8, -0.47])
        for (const s of [-0.12, 0.12])
          this.limb(
            0.68 + s,
            0.34,
            v,
            0.68 + s,
            0.045,
            v + 0.035 * Math.sin(t * 2.9),
            0.046,
            0x816349,
          );
      this.limb(0.21, 1.13, -0.1, 0.68, 0.61, -0.85, 0.012, 0x6d5845);
      this.people.count = this.count;
      this.people.instanceMatrix.needsUpdate = true;
      if (this.people.instanceColor) this.people.instanceColor.needsUpdate = true;
    }
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to + metres - at, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 23);
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
    this.people.dispose();
    this.drops.dispose();
    if (this.cyclist) for (const item of this.cyclist.owned) item.dispose();
    for (const m of [
      this.sphere,
      this.box,
      this.peoplePaint,
      this.dropsPaint,
      ...this.boxes.values(),
      ...this.maps,
      ...Object.values(this.materials),
    ])
      m.dispose();
    this.boxes.clear();
  }
}
