// Montmartre, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Paris cobbles winding
// up the butte on a golden afternoon, closed for the ride. Cream and pastel houses of four to six
// floors stand shoulder to shoulder either side, with green and grey shutters, wrought-iron
// balconies, zinc mansards with dormers and chimney pots, wall lanterns, and cafés under their
// awnings on the ground floors. Halfway up, the Place du Tertre opens on the right: plane trees,
// café umbrellas and the painters at their easels. Tricolour bunting is strung across the street,
// and ahead, above the rooftops, the white domes of Sacré-Cœur crown the hill.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, figures, barriers,
// banners, feather flags and road paint of world-kit.ts. The cobbles are Old Town's road.
import {
  type BufferGeometry,
  type CanvasTexture,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  Vector2,
} from 'three/webgpu';
import {
  barrierBannerTexture,
  BoxBuilder,
  type BannerPanel,
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
const KERB = 0.14;
/** Race barriers line the kerbs; the fans stand on the pavements behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.4;
/** The house fronts stand this far off the road's centre. */
const FRONT = 7.2;
/** The Place du Tertre opens on the right between these offsets, its far side set back. */
const SQUARE_FROM = 126;
const SQUARE_TO = 168;
const SQUARE_BACK = 30;
/** The street ends this far ahead, at the foot of the butte with Sacré-Cœur on its crown. */
const AHEAD = 250;
const HAZE = 0xe6dccb;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
const PARISIANS: Wardrobe = {
  tops: [
    '#1d2a4a',
    '#f4f0e6',
    '#c8283a',
    '#2a2a2e',
    '#c9b48a',
    '#5a7a9a',
    '#7a2a3a',
    '#e8d8b8',
    '#2f5a3a',
    '#ffffff',
  ],
  bottoms: ['#20242b', '#2a3140', '#3b4a5c', '#c9b48a', '#4a4f57', '#1e2530'],
  skins: SKINS,
};
/** The painters of the Place du Tertre: smocks, berets' black and linen. */
const PAINTERS: Wardrobe = {
  tops: ['#e8e2d4', '#2a3a5a', '#d8c8a8', '#1d2a4a', '#f4f0e6'],
  bottoms: ['#2a2a2e', '#4a4f57', '#3b4a5c'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1d2a6a', ink: '#ffffff', text: 'MONTMARTRE' },
  { fill: '#ffffff', ink: '#c8283a', text: 'PARIS 18e' },
  { fill: '#c8283a', ink: '#ffffff', text: 'SACRÉ-CŒUR' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#f2e6c8', ink: '#1d2a6a', text: 'LA BUTTE' },
  { fill: '#2f5a3a', ink: '#ffffff', text: 'RUE LEPIC' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['MONTMARTRE · LA BUTTE', '#1d2a6a', '#ffffff', 132],
  ['SACRÉ-CŒUR · 500 m', '#c8283a', '#ffffff', 382],
];
const FEATHERS: readonly FeatherWord[] = [
  ['MONTMARTRE', '#1d2a6a', '#ffffff'],
  ['PARIS', '#c8283a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['ALLEZ', '#ffffff', '#1d2a6a'],
];
const FEATHER_EVERY = 18;
/** What the fans chalk and paint on the cobbles, its colour and how far off the crown. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['ALLEZ SOPHIE', '#ffffff', -1.6],
  ['WATTZUP', '#d7ff3a', 1.6],
  ['VAS-Y MAYA', '#ffffff', 1.4],
  ['ALLEZ', '#f2c230', -1.4],
  ['GO KENJI', '#ffffff', -1.6],
  ['LA BUTTE!', '#ffffff', 1.6],
];
const ROAD_PAINT_EVERY = 22;
/** The cafés on the ground floors: the name over the window and the awning's colour. */
const CAFES: readonly (readonly [string, string])[] = [
  ['CAFÉ DES ARTISTES', '#b8282e'],
  ['LE CONSULAT', '#2f5a3a'],
  ['BOULANGERIE', '#1d2a6a'],
  ['CRÊPERIE', '#b8282e'],
  ['LA BONNE FRANQUETTE', '#7a2a3a'],
  ['BRASSERIE', '#2f5a3a'],
  ['TABAC', '#c8283a'],
  ['BISTROT', '#1d2a6a'],
];
/** House renders: cream, ivory, pale ochre, the pink of La Maison Rose, pale grey. */
const RENDERS = [
  0xf0e6d2, 0xe8dcc0, 0xe6cfa0, 0xe8b8b0, 0xd8d4cc, 0xf2ead8, 0xdcc8a8, 0xd0dcd4, 0xc8d0dc,
];
/** A stair passage climbs away from the street on the left about this often. */
const STAIRS_EVERY = 70;
const STAIRS_WIDTH = 5;
const SHUTTERS = [0x3a6a4a, 0x8a9a9a, 0x2f4a6a, 0x5a7a5a, 0xe8e2d4];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

/** A house's look: how wide and tall, its colours, its café and its roof. */
interface House {
  readonly width: number;
  readonly floors: number;
  readonly render: number;
  readonly shutters: number;
  readonly cafe: number;
  readonly mansard: boolean;
  readonly balconies: boolean;
}

export class MontmartreStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly painters: Figures;
  private readonly easels: { offset: number; x: number; turn: number }[] = [];
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flagMaterials = ['#1d2a6a', '#ffffff', '#c8283a'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // The fans stand back where the square opens, and just short of it, so the painters show.
    const square = (offset: number) => offset > SQUARE_FROM - 14 && offset < SQUARE_TO + 2;
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.7,
      wardrobe: PARISIANS,
      flags: this.flagMaterials,
      flagShare: 0.15,
      seeds: [3011, 3017],
      skip: (side, offset) => (side > 0 && square(offset)) || offset % 60 > 52,
    });
    this.painters = new Figures(this.group, disposables, 7, PAINTERS, 3021);
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addHouses();
    this.addSquare();
    this.addBunting();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addButte();
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
      prop.mesh.visible = metres < AHEAD - 8;
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB, -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    // The painters at their easels, each leaning a little to the canvas as they work.
    this.easels.forEach((easel, i) => {
      const metres = along(easel.offset, LOOP);
      const hidden = metres > AHEAD - 8 ? -50 : 0;
      const dab = Math.sin(this.time * 1.3 + i * 2) * 0.05;
      this.painters.set(
        i,
        easel.x - 0.5,
        ground(metres) + KERB + hidden,
        -metres + 1.0,
        -Math.PI / 2 + easel.turn + dab,
        1,
      );
    });
    this.painters.commit();
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /** The kerbs and the pavements up to the house fronts, and the square's paving. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xb8b4aa, roughness: 0.85 });
    const pavement = this.material({ map: this.repeat(pavementTexture(), 3, 3), roughness: 0.95 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
      this.ribbons.add(points, pavement, order([at(SQUARE_BACK + 6, KERB), at(r + 0.3, KERB)]));
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
   * The houses, shoulder to shoulder along both sides: rendered fronts of four to six floors with
   * string courses and a cornice, tall French windows with shutters, wrought-iron balconies, a
   * café on the ground floor under its awning and its name, a wall lantern, and a zinc mansard
   * with dormers and chimney pots or a pitched tile roof. Each house is built once from its look
   * and merged by material.
   */
  private addHouses(): void {
    const random = seeded(3101);
    const looks: House[] = [];
    for (let k = 0; k < 14; k++) {
      looks.push({
        width: 8 + Math.floor(random() * 4) * 2,
        floors: 2 + Math.floor(random() * 5),
        render: RENDERS[k % RENDERS.length]!,
        shutters: SHUTTERS[(k * 3) % SHUTTERS.length]!,
        cafe: k % CAFES.length,
        mansard: k % 3 !== 1,
        balconies: k % 2 === 0,
      });
    }
    const built = looks.map((look) => this.house(look));
    const stairs = this.stairs();
    for (const side of [-1, 1] as const) {
      let offset = side > 0 ? 4 : 0;
      let k = side > 0 ? 3 : 0;
      let nextStairs = 40;
      while (offset < LOOP - 6) {
        // Between the houses on the left, now and then, a stair passage climbs the butte.
        if (side < 0 && offset >= nextStairs) {
          const holder = new Group();
          holder.add(stairs.clone());
          this.group.add(holder);
          this.props.push({ mesh: holder, offset: offset + STAIRS_WIDTH / 2, x: -FRONT });
          offset += STAIRS_WIDTH;
          nextStairs += STAIRS_EVERY;
          continue;
        }
        const i = Math.floor(random() * looks.length);
        const look = looks[(i + k++) % looks.length]!;
        const width = look.width;
        const centre = offset + width / 2;
        offset += width;
        // The square opens on the right: its far side stands back across it.
        const inSquare = side > 0 && centre > SQUARE_FROM && centre < SQUARE_TO;
        const holder = new Group();
        const mesh = built[looks.indexOf(look)]!.clone();
        // Fronts face the road: a house on the right is turned round.
        mesh.rotation.y = side > 0 ? Math.PI : 0;
        holder.add(mesh);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: centre,
          // Each front stands a little further back or forward than its neighbours.
          x: side * (inSquare ? SQUARE_BACK : FRONT + random() * 1.4),
        });
      }
    }
  }

  /**
   * A stair passage, its mouth at x = 0 facing +x: flights of stone steps climbing away from the
   * street between the houses' side walls, a landing between them, an iron handrail up the middle
   * and Paris lanterns on cast-iron posts either side.
   */
  private stairs(): Group {
    const b = new BoxBuilder();
    const stone = this.material({ color: 0xd8d2c4, roughness: 0.9 });
    const iron = this.material({ color: 0x1a1c1e, roughness: 0.6, metalness: 0.4 });
    const lamp = this.material({
      color: 0xffe2a0,
      emissive: new Color(0xffc870),
      emissiveIntensity: 0.6,
    });
    const w = STAIRS_WIDTH - 0.4;
    let y = 0;
    let x = -0.2;
    for (let k = 0; k < 34; k++) {
      // A landing halfway up.
      const tread = k === 16 ? 2.4 : 0.38;
      y += 0.17;
      b.box(stone, [tread, y, w], [x - tread / 2, y / 2, 0]);
      x -= tread;
    }
    // The handrail up the middle on its posts.
    const run = -x;
    const slope = Math.atan2(y, run);
    b.box(iron, [Math.hypot(run, y), 0.06, 0.06], [x / 2, y / 2 + 0.95, 0], -slope);
    for (let k = 1; k < 8; k++) {
      const px = (x * k) / 8;
      b.box(iron, [0.05, 0.95, 0.05], [px, (y * k) / 8 + 0.47, 0]);
    }
    // Lanterns on cast-iron posts either side, at the foot and at the landing.
    for (const [px, py] of [
      [-0.6, 0.17],
      [x * 0.48, y * 0.5],
    ] as const) {
      for (const pz of [-w / 2 + 0.3, w / 2 - 0.3]) {
        b.box(iron, [0.14, 3.6, 0.14], [px, py + 1.8, pz]);
        b.box(iron, [0.42, 0.1, 0.42], [px, py + 3.65, pz]);
        b.box(lamp, [0.34, 0.5, 0.34], [px, py + 3.95, pz]);
        b.box(iron, [0.46, 0.1, 0.46], [px, py + 4.25, pz]);
      }
    }
    return b.build(this.disposables);
  }

  /** One house, its front at x = 0 facing +x, centred on z = 0. */
  private house(look: House): Group {
    const b = new BoxBuilder();
    const w = look.width;
    const d = 11;
    const floor = 3.1;
    const ground = 3.8;
    const tall = ground + look.floors * floor;
    const render = this.material({
      map: this.track(renderTexture()),
      color: look.render,
      roughness: 0.95,
    });
    const stone = this.material({ color: 0xf2ecde, roughness: 0.85 });
    const glass = this.material({ color: 0x1e2428, roughness: 0.25, metalness: 0.3 });
    const shutter = this.material({ color: look.shutters, roughness: 0.8 });
    const iron = this.material({ color: 0x1a1c1e, roughness: 0.6, metalness: 0.4 });
    const zinc = this.material({ color: 0x6a7480, roughness: 0.55, metalness: 0.3 });
    const tile = this.material({ color: 0xa8583a, roughness: 0.9 });
    const brick = this.material({ color: 0xb06a4a, roughness: 0.95 });
    const [name, awningColour] = CAFES[look.cafe]!;
    const awning = this.material({ map: this.track(awningTexture(awningColour)), roughness: 0.85 });
    const sign = this.material({
      map: this.track(signTexture(name, awningColour)),
      roughness: 0.6,
    });
    const lamp = this.material({
      color: 0xffe2a0,
      emissive: new Color(0xffc870),
      emissiveIntensity: 0.6,
    });
    // The walls, the cornice and a string course over each floor.
    b.box(render, [d, tall, w], [-d / 2, tall / 2, 0]);
    b.box(stone, [0.5, 0.45, w + 0.2], [0.2, tall - 0.2, 0]);
    for (let f = 0; f <= look.floors; f++) {
      b.box(stone, [0.24, 0.18, w], [0.1, ground + f * floor - 0.15, 0]);
    }
    // The shop front: its window across the ground floor between stone piers, the café's name
    // over it and the awning sloping out over the pavement.
    b.box(glass, [0.12, 2.6, w - 1.4], [0.04, 1.5, 0]);
    for (const z of [-w / 2 + 0.35, w / 2 - 0.35])
      b.box(stone, [0.3, ground, 0.7], [0.12, ground / 2, z]);
    b.box(sign, [0.14, 0.62, w - 1.2], [0.16, 3.15, 0]);
    b.box(awning, [2.2, 0.06, w - 1.6], [0.95, 2.75, 0], -0.32);
    // The upper floors: tall French windows, shutters folded back either side, balconies.
    const bays = Math.max(2, Math.floor(w / 2.6));
    const pitch = w / bays;
    for (let f = 0; f < look.floors; f++) {
      const y = ground + f * floor + 1.35;
      for (let k = 0; k < bays; k++) {
        const z = -w / 2 + pitch * (k + 0.5);
        b.box(stone, [0.08, 2.15, 1.25], [0.02, y, z]);
        b.box(glass, [0.1, 1.95, 1.0], [0.05, y, z]);
        for (const side of [-1, 1]) b.box(shutter, [0.08, 1.95, 0.52], [0.08, y, z + side * 0.8]);
        if (!look.balconies && (f === 1 || f === look.floors - 1)) {
          b.box(iron, [0.04, 0.85, 1.25], [0.42, y - 0.55, z]);
          b.box(stone, [0.45, 0.1, 1.35], [0.2, y - 1.0, z]);
        }
      }
      // A balcony along the whole front on the second floor and the top floor.
      if (look.balconies && (f === 1 || f === look.floors - 1)) {
        b.box(iron, [0.04, 0.9, w - 0.6], [0.62, y - 0.5, 0]);
        b.box(stone, [0.66, 0.12, w - 0.4], [0.3, y - 0.98, 0]);
      }
    }
    // A wall lantern on a bracket beside the shop.
    b.box(iron, [0.7, 0.06, 0.06], [0.35, 4.4, -w / 2 + 1]);
    b.box(lamp, [0.3, 0.45, 0.3], [0.6, 4.1, -w / 2 + 1]);
    b.box(iron, [0.36, 0.08, 0.36], [0.6, 4.36, -w / 2 + 1]);
    if (look.mansard) {
      // The zinc mansard: a steep slope back from the cornice, a shallow top, dormers in it.
      b.box(zinc, [0.3, 3, w], [-0.55, tall + 1.35, 0], 0.35);
      b.box(zinc, [d - 1.4, 0.3, w], [-d / 2 - 0.4, tall + 2.8, 0]);
      for (let k = 0; k < bays; k++) {
        const z = -w / 2 + pitch * (k + 0.5);
        b.box(zinc, [1, 1.7, 1.2], [-0.4, tall + 1.2, z]);
        b.box(glass, [0.06, 1.1, 0.7], [0.12, tall + 1.15, z]);
        b.box(zinc, [1.2, 0.2, 1.4], [-0.4, tall + 2.1, z], 0.25);
      }
    } else {
      // A pitched roof of red tiles, its eaves to the street.
      b.box(tile, [d * 0.62, 0.3, w + 0.4], [-d * 0.27, tall + 1.6, 0], -0.52);
      b.box(tile, [d * 0.62, 0.3, w + 0.4], [-d * 0.77, tall + 1.6, 0], 0.52);
    }
    // Chimney stacks on the party walls, each with its row of pots.
    for (const z of [-w / 2 + 0.6, w / 2 - 0.6]) {
      b.box(brick, [1.2, 2.4, 0.9], [-d / 2, tall + 2.6, z]);
      for (const x of [-0.35, 0, 0.35]) b.box(tile, [0.18, 0.5, 0.18], [-d / 2 + x, tall + 4, z]);
    }
    return b.build(this.disposables);
  }

  /**
   * The Place du Tertre, opening on the right: plane trees over its paving, red café umbrellas
   * with tables under them, and the painters at their easels, canvases turned to the street.
   */
  private addSquare(): void {
    const random = seeded(3201);
    // Each piece stands on the street's slope at its own place along it.
    const put = (piece: Group, z: number, x: number) => {
      const holder = new Group();
      holder.add(piece);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: SQUARE_FROM - z, x });
    };
    const trunk = new CylinderGeometry(0.22, 0.32, 5, 8);
    trunk.translate(0, 2.5, 0);
    const crown = new SphereGeometry(1, 10, 8);
    const umbrella = new ConeGeometry(1.6, 0.6, 8, 1, true);
    umbrella.translate(0, 2.5, 0);
    const pole = new CylinderGeometry(0.04, 0.04, 2.5, 6);
    pole.translate(0, 1.25, 0);
    const table = new CylinderGeometry(0.45, 0.45, 0.05, 12);
    table.translate(0, 0.75, 0);
    const leg = new BoxGeometry(0.05, 1.7, 0.05);
    leg.translate(0, 0.85, 0);
    const canvas = new BoxGeometry(0.05, 1.1, 1.4);
    this.disposables.push(trunk, crown, umbrella, pole, table, leg, canvas);
    const bark = this.material({ map: this.track(barkTexture()), roughness: 1 });
    const leaves = ['#5a7a3a', '#6a8a42', '#4a6a32'].map((c) =>
      this.material({ color: c, roughness: 1 }),
    );
    const red = this.material({ color: 0xb8282e, side: DoubleSide, roughness: 0.8 });
    const white = this.material({ color: 0xf2ece0, roughness: 0.7 });
    const wood = this.material({ color: 0x8a5a32, roughness: 0.9 });
    const paintings = [0, 1, 2, 3, 4, 5, 6].map((k) =>
      this.material({ map: this.track(paintingTexture(k)), roughness: 0.8 }),
    );
    const depth = SQUARE_TO - SQUARE_FROM;
    // Plane trees in two rows across the square.
    for (let k = 0; k < 8; k++) {
      const x = 12 + (k % 2) * 9 + random() * 2;
      const z = -(k >> 1) * (depth / 4) - 4 - random() * 3;
      const tree = new Group();
      const t = new Mesh(trunk, bark);
      const c = new Mesh(crown, leaves[k % 3]!);
      const size = 3.2 + random() * 0.8;
      c.scale.set(size, size * 0.8, size);
      c.position.y = 6.2;
      c.castShadow = true;
      tree.add(t, c);
      put(tree, z, x);
    }
    // Café umbrellas with their tables and white chairs under the trees.
    for (let k = 0; k < 6; k++) {
      const x = 17 + (k % 2) * 6;
      const z = -k * (depth / 6) - 3;
      const terrace = new Group();
      terrace.add(new Mesh(umbrella, red), new Mesh(pole, wood), new Mesh(table, white));
      put(terrace, z, x);
      for (const [cx, cz] of [
        [0.8, 0],
        [-0.8, 0],
        [0, 0.8],
      ] as const) {
        const chair = new Mesh(this.unit, white);
        chair.scale.set(0.42, 0.85, 0.42);
        chair.position.set(cx, 0.43, cz);
        terrace.add(chair);
      }
    }
    // The painters' easels along the square's front on the pavement, canvases turned to the street.
    for (let k = 0; k < 7; k++) {
      const x = 5.4 + (k % 2) * 1.3 + random() * 0.3;
      const zLocal = -2 - k * ((depth - 6) / 7);
      const turn = 0.4 + (random() - 0.5) * 0.3;
      const easel = new Group();
      for (const [lx, lz, tilt] of [
        [0.25, 0.3, 0.12],
        [0.25, -0.3, -0.12],
        [-0.35, 0, 0],
      ] as const) {
        const l = new Mesh(leg, wood);
        l.position.set(lx, 0, lz);
        l.rotation.x = tilt;
        l.rotation.z = lx > 0 ? -0.1 : 0.2;
        easel.add(l);
      }
      const c = new Mesh(canvas, paintings[k]!);
      c.position.set(0.3, 1.7, 0);
      c.rotation.z = -0.12;
      easel.add(c);
      // The canvas turned to the street and a little toward the rider coming up it.
      easel.rotation.y = turn;
      put(easel, zLocal, x);
      this.easels.push({ offset: SQUARE_FROM - zLocal, x, turn });
    }
  }

  /** Tricolour pennants strung across the street between the houses' upper floors. */
  private addBunting(): void {
    const plane = new PlaneGeometry(2 * FRONT, 0.9);
    this.disposables.push(plane);
    const pennants = this.material({
      map: this.track(buntingTexture()),
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.8,
    });
    for (let k = 0; k < LOOP / 24; k++) {
      const holder = new Group();
      const string = new Mesh(plane, pennants);
      string.position.y = 8.2 + (k % 3) * 0.9;
      string.rotation.y = (k % 2 ? 1 : -1) * 0.25;
      holder.add(string);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 10 + k * 24, x: 0 });
    }
  }

  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.08, 0.08, 6.4, 8);
    post.translate(0, 3.2, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1, 1.2);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0x2a2c2e, metalness: 0.5, roughness: 0.4 });
    for (const [text, fill, ink, offset] of STREET_BANNERS) {
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
      this.props.push({ mesh: banner, offset, x: 0 });
    }
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
          roughness: 0.7,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.03 - KERB;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 16 + i * ROAD_PAINT_EVERY, x, lies: true });
    }
  }

  /**
   * Ahead, where the street ends: the butte rising green above rooftops at its foot, stairs and
   * terraces climbing its face, and on its crown Sacré-Cœur in white travertine: the portico of
   * three arches with a cupola either side, the nave, the tall drum and its ogive dome with the
   * lantern, the smaller domes round it and the campanile behind, all hazed by hand.
   */
  private addButte(): void {
    const haze = new Color(HAZE);
    const h = this.horizon;
    const random = seeded(3301);
    // Rooftops at the butte's foot, across and either side of the street's end.
    const walls = RENDERS.map((c, i) =>
      hazedMaterial(this.disposables, haze, c, 0.12 + (i % 3) * 0.03),
    );
    const roofs = hazedMaterial(this.disposables, haze, 0x6a7480, 0.14);
    for (let k = 0; k < 46; k++) {
      const x = (random() - 0.5) * 360;
      if (Math.abs(x) < 9) continue;
      const z = -10 - random() * 90;
      const w = 10 + random() * 12;
      const tall = 12 + random() * 12;
      const house = new Mesh(this.unit, walls[k % walls.length]!);
      house.scale.set(w, tall, 10);
      house.position.set(x, tall / 2 - 2, z);
      const roof = new Mesh(this.unit, roofs);
      roof.scale.set(w, 2.4, 9);
      roof.position.set(x, tall - 0.8, z);
      h.add(house, roof);
    }
    // The butte: a green hill of gardens and trees.
    const hill = new LatheGeometry(
      [
        new Vector2(0, 62),
        new Vector2(70, 60),
        new Vector2(130, 46),
        new Vector2(200, 20),
        new Vector2(260, 0),
        new Vector2(300, -5),
      ],
      28,
    );
    this.disposables.push(hill);
    const grass = hazedMaterial(this.disposables, haze, 0x6a8a4a, 0.16, { side: DoubleSide });
    const butte = new Mesh(hill, grass);
    butte.position.set(0, 0, -240);
    h.add(butte);
    const crown = new SphereGeometry(1, 8, 6);
    this.disposables.push(crown);
    const trees = [0x4a6a32, 0x5a7a3a].map((c, i) =>
      hazedMaterial(this.disposables, haze, c, 0.18 + i * 0.04),
    );
    for (let k = 0; k < 90; k++) {
      const a = random() * Math.PI * 2;
      const r = 90 + random() * 170;
      const x = Math.cos(a) * r;
      const z = -240 + Math.sin(a) * r;
      if (z > -110 && Math.abs(x) < 30) continue;
      const y =
        r < 130 ? 60 - (r - 70) * 0.23 : r < 200 ? 46 - (r - 130) * 0.37 : 20 - (r - 200) * 0.33;
      const tree = new Mesh(crown, trees[k % 2]!);
      const size = 5 + random() * 4;
      tree.scale.set(size, size * 0.85, size);
      tree.position.set(x, y + size * 0.5, z);
      h.add(tree);
    }
    // The stairs and terraces climbing the face to the basilica.
    const steps = hazedMaterial(this.disposables, haze, 0xe8e2d4, 0.12);
    for (let k = 0; k < 9; k++) {
      const flight = new Mesh(this.unit, steps);
      const z = -150 - k * 8.5;
      const y = 22 + k * 4.6;
      flight.scale.set(24 - k * 0.8, 1.2, 8);
      flight.position.set(0, y, z);
      h.add(flight);
    }
    h.add(this.basilica(haze));
  }

  /** Sacré-Cœur, its portico toward the street, on the butte's crown. */
  private basilica(haze: Color): Group {
    const g = new Group();
    const white = hazedMaterial(this.disposables, haze, 0xfbf8f0, 0.1, {
      side: DoubleSide,
      emissive: new Color(0x6a6458),
      emissiveIntensity: 0.25,
    });
    const shade = hazedMaterial(this.disposables, haze, 0x6a645a, 0.14);
    const bronze = hazedMaterial(this.disposables, haze, 0x3a3a32, 0.14);
    const ribbed = hazedMaterial(this.disposables, haze, 0xfbf8f0, 0.1, {
      side: DoubleSide,
      map: this.track(domeTexture()),
      emissive: new Color(0x6a6458),
      emissiveIntensity: 0.25,
    });
    // A box with one carved face toward the street, white travertine on the rest.
    const faced = (texture: CanvasTexture, w: number, hh: number, d: number, z: number) => {
      const front = hazedMaterial(this.disposables, haze, 0xffffff, 0.1, {
        map: this.track(texture),
        emissive: new Color(0x6a6458),
        emissiveIntensity: 0.25,
      });
      const mesh = new Mesh(this.unit, [white, white, white, white, front, white]);
      mesh.scale.set(w, hh, d);
      mesh.position.set(0, hh / 2, z);
      g.add(mesh);
    };
    const add = (
      geometry: BufferGeometry,
      material: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(geometry, material);
      mesh.position.set(x, y, z);
      g.add(mesh);
      return mesh;
    };
    const box = (w: number, hh: number, d: number, x: number, y: number, z: number, m = white) => {
      const mesh = add(this.unit, m, x, y + hh / 2, z);
      mesh.scale.set(w, hh, d);
      return mesh;
    };
    // The ogive dome: a lathe swelling a little over its drum, then drawing to a point.
    const ogive = new LatheGeometry(
      [
        new Vector2(0, 0),
        new Vector2(1, 0),
        new Vector2(1.06, 0.25),
        new Vector2(1.0, 0.55),
        new Vector2(0.82, 0.85),
        new Vector2(0.55, 1.12),
        new Vector2(0.22, 1.32),
        new Vector2(0, 1.4),
      ],
      24,
    );
    const drum = new CylinderGeometry(1, 1, 1, 24);
    drum.translate(0, 0.5, 0);
    this.disposables.push(ogive, drum);
    const dome = (r: number, drumHeight: number, x: number, y: number, z: number) => {
      add(drum, white, x, y, z).scale.set(r, drumHeight, r);
      add(ogive, ribbed, x, y + drumHeight, z).scale.set(r * 1.08, r * 1.08, r * 1.08);
      // The lantern on top, and its little cap.
      const top = y + drumHeight + r * 1.08 * 1.4;
      add(drum, white, x, top - r * 0.1, z).scale.set(r * 0.18, r * 0.42, r * 0.18);
      add(ogive, white, x, top + r * 0.3, z).scale.set(r * 0.2, r * 0.2, r * 0.2);
      // Tall windows round the drum.
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const w = box(
          0.4,
          drumHeight * 0.5,
          r * 0.2,
          x + Math.sin(a) * r * 1.01,
          y + drumHeight * 0.25,
          z + Math.cos(a) * r * 1.01,
          shade,
        );
        w.rotation.y = a;
      }
    };
    // Scaled up a little so it reads from the street, as it does from Montmartre's lanes.
    g.scale.setScalar(2);
    // The nave and transepts, the portico of three arches with its terrace, the corner domes.
    box(32, 24, 64, 0, 0, -6);
    faced(transeptTexture(), 52, 20, 18, -10);
    faced(porticoTexture(), 34, 18, 10, 30);
    // The two bronze horsemen on the portico's corners, Saint Louis and Joan of Arc.
    for (const x of [-14.5, 14.5]) {
      box(1.6, 1.2, 1.6, x, 18, 33);
      box(1.1, 1.5, 3.2, x, 19.2, 33, bronze);
      box(0.5, 0.5, 0.9, x, 20.4, 34.6, bronze);
      for (const lz of [-1.2, 1.2]) box(0.9, 1.4, 0.3, x, 18.9 - 1.1, 33 + lz, bronze);
      box(0.6, 1.8, 0.6, x, 20.7, 32.8, bronze);
    }
    box(40, 2, 16, 0, -2, 38);
    dome(11, 18, 0, 24, -6);
    for (const [x, z] of [
      [-13, 12],
      [13, 12],
      [-13, -24],
      [13, -24],
    ] as const) {
      dome(4, 6, x, 22, z);
    }
    for (const x of [-14, 14]) dome(3.2, 5, x, 18, 31);
    // The campanile behind the apse.
    box(11, 52, 11, 0, 0, -48);
    dome(5, 6, 0, 52, -48);
    g.position.set(0, 60, -235);
    return g;
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

