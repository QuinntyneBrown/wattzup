// Napa Vineyards, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): a valley road
// through the Napa Valley on a warm Californian afternoon, closed for the ride. Rows of vines run
// out from the road on both sides and climb the valley's sides to golden hills dotted with oaks;
// stone wineries stand beside the road under spreading oaks, their tasting terraces set with
// umbrellas; ahead a mission-style winery with a bell tower stands on a vine-covered knoll, its
// drive lined with cypresses, under the blue ridges of the Mayacamas.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags and road paint of world-kit.ts.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector2,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import {
  barrierBannerTexture,
  type BannerPanel,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  Figures,
  FeatherFlags,
  type FeatherWord,
  hazedMaterial,
  loopMetres,
  Mist,
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
/** Race barriers line the road; the fans stand in knots behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.4;
/** The dusty shoulder ends where the vineyards begin, with a headland track along the rows' ends. */
const VINES_FROM = 8;
const HEADLAND = 4;
/** The vine rows run out to here, climbing the valley's side. */
const VINES_TO = 108;
/** Each block of vine rows is this long along the road. */
const BLOCK = 25;
const ROW_EVERY = 2.5;
/** The mission winery's knoll, its hills and the ridges beyond stand this far ahead. */
const HORIZON_AHEAD = 300;
/** The knoll and its mission winery stand nearer; the vines and oaks on the right stop short of it. */
const MISSION_AT = 190;
const KNOLL_FOOT = MISSION_AT - 65;
const HAZE = 0xe4d6b8;
/** The warm dust in the afternoon air, lit by the low sun. */
const DUST = 0xf0dcb2;

/**
 * How high the ground stands above the road `x` metres off its centre: level to the vineyards,
 * then a gentle climb through the vines and a steeper one up the golden hills.
 */
