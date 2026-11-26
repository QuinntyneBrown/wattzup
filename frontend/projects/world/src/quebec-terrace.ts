import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const lapLength = 6612.5;
const views = [
  [80, 118, 17, 4.6],
  [1080, 1108, -8, 3.7],
  [2260, 2450, -57, 63],
  [3390, 3420, 0, 6.8],
  [4630, 4660, -11.8, 4.4],
  [5557.5, 5580, 0, 6.1],
] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const surface = () => new MeshBasicMaterial({ side: DoubleSide });
export class QuebecTerrace {
  readonly root = new Group();
  readonly materials = {
    QuebecHouses: surface(),
    QuebecMaples: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    RampartStone: surface(),
    ChateauCopper: surface(),
    DufferinPlanks: surface(),
    QuebecSetts: surface(),
    SaintLawrence: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly sign = new Group();
  private readonly flag = new Group();
  private readonly ferry = new Group();
  private readonly box = new BoxGeometry();
  private readonly oval = new SphereGeometry(1, 14, 7);
  private readonly shop = new PlaneGeometry(2.05, 1.02);
  private readonly cloth = new PlaneGeometry(2.15, 1.07, 9, 3);
  private readonly signPaint = surface();
  private readonly flagPaint = surface();
  private readonly colors = new Map<number, MeshBasicMaterial>();
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    quebecStation: 0,
    shopSignSwing: null as number | null,
    flagFold: null as number | null,
    ferryTravel: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      result = await Promise.allSettled(
        ['walls', 'maples', 'limestone', 'copper', 'planks', 'setts', 'shop', 'flag'].map((k) =>
          loader.loadAsync('courses/quebec-' + k + '.webp'),
        ),
      );
    const textures = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = result.find((r) => r.status === 'rejected');
    if (failure) {
      for (const t of textures) t.dispose();
      throw failure.reason;
    }
    return new QuebecTerrace(course, textures);
  }
  private part(
    group: Group,
    color: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    shape = this.box as BoxGeometry | SphereGeometry,
  ) {
    let material = this.colors.get(color);
    if (!material) {
      material = new MeshBasicMaterial({ color });
      this.colors.set(color, material);
    }
    const mesh = new Mesh(shape, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    group.add(mesh);
    return mesh;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const [i, t] of textures.entries()) {
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
      if (i >= 2 && i <= 5) {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.anisotropy = 4;
      }
    }
    const m = this.materials;
    [
      m.QuebecHouses,
      m.QuebecMaples,
      m.RampartStone,
      m.ChateauCopper,
      m.DufferinPlanks,
      m.QuebecSetts,
      this.signPaint,
      this.flagPaint,
    ].forEach((material, i) => (material.map = textures[i]!));
    const waves = sin(positionWorld.z.mul(0.95).add(sin(positionWorld.x.mul(1.07)).mul(2.1)))
      .add(sin(positionWorld.z.mul(3.1).add(positionWorld.x.mul(0.32))))
      .smoothstep(0.33, 1.68);
    m.SaintLawrence.colorNode = vertexColor().rgb.mul(waves.mul(0.23).add(0.89));
    const p = this.course.place(1093, -5.6, this.p);
    const frame = new Group();
    frame.position.set(p.x, p.y + 3.25, p.z);
    frame.rotation.y = p.heading;
    this.part(frame, 0x344941, 1.04, 0.18, 0, 2.25, 0.1, 0.11);
    this.part(frame, 0x344941, 2.1, -0.37, 0, 0.098, 1.19, 0.11);
    const placard = new Mesh(this.shop, this.signPaint);
    placard.position.y = -0.63;
    this.sign.add(placard);
    for (const side of [-1, 1])
      this.part(this.sign, 0x4a4e45, side * 0.76, -0.095, 0, 0.043, 0.25, 0.04);
    frame.add(this.sign);
    this.root.add(frame);
    const flagpole = this.course.place(4660, -11.8, this.p);
    this.flag.position.set(flagpole.x, flagpole.y + 7.58, flagpole.z);
    this.flag.rotation.y = flagpole.heading + 0.15;
    this.cloth.translate(1.075, -0.46, 0);
    const fabric = new Mesh(this.cloth, this.flagPaint);
    this.flag.add(fabric);
    this.root.add(this.flag);
    this.part(this.ferry, 0x485966, 0, 0.45, 0, 4.2, 1.2, 15.3, this.oval);
    this.part(this.ferry, 0xdbdfd8, 0, 1.55, 0, 6.3, 1.42, 20.2);
    this.part(this.ferry, 0xeff0e6, 0, 2.9, -0.17, 5.2, 1.47, 15.9);
    for (let j = -3; j <= 3; j++)
      for (const side of [-1, 1])
        this.part(this.ferry, 0x416478, side * 2.63, 3.04, j * 1.93, 0.09, 0.64, 1.3);
    this.part(this.ferry, 0x687878, 0, 3.73, 0, 5.56, 0.22, 17.1);
    this.part(this.ferry, 0xd6dcd7, 0, 4.41, 3.8, 3.65, 1.36, 4.52);
    this.part(this.ferry, 0x92463a, 0, 4.71, -2.5, 1.36, 1.86, 1.51);
    this.part(this.ferry, 0x334c57, 0, 4.67, 6.09, 2.9, 0.52, 0.1);
    this.root.add(this.ferry);
  }
  update(metres: number, time: number) {
    const d = ((metres % lapLength) + lapLength) % lapLength;
    this.readings.quebecStation = metres;
    this.readings.shopSignSwing = this.readings.flagFold = this.readings.ferryTravel = null;
    this.sign.visible = Math.abs(d - 1093) < 140;
    if (this.sign.visible) {
      this.sign.rotation.x = 0.19 * Math.sin(time * 1.54);
      this.readings.shopSignSwing = this.sign.rotation.x;
    }
    this.flag.visible = Math.abs(d - 4660) < 191;
    if (this.flag.visible) {
      const vertices = this.cloth.getAttribute('position');
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        vertices.setZ(
          i,
          x * (0.16 * Math.sin(x * 4.4 - time * 2.64) + 0.046 * Math.sin(x * 8.12 - time * 3.72)),
        );
      }
      vertices.needsUpdate = true;
      this.readings.flagFold = vertices.getZ(9);
    }
    this.ferry.visible = Math.abs(d - 4630) < 345;
    if (this.ferry.visible) {
      this.ferry.position.set(
        1035 + 12 * Math.sin(time * 0.048),
        6.12 + 0.09 * Math.sin(time * 0.82),
        204 + 52 * Math.sin(time * 0.057),
      );
      this.ferry.rotation.y = 0.38 + 0.29 * Math.cos(time * 0.057);
      this.readings.ferryTravel = this.ferry.position.z;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = ((metres % lapLength) + lapLength) % lapLength;
    const view = views.find((v) => Math.abs(d - v[0]) < 65);
    if (!view) return;
    const f = Math.min(1, (1 - Math.abs(d - view[0]) / 65) * 1.6);
    const r = this.course.place(metres, 0, this.p),
      t = this.course.place(view[1], view[2], this.q);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.26 - camera.y) * f;
    ahead.x += (r.x + (13 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.26 + (18 * (t.y + view[3] - r.y - 2.26)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.shop,
      this.cloth,
      this.box,
      this.oval,
      this.signPaint,
      this.flagPaint,
      ...this.colors.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
