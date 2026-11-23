// South Beach Sunrise's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// Ocean Drive in Miami Beach at sunrise on race morning. Pastel art deco hotels with eyebrow
// ledges and neon fins stand on the left behind café umbrellas, palms, lifeguard towers, the
// sand and the Atlantic open on the right, and a stepped deco tower closes the drive ahead.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers,
// banners and road paint of world-kit.ts.
import type { CanvasTexture } from 'three/webgpu';
import {
  BoxGeometry,
  CapsuleGeometry,
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
} from 'three/webgpu';
import {
  barrierBannerTexture,
  type BannerPanel,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  Figures,
  LifeguardTowers,
  Palms,
  hazedMaterial,
  loopMetres,
  paintTexture,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  slopeAt,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
const KERB = 0.15;
/** Race barriers stand just off the kerb; the crowd stands behind them on both pavements. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.3;
/** The hotels' fronts stand this far left of the road's centre, behind the café terraces. */
const FRONTAGE = 9;
const STOREY = 3.4;
/** On the right: the pavement, a coral-stone wall, the palm lawn, then the sand and the sea. */
const PAVEMENT = 7;
const WALL = 7.4;
const SAND = 15;
const SEA = 34;
/** Joggers on the lawn path between the palms and the sand. */
const JOGGERS = 14;
/** Lifeguard towers stand on the sand every TOWER_EVERY metres. */
const TOWER_EVERY = 40;
/** The deco tower stands at the end of the drive, a little left, hazed by hand. */
const TOWER_AHEAD = 640;
const TOWER_X = -5;
const HAZE = 0xf3c9a6;

/** Hotel palettes: the wall, its trim and the neon of its fin. */
const PALETTES: readonly { wall: string; trim: string; neon: string }[] = [
  { wall: '#f6b8c8', trim: '#ffffff', neon: '#2fe6e0' },
  { wall: '#a8e6d6', trim: '#ffffff', neon: '#ff4fa8' },
  { wall: '#f9e3a3', trim: '#ffffff', neon: '#3fb7ff' },
  { wall: '#c9b8f2', trim: '#fdf7ea', neon: '#ffe14a' },
  { wall: '#ffcfa8', trim: '#ffffff', neon: '#2fe6e0' },
  { wall: '#bfe3f7', trim: '#fdf7ea', neon: '#ff4fa8' },
  { wall: '#fdf5e4', trim: '#f2a2b8', neon: '#3fe08a' },
];
/** The words on the hotels' fins. */
const HOTEL_NAMES = [
  'CORAL',
  'SEABREEZE',
  'FLAMINGO',
  'AURORA',
  'PELICAN',
  'TROPICANA',
  'SUNSET',
  'MARLIN',
  'ATLANTIC',
];
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#ff4fa8', ink: '#ffffff', text: 'SOUTH BEACH SUNRISE' },
  { fill: '#fdf5e4', ink: '#0f8f9a', text: 'OCEAN DRIVE' },
  { fill: '#2fd3cf', ink: '#1b1e24', text: 'SUNRISE CHASE' },
  { fill: '#ffb23f', ink: '#1b1e24', text: 'MIAMI BEACH' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#1b1e24', ink: '#ff9ec9', text: 'VAMOS !' },
];
const STREET_BANNERS: readonly (readonly [string, string, string])[] = [
  ['SOUTH BEACH SUNRISE', '#ff4fa8', '#ffffff'],
  ['OCEAN DRIVE', '#2fd3cf', '#1b1e24'],
  ['CHASE THE SUN', '#ffb23f', '#1b1e24'],
];
/**
 * What the fans paint on the road, its colour and how far off the centre line: beside the
 * riders' line, where it shows between them.
 */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['SUNRISE', '#fdf5e4', -2.0],
  ['VAMOS', '#ff9ec9', 2.0],
  ['OCEAN DR', '#fdf5e4', -2.0],
  ['GO GO', '#2fe6e0', 2.0],
  ['SOBE', '#ffe14a', -2.0],
  ['CHASE IT', '#fdf5e4', 2.0],
  ['ALLEZ', '#ff9ec9', -2.0],
  ['WATTZUP', '#d7ff3a', 2.0],
];
/**
 * Fans' writing on the tarmac every ROAD_PAINT_EVERY metres, twice round the list: flat paint
 * reads only in the first 25 m or so ahead, so some must always be that close.
 */
