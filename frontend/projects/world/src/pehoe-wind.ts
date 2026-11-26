import {
  BoxGeometry,
  BufferGeometry,
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
import { positionWorld, sin, texture, uniform, uv, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 108, 0, 3],
  [2240, 2590, -1120, 116],
  [4570, 4590, 9.8, 1.2],
  [7220, 7268, -80, 12],
  [9820, 9900, -1040, 122],
  [12540, 12790, -480, 38],
] as const;
export class PehoeWind {
  readonly root = new Group();
  readonly materials = {
    PehoeGravel: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PehoeWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PaineFarShore: new MeshBasicMaterial({ side: DoubleSide, vertexColors: true, fog: false }),
    CuernosRelief: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.39, fog: false }),
    TorresRelief: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.39, fog: false }),
    SaltoCurtain: new MeshBasicMaterial({ side: DoubleSide }),
    Coiron: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
    PaineCloud: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.22, fog: false }),
    Guanacos: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.41 }),
  };
  private readonly clock = uniform(0);
  private readonly grass = new Group();
  private readonly animal = new Group();
  private readonly neck = new Group();
  private readonly spray = new Group();
  private readonly sphere = new SphereGeometry(1, 10, 7);
  private readonly cube = new BoxGeometry();
  private readonly shapes = new Set<BufferGeometry>([this.sphere, this.cube]);
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    grassDrift: null as number | null,
    guanacoHead: null as number | null,
    fallSpray: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['gravel', 'coiron', 'guanacos', 'lenticular', 'cuernos', 'torres', 'salto', 'whitecaps'].map(
        (k) => new TextureLoader().loadAsync('courses/paine-' + k + '.webp'),
      ),
    );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const err = results.find((r) => r.status === 'rejected');
    if (err) {
      for (const image of images) image.dispose();
      throw err.reason;
    }
    return new PehoeWind(course, images);
  }
  private paint(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshBasicMaterial({ color: c });
      this.paints.set(c, m);
    }
    return m;
  }
  private part(
    parent: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const m = new Mesh(this.sphere, this.paint(c));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
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
    const [gravel, coiron, animals, cloud, cuernos, torres, salto, whitecaps] = textures;
    gravel!.wrapS = gravel!.wrapT = MirroredRepeatWrapping;
    this.materials.CuernosRelief.map = cuernos!;
    this.materials.TorresRelief.map = torres!;
    this.materials.SaltoCurtain.map = salto!;
    whitecaps!.wrapS = whitecaps!.wrapT = MirroredRepeatWrapping;
    this.materials.Coiron.map = coiron!;
    this.materials.Guanacos.map = animals!;
    this.materials.PaineCloud.map = cloud!;
    const ridges = sin(positionWorld.x.mul(14).add(positionWorld.z.mul(1.16)));
    this.materials.PehoeGravel.colorNode = vertexColor()
      .rgb.mul(texture(gravel!, uv()).rgb.mul(0.69).add(0.63))
      .mul(ridges.mul(0.035).add(0.98));
    const crest = sin(
      positionWorld.z.mul(2.48).add(positionWorld.x.mul(0.12)).add(this.clock.mul(2.1)),
    ).smoothstep(0.84, 1);
    const broken = sin(
      positionWorld.x.mul(1.58).add(positionWorld.z.mul(0.069)).sub(this.clock.mul(1.2)),
    ).smoothstep(0.39, 0.95);
    this.materials.PehoeWater.colorNode = vertexColor()
      .rgb.mul(
        texture(whitecaps!, positionWorld.xz.mul(0.021).add(this.clock.mul(0.0032)))
          .rgb.mul(0.49)
          .add(0.74),
      )
      .add(crest.mul(broken).mul(0.035));
    const blade = new PlaneGeometry(1.6, 1.14);
    blade.translate(0, 0.57, 0);
    this.shapes.add(blade);
    const coords = blade.attributes['uv']!;
    for (let i = 0; i < coords.count; i++) {
      coords.setX(i, coords.getX(i) * 0.328);
      coords.setY(i, 1 - coords.getY(i));
    }
    for (let i = 0; i < 16; i++) {
      const m = new Mesh(blade, this.materials.Coiron);
      m.position.set((i % 3) * 0.58, 0, Math.floor(i / 3) * 1.1);
      m.rotation.y = i * 0.63;
      this.grass.add(m);
    }
    const verge = course.place(102, 5.2, this.p);
    this.grass.position.set(verge.x, verge.y - 0.07, verge.z);
    const ochre = 0xa8754b,
      cream = 0xe6d5b6,
      dark = 0x564b42;
    this.part(this.animal, ochre, 0, 1.02, 0, 0.31, 0.43, 0.58);
    this.part(this.animal, cream, 0, 0.88, 0.04, 0.28, 0.26, 0.49);
    for (const side of [-1, 1])
      for (const end of [-1, 1]) {
        const z = end * 0.37,
          x = side * 0.17;
        this.part(this.animal, ochre, x, 0.65, z, 0.089, 0.28, 0.095);
        this.part(this.animal, cream, x, 0.27, z + 0.016, 0.063, 0.24, 0.062);
        this.part(this.animal, dark, x, 0.054, z - 0.018, 0.065, 0.064, 0.11);
      }
    this.neck.position.set(0, 1.14, -0.33);
    this.animal.add(this.neck);
    this.part(this.neck, ochre, 0, 0.4, -0.12, 0.135, 0.52, 0.147).rotation.x = -0.26;
    this.part(this.neck, 0x9c8065, 0, 0.85, -0.26, 0.14, 0.14, 0.24);
    this.part(this.neck, dark, 0, 0.82, -0.48, 0.094, 0.075, 0.13);
    for (const side of [-1, 1])
      this.part(this.neck, dark, side * 0.072, 1.06, -0.21, 0.041, 0.15, 0.054).rotation.z =
        -side * 0.15;
    this.part(this.animal, ochre, 0, 1.05, 0.6, 0.088, 0.12, 0.17);
    const grazing = course.place(4590, 7.55, this.p);
    this.animal.position.set(grazing.x, grazing.y + 0.04, grazing.z);
    this.animal.rotation.y = grazing.heading - 1.22;
    for (let i = 0; i < 22; i++) {
      const m = new Mesh(this.sphere, this.paint(i % 3 ? 0xd5e5dc : 0xabcfc9));
      this.spray.add(m);
    }
    this.root.add(this.grass, this.animal, this.spray);
  }
  update(metres: number, time: number) {
    this.clock.value = time;
    this.grass.visible = metres < 310;
    this.grass.rotation.z = -0.07 + 0.095 * Math.sin(time * 2.1);
    this.readings.grassDrift = this.grass.visible ? this.grass.rotation.z : null;
    this.animal.visible = Math.abs(metres - 4590) < 200;
    this.neck.rotation.x = -0.83 + 0.44 * Math.sin(time * 0.85);
    this.readings.guanacoHead = this.animal.visible ? this.neck.rotation.x : null;
    this.spray.visible = Math.abs(metres - 7261) < 290;
    this.readings.fallSpray = null;
    if (this.spray.visible) {
      for (const [i, m] of this.spray.children.entries()) {
        const phase = (time * 0.65 + i * 0.217) % 1,
          p = this.course.place(
            7263 + ((i % 11) - 5) * 4.8,
            -54 + ((i % 11) - 5) * 2.85 + phase * 1.6,
            this.p,
          );
        m.position.set(p.x, 84 + 14 * (1 - phase * phase), p.z);
        m.scale.set(0.66 + phase * 0.5, 0.53 + phase * 1.05, 0.58 + phase * 0.82);
      }
      this.readings.fallSpray = this.spray.children[0]!.position.y;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((v) => Math.abs(metres - v[0]) < 95);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 95) * 1.5),
      r = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.q);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5.5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5.5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.4 - camera.y) * f;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * f;
    const height = s[0] === 7220 ? 84 + s[3] : t.y + s[3];
    ahead.y += (r.y + 2.4 + (19.5 * (height - r.y - 2.4)) / (len + 5.5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const i of [
      ...this.shapes,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      i.dispose();
  }
}
