// Stanley Park's seawall, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the path
// that rings Vancouver's park on a clear morning, closed for the ride. On the left a walkway runs
// along the seawall's stone face, which drops to English Bay, where sailboats tack and freighters
// lie at anchor; on the right a grass verge gives onto a mossy rock bank and the forest above it,
// western red cedars and Douglas firs. Near the start of each lap the totem poles stand on the
// lawn at Brockton Point; ahead the green towers of the Lions Gate Bridge carry the road across
// the narrows, and the North Shore mountains rise beyond, snow on their tops.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, figures, barriers,
// banners, feather flags and road paint of world-kit.ts.
import {
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  BoxGeometry,
} from 'three/webgpu';
import {
  barrierBannerTexture,
  type BannerPanel,
  canvasTexture,
  clothBannerTexture,
  dashTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  Figures,
  hazedMaterial,
  loopMetres,
  paintTexture,
  PopupTents,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  slopeAt,
  speckle,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 500;
const BEHIND = 30;
const KERB = 0.12;
/** Race barriers line the path; the fans stand in knots behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.8;
/** The walkway on the sea side ends at the seawall's edge, which drops to the water. */
const WALL_EDGE = 10;
const SEA = 2.6;
/** Where the walkers go on the walkway. */
const WALKWAY = 8.6;
/** The rock bank on the park side, from its foot to its top, and how high it rises. */
const BANK_FOOT = 13;
const BANK_TOP = 24;
const BANK_RISE = 7;
/** The totem poles at Brockton Point, once a lap, on the park-side lawn. */
const TOTEMS = 140;
/** The totem poles stand this far off the centre line, just behind the barrier. */
const TOTEMS_X = 6.2;
/** The Lions Gate Bridge stands this far ahead across the narrows, hazed by hand. */
const BRIDGE_AHEAD = 480;
/** Its near tower stands this far right of the path, the bridge turned away across the narrows. */
const BRIDGE_X = 70;
const BRIDGE_TURN = -0.5;
const HAZE = 0xcfdde8;
const WALKERS = 26;
/** Canada geese grazing on the verge, in small flocks. */
const GEESE = 14;
const BOATS = 12;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
const LOCALS: Wardrobe = {
  tops: [
    '#d8283a',
    '#1f4e79',
    '#f2efe6',
    '#2e8b57',
    '#ffbf3c',
    '#3a3f47',
    '#7a3e9d',
    '#4fa3c7',
    '#111111',
    '#e86a5a',
  ],
  bottoms: ['#2a3140', '#1e2530', '#3b4a5c', '#6b5a48', '#20242b', '#4a4f57'],
  skins: SKINS,
};
const ACTIVEWEAR: Wardrobe = {
  tops: ['#ff5d8f', '#2ec4b6', '#ffbf3c', '#ffffff', '#3fe08a', '#4f86c6'],
  bottoms: ['#111111', '#2f3b4c', '#3a3f47'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1f4e79', ink: '#ffffff', text: 'STANLEY PARK' },
  { fill: '#2e8b57', ink: '#ffffff', text: 'SEAWALL' },
  { fill: '#d8283a', ink: '#ffffff', text: 'VANCOUVER' },
  { fill: '#f2efe6', ink: '#1f4e79', text: 'ENGLISH BAY' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#4fa3c7', ink: '#ffffff', text: 'LIONS GATE' },
];
const STREET_BANNERS: readonly (readonly [string, string, string])[] = [
  ['STANLEY PARK SEAWALL RIDE', '#1f4e79', '#ffffff'],
  ['BROCKTON POINT · LIONS GATE', '#2e8b57', '#ffffff'],
];
/** Feather flags along the barriers: the word down each and its colours. */
const FEATHERS: readonly FeatherWord[] = [
  ['SEAWALL', '#1f4e79', '#ffffff'],
  ['GO', '#d8283a', '#ffffff'],
  ['STANLEY', '#2e8b57', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
];
const FEATHER_EVERY = 16;
/**
 * The ride's village on the grass behind the right-hand crowd, either side of the totem poles'
 * lawn: pop-up tents in the ride's colours, each named on its valance, and where it stands.
 */
const TENTS: readonly (readonly [string, string, string, number, number])[] = [
  ['WATER', '#1f4e79', '#ffffff', 112, 9.6],
  ['SEAWALL RIDE', '#2e8b57', '#ffffff', 122, 10.2],
  ['WATTZUP', '#d7ff3a', '#1b1e24', 182, 9.8],
  ['BIKE REPAIR', '#d8283a', '#ffffff', 192, 10.4],
  ['VANCOUVER', '#4fa3c7', '#ffffff', 203, 9.7],
  ['FIRST AID', '#f2efe6', '#d8283a', 330, 9.8],
  ['WATER', '#1f4e79', '#ffffff', 420, 9.6],
];
/** What the fans paint on the path, its colour and how far off the centre line. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['GO GO', '#ffffff', -1.8],
  ['SEAWALL', '#ffbf3c', 1.8],
  ['PUSH', '#ffffff', -1.8],
  ['VAN CITY', '#ff8a6a', 1.8],
  ['ALLEZ', '#ffffff', -1.8],
  ['WATTZUP', '#d7ff3a', 1.8],
  ['STANLEY', '#ffffff', -1.8],
  ['EASY', '#ffbf3c', 1.8],
];
const ROAD_PAINT_EVERY = 25;
/** The cycle lane's bicycle stencils, one in each lane every so many metres. */
const STENCIL_EVERY = 30;

interface Walker {
  readonly offset: number;
  readonly speed: number;
  readonly x: number;
  readonly phase: number;
}

export class StanleyParkStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  /** Props along the road; one that `lies` on it, as paint does, takes its slope. */
  private readonly props: {
    mesh: Group;
    offset: number;
    every: number;
    x: number;
    lies?: boolean;
  }[] = [];
  private readonly boats: { mesh: Group; offset: number; x: number; phase: number }[] = [];
  private readonly walkers: Walker[] = [];
  private people: Figures | null = null;
  private readonly horizon = new Group();
  private readonly geese: { mesh: Group; offset: number; x: number; phase: number }[] = [];
  private readonly floatplane = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flagMaterials = ['#d8283a', '#ffffff', '#1f4e79', '#2e8b57'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.7,
      wardrobe: LOCALS,
      flags: this.flagMaterials,
      flagShare: 0.18,
      seeds: [601, 607],
      // A Sunday crowd: knots along the barriers, open stretches between them, and none in front
      // of the totem poles.
      skip: (side, offset, x) =>
        (side > 0 && offset > TOTEMS - 12 && offset < TOTEMS + 36) ||
        offset % 40 > 24 ||
        (x > CROWD_NEAR + 1.4 && offset % 12 > 7),
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addForest();
    this.addTotems();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addTents();
    this.addRoadPaint();
    this.addStencils();
    this.addBoats();
    this.addWalkers();
    this.addGeese();
    this.addFloatplane();
    this.addHorizon();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the bay, so the seawall and the water lie over it. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - SEA - 1);
      position.setY(i * 2 + 1, p.height - SEA - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(metres);
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB, -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    const t = this.time;
    // Sailboats heel and drift on the bay.
    for (const b of this.boats) {
      const metres = along(b.offset + Math.sin(t * 0.03 + b.phase) * 10, LOOP);
      b.mesh.position.set(b.x, ground(metres) - SEA + Math.sin(t * 0.9 + b.phase) * 0.08, -metres);
      b.mesh.rotation.z = Math.sin(t * 0.6 + b.phase) * 0.05 - 0.12;
    }
    const people = this.people;
    if (people) {
      this.walkers.forEach((w, i) => {
        const metres = along(w.offset + w.speed * t, LOOP);
        const running = Math.abs(w.speed) > 2;
        const step = Math.abs(Math.sin(t * (running ? 7 : 4) + w.phase)) * (running ? 0.08 : 0.04);
        people.set(i, w.x, ground(metres) + KERB, -metres, w.speed > 0 ? 0 : Math.PI, 0.95, step);
      });
      people.commit();
    }
    // The geese peck at the grass, wandering a little.
    for (const g of this.geese) {
      const metres = along(g.offset, LOOP);
      g.mesh.position.set(g.x + Math.sin(t * 0.1 + g.phase) * 0.4, ground(metres) + KERB, -metres);
      g.mesh.rotation.y = g.phase + Math.sin(t * 0.07 + g.phase) * 0.8;
      g.mesh.children[1]!.rotation.x = Math.max(0, Math.sin(t * 1.3 + g.phase)) * 1.1;
    }
    // The floatplane banks in a slow arc low over the bay, ahead and to the left.
    const arc = t * 0.035;
    this.floatplane.position.set(
      -70 + Math.sin(arc) * 15,
      heightAt(0) + 26 + Math.sin(arc * 2) * 2,
      -200 + Math.cos(arc) * 15,
    );
    this.floatplane.rotation.set(0, arc + Math.PI / 2, 0.22);
    this.horizon.position.set(0, heightAt(BRIDGE_AHEAD), -BRIDGE_AHEAD);
  }

  /** The walkway, the seawall's face and the bay; the verge, the rock bank and the forest floor. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xbdbab2, roughness: 0.9 });
    const walk = this.material({ map: this.repeat(walkTexture(), 3, 3), roughness: 0.9 });
    const cap = this.material({ color: 0xd8d2c4, roughness: 0.85 });
    const wall = this.material({ map: this.repeat(stoneTexture(), 3, 1), roughness: 0.9 });
    const bay = this.material({
      map: this.repeat(bayTexture(), 60, 60),
      roughness: 0.1,
      metalness: 0.3,
    });
    const verge = this.material({ map: this.repeat(grassTexture(), 4, 4), roughness: 1 });
    const moss = this.material({ map: this.repeat(mossTexture(), 6, 3), roughness: 1 });
    const floor = this.material({ map: this.repeat(floorTexture(), 10, 10), roughness: 1 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
    }
    this.ribbons.add(points, walk, [
      [-r - 0.3, KERB],
      [-WALL_EDGE, KERB],
    ]);
    this.ribbons.add(points, cap, [
      [-WALL_EDGE, KERB],
      [-WALL_EDGE, KERB + 0.35],
      [-WALL_EDGE - 0.6, KERB + 0.35],
    ]);
    this.ribbons.add(points, wall, [
      [-WALL_EDGE - 0.6, KERB + 0.35],
      [-WALL_EDGE - 0.6, -SEA],
    ]);
    this.ribbons.add(points, bay, [
      [-WALL_EDGE - 0.6, -SEA],
      [-1600, -SEA],
    ]);
    this.ribbons.add(points, verge, [
      [BANK_FOOT, KERB],
      [r + 0.3, KERB],
    ]);
    this.ribbons.add(points, moss, [
      [BANK_TOP, BANK_RISE],
      [BANK_FOOT + 3, 2.2],
      [BANK_FOOT, KERB],
    ]);
    this.ribbons.add(points, floor, [
      [700, BANK_RISE],
      [BANK_TOP, BANK_RISE],
    ]);
    // The cycle lane's yellow centre line, dashed, and its white edges.
    const centre = this.material({
      map: this.repeat(dashTexture('#f2c94c'), 0.12, 6),
      alphaTest: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, centre, [
      [0.07, 0.006],
      [-0.07, 0.006],
    ]);
    const edge = this.material({ color: 0xf2f2ee, polygonOffset: true, polygonOffsetFactor: -2 });
    for (const side of [-1, 1]) {
      const x = side * (r - 0.25);
      this.ribbons.add(points, edge, [
        [x + 0.06, 0.006],
        [x - 0.06, 0.006],
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
   * The forest on the park side: western red cedars, their boughs sweeping down in tiers from a
   * fluted reddish trunk, and tall dark Douglas firs, on the bank and above it, a few at its foot.
   */
  private addForest(): void {
    const random = seeded(613);
    const trunk = new CylinderGeometry(0.3, 0.6, 1, 8);
    trunk.translate(0, 0.5, 0);
    const tier = new ConeGeometry(1, 1, 9);
    this.disposables.push(trunk, tier);
    const cedarBark = this.material({ map: this.track(barkTexture('#7a4a32', 617)), roughness: 1 });
    const firBark = this.material({ map: this.track(barkTexture('#4a3a30', 619)), roughness: 1 });
    const cedars = ['#3f6b3a', '#4a7a40', '#365e33'].map((c) =>
      this.material({ map: this.track(boughTexture(c, 631)), roughness: 1 }),
    );
    const firs = ['#24402a', '#2c4a30', '#1f3a26'].map((c) =>
      this.material({ map: this.track(boughTexture(c, 641)), roughness: 1 }),
    );
    const plant = (x: number, offset: number, rise: number) => {
      const tree = new Group();
      const cedar = random() < 0.5;
      const height = cedar ? 18 + random() * 10 : 28 + random() * 16;
      const t = new Mesh(trunk, cedar ? cedarBark : firBark);
      t.scale.set(cedar ? 1.4 : 1.1, height, cedar ? 1.4 : 1.1);
      t.castShadow = true;
      tree.add(t);
      const greens = cedar ? cedars : firs;
      const tiers = cedar ? 6 : 8;
      for (let k = 0; k < tiers; k++) {
        const f = k / tiers;
        const width = (cedar ? 5.5 : 4.5) * (1 - f * 0.8) + random() * 0.6;
        const c = new Mesh(tier, greens[k % greens.length]!);
        // Cedar tiers droop: flatter and wider; fir tiers are steeper.
        c.scale.set(width, cedar ? 3.2 : 4.5, width);
        c.position.y = height * (cedar ? 0.3 : 0.35) + f * height * (cedar ? 0.68 : 0.62);
        c.rotation.y = random() * Math.PI;
        c.castShadow = true;
        tree.add(c);
      }
      tree.position.y = rise;
      tree.rotation.y = random() * Math.PI * 2;
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, every: LOOP, x });
    };
    for (let offset = 0; offset < LOOP; offset += 5 + random() * 5) {
      // Leave Brockton Point's lawn open around the totem poles.
      const atTotems = Math.abs(offset - TOTEMS) < 26;
      if (!atTotems && random() < 0.4) plant(BANK_FOOT - 1.5 + random() * 2, offset, 0);
      plant(BANK_FOOT + 4 + random() * 6, offset + random() * 4, 2 + random() * 3);
      plant(BANK_TOP + 2 + random() * 12, offset + random() * 4, BANK_RISE);
      if (random() < 0.8) plant(BANK_TOP + 18 + random() * 40, offset, BANK_RISE);
    }
  }

  /**
   * The totem poles at Brockton Point: carved red cedar poles of stacked figures painted black,
   * red and blue-green, some crowned with outstretched wings, on the lawn by the path.
   */
  private addTotems(): void {
    const group = new Group();
    const random = seeded(653);
    const wood = new CylinderGeometry(0.42, 0.5, 1, 12);
    wood.translate(0, 0.5, 0);
    this.disposables.push(wood);
    const carvings = [0, 1, 2, 3].map((k) =>
      this.material({ map: this.track(carvingTexture(659 + k * 7)), roughness: 0.85 }),
    );
    const plain = this.material({ color: 0x8a5a3a, roughness: 0.9 });
    const black = this.material({ color: 0x1a1614, roughness: 0.7 });
    const red = this.material({ color: 0xb02a22, roughness: 0.7 });
    const poles = 7;
    for (let k = 0; k < poles; k++) {
      const pole = new Group();
      const height = 10 + random() * 5;
      const p = new Mesh(wood, carvings[k % carvings.length]!);
      p.scale.set(1, height, 1);
      p.castShadow = true;
      pole.add(p);
      const base = new Mesh(this.unit, plain);
      base.scale.set(1.4, 0.3, 1.4);
      base.position.y = 0.15;
      pole.add(base);
      if (k % 2 === 0) {
        // Wings outstretched at the top, and the beak forward.
        const wings = new Mesh(this.unit, k % 4 === 0 ? black : red);
        wings.scale.set(4.2, 0.9, 0.18);
        wings.position.y = height - 0.8;
        const beak = new Mesh(this.unit, black);
        beak.scale.set(0.3, 0.3, 0.8);
        beak.position.set(0, height - 0.3, -0.6);
        pole.add(wings, beak);
      }
      // Noses and beaks jut from the carved faces, one under each pair of eyes (the carving's
      // four figures, top to bottom).
      for (let j = 0; j < 4; j++) {
        const nose = new Mesh(this.unit, k % 2 ? red : black);
        nose.scale.set(0.28, 0.5, 0.5);
        nose.position.set(0, height * (1 - (j * 128 + 72) / 512), -0.55);
        pole.add(nose);
      }
      pole.position.set((k % 2) * 3 + random() * 0.6, 0, -k * 4.2);
      // The faces look out over the path and toward the oncoming riders.
      pole.rotation.y = (2 * Math.PI) / 3 + (random() - 0.5) * 0.3;
      group.add(pole);
    }
    const lawn = new Mesh(
      new PlaneGeometry(10, 34),
      this.material({ map: this.repeat(grassTexture(), 3, 6), roughness: 1 }),
    );
    this.disposables.push(lawn.geometry);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(4.5, 0.01, -12);
    group.add(lawn);
    this.group.add(group);
    this.props.push({ mesh: group, offset: TOTEMS, every: LOOP, x: TOTEMS_X });
  }

  /** Cloth banners on poles across the path, the ride's name on each. */
  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.08, 0.08, 6.4, 8);
    post.translate(0, 3.2, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1, 1.2);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0xd9dde2, metalness: 0.6, roughness: 0.35 });
    STREET_BANNERS.forEach(([text, fill, ink], i) => {
      const banner = new Group();
      for (const x of [-roadHalf - 0.6, roadHalf + 0.6]) {
        const p = new Mesh(post, steel);
        p.position.x = x;
        banner.add(p);
      }
      const c = new Mesh(
        cloth,
        this.material({
          map: this.track(clothBannerTexture(text, fill, ink)),
          side: DoubleSide,
          roughness: 0.7,
        }),
      );
      c.position.y = 5.6;
      c.castShadow = true;
      banner.add(c);
      this.group.add(banner);
      this.props.push({ mesh: banner, offset: 110 + i * 250, every: LOOP, x: 0 });
    });
  }

  /**
   * Pop-up tents of the ride's village: a 3 m square canopy peaked over four white legs, a
   * printed valance on every side, and a trestle table under it laid with water bottles.
   */
  private addTents(): void {
    const tents = new PopupTents(this.disposables, this.track);
    TENTS.forEach(([text, fill, ink, offset, x], i) => {
      const tent = tents.make(text, fill, ink);
      tent.rotation.y = (i % 3) * 0.12 - 0.12;
      this.group.add(tent);
      this.props.push({ mesh: tent, offset, every: LOOP, x });
    });
  }

  /** The ride's feather flags along both barriers. */
  private addFeatherFlags(): void {
    const feathers = new FeatherFlags(this.disposables, this.track, FEATHERS);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 4; offset < LOOP; offset += FEATHER_EVERY) {
        const holder = new Group();
        holder.add(feathers.make(k++));
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? FEATHER_EVERY / 2 : 0),
          every: LOOP,
          x: side * (BARRIER + 0.15),
        });
      }
    }
  }

  /** What the fans have painted on the path. */
  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.4, 8.5);
    this.disposables.push(plane);
    [...ROAD_PAINT, ...ROAD_PAINT].forEach(([text, colour, x], i) => {
      const mesh = new Mesh(
        plane,
        this.material({
          map: this.track(paintTexture(text, colour)),
          alphaTest: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          roughness: 0.7,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02 - KERB;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset: 22 + i * ROAD_PAINT_EVERY,
        every: LOOP,
        x,
        lies: true,
      });
    });
  }

  /** The cycle lane's white bicycle and arrow in each lane, the arrow the way the lane rides. */
  private addStencils(): void {
    const plane = new PlaneGeometry(1.4, 3.4);
    this.disposables.push(plane);
    const stencil = this.material({
      map: this.track(stencilTexture()),
      alphaTest: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.7,
    });
    for (let offset = 10; offset < LOOP; offset += STENCIL_EVERY) {
      for (const side of [1, -1] as const) {
        const mesh = new Mesh(plane, stencil);
        mesh.rotation.set(-Math.PI / 2, 0, side > 0 ? 0 : Math.PI);
        mesh.position.y = 0.02 - KERB;
        const holder = new Group();
        holder.add(mesh);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? 0 : 15),
          every: LOOP,
          x: side * 1.7,
        });
      }
    }
  }

  /** Sailboats on English Bay: white hulls and sails, a few coloured spinnakers. */
  private addBoats(): void {
    const random = seeded(673);
    const hull = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const sailcloth = this.material({ color: 0xffffff, side: DoubleSide, roughness: 0.7 });
    const colours = ['#d8283a', '#1f4e79', '#ffbf3c'].map((c) =>
      this.material({ color: c, side: DoubleSide, roughness: 0.7 }),
    );
    const sail = new ConeGeometry(1, 1, 3);
    const mast = new CylinderGeometry(0.05, 0.05, 1, 5);
    this.disposables.push(sail, mast);
    for (let k = 0; k < BOATS; k++) {
      const boat = new Group();
      const size = 0.8 + random() * 0.8;
      const h = new Mesh(this.unit, hull);
      h.scale.set(1.6, 0.8, 6);
      h.position.y = 0.4;
      const m = new Mesh(mast, hull);
      m.scale.set(1, 9, 1);
      m.position.y = 5.2;
      const main = new Mesh(sail, k % 4 === 3 ? colours[k % 3]! : sailcloth);
      main.scale.set(0.08, 8, 2.6);
      main.position.set(0, 5, 0.9);
      const jib = new Mesh(sail, sailcloth);
      jib.scale.set(0.06, 6.5, 1.8);
      jib.position.set(0, 4.2, -1.6);
      boat.add(h, m, main, jib);
      boat.scale.setScalar(size);
      boat.rotation.y = (random() - 0.5) * 1.6;
      this.group.add(boat);
      this.boats.push({
        mesh: boat,
        offset: random() * LOOP,
        x: -WALL_EDGE - 30 - random() * 260,
        phase: random() * 6,
      });
    }
  }

  /** Walkers and joggers on the walkway, built on the kit's figures. */
  private addWalkers(): void {
    const random = seeded(683);
    this.people = new Figures(this.group, this.disposables, WALKERS, ACTIVEWEAR, 691);
    for (let i = 0; i < WALKERS; i++) {
      const running = i % 3 === 0;
      const ahead = i % 2 === 0;
      this.walkers.push({
        // Half of them in the stretch the rider first sees, the rest round the loop.
        offset: i % 2 ? 100 + random() * 160 : random() * LOOP,
        speed: (ahead ? 1 : -1) * (running ? 2.8 : 1.3),
        x: -(WALKWAY + (ahead ? -0.6 : 0.6)),
        phase: random() * 6,
      });
    }
  }

  /** Canada geese on the verge: brown backs, black necks with white chinstraps, heads down. */
  private addGeese(): void {
    const random = seeded(709);
    const body = new SphereGeometry(1, 10, 8);
    this.disposables.push(body);
    const brown = this.material({ color: 0x6b5a48, roughness: 0.9 });
    const black = this.material({ color: 0x161616, roughness: 0.8 });
    const white = this.material({ color: 0xf2f2ee, roughness: 0.8 });
    const pale = this.material({ color: 0xd8d0c0, roughness: 0.9 });
    for (let k = 0; k < GEESE; k++) {
      const goose = new Group();
      const b = new Mesh(body, brown);
      b.scale.set(0.2, 0.17, 0.38);
      b.position.y = 0.32;
      const belly = new Mesh(body, pale);
      belly.scale.set(0.17, 0.12, 0.3);
      belly.position.set(0, 0.26, 0.04);
      b.castShadow = true;
      // The neck pivots at the shoulders so the head dips to graze.
      const neck = new Group();
      neck.position.set(0, 0.38, -0.3);
      const n = new Mesh(this.unit, black);
      n.scale.set(0.06, 0.36, 0.06);
      n.position.y = 0.18;
      const head = new Mesh(body, black);
      head.scale.set(0.06, 0.06, 0.1);
      head.position.set(0, 0.37, -0.05);
      const strap = new Mesh(body, white);
      strap.scale.set(0.065, 0.035, 0.05);
      strap.position.set(0, 0.34, -0.03);
      neck.add(n, head, strap);
      goose.add(b, neck, belly);
      goose.scale.setScalar(1.8);
      this.group.add(goose);
      const flock = Math.floor(k / 5);
      this.geese.push({
        mesh: goose,
        offset: 120 + flock * 45 + random() * 8,
        x: 7.5 + random() * 4,
        phase: random() * 6,
      });
    }
  }

  /**
   * A floatplane over the bay: a white high-wing single-engine plane on two floats, a red
   * stripe down its side and on its tail, banking in a slow arc as it comes in to Coal Harbour.
   */
  private addFloatplane(): void {
    const white = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const red = this.material({ color: 0xc0302a, roughness: 0.6 });
    const dark = this.material({ color: 0x2a2e34, roughness: 0.5 });
    const p = this.floatplane;
    const part = (
      m: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      p.add(mesh);
    };
    part(white, 1.6, 1.8, 9.5, 0, 0, 0);
    part(red, 1.65, 0.35, 9.6, 0, -0.2, 0);
    part(dark, 1.5, 0.7, 1.4, 0, 0.5, -2.8);
    part(white, 15, 0.25, 2, 0, 1.0, -1.6);
    part(white, 0.25, 2.4, 1.6, 0, 1.4, 4.4);
    part(red, 0.3, 1.2, 1.6, 0, 1.9, 4.4);
    part(white, 5, 0.2, 1.4, 0, 0.3, 4.4);
    for (const x of [-1.6, 1.6]) {
      part(white, 0.6, 0.6, 7.5, x, -2.6, -0.4);
      part(dark, 0.15, 1.8, 0.15, x * 0.7, -1.6, -1.8);
      part(dark, 0.15, 1.8, 0.15, x * 0.7, -1.6, 1.4);
    }
    part(dark, 2.8, 0.15, 0.1, 0, 0, -4.85);
    p.scale.setScalar(1.6);
    this.group.add(p);
  }

  /**
   * Ahead: the Lions Gate Bridge across the narrows, its two green towers, its cables sagging
   * between them and its deck high over the water, the North Shore mountains beyond with snow on
   * their tops, and freighters at anchor out in the bay, all hazed by hand.
   */
  private addHorizon(): void {
    const haze = new Color(HAZE);
    const green = hazedMaterial(this.disposables, haze, 0x3f8a52, 0.06);
    const deck = hazedMaterial(this.disposables, haze, 0x5a6a5e, 0.1);
    const cable = hazedMaterial(this.disposables, haze, 0x3a6a46, 0.1);
    const h = this.horizon;
    // The bridge leaves the park's headland on the right and crosses the narrows, turned away
    // from the riders so its towers' legs stand apart and its deck and cables run off into the
    // distance. Along the bridge is its own x; its towers stand at 0 and at the far side.
    const bridge = new Group();
    bridge.position.set(BRIDGE_X, 0, 0);
    bridge.rotation.y = BRIDGE_TURN;
    h.add(bridge);
    const deckY = 52;
    const towers = [0, -470];
    const legs = 9;
    const span = new Mesh(this.unit, deck);
    span.scale.set(1200, 3, 2 * legs + 2);
    span.position.set(-350, deckY, 0);
    bridge.add(span);
    const box = (w: number, height: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, green);
      mesh.scale.set(w, height, d);
      mesh.position.set(x, y, z);
      bridge.add(mesh);
      return mesh;
    };
    for (const x of towers) {
      for (const z of [-legs, legs]) box(5, 111, 5, x, 55.5 - 14, z);
      // Portal struts between the legs, and the X-bracing in each bay above the deck.
      const levels = [deckY - 4, deckY + 16, deckY + 36, deckY + 56, 111 - 16];
      for (const y of levels) box(4, 3.5, 2 * legs, x, y - 14, 0);
      for (let i = 0; i < levels.length - 1; i++) {
        const y0 = levels[i]! - 14;
        const y1 = levels[i + 1]! - 14;
        const length = Math.hypot(2 * legs, y1 - y0);
        const angle = Math.atan2(y1 - y0, 2 * legs);
        for (const sign of [1, -1]) {
          const brace = box(2, length, 1.6, x, (y0 + y1) / 2, 0);
          brace.rotation.x = sign * (Math.PI / 2 - angle);
        }
      }
    }
    // Main cables: down from the towers' tops, sagging to the deck mid-span, and out to the ends.
    const top = 111 - 14;
    const cableAt = (x: number) => {
      const [a, b] = towers as [number, number];
      if (x <= a && x >= b) {
        const u = (x - b) / (a - b);
        return deckY + 4 + (top - deckY - 4) * (2 * u - 1) ** 2;
      }
      const edge = x > a ? a : b;
      const end = x > a ? a + 180 : b - 420;
      return top - ((top - deckY) * (x - edge)) / (end - edge);
    };
    for (let x = -890; x < 180; x += 6) {
      for (const z of [-legs, legs]) {
        const y0 = cableAt(x);
        const y1 = cableAt(x + 6);
        const piece = new Mesh(this.unit, cable);
        const length = Math.hypot(6, y1 - y0);
        piece.scale.set(length, 1.1, 1.1);
        piece.position.set(x + 3, (y0 + y1) / 2, z);
        piece.rotation.z = Math.atan2(y1 - y0, 6);
        bridge.add(piece);
        if (Math.round(x) % 12 === 0 && y0 > deckY + 4) {
          const hanger = new Mesh(this.unit, cable);
          hanger.scale.set(0.3, y0 - deckY, 0.3);
          hanger.position.set(x, (y0 + deckY) / 2, z);
          bridge.add(hanger);
        }
      }
    }
    // The North Shore mountains, forested blue-green below, snow on their tops.
    const forested = [0x3e5a5a, 0x46636a, 0x4f6b72].map((c) =>
      hazedMaterial(this.disposables, haze, c, 0.42),
    );
    const snow = hazedMaterial(this.disposables, haze, 0xf4f6f8, 0.3);
    const random = seeded(701);
    const peak = new ConeGeometry(1, 1, 18);
    this.disposables.push(peak);
    for (let k = 0; k < 13; k++) {
      const x = -3400 + k * 480 + random() * 240;
      const height = 280 + random() * 260;
      const width = 1300 + random() * 700;
      const m = new Mesh(peak, forested[k % forested.length]!);
      m.scale.set(width, height, 600);
      m.position.set(x, height / 2 - 40, -3300 - random() * 900);
      h.add(m);
      const cap = new Mesh(peak, snow);
      cap.scale.set(width * 0.22, height * 0.22, 132);
      cap.position.set(x, height - 40 - height * 0.11 + 1, m.position.z + 2);
      h.add(cap);
    }
    this.addNorthShore(haze);
    // Freighters at anchor in English Bay.
    const hullRed = hazedMaterial(this.disposables, haze, 0x8a2a22, 0.3);
    const hullBlack = hazedMaterial(this.disposables, haze, 0x2a2a2e, 0.3);
    const house = hazedMaterial(this.disposables, haze, 0xf2f2ee, 0.3);
    for (const [x, z, m] of [
      [-520, 120, hullRed],
      [-860, -260, hullBlack],
      [-1180, 300, hullRed],
    ] as const) {
      const ship = new Mesh(this.unit, m);
      ship.scale.set(32, 12, 190);
      ship.position.set(x, 4 - SEA, z);
      const bridge = new Mesh(this.unit, house);
      bridge.scale.set(26, 14, 18);
      bridge.position.set(x, 16 - SEA, z + 80);
      h.add(ship, bridge);
    }
    this.group.add(h);
  }

  /**
   * The North Shore across the narrows, under the mountains: North Vancouver's waterfront behind
   * the bridge, its apartment towers white and cream with bands of balconies, the
   * shore wooded between them, and forested foothills rising in folds behind. Each layer is hazed
   * a little more than the one in front, so the shore reads in depth.
   */
  private addNorthShore(haze: Color): void {
    const h = this.horizon;
    const random = seeded(709);
    const hill = new SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(hill);
    // The shore itself: a low wooded strip along the water, with the land running back under it.
    const land = hazedMaterial(this.disposables, haze, 0x2f4a36, 0.2);
    const slab = new Mesh(this.unit, land);
    slab.scale.set(4200, 4, 900);
    slab.position.set(-300, 2 - SEA, -1400);
    h.add(slab);
    const shoreGreens = [0x2c4a32, 0x35573a, 0x2a4230].map((c) =>
      hazedMaterial(this.disposables, haze, c, 0.2),
    );
    for (let x = -2400; x < 1400; x += 40 + random() * 50) {
      const m = new Mesh(hill, shoreGreens[Math.floor(random() * 3)]!);
      m.scale.set(50 + random() * 70, 14 + random() * 18, 30 + random() * 30);
      m.position.set(x, -SEA, this.shoreZ(x) - 30 - random() * 60);
      h.add(m);
    }
    // Foothills in folds behind the shore, darker and nearer than the snowy range.
    const hillGreens = [0x2a5234, 0x30603c, 0x24482f, 0x3a6844].map((c, i) =>
      hazedMaterial(this.disposables, haze, c, 0.12 + (i % 2) * 0.06),
    );
    for (let k = 0; k < 16; k++) {
      const x = -3300 + k * 280 + random() * 160;
      const m = new Mesh(hill, hillGreens[k % hillGreens.length]!);
      m.scale.set(380 + random() * 420, 100 + random() * 120, 260 + random() * 120);
      m.position.set(x, -SEA, this.shoreZ(x) - 420 - random() * 420);
      h.add(m);
    }
    // West Vancouver's towers along the waterfront, and smaller blocks between them.
    const bands = this.track(
      canvasTexture(64, 64, (g) => {
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 64, 64);
        // A storey: a band of glass behind a balcony rail, the floor slab white above it.
        g.fillStyle = '#5c6e78';
        g.fillRect(0, 14, 64, 30);
        g.fillStyle = '#8fa6b2';
        g.fillRect(0, 14, 64, 8);
        g.fillStyle = '#e8ecee';
        g.fillRect(0, 38, 64, 6);
        g.fillStyle = 'rgba(255,255,255,0.7)';
        for (let x = 0; x < 64; x += 16) g.fillRect(x, 14, 3, 24);
      }),
    );
    bands.wrapS = RepeatWrapping;
    bands.wrapT = RepeatWrapping;
    const facades = [0xf4f2ec, 0xe9dfca, 0xd6dade, 0xdcc8a6, 0xbfd2d6].map((c) =>
      hazedMaterial(this.disposables, haze, c, 0.16, { map: bands }),
    );
    const roofs = hazedMaterial(this.disposables, haze, 0x6a6e72, 0.18);
    for (let x = -1300; x < 900; x += 22 + random() * 45) {
      const tower = random() < 0.55;
      const w = tower ? 18 + random() * 12 : 14 + random() * 18;
      const d = tower ? 16 + random() * 8 : 12 + random() * 10;
      const height = tower ? 60 + random() * 50 : 12 + random() * 16;
      const box = new BoxGeometry(w, height, d);
      for (const face of [0, 1]) scaleFaceUv(box, face, d / 6, height / 3);
      for (const face of [4, 5]) scaleFaceUv(box, face, w / 6, height / 3);
      for (const face of [2, 3]) scaleFaceUv(box, face, 0, 0);
      this.disposables.push(box);
      const z = this.shoreZ(x) - 30 - random() * (tower ? 40 : 110);
      const block = new Mesh(box, facades[Math.floor(random() * facades.length)]!);
      block.position.set(x, height / 2 - SEA + 2, z);
      block.rotation.y = (random() - 0.5) * 0.3;
      h.add(block);
      const roof = new Mesh(this.unit, roofs);
      roof.scale.set(w * 0.5, 3, d * 0.5);
      roof.position.set(x, height - SEA + 3.5, z);
      h.add(roof);
    }
  }

  /** Where the North Shore meets the water, in the horizon's frame: further off to the west. */
  private shoreZ(x: number): number {
    return -640 - Math.abs(x + 200) * 0.12;
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

/** The walkway's pale, swept concrete in slabs. */
function walkTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#b8b4aa', 709);
    g.fillStyle = 'rgba(80,76,70,0.35)';
    g.fillRect(0, 0, 256, 2);
    g.fillRect(0, 128, 256, 2);
  });
}

