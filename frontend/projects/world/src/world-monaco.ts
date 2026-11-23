// Monaco Street Circuit, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// the harbour straight of the street circuit on race weekend, closed for the ride. On the left
// the quay of Port Hercule, its superyachts moored stern-to in the deep blue water; on the right
// the grandstands packed with fans and the pastel apartments of the town behind them. Race
// barriers hung with banners and tall catch fences line both sides, red and white kerbs edge the
// track and the flags of Monaco fly along the quay. Ahead the town climbs its hill to the Casino,
// its twin towers and copper roofs above the terraces, the bare limestone mountains behind.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, figures, barriers,
// banners, feather flags, road paint and box builder of world-kit.ts.
import {
  BoxGeometry,
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
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import {
  type BannerPanel,
  barrierBannerTexture,
  BoxBuilder,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  Figures,
  hazedMaterial,
  loopMetres,
  paintTexture,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  slopeAt,
  type Wardrobe,
  Yachts,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 500;
const BEHIND = 30;
const KERB = 0.15;
/** Race barriers line the track, the catch fences rising behind them. */
const BARRIER = 3.9;
const FENCE_HIGH = 4.4;
const CROWD_NEAR = 4.5;
const CROWD_FAR = 6.6;
/** The quay's edge on the left, the harbour beyond it. */
const QUAY = 11;
/** The grandstands on the right start here, the town's fronts behind them. */
const STAND = 8;
const FRONT = 24;
/** The Casino stands on its hill this far ahead. */
const AHEAD = 280;
const HAZE = 0xc8dcea;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** Race fans in summer shirts, team colours and caps. */
const FANS: Wardrobe = {
  tops: [
    '#d8283a',
    '#ffffff',
    '#f2c230',
    '#1d3c8f',
    '#ff7a1a',
    '#2a8a4a',
    '#111111',
    '#7ac0e8',
    '#e86a9a',
    '#c0c4c8',
  ],
  bottoms: ['#20242b', '#2a3140', '#c8b89a', '#3b4a5c', '#f0ece2', '#4a4f57'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#d8283a', ink: '#ffffff', text: 'MONACO' },
  { fill: '#ffffff', ink: '#d8283a', text: 'STREET CIRCUIT' },
  { fill: '#1b1e24', ink: '#d7ff3a', text: 'WATTZUP' },
  { fill: '#1d3c8f', ink: '#ffffff', text: 'PORT HERCULE' },
  { fill: '#f2c230', ink: '#1b1e24', text: 'SPRINT' },
  { fill: '#d8283a', ink: '#ffffff', text: 'MONTE-CARLO' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['MONACO · STREET CIRCUIT', '#d8283a', '#ffffff', 70],
  ['WATTZUP · NON-STOP SPRINTING', '#1b1e24', '#d7ff3a', 420],
];
const FEATHERS: readonly FeatherWord[] = [
  ['MONACO', '#d8283a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['SPRINT', '#1d3c8f', '#ffffff'],
  ['RACE WEEKEND', '#ffffff', '#d8283a'],
];
const FEATHER_EVERY = 18;
/** What the fans paint on the track, its colour and how far off the crown. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['MONACO', '#ffffff', -1.6],
  ['ALLEZ MAYA', '#f2c230', 1.6],
  ['SPRINT', '#ffffff', 1.6],
  ['FORZA RAVI', '#ff4a4a', -1.6],
  ['FLAT OUT', '#ffffff', -1.6],
  ['GO KENJI', '#d7ff3a', 1.6],
];
const ROAD_PAINT_EVERY = 17;
/** The town's walls: the Riviera's ochres, pinks, creams and apricots, with their shutters. */
const WALLS: readonly (readonly [string, string])[] = [
  ['#e8c48a', '#3a6a4a'],
  ['#e8a888', '#f4ece0'],
  ['#f2e2c4', '#2a5a7a'],
  ['#e8b878', '#f4ece0'],
  ['#d88a6a', '#3a6a4a'],
  ['#f4d8b8', '#5a4a3a'],
  ['#e8d0a0', '#2a5a7a'],
  ['#f0c0a0', '#3a6a4a'],
];
/** The yachts' hull colours; most are white. */
const HULLS = [0xf6f6f2, 0xf6f6f2, 0x1b2a44, 0xf6f6f2, 0x3a3e46, 0xf6f6f2];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

export class MonacoStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private readonly harbour = new Group();
  private readonly fans: Figures;
  private readonly seats: { offset: number; x: number; y: number }[] = [];
  private time = 0;
  private readonly flagMaterials = ['#d8283a', '#ffffff', '#f2c230', '#1d3c8f'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // Fans along both barriers: on the quay at the left, in front of the stands at the right.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.7,
      wardrobe: FANS,
      flags: this.flagMaterials,
      flagShare: 0.2,
      seeds: [6011, 6017],
      // On the quay a single loose row, so the harbour shows between the fans.
      skip: (side, offset, x) => side < 0 && (Math.abs(x) > CROWD_NEAR + 0.6 || offset % 9 < 3),
    });
    this.fans = new Figures(this.group, disposables, 900, FANS, 6021);
    this.group.add(this.horizon, this.harbour);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.addFences(points);
    this.crowd.build();
    this.addHarbour();
    this.addYachts();
    this.addGrandstands();
    this.addTown();
    this.addQuayFlags();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addHill();
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
    const ground = (metres: number) => heightAt(Math.max(metres, 0));
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 12;
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB, -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    // The fans in the stands, bouncing as the riders come by.
    this.seats.forEach((seat, i) => {
      const metres = along(seat.offset, LOOP);
      const hidden = metres > AHEAD - 12 ? -80 : 0;
      const bob = Math.max(0, Math.sin(this.time * 3 + i * 1.3)) * 0.12;
      this.fans.set(
        i,
        seat.x,
        ground(metres) + KERB + seat.y + hidden,
        -metres,
        -Math.PI / 2,
        1,
        bob,
      );
    });
    this.fans.commit();
    this.harbour.position.y = ground(0);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The kerbs painted red and white along both edges of the track, the stone quay out to the
   * water on the left, the pavement under the stands on the right, and the race barriers with
   * their banners.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xb8b4ac, roughness: 0.85 });
    const quay = this.material({ map: this.repeat(stoneTexture(), 3, 3), roughness: 0.9 });
    const pavement = this.material({ map: this.repeat(pavingTexture(), 3, 3), roughness: 0.9 });
    const stripes = this.track(kerbTexture());
    stripes.wrapS = RepeatWrapping;
    stripes.wrapT = RepeatWrapping;
    stripes.repeat.set(1, 1 / 4);
    const painted = this.material({
      map: stripes,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, painted, order([at(r, 0.006), at(r - 0.8, 0.006)]));
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
    }
    this.ribbons.add(points, pavement, [
      [FRONT + 40, KERB],
      [r + 0.3, KERB],
    ]);
    // The quay ends in a stone edge dropping to the water.
    this.ribbons.add(points, quay, [
      [-r - 0.3, KERB],
      [-QUAY, KERB],
      [-QUAY, -1.4],
    ]);
    for (const side of [-1, 1]) {
      const texture = this.track(barrierBannerTexture(BARRIER_PANELS));
      texture.repeat.set(-1, -side / 24);
      const banner = this.material({ map: texture, alphaTest: 0.5, roughness: 0.5 });
      const x = side * BARRIER;
      this.ribbons.add(points, banner, [
        [x, KERB + 0.08],
        [x, KERB + 1.1],
      ]);
    }
  }

  /** Tall catch fences behind the barriers: steel mesh on posts, leaning in at the top. */
  private addFences(points: number): void {
    const wire = this.track(meshTexture());
    wire.wrapS = RepeatWrapping;
    wire.wrapT = RepeatWrapping;
    wire.repeat.set(5, 1);
    const mesh = this.material({
      map: wire,
      transparent: true,
      alphaTest: 0.2,
      side: DoubleSide,
      roughness: 0.5,
      metalness: 0.6,
    });
    for (const side of [-1, 1]) {
      const x = side * (BARRIER + 0.15);
      this.ribbons.add(points, mesh, [
        [x, KERB + 1.1],
        [x, KERB + FENCE_HIGH - 0.6],
        [x - side * 0.7, KERB + FENCE_HIGH],
      ]);
    }
    const steel = this.material({ color: 0x8a9098, metalness: 0.6, roughness: 0.4 });
    const post = new BoxGeometry(0.1, FENCE_HIGH, 0.1);
    post.translate(0, FENCE_HIGH / 2, 0);
    this.disposables.push(post);
    for (const side of [-1, 1]) {
      for (let offset = 0; offset < LOOP; offset += 5) {
        const holder = new Group();
        holder.add(new Mesh(post, steel));
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (BARRIER + 0.2) });
      }
    }
  }

  /** The harbour: deep blue water from the quay out to the horizon, glittering in the sun. */
  private addHarbour(): void {
    const water = this.material({
      map: this.repeat(waterTexture(), 24, 24),
      color: 0x2a6a9a,
      roughness: 0.12,
      metalness: 0.3,
    });
    const plane = new PlaneGeometry(6000, 6000);
    plane.rotateX(-Math.PI / 2);
    plane.translate(-QUAY - 3000, -1.2, -2000);
    this.disposables.push(plane);
    this.harbour.add(new Mesh(plane, water));
  }

  /**
   * The superyachts moored along the quay in three rows, side-on to the track so their long
   * profiles read: sleek hulls in white, navy or graphite with raked bows, two to four white
   * decks stepping back above them with sloping fronts and bands of dark glass, the hardtop,
   * the mast and its radar dome.
   */
  private addYachts(): void {
    const yachts = new Yachts(this.disposables, HULLS);
    const random = seeded(6101);
    for (const [row, out, gap] of [
      [0, QUAY + 1, 5],
      [1, QUAY + 24, 12],
      [2, QUAY + 52, 20],
    ] as const) {
      for (let offset = row * 11, k = 0; offset < LOOP - 20; k++) {
        const length = 30 + random() * 36;
        const yacht = yachts.make(k + row * 3, length, random);
        const holder = new Group();
        holder.add(yacht);
        this.group.add(holder);
        const beam = Math.max(6, length * 0.18);
        this.props.push({ mesh: holder, offset: offset + length / 2, x: -(out + beam / 2) });
        offset += length + gap + random() * gap;
      }
    }
  }

  /**
   * The grandstands on the right, one each stretch of the loop: steel tiers rising behind the
   * fence, packed with fans, under a white roof with the circuit's name along its fascia.
   */
  private addGrandstands(): void {
    const b = new BoxBuilder();
    const steel = this.material({ color: 0x9aa0a8, metalness: 0.5, roughness: 0.5 });
    const seats = this.material({ color: 0xd8283a, roughness: 0.7 });
    const roof = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const LENGTH = 70;
    const ROWS = 9;
    for (let r = 0; r < ROWS; r++) {
      b.box(seats, [1.1, 0.5, LENGTH], [r * 1.1 + 0.55, r * 0.8 + 0.25, 0]);
      b.box(steel, [1.1, 0.12, LENGTH], [r * 1.1 + 0.55, r * 0.8 + 0.56, 0]);
    }
    b.box(steel, [ROWS * 1.1, 0.3, LENGTH], [(ROWS * 1.1) / 2, -0.15, 0]);
    b.box(steel, [0.4, ROWS * 0.8 + 4, LENGTH], [ROWS * 1.1 + 0.2, (ROWS * 0.8 + 4) / 2, 0]);
    for (let z = -LENGTH / 2; z <= LENGTH / 2; z += 10) {
      b.box(steel, [0.25, 4.6, 0.25], [1, ROWS * 0.8 + 2.3, z]);
    }
    b.box(roof, [ROWS * 1.1 + 2, 0.35, LENGTH + 2], [(ROWS * 1.1) / 2, ROWS * 0.8 + 4.7, 0]);
    const stand = b.build(this.disposables);
    const fascia = new Mesh(
      new PlaneGeometry(LENGTH, 1.4),
      this.material({
        map: this.track(
          clothBannerTexture('MONACO · STREET CIRCUIT · WATTZUP', '#d8283a', '#ffffff'),
        ),
      }),
    );
    this.disposables.push(fascia.geometry);
    fascia.rotation.y = -Math.PI / 2;
    fascia.position.set(-0.85, ROWS * 0.8 + 4.2, 0);
    stand.add(fascia);
    const random = seeded(6201);
    for (const offset of [150, 400]) {
      const holder = new Group();
      holder.add(stand.clone());
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: STAND });
      for (let r = 0; r < ROWS; r++) {
        for (let z = -LENGTH / 2 + 0.5; z < LENGTH / 2 && this.seats.length < 900; z += 0.75) {
          if (random() < 0.12) continue;
          this.seats.push({
            offset: offset - z,
            x: STAND + r * 1.1 + 0.6,
            y: r * 0.8 + 0.5 - 0.55,
          });
        }
      }
    }
  }

  /**
   * The town behind the stands: pastel apartment blocks of five to ten floors in a row along
   * the right, shuttered windows and balconies up their fronts, terracotta roofs, and the next
   * row up the hill rising behind them.
   */
  private addTown(): void {
    const random = seeded(6301);
    const roof = this.material({ color: 0xb8643e, roughness: 0.85 });
    const looks = WALLS.map(([wall, shutter], k) => {
      const texture = this.track(facadeTexture(wall, shutter, k));
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      return this.material({ map: texture, roughness: 0.85 });
    });
    for (const row of [0, 1]) {
      for (let offset = 0; offset < LOOP;) {
        const width = 14 + random() * 12;
        const floors = 5 + Math.floor(random() * 6) + row * 2;
        const tall = floors * 3.2;
        const depth = 18;
        const shell = new BoxGeometry(depth, tall, width);
        for (const f of [0, 1]) scaleFaceUv(shell, f, width / 6.4, floors / 2);
        for (const f of [4, 5]) scaleFaceUv(shell, f, depth / 6.4, floors / 2);
        shell.translate(depth / 2, tall / 2 + row * 9, 0);
        this.disposables.push(shell);
        const building = new Group();
        building.add(new Mesh(shell, looks[Math.floor(random() * looks.length)]!));
        const cap = new ConeGeometry(Math.hypot(depth, width) / 2, 3, 4, 1);
        cap.rotateY(Math.PI / 4);
        cap.scale(depth / Math.hypot(depth, width), 1, width / Math.hypot(depth, width));
        cap.translate(depth / 2, tall + 1.5 + row * 9, 0);
        this.disposables.push(cap);
        building.add(new Mesh(cap, roof));
        const holder = new Group();
        holder.add(building);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + width / 2,
          x: FRONT + row * 26 + random() * 2,
        });
        offset += width + 0.5;
      }
    }
  }

  /** The flags of Monaco, red over white, on tall poles along the quay. */
  private addQuayFlags(): void {
    const pole = new CylinderGeometry(0.07, 0.09, 9, 8);
    pole.translate(0, 4.5, 0);
    const cloth = new PlaneGeometry(2.4, 1.7);
    cloth.translate(1.22, 7.9, 0);
    this.disposables.push(pole, cloth);
    const steel = this.material({ color: 0xe8e8e8, metalness: 0.5, roughness: 0.4 });
    const flag = this.material({ map: this.track(monacoFlag()), side: DoubleSide, roughness: 0.8 });
    for (let offset = 10; offset < LOOP; offset += 24) {
      const holder = new Group();
      const f = new Mesh(cloth, flag);
      f.rotation.y = 0.5;
      holder.add(new Mesh(pole, steel), f);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -(CROWD_FAR + 1.2) });
    }
  }

  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.1, 0.1, 6.6, 8);
    post.translate(0, 3.3, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1.2, 1.3);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0xd8dce0, metalness: 0.5, roughness: 0.4 });
    for (const [text, fill, ink, offset] of STREET_BANNERS) {
      const banner = new Group();
      for (const x of [-roadHalf - 0.7, roadHalf + 0.7]) {
        const p = new Mesh(post, steel);
        p.position.x = x;
        banner.add(p);
      }
      const c = new Mesh(
        cloth,
        this.material({ map: this.track(clothBannerTexture(text, fill, ink)), side: DoubleSide }),
      );
      c.position.y = 5.8;
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
          x: side * (BARRIER - 0.25),
        });
      }
    }
  }

  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.4, 8.5);
    this.disposables.push(plane);
    const count = Math.floor(LOOP / ROAD_PAINT_EVERY);
    for (let i = 0; i < count; i++) {
      const [text, colour, x] = ROAD_PAINT[i % ROAD_PAINT.length]!;
      const mesh = new Mesh(
        plane,
        this.material({
          map: this.track(paintTexture(text, colour)),
          alphaTest: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -4,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02 - KERB;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 12 + i * ROAD_PAINT_EVERY, x, lies: true });
    }
  }

  /**
   * Ahead, the town climbing its hill: terraces of pastel blocks stepping up the slope among
   * the gardens, the Casino on top with its twin towers and copper roofs, and the bare limestone
   * mountains behind, all hazed by hand.
   */
  private addHill(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const random = seeded(6401);
    const slope = hazedMaterial(this.disposables, haze, 0x5a7a4a, 0.25);
    const hill = new Mesh(this.unitBox(), slope);
    hill.scale.set(520, 40, 200);
    hill.position.set(40, 6, -160);
    hill.rotation.x = 0.2;
    h.add(hill);
    // Terraces of blocks up the hill, rising row by row.
    const walls = WALLS.map(([wall]) => hazedMaterial(this.disposables, haze, wall, 0.18));
    const roof = hazedMaterial(this.disposables, haze, 0xb8643e, 0.2);
    for (let row = 0; row < 5; row++) {
      for (let k = 0; k < 16; k++) {
        const x = -150 + k * 22 + random() * 10;
        // The Casino's place on the hill is kept clear of blocks in front and behind.
        if (Math.abs(x) < 82 && row >= 2) continue;
        const tall = 12 + random() * 18;
        const block = new Mesh(this.unitBox(), walls[Math.floor(random() * walls.length)]!);
        const y = row * 9;
        block.scale.set(16 + random() * 6, tall, 12);
        block.position.set(x, y + tall / 2 - 4, -20 - row * 34);
        h.add(block);
        const top = new Mesh(this.unitBox(), roof);
        top.scale.set(block.scale.x + 0.6, 1, 12.6);
        top.position.set(x, y + tall - 3.5, block.position.z);
        h.add(top);
      }
    }
    this.addCasino(h, haze);
    // The limestone mountains behind, a long jagged ridge, bare and grey above their scrub.
    const rock = hazedMaterial(this.disposables, haze, 0x9a9488, 0.4);
    const scrub = hazedMaterial(this.disposables, haze, 0x6a7a5a, 0.4);
    for (let k = 0; k < 22; k++) {
      const x = -900 + k * 85 + random() * 40;
      const tall = 120 + random() * 150;
      const wide = 300 + random() * 200;
      const peak = new Mesh(new ConeGeometry(wide / 2, tall, 7, 1), k % 3 ? rock : scrub);
      this.disposables.push(peak.geometry);
      peak.scale.z = 0.45;
      peak.rotation.y = random() * Math.PI;
      peak.position.set(x, tall / 2 - 40, -820 - random() * 260);
      h.add(peak);
    }
  }

  /**
   * The Casino of Monte-Carlo on top of the hill: its cream Beaux-Arts front of tall arched
   * windows between columns, two square towers at its ends under copper caps and lanterns, the
   * clock in the middle under its copper roof, and the gardens falling away in front.
   */
  private addCasino(h: Group, haze: Color): void {
    const casino = new Group();
    const cream = hazedMaterial(this.disposables, haze, 0xf2e0b8, 0.04);
    const front = hazedMaterial(this.disposables, haze, 0xffffff, 0.03, {
      map: this.track(casinoTexture()),
    });
    const copper = hazedMaterial(this.disposables, haze, 0x4a9a80, 0.05);
    const body = new Mesh(new BoxGeometry(64, 18, 30), [cream, cream, cream, cream, front, cream]);
    this.disposables.push(body.geometry);
    body.position.set(0, 9, 0);
    casino.add(body);
    const roof = new Mesh(new BoxGeometry(56, 6, 26), copper);
    this.disposables.push(roof.geometry);
    roof.position.set(0, 21, -2);
    casino.add(roof);
    for (const x of [-30, 30]) {
      const tower = new Mesh(new BoxGeometry(9, 30, 9), cream);
      this.disposables.push(tower.geometry);
      tower.position.set(x, 15, 9);
      casino.add(tower);
      const cap = new Mesh(new ConeGeometry(6.6, 10, 4, 1), copper);
      this.disposables.push(cap.geometry);
      cap.rotation.y = Math.PI / 4;
      cap.position.set(x, 35, 9);
      casino.add(cap);
      const lantern = new Mesh(new CylinderGeometry(0.9, 1.2, 4, 8), copper);
      this.disposables.push(lantern.geometry);
      lantern.position.set(x, 42, 9);
      casino.add(lantern);
    }
    const clock = new Mesh(new BoxGeometry(14, 8, 3), cream);
    this.disposables.push(clock.geometry);
    clock.position.set(0, 22, 14);
    casino.add(clock);
    const dome = new Mesh(new SphereGeometry(5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), copper);
    this.disposables.push(dome.geometry);
    dome.position.set(0, 26, 12);
    casino.add(dome);
    // The gardens in front: a lawn falling away with its palms.
    const lawn = hazedMaterial(this.disposables, haze, 0x3a8a34, 0.08);
    const garden = new Mesh(this.unitBox(), lawn);
    garden.scale.set(90, 2, 50);
    garden.position.set(0, -1, 40);
    casino.add(garden);
    casino.scale.setScalar(2.3);
    casino.position.set(0, 30, -118);
    h.add(casino);
  }

  private unitGeometry?: BoxGeometry;
  private unitBox(): BoxGeometry {
    if (!this.unitGeometry) {
      this.unitGeometry = new BoxGeometry(1, 1, 1);
      this.disposables.push(this.unitGeometry);
    }
    return this.unitGeometry;
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

/** The kerb's paint: red and white blocks, one metre each. */
function kerbTexture(): CanvasTexture {
  return canvasTexture(16, 128, (g) => {
    g.fillStyle = '#d8283a';
    g.fillRect(0, 0, 16, 64);
    g.fillStyle = '#f4f4f0';
    g.fillRect(0, 64, 16, 64);
  });
}

/** The catch fence's steel mesh: a fine diamond lattice on clear. */
function meshTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(200,206,212,0.55)';
    g.lineWidth = 1;
    for (let x = -64; x < 128; x += 8) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 64, 64);
      g.moveTo(x + 64, 0);
      g.lineTo(x, 64);
      g.stroke();
    }
  });
}

