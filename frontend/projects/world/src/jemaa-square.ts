import { positionWorld, vertexColor } from 'three/tsl';
import {
  CanvasTexture,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { medinaScooter } from './medina-scooter';

const place = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 253, -94, 3.9],
  [2160, 2184, -7.8, 2.5],
  [4320, 4335, 4.65, 1.6],
  [6680, 6712, 1.25, 2.2],
  [9240, 9265, -4.7, 1.38],
  [12240, 12275, 0, 2.4],
] as const;
function risingSmoke() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const b = canvas.getContext('2d')!;
  for (let n = 0; n < 18; n++) {
    const x = 65 + 18 * Math.sin(n * 1.48),
      y = 108 - n * 4.7,
      r = 13 + n * 0.86;
    const g = b.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(221,205,187,.32)');
    g.addColorStop(1, 'rgba(222,204,185,0)');
    b.fillStyle = g;
    b.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  return new CanvasTexture(canvas);
}
function figureGeometry(index: number) {
  const g = new PlaneGeometry(1, 1);
  g.translate(0, 0.5, 0);
  const uv = g.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    // This atlas is shared with Blender’s UVs and loaded in glTF top-left orientation.
    uv.setXY(
      i,
      ((index % 2) + 0.01 + 0.98 * uv.getX(i)) / 2,
      (Math.floor(index / 2) + 0.99 - 0.98 * uv.getY(i)) / 2,
    );
  }
  return g;
}
export class JemaaSquare {
  readonly root = new Group();
  private readonly sellers = new MeshBasicMaterial({ side: DoubleSide });
  private readonly buildings = new MeshBasicMaterial({ side: DoubleSide });
  private readonly lanterns = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 });
  private readonly people = new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.42 });
  private readonly paving = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly plaza = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly bulbs = new MeshBasicMaterial({ vertexColors: true, fog: false });
  readonly materials = {
    MedinaBulbs: this.bulbs,
    SoukGoods: this.sellers,
    MedinaFacades: this.buildings,
    SoukLanterns: this.lanterns,
    SquareFamilies: this.people,
    MedinaPaving: this.paving,
    JemaaSquare: this.plaza,
  };
  private readonly vapour = risingSmoke();
  private readonly smokeInk = new SpriteMaterial({
    map: this.vapour,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
  });
  private readonly plumes = Array.from({ length: 24 }, () => new Sprite(this.smokeInk));
  private readonly vehiclePaint = new MeshLambertMaterial({ vertexColors: true });
  private readonly scooter = medinaScooter(this.vehiclePaint);
  private readonly figures = [0, 1, 2, 3].map(figureGeometry);
  private readonly players = [
    new Mesh(this.figures[0]!, this.people),
    new Mesh(this.figures[1]!, this.people),
  ];
  private readonly cart = new Mesh(this.figures[2]!, this.people);
  private readonly audience = new InstancedMesh(this.figures[3]!, this.people, 7);
  private readonly p = place();
  private readonly origin = place();
  private readonly pose = new Object3D();
  private readonly drawn = {
    smokeHeight: null as number | null,
    scooterStation: null as number | null,
    musicianTilt: null as number | null,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ['stalls', 'medina', 'performers'].map((n) =>
        loader.loadAsync('courses/marrakech-' + n + '.webp'),
      ),
    );
    const images: Texture[] = [];
    for (const r of results) if (r.status === 'fulfilled') images.push(r.value);
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const i of images) i.dispose();
      throw error.reason;
    }
    return new JemaaSquare(course, images);
  }
  private constructor(
    private readonly course: Course,
    private readonly images: Texture[],
  ) {
    for (const image of images) {
      image.colorSpace = SRGBColorSpace;
      image.flipY = false;
    }
    const [goods, medina, artists] = images as [Texture, Texture, Texture];
    this.sellers.map = goods;
    this.buildings.map = this.lanterns.map = medina;
    this.people.map = artists;
    const grain = positionWorld.z
      .mul(46.17)
      .add(positionWorld.x.mul(33.1))
      .sin()
      .mul(3826.7)
      .fract();
    const joint = positionWorld.x
      .mul(0.91)
      .fract()
      .smoothstep(0.002, 0.019)
      .mul(positionWorld.z.mul(1.66).fract().smoothstep(0.003, 0.031));
    this.paving.colorNode = vertexColor().rgb.mul(joint.mul(0.15).add(grain.mul(0.24)).add(0.72));
    this.plaza.colorNode = vertexColor().rgb.mul(joint.mul(0.19).add(grain.mul(0.17)).add(0.68));
    this.audience.frustumCulled = false;
    for (let i = 0; i < 7; i++) {
      const angle = -1.4 + i * 0.47;
      const p = course.place(9266 + 6 * Math.cos(angle), -5.4 - 5 * Math.sin(angle), this.p);
      this.pose.position.set(p.x, p.y, p.z);
      this.pose.rotation.y = p.heading + angle * 0.45;
      this.pose.scale.set(2.95, 1.82, 1);
      this.pose.updateMatrix();
      this.audience.setMatrixAt(i, this.pose.matrix);
    }
    this.root.add(...this.plumes, this.scooter, this.cart, ...this.players, this.audience);
  }
  update(metres: number, time: number) {
    this.drawn.smokeHeight = null;
    for (let n = 0; n < this.plumes.length; n++) {
      const sprite = this.plumes[n]!,
        index = Math.floor(metres / 24) - 2 + Math.floor(n / 2);
      const d = index * 24 + 8,
        side = n % 2 === 0 ? 1 : -1;
      sprite.visible = (d >= 0 && d < 2780) || (d > 9050 && d < 10120);
      if (!sprite.visible) continue;
      const phase = (time * 0.16 + n * 0.17) % 1,
        p = this.course.place(d, side * (n % 4 < 2 ? 13.3 : 9.1), this.p);
      sprite.position.set(
        p.x + phase * 1.5,
        p.y + 2.7 + phase * 2.9,
        p.z + 0.43 * Math.sin(phase * 3 + n),
      );
      const scale = Math.sin(Math.PI * phase);
      sprite.scale.set(3.8 * scale, 5.6 * scale, 1);
      if (this.drawn.smokeHeight === null) this.drawn.smokeHeight = sprite.position.y;
    }
    const offset = 23 - time * 3.17,
      station = Math.ceil((metres + 7 - offset) / 80) * 80 + offset;
    this.scooter.visible = station > 5250 && station < 8210;
    this.drawn.scooterStation = this.scooter.visible ? station : null;
    if (this.scooter.visible) {
      const p = this.course.place(station, -1.12, this.p);
      this.scooter.position.set(p.x, p.y + 0.03, p.z);
      this.scooter.rotation.set(-p.pitch, p.heading + Math.PI, 0.014 * Math.sin(time * 0.6), 'YXZ');
    }
    this.cart.visible = Math.abs(metres - 4320) < 175;
    if (this.cart.visible) {
      const p = this.course.place(4348 + 13 * Math.sin(time * 0.086), -2.48, this.p);
      this.cart.position.set(p.x, p.y + 0.03 + 0.019 * Math.sin(time * 4.1), p.z);
      this.cart.rotation.y = p.heading + 0.85;
      this.cart.scale.set(3.47, 1.72, 1);
    }
    this.drawn.musicianTilt = null;
    this.audience.visible = Math.abs(metres - 9240) < 190;
    for (let i = 0; i < 2; i++) {
      const m = this.players[i]!;
      m.visible = this.audience.visible;
      if (!m.visible) continue;
      const q = this.course.place(9261 + i * 1.68, -3.8 - i * 1.12, this.p);
      m.position.set(q.x, q.y + 0.02, q.z);
      m.rotation.set(0, q.heading + 0.25, 0.045 * Math.sin(time * 2.75 + i), 'YXZ');
      m.scale.set(i ? 1.15 : 1.63, i ? 1.84 : 1.22, 1);
      if (i === 1) this.drawn.musicianTilt = m.rotation.z;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const view = views.find((v) => Math.abs(v[0] - metres) < 78);
    if (!view) return;
    const p = this.course.place(metres, 0, this.origin),
      t = this.course.place(view[1], view[2], this.p);
    const dx = t.x - p.x,
      dz = t.z - p.z,
      len = Math.max(0.01, Math.hypot(dx, dz)),
      w = Math.min(1, (1 - Math.abs(view[0] - metres) / 78) * 1.71);
    camera.x += (p.x - (4.85 * dx) / len - camera.x) * w;
    camera.z += (p.z - (4.85 * dz) / len - camera.z) * w;
    camera.y += (p.y + 2.12 - camera.y) * w;
    ahead.x += (p.x + (14 * dx) / len - ahead.x) * w;
    ahead.z += (p.z + (14 * dz) / len - ahead.z) * w;
    ahead.y += (p.y + view[3] + ((t.y - p.y) * 14) / len - ahead.y) * w;
  }
  report() {
    return this.drawn;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      ...this.images,
      ...Object.values(this.materials),
      ...this.figures,
      this.audience,
      this.vehiclePaint,
      this.scooter.geometry,
      this.vapour,
      this.smokeInk,
    ])
      item.dispose();
  }
}
