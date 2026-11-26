import {
  mix,
  modelScale,
  positionLocal,
  positionWorld,
  texture,
  uniform,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import type { RiderBody } from './rider-body';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 126, -5, 1.7],
  [2120, 2191, 40, 3.6],
  [4320, 4370, 10, 2.0],
  [6580, 6639, -63, 1.2],
  [8920, 9003, -48, 2.6],
  [11600, 11682, -54, 2.8],
] as const;

/** Flat-bottomed Loire working boat, with upswept ends and an enclosed timber cabin. */
function toueHull() {
  const p: number[] = [],
    idx: number[] = [];
  for (const [i, [z, w, rise]] of [
    [-5, 0.05, 0.52],
    [-3.85, 0.88, 0.12],
    [-2.5, 1.18, 0],
    [2.85, 1.2, 0],
    [4.6, 0.82, 0.22],
    [5.1, 0.36, 0.41],
  ].entries()) {
    for (const [x, y] of [
      [-w!, 0.75],
      [-w! * 0.76, -0.03],
      [w! * 0.76, -0.03],
      [w!, 0.75],
      [w! * 0.93, 0.68],
      [0, 0.28],
      [-w! * 0.93, 0.68],
    ])
      p.push(x!, y! + rise!, z!);
    if (i)
      for (let j = 0; j < 7; j++) {
        const a = (i - 1) * 7 + j,
          b = (i - 1) * 7 + ((j + 1) % 7);
        idx.push(a, b, b + 7, a, b + 7, a + 7);
      }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(p, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export class LoireRiver {
  readonly root = new Group();
  private readonly trees = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 });
  private readonly facades = new MeshBasicMaterial({ side: DoubleSide, fog: false });
  private readonly village = new MeshBasicMaterial({ side: DoubleSide });
  private readonly stone = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  private readonly banks = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly pavement = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly water = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly reflection = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
  });
  private readonly disc = new MeshBasicMaterial({ color: 0xffefcf, side: DoubleSide, fog: false });
  readonly materials = {
    LoireTrees: this.trees,
    LoireGallery: this.facades,
    CaveHouses: this.village,
    LoireMasonry: this.stone,
    LoireBanks: this.banks,
    LoireLane: this.pavement,
    LoireReflection: this.reflection,
    Sea: this.water,
    Sun: this.disc,
  };
  private readonly phase = uniform(0);
  private readonly archDrift = uniform(0);
  private readonly brown = new MeshLambertMaterial({ color: 0x685344, side: DoubleSide });
  private readonly planks = new MeshLambertMaterial({ color: 0xa38a69 });
  private readonly cabinRoof = new MeshLambertMaterial({ color: 0x69695e });
  private readonly glass = new MeshBasicMaterial({ color: 0x556369 });
  private readonly cube = new BoxGeometry(1, 1, 1);
  private readonly hull = toueHull();
  private readonly boats: Group[] = [];
  private readonly plain = new MeshLambertMaterial({ vertexColors: true });
  private readonly kit: CourseCyclistKit;
  private readonly riders: RiderModel[];
  private readonly p = point();
  private readonly origin = point();
  private readonly level: number;
  private readonly drawn = {
    touringStation: null as number | null,
    toueStation: null as number | null,
    archRipple: null as number | null,
  };
  static async load(course: Course, body: RiderBody) {
    const loader = new TextureLoader();
    const names = ['loire-avenue', 'loire-facades', 'loire-tuffeau', 'fishhill-grass'];
    const results = await Promise.allSettled(
      names.map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const images: Texture[] = [];
    for (const r of results) if (r.status === 'fulfilled') images.push(r.value);
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) {
      for (const img of images) img.dispose();
      throw failed.reason;
    }
    return new LoireRiver(course, body, images);
  }
  private constructor(
    private readonly course: Course,
    body: RiderBody,
    private readonly images: Texture[],
  ) {
    let low = Infinity;
    for (let i = 1; i < course.file.points.length; i += 3)
      low = Math.min(low, course.file.points[i]!);
    this.level = low - 1.42;
    const [leaves, homes, limestone, grass] = images as [Texture, Texture, Texture, Texture];
    for (const t of images) t.colorSpace = SRGBColorSpace;
    leaves.flipY = homes.flipY = false;
    this.trees.map = leaves;
    this.facades.map = this.village.map = homes;
    for (const t of [grass, limestone]) {
      t.wrapS = t.wrapT = MirroredRepeatWrapping;
      t.anisotropy = 4;
    }
    const blocks = texture(
      limestone,
      vec2(positionWorld.x.add(positionWorld.z.mul(0.71)), positionWorld.y).mul(0.091),
    ).rgb;
    this.stone.colorNode = vertexColor().rgb.mul(blocks.mul(0.61).add(0.63));
    this.banks.colorNode = mix(
      texture(grass, positionWorld.xz.mul(0.185)).rgb,
      vertexColor().rgb,
      0.39,
    );
    this.pavement.colorNode = vertexColor().rgb.mul(
      texture(grass, positionWorld.xz.mul(3.6)).r.mul(0.52).add(0.76),
    );
    const ripple = positionWorld.z.mul(0.85).add(positionWorld.x.mul(0.24)).add(this.phase).sin();
    this.water.colorNode = vertexColor().rgb.mul(ripple.mul(0.04).add(1));
    this.reflection.positionNode = positionLocal.add(
      vec3(this.archDrift, 0, positionWorld.x.mul(0.43).add(this.phase).sin().mul(0.39)).div(
        vec3(modelScale),
      ),
    );
    this.reflection.colorNode = vertexColor().rgb.mul(ripple.mul(0.16).add(0.92));
    for (let i = 0; i < 2; i++) {
      const boat = new Group();
      boat.add(new Mesh(this.hull, this.brown));
      const part = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        l: number,
        material: MeshBasicMaterial | MeshLambertMaterial,
      ) => {
        const m = new Mesh(this.cube, material);
        m.position.set(x, y, z);
        m.scale.set(w, h, l);
        boat.add(m);
        return m;
      };
      part(0, 0.78, 1.18, 1.83, 1.05, 3.92, this.planks);
      part(0, 1.5, 1.18, 2.13, 0.39, 4.32, this.cabinRoof);
      for (const x of [-0.93, 0.93])
        for (const z of [-0.05, 1.12, 2.22]) part(x, 0.99, z, 0.055, 0.53, 0.8, this.glass);
      part(0, 2.58, -1.78, 0.093, 4.8, 0.093, this.planks);
      part(0, 0.82, -2.5, 1.79, 0.13, 0.29, this.planks);
      part(0, 1.82, 2.52, 0.135, 0.54, 0.14, this.brown);
      this.boats.push(boat);
      this.root.add(boat);
    }
    this.kit = new CourseCyclistKit(this.plain, body, false, true);
    this.riders = [0x8d9a78, 0xbb7662].map((col, i) => {
      const model = this.kit.make(new Color(col), 17 + i * 23, false, 0.52);
      for (const side of [-1, 1]) {
        const pannier = new Mesh(this.cube, this.cabinRoof);
        pannier.position.set(side * 0.15, 0.49, 0.41);
        pannier.scale.set(0.19, 0.31, 0.36);
        model.group.add(pannier);
      }
      this.root.add(model.group);
      return model;
    });
  }
  update(metres: number, time: number) {
    this.phase.value = time * 0.89;
    this.archDrift.value = 0.3 * Math.sin(time * 1.28);
    this.drawn.archRipple = Math.abs(metres - 6640) < 160 ? this.archDrift.value : null;
    this.drawn.toueStation = null;
    for (let i = 0; i < 2; i++) {
      const boat = this.boats[i]!;
      const anchor = i === 0 ? 8971 : 6640;
      const phase = time * 0.041 + i * 0.83;
      const station = anchor + 36 * Math.sin(phase);
      boat.visible = Math.abs(metres - station) < 180;
      if (!boat.visible) continue;
      const p = this.course.place(station, -32 - 16 * i - 7 * Math.cos(phase), this.p);
      boat.position.set(p.x, this.level + 0.035 + 0.065 * Math.sin(time * 0.86 + i), p.z);
      boat.rotation.set(
        0,
        p.heading + Math.atan2(0.19 * Math.sin(phase), Math.cos(phase)),
        0.032 * Math.sin(time * 1.04 + i),
        'YXZ',
      );
      if (this.drawn.toueStation === null) this.drawn.toueStation = station;
    }
    this.drawn.touringStation = null;
    for (let i = 0; i < this.riders.length; i++) {
      const m = this.riders[i]!,
        speed = i === 0 ? 4.55 : -4.0,
        offset = time * speed + 24 + i * 52;
      const station = Math.ceil((metres - 12 - offset) / 131) * 131 + offset;
      m.group.visible = station >= 0 && station < this.course.file.lengthMetres;
      if (!m.group.visible) continue;
      const p = this.course.place(station, i === 0 ? 0.88 : -1.22, this.p);
      m.group.position.set(p.x, p.y, p.z);
      m.group.rotation.set(
        i === 0 ? p.pitch : -p.pitch,
        p.heading + (i === 0 ? 0 : Math.PI),
        0.015 * Math.sin(time * 4 + i),
        'YXZ',
      );
      m.pose(time * (5.6 + i * 0.6));
      if (this.drawn.touringStation === null) this.drawn.touringStation = station;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = stops.find((s) => Math.abs(metres - s[0]) < 94);
    if (!stop) return;
    const blend = Math.min(1, (1 - Math.abs(metres - stop[0]) / 94) * 1.65);
    const p = this.course.place(metres, 0, this.origin),
      t = this.course.place(stop[1], stop[2], this.p),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5.0 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (5.0 * dz) / len - camera.z) * blend;
    camera.y += (p.y + 2.17 - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + stop[3] + ((t.y - p.y) * 14) / len - ahead.y) * blend;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    for (const m of this.riders) for (const item of m.owned) item.dispose();
    this.kit.dispose();
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      this.cube,
      this.hull,
      this.glass,
      this.brown,
      this.planks,
      this.cabinRoof,
      this.plain,
    ])
      item.dispose();
  }
}