/** The seawall's granite blocks in courses, darker where the tide wets them. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    speckle(g, 256, 128, '#9a948a', 719);
    g.fillStyle = 'rgba(50,46,40,0.45)';
    for (let y = 0; y < 128; y += 32) {
      g.fillRect(0, y, 256, 2);
      for (let x = (y / 32) % 2 ? 0 : 32; x < 256; x += 64) g.fillRect(x, y, 2, 32);
    }
    g.fillStyle = 'rgba(40,50,40,0.35)';
    g.fillRect(0, 96, 256, 32);
  });
}

/** English Bay: deep blue-green, flecked with the light off the ripples. */
function bayTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#2a5f7a';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(727);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(220,240,250,${0.05 + random() * 0.16})`;
      g.fillRect(random() * 512, random() * 512, 3, 10 + random() * 20);
    }
  });
}

/** The verge's mown grass. */
function grassTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#5a8a44', 733);
    const random = seeded(739);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(40,70,30,0.3)' : 'rgba(170,200,120,0.25)';
      g.fillRect(random() * 256, random() * 256, 2, 5);
    }
  });
}

/** The bank's mossy rock and ferns. */
function mossTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#56703e', 743);
    const random = seeded(751);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = random() < 0.4 ? 'rgba(110,104,96,0.6)' : 'rgba(40,70,32,0.5)';
      g.beginPath();
      g.arc(random() * 256, random() * 256, 4 + random() * 12, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** The forest floor: needles, ferns and fallen boughs. */
function floorTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#3f4a2c', 757);
    const random = seeded(761);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(110,80,50,0.4)' : 'rgba(60,100,50,0.4)';
      g.fillRect(random() * 256, random() * 256, 7, 2);
    }
  });
}

