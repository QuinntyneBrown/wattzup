import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 154, -3, 2.0],
  [3210, 3227, -18, 2.0],
  [6740, 6787, 43, 7.8],
  [9780, 9828, 36, 4.2],
  [13620, 13645, -8, 2.0],
  [17530, 17720, -13.1, 3.65],
] as const;
export class BuenosAiresTraffic {
  readonly root = new Group();
  readonly materials = {
    AvenidaPavement: new MeshBasicNodeMaterial({ side: DoubleSide }),
    PortenoFacades: new MeshBasicMaterial({ side: DoubleSide }),
    EvitaSteel: new MeshBasicMaterial({ side: DoubleSide }),
    TeatroColon: new MeshBasicMaterial({ side: DoubleSide }),
    AvenidaTrees: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    PortenoBoards: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly taxis: Group[] = [];
  private readonly buses: Group[] = [];
  private readonly moto = new Group();
  private readonly walker = new Group();
  private readonly legs = [new Group(), new Group()];
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly ball = new SphereGeometry(1, 12, 8);
  private readonly tyre = new CylinderGeometry(1, 1, 1, 16);
  private readonly flank = new PlaneGeometry(10.62, 2.83);
  private readonly busPaint = new MeshBasicMaterial({ side: DoubleSide });
  private readonly dyes = new Map<number, MeshLambertMaterial>();
  private readonly shown = {
    taxiTravel: null as number | null,
    busTravel: null as number | null,
    crossingStride: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['facades', 'evita', 'colon', 'trees', 'boards', 'colectivo'].map((k) =>
        new TextureLoader().loadAsync('courses/nuevedejulio-' + k + '.webp'),
      ),
    );
    const imgs = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const img of imgs) img.dispose();
      throw error.reason;
    }
    return new BuenosAiresTraffic(course, imgs);
  }
  private piece(
    group: Group,
    geo: BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
  ) {
    let paint = this.dyes.get(c);
    if (!paint) {
      paint = new MeshLambertMaterial({ color: c, side: DoubleSide });
      this.dyes.set(c, paint);
    }
    const mesh = new Mesh(geo, paint);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, l);
    group.add(mesh);
    return mesh;
  }
  private wheels(group: Group, zs: number[], axle: number, r: number) {
    for (const side of [-1, 1])
      for (const z of zs) {
        this.piece(group, this.tyre, 0x313438, side * axle, r, z, r, 0.22, r).rotation.z =
          Math.PI / 2;
        this.piece(
          group,
          this.tyre,
          0x909296,
          side * (axle + 0.09),
          r,
          z,
          r * 0.52,
          0.08,
          r * 0.52,
        ).rotation.z = Math.PI / 2;
      }
  }
  private place(group: Group, d: number, off: number, reverse = false) {
    const p = this.course.place(d, off, this.p);
    group.position.set(p.x, p.y + 0.045, p.z);
    group.rotation.set(reverse ? p.pitch : -p.pitch, p.heading + (reverse ? Math.PI : 0), 0, 'YXZ');
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    for (const img of images) {
      img.colorSpace = SRGBColorSpace;
      img.flipY = false;
    }
    const [facades, evita, colon, trees, boards, bus] = images;
    this.materials.PortenoFacades.map = facades!;
    this.materials.EvitaSteel.map = evita!;
    this.materials.TeatroColon.map = colon!;
    this.materials.AvenidaTrees.map = trees!;
    this.materials.PortenoBoards.map = boards!;
    this.busPaint.map = bus!;
    this.materials.AvenidaPavement.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(75).add(positionWorld.z.mul(81)))
        .mul(0.041)
        .add(0.96),
    );
    const sedan = new Group();
    this.piece(sedan, this.cube, 0x2e3033, 0, 0.64, 0, 1.83, 0.52, 4.0);
    this.piece(sedan, this.ball, 0x323539, 0, 0.79, -1.35, 0.91, 0.21, 0.83);
    this.piece(sedan, this.cube, 0x91a1a3, 0, 1.13, 0.04, 1.53, 0.56, 1.97);
    this.piece(sedan, this.ball, 0xe3b534, 0, 1.42, 0.04, 0.83, 0.15, 1.13);
    this.piece(sedan, this.cube, 0xe5be48, 0, 1.57, -0.07, 0.4, 0.15, 0.19);
    for (const s of [-1, 1]) {
      this.piece(sedan, this.cube, 0xe9d79c, s * 0.62, 0.67, -2.015, 0.39, 0.19, 0.036);
      this.piece(sedan, this.cube, 0x992c26, s * 0.64, 0.68, 2.014, 0.36, 0.17, 0.034);
    }
    this.wheels(sedan, [-1.23, 1.26], 0.84, 0.34);
    for (let i = 0; i < 5; i++) {
      const g = i ? sedan.clone() : sedan;
      this.taxis.push(g);
      this.root.add(g);
    }
    const colectivo = new Group();
    this.piece(colectivo, this.cube, 0xe3dac1, 0, 1.72, 0, 2.52, 2.68, 10.8);
    this.piece(colectivo, this.cube, 0xaa4537, 0, 3.09, 0, 2.58, 0.24, 10.98);
    this.piece(colectivo, this.cube, 0x526c78, 0, 2.19, -5.43, 2.27, 1.38, 0.08);
    this.piece(colectivo, this.cube, 0x3c4d50, 0, 2.95, -5.44, 2.28, 0.31, 0.09);
    this.piece(colectivo, this.cube, 0xdfbc6b, 0, 2.97, -5.5, 1.42, 0.11, 0.03);
    const uv = this.flank.attributes['uv']!;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    for (const side of [-1, 1]) {
      const panel = new Mesh(this.flank, this.busPaint);
      panel.position.set(side * 1.27, 1.79, 0);
      panel.rotation.y = (side * Math.PI) / 2;
      colectivo.add(panel);
    }
    this.wheels(colectivo, [-3.67, 3.64], 1.18, 0.48);
    for (let i = 0; i < 2; i++) {
      const g = i ? colectivo.clone() : colectivo;
      this.buses.push(g);
      this.root.add(g);
    }
    for (const z of [-0.65, 0.65])
      this.piece(this.moto, this.tyre, 0x343739, 0, 0.33, z, 0.33, 0.14, 0.33).rotation.z =
        Math.PI / 2;
    this.piece(this.moto, this.ball, 0x934333, 0, 0.62, 0, 0.27, 0.22, 0.77);
    this.piece(this.moto, this.ball, 0x4f5961, 0, 1.12, 0.12, 0.22, 0.33, 0.18);
    this.piece(this.moto, this.ball, 0xd3d5c7, 0, 1.56, 0.02, 0.155, 0.17, 0.15);
    this.root.add(this.moto, this.walker);
    this.piece(this.walker, this.ball, 0x64858d, 0, 1.16, 0, 0.245, 0.37, 0.16);
    this.piece(this.walker, this.ball, 0xbb8f70, 0, 1.67, 0, 0.14, 0.17, 0.133);
    for (const [i, g] of this.legs.entries()) {
      const side = i === 0 ? -1 : 1;
      g.position.set(side * 0.11, 0.92, 0);
      this.walker.add(g);
      this.piece(g, this.cube, 0x505865, 0, -0.41, 0, 0.168, 0.82, 0.175);
      this.piece(g, this.ball, 0x534d48, 0, -0.86, -0.06, 0.088, 0.071, 0.14);
      this.piece(this.walker, this.ball, 0xb68a69, side * 0.23, 1.11, 0, 0.073, 0.243, 0.072);
    }
    for (const [i, d] of [3240, 3242, 3255, 13645, 13647, 17559].entries()) {
      const g = this.walker.clone();
      this.place(g, d, -14.7 + (i % 3) * 0.24);
      g.rotation.y += 1.4;
      g.scale.setScalar(0.9 + 0.075 * (i % 3));
      this.root.add(g);
    }
  }
  update(metres: number, time: number) {
    for (const [i, taxi] of this.taxis.entries()) {
      const reverse = i >= 3;
      const d = metres + 13 + i * 15 + (reverse ? -1 : 1) * 4.4 * Math.sin(time * 0.21 + i * 0.9);
      this.place(taxi, d, [4, -5.6, 9.3, -30, -39][i]!, reverse);
      if (i === 0) this.shown.taxiTravel = d;
    }
    for (const [i, bus] of this.buses.entries()) {
      const d = metres + 13 + 50 * i + 5.7 * Math.sin(time * 0.18 + i);
      this.place(bus, d, i === 0 ? -18 : -22, i === 1);
      if (i === 0) this.shown.busTravel = d;
    }
    this.place(this.moto, metres + 9 + 0.88 * Math.sin(time * 0.55), 7.1);
    this.walker.visible = Math.abs(metres - 13638) < 155;
    this.shown.crossingStride = null;
    if (this.walker.visible) {
      this.place(this.walker, 13638, -10.1 + 2.7 * Math.sin(time * 0.26));
      this.walker.rotation.y += Math.PI / 2;
      const stride = 0.35 * Math.sin(time * 4.21);
      this.legs[0]!.rotation.x = stride;
      this.legs[1]!.rotation.x = -stride;
      this.shown.crossingStride = stride;
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
    this.walker.clear();
    this.moto.clear();
    for (const item of [
      this.cube,
      this.ball,
      this.tyre,
      this.flank,
      this.busPaint,
      ...this.dyes.values(),
      ...Object.values(this.materials),
      ...this.images,
    ])
      item.dispose();
    this.dyes.clear();
  }
}
