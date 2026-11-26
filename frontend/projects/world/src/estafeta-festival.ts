import {
  BoxGeometry,
  type BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, texture, uv, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 117, -2, 2.3],
  [1540, 1589, -15, 9.3],
  [3160, 3180, -2, 2.7],
  [5020, 5065, 3.1, 5],
  [7170, 7200, 1.1, 2.6],
  [8920, 8984, 0, 4.8],
] as const;
export class EstafetaFestival {
  readonly root = new Group();
  readonly materials = {
    EstafetaSetts: new MeshBasicNodeMaterial({ side: DoubleSide }),
    EstafetaHouses: new MeshBasicMaterial({ side: DoubleSide }),
    SanFerminCrowd: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    Ayuntamiento: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    CallePlaques: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly geo = new Set<BufferGeometry>();
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly ellipsoid = new SphereGeometry(1, 10, 7);
  private readonly cube = new BoxGeometry();
  private readonly runners: {
    body: Group;
    legs: Group[];
    arms: Group[];
    station: number;
    lane: number;
  }[] = [];
  private readonly scarf = new Group();
  private readonly folds: Group[] = [];
  private readonly confetti = new Group();
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    runnerStride: null as number | null,
    scarfFold: null as number | null,
    confettiDrop: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['houses', 'hall', 'crowd', 'wet-setts', 'plaques'].map((k) =>
        new TextureLoader().loadAsync('courses/pamplona-' + k + '.webp'),
      ),
    );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) {
      for (const t of images) t.dispose();
      throw failed.reason;
    }
    return new EstafetaFestival(course, images);
  }
  private paint(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshBasicMaterial({ color: c, side: DoubleSide });
      this.paints.set(c, m);
    }
    return m;
  }
  private shape(
    parent: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    cube = false,
  ) {
    const m = new Mesh(cube ? this.cube : this.ellipsoid, this.paint(c));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
    return m;
  }
  private person(parent: Group, staff: number, skin: number) {
    const shirt = staff === 1 ? 0x88b99a : staff === 2 ? 0x374d67 : 0xe9e6dc,
      trousers = staff ? 0x434958 : 0xe4e1d7,
      red = 0xc23740;
    this.shape(parent, shirt, 0, 1.14, 0, 0.24, 0.36, 0.145);
    this.shape(parent, trousers, 0, 0.85, 0, 0.208, 0.16, 0.14);
    this.shape(parent, skin, 0, 1.6, -0.015, 0.127, 0.169, 0.128);
    this.shape(parent, staff === 2 ? 0x33495c : 0x55483e, 0, 1.709, 0, 0.126, 0.079, 0.119);
    if (staff !== 2) {
      this.shape(parent, red, 0, 1.432, -0.016, 0.132, 0.054, 0.126);
      this.shape(parent, red, 0.07, 1.315, -0.135, 0.055, 0.13, 0.024).rotation.z = -0.28;
      this.shape(parent, red, 0, 0.937, 0, 0.215, 0.059, 0.151);
    }
    const legs: Group[] = [],
      arms: Group[] = [];
    for (const s of [-1, 1]) {
      const leg = new Group();
      leg.position.set(s * 0.108, 0.85, 0);
      this.shape(leg, trousers, 0, -0.198, 0, 0.098, 0.244, 0.099);
      this.shape(leg, trousers, 0, -0.537, 0.047, 0.078, 0.2, 0.075);
      this.shape(leg, 0x5c5956, 0, -0.735, -0.046, 0.083, 0.067, 0.147);
      parent.add(leg);
      legs.push(leg);
      const arm = new Group();
      arm.position.set(s * 0.197, 1.37, 0);
      this.shape(arm, shirt, s * 0.029, -0.114, 0, 0.081, 0.146, 0.079);
      this.shape(arm, skin, s * 0.04, -0.273, -0.08, 0.059, 0.137, 0.064).rotation.x = 0.5;
      parent.add(arm);
      arms.push(arm);
    }
    if (staff === 1) {
      this.shape(parent, 0xf4f0df, 0, 1.19, -0.145, 0.2, 0.19, 0.025, true);
      this.shape(parent, red, 0, 1.19, -0.166, 0.139, 0.047, 0.01, true);
      this.shape(parent, red, 0, 1.19, -0.167, 0.046, 0.138, 0.01, true);
    }
    return { legs, arms };
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    this.geo.add(this.cube);
    this.geo.add(this.ellipsoid);
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [houses, hall, crowd, wet, plaques] = textures;
    this.materials.EstafetaHouses.map = houses!;
    this.materials.Ayuntamiento.map = hall!;
    this.materials.SanFerminCrowd.map = crowd!;
    this.materials.CallePlaques.map = plaques!;
    wet!.wrapS = wet!.wrapT = MirroredRepeatWrapping;
    const glint = sin(positionWorld.x.mul(0.52).add(positionWorld.z.mul(0.61))).smoothstep(
      0.56,
      0.98,
    );
    this.materials.EstafetaSetts.colorNode = texture(wet!, uv())
      .rgb.mul(vertexColor().rgb.mul(0.34).add(0.71))
      .add(glint.mul(0.018));
    for (const [i, station] of [104, 123, 345, 4964, 7188, 7206].entries()) {
      const body = new Group(),
        joints = this.person(body, 0, i % 2 ? 0xb68a6a : 0xc99a7e);
      this.runners.push({ body, ...joints, station, lane: i % 2 ? 2.93 : -2.87 });
      this.root.add(body);
    }
    for (const [i, station] of [115, 119, 7103, 7210].entries()) {
      const body = new Group();
      this.person(body, 1 + (i % 2), 0xba947e);
      const p = course.place(station, i < 2 ? 5.71 : -7.85, this.p);
      body.position.set(p.x, p.y, p.z);
      body.rotation.y = p.heading + 1.35;
      this.root.add(body);
    }
    const anchor = course.place(5045, 6.23, this.p);
    this.scarf.position.set(anchor.x, anchor.y + 7.58, anchor.z);
    this.scarf.rotation.y = anchor.heading;
    let joint = this.scarf;
    for (let i = 0; i < 5; i++) {
      const piece = new Group();
      piece.position.y = i ? -0.27 : 0;
      this.shape(piece, i % 2 ? 0xb32d3a : 0xc43c47, 0, -0.138, 0, 0.53, 0.29, 0.043, true);
      joint.add(piece);
      this.folds.push(piece);
      joint = piece;
    }
    const scrap = new PlaneGeometry(0.117, 0.064);
    this.geo.add(scrap);
    for (let i = 0; i < 31; i++)
      this.confetti.add(new Mesh(scrap, this.paint([0xc03941, 0xf0e7ce, 0xc9ac71][i % 3]!)));
    for (const [i, station] of [83, 123, 1548, 3156, 3188, 5026, 7179, 8906].entries()) {
      const p = course.place(station, 1.5 * Math.sin(i * 2.7), this.p);
      const stain = new Mesh(this.ellipsoid, this.paint(0x695553));
      stain.scale.set(0.2, 0.009, 0.36);
      stain.position.set(p.x, p.y + 0.068, p.z);
      this.root.add(stain);
      for (let j = 0; j < 9; j++) {
        const m = new Mesh(scrap, this.paint(j % 2 ? 0xa9474c : 0xc5bfa8));
        const q = course.place(station + (j % 3) * 0.65, (j - 4) * 0.58, this.q);
        m.position.set(q.x, q.y + 0.074, q.z);
        m.rotation.set(-Math.PI / 2, 0, j * 1.47);
        this.root.add(m);
      }
    }
    this.root.add(this.confetti, this.scarf);
  }
  update(metres: number, time: number) {
    this.readings.runnerStride = null;
    for (const [i, r] of this.runners.entries()) {
      r.body.visible = Math.abs(metres - r.station) < 170;
      if (!r.body.visible) continue;
      const d = r.station + 13 * Math.sin(time * 0.095 + i),
        p = this.course.place(d, r.lane, this.p),
        stride = Math.sin(time * 4.6 + i);
      r.body.position.set(p.x, p.y + 0.1 + 0.047 * Math.abs(stride), p.z);
      r.body.rotation.y = p.heading + (Math.cos(time * 0.095 + i) < 0 ? Math.PI : 0);
      for (const [j, l] of r.legs.entries()) {
        const direction = j ? 1 : -1;
        l.rotation.x = stride * 0.65 * direction;
        r.arms[j]!.rotation.x = -stride * 0.57 * direction - 0.22;
      }
      this.readings.runnerStride = r.legs[0]!.rotation.x;
    }
    this.scarf.visible = Math.abs(metres - 5045) < 190;
    for (const [i, s] of this.folds.entries())
      s.rotation.x = 0.1 + 0.17 * Math.sin(time * 2.6 - i * 0.54);
    this.readings.scarfFold = this.scarf.visible ? this.folds[2]!.rotation.x : null;
    this.confetti.visible = Math.abs(metres - 7191) < 195;
    this.readings.confettiDrop = null;
    if (this.confetti.visible) {
      for (const [i, m] of this.confetti.children.entries()) {
        const phase = (time * 0.19 + i * 0.119) % 1,
          p = this.course.place(
            7186 + (i % 7) * 2.63 + phase * 3,
            -2.9 + (i % 9) * 0.71 + 0.48 * Math.sin(time + i),
            this.p,
          );
        m.position.set(p.x, p.y + 0.15 + 5.47 * (1 - phase), p.z);
        m.rotation.set(time + i, time * 1.7 + i * 0.6, i + phase);
      }
      this.readings.confettiDrop = this.confetti.children[0]!.position.y;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((v) => Math.abs(metres - v[0]) < 72);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 72) * 1.4),
      r = this.course.place(metres, 0, this.p),
      t = this.course.place(s[0] === 3160 ? 3160 : s[1], s[0] === 3160 ? 0.5 : s[2], this.q);
    if (s[0] === 3160) {
      t.x -= 29.1 * Math.sin(t.heading);
      t.z -= 29.1 * Math.cos(t.heading);
    }
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (4.6 * dx) / len - camera.x) * f;
    camera.z += (r.z - (4.6 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.14 - camera.y) * f;
    ahead.x += (r.x + (12 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (12 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.14 + (16.6 * (t.y + s[3] - r.y - 2.14)) / (len + 4.6) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      ...this.geo,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
