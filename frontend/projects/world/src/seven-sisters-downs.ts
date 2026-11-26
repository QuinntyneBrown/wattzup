import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
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
  type Texture,
} from 'three/webgpu';
import { attribute, color, mix, positionWorld, sin, texture, uniform, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const bump = (x: number, center: number, width: number) => Math.exp(-(((x - center) / width) ** 2));
const base = (x: number) =>
  92 +
  0.13 * x +
  26 * Math.sin(x / 328) +
  16 * Math.sin(x / 171) -
  182 * bump(x, 105, 250) -
  176 * bump(x, 2530, 215) -
  141 * bump(x, 5420, 200);
const lip = (x: number) => {
  const ordinary =
    48 +
    23 * Math.sin(((x - 1733) * Math.PI * 2) / 650) +
    5 * Math.sin(x / 31) +
    49 * bump(x, 950, 315);
  const spur = Math.max(bump(x, 100, 95), bump(x, 2550, 95), bump(x, 5450, 95));
  return base(x) - ordinary * (1 - spur) - 8.4 * spur;
};
const views = [
  [100, 148, 17, 4.2],
  [930, 959, -23, 1],
  [2550, 2610, 79, 7],
  [5450, 5494, 77, -16],
  [6290, 6334, 14, 8],
  [9610, 9639, -4, 2],
] as const;
export class SevenSistersDowns {
  readonly root = new Group();
  readonly materials = {
    DownlandRoad: new MeshLambertNodeMaterial({ side: DoubleSide }),
    DownsTurf: new MeshLambertNodeMaterial({ side: DoubleSide }),
    CuckmereScarps: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4, fog: false }),
    ChalkScarps: new MeshBasicMaterial({ side: DoubleSide }),
    FlintShingle: new MeshBasicMaterial({ side: DoubleSide }),
    ChannelWater: new MeshLambertNodeMaterial({ side: DoubleSide }),
    CuckmereRiver: new MeshLambertNodeMaterial({ side: DoubleSide }),
    DownlandGorse: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.46 }),
    CoastguardWhitewash: new MeshBasicMaterial({ side: DoubleSide }),
    FlintRoofs: new MeshBasicMaterial({ side: DoubleSide }),
    SussexFlint: new MeshBasicMaterial({ side: DoubleSide }),
    BelleToutGlass: new MeshBasicMaterial({ side: DoubleSide }),
    DownsWaymarks: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly second = uniform(0);
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly box = new BoxGeometry();
  private readonly feathers = new BufferGeometry();
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly sheep: { group: Group; neck: Group; station: number }[] = [];
  private readonly gulls: { group: Group; wings: Group[]; station: number }[] = [];
  private readonly surf: { mesh: Mesh<PlaneGeometry, MeshBasicMaterial>; x: number }[] = [];
  private readonly foam = new MeshBasicMaterial({
    color: 0xe1e7d9,
    side: DoubleSide,
    transparent: true,
    opacity: 0.81,
    depthWrite: false,
  });
  private readonly p = point();
  private readonly target = point();
  private readonly state = {
    sheepNeck: null as number | null,
    gullWing: null as number | null,
    surfCrest: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const names = [
      'fishhill-tarmac',
      'sevensisters-turf',
      'sevensisters-chalk',
      'sevensisters-shingle',
      'sevensisters-gorse',
      'sevensisters-whitewash',
      'sevensisters-slates',
      'sevensisters-flint',
      'sevensisters-lantern',
      'sevensisters-waymarks',
      'isleofman-sea',
      'sevensisters-headlands',
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
    return new SevenSistersDowns(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    for (const i of [0, 1, 2, 3, 6, 10]) {
      const t = maps[i]!;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = 4;
    }
    this.materials.DownlandRoad.colorNode = texture(maps[0]!, positionWorld.xz.div(4)).rgb;
    this.materials.DownsTurf.colorNode = attribute('color', 'vec3').mul(
      texture(maps[1]!, positionWorld.xz.div(4.8)).rgb.mul(1.35).add(0.58),
    );
    const surfaces = [
      this.materials.ChalkScarps,
      this.materials.FlintShingle,
      this.materials.DownlandGorse,
      this.materials.CoastguardWhitewash,
      this.materials.FlintRoofs,
      this.materials.SussexFlint,
      this.materials.BelleToutGlass,
      this.materials.DownsWaymarks,
    ];
    surfaces.forEach((m, i) => {
      m.map = maps[i + 2]!;
    });
    this.materials.CuckmereScarps.map = maps[11]!;
    const wind = sin(
      positionWorld.x.mul(0.33).add(positionWorld.z.mul(0.45)).add(this.second.mul(0.73)),
    );
    const wave = texture(
      maps[10]!,
      positionWorld.xz.div(vec2(26, 17)).add(vec2(wind.mul(0.008), this.second.mul(0.0008))),
    ).rgb;
    this.materials.ChannelWater.colorNode = mix(color(0x6d8f98), wave, 0.06);
    this.materials.CuckmereRiver.colorNode = mix(color(0x497b79), wave, 0.29);
    this.feathers.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          0, 0, -0.12, 0.28, 0.09, -0.13, 0.76, 0.045, 0.09, 0, 0, -0.12, 0.76, 0.045, 0.09, 0.25,
          0.015, 0.15, 0, 0, -0.12, 0.25, 0.015, 0.15, 0, 0, 0.12,
        ],
        3,
      ),
    );
    this.feathers.computeVertexNormals();
    for (let i = 0; i < 16; i++) this.makeSheep(i);
    for (let i = 0; i < 11; i++) this.makeGull(i);
    for (let i = 0; i < 26; i++) this.makeBreaker(5359 + i * 8.1);
    this.update(0, 0);
  }
  private paint(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshLambertMaterial({ color: c, side: DoubleSide });
      this.paints.set(c, m);
    }
    return m;
  }
  private shape(
    g: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    geometry: BufferGeometry = this.ball,
  ) {
    const m = new Mesh(geometry, this.paint(c));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
    return m;
  }
  private makeSheep(i: number) {
    const home = i < 7 ? 930 : i < 11 ? 2550 : 9610;
    const station = home + 7 + (i % 6) * 4.3;
    const p = this.course.place(station, -8 - (i % 4) * 1.8, this.p);
    const group = new Group(),
      neck = new Group();
    group.position.set(p.x, p.y - 0.16, p.z);
    group.rotation.y = p.heading + (i * 0.76 + 0.7);
    const wool = [0xe0dbc5, 0xf1ead6, 0xd5cbb2][i % 3]!;
    this.shape(group, wool, 0, 0.73, 0, 0.29, 0.31, 0.58);
    this.shape(group, wool, 0, 0.81, 0.35, 0.26, 0.25, 0.27);
    for (const x of [-0.15, 0.15])
      for (const z of [-0.26, 0.3]) {
        this.shape(group, 0xaca58c, x, 0.31, z, 0.064, 0.24, 0.07);
        this.shape(group, 0x514f45, x, 0.105, z, 0.065, 0.07, 0.08);
      }
    neck.position.set(0, 0.79, -0.39);
    group.add(neck);
    this.shape(neck, 0xb6a890, 0, -0.12, -0.16, 0.17, 0.2, 0.23);
    this.shape(neck, 0x605d50, 0, -0.18, -0.34, 0.116, 0.13, 0.14);
    for (const x of [-0.165, 0.165])
      this.shape(neck, 0xb9ac93, x, -0.04, -0.22, 0.113, 0.044, 0.055);
    this.root.add(group);
    this.sheep.push({ group, neck, station });
  }
  private makeGull(i: number) {
    const station = i < 6 ? 2550 : 5450;
    const group = new Group(),
      wings: Group[] = [];
    this.shape(group, 0xf1f1e7, 0, 0, 0, 0.077, 0.09, 0.22);
    this.shape(group, 0xe7e9df, 0, 0.054, -0.17, 0.065, 0.069, 0.09);
    this.shape(group, 0xbca366, 0, 0.044, -0.26, 0.036, 0.026, 0.057);
    for (const side of [-1, 1]) {
      const wing = new Group();
      wing.scale.x = side;
      group.add(wing);
      wings.push(wing);
      this.shape(wing, 0xdde0de, 0, 0, 0, 1, 1, 1, this.feathers);
      this.shape(wing, 0x414a4c, 0.59, 0.05, 0.042, 0.25, 0.55, 0.28, this.feathers);
    }
    group.scale.setScalar(1.3);
    this.root.add(group);
    this.gulls.push({ group, wings, station });
  }
  private makeBreaker(x: number) {
    const mesh = new Mesh(new PlaneGeometry(16, 1.4, 12, 1), this.foam);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.26, -lip(x) + 22);
    this.root.add(mesh);
    this.surf.push({ mesh, x });
  }
  update(metres: number, time: number) {
    this.second.value = time;
    this.state.sheepNeck = this.state.gullWing = this.state.surfCrest = null;
    this.sheep.forEach(({ group, neck, station }, i) => {
      group.visible = Math.abs(metres - station) < 190;
      if (!group.visible) return;
      neck.rotation.x = -0.69 + 0.49 * Math.sin(time * 0.83 + i * 1.44);
      if (this.state.sheepNeck === null) this.state.sheepNeck = neck.rotation.x;
    });
    this.gulls.forEach(({ group, wings, station }, i) => {
      group.visible = Math.abs(station - metres) < 270;
      if (!group.visible) return;
      const phase = time * (0.23 + i * 0.009) + i * 0.93;
      const x = station + 13 + (i % 5) * 5 + 15 * Math.sin(phase);
      const p = this.course.place(x, 9 + (i % 4) * 3 + 4.2 * Math.cos(phase), this.p);
      group.position.set(p.x, p.y + 3 + (i % 3) * 1.3 + 0.73 * Math.sin(phase), p.z);
      group.rotation.y = p.heading - Math.atan2(-4.2 * Math.sin(phase), 15 * Math.cos(phase));
      group.rotation.z = 0.25 * Math.sin(phase);
      wings.forEach((w, j) => {
        w.rotation.z = (j ? 1 : -1) * (0.15 + 0.45 * Math.sin(time * (2.8 + i * 0.1) + i));
      });
      if (this.state.gullWing === null) this.state.gullWing = wings[0]!.rotation.z;
    });
    this.surf.forEach(({ mesh, x }, i) => {
      mesh.visible = Math.abs(metres - 5450) < 350;
      if (!mesh.visible) return;
      const wave = Math.sin(time * 1.45 + i * 0.47);
      mesh.position.z = -lip(x) + 25 + 3.4 * wave;
      const vertices = mesh.geometry.getAttribute('position');
      for (let j = 0; j < vertices.count; j++) {
        const u = vertices.getX(j);
        vertices.setZ(j, 0.18 + 0.23 * wave + 0.14 * Math.sin(u * 0.57 + time * 1.13 + i));
      }
      vertices.needsUpdate = true;
      if (this.state.surfCrest === null) this.state.surfCrest = vertices.getZ(0);
    });
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    const v = views.find((row) => Math.abs(row[0] - metres) < 60);
    if (!v) return;
    const p = this.course.place(metres, 0, this.p),
      site = this.course.place(v[1], v[2], this.target);
    if (v[0] === 5450) {
      site.x = 5650;
      site.z = -lip(5650) + 24;
      site.y = 46;
    } else if (v[0] === 2550) {
      site.x = 2644;
      site.z = -base(2550) + 72;
      site.y = p.y + 1.4;
    } else if (v[0] === 100) {
      site.x = 535;
      site.z = -34;
      site.y = 49;
    }
    const dx = site.x - p.x,
      dz = site.z - p.z;
    const len = Math.max(1, Math.hypot(dx, dz));
    const u = Math.min(1, (60 - Math.abs(metres - v[0])) / 22),
      w = u * u * (3 - 2 * u);
    camera.x += (p.x - (5.0 * dx) / len - camera.x) * w;
    camera.z += (p.z - (5.0 * dz) / len - camera.z) * w;
    camera.y += (p.y + 2.55 - camera.y) * w;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * w;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * w;
    ahead.y += (p.y + 1.75 + (19 * (site.y + v[3] - p.y - 2.55)) / (len + 5) - ahead.y) * w;
  }
  report() {
    return this.state;
  }
  dispose() {
    this.root.clear();
    for (const { mesh } of this.surf) mesh.geometry.dispose();
    for (const m of [
      this.ball,
      this.box,
      this.feathers,
      this.foam,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      m.dispose();
  }
}
