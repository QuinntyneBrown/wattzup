import {
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
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
const surface = (cutout = false) =>
  new MeshBasicMaterial({ side: DoubleSide, alphaTest: cutout ? 0.46 : 0 });
const views = [
  [80, 124, -16, 12],
  [5430, 5444, 14, 1.1],
  [11640, 11667, 7.2, 2.1],
  [12570, 12600, 0, 1.8],
  [13390, 13438, 1, 9],
  [15560, 15586, 21.5, 0],
] as const;

export class ArdennesRoadside {
  readonly root = new Group();
  readonly materials = {
    ArdennesAsphalt: surface(),
    WalloonFrontages: surface(),
    LiegeCrowd: surface(true),
    ArdennesFoliage: surface(true),
    FanLettering: surface(true),
    RedouteBoards: surface(),
  };
  private readonly box = new BoxGeometry();
  private readonly oval = new SphereGeometry(1, 12, 8);
  private readonly colours = new Map<number, MeshBasicMaterial>();
  private readonly cow = new Group();
  private readonly head = new Group();
  private readonly car = new Group();
  private readonly bridge = new Group();
  private readonly flag = new Group();
  private readonly cloth = new PlaneGeometry(1.65, 1.14, 12, 3);
  private readonly p = point();
  private readonly target = point();
  private readonly readings = {
    redouteStation: 0,
    flagWave: null as number | null,
    cowGraze: null as number | null,
    teamCarTravel: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['asphalt', 'materials', 'crowd', 'forest', 'paint', 'signs'].map((name) =>
        loader.loadAsync('courses/redoute-' + name + '.webp'),
      ),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const texture of textures) texture.dispose();
      throw failure.reason;
    }
    return new ArdennesRoadside(course, textures);
  }
  private colour(tint: number) {
    let material = this.colours.get(tint);
    if (!material) {
      material = new MeshBasicMaterial({ color: tint, side: DoubleSide });
      this.colours.set(tint, material);
    }
    return material;
  }
  private part(
    group: Group,
    tint: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    round = false,
  ) {
    const mesh = new Mesh(round ? this.oval : this.box, this.colour(tint));
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }
  private plant(group: Group, d: number, lane: number, up = 0) {
    const p = this.course.place(d, lane, this.p);
    group.position.set(p.x, p.y + up, p.z);
    group.rotation.y = p.heading;
    this.root.add(group);
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    Object.values(this.materials).forEach((mat, i) => {
      const texture = textures[i]!;
      texture.flipY = false;
      texture.colorSpace = SRGBColorSpace;
      mat.map = texture;
    });
    textures[0]!.wrapS = textures[0]!.wrapT = RepeatWrapping;
    textures[0]!.anisotropy = 4;
    this.plant(this.flag, 12582, -4.3);
    this.part(this.flag, 0x797974, 0, 1.8, 0, 0.052, 3.7, 0.052);
    this.cloth.translate(0.825, 3.06, 0);
    // Each row uses a separate group so the three sewn bands stay aligned as the cloth bends.
    this.cloth.clearGroups();
    for (let row = 0; row < 3; row++)
      for (let band = 0; band < 3; band++) this.cloth.addGroup((row * 12 + band * 4) * 6, 24, band);
    this.flag.add(
      new Mesh(
        this.cloth,
        [0x242421, 0xe9c948, 0xc7403e].map((c) => this.colour(c)),
      ),
    );
    this.plant(this.cow, 5444, 10);
    this.part(this.cow, 0xdedcd2, 0, 1.18, 0, 0.46, 0.58, 1.07, true);
    this.part(this.cow, 0x393831, 0.08, 1.29, 0.05, 0.43, 0.49, 0.54, true);
    for (const x of [-0.26, 0.26])
      for (const z of [-0.66, 0.68]) this.part(this.cow, 0xc9c7b9, x, 0.43, z, 0.14, 0.9, 0.15);
    this.head.position.set(0, 1.38, -0.77);
    this.cow.add(this.head);
    this.part(this.head, 0x413d36, 0, -0.09, -0.39, 0.26, 0.32, 0.44, true);
    this.part(this.head, 0xcbc4b2, 0, -0.16, -0.72, 0.22, 0.15, 0.23, true);
    for (const side of [-1, 1])
      this.part(this.head, 0x413d36, side * 0.26, 0.07, -0.39, 0.18, 0.08, 0.1, true);
    this.plant(this.bridge, 13413, 0, 14.7);
    this.bridge.add(this.car);
    this.part(this.car, 0xb13932, 0, 0.74, 0, 4.5, 0.76, 1.82);
    this.part(this.car, 0x536873, 0, 1.38, 0, 2.7, 0.67, 1.62);
    this.part(this.car, 0xe9e9dc, 0, 1.76, 0, 2.65, 0.12, 1.67);
    for (const x of [-1.46, 1.42])
      for (const z of [-0.89, 0.89])
        this.part(this.car, 0x2c3031, x, 0.43, z, 0.41, 0.41, 0.12, true);
  }
  update(metres: number, time: number) {
    this.readings.redouteStation = metres;
    this.flag.visible = Math.abs(metres - 12582) < 180;
    this.cow.visible = Math.abs(metres - 5444) < 150;
    this.bridge.visible = Math.abs(metres - 13413) < 250;
    this.readings.flagWave = this.readings.cowGraze = this.readings.teamCarTravel = null;
    if (this.flag.visible) {
      const p = this.cloth.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        p.setZ(i, x * (0.12 * Math.sin(x * 4 - time * 3) + 0.041 * Math.sin(x * 8 - time * 4)));
      }
      p.needsUpdate = true;
      this.readings.flagWave = p.getZ(8);
    }
    if (this.cow.visible) {
      this.head.rotation.x = -0.59 + 0.5 * Math.sin(time * 0.66);
      this.readings.cowGraze = this.head.rotation.x;
    }
    if (this.bridge.visible) {
      this.car.position.x = 56 * Math.sin(time * 0.145);
      this.readings.teamCarTravel = this.car.position.x;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = views.find((v) => Math.abs(metres - v[0]) < 55);
    if (!view) return;
    const f = Math.min(1, (1 - Math.abs(metres - view[0]) / 55) * 1.65);
    const r = this.course.place(metres, 0, this.p),
      t = this.course.place(view[1], view[2], this.target);
    const summit = view[0] === 15560;
    const eye = summit ? 5.3 : 2.2;
    if (summit) {
      this.course.place(metres, 2.15, r);
      t.y = r.y - 9.4;
    }
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + eye - camera.y) * f;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + eye + (19 * (t.y + view[3] - r.y - eye)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.box,
      this.oval,
      this.cloth,
      ...this.colours.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
