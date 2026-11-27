import { mix, positionWorld, texture, uniform, uv, vec2, vertexColor } from 'three/tsl';
import {
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
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
const VIEWS = [
  { station: 80, target: 124, lane: 10.8, rise: 2.5 },
  { station: 1540, target: 1578, lane: -6.5, rise: 0.1 },
  { station: 3280, target: 3312, lane: -5.15, rise: 0.2 },
  { station: 5420, target: 5452, lane: -3.6, rise: 0.3 },
  { station: 7460, target: 7488, lane: 4.7, rise: 0.65 },
  { station: 10040, target: 10083, lane: 10.4, rise: 1.6 },
];
const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
const phases = Float32Array.from({ length: 509 }, (_, i) =>
  mod(Math.sin(i * 78.233 + 4.53) * 43758.5453, 1),
);
const seed = (n: number) => phases[mod(n, phases.length)]!;

export class KyotoHanami {
  readonly root = new Group();
  private readonly gardens = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly path = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly coping = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly flow = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly clock = uniform(0);
  private readonly sakura = new MeshBasicMaterial({ alphaTest: 0.32, side: DoubleSide });
  private readonly shops = new MeshBasicMaterial({ side: DoubleSide });
  private readonly walls = new MeshBasicMaterial({ side: DoubleSide });
  private readonly hills = new MeshBasicNodeMaterial({
    side: DoubleSide,
    fog: false,
    transparent: true,
    depthWrite: false,
  });
  readonly materials = {
    KyotoSakura: this.sakura,
    KyotoShops: this.shops,
    KyotoCanal: this.walls,
    KyotoWater: this.flow,
    KyotoGravel: this.path,
    KyotoGardens: this.gardens,
    CanalCoping: this.coping,
    Higashiyama: this.hills,
  };
  private readonly petalShape = new PlaneGeometry(0.071, 0.04);
  private readonly petalInk = new MeshBasicMaterial({ color: 0xf3cbd5, side: DoubleSide });
  private readonly airborne = new InstancedMesh(this.petalShape, this.petalInk, 160);
  private readonly stream = new InstancedMesh(this.petalShape, this.petalInk, 104);
  private readonly visitorInk = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 });
  private readonly groups: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly transform = new Object3D();
  private readonly sample = position();
  private readonly origin = position();
  private readonly inscription = canvasTexture(160, 480, (ctx) => {
    ctx.fillStyle = '#97968a';
    ctx.fillRect(0, 0, 160, 480);
    ctx.fillStyle = '#343933';
    ctx.font = 'bold 80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    Array.from('哲学の道').forEach((glyph, i) => ctx.fillText(glyph, 80, 67 + i * 111));
  });
  private readonly marker = new Mesh(
    new PlaneGeometry(0.47, 1.42),
    new MeshBasicMaterial({ map: this.inscription, side: DoubleSide }),
  );
  private readonly drawn = {
    blossomHeight: 0,
    canalPetalStation: 0,
    hanamiStation: null as number | null,
  };

  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['sakura', 'shops', 'granite', 'hills', 'hanami', 'reflections'].map((key) =>
        loader.loadAsync('courses/kyoto-' + key + '.webp'),
      ),
    );
    const images: Texture[] = [];
    for (const result of results) if (result.status === 'fulfilled') images.push(result.value);
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) {
      for (const image of images) image.dispose();
      throw failed.reason;
    }
    return new KyotoHanami(course, images);
  }

  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [sakura, shops, stone, hills, people, water] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const image of images) image.colorSpace = SRGBColorSpace;
    for (const image of [sakura, shops, stone, hills]) image.flipY = false;
    this.sakura.map = sakura;
    this.shops.map = shops;
    this.walls.map = stone;
    this.hills.colorNode = texture(hills, uv()).rgb;
    const border = uv().x.mul(uv().x.oneMinus()).mul(16).clamp(0, 1);
    const top = uv().y.oneMinus().mul(3.7).clamp(0, 1);
    this.hills.opacityNode = border.mul(top).mul(0.86);
    for (const image of [stone, water]) {
      image.wrapS = image.wrapT = MirroredRepeatWrapping;
      image.anisotropy = 4;
    }
    const aggregate = texture(stone, positionWorld.xz.mul(4.3)).r;
    const leaf = positionWorld.x
      .mul(0.96)
      .sin()
      .add(positionWorld.z.mul(1.66).sin())
      .add(positionWorld.x.mul(0.36).add(positionWorld.z.mul(0.31)).sin())
      .mul(0.16)
      .add(0.69)
      .clamp(0.48, 0.99);
    this.path.colorNode = vertexColor()
      .rgb.mul(aggregate.mul(0.61).add(0.81))
      .mul(leaf.mul(0.36).add(0.7));
    this.coping.colorNode = vertexColor().rgb.mul(aggregate.mul(0.7).add(0.76));
    this.gardens.colorNode = vertexColor()
      .rgb.mul(aggregate.mul(0.58).add(0.78))
      .mul(leaf.mul(0.37).add(0.73));
    const drift = vec2(this.clock.mul(0.009), this.clock.mul(0.004));
    this.flow.colorNode = mix(
      texture(water, positionWorld.xz.mul(0.25).add(drift)).rgb,
      vertexColor().rgb.mul(0.55),
      0.05,
    );
    this.visitorInk.map = people;
    this.airborne.frustumCulled = this.stream.frustumCulled = false;
    this.root.add(this.airborne, this.stream, this.marker);
    const p = course.place(7480, 2.09, this.sample);
    this.marker.position.set(p.x, p.y + 0.77, p.z);
    this.marker.rotation.y = p.heading + 0.14;
    for (let v = 0; v < 8; v++) {
      const geom = new PlaneGeometry(1, 1);
      geom.translate(0, 0.5, 0);
      const uv = geom.getAttribute('uv');
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, (uv.getX(i) + (v % 4)) / 4, (uv.getY(i) + Math.floor(v / 4)) / 2);
      const group = new InstancedMesh(geom, this.visitorInk, 14);
      group.frustumCulled = false;
      this.root.add(group);
      this.groups.push(group);
    }
  }

  update(metres: number, time: number) {
    this.clock.value = time;
    const start = Math.floor((metres - 8) / 0.64);
    for (let n = 0; n < this.airborne.count; n++) {
      const i = start + n;
      const t = mod(time * (0.14 + seed(i) * 0.095) + seed(i + 5), 1);
      const station = i * 0.64 + Math.sin(time * 0.68 + i) * 0.72;
      const lane = -5.6 + seed(i + 13) * 9 + 0.52 * Math.sin(t * 5.9 + i);
      const p = this.course.place(station, lane, this.sample);
      const height = 0.18 + (1 - t) * (3.2 + seed(i + 12) * 1.8);
      this.transform.position.set(p.x, p.y + height, p.z);
      this.transform.rotation.set(time * 1.9 + i, time * 1.15 + i, t * 3.5 + i);
      const size = Math.min(1, t * 13, (1 - t) * 12) * (0.78 + seed(i + 9) * 0.62);
      this.transform.scale.setScalar(size);
      this.transform.updateMatrix();
      this.airborne.setMatrixAt(n, this.transform.matrix);
      if (n === 19) this.drawn.blossomHeight = this.transform.position.y;
    }
    this.airborne.instanceMatrix.needsUpdate = true;
    const from = Math.floor((metres - 10 - time * 0.31) / 1.01);
    for (let n = 0; n < this.stream.count; n++) {
      const i = from + n,
        station = i * 1.01 + time * 0.31;
      const lane = -3.21 - seed(i) * 3.65 + 0.11 * Math.sin(i + time * 0.35);
      const p = this.course.place(station, lane, this.sample);
      this.transform.position.set(p.x, p.y - 1.4, p.z);
      this.transform.rotation.set(-Math.PI / 2, 0, time * 0.08 + i);
      this.transform.scale.setScalar(1.04 + seed(i + 3) * 0.79);
      this.transform.updateMatrix();
      this.stream.setMatrixAt(n, this.transform.matrix);
      if (n === 24) this.drawn.canalPetalStation = station;
    }
    this.stream.instanceMatrix.needsUpdate = true;
    this.drawn.hanamiStation = null;
    const block = Math.floor((metres - 22) / 8);
    for (let v = 0; v < this.groups.length; v++) {
      const group = this.groups[v]!;
      let count = 0;
      for (let n = 0; n < 19; n++) {
        const i = block + n;
        if (mod(i, 8) !== v) continue;
        const base = i * 8,
          busy = base > 5080 && base < 5780;
        if (!busy && i % 3 !== 0) continue;
        const adjoining = i % 4 !== 0;
        const lane = adjoining ? (v % 3 === 0 ? 1.28 : -1.14) : -8.64;
        const station = base + 1.9 * Math.sin(time * 0.28 + seed(i) * 6.28);
        const p = this.course.place(station, lane, this.sample);
        this.transform.position.set(
          p.x,
          p.y + (adjoining ? 0.005 : -0.12) + 0.017 * Math.sin(time * 3.9 + i),
          p.z,
        );
        this.transform.rotation.set(
          0,
          p.heading + (i % 2 ? 0.54 : -0.36),
          0.016 * Math.sin(time * 2.5 + i),
        );
        const h = 1.76 + 0.17 * seed(i + 7);
        this.transform.scale.set(h, h, 1);
        this.transform.updateMatrix();
        group.setMatrixAt(count++, this.transform.matrix);
        if (this.drawn.hanamiStation === null) this.drawn.hanamiStation = station;
      }
      group.count = count;
      group.instanceMatrix.needsUpdate = true;
    }
  }

  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = VIEWS.find((v) => Math.abs(metres - v.station) < 82);
    if (!view) return;
    const share = Math.min(1, (1 - Math.abs(metres - view.station) / 82) * 1.7);
    const rider = this.course.place(metres, 0, this.origin);
    const goal = this.course.place(view.target, view.lane, this.sample);
    const dx = goal.x - rider.x,
      dz = goal.z - rider.z,
      len = Math.hypot(dx, dz);
    camera.x += (rider.x - (4.7 * dx) / len - camera.x) * share;
    camera.z += (rider.z - (4.7 * dz) / len - camera.z) * share;
    camera.y += (rider.y + 2.22 - camera.y) * share;
    ahead.x += (rider.x + (13 * dx) / len - ahead.x) * share;
    ahead.z += (rider.z + (13 * dz) / len - ahead.z) * share;
    ahead.y += (rider.y + view.rise - ahead.y) * share;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    for (const mesh of this.groups) {
      mesh.geometry.dispose();
      mesh.dispose();
    }
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      this.airborne,
      this.stream,
      this.petalShape,
      this.petalInk,
      this.visitorInk,
      this.inscription,
      this.marker.material,
      this.marker.geometry,
    ])
      item.dispose();
    this.root.clear();
  }
}
