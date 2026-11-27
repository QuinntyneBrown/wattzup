import { mix, positionWorld, texture, uniform, vec2, vertexColor } from 'three/tsl';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
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
import type { Course, CoursePlace } from './course';
import { LisbonTram } from './lisbon-tram';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const stops = [
  [80, 116, -1.5, 1.65],
  [1040, 1104, 15, 2.9],
  [2180, 2211, 3.8, 2.5],
  [3360, 3398, -66, -1.1],
  [4700, 4806, -72, 0.38],
  [6020, 6096, -22, 2.8],
] as const;
const fabrics = [0xe7dfcd, 0x96b2b8, 0xc5a18c, 0xd7c7a7, 0xaeb9a2, 0xdbc1be].map(
  (value) => new Color(value),
);

/** Garments pivot at their pegs. The hem and sleeves stand out against the illuminated street. */
function shirt() {
  const g = new BufferGeometry();
  const points = [
    [-0.21, 0],
    [0.21, 0],
    [0.42, -0.13],
    [0.35, -0.32],
    [0.22, -0.25],
    [0.23, -0.66],
    [-0.23, -0.64],
    [-0.22, -0.25],
    [-0.34, -0.34],
    [-0.42, -0.15],
  ];
  const pos: number[] = [],
    idx: number[] = [];
  pos.push(0, -0.24, 0.026);
  for (const [x, y] of points) pos.push(x!, y!, Math.abs(y!) * 0.048);
  for (let i = 0; i < points.length; i++) idx.push(0, i + 1, ((i + 1) % points.length) + 1);
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

export class LisbonHills {
  readonly root = new Group();
  private readonly carved = new MeshBasicMaterial({ side: DoubleSide });
  private readonly tile = new MeshBasicMaterial({ side: DoubleSide });
  private readonly vine = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.44 });
  private readonly paving = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly castle = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  private readonly water = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  private readonly sun = new MeshBasicMaterial({ side: DoubleSide, fog: false, color: 0xfff4db });
  readonly materials = {
    Azulejos: this.tile,
    LisbonCarving: this.carved,
    AlfamaVines: this.vine,
    Calcada: this.paving,
    CastleStone: this.castle,
    Sea: this.water,
    Sun: this.sun,
  };
  private readonly time = uniform(0);
  private readonly trams: LisbonTram;
  private readonly pegInk = new MeshBasicMaterial({ side: DoubleSide });
  private readonly wireInk = new MeshBasicMaterial({ color: 0x5d6057 });
  private readonly pegged = new InstancedMesh(shirt(), this.pegInk, 30);
  private readonly lines = new InstancedMesh(new BoxGeometry(1, 1, 1), this.wireInk, 6);
  private readonly residents = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.5 });
  private readonly crowd: InstancedMesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly pose = new Object3D();
  private readonly p = point();
  private readonly origin = point();
  private readonly drawn = {
    tramStation: null as number | null,
    laundryLift: null as number | null,
    residentStride: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const names = [
      'lisbon-azulejos',
      'lisbon-tram',
      'lisbon-calcada',
      'lisbon-stone',
      'lisbon-locals',
      'lisbon-vines',
      'lisbon-carving',
      'edinburgh-setts',
    ];
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
    return new LisbonHills(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    const [homes, tram, calcada, stone, people, vines] = images as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    const setts = images[7]!;
    const relief = images[6]!;
    relief.flipY = false;
    this.carved.map = relief;
    for (const img of images) img.colorSpace = SRGBColorSpace;
    homes.flipY = vines.flipY = false;
    this.tile.map = homes;
    this.vine.map = vines;
    this.residents.map = people;
    for (const surface of [calcada, stone, setts]) {
      surface.wrapS = surface.wrapT = MirroredRepeatWrapping;
      surface.anisotropy = 4;
    }
    const pavers = texture(calcada, positionWorld.xz.mul(0.38)).rgb;
    const shade = positionWorld.x
      .mul(0.076)
      .add(positionWorld.z.mul(0.125))
      .sin()
      .smoothstep(-0.4, -0.21)
      .mul(0.16)
      .add(0.77);
    const centre = texture(setts, positionWorld.xz.mul(0.64)).rgb;
    this.paving.colorNode = mix(
      mix(centre, pavers, vertexColor().r.smoothstep(0.4, 0.64)),
      vertexColor().rgb,
      0.26,
    ).mul(shade);
    const rock = texture(
      stone,
      vec2(positionWorld.x.add(positionWorld.z.mul(0.74)), positionWorld.y).mul(0.061),
    ).rgb;
    this.castle.colorNode = mix(rock, vertexColor().rgb, 0.24);
    const ripples = positionWorld.z
      .mul(0.32)
      .add(positionWorld.x.mul(0.075))
      .add(this.time.mul(0.47))
      .sin();
    this.water.colorNode = vertexColor().rgb.mul(ripples.mul(0.03).add(1));
    this.trams = new LisbonTram(tram);
    this.root.add(...this.trams.cars, this.pegged, this.lines);
    this.pegged.frustumCulled = this.lines.frustumCulled = false;
    for (let v = 0; v < 8; v++) {
      const g = new PlaneGeometry(1, 1);
      g.translate(0, 0.5, 0);
      const uv = g.getAttribute('uv');
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, ((v % 4) + uv.getX(i)) / 4, (Math.floor(v / 4) + uv.getY(i)) / 2);
      const batch = new InstancedMesh(g, this.residents, 6);
      batch.frustumCulled = false;
      this.root.add(batch);
      this.crowd.push(batch);
    }
  }
  update(metres: number, time: number) {
    this.time.value = time;
    this.drawn.tramStation = null;
    for (let side = 0; side < 2; side++) {
      const speed = side === 0 ? -2.72 : 3.18;
      const spacing = side === 0 ? 390 : 490;
      const drift = (side === 0 ? 126 : 315) + time * speed;
      const first = Math.floor((metres + 125 - drift) / spacing);
      for (let j = 0; j < 2; j++) {
        const car = this.trams.cars[2 * side + j]!;
        const station = (first - j) * spacing + drift;
        car.visible =
          station >= 0 &&
          station < this.course.file.lengthMetres &&
          station >= metres - 23 &&
          station <= metres + 125;
        if (!car.visible) continue;
        const p = this.course.place(station, side === 0 ? -1.5 : 1.5, this.p);
        car.position.set(p.x, p.y, p.z);
        car.rotation.set(
          side === 0 ? -p.pitch : p.pitch,
          p.heading + (side === 0 ? Math.PI : 0),
          0,
          'YXZ',
        );
        if (this.drawn.tramStation === null) this.drawn.tramStation = station;
      }
    }
    this.drawn.laundryLift = null;
    let pieces = 0,
      wires = 0;
    const first = Math.floor((metres - 12) / 63);
    for (let i = first; i < first + 4; i++) {
      const station = i * 63 + 9;
      if (station < 0 || station > this.course.file.lengthMetres) continue;
      if ((station > 3010 && station < 3500) || (station > 4480 && station < 4820)) continue;
      const p = this.course.place(station, 0, this.p);
      const height = 6.32 + 0.24 * Math.sin(i);
      this.pose.position.set(p.x, p.y + height, p.z);
      this.pose.rotation.set(0, p.heading, 0);
      this.pose.scale.set(12, 0.03, 0.03);
      this.pose.updateMatrix();
      this.lines.setMatrixAt(wires++, this.pose.matrix);
      for (let n = 0; n < 5; n++) {
        const lane = -4.0 + n * 1.6 + 0.27 * Math.sin(i + n),
          q = this.course.place(station, lane, this.p);
        this.pose.position.set(q.x, q.y + height - 0.025, q.z);
        const flap = 0.21 * Math.sin(time * 1.98 + i * 0.81 + n * 0.77);
        this.pose.rotation.set(flap, q.heading, 0.025 * Math.sin(time * 1.2 + i + n), 'YXZ');
        this.pose.scale.set(0.92 + 0.12 * (n % 2), 0.95 + 0.08 * (n % 3), 1);
        this.pose.updateMatrix();
        this.pegged.setMatrixAt(pieces, this.pose.matrix);
        this.pegged.setColorAt(pieces++, fabrics[(i + n) % fabrics.length]!);
        if (this.drawn.laundryLift === null) this.drawn.laundryLift = flap;
      }
    }
    this.pegged.count = pieces;
    this.lines.count = wires;
    this.pegged.instanceMatrix.needsUpdate = this.lines.instanceMatrix.needsUpdate = true;
    if (this.pegged.instanceColor) this.pegged.instanceColor.needsUpdate = true;
    this.drawn.residentStride = null;
    for (let v = 0; v < 8; v++) {
      const batch = this.crowd[v]!;
      const speed = v % 2 === 0 ? 1.06 : -0.92;
      const drift = time * speed + v * 12.7;
      const initial = Math.floor((metres - 13 - drift) / 107);
      let count = 0;
      for (let j = initial; j < initial + 3; j++) {
        const s = j * 107 + drift;
        if (
          s < Math.max(0, metres - 13) ||
          s > Math.min(this.course.file.lengthMetres, metres + 131)
        )
          continue;
        const p = this.course.place(s, v % 3 === 1 ? -4.55 : 4.37, this.p);
        const stride = Math.sin(time * 3.6 + v + j);
        this.pose.position.set(p.x, p.y + 0.09 + 0.021 * (1 + stride), p.z);
        this.pose.rotation.set(0, p.heading + 0.33 * Math.sin(j + v), 0.019 * stride, 'YXZ');
        this.pose.scale.set(1.76, 1.76, 1);
        this.pose.updateMatrix();
        batch.setMatrixAt(count++, this.pose.matrix);
        if (this.drawn.residentStride === null) this.drawn.residentStride = this.pose.rotation.z;
      }
      batch.count = count;
      batch.instanceMatrix.needsUpdate = true;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = stops.find((s) => Math.abs(metres - s[0]) < 78);
    if (!stop) return;
    const blend = Math.min(1, (1 - Math.abs(metres - stop[0]) / 78) * 1.7);
    const p = this.course.place(metres, 0, this.origin),
      t = this.course.place(stop[1], stop[2], this.p);
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (4.8 * dx) / len - camera.x) * blend;
    camera.z += (p.z - (4.8 * dz) / len - camera.z) * blend;
    const terrace = stop[0] === 3360 || stop[0] === 4700;
    camera.y += (p.y + (terrace ? 4.1 : 2.12) - camera.y) * blend;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * blend;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * blend;
    ahead.y += (p.y + stop[3] + ((t.y - p.y) * 14) / len - ahead.y) * blend;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    this.trams.dispose();
    for (const b of this.crowd) {
      b.geometry.dispose();
      b.dispose();
    }
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      this.pegged.geometry,
      this.pegged,
      this.pegInk,
      this.lines.geometry,
      this.lines,
      this.wireInk,
      this.residents,
    ])
      item.dispose();
  }
}
