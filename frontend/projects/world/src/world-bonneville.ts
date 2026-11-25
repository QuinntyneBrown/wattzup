import { packedSaltTexture } from './bonneville-packed-salt';
// Bonneville Salt Flats, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// speedway course across the endless white salt of Utah under a blazing summer sky, closed for a
// team time trial during Speed Week. The course is the salt itself, marked by its black line down
// the middle, with race barriers and their banners either side and fans in sun hats behind them.
// On the left are the pits: motorhomes, trucks and trailers, pop-up canopies and the streamliners
// on their trailers, with crews among them and flags on poles. On the right the timing posts and
// mile boards stand out on the open salt. A timing gantry spans the course, and ahead, across the
// flat white, the Silver Island Mountains float on the shimmering band of a mirage.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the course, with the shared crowd, figures, barriers,
// banners, canopies, feather flags, road paint and box builder of world-kit.ts.
import {
  BoxGeometry,
  type CanvasTexture,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import {
  barrierBannerTexture,
  type BannerPanel,
  BoxBuilder,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  Figures,
  hazedMaterial,
  loopMetres,
  paintedRows,
  PopupTents,
  Ribbons,
  saltCrustTexture,
  type SceneStreet,
  seeded,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The course repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 500;
const BEHIND = 30;
/** The salt is flat: the barriers, fans and pits stand on it, a hair above the course. */
const KERB = 0.02;
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.2;
/** The timing gantry over the course, in the opening view. */
const GANTRY = 150;
/** A streamliner makes its speed run along its own course this far out on the right. */
const RUN_X = 30;
/** How fast it runs, in metres a second, and how far along its course it starts and ends. */
const RUN_SPEED = 70;
const RUN_FROM = 40;
const RUN_LENGTH = 520;
/** The mountains float on the mirage this far ahead. */
const AHEAD = 300;
const HAZE = 0xdfe8f2;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** Fans out on the salt in the sun: bright shirts, white and khaki, sun hats. */
const FANS: Wardrobe = {
  tops: [
    '#ffffff',
    '#d8283a',
    '#1d3c8f',
    '#f2c230',
    '#2a8a4a',
    '#f08a2a',
    '#5aa0d0',
    '#c9b48a',
    '#111111',
    '#e86a9a',
  ],
  bottoms: ['#2a3140', '#c9b48a', '#3b4a5c', '#e8e2d4', '#20242b', '#5a6a7a'],
  skins: SKINS,
};
/** The pit crews in their team shirts and overalls. */
const CREWS: Wardrobe = {
  tops: ['#d8283a', '#1d3c8f', '#f2c230', '#ffffff', '#111111', '#f08a2a'],
  bottoms: ['#20242b', '#2a3140', '#d8283a', '#1d3c8f'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1d3c8f', ink: '#ffffff', text: 'BONNEVILLE' },
  { fill: '#ffffff', ink: '#d8283a', text: 'SALT FLATS' },
  { fill: '#d8283a', ink: '#ffffff', text: 'TEAM TIME TRIAL' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#f2c230', ink: '#1b1e24', text: 'SPEED WEEK' },
  { fill: '#111111', ink: '#ffffff', text: 'UTAH' },
];
const FEATHERS: readonly FeatherWord[] = [
  ['BONNEVILLE', '#1d3c8f', '#ffffff'],
  ['TTT', '#d8283a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['SPEED WEEK', '#f2c230', '#1b1e24'],
];
const FEATHER_EVERY = 20;
/** The names and cries the teams paint on the salt, in dark paint that reads on the white. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['GO MAYA', '#d8283a'],
  ['TTT', '#1d3c8f'],
  ['HOLD THE WHEEL', '#1b1e24'],
  ['ALLEZ JONAS', '#d8283a'],
  ['PULL!', '#1d3c8f'],
  ['KENJI', '#1b1e24'],
  ['SALT', '#d8283a'],
  ['FORZA ANA', '#1d3c8f'],
  ['NO GAPS', '#1b1e24'],
  ['GO SOPHIE', '#d8283a'],
  ['RAVI!', '#1d3c8f'],
  ['200 MPH', '#1b1e24'],
];
/** Cries painted big right across the course. */
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['BONNEVILLE', '#1d3c8f'],
  ['TEAM TIME TRIAL', '#d8283a'],
  ['WATTZUP', '#1b1e24'],
  ['SPEED WEEK', '#1d3c8f'],
];
/** A row of paint every few metres: two names either side of the line, every third a slogan. */
const ROAD_PAINT_EVERY = 7;
/** The pits' canopies: the team or sponsor on the valance, its fill and ink. */
const CANOPIES: readonly (readonly [string, string, string])[] = [
  ['SALT TEAM', '#d8283a', '#ffffff'],
  ['SPEED WEEK', '#f2c230', '#1b1e24'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['BONNEVILLE', '#1d3c8f', '#ffffff'],
  ['TIMING', '#111111', '#f2c230'],
  ['PIT 12', '#2a8a4a', '#ffffff'],
];
/** The race teams' haulers: the name down the trailer's side, its colour and its ink. */
const HAULERS: readonly (readonly [string, string, string])[] = [
  ['SALT DEMONS RACING', '#d8283a', '#ffffff'],
  ['200 MPH CLUB', '#1d3c8f', '#f2c230'],
  ['WATTZUP SPEED', '#1b1e24', '#d7ff3a'],
  ['LAND SPEED RACING', '#f2c230', '#1b1e24'],
  ['BONNEVILLE BOYS', '#2a8a4a', '#ffffff'],
];
/** The timing tower stands on the right, in the opening view. */
const TOWER = 185;
/** The streamliners' liveries. */
const LIVERIES = [0xd8283a, 0x1d3c8f, 0xf2c230, 0xf4f4f0, 0x2a8a4a, 0xf08a2a];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
}

export class BonnevilleStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly crews: Figures;
  private readonly crewSpots: { offset: number; x: number; turn: number }[] = [];
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private time = 0;
  /** The streamliner on its run, its rooster tail of salt behind it. */
  private readonly runner = new Group();
  private readonly spray: { mesh: Mesh; k: number }[] = [];
  private readonly flagMaterials = ['#b22234', '#ffffff', '#3c3b6e', '#1d3c8f'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // Fans in clumps along the barriers, with open salt between.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.75,
      wardrobe: FANS,
      flags: this.flagMaterials,
      flagShare: 0.2,
      seeds: [4011, 4017],
      skip: (_side, offset) => offset % 45 > 30,
    });
    this.crews = new Figures(this.group, disposables, 30, CREWS, 4021);
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    this.addSalt(roadHalf, points);
    this.crowd.build();
    this.addPits();
    this.addTiming();
    this.addTimingTower();
    this.addSpeedRun(points);
    this.addGantry(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addMountains();
  }

  /** The course's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
    // The spray boils as the car tears through the salt.
    for (const puff of this.spray) {
      const boil = 1 + 0.12 * Math.sin(seconds * 9 + puff.k * 1.9);
      puff.mesh.scale.setScalar((1.2 + puff.k * 0.55) * boil);
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(Math.max(metres, 0));
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 10;
      prop.mesh.position.set(prop.x, ground(metres) + KERB, -metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    // The crews about their cars, shifting their weight as they wait.
    this.crewSpots.forEach((spot, i) => {
      const metres = along(spot.offset, LOOP);
      const hidden = metres > AHEAD - 10 ? -50 : 0;
      const sway = Math.sin(this.time * 0.9 + i * 1.7) * 0.15;
      this.crews.set(i, spot.x, ground(metres) + KERB + hidden, -metres, spot.turn + sway, 1);
    });
    this.crews.commit();
    // The streamliner tears down its course toward the rider, round again when it passes.
    const run = RUN_FROM + RUN_LENGTH - ((this.time * RUN_SPEED + 480) % RUN_LENGTH);
    this.runner.visible = run < AHEAD - 10;
    this.runner.position.set(RUN_X, ground(run) + KERB, -run);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The course: the salt itself, packed smooth and scored with tyre tracks, its black line down
   * the middle; either side the white crust of the flats out to the horizon, cracked into
   * polygons; and the race barriers with their banners.
   */
  private addSalt(roadHalf: number, points: number): void {
    const r = roadHalf;
    const course = this.material({
      map: this.repeat(packedSaltTexture(), 2 * r + 1, 12),
      polygonOffset: true,
      polygonOffsetFactor: -2,
      roughness: 0.85,
    });
    this.ribbons.add(points, course, [
      [r + 0.5, 0.004],
      [-r - 0.5, 0.004],
    ]);
    const line = this.material({
      color: 0x18181a,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      roughness: 0.6,
    });
    this.ribbons.add(points, line, [
      [0.15, 0.008],
      [-0.15, 0.008],
    ]);
    const crust = this.material({ map: this.repeat(saltCrustTexture(), 9, 9), roughness: 0.9 });
    for (const side of [1, -1]) {
      const list: [number, number][] = [
        [side * 2400, 0],
        [side * 160, 0],
        [side * 40, 0],
        [side * (r + 0.5), KERB],
      ];
      this.ribbons.add(points, crust, side > 0 ? list : list.reverse());
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
      const rail = this.material({ color: 0xd9dde2, metalness: 0.6, roughness: 0.35 });
      this.ribbons.add(points, rail, [
        [x, KERB + 1.0],
        [x + 0.04, KERB + 1.06],
        [x - 0.04, KERB + 1.06],
        [x, KERB + 1.0],
      ]);
    }
  }

  /**
   * The pits on the left, out on the salt: motorhomes, box trucks and enclosed trailers, pop-up
   * canopies with the teams' names, the streamliners on their open trailers, flags on tall poles,
   * and the crews among them.
   */
  private addPits(): void {
    const random = seeded(4101);
    const tents = new PopupTents(this.disposables, this.track);
    const make = {
      motorhome: (k: number) => this.motorhome(k),
      truck: (k: number) => this.truck(k),
      hauler: (k: number) => this.hauler(k),
      streamliner: (k: number) => this.streamliner(k),
    };
    const kinds = [
      'hauler',
      'motorhome',
      'streamliner',
      'hauler',
      'truck',
      'motorhome',
      'streamliner',
    ] as const;
    const built = kinds.map((kind, k) => make[kind](k));
    const pole = new CylinderGeometry(0.04, 0.05, 7, 6);
    pole.translate(0, 3.5, 0);
    const cloth = new PlaneGeometry(1.8, 1.1);
    cloth.translate(0.92, 6.3, 0);
    this.disposables.push(pole, cloth);
    const steel = this.material({ color: 0xc8ccd0, metalness: 0.5, roughness: 0.4 });
    const stars = this.material({ map: this.track(starsAndStripes()), side: DoubleSide });
    let k = 0;
    for (let offset = 8; offset < LOOP; offset += 16 + random() * 8) {
      const x = -(17 + random() * 14);
      const holder = new Group();
      const vehicle = built[k % built.length]!.clone();
      vehicle.rotation.y = (random() - 0.5) * 0.5;
      holder.add(vehicle);
      // A canopy beside it, towards the course, with the team under it.
      if (k % 2 === 0) {
        const [text, fill, ink] = CANOPIES[(k >> 1) % CANOPIES.length]!;
        const tent = tents.make(text, fill, ink);
        tent.position.set(6, 0, 1 + random() * 2);
        tent.rotation.y = Math.PI / 2;
        holder.add(tent);
      }
      if (k % 3 === 1) {
        const p = new Mesh(pole, steel);
        const f = new Mesh(cloth, stars);
        p.position.set(4, 0, -3);
        f.position.set(4, 0, -3);
        f.rotation.y = 0.5;
        holder.add(p, f);
      }
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
      for (let c = 0; c < 2 && this.crewSpots.length < 30; c++) {
        this.crewSpots.push({
          offset: offset + (random() - 0.5) * 5,
          x: x + 4 + random() * 4,
          turn: random() * Math.PI * 2,
        });
      }
      k++;
    }
  }

  /** A motorhome: a white coachbuilt body over its cab, a coloured stripe and its windows. */
  private motorhome(k: number): Group {
    const b = new BoxBuilder();
    const white = this.material({ color: 0xf2f1ec, roughness: 0.55 });
    const stripe = this.material({ color: LIVERIES[k % LIVERIES.length]!, roughness: 0.6 });
    const glass = this.material({ color: 0x24303a, roughness: 0.2, metalness: 0.3 });
    const tyre = this.material({ color: 0x1c1c1c, roughness: 0.95 });
    b.box(white, [2.5, 3, 8], [0, 1.9, -0.6]);
    b.box(white, [2.4, 1.8, 1.6], [0, 1.4, 4.2]);
    b.box(glass, [2.45, 0.8, 0.1], [0, 1.9, 5]);
    b.box(stripe, [2.52, 0.3, 8], [0, 1.3, -0.6]);
    b.box(stripe, [2.52, 0.12, 8], [0, 2.9, -0.6]);
    for (const z of [-3.6, -1.4, 0.8]) b.box(glass, [2.56, 0.7, 1.2], [0, 2.4, z]);
    for (const [x, z] of [
      [-1.15, 3.6],
      [1.15, 3.6],
      [-1.15, -3],
      [1.15, -3],
    ] as const) {
      b.box(tyre, [0.3, 0.8, 0.8], [x, 0.4, z]);
    }
    return b.build(this.disposables);
  }

  /** A box truck and its enclosed trailer, the team's colours down the side. */
  private truck(k: number): Group {
    const b = new BoxBuilder();
    const cab = this.material({ color: LIVERIES[(k + 2) % LIVERIES.length]!, roughness: 0.5 });
    const white = this.material({ color: 0xf4f4f0, roughness: 0.55 });
    const glass = this.material({ color: 0x24303a, roughness: 0.2, metalness: 0.3 });
    const tyre = this.material({ color: 0x1c1c1c, roughness: 0.95 });
    b.box(cab, [2.4, 2.6, 2.2], [0, 1.6, 5.6]);
    b.box(glass, [2.45, 0.9, 0.1], [0, 2.2, 6.72]);
    b.box(white, [2.5, 3.4, 9], [0, 2.1, -0.4]);
    b.box(cab, [2.54, 0.6, 9], [0, 1.0, -0.4]);
    for (const z of [5, 1.5, -3, -4.2]) {
      for (const x of [-1.15, 1.15]) b.box(tyre, [0.32, 0.9, 0.9], [x, 0.45, z]);
    }
    return b.build(this.disposables);
  }

  /**
   * A race team's hauler: an articulated cab and a 16 m box trailer 4 m high, the team's livery
   * and name painted down both its sides, with its wheels and the cab's glass.
   */
  private hauler(k: number): Group {
    const [name, fill, ink] = HAULERS[k % HAULERS.length]!;
    const b = new BoxBuilder();
    const cab = this.material({ color: fill, metalness: 0.3, roughness: 0.4 });
    const chrome = this.material({ color: 0xd8dce0, metalness: 0.8, roughness: 0.25 });
    const glass = this.material({ color: 0x24303a, roughness: 0.2, metalness: 0.3 });
    const tyre = this.material({ color: 0x1c1c1c, roughness: 0.95 });
    b.box(cab, [2.5, 3.1, 3], [0, 2.05, 9.6]);
    b.box(cab, [2.5, 1.2, 2], [0, 1.1, 11.6]);
    b.box(glass, [2.4, 1.0, 0.1], [0, 2.7, 11.12]);
    b.box(chrome, [2.3, 0.9, 0.12], [0, 1.2, 12.62]);
    for (const x of [-1.35, 1.35]) b.box(chrome, [0.18, 3.2, 0.18], [x, 2.6, 8.2]);
    for (const z of [11, 8.6, 7.4, -4.6, -5.8, -7]) {
      for (const x of [-1.1, 1.1]) b.box(tyre, [0.35, 1, 1], [x, 0.5, z]);
    }
    const g = b.build(this.disposables);
    const white = this.material({ color: 0xf4f4f0, roughness: 0.55 });
    const side = this.material({ map: this.track(haulerTexture(name, fill, ink)), roughness: 0.5 });
    const trailer = new Mesh(new BoxGeometry(2.6, 4, 16), [side, side, white, white, white, white]);
    this.disposables.push(trailer.geometry);
    trailer.position.set(0, 2.6, 0);
    trailer.castShadow = true;
    g.add(trailer);
    return g;
  }

  /**
   * A streamliner on its open trailer: a long slender body tapering to a point, its canopy
   * bubble, a tail fin, in its livery with a white race number roundel.
   */
  private streamliner(k: number, onTrailer = true): Group {
    const g = new Group();
    const b = new BoxBuilder();
    const deck = this.material({ color: 0x5a5e64, metalness: 0.4, roughness: 0.5 });
    const tyre = this.material({ color: 0x1c1c1c, roughness: 0.95 });
    // Off its trailer the car sits low on its own small wheels.
    const lift = onTrailer ? 0 : -0.85;
    if (onTrailer) {
      b.box(deck, [2.3, 0.2, 8.4], [0, 0.75, 0]);
      b.box(deck, [0.15, 0.15, 2], [0, 0.6, 5.2]);
      for (const z of [-1.4, -0.4]) {
        for (const x of [-1.1, 1.1]) b.box(tyre, [0.3, 0.7, 0.7], [x, 0.35, z]);
      }
    } else {
      for (const z of [-2.6, 2.6]) b.box(tyre, [1.2, 0.36, 0.36], [0, 0.18, z]);
    }
    const livery = this.material({
      color: LIVERIES[k % LIVERIES.length]!,
      metalness: 0.3,
      roughness: 0.35,
    });
    const glass = this.material({ color: 0x1a2028, roughness: 0.1, metalness: 0.5 });
    const roundel = this.material({ color: 0xffffff, roughness: 0.5 });
    b.box(livery, [0.08, 1.2, 1.1], [0, 1.95 + lift, -3.2]);
    b.box(roundel, [1.42, 0.5, 0.6], [0, 1.45 + lift, 0.6]);
    g.add(b.build(this.disposables));
    const body = new CapsuleGeometry(0.7, 6.4, 6, 14);
    body.rotateX(Math.PI / 2);
    body.scale(1, 0.75, 1);
    const bubble = new CapsuleGeometry(0.35, 0.6, 4, 10);
    bubble.rotateX(Math.PI / 2);
    this.disposables.push(body, bubble);
    const hull = new Mesh(body, livery);
    hull.position.set(0, 1.4 + lift, 0);
    hull.castShadow = true;
    const canopy = new Mesh(bubble, glass);
    canopy.position.set(0, 1.85 + lift, -1.4);
    g.add(hull, canopy);
    return g;
  }

  /**
   * Speed Week's run on the right: a streamliner tearing down its own course toward the rider, marked by a
   * black line on the salt, a rooster tail of salt spray boiling up and spreading behind it.
   */
  private addSpeedRun(points: number): void {
    const line = this.material({ color: 0x18181a, roughness: 0.6 });
    this.ribbons.add(points, line, [
      [RUN_X + 0.15, 0.004],
      [RUN_X - 0.15, 0.004],
    ]);
    const car = this.streamliner(0, false);
    this.runner.add(car);
    // Nose toward the rider, its spray streaming away behind it.
    this.runner.rotation.y = Math.PI;
    const puff = new SphereGeometry(1, 10, 8);
    this.disposables.push(puff);
    for (let k = 0; k < 22; k++) {
      const material = this.material({
        color: 0xffffff,
        emissive: new Color(0xf4f2ee),
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.92 * (1 - k / 24),
        depthWrite: false,
        roughness: 1,
      });
      const mesh = new Mesh(puff, material);
      mesh.position.set((k % 2 ? 0.3 : -0.3) * k * 0.3, 0.8 + k * 0.6, 4 + k * 3.6);
      this.runner.add(mesh);
      this.spray.push({ mesh, k });
    }
    this.group.add(this.runner);
    this.setTime(this.time);
  }

  /**
   * The timing tower on the right: a three-level scaffold with stairs zigzagging up it, the
   * glazed booth on top under its roof, the TIMING banner round its rail and a flag over it.
   */
  private addTimingTower(): void {
    const b = new BoxBuilder();
    const steel = this.material({ color: 0xc0c4c8, metalness: 0.6, roughness: 0.35 });
    const deck = this.material({ color: 0x6a6e74, metalness: 0.4, roughness: 0.6 });
    const booth = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const glass = this.material({ color: 0x2a3a48, roughness: 0.15, metalness: 0.4 });
    const roof = this.material({ color: 0xd8283a, roughness: 0.6 });
    for (const x of [-2, 2]) for (const z of [-2, 2]) b.box(steel, [0.16, 9, 0.16], [x, 4.5, z]);
    for (const y of [3, 6, 9]) {
      b.box(deck, [4.4, 0.18, 4.4], [0, y, 0]);
      for (const z of [-2, 2]) b.box(steel, [4.2, 0.06, 0.06], [0, y - 1.5, z]);
    }
    // The stairs, a flight to each level, alternating sides.
    for (let level = 0; level < 3; level++) {
      const z = level % 2 ? -2.6 : 2.6;
      b.box(steel, [4.4, 0.1, 0.9], [0, level * 3 + 1.5, z], level % 2 ? -0.6 : 0.6);
    }
    b.box(booth, [4.2, 1.1, 4.2], [0, 9.65, 0]);
    b.box(glass, [4.3, 1.2, 4.3], [0, 10.8, 0]);
    b.box(booth, [4.2, 0.3, 4.2], [0, 11.55, 0]);
    b.box(roof, [5, 0.25, 5], [0, 11.8, 0]);
    b.box(steel, [0.06, 4, 0.06], [0, 13.9, 0]);
    const tower = b.build(this.disposables);
    const banner = new PlaneGeometry(4.2, 1.1);
    const cloth = new PlaneGeometry(2.2, 1.3);
    cloth.translate(1.12, 15, 0);
    this.disposables.push(banner, cloth);
    const timing = this.material({
      map: this.track(clothBannerTexture('SCTA TIMING', '#1b1e24', '#f2c230')),
      side: DoubleSide,
    });
    for (const [x, ry] of [
      [-2.12, -Math.PI / 2],
      [0, 0],
    ] as const) {
      const face = new Mesh(banner, timing);
      face.position.set(x, 9.65, x ? 0 : 2.12);
      face.rotation.y = ry;
      tower.add(face);
    }
    const flag = new Mesh(
      cloth,
      this.material({ map: this.track(starsAndStripes()), side: DoubleSide }),
    );
    flag.rotation.y = 0.6;
    tower.add(flag);
    const holder = new Group();
    holder.add(tower);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: TOWER, x: 15 });
  }

  /**
   * The timing on the right, out on the open salt: every 125 m a mile board on its posts and a
   * pair of timing lights, orange and black.
   */
  private addTiming(): void {
    const b = new BoxBuilder();
    const black = this.material({ color: 0x1b1e24, roughness: 0.6 });
    const orange = this.material({ color: 0xf08a2a, roughness: 0.5 });
    for (const z of [-1.2, 1.2]) b.box(black, [0.12, 4.2, 0.12], [0, 2.1, z]);
    b.box(orange, [0.3, 0.5, 0.5], [0, 3.3, -3.4]);
    b.box(black, [0.1, 3.0, 0.1], [0, 1.5, -3.4]);
    const posts = b.build(this.disposables);
    const board = new PlaneGeometry(3, 1.6);
    board.translate(0, 3.4, 0);
    this.disposables.push(board);
    for (let k = 0; k < LOOP / 125; k++) {
      const holder = new Group();
      holder.add(posts.clone());
      const face = new Mesh(
        board,
        this.material({ map: this.track(mileTexture(k + 1)), side: DoubleSide }),
      );
      face.rotation.y = -Math.PI / 2 + 0.35;
      face.position.x = 0.1;
      holder.add(face);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 40 + k * 125, x: 11 });
    }
  }

  /**
   * The timing gantry over the course: two black truss towers, the beam across with the event's
   * banner, and the clock above it.
   */
  private addGantry(roadHalf: number): void {
    const b = new BoxBuilder();
    const truss = this.material({ color: 0x1b1e24, metalness: 0.5, roughness: 0.45 });
    const span = 2 * roadHalf + 3;
    for (const x of [-span / 2, span / 2]) {
      b.box(truss, [0.6, 7, 0.6], [x, 3.5, 0]);
      for (let y = 0.6; y < 7; y += 0.9) b.box(truss, [0.7, 0.06, 0.7], [x, y, 0]);
    }
    b.box(truss, [span + 0.6, 0.5, 0.6], [0, 7.1, 0]);
    const gantry = b.build(this.disposables);
    const cloth = new PlaneGeometry(span - 0.6, 1.5);
    const clock = new PlaneGeometry(3.6, 1.2);
    this.disposables.push(cloth, clock);
    const banner = new Mesh(
      cloth,
      this.material({
        map: this.track(clothBannerTexture('BONNEVILLE · TEAM TIME TRIAL', '#1d3c8f', '#ffffff')),
        side: DoubleSide,
        roughness: 0.7,
      }),
    );
    banner.position.set(0, 6.05, 0.32);
    const face = new Mesh(
      clock,
      this.material({
        map: this.track(clockTexture()),
        emissive: new Color(0xffffff),
        emissiveMap: this.track(clockTexture()),
        emissiveIntensity: 0.8,
      }),
    );
    face.position.set(0, 8.0, 0.32);
    gantry.add(banner, face);
    const holder = new Group();
    holder.add(gantry);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: GANTRY, x: 0 });
  }

  private addFeatherFlags(): void {
    const feathers = new FeatherFlags(this.disposables, this.track, FEATHERS);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 6; offset < LOOP; offset += FEATHER_EVERY) {
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

  /**
   * Names and cries painted all over the salt in dark paint: a row every few metres of two names
   * in staggered lanes either side of the black line, and every third row a slogan painted big
   * right across the course.
   */
  private addRoadPaint(): void {
    const rows = paintedRows(
      {
        loop: LOOP,
        every: ROAD_PAINT_EVERY,
        start: 12,
        kerb: KERB,
        names: ROAD_PAINT,
        slogans: ROAD_SLOGANS,
      },
      this.disposables,
      this.track,
    );
    for (const row of rows) {
      this.group.add(row.mesh);
      this.props.push(row);
    }
  }

  /**
   * Ahead across the flat white: the Silver Island Mountains, bare brown-grey ridges, floating
   * on the bright shimmering band of a mirage with their faint reflection inverted beneath, and
   * lower ranges either side, all hazed by hand.
   */
  private addMountains(): void {
    const haze = new Color(HAZE);
    const h = this.horizon;
    // The Silver Island Mountains in two ridges, the near one rugged and brown, the far one
    // taller and blue in the heat; Pilot Peak's range off to the right, lower hills to the left.
    const ranges = [
      { from: -2600, to: 1800, lift: 760, z: -3400, colour: 0x7a88a0, amount: 0.5, seed: 4331 },
      { from: -1500, to: 1500, lift: 520, z: -2300, colour: 0x7a6656, amount: 0.3, seed: 4301 },
      { from: -4600, to: -1700, lift: 220, z: -3800, colour: 0x8a8a92, amount: 0.55, seed: 4311 },
      { from: 1900, to: 5200, lift: 420, z: -3900, colour: 0x8a8090, amount: 0.5, seed: 4321 },
    ];
    for (const range of ranges) {
      const random = seeded(range.seed);
      const ridge = new Shape();
      ridge.moveTo(range.from, 0);
      for (let x = range.from; x <= range.to; x += 25) {
        const t = (x - range.from) / (range.to - range.from);
        const swell = Math.sin(t * Math.PI) ** 0.6;
        const peaks =
          0.5 +
          0.28 * Math.sin(x / 210 + range.seed) +
          0.14 * Math.sin(x / 73) +
          0.08 * Math.sin(x / 23);
        ridge.lineTo(x, range.lift * swell * peaks * (0.9 + random() * 0.15));
      }
      ridge.lineTo(range.to, 0);
      ridge.closePath();
      const geometry = new ExtrudeGeometry(ridge, { depth: 30, bevelEnabled: false });
      this.disposables.push(geometry);
      const rock = hazedMaterial(this.disposables, haze, range.colour, range.amount);
      const mountains = new Mesh(geometry, rock);
      mountains.position.set(0, 4, range.z);
      // Its reflection in the mirage, upside down and faint beneath it.
      const ghost = hazedMaterial(this.disposables, haze, range.colour, range.amount + 0.25, {
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const mirror = new Mesh(geometry, ghost);
      mirror.scale.y = -0.3;
      mirror.position.set(0, 2, range.z);
      h.add(mountains, mirror);
    }
    // The mirage: a bright band across the horizon, shimmering like water, hiding the ranges'
    // feet so they float.
    const band = new PlaneGeometry(14000, 70);
    this.disposables.push(band);
    const shimmer = this.material({
      map: this.track(mirageTexture()),
      transparent: true,
      depthWrite: false,
      fog: false,
      emissive: new Color(0xdfeaf4),
      emissiveIntensity: 0.9,
    });
    const mirage = new Mesh(band, shimmer);
    mirage.position.set(0, 6, -2050);
    h.add(mirage);
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

/** The Stars and Stripes, for the flagpoles in the pits. */
function starsAndStripes(): CanvasTexture {
  return canvasTexture(190, 100, (g) => {
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 ? '#ffffff' : '#b22234';
      g.fillRect(0, (i * 100) / 13, 190, 100 / 13 + 1);
    }
    g.fillStyle = '#3c3b6e';
    g.fillRect(0, 0, 76, 54);
    g.fillStyle = '#ffffff';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) g.fillRect(6 + c * 12, 5 + r * 10, 3, 3);
    }
  });
}

/** A mile board: black, the mile in big orange figures. */
function mileTexture(mile: number): CanvasTexture {
  return canvasTexture(300, 160, (g) => {
    g.fillStyle = '#1b1e24';
    g.fillRect(0, 0, 300, 160);
    g.strokeStyle = '#f08a2a';
    g.lineWidth = 8;
    g.strokeRect(6, 6, 288, 148);
    g.fillStyle = '#f08a2a';
    g.textAlign = 'center';
    g.font = 'bold 96px sans-serif';
    g.fillText(String(mile), 110, 118);
    g.font = 'bold 44px sans-serif';
    g.fillText('MILE', 222, 104);
  });
}

/** The race clock: amber digits on black. */
function clockTexture(): CanvasTexture {
  return canvasTexture(360, 120, (g) => {
    g.fillStyle = '#0c0d10';
    g.fillRect(0, 0, 360, 120);
    g.fillStyle = '#ffb02a';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 76px monospace';
    g.fillText('00:07.4', 180, 64);
  });
}

/** The mirage: a bright band, densest at its middle, streaked like water in the heat. */
function mirageTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    const fade = g.createLinearGradient(0, 0, 0, 64);
    fade.addColorStop(0, 'rgba(225,236,246,0)');
    fade.addColorStop(0.35, 'rgba(230,240,250,0.85)');
    fade.addColorStop(0.6, 'rgba(236,244,252,0.95)');
    fade.addColorStop(1, 'rgba(240,240,236,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 256, 64);
    const random = seeded(4405);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(170,196,220,0.35)' : 'rgba(255,255,255,0.6)';
      g.fillRect(random() * 256, 18 + random() * 30, 20 + random() * 60, 1 + random() * 2);
    }
  });
}

/** A hauler's side: the team's colour, a sweep of ink, the name large along it. */
function haulerTexture(name: string, fill: string, ink: string): CanvasTexture {
  return canvasTexture(640, 160, (g) => {
    g.fillStyle = fill;
    g.fillRect(0, 0, 640, 160);
    g.fillStyle = ink;
    g.beginPath();
    g.moveTo(0, 120);
    g.lineTo(640, 92);
    g.lineTo(640, 106);
    g.lineTo(0, 136);
    g.closePath();
    g.fill();
    g.font = 'bold italic 62px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, 320, 62, 600);
  });
}
