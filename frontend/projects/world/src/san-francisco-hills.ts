import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type BufferGeometry,
  type Texture,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, texture, uniform } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [100, 142, 11, 6],
  [1380, 1410, -2.8, 2],
  [2820, 2866, 0, 2.5],
  [4220, 4255, -4, 3],
  [6720, 6753, 3, 1],
  [8360, 8430, 0, 8],
] as const;
export class SanFranciscoHills {
  readonly root = new Group();
  readonly materials = {
    HillAsphalt: new MeshLambertNodeMaterial({ side: DoubleSide }),
    FilbertConcrete: new MeshLambertNodeMaterial({ side: DoubleSide }),
    LombardBrick: new MeshBasicMaterial({ side: DoubleSide }),
    RussianHillBays: new MeshBasicMaterial({ side: DoubleSide }),
    LombardFlowers: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 }),
    HillStreetSigns: new MeshBasicMaterial({ side: DoubleSide }),
    SFBay: new MeshLambertNodeMaterial({ side: DoubleSide }),
  };
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly box = new BoxGeometry();
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly wheelShape = new CylinderGeometry(1, 1, 1, 14);
  private readonly panel = new PlaneGeometry();
  private readonly trolley = new Group();
  private readonly streetCar = new Group();
  private readonly fog = new Group();
  private readonly wheels: Group[] = [];
  private readonly steering: Group[] = [];
  private readonly clock = uniform(0);
  private readonly dryFog: CanvasTexture;
  private readonly haze: MeshBasicMaterial;
  private readonly side: MeshBasicMaterial;
  private readonly end: MeshBasicMaterial;
  private readonly p = point();
  private readonly next = point();
  private readonly state = {
    cableCarWheel: null as number | null,
    steeringAngle: null as number | null,
    fogDrift: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader(),
      names = [
        'fishhill-tarmac',
        'sfhills-bricks',
        'sfhills-victorians',
        'sfhills-hydrangeas',
        'sfhills-signs',
        'sfhills-cable-side',
        'sfhills-cable-end',
      ];
    const results = await Promise.allSettled(
      names.map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const m of maps) m.dispose();
      throw failure.reason;
    }
    return new SanFranciscoHills(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    for (const t of maps.slice(0, 2)) {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = 4;
    }
    const pavement = texture(maps[0]!, positionWorld.xz.div(4.2)).rgb;
    this.materials.HillAsphalt.colorNode = pavement;
    this.materials.FilbertConcrete.colorNode = mix(pavement, color(0x999892), 0.72);
    this.materials.LombardBrick.map = maps[1]!;
    this.materials.RussianHillBays.map = maps[2]!;
    this.materials.LombardFlowers.map = maps[3]!;
    this.materials.HillStreetSigns.map = maps[4]!;
    this.materials.SFBay.colorNode = mix(
      color(0x74949c),
      color(0xa9c0c0),
      sin(
        positionWorld.z
          .mul(0.4)
          .add(sin(positionWorld.x.mul(0.08)))
          .add(this.clock.mul(0.42)),
      )
        .mul(0.115)
        .add(0.24),
    );
    this.side = new MeshBasicMaterial({ map: maps[5]!, side: DoubleSide });
    this.end = new MeshBasicMaterial({ map: maps[6]!, side: DoubleSide });
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    for (let i = 0; i < 32; i++) {
      const x = 18 + ((i * 107) % 230),
        y = 49 + 12 * Math.sin(i * 2.1),
        r = 16 + ((i * 19) % 28);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(223,229,224,0.38)');
      g.addColorStop(1, 'rgba(216,225,226,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    this.dryFog = new CanvasTexture(canvas);
    this.dryFog.colorSpace = SRGBColorSpace;
    this.haze = new MeshBasicMaterial({
      map: this.dryFog,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    this.makeCableCar();
    this.makeMotorCar();
    const en = course.place(8380, 0, this.p);
    for (let i = 0; i < 4; i++) {
      const sheet = new Mesh(this.panel, this.haze);
      sheet.position.set(
        -Math.sin(en.heading) * (640 + i * 75) + Math.cos(en.heading) * (i - 1) * 340,
        24 + i * 8,
        -Math.cos(en.heading) * (640 + i * 75) - Math.sin(en.heading) * (i - 1) * 340,
      );
      sheet.scale.set(820, 90 + i * 15, 1);
      sheet.rotation.y = en.heading;
      this.fog.add(sheet);
    }
    this.root.add(this.trolley, this.streetCar, this.fog);
    this.update(0, 0);
  }
  private paint(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshLambertMaterial({ color: c });
      this.paints.set(c, m);
    }
    return m;
  }
  private part(
    g: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    geometry: BufferGeometry = this.box,
  ) {
    const m = new Mesh(geometry, this.paint(c));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
    return m;
  }
  private makeCableCar() {
    const g = this.trolley,
      red = 0xa44436,
      cream = 0xf0deb4,
      timber = 0x995e36;
    this.part(g, 0x444643, 0, 0.44, 0, 2.16, 0.32, 7.25);
    this.part(g, red, 0, 0.92, 0, 2.24, 0.72, 6.8);
    this.part(g, timber, 0, 1.42, 0.45, 2.14, 0.22, 5.42);
    this.part(g, cream, 0, 2.89, 0, 2.58, 0.23, 7.58);
    this.part(g, timber, 0, 3.13, 0.15, 1.62, 0.27, 5.55);
    this.part(g, 0xa39979, 0, 3.33, 0.15, 1.82, 0.13, 5.83);
    for (const sg of [-1, 1]) {
      const skin = new Mesh(this.panel, this.side);
      skin.position.set(sg * 1.135, 1.79, 0.38);
      skin.rotation.y = (sg * Math.PI) / 2;
      skin.scale.set(5.99, 2.03, 1);
      g.add(skin);
      const cap = new Mesh(this.panel, this.end);
      cap.position.set(0, 1.85, sg * 3.416);
      cap.rotation.y = sg === 1 ? 0 : Math.PI;
      cap.scale.set(2.21, 1.92, 1);
      g.add(cap);
      this.part(g, 0xaa8e59, 0, 1.15, sg * 3.49, 0.27, 0.27, 0.12, this.ball);
      for (const z of [-3.25, -2.41, 2.21, 3.26])
        this.part(g, timber, sg * 1.07, 2.14, z, 0.07, 1.38, 0.07);
      for (const z of [-2.28, 2.28]) {
        const wheel = new Group();
        wheel.position.set(sg * 0.97, 0.39, z);
        const tyre = this.part(wheel, 0x3b3831, 0, 0, 0, 0.38, 0.1, 0.38, this.wheelShape);
        tyre.rotation.z = Math.PI / 2;
        this.part(wheel, 0xb1a998, 0, 0, 0, 0.13, 0.06, 0.58);
        this.wheels.push(wheel);
        g.add(wheel);
      }
    }
    for (const [i, c] of [0x627c77, 0x8c6961, 0x707990].entries()) {
      this.part(g, c, -0.61 + i * 0.56, 1.68, -2.33, 0.18, 0.33, 0.18, this.ball);
      this.part(g, 0xb98d6e, -0.61 + i * 0.56, 2.1, -2.36, 0.14, 0.16, 0.14, this.ball);
    }
  }
  private makeMotorCar() {
    const g = this.streetCar;
    this.part(g, 0x536f7a, 0, 0.5, 0, 1.66, 0.5, 3.8);
    this.part(g, 0x8a9c9e, 0, 0.95, 0.04, 1.46, 0.54, 1.96);
    this.part(g, 0x536f7a, 0, 1.25, 0.04, 1.49, 0.14, 1.98);
    for (const side of [-1, 1]) {
      this.part(g, 0xf1e2ac, side * 0.56, 0.56, -1.91, 0.28, 0.14, 0.055);
      for (const z of [-1.13, 1.16]) {
        const pivot = new Group();
        pivot.position.set(side * 0.77, 0.32, z);
        g.add(pivot);
        const tyre = this.part(pivot, 0x3b3c37, 0, 0, 0, 0.29, 0.18, 0.29, this.wheelShape);
        tyre.rotation.z = Math.PI / 2;
        if (z < 0) this.steering.push(pivot);
      }
    }
  }
  update(metres: number, seconds: number) {
    this.clock.value = seconds;
    this.state.cableCarWheel = this.state.steeringAngle = this.state.fogDrift = null;
    this.trolley.visible = Math.abs(metres - 1380) < 260;
    if (this.trolley.visible) {
      const d = 1200 + ((seconds * 3.15 + 183) % 280);
      const p = this.course.place(d, -2.8, this.p);
      this.trolley.position.set(p.x, p.y + 0.13, p.z);
      this.trolley.rotation.order = 'YXZ';
      this.trolley.rotation.set(p.pitch, p.heading, 0);
      for (const w of this.wheels) w.rotation.x = (-seconds * 3.15) / 0.38;
      this.state.cableCarWheel = this.wheels[0]!.rotation.x;
    }
    this.streetCar.visible = metres > 6410 && metres < 7100;
    if (this.streetCar.visible) {
      const d = 6537 + ((seconds * 3.8 + 186) % 425);
      const p = this.course.place(d, 1.16, this.p),
        n = this.course.place(d + 4, 1.16, this.next);
      this.streetCar.position.set(p.x, p.y + 0.11, p.z);
      this.streetCar.rotation.order = 'YXZ';
      this.streetCar.rotation.set(p.pitch, p.heading, 0);
      const delta = n.heading - p.heading;
      const turn = 0.51 * Math.tanh((2.3 * Math.atan2(Math.sin(delta), Math.cos(delta))) / 0.51);
      for (const axle of this.steering) axle.rotation.y = turn;
      this.state.steeringAngle = this.steering[0]!.rotation.y;
    }
    const bay = this.course.place(8380, 0, this.p);
    this.fog.position.set(
      bay.x + Math.sin(seconds * 0.032) * 84,
      0,
      bay.z + Math.cos(seconds * 0.026) * 26,
    );
    if (Math.abs(metres - 8360) < 350) this.state.fogDrift = this.fog.position.x;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = views.find((v) => Math.abs(v[0] - metres) < 66);
    if (!view) return;
    const r = this.course.place(metres, 0, this.p),
      site = this.course.place(view[1], view[2], this.next);
    if (view[0] === 4220) {
      const h = site.heading;
      site.x += -Math.sin(h) * 320 - Math.cos(h) * 112;
      site.z += -Math.cos(h) * 320 + Math.sin(h) * 112;
      site.y = 122;
    }
    const dx = site.x - r.x,
      dz = site.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    const u = Math.min(1, (66 - Math.abs(view[0] - metres)) / 28),
      w = u * u * (3 - 2 * u);
    camera.x += (r.x - (5.1 * dx) / len - camera.x) * w;
    camera.z += (r.z - (5.1 * dz) / len - camera.z) * w;
    camera.y += (r.y + 2.58 - camera.y) * w;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
    ahead.y += (r.y + 1.75 + (19.1 * (site.y + view[3] - r.y - 2.58)) / (len + 5.1) - ahead.y) * w;
  }
  report() {
    return this.state;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.panel,
      this.box,
      this.ball,
      this.wheelShape,
      this.haze,
      this.dryFog,
      this.side,
      this.end,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      item.dispose();
  }
}
