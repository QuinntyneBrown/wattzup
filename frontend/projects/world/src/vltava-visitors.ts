import {
  BoxGeometry,
  DoubleSide,
  Group,
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
import { positionWorld, sin, texture, uniform, uv, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 117, 0, 7],
  [3640, 3715, -25, 24],
  [6120, 6144, -10.4, 5.3],
  [10840, 10879, 5.4, 3.0],
  [16480, 16507, 0, 2.9],
  [21180, 21261, -57, 28],
] as const;
export class VltavaVisitors {
  readonly root = new Group();
  readonly materials = {
    PragueSetts: new MeshBasicNodeMaterial({ side: DoubleSide }),
    VltavaWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
    BohemianHouses: new MeshBasicMaterial({ side: DoubleSide }),
    SquareArcades: new MeshBasicMaterial({ side: DoubleSide }),
    BohemianStone: new MeshBasicMaterial({ side: DoubleSide }),
    BridgeSaints: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    PragueVisitors: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    GothicBelfry: new MeshBasicMaterial({ side: DoubleSide }),
    GothicTracery: new MeshBasicMaterial({ side: DoubleSide }),
    OldTownHall: new MeshBasicMaterial({ side: DoubleSide }),
    HradcanyRoofs: new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
    OrlojFace: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly phase = uniform(0);
  private readonly bubbles = new Group();
  private readonly boat = new Group();
  private readonly swans = new Group();
  private readonly hull = new BoxGeometry();
  private readonly sphere = new SphereGeometry(1, 14, 10);
  private readonly paint = new Map<number, MeshBasicMaterial>();
  private readonly film = new MeshBasicMaterial({
    color: 0xb6d5dc,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  });
  private readonly glint = new MeshBasicMaterial({
    color: 0xf4e4df,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  private readonly readings = {
    bubbleRise: null as number | null,
    boatTravel: null as number | null,
    swanGlide: null as number | null,
    pragueStation: 0,
  };
  private readonly p = point();
  private readonly q = point();
  static async load(course: Course) {
    const loader = new TextureLoader(),
      rs = await Promise.allSettled(
        [
          'houses',
          'arcades',
          'setts',
          'stone',
          'saints',
          'visitors',
          'orloj',
          'belfry',
          'tracery',
          'hall',
          'roofscape',
        ].map((n) => loader.loadAsync('courses/prague-' + n + '.webp')),
      );
    const textures = rs.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = rs.find((r) => r.status === 'rejected');
    if (failed) {
      for (const t of textures) t.dispose();
      throw failed.reason;
    }
    return new VltavaVisitors(course, textures);
  }
  private part(
    group: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rounded = false,
  ) {
    let m = this.paint.get(c);
    if (!m) {
      m = new MeshBasicMaterial({ color: c });
      this.paint.set(c, m);
    }
    const mesh = new Mesh(rounded ? this.sphere : this.hull, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    group.add(mesh);
    return mesh;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [houses, arcades, setts, stone, saints, visitors, clock, belfry, tracery, hall, roofs] =
      textures;
    setts!.wrapS = setts!.wrapT = stone!.wrapS = stone!.wrapT = MirroredRepeatWrapping;
    this.materials.BohemianHouses.map = houses!;
    this.materials.SquareArcades.map = arcades!;
    this.materials.BohemianStone.map = stone!;
    this.materials.BridgeSaints.map = saints!;
    this.materials.PragueVisitors.map = visitors!;
    this.materials.OrlojFace.map = clock!;
    this.materials.GothicBelfry.map = belfry!;
    this.materials.GothicTracery.map = tracery!;
    this.materials.OldTownHall.map = hall!;
    this.materials.HradcanyRoofs.map = roofs!;
    this.materials.PragueSetts.colorNode = texture(setts!, uv()).rgb.mul(
      vertexColor().rgb.mul(0.38).add(0.67),
    );
    const ripple = sin(
      positionWorld.x.mul(0.46).add(positionWorld.z.mul(1.28)).add(this.phase.mul(1.75)),
    );
    this.materials.VltavaWater.colorNode = vertexColor()
      .rgb.add(ripple.smoothstep(0.79, 0.995).mul(0.083))
      .mul(ripple.mul(0.027).add(0.98));
    const p = this.course.place(3663, 4.4, this.p);
    this.bubbles.position.set(p.x, p.y, p.z);
    for (let i = 0; i < 17; i++) {
      const bubble = new Group(),
        shell = new Mesh(this.sphere, this.film),
        rim = new Mesh(this.sphere, this.glint);
      rim.position.set(-0.37, 0.52, 0.55);
      rim.scale.set(0.18, 0.085, 0.1);
      bubble.add(shell, rim);
      this.bubbles.add(bubble);
    }
    // Shallow-draft sightseeing boat with a glazed passenger cabin, open stern and pilothouse.
    this.part(this.boat, 0x4b504d, 0, 0.52, 0, 2.56, 0.76, 9.36, true);
    this.part(this.boat, 0xb9a484, 0, 1.04, 0, 4.52, 0.23, 15.1);
    this.part(this.boat, 0xe9deca, 0, 1.31, -1.0, 4.23, 0.41, 11.32);
    this.part(this.boat, 0x748d91, 0, 2.01, -1.0, 4.16, 1.13, 10.94);
    for (let n = 0; n < 9; n++)
      for (const x of [-2.11, 2.11])
        this.part(this.boat, 0xf0e6d1, x, 2.03, -5.95 + 1.24 * n, 0.1, 1.14, 0.095);
    this.part(this.boat, 0xdac8ad, 0, 2.65, -1.02, 4.5, 0.22, 11.66);
    this.part(this.boat, 0xebe2ce, 0, 2.98, -4.43, 2.11, 0.64, 2.65);
    this.part(this.boat, 0x667f84, 0, 3.09, -5.77, 1.85, 0.35, 0.08);
    for (let n = 0; n < 5; n++)
      this.part(this.boat, 0xc6aa80, 0, 1.39, 4.9 + n * 0.45, 3.2, 0.18, 0.16);
    for (let i = 0; i < 5; i++) {
      const swan = new Group();
      this.part(swan, 0xe4e1cf, 0, 0.17, 0, 0.33, 0.23, 0.62, true);
      const neck = this.part(swan, 0xf0e9d5, 0, 0.48, -0.32, 0.103, 0.32, 0.094, true);
      neck.rotation.x = 0.21;
      this.part(swan, 0xf1ead4, 0, 0.74, -0.43, 0.12, 0.14, 0.16, true);
      this.part(swan, 0xbe8244, 0, 0.71, -0.6, 0.07, 0.046, 0.1, true);
      this.swans.add(swan);
    }
    this.root.add(this.bubbles, this.boat, this.swans);
  }
  update(metres: number, time: number) {
    this.readings.pragueStation = metres;
    this.phase.value = time;
    this.bubbles.visible = Math.abs(metres - 3663) < 165;
    this.boat.visible = this.swans.visible = Math.abs(metres - 10840) < 375;
    this.readings.bubbleRise = this.readings.boatTravel = this.readings.swanGlide = null;
    if (this.bubbles.visible) {
      for (const [i, b] of this.bubbles.children.entries()) {
        const t = (time * 0.18 + i / 17) % 1;
        b.position.set(
          t * 3.46 + Math.sin(i + t * 5) * 0.71,
          0.91 + t * 4.86,
          i * 0.22 + Math.sin(i + t * 4) * 0.46,
        );
        b.scale.setScalar(0.106 + 0.22 * t);
      }
      this.readings.bubbleRise = this.bubbles.children[0]!.position.y;
    }
    if (this.boat.visible) {
      const t = time * 0.028,
        p = this.course.place(10875 + 20 * Math.sin(t), 33 + 15 * Math.cos(t), this.p);
      this.boat.position.set(p.x, 182.19 + 0.06 * Math.sin(time * 0.92), p.z);
      this.boat.rotation.y = p.heading + 1.19 + 0.43 * Math.cos(t);
      this.readings.boatTravel = p.x;
      for (const [i, s] of this.swans.children.entries()) {
        const angle = t * 0.86 + i * 0.47,
          q = this.course.place(
            10850 + i * 2.73 + 2.8 * Math.cos(angle),
            14.8 + (i % 2) * 1.65 + 3.6 * Math.sin(angle),
            this.p,
          );
        s.position.set(q.x, 182.12 + 0.043 * Math.sin(time * 1.32 + i), q.z);
        s.rotation.y = q.heading + angle;
      }
      this.readings.swanGlide = this.swans.children[0]!.position.z;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((v) => Math.abs(metres - v[0]) < 78);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 78) * 1.58),
      r = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.q);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5.3 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5.3 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.44 - camera.y) * f;
    ahead.x += (r.x + (13.8 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13.8 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.44 + (19.1 * (t.y + s[3] - r.y - 2.44)) / (len + 5.3) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const resource of [
      this.sphere,
      this.hull,
      this.film,
      this.glint,
      ...this.paint.values(),
      ...this.textures,
      ...Object.values(this.materials),
    ])
      resource.dispose();
  }
}
