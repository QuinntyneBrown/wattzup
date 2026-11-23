// Ibiza Sunset Strip, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// the waterfront strip of San Antonio as the sun goes down, closed for the ride. On the left the
// promenade and its palms above the rocks, the sea glowing violet and gold out to the horizon; on
// the right the whitewashed beach clubs with their neon names, pergola terraces and palms, a DJ
// terrace sweeping its light beams into the dusk, and festoon lights strung across the strip.
// Ahead, the sun sinks into the sea beside the island of Conillera, a path of gold across the
// water toward the rider.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags, road paint, palms and box builder of world-kit.ts.
import {
  AdditiveBlending,
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  type BannerPanel,
  barrierBannerTexture,
  BoxBuilder,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  haloTexture,
  hazedMaterial,
  loopMetres,
  paintedRows,
  Palms,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  slopeAt,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 500;
const BEHIND = 30;
const KERB = 0.14;
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.6;
/** The promenade's seawall on the left, the rocks and the sea below it. */
const WALL = 9;
const SEA = 14;
/** The clubs' fronts on the right. */
const CLUBS = 10;
/** The horizon this far ahead. */
const AHEAD = 280;
/** The sun sits low over the sea this far left of the road's line, in degrees, as in the look. */
const SUN_AZIMUTH = -14;
/** The festoons cross the strip this often. */
const FESTOON_EVERY = 36;
/** The DJ terrace in the opening view, its beams sweeping the sky. */
const DJ = 150;
const HAZE = 0xf2a77a;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** The sunset crowd in white linen, beachwear and neon. */
const PARTY: Wardrobe = {
  tops: [
    '#ffffff',
    '#f4ece0',
    '#ff4a9a',
    '#3ac8e8',
    '#f2c230',
    '#ff7a3a',
    '#d7ff3a',
    '#8a5ae8',
    '#1d3c8f',
    '#e8d0b0',
  ],
  bottoms: ['#f4ece0', '#20242b', '#c8b89a', '#3a5a8a', '#e8a8a0', '#ffffff'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#ff4a9a', ink: '#ffffff', text: 'IBIZA' },
  { fill: '#1b1e24', ink: '#f2c230', text: 'SUNSET STRIP' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#3ac8e8', ink: '#1b1e24', text: 'SANT ANTONI' },
  { fill: '#ff7a3a', ink: '#ffffff', text: 'DROP THE BASS' },
  { fill: '#8a5ae8', ink: '#ffffff', text: '128 BPM' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['IBIZA · SUNSET STRIP', '#ff4a9a', '#ffffff', 118],
  ['WATTZUP · INTERVALS TO THE BEAT', '#1b1e24', '#d7ff3a', 215],
];
const FEATHERS: readonly FeatherWord[] = [
  ['IBIZA', '#ff4a9a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['SUNSET', '#ff7a3a', '#ffffff'],
  ['128 BPM', '#8a5ae8', '#ffffff'],
];
const FEATHER_EVERY = 18;
/** The names and cries the crowd paints on the strip, bright against the dusk. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['DROP IT', '#ff4a9a'],
  ['128 BPM', '#ffffff'],
  ['GO ANA', '#f2c230'],
  ['ON THE BEAT', '#3ae8ff'],
  ['VAMOS', '#d7ff3a'],
  ['SOPHIE!', '#ff7a3a'],
  ['BASS', '#b88aff'],
  ['GO MAYA', '#ffffff'],
  ['SUNSET', '#ff4a9a'],
  ['KENJI', '#f2c230'],
  ['ALLEZ JONAS', '#3ae8ff'],
  ['RAVI!', '#d7ff3a'],
];
/** Slogans painted big across the strip. */
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['IBIZA', '#ff4a9a'],
  ['DROP THE BASS', '#f2c230'],
  ['WATTZUP', '#d7ff3a'],
  ['SUNSET STRIP', '#3ae8ff'],
];
/** A row of paint every few metres: two names either side of the crown, every third a slogan. */
const ROAD_PAINT_EVERY = 7;
/** The beach clubs: their names and their neon. */
const CLUB_NAMES: readonly (readonly [string, string])[] = [
  ['SOL Y MAR', '#ff4a9a'],
  ['LA PUESTA', '#3ae8ff'],
  ['OCASO', '#f2c230'],
  ['CALA BEAT', '#d7ff3a'],
  ['MAR BLAU', '#5a9aff'],
  ['ATARDECER', '#ff7a3a'],
  ['WATTZUP CLUB', '#d7ff3a'],
  ['BLUE BAY', '#b88aff'],
];
/** The DJ terrace's beams. */
const BEAMS = [0xff3a9a, 0x3ae8ff, 0xb88aff, 0xf2c230, 0x3aff9a];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

export class IbizaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private readonly sea = new Group();
  private readonly beams: Mesh[] = [];
  /** The festoons' halos: a soft warm glow added over whatever lies behind each bulb. */
  private readonly glow = new MeshBasicMaterial({
    color: 0xffa040,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
  });
  private time = 0;
  private readonly flagMaterials = ['#ff4a9a', '#3ac8e8', '#f2c230', '#ffffff'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // The crowd packed in front of the clubs, a single loose row on the promenade so the sea
    // shows between them.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.6,
      wardrobe: PARTY,
      flags: this.flagMaterials,
      flagShare: 0.15,
      seeds: [7011, 7017],
      skip: (side, offset, x) => side < 0 && (Math.abs(x) > CROWD_NEAR + 0.6 || offset % 8 < 3),
      armsUp: 0.4,
    });
    this.group.add(this.horizon, this.sea);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials, this.glow);
    this.glow.map = this.track(haloTexture());
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addSea();
    this.addPalms();
    this.addClubs();
    this.addDjTerrace();
    this.addFestoons(roadHalf);
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addSunset();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
    // The DJ's beams sweep the sky on the beat.
    this.beams.forEach((beam, i) => {
      beam.rotation.z = Math.sin(seconds * 1.1 + i * 1.3) * 0.5 + (i - 2) * 0.18;
      beam.rotation.x = Math.cos(seconds * 0.8 + i) * 0.25;
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the road, under the sea; the strip's own land stays. */
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
    this.sea.position.y = ground(0);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The kerbs, the promenade out to its low white seawall on the left and the rocks below it,
   * the pavement to the clubs on the right, and the barriers with their banners.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xd8d0c4, roughness: 0.85 });
    const paving = this.material({ map: this.repeat(pavingTexture(), 3, 3), roughness: 0.9 });
    const wall = this.material({ color: 0xf4eee4, roughness: 0.8 });
    const rock = this.material({ map: this.repeat(rockTexture(), 4, 4), roughness: 1 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
    }
    this.ribbons.add(points, paving, [
      [CLUBS + 40, KERB],
      [r + 0.3, KERB],
    ]);
    // The land behind the clubs, out of sight but under everything.
    const land = this.material({ color: 0xb8a488, roughness: 1 });
    this.ribbons.add(points, land, [
      [400, KERB],
      [CLUBS + 40, KERB],
    ]);
    this.ribbons.add(points, paving, [
      [-r - 0.3, KERB],
      [-WALL, KERB],
    ]);
    this.ribbons.add(points, wall, [
      [-WALL, KERB],
      [-WALL, KERB + 0.8],
      [-WALL - 0.5, KERB + 0.8],
      [-WALL - 0.5, -0.6],
    ]);
    this.ribbons.add(points, rock, [
      [-WALL - 0.5, -0.6],
      [-SEA + 1.5, -1.6],
      [-SEA - 2, -2.6],
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

  /** The sea: violet-blue in the dusk, gold and pink glinting on its ripples. */
  private addSea(): void {
    const water = this.material({
      map: this.repeat(seaTexture(), 30, 30),
      color: 0x8a7aa8,
      roughness: 0.15,
      metalness: 0.3,
    });
    const plane = new PlaneGeometry(6000, 6000);
    plane.rotateX(-Math.PI / 2);
    plane.translate(-SEA + 4 - 3000, -2.2, -2000);
    this.disposables.push(plane);
    this.sea.add(new Mesh(plane, water));
  }

  /** Palms along the promenade and between the clubs. */
  private addPalms(): void {
    const palms = new Palms(this.disposables, this.track);
    const random = seeded(7101);
    const plant = (x: number, offset: number) => {
      const palm = palms.make(random);
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, x });
    };
    for (let offset = 5; offset < LOOP; offset += 13) plant(-7.6 - random(), offset);
    for (let offset = 11; offset < LOOP; offset += 26) plant(8 + random(), offset);
  }

  /**
   * The beach clubs on the right: whitewashed cubes of one to three floors with arched openings
   * and blue doors, their neon names on the roof, a pergola terrace in front strung with lights,
   * and another row of whitewashed blocks behind.
   */
  private addClubs(): void {
    const random = seeded(7201);
    const fronts = [0, 1, 2].map((k) => {
      const texture = this.track(clubTexture(k));
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      return this.material({ map: texture, roughness: 0.85 });
    });
    const white = this.material({ color: 0xf6f0e6, roughness: 0.85 });
    const wood = this.material({ color: 0x8a6440, roughness: 0.8 });
    const bulbs = new MeshBasicMaterial({ color: 0xffd890, toneMapped: false });
    this.disposables.push(bulbs);
    const string = this.festoonGeometry(12, 0.9, 16);
    const strungGlow = this.festoonGlow(12, 0.9, 16, 1.5, true);
    let k = 0;
    for (const row of [0, 1]) {
      for (let offset = row * 7; offset < LOOP; k++) {
        const width = 16 + random() * 12;
        if (row === 0 && Math.abs(offset + width / 2 - DJ) < 24) {
          offset = DJ + 24 - width / 2 + 2;
          continue;
        }
        const floors = 1 + Math.floor(random() * 3) + row;
        const tall = floors * 3.4;
        const depth = 14;
        const shell = new BoxGeometry(depth, tall, width);
        for (const f of [0, 1]) scaleFaceUv(shell, f, width / 6.8, floors);
        for (const f of [4, 5]) scaleFaceUv(shell, f, depth / 6.8, floors);
        shell.translate(depth / 2, tall / 2, 0);
        this.disposables.push(shell);
        const club = new Group();
        club.add(new Mesh(shell, [white, fronts[k % 3]!, white, white, white, white]));
        // The parapet round the roof terrace.
        const b = new BoxBuilder();
        b.box(white, [depth, 0.9, 0.3], [depth / 2, tall + 0.45, width / 2 - 0.15]);
        b.box(white, [depth, 0.9, 0.3], [depth / 2, tall + 0.45, -width / 2 + 0.15]);
        b.box(white, [0.3, 0.9, width], [0.15, tall + 0.45, 0]);
        if (row === 0) {
          // The pergola terrace in front, its lights strung under the beams.
          for (let z = -width / 2 + 1; z <= width / 2 - 1; z += 3.5) {
            b.box(wood, [0.2, 3.2, 0.2], [-3.6, 1.6, z]);
          }
          for (let x = -3.6; x <= 0; x += 1.2) b.box(wood, [0.15, 0.2, width - 1], [x, 3.25, 0]);
          b.box(wood, [3.8, 0.25, 0.25], [-1.8, 3.1, -width / 2 + 1]);
          b.box(wood, [3.8, 0.25, 0.25], [-1.8, 3.1, width / 2 - 1]);
        }
        club.add(b.build(this.disposables));
        if (row === 0) {
          const lights = new Mesh(string, bulbs);
          lights.rotation.y = Math.PI / 2;
          lights.scale.x = (width - 2) / 12;
          lights.position.set(-3.4, 3.0, 0);
          const glow = new Mesh(strungGlow, this.glow);
          glow.rotation.y = Math.PI / 2;
          glow.scale.x = (width - 2) / 12;
          glow.position.set(-3.4, 3.0, 0);
          club.add(lights, glow);
          // The club's neon name on its roof, turned a little toward the rider.
          const [name, neon] = CLUB_NAMES[k % CLUB_NAMES.length]!;
          const sign = new Mesh(
            new PlaneGeometry(Math.min(width - 2, 12), 2.6),
            new MeshBasicMaterial({
              map: this.track(neonTexture(name, neon)),
              transparent: true,
              toneMapped: false,
              side: DoubleSide,
            }),
          );
          this.disposables.push(sign.geometry, sign.material as MeshBasicMaterial);
          sign.rotation.y = -Math.PI / 2 + 0.35;
          sign.position.set(1, tall + 2.2, 0);
          club.add(sign);
        }
        const holder = new Group();
        holder.add(club);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + width / 2,
          x: CLUBS + row * 18,
        });
        offset += width + 1 + random() * 4;
      }
    }
  }

  /**
   * The DJ terrace in the opening view: a raised deck under a white sail canopy, the DJ at the
   * decks between two stacks of speakers, the crowd's heads below, and five coloured beams
   * sweeping up into the dusk on the beat.
   */
  private addDjTerrace(): void {
    const b = new BoxBuilder();
    const deck = this.material({ color: 0x8a6440, roughness: 0.8 });
    const black = this.material({ color: 0x18181c, roughness: 0.6 });
    const white = this.material({ color: 0xf6f0e6, roughness: 0.8 });
    // A stage raised over the crowd's heads, so the decks show from the road.
    b.box(deck, [12, 3.4, 30], [6, 1.7, 0]);
    b.box(black, [2, 1.2, 6], [3, 4, 0]);
    for (const z of [-6, 6]) b.box(black, [2.4, 6, 2.4], [3.4, 6.4, z]);
    for (const z of [-14, 14]) b.box(white, [0.3, 12, 0.3], [11, 9.4, z]);
    b.box(black, [0.6, 9, 19], [11, 9, 0]);
    const g = b.build(this.disposables);
    const sail = new Mesh(
      new PlaneGeometry(14, 30),
      this.material({ color: 0xffffff, side: DoubleSide }),
    );
    this.disposables.push(sail.geometry);
    sail.rotation.set(-Math.PI / 2, -0.25, 0);
    sail.position.set(6, 15, 0);
    g.add(sail);
    // The DJ, arms up.
    const dj = new Mesh(new SphereGeometry(0.4, 10, 8), this.material({ color: 0xd9a17c }));
    this.disposables.push(dj.geometry);
    dj.position.set(4.6, 6, 0);
    const body = new Mesh(
      new CylinderGeometry(0.35, 0.3, 1.4, 8),
      this.material({ color: 0xff4a9a }),
    );
    this.disposables.push(body.geometry);
    body.position.set(4.6, 5, 0);
    g.add(dj, body);
    // The screen behind the DJ, the session's name glowing over a pulse of colour.
    const screen = new Mesh(
      new PlaneGeometry(18, 8.4),
      new MeshBasicMaterial({ map: this.track(screenTexture()), toneMapped: false }),
    );
    this.disposables.push(screen.geometry, screen.material as MeshBasicMaterial);
    screen.rotation.y = -Math.PI / 2 + 0.55;
    screen.position.set(10.6, 9, 0);
    g.add(screen);
    // The beams: long open cones of coloured light, from the decks up into the sky.
    const cone = new ConeGeometry(3.2, 70, 16, 1, true);
    cone.translate(0, -35, 0);
    cone.rotateX(Math.PI);
    this.disposables.push(cone);
    BEAMS.forEach((colour, i) => {
      const material = new MeshBasicMaterial({
        color: colour,
        transparent: true,
        opacity: 0.22,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      });
      this.disposables.push(material);
      const beam = new Mesh(cone, material);
      beam.position.set(3, 4.6, (i - 2) * 3);
      g.add(beam);
      this.beams.push(beam);
    });
    const holder = new Group();
    holder.add(g);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: DJ, x: CLUBS });
    this.setTime(this.time);
  }

  /** A festoon of `count` bulbs on a string `span` long, sagging `sag` at its middle, along x. */
  private festoonGeometry(span: number, sag: number, count: number): BufferGeometry {
    const parts: BufferGeometry[] = [];
    for (let i = 0; i <= count; i++) {
      const u = i / count;
      const bulb = new SphereGeometry(0.14, 6, 4);
      bulb.translate(-span / 2 + u * span, -sag * 4 * u * (1 - u), 0);
      parts.push(bulb);
    }
    const geometry = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(geometry);
    return geometry;
  }

  /**
   * The glow round each bulb of a festoon `span` long along x: a soft warm halo `size` metres
   * across at each bulb, facing the rider, so the strings shine in the dusk rather than dot it.
   * `across` turns each halo a quarter, for a string that is itself turned to run along the road.
   */
  private festoonGlow(
    span: number,
    sag: number,
    count: number,
    size: number,
    across: boolean,
  ): BufferGeometry {
    const parts: BufferGeometry[] = [];
    for (let i = 0; i <= count; i++) {
      const u = i / count;
      const halo = new PlaneGeometry(size, size);
      if (across) halo.rotateY(Math.PI / 2);
      halo.translate(-span / 2 + u * span, -sag * 4 * u * (1 - u), 0);
      parts.push(halo);
    }
    const geometry = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(geometry);
    return geometry;
  }

  /** Festoons of warm bulbs strung across the strip between the palms, every few dozen metres. */
  private addFestoons(roadHalf: number): void {
    const span = 2 * (roadHalf + 4.5);
    const string = this.festoonGeometry(span, 1.4, 34);
    const halo = this.festoonGlow(span, 1.4, 34, 2.4, false);
    const bulbs = new MeshBasicMaterial({ color: 0xffe0a0, toneMapped: false });
    this.disposables.push(bulbs);
    for (let offset = 20; offset < LOOP; offset += FESTOON_EVERY) {
      const holder = new Group();
      const festoon = new Mesh(string, bulbs);
      festoon.position.y = 7.2;
      const glow = new Mesh(halo, this.glow);
      glow.position.y = 7.2;
      holder.add(festoon, glow);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
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
      const c = new Mesh(
        cloth,
        // Lit from within like a festival's light box, so it reads against the sun behind it.
        this.lightBox(this.track(clothBannerTexture(text, fill, ink))),
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

  /**
   * Names and cries painted all over the strip in bright pink, gold, aqua, lime and white: a row
   * every few metres of two names either side of the crown, every third a slogan right across.
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
   * Ahead and to the left, the sunset itself: the sky's own sun low over the sea, a path of gold
   * across the water from under it toward the rider, the island of Conillera dark against the
   * glow with its lighthouse, the islets beside it, and the headland of the bay ahead with its
   * whitewashed town, all hazed by hand.
   */
  private addSunset(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const azimuth = (SUN_AZIMUTH * Math.PI) / 180;
    const far = 2400;
    // The path of gold on the water, from under the sun toward the shore.
    const path = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        map: this.track(glitterTexture()),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
        toneMapped: false,
      }),
    );
    this.disposables.push(path.geometry, path.material as MeshBasicMaterial);
    path.rotation.x = -Math.PI / 2;
    path.rotation.z = -azimuth;
    path.scale.set(110, far - 40, 1);
    const mid = far / 2 + 20;
    path.position.set(Math.sin(azimuth) * mid, -2.1, -Math.cos(azimuth) * mid);
    this.sea.add(path);
    // Conillera, long and rugged against the glow: a ridge of rocky peaks rising from sheer
    // cliffs at either end, the islets off its tip, and the lighthouse on its point, lit.
    const island = hazedMaterial(this.disposables, haze, 0x3e2a48, 0.22);
    const random = seeded(7301);
    const ridge = (from: number, to: number, high: number, z: number, depth: number) => {
      const shape = new Shape();
      shape.moveTo(from, -6);
      shape.lineTo(from + 6, high * 0.45);
      // A rolling, uneven crest: a long swell broken by humps and saddles, not a regular saw.
      const steps = Math.round((to - from) / 8);
      const phase = random() * 6;
      for (let k = 1; k < steps; k++) {
        const u = k / steps;
        const swell = Math.sin(Math.PI * u) ** 0.45;
        const rough = 0.82 + 0.12 * Math.sin(7 * u + phase) + 0.07 * Math.sin(19 * u + 2 * phase);
        shape.lineTo(from + (to - from) * u, high * (0.5 + 0.5 * swell) * rough);
      }
      shape.lineTo(to - 6, high * 0.4);
      shape.lineTo(to, -6);
      shape.closePath();
      const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
      geometry.translate(0, 0, z - depth / 2);
      this.disposables.push(geometry);
      h.add(new Mesh(geometry, island));
    };
    ridge(-980, -260, 92, -720, 140);
    ridge(-240, -180, 26, -690, 40);
    ridge(-165, -140, 14, -680, 24);
    ridge(-1180, -1010, 40, -760, 60);
    const tower = new Mesh(
      new CylinderGeometry(2.2, 2.8, 16, 10),
      hazedMaterial(this.disposables, haze, 0xf4ece0, 0.15),
    );
    this.disposables.push(tower.geometry);
    tower.position.set(-430, 74, -650);
    h.add(tower);
    const lamp = new Mesh(
      new SphereGeometry(3, 12, 8),
      new MeshBasicMaterial({ color: 0xfff0c0, toneMapped: false, fog: false }),
    );
    this.disposables.push(lamp.geometry, lamp.material as MeshBasicMaterial);
    lamp.position.set(-430, 84, -650);
    h.add(lamp);
    // The headland of the bay ahead and right, its whitewashed town climbing the hill.
    const hill = hazedMaterial(this.disposables, haze, 0x6a5a48, 0.35);
    const headland = new Mesh(new SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), hill);
    this.disposables.push(headland.geometry);
    headland.scale.set(500, 90, 240);
    headland.position.set(420, -8, -420);
    h.add(headland);
    const town = hazedMaterial(this.disposables, haze, 0xf6efe4, 0.25);
    const box = new BoxGeometry(1, 1, 1);
    this.disposables.push(box);
    const scatter = seeded(7303);
    for (let k = 0; k < 70; k++) {
      const x = 40 + scatter() * 420;
      const z = -120 - scatter() * 320;
      const lift = Math.max(0, 90 * (1 - ((x - 420) / 500) ** 2 - ((z + 420) / 240) ** 2)) - 8;
      const tall = 6 + scatter() * 10;
      const block = new Mesh(box, town);
      block.scale.set(10 + scatter() * 12, tall, 10 + scatter() * 10);
      block.position.set(x, lift + tall / 2 - 2, z);
      h.add(block);
    }
  }

  /** A printed cloth lit from within, its own colours glowing through it. */
  private lightBox(map: CanvasTexture): MeshStandardMaterial {
    return this.material({
      map,
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: 0.55,
      side: DoubleSide,
    });
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

/** The promenade's pale paving. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#e4d8c4';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(140,120,96,0.35)';
    g.lineWidth = 2;
    for (let p = 0; p <= 128; p += 32) {
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, 128);
      g.moveTo(0, p);
      g.lineTo(128, p);
      g.stroke();
    }
  });
}

/** The rocks below the seawall: warm grey limestone, cracked and pitted. */
function rockTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#8a7a68';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(7401);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(50,40,32,0.3)' : 'rgba(200,180,150,0.25)';
      g.fillRect(random() * 256, random() * 256, 4 + random() * 10, 3 + random() * 6);
    }
  });
}