function rise(x: number): number {
  const d = Math.abs(x);
  const top = x > 0 ? 150 : 110;
  if (d <= VINES_FROM) return 0;
  if (d <= VINES_TO + 2) return (d - VINES_FROM) * 0.05;
  const vines = (VINES_TO + 2 - VINES_FROM) * 0.05;
  if (d <= 300) return vines + ((d - VINES_TO - 2) / (300 - VINES_TO - 2)) ** 1.4 * 28;
  return vines + 28 + ((d - 300) / 600) * (top - vines - 28);
}

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
const LOCALS: Wardrobe = {
  tops: [
    '#f2efe6',
    '#7a1f3d',
    '#2f5d8a',
    '#e8b04a',
    '#5a7a3a',
    '#d9674a',
    '#111111',
    '#9cc3e0',
    '#c9a27a',
    '#6b4a8a',
  ],
  bottoms: ['#2a3140', '#c9b48a', '#3b4a5c', '#e8e0d0', '#20242b', '#5a4a3a'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#7a1f3d', ink: '#ffffff', text: 'NAPA VALLEY' },
  { fill: '#3e5a2a', ink: '#f4e8c8', text: 'VINEYARD RIDE' },
  { fill: '#e8b04a', ink: '#3a2410', text: 'CALIFORNIA' },
  { fill: '#f2efe6', ink: '#7a1f3d', text: 'HARVEST' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#2f5d8a', ink: '#ffffff', text: 'SILVERADO' },
];
const STREET_BANNERS: readonly (readonly [string, string, string])[] = [
  ['NAPA VALLEY VINEYARD RIDE', '#7a1f3d', '#ffffff'],
  ['SILVERADO TRAIL · CALIFORNIA', '#3e5a2a', '#f4e8c8'],
];
const FEATHERS: readonly FeatherWord[] = [
  ['NAPA', '#7a1f3d', '#ffffff'],
  ['GO', '#e8b04a', '#3a2410'],
  ['VINEYARD', '#3e5a2a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
];
const FEATHER_EVERY = 16;
/**
 * The ride's village on the headland track: each tent's valance, canopy, ink, where in the loop
 * and which side. The first stand in the opening view, clear of the harvest crews.
 */
const TENTS: readonly (readonly [string, string, string, number, -1 | 1])[] = [
  ['WINE TASTING', '#7a1f3d', '#ffffff', 112, 1],
  ['WATER', '#2f5d8a', '#ffffff', 119, 1],
  ['WINE TASTING', '#7a1f3d', '#ffffff', 135, -1],
  ['WATER', '#2f5d8a', '#ffffff', 142, -1],
  ['WATTZUP', '#d7ff3a', '#1b1e24', 162, 1],
  ['GRAPE JUICE', '#5a2a6a', '#f4e8c8', 160, -1],
  ['BIKE REPAIR', '#c8202f', '#ffffff', 190, 1],
  ['FIRST AID', '#f2efe6', '#c8202f', 260, -1],
];

/** What the fans paint on the road, its colour and how far off the centre line. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['ALLEZ', '#ffffff', -1.8],
  ['NAPA', '#f2c230', 1.8],
  ['GO GO', '#ffffff', -1.8],
  ['CHEERS', '#ff9a8a', 1.8],
  ['VAMOS', '#ffffff', -1.8],
  ['WATTZUP', '#d7ff3a', 1.8],
  ['PUSH', '#ffffff', -1.8],
  ['SALUD', '#f2c230', 1.8],
];
const ROAD_PAINT_EVERY = 25;
/**
 * The stone wineries beside the road: how far into the loop, which side, how far off the
 * road's centre, and whether barrels stand stacked by the door. The first is in the opening view.
 */
/** Harvest crews in the vine rows: which side, the block's place in the loop, and how far out. */
const CREWS: readonly (readonly [-1 | 1, number, number])[] = [
  [-1, 125, 12.5],
  [1, 175, 12.5],
  [1, 200, 13],
  [-1, 325, 12.5],
  [1, 375, 13],
  [-1, 450, 12.5],
];
const PICKERS: Wardrobe = {
  tops: ['#e8e0d0', '#3a5f8a', '#c9302c', '#f2f2ee', '#5a6a3a', '#d98a2a', '#7a8fa8'],
  bottoms: ['#2a3140', '#3b4a5c', '#5a4a3a', '#20242b'],
  skins: SKINS,
};

/** The farmstead on the left: how far into the loop and how far off the road's centre. */
const FARM = 165;
const FARM_X = -27;

const WINERIES: readonly (readonly [number, -1 | 1, number, boolean])[] = [
  [140, 1, 27, false],
  [215, -1, 30, true],
  [400, 1, 29, true],
];

/** Someone standing in the scene: where in the loop, how far out, how high, which way they face. */
interface Spot {
  readonly offset: number;
  readonly x: number;
  readonly rise: number;
  readonly heading: number;
  readonly phase: number;
}

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly every: number;
  readonly x: number;
  /** How far the ground under it stands above the road. */
  readonly rise: number;
  /** Hidden near the knoll, so nothing stands in front of the mission winery. */
  readonly near?: boolean;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

export class NapaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly mist: Mist;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private time = 0;
  private readonly guests: Spot[] = [];
  private readonly pickers: Spot[] = [];
  private readonly balloons: { mesh: Group; x: number; y: number; z: number; phase: number }[] = [];
  private guestFigures: Figures | null = null;
  private pickerFigures: Figures | null = null;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly ball = new SphereGeometry(1, 12, 9);
  private readonly flagMaterials = ['#7a1f3d', '#3e5a2a', '#e8b04a', '#2f5d8a'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );
  private oakCrowns: BufferGeometry[] = [];
  private oakTrunk: CylinderGeometry | null = null;
  private oakBark: MeshStandardMaterial | null = null;
  private oakLeaves: MeshStandardMaterial[] = [];

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // The afternoon's dusty golden haze: a veil between the knoll and the hills, and a thicker one
    // before the Mayacamas, so the distance steps back in layers.
    this.mist = new Mist(this.group, disposables, track, {
      colour: DUST,
      loop: LOOP,
      curtains: [
        { ahead: 420, height: 45, opacity: 0.28 },
        { ahead: 1100, height: 140, opacity: 0.4 },
      ],
      banks: 0,
      bankX: () => 0,
    });
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.7,
      wardrobe: LOCALS,
      flags: this.flagMaterials,
      flagShare: 0.2,
      seeds: [1211, 1223],
      // A country crowd: knots along the barriers with open stretches between them, so the vine
      // rows show.
      // The crowd also opens in front of a winery's terrace and wherever a harvest crew works.
      skip: (side, offset, x) =>
        offset % 45 > 24 ||
        (x > CROWD_NEAR + 1.2 && offset % 12 > 7) ||
        WINERIES.some(([at, s]) => s === side && Math.abs(offset - at) < 14) ||
        CREWS.some(([s, at]) => s === side && Math.abs(offset - at) < 9),
    });
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.ball, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.mist.build();
    this.prepareOaks();
    this.addVines();
    this.addWineries();
    this.addFarmstead();
    this.addOaks();
    this.addHarvest();
    this.addPeople();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addTents();
    this.addRoadPaint();
    this.addHorizon();
    this.addBalloons();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
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
      const metres = along(prop.offset, prop.every);
      prop.mesh.visible = !prop.near || metres < KNOLL_FOOT;
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB + prop.rise, -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.mist.place(this.time, heightAt, along, () => KERB);
    const t = this.time;
    // Guests linger at the terrace tables; the pickers stoop and straighten along the rows.
    for (const [people, spots, pace, depth] of [
      [this.guestFigures, this.guests, 0.6, 0.015],
      [this.pickerFigures, this.pickers, 1.3, 0.05],
    ] as const) {
      if (!people) continue;
      spots.forEach((p, i) => {
        const metres = along(p.offset, LOOP);
        const bob = Math.abs(Math.sin(t * pace + p.phase)) * depth;
        people.set(i, p.x, ground(metres) + KERB + p.rise, -metres, p.heading, 0.95, bob);
      });
      people.commit();
    }
    this.horizon.position.set(0, heightAt(HORIZON_AHEAD), -HORIZON_AHEAD);
    // The balloons drift slowly up the valley, rising and sinking a little.
    for (const b of this.balloons) {
      b.mesh.position.set(
        b.x + Math.sin(t * 0.02 + b.phase) * 12,
        b.y + Math.sin(t * 0.15 + b.phase) * 2,
        b.z - ((t * 0.8) % 400),
      );
    }
  }

  /** The kerbs, the road's lines, the dusty shoulders, the vineyards' soil and the hills. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xcfc6b2, roughness: 0.9 });
    const shoulder = this.material({ map: this.repeat(shoulderTexture(), 3, 3), roughness: 1 });
    const soil = this.material({ map: this.repeat(soilTexture(), 5, 5), roughness: 1 });
    const grass = this.material({ map: this.repeat(dryGrassTexture(), 8, 8), roughness: 1 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
      this.ribbons.add(points, shoulder, order([at(VINES_FROM, KERB), at(r + 0.3, KERB)]));
      const vineyard: [number, number][] = [];
      for (let d = VINES_TO + 2; d >= VINES_FROM; d -= 17.0) {
        vineyard.push(at(Math.max(d, VINES_FROM), KERB + rise(side * d)));
      }
      this.ribbons.add(points, soil, order(vineyard));
      const hills: [number, number][] = [];
      for (const d of [900, 700, 500, 400, 300, 240, 190, 150, VINES_TO + 2]) {
        hills.push(at(d, KERB + rise(side * d)));
      }
      this.ribbons.add(points, grass, order(hills));
    }
    // California's double yellow centre line and the white edge lines.
    const yellow = this.material({
      color: 0xf2c230,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const white = this.material({
      color: 0xf2f2ee,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    for (const x of [0.2, -0.08]) {
      this.ribbons.add(points, yellow, [
        [x, 0.006],
        [x - 0.12, 0.006],
      ]);
    }
    for (const side of [1, -1]) {
      const x = side * (r - 0.25);
      this.ribbons.add(points, white, [
        [Math.max(x, x - side * 0.14), 0.006],
        [Math.min(x, x - side * 0.14), 0.006],
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
   * The vineyards: blocks of trellised rows running out from the road and climbing the slope,
   * each row a hedge of leaves on its cordon over a line of gnarled trunks, a post at the end.
   * Where a winery stands, its block is left out.
   */
  private addVines(): void {
    const leaves = this.material({ map: this.repeat(vineTexture(), 1.2, 1.3), roughness: 1 });
    const trunks = this.material({
      map: this.repeat(trunkTexture(), 1.5, 0.6),
      alphaTest: 0.5,
      side: DoubleSide,
    });
    const post = this.material({ color: 0x8a7458, roughness: 1 });
    for (const side of [1, -1] as const) {
      const hedges: BufferGeometry[] = [];
      const stems: BufferGeometry[] = [];
      const posts: BufferGeometry[] = [];
      const from = VINES_FROM + HEADLAND;
      const length = VINES_TO - from;
      const middle = side * (from + length / 2);
      const slope = Math.atan(0.05) * side;
      for (let z = -BLOCK / 2 + ROW_EVERY / 2; z < BLOCK / 2; z += ROW_EVERY) {
        const hedge = new BoxGeometry(length, 1.15, 0.75);
        const uv = hedge.getAttribute('uv') as BufferAttribute;
        for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * length);
        hedge.rotateZ(slope);
        hedge.translate(middle, rise(middle) + 0.6 + 1.15 / 2, z);
        hedges.push(hedge);
        const stem = new PlaneGeometry(length, 0.62);
        const suv = stem.getAttribute('uv') as BufferAttribute;
        for (let k = 0; k < suv.count; k++) suv.setX(k, suv.getX(k) * length);
        stem.rotateZ(slope);
        stem.translate(middle, rise(middle) + 0.31, z);
        stems.push(stem);
        const end = new BoxGeometry(0.1, 2, 0.1);
        end.translate(side * from, 1, z);
        posts.push(end);
      }
      const hedge = mergeGeometries(hedges)!;
      const stem = mergeGeometries(stems)!;
      const ends = mergeGeometries(posts)!;
      for (const g of [...hedges, ...stems, ...posts]) g.dispose();
      this.disposables.push(hedge, stem, ends);
      for (let offset = 0; offset < LOOP; offset += BLOCK) {
        const winery =
          WINERIES.some(([at, s]) => s === side && Math.abs(offset - at) < 20) ||
          (side < 0 && Math.abs(offset - FARM) < 20);
        if (winery) continue;
        const block = new Group();
        const h = new Mesh(hedge, leaves);
        h.castShadow = true;
        h.receiveShadow = true;
        block.add(h, new Mesh(stem, trunks), new Mesh(ends, post));
        this.group.add(block);
        this.props.push({ mesh: block, offset, every: LOOP, x: 0, rise: 0, near: side > 0 });
      }
    }
  }

  /** The valley oak's parts: a short stout trunk and a broad, spreading olive crown. */
  private prepareOaks(): void {
    this.oakTrunk = new CylinderGeometry(0.45, 0.75, 1, 8);
    this.oakTrunk.translate(0, 0.5, 0);
    this.oakCrowns = [0, 1, 2, 3].map((k) => {
      const r = seeded(1301 + k);
      const parts: BufferGeometry[] = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + r();
        const part = new SphereGeometry(1, 11, 8);
        const size = 0.38 + r() * 0.18;
        part.scale(size, size * 0.7, size);
        part.translate(Math.cos(a) * 0.62, (r() - 0.4) * 0.3, Math.sin(a) * 0.62);
        parts.push(part);
      }
      const top = new SphereGeometry(0.55, 11, 8);
      top.scale(1, 0.7, 1);
      top.translate(0, 0.22, 0);
      parts.push(top);
      const merged = mergeGeometries(parts)!;
      for (const p of parts) p.dispose();
      return merged;
    });
    this.disposables.push(this.oakTrunk, ...this.oakCrowns);
    this.oakBark = this.material({ color: 0x4a4038, roughness: 1 });
    this.oakLeaves = ['#4d5a2c', '#5a6634', '#434f27', '#61703a'].map((c, i) =>
      this.material({ map: this.track(leafTexture(c, 1311 + i)), roughness: 1 }),
    );
  }

  /** A valley oak, `size` metres across its crown. */
  private oak(size: number, seed: number): Group {
    const tree = new Group();
    const height = size * 0.28;
    const t = new Mesh(this.oakTrunk!, this.oakBark!);
    t.scale.set(size / 16, height, size / 16);
    t.castShadow = true;
    const c = new Mesh(this.oakCrowns[seed % 4]!, this.oakLeaves[(seed >> 2) % 4]!);
    c.scale.set(size / 2, size / 2.4, size / 2);
    c.position.y = height + size * 0.16;
    c.rotation.y = seed;
    c.castShadow = true;
    tree.add(t, c);
    return tree;
  }

  /** Oaks scattered over the golden hills above the vineyards, singly and in clumps. */
  private addOaks(): void {
    const random = seeded(1321);
    let k = 0;
    for (const side of [1, -1] as const) {
      for (let offset = 0; offset < LOOP; offset += 6 + random() * 14) {
        const d = VINES_TO + 10 + random() ** 1.6 * 320;
        const x = side * d;
        const tree = this.oak(9 + random() * 9, k++);
        this.group.add(tree);
        this.props.push({ mesh: tree, offset, every: LOOP, x, rise: rise(x), near: side > 0 });
      }
    }
  }

  /**
   * The farmstead on the left: a red barn under a grey metal gambrel roof, its board walls
   * trimmed in white, a sliding door crossed in white and a hay-loft door over it; a white
   * clapboard farmhouse under a dark gable with a deep porch on posts; a lattice farm windmill
   * with its fan and tail vane; a water tank on stilts; and oaks round them.
   */
  private addFarmstead(): void {
    const g = new Group();
    const boards = this.material({ map: this.track(barnTexture()), roughness: 0.95 });
    boards.map!.wrapS = RepeatWrapping;
    boards.map!.wrapT = RepeatWrapping;
    const clapboard = this.material({ map: this.track(clapboardTexture()), roughness: 0.9 });
    clapboard.map!.wrapS = RepeatWrapping;
    clapboard.map!.wrapT = RepeatWrapping;
    const metal = this.material({ color: 0x6e7276, roughness: 0.5, metalness: 0.5 });
    const slate = this.material({ color: 0x3a3c40, roughness: 0.8 });
    const white = this.material({ color: 0xf2efe6, roughness: 0.8 });
    const glass = this.material({ color: 0x26323a, roughness: 0.3 });
    const steel = this.material({ color: 0x9aa0a6, roughness: 0.5, metalness: 0.6 });
    const box = (
      m: MeshStandardMaterial,
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
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    const walls = (
      w: number,
      h: number,
      d: number,
      m: MeshStandardMaterial,
      x: number,
      z: number,
    ) => {
      const wall = new BoxGeometry(w, h, d);
      for (const f of [0, 1]) scaleFaceUv(wall, f, d / 4, h / 4);
      for (const f of [4, 5]) scaleFaceUv(wall, f, w / 4, h / 4);
      wall.translate(x, h / 2, z);
      this.disposables.push(wall);
      const mesh = new Mesh(wall, m);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
    };
    // The barn, its long side to the road, and its gambrel roof.
    const barnW = 11;
    const barnL = 18;
    const barnH = 6.5;
    walls(barnW, barnH, barnL, boards, 0, 0);
    const gambrel = new Shape();
    const half = barnW / 2 + 0.5;
    gambrel.moveTo(-half, 0);
    gambrel.lineTo(half, 0);
    gambrel.lineTo(half * 0.62, 2.6);
    gambrel.lineTo(0, 4.4);
    gambrel.lineTo(-half * 0.62, 2.6);
    gambrel.closePath();
    const roof = new ExtrudeGeometry(gambrel, { depth: barnL + 1, bevelEnabled: false });
    roof.translate(0, barnH, -(barnL + 1) / 2);
    this.disposables.push(roof);
    const r = new Mesh(roof, metal);
    r.castShadow = true;
    g.add(r);
    // Its gable ends in red boards too, trimmed white.
    const end = new ExtrudeGeometry(gambrel, { depth: barnL - 0.2, bevelEnabled: false });
    end.scale(0.92, 0.92, 1);
    end.translate(0, barnH, -(barnL - 0.2) / 2);
    this.disposables.push(end);
    g.add(new Mesh(end, boards));
    // The face to the road: a sliding door crossed in white, a hay-loft door, corner trim.
    const face = barnW / 2 + 0.06;
    box(white, 0.1, 4.6, 5.2, face, 2.3, 0);
    box(boards, 0.12, 4.3, 4.9, face + 0.02, 2.2, 0);
    for (const sign of [1, -1]) {
      const brace = box(white, 0.06, 6.4, 0.22, face + 0.1, 2.2, 0);
      brace.rotation.x = sign * Math.atan(4.9 / 4.3);
    }
    box(white, 0.1, 2, 2.2, face, barnH + 1.4, 0);
    box(glass, 0.12, 1.7, 1.9, face + 0.02, barnH + 1.4, 0);
    for (const z of [-barnL / 2, barnL / 2]) box(white, 0.3, barnH, 0.3, face - 0.1, barnH / 2, z);
    // The farmhouse, nearer the road, its porch facing it.
    const hx = 3;
    const hz = barnL / 2 + 11;
    walls(8, 6, 11, clapboard, hx, hz);
    const gable = new Shape();
    gable.moveTo(-4.6, 0);
    gable.lineTo(4.6, 0);
    gable.lineTo(0, 3);
    gable.closePath();
    const house = new ExtrudeGeometry(gable, { depth: 12, bevelEnabled: false });
    house.translate(hx, 6, hz - 6);
    this.disposables.push(house);
    g.add(new Mesh(house, slate));
    box(white, 2.6, 0.25, 10, hx + 4 + 1.3, 3, hz);
    box(white, 2.6, 0.3, 10, hx + 4 + 1.3, 0.15, hz);
    for (const z of [-4.8, -1.6, 1.6, 4.8]) box(white, 0.18, 2.8, 0.18, hx + 6.4, 1.5, hz + z);
    for (const z of [-3.2, 0, 3.2]) {
      box(white, 0.08, 1.6, 1.2, hx + 4.04, 1.5, hz + z);
      box(glass, 0.1, 1.4, 1.0, hx + 4.06, 1.5, hz + z);
      box(white, 0.08, 1.4, 1.1, hx + 4.04, 4.4, hz + z);
      box(glass, 0.1, 1.2, 0.9, hx + 4.06, 4.4, hz + z);
    }
    box(slate, 0.7, 1.8, 0.7, hx - 2, 9, hz + 2.5);
    // The windmill behind the barn: four legs leaning in to a platform, its fan and tail vane.
    const wx = -6;
    const wz = -barnL / 2 - 6;
    const tall = 13;
    for (const [lx, lz] of [
      [-1.4, -1.4],
      [1.4, -1.4],
      [-1.4, 1.4],
      [1.4, 1.4],
    ] as const) {
      const leg = box(steel, 0.12, tall + 0.3, 0.12, wx + lx / 2, tall / 2, wz + lz / 2);
      leg.rotation.z = -lx * 0.05;
      leg.rotation.x = lz * 0.05;
    }
    for (let y = 2; y < tall; y += 3) box(steel, 2.8 - y * 0.16, 0.06, 0.06, wx, y, wz);
    const fan = new Group();
    for (let k = 0; k < 18; k++) {
      const blade = new Mesh(this.unit, steel);
      blade.scale.set(0.05, 1.5, 0.35);
      blade.position.y = 0.95;
      const arm = new Group();
      arm.add(blade);
      arm.rotation.x = (k / 18) * Math.PI * 2;
      fan.add(arm);
    }
    fan.position.set(wx + 0.6, tall + 0.4, wz);
    g.add(fan);
    box(steel, 0.05, 1.1, 1.6, wx - 1.7, tall + 0.4, wz);
    box(steel, 2.2, 0.08, 0.08, wx - 0.6, tall + 0.4, wz);
    // The water tank on its stilts beside the barn.
    const tank = new CylinderGeometry(1.6, 1.6, 3.2, 18);
    this.disposables.push(tank);
    const t = new Mesh(tank, steel);
    t.position.set(-3, 5.6, barnL / 2 + 3);
    t.castShadow = true;
    g.add(t);
    for (const [lx, lz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      box(steel, 0.12, 4, 0.12, -3 + lx * 1.1, 2, barnL / 2 + 3 + lz * 1.1);
    }
    // Oaks round the farmstead.
    for (const [ox, oz, size] of [
      [-12, 6, 17],
      [9, -barnL / 2 - 4, 15],
      [-4, hz + 9, 14],
    ] as const) {
      const tree = this.oak(size, Math.round(ox * 3 + oz));
      tree.position.set(ox, 0, oz);
      g.add(tree);
    }
    this.group.add(g);
    this.props.push({ mesh: g, offset: FARM, every: LOOP, x: FARM_X, rise: 0 });
  }

  /**
   * The harvest: crews of pickers in sun hats working down the gaps between the vine rows, yellow
   * lug boxes at their feet and stacked full of grapes at the row ends, and with each crew a
   * narrow vineyard tractor hauling a gondola heaped with dark grapes.
   */
  private addHarvest(): void {
    const random = seeded(1701);
    const brim = new CylinderGeometry(0.3, 0.3, 0.03, 14);
    const crown = new CylinderGeometry(0.12, 0.14, 0.12, 12);
    crown.translate(0, 0.07, 0);
    const hat = mergeGeometries([brim, crown])!;
    brim.dispose();
    crown.dispose();
    const lug = new BoxGeometry(0.55, 0.3, 0.38);
    lug.translate(0, 0.15, 0);
    const wheel = new CylinderGeometry(0.45, 0.45, 0.3, 14);
    wheel.rotateX(Math.PI / 2);
    const small = new CylinderGeometry(0.3, 0.3, 0.22, 12);
    small.rotateX(Math.PI / 2);
    this.disposables.push(hat, lug, wheel, small);
    const straw = this.material({ color: 0xd8c48a, roughness: 1 });
    const yellow = this.material({ color: 0xf2c230, roughness: 0.7 });
    const grapes = this.material({ map: this.track(grapeTexture()), roughness: 0.6 });
    const green = this.material({ color: 0x2f6a3a, roughness: 0.5, metalness: 0.2 });
    const red = this.material({ color: 0xb8322a, roughness: 0.6 });
    const tyre = this.material({ color: 0x1c1c1c, roughness: 0.95 });
    const box = (
      g: Group,
      m: MeshStandardMaterial,
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
      mesh.castShadow = true;
      g.add(mesh);
    };
    CREWS.forEach(([side, block, out], c) => {
      // The gaps between the rows lie on the block's 2.5 m marks.
      const gaps = [2, 4, 6, 7].map((k) => -BLOCK / 2 + k * ROW_EVERY);
      for (let k = 0; k < 4 + (c % 3); k++) {
        const z = gaps[k % gaps.length]!;
        const x = side * (out + random() * 7);
        const offset = block - z;
        this.pickers.push({
          offset,
          x,
          rise: rise(x),
          heading: side > 0 ? Math.PI / 2 : -Math.PI / 2,
          phase: random() * 6,
        });
        const h = new Group();
        const top = new Mesh(hat, straw);
        top.position.y = 1.62;
        top.castShadow = true;
        h.add(top);
        // A lug box or two at their feet, one of them full.
        const filled = new Group();
        box(filled, yellow, 0.55, 0.3, 0.38, side * 0.7, 0.15, 0);
        box(filled, grapes, 0.5, 0.06, 0.33, side * 0.7, 0.31, 0);
        h.add(filled);
        this.group.add(h);
        this.props.push({ mesh: h, offset, every: LOOP, x, rise: rise(x), near: side > 0 });
      }
      // The tractor in the next gap, its gondola heaped with grapes, and full lugs at the row end.
      const z = -BLOCK / 2 + 5 * ROW_EVERY;
      // Two more carry full lugs along the headland to the tractor.
      for (const dz of [2.6, -3.4]) {
        const hx = side * (VINES_FROM + 1.2 + random());
        this.pickers.push({
          offset: block - dz,
          x: hx,
          rise: 0,
          heading: dz > 0 ? 0 : Math.PI,
          phase: random() * 6,
        });
        const h = new Group();
        const top = new Mesh(hat, straw);
        top.position.y = 1.62;
        h.add(top);
        box(h, yellow, 0.55, 0.3, 0.38, 0, 1.05, -0.32);
        box(h, grapes, 0.5, 0.06, 0.33, 0, 1.21, -0.32);
        this.group.add(h);
        this.props.push({
          mesh: h,
          offset: block - dz,
          every: LOOP,
          x: hx,
          rise: 0,
          near: side > 0,
        });
      }
      const x = side * (VINES_FROM + 2.2);
      const tractor = new Group();
      // It stands on the headland, pointing along the road.
      tractor.rotation.y = Math.PI / 2;
      const facing = side > 0 ? -1 : 1;
      box(tractor, green, 1.9, 0.9, 1.1, 0, 0.95, 0);
      box(tractor, green, 0.8, 0.5, 1.0, facing * 0.6, 1.6, 0);
      box(tractor, tyre, 0.08, 1.3, 0.08, -facing * 0.35, 2.2, 0.45);
      box(tractor, tyre, 0.08, 1.3, 0.08, -facing * 0.35, 2.2, -0.45);
      box(tractor, tyre, 0.08, 0.08, 1.0, -facing * 0.35, 2.85, 0);
      for (const [wx, w] of [
        [-facing * 0.5, wheel],
        [facing * 0.75, small],
      ] as const) {
        for (const wz of [-0.62, 0.62]) {
          const m = new Mesh(w, tyre);
          m.position.set(wx, w === wheel ? 0.45 : 0.3, wz);
          tractor.add(m);
        }
      }
      // The gondola behind it.
      const gx = -facing * 2.9;
      box(tractor, red, 2.8, 0.9, 1.25, gx, 1.0, 0);
      box(tractor, grapes, 2.7, 0.2, 1.15, gx, 1.5, 0);
      for (const wz of [-0.68, 0.68]) {
        const m = new Mesh(small, tyre);
        m.position.set(gx, 0.3, wz);
        tractor.add(m);
      }
      this.group.add(tractor);
      this.props.push({
        mesh: tractor,
        offset: block - z,
        every: LOOP,
        x,
        rise: 0,
        near: side > 0,
      });
      const stack = new Group();
      for (let k = 0; k < 6; k++) {
        box(stack, yellow, 0.55, 0.3, 0.38, (k % 3) * 0.6, 0.15 + Math.floor(k / 3) * 0.32, 0);
        box(stack, grapes, 0.5, 0.04, 0.33, (k % 3) * 0.6, 0.3 + Math.floor(k / 3) * 0.32, 0);
      }
      this.group.add(stack);
      const sx = side * (VINES_FROM + 0.5);
      this.props.push({
        mesh: stack,
        offset: block - z - 1.2,
        every: LOOP,
        x: sx,
        rise: 0,
        near: side > 0,
      });
    });
  }

  /**
   * Hot-air balloons over the valley, high in the view ahead: teardrop envelopes in bright
   * striped gores, a burner frame under each and a wicker basket on its ropes. They drift slowly
   * up the valley with the horizon, never nearer than 150 m.
   */
  private addBalloons(): void {
    const profile: Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      // A teardrop: full and round above, tapering to the mouth.
      const r = Math.sin(a) * (a < Math.PI / 2 ? 1 : 0.55 + 0.45 * Math.sin(a));
      profile.push(new Vector2(Math.max(r * 9, 1.6 * (i / 16)), 9 - (i / 16) * 20));
    }
    profile.reverse();
    const envelope = new LatheGeometry(profile, 24);
    const basket = new BoxGeometry(2, 1.4, 2);
    const rope = new CylinderGeometry(0.05, 0.05, 3.6, 4);
    this.disposables.push(envelope, basket, rope);
    const wicker = this.material({ color: 0x8a6438, roughness: 1 });
    const cord = this.material({ color: 0x3a3a3a });
    const looks: readonly (readonly string[])[] = [
      ['#d8283a', '#f2c230', '#2f5d8a'],
      ['#f28a2a', '#ffffff', '#3e8a4a'],
      ['#7a1f3d', '#f2e4c6'],
      ['#2f9ad0', '#f2c230', '#d8283a', '#ffffff'],
      ['#3e5a2a', '#e8b04a'],
    ];
    const places = [
      [-48, 58, 110],
      [55, 110, -180],
      [-25, 140, -330],
      [120, 90, -420],
      [-150, 120, -260],
    ] as const;
    places.forEach(([x, y, z], i) => {
      const g = new Group();
      const e = new Mesh(
        envelope,
        this.material({
          map: this.track(goresTexture(looks[i]!)),
          side: DoubleSide,
          roughness: 0.6,
          fog: false,
        }),
      );
      e.castShadow = true;
      const b = new Mesh(basket, wicker);
      b.position.y = -15.5;
      g.add(e, b);
      for (const [rx, rz] of [
        [-0.9, -0.9],
        [0.9, -0.9],
        [-0.9, 0.9],
        [0.9, 0.9],
      ] as const) {
        const r = new Mesh(rope, cord);
        r.position.set(rx, -13, rz);
        g.add(r);
      }
      g.rotation.y = i;
      g.scale.setScalar(1.5);
      this.horizon.add(g);
      this.balloons.push({ mesh: g, x, y, z, phase: i * 1.7 });
    });
  }

  /** The terrace guests and the pickers, drawn as the kit's figures. */
  private addPeople(): void {
    this.guestFigures = new Figures(this.group, this.disposables, this.guests.length, LOCALS, 1711);
    this.pickerFigures = new Figures(
      this.group,
      this.disposables,
      this.pickers.length,
      PICKERS,
      1721,
    );
  }

  /**
   * The stone wineries beside the road: a long fieldstone hall under a terracotta gable, arched
   * doors and windows on the face to the road, a tasting terrace in front set with white
   * umbrellas and tables, spreading oaks either end, and in some a stack of oak barrels.
   */
  private addWineries(): void {
    const stone = this.material({ map: this.track(fieldstoneTexture()), roughness: 1 });
    stone.map!.wrapS = RepeatWrapping;
    stone.map!.wrapT = RepeatWrapping;
    const tiles = this.material({ map: this.track(tileTexture()), roughness: 0.85 });
    tiles.map!.wrapS = RepeatWrapping;
    tiles.map!.wrapT = RepeatWrapping;
    const arch = this.material({
      map: this.track(archTexture()),
      alphaTest: 0.5,
      roughness: 0.6,
    });
    const flags = this.material({ map: this.repeat(flagstoneTexture(), 2, 2), roughness: 0.95 });
    const canvas = this.material({ color: 0xf6f2e8, side: DoubleSide, roughness: 0.8 });
    const wood = this.material({ color: 0x6a4a30, roughness: 0.9 });
    const barrel = this.material({ map: this.track(barrelTexture()), roughness: 0.8 });
    const umbrella = new ConeGeometry(1.4, 0.6, 8, 1, true);
    const pole = new CylinderGeometry(0.03, 0.03, 2.4, 6);
    pole.translate(0, 1.2, 0);
    const table = new CylinderGeometry(0.5, 0.5, 0.05, 12);
    const cask = new CylinderGeometry(0.42, 0.42, 0.95, 14);
    cask.rotateZ(Math.PI / 2);
    this.disposables.push(umbrella, pole, table, cask);
    WINERIES.forEach(([offset, side, x, barrels], w) => {
      const random = seeded(1401 + w);
      const g = new Group();
      const length = 30 + random() * 8;
      const depth = 13;
      const height = 6.5 + random() * 1.5;
      const face = -side * (depth / 2);
      const wall = new BoxGeometry(depth, height, length);
      for (const f of [0, 1]) scaleFaceUv(wall, f, length / 6, height / 6);
      for (const f of [4, 5]) scaleFaceUv(wall, f, depth / 6, height / 6);
      wall.translate(0, height / 2, 0);
      this.disposables.push(wall);
      const hall = new Mesh(wall, stone);
      hall.castShadow = true;
      hall.receiveShadow = true;
      g.add(hall);
      // The gable roof, its ridge along the hall.
      const pitch = new Shape();
      pitch.moveTo(-depth / 2 - 0.8, 0);
      pitch.lineTo(depth / 2 + 0.8, 0);
      pitch.lineTo(0, 3.6);
      pitch.closePath();
      const roof = new ExtrudeGeometry(pitch, { depth: length + 1.6, bevelEnabled: false });
      roof.translate(0, height, -(length + 1.6) / 2);
      const ruv = roof.getAttribute('uv') as BufferAttribute;
      for (let k = 0; k < ruv.count; k++) ruv.setXY(k, ruv.getX(k) / 3, ruv.getY(k) / 3);
      this.disposables.push(roof);
      const r = new Mesh(roof, tiles);
      r.castShadow = true;
      g.add(r);
      // Arched doors on the ground floor, arched windows over them, on the face to the road.
      const opening = new PlaneGeometry(1, 1);
      this.disposables.push(opening);
      for (let z = -length / 2 + 3; z < length / 2 - 2; z += 4.2) {
        for (const [w2, h2, y] of [
          [2.2, 3.2, 1.6],
          [1.3, 1.9, height - 1.7],
        ] as const) {
          const a = new Mesh(opening, arch);
          a.scale.set(w2, h2, 1);
          a.position.set(face - side * 0.03, y, z);
          a.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          g.add(a);
        }
      }
      // The tasting terrace in front, its tables under white umbrellas.
      const terrace = new Mesh(this.unit, flags);
      terrace.scale.set(7, 0.3, length * 0.8);
      terrace.position.set(face - side * 3.6, 0.15, 0);
      terrace.receiveShadow = true;
      g.add(terrace);
      for (let n = 0, z = -length * 0.32; z <= length * 0.33; n++, z += 4.4) {
        const spot = new Group();
        const p = new Mesh(pole, wood);
        const u = new Mesh(umbrella, canvas);
        u.position.y = 2.5;
        u.castShadow = true;
        const t = new Mesh(table, wood);
        t.position.y = 0.75;
        const leg = new Mesh(pole, wood);
        leg.scale.set(2, 0.3, 2);
        spot.add(p, u, t, leg);
        const lx = face - side * (2.2 + (n % 2) * 2.4);
        spot.position.set(lx, 0.3, z);
        g.add(spot);
        // Two or three guests stand round each table.
        const around = 2 + ((n + w) % 2);
        for (let k = 0; k < around; k++) {
          const a = (k / around) * Math.PI * 2 + n;
          this.guests.push({
            offset: offset - (z + Math.cos(a) * 0.75),
            x: side * x + lx + Math.sin(a) * 0.75,
            rise: 0.3,
            heading: a + Math.PI,
            phase: random() * 6,
          });
        }
      }
      if (barrels) {
        for (let k = 0; k < 9; k++) {
          const row = k < 5 ? 0 : 1;
          const c = new Mesh(cask, barrel);
          c.rotation.y = Math.PI / 2;
          c.position.set(
            face - side * 0.6,
            0.42 + row * 0.8,
            length / 2 - 1 - (row ? 0.5 : 0) - (k - row * 5) * 0.95,
          );
          c.castShadow = true;
          g.add(c);
        }
      }
      for (const end of [-1, 1]) {
        const tree = this.oak(15 + random() * 6, w * 2 + end + 7);
        tree.position.set(face - side * 4, 0, end * (length / 2 + 4));
        g.add(tree);
      }
      this.group.add(g);
      this.props.push({ mesh: g, offset, every: LOOP, x: side * x, rise: 0, near: side > 0 });
    });
  }

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
      this.props.push({ mesh: banner, offset: 150 + i * 250, every: LOOP, x: 0, rise: 0 });
    });
  }

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
          rise: 0,
        });
      }
    }
  }

  /** The ride's village: pop-up tents on the headland, each turned a little to the road. */
  private addTents(): void {
    const tents = new PopupTents(this.disposables, this.track);
    TENTS.forEach(([text, fill, ink, offset, side], i) => {
      const tent = tents.make(text, fill, ink);
      tent.rotation.y = (i % 3) * 0.1 - 0.1;
      this.group.add(tent);
      this.props.push({
        mesh: tent,
        offset,
        every: LOOP,
        x: side * (VINES_FROM + HEADLAND / 2),
        rise: 0,
        near: side > 0,
      });
    });
  }

  /** What the fans have painted on the road. */
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
        rise: 0,
      });
    });
  }

  /**
   * Ahead: the knoll to the right of the road, striped with vines, and on it the mission-style
   * winery, its cream stucco hall under red tiles with an arcade along the front, its bell tower
   * with an open belfry and a tiled pyramid roof, cypresses lining the drive; golden hills either
   * side and the blue ridges of the Mayacamas beyond, hazed by hand.
   */
  private addHorizon(): void {
    const haze = new Color(HAZE);
    const far = this.horizon;
    // The knoll and the mission stand nearer than the hills and the ridges.
    const h = new Group();
    h.position.z = HORIZON_AHEAD - MISSION_AT;
    far.add(h);
    // The knoll, its vine rows in stripes across it.
    const knoll = new SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(knoll);
    const striped = hazedMaterial(this.disposables, haze, 0xffffff, 0.08, {
      map: this.track(knollTexture()),
    });
    const k = new Mesh(knoll, striped);
    k.scale.set(80, 19, 70);
    k.position.set(90, -1, -10);
    k.receiveShadow = true;
    h.add(k);
    const top = (x: number, z: number) => {
      const dx = (x - 90) / 80;
      const dz = (z + 10) / 70;
      return -1 + 19 * Math.sqrt(Math.max(0, 1 - dx * dx - dz * dz));
    };
    // The mission winery.
    const stucco = hazedMaterial(this.disposables, haze, 0xf0e2c4, 0.1, {
      map: this.track(stuccoTexture()),
    });
    const tile = hazedMaterial(this.disposables, haze, 0xb4573a, 0.12);
    const shade = hazedMaterial(this.disposables, haze, 0x3a2a22, 0.15);
    const hallX = 50;
    const base = top(hallX, -12) - 1.5;
    const box = (
      m: MeshStandardMaterial,
      w: number,
      ht: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, ht, d);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      h.add(mesh);
      return mesh;
    };
    // The hall, end on to the road, and its arcade.
    // Its walls run down into the knoll where the ground falls away.
    box(stucco, 46, 16, 14, hallX, base + 2, -12);
    const gable = new Shape();
    gable.moveTo(-8, 0);
    gable.lineTo(8, 0);
    gable.lineTo(0, 4.5);
    gable.closePath();
    const roof = new ExtrudeGeometry(gable, { depth: 48, bevelEnabled: false });
    roof.rotateY(Math.PI / 2);
    roof.translate(hallX - 24, base + 10, -12);
    this.disposables.push(roof);
    h.add(new Mesh(roof, tile));
    const front = new Shape();
    front.moveTo(-23, 0);
    front.lineTo(23, 0);
    front.lineTo(23, 5.5);
    front.lineTo(-23, 5.5);
    front.closePath();
    for (let i = 0; i < 9; i++) {
      const cx = -20 + i * 5;
      const hole = new Shape();
      hole.moveTo(cx - 1.7, 0);
      hole.lineTo(cx + 1.7, 0);
      hole.lineTo(cx + 1.7, 3.2);
      hole.absarc(cx, 3.2, 1.7, 0, Math.PI, false);
      hole.closePath();
      front.holes.push(hole);
    }
    const arcade = new ExtrudeGeometry(front, { depth: 0.8, bevelEnabled: false });
    arcade.translate(hallX, base, -12 + 7 + 3);
    this.disposables.push(arcade);
    h.add(new Mesh(arcade, stucco));
    box(shade, 46, 5.4, 0.2, hallX, base + 2.7, -12 + 7.05);
    box(tile, 47, 0.5, 4.2, hallX, base + 5.6, -12 + 9);
    // The bell tower at the hall's road end.
    const towerX = 22;
    const towerZ = -6;
    const foot = top(towerX, towerZ) - 2;
    box(stucco, 7, 26, 7, towerX, foot + 11, towerZ);
    box(stucco, 8, 0.6, 8, towerX, foot + 22.3 + 2, towerZ);
    for (const [dx, dz, ry] of [
      [0, 3.52, 0],
      [-3.52, 0, -Math.PI / 2],
      [0, -3.52, Math.PI],
      [3.52, 0, Math.PI / 2],
    ] as const) {
      const opening = new Mesh(new PlaneGeometry(3, 4.6), shade);
      this.disposables.push(opening.geometry);
      opening.position.set(towerX + dx, foot + 20.5, towerZ + dz);
      opening.rotation.y = ry;
      h.add(opening);
      const lower = new Mesh(new PlaneGeometry(1.2, 2), shade);
      this.disposables.push(lower.geometry);
      lower.position.set(towerX + dx * 1.003, foot + 11, towerZ + dz * 1.003);
      lower.rotation.y = ry;
      h.add(lower);
    }
    const bell = hazedMaterial(this.disposables, haze, 0xb08a3a, 0.1, { metalness: 0.6 });
    const b = new Mesh(this.ball, bell);
    b.scale.set(1, 1.2, 1);
    b.position.set(towerX, foot + 20.6, towerZ + 3.3);
    h.add(b);
    const cap = new ConeGeometry(5.8, 5.5, 4);
    cap.rotateY(Math.PI / 4);
    this.disposables.push(cap);
    const c = new Mesh(cap, tile);
    c.position.set(towerX, foot + 24.6 + 2.75, towerZ);
    h.add(c);
    box(shade, 0.25, 2.4, 0.25, towerX, foot + 31.5, towerZ);
    box(shade, 1.3, 0.25, 0.25, towerX, foot + 31.9, towerZ);
    // Cypresses up the drive to the tower.
    const cypress = new ConeGeometry(1, 1, 9);
    cypress.translate(0, 0.5, 0);
    this.disposables.push(cypress);
    const dark = hazedMaterial(this.disposables, haze, 0x26361e, 0.12);
    for (let i = 0; i < 10; i++) {
      // The drive climbs from the road's side to the tower's foot.
      const t = i / 9;
      for (const across of [-3, 3]) {
        const x = 9 + 10 * t + across * 0.97;
        const z = 44 - 42 * t + across * 0.23;
        const tree = new Mesh(cypress, dark);
        tree.scale.set(1.1, 10 + (i % 3) * 1.5, 1.1);
        tree.position.set(x, Math.max(top(x, z), 0) - 0.5, z);
        h.add(tree);
      }
    }
    // Oaks round the knoll's foot and over the hills.
    const random = seeded(1501);
    for (let i = 0; i < 26; i++) {
      const x = 40 + random() * 160;
      const z = -40 - random() * 90;
      const tree = this.oak(14 + random() * 8, i);
      tree.position.set(x, Math.max(top(x, z), 0) - 0.5, z);
      h.add(tree);
    }
    // The golden hills either side, rounded, and the Mayacamas' blue ridges beyond, at the
    // horizon's distance.
    const hill = new SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(hill);
    const golds = [0xc9a456, 0xb8954c, 0xd2ae62].map((c, i) =>
      hazedMaterial(this.disposables, haze, c, 0.22 + i * 0.06),
    );
    const hr = seeded(1511);
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (140 + hr() * 600);
      const m = new Mesh(hill, golds[i % 3]!);
      m.scale.set(150 + hr() * 160, 40 + hr() * 50, 120 + hr() * 80);
      m.position.set(x, rise(x) - 6, -250 - hr() * 300);
      far.add(m);
      for (let j = 0; j < 6; j++) {
        const ox = (hr() - 0.5) * m.scale.x;
        const oz = (hr() - 0.5) * m.scale.z * 0.5 + m.scale.z * 0.4;
        const f = 1 - (ox / m.scale.x) ** 2 - (oz / m.scale.z) ** 2;
        if (f <= 0) continue;
        const tree = this.oak(18 + hr() * 8, i + j);
        tree.position.set(x + ox, m.position.y + m.scale.y * Math.sqrt(f) - 2, m.position.z + oz);
        far.add(tree);
      }
    }
    const ridges = [
      { z: -1300, height: 260, colour: 0x7a8a88, amount: 0.42, seed: 1521 },
      { z: -2100, height: 420, colour: 0x8a9aa8, amount: 0.55, seed: 1523 },
    ];
    for (const ridge of ridges) {
      const rr = seeded(ridge.seed);
      const shape = new Shape();
      shape.moveTo(-4000, -50);
      for (let x = -4000; x <= 4000; x += 160) {
        const y = ridge.height * (0.45 + 0.35 * Math.sin(x / 700 + ridge.seed) + rr() * 0.2);
        shape.lineTo(x, y);
      }
      shape.lineTo(4000, -50);
      shape.closePath();
      const g = new ExtrudeGeometry(shape, { depth: 20, bevelEnabled: false, curveSegments: 1 });
      this.disposables.push(g);
      const m = new Mesh(g, hazedMaterial(this.disposables, haze, ridge.colour, ridge.amount));
      m.position.z = ridge.z;
      far.add(m);
    }
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

function shoulderTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#c2a878', 1601);
    const random = seeded(1603);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(110,85,50,0.25)' : 'rgba(245,230,200,0.3)';
      g.fillRect(random() * 256, random() * 256, 2, 2);
    }
  });
}

function soilTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#9a7a52', 1607);
    const random = seeded(1609);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(70,50,30,0.3)' : 'rgba(210,180,130,0.3)';
      g.fillRect(random() * 256, random() * 256, 3, 2);
    }
    // Straw and cover crop between the rows.
    for (let i = 0; i < 260; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(200,170,90,0.35)' : 'rgba(110,130,60,0.3)';
      g.fillRect(random() * 256, random() * 256, 1, 4);
    }
  });
}

function dryGrassTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#c9a458', 1613);
    const random = seeded(1617);
    for (let i = 0; i < 600; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(150,110,50,0.3)' : 'rgba(240,215,150,0.3)';
      g.fillRect(random() * 256, random() * 256, 2, 5);
    }
  });
}

/** A vine row's leaves: layered greens, lit on top, with clusters of dark grapes here and there. */
function vineTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#55802f', 1621);
    const random = seeded(1623);
    for (let i = 0; i < 320; i++) {
      const y = random() * 128;
      const light = y < 40 ? 0.35 : 0.15;
      g.fillStyle =
        random() < 0.45 ? `rgba(20,45,15,${0.25 + random() * 0.2})` : `rgba(170,205,90,${light})`;
      g.beginPath();
      g.arc(random() * 128, y, 2 + random() * 4, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = 'rgba(60,25,60,0.8)';
      const x = random() * 128;
      const y = 80 + random() * 44;
      for (let j = 0; j < 6; j++) g.fillRect(x + (j % 2) * 3, y + j * 2, 3, 3);
    }
  });
}

