import { mix, positionWorld, texture, vertexColor } from 'three/tsl';
import {
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { canvasTexture } from './world-kit';
import type { Course, CoursePlace } from './course';

const position = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const CROWDS = [
  [985, 1145],
  [2230, 2455],
  [3490, 3940],
  [4810, 5010],
] as const;
const FLAGS = [
  1015, 1063, 1100, 2245, 2295, 2340, 2410, 3515, 3573, 3628, 3695, 3749, 3774, 3835, 3880, 4825,
  4884, 4958,
];
const inCrowd = (station: number) =>
  CROWDS.some(([start, end]) => station >= start && station <= end);
const bank = (metres: number, lane: number) => {
  const t = Math.min(1, Math.max(0, (Math.abs(lane) - 1.57) / (5 - 1.57)));
  return -0.17 + t * t * (3 - 2 * t) * (2 + 0.74 * Math.sin(metres / 35));
};

/** All waving fabric shares one deforming mesh. Spectators have eight silhouettes in eight draw calls. */
export class KoppenbergBanks {
  readonly root = new Group();
  private readonly stones = new MeshStandardNodeMaterial({
    side: DoubleSide,
    roughness: 0.38,
    metalness: 0.11,
  });
  private readonly trees = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 });
  private readonly field = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly lanes = new MeshBasicNodeMaterial({ side: DoubleSide });
  readonly materials = {
    KoppenbergSetts: this.stones,
    KoppenbergTrees: this.trees,
    MeldenFields: this.field,
    ConcreteLanes: this.lanes,
  };
  private readonly flagCloth = new PlaneGeometry(1.64, 1, 10, 2);
  private readonly flagInk = new MeshBasicMaterial({ side: DoubleSide });
  private readonly flags = new InstancedMesh(this.flagCloth, this.flagInk, FLAGS.length);
  private readonly fanInk = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 });
  private readonly fans: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly mistMap = canvasTexture(256, 64, (ctx) => {
    for (let i = 0; i < 7; i++) {
      const x = 25 + i * 33,
        y = 34 + 6 * Math.sin(i * 2);
      const g = ctx.createRadialGradient(x, y, 1, x, y, 28);
      g.addColorStop(0, 'rgba(222,227,221,.67)');
      g.addColorStop(1, 'rgba(222,227,221,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 29, y - 29, 58, 58);
    }
  });
  private readonly vapor = new MeshBasicMaterial({
    map: this.mistMap,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    opacity: 0.44,
  });
  private readonly veil = new PlaneGeometry(320, 38);
  private readonly banks = Array.from({ length: 3 }, () => new Mesh(this.veil, this.vapor));
  private readonly sample = position();
  private readonly origin = position();
  private readonly pose = new Object3D();
  private readonly drawn = {
    lionFold: null as number | null,
    spectatorLean: null as number | null,
    valleyMistOffset: 0,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['setts', 'trees', 'lion', 'fans', 'bank'].map((name) =>
        loader.loadAsync('courses/koppenberg-' + name + '.webp'),
      ),
    );
    const images: Texture[] = [];
    for (const res of results) if (res.status === 'fulfilled') images.push(res.value);
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const image of images) image.dispose();
      throw failure.reason;
    }
    return new KoppenbergBanks(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [setts, trees, lion, fans, bank] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const t of images) t.colorSpace = SRGBColorSpace;
    setts.wrapS = setts.wrapT = MirroredRepeatWrapping;
    setts.anisotropy = 6;
    bank.wrapS = bank.wrapT = MirroredRepeatWrapping;
    bank.anisotropy = 4;
    const fieldDetail = texture(bank, positionWorld.xz.mul(0.34)).rgb;
    this.field.colorNode = mix(
      fieldDetail.mul(vertexColor().rgb.mul(1.1).add(0.42)),
      vertexColor().rgb,
      0.32,
    );
    const aggregate = texture(setts, positionWorld.xz.mul(4.5)).r;
    this.lanes.colorNode = vertexColor().rgb.mul(aggregate.mul(0.85).add(0.77));
    const stone = texture(setts, positionWorld.xz.mul(0.36)).rgb;
    this.stones.colorNode = mix(stone, vertexColor().rgb, 0.13);
    this.stones.roughnessNode = stone.r.mul(-0.42).add(0.64);
    trees.flipY = false;
    this.trees.map = trees;
    this.flagInk.map = lion;
    this.fanInk.map = fans;
    this.flags.frustumCulled = false;
    this.root.add(this.flags, ...this.banks);
    for (let variant = 0; variant < 8; variant++) {
      const geometry = new PlaneGeometry(1, 1);
      geometry.translate(0, 0.5, 0);
      const uv = geometry.getAttribute('uv');
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, ((variant % 4) + uv.getX(i)) / 4, (Math.floor(variant / 4) + uv.getY(i)) / 2);
      const crowd = new InstancedMesh(geometry, this.fanInk, 64);
      crowd.frustumCulled = false;
      this.fans.push(crowd);
      this.root.add(crowd);
    }
  }
  update(metres: number, time: number) {
    const pos = this.flagCloth.getAttribute('position');
    const uv = this.flagCloth.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i);
      pos.setZ(i, u * (0.17 * Math.sin(time * 3.1 + u * 7) + 0.08 * Math.sin(time * 5.2 + u * 13)));
    }
    pos.needsUpdate = true;
    let count = 0;
    for (let i = 0; i < FLAGS.length; i++) {
      const station = FLAGS[i]!;
      if (station < metres - 20 || station > metres + 170) continue;
      const side = i % 2 ? 1 : -1,
        lane = side * 3.0;
      const p = this.course.place(station, lane, this.sample);
      this.pose.position.set(p.x, p.y + bank(station, lane) + 2.65, p.z);
      this.pose.rotation.set(0, p.heading + side * 0.36, side * 0.14);
      this.pose.scale.set(1, 1, 1);
      this.pose.updateMatrix();
      this.flags.setMatrixAt(count++, this.pose.matrix);
    }
    this.flags.count = count;
    this.flags.instanceMatrix.needsUpdate = true;
    this.drawn.lionFold = count ? pos.getZ(pos.count - 1) : null;
    this.drawn.spectatorLean = null;
    const start = Math.floor((metres - 17) / 2.8);
    for (let variant = 0; variant < 8; variant++) {
      const crowd = this.fans[variant]!;
      let shown = 0;
      for (let n = 0; n < 60; n++) {
        const index = start + n;
        const station = index * 2.8 + 0.18 * (variant % 4);
        if (!inCrowd(station) || ((index % 4) + 4) % 4 !== variant % 4) continue;
        const side = variant < 4 ? -1 : 1;
        const lane = side * (2.98 + 0.53 * (1 + Math.sin(index * 0.73)));
        const p = this.course.place(station, lane, this.sample);
        const lean = side * (0.075 + 0.036 * Math.sin(time * 2.27 + index * 0.94));
        this.pose.position.set(p.x, p.y + bank(station, lane) - 0.04, p.z);
        this.pose.rotation.set(0, p.heading + side * 0.58, lean, 'YXZ');
        const size = 1.83 + 0.16 * Math.sin(index * 1.77 + variant);
        this.pose.scale.set(size, size, 1);
        this.pose.updateMatrix();
        crowd.setMatrixAt(shown++, this.pose.matrix);
        if (station > 2220 && station < 3960) {
          const rearLane = lane + side * (1.15 + 0.5 * Math.sin(index * 2.46));
          const rearStation = station + 0.8 + 0.4 * Math.cos(index * 2.1);
          const rear = this.course.place(rearStation, rearLane, this.sample);
          this.pose.position.set(rear.x, rear.y + bank(rearStation, rearLane) - 0.13, rear.z);
          this.pose.rotation.set(0, rear.heading + side * 0.32, -lean * 0.54, 'YXZ');
          this.pose.scale.multiplyScalar(0.92 + 0.09 * Math.sin(index * 0.55));
          this.pose.updateMatrix();
          crowd.setMatrixAt(shown++, this.pose.matrix);
        }
        if (this.drawn.spectatorLean === null) this.drawn.spectatorLean = lean;
      }
      crowd.count = shown;
      crowd.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < this.banks.length; i++) {
      const veil = this.banks[i]!;
      const d = metres + 200 + i * 220;
      const p = this.course.place(d, -50 - i * 35, this.sample);
      veil.position.set(p.x, p.y + 7 + i * 4, p.z + 8 * Math.sin(time * 0.11 + i));
      veil.rotation.y = p.heading;
    }
    this.drawn.valleyMistOffset = this.banks[0]!.position.z;
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const share = Math.min(1, Math.max(0, (1 - Math.abs(metres - 5320) / 120) * 1.5));
    if (!share) return;
    const rider = this.course.place(metres, 0, this.origin);
    const steeple = this.course.place(5405, -53, this.sample);
    const dx = steeple.x - rider.x,
      dz = steeple.z - rider.z,
      n = Math.hypot(dx, dz);
    camera.x += (rider.x - (5.2 * dx) / n - camera.x) * share;
    camera.z += (rider.z - (5.2 * dz) / n - camera.z) * share;
    camera.y += (rider.y + 3.1 - camera.y) * share;
    ahead.x += (rider.x + (13 * dx) / n - ahead.x) * share;
    ahead.z += (rider.z + (13 * dz) / n - ahead.z) * share;
    ahead.y += (rider.y + 0.25 - ahead.y) * share;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    for (const crowd of this.fans) {
      crowd.geometry.dispose();
      crowd.dispose();
    }
    for (const resource of [
      ...this.images,
      this.stones,
      this.field,
      this.lanes,
      this.trees,
      this.flags,
      this.flagCloth,
      this.flagInk,
      this.fanInk,
      this.veil,
      this.vapor,
      this.mistMap,
    ])
      resource.dispose();
    this.root.clear();
  }
}