/** Grey Paris pavement: asphalt flags with joints. */
function pavementTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#8e8c88', 3401);
    g.strokeStyle = 'rgba(60,58,54,0.45)';
    g.lineWidth = 2;
    for (let y = 0; y < 256; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
  });
}

/** Lime render: white, mottled a little, to be tinted by the house's colour. */
function renderTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(3403);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(120,110,95,0.08)' : 'rgba(255,255,255,0.4)';
      g.fillRect(random() * 128, random() * 128, 4 + random() * 10, 2 + random() * 6);
    }
  });
}

/** A café awning: broad stripes of its colour and white, a scalloped valance. */
function awningTexture(colour: string): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = (x / 16) % 2 ? '#f4f0e6' : colour;
      g.fillRect(x, 0, 16, 64);
    }
  });
}

/** A café's name in gold capitals on its colour, over the shop window. */
function signTexture(name: string, colour: string): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#f2d890';
    g.font = 'bold 38px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, 256, 34, 490);
  });
}

function barkTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#8a8270', 3405);
    const random = seeded(3407);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(220,214,190,0.6)' : 'rgba(90,96,70,0.5)';
      g.fillRect(random() * 64, random() * 128, 8 + random() * 16, 6 + random() * 14);
    }
  });
}

/** A painter's canvas: Montmartre's rooftops, the domes, a sunset, a café, each its own. */
function paintingTexture(k: number): CanvasTexture {
  return canvasTexture(128, 96, (g) => {
    const skies = ['#8ab4d8', '#f2a860', '#c8d8e8', '#e88a6a', '#a8c8e0', '#f2c870', '#b8a8d8'];
    g.fillStyle = skies[k % skies.length]!;
    g.fillRect(0, 0, 128, 96);
    const random = seeded(3411 + k);
    g.fillStyle = '#f8f4ec';
    g.beginPath();
    g.ellipse(64 + (random() - 0.5) * 40, 44, 16, 22, 0, Math.PI, 0);
    g.fill();
    for (let i = 0; i < 9; i++) {
      g.fillStyle = ['#e8d8b8', '#d8a890', '#8a9aa8', '#c8b088', '#f0e8d8'][i % 5]!;
      const x = i * 15;
      const hgt = 18 + random() * 22;
      g.fillRect(x, 96 - hgt, 15, hgt);
    }
    g.strokeStyle = '#4a3a2a';
    g.lineWidth = 6;
    g.strokeRect(0, 0, 128, 96);
  });
}

