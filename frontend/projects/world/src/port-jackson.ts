import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Texture,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture, uniform } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const views = [
  [120, 210, 102, -13],
  [2360, 2460, 70, 9],
  [4580, 6520, 0, 10],
  [6770, 6845, 21, 32],
  [9230, 6740, 0, 34],
  [12130, 12187, 17, 5],
] as const;
const colours = [0xffac48, 0xf24f60, 0xffdfa8, 0x7cb2fa];
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const rays = 44,
  shells = 7,
  falls = 480;

export class PortJackson {
  readonly root = new Group();
  readonly materials = {
    CircularQuay: new MeshBasicMaterial({ side: DoubleSide, fog: false }),
    BennelongSails: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    LunaGate: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 }),
    HarbourGranite: new MeshBasicMaterial({ side: DoubleSide }),
    PortJackson: new MeshBasicNodeMaterial({ side: DoubleSide }),
    BradfieldDeck: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly time = uniform(0);
  private readonly box = new BoxGeometry();
  private readonly sphere = new SphereGeometry(1, 10, 7);
  private readonly glow = new MeshBasicMaterial({
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  private readonly lights = new InstancedMesh(this.box, this.glow, shells * rays * 2 + falls);
  private readonly archPaint = new MeshBasicMaterial({ color: 0xb18367 });
  private readonly archLights = new InstancedMesh(this.box, this.archPaint, 80);
  private readonly stamp = new Object3D();
  private readonly point = scratch();
  private readonly target = scratch();
  private readonly ferry = new Group();
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly smoke: Mesh<SphereGeometry, MeshBasicMaterial>[] = [];
  private readonly centres: CoursePlace[] = [];
  private readonly drops: CoursePlace[] = [];
  private readonly direction = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  private readonly poses = {
    quayFerry: null as number | null,
    burstRadius: null as number | null,
    cascadeFall: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'sydneyharbour-quay',
        'sydneyharbour-sails',
        'sydneyharbour-luna',
        'sydneyharbour-granite',
        'galibier-tarmac',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const map of maps) map.dispose();
      throw error.reason;
    }
    return new PortJackson(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const map of maps) {
      map.flipY = false;
      map.colorSpace = SRGBColorSpace;
    }
    this.materials.CircularQuay.map = maps[0]!;
    this.materials.BennelongSails.map = maps[1]!;
    this.materials.LunaGate.map = maps[2]!;
    this.materials.HarbourGranite.map = maps[3]!;
    const road = maps[4]!;
    road.wrapS = road.wrapT = RepeatWrapping;
    this.materials.BradfieldDeck.colorNode = texture(road, positionWorld.xz.mul(0.19)).rgb.mul(
      0.29,
    );
    const ripple = sin(
      positionWorld.x.mul(0.23).add(sin(positionWorld.z.mul(0.85).add(this.time)).mul(2.4)),
    );
    const streak = smoothstep(0.78, 0.99, ripple).mul(
      smoothstep(0.22, 0.93, sin(positionWorld.z.mul(0.062).add(this.time.mul(0.22)))),
    );
    this.materials.PortJackson.colorNode = mix(
      color(0x111e31),
      mix(color(0x99604d), color(0x626f9a), sin(this.time.mul(1.3)).mul(0.5).add(0.5)),
      streak.mul(0.72),
    );
    for (let i = 0; i < shells; i++) {
      this.centres.push(course.place(6822 + i * 17, i % 2 ? 35 + i * 5 : -18 - i * 5));
      const puff = new Mesh(
        this.sphere,
        new MeshBasicMaterial({
          color: 0x947e88,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
        }),
      );
      this.smoke.push(puff);
      this.root.add(puff);
      for (let j = 0; j < rays * 2; j++)
        this.lights.setColorAt(i * rays * 2 + j, new Color(colours[i % 4]!));
    }
    for (let j = 0; j < falls; j++) {
      this.drops.push(course.place(6495 + (j % 240) * 1.98, j < 240 ? -13.6 : 13.6));
      this.lights.setColorAt(shells * rays * 2 + j, new Color(j % 3 ? 0xffbd61 : 0xffe9b7));
    }
    for (let segment = 0; segment < 40; segment++) {
      const f = segment / 40,
        next = (segment + 1) / 40;
      for (const [side, lane] of [-13.3, 13.3].entries()) {
        const a = course.place(6480 + 503 * f, lane),
          b = course.place(6480 + 503 * next, lane);
        a.y += 11.2 + 344 * f * (1 - f);
        b.y += 11.2 + 344 * next * (1 - next);
        this.direction.set(b.x - a.x, b.y - a.y, b.z - a.z);
        this.stamp.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        this.stamp.scale.set(0.53, this.direction.length(), 0.53);
        this.stamp.quaternion.setFromUnitVectors(this.up, this.direction.normalize());
        this.stamp.updateMatrix();
        this.archLights.setMatrixAt(segment * 2 + side, this.stamp.matrix);
      }
    }
    this.root.add(this.archLights);
    for (const [i, d] of [6810, 6875, 6925].entries()) {
      const barge = new Group(),
        p = course.place(d, (i % 2 ? 1 : -1) * (64 + i * 8));
      this.shape(barge, 0, 0.6, 0, 5.8, 1.2, 16, 0x484a50, true);
      for (let j = 0; j < 7; j++)
        this.shape(barge, 0, 1.48, j * 1.85 - 5.7, 2.1, 0.77, 0.91, 0x827971, true);
      barge.position.set(p.x, -3.9, p.z);
      barge.rotation.y = p.heading;
      this.root.add(barge);
    }
    this.lights.frustumCulled = false;
    this.root.add(this.lights, this.ferry);
    this.hull(this.ferry);
    this.ferry.scale.setScalar(1.48);
    for (let i = 0; i < 13; i++) {
      const boat = new Group();
      this.hull(boat);
      boat.scale.setScalar(0.24 + (i % 4) * 0.085);
      const p = course.place([205, 2395, 6790, 9250, 12120][i % 5]! + i * 4, 53 + i * 3);
      boat.position.set(p.x, -3.9, p.z);
      boat.rotation.y = p.heading + 0.4 * (i % 3);
      this.root.add(boat);
    }
    this.update(0, 0);
  }
  private shape(
    parent: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: number,
    round = false,
  ) {
    let paint = this.paints.get(c);
    if (!paint) {
      paint = new MeshBasicMaterial({ color: c });
      this.paints.set(c, paint);
    }
    const m = new Mesh(round ? this.sphere : this.box, paint);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
  }
  private hull(g: Group) {
    this.shape(g, 0, 0.65, 0, 4.4, 1.45, 15.8, 0x28584b, true);
    this.shape(g, 0, 2.0, 0, 7.7, 1.5, 23.5, 0xc6a05d);
    this.shape(g, 0, 3.3, 0, 6.9, 1.25, 21.8, 0x49606a);
    this.shape(g, 0, 4.14, 0, 7.8, 0.5, 23.1, 0xe6ca85);
    this.shape(g, 0, 5.3, -5.5, 4.7, 1.75, 4.25, 0xb69a64);
    this.shape(g, 0, 6.42, 1.5, 1.2, 2.9, 1.4, 0x567660);
    for (let j = -5; j <= 5; j++)
      for (const side of [-1, 1])
        this.shape(g, side * 3.5, 3.4, j * 1.85, 0.11, 1.13, 0.13, 0xf0d294);
  }
  update(metres: number, t: number) {
    this.time.value = t;
    this.ferry.visible = metres < 720;
    if (this.ferry.visible) {
      const p = this.course.place(210 + 11 * Math.sin(t * 0.13), 102, this.point);
      this.ferry.position.set(p.x, -3.8 + 0.16 * Math.sin(t), p.z);
      this.ferry.rotation.y = p.heading + 0.36;
    }
    this.poses.quayFerry = this.ferry.visible ? this.ferry.position.x : null;
    const show = metres > 4250 && metres < 9900;
    this.lights.visible = show;
    this.archLights.visible = show;
    if (show)
      this.archPaint.color.setHSL(
        0.017 + 0.062 * (1 + Math.sin(t * 1.3)),
        0.63,
        0.39 + 0.15 * Math.sin(t * 2.2),
      );
    for (const puff of this.smoke) puff.visible = show;
    this.poses.burstRadius = null;
    this.poses.cascadeFall = null;
    if (!show) return;
    for (let i = 0; i < shells; i++) {
      const centre = this.centres[i]!,
        phase = (t * 0.29 + i * 0.371) % 1,
        radius = (1 - Math.exp(-2.6 * phase)) * (12 + i * 1.9);
      const cy = centre.y + 28 + (i % 4) * 9;
      const puff = this.smoke[i]!;
      puff.position.set(centre.x + phase * 4, cy + 2 + phase * 3, centre.z);
      puff.scale.setScalar(2 + phase * 8);
      puff.material.opacity = 0.09 * (1 - phase);
      if (i === 0) this.poses.burstRadius = radius;
      for (let j = 0; j < rays; j++) {
        const dy = 1 - (2 * (j + 0.5)) / rays,
          rad = Math.sqrt(1 - dy * dy),
          a = j * 2.39996 + i;
        const x = rad * Math.cos(a),
          z = rad * Math.sin(a);
        this.direction.set(x, dy - phase * 0.35, z).normalize();
        this.stamp.quaternion.setFromUnitVectors(this.up, this.direction);
        for (let trail = 0; trail < 2; trail++) {
          const r = radius * (1 - trail * 0.18);
          this.stamp.position.set(
            centre.x + x * r,
            cy + dy * r - 3.5 * phase * phase,
            centre.z + z * r,
          );
          const w = 0.37 + 0.42 * (1 - phase);
          this.stamp.scale.set(w, Math.max(0.12, 2.9 * (1 - phase) * (1 - trail * 0.45)), w);
          this.stamp.updateMatrix();
          this.lights.setMatrixAt(i * rays * 2 + j * 2 + trail, this.stamp.matrix);
        }
      }
    }
    this.stamp.quaternion.identity();
    for (let j = 0; j < falls; j++) {
      const p = this.drops[j]!,
        f = (t * 0.67 + j * 0.618) % 1;
      this.stamp.position.set(p.x, p.y - f * f * (p.y + 3), p.z);
      this.stamp.scale.set(0.43, 6 + 6 * f, 0.43);
      this.stamp.updateMatrix();
      this.lights.setMatrixAt(shells * rays * 2 + j, this.stamp.matrix);
      if (j === 0) this.poses.cascadeFall = this.stamp.position.y;
    }
    this.lights.instanceMatrix.needsUpdate = true;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - metres);
      if (gap > 50) continue;
      const r = this.course.place(metres, 0, this.point),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (50 - gap) / 23);
      const back = at === 120 ? 10.3 : 4.8;
      camera.x += (r.x - (back * dx) / len - camera.x) * w;
      camera.z += (r.z - (back * dz) / len - camera.z) * w;
      camera.y += (r.y + (at === 120 ? 5.65 : 2.35) - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.55 + (18.8 * (p.y + lift - r.y - 2.35)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.lights.dispose();
    this.archLights.dispose();
    this.archPaint.dispose();
    for (const p of this.smoke) p.material.dispose();
    for (const item of [
      this.glow,
      this.box,
      this.sphere,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.maps,
    ])
      item.dispose();
  }
}
