import {
  BoxGeometry,
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
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const views = [
  [80, 153, -17, 2.35],
  [3310, 3351, -20, 4.32],
  [6440, 6460, -12.8, 1.3],
  [9630, 9656, -15, 2.0],
  [13720, 13754, -12, 2.75],
  [17960, 18031, -49, 8.5],
] as const;
const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const surface = () => new MeshBasicMaterial({ side: DoubleSide });
export class ValensoleFields {
  readonly root = new Group();
  readonly materials = {
    Lavandin: surface(),
    DeepLavender: surface(),
    GoldWheat: surface(),
    Sunflowers: surface(),
    MasFacades: surface(),
    PlateauSigns: surface(),
    ValensolePlants: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    PlateauRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly rotor = new Group();
  private readonly blade = new BoxGeometry();
  private readonly drum = new CylinderGeometry(0.48, 0.48, 3.37, 14);
  private readonly hubPaint = new MeshBasicMaterial({ color: 0x66635b });
  private readonly tinePaint = new MeshBasicMaterial({ color: 0xc49d49 });
  private readonly sprig = new PlaneGeometry(0.89, 0.67);
  private readonly flowers: InstancedMesh;
  private readonly sphere = new SphereGeometry(1, 7, 5);
  private readonly beePaint = new MeshBasicMaterial({ color: 0xb88418 });
  private readonly stripePaint = new MeshBasicMaterial({ color: 0x383128 });
  private readonly wingPaint = new MeshBasicMaterial({ color: 0xd9dbd2 });
  private readonly bees: Group[] = [];
  private readonly transform = new Object3D();
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    provenceStation: 0,
    flowerLean: null as number | null,
    beeFlight: null as number | null,
    reelAngle: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['lavandin', 'violet', 'wheat', 'sunflowers', 'plants', 'walls', 'signs'].map((s) =>
        loader.loadAsync('courses/provence-' + s + '.webp'),
      ),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const texture of textures) texture.dispose();
      throw failure.reason;
    }
    return new ValensoleFields(course, textures);
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const [i, t] of textures.entries()) {
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
      if (i < 4) {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.anisotropy = 4;
      }
    }
    const fields = [
      this.materials.Lavandin,
      this.materials.DeepLavender,
      this.materials.GoldWheat,
      this.materials.Sunflowers,
      this.materials.ValensolePlants,
      this.materials.MasFacades,
      this.materials.PlateauSigns,
    ];
    for (const [i, m] of fields.entries()) m.map = textures[i]!;
    this.materials.PlateauRoad.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(79).add(positionWorld.z.mul(51)))
        .mul(0.036)
        .add(0.96),
    );
    const uv = this.sprig.getAttribute('uv');
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (0.01 + 0.98 * uv.getX(i)) / 3, (2 - 0.01 - 0.98 * uv.getY(i)) / 2);
    this.sprig.translate(0, 0.335, 0);
    this.flowers = new InstancedMesh(this.sprig, this.materials.ValensolePlants, 256);
    this.flowers.frustumCulled = false;
    this.root.add(this.flowers);
    for (let i = 0; i < 16; i++) {
      const group = new Group(),
        body = new Mesh(this.sphere, this.beePaint);
      body.scale.set(0.039, 0.027, 0.072);
      group.add(body);
      const stripe = new Mesh(this.sphere, this.stripePaint);
      stripe.scale.set(0.041, 0.028, 0.018);
      group.add(stripe);
      for (const side of [-1, 1]) {
        const wing = new Mesh(this.sphere, this.wingPaint);
        wing.scale.set(0.043, 0.008, 0.022);
        wing.position.set(side * 0.036, 0.02, 0.006);
        group.add(wing);
      }
      this.bees.push(group);
      this.root.add(group);
    }
    const drum = new Mesh(this.drum, this.hubPaint);
    drum.rotation.z = Math.PI / 2;
    this.rotor.add(drum);
    for (let j = 0; j < 7; j++) {
      const angle = (j * Math.PI * 2) / 7;
      const bar = new Mesh(this.blade, this.tinePaint);
      bar.scale.set(3.55, 0.075, 0.07);
      bar.position.set(0, 0.63 * Math.sin(angle), 0.63 * Math.cos(angle));
      this.rotor.add(bar);
      for (let tine = -3; tine <= 3; tine++) {
        const tooth = new Mesh(this.blade, this.tinePaint);
        tooth.scale.set(0.04, 0.32, 0.043);
        tooth.rotation.x = Math.PI / 2 - angle;
        tooth.position.set(tine * 0.47, 0.71 * Math.sin(angle), 0.71 * Math.cos(angle));
        this.rotor.add(tooth);
      }
    }
    const carrier = new Group();
    const p = course.place(9652.9, -15, this.p);
    carrier.position.set(p.x, p.y + 0.82, p.z);
    carrier.rotation.y = p.heading;
    carrier.add(this.rotor);
    this.root.add(carrier);
  }
  update(metres: number, time: number) {
    this.readings.provenceStation = metres;
    const first = Math.floor(metres / 1.7) - 8;
    for (let i = 0; i < this.flowers.count; i++) {
      const j = first + (i >> 2),
        d = j * 1.7,
        side = i % 2 ? 1 : -1;
      const lane = side * (4.97 + ((i % 4) >> 1) * 1.03 + 0.49 * Math.sin(j * 0.79));
      const p = this.course.place(d, lane, this.p),
        lean = 0.136 * Math.sin(time * 2.25 + j * 0.37);
      this.transform.position.set(p.x, p.y + 0.02, p.z);
      this.transform.rotation.set(0, p.heading + 0.9 * Math.sin(j * 1.86), lean);
      const scale = 0.67 + 0.27 * Math.sin(j * 0.63);
      this.transform.scale.setScalar(scale);
      this.transform.updateMatrix();
      this.flowers.setMatrixAt(i, this.transform.matrix);
      if (i === 32) this.readings.flowerLean = this.transform.rotation.z;
    }
    this.flowers.instanceMatrix.needsUpdate = true;
    const apiary = Math.abs(metres - 6455) < 118;
    this.readings.beeFlight = null;
    for (const [i, bee] of this.bees.entries()) {
      bee.visible = apiary;
      if (!apiary) continue;
      const a = time * 1.31 + i * 1.93;
      const p = this.course.place(
        6448 + (i % 5) * 3.9 + 1.1 * Math.cos(a),
        -10.7 - (i % 3) * 3.3 - 0.79 * Math.sin(a * 0.9),
        this.p,
      );
      bee.position.set(p.x, p.y + 1.15 + 0.33 * Math.sin(a * 1.43), p.z);
      bee.rotation.y = a;
      if (i === 0) this.readings.beeFlight = bee.position.x;
    }
    this.rotor.visible = Math.abs(metres - 9656) < 168;
    this.readings.reelAngle = null;
    if (this.rotor.visible) {
      this.rotor.rotation.x = time * 2.28;
      this.readings.reelAngle = this.rotor.rotation.x;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = views.find((v) => Math.abs(metres - v[0]) < 72);
    if (!view) return;
    const f = Math.min(1, (1 - Math.abs(metres - view[0]) / 72) * 1.55);
    const r = this.course.place(metres, 0, this.p),
      t = this.course.place(view[1], view[2], this.q);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.26 - camera.y) * f;
    ahead.x += (r.x + (13 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.26 + (18 * (t.y + view[3] - r.y - 2.26)) / (len + 5) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    this.flowers.dispose();
    for (const x of [
      this.blade,
      this.drum,
      this.sprig,
      this.sphere,
      this.hubPaint,
      this.tinePaint,
      this.beePaint,
      this.stripePaint,
      this.wingPaint,
      ...Object.values(this.materials),
      ...this.textures,
    ])
      x.dispose();
  }
}
