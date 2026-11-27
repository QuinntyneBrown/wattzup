import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Vector3,
} from 'three/webgpu';
import {
  color,
  cos,
  mix,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import type { Course, CoursePlace } from './course';

const scratch = (): CoursePlace => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });
const views = [
  [100, 119, -10, 2.3],
  [1780, 1980, 260, 5],
  [3980, 3988, -4, 1.2],
  [6320, 6331, 9.7, 0],
  [8840, 9940, -650, 80],
  [12140, 12220, 74, 0.6],
] as const;
export class SkyeGlen {
  readonly root = new Group();
  readonly materials = {
    SkyeRoad: new MeshLambertNodeMaterial({ side: DoubleSide }),
    SkyeHeather: new MeshBasicMaterial({ alphaTest: 0.47, side: DoubleSide }),
    SkyeMoor: new MeshLambertNodeMaterial({ side: DoubleSide }),
    HarportRelief: new MeshBasicMaterial({ alphaTest: 0.43, side: DoubleSide, fog: false }),
    BlackCuillin: new MeshBasicMaterial({ alphaTest: 0.41, side: DoubleSide, fog: false }),
    RedCuillin: new MeshBasicMaterial({ alphaTest: 0.41, side: DoubleSide, fog: false }),
    FairyPools: new MeshBasicNodeMaterial({ alphaTest: 0.45, side: DoubleSide }),
    SeaLochs: new MeshLambertNodeMaterial({ side: DoubleSide }),
    PassingPlaces: new MeshBasicMaterial({ side: DoubleSide }),
  };
  private readonly graze = uniform(0);
  private readonly flow = uniform(0);
  private readonly fog = new Group();
  private readonly stock = new Group();
  private readonly panel = new PlaneGeometry(1, 1, 22, 9);
  private readonly wool = new SphereGeometry(1, 12, 9);
  private readonly sheep = new MeshLambertMaterial({ color: 0xc5c4b6 });
  private readonly hoof = new MeshLambertMaterial({ color: 0x504c44 });
  private readonly cow = new MeshBasicNodeMaterial({ side: DoubleSide, alphaTest: 0.45 });
  private readonly mist: CanvasTexture;
  private readonly fogMaterial: MeshBasicMaterial;
  private readonly state = {
    grazingAngle: null as number | null,
    waterPhase: null as number | null,
    fogPosition: null as number | null,
  };
  private readonly rider = scratch();
  private readonly target = scratch();
  static async load(course: Course) {
    const loader = new TextureLoader();
    const names = [
      'fishhill-tarmac',
      'skye-heather',
      'skye-blackcuillin',
      'skye-redcuillin',
      'skye-fairypools',
      'skye-diamond',
      'skye-highland',
      'skye-harport',
      'skye-turf',
    ];
    const results = await Promise.allSettled(
      names.map((n) => loader.loadAsync('courses/' + n + '.webp')),
    );
    const maps = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const error = results.find((r) => r.status === 'rejected');
    if (error) {
      maps.forEach((t) => t.dispose());
      throw error.reason;
    }
    return new SkyeGlen(course, maps);
  }
  private constructor(
    private readonly course: Course,
    private readonly maps: Texture[],
  ) {
    for (const t of maps) {
      t.colorSpace = SRGBColorSpace;
      t.flipY = false;
    }
    const [road, heather, black, red, pool, sign, cattle] = maps as [
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
      Texture,
    ];
    road.wrapS = road.wrapT = RepeatWrapping;
    road.anisotropy = 4;
    this.materials.SkyeRoad.colorNode = mix(
      texture(road, positionWorld.xz.div(3)).rgb,
      color(0x757771),
      0.18,
    );
    this.materials.HarportRelief.map = maps[7]!;
    const turf = maps[8]!;
    turf.wrapS = turf.wrapT = RepeatWrapping;
    turf.anisotropy = 4;
    const nearGrass = texture(turf, positionWorld.xz.div(4.8)).rgb;
    const broadGrass = texture(turf, positionWorld.xz.div(37)).rgb;
    this.materials.SkyeMoor.colorNode = mix(nearGrass, broadGrass, 0.31);
    this.materials.SkyeHeather.map = heather;
    this.materials.BlackCuillin.map = black;
    this.materials.RedCuillin.map = red;
    this.materials.PassingPlaces.map = sign;
    // Refract only the lower pool and falls; the moss and rock lip stay fixed.
    const water = smoothstep(0.17, 0.51, uv().x)
      .mul(smoothstep(0.9, 0.57, uv().x))
      .mul(smoothstep(0.17, 0.63, uv().y));
    const drift = sin(uv().y.mul(46).sub(this.flow.mul(4)))
      .mul(0.006)
      .mul(water);
    const burn = texture(pool, uv().add(vec2(drift.mul(0.52), drift)));
    this.materials.FairyPools.colorNode = burn.rgb;
    this.materials.FairyPools.opacityNode = burn.a;
    this.materials.SeaLochs.colorNode = mix(
      color(0x738485),
      color(0xa9b3af),
      sin(positionWorld.z.mul(0.37).add(this.flow.mul(0.32)))
        .mul(0.1)
        .add(0.31),
    );
    const cowMap = texture(cattle, vec2(uv().x, uv().y.oneMinus()));
    this.cow.colorNode = cowMap.rgb;
    this.cow.opacityNode = cowMap.a;
    // Bend the neck around the shoulder, leaving the legs, tail and back planted.
    const neck = smoothstep(0.47, 0.24, uv().x);
    const angle = this.graze.mul(neck);
    const x = positionLocal.x.add(0.12),
      y = positionLocal.y.sub(0.12);
    this.cow.positionNode = vec3(
      x
        .mul(cos(angle))
        .sub(y.mul(sin(angle)))
        .sub(0.12),
      x
        .mul(sin(angle))
        .add(y.mul(cos(angle)))
        .add(0.12),
      positionLocal.z,
    );
    for (const [m, side, w] of [
      [3988, -4.2, 3.1],
      [4006, -9, 2.7],
      [4022, -12.5, 2.85],
    ]) {
      const p = course.place(m!, side!),
        from = course.place(m! - 14);
      const portrait = new Mesh(this.panel, this.cow);
      portrait.position.set(p.x, p.y + w! * 0.24, p.z);
      portrait.rotation.y = Math.atan2(from.x - p.x, from.z - p.z);
      portrait.scale.set(w!, w! * 0.5, 1);
      this.stock.add(portrait);
    }
    for (const [metres, side] of [
      [1844, -6],
      [3940, 4.5],
      [8835, 4],
      [8861, -4],
      [8875, -4.8],
      [12085, 5],
    ]) {
      const p = course.place(metres!, side!),
        animal = new Group();
      animal.position.set(p.x, p.y, p.z);
      animal.rotation.y = p.heading + 0.64;
      const ball = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        dark = false,
      ) => {
        const m = new Mesh(this.wool, dark ? this.hoof : this.sheep);
        m.position.set(x, y, z);
        m.scale.set(w, h, d);
        animal.add(m);
      };
      ball(0, 0.64, 0, 0.36, 0.38, 0.61);
      ball(0, 0.48, -0.58, 0.17, 0.23, 0.26, true);
      for (const x of [-0.2, 0.2])
        for (const z of [-0.32, 0.34]) ball(x, 0.29, z, 0.067, 0.3, 0.075, true);
      this.stock.add(animal);
    }
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    for (let i = 0; i < 45; i++) {
      const x = 28 + ((i * 107) % 327),
        y = 52 + 19 * Math.sin(i * 1.16),
        r = 16 + ((i * 19) % 31);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(207,212,210,.46)');
      g.addColorStop(1, 'rgba(207,212,210,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    this.mist = new CanvasTexture(canvas);
    this.mist.colorSpace = SRGBColorSpace;
    this.fogMaterial = new MeshBasicMaterial({
      map: this.mist,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      fog: false,
      opacity: 0.57,
    });
    for (let i = 0; i < 9; i++) {
      const p = course.place(8330 + i * 138, 35 * Math.cos(i));
      const sheet = new Mesh(this.panel, this.fogMaterial);
      sheet.position.set(p.x, p.y + 17 + (i % 3) * 10, p.z);
      sheet.scale.set(215, 42 + (i % 2) * 16, 1);
      sheet.rotation.y = p.heading;
      this.fog.add(sheet);
    }
    this.root.add(this.fog, this.stock);
  }
  update(metres: number, seconds: number) {
    this.graze.value = 0.07 + 0.12 * Math.sin(seconds * 0.84) + 0.026 * Math.cos(seconds * 2.6);
    this.flow.value = seconds;
    this.fog.position.z = 23 * Math.sin(seconds * 0.092);
    this.fog.position.x = 11 * Math.cos(seconds * 0.13);
    this.fogMaterial.opacity = 0.42 + 0.21 * Math.sin(seconds * 0.19);
    this.fog.visible = metres > 7850 && metres < 10030;
    this.state.grazingAngle = Math.abs(metres - 3980) < 150 ? this.graze.value : null;
    this.state.waterPhase = Math.abs(metres - 6320) < 160 ? this.flow.value : null;
    this.state.fogPosition = this.fog.visible ? this.fog.position.z : null;
  }
  frameView(metres: number, camera: Vector3, ahead: CoursePlace) {
    for (const [at, to, side, lift] of views) {
      const gap = Math.abs(metres - at);
      if (gap > 61) continue;
      const r = this.course.place(metres, 0, this.rider),
        p = this.course.place(to, side, this.target);
      const dx = p.x - r.x,
        dz = p.z - r.z,
        len = Math.max(1, Math.hypot(dx, dz)),
        w = Math.min(1, (61 - gap) / 27);
      camera.x += (r.x - (4.8 * dx) / len - camera.x) * w;
      camera.z += (r.z - (4.8 * dz) / len - camera.z) * w;
      camera.y += (r.y + 2.35 - camera.y) * w;
      ahead.x += (r.x + (14 * dx) / len - ahead.x) * w;
      ahead.z += (r.z + (14 * dz) / len - ahead.z) * w;
      ahead.y += (r.y + 1.55 + (18.8 * (p.y + lift - r.y - 2.35)) / (len + 4.8) - ahead.y) * w;
    }
  }
  report() {
    return this.state;
  }
  dispose() {
    this.root.clear();
    this.stock.clear();
    this.fog.clear();
    for (const asset of [
      this.panel,
      this.wool,
      this.sheep,
      this.hoof,
      this.cow,
      this.fogMaterial,
      this.mist,
      ...this.maps,
      ...Object.values(this.materials),
    ])
      asset.dispose();
  }
}
