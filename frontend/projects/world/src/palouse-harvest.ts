import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, uniform, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 148, 0, 4],
  [2760, 2810, -26, 4],
  [5480, 5519, 13.4, 2.2],
  [8250, 8302, -24, 8],
  [12320, 12770, -927, 87],
  [17620, 17910, -160, 7],
] as const;
export class PalouseHarvest {
  readonly root = new Group();
  readonly materials = {
    LoessFields: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PalouseLanes: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PalouseCrops: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    WhitmanBarn: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    PalouseMachines: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.39 }),
    WheatClouds: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.26, fog: false }),
  };
  private readonly cube = new BoxGeometry();
  private readonly round = new CylinderGeometry(1, 1, 1, 12);
  private readonly geo = new Set<BufferGeometry>([this.cube, this.round]);
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly grain = new Group();
  private readonly reel = new Group();
  private readonly hoppers = [new Group(), new Group(), new Group()];
  private readonly clock = uniform(0);
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    grainSway: null as number | null,
    reelAngle: null as number | null,
    hopperTravel: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['crops', 'barn', 'machinery', 'clouds'].map((k) =>
        new TextureLoader().loadAsync('courses/palouse-' + k + '.webp'),
      ),
    );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      failed = results.find((r) => r.status === 'rejected');
    if (failed) {
      for (const t of images) t.dispose();
      throw failed.reason;
    }
    return new PalouseHarvest(course, images);
  }
  private paint(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshBasicMaterial({ color: c });
      this.paints.set(c, m);
    }
    return m;
  }
  private box(
    parent: Group,
    color: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const m = new Mesh(this.cube, this.paint(color));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
    return m;
  }
  private axle(
    parent: Group,
    color: number,
    x: number,
    y: number,
    z: number,
    r: number,
    width: number,
  ) {
    const m = new Mesh(this.round, this.paint(color));
    m.position.set(x, y, z);
    m.scale.set(r, width, r);
    m.rotation.z = Math.PI / 2;
    parent.add(m);
    return m;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [crops, barn, machinery, cloud] = textures;
    this.materials.PalouseCrops.map = crops!;
    this.materials.WhitmanBarn.map = barn!;
    this.materials.PalouseMachines.map = machinery!;
    this.materials.WheatClouds.map = cloud!;
    // The wide contour swaths follow the actual height of the ground. Fine stalk rows inherit
    // the same turns and the moving shadow softens the sunlit side of each fold.
    const contour = positionWorld.y
      .mul(0.69)
      .add(positionWorld.x.mul(0.018))
      .add(sin(positionWorld.z.mul(0.021)).mul(0.65));
    const swath = sin(contour).mul(0.088).add(0.94);
    const rows = sin(contour.mul(6)).mul(0.028).add(0.98);
    const shadow = sin(
      positionWorld.x.mul(0.007).add(positionWorld.z.mul(0.012)).add(this.clock.mul(0.014)),
    ).smoothstep(0.47, 0.94);
    this.materials.LoessFields.colorNode = vertexColor()
      .rgb.mul(swath)
      .mul(rows)
      .mul(shadow.mul(-0.14).add(1));
    this.materials.PalouseLanes.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(79).add(positionWorld.z.mul(53)))
        .mul(0.043)
        .add(0.98),
    );
    const stalk = new PlaneGeometry(1.22, 1.02);
    stalk.translate(0, 0.51, 0);
    this.geo.add(stalk);
    const uv = stalk.attributes['uv']!;
    for (let i = 0; i < uv.count; i++) {
      uv.setX(i, uv.getX(i) * 0.33);
      uv.setY(i, 1 - uv.getY(i));
    }
    for (let i = 0; i < 20; i++) {
      const m = new Mesh(stalk, this.materials.PalouseCrops);
      m.rotation.y = 0.28 + (i % 4) * 0.44;
      m.position.set((i % 5) * 0.39, 0, Math.floor(i / 5) * 0.72);
      this.grain.add(m);
    }
    const field = course.place(100, 4.92, this.p);
    this.grain.position.set(field.x, field.y - 0.1, field.z);
    // The reel bars, spokes and axle turn together at the head of the parked machine.
    this.axle(this.reel, 0x65513c, 0, 0, 0, 0.094, 4.36);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        y = 0.69 * Math.cos(a),
        z = 0.69 * Math.sin(a);
      this.box(this.reel, 0x927341, 0, y, z, 4.32, 0.058, 0.064);
      for (const x of [-2, 0, 2])
        this.box(this.reel, 0x755f39, x, y * 0.5, z * 0.5, 0.052, 0.71, 0.054).rotation.x = a;
    }
    const turnout = course.place(5515, 12.45, this.p);
    const header = new Group();
    header.position.set(turnout.x, turnout.y + 0.91, turnout.z);
    header.rotation.y = turnout.heading + 0.57;
    header.add(this.reel);
    for (const [idx, g] of this.hoppers.entries()) {
      const body = idx === 1 ? 0xa89578 : 0x9a9c91;
      this.box(g, 0x545751, 0, 1.0, 0, 2.39, 0.32, 9.16);
      this.box(g, body, 0, 2.47, 0, 2.62, 2.17, 8.92);
      this.box(g, 0x777c73, 0, 3.62, 0, 2.73, 0.14, 8.99);
      for (const z of [-2.82, 0, 2.82]) {
        this.box(g, 0x898c80, 0, 1.36, z, 1.56, 0.79, 2.16);
        this.box(g, 0x7c8076, 0, 3.76, z, 1.38, 0.17, 1.87);
      }
      for (const z of [-3.64, -2.73, 2.73, 3.64])
        for (const side of [-1, 1]) this.axle(g, 0x4c504a, side * 0.78, 0.56, z, 0.4, 0.21);
      for (const side of [-1, 1])
        for (let z = -4; z <= 4; z++)
          this.box(g, 0xabaa9c, side * 1.32, 2.48, z, 0.065, 2.08, 0.085);
    }
    this.root.add(this.grain, header, ...this.hoppers);
  }
  update(metres: number, time: number) {
    this.clock.value = time;
    this.grain.visible = metres < 310;
    this.grain.rotation.z = 0.1 + 0.095 * Math.sin(time * 1.8);
    this.readings.grainSway = this.grain.visible ? this.grain.rotation.z : null;
    this.reel.visible = Math.abs(metres - 5515) < 230;
    this.reel.rotation.x = time * 0.88;
    this.readings.reelAngle = this.reel.visible ? this.reel.rotation.x : null;
    this.readings.hopperTravel = null;
    for (const [i, g] of this.hoppers.entries()) {
      g.visible = Math.abs(metres - 8300) < 270;
      if (!g.visible) continue;
      const station = 8286 + 24 * Math.sin(time * 0.045) + i * 10.1,
        p = this.course.place(station, -16.3, this.p);
      g.position.set(p.x, p.y - 0.1, p.z);
      g.rotation.y = p.heading;
      if (i === 0) this.readings.hopperTravel = g.position.x;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((s) => Math.abs(metres - s[0]) < 95);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 95) * 1.5),
      r = this.course.place(metres, 1.48, this.p),
      t = this.course.place(s[1], s[2], this.q),
      dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5.4 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5.4 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.35 - camera.y) * f;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.35 + (19.4 * (t.y + s[3] - r.y - 2.35)) / (len + 5.4) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const x of [
      ...this.geo,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      x.dispose();
  }
}
