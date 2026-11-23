// Venice Beach Boardwalk's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// the bike path beside Ocean Front Walk on a late afternoon. On the right the boardwalk, its
// vendors' stalls, skaters and street performers, tall fan palms and low stucco shops painted
// with murals; on the left the sand with Muscle Beach, the basketball courts, the skate park,
// lifeguard towers and the Pacific; ahead the Santa Monica Pier's Ferris wheel turns over the
// bay under the mountains.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, figures, barriers,
// banners and road paint of world-kit.ts.
import type { BufferAttribute } from 'three/webgpu';
import {
  BoxGeometry,
  type CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three/webgpu';
import {
  barrierBannerTexture,
  type BannerPanel,
  canvasTexture,
  clothBannerTexture,
  dashTexture,
  FeatherFlags,
  type FeatherWord,
  Crowd,
  Figures,
  hazedMaterial,
  loopMetres,
  paintTexture,
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
/** Race barriers line both sides of the bike path; fans stand behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 5.9;
/** On the right: the boardwalk, its palms and stalls, then the shops' fronts at FRONTAGE. */
const PALMS_RIGHT = 7.2;
const STALLS = 14;
const FRONTAGE = 17;
const STOREY = 3.6;
/** On the left: the sand from the path out to the sea at SEA. */
const PALMS_LEFT = -7.5;
const SEA = -84;
/** Skaters roll the boardwalk both ways; performers draw rings of watchers. */
const SKATERS = 20;
const PERFORMERS = 4;
const WATCHERS = 11;
/**
 * Where the first performer's ring and Muscle Beach stand along the loop: early, so the
 * boardwalk's life and the outdoor gym are in view as the warm-up rolls out.
 */
const PERFORMER_FIRST = 118;
const MUSCLE_BEACH = 165;
/** The Santa Monica Pier stands out into the bay ahead, hazed by hand. */
const PIER_AHEAD = 440;
/** The pier's deck reaches across the path from the land, so the wheel stands by the vanishing point. */
const PIER_SHORE = 70;
const HAZE = 0xe8d2b0;

const SKINS = ['#f1c7a5', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26', '#e2b48c'];
const BEACHWEAR: Wardrobe = {
  tops: [
    '#ffffff',
    '#ff5d8f',
    '#2ec4b6',
    '#ffbf3c',
    '#ff7a3d',
    '#7ad0ff',
    '#111111',
    '#c9b8f2',
    '#3fe08a',
    '#f26b5b',
  ],
  bottoms: ['#3b5a7a', '#2f3e5c', '#d9c3a0', '#1e2530', '#f2efe6', '#ff5d8f', '#6b7a3a'],
  skins: SKINS,
};
/** The shops' stucco, and the trim round their windows. */
const PALETTES: readonly { wall: string; trim: string }[] = [
  { wall: '#f2c14e', trim: '#fff6e0' },
  { wall: '#e86a5a', trim: '#fff1e6' },
  { wall: '#5fb8b0', trim: '#f5fbf9' },
  { wall: '#f5efe0', trim: '#4f86c6' },
  { wall: '#9b7fd1', trim: '#fff6e0' },
  { wall: '#ff8fab', trim: '#ffffff' },
  { wall: '#7cc46a', trim: '#fffbe8' },
  { wall: '#4f86c6', trim: '#ffe9b0' },
];
/** What the shops sell, on the boards over their doors: the word, its board and its ink. */
const SIGNS: readonly (readonly [string, string, string])[] = [
  ['SOUVENIRS', '#1b1e24', '#ffbf3c'],
  ['TATTOO', '#111111', '#ff5d8f'],
  ['PIZZA', '#d8283a', '#ffffff'],
  ['T-SHIRTS', '#ffffff', '#4f86c6'],
  ['SUNGLASSES', '#ffbf3c', '#1b1e24'],
  ['HENNA', '#7a3e9d', '#ffffff'],
  ['SURF SHOP', '#2ec4b6', '#ffffff'],
  ['SMOOTHIES', '#3fe08a', '#1b1e24'],
  ['TACOS', '#ff7a3d', '#ffffff'],
  ['SKATES', '#111111', '#3fe08a'],
  ['POSTERS', '#f5efe0', '#d8283a'],
  ['ICE CREAM', '#ff8fab', '#ffffff'],
];
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#ff5d8f', ink: '#ffffff', text: 'VENICE BEACH SPRINTS' },
  { fill: '#2ec4b6', ink: '#1b1e24', text: 'OCEAN FRONT WALK' },
  { fill: '#ffbf3c', ink: '#1b1e24', text: '10 ON 20 OFF' },
  { fill: '#1b1e24', ink: '#ffbf3c', text: 'PALM SPRINT' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#4f86c6', ink: '#ffffff', text: 'DOGTOWN' },
];
const STREET_BANNERS: readonly (readonly [string, string, string])[] = [
  ['VENICE BEACH SPRINTS', '#ff5d8f', '#ffffff'],
  ['OCEAN FRONT WALK', '#2ec4b6', '#1b1e24'],
  ['10 ON · 20 OFF', '#ffbf3c', '#1b1e24'],
];
/** Feather flags along the barriers: their colour and the word down them. */
const FEATHERS: readonly FeatherWord[] = [
  ['SPRINT', '#ff5d8f', '#ffffff'],
  ['VENICE', '#2ec4b6', '#ffffff'],
  ['GO', '#ffbf3c', '#1b1e24'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
];
/** What the fans paint on the path, its colour and how far off the centre line. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['VENICE', '#ffffff', -2.0],
  ['GO GO', '#ff8fab', 2.0],
  ['DOGTOWN', '#ffbf3c', -2.0],
  ['10 ON', '#ffffff', 2.0],
  ['20 OFF', '#7ad0ff', -2.0],
  ['SPRINT', '#ffffff', 2.0],
  ['WATTZUP', '#d7ff3a', -2.0],
  ['BREEZE', '#7ad0ff', 2.0],
];
/** Flat paint reads only in the first 25 m or so ahead, so some must always be that close. */
const ROAD_PAINT_EVERY = 25;

interface Spot {
  readonly x: number;
  readonly offset: number;
  readonly heading: number;
  readonly scale: number;
}

export class VeniceStreet implements SceneStreet {
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
  private skaters: Figures | null = null;
  private boards: InstancedMesh | null = null;
  private performers: Figures | null = null;
  private watchers: Figures | null = null;
  private beachgoers: Figures | null = null;
  private readonly bathers: Spot[] = [];
  private readonly balls: Mesh[] = [];
  private readonly pier = new Group();
  private readonly wheel = new Group();
  private readonly sea = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flagMaterials = ['#ff5d8f', '#2ec4b6', '#ffbf3c', '#ffffff'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly size = new Vector3(1, 1, 1);
  private readonly up = new Vector3(0, 1, 0);

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
      wardrobe: BEACHWEAR,
      flags: this.flagMaterials,
      flagShare: 0.16,
      seeds: [211, 223],
      // The boardwalk crowd stands in knots, with the boardwalk's life showing between them. On the beach side the fans stand
      // one deep in clusters, so the sand and the courts show between them.
      skip: (side, offset, x) =>
        side > 0 ? offset % 24 < 11 : x > -CROWD_NEAR - 0.5 || offset % 20 < 9,
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addShops();
    this.addPalms();
    this.addStalls();
    this.addFeatherFlags();
    this.addStreetBanners(roadHalf);
    this.addVeniceSign();
    this.addRoadPaint();
    this.addMuscleBeach();
    this.addCourts();
    this.addSkatePark();
    this.addLifeguardTowers();
    this.addPeople();
    this.addSea();
    this.addPier();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  /** Lays the boardwalk, the sand, the surf and the barriers over the road's points. */
  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** Moves the street with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(metres);
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    const far = heightAt(1e6);
    this.pier.position.set(0, far, -PIER_AHEAD);
    this.wheel.rotation.z = this.time * 0.06;
    this.sea.position.set(0, far, 0);
    const t = this.time;
    // Skaters roll the boardwalk both ways, faster than the walkers, swaying as they push.
    const skaters = this.skaters;
    const boards = this.boards;
    if (skaters && boards) {
      for (let i = 0; i < SKATERS; i++) {
        const north = i % 3 !== 0;
        const speed = 3.5 + (i % 4) * 0.6;
        const offset = i * (LOOP / SKATERS) + (north ? 1 : -1) * speed * t;
        const metres = along(offset, LOOP);
        const x = 8.6 + (i % 4) * 1.1;
        const y = ground(metres) + KERB + 0.1;
        const heading = north ? 0 : Math.PI;
        const sway = Math.sin(t * 2.4 + i) * 0.12;
        skaters.set(i, x + sway, y, -metres, heading + sway, 1, 0);
        this.turn.setFromAxisAngle(this.up, heading);
        this.spot.set(x + sway, y - 0.06, -metres);
        boards.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      }
      skaters.commit();
      boards.instanceMatrix.needsUpdate = true;
    }
    // Each performer dances in a ring of watchers, three balls juggled over their head.
    const performers = this.performers;
    const watchers = this.watchers;
    if (performers && watchers) {
      for (let p = 0; p < PERFORMERS; p++) {
        const offset = PERFORMER_FIRST + p * (LOOP / PERFORMERS);
        const metres = along(offset, LOOP);
        const y = ground(metres) + KERB;
        const cx = 10.6;
        const bob = Math.abs(Math.sin(t * 3 + p)) * 0.18;
        performers.set(p, cx, y, -metres, Math.sin(t + p) * 0.6, 1.02, bob);
        for (let w = 0; w < WATCHERS; w++) {
          const angle = (w / WATCHERS) * Math.PI * 2 + p;
          const wx = cx + Math.cos(angle) * 2.4;
          const wz = -metres + Math.sin(angle) * 2.4;
          // Each watcher faces the performer in the middle of the ring.
          const heading = Math.atan2(wx - cx, wz + metres);
          watchers.set(p * WATCHERS + w, wx, y, wz, heading, 0.92 + (w % 3) * 0.05);
        }
        for (let b = 0; b < 3; b++) {
          const ball = this.balls[p * 3 + b]!;
          const phase = t * 4 + (b * Math.PI * 2) / 3;
          ball.position.set(
            cx + Math.cos(phase) * 0.35,
            y + 2.2 + Math.abs(Math.sin(phase)) * 0.7,
            -metres,
          );
        }
      }
      performers.commit();
      watchers.commit();
    }
    const beachgoers = this.beachgoers;
    if (beachgoers) {
      this.bathers.forEach((b, i) => {
        const metres = along(b.offset, LOOP);
        const bob = b.scale > 1.04 ? Math.abs(Math.sin(t * 3 + i)) * 0.25 : 0;
        beachgoers.set(i, b.x, ground(metres), -metres, b.heading, b.scale, bob);
      });
      beachgoers.commit();
    }
  }

  /** The bike path's edges, the boardwalk, the sand and the surf, and the barriers. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const concrete = this.material({ map: this.repeat(concreteTexture(), 4, 4), roughness: 0.9 });
    const sand = this.material({ map: this.repeat(sandTexture(), 8, 8), roughness: 1 });
    const surf = this.material({ color: 0xf8f4ea, roughness: 0.6 });
    this.ribbons.add(points, concrete, [
      [FRONTAGE + 2, KERB],
      [r + 0.15, KERB],
      [r, 0],
    ]);
    this.ribbons.add(points, sand, [
      [-r, 0],
      [-r - 0.3, 0.12],
      [-30, 0.08],
      [SEA + 2, -0.15],
    ]);
    this.ribbons.add(points, surf, [
      [SEA + 2.5, -0.13],
      [SEA + 0.5, -0.15],
    ]);
    // The path's yellow centre line, dashed, and its white edges.
    const centre = this.material({
      map: this.repeat(dashTexture('#f2c94c'), 0.12, 8),
      alphaTest: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, centre, [
      [0.06, 0.006],
      [-0.06, 0.006],
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
      const foot = side > 0 ? KERB : 0.1;
      this.ribbons.add(points, banner, [
        [x, foot + 0.08],
        [x, foot + 1.0],
      ]);
      const rail = this.material({ color: 0xd9dde2, metalness: 0.6, roughness: 0.35 });
      this.ribbons.add(points, rail, [
        [x, foot + 1.0],
        [x + 0.04, foot + 1.06],
        [x - 0.04, foot + 1.06],
        [x, foot + 1.0],
      ]);
    }
  }

  /**
   * The shops along the boardwalk: low stucco blocks of one to three storeys in bright paint,
   * each with a shopfront, a sign board and a striped awning, murals on their upper fronts and
   * on the end walls that face the rider, and alleys opening between them. Every fifth is a
   * beach hotel of four or five storeys with its sign on the roof. Upper storeys have balconies,
   * some parapets step up in the middle, and the roofs carry water tanks and air conditioners.
   * Behind them a second row of taller apartment blocks breaks the skyline.
   */
  private addShops(): void {
    const layout = seeded(227);
    const facades = PALETTES.map((p, i) => this.track(facadeTexture(p.wall, p.trim, 229 + i)));
    const fronts = facades.map((map) => this.material({ map, roughness: 0.85 }));
    const walls = PALETTES.map((p) => this.material({ color: p.wall, roughness: 0.9 }));
    const trims = PALETTES.map((p) => this.material({ color: p.trim, roughness: 0.7 }));
    const murals = [0, 1, 2, 3].map((k) =>
      this.material({ map: this.track(muralTexture(k)), roughness: 0.85 }),
    );
    const shopfront = this.track(shopTexture());
    shopfront.wrapS = RepeatWrapping;
    const shop = this.material({ map: shopfront, roughness: 0.35, metalness: 0.15 });
    const roof = this.material({ color: 0xb9b3a8, roughness: 1 });
    const awnings = ['#ff5d8f', '#2ec4b6', '#ffbf3c', '#4f86c6', '#d8283a'].map((c) =>
      this.material({ map: this.track(awningTexture(c)), roughness: 0.8 }),
    );
    let offset = 0;
    let index = 0;
    let last = -1;
    while (offset < LOOP - 6) {
      const width = Math.min(8 + Math.floor(layout() * 4) * 2.5, LOOP - offset);
      let style = Math.floor(layout() * (PALETTES.length - 1));
      if (style >= last) style++;
      last = style;
      const hotel = index % 5 === 2;
      const storeys = hotel ? 4 + Math.floor(layout() * 2) : 1 + Math.floor(layout() * 3);
      const height = storeys * STOREY + 1;
      const depth = 14;
      const shopRow = new Group();
      // The block: its front faces the boardwalk (-x), its end wall the rider (+z).
      const geometry = new BoxGeometry(depth, height, width);
      scaleFaceUv(geometry, 1, width / 4, storeys);
      this.disposables.push(geometry);
      const mural = murals[(index * 3 + style) % murals.length]!;
      const block = new Mesh(geometry, [
        walls[style]!,
        fronts[style]!,
        roof,
        roof,
        mural,
        walls[style]!,
      ]);
      block.position.set(depth / 2, height / 2, 0);
      block.castShadow = true;
      block.receiveShadow = true;
      shopRow.add(block);
      const box = (m: Material, w: number, h: number, d: number, x: number, y: number) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(w, h, d);
        mesh.position.set(x, y + h / 2, 0);
        mesh.castShadow = true;
        shopRow.add(mesh);
        return mesh;
      };
      // The shopfront, its sign board and its awning.
      const storeGeometry = new BoxGeometry(0.4, 3.2, width - 0.6);
      scaleFaceUv(storeGeometry, 1, width / 8, 1);
      this.disposables.push(storeGeometry);
      const store = new Mesh(storeGeometry, shop);
      store.position.set(-0.2, 1.6, 0);
      shopRow.add(store);
      const [word, board, ink] = SIGNS[index % SIGNS.length]!;
      const sign = new Mesh(
        new PlaneGeometry(Math.min(width - 1, 7), 0.9),
        this.material({ map: this.track(clothBannerTexture(word, board, ink)), roughness: 0.6 }),
      );
      this.disposables.push(sign.geometry);
      sign.position.set(-0.45, 3.65, 0);
      sign.rotation.y = -Math.PI / 2;
      shopRow.add(sign);
      const awning = box(awnings[index % awnings.length]!, 1.8, 0.12, width - 0.8, -1.1, 3.0);
      awning.rotation.z = -0.32;
      box(trims[style]!, 0.5, 0.35, width + 0.2, -0.1, height - 0.35);
      this.addRoofline(shopRow, box, trims[style]!, width, height, storeys, index, hotel);
      // A mural across the upper front of every third shop of two storeys or more.
      if (!hotel && storeys > 1 && index % 3 === 1) {
        const plane = new Mesh(new PlaneGeometry(width - 0.6, height - 4.6), mural);
        this.disposables.push(plane.geometry);
        plane.position.set(-0.05, 4.3 + (height - 4.6) / 2, 0);
        plane.rotation.y = -Math.PI / 2;
        shopRow.add(plane);
      }
      this.group.add(shopRow);
      this.props.push({
        mesh: shopRow,
        offset: offset + width / 2,
        every: LOOP,
        x: FRONTAGE + layout() * 0.8,
      });
      offset += width + (layout() < 0.25 ? 5 : 0.2);
      index++;
    }
    this.addBackRow(fronts, walls, roof);
  }

  /**
   * A block's balconies, parapet and rooftop: railed balconies on the upper storeys of every
   * other block, a stepped parapet on some, a water tank or air conditioners on the roof and, on
   * a hotel, its sign standing on a frame above the boardwalk.
   */
  private addRoofline(
    row: Group,
    box: (m: Material, w: number, h: number, d: number, x: number, y: number) => Mesh,
    trim: Material,
    width: number,
    height: number,
    storeys: number,
    index: number,
    hotel: boolean,
  ): void {
    const rooftop = this.rooftop();
    if (storeys > 1 && (hotel || index % 2 === 0)) {
      const span = hotel ? width - 1.2 : width * 0.6;
      for (let f = 1; f < storeys; f++) {
        box(trim, 1.2, 0.18, span, -0.6, f * STOREY + 0.5);
        box(rooftop.rail, 0.06, 1.0, span, -1.15, f * STOREY + 0.68);
      }
    }
    if (storeys > 1 && index % 3 === 0) box(trim, 0.6, 1.6, width * 0.4, -0.1, height);
    if (index % 2 === 1) {
      const tank = box(rooftop.tank, 2.2, 2.4, 2.2, 7 + (index % 3), height + 1.2);
      tank.position.z = width / 4;
      box(rooftop.steel, 0.15, 1.2, 0.15, 7 + (index % 3), height).position.z = width / 4;
    } else {
      for (const z of [-width / 5, width / 6]) {
        box(rooftop.steel, 1.6, 1.0, 1.4, 5 + (index % 4), height).position.z = z;
      }
    }
    if (hotel) {
      for (const z of [-3.6, 3.6]) box(rooftop.steel, 0.15, 3.2, 0.15, 1.5, height).position.z = z;
      const sign = new Mesh(rooftop.signPlane, rooftop.hotel);
      sign.position.set(1.4, height + 2.1, 0);
      sign.rotation.y = -Math.PI / 2;
      box(rooftop.steel, 0.1, 0.12, 8.2, 1.5, height + 0.9);
      row.add(sign);
    }
  }

  private rooftopParts: {
    rail: Material;
    steel: Material;
    tank: Material;
    hotel: Material;
    signPlane: PlaneGeometry;
  } | null = null;

  private rooftop() {
    if (!this.rooftopParts) {
      const signPlane = new PlaneGeometry(8, 2.2);
      this.disposables.push(signPlane);
      this.rooftopParts = {
        rail: this.material({ color: 0xf4f1e8, metalness: 0.3, roughness: 0.5 }),
        steel: this.material({ color: 0x9aa0a6, metalness: 0.5, roughness: 0.5 }),
        tank: this.material({ color: 0x8a7a68, roughness: 0.9 }),
        hotel: this.material({
          map: this.track(letteringTexture('HOTEL')),
          alphaTest: 0.5,
          side: DoubleSide,
          color: 0xff5d8f,
          emissive: new Color(0xff5d8f),
          emissiveIntensity: 0.6,
        }),
        signPlane,
      };
    }
    return this.rooftopParts;
  }

  /** Taller apartment blocks in a second row behind the shops, in faded pastels. */
  private addBackRow(fronts: Material[], walls: Material[], roof: Material): void {
    const layout = seeded(331);
    let offset = 6;
    while (offset < LOOP - 10) {
      const width = 12 + Math.floor(layout() * 3) * 4;
      const storeys = 4 + Math.floor(layout() * 4);
      const height = storeys * STOREY;
      const style = Math.floor(layout() * walls.length);
      const geometry = new BoxGeometry(16, height, width);
      scaleFaceUv(geometry, 1, width / 4, storeys);
      scaleFaceUv(geometry, 4, 4, storeys);
      this.disposables.push(geometry);
      const block = new Mesh(geometry, [
        walls[style]!,
        fronts[style]!,
        roof,
        roof,
        fronts[style]!,
        walls[style]!,
      ]);
      block.position.y = height / 2;
      block.castShadow = true;
      const holder = new Group();
      holder.add(block);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + width / 2, every: LOOP, x: FRONTAGE + 24 });
      offset += width + 4 + layout() * 14;
    }
  }

  /** Tall Mexican fan palms in rows on both sides: a thin trunk, a skirt and a crown of fans. */
  private addPalms(): void {
    const trunk = new CylinderGeometry(0.2, 0.32, 1, 8, 1);
    trunk.translate(0, 0.5, 0);
    // The skirt of dead fronds hangs under the crown, widest at the top.
    const skirt = new ConeGeometry(0.9, 2.2, 10, 1, true);
    skirt.rotateX(Math.PI);
    skirt.translate(0, -1.1, 0);
    const fan = new PlaneGeometry(3.6, 3.8);
    fan.translate(0, 1.9, 0);
    this.disposables.push(trunk, skirt, fan);
    const bark = this.material({ map: this.track(barkTexture()), roughness: 1 });
    const thatch = this.material({ color: 0x8a6f4b, roughness: 1, side: DoubleSide });
    const leaves = this.material({
      map: this.track(fanTexture()),
      alphaTest: 0.45,
      side: DoubleSide,
      roughness: 0.85,
    });
    const random = seeded(233);
    const plant = (x: number, offset: number) => {
      const palm = new Group();
      const height = 15 + random() * 9;
      const t = new Mesh(trunk, bark);
      t.scale.set(1, height, 1);
      t.castShadow = true;
      const crown = new Group();
      crown.position.y = height;
      crown.add(new Mesh(skirt, thatch));
      // Fans spread out level and droop, with a few younger ones standing up in the middle.
      for (let k = 0; k < 16; k++) {
        const f = new Mesh(fan, leaves);
        const pitch = k < 11 ? 1.35 + random() * 0.6 : 0.35 + random() * 0.4;
        f.rotation.set(pitch, (k / 16) * Math.PI * 2 + random() * 0.3, 0, 'YXZ');
        f.castShadow = true;
        crown.add(f);
      }
      palm.add(t, crown);
      palm.rotation.z = (random() - 0.5) * 0.08;
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, every: LOOP, x });
    };
    for (let offset = 5; offset < LOOP; offset += 18) plant(PALMS_RIGHT + random() * 0.6, offset);
    for (let offset = 12; offset < LOOP; offset += 22) plant(PALMS_LEFT - random() * 0.8, offset);
  }

  /** Vendors' stalls on the boardwalk: pop-up canopies over tables of goods. */
  private addStalls(): void {
    const leg = new CylinderGeometry(0.03, 0.03, 2.3, 6);
    leg.translate(0, 1.15, 0);
    const canopy = new ConeGeometry(2.1, 0.6, 4, 1, true);
    canopy.rotateY(Math.PI / 4);
    canopy.translate(0, 2.6, 0);
    this.disposables.push(leg, canopy);
    const metal = this.material({ color: 0xd9dde2, metalness: 0.5, roughness: 0.4 });
    const table = this.material({ color: 0xf2efe6, roughness: 0.8 });
    const tops = ['#ffffff', '#2ec4b6', '#ff5d8f', '#ffbf3c', '#4f86c6'].map((c) =>
      this.material({ color: c, side: DoubleSide, roughness: 0.8 }),
    );
    const goods = ['#ff5d8f', '#ffbf3c', '#2ec4b6', '#7a3e9d', '#3fe08a', '#111111'].map((c) =>
      this.material({ color: c, roughness: 0.7 }),
    );
    const random = seeded(239);
    for (let offset = 3, k = 0; offset < LOOP; offset += 11, k++) {
      if (random() < 0.3) continue;
      const stall = new Group();
      for (const [x, z] of [
        [-1.4, -1.4],
        [1.4, -1.4],
        [-1.4, 1.4],
        [1.4, 1.4],
      ] as const) {
        const l = new Mesh(leg, metal);
        l.position.set(x, 0, z);
        stall.add(l);
      }
      const top = new Mesh(canopy, tops[k % tops.length]!);
      top.castShadow = true;
      stall.add(top);
      const t = new Mesh(this.unit, table);
      t.scale.set(0.8, 0.08, 2.4);
      t.position.set(-0.8, 0.8, 0);
      stall.add(t);
      for (let g = 0; g < 5; g++) {
        const item = new Mesh(this.unit, goods[(k + g) % goods.length]!);
        item.scale.set(0.3, 0.2 + random() * 0.25, 0.35);
        item.position.set(-0.8, 0.95, -1 + g * 0.5);
        stall.add(item);
      }
      this.group.add(stall);
      this.props.push({ mesh: stall, offset, every: LOOP, x: STALLS });
    }
  }

  /** Feather flags on the barriers, a word down each. */
  private addFeatherFlags(): void {
    const feathers = new FeatherFlags(this.disposables, this.track, FEATHERS);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 6; offset < LOOP; offset += 16) {
        const flag = feathers.make(k++);
        flag.position.y = side > 0 ? KERB : 0.1;
        const holder = new Group();
        holder.add(flag);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? 8 : 0),
          every: LOOP,
          x: side * (BARRIER + 0.15),
        });
      }
    }
  }

  /** Cloth banners on poles across the path, the race's name on each. */
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
      this.props.push({ mesh: banner, offset: 90 + i * 150, every: LOOP, x: 0 });
    });
  }

  /** Venice's sign: VENICE in white letters on a steel frame over the path, once a loop. */
  private addVeniceSign(): void {
    const steel = this.material({ color: 0x2c2f35, metalness: 0.6, roughness: 0.4 });
    const letters = this.material({
      map: this.track(letteringTexture('VENICE')),
      alphaTest: 0.5,
      side: DoubleSide,
      emissive: new Color(0xfff4d8),
      emissiveIntensity: 0.25,
      roughness: 0.5,
    });
    const sign = new Group();
    const box = (w: number, h: number, d: number, x: number, y: number) => {
      const mesh = new Mesh(this.unit, steel);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, 0);
      mesh.castShadow = true;
      sign.add(mesh);
    };
    for (const x of [-6.5, 6.5]) box(0.35, 10.5, 0.35, x, 0);
    box(13.4, 0.25, 0.3, 0, 7.4);
    box(13.4, 0.25, 0.3, 0, 10.3);
    for (let k = 0; k < 9; k++) {
      const brace = new Mesh(this.unit, steel);
      brace.scale.set(0.08, 3.1, 0.08);
      brace.position.set(-6 + k * 1.5, 8.85, 0);
      brace.rotation.z = k % 2 ? 0.45 : -0.45;
      sign.add(brace);
    }
    const plane = new Mesh(new PlaneGeometry(12, 2.6), letters);
    this.disposables.push(plane.geometry);
    plane.position.set(0, 8.85, 0.2);
    sign.add(plane);
    this.group.add(sign);
    this.props.push({ mesh: sign, offset: 230, every: LOOP, x: 0 });
  }

  /** What the fans have painted on the path. */
  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.6, 9);
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
      mesh.position.y = 0.02;
      mesh.receiveShadow = true;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset: 30 + i * ROAD_PAINT_EVERY,
        every: LOOP,
        x,
        lies: true,
      });
    });
  }

  /** Muscle Beach: a fenced outdoor gym on the sand with its bars, rings, benches and sign. */
  private addMuscleBeach(): void {
    const gym = new Group();
    const steel = this.material({ color: 0x3c4148, metalness: 0.5, roughness: 0.5 });
    const rubber = this.material({ color: 0x2d6a4f, roughness: 1 });
    const bench = this.material({ color: 0xd8283a, roughness: 0.6 });
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      gym.add(mesh);
      return mesh;
    };
    box(rubber, 14, 0.06, 22, 0, 0.08, 0);
    // A low fence round it, open to the boardwalk side.
    for (const x of [-7, 7]) box(steel, 0.06, 1.1, 22, x, 0.1, 0);
    box(steel, 14, 1.1, 0.06, 0, 0.1, -11);
    // Pull-up bars and rings, benches and a rack.
    for (const z of [-7, -2]) {
      for (const x of [-2, 2]) box(steel, 0.1, 2.6, 0.1, x, 0.1, z);
      box(steel, 4.1, 0.08, 0.08, 0, 2.6, z);
    }
    for (const z of [3, 6.5]) box(bench, 0.5, 0.5, 1.8, -3, 0.1, z);
    box(steel, 2.5, 1.6, 0.1, 3, 0.1, 5);
    // The sign over the entrance at the end facing the riders as they come up the path.
    for (const x of [-4.2, 4.2]) box(steel, 0.2, 5.6, 0.2, x, 0, 11.3);
    const sign = new Mesh(
      new PlaneGeometry(8.4, 1.8),
      this.material({
        map: this.track(clothBannerTexture('MUSCLE BEACH', '#1b1e24', '#ffbf3c')),
        side: DoubleSide,
        roughness: 0.6,
      }),
    );
    this.disposables.push(sign.geometry);
    sign.position.set(0, 4.8, 11.35);
    gym.add(sign);
    this.group.add(gym);
    this.props.push({ mesh: gym, offset: MUSCLE_BEACH, every: LOOP, x: -17 });
    // The lifters and their spotters.
    for (const [x, z] of [
      [-2, -7],
      [2, -2],
      [-3, 3.5],
      [3, 4.4],
      [-1, 0],
      [4.5, -6],
    ] as const) {
      this.bathers.push({
        x: -17 + x,
        offset: MUSCLE_BEACH - z,
        heading: Math.PI / 2,
        scale: 1.08,
      });
    }
  }

  /** The basketball courts on the sand, their hoops at both ends and a game on. */
  private addCourts(): void {
    const courts = new Group();
    const surface = this.material({ map: this.track(courtTexture()), roughness: 0.8 });
    const plane = new PlaneGeometry(15, 28);
    plane.rotateX(-Math.PI / 2);
    this.disposables.push(plane);
    const steel = this.material({ color: 0x3c4148, metalness: 0.5, roughness: 0.5 });
    const glass = this.material({ color: 0xffffff, transparent: true, opacity: 0.7 });
    const rim = this.material({ color: 0xff6a1a, roughness: 0.5 });
    for (const x of [-8, 8]) {
      const court = new Mesh(plane, surface);
      court.position.set(x, 0.12, 0);
      court.receiveShadow = true;
      courts.add(court);
      for (const end of [-1, 1]) {
        const pole = new Mesh(this.unit, steel);
        pole.scale.set(0.15, 3.4, 0.15);
        pole.position.set(x, 1.7, end * 14.6);
        const board = new Mesh(this.unit, glass);
        board.scale.set(1.8, 1.05, 0.05);
        board.position.set(x, 3.4, end * 13.9);
        const hoop = new Mesh(new TorusGeometry(0.23, 0.02, 6, 16), rim);
        this.disposables.push(hoop.geometry);
        hoop.rotation.x = Math.PI / 2;
        hoop.position.set(x, 3.05, end * 13.6);
        courts.add(pole, board, hoop);
      }
      // Ten on each court, facing one end or the other.
      for (let k = 0; k < 10; k++) {
        this.bathers.push({
          x: -18 + x + ((k % 5) - 2) * 2.4,
          offset: 270 + (k < 5 ? -4 : 4) + (k % 2) * 3,
          heading: k < 5 ? 0 : Math.PI,
          scale: 1.06,
        });
      }
    }
    this.group.add(courts);
    this.props.push({ mesh: courts, offset: 270, every: LOOP, x: -18 });
  }

  /** The skate park: a concrete pad of bowls, quarter pipes and a fun box. */
  private addSkatePark(): void {
    const park = new Group();
    const concrete = this.material({ color: 0xbdb8ae, roughness: 0.9, side: DoubleSide });
    const pad = new Mesh(this.unit, concrete);
    pad.scale.set(18, 0.2, 26);
    pad.position.y = 0.1;
    park.add(pad);
    const pipe = new CylinderGeometry(2.2, 2.2, 8, 16, 1, true, 0, Math.PI / 2);
    pipe.rotateZ(Math.PI / 2);
    this.disposables.push(pipe);
    for (const [x, z, turn] of [
      [-6, -9, 0],
      [6, -9, Math.PI],
      [-6, 9, 0],
      [6, 9, Math.PI],
    ] as const) {
      const q = new Mesh(pipe, concrete);
      q.position.set(x, 2.4, z);
      q.rotation.y = turn;
      q.castShadow = true;
      park.add(q);
    }
    const fun = new Mesh(new ConeGeometry(3.4, 1.4, 4), concrete);
    this.disposables.push(fun.geometry);
    fun.rotation.y = Math.PI / 4;
    fun.position.set(0, 0.9, 0);
    park.add(fun);
    this.group.add(park);
    this.props.push({ mesh: park, offset: 215, every: LOOP, x: -17 });
  }

  /** LA County's lifeguard towers: pale blue huts on stilts, each with its ramp. */
  private addLifeguardTowers(): void {
    const blue = this.material({ map: this.track(hutTexture()), roughness: 0.7 });
    const white = this.material({ color: 0xf2f2ee, roughness: 0.7 });
    for (let offset = 60, k = 0; offset < LOOP; offset += 110, k++) {
      const tower = new Group();
      const box = (m: Material, w: number, h: number, d: number, x: number, y: number) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(w, h, d);
        mesh.position.set(x, y + h / 2, 0);
        mesh.castShadow = true;
        tower.add(mesh);
        return mesh;
      };
      for (const x of [-1.2, 1.2])
        for (const z of [-1.2, 1.2]) {
          const leg = box(white, 0.18, 2.4, 0.18, x, 0);
          leg.position.z = z;
        }
      box(white, 3.4, 0.15, 3.4, 0, 2.4);
      box(blue, 2.8, 2.3, 2.8, 0, 2.55);
      box(white, 3.2, 0.18, 3.2, 0, 4.85);
      const ramp = box(white, 1.1, 0.1, 3.6, 2.5, 1.2);
      ramp.rotation.z = -0.6;
      this.group.add(tower);
      this.props.push({ mesh: tower, offset, every: LOOP, x: -38 - (k % 2) * 8 });
    }
  }

  /**
   * The boardwalk's life, built on the kit's figures: skaters on their boards, performers in
   * rings of watchers, and people on the sand, at Muscle Beach and on the courts.
   */
  private addPeople(): void {
    this.skaters = new Figures(this.group, this.disposables, SKATERS, BEACHWEAR, 241);
    const board = new BoxGeometry(0.24, 0.05, 0.85);
    const deck = new MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.7 });
    this.boards = new InstancedMesh(board, deck, SKATERS);
    this.boards.frustumCulled = false;
    this.group.add(this.boards);
    this.disposables.push(board, deck, this.boards);
    this.performers = new Figures(
      this.group,
      this.disposables,
      PERFORMERS,
      { tops: ['#ffbf3c', '#ff5d8f', '#3fe08a'], bottoms: ['#7a3e9d', '#d8283a'], skins: SKINS },
      251,
    );
    this.watchers = new Figures(
      this.group,
      this.disposables,
      PERFORMERS * WATCHERS,
      BEACHWEAR,
      257,
    );
    const sphere = new SphereGeometry(0.09, 10, 8);
    this.disposables.push(sphere);
    const ballColours = ['#ff5d8f', '#ffbf3c', '#2ec4b6'].map((c) =>
      this.material({ color: c, roughness: 0.4 }),
    );
    for (let i = 0; i < PERFORMERS * 3; i++) {
      const ball = new Mesh(sphere, ballColours[i % 3]!);
      this.balls.push(ball);
      this.group.add(ball);
    }
    const random = seeded(263);
    for (let offset = 0; offset < LOOP; offset += 6) {
      if (random() < 0.45) continue;
      const wading = random() < 0.25;
      this.bathers.push({
        x: wading ? SEA + 1 + random() * 3 : -24 - random() * (SEA * -1 - 32),
        offset: offset + random() * 5,
        heading: random() * Math.PI * 2,
        scale: 0.86 + random() * 0.16,
      });
    }
    this.beachgoers = new Figures(
      this.group,
      this.disposables,
      this.bathers.length,
      BEACHWEAR,
      269,
    );
  }

  /** The Pacific out to the horizon, catching the low sun. */
  private addSea(): void {
    const water = this.material({
      map: this.repeat(seaTexture(), 30, 30),
      color: 0x3b86a8,
      roughness: 0.15,
      metalness: 0.2,
    });
    const plane = new PlaneGeometry(6000, 6000);
    plane.rotateX(-Math.PI / 2);
    plane.translate(SEA - 3000, -0.2, -2000);
    this.disposables.push(plane);
    const mesh = new Mesh(plane, water);
    mesh.receiveShadow = true;
    this.sea.add(mesh);
    this.group.add(this.sea);
  }

  /**
   * The Santa Monica Pier out in the bay ahead: its deck on piles, a pavilion and a coaster, and
   * the Ferris wheel turning on the street's clock, with the Santa Monica Mountains behind.
   */
  private addPier(): void {
    const haze = new Color(HAZE);
    const wood = hazedMaterial(this.disposables, haze, 0x8a6a4a, 0.25);
    const white = hazedMaterial(this.disposables, haze, 0xf4f1e8, 0.08);
    const red = hazedMaterial(this.disposables, haze, 0xd8283a, 0.06, {
      emissive: new Color(0xd8283a),
      emissiveIntensity: 0.25,
    });
    const blue = hazedMaterial(this.disposables, haze, 0x4f86c6, 0.08);
    const yellow = hazedMaterial(this.disposables, haze, 0xffbf3c, 0.04, {
      emissive: new Color(0xffbf3c),
      emissiveIntensity: 1.4,
    });
    // Everything on the pier stands on its deck, which comes ashore PIER_SHORE metres to the
    // right of the path and runs out west over the path and the sand into the bay.
    const p = new Group();
    p.position.x = PIER_SHORE;
    this.pier.add(p);
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      p.add(mesh);
      return mesh;
    };
    // The deck runs out west from the sand, on rows of piles.
    box(wood, 340, 1.2, 22, -170, 6, 0);
    for (let x = -4; x > -340; x -= 10)
      for (const z of [-9, 9]) box(wood, 0.8, 6.5, 0.8, x, -0.5, z);
    box(white, 40, 9, 16, -60, 7.2, 4);
    box(blue, 40.4, 1, 16.4, -60, 16.2, 4);
    box(white, 24, 6, 14, -210, 7.2, 2);
    // Its sign over the path where the deck crosses it, facing the riders.
    const sign = new Mesh(
      new PlaneGeometry(26, 4.2),
      hazedMaterial(this.disposables, haze, 0xffffff, 0.04, {
        map: this.track(clothBannerTexture('SANTA MONICA PIER', '#2f6db3', '#fff6e0')),
        side: DoubleSide,
      }),
    );
    this.disposables.push(sign.geometry);
    sign.position.set(-PIER_SHORE, 9.6, 11.2);
    p.add(sign);
    box(blue, 27, 0.5, 0.6, -PIER_SHORE, 11.7, 11.2);
    // The coaster's track loops over the deck.
    const curve = new CatmullRomCurve3(
      [
        [-150, 10, -6],
        [-170, 24, -6],
        [-190, 12, 0],
        [-175, 18, 7],
        [-150, 22, 7],
        [-135, 12, 0],
      ].map(([x, y, z]) => new Vector3(x, y, z)),
      true,
    );
    const track = new TubeGeometry(curve, 120, 0.5, 6, true);
    this.disposables.push(track);
    p.add(new Mesh(track, red));
    // The Ferris wheel: two rims and their spokes, gondolas round the rim, on an A-frame.
    const radius = 36;
    const hub = 7.2 + radius + 4;
    const rim = new TorusGeometry(radius, 0.8, 8, 96);
    const spoke = new BoxGeometry(0.45, radius * 2, 0.45);
    const gondola = new BoxGeometry(2.6, 2.8, 2.6);
    this.disposables.push(rim, spoke, gondola);
    for (const z of [-1.2, 1.2]) {
      const r = new Mesh(rim, red);
      r.position.z = z;
      this.wheel.add(r);
    }
    for (let k = 0; k < 12; k++) {
      const s = new Mesh(spoke, white);
      s.rotation.z = (k / 12) * Math.PI;
      this.wheel.add(s);
    }
    const colours = [red, yellow, blue, white];
    for (let k = 0; k < 20; k++) {
      const angle = (k / 20) * Math.PI * 2;
      const g = new Mesh(gondola, colours[k % colours.length]!);
      g.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      this.wheel.add(g);
    }
    // A ring of lights round the rim, lit gold.
    const lights = new Mesh(new TorusGeometry(radius + 0.6, 0.25, 6, 96), yellow);
    this.disposables.push(lights.geometry);
    this.wheel.add(lights);
    this.wheel.position.set(-95, hub, 0);
    p.add(this.wheel);
    for (const x of [-1, 1]) {
      for (const z of [-3, 3]) {
        const leg = box(white, 1, hub - 7.2, 1, -95 + x * 9, 7.2, z);
        leg.rotation.z = x * 0.24;
        leg.position.x = -95 + x * 4.6;
      }
    }
    // The Santa Monica Mountains along the horizon behind, blue in the haze.
    const ridge = new PlaneGeometry(5000, 1, 120, 1);
    const position = ridge.getAttribute('position') as BufferAttribute;
    const random = seeded(271);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const top = position.getY(i) > 0;
      const h = 110 + 70 * Math.sin(x / 520 + 1) + 40 * Math.sin(x / 170) + random() * 12;
      position.setY(i, top ? h : -10);
    }
    ridge.computeVertexNormals();
    this.disposables.push(ridge);
    const hills = new Mesh(ridge, hazedMaterial(this.disposables, haze, 0x7d8d9b, 0.68));
    hills.position.set(-600, 0, -2600);
    this.pier.add(hills);
    this.group.add(this.pier);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
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

