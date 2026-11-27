import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const views = [
  [80, 119, -9, 2.3],
  [3420, 3473, -94, 62],
  [6210, 6270, -74, -15],
  [10660, 10725, -90, 31],
  [15470, 15710, 0, -17],
  [20910, 20944, -13.3, 13.4],
] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const surface = () => new MeshBasicMaterial({ side: DoubleSide });
export class AndalusianRoad {
  readonly root = new Group();
  readonly materials = {
    IberianTrees: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.46 }),
    PuebloFacades: surface(),
    RondaMasonry: surface(),
    PuenteElevation: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    TajoCliff: surface(),
    SierraCrag: surface(),
    ZaharaRock: surface(),
    OliveEarth: surface(),
    VillageSetts: surface(),
    SierraRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    ZaharaWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly boat = new Group();
  private readonly griffon = new Group();
  private readonly bell = new Group();
  private readonly holder = new Group();
  private readonly box = new BoxGeometry();
  private readonly oval = new SphereGeometry(1, 10, 6);
  private readonly canopy = new CylinderGeometry(1, 1, 1, 12);
  private readonly bellRim = new CylinderGeometry(0.63, 1.05, 0.59, 18);
  private readonly bellCrown = new CylinderGeometry(0.24, 0.65, 0.85, 16);
  private readonly wingShape = new BufferGeometry();
  private readonly colors = new Map<number, MeshBasicMaterial>();
  private readonly wings: Mesh[] = [];
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    pueblosStation: 0,
    boatTravel: null as number | null,
    griffonFlight: null as number | null,
    bellAngle: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      results = await Promise.allSettled(
        ['trees', 'walls', 'masonry', 'gorge', 'sierra', 'soil', 'cobbles', 'puente'].map((key) =>
          loader.loadAsync('courses/pueblos-' + key + '.webp'),
        ),
      );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const t of textures) t.dispose();
      throw failure.reason;
    }
    return new AndalusianRoad(course, textures);
  }
  private paint(color: number) {
    let material = this.colors.get(color);
    if (!material) {
      material = new MeshBasicMaterial({ color, side: DoubleSide });
      this.colors.set(color, material);
    }
    return material;
  }
  private part(
    group: Group,
    geometry: BufferGeometry,
    color: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const mesh = new Mesh(geometry, this.paint(color));
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const [i, t] of textures.entries()) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
      if (i >= 2 && i <= 6) {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.anisotropy = 4;
      }
    }
    const m = this.materials;
    m.IberianTrees.map = textures[0]!;
    m.PuebloFacades.map = textures[1]!;
    m.RondaMasonry.map = textures[2]!;
    m.PuenteElevation.map = textures[7]!;
    m.TajoCliff.map = textures[3]!;
    m.SierraCrag.map = m.ZaharaRock.map = textures[4]!;
    m.OliveEarth.map = textures[5]!;
    m.VillageSetts.map = textures[6]!;
    m.SierraRoad.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(72).add(positionWorld.z.mul(89)))
        .mul(0.035)
        .add(0.966),
    );
    const ripples = sin(positionWorld.z.mul(2.97).add(sin(positionWorld.x.mul(0.87)).mul(2.4)))
      .add(sin(positionWorld.x.mul(2.1).add(positionWorld.z.mul(5.3))))
      .smoothstep(0.4, 1.67);
    m.ZaharaWater.colorNode = vertexColor().rgb.mul(ripples.mul(0.24).add(0.87));
    this.part(this.boat, this.oval, 0xeee6ce, 0, 0.06, 0, 1.08, 0.46, 3.24);
    this.part(this.boat, this.box, 0x8b715b, 0, 0.33, 0, 1.32, 0.16, 3.58);
    for (const z of [-1.06, 0.9])
      for (const x of [-0.58, 0.58])
        this.part(this.boat, this.canopy, 0x475450, x, 0.97, z, 0.035, 1.36, 0.035);
    this.part(this.boat, this.box, 0xd7ae60, 0, 1.66, -0.1, 1.57, 0.17, 2.7);
    this.part(this.boat, this.oval, 0x517f8d, 0, 0.73, 0.66, 0.28, 0.4, 0.25);
    this.part(this.boat, this.oval, 0xbd9a80, 0, 1.16, 0.66, 0.17, 0.21, 0.17);
    const wingPoints = [
      0, 0, 0, 1.1, 0.18, 0.29, 1.58, 0.09, 0.36, 1.39, 0.12, -0.03, 1.57, 0.06, -0.12, 1.3, 0.13,
      -0.25, 0.55, 0.12, -0.37, 0, 0.01, -0.3,
    ];
    this.wingShape.setAttribute('position', new Float32BufferAttribute(wingPoints, 3));
    this.wingShape.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6, 0, 6, 7]);
    this.part(this.griffon, this.oval, 0x654d39, 0, 0, 0, 0.17, 0.13, 0.49);
    this.part(this.griffon, this.oval, 0xc6ac85, 0, 0.09, 0.45, 0.095, 0.11, 0.15);
    for (const side of [-1, 1])
      this.wings.push(
        this.part(this.griffon, this.wingShape, 0x564438, side * 0.08, 0, 0.08, side, 1, 1),
      );
    this.part(this.bell, this.bellCrown, 0x716443, 0, -0.44, 0, 1, 1, 1);
    this.part(this.bell, this.bellRim, 0x756746, 0, -1.1, 0, 1, 1, 1);
    this.part(this.bell, this.oval, 0x423e35, 0, -1.44, 0, 0.14, 0.28, 0.14);
    this.part(this.holder, this.box, 0x6e5541, 0, 0.12, 0, 3.6, 0.23, 0.22);
    this.holder.add(this.bell);
    const t = course.place(20944, -13.3, this.p);
    this.holder.position.set(t.x, t.y + 18.6, t.z);
    this.holder.rotation.y = t.heading;
    this.root.add(this.boat, this.griffon, this.holder);
  }
  update(metres: number, time: number) {
    this.readings.pueblosStation = metres;
    this.readings.boatTravel = this.readings.griffonFlight = this.readings.bellAngle = null;
    this.boat.visible = Math.abs(metres - 6245) < 230;
    if (this.boat.visible) {
      const angle = time * 0.072;
      const p = this.course.place(6264 + 12 * Math.sin(angle), -69 - 5 * Math.cos(angle), this.p);
      this.boat.position.set(p.x, 472.25 + 0.046 * Math.sin(time * 1.3), p.z);
      this.boat.rotation.y = p.heading + angle;
      this.readings.boatTravel = this.boat.position.x;
    }
    this.griffon.visible = Math.abs(metres - 15540) < 180;
    if (this.griffon.visible) {
      const angle = time * 0.18;
      const p = this.course.place(15497 + 9 * Math.sin(angle), 14 + 5 * Math.cos(angle), this.p);
      this.griffon.position.set(p.x, p.y + 2.4 + 1.46 * Math.sin(angle * 0.85), p.z);
      this.griffon.rotation.y = p.heading + angle;
      for (const [i, wing] of this.wings.entries())
        wing.rotation.z = (i ? 1 : -1) * (0.12 + 0.17 * Math.sin(time * 2.3));
      this.readings.griffonFlight = this.griffon.position.x;
    }
    this.holder.visible = Math.abs(metres - 20944) < 170;
    if (this.holder.visible) {
      this.bell.rotation.x = 0.47 * Math.sin(time * 2.07);
      this.readings.bellAngle = this.bell.rotation.x;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = views.find((v) => Math.abs(metres - v[0]) < 71);
    if (!view) return;
    const f = Math.min(1, (1 - Math.abs(metres - view[0]) / 71) * 1.55);
    const r = this.course.place(metres, 0, this.p),
      t = this.course.place(view[1], view[2], this.q);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.3 - camera.y) * f;
    ahead.x += (r.x + (13 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.3 + (18 * (t.y + view[3] - r.y - 2.3)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const x of [
      this.oval,
      this.box,
      this.wingShape,
      this.canopy,
      this.bellRim,
      this.bellCrown,
      ...this.colors.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      x.dispose();
  }
}