const ROAD_PAINT_EVERY = 25;
/** Pennants on the lamp posts, in the race's colours. */
const PENNANTS = ['#ff4fa8', '#2fd3cf', '#ffb23f', '#fdf5e4'];
const SKINS = ['#f1c7a5', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26', '#e2b48c'];
const TROUSERS = ['#f2efe6', '#3b5a7a', '#1e2530', '#d9c3a0', '#ff9ec9', '#2fd3cf'];
const SHIRTS = [
  '#ffffff',
  '#ff4fa8',
  '#2fd3cf',
  '#ffb23f',
  '#ffe14a',
  '#7ad0ff',
  '#f26b5b',
  '#111111',
  '#c9b8f2',
  '#3fe08a',
];

export class SouthBeachStreet implements SceneStreet {
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
  private readonly tower = new Group();
  private readonly sea = new Group();
  private readonly pelicans: Group[] = [];
  /** Joggers on the lawn path and beachgoers on the sand, built on the kit's figures. */
  private joggers: Figures | null = null;
  private beachgoers: Figures | null = null;
  private readonly bathers: { x: number; offset: number; heading: number; scale: number }[] = [];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flagMaterials = PENNANTS.map(
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
      spacing: 0.6,
      wardrobe: { tops: SHIRTS, bottoms: TROUSERS, skins: SKINS },
      flags: this.flagMaterials,
      flagShare: 0.18,
      seeds: [53, 59],
      // The café terraces leave a gap on the left where their umbrellas stand. On the beach
      // side the fans stand one deep in clusters, so the sand and the sea show between them.
      skip: (side, offset, x) =>
        side < 0 ? offset % 50 < 6 : x > CROWD_NEAR + 0.5 || offset % 16 < 7,
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addHotels();
    this.addTerraces();
    this.addPalms();
    this.addLifeguardTowers();
    this.addLamps();
    this.addStreetBanners(roadHalf);
    this.addRoadPaint();
    this.addSea();
    this.addTower();
    this.addPelicans();
    this.addBeachLife();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  /** Lays the pavements, barriers, wall, lawn, sand and surf over the road's points. */
  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** Moves the street with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    const far = heightAt(1e6);
    this.tower.position.set(TOWER_X, far - 2, -TOWER_AHEAD);
    this.sea.position.set(0, far, 0);
    // Joggers run the lawn path towards the rider, a stride bobbing every half second.
    const joggers = this.joggers;
    if (joggers) {
      for (let i = 0; i < JOGGERS; i++) {
        const offset = i * (LOOP / JOGGERS) - this.time * (2.6 + (i % 3) * 0.4);
        const metres = along(offset, LOOP);
        const bob = Math.abs(Math.sin(this.time * 6 + i)) * 0.08;
        const x = 11 + (i % 2) * 1.1;
        joggers.set(i, x, heightAt(Math.max(metres, 0)) + 0.3, -metres, 0, 1, bob);
      }
      joggers.commit();
    }
    const beachgoers = this.beachgoers;
    if (beachgoers) {
      this.bathers.forEach((b, i) => {
        const metres = along(b.offset, LOOP);
        beachgoers.set(i, b.x, heightAt(Math.max(metres, 0)) + 0.3, -metres, b.heading, b.scale);
      });
      beachgoers.commit();
    }
    // Pelicans glide in a line along the shore, overtaking the rider slowly.
    this.pelicans.forEach((bird, i) => {
      const glide = this.time * 1.5 + i * 7;
      const metres = ((((glide - s * 0.3 + i * 11) % 160) + 160) % 160) + 30;
      bird.position.set(14 + (i % 3) * 3, far + 14 + Math.sin(this.time * 0.6 + i) * 0.8, -metres);
      bird.children[1]!.rotation.z = 0.12 + Math.sin(this.time * 1.4 + i) * 0.1;
      bird.children[2]!.rotation.z = -0.12 - Math.sin(this.time * 1.4 + i) * 0.1;
    });
  }

  /** Pavements to the hotels and the wall, the barriers, the palm lawn and the sand. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const pavement = this.material({ map: this.repeat(pavementTexture(), 3, 3), roughness: 0.85 });
    const lawn = this.material({ map: this.repeat(lawnTexture(), 6, 6), roughness: 1 });
    const sand = this.material({ map: this.repeat(sandTexture(), 8, 8), roughness: 1 });
    const coral = this.material({ map: this.repeat(coralTexture(), 2, 2), roughness: 0.95 });
    const surf = this.material({ color: 0xf8f4ea, roughness: 0.6 });
    this.ribbons.add(points, pavement, [
      [-r, 0],
      [-r - 0.2, KERB],
      [-FRONTAGE - 1, KERB + 0.01],
    ]);
    this.ribbons.add(points, pavement, [
      [PAVEMENT, KERB + 0.01],
      [r + 0.2, KERB],
      [r, 0],
    ]);
    this.ribbons.add(points, coral, [
      [WALL + 0.5, KERB + 0.6],
      [WALL, KERB + 0.65],
      [WALL - 0.1, KERB + 0.6],
      [PAVEMENT, KERB],
    ]);
    this.ribbons.add(points, lawn, [
      [SAND, 0.25],
      [WALL + 0.5, KERB + 0.6],
    ]);
    this.ribbons.add(points, sand, [
      [SEA, 0.02],
      [SAND + 6, 0.35],
      [SAND, 0.25],
    ]);
    // The surf line where the waves run up the sand.
    this.ribbons.add(points, surf, [
      [SEA + 0.6, 0.04],
      [SEA - 1.2, 0.04],
    ]);
    // The race lane's edges, painted in the race's pink down both sides of the tarmac.
    const edge = this.material({
      color: 0xff7ab8,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    for (const side of [-1, 1]) {
      const x = side * (r - 0.35);
      this.ribbons.add(points, edge, [
        [x + 0.09, 0.006],
        [x - 0.09, 0.006],
      ]);
    }
    // Race barriers along both kerbs, hung with the race's banners.
    for (const side of [-1, 1]) {
      const texture = this.track(barrierBannerTexture(BARRIER_PANELS));
      texture.repeat.set(-1, -side / 24);
      const banner = this.material({ map: texture, alphaTest: 0.5, roughness: 0.5 });
      const x = side * BARRIER;
      this.ribbons.add(points, banner, [
        [x, KERB + 0.08],
        [x, KERB + 1.0],
      ]);
      const rail = this.material({ color: 0xc9ced3, metalness: 0.7, roughness: 0.35 });
      this.ribbons.add(points, rail, [
        [x, KERB + 1.0],
        [x + 0.04, KERB + 1.06],
        [x - 0.04, KERB + 1.06],
        [x, KERB + 1.0],
      ]);
    }
  }

  /**
   * The art deco hotels on the left: pastel blocks two to five storeys high with white eyebrow
   * ledges over ribbon windows, stepped parapets, and a neon fin carrying the hotel's name.
   * A side street opens now and then, so the drive is never one long wall.
   */
  private addHotels(): void {
    const layout = seeded(7);
    const facades = PALETTES.map((p) => this.track(facadeTexture(p.wall, p.trim)));
    const walls = PALETTES.map((p) => this.material({ color: p.wall, roughness: 0.85 }));
    const trims = PALETTES.map((p) => this.material({ color: p.trim, roughness: 0.6 }));
    // The deco details draw from a sequence of their own, so the layout never reshuffles.
    const deco = seeded(37);
    const drum = new CylinderGeometry(1, 1, 1, 24);
    drum.translate(0, 0.5, 0);
    const ring = new CylinderGeometry(1, 1, 0.12, 24);
    this.disposables.push(drum, ring);
    let offset = 0;
    let index = 0;
    let last = -1;
    while (offset < LOOP - 10) {
      const width = Math.min(12 + Math.floor(layout() * 4) * 3, LOOP - offset);
      const storeys = 2 + Math.floor(layout() * 4);
      let style = Math.floor(layout() * (PALETTES.length - 1));
      if (style >= last) style++;
      last = style;
      const palette = PALETTES[style]!;
      const hotel = new Group();
      const height = storeys * STOREY + 1.2;
      const depth = 14;
      // The front faces the road (+x); its facade texture repeats a 3 m bay per storey.
      const front = this.material({ map: facades[style]!, roughness: 0.8 });
      const facade = new BoxGeometry(depth, height, width);
      scaleFaceUv(facade, 0, width / 3, storeys);
      this.disposables.push(facade);
      const block = new Mesh(facade, [
        front,
        walls[style]!,
        walls[style]!,
        walls[style]!,
        walls[style]!,
        walls[style]!,
      ]);
      block.position.set(-depth / 2, height / 2, 0);
      block.castShadow = true;
      block.receiveShadow = true;
      hotel.add(block);
      const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z = 0) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(w, h, d);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        hotel.add(mesh);
        return mesh;
      };
      // Eyebrow ledges over each storey's windows.
      for (let k = 1; k <= storeys; k++)
        box(trims[style]!, 0.7, 0.12, width, 0.35, k * STOREY - 0.6);
      // A stepped parapet: the middle rises in two steps over the entrance.
      const trim = trims[style]!;
      box(trim, 0.6, 0.5, width, -0.2, height);
      box(walls[style]!, 1.2, 1.4, width * 0.45, -0.5, height + 0.5);
      box(trim, 1.3, 0.25, width * 0.45 + 0.1, -0.5, height + 1.9);
      box(walls[style]!, 1.2, 1.3, width * 0.18, -0.5, height + 2.15);
      // The entrance canopy and its piers.
      box(trim, 2.2, 0.25, 5, 1.1, 3.1);
      // The neon fin over the entrance, its name lit down both faces.
      const name = HOTEL_NAMES[index % HOTEL_NAMES.length]!;
      const finHeight = Math.min(height + 2.5, 15) - 4;
      box(trim, 1.5, finHeight, 0.35, 0.75, 4);
      const sign = this.material({
        map: this.track(finTexture(name, palette.neon)),
        emissive: new Color(0xffffff),
        emissiveMap: null,
        emissiveIntensity: 0,
        roughness: 0.5,
      });
      sign.emissiveMap = sign.map;
      sign.emissiveIntensity = 0.9;
      const plane = new PlaneGeometry(1.4, finHeight - 0.2);
      this.disposables.push(plane);
      for (const face of [-1, 1]) {
        const p = new Mesh(plane, sign);
        p.position.set(0.75, 4 + finHeight / 2, face * 0.18);
        p.rotation.y = face > 0 ? 0 : Math.PI;
        hotel.add(p);
      }
      // A neon band along the parapet in the fin's colour.
      const band = this.material({
        color: palette.neon,
        emissive: new Color(palette.neon),
        emissiveIntensity: 0.8,
      });
      box(band, 0.1, 0.12, width, 0.12, height - 0.3);
      // A curved corner tower on the end facing the rider, wrapped by its eyebrows.
      if (deco() < 0.6) {
        const r = 2.2;
        const tower = new Mesh(drum, walls[style]!);
        tower.scale.set(r, height + 1.2, r);
        tower.position.set(-r + 0.5, 0, width / 2 - r + 0.3);
        tower.castShadow = true;
        hotel.add(tower);
        for (let k = 1; k <= storeys; k++) {
          const band = new Mesh(ring, trim);
          band.scale.set(r + 0.35, 1, r + 0.35);
          band.position.set(-r + 0.5, k * STOREY - 0.55, width / 2 - r + 0.3);
          hotel.add(band);
        }
        const cap = new Mesh(ring, trim);
        cap.scale.set(r + 0.2, 2, r + 0.2);
        cap.position.set(-r + 0.5, height + 1.2, width / 2 - r + 0.3);
        hotel.add(cap);
      }
      // A stepped ziggurat finial over the entrance, a mast on top.
      if (storeys >= 3 && deco() < 0.7) {
        const top = height + 2.4;
        box(walls[style]!, 2.4, 1.6, 3.6, -1.4, top);
        box(trim, 2.6, 0.2, 3.8, -1.4, top + 1.6);
        box(walls[style]!, 1.6, 1.4, 2.2, -1.4, top + 1.8);
        box(trim, 1.8, 0.2, 2.4, -1.4, top + 3.2);
        box(walls[style]!, 0.9, 1.2, 1.1, -1.4, top + 3.4);
        box(trim, 0.12, 3.5, 0.12, -1.4, top + 4.6);
      }
      // Old frontages never quite line up: each hotel stands up to 1.5 m back.
      const setback = deco() * 1.5;
      this.group.add(hotel);
      this.props.push({
        mesh: hotel,
        offset: offset + width / 2,
        every: LOOP,
        x: -FRONTAGE - setback,
      });
      offset += width;
      index++;
      // A side street now and then: a gap between the hotels.
      if (layout() < 0.3) offset += 7;
    }
  }

  /** Café terraces on the left pavement: striped umbrellas over little tables. */
  private addTerraces(): void {
    const pole = new CylinderGeometry(0.04, 0.04, 2.4, 6);
    pole.translate(0, 1.2, 0);
    const canopy = new ConeGeometry(1.4, 0.55, 8, 1, true);
    canopy.translate(0, 2.45, 0);
    const table = new CylinderGeometry(0.4, 0.4, 0.05, 12);
    table.translate(0, 0.75, 0);
    this.disposables.push(pole, canopy, table);
    const metal = this.material({ color: 0xe8e8e8, metalness: 0.4, roughness: 0.4 });
    const stripes = ['#ff4fa8', '#2fd3cf', '#ffb23f'].map((c) =>
      this.material({
        map: this.track(umbrellaTexture(c)),
        side: DoubleSide,
        roughness: 0.8,
      }),
    );
    for (let offset = 0; offset < LOOP; offset += 50) {
      for (let k = 0; k < 2; k++) {
        const terrace = new Group();
        terrace.add(new Mesh(pole, metal), new Mesh(table, metal));
        const shade = new Mesh(canopy, stripes[(offset / 50 + k) % stripes.length]!);
        shade.castShadow = true;
        terrace.add(shade);
        this.group.add(terrace);
        this.props.push({ mesh: terrace, offset: offset + k * 3, every: LOOP, x: -5.6 - k * 1.6 });
      }
    }
  }

  /** Royal palms along the lawn on the right, and a few by the side streets on the left. */
  private addPalms(): void {
    const palms = new Palms(this.disposables, this.track);
    const random = seeded(19);
    const plant = (x: number, offset: number) => {
      const palm = palms.make(random);
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, every: LOOP, x });
    };
    for (let offset = 4; offset < LOOP; offset += 9) plant(9.5 + random() * 1.5, offset);
    for (let offset = 10; offset < LOOP; offset += 23) plant(13.5 + random() * 1.5, offset);
  }

  /** Lifeguard towers on the sand: painted huts on stilts with a ramp and a flag. */
  private addLifeguardTowers(): void {
    const towers = new LifeguardTowers(this.disposables, this.track);
    for (let i = 0; i < 10; i++) {
      const tower = towers.make(i);
      this.group.add(tower);
      this.props.push({
        mesh: tower,
        offset: i * TOWER_EVERY + 30,
        every: LOOP,
        x: 20 + (i % 2) * 5,
      });
    }
  }

  /** Lamp posts on both pavements, each flying a pennant in the race's colours. */
  private addLamps(): void {
    const pole = new CylinderGeometry(0.06, 0.09, 6, 8);
    pole.translate(0, 3, 0);
    const head = new CylinderGeometry(0.28, 0.18, 0.45, 8);
    head.translate(0, 6.2, 0);
    const cloth = new PlaneGeometry(0.55, 1.3);
    this.disposables.push(pole, head, cloth);
    const iron = this.material({ color: 0xf2efe6, metalness: 0.3, roughness: 0.5 });
    const glass = this.material({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 0.5 });
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 32) {
        const lamp = new Group();
        lamp.add(new Mesh(pole, iron), new Mesh(head, glass));
        const pennant = new Mesh(cloth, this.flagMaterials[k++ % this.flagMaterials.length]!);
        pennant.position.set(-side * 0.32, 4.6, 0);
        pennant.rotation.y = Math.PI / 2;
        lamp.add(pennant);
        this.group.add(lamp);
        this.props.push({
          mesh: lamp,
          offset: offset + (side > 0 ? 16 : 0),
          every: LOOP,
          x: side * 6.6,
        });
      }
    }
  }

  /** Cloth banners on poles across the drive, the race's name on each. */
  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.08, 0.08, 6.6, 8);
    post.translate(0, 3.3, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1, 1.25);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0xd9dde2, metalness: 0.6, roughness: 0.35 });
    STREET_BANNERS.forEach(([text, fill, ink], i) => {
      const banner = new Group();
      for (const x of [-roadHalf - 0.6, roadHalf + 0.6]) {
        const p = new Mesh(post, steel);
        p.position.x = x;
        banner.add(p);
      }
      const material = this.material({
        map: this.track(clothBannerTexture(text, fill, ink)),
        side: DoubleSide,
        roughness: 0.7,
      });
      const c = new Mesh(cloth, material);
      c.position.y = 5.8;
      c.castShadow = true;
      banner.add(c);
      this.group.add(banner);
      this.props.push({ mesh: banner, offset: 70 + i * 130, every: LOOP, x: 0 });
    });
  }

  /** What the fans have painted on the tarmac. */
  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.6, 9);
    this.disposables.push(plane);
    [...ROAD_PAINT, ...ROAD_PAINT].forEach(([text, colour, x], i) => {
      const material = this.material({
        map: this.track(paintTexture(text, colour)),
        alphaTest: 0.35,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        roughness: 0.7,
      });
      const mesh = new Mesh(plane, material);
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

  /** The Atlantic, out to the horizon, catching the low sun. */
  private addSea(): void {
    const water = this.material({
      map: this.repeat(seaTexture(), 30, 30),
      color: 0x3f86a8,
      roughness: 0.15,
      metalness: 0.2,
    });
    const plane = new PlaneGeometry(6000, 6000);
    plane.rotateX(-Math.PI / 2);
    plane.translate(SEA + 3000, 0, -2000);
    this.disposables.push(plane);
    const mesh = new Mesh(plane, water);
    mesh.receiveShadow = true;
    this.sea.add(mesh);
    this.group.add(this.sea);
  }

  /**
   * The deco tower at the end of the drive: a cream tower stepping back in four stages,
   * vertical fins up each face, neon rings at every setback and a spire lit at the tip.
   */
  private addTower(): void {
    const haze = new Color(HAZE);
    const hazed = (
      hex: number | string,
      amount: number,
      extra: Partial<MeshStandardMaterial> = {},
    ) => hazedMaterial(this.disposables, haze, hex, amount, extra);
    const fins = this.track(towerTexture());
    fins.wrapS = RepeatWrapping;
    fins.wrapT = RepeatWrapping;
    // Lit against the sunrise behind it: its cream faces catch a little of the dawn glow.
    const cream = hazed(0xfdf0dc, 0.12, {
      map: fins,
      emissive: new Color(0xffd9b0),
      emissiveIntensity: 0.22,
    });
    const pink = hazed(0xf6b8c8, 0.12, { emissive: new Color(0xf6b8c8), emissiveIntensity: 0.18 });
    const neon = hazed(0xff4fa8, 0.05, { emissive: new Color(0xff4fa8), emissiveIntensity: 2 });
    const teal = hazed(0x2fe6e0, 0.05, { emissive: new Color(0x2fe6e0), emissiveIntensity: 2 });
    const t = this.tower;
    const stages: [number, number][] = [
      [46, 26],
      [34, 24],
      [24, 20],
      [15, 14],
    ];
    let y = 0;
    stages.forEach(([w, h], i) => {
      const stage = new Mesh(this.unit, cream);
      stage.scale.set(w, h, w * 0.7);
      stage.position.y = y + h / 2;
      t.add(stage);
      // Pink corner piers stand proud of each stage.
      for (const x of [-w / 2, w / 2]) {
        const pier = new Mesh(this.unit, pink);
        pier.scale.set(2, h + 1.5, 2);
        pier.position.set(x, y + (h + 1.5) / 2, w * 0.35);
        t.add(pier);
      }
      // Neon fins up the stage's face, between the corner piers.
      for (const x of [-w / 4, 0, w / 4]) {
        const fin = new Mesh(this.unit, i % 2 ? neon : teal);
        fin.scale.set(0.8, h - 3, 0.6);
        fin.position.set(x, y + h / 2, w * 0.35 + 0.3);
        t.add(fin);
      }
      const ring = new Mesh(this.unit, i % 2 ? teal : neon);
      ring.scale.set(w + 0.6, 1.1, w * 0.7 + 0.6);
      ring.position.y = y + h;
      t.add(ring);
      y += h;
    });
    const spire = new CylinderGeometry(0.4, 3, 30, 8);
    spire.translate(0, y + 15, 0);
    const tip = new CylinderGeometry(0.6, 0.6, 1.2, 8);
    tip.translate(0, y + 30, 0);
    this.disposables.push(spire, tip);
    // A neon crown at the foot of the spire and a beacon at its tip.
    const crown = new CylinderGeometry(6, 7.5, 2, 16);
    crown.translate(0, y + 1, 0);
    const beacon = new SphereGeometry(1.6, 16, 12);
    beacon.translate(0, y + 31.5, 0);
    this.disposables.push(crown, beacon);
    t.add(
      new Mesh(spire, pink),
      new Mesh(tip, neon),
      new Mesh(crown, teal),
      new Mesh(beacon, neon),
    );
    t.scale.setScalar(1.5);
    // The tower's name down its face in neon, as the hotels wear theirs.
    const sign = new Mesh(
      new PlaneGeometry(5, 34),
      hazed(0xffffff, 0, {
        map: this.track(finTexture('OCEAN', '#ff4fa8')),
        emissive: new Color(0xffffff),
        emissiveIntensity: 1,
      }),
    );
    (sign.material as MeshStandardMaterial).emissiveMap = (
      sign.material as MeshStandardMaterial
    ).map;
    sign.position.set(0, 30, 46 * 0.35 + 1.2);
    this.disposables.push(sign.geometry);
    t.add(sign);
    this.group.add(t);
  }

  /**
   * South Beach's morning life: joggers on the lawn path, beachgoers strolling the sand and
   * wading at the surf line, and striped beach umbrellas over towels.
   */
  private addBeachLife(): void {
    const wardrobe = {
      tops: ['#ff4fa8', '#2fd3cf', '#ffe14a', '#ffffff', '#ff7a3d', '#7ad0ff', '#3fe08a'],
      bottoms: ['#1e2530', '#ff4fa8', '#2f3e5c', '#f2efe6', '#2fd3cf', '#111111'],
      skins: SKINS,
    };
    this.joggers = new Figures(this.group, this.disposables, JOGGERS, wardrobe, 71);
    const random = seeded(79);
    for (let offset = 0; offset < LOOP; offset += 5) {
      if (random() < 0.35) continue;
      // Most stroll the sand; one in three wades at the surf line.
      const wading = random() < 0.33;
      this.bathers.push({
        x: wading ? SEA - 1.5 + random() * 2.5 : SAND + 5 + random() * (SEA - SAND - 9),
        offset: offset + random() * 4,
        heading: random() * Math.PI * 2,
        scale: 0.85 + random() * 0.2,
      });
    }
    this.beachgoers = new Figures(this.group, this.disposables, this.bathers.length, wardrobe, 83);
    const pole = new CylinderGeometry(0.035, 0.035, 2.2, 6);
    pole.translate(0, 1.1, 0);
    const canopy = new ConeGeometry(1.2, 0.5, 10, 1, true);
    canopy.translate(0, 2.2, 0);
    const towel = new PlaneGeometry(0.9, 1.9);
    towel.rotateX(-Math.PI / 2);
    towel.translate(0.9, 0.04, 0);
    this.disposables.push(pole, canopy, towel);
    const white = this.material({ color: 0xf6f3ea, roughness: 0.7 });
    const shades = ['#ff4fa8', '#2fd3cf', '#ffb23f', '#7ad0ff'].map((c) =>
      this.material({ map: this.track(umbrellaTexture(c)), side: DoubleSide, roughness: 0.8 }),
    );
    const towels = ['#ffe14a', '#ff7ab8', '#2fd3cf', '#ffffff'].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    for (let offset = 6, k = 0; offset < LOOP; offset += 14, k++) {
      const spot = new Group();
      const shade = new Mesh(canopy, shades[k % shades.length]!);
      shade.castShadow = true;
      spot.add(new Mesh(pole, white), shade, new Mesh(towel, towels[(k * 3) % towels.length]!));
      spot.position.y = 0.3;
      const holder = new Group();
      holder.add(spot);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, every: LOOP, x: SAND + 7 + (k % 4) * 4 });
    }
  }

  /** Brown pelicans gliding in a line along the shore. */
  private addPelicans(): void {
    const body = new CapsuleGeometry(0.22, 0.9, 4, 8);
    body.rotateX(Math.PI / 2);
    const wing = new BoxGeometry(1.6, 0.05, 0.45);
    wing.translate(0.8, 0, 0);
    this.disposables.push(body, wing);
    const feathers = this.material({ color: 0x6b5a48, roughness: 0.9 });
    for (let i = 0; i < 7; i++) {
      const bird = new Group();
      const left = new Mesh(wing, feathers);
      left.rotation.y = Math.PI;
      const right = new Mesh(wing, feathers);
      bird.add(new Mesh(body, feathers), left, right);
      this.pelicans.push(bird);
      this.group.add(bird);
    }
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

/** One storey and one 3 m bay of a deco front: a ribbon window with a corner porthole. */
function facadeTexture(wall: string, trim: string): CanvasTexture {
  const texture = canvasTexture(256, 256, (g) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, 256, 256);
    // Stucco: a soft speckle.
    const random = seeded(wall.charCodeAt(1));
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`;
      g.fillRect(random() * 256, random() * 256, 2, 2);
    }
    // The ribbon window, glazed in sea-blue glass with white mullions.
    g.fillStyle = trim;
    g.fillRect(14, 70, 228, 112);
    const glass = g.createLinearGradient(0, 76, 0, 176);
    glass.addColorStop(0, '#5c8fb0');
    glass.addColorStop(1, '#27445e');
    g.fillStyle = glass;
    g.fillRect(22, 78, 212, 96);
    g.fillStyle = trim;
    for (const x of [92, 162]) g.fillRect(x, 78, 6, 96);
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.fillRect(22, 78, 212, 14);
    // Three incised speed lines under the window.
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let k = 0; k < 3; k++) g.fillRect(14, 196 + k * 12, 228, 4);
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

/** A neon fin's name, letter above letter, glowing in `neon` on a dark ground. */
function finTexture(name: string, neon: string): CanvasTexture {
  const letters = name.split('');
  return canvasTexture(128, 128 * Math.max(letters.length, 5), (g) => {
    const h = 128 * Math.max(letters.length, 5);
    g.fillStyle = '#1d2230';
    g.fillRect(0, 0, 128, h);
    g.strokeStyle = neon;
    g.lineWidth = 6;
    g.strokeRect(8, 8, 112, h - 16);
    g.fillStyle = neon;
    g.shadowColor = neon;
    g.shadowBlur = 18;
    g.font = 'bold 92px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const step = (h - 40) / letters.length;
    letters.forEach((c, i) => g.fillText(c, 64, 20 + step * (i + 0.5)));
  });
}

function speckled(base: string, seed: number, size = 512, amount = 0.06): CanvasTexture {
  return canvasTexture(size, size, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    const random = seeded(seed);
    for (let i = 0; i < size * size * 0.02; i++) {
      const light = random() < 0.5;
      g.fillStyle = `rgba(${light ? '255,255,255' : '60,40,20'},${random() * amount * 2})`;
      g.fillRect(random() * size, random() * size, 2 + random() * 3, 2 + random() * 3);
    }
  });
}

/** Pale pavement slabs, 1 m square (the texture covers 3 m), with soft joints. */
function pavementTexture(): CanvasTexture {
  const texture = speckled('#e9dccb', 5);
  const g = (texture.image as HTMLCanvasElement).getContext('2d')!;
  g.strokeStyle = 'rgba(120,100,80,0.35)';
  g.lineWidth = 2;
  for (let i = 0; i <= 3; i++) {
    const p = (i * 512) / 3;
    g.beginPath();
    g.moveTo(0, p);
    g.lineTo(512, p);
    g.moveTo(p, 0);
    g.lineTo(p, 512);
    g.stroke();
  }
  return texture;
}

function lawnTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#5f9a45';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(9);
    for (let i = 0; i < 9000; i++) {
      g.strokeStyle = `hsl(${85 + random() * 30},45%,${32 + random() * 22}%)`;
      const x = random() * 512;
      const y = random() * 512;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + random() * 4 - 2, y - 4 - random() * 6);
      g.stroke();
    }
  });
}

/** Fine pale sand, raked and footprinted. */
function sandTexture(): CanvasTexture {
  return speckled('#efdcb6', 11, 512, 0.08);
}

/** Coral stone: pale limestone pitted with fossil shells. */
function coralTexture(): CanvasTexture {
  const texture = speckled('#e6d8bd', 13, 256, 0.1);
  const g = (texture.image as HTMLCanvasElement).getContext('2d')!;
  const random = seeded(17);
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(110,90,60,${0.15 + random() * 0.25})`;
    g.beginPath();
    g.arc(random() * 256, random() * 256, 1 + random() * 4, 0, Math.PI * 2);
    g.fill();
  }
  return texture;
}

/** The sea: soft swell lines catching the dawn light. */
function seaTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#4f8fae';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(23);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(255,${200 + random() * 40},${170 + random() * 40},${0.06 + random() * 0.2})`;
      g.fillRect(random() * 512, random() * 512, 10 + random() * 26, 1.5);
    }
  });
}

/** A café umbrella's stripes in `colour` and white. */
function umbrellaTexture(colour: string): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#fdf5e4' : colour;
      g.fillRect(i * 32, 0, 32, 64);
    }
  });
}

/** The deco tower's face: cream piers between recessed glass, a bay per repeat. */
function towerTexture(): CanvasTexture {
  const texture = canvasTexture(128, 256, (g) => {
    g.fillStyle = '#fdf0dc';
    g.fillRect(0, 0, 128, 256);
    for (let x = 0; x < 128; x += 32) {
      g.fillStyle = '#7a93a8';
      g.fillRect(x + 10, 0, 14, 256);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = 0; y < 256; y += 32) g.fillRect(x + 10, y, 14, 6);
    }
  });
  texture.repeat.set(4, 3);
  return texture;
}
