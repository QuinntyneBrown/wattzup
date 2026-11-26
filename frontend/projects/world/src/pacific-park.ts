import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  type Texture,
} from 'three/webgpu';
import { mix, sin, smoothstep, uniform, uv, vec3 } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const ASSETS = [
  'fan-palm',
  'leaning-palm',
  'paired-palms',
  'harbor',
  'trail',
  'skater',
  'cruiser',
  'surfer',
] as const;
const printed = () => new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.4 });
const station = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

export class PacificPark {
  readonly root = new Group();
  readonly materials = {
    FanPalm: printed(),
    LeaningPalm: printed(),
    PairedPalms: printed(),
    HarborSign: printed(),
    TrailShield: printed(),
    PacificWater: new MeshBasicNodeMaterial({ side: DoubleSide }),
  };
  private readonly clock = uniform(0);
  private readonly box = new BoxGeometry();
  private readonly card = new PlaneGeometry(1, 1);
  private readonly rimGeometry = new TorusGeometry(1, 0.012, 5, 64);
  private readonly cream = new MeshBasicMaterial({ color: 0xf4dcb6 });
  private readonly blue = new MeshBasicMaterial({ color: 0x497088 });
  private readonly red = new MeshBasicMaterial({ color: 0xcb5046 });
  private readonly wheel = new Group();
  private readonly cabins = new InstancedMesh(this.box, this.cream, 20);
  private readonly roofs = new InstancedMesh(this.box, this.cream, 20);
  private readonly spokes = new InstancedMesh(this.box, this.cream, 40);
  private readonly train = new InstancedMesh(this.box, this.red, 4);
  private readonly dummy = new Object3D();
  private readonly rider = station();
  private readonly people = [printed(), printed(), printed()];
  private readonly beachgoers: Mesh[] = [];
  private readonly sampled = station();
  private readonly reads = {
    santamonicaStation: 0,
    skaterStride: 0,
    gondolaRise: 0,
    coasterTravel: 0,
  };
  static async load(course: Course) {
    const loader = new TextureLoader();
    const results = await Promise.allSettled(
      ASSETS.map((n) => loader.loadAsync('courses/santamonica-' + n + '.webp')),
    );
    const textures = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      for (const texture of textures) texture.dispose();
      throw failure.reason;
    }
    return new PacificPark(course, textures);
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    const park = course.file.pacificPark!;
    const faces = [
      this.materials.FanPalm,
      this.materials.LeaningPalm,
      this.materials.PairedPalms,
      this.materials.HarborSign,
      this.materials.TrailShield,
      ...this.people,
    ];
    for (const [i, material] of faces.entries()) {
      const texture = textures[i]!;
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = i >= 5;
      material.map = texture;
    }
    const swell = sin(
      uv()
        .y.mul(0.74)
        .add(sin(uv().x.mul(0.16)))
        .sub(this.clock.mul(1.25)),
    );
    const foam = smoothstep(0.79, 0.99, swell).mul(smoothstep(32, 1, uv().y));
    this.materials.PacificWater.colorNode = mix(
      mix(vec3(0.19, 0.45, 0.48), vec3(0.08, 0.29, 0.38), smoothstep(0, 52, uv().y)),
      vec3(0.83, 0.88, 0.8),
      foam,
    );
    this.wheel.position.set(...park.wheelCentre);
    this.root.add(this.wheel);
    this.wheel.rotation.y = Math.PI / 2;
    const rim = new Mesh(this.rimGeometry, this.cream);
    rim.scale.setScalar(park.wheelRadius);
    this.wheel.add(rim, this.spokes, this.cabins, this.roofs);
    const hub = new Mesh(this.box, this.blue);
    hub.scale.set(2.1, 2.1, 2.7);
    this.wheel.add(hub);
    for (let i = 0; i < 20; i++) {
      const tint = new Color([0xc8544c, 0xe9b553, 0x51a8a2, 0x6199b6, 0xd78878][i % 5]!);
      this.cabins.setColorAt(i, tint);
      this.roofs.setColorAt(i, tint);
    }
    this.root.add(this.train);
    for (let i = 0; i < 15; i++) {
      const m = new Mesh(this.card, this.people[i % 3]!);
      this.root.add(m);
      this.beachgoers.push(m);
    }
    for (const m of [this.spokes, this.cabins, this.roofs, this.train]) m.frustumCulled = false;
    this.update(0, 0);
  }
  private pose(
    mesh: InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    angle = 0,
  ) {
    const p = this.dummy;
    p.position.set(x, y, z);
    p.rotation.set(0, 0, angle);
    p.scale.set(w, h, d);
    p.updateMatrix();
    mesh.setMatrixAt(i, p.matrix);
  }
  update(metres: number, time: number) {
    this.clock.value = time;
    this.reads.santamonicaStation = metres;
    const park = this.course.file.pacificPark!;
    this.wheel.visible = this.train.visible = metres > 7550;
    if (this.wheel.visible) {
      for (let i = 0; i < 20; i++) {
        const a = (i * Math.PI) / 10 + time * 0.064,
          x = park.wheelRadius * Math.cos(a),
          y = park.wheelRadius * Math.sin(a);
        for (let j = 0; j < 2; j++)
          this.pose(
            this.spokes,
            2 * i + j,
            x * 0.5,
            y * 0.5,
            j - 0.5,
            park.wheelRadius,
            0.12,
            0.12,
            a,
          );
        this.pose(this.cabins, i, x, y - 1, 0, 1.8, 1.05, 1.55);
        this.pose(this.roofs, i, x, y + 0.08, 0, 1.92, 0.2, 1.64);
        if (!i) this.reads.gondolaRise = y;
      }
      const track = park.track,
        count = track.length - 1;
      for (let i = 0; i < 4; i++) {
        const u = (time * 3.2 + count - i * 0.98) % count,
          index = Math.floor(u),
          a = track[index]!,
          b = track[index + 1]!,
          t = u - index;
        const p = this.dummy;
        p.position.set(
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t + 0.55,
          a[2] + (b[2] - a[2]) * t,
        );
        p.rotation.set(0, Math.atan2(b[0] - a[0], b[2] - a[2]), 0);
        p.rotateX(-Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2])));
        p.scale.set(1.35, 1.02, 1.68);
        p.updateMatrix();
        this.train.setMatrixAt(i, p.matrix);
        if (!i) this.reads.coasterTravel = p.position.x;
      }
      for (const m of [this.spokes, this.cabins, this.roofs, this.train])
        m.instanceMatrix.needsUpdate = true;
    }
    const rider = this.course.place(metres, 0, this.rider);
    for (const [i, m] of this.beachgoers.entries()) {
      const kind = i % 3,
        interval = 39;
      const base = Math.floor((metres - 24) / interval) + Math.floor(i / 3);
      const d = base * interval + kind * 9 + 7 * Math.sin(time * 0.19 + base);
      const left = kind === 2 ? -(47 + 14 * Math.sin(d / 277)) : kind === 1 ? 2.85 : -2.8;
      const pt = this.course.place(d, left, this.sampled);
      const height = kind === 2 ? 1.07 : 1.82;
      m.position.set(
        pt.x,
        kind === 2 ? 0.75 + height * 0.5 + 0.13 * Math.sin(time + d) : pt.y + height * 0.5 + 0.08,
        pt.z,
      );
      m.rotation.set(
        0,
        Math.atan2(rider.x - pt.x, rider.z - pt.z),
        kind === 0 ? 0.055 * Math.sin(time * 3 + i) : 0,
      );
      m.scale.set(kind === 1 ? 2.1 : kind === 2 ? 2.25 : 1.16, height, 1);
      if (!i) this.reads.skaterStride = m.rotation.z;
    }
  }
  report() {
    return this.reads;
  }
  dispose() {
    this.root.clear();
    for (const item of [
      this.box,
      this.rimGeometry,
      this.card,
      this.cream,
      this.blue,
      this.red,
      this.spokes,
      this.cabins,
      this.roofs,
      this.train,
      ...this.people,
      ...Object.values(this.materials),
      ...this.textures,
    ])
      item.dispose();
  }
}