/** The quay's pale limestone flags. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#d8d0c0';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(6501);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(120,110,96,0.15)' : 'rgba(255,255,255,0.18)';
      g.fillRect(random() * 256, random() * 256, 3, 3);
    }
    g.strokeStyle = 'rgba(110,100,86,0.45)';
    g.lineWidth = 2;
    for (let y = 0; y <= 256; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
      for (let x = (y / 64) % 2 ? 0 : 48; x <= 256; x += 96) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 64);
        g.stroke();
      }
    }
  });
}

/** The pavement under the stands: warm grey paving. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#a8a29a';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(80,76,70,0.4)';
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

/** The harbour water: deep blue, the sun glinting on its ripples. */
function waterTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#3a7ab0';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(6503);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(255,255,255,${0.05 + random() * 0.25})`;
      g.fillRect(random() * 512, random() * 512, 8 + random() * 24, 1.5);
    }
  });
}

/** A town front, one bay of two floors: shuttered windows with balconies, in its colours. */
function facadeTexture(wall: string, shutter: string, seed: number): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, 128, 128);
    const random = seeded(6600 + seed);
    for (const y of [10, 74]) {
      for (const x of [14, 78]) {
        const open = random() < 0.5;
        g.fillStyle = '#2a2a30';
        g.fillRect(x + 6, y + 4, 24, 40);
        g.fillStyle = shutter;
        if (open) {
          g.fillRect(x - 4, y + 4, 10, 40);
          g.fillRect(x + 30, y + 4, 10, 40);
        } else {
          g.fillRect(x + 6, y + 4, 24, 40);
          g.fillStyle = 'rgba(0,0,0,0.25)';
          for (let s = y + 8; s < y + 44; s += 5) g.fillRect(x + 6, s, 24, 1.5);
        }
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.fillRect(x, y + 44, 36, 4);
        g.fillStyle = 'rgba(40,40,44,0.8)';
        for (let b = x; b <= x + 36; b += 4) g.fillRect(b, y + 36, 1.5, 8);
      }
    }
  });
}