/** One storey and a 4 m bay of a stucco front: a window with a painted surround. */
function facadeTexture(wall: string, trim: string, seed: number): CanvasTexture {
  const texture = canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, wall, seed);
    g.fillStyle = trim;
    g.fillRect(60, 60, 136, 120);
    const glass = g.createLinearGradient(0, 68, 0, 172);
    glass.addColorStop(0, '#9cc3dc');
    glass.addColorStop(1, '#2e4a5e');
    g.fillStyle = glass;
    g.fillRect(70, 70, 116, 100);
    g.fillStyle = trim;
    g.fillRect(126, 70, 4, 100);
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(56, 182, 144, 6);
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/** A mural, one of four designs painted across a wall. */
function muralTexture(design: number): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    const random = seeded(281 + design);
    if (design === 0) {
      // A sunset over the sea with palm silhouettes.
      const sky = g.createLinearGradient(0, 0, 0, 512);
      sky.addColorStop(0, '#7a3e9d');
      sky.addColorStop(0.45, '#ff5d8f');
      sky.addColorStop(0.75, '#ffbf3c');
      sky.addColorStop(1, '#2e86ab');
      g.fillStyle = sky;
      g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#ffe9a8';
      g.beginPath();
      g.arc(256, 360, 90, Math.PI, 0);
      g.fill();
      g.fillStyle = '#1b1e24';
      for (const x of [70, 420, 470]) {
        g.fillRect(x, 160, 10, 300);
        for (let k = 0; k < 7; k++) {
          g.save();
          g.translate(x + 5, 165);
          g.rotate(-1.4 + k * 0.45);
          g.fillRect(0, -6, 80, 12);
          g.restore();
        }
      }
    } else if (design === 1) {
      // Curling waves.
      g.fillStyle = '#2e86ab';
      g.fillRect(0, 0, 512, 512);
      for (let row = 0; row < 5; row++) {
        g.strokeStyle = row % 2 ? '#ffffff' : '#7ad0ff';
        g.lineWidth = 18;
        g.beginPath();
        for (let x = -60; x < 560; x += 120) g.arc(x, 90 + row * 100, 55, Math.PI, Math.PI * 1.9);
        g.stroke();
      }
    } else if (design === 2) {
      // Bold shapes in the boardwalk's colours.
      g.fillStyle = '#fff6e0';
      g.fillRect(0, 0, 512, 512);
      const colours = ['#ff5d8f', '#2ec4b6', '#ffbf3c', '#4f86c6', '#7a3e9d', '#3fe08a', '#111111'];
      for (let k = 0; k < 26; k++) {
        g.fillStyle = colours[Math.floor(random() * colours.length)]!;
        g.beginPath();
        if (random() < 0.5)
          g.arc(random() * 512, random() * 512, 20 + random() * 70, 0, Math.PI * 2);
        else g.rect(random() * 512, random() * 512, 40 + random() * 140, 40 + random() * 140);
        g.fill();
      }
    } else {
      // VENICE in big letters over stars.
      g.fillStyle = '#ffbf3c';
      g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#ff5d8f';
      for (let k = 0; k < 40; k++) {
        g.beginPath();
        g.arc(random() * 512, random() * 512, 6 + random() * 10, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#1b1e24';
      g.font = 'bold 150px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('VEN', 256, 180);
      g.fillText('ICE', 256, 340);
    }
  });
}