/** The sea at dusk: violet blue, gold and pink glinting on its ripples. */
function seaTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#6a6aa0';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(7403);
    for (let i = 0; i < 1500; i++) {
      const gold = random() < 0.5;
      g.fillStyle = gold
        ? `rgba(255,${180 + random() * 60},${90 + random() * 60},${0.08 + random() * 0.25})`
        : `rgba(255,${120 + random() * 60},${170 + random() * 50},${0.06 + random() * 0.2})`;
      g.fillRect(random() * 512, random() * 512, 10 + random() * 26, 1.5);
    }
  });
}

/** A club's front, one bay a floor: whitewash, an arched opening and a blue door or shutters. */
function clubTexture(seed: number): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.fillStyle = '#f6f0e6';
    g.fillRect(0, 0, 128, 64);
    const random = seeded(7500 + seed);
    for (const x of [16, 76]) {
      g.fillStyle = random() < 0.5 ? '#2a5a9a' : '#2a2a30';
      g.beginPath();
      g.moveTo(x, 60);
      g.lineTo(x, 26);
      g.arc(x + 18, 26, 18, Math.PI, 0);
      g.lineTo(x + 36, 60);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,210,140,0.45)';
      g.fillRect(x + 6, 30, 24, 26);
    }
    g.fillStyle = 'rgba(180,160,130,0.25)';
    g.fillRect(0, 0, 128, 3);
  });
}

