import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  MirroredRepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import type { RiderBody } from './rider-body';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 103, 1, 1.6],
  [2340, 2371, -5.35, 1.85],
  [4810, 4843, -1, 1.1],
  [6530, 6650, -148, 1],
  [8800, 8839, -1, 2.5],
  [10820, 10855, 1, 2.15],
] as const;

export class HuyClimb {
  readonly root = new Group();
  readonly materials = {
    HuyTarmac: new MeshBasicMaterial({ side: DoubleSide, vertexColors: true }),
    HuyFacades: new MeshBasicMaterial({ side: DoubleSide }),
    HuyLeaves: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    HuyLettering: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    HuySupporters: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    MeuseValley: new MeshBasicMaterial({ side: DoubleSide, transparent: true, depthWrite: false }),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly kit: CourseCyclistKit;
  private readonly climber: RiderModel;
  private readonly plain = new MeshLambertMaterial({ vertexColors: true });
  private readonly flag = new Group();
  private readonly fan = new Group();
  private readonly hands = [new Group(), new Group()];
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly ball = new SphereGeometry(1, 10, 8);
  private readonly pole = new CylinderGeometry(0.027, 0.031, 2.8, 8);
  private readonly cloth = new PlaneGeometry(1.23, 0.84, 9, 3);
  private readonly clothRest = (this.cloth.getAttribute('position').array as Float32Array).slice();
  private readonly paint = new Map<number, MeshLambertMaterial>();
  private readonly finishPlane = new PlaneGeometry(7.98, 0.95);
  private readonly finishPaint = new MeshBasicMaterial({ side: DoubleSide });
  private readonly shown = {
    climberPedal: null as number | null,
    flagWave: null as number | null,
    fanClap: null as number | null,
  };

  static async load(course: Course, body: RiderBody) {
    const keys = [
      'tarmac',
      'facades',
      'leaves',
      'lettering',
      'supporters',
      'meuse',
      'flag',
      'finish',
    ];
    const results = await Promise.allSettled(
      keys.map((k) => new TextureLoader().loadAsync('courses/murdehuy-' + k + '.webp')),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const t of textures) t.dispose();
      throw error.reason;
    }
    return new HuyClimb(course, body, textures);
  }
  private dye(color: number) {
    let paint = this.paint.get(color);
    if (!paint) {
      paint = new MeshLambertMaterial({ color, side: DoubleSide });
      this.paint.set(color, paint);
    }
    return paint;
  }
  private constructor(
    private readonly course: Course,
    body: RiderBody,
    private readonly textures: Texture[],
  ) {
    for (const texture of textures) {
      texture.flipY = false;
      texture.colorSpace = SRGBColorSpace;
    }
    const [road, facades, leaves, letters, fans, valley, flag, finish] = textures;
    road!.wrapS = road!.wrapT = MirroredRepeatWrapping;
    this.materials.HuyTarmac.map = road!;
    this.materials.HuyFacades.map = facades!;
    this.materials.HuyLeaves.map = leaves!;
    this.materials.HuyLettering.map = letters!;
    this.materials.HuySupporters.map = fans!;
    this.materials.MeuseValley.map = valley!;
    this.kit = new CourseCyclistKit(this.plain, body, false, true);
    this.climber = this.kit.make(new Color(0xb83133), 23, false, 0.65);
    this.root.add(this.climber.group, this.fan, this.flag);
    const place = (group: Group, d: number, offset: number) => {
      const p = course.place(d, offset, this.p);
      group.position.set(p.x, p.y, p.z);
      group.rotation.y = p.heading;
    };
    const flagPaint = this.dye(0xffffff);
    flagPaint.map = flag!;
    const fabric = new Mesh(this.cloth, flagPaint);
    fabric.position.set(0.613, 2.32, 0);
    this.flag.add(fabric);
    const pole = new Mesh(this.pole, this.dye(0x777674));
    pole.position.y = 1.38;
    this.flag.add(pole);
    place(this.flag, 4822, -3.88);
    const limb = (
      group: Group,
      round: boolean,
      color: number,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
    ) => {
      const part = new Mesh(round ? this.ball : this.cube, this.dye(color));
      part.position.set(x, y, z);
      part.scale.set(w, h, l);
      group.add(part);
      return part;
    };
    place(this.fan, 10834, 3.94);
    this.fan.rotation.y += Math.PI / 2;
    for (const sign of [-1, 1])
      limb(this.fan, false, 0x374954, sign * 0.1, 0.45, 0, 0.16, 0.9, 0.19);
    limb(this.fan, true, 0xb44d39, 0, 1.16, 0, 0.25, 0.37, 0.17);
    limb(this.fan, true, 0xb98565, 0, 1.68, 0, 0.137, 0.165, 0.135);
    limb(this.fan, true, 0x5a443c, 0, 1.78, 0.01, 0.14, 0.083, 0.14);
    for (const [i, hand] of this.hands.entries()) {
      const sign = i === 0 ? -1 : 1;
      this.fan.add(hand);
      hand.position.set(sign * 0.22, 1.36, -0.04);
      limb(hand, true, 0xba896d, 0, -0.025, -0.12, 0.075, 0.082, 0.169);
      limb(hand, true, 0xc89677, 0, 0.1, -0.25, 0.069, 0.149, 0.07);
    }
    const finishBoard = new Group();
    place(finishBoard, 10855, 0);
    finishBoard.position.y += 5.2;
    this.finishPaint.map = finish!;
    const banner = new Mesh(this.finishPlane, this.finishPaint);
    banner.position.z = 0.416;
    finishBoard.add(banner);
    this.root.add(finishBoard);
  }
  update(metres: number, time: number) {
    const pedalling =
      Math.abs(metres - 2350) < 220 ||
      Math.abs(metres - 4810) < 200 ||
      Math.abs(metres - 8800) < 130;
    const rider = this.climber.group;
    rider.visible = pedalling;
    this.shown.climberPedal = null;
    if (pedalling) {
      const p = this.course.place(metres + 9.4 + 1.5 * Math.sin(time * 0.38), -0.97, this.p);
      rider.position.set(p.x, p.y + 0.045, p.z);
      rider.rotation.set(-p.pitch, p.heading, 0, 'YXZ');
      const angle = time * 7.1;
      this.climber.pose(angle, 0.78);
      this.shown.climberPedal = angle;
    }
    this.flag.visible = Math.abs(metres - 4822) < 165;
    this.shown.flagWave = null;
    if (this.flag.visible) {
      const pos = this.cloth.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const x = this.clothRest[i * 3]! + 0.615;
        pos.setZ(i, x * 0.18 * Math.sin(time * 3.7 - x * 5 + this.clothRest[i * 3 + 1]! * 0.5));
      }
      pos.needsUpdate = true;
      this.shown.flagWave = pos.getZ(pos.count - 1);
    }
    this.fan.visible = Math.abs(metres - 10834) < 145;
    this.shown.fanClap = null;
    if (this.fan.visible) {
      const angle = 0.36 + 0.34 * Math.sin(time * 5.3);
      for (const [i, hand] of this.hands.entries()) hand.rotation.y = (i === 0 ? -1 : 1) * angle;
      this.shown.fanClap = this.hands[0]!.rotation.y;
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
    for (const item of this.climber.owned) item.dispose();
    this.kit.dispose();
    this.fan.clear();
    this.flag.clear();
    for (const item of [
      this.plain,
      this.cube,
      this.ball,
      this.pole,
      this.cloth,
      this.finishPlane,
      this.finishPaint,
      ...this.paint.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
    this.paint.clear();
  }
}