/** Eight metres of shopfronts: plate glass over a dark sill, goods in the windows. */
function shopTexture(): CanvasTexture {
  return canvasTexture(512, 192, (g) => {
    g.fillStyle = '#3a3f46';
    g.fillRect(0, 0, 512, 192);
    const random = seeded(283);
    const goods = ['#ff5d8f', '#ffbf3c', '#2ec4b6', '#ffffff', '#7a3e9d'];
    for (let k = 0; k < 4; k++) {
      const x = k * 128;
      const pane = g.createLinearGradient(0, 14, 0, 170);
      pane.addColorStop(0, '#8fb2c8');
      pane.addColorStop(1, '#22313c');
      g.fillStyle = pane;
      g.fillRect(x + 8, 14, 112, 156);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = goods[Math.floor(random() * goods.length)]!;
        g.fillRect(x + 14 + random() * 90, 60 + random() * 90, 14, 20);
      }
    }
  });
}

/** An awning's stripes, white and `colour`. */
function awningTexture(colour: string): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    for (let k = 0; k < 8; k++) {
      g.fillStyle = k % 2 ? '#ffffff' : colour;
      g.fillRect(k * 16, 0, 16, 64);
    }
  });
}

/** A fan palm's ring-scarred trunk. */
function barkTexture(): CanvasTexture {
  const texture = canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#8a7560', 293);
    g.fillStyle = 'rgba(50,35,20,0.35)';
    for (let y = 0; y < 256; y += 10) g.fillRect(0, y, 64, 2);
  });
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 6);
  return texture;
}

