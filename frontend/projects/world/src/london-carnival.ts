import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 130, 1.2, 2.2],
  [1040, 1063, -1.9, 2.15],
  [2130, 2159, -6.3, 2.4],
  [3090, 3114, 1.4, 2.35],
  [4370, 4402, 0, 2.5],
  [5610, 5630, -6.4, 1.8],
] as const;
export class LondonCarnival {
  readonly root = new Group();
  readonly materials = {
    GroveTarmac: new MeshBasicMaterial({ side: DoubleSide, vertexColors: true }),
    GroveTerraces: new MeshBasicMaterial({ side: DoubleSide }),
    CarnivalPavements: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    LondonMas: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    PlaneTrees: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    CaribbeanFlags: new MeshBasicMaterial({ side: DoubleSide }),
    BassBins: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly float = new Group();
  private readonly dancers = new Group();
  private readonly smoke = new Group();
  private readonly arms: Group[] = [];
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly sphere = new SphereGeometry(1, 12, 8);
  private readonly wheel = new CylinderGeometry(1, 1, 1, 16);
  private readonly bowl = new SphereGeometry(1, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  private readonly dyes = new Map<number, MeshLambertMaterial>();
  private readonly wings: PlaneGeometry[] = [];
  private readonly vapour = new MeshBasicMaterial({
    color: 0xc3b9a7,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  private readonly shown = {
    masStep: null as number | null,
    panTravel: null as number | null,
    smokeRise: null as number | null,
  };
  static async load(course: Course) {
    const res = await Promise.allSettled(
      ['road', 'terraces', 'crowd', 'mas', 'tree', 'flags', 'amps'].map((key) =>
        new TextureLoader().loadAsync('courses/nottinghill-' + key + '.webp'),
      ),
    );
    const maps = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      error = res.find((r) => r.status === 'rejected');
    if (error) {
      for (const map of maps) map.dispose();
      throw error.reason;
    }
    return new LondonCarnival(course, maps);
  }
  private part(
    parent: Group,
    geometry: BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
  ) {
    let mat = this.dyes.get(c);
    if (!mat) {
      mat = new MeshLambertMaterial({ color: c, side: DoubleSide });
      this.dyes.set(c, mat);
    }
    const mesh = new Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, l);
    parent.add(mesh);
    return mesh;
  }
  private stand(group: Group, d: number, offset: number) {
    const p = this.course.place(d, offset, this.p);
    group.position.set(p.x, p.y + 0.08, p.z);
    group.rotation.set(-p.pitch, p.heading, 0, 'YXZ');
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [road, homes, crowd, mas, tree, flags, amps] = textures;
    road!.wrapS = road!.wrapT = MirroredRepeatWrapping;
    this.materials.GroveTarmac.map = road!;
    this.materials.GroveTerraces.map = homes!;
    this.materials.CarnivalPavements.map = crowd!;
    this.materials.LondonMas.map = mas!;
    this.materials.PlaneTrees.map = tree!;
    this.materials.CaribbeanFlags.map = flags!;
    this.materials.BassBins.map = amps!;
    this.root.add(this.float, this.smoke, this.dancers);
    for (let i = 0; i < 3; i++) {
      const plane = new PlaneGeometry(2.05, 2.95);
      const uv = plane.attributes['uv']!;
      for (let v = 0; v < uv.count; v++) uv.setXY(v, (i + uv.getX(v)) / 3, 1 - uv.getY(v));
      const dancer = new Group();
      const mesh = new Mesh(plane, this.materials.LondonMas);
      mesh.position.y = 1.48;
      dancer.add(mesh);
      this.wings.push(plane);
      this.dancers.add(dancer);
    }
    this.part(this.float, this.cube, 0x39454b, 0, 0.97, 0, 2.6, 0.41, 6.55);
    this.part(this.float, this.cube, 0xe6b047, 0, 1.23, 0, 2.78, 0.13, 6.63);
    this.part(this.float, this.cube, 0x2e838c, 0, 1.34, -3.72, 2.22, 1.34, 1.57);
    this.part(this.float, this.cube, 0x9fbac0, 0, 1.79, -4.52, 1.89, 0.68, 0.036);
    this.part(this.float, this.cube, 0xd9953d, 0, 2.06, -3.72, 2.25, 0.16, 1.7);
    for (const side of [-1, 1]) {
      for (const z of [-3.65, 1.52, 2.48])
        this.part(
          this.float,
          this.wheel,
          0x36373a,
          side * 1.13,
          0.47,
          z,
          0.41,
          0.23,
          0.41,
        ).rotation.z = Math.PI / 2;
      for (const z of [-2.95, 2.95])
        this.part(this.float, this.cube, 0x728078, side * 1.26, 2.28, z, 0.09, 2.03, 0.09);
      this.part(this.float, this.cube, 0xd6a033, side * 1.26, 3.35, 0, 0.11, 0.15, 6.3);
    }
    for (let i = 0; i < 3; i++) {
      const x = i % 2 === 0 ? -0.66 : 0.66,
        z = -1.95 + i * 1.87;
      const skin = [0x78513b, 0xb38059, 0x9b6b51][i]!;
      this.part(
        this.float,
        this.sphere,
        [0xcb583e, 0x327f87, 0xd8ad43][i]!,
        x,
        2.3,
        z,
        0.23,
        0.39,
        0.16,
      );
      this.part(this.float, this.sphere, skin, x, 2.83, z, 0.143, 0.17, 0.135);
      this.part(this.float, this.sphere, 0x483b33, x, 2.94, z, 0.145, 0.075, 0.13);
      for (const side of [-1, 1]) {
        this.part(this.float, this.cube, 0x3e5260, x + side * 0.1, 1.7, z, 0.16, 0.85, 0.17);
        const g = new Group();
        g.position.set(x + side * 0.22, 2.47, z - 0.07);
        this.arms.push(g);
        this.float.add(g);
        this.part(g, this.sphere, skin, 0, -0.08, -0.115, 0.066, 0.096, 0.147);
        this.part(g, this.cube, 0x9b7757, 0, -0.12, -0.33, 0.025, 0.025, 0.32);
      }
      this.part(this.float, this.bowl, 0xc4ced0, x, 2.33, z - 0.52, 0.47, 0.21, 0.43);
      for (const side of [-1, 1])
        this.part(
          this.float,
          this.cube,
          0x747e80,
          x + side * 0.39,
          1.81,
          z - 0.52,
          0.034,
          0.99,
          0.044,
        );
    }
    for (let i = 0; i < 6; i++) this.smoke.add(new Mesh(this.sphere, this.vapour));
    this.stand(this.smoke, 5630, -6.4);
  }
  update(metres: number, time: number) {
    this.dancers.visible = Math.abs(metres - 1040) < 130 || Math.abs(metres - 3110) < 120;
    this.shown.masStep = null;
    if (this.dancers.visible) {
      for (const [i, obj] of this.dancers.children.entries()) {
        const phase = time * 2.4 + i * 2.07;
        const p = this.course.place(
          metres + 8 + i * 4.1 + 0.4 * Math.cos(phase * 0.5),
          i % 2 === 0 ? -2.5 : 2.65,
          this.p,
        );
        obj.position.set(p.x, p.y + 0.08 + 0.08 * Math.abs(Math.sin(phase)), p.z);
        obj.rotation.set(
          0,
          p.heading + 0.16 * Math.sin(phase * 0.52),
          0.06 * Math.cos(phase),
          'YXZ',
        );
      }
      this.shown.masStep = this.dancers.children[0]!.rotation.z;
    }
    this.float.visible = Math.abs(metres - 3090) < 190;
    this.shown.panTravel = null;
    if (this.float.visible) {
      const d = metres + 11 + 2.8 * Math.sin(time * 0.22);
      this.stand(this.float, d, 1.5);
      this.shown.panTravel = d;
      for (const [i, arm] of this.arms.entries())
        arm.rotation.x = 0.24 * Math.sin(time * 5.9 + i * 1.7);
    }
    this.smoke.visible = Math.abs(metres - 5630) < 145;
    this.shown.smokeRise = null;
    if (this.smoke.visible) {
      for (const [i, puff] of this.smoke.children.entries()) {
        const p = (time * 0.28 + i / 6) % 1;
        puff.position.set(
          0.17 * Math.sin(p * 6 + i) + p * 0.73,
          1.11 + p * 2.32,
          0.13 * Math.cos(i) + p * 0.34,
        );
        puff.scale.set(0.18 + p * 0.37, 0.12 + p * 0.25, 0.17 + p * 0.29);
      }
      this.shown.smokeRise = this.smoke.children[0]!.position.y;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = stops.find((s) => Math.abs(metres - s[0]) < 90);
    if (!s) return;
    const blend = Math.min(1, (1 - Math.abs(metres - s[0]) / 90) * 1.65);
    const p = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.t),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.16 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + s[3] + (14 * (t.y - p.y)) / len - ahead.y) * blend;
  }
  report() {
    return this.shown;
  }
  dispose() {
    this.root.clear();
    this.float.clear();
    this.smoke.clear();
    this.dancers.clear();
    for (const d of [
      this.sphere,
      this.cube,
      this.wheel,
      this.bowl,
      this.vapour,
      ...this.wings,
      ...this.dyes.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      d.dispose();
    this.dyes.clear();
  }
}
