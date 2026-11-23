// Passo Gardena, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the road from Selva
// climbing to the pass on a bright summer morning, closed to cars for the Sellaronda Bike Day. The
// meadow rises steeply on the right, grazed by cows, and falls away on the left behind a wooden
// fence, larches and spruces standing over the grass. The event's barriers line the road, with
// fans ringing cowbells behind them. Ahead the road winds up the green slope in hairpins to the
// saddle of the pass and its hotels, the sheer pale towers of the Sella rising on the right and
// the jagged spires of the Cir on the left.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags, road paint, meadow and Dolomite rock, heightfield and box builder of world-kit.ts.
import {
  type BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  barrierBannerTexture,
  type BannerPanel,
  BoxBuilder,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  dolomiteTexture,
  ease,
  FeatherFlags,
  Figures,
  type FeatherWord,
  hazedMaterial,
  heightfield,
  loopMetres,
  meadowTexture,
  paintedRows,
  Ribbons,
  type SceneStreet,
  seeded,
  slopeAt,
  speckle,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 30;
const KERB = 0.05;
const BARRIER = 4.2;
const CROWD_NEAR = 4.7;
const CROWD_FAR = 6.6;
/** The horizon this far ahead. */
const AHEAD = 230;
const HAZE = 0xc8dcec;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** Summer on the pass: cycling kit, fleeces, hiking shirts and the odd dirndl. */
const ALPINE: Wardrobe = {
  tops: ['#1d4f8f', '#ffffff', '#d8283a', '#2a8a4a', '#f2c230', '#ff8a1a', '#3ac8e8', '#6a3a8a'],
  bottoms: ['#2a2a30', '#5a4a3a', '#3a4a6a', '#6a5a48', '#1d1d22'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1d4f8f', ink: '#ffffff', text: 'SELLARONDA' },
  { fill: '#ffffff', ink: '#1d4f8f', text: 'BIKE DAY' },
  { fill: '#2a8a4a', ink: '#ffffff', text: 'PASSO GARDENA' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#d8283a', ink: '#ffffff', text: 'GRÖDNERJOCH' },
  { fill: '#1b1e24', ink: '#f2c230', text: '2121 M' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['SELLARONDA BIKE DAY · PASSO GARDENA', '#1d4f8f', '#ffffff', 300],
  ['WATTZUP · GRÖDNERJOCH 2121 M', '#2a8a4a', '#ffffff', 440],
];
const FEATHERS: readonly FeatherWord[] = [
  ['SELLARONDA', '#1d4f8f', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['BIKE DAY', '#2a8a4a', '#ffffff'],
  ['GARDENA', '#ffffff', '#1d4f8f'],
];
const FEATHER_EVERY = 26;
/** The names and cries painted on the climb by the fans. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['FORZA MAYA', '#ffffff'],
  ['HOPP JONAS', '#f2c230'],
  ['ANA!', '#ffffff'],
  ['ALLEZ SOPHIE', '#ff9ec9'],
  ['KENJI', '#3ac8e8'],
  ['VAI RAVI', '#d7ff3a'],
  ['DAI DAI', '#ffffff'],
  ['HOPP HOPP', '#f2c230'],
];
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['SELLARONDA', '#ffffff'],
  ['GARDENA', '#f2c230'],
  ['2121 M', '#ffffff'],
];
/** The kilometre signs to the pass, and where along the loop each stands. */
const SIGNS: readonly (readonly [number, number])[] = [
  [3, 60],
  [2, 220],
  [1, 380],
];

/** Hikers on the meadow path, in summer walking clothes. */
const HIKERS = 15;
const HIKING: Wardrobe = {
  tops: ['#d8283a', '#1d4f8f', '#f2c230', '#2a8a4a', '#ff8a1a', '#3ac8e8', '#6a3a8a'],
  bottoms: ['#3a3a40', '#5a4a3a', '#6a5a48', '#2a3a5a'],
  skins: SKINS,
};
/** The paragliders' canopies. */
const GLIDERS = ['#ff3a3a', '#f2c230', '#3ac8e8', '#ff8a1a', '#8a3ad8', '#2a8a4a', '#ffffff'];

/** How high the meadow on the right stands x metres out from the road's centre. */
function meadow(x: number): number {
  return x < 16 ? ((x - 4) / 12) * 2 : 2 + ((x - 16) / 44) * 12;
}

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  /** Raised this far above the road, for parts that stand up the slope. */
  readonly lift?: number;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

export class GardenaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private time = 0;
  private readonly gliders: Group[] = [];
  private hikers: Figures | null = null;
  private readonly flagMaterials = ['#1d4f8f', '#ffffff', '#2a8a4a', '#d8283a'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // Fans along the barriers, waving the Ladin and Tyrolean colours and ringing cowbells.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.75,
      wardrobe: ALPINE,
      flags: this.flagMaterials,
      flagShare: 0.24,
      seeds: [6711, 6717],
      skip: (_side, offset) => offset % 48 > 36,
      armsUp: 0.22,
    });
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addTrees();
    this.addCows();
    this.addHikers();
    this.addGliders();
    this.addSigns();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addPass();
  }

  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(metres);
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 12;
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB + (prop.lift ?? 0), -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    // Hikers file up the meadow's path in twos and threes, a step every second.
    const hikers = this.hikers;
    if (hikers) {
      for (let i = 0; i < HIKERS; i++) {
        const offset = Math.floor(i / 3) * 80 + 30 + (i % 3) * 2.2 + this.time * 1.1;
        const metres = along(offset, LOOP);
        const x = 15 + (Math.floor(i / 3) % 3) * 4 + (i % 3) * 0.6;
        const bob = Math.abs(Math.sin(this.time * 3.2 + i)) * 0.05;
        hikers.set(i, x, ground(metres) + meadow(x) - 0.1, -metres, 0, 1, bob);
      }
      hikers.commit();
    }
    // Paragliders drift in wide, slow circles over the meadows below the pass, banking as they turn.
    this.gliders.forEach((glider, i) => {
      const turn = this.time * (0.05 + (i % 3) * 0.015) + i * 2.1;
      const radius = 30 + (i % 4) * 14;
      const metres = 90 + (i % 4) * 45 + Math.sin(turn) * radius;
      glider.position.set(
        (i % 2 ? 40 : -50) + (i % 3) * 25 + Math.cos(turn) * radius,
        heightAt(Math.min(metres, AHEAD)) + 45 + (i % 4) * 22 + Math.sin(turn * 0.7) * 4,
        -metres,
      );
      glider.rotation.set(0, -turn, Math.sin(turn) * 0.25);
    });
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The road: dark asphalt with white edge lines and a dashed centre, the grass verges; on the
   * right the meadow climbing steeply; on the left the meadow falling away behind a wooden
   * fence; and the barriers.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({
      map: this.repeat(asphaltTexture(), 4, 4),
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, asphalt, [
      [r + 0.4, 0.006],
      [-r - 0.4, 0.006],
    ]);
    const paint = (from: number, to: number) =>
      this.ribbons.add(
        points,
        this.material({
          color: 0xf2f0e8,
          roughness: 0.6,
          polygonOffset: true,
          polygonOffsetFactor: -4,
        }),
        [
          [from, 0.012],
          [to, 0.012],
        ],
      );
    paint(r + 0.1, r - 0.05);
    paint(-r + 0.05, -r - 0.1);
    const meadow = this.material({ map: this.repeat(meadowTexture(), 6, 6), roughness: 1 });
    // The meadow on the right climbs steeply away from the road.
    this.ribbons.add(points, meadow, [
      [400, 150],
      [160, 52],
      [60, 14],
      [16, 2],
      [r + 0.4, KERB - 0.02],
    ]);
    // On the left it falls away into the valley.
    this.ribbons.add(points, meadow, [
      [-r - 0.4, KERB - 0.02],
      [-BARRIER - 3.2, KERB],
      [-14, -2.5],
      [-60, -18],
      [-400, -120],
    ]);
    // The wooden fence along the drop.
    const timber = this.material({ color: 0x6a4a30, roughness: 0.95 });
    for (const y of [0.55, 1.0]) {
      this.ribbons.add(points, timber, [
        [-BARRIER - 3, KERB + y],
        [-BARRIER - 3, KERB + y - 0.12],
      ]);
    }
    for (const side of [-1, 1]) {
      const texture = this.track(barrierBannerTexture(BARRIER_PANELS));
      texture.repeat.set(-1, -side / 24);
      const banner = this.material({ map: texture, alphaTest: 0.5, roughness: 0.5 });
      const x = side * BARRIER;
      this.ribbons.add(points, banner, [
        [x, KERB + 0.08],
        [x, KERB + 1.0],
      ]);
      const rail = this.material({ color: 0xe8e8e8, metalness: 0.5, roughness: 0.4 });
      this.ribbons.add(points, rail, [
        [x, KERB + 1.0],
        [x + 0.05, KERB + 1.08],
        [x - 0.05, KERB + 1.08],
        [x, KERB + 1.0],
      ]);
    }
  }

  /**
   * Larches and spruces on the meadows on both sides, standing up the slope on the right and
   * down it on the left, with the fence's posts along the drop.
   */
  private addTrees(): void {
    const random = seeded(6721);
    const larch = this.material({ color: 0x6a9a3a, roughness: 1, flatShading: true });
    const spruce = this.material({ color: 0x24482a, roughness: 1, flatShading: true });
    const bark = this.material({ color: 0x4a3424, roughness: 1 });
    const timber = this.material({ color: 0x6a4a30, roughness: 0.95 });
    const CHUNK = 60;
    // How high the meadow stands at x beside the road (the ribbons' profiles, as a curve).
    const slope = (x: number) =>
      x > 0
        ? x < 16
          ? 0
          : x < 60
            ? ((x - 16) / 44) * 12
            : 12 + ((x - 60) / 100) * 38
        : x > -14
          ? 0
          : x > -60
            ? ((x + 14) / 46) * 15.5 - 2.5
            : -18;
    for (let offset = 0; offset < LOOP; offset += CHUNK) {
      const crowns: [BufferGeometry[], BufferGeometry[]] = [[], []];
      const trunks: BufferGeometry[] = [];
      for (let n = 0; n < 16; n++) {
        const side = random() < 0.55 ? 1 : -1;
        const x = side * (12 + random() ** 1.3 * 70);
        const z = -random() * CHUNK;
        const tall = 9 + random() * 12;
        const y = slope(x) - (side < 0 ? 0 : 0.5);
        const kind = random() < 0.5 ? 0 : 1;
        const crown = new ConeGeometry(tall * (kind ? 0.2 : 0.17), tall * 0.85, 7, 1);
        crown.translate(x, y + tall * 0.55, z);
        crowns[kind]!.push(crown);
        const trunk = new CylinderGeometry(0.18, 0.25, tall * 0.3, 5);
        trunk.translate(x, y + tall * 0.15, z);
        trunks.push(trunk);
      }
      const posts: BufferGeometry[] = [];
      for (let z = 0; z > -CHUNK; z -= 3) {
        const post = new CylinderGeometry(0.07, 0.07, 1.2, 5);
        post.translate(-BARRIER - 3, 0.6, z);
        posts.push(post);
      }
      const holder = new Group();
      for (const [parts, material] of [
        [crowns[0], larch],
        [crowns[1], spruce],
        [trunks, bark],
        [posts, timber],
      ] as const) {
        const merged = mergeGeometries(parts)!;
        parts.forEach((p) => p.dispose());
        this.disposables.push(merged);
        holder.add(new Mesh(merged, material));
      }
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /** Cows grazing the meadow on the right, brown and white, bells at their necks. */
  private addCows(): void {
    const random = seeded(6731);
    const hides = [0x7a4a2a, 0x5a3a24, 0xe8e0d4, 0x9a6a3a].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const dark = this.material({ color: 0x2a2220, roughness: 0.9 });
    const brass = this.material({ color: 0xc8a040, metalness: 0.6, roughness: 0.4 });
    for (let k = 0; k < 16; k++) {
      const b = new BoxBuilder();
      const hide = hides[k % hides.length]!;
      b.box(hide, [0.75, 0.75, 1.7], [0, 0.95, 0]);
      b.box(hide, [0.4, 0.45, 0.55], [0, 1.05, -1.05], -0.5);
      b.box(dark, [0.36, 0.2, 0.2], [0, 0.85, -1.35]);
      b.box(brass, [0.16, 0.2, 0.12], [0, 0.6, -0.85]);
      for (const [lx, lz] of [
        [-0.25, -0.6],
        [0.25, -0.6],
        [-0.25, 0.6],
        [0.25, 0.6],
      ] as const)
        b.box(dark, [0.14, 0.6, 0.14], [lx, 0.3, lz]);
      const cow = b.build(this.disposables);
      cow.rotation.y = random() * Math.PI * 2;
      cow.scale.setScalar(1.8);
      const holder = new Group();
      holder.add(cow);
      this.group.add(holder);
      // The herd grazes in knots of four up the meadow, where it rises clear of the crowd's heads.
      const x = 22 + random() * 20;
      this.props.push({
        mesh: holder,
        offset: Math.floor(k / 4) * 120 + 190 + random() * 40,
        x,
        lift: meadow(x) - 0.2,
      });
    }
  }

  /** Hikers in twos and threes on the meadow path, packs on their backs. */
  private addHikers(): void {
    this.hikers = new Figures(this.group, this.disposables, HIKERS, HIKING, 6771);
  }

  /** Paragliders off the high meadows, their canopies bright against the sky. */
  private addGliders(): void {
    const canopy = new CylinderGeometry(6, 6, 2.6, 18, 1, true, Math.PI - 0.85, 1.7);
    canopy.rotateX(Math.PI / 2);
    canopy.translate(0, -6, 0);
    const pilot = new CylinderGeometry(0.3, 0.3, 1.1, 6);
    pilot.translate(0, -7.2, 0);
    const line = new CylinderGeometry(0.02, 0.02, 6.4, 3);
    this.disposables.push(canopy, pilot, line);
    const harness = this.material({ color: 0x2a2a30, roughness: 0.8 });
    const cord = this.material({ color: 0xe8e8e8, roughness: 0.8 });
    GLIDERS.forEach((hex) => {
      const glider = new Group();
      const cloth = this.material({ color: hex, roughness: 0.7, side: DoubleSide });
      glider.add(new Mesh(canopy, cloth), new Mesh(pilot, harness));
      for (const side of [-1, 1]) {
        const l = new Mesh(line, cord);
        l.position.set(side * 2.4, -3.6, 0);
        l.rotation.z = side * 0.62;
        glider.add(l);
      }
      glider.scale.setScalar(1.4);
      this.gliders.push(glider);
      this.group.add(glider);
    });
  }

  /** The brown kilometre signs counting down to the pass. */
  private addSigns(): void {
    const steel = this.material({ color: 0x8a8a8a, metalness: 0.5, roughness: 0.5 });
    for (const [km, offset] of SIGNS) {
      const b = new BoxBuilder();
      b.box(steel, [0.1, 2.4, 0.1], [0, 1.2, 0]);
      const holder = b.build(this.disposables);
      const plate = new PlaneGeometry(1.2, 0.75);
      plate.rotateY(-Math.PI / 2);
      plate.translate(-0.08, 2.2, 0);
      this.disposables.push(plate);
      holder.add(new Mesh(plate, this.material({ map: this.track(signTexture(km)) })));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: BARRIER + 1.2 });
    }
  }

  private addStreetBanners(roadHalf: number): void {
    const b = new BoxBuilder();
    const steel = this.material({ color: 0xe8e8e8, metalness: 0.4, roughness: 0.5 });
    for (const x of [-roadHalf - 0.7, roadHalf + 0.7]) b.box(steel, [0.2, 6.4, 0.2], [x, 3.2, 0]);
    const posts = b.build(this.disposables).children as Mesh[];
    const cloth = new PlaneGeometry(2 * roadHalf + 1.2, 2);
    this.disposables.push(cloth);
    for (const [text, fill, ink, offset] of STREET_BANNERS) {
      const banner = new Group();
      banner.add(...posts.map((m) => new Mesh(m.geometry, m.material)));
      const c = new Mesh(
        cloth,
        this.material({ map: this.track(clothBannerTexture(text, fill, ink)), side: DoubleSide }),
      );
      c.position.y = 5.6;
      banner.add(c);
      this.group.add(banner);
      this.props.push({ mesh: banner, offset, x: 0 });
    }
  }

  private addFeatherFlags(): void {
    const feathers = new FeatherFlags(this.disposables, this.track, FEATHERS);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 10; offset < LOOP; offset += FEATHER_EVERY) {
        const holder = new Group();
        holder.add(feathers.make(k++));
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? FEATHER_EVERY / 2 : 0),
          x: side * (BARRIER + 0.15),
        });
      }
    }
  }

  private addRoadPaint(): void {
    const rows = paintedRows(
      { loop: LOOP, every: 8, start: 12, kerb: KERB, names: ROAD_PAINT, slogans: ROAD_SLOGANS },
      this.disposables,
      this.track,
    );
    for (const row of rows) {
      this.group.add(row.mesh);
      this.props.push(row);
    }
  }

  /**
   * The view ahead: the green slope climbing to the saddle of the pass, the road winding up it in
   * hairpins, spruce groves on it and the pass's hotels on the saddle; the Sella's sheer towers
   * on the right and the Cir's jagged spires on the left, scree fanning from their feet; and the
   * valley falling away behind them on the left.
   */
  private addPass(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    // The slope to the saddle, its hairpins painted on: the saddle 260 m up, 900 m ahead, rising
    // on either hand to the feet of the towers and the spires.
    const slope = (x: number, z: number) => {
      const up = Math.min(1, Math.max(0, -z / 900)) ** 1.6 * 260;
      const sides = ease((Math.abs(x) - 250) / 500) * (x > 0 ? 420 : 300) * ease(-z / 600);
      const roll = 10 * Math.sin(x / 70 + z / 90) + 6 * Math.sin(z / 47 - x / 130);
      return up + sides + roll * ease(-z / 200);
    };
    const grass = new Color(0x7aa84a);
    const scree = new Color(0xb4aca0);
    const ground = heightfield(this.disposables, [0, -900], [2400, 1800, 160, 120], slope, (y) =>
      y > 420 ? scree : grass,
    );
    h.add(
      new Mesh(
        ground,
        hazedMaterial(this.disposables, haze, 0xffffff, 0.15, {
          map: this.track(passTexture()),
          vertexColors: true,
        }),
      ),
    );
    // Spruce groves dotted over the slope.
    const random = seeded(6741);
    const groves: BufferGeometry[] = [];
    for (let n = 0; n < 260; n++) {
      const cx = (random() - 0.5) * 1600;
      const cz = -40 - random() * 760;
      if (Math.abs(cx) < 200 && random() < 0.7) continue;
      const tall = 14 + random() * 10;
      const tree = new ConeGeometry(tall * 0.22, tall, 6, 1);
      tree.translate(cx, slope(cx, cz) - 4 + tall / 2, cz);
      groves.push(tree);
    }
    const forest = mergeGeometries(groves)!;
    groves.forEach((g) => g.dispose());
    this.disposables.push(forest);
    h.add(
      new Mesh(
        forest,
        hazedMaterial(this.disposables, haze, 0x2a4a2a, 0.25, { flatShading: true }),
      ),
    );
    // The pass's hotels on the saddle: white walls, dark timber storeys, steep roofs.
    const white = hazedMaterial(this.disposables, haze, 0xf2eee4, 0.2, {});
    const wood = hazedMaterial(this.disposables, haze, 0x5a3a24, 0.2, {});
    const roof = hazedMaterial(this.disposables, haze, 0x4a3a34, 0.2, {});
    const gable = new ConeGeometry(1, 1, 4);
    gable.rotateY(Math.PI / 4);
    this.disposables.push(gable);
    for (const [x, w, d, tall] of [
      [-120, 50, 30, 24],
      [-45, 38, 26, 18],
      [45, 60, 34, 27],
      [140, 34, 24, 15],
    ] as const) {
      const b = new BoxBuilder();
      b.box(white, [w, tall * 0.55, d], [0, (tall * 0.55) / 2, 0]);
      b.box(wood, [w * 1.02, tall * 0.45, d * 1.02], [0, tall * 0.55 + (tall * 0.45) / 2, 0]);
      const hotel = b.build(this.disposables);
      const top = new Mesh(gable, roof);
      top.scale.set(w * 0.78, w * 0.32, d * 0.78);
      top.position.y = tall + w * 0.16;
      hotel.add(top);
      hotel.position.set(x, slope(x, -900) - 4, -900);
      h.add(hotel);
    }
    // The Sella's towers on the right, the Cir's spires on the left: pale Dolomite rock, banded
    // and sheer, craggy where the rock has broken away, scree fanning from their feet.
    const rock = this.track(dolomiteTexture());
    rock.wrapS = RepeatWrapping;
    rock.wrapT = RepeatWrapping;
    const dolomite = hazedMaterial(this.disposables, haze, 0xfff4e4, 0.22, {
      map: rock,
      flatShading: true,
    });
    const crag = seeded(6751);
    // A tower of Dolomite: fluted by buttresses and gullies running up its walls, stepped back at
    // a ledge band partway up, its crown broken into ragged teeth.
    const tower = (x: number, z: number, wide: number, tall: number, sides: number) => {
      const flutes = sides;
      const phase = crag() * 6.3;
      const ledge = 0.38 + crag() * 0.12;
      const geometry = new CylinderGeometry(1, 1, tall, 22, 14);
      const position = geometry.getAttribute('position');
      const teeth = Array.from({ length: 23 }, () => crag());
      for (let i = 0; i < position.count; i++) {
        const px = position.getX(i);
        const pz = position.getZ(i);
        const t = position.getY(i) / tall + 0.5;
        const angle = Math.atan2(pz, px);
        const flute =
          1 + 0.16 * Math.sin(flutes * angle + phase) + 0.07 * Math.sin(flutes * 2.3 * angle);
        // Sheer below the ledge, set back above it, narrowing into the crown.
        const step = t < ledge ? 1 : 0.8 - (t - ledge) * 0.25;
        const k = wide * flute * step * (1 + (crag() - 0.5) * 0.08);
        position.setX(i, px * k);
        position.setZ(i, pz * k);
        if (t > 0.99) {
          const tooth = teeth[Math.round(((angle + Math.PI) / (2 * Math.PI)) * 22)]!;
          position.setY(i, position.getY(i) - tooth * tall * 0.12);
        }
      }
      geometry.computeVertexNormals();
      geometry.translate(x, slope(x, z) - 10 + tall / 2, z);
      return geometry;
    };
    const rocks: BufferGeometry[] = [
      // The Sella towers: four great blocks, the first the tallest.
      tower(360, -1450, 170, 430, 7),
      tower(560, -1530, 190, 380, 7),
      tower(750, -1580, 160, 410, 6),
      tower(950, -1620, 210, 330, 7),
      // The Cir: a comb of thin spires.
      ...[
        [-300, -1300, 44, 230],
        [-370, -1330, 58, 290],
        [-440, -1310, 40, 210],
        [-510, -1360, 66, 320],
        [-590, -1340, 42, 250],
        [-670, -1380, 60, 280],
        [-760, -1350, 48, 210],
      ].map(([x, z, w, t]) => tower(x!, z!, w!, t!, 5)),
    ];
    // The Sella's plateau behind the towers: a great table of rock, walled in layered tiers.
    const sella = heightfield(
      this.disposables,
      [760, -1950],
      [1300, 700, 90, 50],
      (x, z) => {
        const wall = ease((x - 230) / 90) * ease((-z - 1650) / 70) * ease((1380 - x) / 120);
        const tiers = 330 + 40 * Math.round(Math.sin(x / 160 + z / 230) * 2);
        return wall * (tiers + 30 * Math.sin(x / 37) * Math.sin(z / 29));
      },
      (y) => (y > 340 ? new Color(0xeae4d6) : y > 200 ? new Color(0xd8cebc) : new Color(0xc4b8a4)),
    );
    h.add(
      new Mesh(
        sella,
        hazedMaterial(this.disposables, haze, 0xffffff, 0.3, {
          vertexColors: true,
          flatShading: true,
        }),
      ),
    );
    const towers = mergeGeometries(rocks.map((r) => (r.index ? r.toNonIndexed() : r)))!;
    rocks.forEach((r) => r.dispose());
    this.disposables.push(towers);
    h.add(new Mesh(towers, dolomite));
    // The scree fans below them.
    const fan = new ConeGeometry(1, 1, 10, 1, true);
    this.disposables.push(fan);
    const screeMaterial = hazedMaterial(this.disposables, haze, 0xc0b8aa, 0.22, {});
    for (const [x, z, w, t] of [
      [460, -1490, 260, 100],
      [850, -1600, 280, 90],
      [-440, -1330, 220, 70],
      [-660, -1360, 210, 60],
    ] as const) {
      const cone = new Mesh(fan, screeMaterial);
      cone.scale.set(w, t, w * 0.7);
      cone.position.set(x, slope(x, z) - 10 + t / 2, z + 80);
      h.add(cone);
    }
    // The far peaks behind the pass, blue in the distance, snow in their gullies.
    const far = heightfield(
      this.disposables,
      [0, -3200],
      [6000, 1600, 120, 40],
      (x, z) => {
        const ridge = 900 + 280 * Math.sin(x / 380) + 160 * Math.sin(x / 130 + 1);
        return ridge * ease((-z - 2500) / 500) + 40 * Math.sin(x / 41 + z / 57);
      },
      (y) => (y > 1050 ? new Color(0xf4f6fa) : new Color(0x8a96a8)),
    );
    h.add(
      new Mesh(far, hazedMaterial(this.disposables, haze, 0xffffff, 0.45, { vertexColors: true })),
    );
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial({ roughness: 0.9, ...options });
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number): CanvasTexture {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** Four metres of the pass road: dark mountain asphalt, patched. */
function asphaltTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4e4e52', 6761);
    const random = seeded(6763);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = `rgba(30,30,34,${0.25 + random() * 0.2})`;
      g.fillRect(random() * 100, random() * 100, 20 + random() * 30, 14 + random() * 24);
    }
  });
}