/** A palmate frond: green blades spread from a point, on a clear ground. */
function fanTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    for (let k = 0; k < 15; k++) {
      const a = Math.PI * (0.08 + (k / 14) * 0.84);
      g.strokeStyle = k % 2 ? '#4f7d3a' : '#5f9145';
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(128, 250);
      g.lineTo(128 - Math.cos(a) * 125, 250 - Math.sin(a) * 240);
      g.stroke();
    }
  });
}

/** White letters on a clear ground, for a sign cut out against the sky. */
function letteringTexture(word: string): CanvasTexture {
  return canvasTexture(1024, 224, (g) => {
    g.fillStyle = '#ffffff';
    g.font = 'bold 190px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(word, 512, 120, 1000);
  });
}

/** The courts' green surface and white lines, one court to the texture. */
function courtTexture(): CanvasTexture {
  return canvasTexture(256, 480, (g) => {
    g.fillStyle = '#3f7d5c';
    g.fillRect(0, 0, 256, 480);
    g.fillStyle = '#2f5f8f';
    g.fillRect(88, 0, 80, 100);
    g.fillRect(88, 380, 80, 100);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(6, 6, 244, 468);
    g.beginPath();
    g.moveTo(6, 240);
    g.lineTo(250, 240);
    g.stroke();
    g.beginPath();
    g.arc(128, 240, 30, 0, Math.PI * 2);
    g.stroke();
    for (const [y, dir] of [
      [6, 1],
      [474, -1],
    ] as const) {
      g.beginPath();
      g.arc(128, y, 110, dir > 0 ? 0 : Math.PI, dir > 0 ? Math.PI : Math.PI * 2);
      g.stroke();
    }
  });
}