/** A trunk's bark, furrowed in long strips. */
function barkTexture(colour: string, seed: number): CanvasTexture {
  const texture = canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, colour, seed);
    g.fillStyle = 'rgba(20,12,8,0.4)';
    for (let x = 4; x < 64; x += 9) g.fillRect(x, 0, 2, 256);
  });
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 4);
  return texture;
}

/** Boughs in `colour`, their sprays drooping in rows. */
function boughTexture(colour: string, seed: number): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, colour, seed);
    const random = seeded(seed + 1);
    for (let i = 0; i < 220; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '10,25,15' : '200,225,180'},${0.1 + random() * 0.18})`;
      g.fillRect(random() * 128, random() * 128, 6, 2);
    }
  });
}

/**
 * A totem pole's carved and painted figures, four stacked: each a face with ovoid eyes under
 * heavy black brows, blue-green and white within, a red mouth, and formline shapes at its sides,
 * on weathered cedar. The faces are centred on the texture so they look the way the pole turns.
 */
function carvingTexture(seed: number): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, '#a87850', seed);
    const random = seeded(seed + 3);
    for (let y = 0; y < 512; y += 128) {
      g.fillStyle = 'rgba(40,24,16,0.55)';
      g.fillRect(0, y, 256, 5);
      const inner = random() < 0.5 ? '#2f8a7a' : '#f2efe6';
      for (const x of [98, 158]) {
        g.fillStyle = '#1a1614';
        g.fillRect(x - 30, y + 18, 60, 9);
        g.beginPath();
        g.ellipse(x, y + 46, 26, 16, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = inner;
        g.beginPath();
        g.ellipse(x, y + 46, 14, 8, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#c0302a';
      g.fillRect(92, y + 92, 72, 20);
      g.fillStyle = '#1a1614';
      g.fillRect(100, y + 99, 56, 6);
      // Formline ovoids and U-shapes at the figure's sides.
      for (const x of [30, 226]) {
        g.strokeStyle = random() < 0.5 ? '#1a1614' : '#c0302a';
        g.lineWidth = 7;
        g.beginPath();
        g.ellipse(x, y + 64, 18, 30, 0, 0, Math.PI * 2);
        g.stroke();
      }
    }
  });
}

/** A cycle lane's stencil in white: a bicycle with an arrow ahead of it, on a clear ground. */
function stencilTexture(): CanvasTexture {
  return canvasTexture(128, 320, (g) => {
    g.strokeStyle = '#f4f4f0';
    g.fillStyle = '#f4f4f0';
    g.lineWidth = 7;
    // The bicycle, seen from above as painted: two wheels, the frame and the bars.
    for (const y of [250, 170]) {
      g.beginPath();
      g.arc(64, y, 30, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(64, 250);
    g.lineTo(64, 170);
    g.moveTo(64, 215);
    g.lineTo(44, 185);
    g.lineTo(84, 185);
    g.moveTo(40, 160);
    g.lineTo(88, 160);
    g.stroke();
    // The arrow ahead of it.
    g.fillRect(56, 70, 16, 60);
    g.beginPath();
    g.moveTo(32, 76);
    g.lineTo(64, 20);
    g.lineTo(96, 76);
    g.closePath();
    g.fill();
  });
}
