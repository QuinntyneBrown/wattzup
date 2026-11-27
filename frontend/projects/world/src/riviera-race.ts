import {
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import { positionWorld, sin, uniform, vertexColor } from 'three/tsl';
import type { Course, CoursePlace } from './course';

const point = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [80, 118, -3.4, 1.45],
  [1840, 1889, -2, 3.4],
  [4820, 4843, -12, 1.55],
  [7150, 7186, -18, 6],
  [8380, 8423, -19, 3.8],
  [11410, 11458, 0, 3.3],
] as const;

export class RivieraRace {
  readonly root = new Group();
  readonly materials = {
    AureliaRoad: new MeshBasicNodeMaterial({ side: DoubleSide }),
    LigurianSea: new MeshBasicNodeMaterial({ side: DoubleSide }),
    RivieraVillas: new MeshBasicMaterial({ side: DoubleSide }),
    ViaRomaShops: new MeshBasicMaterial({ side: DoubleSide }),
    PoggioStone: new MeshBasicMaterial({ side: DoubleSide }),
    FlowerRows: new MeshBasicMaterial({ side: DoubleSide }),
    RivieraPalms: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.48 }),
    PoggioTifosi: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.45 }),
    SanremoChiesa: new MeshBasicMaterial({ side: DoubleSide }),
    PoggioBelfry: new MeshBasicMaterial({ side: DoubleSide }),
    LigurianOlives: new MeshBasicMaterial({ side: DoubleSide, alphaTest: 0.48 }),
    LigurianRock: new MeshBasicMaterial({ side: DoubleSide }),
    LigurianCapes: new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
    RivieraSigns: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly phase = uniform(0);
  private readonly surf = new Group();
  private readonly summit = new Group();
  private readonly finish = new Group();
  private readonly readings = {
    surfRise: null as number | null,
    summitFold: null as number | null,
    finishFold: null as number | null,
    rivieraStation: 0,
  };
  private readonly p = point();
  private readonly q = point();
  private readonly geo = new Set<BufferGeometry>();
  private readonly cloth = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  private readonly pole = new MeshBasicMaterial({ color: 0x7a817b });
  private readonly foam = new MeshBasicMaterial({ color: 0xdae9dc });
  private readonly flagGeo: BufferGeometry[] = [];
  static async load(course: Course) {
    const loader = new TextureLoader();
    const result = await Promise.allSettled(
      [
        'villas',
        'shops',
        'stone',
        'flowers',
        'palms',
        'tifosi',
        'lettering',
        'capi',
        'chiesa',
        'campanile',
        'olives',
        'bedrock',
      ].map((n) => loader.loadAsync('courses/poggio-' + n + '.webp')),
    );
    const textures = result.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failure = result.find((r) => r.status === 'rejected');
    if (failure) {
      for (const t of textures) t.dispose();
      throw failure.reason;
    }
    return new RivieraRace(course, textures);
  }
  private fixed(group: Group, d: number, lane: number) {
    const p = this.course.place(d, lane, this.p);
    group.position.set(p.x, p.y, p.z);
    group.rotation.y = p.heading;
  }
  private flag(group: Group, height: number, width: number, drop: number) {
    const post = new CylinderGeometry(0.045, 0.055, height, 7);
    this.geo.add(post);
    const pole = new Mesh(post, this.pole);
    pole.position.y = height / 2;
    group.add(pole);
    const geometry = new BufferGeometry(),
      coords: number[] = [],
      colors: number[] = [],
      indices: number[] = [];
    const stripes = [
      [0.04, 0.37, 0.17],
      [0.94, 0.94, 0.82],
      [0.69, 0.1, 0.09],
    ];
    for (let i = 0; i < 12; i++) {
      const start = coords.length / 3;
      for (const [n, v] of [
        [i, 0],
        [i + 1, 0],
        [i + 1, 1],
        [i, 1],
      ] as const) {
        coords.push((width * n) / 12, height - drop * v, 0);
        colors.push(...stripes[Math.floor(i / 4)]!);
      }
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
    geometry.setAttribute('position', new Float32BufferAttribute(coords, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    this.geo.add(geometry);
    this.flagGeo.push(geometry);
    group.add(new Mesh(geometry, this.cloth));
  }
  private constructor(
    private readonly course: Course,
    private readonly textures: Texture[],
  ) {
    for (const t of textures) {
      t.flipY = false;
      t.colorSpace = SRGBColorSpace;
    }
    const [villas, shops, stone, flowers, palms, fans, signs, capes, front, bells, olives, rock] =
      textures;
    for (const t of [stone!, flowers!]) t.wrapS = t.wrapT = MirroredRepeatWrapping;
    this.materials.RivieraVillas.map = villas!;
    this.materials.ViaRomaShops.map = shops!;
    this.materials.PoggioStone.map = stone!;
    this.materials.FlowerRows.map = flowers!;
    this.materials.RivieraPalms.map = palms!;
    this.materials.PoggioTifosi.map = fans!;
    this.materials.RivieraSigns.map = signs!;
    this.materials.LigurianCapes.map = capes!;
    this.materials.SanremoChiesa.map = front!;
    this.materials.PoggioBelfry.map = bells!;
    this.materials.LigurianOlives.map = olives!;
    rock!.wrapS = rock!.wrapT = MirroredRepeatWrapping;
    this.materials.LigurianRock.map = rock!;
    this.materials.AureliaRoad.colorNode = vertexColor().rgb.mul(
      sin(positionWorld.x.mul(93).add(positionWorld.z.mul(73)))
        .mul(0.041)
        .add(0.97),
    );
    const swell = sin(
      positionWorld.x.mul(0.28).add(positionWorld.z.mul(0.77)).add(this.phase.mul(1.34)),
    );
    this.materials.LigurianSea.colorNode = vertexColor()
      .rgb.add(swell.smoothstep(0.86, 0.99).mul(0.12))
      .mul(swell.mul(0.055).add(0.99));
    this.fixed(this.summit, 7176, -4.9);
    this.flag(this.summit, 3.85, 2.02, 0.96);
    this.fixed(this.finish, 11449, 5.18);
    this.flag(this.finish, 4.64, 2.73, 1.21);
    this.fixed(this.surf, 1867, -83);
    this.surf.position.y = 0.22;
    const bead = new SphereGeometry(1, 9, 4);
    this.geo.add(bead);
    for (let i = 0; i < 26; i++) {
      const m = new Mesh(bead, this.foam);
      m.position.set((i % 3) * 1.32, 0, (i - 13) * 1.9);
      m.scale.set(1.0, 0.22, 1.28);
      this.surf.add(m);
    }
    this.root.add(this.surf, this.summit, this.finish);
  }
  private fold(group: Group, index: number, time: number) {
    const attr = this.flagGeo[index]!.getAttribute('position');
    for (let j = 0; j < attr.count; j++) {
      const x = attr.getX(j);
      attr.setZ(
        j,
        x * 0.24 * Math.sin(time * 3.2 + x * 3.25 + index * 0.71) +
          x * 0.13 * Math.cos(time * 1.6 - x * 2),
      );
    }
    attr.needsUpdate = true;
    return group.visible ? attr.getZ(attr.count - 2) : null;
  }
  update(metres: number, time: number) {
    this.phase.value = time;
    this.readings.rivieraStation = metres;
    this.surf.visible = Math.abs(metres - 1867) < 305;
    this.summit.visible = Math.abs(metres - 7176) < 170;
    this.finish.visible = Math.abs(metres - 11449) < 185;
    this.readings.surfRise = null;
    this.readings.summitFold = null;
    this.readings.finishFold = null;
    if (this.surf.visible) {
      for (const [i, m] of this.surf.children.entries()) {
        const roll = Math.sin(time * 1.52 + i * 0.36);
        m.position.x = (i % 3) * 1.32 + roll * 1.7;
        m.position.y = 0.24 + roll * 0.2;
        m.scale.x = 1.12 + 0.64 * roll;
      }
      this.readings.surfRise = this.surf.children[0]!.position.y;
    }
    if (this.summit.visible) this.readings.summitFold = this.fold(this.summit, 0, time);
    if (this.finish.visible) this.readings.finishFold = this.fold(this.finish, 1, time);
  }
  sightline(metres: number, camera: Vector3, ahead: CoursePlace) {
    const s = views.find((v) => Math.abs(metres - v[0]) < 73);
    if (!s) return;
    const f = Math.min(1, (1 - Math.abs(metres - s[0]) / 73) * 1.6),
      r = this.course.place(metres, 0, this.p),
      t = this.course.place(s[1], s[2], this.q);
    const dx = t.x - r.x,
      dz = t.z - r.z,
      len = Math.max(1, Math.hypot(dx, dz));
    camera.x += (r.x - (5.3 * dx) / len - camera.x) * f;
    camera.z += (r.z - (5.3 * dz) / len - camera.z) * f;
    camera.y += (r.y + 2.38 - camera.y) * f;
    ahead.x += (r.x + (13.6 * dx) / len - ahead.x) * f;
    ahead.z += (r.z + (13.6 * dz) / len - ahead.z) * f;
    ahead.y += (r.y + 2.38 + (18.9 * (t.y + s[3] - r.y - 2.38)) / (len + 5.3) - ahead.y) * f;
  }
  report() {
    return this.readings;
  }
  dispose() {
    this.root.clear();
    for (const resource of [
      ...this.geo,
      ...Object.values(this.materials),
      ...this.textures,
      this.pole,
      this.cloth,
      this.foam,
    ])
      resource.dispose();
  }
}
