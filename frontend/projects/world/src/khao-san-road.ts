import {
  BackSide,
  PlaneGeometry,
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  Object3D,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Texture,
} from 'three/webgpu';
import { color, mix, positionWorld, sin, texture, uniform, uv, vec2 } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const lap = 2937.5;
const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [100, 132, 1.8, 3.4],
  [480, 489, -4.7, 1.4],
  [960, 973, 5.55, 1.7],
  [1420, 1440, -3.2, 1.4],
  [2340, 2362, 15, 8.6],
] as const;

export class KhaoSanRoad {
  readonly root = new Group();
  readonly materials = {
    KhaoSanShops: new MeshBasicMaterial({ side: DoubleSide }),
    KhaoSanSigns: new MeshBasicMaterial({ side: DoubleSide }),
    BangkokCarts: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.43 }),
    ThaiTemple: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.38 }),
    FestivalCrowds: new MeshBasicNodeMaterial({ side: DoubleSide, alphaTest: 0.46 }),
    SongkranRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly box = new BoxGeometry();
  private readonly round = new SphereGeometry(1, 12, 8);
  private readonly cylinder = new CylinderGeometry(1, 1, 1, 18);
  private readonly bucketShape = new CylinderGeometry(0.25, 0.19, 0.4, 16, 1, true);
  private readonly paints = new Map<number, MeshLambertMaterial>();
  private readonly parked = new Group();
  private readonly vehicle = new Group();
  private readonly wheels: Group[] = [];
  private readonly play = new Group();
  private readonly bucket = new Group();
  private readonly jet = new Group();
  private readonly stream = new Group();
  private readonly hose = new TubeGeometry(
    new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(1.1, 0.65, 0),
      new Vector3(2.25, 0.52, 0),
      new Vector3(3.4, -0.32, 0),
    ]),
    16,
    0.035,
    5,
    false,
  );
  private readonly water = new MeshBasicMaterial({
    color: 0xb9e8f1,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  private readonly drops = new InstancedMesh(this.round, this.water, 84);
  private readonly dummy = new Object3D();
  private readonly eveningSky = new Mesh(
    new SphereGeometry(780, 16, 8),
    new MeshBasicMaterial({
      side: BackSide,
      color: 0x25223f,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  private readonly portraits: Mesh<PlaneGeometry, MeshBasicMaterial>[] = [];
  private readonly portraitGeo = new PlaneGeometry(1.1, 1.86);
  private readonly portraitMaterials: MeshBasicMaterial[] = [];
  private readonly dusk = uniform(0);
  private readonly actor = scratch();
  private readonly target = scratch();
  private readonly poses = {
    bucketTilt: null as number | null,
    jetReach: null as number | null,
    taxiWheel: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'songkran-shops',
        'songkran-signs',
        'songkran-revellers',
        'songkran-food',
        'songkran-wat',
        'songkran-wet',
      ].map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const fail = result.find((r) => r.status === 'rejected');
    if (fail) {
      for (const t of maps) t.dispose();
      throw fail.reason;
    }
    return new KhaoSanRoad(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const m of maps) {
      m.flipY = false;
      m.colorSpace = SRGBColorSpace;
    }
    const [shop, sign, people, food, temple, road] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    this.materials.KhaoSanShops.map = shop;
    this.materials.KhaoSanSigns.map = sign;
    this.materials.BangkokCarts.map = food;
    this.materials.ThaiTemple.map = temple;
    const crowd = texture(people);
    this.materials.FestivalCrowds.colorNode = crowd.rgb.mul(
      mix(color(0xffffff), color(0xe5aff4), this.dusk.mul(0.46)),
    );
    this.materials.FestivalCrowds.opacityNode = crowd.a;
    road.wrapS = road.wrapT = sign.wrapS = sign.wrapT = RepeatWrapping;
    road.anisotropy = 4;
    const coords = positionWorld.xz;
    const streak = sin(coords.y.mul(16).add(coords.x.mul(8))).mul(0.003);
    const lights = texture(
      sign,
      vec2(coords.x.mul(0.036).add(coords.y.mul(0.019)), coords.y.mul(0.016).add(streak)),
      2,
    ).rgb;
    const grit = texture(road, coords.div(7.1)).rgb.mul(
      mix(color(0xe7eaf3), color(0x8f8ba8), this.dusk),
    );
    const reflectedSky = mix(color(0x9faeb8), color(0x676289), this.dusk);
    this.materials.SongkranRoad.colorNode = mix(
      grit,
      mix(lights, reflectedSky, 0.59),
      uv()
        .x.sub(0.5)
        .abs()
        .pow(2)
        .mul(0.22)
        .add(0.01)

        .add(this.dusk.mul(0.02)),
    );
    this.eveningSky.renderOrder = -0.5;
    this.root.add(this.eveningSky);
    for (let i = 0; i < 8; i++) {
      const sprite = people.clone();
      sprite.repeat.set(0.25, 0.5);
      sprite.offset.set((i % 4) * 0.25, (1 - Math.floor(i / 4)) * 0.5);
      sprite.flipY = true;
      sprite.needsUpdate = true;
      const mat = new MeshBasicMaterial({ map: sprite, alphaTest: 0.44, side: DoubleSide });
      this.portraitMaterials.push(mat);
      const dancer = new Mesh(this.portraitGeo, mat);
      const p = course.place(485 + i * 2.55, i % 2 ? 4.25 : -4.15),
        from = course.place(472);
      dancer.position.set(p.x, p.y + 1.03, p.z);
      dancer.rotation.y = Math.atan2(from.x - p.x, from.z - p.z);
      this.root.add(dancer);
      this.portraits.push(dancer);
    }
    this.makeTaxi();
    for (const [d, side] of [
      [1397, 5.6],
      [1456, 5.8],
      [1484, 6.0],
    ]) {
      const parked = this.vehicle.clone(true);
      this.place(parked, d!, side!);
      this.parked.add(parked);
    }
    const bucketMouth = new Mesh(this.bucketShape, this.tint(0x24a9b8));
    this.bucket.add(bucketMouth);
    const handle = new Mesh(
      new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(-0.23, 0.16, 0),
          new Vector3(-0.14, 0.36, 0),
          new Vector3(0.14, 0.36, 0),
          new Vector3(0.23, 0.16, 0),
        ]),
        9,
        0.018,
        5,
        false,
      ),
      this.tint(0xbac4c1),
    );
    this.handle = handle.geometry;
    this.bucket.add(handle);
    this.bucket.position.set(0.17, 1.07, -0.2);
    this.stream.add(new Mesh(this.hose, this.water));
    this.stream.position.set(0.18, 1.08, -0.2);
    this.jet.add(new Mesh(this.hose, this.water));
    this.jet.position.set(-0.1, 1.13, -2.5);
    this.drops.frustumCulled = false;
    this.play.add(this.bucket, this.stream, this.jet, this.drops);
    this.place(this.play, 490, -4.75);
    this.root.add(this.vehicle, this.play, this.parked);
  }
  private readonly handle: TubeGeometry;
  private tint(c: number) {
    let m = this.paints.get(c);
    if (!m) {
      m = new MeshLambertMaterial({ color: c, side: DoubleSide });
      this.paints.set(c, m);
    }
    return m;
  }
  private part(
    g: Group,
    shape: BufferGeometry,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    col: number,
  ) {
    const mesh = new Mesh(shape, this.tint(col));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    g.add(mesh);
    return mesh;
  }
  private makeTaxi() {
    const g = this.vehicle;
    this.part(g, this.box, 0, 0.46, 0.1, 1.47, 0.17, 2.61, 0x3b4147);
    this.part(g, this.box, 0, 0.75, 0.7, 1.49, 0.54, 1.43, 0x2267aa);
    this.part(g, this.box, 0, 0.97, 0.64, 1.22, 0.18, 0.76, 0xc05b47);
    this.part(g, this.box, 0, 1.16, 1.02, 1.27, 0.43, 0.14, 0xcc7958);
    this.part(g, this.box, 0, 0.91, -0.51, 0.58, 0.14, 0.54, 0x333b3d);
    this.part(g, this.round, 0, 0.79, -1.11, 0.33, 0.49, 0.36, 0x197cb4);
    this.part(g, this.round, 0, 0.9, -1.44, 0.17, 0.15, 0.036, 0xffe8ae);
    this.part(g, this.round, 0, 1.94, 0.12, 0.86, 0.14, 1.41, 0x1c6096);
    this.part(g, this.box, 0, 1.88, 0.1, 1.53, 0.09, 2.48, 0xdfb45f);
    for (const side of [-1, 1]) {
      for (const z of [-0.87, 1.12]) {
        const rail = this.part(
          g,
          this.cylinder,
          0.67 * side,
          1.39,
          z,
          0.036,
          0.97,
          0.036,
          0xb8c1b7,
        );
        rail.rotation.x = z < 0 ? -0.15 : 0;
      }
      for (const y of [1.02, 1.22])
        this.part(g, this.box, side * 0.74, y, 0.69, 0.054, 0.052, 0.89, 0xc9c9b1);
      this.part(g, this.round, side * 0.61, 0.81, 1.43, 0.13, 0.07, 0.035, 0xc43b38);
    }
    for (const [x, z] of [
      [0, -1.16],
      [-0.7, 0.9],
      [0.7, 0.9],
    ]) {
      const wheel = new Group();
      wheel.position.set(x!, 0.32, z!);
      g.add(wheel);
      this.wheels.push(wheel);
      const tyre = this.part(wheel, this.cylinder, 0, 0, 0, 0.3, 0.15, 0.3, 0x262c30);
      tyre.rotation.z = Math.PI / 2;
      for (const side of [-1, 1]) {
        const rim = this.part(
          wheel,
          this.cylinder,
          side * 0.085,
          0,
          0,
          0.17,
          0.015,
          0.17,
          0xaeb3b1,
        );
        rim.rotation.z = Math.PI / 2;
        this.part(wheel, this.box, side * 0.097, 0, 0, 0.022, 0.045, 0.29, 0x5b6670);
      }
    }
  }
  private place(g: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.actor);
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.heading;
  }
  update(metres: number, time: number, evening: number) {
    const d = metres % lap;
    const here = this.course.place(metres, 0, this.actor);
    this.eveningSky.position.set(here.x, here.y, here.z);
    this.eveningSky.material.opacity = evening * 0.94;
    this.eveningSky.visible = evening > 0.001;
    for (let i = 0; i < this.portraits.length; i++) {
      this.portraits[i]!.rotation.z = 0.045 * Math.sin(time * 2.7 + i * 1.95);
    }
    this.dusk.value = evening;
    this.materials.KhaoSanShops.color.setRGB(
      1 - 0.46 * evening,
      1 - 0.57 * evening,
      1 - 0.4 * evening,
    );
    this.materials.KhaoSanSigns.color.setRGB(
      1 + 0.65 * evening,
      1 + 0.22 * evening,
      1 + 0.42 * evening,
    );
    this.play.visible = Math.abs(d - 490) < 145;
    this.poses.bucketTilt = this.poses.jetReach = null;
    if (this.play.visible) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.6);
      this.bucket.rotation.z = -0.22 - 1.16 * pulse;
      this.stream.scale.set(0.45 + 1.15 * pulse, 0.4 + 0.67 * pulse, 0.74);
      this.jet.scale.x = 0.82 + 0.29 * Math.sin(time * 3.14);
      for (let i = 0; i < this.drops.count; i++) {
        const f = (time * (0.7 + (i % 5) * 0.06) + i * 0.618) % 1,
          j = i % 2 === 0;
        this.dummy.position.set(
          0.26 + f * (j ? 4 * this.jet.scale.x : 3.1 * this.stream.scale.x),
          0.17 + 1.04 * (1 - f) + 2.7 * f * (1 - f),
          (j ? -2.5 : -0.2) + 0.3 * Math.sin(i) * f,
        );
        this.dummy.scale.setScalar(0.019 + 0.028 * (1 - f));
        this.dummy.updateMatrix();
        this.drops.setMatrixAt(i, this.dummy.matrix);
      }
      this.drops.instanceMatrix.needsUpdate = true;
      this.poses.bucketTilt = this.bucket.rotation.z;
      this.poses.jetReach = this.jet.scale.x;
    }
    this.parked.visible = Math.abs(d - 1440) < 180;
    this.vehicle.visible = Math.abs(d - 1420) < 155;
    this.place(this.vehicle, 1431 + 6 * Math.sin(time * 0.26), -2.7);
    for (const wheel of this.wheels) wheel.rotation.x = -20 * Math.sin(time * 0.26);
    this.poses.taxiWheel = this.vehicle.visible ? this.wheels[0]!.rotation.x : null;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    const d = metres % lap;
    for (const [at, to, lane, lift] of views) {
      const gap = Math.abs(at - d);
      if (gap > 49) continue;
      const r = this.course.place(metres, 0, this.actor),
        p = this.course.place(to, lane, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (49 - gap) / 24);
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
    this.wheels.length = 0;
    this.play.clear();
    this.vehicle.clear();
    this.parked.clear();
    this.drops.dispose();
    this.eveningSky.geometry.dispose();
    this.eveningSky.material.dispose();
    this.portraitGeo.dispose();
    for (const mat of this.portraitMaterials) {
      mat.map?.dispose();
      mat.dispose();
    }
    this.portraits.length = 0;
    this.portraitMaterials.length = 0;
    for (const a of [
      this.handle,
      this.hose,
      this.box,
      this.round,
      this.cylinder,
      this.bucketShape,
      this.water,
      ...this.paints.values(),
      ...this.maps,
      ...Object.values(this.materials),
    ])
      a.dispose();
    this.paints.clear();
  }
}
