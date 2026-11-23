// Santa Monica Pier, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the beach bike
// path on a late summer afternoon, closed for the ride. The concrete path runs across the golden
// sand with its yellow centre line, between the event's barriers and the crowd standing on the
// sand. On the left the beach runs down to the surf past the painted lifeguard towers, and the
// surfers wait for the breakers beyond it. On the right a line of palms stands before the beach
// houses and hotels of the front, and the Santa Monica Mountains fade into the haze behind them.
// Ahead the pier crosses the path on its pilings, the Pacific Park Ferris wheel turning over its
// deck beside the red and yellow loops of the coaster.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags, palms, lifeguard towers, road paint, figures and box builder of world-kit.ts.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  type Texture,
  TorusGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  barrierBannerTexture,
  type BannerPanel,
  BoxBuilder,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  dashTexture,
  FeatherFlags,
  type FeatherWord,
  Figures,
  hazedMaterial,
  LifeguardTowers,
  loopMetres,
  paintedRows,
  Palms,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 30;
const KERB = 0.05;
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.8;
/** The surf this far out on the left, the palms and the front's houses on the right. */
const SURF = 34;
const PALMS = 11;
const FRONT = 26;
/** The horizon this far ahead. */
const AHEAD = 220;
const HAZE = 0xf2d6b8;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** Southern California in summer: tank tops, board shorts, sun hats and bright swimwear. */
const BEACH: Wardrobe = {
  tops: [
    '#ffffff',
    '#ffd23a',
    '#ff6a5a',
    '#2fc8d8',
    '#ff9ec9',
    '#1d4f8f',
    '#ff8a1a',
    '#3ab06a',
    '#f4e4c8',
    '#1b1e24',
  ],
  bottoms: ['#3a5a8a', '#20242b', '#e8d8b8', '#ffffff', '#2fa8c8', '#f2a03a'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1d4f8f', ink: '#ffffff', text: 'SANTA MONICA' },
  { fill: '#ffd23a', ink: '#1b1e24', text: 'PIER RIDE' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#ff6a5a', ink: '#ffffff', text: 'CALIFORNIA' },
  { fill: '#ffffff', ink: '#1d4f8f', text: 'LOSE WEIGHT FAST' },
  { fill: '#2fc8d8', ink: '#1b1e24', text: 'LA' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['SANTA MONICA · PIER RIDE', '#1d4f8f', '#ffffff', 300],
  ['WATTZUP · CARDIO 20', '#ff6a5a', '#ffffff', 440],
];
const FEATHERS: readonly FeatherWord[] = [
  ['SANTA MONICA', '#1d4f8f', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['CALIFORNIA', '#ff6a5a', '#ffffff'],
  ['PIER RIDE', '#ffd23a', '#1b1e24'],
];
const FEATHER_EVERY = 22;
/** The names and cries chalked on the path. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['GO MAYA', '#ffffff'],
  ['ALLEZ JONAS', '#ffd23a'],
  ['ANA!', '#ffffff'],
  ['SOPHIE', '#ff9ec9'],
  ['KENJI', '#2fc8d8'],
  ['RAVI!', '#d7ff3a'],
  ['CARDIO', '#ffffff'],
  ['SURF UP', '#ffd23a'],
];
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['SANTA MONICA', '#ffffff'],
  ['TO THE PIER', '#ffd23a'],
  ['WATTZUP', '#d7ff3a'],
];
/** The front's beach houses and low hotels: their paint, from white stucco to sun-faded pastel. */
const STUCCO = ['#f6f0e4', '#f2dcc0', '#e8c8b0', '#cfe0e4', '#f4e8c8', '#e0d0e8', '#fbfaf6'];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
}

export class SantaMonicaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private readonly sea = new Group();
  private wheel: Group | null = null;
  private time = 0;
  private readonly flagMaterials = ['#1d4f8f', '#ffffff', '#ff6a5a', '#ffd23a'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // Along the palms in long files, and on the beach side in short knots 60 m apart, so the
    // beach, the breakers and the surfers show between them.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.65,
      wardrobe: BEACH,
      flags: this.flagMaterials,
      flagShare: 0.12,
      seeds: [6111, 6117],
      skip: (side, offset) => (side < 0 ? offset % 60 < 48 : offset % 36 < 8),
      armsUp: 0.15,
    });
    this.group.add(this.horizon, this.sea);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addSea();
    this.addBeach();
    this.addPalms();
    this.addFront();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addPier();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The Pacific Wheel turns slowly.
    if (this.wheel) this.wheel.rotation.z = seconds * 0.06;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea, so the Pacific shows beyond the surf. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position');
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 3);
      position.setY(i * 2 + 1, p.height - 3);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(Math.max(metres, 0));
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 12;
      prop.mesh.position.set(prop.x, ground(metres) + KERB, -metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.sea.position.y = ground(0);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The concrete path with its dashed yellow centre line, the sand out to the surf on the left
   * and back to the front on the right, the foam of the breaking waves, and the barriers.
   */
  private addGround(roadHalf: number, points: number): void {
    const concrete = this.material({
      map: this.repeat(concreteTexture(), 4, 4),
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, concrete, [
      [roadHalf + 0.4, 0.006],
      [-roadHalf - 0.4, 0.006],
    ]);
    const dashes = this.track(dashTexture('#f2c230'));
    dashes.wrapT = RepeatWrapping;
    dashes.repeat.set(1, 1 / 6);
    const centre = this.material({
      map: dashes,
      alphaTest: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
    this.ribbons.add(points, centre, [
      [0.08, 0.012],
      [-0.08, 0.012],
    ]);
    const sand = this.material({ map: this.repeat(sandTexture(), 6, 6), roughness: 1 });
    this.ribbons.add(points, sand, [
      [FRONT + 60, KERB - 0.1],
      [roadHalf + 0.4, KERB - 0.04],
    ]);
    this.ribbons.add(points, sand, [
      [-roadHalf - 0.4, KERB - 0.04],
      [-SURF, -0.6],
    ]);
    const wet = this.material({ color: 0xb8a07a, roughness: 0.3, metalness: 0.1 });
    this.ribbons.add(points, wet, [
      [-SURF, -0.6],
      [-SURF - 4, -0.75],
    ]);
    const foam = this.material({ color: 0xf6f8f6, roughness: 0.6 });
    for (const x of [SURF + 4, SURF + 14, SURF + 26]) {
      this.ribbons.add(points, foam, [
        [-x, -0.72],
        [-x - 1.6 - x / 30, -0.72],
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

  /** The Pacific: deep blue to the horizon beyond the surf, glittering in the low sun. */
  private addSea(): void {
    const water = this.material({
      map: this.repeat(seaTexture(), 30, 30),
      color: 0x4a7aa8,
      roughness: 0.15,
      metalness: 0.3,
    });
    const plane = new PlaneGeometry(4000, 6000);
    plane.rotateX(-Math.PI / 2);
    plane.translate(-SURF - 2 - 2000, -0.7, -2000);
    this.disposables.push(plane);
    this.sea.add(new Mesh(plane, water));
  }

  /**
   * The beach on the left, in chunks along the shore: umbrellas and towels, bathers on the sand,
   * a painted lifeguard tower every 60 m, and beyond the surf the surfers on their boards,
   * standing to ride a breaker or sitting astride to wait for the next.
   */
  private addBeach(): void {
    const random = seeded(6121);
    const towers = new LifeguardTowers(this.disposables, this.track);
    const pole = new CylinderGeometry(0.03, 0.03, 2.2, 5);
    pole.translate(0, 1.1, 0);
    const canopy = new CylinderGeometry(0.05, 1.3, 0.45, 8, 1, true);
    canopy.translate(0, 2.2, 0);
    this.disposables.push(pole, canopy);
    const white = this.material({ color: 0xf4f4f0, roughness: 0.7 });
    const umbrellas = ['#ff6a5a', '#ffd23a', '#2fc8d8', '#ff9ec9', '#1d4f8f', '#3ab06a'].map((c) =>
      this.material({ color: c, roughness: 0.8, side: DoubleSide }),
    );
    const boards = ['#ffffff', '#ffd23a', '#ff6a5a', '#2fc8d8', '#f4e4c8'].map((c) =>
      this.material({ color: c, roughness: 0.4 }),
    );
    const crest = this.material({ color: 0xe8f2f4, roughness: 0.5 });
    const face = this.material({ color: 0x3a7a98, roughness: 0.2, metalness: 0.2 });
    const CHUNK = 60;
    for (let offset = 0, k = 0; offset < LOOP; offset += CHUNK, k++) {
      const holder = new Group();
      const b = new BoxBuilder();
      const people: [number, number, number, number][] = [];
      for (let n = 0; n < 12; n++) {
        const x = -BARRIER - 7 - random() ** 1.3 * (SURF - 14);
        const z = -random() * CHUNK;
        const u = new Mesh(canopy, umbrellas[Math.floor(random() * umbrellas.length)]!);
        const p = new Mesh(pole, white);
        for (const m of [u, p]) {
          m.position.set(x, -0.3, z);
          holder.add(m);
        }
        b.box(umbrellas[(n + 2) % umbrellas.length]!, [0.9, 0.03, 1.8], [x + 1.2, -0.28, z + 0.4]);
        people.push([x + 1.5, -0.3, z - 0.6, 0.95], [x - 1 + random() * 2, -0.3, z + 1.5, 0.95]);
      }
      // The surfers: on their boards beyond the surf, a third standing to ride a breaker.
      // The breakers rolling in: a green-blue face under a white crest, a few to each stretch.
      const breakers: [number, number][] = [];
      for (let n = 0; n < 3; n++) {
        const x = -SURF - 9 - n * 8 - random() * 3;
        const z = -random() * CHUNK;
        const long = 10 + random() * 14;
        b.box(face, [2.2, 0.9, long], [x, -0.55, z], -0.5);
        b.box(crest, [1.2, 0.45, long - 1], [x + 0.6, -0.08, z], -0.2);
        breakers.push([x, z]);
      }
      for (let n = 0; n < 9; n++) {
        // A third standing to ride a breaker's face, the rest sitting astride waiting beyond.
        const [bx, bz] = breakers[n % 3]!;
        const riding = n % 3 === 0;
        const x = riding ? bx + 1.6 : -SURF - 12 - random() * 24;
        const z = riding ? bz + (random() - 0.5) * 6 : -random() * CHUNK;
        b.box(boards[n % boards.length]!, [0.55, 0.08, 2.2], [x, -0.66, z]);
        people.push([x, riding ? -0.62 : -1.25, z, riding ? 0.9 : 0.95]);
      }
      holder.add(b.build(this.disposables));
      const figures = new Figures(holder, this.disposables, people.length, BEACH, 6131 + k);
      people.forEach(([x, y, z, scale], i) =>
        figures.set(i, x, y, z, random() * Math.PI * 2, scale),
      );
      figures.commit();
      const tower = towers.make(k);
      // Ramp down toward the path, the hut looking out to sea.
      tower.rotation.y = Math.PI;
      tower.position.set(-17 - (k % 2) * 6, -0.3, -30);
      holder.add(tower);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /** A line of palms along the path's right side, and a second, taller line before the front. */
  private addPalms(): void {
    const palms = new Palms(this.disposables, this.track);
    const random = seeded(6141);
    const plant = (x: number, offset: number, scale: number) => {
      const palm = palms.make(random);
      palm.scale.multiplyScalar(scale);
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, x });
    };
    for (let offset = 6; offset < LOOP; offset += 13) plant(PALMS + random() * 1.5, offset, 1);
    for (let offset = 12; offset < LOOP; offset += 19) {
      plant(FRONT - 5 + random() * 2, offset, 1.5);
    }
  }

  /**
   * The front on the right: beach houses and low hotels in white stucco and faded pastels, two to
   * five storeys, flat roofs with a parapet, rows of windows, balconies on the taller ones, a
   * striped awning over the ground floor's café or shop, and a red-tiled roof on every third. The
   * tall ones without tiles step back to a penthouse, and every fifth is a deco hotel in
   * turquoise with white fins running up its face to a stepped crown.
   */
  private addFront(): void {
    const random = seeded(6151);
    const glass = this.material({ color: 0x5a7890, roughness: 0.15, metalness: 0.4 });
    const rail = this.material({ color: 0xf8f8f4, roughness: 0.6 });
    const tile = this.material({ color: 0xb85a3a, roughness: 0.85 });
    const walls = STUCCO.map((c) => this.material({ color: c, roughness: 0.9 }));
    const deco = this.material({ color: 0x7ec8c0, roughness: 0.85 });
    const awnings = ['#1d4f8f', '#ff6a5a', '#3ab06a', '#ffd23a', '#2fc8d8'].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    for (let offset = 0, k = 0; offset < LOOP; k++) {
      const width = 12 + random() * 14;
      const floors = k % 5 === 3 ? 6 : 2 + Math.floor(random() * 4);
      const tall = floors * 3.2 + 0.8;
      const deep = 12 + random() * 6;
      const hotel = k % 5 === 3;
      const wall = hotel ? deco : walls[k % walls.length]!;
      const b = new BoxBuilder();
      b.box(wall, [deep, tall, width], [deep / 2, tall / 2, 0]);
      b.box(rail, [0.4, 0.5, width + 0.2], [0, tall + 0.25, 0]);
      for (let f = 0; f < floors; f++) {
        const y = 1.9 + f * 3.2;
        for (let z = -width / 2 + 1.8; z < width / 2 - 1.2; z += 3) {
          b.box(glass, [0.12, 1.6, 1.8], [-0.04, y, z]);
        }
        if (floors > 3 && f > 0) {
          // A balcony along the floor, its white rail.
          b.box(rail, [1.2, 0.15, width - 1], [-0.6, y - 1.1, 0]);
          b.box(rail, [0.08, 0.9, width - 1], [-1.2, y - 0.6, 0]);
        }
      }
      // The ground floor's awning over its café or shop.
      b.box(awnings[k % awnings.length]!, [1.8, 0.12, width - 1.5], [-0.8, 3.0, 0], 0.32);
      if (hotel) {
        // The deco hotel's white fins up its face, and its stepped crown.
        for (let z = -width / 2 + 0.5; z <= width / 2 - 0.5; z += 3) {
          b.box(rail, [0.5, tall + 1.2, 0.35], [-0.2, (tall + 1.2) / 2, z]);
        }
        b.box(wall, [deep * 0.5, 3, width * 0.5], [deep / 2, tall + 1.5, 0]);
        b.box(rail, [deep * 0.5 + 0.3, 0.4, width * 0.5 + 0.3], [deep / 2, tall + 3.1, 0]);
        b.box(wall, [deep * 0.25, 2.4, width * 0.25], [deep / 2, tall + 4.4, 0]);
      } else if (floors > 3 && k % 3 !== 1) {
        // A penthouse stepped back from the parapet, glazed across its front.
        b.box(wall, [deep * 0.55, 3, width * 0.6], [deep * 0.6, tall + 1.5, 0]);
        b.box(glass, [0.12, 1.8, width * 0.5], [deep * 0.6 - deep * 0.275 - 0.04, tall + 1.6, 0]);
        b.box(rail, [deep * 0.55 + 0.3, 0.3, width * 0.6 + 0.3], [deep * 0.6, tall + 3.1, 0]);
      }
      if (k % 3 === 1 && !hotel) {
        // A red-tiled roof, hipped low over the top floor.
        b.box(tile, [deep * 0.72, 1.4, width * 0.72], [deep / 2, tall + 0.5, 0], 0);
        b.box(tile, [deep * 0.4, 0.8, width * 0.4], [deep / 2, tall + 1.5, 0], 0);
      }
      const holder = b.build(this.disposables);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + width / 2, x: FRONT + random() * 4 });
      offset += width + 3 + random() * 8;
    }
  }

  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.1, 0.1, 6.4, 8);
    post.translate(0, 3.2, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1.2, 2);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0xe8e8e8, metalness: 0.4, roughness: 0.5 });
    for (const [text, fill, ink, offset] of STREET_BANNERS) {
      const banner = new Group();
      for (const x of [-roadHalf - 0.7, roadHalf + 0.7]) {
        const p = new Mesh(post, steel);
        p.position.x = x;
        banner.add(p);
      }
      const c = new Mesh(
        cloth,
        this.material({
          map: this.track(clothBannerTexture(text, fill, ink)),
          side: DoubleSide,
        }),
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
      {
        loop: LOOP,
        every: 8,
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
   * Ahead, the pier across the path: its deck on rows of timber pilings, running from the front
   * on the right out over the beach and the surf on the left, its white rail and lamps. On the
   * deck, the Pacific Park Ferris wheel turning left of the path, its white rim and spokes and
   * bright gondolas; the coaster's red track and yellow supports looping beside it; the arcades'
   * roofs; and behind the front, the Santa Monica Mountains fading into the haze. All hazed by
   * hand.
   */
  private addPier(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const DECK = 8;
    const timber = hazedMaterial(this.disposables, haze, 0x5a4a3c, 0.2);
    const white = hazedMaterial(this.disposables, haze, 0xf6f4ee, 0.12);
    // The deck and its pilings, from x = 40 on the land to x = -320 out at sea.
    const pier = new BoxBuilder();
    pier.box(timber, [360, 1.2, 18], [-140, DECK, 0]);
    pier.box(white, [360, 1.1, 0.2], [-140, DECK + 1.15, 9]);
    for (let x = 38; x > -320; x -= 4) {
      for (const z of [-8, -2.5, 2.5, 8])
        pier.box(timber, [0.5, DECK, 0.5], [x, DECK / 2 - 0.6, z]);
      if (x % 8 === 0) pier.box(timber, [0.3, 0.3, 17], [x, DECK - 2.4, 0]);
    }
    for (let x = 30; x > -320; x -= 16) {
      pier.box(white, [0.18, 4, 0.18], [x, DECK + 2.6, 8.6]);
      pier.box(white, [0.6, 0.6, 0.6], [x, DECK + 4.7, 8.6]);
    }
    // The arcades and cafés along the deck: low roofs in white and teal.
    const teal = hazedMaterial(this.disposables, haze, 0x2a9aa8, 0.15);
    const coral = hazedMaterial(this.disposables, haze, 0xf27a5a, 0.15);
    for (const [x, w, tall, m] of [
      [-70, 18, 5.5, coral],
      [-96, 14, 4.5, white],
      [-140, 20, 5, teal],
    ] as const) {
      pier.box(m, [w, tall, 8], [x, DECK + 0.6 + tall / 2, -3]);
    }
    // The Looff Hippodrome below the entrance, between the arch and Pacific Park: the carousel's cream house, its row of arched
    // windows, and its hipped roof in pale green under a cupola.
    const cream = hazedMaterial(this.disposables, haze, 0xf4e8d0, 0.12);
    const green = hazedMaterial(this.disposables, haze, 0x8ab8a0, 0.15);
    const dark = hazedMaterial(this.disposables, haze, 0x3a4a5a, 0.15);
    pier.box(cream, [18, 7, 14], [-9, DECK + 4.1, -2]);
    for (let x = -16.5; x < -1; x += 2.5) pier.box(dark, [1.4, 2.6, 0.2], [x, DECK + 4.2, 5.05]);
    pier.box(cream, [3, 2.2, 3], [-9, DECK + 12.3, -2]);
    h.add(pier.build(this.disposables));
    const hip = new CylinderGeometry(0, 1, 1, 4, 1);
    hip.rotateY(Math.PI / 4);
    hip.scale(14, 3.6, 11);
    hip.translate(-9, DECK + 9.4, -2);
    const cap = new CylinderGeometry(0, 1, 1, 8, 1);
    cap.scale(2.4, 2, 2.4);
    cap.translate(-9, DECK + 14.4, -2);
    this.disposables.push(hip, cap);
    h.add(new Mesh(hip, green), new Mesh(cap, green));
    // The neon arch over the pier's entrance, its sign glowing blue and white in the late sun.
    const sign = this.track(archTexture());
    const archBoard = new PlaneGeometry(22, 6.9);
    archBoard.translate(13, DECK + 9.2, 9.6);
    this.disposables.push(archBoard);
    h.add(
      new Mesh(
        archBoard,
        hazedMaterial(this.disposables, haze, 0xffffff, 0, {
          map: sign,
          emissiveMap: sign,
          emissive: new Color(0xffffff),
          emissiveIntensity: 0.55,
          alphaTest: 0.5,
          side: DoubleSide,
        }),
      ),
    );
    const archPosts = new BoxBuilder();
    for (const x of [3, 23]) archPosts.box(white, [0.5, 7, 0.5], [x, DECK + 4.1, 9.6]);
    h.add(archPosts.build(this.disposables));
    // The Pacific Wheel: its rim, spokes and hub, its gondolas hung round it, on two A-frames.
    const R = 13;
    const HUB = DECK + R + 3;
    const parts: BufferGeometry[] = [];
    for (const z of [-1.2, 1.2]) {
      const rim = new TorusGeometry(R, 0.3, 6, 64);
      rim.translate(0, 0, z);
      parts.push(rim);
      for (let k = 0; k < 20; k++) {
        const spoke = new BoxGeometry(0.16, R, 0.16);
        spoke.translate(0, R / 2, z);
        spoke.rotateZ((k / 20) * Math.PI * 2);
        parts.push(spoke);
      }
    }
    const hub = new CylinderGeometry(0.9, 0.9, 3, 12);
    hub.rotateX(Math.PI / 2);
    parts.push(hub);
    const frame = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(frame);
    const wheel = new Group();
    wheel.add(new Mesh(frame, white));
    const cars = ['#ff6a5a', '#ffd23a', '#2fc8d8', '#ff9ec9', '#3ab06a', '#ff8a1a'].map((c) =>
      hazedMaterial(this.disposables, haze, c, 0.1),
    );
    const car = new BoxGeometry(1.6, 1.8, 1.8);
    this.disposables.push(car);
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      const m = new Mesh(car, cars[k % cars.length]!);
      m.position.set(R * Math.cos(a), R * Math.sin(a) - 1, 0);
      wheel.add(m);
    }
    // Its lights round the rim, already lit in the low sun.
    const bulbs: BufferGeometry[] = [];
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2;
      const bulb = new BoxGeometry(0.45, 0.45, 0.45);
      bulb.translate((R + 0.1) * Math.cos(a), (R + 0.1) * Math.sin(a), 1.4);
      bulbs.push(bulb);
      if (k % 6 === 0) {
        for (let r = 3; r < R; r += 2.5) {
          const spokeBulb = new BoxGeometry(0.35, 0.35, 0.35);
          spokeBulb.translate(r * Math.cos(a), r * Math.sin(a), 1.4);
          bulbs.push(spokeBulb);
        }
      }
    }
    const lights = mergeGeometries(bulbs)!;
    bulbs.forEach((b) => b.dispose());
    this.disposables.push(lights);
    wheel.add(
      new Mesh(
        lights,
        hazedMaterial(this.disposables, haze, 0xfff2c8, 0, {
          emissive: new Color(0xffe2a0),
          emissiveIntensity: 1.6,
        }),
      ),
    );
    wheel.position.set(-38, HUB, -2);
    h.add(wheel);
    this.wheel = wheel;
    const legs = new BoxBuilder();
    for (const dz of [-2, 2]) {
      for (const dx of [-7, 7]) {
        const len = Math.hypot(dx, HUB - DECK);
        legs.box(
          white,
          [0.5, len, 0.5],
          [-38 + dx / 2, DECK + (HUB - DECK) / 2, -2 + dz],
          Math.atan2(dx, HUB - DECK),
        );
      }
    }
    h.add(legs.build(this.disposables));
    // The coaster: its red track looping over yellow supports beside the wheel.
    const coaster = new BoxBuilder();
    const red = hazedMaterial(this.disposables, haze, 0xd8283a, 0.12);
    const yellow = hazedMaterial(this.disposables, haze, 0xf2c230, 0.12);
    const rise = (u: number) =>
      DECK + 3 + 9 * Math.abs(Math.sin(u * Math.PI * 2.5)) * (1 - u * 0.4);
    for (let u = 0; u < 1; u += 0.01) {
      const x0 = -50 - 30 * u;
      const x1 = -50 - 30 * (u + 0.01);
      const y0 = rise(u);
      const y1 = rise(u + 0.01);
      const z = -6 + 3 * Math.sin(u * Math.PI * 4);
      coaster.box(
        red,
        [Math.hypot(x1 - x0, y1 - y0) + 0.1, 0.6, 1.4],
        [(x0 + x1) / 2, (y0 + y1) / 2, z],
        Math.atan2(y1 - y0, x1 - x0),
      );
      if (Math.round(u * 100) % 5 === 0) {
        coaster.box(yellow, [0.35, y0 - DECK, 0.35], [x0, DECK + (y0 - DECK) / 2, z]);
      }
    }
    h.add(coaster.build(this.disposables));
    // The Santa Monica Mountains across the bay beyond the pier and on to Malibu, two ridgelines
    // of jagged crests, each one flat silhouette hazed by its distance.
    const random = seeded(6161);
    for (const [far, tone, amount, base, rough] of [
      [900, 0x5a6878, 0.55, 40, 60],
      [1300, 0x7a8698, 0.7, 70, 80],
    ] as const) {
      const ridge = new Shape();
      ridge.moveTo(-1600, -10);
      let y: number = base;
      for (let x = -1600; x <= 1400; x += 30) {
        // A slow swell under quick crests, highest behind the pier and falling to the coast.
        y = Math.max(8, y * 0.6 + 0.4 * (base + rough * (0.5 + 0.5 * Math.sin(x / 260 + far))));
        const crest = y + (random() - 0.4) * rough * 0.35;
        ridge.lineTo(x, crest * (1 - Math.max(0, x - 200) / 1600));
      }
      ridge.lineTo(1400, -10);
      const silhouette = new ShapeGeometry(ridge);
      silhouette.translate(0, -4, -far);
      this.disposables.push(silhouette);
      h.add(new Mesh(silhouette, hazedMaterial(this.disposables, haze, tone, amount)));
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
 * The pier's neon arch: a navy board with a curved top and a white border, SANTA MONICA along
 * its crown, YACHT HARBOR across its middle and SPORT FISHING · BOATING · CAFES below, in white
 * neon. Clear outside the arch.
 */
function archTexture(): CanvasTexture {
  return canvasTexture(640, 200, (g) => {
    g.clearRect(0, 0, 640, 200);
    g.beginPath();
    g.moveTo(10, 196);
    g.lineTo(10, 70);
    g.quadraticCurveTo(320, -40, 630, 70);
    g.lineTo(630, 196);
    g.closePath();
    g.fillStyle = '#14306a';
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = '#ffffff';
    g.stroke();
    g.fillStyle = '#ffffff';
    g.shadowColor = '#9ad8ff';
    g.shadowBlur = 10;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 46px sans-serif';
    g.fillText('SANTA MONICA', 320, 62, 520);
    g.font = 'bold 40px sans-serif';
    g.fillText('YACHT HARBOR', 320, 116, 560);
    g.font = 'bold 24px sans-serif';
    g.fillText('SPORT FISHING · BOATING · CAFES', 320, 164, 580);
  });
}

/** Four metres of the path's pale concrete: its expansion joints and the sand blown over it. */
function concreteTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#c8c2b6', 6171);
    g.fillStyle = 'rgba(70,64,56,0.4)';
    g.fillRect(0, 0, 128, 2);
    const random = seeded(6173);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = 'rgba(232,212,174,0.5)';
      g.fillRect(random() * 128, random() * 128, 6 + random() * 14, 2 + random() * 3);
    }
  });
}

function sandTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#ead6ae', 6181));
}

/** The Pacific: deep blue, the low sun's glints and the darker swell. */
function seaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#3a6a98';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(6191);
    for (let i = 0; i < 180; i++) {
      g.fillStyle = random() < 0.55 ? 'rgba(255,236,200,0.5)' : 'rgba(16,40,70,0.4)';
      g.fillRect(random() * 128, random() * 128, 4 + random() * 10, 1.5);
    }
  });
}
