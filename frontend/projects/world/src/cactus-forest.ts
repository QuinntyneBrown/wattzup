import {
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { mix, positionLocal, uniform, vec3 } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const surface = (mask = false) =>
  new MeshBasicMaterial({ side: DoubleSide, alphaTest: mask ? 0.48 : 0 });
const views = [
  [80, 98, 5.35, 1.8],
  [1210, 1224, 6.1, 6.4],
  [2680, 2702, 1.5, 1.0],
  [4810, 4845, 1.4, 3.8],
  [7320, 7339, 12.6, 2.75],
  [9740, 9770, -12, 6.2],
] as const;

export class CactusForest {
  readonly root = new Group();
  readonly materials = {
    ForestDrivePavement: surface(),
    BajadaFlora: surface(true),
    ParkBoards: surface(true),
  };
  private readonly day = uniform(0);
  readonly sky = {
    material: new MeshBasicNodeMaterial({ side: BackSide, fog: false, depthWrite: false }),
    at: (seconds: number) => {
      this.day.value = Math.max(0, Math.min(1, (seconds - 160) / 780));
    },
  };
  private readonly station = point();
  private readonly target = point();
  private readonly body = new SphereGeometry(1, 12, 8);
  private readonly box = new BoxGeometry();
  private readonly runner = new Group();
  private readonly quail = new Group();
  private readonly hawk = new Group();
  private readonly hawkHead = new Group();
  private readonly balloon = new Group();
  private readonly runnerBody = new PlaneGeometry(1.04, 0.52, 14, 7);
  private readonly quailBody = new PlaneGeometry(0.9, 0.43, 14, 7);
  private readonly runnerPaint = surface(true);
  private readonly quailPaint = surface(true);
  private readonly runnerRest: Float32Array;
  private readonly quailRest: Float32Array;
  private readonly colours = new Map<number, MeshBasicMaterial>();
  private readonly readings = {
    saguaroStation: 0,
    roadrunnerStride: null as number | null,
    quailStep: null as number | null,
    hawkTurn: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['pavement', 'plants', 'boards', 'roadrunner', 'quail'].map((k) =>
        loader.loadAsync('courses/saguaro-' + k + '.webp'),
      ),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const t of textures) t.dispose();
      throw failure.reason;
    }
    return new CactusForest(course, textures);
  }
  private place(g: Group, d: number, lane: number, up: number) {
    const p = this.course.place(d, lane, this.station);
    g.position.set(p.x, p.y + up, p.z);
    g.rotation.y = p.heading;
  }
  private part(
    g: Group,
    tint: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    round = true,
  ) {
    let c = this.colours.get(tint);
    if (!c) {
      c = new MeshBasicMaterial({ color: tint });
      this.colours.set(tint, c);
    }
    const m = new Mesh(round ? this.body : this.box, c);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
    return m;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    [
      this.materials.ForestDrivePavement,
      this.materials.BajadaFlora,
      this.materials.ParkBoards,
      this.runnerPaint,
      this.quailPaint,
    ].forEach((m, i) => {
      const t = textures[i]!;
      t.colorSpace = SRGBColorSpace;
      t.flipY = i >= 3;
      m.map = t;
    });
    textures[0]!.wrapS = textures[0]!.wrapT = RepeatWrapping;
    textures[0]!.anisotropy = 4;
    const direction = positionLocal.normalize(),
      elevation = direction.y.max(0);
    const c = (hex: number) => {
      const h = new Color(hex);
      return vec3(h.r, h.g, h.b);
    };
    const dawn = mix(
      mix(c(0xf6ae79), c(0xe5acb1), elevation.smoothstep(0, 0.19)),
      c(0x7493bb),
      elevation.smoothstep(0.12, 0.68),
    );
    const blue = mix(c(0xeaccab), c(0x5794c0), elevation.smoothstep(0, 0.55));
    const [x, y, z] = course.file.sun;
    const glow = direction
      .dot(vec3(x, y, z))
      .max(0)
      .pow(110)
      .mul(0.37);
    this.sky.material.colorNode = mix(dawn, blue, this.day).add(c(0xffc57a).mul(glow));
    this.runnerBody.translate(0, 0.26, 0);
    this.quailBody.translate(0, 0.215, 0);
    this.runnerRest = new Float32Array(this.runnerBody.getAttribute('position').array);
    this.quailRest = new Float32Array(this.quailBody.getAttribute('position').array);
    this.runner.add(new Mesh(this.runnerBody, this.runnerPaint));
    this.quail.add(new Mesh(this.quailBody, this.quailPaint));
    this.root.add(this.runner, this.quail);
    this.place(this.hawk, 1224, 6.1, 8.3);
    const feather = 0x795846;
    this.part(this.hawk, feather, 0, 0.24, 0, 0.18, 0.29, 0.18);
    this.part(this.hawk, 0xad8c65, 0, 0.25, -0.09, 0.12, 0.22, 0.12);
    const tail = this.part(this.hawk, 0x855940, 0, 0.075, 0.2, 0.12, 0.11, 0.22);
    tail.rotation.x = 0.41;
    for (const side of [-1, 1]) {
      const wing = this.part(this.hawk, 0x655449, side * 0.115, 0.24, 0.025, 0.091, 0.23, 0.126);
      wing.rotation.x = -0.25;
      this.part(this.hawk, 0xc59b55, side * 0.062, 0.046, -0.05, 0.027, 0.049, 0.06);
    }
    this.hawkHead.position.set(0, 0.47, -0.042);
    this.hawk.add(this.hawkHead);
    this.part(this.hawkHead, 0x8d7054, 0, 0, 0, 0.13, 0.145, 0.13);
    this.part(this.hawkHead, 0xc9a468, 0, -0.037, -0.14, 0.045, 0.038, 0.08);
    for (const side of [-1, 1])
      this.part(this.hawkHead, 0x282823, side * 0.099, 0.023, -0.064, 0.022, 0.022, 0.018);
    this.root.add(this.hawk);
    const p = this.course.place(1560, -210, this.station);
    this.balloon.position.set(p.x, p.y + 74, p.z);
    this.balloon.userData['height'] = p.y + 74;
    this.part(this.balloon, 0xc08457, 0, 5.8, 0, 4.1, 5.6, 4.1);
    this.part(this.balloon, 0xb16e4d, 0, 5.44, 0, 4.14, 0.7, 4.14);
    this.part(this.balloon, 0x7f6046, 0, -1.0, 0, 1.1, 0.76, 0.92, false);
    for (const x of [-0.41, 0.41])
      this.part(this.balloon, 0x685648, x, -0.07, 0, 0.04, 1.24, 0.04, false);
    this.root.add(this.balloon);
  }
  private stride(geometry: PlaneGeometry, rest: Float32Array, time: number, height: number) {
    const p = geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = rest[3 * i]!,
        y = rest[3 * i + 1]!,
        foot = Math.max(0, 1 - y / (height * 0.37)),
        step = Math.sin(time + x * 12.4);
      p.setXY(
        i,
        x + 0.045 * foot * step,
        y + 0.017 * foot * Math.max(0, step) + 0.006 * Math.sin(time * 2),
      );
    }
    p.needsUpdate = true;
    return p.getX(p.count - 3);
  }
  update(metres: number, time: number) {
    const r = this.readings;
    r.saguaroStation = metres;
    r.roadrunnerStride = r.quailStep = r.hawkTurn = null;
    this.runner.visible = Math.abs(metres - 2680) < 145;
    if (this.runner.visible) {
      this.place(
        this.runner,
        2690 + 1.8 * Math.cos(time * 0.38),
        2.6 * Math.sin(time * 0.38),
        0.14,
      );
      this.runner.rotation.y += 0.1 * Math.sin(time * 0.38);
      r.roadrunnerStride = this.stride(this.runnerBody, this.runnerRest, time * 6.9, 0.52);
    }
    this.quail.visible = Math.abs(metres - 7320) < 140;
    if (this.quail.visible) {
      this.place(
        this.quail,
        7328 + 1.7 * Math.sin(time * 0.23),
        4.75 + 0.64 * Math.cos(time * 0.23),
        0.15,
      );
      this.quail.rotation.y += 0.28;
      r.quailStep = this.stride(this.quailBody, this.quailRest, time * 4, 0.43);
    }
    this.hawk.visible = this.balloon.visible = Math.abs(metres - 1210) < 270;
    if (this.hawk.visible) {
      this.hawkHead.rotation.y = 0.55 * Math.sin(time * 0.71);
      r.hawkTurn = this.hawkHead.rotation.y;
      this.balloon.position.y =
        (this.balloon.userData['height'] as number) + 5.6 * Math.sin(time * 0.033);
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const v = views.find((row) => Math.abs(metres - row[0]) < 54);
    if (!v) return;
    const f = Math.min(1, (1 - Math.abs(metres - v[0]) / 54) * 1.65);
    const r = this.course.place(metres, 0, this.station),
      t = this.course.place(v[1], v[2], this.target);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.17 - camera.y) * f;
    ahead.x += (r.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (14 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.17 + (19 * (t.y + v[3] - r.y - 2.17)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    this.sky.material.dispose();
    for (const item of [
      this.body,
      this.box,
      this.runnerBody,
      this.quailBody,
      this.runnerPaint,
      this.quailPaint,
      ...this.colours.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
