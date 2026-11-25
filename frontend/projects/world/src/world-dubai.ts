// Dubai Marina, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// the marina walk at dusk, closed for the ride. On the left the promenade's palms and glass rail
// over the marina, superyachts moored at its pontoons and the towers of the far side glittering
// across the water; on the right the shops and cafés of the podium under glass towers, their
// windows coming alight. Ahead, the Cayan Tower twists ninety degrees into the dusk among the
// marina's skyline, the sky still burning orange and violet where the sun has gone down.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags, road paint, palms, yachts and box builder of world-kit.ts.
import {
  type BufferAttribute,
  BoxGeometry,
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
  type BannerPanel,
  barrierBannerTexture,
  BoxBuilder,
  buntingGeometry,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  hazedMaterial,
  loopMetres,
  paintedRows,
  Palms,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  slopeAt,
  speckle,
  type Wardrobe,
  Yachts,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 500;
const BEHIND = 30;
const KERB = 0.14;
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.6;
/** The quay's edge on the left, the glass rail along it and the marina's water below. */
const QUAY = 10;
/**
 * One floor of the Cayan Tower's glass around a face: ten bays of blue glass, some lit warm.
 * With `lit`, only the lit bays, on black, for the emissive map.
 */
function cayanTexture(lit: boolean): CanvasTexture {
  return canvasTexture(256, 16, (g) => {
    g.fillStyle = lit ? '#000000' : '#34506c';
    g.fillRect(0, 0, 256, 16);
    const random = seeded(5275);
    for (let bay = 0; bay < 20; bay++) {
      const on = random() < 0.45;
      if (lit && !on) continue;
      g.fillStyle = lit ? '#ffcf96' : on ? '#e8c090' : '#4a6a88';
      g.fillRect(bay * 12.8 + 1, 2, 10.8, 12);
    }
  });
}

/** The marina's water, this far below the walk: a pontoon's step down from the quay. */
const WATER = -0.75;
/** The podium's shopfronts on the right, the towers rising behind them. */
const PODIUM = 12;
/** The horizon this far ahead. */
const AHEAD = 280;
const HAZE = 0xc89aa0;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** The marina's evening crowd: white kandura, black abaya and the bright clothes of everyone else. */
const MARINA: Wardrobe = {
  tops: ['#d8283a', '#1f8a5a', '#3ac8e8', '#f2c230', '#e8a0c0', '#1d3c8f', '#f08a3a', '#2a2a2e'],
  bottoms: ['#20242b', '#3a5a8a', '#c8b89a', '#8a6a4a', '#111111'],
  skins: SKINS,
  // The Emiratis among them in a white kandura or a black abaya.
  robes: [
    { colour: '#fbfbf8', share: 0.3 },
    { colour: '#141416', share: 0.14 },
  ],
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#111111', ink: '#e8c060', text: 'DUBAI MARINA' },
  { fill: '#ffffff', ink: '#1b1e24', text: 'MARINA SPRINT' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#1f8a5a', ink: '#ffffff', text: 'DUBAI' },
  { fill: '#d8283a', ink: '#ffffff', text: 'SPRINT' },
  { fill: '#1b2a44', ink: '#e8c060', text: 'MARINA WALK' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['DUBAI MARINA SPRINT', '#111111', '#e8c060', 118],
  ['WATTZUP · SPRINT INTO THE EFFORT', '#1b1e24', '#d7ff3a', 300],
];
const FEATHERS: readonly FeatherWord[] = [
  ['DUBAI', '#1f8a5a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['MARINA', '#111111', '#e8c060'],
  ['SPRINT', '#d8283a', '#ffffff'],
];
const FEATHER_EVERY = 18;
/** Bunting in the UAE's colours crosses the walk every BUNTING metres. */
const BUNTING = 14;
const UAE = ['#00843d', '#ffffff', '#111111', '#ef3340'];
/** The names and cries painted on the marina walk. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['SPRINT', '#1b1e24'],
  ['YALLA', '#c81e32'],
  ['GO MAYA', '#1d3c8f'],
  ['ALLEZ JONAS', '#1b1e24'],
  ['ANA!', '#0e7a6a'],
  ['SOPHIE', '#8a1e5a'],
  ['KENJI', '#1b1e24'],
  ['RAVI!', '#1f6a3a'],
  ['FAST', '#c81e32'],
  ['DUBAI', '#1d3c8f'],
];
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['DUBAI MARINA', '#1d3c8f'],
  ['SPRINT', '#c81e32'],
  ['WATTZUP', '#1b1e24'],
  ['YALLA YALLA', '#0e7a6a'],
];
const ROAD_PAINT_EVERY = 7;
/** The yachts' hull colours; most are white. */
const HULLS = [0xf6f6f2, 0xf6f6f2, 0x1b2a44, 0xf6f6f2, 0x3a3e46, 0xf6f6f2];
/** The towers' glass: the tint of each and the warm glow of its lit windows. */
const GLASS = ['#2a3e58', '#3a5068', '#1e2e40', '#4a5a6a', '#2e4a5a', '#5a6470'];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

export class DubaiStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private readonly water = new Group();
  private time = 0;
  private readonly flagMaterials = ['#1f8a5a', '#ffffff', '#111111', '#d8283a'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );
  /** One glass material per tint, shared by every tower. */
  private readonly glass: MeshStandardMaterial[] = [];

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // The crowd packed along the podium, in small knots along the quay with the marina open between.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.6,
      wardrobe: MARINA,
      flags: this.flagMaterials,
      flagShare: 0.18,
      seeds: [5211, 5217],
      skip: (side, offset, x) => side < 0 && (Math.abs(x) > CROWD_NEAR + 0.6 || offset % 48 < 36),
      armsUp: 0.2,
    });
    this.group.add(this.horizon, this.water);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    GLASS.forEach((tint, k) => {
      const map = this.track(glassTexture(tint, 5221 + k, false));
      const lit = this.track(glassTexture(tint, 5221 + k, true));
      for (const t of [map, lit]) {
        t.wrapS = RepeatWrapping;
        t.wrapT = RepeatWrapping;
      }
      this.glass.push(
        this.material({
          map,
          emissive: 0xffffff,
          emissiveMap: lit,
          emissiveIntensity: 0.55,
          roughness: 0.25,
          metalness: 0.3,
        }),
      );
    });
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addWater();
    this.addPalms();
    this.addYachts();
    this.addPodium();
    this.addFarSide();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addBunting();
    this.addRoadPaint();
    this.addSkyline();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the road, under the marina; the walk's own land stays. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 40);
      position.setY(i * 2 + 1, p.height - 40);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(metres);
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 12;
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB, -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.water.position.y = ground(0);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The kerbs, the marina walk's paving out to the quay edge and its glass rail on the left, the
   * paving to the podium on the right, and the barriers with their banners.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xd8d4cc, roughness: 0.85 });
    const paving = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.6 });
    const edge = this.material({ color: 0xc8c2b8, roughness: 0.8 });
    // The walk itself: sandstone pavers laid over the road, kerb to kerb.
    const pavers = this.track(paverTexture());
    pavers.wrapS = RepeatWrapping;
    pavers.wrapT = RepeatWrapping;
    pavers.repeat.set(1 / (2 * r), 1 / 4);
    this.ribbons.add(
      points,
      this.material({
        map: pavers,
        roughness: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      [
        [r, 0.006],
        [-r, 0.006],
      ],
    );
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
    }
    this.ribbons.add(points, paving, [
      [PODIUM + 60, KERB],
      [r + 0.3, KERB],
    ]);
    this.ribbons.add(points, paving, [
      [-r - 0.3, KERB],
      [-QUAY, KERB],
    ]);
    this.ribbons.add(points, edge, [
      [-QUAY, KERB],
      [-QUAY, -2],
    ]);
    // The glass rail along the quay's edge, its steel cap catching the light.
    const glass = this.material({
      color: 0xa8c8d8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.3,
      side: DoubleSide,
    });
    this.ribbons.add(points, glass, [
      [-QUAY + 0.3, KERB + 1.1],
      [-QUAY + 0.3, KERB],
    ]);
    const steel = this.material({ color: 0xe0e0e4, metalness: 0.7, roughness: 0.3 });
    this.ribbons.add(points, steel, [
      [-QUAY + 0.25, KERB + 1.1],
      [-QUAY + 0.3, KERB + 1.16],
      [-QUAY + 0.35, KERB + 1.1],
    ]);
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

  /** The marina's water: deep blue-violet, the dusk and the towers' lights rippling in it. */
  private addWater(): void {
    const water = this.material({
      map: this.repeat(waterTexture(), 24, 24),
      color: 0x2a2a52,
      emissive: 0xffffff,
      emissiveMap: this.repeat(waterTexture(), 24, 24),
      emissiveIntensity: 0.9,
      roughness: 0.55,
      metalness: 0,
    });
    const plane = new PlaneGeometry(6000, 6000);
    plane.rotateX(-Math.PI / 2);
    plane.translate(-QUAY - 3000, WATER, -2000);
    this.disposables.push(plane);
    this.water.add(new Mesh(plane, water));
  }

  /** Palms in round planters along both sides of the walk. */
  private addPalms(): void {
    const palms = new Palms(this.disposables, this.track);
    const planter = new CylinderGeometry(0.9, 0.8, 0.6, 16);
    planter.translate(0, 0.3, 0);
    this.disposables.push(planter);
    const stone = this.material({ color: 0xe8e0d0, roughness: 0.7 });
    const random = seeded(5231);
    const plant = (x: number, offset: number) => {
      const holder = new Group();
      holder.add(palms.make(random), new Mesh(planter, stone));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    };
    for (let offset = 5; offset < LOOP; offset += 14) plant(-7.8, offset);
    for (let offset = 12; offset < LOOP; offset += 14) plant(8.4, offset);
  }

  /** Superyachts moored stern-to along the pontoons of the marina, in two rows out from the quay. */
  private addYachts(): void {
    const yachts = new Yachts(this.disposables, HULLS);
    const random = seeded(5241);
    const pontoon = this.material({ color: 0xd8d0c0, roughness: 0.8 });
    const deck = new BoxGeometry(1, 0.4, 1);
    this.disposables.push(deck);
    for (const [row, out, gap] of [
      [0, QUAY + 4, 22],
      [1, QUAY + 30, 14],
    ] as const) {
      for (let offset = row * 9, k = 0; offset < LOOP - 20; k++) {
        const length = 24 + random() * 34;
        const yacht = yachts.make(k + row * 3, length, random);
        yacht.position.y = WATER - 0.1;
        const holder = new Group();
        const beam = Math.max(6, length * 0.18);
        // The pontoon it lies alongside, on the quay's side.
        const walk = new Mesh(deck, pontoon);
        walk.scale.set(2.2, 1, length + gap);
        walk.position.set(beam / 2 + 1.6, WATER + 0.25, 0);
        holder.add(yacht, walk);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset: offset + length / 2, x: -(out + beam / 2) });
        offset += length + gap + random() * gap;
      }
    }
  }

  /**
   * The podium on the right: two floors of shops and cafés with lit fronts and awnings, café
   * tables out on the walk, and glass towers rising from it, set back, of every height.
   */
  private addPodium(): void {
    const random = seeded(5251);
    const stone = this.material({ color: 0xe4dccc, roughness: 0.8 });
    const fronts = [0, 1, 2].map((k) =>
      this.material({
        map: this.track(shopTexture(k)),
        emissive: 0xffffff,
        emissiveMap: this.track(shopTexture(k)),
        emissiveIntensity: 0.6,
        roughness: 0.5,
      }),
    );
    const awnings = ['#1b2a44', '#d8283a', '#f4ece0', '#1f8a5a'].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    let k = 0;
    for (let offset = 0; offset < LOOP; k++) {
      const width = 30 + random() * 26;
      const block = new Group();
      const front = new BoxGeometry(14, 8, width);
      scaleFaceUv(front, 1, width / 10, 1);
      front.translate(7, 4, 0);
      this.disposables.push(front);
      block.add(new Mesh(front, [stone, fronts[k % 3]!, stone, stone, stone, stone]));
      const b = new BoxBuilder();
      b.box(awnings[k % awnings.length]!, [1.6, 0.18, width - 2], [-0.6, 3.6, 0], -0.25);
      // The tower over the podium, set back from the walk, its height and glass its own.
      const tall = 60 + random() * 150;
      const tw = Math.min(width - 6, 22 + random() * 14);
      const td = 20 + random() * 10;
      const tower = new BoxGeometry(td, tall, tw);
      for (const f of [0, 1]) scaleFaceUv(tower, f, tw / 12, tall / 12);
      for (const f of [4, 5]) scaleFaceUv(tower, f, td / 12, tall / 12);
      tower.translate(16 + td / 2, 8 + tall / 2, 0);
      this.disposables.push(tower);
      const glass = this.glass[k % this.glass.length]!;
      block.add(new Mesh(tower, glass));
      // The crown: a lit band and a cap, or a spire on every third.
      b.box(stone, [td + 1, 2, tw + 1], [16 + td / 2, 8 + tall + 1, 0]);
      if (k % 3 === 1) b.box(stone, [1.2, 18, 1.2], [16 + td / 2, 8 + tall + 11, 0]);
      block.add(b.build(this.disposables));
      this.group.add(block);
      this.props.push({ mesh: block, offset: offset + width / 2, x: PODIUM });
      offset += width + 4;
    }
  }

  /**
   * The far side of the marina across the water: a wall of towers glittering in the dusk, their
   * windows alight, seen over the yachts.
   */
  private addFarSide(): void {
    const random = seeded(5261);
    let k = 0;
    for (let offset = 0; offset < LOOP; k++) {
      const width = 26 + random() * 24;
      const tall = 70 + random() * 170;
      const depth = 24;
      const tower = new BoxGeometry(depth, tall, width);
      for (const f of [0, 1]) scaleFaceUv(tower, f, width / 12, tall / 12);
      for (const f of [4, 5]) scaleFaceUv(tower, f, depth / 12, tall / 12);
      tower.translate(0, tall / 2 - 2, 0);
      this.disposables.push(tower);
      const holder = new Group();
      holder.add(new Mesh(tower, this.glass[(k + 2) % this.glass.length]!));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + width / 2, x: -(130 + random() * 40) });
      offset += width + 6 + random() * 16;
    }
  }

  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.1, 0.1, 6.4, 8);
    post.translate(0, 3.2, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1.2, 2);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0xf4f4f0, metalness: 0.4, roughness: 0.4 });
    for (const [text, fill, ink, offset] of STREET_BANNERS) {
      const banner = new Group();
      for (const x of [-roadHalf - 0.7, roadHalf + 0.7]) {
        const p = new Mesh(post, steel);
        p.position.x = x;
        banner.add(p);
      }
      const map = this.track(clothBannerTexture(text, fill, ink));
      // Lit from within like a light box, so it reads against the dusk behind it.
      const c = new Mesh(
        cloth,
        this.material({
          map,
          emissive: 0xffffff,
          emissiveMap: map,
          emissiveIntensity: 0.6,
          side: DoubleSide,
        }),
      );
      c.position.y = 5.6;
      banner.add(c);
      this.group.add(banner);
      this.props.push({ mesh: banner, offset, x: 0 });
    }
  }

  /**
   * Bunting in the UAE's green, white, black and red strung across the walk every BUNTING metres,
   * from the palms on the quay to the podium's awnings, two strings to each crossing.
   */
  private addBunting(): void {
    const geometry = buntingGeometry(
      9,
      UAE,
      [
        [7.4, 0],
        [6.6, 2.5],
      ],
      1.6,
    );
    this.disposables.push(geometry);
    const pennant = this.material({ vertexColors: true, side: DoubleSide, roughness: 0.8 });
    for (let offset = 20; offset < LOOP; offset += BUNTING) {
      // None in front of a banner over the road.
      if (STREET_BANNERS.some(([, , , at]) => Math.abs(offset - at) < 8)) continue;
      const holder = new Group();
      holder.add(new Mesh(geometry, pennant));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  private addFeatherFlags(): void {
    const feathers = new FeatherFlags(this.disposables, this.track, FEATHERS);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 8; offset < LOOP; offset += FEATHER_EVERY) {
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

  /** Names and cries painted on the pavers in navy, red, teal and black, slogans right across. */
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
   * The marina's skyline at the end of the walk: the Cayan Tower twisting a quarter turn from its
   * foot to its crown, its white frame spiralling up the glass, among the towers of the marina,
   * one crowned with a spire and one with a flared torch-like top, all hazed by hand.
   */
  private addSkyline(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const cayan = cayanTower(this.track, this.disposables, haze);
    // On the line of the walk, rising over everything at its end.
    cayan.position.set(4, -2, -620);
    h.add(cayan);
    // The towers about it, of every height, glass alight, hazed with distance.
    const random = seeded(5271);
    const box = new BoxGeometry(1, 1, 1);
    const cone = new ConeGeometry(1, 1, 4);
    cone.rotateY(Math.PI / 4);
    this.disposables.push(box, cone);
    const tints = GLASS.map((t) =>
      hazedMaterial(this.disposables, haze, t, 0.3, {
        emissive: new Color(0xffb878),
        emissiveIntensity: 0.08,
        metalness: 0.4,
        roughness: 0.25,
      }),
    );
    const crown = hazedMaterial(this.disposables, haze, 0xf0e8dc, 0.3);
    for (let k = 0; k < 34; k++) {
      const x = -520 + random() * 1000;
      const z = -300 - random() * 500;
      if (Math.abs(x - 4) < 60) continue;
      const tall = 80 + random() * 220;
      const w = 22 + random() * 20;
      const tower = new Mesh(box, tints[k % tints.length]!);
      tower.scale.set(w, tall, w);
      tower.position.set(x, tall / 2 - 2, z);
      h.add(tower);
      if (k % 5 === 0) {
        const spire = new Mesh(cone, crown);
        spire.scale.set(w * 0.4, 50, w * 0.4);
        spire.position.set(x, tall + 23, z);
        h.add(spire);
      } else if (k % 5 === 2) {
        const torch = new Mesh(cone, crown);
        torch.rotation.x = Math.PI;
        torch.scale.set(w * 0.7, 18, w * 0.7);
        torch.position.set(x, tall + 7, z);
        h.add(torch);
      }
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

/**
 * Twelve metres of a glass tower, four floors of four bays: the tinted glass with its mullions,
 * a few windows lit warm. With `lit`, only the lit windows, on black, for the emissive map.
 */
function glassTexture(tint: string, seed: number, lit: boolean): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = lit ? '#000000' : tint;
    g.fillRect(0, 0, 128, 128);
    const random = seeded(seed);
    for (let row = 0; row < 4; row++) {
      for (let bay = 0; bay < 4; bay++) {
        const on = random() < 0.3;
        const warm = random();
        const x = bay * 32 + 2;
        const y = row * 32 + 3;
        if (lit) {
          if (on) {
            g.fillStyle = warm < 0.7 ? '#ffd8a0' : '#f4f0ff';
            g.fillRect(x + 1, y + 1, 26, 24);
          }
          continue;
        }
        g.fillStyle = on ? 'rgba(232,200,144,0.85)' : 'rgba(255,255,255,0.1)';
        g.fillRect(x + 1, y + 1, 26, 24);
        g.fillStyle = 'rgba(255,255,255,0.18)';
        g.fillRect(x + 1, y + 1, 26, 3);
      }
    }
    if (!lit) {
      // The mullions and the floor slabs.
      g.fillStyle = 'rgba(200,210,220,0.3)';
      for (let x = 0; x <= 128; x += 32) g.fillRect(x, 0, 2, 128);
      for (let y = 0; y <= 128; y += 32) g.fillRect(0, y, 128, 3);
    }
  });
}

/** The podium's shopfronts, ten metres of them: lit windows under a fascia, doors between. */
function shopTexture(k: number): CanvasTexture {
  const fascias = ['#1b2a44', '#2a2a2e', '#5a3a2a'];
  return canvasTexture(256, 128, (g) => {
    g.fillStyle = '#e4dccc';
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = fascias[k % 3]!;
    g.fillRect(0, 40, 256, 14);
    for (let x = 8; x < 256; x += 64) {
      g.fillStyle = '#ffe0b0';
      g.fillRect(x, 58, 50, 66);
      g.fillStyle = 'rgba(120,80,40,0.4)';
      g.fillRect(x + 22, 58, 4, 66);
    }
    // The upper floor's windows.
    g.fillStyle = '#4a5a6a';
    for (let x = 12; x < 256; x += 32) g.fillRect(x, 8, 20, 24);
  });
}

/**
 * The marina walk's sandstone pavers, the road's width across and four metres along: rows of
 * long pavers in running bond in two warm tones, a band of darker ones down each side, and the
 * joints between them.
 */
function paverTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    speckle(g, 256, 128, '#dccbaa', 5285);
    const random = seeded(5287);
    const rows = 16;
    const h = 128 / rows;
    for (let row = 0; row < rows; row++) {
      const w = 24;
      for (let x = row % 2 ? -w / 2 : 0; x < 256; x += w) {
        const edge = x < 40 || x > 216;
        const tone = random();
        g.fillStyle = edge
          ? tone < 0.5
            ? 'rgba(120,96,74,0.55)'
            : 'rgba(104,84,66,0.6)'
          : tone < 0.4
            ? 'rgba(200,176,136,0.5)'
            : tone < 0.7
              ? 'rgba(232,214,182,0.4)'
              : 'rgba(0,0,0,0)';
        g.fillRect(x + 1, row * h + 1, w - 2, h - 2);
      }
    }
    g.strokeStyle = 'rgba(110,90,70,0.35)';
    g.lineWidth = 1;
    for (let row = 0; row <= rows; row++) {
      g.beginPath();
      g.moveTo(0, row * h);
      g.lineTo(256, row * h);
      g.stroke();
    }
  });
}

