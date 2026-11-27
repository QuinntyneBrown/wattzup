import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshStandardMaterial,
  Object3D,
  RepeatWrapping,
  Sprite,
  SpriteMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Texture,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, smoothstep, texture } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [120, 139, -3.4, 2],
  [2180, 2328, -4.1, 41],
  [4290, 4320, -16, 7],
  [6580, 6596, -2.7, 1.7],
  [8710, 8727, 2.3, 3.8],
  [11790, 11813, -4.6, 4.6],
] as const;
export class LiffeyParade {
  readonly root = new Group();
  readonly materials = {
    DublinShops: new MeshBasicMaterial({ side: DoubleSide }),
    PostOffice: new MeshBasicMaterial({ side: DoubleSide }),
    ConnellBronze: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.48 }),
    LiffeySpectators: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.48 }),
    DublinWetRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly geometry = new SphereGeometry(1, 10, 7);
  private readonly board = new BoxGeometry();
  private readonly paint = new MeshStandardMaterial({ roughness: 0.81 });
  private readonly bodies = new InstancedMesh(this.geometry, this.paint, 600);
  private readonly props = new InstancedMesh(this.board, this.paint, 480);
  private readonly puppetFace = new SpriteMaterial({ transparent: true, alphaTest: 0.33 });
  private readonly figure = new Sprite(this.puppetFace);
  private readonly actor = new Object3D();
  private readonly part = new Object3D();
  private readonly tint = new Color();
  private readonly axis = new Vector3(0, 1, 0);
  private readonly line = new Vector3();
  private readonly point = scratch();
  private readonly target = scratch();
  private curves = 0;
  private blocks = 0;
  private readonly poses = {
    drumStroke: null as number | null,
    puppetNod: null as number | null,
    flagWave: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'dublin-shops',
        'dublin-spectators',
        'galibier-tarmac',
        'dublin-portico',
        'dublin-bronze',
        'dublin-puppet',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
      error = result.find((r) => r.status === 'rejected');
    if (error) {
      for (const m of maps) m.dispose();
      throw error.reason;
    }
    return new LiffeyParade(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.colorSpace = SRGBColorSpace;
      m.flipY = false;
    }
    const [shops, spectators, road] = maps as [Texture, Texture, Texture];
    road.wrapS = road.wrapT = RepeatWrapping;
    this.materials.PostOffice.map = maps[3]!;
    this.materials.ConnellBronze.map = maps[4]!;
    this.puppetFace.map = maps[5]!;
    this.puppetFace.map.flipY = true;
    this.figure.scale.set(2.72, 4.34, 1);
    this.figure.center.set(0.5, 0);
    this.root.add(this.figure);
    this.materials.DublinShops.map = shops;
    this.materials.LiffeySpectators.map = spectators;
    const grain = texture(road, positionWorld.xz.mul(0.21)).rgb;
    const sheen = smoothstep(
      0.4,
      0.94,
      sin(positionWorld.z.mul(0.53).add(sin(positionWorld.x.mul(0.075))))
        .mul(0.65)
        .add(sin(positionWorld.x.mul(0.28)).mul(0.32)),
    );
    this.materials.DublinWetRoad.colorNode = mix(
      grain.mul(color(0xc1c7c8)),
      color(0x96a4ab),
      sheen.mul(0.39),
    );
    this.bodies.frustumCulled = this.props.frustumCulled = false;
    this.root.add(this.bodies, this.props);
    this.actor.add(this.part);
    this.update(0, 0);
  }
  private locate(d: number, lane: number, yaw: number) {
    const p = this.course.place(d, lane, this.point);
    this.actor.position.set(p.x, p.y + 0.06, p.z);
    this.actor.rotation.set(0, p.heading + yaw, 0);
    this.actor.updateMatrixWorld();
  }
  private write(c: number, box = false) {
    this.part.updateWorldMatrix(false, false);
    const batch = box ? this.props : this.bodies,
      i = box ? this.blocks++ : this.curves++;
    batch.setMatrixAt(i, this.part.matrixWorld);
    batch.setColorAt(i, this.tint.setHex(c));
  }
  private shape(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    c: number,
    box = false,
  ) {
    this.part.position.set(x, y, z);
    this.part.quaternion.identity();
    this.part.scale.set(w, h, l);
    this.write(c, box);
  }
  private beam(
    x: number,
    y: number,
    z: number,
    a: number,
    b: number,
    d: number,
    r: number,
    c: number,
  ) {
    this.line.set(a - x, b - y, d - z);
    const length = this.line.length();
    this.part.position.set((x + a) / 2, (y + b) / 2, (z + d) / 2);
    this.part.quaternion.setFromUnitVectors(this.axis, this.line.normalize());
    this.part.scale.set(r, length * 0.51, r);
    this.write(c);
  }
  private flag(x: number, y: number, angle: number) {
    const tip = x + 0.32 * Math.sin(angle);
    this.beam(x, y, 0, tip, y + 1.07, 0.04, 0.024, 0x79664f);
    for (const [i, c] of [0x238451, 0xf2e8d6, 0xe28a42].entries()) {
      this.shape(
        tip + 0.113 + i * 0.205,
        y + 0.87 + 0.03 * Math.sin(angle + i * 0.46),
        0.04 + 0.084 * Math.sin(angle + i * 0.81),
        0.218,
        0.39,
        0.038,
        c,
        true,
      );
    }
  }
  private spectator(d: number, lane: number, i: number, t: number) {
    this.locate(d, lane, lane < 0 ? 1.57 : -1.57);
    const coat = [0x337554, 0x273c42, 0x527044, 0x789244][i % 4]!,
      skin = [0xe0b39a, 0xb58670, 0x99684c][i % 3]!;
    this.shape(-0.12, 0.42, 0, 0.092, 0.43, 0.11, 0x344650);
    this.shape(0.12, 0.42, 0, 0.093, 0.43, 0.11, 0x344650);
    this.shape(0, 1.08, 0, 0.26, 0.38, 0.18, coat);
    this.shape(0, 1.59, 0, 0.145, 0.19, 0.145, skin);
    this.shape(0, 1.75, 0, 0.22, 0.055, 0.19, 0x398348);
    this.shape(0, 1.84, 0, 0.15, 0.16, 0.145, 0x487e46);
    const wave = Math.sin(t * 2.5 + i);
    this.beam(0.16, 1.37, 0, 0.37, 1.46, 0.08, 0.088, coat);
    this.beam(0.37, 1.46, 0.08, 0.42 + 0.12 * wave, 1.73, 0, 0.064, skin);
    this.flag(0.42 + 0.12 * wave, 1.63, wave);
    if (i === 0) this.poses.flagWave = wave;
  }
  private musician(i: number, t: number) {
    const row = Math.floor(i / 3),
      col = i % 3,
      beat = t * 3.1 + row * 0.76 + col * 0.22;
    this.locate(6594 + row * 2.1 + 1.8 * Math.sin(t * 0.13), -2.4 - col * 1.06, 0);
    const navy = 0x253443,
      skin = [0xcf9f83, 0xb5846e, 0xdfb9a0][col]!;
    for (const side of [-1, 1]) {
      const foot = Math.sin(beat) * side * 0.24;
      this.beam(side * 0.105, 0.65, 0, side * 0.112, 0.21, foot, 0.078, skin);
      this.shape(side * 0.115, 0.107, foot - 0.05, 0.105, 0.094, 0.167, 0x303535);
    }
    this.shape(0, 0.805, 0, 0.26, 0.26, 0.23, 0x416054);
    this.shape(0, 1.25, 0, 0.239, 0.31, 0.163, navy);
    for (let v = 0; v < 3; v++)
      this.shape((v - 1) * 0.115, 0.82, -0.19, 0.019, 0.27, 0.033, 0x9a865a, true);
    this.beam(-0.18, 1.43, -0.108, 0.19, 1.03, -0.164, 0.035, 0xb5a589);
    this.shape(0, 1.72, 0, 0.14, 0.193, 0.143, skin);
    this.shape(0, 1.885, 0, 0.165, 0.112, 0.152, navy);
    if (col === 0) {
      this.shape(0, 1.04, -0.264, 0.27, 0.203, 0.23, 0x863a36);
      this.shape(0, 1.235, -0.265, 0.268, 0.028, 0.229, 0xe9d7b3);
      for (const s of [-1, 1]) {
        const rise = 0.17 * Math.sin(beat * 2.05 + s);
        this.beam(s * 0.205, 1.42, 0, s * 0.28, 1.25, -0.11, 0.079, navy);
        this.beam(s * 0.28, 1.25, -0.11, s * 0.208, 1.38 + rise, -0.28, 0.056, skin);
        this.beam(
          s * 0.208,
          1.38 + rise,
          -0.28,
          s * 0.045,
          1.31 + rise * 1.7,
          -0.38,
          0.022,
          0xc6af7d,
        );
        if (i === 0 && s === 1) this.poses.drumStroke = rise;
      }
    } else {
      this.shape(0.18, 1.23, -0.075, 0.175, 0.19, 0.19, 0x59664b);
      for (let j = 0; j < 3; j++)
        this.beam(
          0.15 + j * 0.045,
          1.27,
          0,
          0.21 + j * 0.09,
          1.97 + j * 0.12,
          0.13,
          0.037,
          0x39352c,
        );
      for (const s of [-1, 1])
        this.beam(s * 0.16, 1.37, -0.03, s * 0.105, 1.14, -0.23, 0.071, navy);
      this.beam(0.18, 1.24, -0.17, -0.055, 1.61, -0.13, 0.031, 0x655741);
    }
  }
  private puppet(t: number) {
    const nod = 0.16 * Math.sin(t * 1.71);
    this.poses.puppetNod = nod;
    this.locate(8727 + 2.3 * Math.sin(t * 0.14), 2.3, 0);
    this.shape(0, 0.56, 0, 2.2, 0.68, 3.8, 0x38765d, true);
    for (const side of [-1, 1])
      for (const z of [-1.04, 1.11]) this.shape(side * 1.04, 0.39, z, 0.175, 0.36, 0.36, 0x383b3b);
    this.figure.position.copy(this.actor.position);
    this.figure.position.y += 0.94 + nod * 0.18;
    this.puppetFace.rotation = nod * 0.24;
    for (const side of [-1, 1]) {
      this.shape(side * 1.12, 0.66, 0, 0.05, 0.29, 3.6, 0xd0a35c, true);
      for (let i = 0; i < 6; i++)
        this.shape(
          side * 1.15,
          0.66,
          -1.43 + 0.56 * i,
          0.055,
          0.16,
          0.27,
          i % 2 ? 0x4b9591 : 0xf0db94,
          true,
        );
    }
  }
  update(metres: number, t: number) {
    this.curves = this.blocks = 0;
    this.poses.flagWave = this.poses.puppetNod = this.poses.drumStroke = null;
    const at = views.find((v) => Math.abs(metres - v[0]) < 165);
    if (at) {
      for (let i = 0; i < 12; i++)
        this.spectator(at[0] + 11 + Math.floor(i / 2) * 2.15, i % 2 === 0 ? -8.8 : 8.8, i, t);
    }
    if (Math.abs(metres - 6580) < 165) for (let i = 0; i < 12; i++) this.musician(i, t);
    this.figure.visible = Math.abs(metres - 8710) < 165;
    if (this.figure.visible) this.puppet(t);
    this.props.count = this.blocks;
    this.bodies.count = this.curves;
    for (const batch of [this.props, this.bodies]) {
      batch.visible = batch.count > 0;
      batch.instanceMatrix.needsUpdate = true;
      if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
    }
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
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.35 - camera.y) * w;
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
    this.bodies.dispose();
    this.props.dispose();
    for (const resource of [
      this.puppetFace,
      this.geometry,
      this.board,
      this.paint,
      ...this.maps,
      ...Object.values(this.materials),
    ])
      resource.dispose();
  }
}
