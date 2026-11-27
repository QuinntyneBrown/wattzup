import { cameraPosition, mix, positionWorld, texture, uniform, vec2, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MirroredRepeatWrapping,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { CourseCyclistKit, type RiderModel } from './course-cyclist';
import type { Course, CoursePlace } from './course';
import type { RiderBody } from './rider-body';

const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 144, 30, 2.5],
  [1220, 1252, -24, 0.9],
  [2680, 2845, -26, 2.7],
  [4140, 4200, 3, 1.65],
  [5860, 5908, -35, 2.5],
  [7520, 7570, -15, 2.4],
] as const;

/** Open cedar-lined canoe with a raised prow at both ends. */
function canoeHull() {
  const vertices: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 8 - 1;
    const w = 0.48 * Math.pow(1 - t * t, 0.72) + 0.006;
    const rise = 0.25 * Math.pow(t, 4);
    for (const [x, y] of [
      [-w, 0.38],
      [-w * 0.85, 0.16],
      [0, -0.08],
      [w * 0.85, 0.16],
      [w, 0.38],
      [w * 0.9, 0.37],
      [w * 0.64, 0.15],
      [0, 0.06],
      [-w * 0.64, 0.15],
      [-w * 0.9, 0.37],
    ])
      vertices.push(x!, y! + rise, 2.55 * t);
    if (i === 0) continue;
    for (let j = 0; j < 10; j++) {
      const a = (i - 1) * 10 + j,
        b = (i - 1) * 10 + ((j + 1) % 10);
      indices.push(a, b, b + 10, a, b + 10, a + 10);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export class LakeLouise {
  readonly root = new Group();
  private readonly ice = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.45,
    fog: false,
    color: 0xe8eef0,
  });
  private readonly trees = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.44,
    color: 0xc5d1bd,
  });
  private readonly lodge = new MeshBasicMaterial({ side: DoubleSide });
  private readonly rock = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  private readonly gravel = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly water = new MeshBasicNodeMaterial({ side: DoubleSide });
  readonly materials = {
    VictoriaGlacier: this.ice,
    FairviewRock: this.rock,
    ChateauWalls: this.lodge,
    LouiseSpruce: this.trees,
    LouiseGravel: this.gravel,
    Sea: this.water,
  };
  private readonly clock = uniform(0);
  private readonly box = new BoxGeometry(1, 1, 1);
  private readonly round = new SphereGeometry(1, 10, 7);
  private readonly hull = canoeHull();
  private readonly cedar = new MeshBasicMaterial({ color: 0xb49265 });
  private readonly red = new MeshLambertMaterial({ color: 0xc33127, side: DoubleSide });
  private readonly vest = new MeshLambertMaterial({ color: 0xcf6941 });
  private readonly skin = new MeshLambertMaterial({ color: 0xb7815d });
  private readonly hat = new MeshLambertMaterial({ color: 0x4b5865 });
  private readonly hikers = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.46 });
  private readonly plain = new MeshLambertMaterial({ vertexColors: true });
  private readonly kit: CourseCyclistKit;
  private readonly bike: RiderModel;
  private readonly boats: { body: Group; paddle: Group }[] = [];
  private readonly walkers: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly sample = place();
  private readonly origin = place();
  private readonly pose = new Object3D();
  private readonly lakeY: number;
  private readonly drawn = {
    canoeStroke: null as number | null,
    hikerStride: null as number | null,
    valleyCyclist: null as number | null,
  };

  static async load(course: Course, body: RiderBody) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      [
        'lakelouise-glacier',
        'dolomites-conifers',
        'lakelouise-hikers',
        'goldengate-lawn',
        'lakelouise-lodge',
        'lakelouise-rock',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const images: Texture[] = [];
    for (const r of results) if (r.status === 'fulfilled') images.push(r.value);
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const image of images) image.dispose();
      throw failure.reason;
    }
    return new LakeLouise(course, body, images);
  }
  private constructor(
    private readonly course: Course,
    body: RiderBody,
    private readonly images: Texture[],
  ) {
    let low = Infinity;
    for (let i = 1; i < course.file.points.length; i += 3)
      low = Math.min(low, course.file.points[i]!);
    this.lakeY = low - 1.15;
    const [ice, pines, visitors, grain, lodge, stone] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    for (const image of images) image.colorSpace = SRGBColorSpace;
    ice.flipY = pines.flipY = lodge.flipY = false;
    this.lodge.map = lodge;
    stone.wrapS = stone.wrapT = MirroredRepeatWrapping;
    const cliffs = texture(
      stone,
      vec2(positionWorld.x.add(positionWorld.z.mul(0.22)), positionWorld.y).mul(0.011),
    ).rgb;
    this.rock.colorNode = vertexColor().rgb.mul(cliffs.mul(1.36).add(0.51));
    this.ice.map = ice;
    this.trees.map = pines;
    this.hikers.map = visitors;
    grain.wrapS = grain.wrapT = MirroredRepeatWrapping;
    const grit = texture(grain, positionWorld.xz.mul(3.5)).r;
    this.gravel.colorNode = vertexColor().rgb.mul(grit.mul(0.6).add(0.72));
    const view = positionWorld.sub(cameraPosition).normalize();
    const ripple = positionWorld.z
      .mul(1.9)
      .add(positionWorld.x.mul(0.47))
      .add(this.clock.mul(0.72))
      .sin();
    const glint = texture(
      ice,
      vec2(
        view.z.negate().mul(0.6).add(0.48).add(ripple.mul(0.0017)),
        view.y.negate().mul(3.6).oneMinus().add(ripple.mul(0.008)),
      ).clamp(0, 1),
    );
    this.water.colorNode = mix(vertexColor().rgb, glint.rgb, glint.a.mul(0.16)).mul(
      ripple.mul(0.03).add(1),
    );
    for (let i = 0; i < 8; i++) {
      const g = new PlaneGeometry(1, 1);
      g.translate(0, 0.5, 0);
      const uv = g.getAttribute('uv');
      for (let j = 0; j < uv.count; j++)
        uv.setXY(j, ((i % 4) + uv.getX(j)) / 4, (Math.floor(i / 4) + uv.getY(j)) / 2);
      const batch = new InstancedMesh(g, this.hikers, 4);
      batch.frustumCulled = false;
      this.walkers.push(batch);
      this.root.add(batch);
    }
    for (let i = 0; i < 4; i++) {
      const group = new Group();
      group.add(new Mesh(this.hull, this.red));
      for (const at of [-0.93, 0.62]) {
        const seat = new Mesh(this.box, this.cedar);
        seat.scale.set(0.77, 0.055, 0.23);
        seat.position.set(0, 0.31, at);
        group.add(seat);
        const torso = new Mesh(this.round, this.vest);
        torso.scale.set(0.21, 0.36, 0.16);
        torso.position.set(0, 0.61, at);
        group.add(torso);
        const head = new Mesh(this.round, this.skin);
        head.scale.set(0.115, 0.15, 0.12);
        head.position.set(0, 1.02, at);
        group.add(head);
        const cap = new Mesh(this.round, this.hat);
        cap.scale.set(0.137, 0.074, 0.155);
        cap.position.set(0, 1.14, at - 0.015);
        group.add(cap);
      }
      const paddle = new Group();
      paddle.position.set(-0.4, 0.76, -0.85);
      paddle.rotation.z = -0.33;
      const shaft = new Mesh(this.box, this.cedar);
      shaft.scale.set(0.042, 1.53, 0.039);
      paddle.add(shaft);
      const blade = new Mesh(this.round, this.cedar);
      blade.scale.set(0.112, 0.28, 0.035);
      blade.position.y = -0.73;
      paddle.add(blade);
      group.add(paddle);
      this.boats.push({ body: group, paddle });
      this.root.add(group);
    }
    this.kit = new CourseCyclistKit(this.plain, body, false, true);
    this.bike = this.kit.make(new Color(0x799b9c), 37, false, 0.47);
    this.root.add(this.bike.group);
  }
  update(metres: number, time: number) {
    this.clock.value = time;
    this.drawn.canoeStroke = null;
    const basin = metres < 2600 ? 1255 : metres < 4300 ? 2700 : 5830;
    for (let i = 0; i < this.boats.length; i++) {
      const boat = this.boats[i]!;
      const phase = time * 0.073 + i * 1.46;
      const station = basin + 35 * Math.sin(phase) + i * 14;
      boat.body.visible = Math.abs(metres - station) < 185;
      if (!boat.body.visible) continue;
      const p = this.course.place(station, -32 - i * 8 - 7 * Math.cos(phase), this.sample);
      boat.body.position.set(p.x, this.lakeY + 0.05 + 0.036 * Math.sin(phase * 7), p.z);
      boat.body.rotation.set(
        0,
        p.heading + 0.85 * Math.sin(phase) + i * 0.31,
        0.027 * Math.cos(phase * 9),
        'YXZ',
      );
      boat.paddle.rotation.x = 0.72 * Math.sin(time * 1.9 + i);
      if (this.drawn.canoeStroke === null) this.drawn.canoeStroke = boat.paddle.rotation.x;
    }
    this.drawn.hikerStride = null;
    for (let v = 0; v < 8; v++) {
      const batch = this.walkers[v]!;
      const speed = v % 2 === 0 ? 1.2 : -1.1;
      const offset = v * 18.8 + speed * time;
      const first = Math.floor((metres - 18 - offset) / 150);
      let count = 0;
      for (let i = first; i < first + 3; i++) {
        const d = i * 150 + offset;
        if (
          d < Math.max(0, metres - 18) ||
          d > Math.min(this.course.file.lengthMetres, metres + 171)
        )
          continue;
        const p = this.course.place(d, v % 3 === 0 ? 2.37 : -2.42, this.sample);
        const stride = Math.sin(time * 4.2 + i + v);
        this.pose.position.set(p.x, p.y + 0.026 * (1 + stride), p.z);
        this.pose.rotation.set(0, p.heading + 0.28 * Math.sin(i + v), stride * 0.02, 'YXZ');
        this.pose.scale.set(1.73, 1.73, 1);
        this.pose.updateMatrix();
        batch.setMatrixAt(count++, this.pose.matrix);
        if (this.drawn.hikerStride === null) this.drawn.hikerStride = this.pose.rotation.z;
      }
      batch.count = count;
      batch.instanceMatrix.needsUpdate = true;
    }
    const gap = 104;
    const station = Math.ceil((metres - 12 - time * 5.1) / gap) * gap + time * 5.1;
    this.bike.group.visible = station >= 0 && station < this.course.file.lengthMetres;
    this.drawn.valleyCyclist = null;
    if (this.bike.group.visible) {
      const p = this.course.place(station, 1.05, this.sample);
      this.bike.group.position.set(p.x, p.y, p.z);
      this.bike.group.rotation.set(p.pitch, p.heading, 0, 'YXZ');
      this.bike.pose(time * 6.5);
      this.drawn.valleyCyclist = station;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = views.find((s) => Math.abs(metres - s[0]) < 100);
    if (!stop) return;
    const fraction = Math.min(1, (1 - Math.abs(metres - stop[0]) / 100) * 1.6);
    const p = this.course.place(metres, 0, this.origin),
      goal = this.course.place(stop[1], stop[2], this.sample);
    const dx = goal.x - p.x,
      dz = goal.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5.5 * dx) / len - camera.x) * fraction;
    camera.z += (p.z - (5.5 * dz) / len - camera.z) * fraction;
    camera.y += (p.y + 2.5 - camera.y) * fraction;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * fraction;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * fraction;
    ahead.y += (p.y + stop[3] - ahead.y) * fraction;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    for (const mesh of this.walkers) {
      mesh.geometry.dispose();
      mesh.dispose();
    }
    for (const item of this.bike.owned) item.dispose();
    this.kit.dispose();
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      this.box,
      this.round,
      this.hull,
      this.cedar,
      this.red,
      this.vest,
      this.skin,
      this.hat,
      this.hikers,
      this.plain,
    ])
      item.dispose();
  }
}