/**
 * The slope to the pass, seen from below: meadow green with darker patches, and the road's
 * hairpins winding up it, grey with white edges, to the saddle at the far edge.
 */
function passTexture(): CanvasTexture {
  return canvasTexture(1024, 768, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 1024, 768);
    const random = seeded(6767);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '90,120,60' : '200,220,150'},${0.12 + random() * 0.18})`;
      g.beginPath();
      g.ellipse(random() * 1024, random() * 768, 10 + random() * 40, 6 + random() * 24, 0, 0, 7);
      g.fill();
    }
    // The hairpins: the plane is 2400 m by 1800 m, its far edge at the top; the road climbs from
    // the near edge (bottom) to the saddle 900 m in (the middle).
    const px = (x: number) => ((x + 1200) / 2400) * 1024;
    const pz = (z: number) => ((z + 1800) / 1800) * 768;
    const bends: [number, number][] = [[0, 0]];
    for (let k = 1; k <= 8; k++) bends.push([(k % 2 ? 1 : -1) * (130 - k * 6), -k * 100]);
    bends.push([0, -880]);
    for (const [width, colour] of [
      [9, '#f2f0e8'],
      [6, '#55555a'],
    ] as const) {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.lineJoin = 'round';
      g.beginPath();
      bends.forEach(([x, z], i) => (i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))));
      g.stroke();
    }
  });
}

/** A kilometre sign: white on brown, the distance to the pass and its height. */
function signTexture(km: number): CanvasTexture {
  return canvasTexture(180, 110, (g) => {
    g.fillStyle = '#6b3a1e';
    g.fillRect(0, 0, 180, 110);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(5, 5, 170, 100);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = 'bold 18px sans-serif';
    g.fillText('PASSO GARDENA', 90, 32);
    g.font = 'bold 36px sans-serif';
    g.fillText(`${km} km`, 90, 72);
    g.font = '13px sans-serif';
    g.fillText('2121 m', 90, 96);
  });
}