/** The lifeguard hut's pale blue boards, its tower number on a white panel. */
function hutTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#8ccbe6';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < 128; y += 12) g.fillRect(0, y, 128, 2);
    g.fillStyle = '#ffffff';
    g.fillRect(36, 40, 56, 44);
    g.fillStyle = '#1b1e24';
    g.font = 'bold 34px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('26', 64, 63);
  });
}

/** Pale boardwalk concrete in 2 m slabs (the texture covers 4 m). */
function concreteTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#d6d0c4', 307);
    g.strokeStyle = 'rgba(90,80,70,0.4)';
    g.lineWidth = 3;
    for (const p of [0, 256, 512]) {
      g.beginPath();
      g.moveTo(0, p);
      g.lineTo(512, p);
      g.moveTo(p, 0);
      g.lineTo(p, 512);
      g.stroke();
    }
    // Sand blown over from the beach.
    const random = seeded(311);
    g.fillStyle = 'rgba(227,207,165,0.5)';
    for (let i = 0; i < 400; i++) g.fillRect(random() * 512, random() * 512, 3, 3);
  });
}

/** Fine pale sand, footprinted. */
function sandTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => speckle(g, 512, 512, '#e8d6ae', 313));
}

/** Ripples on the bay. */
function seaTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#7fb3c9';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(317);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = `rgba(255,255,255,${0.1 + random() * 0.25})`;
      g.fillRect(random() * 256, random() * 256, 6 + random() * 14, 2);
    }
  });
}