/** The gnarled trunks under a vine row, every 1.5 m, and the wire along them. */
function trunkTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#4a3a2a';
    g.beginPath();
    g.moveTo(28, 64);
    g.lineTo(26, 30);
    g.lineTo(30, 6);
    g.lineTo(38, 6);
    g.lineTo(36, 30);
    g.lineTo(38, 64);
    g.closePath();
    g.fill();
    g.fillRect(0, 4, 64, 2);
  });
}

function fieldstoneTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#8a7a64';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(1631);
    const tones = ['#b8a48a', '#a08c70', '#c9b89c', '#94806a', '#ad9a7c', '#bfae8e'];
    for (let y = 0; y < 256; y += 20) {
      for (let x = -(random() * 20); x < 256; x += 22 + random() * 18) {
        g.fillStyle = tones[Math.floor(random() * tones.length)]!;
        g.beginPath();
        g.ellipse(x + 12, y + 10, 10 + random() * 5, 8 + random() * 2, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

function tileTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b4573a', 1637);
    for (let x = 0; x < 128; x += 16) {
      const shade = g.createLinearGradient(x, 0, x + 16, 0);
      shade.addColorStop(0, 'rgba(60,20,10,0.35)');
      shade.addColorStop(0.5, 'rgba(255,200,170,0.15)');
      shade.addColorStop(1, 'rgba(60,20,10,0.35)');
      g.fillStyle = shade;
      g.fillRect(x, 0, 16, 128);
    }
    g.fillStyle = 'rgba(60,20,10,0.3)';
    for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 3);
  });
}

