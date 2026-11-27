import { mix, positionWorld, sin, uniform, vec3, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 123, 4.5, 2.6],
  [1440, 1468, 5.4, 3.7],
  [2680, 2706, -4.8, 2.6],
  [3960, 4014, 10.8, 5.45],
  [5520, 5549, 4.3, 3.14],
  [7470, 7502, 0, 4.0],
] as const;
export class MuertosParade {
  readonly root = new Group();
  readonly night = uniform(0);
  readonly materials = {
    ReformaAsphalt: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ReformaFronts: new MeshBasicMaterial({ side: DoubleSide }),
    CalaveraCrowds: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    AngelDorado: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    PapelPicado: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    ReformaTrees: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly puppets = new Group();
  private readonly dancers = new Group();
  private readonly float = new Group();
  private readonly car = new Group();
  private readonly dancerRows: Group[] = [];
  private readonly quad = new PlaneGeometry(1, 1);
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly tire = new CylinderGeometry(1, 1, 1, 14);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly costumes: MeshBasicMaterial[] = [];
  private readonly shown = {
    catrinaSway: null as number | null,
    wingTurn: null as number | null,
    floatTravel: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['fronts', 'crowd', 'victory', 'picado', 'plane', 'catrina', 'monarch', 'alebrije'].map((n) =>
        new TextureLoader().loadAsync('courses/muertos-' + n + '.webp'),
      ),
    );
    const imgs = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = results.find((r) => r.status === 'rejected');
    if (fail) {
      for (const img of imgs) img.dispose();
      throw fail.reason;
    }
    return new MuertosParade(course, imgs);
  }
  private part(
    root: Group,
    shape: BoxGeometry | CylinderGeometry,
    col: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    let mat = this.paints.get(col);
    if (!mat) {
      mat = new MeshLambertMaterial({ color: col });
      this.paints.set(col, mat);
    }
    const m = new Mesh(shape, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    root.add(m);
    return m;
  }
  private panel(group: Group, mat: MeshBasicMaterial, w: number, h: number, bottom: number) {
    const m = new Mesh(this.quad, mat);
    m.position.y = bottom + h / 2;
    m.scale.set(w, h, 1);
    group.add(m);
    return m;
  }
  private anchor(root: Group, d: number, lane: number, extra = 0) {
    const p = this.course.place(d, lane, this.p);
    root.position.set(p.x, p.y + 0.046, p.z);
    root.rotation.y = p.heading + extra;
  }
  private chassis(group: Group, paint: number, w: number, length: number) {
    this.part(group, this.cube, paint, 0, 0.81, 0, w, 0.73, length);
    for (const x of [-1, 1])
      for (const z of [-1, 1]) {
        const wheel = this.part(
          group,
          this.tire,
          0x26242a,
          x * w * 0.47,
          0.44,
          z * length * 0.32,
          0.43,
          0.22,
          0.43,
        );
        wheel.rotation.z = Math.PI / 2;
        const hub = this.part(
          group,
          this.tire,
          0xd8ad70,
          x * w * 0.52,
          0.44,
          z * length * 0.32,
          0.22,
          0.08,
          0.22,
        );
        hub.rotation.z = Math.PI / 2;
      }
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [front, crowd, angel, flags, tree, ...actors] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      ...Texture[],
    ];
    for (const img of images) {
      img.colorSpace = SRGBColorSpace;
      img.flipY = false;
    }
    this.materials.ReformaFronts.map = front;
    this.materials.CalaveraCrowds.map = crowd;
    this.materials.AngelDorado.map = angel;
    this.materials.PapelPicado.map = flags;
    this.materials.ReformaTrees.map = tree;
    const grain = sin(positionWorld.x.mul(68).add(positionWorld.z.mul(79)))
      .mul(0.03)
      .add(0.96);
    this.materials.ReformaAsphalt.colorNode = vertexColor()
      .rgb.mul(grain)
      .mul(mix(vec3(0.99, 0.91, 0.91), vec3(0.53, 0.46, 0.61), this.night));
    const uv = this.quad.attributes['uv']!;
    for (let j = 0; j < uv.count; j++) uv.setY(j, 1 - uv.getY(j));
    for (const tex of actors)
      this.costumes.push(new MeshBasicMaterial({ map: tex, side: DoubleSide, alphaTest: 0.42 }));
    this.panel(this.puppets, this.costumes[0]!, 5.33, 6.9, 0.12);
    this.anchor(this.puppets, 1468, 5.6, 0.2);
    this.anchor(this.dancers, 2706, -4.8, 0.15);
    for (let j = 0; j < 7; j++) {
      const g = new Group();
      g.position.set((j % 2) * 1.9, 0, Math.floor(j / 2) * -4.35);
      this.panel(g, this.costumes[1]!, 2.47, 2.15, 0);
      this.dancers.add(g);
      this.dancerRows.push(g);
    }
    this.chassis(this.float, 0x92465d, 2.96, 6.76);
    this.part(this.float, this.cube, 0xe3a13e, 0, 1.24, 0, 3.28, 0.31, 7.12);
    this.panel(this.float, this.costumes[2]!, 5.2, 4.45, 1.4);
    this.chassis(this.car, 0x418b85, 2.18, 5.4);
    this.part(this.car, this.cube, 0x93a9b1, 0, 1.38, 0.23, 1.78, 0.62, 2.19);
    this.part(this.car, this.cube, 0x467e7b, 0, 1.72, 0.21, 1.83, 0.15, 2.02);
    for (const s of [-1, 1]) {
      this.part(this.car, this.cube, 0xf2d294, s * 0.77, 0.85, -2.74, 0.41, 0.19, 0.07);
      this.part(this.float, this.cube, 0xf6bd71, s * 1.65, 1.28, 0, 0.07, 0.095, 6.8);
    }
    this.root.add(this.puppets, this.dancers, this.float, this.car);
  }
  update(metres: number, time: number) {
    this.night.value = Math.min(1, Math.max(0, (metres - 1100) / 5800));
    this.puppets.visible = Math.abs(metres - 1468) < 170;
    this.shown.catrinaSway = null;
    if (this.puppets.visible) {
      this.puppets.rotation.z = 0.046 * Math.sin(time * 1.56);
      this.shown.catrinaSway = this.puppets.rotation.z;
    }
    this.dancers.visible = Math.abs(metres - 2706) < 180;
    this.shown.wingTurn = null;
    if (this.dancers.visible) {
      for (const [i, g] of this.dancerRows.entries()) {
        g.rotation.y = 0.5 * Math.sin(time * 1.4 + i);
        g.rotation.z = 0.055 * Math.cos(time * 2 + i);
        g.position.y = 0.042 * Math.abs(Math.sin(time * 1.82 + i));
      }
      this.shown.wingTurn = this.dancerRows[0]!.rotation.y;
    }
    this.float.visible = this.car.visible = Math.abs(metres - 5549) < 205;
    this.shown.floatTravel = null;
    if (this.float.visible) {
      const d = 5549 + 11 * Math.sin(time * 0.13);
      this.anchor(this.float, d, 4.15, 0.28);
      this.anchor(this.car, d + 12, 4.5);
      this.shown.floatTravel = d;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = stops.find((s) => Math.abs(metres - s[0]) < 90);
    if (!stop) return;
    const blend = Math.min(1, (1 - Math.abs(metres - stop[0]) / 90) * 1.65);
    const p = this.course.place(metres, 0, this.p),
      t = this.course.place(stop[1], stop[2], this.t),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.16 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + stop[3] + (14 * (t.y - p.y)) / len - ahead.y) * blend;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    for (const g of [this.puppets, this.dancers, this.float, this.car]) g.clear();
    for (const item of [
      this.quad,
      this.cube,
      this.tire,
      ...this.paints.values(),
      ...this.costumes,
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
    this.paints.clear();
  }
}
