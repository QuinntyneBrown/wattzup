import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 139, 0, 3],
  [3420, 3454, 2, 3.6],
  [10860, 10890, 1.2, 2.36],
  [11120, 11148, 0.32, 1.06],
  [11200, 11232, 0, 1.94],
  [13680, 13777, -73, 10.7],
] as const;
export class HarlechWeather {
  readonly root = new Group();
  readonly materials = {
    HarlechLane: new MeshBasicNodeMaterial({ side: DoubleSide }),
    GwyneddCottages: new MeshBasicMaterial({ side: DoubleSide }),
    WelshStone: new MeshBasicMaterial({ side: DoubleSide }),
    HarlechLocals: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    GwyneddSigns: new MeshBasicMaterial({ side: DoubleSide }),
    TremadogBay: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43, fog: false }),
  };
  private readonly geo = new Set<BufferGeometry>();
  private readonly paint = new Map<number, MeshBasicMaterial>();
  private readonly ball = new SphereGeometry(1, 10, 7);
  private readonly box = new BoxGeometry();
  private readonly spectator = new Group();
  private readonly arm = new Group();
  private readonly flag = new Group();
  private readonly panels: Group[] = [];
  private readonly drops = new BufferGeometry();
  private readonly lines = new LineBasicMaterial({
    color: 0xc3cfd8,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  private readonly rain = new LineSegments(this.drops, this.lines);
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    rainFall: null as number | null,
    spectatorWave: null as number | null,
    flagFold: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['cottages', 'stone', 'locals', 'signs', 'bay'].map((k) =>
        new TextureLoader().loadAsync('courses/penllech-' + k + '.webp'),
      ),
    );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) {
      for (const t of images) t.dispose();
      throw failed.reason;
    }
    return new HarlechWeather(course, images);
  }
  private colour(c: number) {
    let m = this.paint.get(c);
    if (!m) {
      m = new MeshBasicMaterial({ color: c, side: DoubleSide });
      this.paint.set(c, m);
    }
    return m;
  }
  private part(g: Group, c: number, pos: number[], size: number[], square = false) {
    const m = new Mesh(square ? this.box : this.ball, this.colour(c));
    m.position.set(pos[0]!, pos[1]!, pos[2]!);
    m.scale.set(size[0]!, size[1]!, size[2]!);
    g.add(m);
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
    const [houses, stone, locals, signs, bay] = textures;
    stone!.wrapS = stone!.wrapT = MirroredRepeatWrapping;
    this.materials.GwyneddCottages.map = houses!;
    this.materials.WelshStone.map = stone!;
    this.materials.HarlechLocals.map = locals!;
    this.materials.GwyneddSigns.map = signs!;
    this.materials.TremadogBay.map = bay!;
    const damp = sin(positionWorld.x.mul(0.48).add(positionWorld.z.mul(0.73))).smoothstep(
      0.33,
      0.92,
    );
    this.materials.HarlechLane.colorNode = vertexColor()
      .rgb.mul(
        sin(positionWorld.x.mul(72).add(positionWorld.z.mul(91)))
          .mul(0.047)
          .add(0.94),
      )
      .add(damp.mul(0.024));
    this.geo.add(this.box);
    this.geo.add(this.ball);
    this.geo.add(this.drops);
    for (const s of [-1, 1]) {
      this.part(this.spectator, 0x485058, [s * 0.098, 0.43, 0], [0.096, 0.41, 0.108]);
      this.part(this.spectator, 0x413c38, [s * 0.098, 0.082, -0.06], [0.099, 0.073, 0.16]);
    }
    this.part(this.spectator, 0x7c8a62, [0, 1.15, 0], [0.26, 0.42, 0.17]);
    this.part(this.spectator, 0xb8987c, [0, 1.67, 0], [0.14, 0.16, 0.13]);
    this.part(this.spectator, 0x5d6252, [0, 1.77, 0], [0.15, 0.08, 0.14]);
    this.part(this.spectator, 0x73825b, [-0.25, 1.13, 0], [0.082, 0.24, 0.09]);
    this.arm.position.set(0.2, 1.43, 0);
    this.arm.rotation.z = -0.67;
    this.part(this.arm, 0x71815a, [0.075, 0.162, 0], [0.084, 0.207, 0.09]);
    this.part(this.arm, 0xb49a7e, [0.11, 0.39, 0], [0.07, 0.1, 0.057]);
    this.spectator.add(this.arm);
    const p = course.place(11138, -2.52, this.p);
    this.spectator.position.set(p.x, p.y + 1.05, p.z);
    this.spectator.rotation.y = p.heading + 1.31;
    const pole = course.place(13760, -71.8, this.p);
    this.flag.position.set(pole.x, pole.y + 17.1, pole.z);
    this.flag.rotation.y = pole.heading - 0.3;
    this.part(this.flag, 0x62645f, [0, 1.8, 0], [0.08, 4.0, 0.08], true);
    let parent = this.flag;
    for (let i = 0; i < 5; i++) {
      const joint = new Group();
      joint.position.set(i ? 0.48 : 0, i ? 0 : 3.57, 0);
      this.part(joint, 0xe9e8dc, [0.24, -0.24, 0], [0.5, 0.48, 0.025], true);
      this.part(joint, 0x497957, [0.24, -0.72, 0], [0.5, 0.48, 0.025], true);
      if (i > 0 && i < 4)
        this.part(joint, 0xa42f3b, [0.24, -0.46, -0.027], [0.37, 0.26, 0.03], true).rotation.z =
          (i - 2) * 0.32;
      parent.add(joint);
      parent = joint;
      this.panels.push(joint);
    }
    this.drops.setAttribute('position', new Float32BufferAttribute(new Float32Array(48 * 6), 3));
    this.rain.frustumCulled = false;
    this.root.add(this.rain, this.spectator, this.flag);
  }
  update(metres: number, time: number) {
    const r = this.course.place(metres, 0, this.p);
    this.rain.position.set(r.x, r.y, r.z);
    this.rain.rotation.y = r.heading;
    this.rain.visible = metres < 13100;
    this.readings.rainFall = null;
    if (this.rain.visible) {
      const coords = this.drops.attributes['position']!;
      for (let i = 0; i < 48; i++) {
        const phase = (time * (0.81 + 0.09 * (i % 4)) + i * 0.137) % 1,
          x = (((i * 13) % 47) - 23) * 0.31 + phase * 1.23,
          y = 6.3 * (1 - phase),
          z = -((i * 7) % 19) + 2;
        coords.setXYZ(i * 2, x, y, z);
        coords.setXYZ(i * 2 + 1, x + 0.054, y - 0.27, z + 0.028);
      }
      coords.needsUpdate = true;
      this.readings.rainFall = coords.getY(0);
    }
    this.spectator.visible = Math.abs(metres - 11138) < 150;
    this.arm.rotation.z = -0.62 + 0.31 * Math.sin(time * 3.1);
    this.readings.spectatorWave = this.spectator.visible ? this.arm.rotation.z : null;
    this.flag.visible = Math.abs(metres - 13760) < 475;
    for (const [i, g] of this.panels.entries())
      g.rotation.y = 0.1 + 0.2 * Math.sin(time * 2.42 - i * 0.6);
    this.readings.flagFold = this.flag.visible ? this.panels[2]!.rotation.y : null;
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find(
      (v) => Math.abs(metres - v[0]) < (v[0] === 11120 || v[0] === 11200 ? 37 : 88),
    );
    if (!s) return;
    const f = Math.min(
        1,
        (1 - Math.abs(metres - s[0]) / (s[0] === 11120 || s[0] === 11200 ? 37 : 88)) * 1.4,
      ),
      r = this.course.place(metres, 0, this.p);
    const t = this.course.place(s[0] === 11200 ? metres + 24 : s[1], s[2], this.q),
      dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    const back = this.course.place(metres - 4.8, 0, this.q),
      height = back.y + 2.28;
    camera.x += (r.x - (4.8 * dx) / len - camera.x) * f;
    camera.z += (r.z - (4.8 * dz) / len - camera.z) * f;
    camera.y += (height - camera.y) * f;
    ahead.x += (r.x + (12.4 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (12.4 * dz) / len - ahead.z) * f;
    const focus = this.course.place(s[0] === 11200 ? metres + 24 : s[1], s[2], this.q);
    ahead.y += (height + (17.2 * (focus.y + s[3] - height)) / (len + 4.8) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    this.lines.dispose();
    for (const x of [
      ...this.geo,
      ...this.paint.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      x.dispose();
  }
}