/** A string of pennants, blue, white and red. */
function buntingTexture(): CanvasTexture {
  return canvasTexture(512, 32, (g) => {
    g.strokeStyle = '#2a2a2a';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 2);
    g.lineTo(512, 2);
    g.stroke();
    const colours = ['#1d2a6a', '#ffffff', '#c8283a'];
    for (let x = 0, k = 0; x < 512; x += 21, k++) {
      g.fillStyle = colours[k % 3]!;
      g.beginPath();
      g.moveTo(x + 2, 2);
      g.lineTo(x + 19, 2);
      g.lineTo(x + 10.5, 30);
      g.closePath();
      g.fill();
    }
  });
}

/** A dome's skin: white travertine with its ribs running up to the lantern. */
function domeTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = '#fbf8f0';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = 'rgba(120,112,98,0.45)';
    for (let x = 0; x < 256; x += 16) g.fillRect(x, 0, 3, 64);
  });
}

/**
 * The portico's face: three tall round arches between paired columns, a small arched window
 * over each, and the arcaded cornice along its top.
 */
function porticoTexture(): CanvasTexture {
  return canvasTexture(512, 272, (g) => {
    g.fillStyle = '#f6f2e8';
    g.fillRect(0, 0, 512, 272);
    // The arcaded cornice.
    g.fillStyle = '#d8d0c0';
    g.fillRect(0, 26, 512, 8);
    g.fillStyle = '#8a8274';
    for (let x = 6; x < 512; x += 20) {
      g.beginPath();
      g.arc(x + 7, 14, 6, Math.PI, 0);
      g.lineTo(x + 13, 24);
      g.lineTo(x + 1, 24);
      g.closePath();
      g.fill();
    }
    for (const cx of [104, 256, 408]) {
      // The deep arch, its moulding and the bronze doors far back in it.
      g.fillStyle = '#cfc6b4';
      g.beginPath();
      g.arc(cx, 128, 56, Math.PI, 0);
      g.lineTo(cx + 56, 272);
      g.lineTo(cx - 56, 272);
      g.closePath();
      g.fill();
      g.fillStyle = '#4a4438';
      g.beginPath();
      g.arc(cx, 132, 46, Math.PI, 0);
      g.lineTo(cx + 46, 272);
      g.lineTo(cx - 46, 272);
      g.closePath();
      g.fill();
      g.fillStyle = '#5e4a32';
      g.fillRect(cx - 26, 196, 52, 76);
      // A small arched window over it.
      g.fillStyle = '#5a544a';
      g.beginPath();
      g.arc(cx, 54, 9, Math.PI, 0);
      g.lineTo(cx + 9, 70);
      g.lineTo(cx - 9, 70);
      g.closePath();
      g.fill();
    }
    // Paired columns between and beside the arches.
    for (const cx of [26, 180, 332, 486]) {
      for (const dx of [-9, 9]) {
        g.fillStyle = '#e4ddcf';
        g.fillRect(cx + dx - 5, 80, 10, 192);
        g.fillStyle = 'rgba(110,100,86,0.4)';
        g.fillRect(cx + dx + 3, 80, 2, 192);
        g.fillStyle = '#d0c8b8';
        g.fillRect(cx + dx - 7, 76, 14, 6);
      }
    }
  });
}

/** The transepts' faces either side of the portico: rose windows over rows of arched windows. */
function transeptTexture(): CanvasTexture {
  return canvasTexture(512, 196, (g) => {
    g.fillStyle = '#f6f2e8';
    g.fillRect(0, 0, 512, 196);
    g.fillStyle = '#d8d0c0';
    g.fillRect(0, 18, 512, 6);
    for (const cx of [80, 432]) {
      g.fillStyle = '#5a544a';
      g.beginPath();
      g.arc(cx, 70, 26, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#cfc6b4';
      g.lineWidth = 3;
      for (let a = 0; a < 8; a++) {
        g.beginPath();
        g.moveTo(cx, 70);
        g.lineTo(cx + Math.cos((a * Math.PI) / 4) * 26, 70 + Math.sin((a * Math.PI) / 4) * 26);
        g.stroke();
      }
      for (let k = -2; k <= 2; k++) {
        const x = cx + k * 22;
        g.fillStyle = '#5a544a';
        g.beginPath();
        g.arc(x, 128, 7, Math.PI, 0);
        g.lineTo(x + 7, 160);
        g.lineTo(x - 7, 160);
        g.closePath();
        g.fill();
      }
    }
  });
}
