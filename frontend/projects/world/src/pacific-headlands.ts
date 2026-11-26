import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor, uv, smoothstep } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 118, -1, 2],
  [3180, 3276, 215, 34],
  [6830, 6898, 69, 34],
  [9960, 10048, 1, 13],
  [14340, 14404, 70, 27],
  [18860, 18927, 124, 10],
] as const;
function crestGeometry() {
  const vertices: number[] = [],
    idx: number[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32,
      x = (t - 0.5) * 24,
      v = 0.24 + 0.94 * Math.sin(Math.PI * t) ** 0.6,
      z = 0.7 * Math.sin(t * 11) + 0.22 * Math.cos(t * 29);
    vertices.push(x, 0, z, x, 0.17 + v * 0.14, z + v);
    if (i) {
      const n = i * 2;
      idx.push(n - 2, n - 1, n, n, n - 1, n + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  g.setIndex(idx);
  return g;
}
export class PacificHeadlands {
  readonly root = new Group();
  readonly materials = {
    BywayPavement: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PacificSurf: new MeshBasicMaterial({ side: DoubleSide, vertexColors: true }),
    SitkaSpruce: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.39 }),
    ShingleTown: new MeshBasicMaterial({ side: DoubleSide }),
    BywaySigns: new MeshBasicMaterial({ side: DoubleSide }),
    CoastBasalt: new MeshBasicMaterial({ side: DoubleSide, color: 0xcec7b5 }),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly spruce = new Group();
  private readonly lamp = new Group();
  private readonly breakers = new Group();
  private readonly mist = new Group();
  private readonly tree = new PlaneGeometry(8.8, 14);
  private readonly froth = crestGeometry();
  private readonly glow = new BufferGeometry();
  private readonly rays = new MeshBasicMaterial({
    color: 0xffefba,
    side: DoubleSide,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  private readonly white = new MeshBasicMaterial({
    color: 0xf0f3e7,
    side: DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  private readonly veil = new PlaneGeometry(190, 17, 1, 1);
  private readonly fogPaint = new MeshBasicNodeMaterial({
    side: DoubleSide,
    color: 0xd9e1df,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });
  private readonly shown = {
    spruceLean: null as number | null,
    lanternSweep: null as number | null,
    surfTravel: null as number | null,
  };
  static async load(course: Course) {
    const res = await Promise.allSettled(
      ['spruce', 'shingles', 'signs', 'basalt', 'surf'].map((key) =>
        new TextureLoader().loadAsync('courses/oregon-' + key + '.webp'),
      ),
    );
    const textures = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      fail = res.find((r) => r.status === 'rejected');
    if (fail) {
      for (const t of textures) t.dispose();
      throw fail.reason;
    }
    return new PacificHeadlands(course, textures);
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    this.fogPaint.opacityNode = smoothstep(0, 0.18, uv().x)
      .mul(smoothstep(0, 0.18, uv().x.oneMinus()))
      .mul(sin(uv().y.mul(Math.PI)))
      .mul(0.1);
    const [spruce, houses, signs, rock, surf] = textures;
    this.materials.SitkaSpruce.map = spruce!;
    this.materials.ShingleTown.map = houses!;
    this.materials.BywaySigns.map = signs!;
    for (const t of [rock!, surf!]) t.wrapS = t.wrapT = MirroredRepeatWrapping;
    this.materials.CoastBasalt.map = rock!;
    this.materials.PacificSurf.map = surf!;
    this.materials.BywayPavement.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(61).add(positionWorld.z.mul(78)))
        .mul(0.042)
        .add(0.94),
    );
    const treeUv = this.tree.attributes['uv']!;
    for (let i = 0; i < treeUv.count; i++)
      treeUv.setXY(i, 0.5 + 0.5 * treeUv.getX(i), 1 - treeUv.getY(i));
    for (const angle of [0.33, 1.84]) {
      const m = new Mesh(this.tree, this.materials.SitkaSpruce);
      m.rotation.y = angle;
      m.position.y = 6.83;
      this.spruce.add(m);
    }
    const treeAt = course.place(110, -7.93, this.p);
    this.spruce.position.set(treeAt.x, treeAt.y, treeAt.z);
    const tower = course.place(14404, 70, this.p);
    this.lamp.position.set(tower.x, 18 + 17.9 * 0.93, tower.z);
    this.glow.setAttribute(
      'position',
      new Float32BufferAttribute([0, 0, 0, 42, -1.3, -2.3, 42, 0.7, 2.3], 3),
    );
    for (const yaw of [0, Math.PI]) {
      const m = new Mesh(this.glow, this.rays);
      m.rotation.y = yaw;
      this.lamp.add(m);
    }
    for (let i = 0; i < 11; i++) {
      const m = new Mesh(this.froth, this.white);
      m.rotation.y = 0.31 * Math.sin(i * 2.7);
      this.breakers.add(m);
    }
    for (let i = 0; i < 3; i++) {
      const m = new Mesh(this.veil, this.fogPaint);
      m.rotation.y = 0.35 + i * 0.21;
      this.mist.add(m);
    }
    this.root.add(this.spruce, this.lamp, this.breakers, this.mist);
  }
  update(metres: number, time: number) {
    this.spruce.visible = Math.abs(metres - 110) < 190;
    this.shown.spruceLean = null;
    if (this.spruce.visible) {
      this.spruce.rotation.z = 0.035 + 0.047 * Math.sin(time * 1.28);
      this.shown.spruceLean = this.spruce.rotation.z;
    }
    this.lamp.visible = Math.abs(metres - 14404) < 270;
    this.shown.lanternSweep = null;
    if (this.lamp.visible) {
      this.lamp.rotation.y = time * 0.67;
      this.shown.lanternSweep = this.lamp.rotation.y;
    }
    const d =
      Math.abs(metres - 3276) < 260
        ? 3276
        : Math.abs(metres - 14404) < 255
          ? 14404
          : Math.abs(metres - 18927) < 270
            ? 18927
            : null;
    this.breakers.visible = this.mist.visible = d !== null;
    this.shown.surfTravel = null;
    if (d !== null) {
      const site = this.course.place(d, d === 3276 ? 190 : d === 14404 ? 118 : 129, this.p);
      this.breakers.position.set(site.x, 0.2, site.z);
      this.breakers.rotation.y = site.heading + Math.PI / 2;
      this.mist.position.set(site.x, 4, site.z);
      for (const [i, m] of this.breakers.children.entries()) {
        const phase = time * 0.68 + i * 0.72;
        m.position.set(
          ((i % 4) - 1.5) * 23 + 1.6 * Math.cos(phase),
          0.12 * Math.sin(phase),
          (Math.floor(i / 4) - 1) * 12 + 2.8 * Math.sin(phase),
        );
        m.scale.set(1 + 0.16 * Math.cos(phase), 1, 1 + 0.36 * Math.sin(phase));
      }
      for (const [i, m] of this.mist.children.entries())
        m.position.set(60 + i * 70 + 3.5 * Math.sin(time * 0.14 + i), i * 2.4, -107 - i * 22);
      this.shown.surfTravel = this.breakers.children[0]!.position.z;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((s) => Math.abs(metres - s[0]) < 92);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 92) * 1.6),
      p = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.t),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    const height = s[0] === 80 || s[0] === 9960 ? 2.2 : 3.35,
      target = s[0] === 80 || s[0] === 9960 ? t.y + s[3] : s[3];
    camera.x += (p.x - (5.5 * dx) / len - camera.x) * f;
    camera.z += (p.z - (5.5 * dz) / len - camera.z) * f;
    camera.y += (p.y + height - camera.y) * f;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * f;
    ahead.y += (p.y + height + (19.5 * (target - p.y - height)) / (len + 5.5) - ahead.y) * f;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.tree,
      this.froth,
      this.glow,
      this.rays,
      this.white,
      this.veil,
      this.fogPaint,
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