/** An arched opening: dark glass or an oak door under a round head, in a pale stone surround. */
function archTexture(): CanvasTexture {
  return canvasTexture(64, 96, (g) => {
    const shape = (inset: number) => {
      g.beginPath();
      g.moveTo(inset, 96);
      g.lineTo(inset, 32);
      g.arc(32, 32, 32 - inset, Math.PI, 0);
      g.lineTo(64 - inset, 96);
      g.closePath();
    };
    g.fillStyle = '#d9cbb0';
    shape(0);
    g.fill();
    g.fillStyle = '#2a211c';
    shape(6);
    g.fill();
    g.fillStyle = 'rgba(255,220,160,0.25)';
    g.fillRect(31, 26, 2, 70);
  });
}

function flagstoneTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#cbb894', 1641);
    g.strokeStyle = 'rgba(90,70,50,0.45)';
    g.lineWidth = 2;
    const random = seeded(1643);
    for (let i = 0; i < 10; i++) {
      g.strokeRect(random() * 100, random() * 100, 20 + random() * 30, 20 + random() * 30);
    }
  });
}

/** A balloon's envelope: vertical gores in its colours, a band round the equator. */
function goresTexture(colours: readonly string[]): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    const gores = 24;
    for (let i = 0; i < gores; i++) {
      g.fillStyle = colours[i % colours.length]!;
      g.fillRect((i / gores) * 256, 0, 256 / gores + 1, 128);
    }
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(0, 40, 256, 6);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < gores; i++) g.fillRect((i / gores) * 256, 0, 1, 128);
  });
}

