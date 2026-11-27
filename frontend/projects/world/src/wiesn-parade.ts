import {
  BoxGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type BufferGeometry,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const picture = (cut = false) =>
  new MeshBasicMaterial({ side: DoubleSide, alphaTest: cut ? 0.38 : 0 });
const views = [
  [80, 120, 26, 7],
  [1860, 1888, -2, 2],
  [3410, 3432, 3.8, 2.2],
  [5790, 5840, -51, 24],
  [7710, 7744, 10.5, 2.5],
  [10190, 10268, -29, 20],
] as const;
export class WiesnParade {
  readonly root = new Group();
  readonly materials = {
    WiesnStreet: new MeshBasicMaterial({ vertexColors: true, side: DoubleSide }),
    WiesnHalls: picture(),
    WiesnStalls: picture(),
    WiesnGuests: picture(true),
    BavariaFigure: picture(true),
    Blaskapelle: picture(true),
    BeerHallSigns: picture(),
    BavarianBunting: picture(),
  };
  private readonly p = point();
  private readonly t = point();
  private readonly band = new Group();
  private readonly dray = new Group();
  private readonly wheel = new Group();
  private readonly rotor = new Group();
  private readonly cabins: Group[] = [];
  private readonly horses: Group[] = [];
  private readonly wagonWheels: Mesh[] = [];
  private readonly geometries = new Set<BufferGeometry>();
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly instances: InstancedMesh[] = [];
  private readonly box = new BoxGeometry();
  private readonly pose = {
    brassBeat: null as number | null,
    drayTravel: null as number | null,
    wheelTurn: null as number | null,
  };
  static async load(course: Course) {
    const loaded = await Promise.allSettled(
      ['hall', 'stall', 'guests', 'statue', 'parade', 'signs', 'bunting'].map((key) =>
        new TextureLoader().loadAsync('courses/oktoberfest-' + key + '.webp'),
      ),
    );
    const textures = loaded.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    const failure = loaded.find((result) => result.status === 'rejected');
    if (failure) {
      for (const texture of textures) texture.dispose();
      throw failure.reason;
    }
    return new WiesnParade(course, textures);
  }
  private paint(colour: number) {
    let paint = this.paints.get(colour);
    if (!paint) {
      paint = new MeshBasicMaterial({ color: colour });
      this.paints.set(colour, paint);
    }
    return paint;
  }
  private block(
    parent: Group,
    colour: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
  ) {
    const mesh = new Mesh(this.box, this.paint(colour));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, depth);
    parent.add(mesh);
    return mesh;
  }
  private portrait(cell: number, width: number, height: number) {
    const geo = new PlaneGeometry(width, height);
    this.geometries.add(geo);
    const uv = geo.attributes['uv']!;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (cell + uv.getX(i)) / 3, 1 - uv.getY(i));
    const m = new Mesh(geo, this.materials.Blaskapelle);
    m.position.y = height / 2;
    return m;
  }
  private ring(
    parent: Group,
    colour: number,
    radius: number,
    thick: number,
    x: number,
    y: number,
    z: number,
  ) {
    const g = new TorusGeometry(radius, thick, 6, 48);
    this.geometries.add(g);
    const mesh = new Mesh(g, this.paint(colour));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  private locate(group: Group, metres: number, lane: number) {
    const p = this.course.place(metres, lane, this.p);
    group.position.set(p.x, p.y, p.z);
    group.rotation.y = p.heading;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    this.geometries.add(this.box);
    const mats = [
      this.materials.WiesnHalls,
      this.materials.WiesnStalls,
      this.materials.WiesnGuests,
      this.materials.BavariaFigure,
      this.materials.Blaskapelle,
      this.materials.BeerHallSigns,
      this.materials.BavarianBunting,
    ];
    for (const [i, texture] of textures.entries()) {
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;
      mats[i]!.map = texture;
    }
    this.locate(this.band, 1884, -2.5);
    this.band.add(this.portrait(0, 2.8, 2.25));
    this.root.add(this.band);
    for (const side of [-1, 1]) {
      const horse = new Group();
      const m = this.portrait(2, 3.8, 2.46);
      m.rotation.y = -Math.PI / 2;
      horse.position.set(0.85 * side, 0, -3.65);
      horse.add(m);
      this.horses.push(horse);
      this.dray.add(horse);
      this.block(this.dray, 0x87623f, 0.85 * side, 0.88, -1.39, 0.08, 0.09, 3.4);
      for (const z of [-0.54, 1.65]) {
        const w = this.ring(this.dray, 0x54402c, 0.59, 0.08, side * 1.12, 0.61, z);
        w.rotation.y = Math.PI / 2;
        this.wagonWheels.push(w);
        for (let i = 0; i < 4; i++)
          this.block(this.dray, 0xb4955b, side * 1.11, 0.61, z, 0.075, 0.065, 1.08).rotation.x =
            (i * Math.PI) / 4;
      }
    }
    this.block(this.dray, 0x425c43, 0, 1.01, 0.63, 2.35, 0.52, 3.8);
    for (let n = 0; n < 6; n++) {
      const x = (n % 2) - 0.5,
        z = Math.floor(n / 2) * 0.96 - 0.47;
      this.block(this.dray, 0x977341, x, 1.7, z, 0.86, 1.03, 0.84);
      for (const y of [1.35, 2.03]) this.block(this.dray, 0x524b44, x, y, z, 0.89, 0.09, 0.87);
    }
    this.root.add(this.dray);
    this.locate(this.wheel, 10268, -29);
    this.wheel.rotation.y += 0.32;
    for (const z of [-2.25, 2.25])
      for (const side of [-1, 1]) {
        const leg = this.block(this.wheel, 0x687581, side * 4.3, 10.5, z, 0.63, 22.6, 0.72);
        leg.rotation.z = side * 0.39;
      }
    this.rotor.position.y = 20.7;
    this.wheel.add(this.rotor);
    for (const z of [-1.22, 1.22]) this.ring(this.rotor, 0xe9d4ae, 18.3, 0.26, 0, 0, z);
    this.ring(this.rotor, 0xe3a054, 13.1, 0.18, 0, 0, 0);
    const spokes = new InstancedMesh(this.box, this.paint(0xf2c685), 40);
    const pose = new Object3D();
    const matrix = new Matrix4();
    for (let i = 0; i < 20; i++) {
      const a = (i * Math.PI) / 10,
        x = 18.3 * Math.cos(a),
        y = 18.3 * Math.sin(a);
      for (const [j, z] of [-1.22, 1.22].entries()) {
        pose.position.set(x / 2, y / 2, z);
        pose.rotation.z = a;
        pose.scale.set(18.3, 0.12, 0.12);
        pose.updateMatrix();
        matrix.copy(pose.matrix);
        spokes.setMatrixAt(i * 2 + j, matrix);
      }
      const cab = new Group();
      cab.position.set(x, y, 0);
      this.rotor.add(cab);
      this.cabins.push(cab);
      const c = [0xf8b44e, 0xb74842, 0x5c91a4, 0x759457][i % 4]!;
      this.block(cab, c, 0, -1.42, 0, 1.96, 1.1, 2.69);
      this.block(cab, 0xfce4a3, 0, -0.65, 0, 1.79, 0.52, 2.52);
      this.block(cab, c, 0, -0.29, 0, 2.12, 0.18, 2.82);
    }
    this.rotor.add(spokes);
    this.instances.push(spokes);
    this.root.add(this.wheel);
  }
  update(metres: number, time: number) {
    this.band.visible = Math.abs(metres - 1884) < 170;
    this.dray.visible = Math.abs(metres - 3430) < 200;
    this.wheel.visible = Math.abs(metres - 10268) < 410;
    this.pose.brassBeat = this.pose.drayTravel = this.pose.wheelTurn = null;
    if (this.band.visible) {
      this.band.rotation.z = 0.074 * Math.sin(time * 3.4);
      this.pose.brassBeat = this.band.rotation.z;
    }
    if (this.dray.visible) {
      const distance = 3432 + 9 * Math.sin(time * 0.165);
      this.locate(this.dray, distance, 3.7);
      this.pose.drayTravel = distance;
      for (const [i, h] of this.horses.entries()) {
        h.position.y = 0.055 * (1 + Math.sin(time * 5.2 + i * 2));
        h.rotation.x = 0.035 * Math.sin(time * 5.2 + i * 2);
      }
      for (const w of this.wagonWheels) w.rotation.x = distance / 0.59;
    }
    if (this.wheel.visible) {
      this.rotor.rotation.z = time * 0.055;
      this.pose.wheelTurn = this.rotor.rotation.z;
      for (const cabin of this.cabins) cabin.rotation.z = -this.rotor.rotation.z;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const stop = views.find((s) => Math.abs(s[0] - metres) < 85);
    if (!stop) return;
    const k = Math.min(1, (1 - Math.abs(stop[0] - metres) / 85) * 1.6),
      p = this.course.place(metres, 0, this.p),
      t = this.course.place(stop[1], stop[2], this.t),
      dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.hypot(dx, dz);
    camera.x += (p.x - (5 * dx) / len - camera.x) * k;
    camera.z += (p.z - (5 * dz) / len - camera.z) * k;
    camera.y += (p.y + 2.28 - camera.y) * k;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * k;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * k;
    ahead.y += (p.y + 2.28 + (19 * (t.y + stop[3] - p.y - 2.28)) / (len + 5) - ahead.y) * k;
  }
  report() {
    return this.pose;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      ...this.instances,
      ...this.geometries,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