/** A club's neon name: glowing tubes of `neon` lettering on clear, a halo round them. */
function neonTexture(name: string, neon: string): CanvasTexture {
  return canvasTexture(512, 112, (g) => {
    g.clearRect(0, 0, 512, 112);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold italic 76px sans-serif';
    g.shadowColor = neon;
    g.shadowBlur = 22;
    g.fillStyle = neon;
    g.fillText(name, 256, 58, 490);
    g.shadowBlur = 0;
    g.fillStyle = '#ffffff';
    g.globalAlpha = 0.55;
    g.fillText(name, 256, 58, 490);
  });
}

/** The sun's path on the water: broken gold streaks, densest down the middle, fading out. */
function glitterTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    g.clearRect(0, 0, 128, 512);
    const random = seeded(7405);
    for (let i = 0; i < 900; i++) {
      const y = random() * 512;
      const spread = 10 + (y / 512) * 54;
      const x = 64 + (random() - 0.5) * 2 * spread * random();
      g.fillStyle = `rgba(255,${190 + random() * 50},${100 + random() * 60},${0.15 + random() * 0.45})`;
      g.fillRect(x - 6, y, 4 + random() * 12, 1.5);
    }
  });
}

/** The DJ's screen: SUNSET SESSIONS over a pulse of colour and the beat's waveform. */
function screenTexture(): CanvasTexture {
  return canvasTexture(512, 240, (g) => {
    const sky = g.createLinearGradient(0, 0, 512, 240);
    sky.addColorStop(0, '#ff3a9a');
    sky.addColorStop(0.5, '#8a3aff');
    sky.addColorStop(1, '#ff8a3a');
    g.fillStyle = sky;
    g.fillRect(0, 0, 512, 240);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    for (let x = 8; x < 504; x += 8) {
      const h = 8 + Math.abs(Math.sin(x * 0.07) * Math.cos(x * 0.023)) * 60;
      g.fillRect(x, 200 - h / 2, 4, h);
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    g.font = 'bold italic 64px sans-serif';
    g.fillText('SUNSET SESSIONS', 256, 70, 490);
    g.fillStyle = '#d7ff3a';
    g.font = 'bold 40px sans-serif';
    g.fillText('WATTZUP · 128 BPM', 256, 128, 470);
  });
}