/** The marina walk's pale stone paving, in big square slabs. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#ddd4c4', 5281);
    g.strokeStyle = 'rgba(130,110,90,0.35)';
    g.lineWidth = 2;
    for (let p = 0; p <= 128; p += 64) {
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, 128);
      g.moveTo(0, p);
      g.lineTo(128, p);
      g.stroke();
    }
  });
}

/** The marina's water: ripples catching the dusk's orange and the towers' lights. */
function waterTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    // The dusk sky in it: violet above the orange glow on the water.
    g.fillStyle = '#26244a';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(5291);
    for (let i = 0; i < 110; i++) {
      const c = random();
      g.fillStyle =
        c < 0.4
          ? 'rgba(255,150,90,0.8)'
          : c < 0.7
            ? 'rgba(255,220,150,0.7)'
            : 'rgba(120,100,170,0.6)';
      g.fillRect(random() * 128, random() * 128, 6 + random() * 16, 2.5);
    }
  });
}

/** The quarter-turn tower shared by the original class and its fixed Marina Walk race course. */
export function cayanTower(
  track: <T extends Texture>(map: T) => T,
  disposables: { dispose(): void }[],
  haze: Color,
): Group {
  // The Cayan Tower: seventy-five floors, each turned a little further than the one below.
  const FLOORS = 75;
  const STOREY = 4.2;
  const glassParts: BufferGeometry[] = [];
  const frameParts: BufferGeometry[] = [];
  const lights = seeded(5273);
  for (let f = 0; f < FLOORS; f++) {
    const turn = (f / FLOORS) * (Math.PI / 2);
    const pane = new BoxGeometry(30, STOREY - 0.6, 30);
    // Each floor's windows lit in their own pattern: its band of the texture slid along.
    const uv = pane.getAttribute('uv') as BufferAttribute;
    const slide = Math.floor(lights() * 10) / 10;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) + slide);
    pane.rotateY(turn);
    pane.translate(0, f * STOREY + STOREY / 2, 0);
    glassParts.push(pane);
    const slab = new BoxGeometry(31.4, 0.6, 31.4);
    slab.rotateY(turn);
    slab.translate(0, f * STOREY + 0.3, 0);
    frameParts.push(slab);
    // The white columns at its corners and across each face, turned with the floor, so they
    // spiral up the tower a quarter turn from its foot to its crown.
    for (const [cx, cz, w] of [
      [15.4, 15.4, 1.6],
      [15.4, -15.4, 1.6],
      [-15.4, 15.4, 1.6],
      [-15.4, -15.4, 1.6],
      [15.6, 0, 0.9],
      [-15.6, 0, 0.9],
      [0, 15.6, 0.9],
      [0, -15.6, 0.9],
    ] as const) {
      const column = new BoxGeometry(w, STOREY, w);
      column.translate(cx, f * STOREY + STOREY / 2, cz);
      column.rotateY(turn);
      frameParts.push(column);
    }
  }
  const cayanWindows = track(cayanTexture(false));
  const cayanLit = track(cayanTexture(true));
  for (const t of [cayanWindows, cayanLit]) t.wrapS = RepeatWrapping;
  const cayanGlass = mergeGeometries(glassParts)!;
  const cayanFrame = mergeGeometries(frameParts)!;
  [...glassParts, ...frameParts].forEach((g) => g.dispose());
  disposables.push(cayanGlass, cayanFrame);
  const cayan = new Group();
  cayan.add(
    new Mesh(
      cayanGlass,
      hazedMaterial(disposables, haze, 0x3a5878, 0.12, {
        map: cayanWindows,
        emissive: new Color(0xffffff),
        emissiveMap: cayanLit,
        emissiveIntensity: 0.9,
        metalness: 0.45,
        roughness: 0.2,
      }),
    ),
    new Mesh(
      cayanFrame,
      hazedMaterial(disposables, haze, 0xe8e2da, 0.15, {
        emissive: new Color(0xffd8b0),
        emissiveIntensity: 0.08,
      }),
    ),
  );
  return cayan;
}
