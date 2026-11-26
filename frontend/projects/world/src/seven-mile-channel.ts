import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { mix, positionWorld, sin, texture, uniform, uv, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 118, 1.6, 4],
  [1510, 1556, -35.5, 5.9],
  [2870, 2944, -82, 4.6],
  [4420, 4490, 38, 2.2],
  [6310, 6374, -35.5, 5.5],
  [8020, 8060, 1.6, 4],
] as const;

export class SevenMileChannel {
  readonly root = new Group();
  readonly materials = {
    KeysPavement: new MeshBasicNodeMaterial({ side: DoubleSide }),
    KeysFlats: new MeshBasicNodeMaterial({ side: DoubleSide }),
    KeysMangroves: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.38 }),
    PigeonCottages: new MeshBasicMaterial({ side: DoubleSide }),
    KeysMarkers: new MeshBasicMaterial({ side: DoubleSide }),
    StraitsCumulus: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.23, fog: false }),
  };
  private readonly cube = new BoxGeometry();
  private readonly shapes = new Set<BufferGeometry>([this.cube]);
  private readonly paints = new Map<number, MeshBasicMaterial>();
  private readonly boats: Group[] = [];
  private readonly birds: { body: Group; left: Group; right: Group }[] = [];
  private readonly palm = new Group();
  private readonly wave = uniform(0);
  private readonly p = point();
  private readonly q = point();
  private readonly readings = {
    palmSway: null as number | null,
    boatTravel: null as number | null,
    pelicanWing: null as number | null,
  };
  static async load(course: Course) {
    const results = await Promise.allSettled(
      ['flats', 'mangroves', 'cottages', 'markers', 'clouds'].map((id) =>
        new TextureLoader().loadAsync('courses/overseas-' + id + '.webp'),
      ),
    );
    const images = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      for (const image of images) image.dispose();
      throw error.reason;
    }
    return new SevenMileChannel(course, images);
  }
  private paint(tint: number) {
    let material = this.paints.get(tint);
    if (!material) {
      material = new MeshBasicMaterial({ color: tint, side: DoubleSide });
      this.paints.set(tint, material);
    }
    return material;
  }
  private box(
    parent: Group,
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const m = new Mesh(this.cube, this.paint(c));
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  private polygon(parent: Group, c: number, vertices: number[], indices: number[]) {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    this.shapes.add(geo);
    const m = new Mesh(geo, this.paint(c));
    parent.add(m);
    return m;
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [water, trees, cottages, signs, clouds] = textures;
    this.materials.KeysMangroves.map = trees!;
    this.materials.PigeonCottages.map = cottages!;
    this.materials.KeysMarkers.map = signs!;
    this.materials.StraitsCumulus.map = clouds!;
    water!.wrapS = water!.wrapT = MirroredRepeatWrapping;
    const chop = sin(
      positionWorld.z.mul(0.9).add(positionWorld.x.mul(0.12)).add(this.wave.mul(1.6)),
    );
    this.materials.KeysFlats.colorNode = mix(
      vertexColor().rgb,
      texture(water!, uv().add(chop.mul(0.002))).rgb,
      0.41,
    ).add(chop.mul(0.011));
    this.materials.KeysPavement.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.z.mul(52).add(positionWorld.x.mul(79)))
        .mul(0.035)
        .add(0.97),
    );
    const crown = new PlaneGeometry(7.2, 10.1);
    this.shapes.add(crown);
    crown.translate(0, 5.05, 0);
    const coord = crown.attributes['uv']!;
    for (let i = 0; i < coord.count; i++) {
      coord.setX(i, coord.getX(i) * 0.497);
      coord.setY(i, 1 - coord.getY(i));
    }
    for (const angle of [0, 1.28]) {
      const m = new Mesh(crown, this.materials.KeysMangroves);
      m.rotation.y = angle;
      this.palm.add(m);
    }
    const rooted = course.place(115, 9.6, this.p);
    this.palm.position.set(rooted.x, rooted.y - 0.3, rooted.z);
    this.root.add(this.palm);
    for (let j = 0; j < 2; j++) {
      const boat = new Group();
      const hull = j ? 0x627e89 : 0x608683;
      this.polygon(
        boat,
        hull,
        [
          -1.48, 0.8, 3.2, 1.48, 0.8, 3.2, 1.43, 0.9, -1.9, 0, 1.23, -4.4, -1.43, 0.9, -1.9, -0.89,
          0.06, 2.7, 0.89, 0.06, 2.7, 0, 0.04, -3.5,
        ],
        [0, 1, 6, 0, 6, 5, 1, 2, 7, 1, 7, 6, 2, 3, 7, 3, 4, 7, 4, 0, 5, 4, 5, 7],
      );
      this.polygon(
        boat,
        0xe1dfcf,
        [-1.48, 0.82, 3.2, 1.48, 0.82, 3.2, 1.43, 0.92, -1.9, 0, 1.24, -4.4, -1.43, 0.92, -1.9],
        [0, 1, 2, 0, 2, 4, 2, 3, 4],
      );
      this.box(boat, 0xe6e0c7, 0, 1.12, -0.3, 1.75, 0.85, 1.9);
      this.box(boat, 0x536d72, 0, 1.88, -0.5, 1.6, 0.74, 1.35);
      this.box(boat, 0xf6edd4, 0, 2.32, -0.5, 2.5, 0.12, 2.36);
      this.box(boat, 0x454c4b, 0, 0.76, 3.48, 0.58, 1.15, 0.49);
      for (const s of [-1, 1]) {
        this.box(boat, 0xa4a599, s * 0.94, 2.22, 1.94, 0.043, 3.4, 0.045).rotation.x = 0.34;
        this.polygon(
          boat,
          0xc6e1d6,
          [s * 0.99, 0.1, 3.2, s * 3.72, 0.08, 13, s * 2.91, 0.08, 11.8],
          [0, 1, 2],
        );
      }
      this.boats.push(boat);
      this.root.add(boat);
    }
    for (let j = 0; j < 4; j++) {
      const body = new Group(),
        left = new Group(),
        right = new Group(),
        dark = j === 0 ? 0x584f43 : 0x9b9b92;
      this.box(body, j ? 0xe1e0d1 : 0x8a7b68, 0, 0, 0, 0.19, 0.18, j ? 0.64 : 1.02);
      this.box(body, 0xd3b47d, 0, 0.03, -0.56, 0.083, 0.067, j ? 0.19 : 0.54);
      for (const [side, wing] of [
        [-1, left],
        [1, right],
      ] as const) {
        this.polygon(
          wing,
          dark,
          [
            0,
            0,
            -0.18,
            side * 0.64,
            0.12,
            -0.25,
            side * 1.26,
            0.055,
            0.1,
            side * 0.74,
            0.07,
            0.12,
            0,
            0,
            0.2,
          ],
          [0, 1, 4, 1, 3, 4, 1, 2, 3],
        );
        body.add(wing);
      }
      this.birds.push({ body, left, right });
      this.root.add(body);
    }
  }
  update(metres: number, time: number) {
    this.wave.value = time;
    this.palm.visible = metres < 310;
    this.palm.rotation.z = 0.045 + 0.028 * Math.sin(time * 1.35);
    this.readings.palmSway = this.palm.visible ? this.palm.rotation.z : null;
    this.readings.boatTravel = null;
    for (const [i, boat] of this.boats.entries()) {
      boat.visible = Math.abs(metres - 4440) < 390;
      if (!boat.visible) continue;
      const phase = time * 0.049 + i * 2.7,
        along = 4481 + 38 * Math.sin(phase),
        lane = 36 + 21 * Math.cos(phase) + i * 34;
      const p = this.course.place(along, lane, this.p);
      boat.position.set(p.x, 0.18 + 0.12 * Math.sin(time * 1.3 + i), p.z);
      boat.rotation.set(
        0,
        p.heading + Math.atan2(-21 * Math.sin(phase), 38 * Math.cos(phase)),
        0.043 * Math.sin(time + i),
      );
      if (i === 0) this.readings.boatTravel = boat.position.x;
    }
    this.readings.pelicanWing = null;
    for (const [i, b] of this.birds.entries()) {
      const base = i < 2 ? 6350 : 4470;
      b.body.visible = Math.abs(metres - base) < 300;
      if (!b.body.visible) continue;
      const phase = time * 0.18 + i * 1.1,
        p = this.course.place(
          base + 22 * Math.sin(phase),
          (i < 2 ? -28 : 29) + 11 * Math.cos(phase),
          this.p,
        );
      b.body.position.set(p.x, 2.8 + i * 0.54 + 0.55 * Math.sin(phase), p.z);
      b.body.rotation.y = p.heading - phase;
      b.left.rotation.z = -0.2 + 0.28 * Math.sin(time * (i ? 4.1 : 2.6) + i);
      b.right.rotation.z = -b.left.rotation.z;
      if (i === 0) this.readings.pelicanWing = b.left.rotation.z;
    }
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((s) => Math.abs(metres - s[0]) < 92);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 92) * 1.45);
    const rider = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.q);
    const dx = t.x - rider.x,
      dz = t.z - rider.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (rider.x - (5.2 * dx) / len - camera.x) * f;
    camera.z += (rider.z - (5.2 * dz) / len - camera.z) * f;
    camera.y += (rider.y + 2.38 - camera.y) * f;
    ahead.x += (rider.x + (14 * dx) / len - ahead.x) * f;
    ahead.z += (rider.z + (14 * dz) / len - ahead.z) * f;
    const height = s[0] === 80 || s[0] === 8020 ? t.y + s[3] : s[3];
    ahead.y += (rider.y + 2.38 + (19.2 * (height - rider.y - 2.38)) / (len + 5.2) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      ...this.shapes,
      ...this.paints.values(),
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