/** Monaco's flag: red over white. */
function monacoFlag(): CanvasTexture {
  return canvasTexture(96, 64, (g) => {
    g.fillStyle = '#d8283a';
    g.fillRect(0, 0, 96, 32);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 32, 96, 32);
  });
}

/** The Casino's front: tall arched windows between paired columns, a cornice and balustrade. */
function casinoTexture(): CanvasTexture {
  return canvasTexture(512, 144, (g) => {
    g.fillStyle = '#f0e2c0';
    g.fillRect(0, 0, 512, 144);
    g.fillStyle = '#d8c49a';
    g.fillRect(0, 0, 512, 14);
    g.fillRect(0, 128, 512, 16);
    for (let x = 4; x < 512; x += 8) g.fillRect(x, 4, 3, 10);
    for (let k = 0; k < 9; k++) {
      const x = 16 + k * 55;
      g.fillStyle = '#e4d2aa';
      g.fillRect(x - 10, 22, 6, 104);
      g.fillRect(x + 36, 22, 6, 104);
      g.fillStyle = '#3a3a3a';
      g.beginPath();
      g.moveTo(x + 2, 120);
      g.lineTo(x + 2, 52);
      g.arc(x + 16, 52, 14, Math.PI, 0);
      g.lineTo(x + 30, 120);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,220,150,0.35)';
      g.fillRect(x + 6, 60, 20, 56);
    }
  });
}