/** Grapes heaped in a gondola or a lug: dark purple berries, some catching the light. */
function grapeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#3a1f3e', 1731);
    const random = seeded(1733);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = random() < 0.6 ? 'rgba(90,50,100,0.8)' : 'rgba(170,140,190,0.6)';
      g.beginPath();
      g.arc(random() * 64, random() * 64, 2 + random() * 2, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** A barn's red vertical boards, weathered, with dark gaps between them. */
function barnTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#9a2a22', 1801);
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = 'rgba(40,10,8,0.55)';
      g.fillRect(x, 0, 2, 128);
      g.fillStyle = 'rgba(255,190,170,0.08)';
      g.fillRect(x + 3, 0, 5, 128);
    }
  });
}

/** A farmhouse's white clapboard, a shadow line under each board. */
function clapboardTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#f0ece2', 1811);
    g.fillStyle = 'rgba(90,80,70,0.3)';
    for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 128, 2);
  });
}

function barrelTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#8a5a34', 1647);
    g.fillStyle = '#2a2a2a';
    for (const y of [8, 22, 40, 54]) g.fillRect(0, y, 64, 3);
  });
}

function stuccoTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#f2e4c6', 1651));
}

/** The knoll's vines: green rows in stripes over warm soil. */
function knollTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#a3845a';
    g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 6) {
      g.fillStyle = x % 12 ? '#5a7f32' : '#4d7029';
      g.fillRect(x, 0, 4, 256);
    }
  });
}

function leafTexture(colour: string, seed: number): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, colour, seed);
    const random = seeded(seed + 1);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '20,25,10' : '210,215,150'},${0.12 + random() * 0.2})`;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 2 + random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}
