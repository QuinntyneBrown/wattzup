import { positionWorld, sin, texture, vec2, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 106, 5, 2.2],
  [3620, 3655, 4, 2.35],
  [6370, 6430, -41, 2.55],
  [8490, 8521, -16, 2.45],
  [10320, 10365, 0, 2.5],
  [12310, 12365, 18, 3.65],
] as const;
function cloud() {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 96;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 18; i++) {
    const x = 29 + (i % 7) * 20 + Math.sin(i * 3.7) * 7,
      y = 49 + Math.sin(i * 1.7) * 14,
      r = 19 + 8 * Math.cos(i * 0.9);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(239,242,239,.34)');
    grad.addColorStop(1, 'rgba(228,234,233,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return new CanvasTexture(c);
}
export class WashingtonSummit {
  readonly root = new Group();
  private readonly p = point();
  private readonly t = point();
  private readonly train = new Group();
  private readonly alignment = new Group();
  private readonly cloudGroup = new Group();
  private readonly fans = new Group();
  private readonly bell = new Group();
  readonly materials = {
    AutoPavement: new MeshBasicNodeMaterial({ side: DoubleSide }),
    AutoForest: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 }),
    PresidentialRange: new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    }),
    AutoSigns: new MeshBasicMaterial({ side: DoubleSide }),
    SummitWalls: new MeshBasicMaterial({ side: DoubleSide }),
    AlpineTalus: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly round = new CylinderGeometry(1, 1, 1, 14);
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly quad = new PlaneGeometry(1, 1);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly haze = cloud();
  private readonly mist = new MeshBasicMaterial({
    map: this.haze,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    opacity: 0.59,
  });
  private readonly steam = new MeshBasicMaterial({
    map: this.haze,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    opacity: 0.88,
  });
  private readonly puffs: Mesh[] = [];
  private readonly vapour: Mesh[] = [];
  private readonly shown = {
    trainTravel: null as number | null,
    cloudTravel: null as number | null,
    bellSwing: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['forest', 'range', 'signs', 'walls', 'talus'].map((n) =>
        new TextureLoader().loadAsync('courses/mountwashington-' + n + '.webp'),
      ),
    );
    const imgs = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = results.find((r) => r.status === 'rejected');
    if (fail) {
      for (const img of imgs) img.dispose();
      throw fail.reason;
    }
    return new WashingtonSummit(course, imgs);
  }
  private part(
    group: Group,
    geo: BoxGeometry | CylinderGeometry | SphereGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
  ) {
    let mat = this.paints.get(c);
    if (!mat) {
      mat = new MeshLambertMaterial({ color: c });
      this.paints.set(c, mat);
    }
    const mesh = new Mesh(geo, mat);
    mesh.scale.set(w, h, l);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [forest, range, signs, walls, talus] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const img of images) {
      img.colorSpace = SRGBColorSpace;
      img.flipY = false;
    }
    this.materials.AutoForest.map = forest;
    this.materials.PresidentialRange.map = range;
    this.materials.AutoSigns.map = signs;
    this.materials.SummitWalls.map = walls;
    talus.wrapS = talus.wrapT = RepeatWrapping;
    talus.anisotropy = 4;
    this.materials.AlpineTalus.colorNode = texture(
      talus,
      vec2(positionWorld.x.mul(0.14), positionWorld.z.mul(0.14)),
    ).rgb.mul(0.89);
    this.materials.AutoPavement.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(61).add(positionWorld.z.mul(87)))
        .mul(0.038)
        .add(0.97),
    );
    const a = course.place(8540, -19, this.p);
    this.alignment.position.set(a.x, a.y - 2.2, a.z);
    this.alignment.rotation.set(Math.atan(0.14), a.heading, 0, 'YXZ');
    this.alignment.add(this.train);
    this.root.add(this.alignment);
    const black = 0x323532,
      red = 0x934435,
      trim = 0xc6a575;
    this.part(this.train, this.cube, black, 0, 0.72, 0, 2.16, 0.48, 6.1);
    const boiler = this.part(this.train, this.round, black, 0, 1.71, -0.57, 0.78, 3.95, 0.78);
    boiler.rotation.x = Math.PI / 2 - 0.11;
    this.part(this.train, this.round, black, 0, 2.85, -1.8, 0.27, 1.62, 0.27);
    this.part(this.train, this.round, black, 0, 3.65, -1.8, 0.37, 0.18, 0.37);
    this.part(this.train, this.cube, red, 0, 1.82, 1.83, 2.09, 1.86, 1.88);
    this.part(this.train, this.cube, black, 0, 2.88, 1.8, 2.4, 0.19, 2.16);
    this.part(this.train, this.cube, red, 0, 1.92, -8.25, 2.38, 2.56, 8.35);
    this.part(this.train, this.cube, black, 0, 3.29, -8.25, 2.68, 0.23, 8.72);
    for (const side of [-1, 1]) {
      this.part(this.train, this.cube, 0x718084, side * 1.05, 2.13, 1.8, 0.035, 0.81, 0.94);
      for (let j = 0; j < 6; j++)
        this.part(
          this.train,
          this.cube,
          0x889797,
          side * 1.2,
          2.2,
          -5.1 - j * 1.24,
          0.045,
          1.02,
          0.95,
        );
      for (const z of [-11.35, -5.4, -1.83, 0.43, 2.13]) {
        const wheel = this.part(
          this.train,
          this.round,
          black,
          side * 0.93,
          0.49,
          z,
          0.43,
          0.19,
          0.43,
        );
        wheel.rotation.z = Math.PI / 2;
      }
      this.part(this.train, this.cube, trim, side * 1.19, 1.36, -8.25, 0.045, 0.09, 8.3);
    }
    for (let i = 0; i < 6; i++) {
      const m = new Mesh(this.quad, this.steam);
      m.rotation.y = Math.PI * 0.32;
      this.train.add(m);
      this.puffs.push(m);
    }
    const f = course.place(12346, 5.9, this.p);
    this.fans.position.set(f.x, f.y + 0.77, f.z);
    this.fans.rotation.y = f.heading;
    this.root.add(this.fans);
    for (let i = 0; i < 11; i++) {
      const z = (i - 5) * 1.48,
        x = 0.32 * Math.sin(i * 2.4),
        base = -z * 0.17,
        skin = [0xbd8e70, 0x8a614b, 0xd4a685][i % 3]!;
      const shirt = [0xb64d43, 0x487591, 0xe2b059, 0x677d56][i % 4]!;
      this.part(this.fans, this.ball, shirt, x, base + 1.13, z, 0.23, 0.39, 0.163);
      this.part(this.fans, this.ball, skin, x, base + 1.65, z, 0.15, 0.18, 0.15);
      for (const side of [-1, 1])
        this.part(this.fans, this.cube, black, x + 0.1 * side, base + 0.47, z, 0.14, 0.86, 0.17);
      if (i === 5) {
        this.bell.position.set(x + 0.18, base + 1.4, z);
        this.part(this.bell, this.cube, skin, 0.13, 0.03, 0, 0.31, 0.14, 0.16);
        this.part(this.bell, this.round, trim, 0.31, 0.04, 0, 0.13, 0.22, 0.12);
        this.fans.add(this.bell);
      }
    }
    const cl = course.place(10365, 0, this.p);
    this.cloudGroup.position.set(cl.x, cl.y + 1.35, cl.z);
    this.cloudGroup.rotation.y = cl.heading;
    this.root.add(this.cloudGroup);
    for (let i = 0; i < 5; i++) {
      const m = new Mesh(this.quad, this.mist);
      m.scale.set(34 + i * 3, 5 + i * 0.7, 1);
      m.position.z = -5 * i;
      m.position.y = 1.8 + i * 0.22;
      this.cloudGroup.add(m);
      this.vapour.push(m);
    }
  }
  update(metres: number, time: number) {
    this.alignment.visible = Math.abs(metres - 8540) < 230;
    this.shown.trainTravel = null;
    if (this.alignment.visible) {
      this.train.position.z = 17 - 33 * Math.sin(time * 0.052);
      this.shown.trainTravel = this.train.position.z;
      for (const [i, m] of this.puffs.entries()) {
        const t = (time * 0.43 + i / 6) % 1;
        m.position.set(-2.3 * t, 3.8 + 2.9 * t, -1.8 + 3.6 * t);
        m.scale.set(1.3 + 3.4 * t, 1.4 + 2.3 * t, 1);
      }
    }
    this.cloudGroup.visible = Math.abs(metres - 10365) < 250;
    this.shown.cloudTravel = null;
    if (this.cloudGroup.visible) {
      for (const [i, m] of this.vapour.entries())
        m.position.x = Math.sin(time * 0.23 + i * 1.37) * 10;
      this.shown.cloudTravel = this.vapour[0]!.position.x;
    }
    this.fans.visible = Math.abs(metres - 12346) < 190;
    this.shown.bellSwing = null;
    if (this.fans.visible) {
      this.bell.rotation.z = 0.42 * Math.sin(time * 6.1);
      this.shown.bellSwing = this.bell.rotation.z;
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
    for (const g of [this.train, this.alignment, this.cloudGroup, this.fans, this.bell]) g.clear();
    for (const item of [
      this.cube,
      this.round,
      this.ball,
      this.quad,
      this.haze,
      this.mist,
      this.steam,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
    this.paints.clear();
  }
}
