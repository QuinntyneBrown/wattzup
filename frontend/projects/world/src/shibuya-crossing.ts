import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, texture, uv, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const COUNT = 56;
const lap = 4075;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class ShibuyaCrossing {
  readonly root = new Group();
  readonly materials = {
    TokyoFrontages: new MeshBasicMaterial({ side: DoubleSide }),
    Tokyo109: new MeshBasicMaterial({ side: DoubleSide }),
    TokyoScreen: new MeshBasicMaterial({ side: DoubleSide }),
    TokyoWetRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly poses = {
    pedestrianKnee: null as number | null,
    screenGlow: null as number | null,
    trainPosition: null as number | null,
  };
  private readonly body = new BoxGeometry();
  private readonly round = new SphereGeometry(1, 10, 8);
  private readonly umbrella = new SphereGeometry(1, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  private readonly shaft = new CylinderGeometry(0.014, 0.014, 1, 5);
  private readonly crowd = new Group();
  private readonly bronze = new Mesh(
    new PlaneGeometry(2.45, 4.12),
    new MeshBasicMaterial({ alphaTest: 0.4, side: DoubleSide }),
  );
  private readonly train = new Group();
  private readonly taxi = new Group();
  private readonly dummy = new Object3D();
  private readonly place = scratch();
  private readonly target = scratch();
  private readonly coats = this.batch(this.round, COUNT);
  private readonly heads = this.batch(this.round, COUNT);
  private readonly legs = this.batch(this.body, COUNT * 2);
  private readonly hair = this.batch(this.round, COUNT);
  private readonly poles = this.batch(this.shaft, COUNT);
  private readonly covers = this.batch(this.umbrella, COUNT, true);
  private readonly paint = new Map<number, MeshBasicMaterial>();
  private readonly groups = [this.coats, this.heads, this.legs, this.hair, this.poles, this.covers];
  static async load(course: Course) {
    const loader = new TextureLoader();
    const files = [
      'shibuya-frontages',
      'shibuya-109',
      'shibuya-broadcast',
      'fishhill-tarmac',
      'shibuya-hachiko',
    ];
    const results = await Promise.allSettled(
      files.map((f) => loader.loadAsync('courses/' + f + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      maps.forEach((t) => t.dispose());
      throw error.reason;
    }
    return new ShibuyaCrossing(course, maps);
  }
  private batch(g: BufferGeometry, count: number, clear = false) {
    const b = new InstancedMesh(
      g,
      new MeshBasicMaterial({
        transparent: clear,
        opacity: clear ? 0.54 : 1,
        depthWrite: !clear,
        side: DoubleSide,
      }),
      count,
    );
    b.frustumCulled = false;
    this.crowd.add(b);
    return b;
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const t of maps) {
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
    }
    const [front, number, screen, road] = maps as [Texture, Texture, Texture, Texture];
    road.wrapS = road.wrapT = RepeatWrapping;
    front.wrapS = front.wrapT = RepeatWrapping;
    this.materials.TokyoFrontages.map = front;
    number.repeat.x = -1;
    number.offset.x = 1;
    this.materials.Tokyo109.map = number;
    const portrait = maps[4]!;
    portrait.flipY = true;
    this.bronze.material.map = portrait;
    const dog = course.place(132, -12.9),
      approach = course.place(118);
    this.bronze.position.set(dog.x, dog.y + 2.36, dog.z);
    this.bronze.rotation.y = Math.atan2(approach.x - dog.x, approach.z - dog.z);
    this.materials.TokyoScreen.map = screen;
    const coords = positionWorld.xz;
    // Across each road strip, reflected shop lights strengthen towards the wet gutters.
    const gutter = uv().x.sub(0.5).abs().mul(2).pow(2);
    const ripple = sin(coords.x.mul(9).add(coords.y.mul(21))).mul(0.002);
    const reflected = texture(
      front,
      vec2(coords.x.mul(0.018).add(coords.y.mul(0.012)), coords.y.mul(0.009).add(ripple)),
      3,
    ).rgb;
    const asphalt = texture(road, coords.div(3.7)).rgb.mul(color(0x8991ac));
    this.materials.TokyoWetRoad.colorNode = mix(asphalt, reflected, gutter.mul(0.09).add(0.009));
    const colors = [0x383f57, 0xac5576, 0x34454a, 0x6b7182, 0x685454, 0x4d364b, 0x998a75];
    for (let i = 0; i < COUNT; i++) {
      this.coats.setColorAt(i, new Color(colors[i % colors.length]));
      this.heads.setColorAt(i, new Color([0xe2b29c, 0xc99578, 0xc99b86][i % 3]));
      this.hair.setColorAt(i, new Color(0x292332));
      this.covers.setColorAt(i, new Color([0xb6ddde, 0xaac5e5, 0xe9c7d6, 0xdcdbe3][i % 4]));
      this.poles.setColorAt(i, new Color(0xa6a9af));
      for (let j = 0; j < 2; j++) this.legs.setColorAt(i * 2 + j, new Color(0x333345));
    }
    const crossing = course.place(745);
    this.crowd.position.set(crossing.x, crossing.y + 0.08, crossing.z);
    this.crowd.rotation.y = crossing.heading;
    for (let n = 0; n < 3; n++) {
      const x = (n - 1) * 13.3;
      this.part(this.train, x, 1.25, 0, 12.9, 2.5, 2.9, 0xabb4b9);
      this.part(this.train, x, 0.84, 0, 12.94, 0.31, 2.95, 0x88ba53);
      for (let j = -3; j <= 3; j++)
        for (const side of [-1, 1])
          this.part(this.train, x + j * 1.57, 1.77, side * 1.46, 1.15, 0.83, 0.05, 0xe4dab0);
    }
    this.part(this.taxi, 0, 0.66, 0, 1.76, 0.72, 4.3, 0x303445);
    this.part(this.taxi, 0, 1.22, 0.13, 1.53, 0.63, 2.07, 0x68849a);
    this.part(this.taxi, 0, 1.57, 0.14, 1.55, 0.12, 2.1, 0x283442);
    this.part(this.taxi, 0, 1.77, 0, 0.48, 0.23, 0.31, 0xf4db8c);
    for (const side of [-1, 1])
      this.part(this.taxi, side * 0.61, 0.67, -2.17, 0.38, 0.21, 0.05, 0xffe4ad);
    this.root.add(this.bronze, this.crowd, this.train, this.taxi);
  }
  private part(
    parent: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tint: number,
  ) {
    let mat = this.paint.get(tint);
    if (!mat) {
      mat = new MeshBasicMaterial({ color: tint });
      this.paint.set(tint, mat);
    }
    const m = new Mesh(this.body, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
  }
  private pose(
    batch: InstancedMesh,
    index: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tilt = 0,
    heading = 0,
  ) {
    this.dummy.position.set(x, y, z);
    this.dummy.scale.set(w, h, d);
    this.dummy.rotation.set(tilt, heading, 0, 'YXZ');
    this.dummy.updateMatrix();
    batch.setMatrixAt(index, this.dummy.matrix);
  }
  update(metres: number, time: number) {
    const d = metres % lap;
    this.crowd.visible = Math.abs(d - 745) < 202;
    this.poses.pedestrianKnee = null;
    if (this.crowd.visible) {
      for (let i = 0; i < COUNT; i++) {
        const axis = i % 4;
        const a = [0.77, -0.77, Math.PI / 2, 0][axis]!;
        const clock = time + (i % 3) * 0.22;
        const side = (i % 8 < 4 ? 1 : -1) * (Math.floor(clock / 25) % 2 ? -1 : 1);
        const local = clock % 25;
        const moving = local < 18;
        const dist = side * (moving ? -16 + (32 * local) / 18 : 16);
        const lane = (((i * 13) % 17) - 8) * 0.37 + (axis === 2 ? 15 : axis === 3 ? -16 : 0);
        const x = dist * Math.cos(a) - lane * Math.sin(a),
          z = dist * Math.sin(a) + lane * Math.cos(a);
        const swing = moving ? Math.sin(time * 6 + i) * 0.49 : 0;
        const size = 0.92 + 0.035 * (i % 6);
        const face = Math.atan2(Math.cos(a) * side, Math.sin(a) * side);
        for (const j of [-1, 1])
          this.pose(
            this.legs,
            2 * i + (j + 1) / 2,
            x + j * 0.105 * Math.cos(face),
            0.42 * size,
            z - j * 0.105 * Math.sin(face),
            0.15,
            0.8 * size,
            0.16,
            swing * j,
            face,
          );
        if (i === 0) this.poses.pedestrianKnee = this.dummy.rotation.x;
        this.pose(this.coats, i, x, 1.03 * size, z, 0.255, 0.44 * size, 0.19, 0, face);
        this.pose(this.heads, i, x, 1.55 * size, z, 0.151, 0.185, 0.15);
        this.pose(this.hair, i, x, 1.66 * size, z, 0.153, 0.11, 0.152);
        this.pose(this.poles, i, x + 0.22, 1.56 * size, z, 1, 1.04 * size, 1);
        this.pose(this.covers, i, x + 0.22, 1.97 * size, z, 0.67, 0.31, 0.67);
      }
      this.groups.forEach((b) => (b.instanceMatrix.needsUpdate = true));
    }
    const intensity = 0.83 + 0.16 * Math.sin(time * 1.7);
    this.materials.TokyoScreen.color.setRGB(0.83 + 0.16 * Math.sin(time * 1.3), intensity, 1);
    this.poses.screenGlow = Math.abs(d - 815) < 172 ? this.materials.TokyoScreen.color.g : null;
    const span = d < 420 ? 155 : 782;
    this.train.visible = Math.abs(d - span) < 238;
    const p = this.course.place(span, ((time * 5.4 + 17) % 104) - 52, this.place);
    this.train.position.set(p.x, p.y + 8.53, p.z);
    this.train.rotation.y = p.heading;
    this.poses.trainPosition = this.train.visible
      ? this.train.position.z + this.train.position.x
      : null;
    const cab = this.course.place(1450 + ((time * 5.8) % 126), -4.1, this.place);
    this.taxi.position.set(cab.x, cab.y, cab.z);
    this.taxi.rotation.y = cab.heading;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = metres % lap;
    const views = [
      [120, 132, -12.9, 2.15],
      [720, 748, 0, 1],
      [810, 832, -12, 6.8],
      [1480, 1513, -14, 7.5],
      [2650, 2680, -12, 6],
    ];
    for (const [at, to, side, lift] of views) {
      if (Math.abs(at! - d) > 43) continue;
      const rider = this.course.place(metres, 0, this.place),
        site = this.course.place(to!, side!, this.target);
      const dx = site.x - rider.x,
        dz = site.z - rider.z,
        len = Math.max(1, Math.hypot(dx, dz));
      const weight = Math.min(1, (43 - Math.abs(at! - d)) / 22);
      camera.x += (rider.x - (5 * dx) / len - camera.x) * weight;
      camera.z += (rider.z - (5 * dz) / len - camera.z) * weight;
      camera.y += (rider.y + 2.5 - camera.y) * weight;
      ahead.x += (rider.x + (14 * dx) / len - ahead.x) * weight;
      ahead.z += (rider.z + (14 * dz) / len - ahead.z) * weight;
      ahead.y +=
        (rider.y + 1.5 + (19 * (site.y + lift! - rider.y - 2.5)) / (len + 5) - ahead.y) * weight;
    }
  }
  report() {
    return this.poses;
  }
  dispose() {
    this.root.clear();
    this.crowd.clear();
    this.train.clear();
    this.taxi.clear();
    for (const b of this.groups) {
      b.dispose();
      b.material.dispose();
    }
    for (const asset of [
      this.bronze.material,
      this.bronze.geometry,
      this.body,
      this.round,
      this.umbrella,
      this.shaft,
      ...this.maps,
      ...this.paint.values(),
      ...Object.values(this.materials),
    ])
      asset.dispose();
    this.paint.clear();
  }
}
