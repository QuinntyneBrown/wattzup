// Old Town Criterium's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// stuccoed town houses with shuttered windows and tiled roofs on both sides of the road. The
// houses repeat along a loop longer than the road in view, so the street never ends.
import {
  BatchedMesh,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  type Texture,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROAD_END } from './scene-bend';
import { barrierBannerTexture, type BannerPanel, seeded } from './world-kit';

/** Metres from the road's centre to the house fronts. */
export const FRONTAGE = 6.5;
/** One window bay is 3 m wide; an upper storey is 3.2 m and the shop floor 4.2 m. */
const BAY = 3;
const STOREY = 3.2;
const SHOP = 4.2;
const DEPTH = 10;
/** The street repeats every LOOP metres; houses run from BEHIND metres behind the rider. */
const LOOP = 420;
const BEHIND = 24;
const HOUSE_BEHIND = 78;
const HOUSE_SHIFT = HOUSE_BEHIND - BEHIND;
const HOUSE_CULL_BEHIND = -16;
const BLOCK_SLICES = 9;
/** Beyond Old Town's 65 m directional shadow box (plus margin), blocks skip shadow casting. */
const SHADOW_AHEAD = 75;
const CROWD_BUCKET_M = 2;
const CROWD_NEAR_BEHIND = -14;
const CROWD_NEAR_AHEAD = 72;
const CROWD_FAR_AHEAD = ROAD_END + 8;
/** Houses reach below the road, so a ramp never shows their footing. */
const FOOTING = 4;

interface Palette {
  readonly wall: string;
  readonly trim: string;
  readonly shutter: string | null;
  /** Geraniums in a window box under each upper window, in this colour. */
  readonly flowers?: string;
}

const PALETTES: readonly Palette[] = [
  { wall: '#c96f55', trim: '#efe2c9', shutter: '#5a6e4c', flowers: '#f2f0e8' },
  { wall: '#e2b86f', trim: '#f6ecd6', shutter: '#4d6a73', flowers: '#e8607a' },
  { wall: '#efe4cc', trim: '#ffffff', shutter: '#5f7a52', flowers: '#d8283a' },
  { wall: '#de9474', trim: '#f4e6cf', shutter: null },
  { wall: '#ead27f', trim: '#fbf3dc', shutter: '#6b4d36', flowers: '#e0457b' },
  { wall: '#b9c2a0', trim: '#f1efe4', shutter: '#4f5f45', flowers: '#f2d24a' },
  { wall: '#d99d91', trim: '#f7ebe3', shutter: '#53627a', flowers: '#f2f0e8' },
  { wall: '#aebdc8', trim: '#f2f2ee', shutter: null, flowers: '#d8283a' },
];
const AWNINGS = ['#b8322c', '#2f6b4f', '#2d4e7a', '#c9822b', '#6b2f4f', '#2a7d7a', '#d9a62e'];
const SIGNS: readonly { ground: string; emblem: 'cup' | 'key' | 'loaf' | 'wheel' }[] = [
  { ground: '#2f5d4a', emblem: 'cup' },
  { ground: '#7a2b2b', emblem: 'key' },
  { ground: '#2d4e7a', emblem: 'loaf' },
  { ground: '#1f2328', emblem: 'wheel' },
];
const FLAGS: readonly (readonly string[])[] = [
  ['#c9372c', '#f2f0e8'],
  ['#e2b23a', '#2d4e7a'],
  ['#2f5d4a', '#f2f0e8', '#c9372c'],
  ['#1f2328', '#e2b23a'],
];
/** What the fans paint on the road, its colour and how far off the centre line. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['ALLEZ ALLEZ', '#f4f2ea', -0.6],
  ['HUP HUP', '#ffe14a', 0.8],
  ['VAMOS', '#f4f2ea', 0.2],
  ['GO ANA', '#ffe14a', -0.9],
];
/** The race's printed panels along the barriers. */
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1b1e24', ink: '#d7ff3a', text: 'OLD TOWN CRITERIUM' },
  { fill: '#f2efe6', ink: '#b8322c', text: 'CATHEDRAL CIRCUIT' },
  { fill: '#2d4e7a', ink: '#ffffff', text: 'COBBLED SPRINT' },
  { fill: '#b8322c', ink: '#ffffff', text: 'RACE DAY' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#f2efe6', ink: '#1b1e24', text: 'ALLEZ !' },
];
/** The banners across the street: their words, cloth and ink. */
const STREET_BANNERS: readonly (readonly [string, string, string])[] = [
  ['OLD TOWN CRITERIUM', '#1b1e24', '#d7ff3a'],
  ['WELKOM · BIENVENUE', '#b8322c', '#ffffff'],
  ['CATHEDRAL CIRCUIT', '#f2efe6', '#2d4e7a'],
];
/** How wide an alley between two houses is. */
const ALLEY = 3.2;
const BELFRY_AHEAD = 260;
const BELFRY_X = -13;
const MOTO_AHEAD = 30;
const MOTO_X = -2.3;
const FORWARD = new Vector3(0, 0, 1);
const HAIR = ['#2a1d14', '#4a3222', '#7a5434', '#b08a5a', '#1a1a1a', '#9a9a96', '#5a2e1c'];
const HATS = ['#efe6cf', '#1f2b44', '#c9372c', '#f2f0e8', '#d8ff3e'];
const ROOFS = ['#9a4b33', '#7c3d2c', '#a85a3a', '#5a5c63'];

/** A spectator on the pavement. */
interface Fan {
  readonly offset: number;
  readonly x: number;
  readonly height: number;
  /** Which way they face, about the vertical: mostly towards the road. */
  readonly turn: number;
  readonly shirt: string;
  readonly skin: string;
  readonly trousers: string;
  /** Arms raised, cheering the riders on; otherwise at their sides. */
  readonly cheer: boolean;
}

const SHIRTS = [
  '#c9372c',
  '#2f5d8a',
  '#f2f0e8',
  '#e2b23a',
  '#3d7a4a',
  '#7a3f8f',
  '#1f2328',
  '#e07b39',
  // Fans in the race's volt, and in club jerseys.
  '#d7ff3a',
  '#2a9fd6',
  '#e8467c',
];
const SKINS = ['#f1c7a5', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
const TROUSERS = ['#2b2f38', '#3b4a63', '#5a4a3a', '#1c1d20', '#8a8478'];
const UP = new Vector3(0, 1, 0);
/** The cathedral stands this far ahead, just right of the street's line. */
const CATHEDRAL_AHEAD = 500;
const CATHEDRAL_X = 6;
/** Bunting crosses the street every 35 m, 8.5 m up at the houses, sagging in the middle. */
const BUNTING_EVERY = 35;
const BUNTING_LINES = LOOP / BUNTING_EVERY;
const BUNTING_FLAGS = 30;
const BUNTING_HEIGHT = 8.5;
const PENNANTS = ['#d8283a', '#f2f0e8', '#2d4e7a', '#e2b23a', '#3d7a4a'];

interface HouseLook {
  readonly upper: Material;
  /** The ground floor: a shop front per bay, or a home's door and window over two bays. */
  readonly shop: Material;
  readonly groundBay: number;
  /** The tiled slopes and the gables. */
  readonly roof: Material[];
  readonly trim: Material;
  readonly awning: Material | null;
  /** What a shop sells, as its window shows: books, bread, flowers or clothes. */
  readonly trade: number;
  /** Whether the upper windows keep window boxes of flowers. */
  readonly flowers: boolean;
}

interface House {
  readonly mesh: Group;
  readonly side: -1 | 1;
  /** Where the house starts along the loop, in metres. */
  readonly offset: number;
  readonly width: number;
  readonly setback: number;
}

interface BlockSlot {
  readonly near: BatchedMesh;
  readonly nearId: number;
  readonly far: BatchedMesh | null;
  readonly farId: number;
}

interface StreetBlock {
  readonly offset: number;
  readonly width: number;
  readonly slots: BlockSlot[];
}

interface UvRect {
  readonly u0: number;
  readonly u1: number;
  readonly v0: number;
  readonly v1: number;
}

/** A point of the road: metres ahead of the rider and the height there. */
export interface StreetPoint {
  readonly metres: number;
  readonly height: number;
}

/** The kerb is 15 cm high and its granite top 25 cm wide; the pavement runs to the houses. */
const KERB = 0.15;
const KERB_TOP = 0.25;

export class OldTownStreet {
  readonly group = new Group();
  private readonly blocks: StreetBlock[] = [];
  private readonly blockMatrix = new Matrix4();
  private readonly tempGeometries: BufferGeometry[] = [];
  private readonly ribbons: {
    geometry: BufferGeometry;
    strips: { profile: [number, number][]; across: Float32Array; vSign: -1 | 1 }[];
  }[] = [];
  /** Each house draws its details from its own sequence, so one new detail moves no other. */
  private random = seeded(29);
  private houseIndex = 0;

  /** A draw in [0, 1) of its own for this house and `feature`, independent of every other. */
  private chance(feature: number): number {
    return seeded(7919 * (this.houseIndex + 1) + 104729 * feature)();
  }
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly frontUnit = openBackBox();
  private readonly brick = new MeshStandardMaterial({ color: 0x8e4a37, roughness: 0.95 });
  /** Props along the street; one that `lies` on the road, as paint does, takes its slope. */
  private readonly props: {
    mesh: Mesh;
    offset: number;
    every: number;
    x: number;
    lies?: boolean;
    shadowNear?: boolean;
  }[] = [];
  private readonly crowd: Fan[] = [];
  /** Near shadow-casting, far non-shadow-casting, and compact accessory spectator InstancedMeshes. */
  private nearFans: InstancedMesh[] = [];
  private farFans: InstancedMesh[] = [];
  private accessoryFans: InstancedMesh[] = [];
  private lastCrowdBucket = Number.NaN;
  private fanOffsets = new Float32Array(0);
  private fanWorldY = new Float32Array(0);
  private fanWorldZ = new Float32Array(0);
  private legsBaseY = new Float32Array(0);
  private torsoBaseY = new Float32Array(0);
  private headBaseY = new Float32Array(0);
  private armBaseY = new Float32Array(0);
  private armBaseZ = new Float32Array(0);
  private legsTpl = new Float32Array(0);
  private torsoTpl = new Float32Array(0);
  private headTpl = new Float32Array(0);
  private armTpl = new Float32Array(0);
  private legsCol = new Float32Array(0);
  private torsoCol = new Float32Array(0);
  private headCol = new Float32Array(0);
  private armCol = new Float32Array(0);
  private fanHatSlot = new Int16Array(0);
  private hatTpl = new Float32Array(0);
  private hatCol = new Float32Array(0);
  private hatBaseY = new Float32Array(0);
  private fanWavedSlot = new Int16Array(0);
  private wavedTpl = new Float32Array(0);
  private wavedCol = new Float32Array(0);
  private wavedBaseY = new Float32Array(0);
  private wavedBaseZ = new Float32Array(0);
  private fanHairSlot = new Int16Array(0);
  private hairTpl = new Float32Array(0);
  private hairCol = new Float32Array(0);
  private hairBaseY = new Float32Array(0);
  private activeNearIdx = new Uint16Array(0);
  private activeNearCount = 0;
  private activeFarIdx = new Uint16Array(0);
  private activeFarCount = 0;
  private activeHatFan = new Uint16Array(0);
  private activeHatSlot = new Uint16Array(0);
  private activeHatCount = 0;
  private activeWavedFan = new Uint16Array(0);
  private activeWavedSlot = new Uint16Array(0);
  private activeWavedCount = 0;
  private activeHairFan = new Uint16Array(0);
  private activeHairSlot = new Uint16Array(0);
  private activeHairCount = 0;
  private readonly cloth = new MeshStandardMaterial({ roughness: 0.85, side: DoubleSide });
  private readonly reach = new Vector3();
  private readonly shoulder = new Vector3();
  private readonly lean = new Quaternion();
  private readonly armTurn = new Quaternion();
  private flags: InstancedMesh | null = null;
  private cords: InstancedMesh | null = null;
  private readonly buntingSagY = new Float32Array(BUNTING_FLAGS);
  private lampMeshes: InstancedMesh[] = [];
  private lampArrays: Float32Array[] = [];
  private lampOffsetMetres = new Float32Array(0);
  private lampPen0: InstancedMesh | null = null;
  private lampPen1: InstancedMesh | null = null;
  private swiftsMesh: InstancedMesh | null = null;
  private coversMesh: InstancedMesh | null = null;
  private readonly coverSpots: readonly (readonly [number, number])[] = [
    [33, 1.4],
    [150, -1.1],
    [290, 0.6],
  ];
  private ropesMesh: InstancedMesh | null = null;
  private readonly bannerOffsets: number[] = [];
  private readonly cathedral = new Group();
  /** The television motorbike, riding ahead of the rider with its camera turned on them. */
  private readonly moto = new Group();
  /** A parish church's brick belfry over the roofs to the left, short of the cathedral. */
  private readonly belfry = new Group();
  private readonly iron = new MeshStandardMaterial({
    color: 0x1e2023,
    metalness: 0.5,
    roughness: 0.5,
  });
  private readonly signBoard = new PlaneGeometry(0.7, 0.55);
  private readonly zinc = new MeshStandardMaterial({
    color: 0x8a9096,
    metalness: 0.5,
    roughness: 0.45,
  });
  private readonly clockFace = new CylinderGeometry(4, 4, 0.5, 28);
  private readonly doorLeaf = new PlaneGeometry(1.1, 2.5);
  private readonly fasciaBoard = new PlaneGeometry(5.2, 0.42);
  private readonly fascias = ['BOEKEN', 'BAKKERIJ', 'BLOEMEN', 'MODE'].map(
    () => new MeshBasicMaterial(),
  );
  private readonly geraniums = new MeshBasicMaterial();
  /** Glazed shop doors in painted wood, a brass handle and a bell over each. */
  private readonly shopDoors = ['#2d4e3f', '#5a2730', '#1f2b44', '#3a3a3a'].map(
    () => new MeshBasicMaterial(),
  );
  private readonly stone = new MeshStandardMaterial({ color: 0xbdb5a6, roughness: 0.95 });
  private readonly alleyFloor = new MeshStandardMaterial({ color: 0x8a837a, roughness: 0.95 });
  /** Half a disc, its flat edge up: one scallop of an awning's hem. */
  private readonly scallop = new CircleGeometry(0.15, 6, Math.PI, Math.PI);
  private readonly finial = new SphereGeometry(0.16, 6, 4);
  private readonly chimneyPot = new CylinderGeometry(0.1, 0.13, 0.4, 6);
  private readonly oculus = new CylinderGeometry(0.4, 0.4, 0.04, 12);
  private readonly pot = new CylinderGeometry(0.24, 0.18, 0.5, 7);
  private readonly bush = new SphereGeometry(0.42, 7, 5);
  private readonly terracotta = new MeshStandardMaterial({ color: 0xb4603f, roughness: 0.9 });
  /** Clipped bay: a dense mass of small leaves, resolved into `houseDetailAtlas`. */
  private readonly leaves = new MeshBasicMaterial();
  private readonly flagCloth = new PlaneGeometry(2.0, 1.35, 6, 1);
  /** Civic flags in two or three bands, read from either side. */
  private readonly houseFlags = FLAGS.map(() => new MeshBasicMaterial());
  private readonly dormer = tiledBox(1.6, 1.6, 1.5, 1.6, 0.25);
  private readonly dormerRoof = prism(1.9, 0.8, 1.8);
  /** The shop signs: a gilt emblem on a painted board, read from either side. */
  private readonly signs = SIGNS.map(() => new MeshBasicMaterial());
  /** Wrought iron: balusters and a scroll, cut out of the canvas. */
  private readonly railing = new MeshStandardMaterial({
    map: railingTexture(),
    alphaTest: 0.5,
    side: DoubleSide,
    color: 0x1e2023,
    metalness: 0.5,
    roughness: 0.5,
  });
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly size = new Vector3();

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {}

  build(roadHalf: number, points: number): void {
    this.disposables.push(
      this.unit,
      this.frontUnit,
      this.brick,
      this.cloth,
      this.railing,
      this.iron,
      this.signBoard,
      this.clockFace,
      this.doorLeaf,
      this.fasciaBoard,
      this.scallop,
      this.finial,
      this.chimneyPot,
      this.dormer,
      this.dormerRoof,
      this.flagCloth,
      this.oculus,
      this.pot,
      this.bush,
      this.terracotta,
      this.stone,
      this.alleyFloor,
      this.leaves,
      this.zinc,
      this.geraniums,
      ...this.fascias,
      ...this.shopDoors,
      ...this.houseFlags,
      ...this.signs,
    );
    if (this.railing.map) this.track(this.railing.map);
    const detailAtlas = houseDetailAtlas();
    const detailMat = new MeshStandardMaterial({
      map: this.track(detailAtlas.texture),
      roughness: 0.72,
      side: DoubleSide,
    });
    this.disposables.push(detailMat);
    this.addFurniture(roadHalf, detailAtlas, detailMat);
    this.addRoadPaint();
    this.addStreetBanners();
    this.addCrowd(roadHalf);
    this.addBunting();
    this.addCathedral();
    this.addMoto();
    this.addBelfry();
    this.addSwifts();
    const kerb = this.material(this.track(kerbTexture()));
    const pavement = this.material(this.track(slabTexture()));
    // The left barriers are seen from the other face: their print runs the other way (`vSign`).
    const bannerTexture = this.track(barrierBannerTexture(BARRIER_PANELS));
    bannerTexture.repeat.set(-1, 1 / 24);
    const banner = this.material(bannerTexture);
    banner.alphaTest = 0.5;
    // Printed vinyl: a soft sheen that catches the low sun along the barriers.
    banner.roughness = 0.5;
    banner.metalness = 0.05;
    const damp = new MeshStandardMaterial({
      color: 0x2a2622,
      roughness: 0.2,
      metalness: 0.1,
      // The ribbons on the two sides wind opposite ways: both faces must draw.
      side: DoubleSide,
      alphaMap: this.track(dampTexture()),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.disposables.push(damp);
    const foot = new MeshBasicMaterial({
      color: 0x1a1612,
      alphaMap: this.track(cornerTexture()),
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.disposables.push(foot);
    const rail = this.material(null, '#b9bdc2');
    rail.metalness = 0.7;
    rail.roughness = 0.35;
    const bothSides = (
      profileFor: (x: (v: number) => number) => [number, number][],
      flipV = false,
    ): { profile: [number, number][]; vSign: -1 | 1 }[] =>
      ([-1, 1] as const).map((side) => ({
        profile: profileFor((v) => side * v),
        vSign: flipV ? (-side as -1 | 1) : 1,
      }));
    this.ribbon(
      points,
      kerb,
      bothSides((x) => [
        [x(roadHalf), 0],
        [x(roadHalf), KERB],
        [x(roadHalf + KERB_TOP), KERB],
      ]),
    );
    this.ribbon(
      points,
      pavement,
      bothSides((x) => [
        [x(roadHalf + KERB_TOP), KERB],
        [x(FRONTAGE + 0.5), KERB],
      ]),
    );
    // A damp line along the gutter, darker and glossier than the dry setts beside it.
    this.ribbon(
      points,
      damp,
      bothSides((x) => [
        [x(roadHalf - 0.4), 0.004],
        [x(roadHalf), 0.004],
      ]),
    );
    // Shade where the pavement meets the houses, as ambient light fails into the corner.
    this.ribbon(
      points,
      foot,
      bothSides((x) => [
        [x(FRONTAGE - 0.9), KERB + 0.004],
        [x(FRONTAGE + 0.5), KERB + 0.004],
      ]),
    );
    // Race-day crowd barriers along the kerb, hung with the race's banners.
    this.ribbon(
      points,
      banner,
      bothSides(
        (x) => [
          [x(roadHalf + 0.4), KERB + 0.08],
          [x(roadHalf + 0.4), KERB + 1.0],
        ],
        true,
      ),
    );
    this.ribbon(
      points,
      rail,
      bothSides((x) => [
        [x(roadHalf + 0.4), KERB + 1.0],
        [x(roadHalf + 0.44), KERB + 1.06],
        [x(roadHalf + 0.36), KERB + 1.06],
        [x(roadHalf + 0.4), KERB + 1.0],
      ]),
    );
    const upper = PALETTES.map(() => new MeshBasicMaterial());
    const shut = PALETTES.map((p, i) => (p.shutter ? new MeshBasicMaterial() : upper[i]!));
    const shop = PALETTES.map(() => new MeshBasicMaterial());
    const roofs = ROOFS.map(() => new MeshBasicMaterial());
    const gables = PALETTES.map(() => new MeshBasicMaterial());
    const trims = PALETTES.map(() => new MeshBasicMaterial());
    const homes = PALETTES.map(() => new MeshBasicMaterial());
    const awnings = AWNINGS.map(() => new MeshBasicMaterial());
    const tempMarkers: Material[] = [
      ...new Set([...upper, ...shut, ...shop, ...homes, ...roofs, ...gables, ...trims, ...awnings]),
    ];
    const sideHouses: [House[], House[]] = [[], []];
    const layout = seeded(3);
    // Alleys draw from a sequence of their own, so the houses keep their looks.
    const alleys = seeded(71);
    let built = 0;
    for (const side of [-1, 1] as const) {
      const list = sideHouses[side === -1 ? 0 : 1];
      let offset = side === 1 ? 5 : 0;
      let near = false;
      let last = -1;
      while (offset < LOOP) {
        // The layout draws from its own sequence, so a new detail never reshuffles the street.
        const bays = 2 + Math.floor(layout() * 4);
        const width = Math.min(bays * BAY, LOOP - offset);
        if (width < BAY) break;
        const storeys = 2 + Math.floor(layout() * 3);
        // Next-door houses are never painted alike.
        let style = Math.floor(layout() * (PALETTES.length - 1));
        if (style >= last) style++;
        last = style;
        const roof = roofs[Math.floor(layout() * roofs.length)]!;
        this.houseIndex = built++;
        this.random = seeded(7919 * this.houseIndex + 7921);
        const mesh = this.house(width, storeys, {
          upper: (this.chance(1) < 0.3 ? shut : upper)[style]!,
          ...(this.random() < 0.5
            ? {
                shop: shop[style]!,
                groundBay: BAY,
                awning:
                  this.random() < 0.65
                    ? awnings[Math.floor(this.random() * awnings.length)]!
                    : null,
              }
            : { shop: homes[style]!, groundBay: 2 * BAY, awning: null }),
          roof: [roof, gables[style]!],
          trim: trims[style]!,
          trade: style % 4,
          flowers: !!PALETTES[style]!.flowers,
        });
        // Old frontages never quite line up: each house stands up to 45 cm back.
        list.push({ mesh, side, offset, width, setback: this.chance(8) * 0.45 });
        offset += width;
        // Now and then an alley runs off between two houses; one opens in view of the start.
        const roll = alleys();
        const opening: boolean = !near && offset > 40 && offset < 75;
        if (opening || (roll < 0.14 && offset + ALLEY < LOOP && offset > 8)) {
          const alley = this.alley(gables[style]!);
          list.push({ mesh: alley, side, offset, width: ALLEY, setback: 0 });
          offset += ALLEY;
          if (opening) near = true;
        }
      }
    }
    this.batchStreet(
      sideHouses,
      { upper, shut, shop, homes, roofs, gables, trims, awnings },
      detailAtlas,
      detailMat,
    );
    for (const g of this.tempGeometries) g.dispose();
    this.tempGeometries.length = 0;
    for (const m of tempMarkers) m.dispose();
  }

  /**
   * Lays the kerbs, pavements and barriers over the road's points, behind the rider and ahead.
   * Their textures are fixed to the street, `s` metres along it, so the rider rides past them.
   */
  lay(points: readonly StreetPoint[], s: number): void {
    const count = points.length;
    for (const { geometry, strips } of this.ribbons) {
      const position = geometry.getAttribute('position') as BufferAttribute;
      const uv = geometry.getAttribute('uv') as BufferAttribute;
      const posArr = position.array as Float32Array;
      const uvArr = uv.array as Float32Array;
      let base = 0;
      for (const { profile, across, vSign } of strips) {
        const n = profile.length;
        for (let i = 0; i < count; i++) {
          const p = points[i]!;
          const z = -p.metres;
          const v = vSign * (p.metres + s);
          const row = base + i * n;
          for (let j = 0; j < n; j++) {
            const pt = profile[j]!;
            const vIdx = row + j;
            const pOff = vIdx * 3;
            posArr[pOff] = pt[0];
            posArr[pOff + 1] = p.height + pt[1];
            posArr[pOff + 2] = z;
            const uOff = vIdx * 2;
            uvArr[uOff] = across[j]!;
            uvArr[uOff + 1] = v;
          }
        }
        base += count * n;
      }
      position.needsUpdate = true;
      uv.needsUpdate = true;
    }
  }

  /** Strips along the road sharing `material`, with cross-section normals ready at build time. */
  private ribbon(
    points: number,
    material: Material,
    defs: { profile: [number, number][]; vSign: -1 | 1 }[],
  ): void {
    const totalVertices = defs.reduce((sum, d) => sum + points * d.profile.length, 0);
    const posArr = new Float32Array(totalVertices * 3);
    const normArr = new Float32Array(totalVertices * 3);
    const uvArr = new Float32Array(totalVertices * 2);
    const index: number[] = [];
    const strips: { profile: [number, number][]; across: Float32Array; vSign: -1 | 1 }[] = [];
    let base = 0;
    for (const { profile, vSign } of defs) {
      const n = profile.length;
      const across = new Float32Array(n);
      const nx = new Float32Array(n);
      const ny = new Float32Array(n);
      for (let j = 0; j < n - 1; j++) {
        const dx = profile[j + 1]![0] - profile[j]![0];
        const dy = profile[j + 1]![1] - profile[j]![1];
        across[j + 1] = across[j]! + Math.hypot(dx, dy);
        nx[j] = nx[j]! + dy;
        ny[j] = ny[j]! - dx;
        nx[j + 1] = nx[j + 1]! + dy;
        ny[j + 1] = ny[j + 1]! - dx;
      }
      for (let j = 0; j < n; j++) {
        const len = Math.hypot(nx[j]!, ny[j]!) || 1;
        nx[j] = nx[j]! / len;
        ny[j] = ny[j]! / len;
      }
      for (let i = 0; i < points; i++) {
        const row = base + i * n;
        for (let j = 0; j < n; j++) {
          const nOff = (row + j) * 3;
          normArr[nOff] = nx[j]!;
          normArr[nOff + 1] = ny[j]!;
          normArr[nOff + 2] = 0;
        }
      }
      for (let i = 0; i < points - 1; i++) {
        for (let j = 0; j < n - 1; j++) {
          const a = base + i * n + j;
          index.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
        }
      }
      strips.push({ profile, across, vSign });
      base += points * n;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(posArr, 3));
    geometry.setAttribute('normal', new BufferAttribute(normArr, 3));
    geometry.setAttribute('uv', new BufferAttribute(uvArr, 2));
    geometry.setIndex(index);
    const mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    this.group.add(mesh);
    this.ribbons.push({ geometry, strips });
    this.disposables.push(geometry);
  }

  /** Moves the houses with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, road: (metres: number) => number): void {
    // The street runs on past the end of the laid road: there it climbs on at the road's last
    // grade, so the far houses on a ramp keep stepping up instead of standing level.
    const end = road(ROAD_END);
    const slope = (end - road(ROAD_END - 2)) / 2;
    const heightAt = (metres: number) =>
      metres <= ROAD_END ? road(metres) : end + slope * (metres - ROAD_END);
    const m = this.blockMatrix.elements;
    for (const block of this.blocks) {
      const start = ((((block.offset + HOUSE_SHIFT - s) % LOOP) + LOOP) % LOOP) - HOUSE_BEHIND;
      const visible = start + block.width > HOUSE_CULL_BEHIND;
      const inShadow = visible && start < SHADOW_AHEAD;
      const outShadow = visible && !inShadow;
      if (visible) {
        const middle = start + block.width / 2;
        const grade = (heightAt(middle + 2) - heightAt(middle - 2)) / 4;
        m[9] = -grade;
        m[13] = heightAt(middle);
        m[14] = -middle;
      }
      for (const { near, nearId, far, farId } of block.slots) {
        if (far) {
          if (near.getVisibleAt(nearId) !== inShadow) near.setVisibleAt(nearId, inShadow);
          if (inShadow) near.setMatrixAt(nearId, this.blockMatrix);
          if (far.getVisibleAt(farId) !== outShadow) far.setVisibleAt(farId, outShadow);
          if (outShadow) far.setMatrixAt(farId, this.blockMatrix);
        } else {
          if (near.getVisibleAt(nearId) !== visible) near.setVisibleAt(nearId, visible);
          if (visible) near.setMatrixAt(nearId, this.blockMatrix);
        }
      }
    }
    for (const prop of this.props) {
      const metres = ((((prop.offset - s) % prop.every) + prop.every) % prop.every) - BEHIND;
      const visible = metres > HOUSE_CULL_BEHIND && metres <= ROAD_END + 12;
      prop.mesh.visible = visible;
      prop.mesh.position.z = -metres;
      if (!visible) continue;
      prop.mesh.position.x = prop.x;
      prop.mesh.position.y = heightAt(metres) + KERB;
      if (prop.shadowNear) {
        prop.mesh.castShadow = metres < SHADOW_AHEAD;
      }
      // Paint and iron set in the setts lie along a ramp, not level through it, where half the
      // writing would sink into the road and half float over it.
      if (prop.lies) {
        prop.mesh.rotation.x = Math.atan((heightAt(metres + 1) - heightAt(metres - 1)) / 2);
      }
    }
    this.placeLamps(s, heightAt);
    this.placeExtras(s, heightAt);
    this.placeCrowd(s, heightAt);
    this.placeBunting(s, heightAt);
    this.cathedral.position.set(CATHEDRAL_X, end - 2, -CATHEDRAL_AHEAD);
    this.moto.position.set(MOTO_X, heightAt(MOTO_AHEAD), -MOTO_AHEAD);
    // The moto rides on the ramp, not level through it: nose up as the street climbs.
    this.moto.rotation.x = Math.atan((heightAt(MOTO_AHEAD + 1) - heightAt(MOTO_AHEAD - 1)) / 2);
    this.belfry.position.set(BELFRY_X, end - 2, -BELFRY_AHEAD);
    // The swifts wheel over the roofs, a turn for every 60 m ridden.
    if (this.swiftsMesh) {
      const skyY = heightAt(80) + 24;
      this.size.set(1, 1, 1);
      for (let i = 0; i < 12; i++) {
        const a = s / 60 + i * 2.4;
        const r = 6 + (i % 4) * 3;
        this.spot.set(Math.cos(a) * r, skyY + (i % 5) * 2.5, -70 - (i % 3) * 25 + Math.sin(a) * r);
        this.turn.setFromAxisAngle(UP, -a);
        this.swiftsMesh.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      }
      this.swiftsMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private placeLamps(s: number, heightAt: (metres: number) => number): void {
    const arrays = this.lampArrays;
    if (!arrays.length) return;
    const offsets = this.lampOffsetMetres;
    let p0 = 0;
    let p1 = 0;
    const pen0Arr = this.lampPen0?.instanceMatrix.array as Float32Array | undefined;
    const pen1Arr = this.lampPen1?.instanceMatrix.array as Float32Array | undefined;
    for (let i = 0; i < offsets.length; i++) {
      const metres = ((((offsets[i]! - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      const y = heightAt(metres) + KERB;
      const z = -metres;
      const off = i * 16;
      for (const arr of arrays) {
        arr[off + 13] = y;
        arr[off + 14] = z;
      }
      if (i % 2 === 0 && pen0Arr) {
        const pOff = p0++ * 16;
        pen0Arr[pOff + 13] = y;
        pen0Arr[pOff + 14] = z;
      } else if (pen1Arr) {
        const pOff = p1++ * 16;
        pen1Arr[pOff + 13] = y;
        pen1Arr[pOff + 14] = z;
      }
    }
    for (const mesh of this.lampMeshes) mesh.instanceMatrix.needsUpdate = true;
    if (this.lampPen0) this.lampPen0.instanceMatrix.needsUpdate = true;
    if (this.lampPen1) this.lampPen1.instanceMatrix.needsUpdate = true;
  }

  private placeExtras(s: number, heightAt: (metres: number) => number): void {
    if (this.ropesMesh) {
      const arr = this.ropesMesh.instanceMatrix.array as Float32Array;
      for (let i = 0; i < this.bannerOffsets.length; i++) {
        const metres = ((((this.bannerOffsets[i]! - s) % LOOP) + LOOP) % LOOP) - BEHIND;
        const off = i * 16;
        arr[off + 13] = heightAt(metres) + KERB;
        arr[off + 14] = -metres;
      }
      this.ropesMesh.instanceMatrix.needsUpdate = true;
    }
    if (this.coversMesh) {
      const xAxis = this.reach.set(1, 0, 0);
      this.size.set(1, 1, 1);
      for (let i = 0; i < this.coverSpots.length; i++) {
        const [offset, x] = this.coverSpots[i]!;
        const metres = ((((offset - s) % LOOP) + LOOP) % LOOP) - BEHIND;
        const pitch = Math.atan((heightAt(metres + 1) - heightAt(metres - 1)) / 2);
        this.turn.setFromAxisAngle(xAxis, pitch);
        this.spot.set(x, heightAt(metres) + KERB, -metres);
        this.coversMesh.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      }
      this.coversMesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * The cathedral at the end of the street: a west tower with its open spire between two
   * pinnacled towers, a rose window and the long nave behind. It stands a fixed distance
   * ahead, like the skyline, and is hazed by hand: the street's fog would hide it.
   */
  private addCathedral(): void {
    const haze = new Color(0xdcd8cf);
    const tempMaterials: MeshStandardMaterial[] = [];
    const stone = (hex: number, amount: number, map: Texture | null = null) => {
      const material = new MeshStandardMaterial({ roughness: 0.95, fog: false, map });
      material.color.set(hex).lerp(haze, amount);
      if (map) this.disposables.push(material);
      else tempMaterials.push(material);
      return material;
    };
    const gothicAtlas = gothicAtlasTexture();
    const gothic = stone(0xd6c197, 0.25, this.track(gothicAtlas.texture));
    const traceryUnit = remapUv(this.unit.clone(), gothicAtlas.lancets);
    this.disposables.push(traceryUnit);
    const wall = stone(0xd6c197, 0.25);
    const shade = stone(0x9c8a6c, 0.3);
    const roof = stone(0x55606a, 0.45);
    const glass = stone(0x3b3f4a, 0.45);
    const c = this.cathedral;
    const box = (
      m: Material,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      geo: BufferGeometry = this.unit,
    ) => {
      const mesh = new Mesh(geo, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      c.add(mesh);
      return mesh;
    };
    const cone = (m: Material, r: number, h: number, x: number, y: number, z: number, n = 8) => {
      const geometry = new ConeGeometry(r, h, n);
      this.disposables.push(geometry);
      const mesh = new Mesh(geometry, m);
      mesh.position.set(x, y + h / 2, z);
      c.add(mesh);
      return mesh;
    };
    // The nave and its steep roof, running away from the street.
    box(wall, 30, 34, 110, 0, 0, -70);
    const naveRoof = prism(30, 18, 110);
    this.disposables.push(naveRoof);
    const roofMesh = new Mesh(naveRoof, [roof, wall]);
    roofMesh.position.set(0, 34, -70);
    c.add(roofMesh);
    // The west tower, its belfry stages narrowing, and the spire.
    box(gothic, 24, 60, 22, 0, 0, 0, traceryUnit);
    box(gothic, 20, 22, 19, 0, 60, 0, traceryUnit);
    box(gothic, 16, 14, 15, 0, 82, 0, traceryUnit);
    const spireGeo = remapUv(new ConeGeometry(11, 62, 8), gothicAtlas.openwork);
    this.disposables.push(spireGeo);
    const spireMesh = new Mesh(spireGeo, gothic);
    spireMesh.position.set(0, 96 + 31, 0);
    c.add(spireMesh);
    for (const [x, z] of [
      [-8, -7],
      [8, -7],
      [-8, 7],
      [8, 7],
    ] as const) {
      cone(shade, 1.3, 14, x, 82, z, 6);
      cone(shade, 1.6, 10, x * 1.25, 60, z * 1.25, 6);
    }
    // The two lower towers either side, each with a pinnacle.
    for (const x of [-20, 20]) {
      box(gothic, 14, 46, 16, x, 0, -4, traceryUnit);
      cone(shade, 6, 22, x, 46, -4);
    }
    // The portal and the rose window, facing the street.
    box(glass, 7, 14, 1, 0, 0, 11.2);
    const rose = new CylinderGeometry(5, 5, 1, 24);
    this.disposables.push(rose);
    const window = new Mesh(rose, glass);
    window.rotation.x = Math.PI / 2;
    window.position.set(0, 34, 11.2);
    c.add(window);
    for (let i = 0; i < 5; i++) box(glass, 1.4, 9, 1, -20 + (i % 2 ? 40 : 0), 20, 4.2);
    // A pointed gable over the portal, and pinnacles along the nave's walls.
    const gable = box(shade, 7, 7, 1.4, 0, 12, 11.4);
    gable.rotation.z = Math.PI / 4;
    gable.position.y = 14.5;
    for (let z = -20; z > -125; z -= 12) {
      for (const x of [-15.5, 15.5]) cone(shade, 1.1, 9, x, 34, z, 6);
    }
    // A clock on the tower's face, and a gilded cross on the spire.
    const gilt = stone(0xd9a640, 0.1);
    const face = new Mesh(this.clockFace, stone(0xf2ede0, 0.3));
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 71, 9.6);
    c.add(face);
    box(gilt, 0.5, 5.5, 0.5, 0, 157.5, 0);
    box(gilt, 3, 0.5, 0.5, 0, 161, 0);
    for (const [w, h, angle] of [
      [0.35, 3.6, 0.3],
      [0.35, 2.6, -1.9],
    ] as const) {
      const hand = box(gilt, w, h, 0.3, 0, 71, 10.2);
      hand.geometry = this.unit;
      hand.position.set(Math.sin(-angle) * (h / 2), 71 + Math.cos(angle) * (h / 2), 10.2);
      hand.rotation.z = angle;
    }
    this.flatten(c, false);
    for (const tm of tempMaterials) tm.dispose();
    this.group.add(c);
  }

  /** Strings of pennants across the street, moved with it. */
  private placeBunting(s: number, heightAt: (metres: number) => number): void {
    const flags = this.flags;
    if (!flags) return;
    const flagsArr = flags.instanceMatrix.array as Float32Array;
    const cordsArr = this.cords?.instanceMatrix.array as Float32Array | undefined;
    let i = 0;
    for (let line = 0; line < BUNTING_LINES; line++) {
      const metres = ((((line * BUNTING_EVERY + 14 - s) % LOOP) + LOOP) % LOOP) - BEHIND;
      const y = heightAt(metres);
      const z = -metres;
      for (let k = 0; k < BUNTING_FLAGS; k++) {
        const py = y + this.buntingSagY[k]!;
        const off = i++ * 16;
        flagsArr[off + 13] = py;
        flagsArr[off + 14] = z;
        if (cordsArr) {
          cordsArr[off + 13] = py;
          cordsArr[off + 14] = z;
        }
      }
    }
    flags.instanceMatrix.needsUpdate = true;
    if (this.cords) this.cords.instanceMatrix.needsUpdate = true;
  }

  /** Pennants in the race's colours, hanging point down from a line between the houses. */
  private addBunting(): void {
    const pennant = new BufferGeometry();
    pennant.setAttribute(
      'position',
      new BufferAttribute(new Float32Array([-0.2, 0, 0, 0.2, 0, 0, 0, -0.42, 0]), 3),
    );
    pennant.setAttribute(
      'normal',
      new BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), 3),
    );
    pennant.setAttribute('uv', new BufferAttribute(new Float32Array([0, 1, 1, 1, 0.5, 0]), 2));
    const total = BUNTING_LINES * BUNTING_FLAGS;
    this.flags = new InstancedMesh(pennant, this.cloth, total);
    const colour = new Color();
    for (let i = 0; i < total; i++) {
      this.flags.setColorAt(i, colour.set(PENNANTS[i % PENNANTS.length]!));
    }
    this.flags.castShadow = true;
    this.flags.frustumCulled = false;
    this.group.add(this.flags);
    // The cord the pennants hang from, a length per pennant.
    const length = new BoxGeometry((2 * FRONTAGE) / BUNTING_FLAGS + 0.04, 0.015, 0.015);
    this.cords = new InstancedMesh(length, this.iron, total);
    this.cords.frustumCulled = false;
    this.group.add(this.cords);
    this.disposables.push(pennant, length, this.flags, this.cords);
    this.size.set(1, 1, 1);
    for (let k = 0; k < BUNTING_FLAGS; k++) {
      const x = -FRONTAGE + ((k + 0.5) / BUNTING_FLAGS) * 2 * FRONTAGE;
      this.buntingSagY[k] = BUNTING_HEIGHT - 1.6 * (1 - (x / FRONTAGE) ** 2);
      this.turn.setFromAxisAngle(FORWARD, Math.atan((3.2 * x) / FRONTAGE ** 2));
      this.matrix.compose(this.spot.set(x, this.buntingSagY[k]!, 0), this.turn, this.size);
      for (let line = 0; line < BUNTING_LINES; line++) {
        const idx = line * BUNTING_FLAGS + k;
        this.flags.setMatrixAt(idx, this.matrix);
        this.cords.setMatrixAt(idx, this.matrix);
      }
    }
  }

  /** Rebuilds near/far/accessory crowd slots only when crossing a 2 m longitudinal bucket. */
  private rebuildCrowdBucket(bucket: number): void {
    this.lastCrowdBucket = bucket;
    const [nLegs, nTorsos, nHeads, nArms] = this.nearFans;
    const [fLegs, fTorsos, fHeads, fArms] = this.farFans;
    const [hats, waved, hair] = this.accessoryFans;
    if (
      !nLegs ||
      !nTorsos ||
      !nHeads ||
      !nArms ||
      !fLegs ||
      !fTorsos ||
      !fHeads ||
      !fArms ||
      !hats ||
      !waved ||
      !hair
    ) {
      return;
    }
    const s0 = bucket * CROWD_BUCKET_M;
    const offsets = this.fanOffsets;
    const n = offsets.length;
    const nLegsMat = nLegs.instanceMatrix.array as Float32Array;
    const nTorsoMat = nTorsos.instanceMatrix.array as Float32Array;
    const nHeadMat = nHeads.instanceMatrix.array as Float32Array;
    const nArmMat = nArms.instanceMatrix.array as Float32Array;
    const nLegsCol = nLegs.instanceColor!.array as Float32Array;
    const nTorsoCol = nTorsos.instanceColor!.array as Float32Array;
    const nHeadCol = nHeads.instanceColor!.array as Float32Array;
    const nArmCol = nArms.instanceColor!.array as Float32Array;

    const fLegsMat = fLegs.instanceMatrix.array as Float32Array;
    const fTorsoMat = fTorsos.instanceMatrix.array as Float32Array;
    const fHeadMat = fHeads.instanceMatrix.array as Float32Array;
    const fArmMat = fArms.instanceMatrix.array as Float32Array;
    const fLegsCol = fLegs.instanceColor!.array as Float32Array;
    const fTorsoCol = fTorsos.instanceColor!.array as Float32Array;
    const fHeadCol = fHeads.instanceColor!.array as Float32Array;
    const fArmCol = fArms.instanceColor!.array as Float32Array;

    const hatMat = hats.instanceMatrix.array as Float32Array;
    const wavedMat = waved.instanceMatrix.array as Float32Array;
    const hairMat = hair.instanceMatrix.array as Float32Array;
    const hatCol = hats.instanceColor!.array as Float32Array;
    const wavedCol = waved.instanceColor!.array as Float32Array;
    const hairCol = hair.instanceColor!.array as Float32Array;

    let nearCount = 0;
    let farCount = 0;
    let hatCount = 0;
    let wavedCount = 0;
    let hairCount = 0;

    for (let i = 0; i < n; i++) {
      const m0 = ((((offsets[i]! - s0) % LOOP) + LOOP) % LOOP) - BEHIND;
      if (m0 <= CROWD_NEAR_BEHIND || m0 > CROWD_FAR_AHEAD) continue;
      const srcOff = i * 16;
      const srcCol = i * 3;
      const a0 = 2 * i;
      const a1 = a0 + 1;
      if (m0 < CROWD_NEAR_AHEAD) {
        const k = nearCount++;
        this.activeNearIdx[k] = i;
        const dstOff = k * 16;
        const dstCol = k * 3;
        copyMat16(nLegsMat, dstOff, this.legsTpl, srcOff);
        copyMat16(nTorsoMat, dstOff, this.torsoTpl, srcOff);
        copyMat16(nHeadMat, dstOff, this.headTpl, srcOff);
        copyCol3(nLegsCol, dstCol, this.legsCol, srcCol);
        copyCol3(nTorsoCol, dstCol, this.torsoCol, srcCol);
        copyCol3(nHeadCol, dstCol, this.headCol, srcCol);
        copyMat16(nArmMat, 2 * k * 16, this.armTpl, a0 * 16);
        copyMat16(nArmMat, (2 * k + 1) * 16, this.armTpl, a1 * 16);
        copyCol3(nArmCol, 2 * k * 3, this.armCol, a0 * 3);
        copyCol3(nArmCol, (2 * k + 1) * 3, this.armCol, a1 * 3);
      } else {
        const k = farCount++;
        this.activeFarIdx[k] = i;
        const dstOff = k * 16;
        const dstCol = k * 3;
        copyMat16(fLegsMat, dstOff, this.legsTpl, srcOff);
        copyMat16(fTorsoMat, dstOff, this.torsoTpl, srcOff);
        copyMat16(fHeadMat, dstOff, this.headTpl, srcOff);
        copyCol3(fLegsCol, dstCol, this.legsCol, srcCol);
        copyCol3(fTorsoCol, dstCol, this.torsoCol, srcCol);
        copyCol3(fHeadCol, dstCol, this.headCol, srcCol);
        copyMat16(fArmMat, 2 * k * 16, this.armTpl, a0 * 16);
        copyMat16(fArmMat, (2 * k + 1) * 16, this.armTpl, a1 * 16);
        copyCol3(fArmCol, 2 * k * 3, this.armCol, a0 * 3);
        copyCol3(fArmCol, (2 * k + 1) * 3, this.armCol, a1 * 3);
      }
      const hs = this.fanHatSlot[i]!;
      if (hs >= 0) {
        const k = hatCount++;
        this.activeHatFan[k] = i;
        this.activeHatSlot[k] = hs;
        copyMat16(hatMat, k * 16, this.hatTpl, hs * 16);
        copyCol3(hatCol, k * 3, this.hatCol, hs * 3);
      } else {
        const hrs = this.fanHairSlot[i]!;
        if (hrs >= 0) {
          const k = hairCount++;
          this.activeHairFan[k] = i;
          this.activeHairSlot[k] = hrs;
          copyMat16(hairMat, k * 16, this.hairTpl, hrs * 16);
          copyCol3(hairCol, k * 3, this.hairCol, hrs * 3);
        }
      }
      const ws = this.fanWavedSlot[i]!;
      if (ws >= 0) {
        const k = wavedCount++;
        this.activeWavedFan[k] = i;
        this.activeWavedSlot[k] = ws;
        copyMat16(wavedMat, k * 16, this.wavedTpl, ws * 16);
        copyCol3(wavedCol, k * 3, this.wavedCol, ws * 3);
      }
    }

    this.activeNearCount = nearCount;
    this.activeFarCount = farCount;
    this.activeHatCount = hatCount;
    this.activeWavedCount = wavedCount;
    this.activeHairCount = hairCount;

    nLegs.count = nearCount;
    nTorsos.count = nearCount;
    nHeads.count = nearCount;
    nArms.count = 2 * nearCount;
    fLegs.count = farCount;
    fTorsos.count = farCount;
    fHeads.count = farCount;
    fArms.count = 2 * farCount;
    hats.count = hatCount;
    waved.count = wavedCount;
    hair.count = hairCount;

    for (const mesh of [...this.nearFans, ...this.farFans, ...this.accessoryFans]) {
      mesh.instanceColor!.needsUpdate = true;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /** The crowd, moved with the street: updates only visible near/far/accessory spectators. */
  private placeCrowd(s: number, heightAt: (metres: number) => number): void {
    const [nLegs, nTorsos, nHeads, nArms] = this.nearFans;
    const [fLegs, fTorsos, fHeads, fArms] = this.farFans;
    const [hats, waved, hair] = this.accessoryFans;
    if (
      !nLegs ||
      !nTorsos ||
      !nHeads ||
      !nArms ||
      !fLegs ||
      !fTorsos ||
      !fHeads ||
      !fArms ||
      !hats ||
      !waved ||
      !hair
    ) {
      return;
    }
    const bucket = Math.floor(s / CROWD_BUCKET_M);
    if (bucket !== this.lastCrowdBucket) this.rebuildCrowdBucket(bucket);

    const offsets = this.fanOffsets;
    const worldY = this.fanWorldY;
    const worldZ = this.fanWorldZ;
    const legsY = this.legsBaseY;
    const torsoY = this.torsoBaseY;
    const headY = this.headBaseY;
    const armY = this.armBaseY;
    const armZ = this.armBaseZ;

    const updatePartition = (
      indices: Uint16Array,
      count: number,
      legsArr: Float32Array,
      torsoArr: Float32Array,
      headArr: Float32Array,
      armArr: Float32Array,
    ) => {
      for (let k = 0; k < count; k++) {
        const i = indices[k]!;
        const metres = ((((offsets[i]! - s) % LOOP) + LOOP) % LOOP) - BEHIND;
        const y = heightAt(metres) + KERB;
        const z = -metres;
        worldY[i] = y;
        worldZ[i] = z;
        const off = k * 16;
        legsArr[off + 13] = y + legsY[i]!;
        legsArr[off + 14] = z;
        torsoArr[off + 13] = y + torsoY[i]!;
        torsoArr[off + 14] = z;
        headArr[off + 13] = y + headY[i]!;
        headArr[off + 14] = z;
        const a0 = 2 * i;
        const a1 = a0 + 1;
        const a0Off = 2 * k * 16;
        const a1Off = (2 * k + 1) * 16;
        armArr[a0Off + 13] = y + armY[a0]!;
        armArr[a0Off + 14] = armZ[a0]! + z;
        armArr[a1Off + 13] = y + armY[a1]!;
        armArr[a1Off + 14] = armZ[a1]! + z;
      }
    };

    updatePartition(
      this.activeNearIdx,
      this.activeNearCount,
      nLegs.instanceMatrix.array as Float32Array,
      nTorsos.instanceMatrix.array as Float32Array,
      nHeads.instanceMatrix.array as Float32Array,
      nArms.instanceMatrix.array as Float32Array,
    );
    updatePartition(
      this.activeFarIdx,
      this.activeFarCount,
      fLegs.instanceMatrix.array as Float32Array,
      fTorsos.instanceMatrix.array as Float32Array,
      fHeads.instanceMatrix.array as Float32Array,
      fArms.instanceMatrix.array as Float32Array,
    );

    const hatArr = hats.instanceMatrix.array as Float32Array;
    const hatY = this.hatBaseY;
    for (let k = 0; k < this.activeHatCount; k++) {
      const fi = this.activeHatFan[k]!;
      const hs = this.activeHatSlot[k]!;
      const off = k * 16;
      hatArr[off + 13] = worldY[fi]! + hatY[hs]!;
      hatArr[off + 14] = worldZ[fi]!;
    }
    const wavedArr = waved.instanceMatrix.array as Float32Array;
    const wavedY = this.wavedBaseY;
    const wavedZ = this.wavedBaseZ;
    for (let k = 0; k < this.activeWavedCount; k++) {
      const fi = this.activeWavedFan[k]!;
      const ws = this.activeWavedSlot[k]!;
      const off = k * 16;
      wavedArr[off + 13] = worldY[fi]! + wavedY[ws]!;
      wavedArr[off + 14] = wavedZ[ws]! + worldZ[fi]!;
    }
    const hairArr = hair.instanceMatrix.array as Float32Array;
    const hairY = this.hairBaseY;
    for (let k = 0; k < this.activeHairCount; k++) {
      const fi = this.activeHairFan[k]!;
      const hrs = this.activeHairSlot[k]!;
      const off = k * 16;
      hairArr[off + 13] = worldY[fi]! + hairY[hrs]!;
      hairArr[off + 14] = worldZ[fi]!;
    }

    for (const mesh of [...this.nearFans, ...this.farFans, ...this.accessoryFans]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Spectators behind the barriers, partitioned into near shadow-casting (`(-14, 72) m`) and far
   * non-shadow-casting (`[72, 308] m`) InstancedMeshes, culling behind-camera and far-horizon fans.
   */
  private addCrowd(roadHalf: number): void {
    const random = seeded(41);
    let offset = 0;
    while (offset < LOOP) {
      offset += 1 + random() * 4;
      const side = random() < 0.5 ? -1 : 1;
      const knot = 2 + Math.floor(random() * 6);
      for (let k = 0; k < knot && offset < LOOP; k++) {
        this.crowd.push({
          offset: offset + k * (0.5 + random() * 0.4),
          x: side * (roadHalf + 0.9 + random() * 1.4),
          height: 1.55 + random() * 0.35,
          turn: side * (Math.PI / 2) + (random() - 0.5) * 1.2,
          shirt: SHIRTS[Math.floor(random() * SHIRTS.length)]!,
          skin: SKINS[Math.floor(random() * SKINS.length)]!,
          trousers: TROUSERS[Math.floor(random() * TROUSERS.length)]!,
          cheer: false,
        });
      }
    }
    // A quarter of the crowd cheer, drawn from a sequence of their own.
    const cheers = seeded(43);
    this.crowd.forEach((fan, i) => {
      const cheer = cheers() < 0.25;
      // One in six is a child, at the front by the barrier.
      const child = cheers() < 0.16;
      this.crowd[i] = child
        ? {
            ...fan,
            cheer,
            height: 1.05 + cheers() * 0.3,
            x: Math.sign(fan.x) * (roadHalf + 0.7),
          }
        : { ...fan, cheer };
    });
    // A race marshal in a hi-vis vest every forty metres or so, at the barrier, facing the road.
    for (let at = 12; at < LOOP; at += 38 + (at % 7)) {
      const side = (at / 38) % 2 < 1 ? -1 : 1;
      this.crowd.push({
        offset: at,
        x: side * (roadHalf + 0.75),
        height: 1.8,
        turn: side * (Math.PI / 2),
        shirt: '#e8f021',
        skin: SKINS[at % SKINS.length]!,
        trousers: '#20242c',
        cheer: false,
      });
    }
    // Unit parts, scaled per spectator: legs 0.9 m and a torso 0.75 m long before scaling.
    const legs = new CapsuleGeometry(0.13, 0.64, 2, 6);
    legs.scale(1.25, 1, 0.8);
    const torso = new CapsuleGeometry(0.17, 0.41, 2, 7);
    torso.scale(1.1, 1, 0.7);
    const head = new SphereGeometry(0.105, 8, 6);
    // An arm 0.6 m long, its middle at the origin.
    const arm = new CapsuleGeometry(0.05, 0.5, 1, 5);
    const hat = new CylinderGeometry(0.1, 0.17, 0.09, 8);
    const pennant = new PlaneGeometry(0.4, 0.28);
    pennant.translate(0.2, 0, 0);
    const hair = new SphereGeometry(0.112, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2.1);
    const material = new MeshStandardMaterial({ roughness: 0.8 });
    this.disposables.push(legs, torso, head, arm, hat, pennant, hair, material);

    const n = this.crowd.length;
    const hatsRng = seeded(47);
    const hattedFlags: boolean[] = [];
    const hatColours: string[] = [];
    const hairColours: string[] = [];
    let hatTotal = 0;
    let wavedTotal = 0;
    for (let i = 0; i < n; i++) {
      const hasHat = hatsRng() < 0.2;
      hattedFlags.push(hasHat);
      hatColours.push(HATS[Math.floor(hatsRng() * HATS.length)]!);
      hairColours.push(HAIR[Math.floor(hatsRng() * HAIR.length)]!);
      if (hasHat) hatTotal++;
      if (this.crowd[i]!.cheer && i % 3 !== 0) wavedTotal++;
    }
    const hairTotal = n - hatTotal;

    this.fanOffsets = new Float32Array(n);
    this.fanWorldY = new Float32Array(n);
    this.fanWorldZ = new Float32Array(n);
    this.legsBaseY = new Float32Array(n);
    this.torsoBaseY = new Float32Array(n);
    this.headBaseY = new Float32Array(n);
    this.armBaseY = new Float32Array(2 * n);
    this.armBaseZ = new Float32Array(2 * n);
    this.legsTpl = new Float32Array(n * 16);
    this.torsoTpl = new Float32Array(n * 16);
    this.headTpl = new Float32Array(n * 16);
    this.armTpl = new Float32Array(2 * n * 16);
    this.legsCol = new Float32Array(n * 3);
    this.torsoCol = new Float32Array(n * 3);
    this.headCol = new Float32Array(n * 3);
    this.armCol = new Float32Array(2 * n * 3);

    this.fanHatSlot = new Int16Array(n).fill(-1);
    this.hatTpl = new Float32Array(hatTotal * 16);
    this.hatCol = new Float32Array(hatTotal * 3);
    this.hatBaseY = new Float32Array(hatTotal);

    this.fanWavedSlot = new Int16Array(n).fill(-1);
    this.wavedTpl = new Float32Array(wavedTotal * 16);
    this.wavedCol = new Float32Array(wavedTotal * 3);
    this.wavedBaseY = new Float32Array(wavedTotal);
    this.wavedBaseZ = new Float32Array(wavedTotal);

    this.fanHairSlot = new Int16Array(n).fill(-1);
    this.hairTpl = new Float32Array(hairTotal * 16);
    this.hairCol = new Float32Array(hairTotal * 3);
    this.hairBaseY = new Float32Array(hairTotal);

    const colour = new Color();
    const writeCol = (dst: Float32Array, idx: number, hex: string) => {
      colour.set(hex);
      dst[idx * 3] = colour.r;
      dst[idx * 3 + 1] = colour.g;
      dst[idx * 3 + 2] = colour.b;
    };
    let hatSlot = 0;
    let wavedSlot = 0;
    let hairSlot = 0;
    this.crowd.forEach((fan, i) => {
      this.fanOffsets[i] = fan.offset;
      writeCol(this.legsCol, i, fan.trousers);
      writeCol(this.torsoCol, i, fan.shirt);
      writeCol(this.headCol, i, fan.skin);
      writeCol(this.armCol, 2 * i, fan.shirt);
      writeCol(this.armCol, 2 * i + 1, fan.shirt);
      const hip = fan.height * 0.47;
      const neck = fan.height - 0.21;
      this.turn.setFromAxisAngle(UP, fan.turn);
      const setCore = (tpl: Float32Array, outY: Float32Array, at: number, sy: number) => {
        this.matrix.compose(this.spot.set(fan.x, at, 0), this.turn, this.size.set(1, sy, 1));
        this.matrix.toArray(tpl, i * 16);
        outY[i] = at;
      };
      setCore(this.legsTpl, this.legsBaseY, hip / 2, hip / 0.9);
      setCore(this.torsoTpl, this.torsoBaseY, (hip + neck) / 2, (neck - hip + 0.08) / 0.75);
      setCore(this.headTpl, this.headBaseY, fan.height - 0.11, 1);
      if (hattedFlags[i]) {
        const at = fan.height - 0.02;
        this.matrix.compose(this.spot.set(fan.x, at, 0), this.turn, this.size.set(1, 1, 1));
        this.matrix.toArray(this.hatTpl, hatSlot * 16);
        writeCol(this.hatCol, hatSlot, hatColours[i]!);
        this.fanHatSlot[i] = hatSlot;
        this.hatBaseY[hatSlot] = at;
        hatSlot++;
      } else {
        const at = fan.height - 0.1;
        this.matrix.compose(this.spot.set(fan.x, at, 0), this.turn, this.size.set(1, 1, 1));
        this.matrix.toArray(this.hairTpl, hairSlot * 16);
        writeCol(this.hairCol, hairSlot, hairColours[i]!);
        this.fanHairSlot[i] = hairSlot;
        this.hairBaseY[hairSlot] = at;
        hairSlot++;
      }
      for (const side of [-1, 1]) {
        this.reach.set(side * (fan.cheer ? 0.35 : 0.1), fan.cheer ? 1 : -1, 0.08).normalize();
        this.shoulder.set(side * 0.21, 0, 0).applyQuaternion(this.turn);
        this.shoulder.y = neck - 0.06;
        this.shoulder.x += fan.x;
        this.lean.setFromUnitVectors(UP, this.reach);
        this.armTurn.copy(this.turn).multiply(this.lean);
        this.reach.applyQuaternion(this.turn);
        this.spot.copy(this.shoulder).addScaledVector(this.reach, 0.3);
        this.matrix.compose(this.spot, this.armTurn, this.size.set(1, 1, 1));
        const aIdx = 2 * i + (side > 0 ? 1 : 0);
        this.matrix.toArray(this.armTpl, aIdx * 16);
        this.armBaseY[aIdx] = this.spot.y;
        this.armBaseZ[aIdx] = this.spot.z;
        if (side > 0 && fan.cheer && i % 3 !== 0) {
          this.spot.copy(this.shoulder).addScaledVector(this.reach, 0.62);
          this.matrix.compose(this.spot, this.lean.identity(), this.size.setScalar(1));
          this.matrix.toArray(this.wavedTpl, wavedSlot * 16);
          writeCol(this.wavedCol, wavedSlot, PENNANTS[i % PENNANTS.length]!);
          this.fanWavedSlot[i] = wavedSlot;
          this.wavedBaseY[wavedSlot] = this.spot.y;
          this.wavedBaseZ[wavedSlot] = this.spot.z;
          wavedSlot++;
        }
      }
    });

    // Compute exact worst-case bucket capacities across all LOOP / CROWD_BUCKET_M = 210 buckets.
    let maxNear = 1;
    let maxFar = 1;
    let maxHats = 1;
    let maxWaved = 1;
    let maxHair = 1;
    const totalBuckets = LOOP / CROWD_BUCKET_M;
    for (let b = 0; b < totalBuckets; b++) {
      const s0 = b * CROWD_BUCKET_M;
      let nc = 0;
      let fc = 0;
      let hc = 0;
      let wc = 0;
      let hrc = 0;
      for (let i = 0; i < n; i++) {
        const m0 = ((((this.fanOffsets[i]! - s0) % LOOP) + LOOP) % LOOP) - BEHIND;
        if (m0 <= CROWD_NEAR_BEHIND || m0 > CROWD_FAR_AHEAD) continue;
        if (m0 < CROWD_NEAR_AHEAD) nc++;
        else fc++;
        if (this.fanHatSlot[i]! >= 0) hc++;
        else hrc++;
        if (this.fanWavedSlot[i]! >= 0) wc++;
      }
      if (nc > maxNear) maxNear = nc;
      if (fc > maxFar) maxFar = fc;
      if (hc > maxHats) maxHats = hc;
      if (wc > maxWaved) maxWaved = wc;
      if (hrc > maxHair) maxHair = hrc;
    }

    this.activeNearIdx = new Uint16Array(maxNear);
    this.activeFarIdx = new Uint16Array(maxFar);
    this.activeHatFan = new Uint16Array(maxHats);
    this.activeHatSlot = new Uint16Array(maxHats);
    this.activeWavedFan = new Uint16Array(maxWaved);
    this.activeWavedSlot = new Uint16Array(maxWaved);
    this.activeHairFan = new Uint16Array(maxHair);
    this.activeHairSlot = new Uint16Array(maxHair);

    this.nearFans = [
      new InstancedMesh(legs, material, maxNear),
      new InstancedMesh(torso, material, maxNear),
      new InstancedMesh(head, material, maxNear),
      new InstancedMesh(arm, material, 2 * maxNear),
    ];
    this.farFans = [
      new InstancedMesh(legs, material, maxFar),
      new InstancedMesh(torso, material, maxFar),
      new InstancedMesh(head, material, maxFar),
      new InstancedMesh(arm, material, 2 * maxFar),
    ];
    this.accessoryFans = [
      new InstancedMesh(hat, material, maxHats),
      new InstancedMesh(pennant, this.cloth, maxWaved),
      new InstancedMesh(hair, material, maxHair),
    ];

    colour.setHex(0xffffff);
    this.nearFans.forEach((mesh) => {
      mesh.setColorAt(0, colour);
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.disposables.push(mesh);
    });
    for (const mesh of [...this.farFans, ...this.accessoryFans]) {
      mesh.setColorAt(0, colour);
      mesh.castShadow = false;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.disposables.push(mesh);
    }

    this.rebuildCrowdBucket(0);
  }

  /** The belfry: a square brick tower, its louvred stage and a slate spire, hazed by distance. */
  private addBelfry(): void {
    const haze = new Color(0xdcd8cf);
    const tone = (hex: number) => {
      const material = new MeshStandardMaterial({ roughness: 0.95, fog: false });
      material.color.set(hex).lerp(haze, 0.32);
      this.disposables.push(material);
      return material;
    };
    const brick = tone(0xa0563e);
    const stone = tone(0xd9cfb8);
    const slate = tone(0x4b545e);
    const b = this.belfry;
    const block = (m: Material, w: number, h: number, y: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, w);
      mesh.position.y = y + h / 2;
      b.add(mesh);
    };
    block(brick, 9, 34, 0);
    block(stone, 9.6, 0.8, 34);
    block(brick, 8, 9, 34.8);
    block(stone, 8.6, 0.8, 43.8);
    const spire = new ConeGeometry(6, 22, 8);
    this.disposables.push(spire);
    const top = new Mesh(spire, slate);
    top.position.y = 44.6 + 11;
    b.add(top);
    // The louvred openings of the bell stage, dark on each face.
    for (const [x, z] of [
      [4.05, 0],
      [-4.05, 0],
      [0, 4.05],
      [0, -4.05],
    ] as const) {
      const louvre = new Mesh(this.unit, this.iron);
      louvre.scale.set(x ? 0.1 : 2.4, 5, z ? 0.1 : 2.4);
      louvre.position.set(x, 39.5, z);
      b.add(louvre);
    }
    this.flatten(b, false);
    this.group.add(b);
  }

  /** A dozen swifts: dark crescents on swept wings, high over the street ahead. */
  private addSwifts(): void {
    const wing = new BoxGeometry(0.42, 0.02, 0.1);
    const parts = [-1, 1].map((side) => {
      const w = new Mesh(wing);
      w.position.x = side * 0.2;
      w.rotation.y = side * 0.5;
      w.rotation.z = side * 0.15;
      w.updateMatrix();
      return wing.clone().applyMatrix4(w.matrix);
    });
    wing.dispose();
    const bird = mergeGeometries(parts)!;
    for (const part of parts) part.dispose();
    const black = new MeshBasicMaterial({ color: 0x2a2a30, fog: false });
    this.swiftsMesh = new InstancedMesh(bird, black, 12);
    this.swiftsMesh.frustumCulled = false;
    this.disposables.push(bird, black, this.swiftsMesh);
    this.group.add(this.swiftsMesh);
  }

  /** The TV moto: a white motorbike, its pilot, and a cameraman sat backwards on the pillion. */
  private addMoto(): void {
    const m = this.moto;
    const black = new MeshStandardMaterial({ color: 0x17181b, roughness: 0.6 });
    const white = new MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.35, metalness: 0.2 });
    const blue = new MeshStandardMaterial({ color: 0x2456a6, roughness: 0.5 });
    const tyre = new TorusGeometry(0.28, 0.08, 8, 24);
    const torso = new CapsuleGeometry(0.18, 0.4, 4, 8);
    const helmet = new SphereGeometry(0.15, 12, 8);
    this.disposables.push(tyre, torso, helmet);
    const add = (geometry: BufferGeometry, material: Material, x: number, y: number, z: number) => {
      const mesh = new Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      m.add(mesh);
      return mesh;
    };
    const box = (material: Material, w: number, h: number, d: number, y: number, z: number) => {
      const mesh = add(this.unit, material, 0, y, z);
      mesh.scale.set(w, h, d);
      return mesh;
    };
    for (const z of [-0.72, 0.72]) add(tyre, black, 0, 0.36, z).rotation.y = Math.PI / 2;
    box(white, 0.42, 0.42, 1.2, 0.72, 0);
    box(blue, 0.44, 0.12, 1.22, 0.62, 0);
    box(black, 0.34, 0.1, 0.9, 0.97, 0.15);
    box(white, 0.5, 0.35, 0.3, 1.0, -0.62);
    // The pilot, leaning to the bars.
    const pilot = add(torso, black, 0, 1.35, -0.12);
    pilot.rotation.x = -0.5;
    add(helmet, white, 0, 1.78, -0.32);
    // The cameraman, facing back down the road with the camera on his shoulder.
    add(torso, blue, 0, 1.4, 0.42);
    add(helmet, white, 0, 1.86, 0.44);
    box(black, 0.2, 0.24, 0.5, 1.82, 0.62).position.x = 0.2;
    box(black, 0.1, 0.1, 0.06, 1.82, 0.9).position.x = 0.2;
    // A mast with the camera's transmitter.
    box(black, 0.03, 1.3, 0.03, 1.6, 0.85).position.x = -0.2;
    box(white, 0.18, 0.18, 0.18, 2.3, 0.85).position.x = -0.2;
    // The board on the back, facing the riders, and an amber beacon on the mast.
    const board = new MeshStandardMaterial({ map: this.track(tvBoardTexture()), roughness: 0.5 });
    const amber = new MeshStandardMaterial({
      color: 0xffa21a,
      emissive: 0xff8a00,
      emissiveIntensity: 0.8,
    });
    const plate = new PlaneGeometry(0.5, 0.36);
    const beacon = new SphereGeometry(0.07, 10, 6);
    this.disposables.push(board, amber, plate, beacon);
    const back = new Mesh(plate, board);
    back.position.set(0, 0.95, 0.66);
    const beaconMesh = new Mesh(beacon, amber);
    beaconMesh.position.set(-0.2, 2.45, 0.85);
    m.add(back, beaconMesh);
    this.flatten(m);
    black.dispose();
    white.dispose();
    blue.dispose();
    this.group.add(m);
  }

  /** Cloth banners strung across the street between the houses, with their ropes. */
  private addStreetBanners(): void {
    const rope = new BoxGeometry(2 * FRONTAGE, 0.03, 0.03);
    rope.translate(0, 7.85 - KERB, 0);
    this.ropesMesh = new InstancedMesh(rope, this.iron, STREET_BANNERS.length);
    this.ropesMesh.frustumCulled = false;
    const atlas = clothBannerAtlasTexture(STREET_BANNERS);
    const material = new MeshStandardMaterial({
      map: this.track(atlas.texture),
      side: DoubleSide,
      roughness: 0.85,
    });
    this.disposables.push(rope, this.ropesMesh, material);
    this.group.add(this.ropesMesh);
    this.size.set(1, 1, 1);
    this.turn.identity();
    STREET_BANNERS.forEach((_, i) => {
      const cloth = uvPlane(7, 1.3, atlas.rects[i]!).translate(0, 7.2 - KERB, 0);
      const banner = new Mesh(cloth, material);
      banner.castShadow = true;
      this.disposables.push(cloth);
      this.group.add(banner);
      const offset = 70 + i * 140;
      this.props.push({ mesh: banner, offset, every: LOOP, x: 0, shadowNear: true });
      this.bannerOffsets.push(offset);
      this.ropesMesh!.setMatrixAt(
        i,
        this.matrix.compose(this.spot.set(0, 0, 0), this.turn, this.size),
      );
    });
  }

  /** Fans' slogans painted on the setts, read upright as the rider rolls over them. */
  private addRoadPaint(): void {
    // Stretched along the road, as road writing is, so it reads from a rider's low eye.
    const atlas = roadPaintAtlasTexture(ROAD_PAINT);
    const material = new MeshStandardMaterial({
      map: this.track(atlas.texture),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      roughness: 0.7,
    });
    this.disposables.push(material);
    ROAD_PAINT.forEach(([, , x], i) => {
      const plane = uvPlane(3.2, 7, atlas.rects[i]!)
        .rotateX(-Math.PI / 2)
        .translate(0, -KERB + 0.01, 0);
      const mesh = new Mesh(plane, material);
      mesh.receiveShadow = true;
      this.disposables.push(plane);
      this.group.add(mesh);
      this.props.push({ mesh, offset: 38 + i * 97, every: LOOP, x, lies: true });
    });
    // Cast-iron covers set in the setts, a few to a lap.
    const plate = new CircleGeometry(0.4, 24);
    plate.rotateX(-Math.PI / 2);
    plate.translate(0, -KERB + 0.008, 0);
    const iron = new MeshStandardMaterial({
      map: this.track(coverTexture()),
      roughness: 0.55,
      metalness: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.coversMesh = new InstancedMesh(plate, iron, this.coverSpots.length);
    this.coversMesh.receiveShadow = true;
    this.coversMesh.frustumCulled = false;
    this.disposables.push(plate, iron, this.coversMesh);
    this.group.add(this.coversMesh);
  }

  /** Iron lamp posts along both pavements, each with a hanging basket and a pennant. */
  private addFurniture(
    roadHalf: number,
    detailAtlas: ReturnType<typeof houseDetailAtlas>,
    detailMat: MeshStandardMaterial,
  ): void {
    const iron = this.material(null, '#1f2124');
    iron.metalness = 0.6;
    iron.roughness = 0.45;
    const glass = new MeshStandardMaterial({
      color: 0xfff1d0,
      emissive: 0xffd9a0,
      emissiveIntensity: 0.35,
      roughness: 0.2,
    });
    const pole = new CylinderGeometry(0.06, 0.09, 4, 8).translate(0, 2.2, 0);
    const foot = new CylinderGeometry(0.16, 0.2, 0.5, 8).translate(0, 0.25, 0);
    const cap = new ConeGeometry(0.28, 0.3, 6).translate(0, 4.85, 0);
    const arm = new BoxGeometry(0.9, 0.04, 0.04).translate(-0.45, 3.6, 0);
    const ironLamp = mergeGeometries([foot, pole, cap, arm])!;
    for (const part of [foot, pole, cap, arm]) part.dispose();
    const lantern = new CylinderGeometry(0.2, 0.13, 0.5, 6).translate(0, 4.45, 0);
    // A hanging basket of geraniums on an arm from each lamp, out over the barrier, merged with
    // its trailing ivy into one `houseDetailAtlas` geometry.
    const basket = new SphereGeometry(
      0.3,
      10,
      5,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    ).translate(-0.8, 3.2, 0);
    const bloom = remapUv(
      new SphereGeometry(0.36, 10, 6).scale(1, 0.8, 1).translate(-0.8, 3.25, 0),
      detailAtlas.blooms,
    );
    const trailing = remapUv(
      new ConeGeometry(0.4, 0.34, 10, 1, true).rotateX(Math.PI).translate(-0.8, 3.02, 0),
      detailAtlas.leaves,
    );
    bloom.clearGroups();
    trailing.clearGroups();
    const foliage = mergeGeometries([bloom, trailing])!;
    bloom.dispose();
    trailing.dispose();
    const wicker = new MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.95 });
    this.disposables.push(glass, ironLamp, lantern, basket, foliage, wicker);
    const penAtlas = pennantAtlasTexture([
      ['#1b1e24', '#d7ff3a'],
      ['#b8322c', '#ffffff'],
    ]);
    const pennantMaterial = new MeshStandardMaterial({
      map: this.track(penAtlas.texture),
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.85,
    });
    this.disposables.push(pennantMaterial);
    const lampEvery = 28;
    const count = Math.floor(LOOP / lampEvery);
    this.lampOffsetMetres = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.lampOffsetMetres[i] = i * lampEvery + 6;
    }
    this.lampMeshes = [
      [ironLamp, iron],
      [lantern, glass],
      [basket, wicker],
      [foliage, detailMat],
    ].map(([geometry, material]) => {
      const mesh = new InstancedMesh(geometry as BufferGeometry, material as Material, count);
      mesh.castShadow = material !== glass;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.disposables.push(mesh);
      return mesh;
    });
    this.lampArrays = this.lampMeshes.map((m) => m.instanceMatrix.array as Float32Array);
    const pen0Geo = uvPlane(0.5, 1.1, penAtlas.rects[0]!).translate(0.32, 2.4, 0);
    const pen1Geo = uvPlane(0.5, 1.1, penAtlas.rects[1]!).translate(-0.32, 2.4, 0);
    const pen0Count = Math.ceil(count / 2);
    const pen1Count = Math.floor(count / 2);
    this.lampPen0 = new InstancedMesh(pen0Geo, pennantMaterial, pen0Count);
    this.lampPen1 = new InstancedMesh(pen1Geo, pennantMaterial, pen1Count);
    for (const pen of [this.lampPen0, this.lampPen1]) {
      pen.castShadow = true;
      pen.frustumCulled = false;
      this.group.add(pen);
    }
    this.disposables.push(pen0Geo, pen1Geo, this.lampPen0, this.lampPen1);
    this.size.set(1, 1, 1);
    let p0 = 0;
    let p1 = 0;
    for (let i = 0; i < count; i++) {
      const side: -1 | 1 = i % 2 ? 1 : -1;
      const x = side * (roadHalf + 0.7);
      this.turn.setFromAxisAngle(UP, side === 1 ? 0 : Math.PI);
      this.matrix.compose(this.spot.set(x, 0, 0), this.turn, this.size);
      for (const mesh of this.lampMeshes) mesh.setMatrixAt(i, this.matrix);
      this.turn.identity();
      this.matrix.compose(this.spot.set(x, 0, 0), this.turn, this.size);
      if (i % 2 === 0) this.lampPen0.setMatrixAt(p0++, this.matrix);
      else this.lampPen1.setMatrixAt(p1++, this.matrix);
    }
  }

  private material(map: Texture | null, color?: string): MeshStandardMaterial {
    const material = new MeshStandardMaterial({ map, roughness: 0.9, side: DoubleSide });
    if (color) material.color.set(color);
    this.disposables.push(material);
    return material;
  }

  /**
   * One house, its front facing +x (the road on its right when rotated): the shop floor, the
   * upper storeys and a pitched roof whose ridge runs along the street.
   */
  private house(width: number, storeys: number, look: HouseLook): Group {
    const { upper, shop, roof, trim } = look;
    const group = new Group();
    const shopBox = tiledBox(DEPTH, SHOP, width, SHOP, 0, look.groundBay);
    const shopMesh = new Mesh(shopBox, shop);
    shopMesh.position.set(-DEPTH / 2, SHOP / 2, 0);
    const footing = new Mesh(this.unit, roof[1]!);
    footing.scale.set(DEPTH, FOOTING, width);
    footing.position.set(-DEPTH / 2, -FOOTING / 2, 0);
    group.add(footing);
    const height = storeys * STOREY;
    const upperBox = storeyCourse(DEPTH, STOREY, width);
    for (let s = 0; s < storeys; s++) {
      const upperMesh = new Mesh(upperBox, upper);
      upperMesh.position.set(-DEPTH / 2, SHOP + (s + 0.5) * STOREY, 0);
      group.add(upperMesh);
    }
    const rise = 2.2 + this.random() * 1.6;
    const roofGeometry = prism(DEPTH + 0.6, rise, width + 0.2);
    const roofMesh = new Mesh(roofGeometry, roof);
    roofMesh.position.set(-DEPTH / 2, SHOP + height, 0);
    // Dormers on the street side of the roof, each a window under its own small gable.
    const dormers = Math.floor(this.random() * 3);
    for (let i = 0; i < dormers; i++) {
      const z = ((i + 0.5) / dormers - 0.5) * (width - 2);
      const back = 1.6;
      const base = SHOP + height + rise * (back / (DEPTH / 2 + 0.3));
      const cheek = new Mesh(this.dormer, upper);
      cheek.position.set(-back + 0.6, base + 0.5, z);
      const cap = new Mesh(this.dormerRoof, roof);
      cap.position.set(-back + 0.6, base + 1.15, z);
      cap.rotation.y = Math.PI / 2;
      cheek.castShadow = cap.castShadow = true;
      group.add(cheek, cap);
    }
    // One or two chimney stacks through the roof, each with its clay pot.
    const stacks = 1 + Math.floor(this.random() * 2);
    for (let i = 0; i < stacks; i++) {
      const z = (this.random() - 0.5) * (width - 1.5);
      const x = -DEPTH / 2 + (this.random() < 0.5 ? -1 : 1) * (0.8 + this.random() * 1.2);
      const base = SHOP + height + rise * (1 - Math.abs(x + DEPTH / 2) / (DEPTH / 2));
      const stack = new Mesh(this.unit, this.brick);
      stack.scale.set(0.7, 1.4, 0.9);
      stack.position.set(x, base + 0.5, z);
      const pot = new Mesh(this.unit, this.brick);
      pot.scale.set(0.82, 0.14, 1.02);
      pot.position.set(x, base + 1.2, z);
      // Two clay chimney pots on each stack's cap.
      for (const dz of [-0.22, 0.22]) {
        const clay = new Mesh(this.chimneyPot, this.terracotta);
        clay.position.set(x, base + 1.45, z + dz);
        clay.castShadow = true;
        group.add(clay);
      }
      stack.castShadow = true;
      group.add(stack, pot);
    }
    // Ridge tiles capping the roof, a zinc gutter along the eaves and a downpipe at one end.
    const ridge = new Mesh(this.unit, roof[0]!);
    ridge.scale.set(0.28, 0.16, width + 0.3);
    ridge.position.set(-DEPTH / 2, SHOP + height + rise + 0.02, 0);
    const gutter = new Mesh(this.unit, this.zinc);
    gutter.scale.set(0.16, 0.14, width + 0.2);
    gutter.position.set(0.36, SHOP + height + 0.02, 0);
    const pipe = new Mesh(this.unit, this.zinc);
    const end = (this.chance(5) < 0.5 ? -1 : 1) * (width / 2 - 0.12);
    pipe.scale.set(0.09, SHOP + height, 0.09);
    pipe.position.set(0.1, (SHOP + height) / 2, end);
    ridge.castShadow = gutter.castShadow = pipe.castShadow = true;
    group.add(ridge, gutter, pipe);
    group.add(shopMesh, roofMesh);
    if (look.awning) group.add(this.awning(look.awning, width));
    if (this.random() < 0.4) group.add(this.balcony(look.trim, width));
    if (look.groundBay === BAY && this.random() < 0.6) group.add(this.sign(width));
    if (look.groundBay === BAY) {
      // The fascia over the shop front, its trade lettered in gilt.
      const fascia = new Mesh(this.fasciaBoard, this.fascias[look.trade]!);
      fascia.rotation.y = Math.PI / 2;
      fascia.scale.x = Math.min(1, (width - 0.8) / 5.2);
      fascia.position.set(0.05, SHOP - 0.15, 0);
      group.add(fascia);
      // The shop door, in one of its bays.
      const door = new Mesh(
        this.doorLeaf,
        this.shopDoors[this.houseIndex % this.shopDoors.length]!,
      );
      const bay = Math.floor(this.chance(9) * (width / BAY));
      door.rotation.y = Math.PI / 2;
      door.position.set(0.04, 1.25, -width / 2 + (bay + 0.5) * BAY);
      group.add(door);
    }
    if (this.chance(2) < 0.32) group.add(this.flag(width));
    if (look.groundBay === 2 * BAY) group.add(this.pots(width));
    // Stone quoins up both front corners of half the houses, long and short in turn.
    if (this.chance(7) < 0.5) {
      for (const end of [-1, 1]) {
        for (let k = 0, y = SHOP + 0.2; y < SHOP + height - 0.6; k++, y += 0.5) {
          const quoin = new Mesh(this.frontUnit, trim);
          const long = k % 2 === 0 ? 0.75 : 0.45;
          quoin.scale.set(0.08, 0.42, long);
          quoin.position.set(0.04, y + 0.21, end * (width / 2 - long / 2));
          group.add(quoin);
        }
      }
    }
    // A narrow house may raise a stepped gable over its front, as Flemish town houses do.
    if (width <= 9 && this.chance(6) < 0.35) group.add(this.stepGable(width, SHOP + height, look));
    // The cornice under the eaves, and the string course over the shop floor.
    group.add(this.trim(trim, width + 0.3, 0.45, 0.42, SHOP + height - 0.22));
    // A stone sill under every upper window, a lintel and keystone over it.
    for (let k = 0; k < storeys; k++) {
      for (let bay = 0; bay < Math.round(width / BAY); bay++) {
        const sill = new Mesh(this.frontUnit, trim);
        sill.scale.set(0.2, 0.09, 1.2);
        sill.position.set(0.08, SHOP + k * STOREY + 0.62, -width / 2 + (bay + 0.5) * BAY);
        // And over it a lintel with its keystone.
        const lintel = new Mesh(this.frontUnit, trim);
        lintel.scale.set(0.1, 0.16, 1.22);
        lintel.position.set(0.05, SHOP + k * STOREY + 2.62, sill.position.z);
        const key = new Mesh(this.frontUnit, trim);
        key.scale.set(0.14, 0.26, 0.2);
        key.position.set(0.07, SHOP + k * STOREY + 2.64, sill.position.z);
        group.add(sill, lintel, key);
        if (look.flowers) {
          // A window box on the sill, geraniums spilling over its front.
          const planter = new Mesh(this.frontUnit, this.terracotta);
          planter.scale.set(0.24, 0.2, 1.05);
          planter.position.set(0.16, SHOP + k * STOREY + 0.76, sill.position.z);
          const blooms = new Mesh(this.bush, this.geraniums);
          blooms.scale.set(0.4, 0.3, 1.25);
          blooms.position.set(0.18, SHOP + k * STOREY + 0.9, sill.position.z);
          group.add(planter, blooms);
        }
      }
    }
    // A row of dentils under the cornice.
    for (let z = -width / 2 + 0.2; z < width / 2 - 0.1; z += 0.3) {
      const dentil = new Mesh(this.frontUnit, trim);
      dentil.scale.set(0.18, 0.14, 0.14);
      dentil.position.set(0.09, SHOP + height - 0.52, z);
      group.add(dentil);
    }
    group.add(this.trim(trim, width, 0.2, 0.24, SHOP));
    this.tempGeometries.push(shopBox, upperBox, roofGeometry);
    return group;
  }

  /**
   * Consolidates the street's ~90 town houses and alleys into contiguous street blocks and packs
   * them into 9 `BatchedMesh`es (`FrontSide` on closed volumes, `DoubleSide` only on flat sheets).
   */
  private batchStreet(
    sideHouses: readonly [readonly House[], readonly House[]],
    markers: {
      upper: readonly Material[];
      shut: readonly Material[];
      shop: readonly Material[];
      homes: readonly Material[];
      roofs: readonly Material[];
      gables: readonly Material[];
      trims: readonly Material[];
      awnings: readonly Material[];
    },
    detailAtlas: ReturnType<typeof houseDetailAtlas>,
    detailMat: MeshStandardMaterial,
  ): void {
    const upperSources: CanvasTexture[] = PALETTES.map((p) => bayTexture(p, false));
    const shutRowIdx: number[] = [];
    PALETTES.forEach((p, i) => {
      if (p.shutter) {
        shutRowIdx.push(upperSources.length);
        upperSources.push(bayTexture(p, false, true));
      } else {
        shutRowIdx.push(i);
      }
    });
    const upperAtlas = stackedFacadeAtlas(upperSources, 192, 204, 8);
    const upperMat = new MeshStandardMaterial({
      map: this.track(upperAtlas.texture),
      roughness: 0.9,
    });
    const shopAtlas = stackedFacadeAtlas(
      PALETTES.map((p) => bayTexture(p, true)),
      192,
      240,
      8,
    );
    const glow = this.track(shopGlowTexture(PALETTES.length, 240, 8));
    const shopMat = new MeshStandardMaterial({
      map: this.track(shopAtlas.texture),
      emissiveMap: glow,
      emissive: new Color(0xffc58a),
      emissiveIntensity: 0.32,
      roughness: 0.9,
    });
    const homeAtlas = stackedFacadeAtlas(
      PALETTES.map((p) => homeTexture(p)),
      384,
      240,
      8,
    );
    const homeMat = new MeshStandardMaterial({
      map: this.track(homeAtlas.texture),
      roughness: 0.9,
    });
    const matte = new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
    });
    const metal = new MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.5,
      roughness: 0.48,
    });
    const roofMat = new MeshStandardMaterial({
      map: this.track(tileTexture('#ffffff')),
      vertexColors: true,
      roughness: 0.9,
    });
    const awningMat = new MeshStandardMaterial({
      map: this.track(awningAtlasTexture()),
      roughness: 0.9,
      side: DoubleSide,
    });
    this.disposables.push(upperMat, shopMat, homeMat, matte, metal, roofMat, awningMat);

    const facadeBands = new Map<Material, { target: Material; v0: number; v1: number }>();
    markers.upper.forEach((m, i) => {
      const [v0, v1] = upperAtlas.bands[i]!;
      facadeBands.set(m, { target: upperMat, v0, v1 });
    });
    markers.shut.forEach((m, i) => {
      const [v0, v1] = upperAtlas.bands[shutRowIdx[i]!]!;
      facadeBands.set(m, { target: upperMat, v0, v1 });
    });
    markers.shop.forEach((m, i) => {
      const [v0, v1] = shopAtlas.bands[i]!;
      facadeBands.set(m, { target: shopMat, v0, v1 });
    });
    markers.homes.forEach((m, i) => {
      const [v0, v1] = homeAtlas.bands[i]!;
      facadeBands.set(m, { target: homeMat, v0, v1 });
    });

    const matteColors = new Map<Material, Color>();
    markers.gables.forEach((m, i) => matteColors.set(m, new Color(PALETTES[i]!.wall)));
    markers.trims.forEach((m, i) => matteColors.set(m, new Color(PALETTES[i]!.trim)));
    matteColors.set(this.brick, new Color(0x8e4a37));
    matteColors.set(this.terracotta, new Color(0xb4603f));
    matteColors.set(this.stone, new Color(0xbdb5a6));
    matteColors.set(this.alleyFloor, new Color(0x8a837a));

    const metalColors = new Map<Material, Color>([
      [this.zinc, new Color(0x8a9096)],
      [this.iron, new Color(0x1e2023)],
    ]);
    const roofColors = new Map<Material, Color>();
    markers.roofs.forEach((m, i) => roofColors.set(m, new Color(ROOFS[i]!)));

    const awningCols = new Map<Material, number>();
    markers.awnings.forEach((m, i) => awningCols.set(m, i));

    const detailRects = new Map<Material, UvRect>();
    this.fascias.forEach((m, i) => detailRects.set(m, detailAtlas.fascias[i]!));
    this.shopDoors.forEach((m, i) => detailRects.set(m, detailAtlas.shopDoors[i]!));
    this.signs.forEach((m, i) => detailRects.set(m, detailAtlas.signs[i]!));
    this.houseFlags.forEach((m, i) => detailRects.set(m, detailAtlas.flags[i]!));
    detailRects.set(this.leaves, detailAtlas.leaves);
    detailRects.set(this.geraniums, detailAtlas.blooms);

    const sliceSpan = LOOP / BLOCK_SLICES;
    const buckets = Array.from({ length: BLOCK_SLICES }, () => ({
      minStart: Infinity,
      maxEnd: -Infinity,
      items: [] as House[],
    }));
    for (const list of sideHouses) {
      for (const item of list) {
        const idx = Math.min(BLOCK_SLICES - 1, Math.floor(item.offset / sliceSpan));
        const bucket = buckets[idx]!;
        bucket.items.push(item);
        if (item.offset < bucket.minStart) bucket.minStart = item.offset;
        const end = item.offset + item.width;
        if (end > bucket.maxEnd) bucket.maxEnd = end;
      }
    }
    const rawBlocks = buckets
      .filter((b) => b.items.length > 0)
      .map((b) => ({ offset: b.minStart, width: b.maxEnd - b.minStart, items: b.items }));

    const materialBatches = new Map<Material, { blockIdx: number; geometry: BufferGeometry }[]>();
    const xform = new Matrix4();
    rawBlocks.forEach((raw, blockIdx) => {
      this.blocks.push({ offset: raw.offset, width: raw.width, slots: [] });
      const blockMiddle = raw.offset + raw.width / 2;
      const perMat = new Map<Material, BufferGeometry[]>();
      const pushPart = (
        srcMat: Material,
        rawGeo: BufferGeometry,
        worldXform: Matrix4,
        disposeRaw: boolean,
      ) => {
        let targetMat = srcMat;
        let vColor: Color | undefined;
        let uvMap: ((u: number, v: number) => [number, number]) | undefined;
        const fb = facadeBands.get(srcMat);
        const mc = matteColors.get(srcMat);
        const mtc = metalColors.get(srcMat);
        const rc = roofColors.get(srcMat);
        const ac = awningCols.get(srcMat);
        const dr = detailRects.get(srcMat);
        if (fb) {
          targetMat = fb.target;
          uvMap = (u, v) => [u, fb.v0 + Math.min(Math.max(v, 0), 1) * (fb.v1 - fb.v0)];
        } else if (mc) {
          targetMat = matte;
          vColor = mc;
        } else if (mtc) {
          targetMat = metal;
          vColor = mtc;
        } else if (rc) {
          targetMat = roofMat;
          vColor = rc;
        } else if (ac !== undefined) {
          targetMat = awningMat;
          const colU = ((ac + 0.5) * 64) / 512;
          uvMap = (_u, v) => [colU, v * 3];
        } else if (dr) {
          targetMat = detailMat;
          uvMap = (u, v) => [dr.u0 + u * (dr.u1 - dr.u0), dr.v0 + v * (dr.v1 - dr.v0)];
        }
        const prepared = prepareBatchGeometry(rawGeo, worldXform, vColor, uvMap);
        if (disposeRaw) rawGeo.dispose();
        const list = perMat.get(targetMat) ?? [];
        list.push(prepared);
        perMat.set(targetMat, list);
      };

      for (const item of raw.items) {
        item.mesh.rotation.y = item.side === 1 ? Math.PI : 0;
        item.mesh.position.set(
          item.side * (FRONTAGE + item.setback),
          0,
          -(item.offset + item.width / 2 - blockMiddle),
        );
        item.mesh.updateMatrixWorld(true);
        item.mesh.traverse((o) => {
          if (!(o instanceof Mesh)) return;
          const geometry = o.geometry as BufferGeometry;
          xform.copy(o.matrixWorld);
          if (Array.isArray(o.material)) {
            if (!geometry.index) return;
            for (const grp of geometry.groups) {
              const mat = o.material[grp.materialIndex ?? 0];
              if (!mat) continue;
              const sub = extractSubGeometry(geometry, grp.start, grp.count);
              pushPart(mat, sub, xform, true);
            }
            return;
          }
          pushPart(o.material as Material, geometry, xform, false);
        });
      }

      for (const [mat, parts] of perMat) {
        const merged = parts.length > 1 ? mergeGeometries(parts)! : parts[0]!;
        if (parts.length > 1) for (const p of parts) p.dispose();
        const entries = materialBatches.get(mat) ?? [];
        entries.push({ blockIdx, geometry: merged });
        materialBatches.set(mat, entries);
      }
    });

    const initMatrix = new Matrix4();
    const makeBatched = (
      count: number,
      verts: number,
      indices: number,
      mat: Material,
      castShadow: boolean,
    ): BatchedMesh => {
      const b = new BatchedMesh(count, verts, indices, mat);
      b.frustumCulled = false;
      b.perObjectFrustumCulled = false;
      b.sortObjects = false;
      b.castShadow = castShadow;
      b.receiveShadow = true;
      this.group.add(b);
      this.disposables.push(b, b.geometry);
      return b;
    };
    for (const [mat, entries] of materialBatches) {
      let totalVerts = 0;
      let totalIndices = 0;
      for (const { geometry } of entries) {
        totalVerts += geometry.getAttribute('position').count;
        totalIndices += geometry.index!.count;
      }
      const casts = mat !== detailMat && mat !== metal && mat !== this.railing;
      const near = makeBatched(entries.length, totalVerts, totalIndices, mat, casts);
      const far = casts ? makeBatched(entries.length, totalVerts, totalIndices, mat, false) : null;
      for (const { blockIdx, geometry } of entries) {
        const nearGeo = near.addGeometry(geometry);
        const nearId = near.addInstance(nearGeo);
        const farId = far ? far.addInstance(far.addGeometry(geometry)) : -1;
        geometry.dispose();
        const block = this.blocks[blockIdx]!;
        const start = ((((block.offset + HOUSE_SHIFT) % LOOP) + LOOP) % LOOP) - HOUSE_BEHIND;
        const visible = start + block.width > HOUSE_CULL_BEHIND;
        const inShadow = visible && start < SHADOW_AHEAD;
        const middle = start + block.width / 2;
        initMatrix.elements[14] = -middle;
        near.setMatrixAt(nearId, initMatrix);
        if (far) {
          far.setMatrixAt(farId, initMatrix);
          near.setVisibleAt(nearId, inShadow);
          far.setVisibleAt(farId, visible && !inShadow);
        } else {
          near.setVisibleAt(nearId, visible);
        }
        block.slots.push({ near, nearId, far, farId });
      }
    }
  }

  /**
   * Merges a group's parts into one mesh per textured material and one vertex-coloured mesh per
   * solid finish (`fog`/`metalness`), splitting multi-material prisms by group.
   */
  private flatten(house: Group, castShadows = true): void {
    house.updateMatrixWorld(true);
    const local = new Matrix4().copy(house.matrixWorld).invert();
    const solidMaterials = new Map<string, MeshStandardMaterial>();
    const buckets = new Map<
      Material,
      { material: Material; parts: BufferGeometry[]; meshes: Mesh[] }
    >();
    const pushBucket = (
      srcMat: Material,
      rawGeo: BufferGeometry,
      xform: Matrix4,
      mesh: Mesh,
      disposeRaw: boolean,
    ) => {
      let targetMat = srcMat;
      let vColor: Color | undefined;
      if (
        srcMat instanceof MeshStandardMaterial &&
        !srcMat.map &&
        !srcMat.alphaMap &&
        !srcMat.emissiveMap &&
        !srcMat.normalMap &&
        !srcMat.transparent &&
        srcMat.alphaTest === 0 &&
        (srcMat.emissiveIntensity === 0 || srcMat.emissive.getHex() === 0)
      ) {
        const solidKey = `${srcMat.fog ? 1 : 0}|${srcMat.metalness >= 0.4 ? 1 : 0}`;
        let shared = solidMaterials.get(solidKey);
        if (!shared) {
          shared = new MeshStandardMaterial({
            vertexColors: true,
            fog: srcMat.fog,
            roughness: srcMat.roughness,
            metalness: srcMat.metalness,
          });
          this.disposables.push(shared);
          solidMaterials.set(solidKey, shared);
        }
        targetMat = shared;
        vColor = srcMat.color;
      }
      const part = prepareBatchGeometry(rawGeo, xform, vColor);
      if (disposeRaw) rawGeo.dispose();
      const bucket = buckets.get(targetMat) ?? { material: targetMat, parts: [], meshes: [] };
      bucket.parts.push(part);
      bucket.meshes.push(mesh);
      buckets.set(targetMat, bucket);
    };
    const xform = new Matrix4();
    house.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const geometry = o.geometry as BufferGeometry;
      xform.multiplyMatrices(local, o.matrixWorld);
      if (Array.isArray(o.material)) {
        if (!geometry.index) return;
        for (const grp of geometry.groups) {
          const mat = o.material[grp.materialIndex ?? 0];
          if (!mat) continue;
          const sub = extractSubGeometry(geometry, grp.start, grp.count);
          pushBucket(mat, sub, xform, o, true);
        }
        return;
      }
      pushBucket(o.material as Material, geometry, xform, o, false);
    });
    for (const { material, parts, meshes } of buckets.values()) {
      const merged = parts.length > 1 ? mergeGeometries(parts) : parts[0]!;
      if (parts.length > 1) for (const part of parts) part.dispose();
      if (!merged) continue;
      for (const mesh of meshes) mesh.removeFromParent();
      const mesh = new Mesh(merged, material);
      mesh.castShadow = castShadows && meshes.some((src) => src.castShadow);
      mesh.receiveShadow = true;
      house.add(mesh);
      this.disposables.push(merged);
    }
  }

  /** A stepped gable front: five courses narrowing to a capstone, each step coped in stone. */
  private stepGable(width: number, top: number, look: HouseLook): Group {
    const group = new Group();
    const steps = 5;
    for (let k = 0; k < steps; k++) {
      const w = width * (1 - k / steps);
      const course = new Mesh(this.unit, look.roof[1]!);
      course.scale.set(0.45, 0.8, w);
      course.position.set(0.05, top + 0.4 + k * 0.8, 0);
      const coping = new Mesh(this.unit, look.trim);
      coping.scale.set(0.55, 0.12, w + 0.1);
      coping.position.set(0.05, top + 0.86 + k * 0.8, 0);
      // A stone ball on each step's outer corners.
      for (const end of [-1, 1]) {
        const finial = new Mesh(this.finial, look.trim);
        finial.position.set(0.05, top + 1.04 + k * 0.8, (end * w) / 2 - end * 0.15);
        group.add(finial);
      }
      course.castShadow = coping.castShadow = true;
      group.add(course, coping);
    }
    // A round window in the second course.
    const oculus = new Mesh(this.oculus, this.iron);
    oculus.rotation.z = Math.PI / 2;
    oculus.position.set(0.29, top + 1.6, 0);
    group.add(oculus);
    return group;
  }

  /**
   * An alley between two houses: setts running back into shade, to a wall lit at the far end
   * under an arch, with the sky over it.
   */
  private alley(wall: Material): Group {
    const group = new Group();
    const deep = 16;
    const floor = new Mesh(this.unit, this.alleyFloor);
    floor.scale.set(deep, 0.1, ALLEY);
    floor.position.set(-deep / 2, -0.05, 0);
    floor.receiveShadow = true;
    const back = new Mesh(this.unit, wall);
    back.scale.set(0.4, 11, ALLEY + 1);
    back.position.set(-deep, 5.5, 0);
    back.receiveShadow = true;
    // An arch spanning the alley a few metres in, carrying a room over it.
    const bridge = new Mesh(this.unit, wall);
    bridge.scale.set(3, 3.4, ALLEY + 0.2);
    bridge.position.set(-6, SHOP + 2.4, 0);
    bridge.castShadow = bridge.receiveShadow = true;
    const window = new Mesh(this.unit, this.iron);
    window.scale.set(0.05, 1.2, 0.9);
    window.position.set(-4.48, SHOP + 2.5, 0);
    group.add(floor, back, bridge, window);
    return group;
  }

  /** A stone step up to each of a home's doors, with bay trees in pots either side. */
  private pots(width: number): Group {
    const group = new Group();
    for (let bay = 0; bay < Math.round(width / (2 * BAY)); bay++) {
      // The door sits in the first third of each two-bay tile.
      const door = -width / 2 + bay * 2 * BAY + 1.25;
      // A worn stone step up to the door.
      const step = new Mesh(this.unit, this.stone);
      step.scale.set(0.45, 0.16, 1.3);
      step.position.set(0.22, 0.08, door);
      step.receiveShadow = true;
      group.add(step);
      for (const dz of [-0.85, 0.85]) {
        if (this.chance(10 + bay * 2 + (dz > 0 ? 1 : 0)) < 0.35) continue;
        const pot = new Mesh(this.pot, this.terracotta);
        pot.position.set(0.35, 0.25, door + dz);
        const bush = new Mesh(this.bush, this.leaves);
        bush.position.set(0.35, 0.95, door + dz);
        bush.scale.set(1, 1.25, 1);
        pot.castShadow = bush.castShadow = true;
        group.add(pot, bush);
      }
    }
    return group;
  }

  /** A flag on a pole angled out from the first floor over the street. */
  private flag(width: number): Group {
    const group = new Group();
    const z = (this.chance(3) - 0.5) * (width - 2);
    const y = SHOP + STOREY + 0.2;
    const pole = new Mesh(this.unit, this.iron);
    pole.scale.set(2.4, 0.05, 0.05);
    pole.position.set(1.0, y + 0.55, z);
    pole.rotation.z = 0.5;
    const cloth = new Mesh(
      this.flagCloth,
      this.houseFlags[Math.floor(this.chance(4) * this.houseFlags.length)]!,
    );
    cloth.rotation.y = Math.PI / 2;
    cloth.position.set(1.7, y - 0.05, z);
    cloth.rotateZ(0.5);
    cloth.castShadow = pole.castShadow = true;
    group.add(pole, cloth);
    return group;
  }

  /** A painted sign on an iron bracket, standing out from the shop over the pavement. */
  private sign(width: number): Group {
    const group = new Group();
    const z = (this.random() - 0.5) * (width - 2);
    const arm = new Mesh(this.unit, this.iron);
    arm.scale.set(1.1, 0.05, 0.05);
    arm.position.set(0.55, SHOP + 0.9, z);
    const board = new Mesh(
      this.signBoard,
      this.signs[Math.floor(this.random() * this.signs.length)]!,
    );
    board.rotation.y = Math.PI / 2;
    board.rotateY(Math.PI / 2);
    board.position.set(0.75, SHOP + 0.5, z);
    arm.castShadow = board.castShadow = true;
    group.add(arm, board);
    return group;
  }

  /** A first-floor balcony the width of the house: a stone slab and a wrought-iron railing. */
  private balcony(stone: Material, width: number): Group {
    const group = new Group();
    const deep = 0.85;
    const floor = SHOP + 0.15;
    const slab = new Mesh(this.unit, stone);
    slab.scale.set(deep, 0.16, width - 0.8);
    slab.position.set(deep / 2, floor, 0);
    slab.castShadow = true;
    group.add(slab);
    const front = new PlaneGeometry(width - 0.8, 0.95);
    const end = new PlaneGeometry(deep, 0.95);
    this.tempGeometries.push(front, end);
    const rail = new Mesh(front, this.railing);
    rail.rotation.y = Math.PI / 2;
    rail.position.set(deep, floor + 0.55, 0);
    group.add(rail);
    for (const z of [-1, 1]) {
      const side = new Mesh(end, this.railing);
      side.position.set(deep / 2, floor + 0.55, (z * (width - 0.8)) / 2);
      group.add(side);
    }
    // Geraniums in pots along the railing, and now and then a bistro table.
    const pots = 2 + Math.floor(this.chance(11) * 3);
    for (let i = 0; i < pots; i++) {
      const z = ((i + 0.5) / pots - 0.5) * (width - 1.6);
      const pot = new Mesh(this.pot, this.terracotta);
      pot.scale.setScalar(0.7);
      pot.position.set(deep - 0.22, floor + 0.25, z);
      const bloom = new Mesh(this.bush, this.geraniums);
      bloom.scale.set(0.75, 0.6, 0.75);
      bloom.position.set(deep - 0.22, floor + 0.62, z);
      group.add(pot, bloom);
    }
    if (this.chance(12) < 0.4) {
      const table = new Mesh(this.pot, this.iron);
      table.scale.set(1.2, 1.4, 1.2);
      table.position.set(0.4, floor + 0.4, 0.3);
      group.add(table);
    }
    for (const m of group.children) m.castShadow = true;
    return group;
  }

  /** A canvas awning over a shop front, sloping down 1.5 m out over the pavement. */
  private awning(material: Material, width: number): Group {
    const group = new Group();
    const out = 1.5;
    const drop = 0.7;
    const slope = Math.hypot(out, drop);
    const canvas = new PlaneGeometry(slope, width - 0.6);
    const sheet = new Mesh(canvas, material);
    sheet.rotation.set(-Math.PI / 2, 0, 0);
    sheet.rotateOnWorldAxis(new Vector3(0, 0, 1), -Math.atan2(drop, out));
    sheet.position.set(out / 2, SHOP - 0.35 - drop / 2, 0);
    const valance = new Mesh(new PlaneGeometry(0.16, width - 0.6), material);
    valance.rotation.set(0, Math.PI / 2, Math.PI / 2);
    valance.position.set(out, SHOP - 0.35 - drop - 0.08, 0);
    for (const m of [sheet, valance]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    group.add(sheet, valance);
    // The valance's scalloped hem.
    const scallops = Math.floor((width - 0.6) / 0.3);
    for (let i = 0; i < scallops; i++) {
      const scallop = new Mesh(this.scallop, material);
      scallop.rotation.y = Math.PI / 2;
      scallop.position.set(out, SHOP - 0.35 - drop - 0.16, (i + 0.5 - scallops / 2) * 0.3);
      group.add(scallop);
    }
    this.tempGeometries.push(canvas, valance.geometry);
    return group;
  }

  /** A moulding `height` high standing `out` proud of the façade, centred `y` above the road. */
  private trim(material: Material, width: number, out: number, height: number, y: number): Mesh {
    const mesh = new Mesh(this.frontUnit, material);
    mesh.scale.set(out + 0.1, height, width);
    mesh.position.set((out - 0.1) / 2, y, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}

/** Unit box without its `-x` face, for mouldings and quoins seated flush against a wall. */
function openBackBox(): BufferGeometry {
  const box = new BoxGeometry(1, 1, 1);
  const src = box.index!.array;
  const indices: number[] = [];
  for (let i = 0; i < src.length; i++) {
    // Face 1 (`indices 6..11`) is the `-x` face buried inside the house wall.
    if (i < 6 || i >= 12) indices.push(src[i]!);
  }
  box.setIndex(indices);
  box.clearGroups();
  return box;
}

function copyMat16(dst: Float32Array, d: number, src: Float32Array, s: number): void {
  for (let k = 0; k < 16; k++) dst[d + k] = src[s + k]!;
}

function copyCol3(dst: Float32Array, d: number, src: Float32Array, s: number): void {
  dst[d] = src[s]!;
  dst[d + 1] = src[s + 1]!;
  dst[d + 2] = src[s + 2]!;
}

function extractSubGeometry(
  geometry: BufferGeometry,
  start: number,
  count: number,
): BufferGeometry {
  const srcIdx = geometry.index!.array;
  const pos = geometry.getAttribute('position') as BufferAttribute;
  const norm = geometry.getAttribute('normal') as BufferAttribute;
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  const remap = new Map<number, number>();
  const newIndices: number[] = [];
  const pOut: number[] = [];
  const nOut: number[] = [];
  const uOut: number[] = [];
  for (let i = start; i < start + count; i++) {
    const oldV = srcIdx[i]!;
    let newV = remap.get(oldV);
    if (newV === undefined) {
      newV = remap.size;
      remap.set(oldV, newV);
      pOut.push(pos.getX(oldV), pos.getY(oldV), pos.getZ(oldV));
      nOut.push(norm.getX(oldV), norm.getY(oldV), norm.getZ(oldV));
      uOut.push(uv.getX(oldV), uv.getY(oldV));
    }
    newIndices.push(newV);
  }
  const sub = new BufferGeometry();
  sub.setAttribute('position', new BufferAttribute(new Float32Array(pOut), 3));
  sub.setAttribute('normal', new BufferAttribute(new Float32Array(nOut), 3));
  sub.setAttribute('uv', new BufferAttribute(new Float32Array(uOut), 2));
  sub.setIndex(newIndices);
  return sub;
}

function prepareBatchGeometry(
  source: BufferGeometry,
  xform: Matrix4,
  vColor?: Color,
  uvMap?: (u: number, v: number) => [number, number],
): BufferGeometry {
  const cloned = source.clone().applyMatrix4(xform);
  const pos = cloned.getAttribute('position') as BufferAttribute;
  const norm = cloned.getAttribute('normal') as BufferAttribute;
  const uv = cloned.getAttribute('uv') as BufferAttribute;
  const vCount = pos.count;
  const out = new BufferGeometry();
  out.setAttribute('position', new BufferAttribute(new Float32Array(pos.array), 3));
  out.setAttribute('normal', new BufferAttribute(new Float32Array(norm.array), 3));
  const uvArr = new Float32Array(vCount * 2);
  for (let i = 0; i < vCount; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    if (uvMap) {
      const [nu, nv] = uvMap(u, v);
      uvArr[i * 2] = nu;
      uvArr[i * 2 + 1] = nv;
    } else {
      uvArr[i * 2] = u;
      uvArr[i * 2 + 1] = v;
    }
  }
  out.setAttribute('uv', new BufferAttribute(uvArr, 2));
  if (vColor) {
    const cArr = new Float32Array(vCount * 3);
    for (let i = 0; i < vCount; i++) {
      cArr[i * 3] = vColor.r;
      cArr[i * 3 + 1] = vColor.g;
      cArr[i * 3 + 2] = vColor.b;
    }
    out.setAttribute('color', new BufferAttribute(cArr, 3));
  }
  if (cloned.index) {
    out.setIndex(Array.from(cloned.index.array));
  } else {
    const seq = new Array<number>(vCount);
    for (let i = 0; i < vCount; i++) seq[i] = i;
    out.setIndex(seq);
  }
  cloned.dispose();
  return out;
}

/**
 * A box whose road-facing (+x) side shows one texture tile per window bay and storey. `below`
 * metres of the box sit under the first storey and repeat the tile's base colour.
 */
function tiledBox(
  depth: number,
  height: number,
  width: number,
  storey: number,
  below: number,
  bay = BAY,
): BoxGeometry {
  const box = new BoxGeometry(depth, height, width);
  const uv = box.getAttribute('uv') as BufferAttribute;
  const bays = Math.max(1, Math.round(width / bay));
  // Faces: +x, -x, +y, -y, +z, -z; four vertices each.
  for (let face = 0; face < 6; face++) {
    const across = face < 2 ? bays : face >= 4 ? Math.max(1, Math.round(depth / bay)) : 1;
    const up = face < 2 || face >= 4 ? height / storey : 1;
    for (let v = face * 4; v < face * 4 + 4; v++) {
      uv.setXY(v, uv.getX(v) * across, Math.max(0, uv.getY(v) * up - below / storey));
    }
  }
  uv.needsUpdate = true;
  return box;
}

/** One upper-storey wall course without interior top/bottom caps (`+x`, `-x`, `+z`, `-z` only). */
function storeyCourse(depth: number, storey: number, width: number): BufferGeometry {
  const box = tiledBox(depth, storey, width, storey, 0);
  const src = box.index!.array;
  const indices: number[] = [];
  for (let i = 0; i < src.length; i++) {
    // Faces 2 and 3 (`indices 12..23`) are the `+y` and `-y` caps hidden under the roof/between floors.
    if (i < 12 || i >= 24) indices.push(src[i]!);
  }
  box.setIndex(indices);
  box.clearGroups();
  return box;
}

/** Stacks horizontally repeating (`wrapS`) façade tiles vertically with edge-extruded gutters. */
function stackedFacadeAtlas(
  sources: readonly CanvasTexture[],
  w: number,
  innerH: number,
  pad: number,
): { texture: CanvasTexture; bands: [number, number][] } {
  const rowH = innerH + 2 * pad;
  const H = sources.length * rowH;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const bands: [number, number][] = [];
  sources.forEach((srcTex, i) => {
    const img = srcTex.image as HTMLCanvasElement;
    const sw = img.width;
    const sh = img.height;
    const cy = i * rowH;
    const iy = cy + pad;
    if (ctx) {
      ctx.drawImage(img, 0, iy, w, innerH);
      ctx.drawImage(img, 0, 0, sw, 1, 0, cy, w, pad);
      ctx.drawImage(img, 0, sh - 1, sw, 1, 0, iy + innerH, w, pad);
    }
    srcTex.dispose();
    bands.push([1 - (iy + innerH - 0.5) / H, 1 - (iy + 0.5) / H]);
  });
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return { texture, bands };
}

/**
 * A roof: a triangular prism `rise` high on a `depth` × `width` base, ridge along z. Group 0 is
 * the two tiled slopes, group 1 the gables at either end. UVs are in metres.
 */
function prism(depth: number, rise: number, width: number): BufferGeometry {
  const d = depth / 2;
  const w = width / 2;
  const slope = Math.hypot(d, rise);
  // prettier-ignore
  const vertices = [
    // the slope towards +x
    d, 0, -w,   d, 0, w,   0, rise, w,   0, rise, -w,
    // the slope towards -x
    -d, 0, w,   -d, 0, -w,   0, rise, -w,   0, rise, w,
    // the gable at +z and at -z
    d, 0, w,   -d, 0, w,   0, rise, w,
    -d, 0, -w,   d, 0, -w,   0, rise, -w,
  ];
  // prettier-ignore
  const uvs = [
    0, 0,   width, 0,   width, slope,   0, slope,
    0, 0,   width, 0,   width, slope,   0, slope,
    0, 0,   depth, 0,   d, rise,
    0, 0,   depth, 0,   d, rise,
  ];
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex([0, 3, 2, 0, 2, 1, 4, 7, 6, 4, 6, 5, 8, 10, 9, 11, 13, 12]);
  geometry.addGroup(0, 12, 0);
  geometry.addGroup(12, 6, 1);
  geometry.computeVertexNormals();
  return geometry;
}

/** Clay roof tiles, one metre of roof per repeat: courses of rounded tiles, each a shade apart. */
function tileTexture(color: string): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    const random = seeded(color.charCodeAt(2));
    const course = size / 4;
    const tile = size / 6;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        const x = col * tile + (row % 2 ? tile / 2 : 0) - tile / 2;
        const y = row * course;
        const shade = random() * 0.22 - 0.11;
        ctx.fillStyle = shade < 0 ? `rgba(0,0,0,${-shade})` : `rgba(255,220,190,${shade})`;
        ctx.fillRect(x + 1, y, tile - 2, course);
        const g = ctx.createLinearGradient(x, 0, x + tile, 0);
        g.addColorStop(0, 'rgba(0,0,0,0.28)');
        g.addColorStop(0.45, 'rgba(255,255,255,0.08)');
        g.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, tile, course);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, row * course + course - 3, size, 3);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Two bays of a home's ground floor: a panelled door under a fanlight, and a barred window. */
function homeTexture(palette: Palette): CanvasTexture {
  const w = 384;
  const h = 268;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = palette.wall;
    ctx.fillRect(0, 0, w, h);
    const random = seeded(palette.wall.length + 7);
    const darkPath = new Path2D();
    const lightPath = new Path2D();
    for (let i = 0; i < 1600; i++) {
      const p = random() < 0.5 ? darkPath : lightPath;
      p.rect(random() * w, random() * h, 2 + random() * 6, 2 + random() * 6);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.035)';
    ctx.fill(darkPath);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill(lightPath);
    // Rusticated stone up to the sills.
    ctx.fillStyle = 'rgba(70,55,40,0.16)';
    ctx.fillRect(0, h - 70, w, 70);
    ctx.fillStyle = 'rgba(40,30,20,0.25)';
    for (let y = h - 70; y < h; y += 22) ctx.fillRect(0, y, w, 2);
    // The door: stone surround, fanlight, two panelled leaves.
    const door = palette.shutter ?? '#5b3a2a';
    const dx = 52;
    const dw = 88;
    const dt = 46;
    ctx.fillStyle = palette.trim;
    ctx.beginPath();
    ctx.roundRect(dx - 12, dt - 12, dw + 24, h - dt + 12, [56, 56, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#2b3138';
    ctx.beginPath();
    ctx.roundRect(dx, dt, dw, 50, [44, 44, 0, 0]);
    ctx.fill();
    ctx.fillStyle = 'rgba(190,215,235,0.35)';
    ctx.fillRect(dx, dt + 20, dw, 30);
    ctx.fillStyle = door;
    ctx.fillRect(dx, dt + 50, dw, h - dt - 50);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(dx + dw / 2 - 1, dt + 50, 2, h - dt - 50);
    for (const px of [dx + 8, dx + dw / 2 + 6]) {
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, dt + 62, dw / 2 - 14, 60);
      ctx.strokeRect(px, dt + 132, dw / 2 - 14, h - dt - 150);
    }
    ctx.fillStyle = '#c9a54a';
    ctx.fillRect(dx + dw / 2 - 10, dt + 130, 4, 10);
    // The window, behind iron bars.
    const wx = 236;
    const wy = 62;
    const ww = 92;
    const wh = 130;
    ctx.fillStyle = palette.trim;
    ctx.fillRect(wx - 8, wy - 8, ww + 16, wh + 22);
    ctx.fillStyle = '#2b3138';
    ctx.fillRect(wx, wy, ww, wh);
    const glass = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
    glass.addColorStop(0, 'rgba(170,200,220,0.55)');
    glass.addColorStop(0.6, 'rgba(70,80,90,0.1)');
    ctx.fillStyle = glass;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#1d1f22';
    for (let bx = wx + 8; bx < wx + ww; bx += 14) ctx.fillRect(bx, wy - 4, 3, wh + 6);
    ctx.fillRect(wx - 2, wy + 40, ww + 4, 3);
    ctx.fillRect(wx - 2, wy + 90, ww + 4, 3);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** One bay of a façade: an upper storey's shuttered window, or the shop floor's window. */
function bayTexture(palette: Palette, shop: boolean, closed = false): CanvasTexture {
  const w = 192;
  const h = shop ? 268 : 205;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = palette.wall;
    ctx.fillRect(0, 0, w, h);
    const random = seeded(palette.wall.length + (shop ? 3 : 1));
    const darkPath = new Path2D();
    const lightPath = new Path2D();
    for (let i = 0; i < 900; i++) {
      const p = random() < 0.5 ? darkPath : lightPath;
      p.rect(random() * w, random() * h, 2 + random() * 6, 2 + random() * 6);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.035)';
    ctx.fill(darkPath);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill(lightPath);
    // Weathering: grime splashed up from the street, and rain streaks under each sill.
    const grime = ctx.createLinearGradient(0, h * 0.7, 0, h);
    grime.addColorStop(0, 'rgba(60,50,40,0)');
    grime.addColorStop(1, shop ? 'rgba(60,50,40,0.28)' : 'rgba(60,50,40,0.08)');
    ctx.fillStyle = grime;
    ctx.fillRect(0, 0, w, h);
    if (shop) {
      // A stone plinth, and a shop front in painted wood: a lit window above a panel.
      ctx.fillStyle = 'rgba(60,45,35,0.25)';
      ctx.fillRect(0, h - 26, w, 26);
      const x = 22;
      const top = 54;
      const ww = w - 44;
      const bottom = h - 26;
      const frame = palette.shutter ?? '#3e4a52';
      ctx.fillStyle = frame;
      ctx.fillRect(x - 8, top - 10, ww + 16, bottom - top + 10);
      // The interior: warm light falling off towards the ceiling, shelves and goods.
      const inside = ctx.createLinearGradient(0, top, 0, bottom - 40);
      inside.addColorStop(0, '#3a2c22');
      inside.addColorStop(1, '#b98a55');
      ctx.fillStyle = inside;
      ctx.fillRect(x, top, ww, bottom - top - 40);
      // Each palette keeps a trade: books, bread, flowers or clothes.
      const trade = Math.max(0, PALETTES.indexOf(palette)) % 4;
      const floor = bottom - 40;
      if (trade === 0 || trade === 1) {
        for (let shelf = top + 34; shelf < floor - 10; shelf += 34) {
          ctx.fillStyle = 'rgba(40,25,15,0.7)';
          ctx.fillRect(x, shelf, ww, 4);
          for (
            let gx = x + 4;
            gx < x + ww - 8;
            gx += trade ? 16 + random() * 6 : 9 + random() * 8
          ) {
            if (trade === 0) {
              ctx.fillStyle = ['#d9c39a', '#a8453a', '#e8e1cf', '#5b7a52', '#c98a3a'][
                Math.floor(random() * 5)
              ]!;
              const gh = 8 + random() * 16;
              ctx.fillRect(gx, shelf - gh, 6, gh);
            } else {
              // Loaves: round cobs and long batons, crusted gold to brown.
              ctx.fillStyle = ['#c98a3a', '#a5652a', '#e0b066'][Math.floor(random() * 3)]!;
              ctx.beginPath();
              ctx.ellipse(gx + 6, shelf - 6, random() < 0.5 ? 7 : 11, 6, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      } else if (trade === 2) {
        // Buckets of cut flowers banked up the window.
        for (let row = 0; row < 3; row++) {
          for (let gx = x + 6 + row * 6; gx < x + ww - 10; gx += 18) {
            const by = floor - 8 - row * 26;
            ctx.fillStyle = '#6e7378';
            ctx.fillRect(gx, by, 12, 10);
            ctx.fillStyle = '#4f7d3d';
            ctx.fillRect(gx + 2, by - 10, 8, 10);
            ctx.fillStyle = ['#e8607a', '#f2d24a', '#f4f2ea', '#c41e3a', '#a67fd0'][
              Math.floor(random() * 5)
            ]!;
            ctx.beginPath();
            ctx.arc(gx + 6, by - 12, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        // A rail of clothes, and two dressed mannequins in the window.
        ctx.fillStyle = 'rgba(40,25,15,0.8)';
        ctx.fillRect(x + 6, top + 16, ww - 12, 3);
        for (let gx = x + 10; gx < x + ww - 14; gx += 7) {
          ctx.fillStyle = ['#2d3b55', '#c9372c', '#e8e1cf', '#2f5d4a', '#1f2328'][
            Math.floor(random() * 5)
          ]!;
          ctx.fillRect(gx, top + 19, 6, 34);
        }
        for (const mx of [x + ww * 0.28, x + ww * 0.72]) {
          ctx.fillStyle = '#e9dccb';
          ctx.beginPath();
          ctx.arc(mx, top + 70, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = ['#c9372c', '#2d3b55', '#e2b23a'][Math.floor(random() * 3)]!;
          ctx.beginPath();
          ctx.moveTo(mx - 12, top + 80);
          ctx.lineTo(mx + 12, top + 80);
          ctx.lineTo(mx + 18, floor - 6);
          ctx.lineTo(mx - 18, floor - 6);
          ctx.fill();
        }
      }
      // Sky and street mirrored in the glass.
      const glass = ctx.createLinearGradient(x, top, x + ww, bottom);
      glass.addColorStop(0, 'rgba(200,225,240,0.45)');
      glass.addColorStop(0.35, 'rgba(200,225,240,0.08)');
      glass.addColorStop(0.55, 'rgba(255,255,255,0.18)');
      glass.addColorStop(0.7, 'rgba(200,225,240,0.04)');
      ctx.fillStyle = glass;
      ctx.fillRect(x, top, ww, bottom - top - 40);
      ctx.fillStyle = frame;
      ctx.fillRect(x + ww / 2 - 3, top, 6, bottom - top - 40);
      ctx.fillRect(x, top + 30, ww, 4);
      // The panel under the window, and the sign band above it.
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + 6, bottom - 34, ww / 2 - 12, 26);
      ctx.fillRect(x + ww / 2 + 6, bottom - 34, ww / 2 - 12, 26);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x - 8, top - 10, ww + 16, 4);
    } else {
      const ww = 62;
      const wh = 118;
      const x = (w - ww) / 2;
      const y = 44;
      if (palette.shutter && !closed) {
        ctx.fillStyle = palette.shutter;
        ctx.fillRect(x - 34, y, 32, wh);
        ctx.fillRect(x + ww + 2, y, 32, wh);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let ly = y + 6; ly < y + wh; ly += 8) {
          ctx.fillRect(x - 32, ly, 28, 2);
          ctx.fillRect(x + ww + 4, ly, 28, 2);
        }
      }
      ctx.fillStyle = palette.trim;
      ctx.fillRect(x - 6, y - 8, ww + 12, wh + 18);
      ctx.fillStyle = '#2b3138';
      ctx.fillRect(x, y, ww, wh);
      // The glass mirrors the sky above and the sunlit houses across the street below.
      const glass = ctx.createLinearGradient(x, y, x, y + wh);
      glass.addColorStop(0, 'rgba(178,208,232,0.75)');
      glass.addColorStop(0.45, 'rgba(120,150,175,0.35)');
      glass.addColorStop(0.55, 'rgba(196,160,120,0.3)');
      glass.addColorStop(1, 'rgba(90,70,55,0.25)');
      ctx.fillStyle = glass;
      ctx.fillRect(x, y, ww, wh);
      // A curtain drawn to one side inside.
      ctx.fillStyle = 'rgba(236,228,212,0.55)';
      ctx.fillRect(random() < 0.5 ? x + 2 : x + ww - 12, y + 2, 10, wh - 4);
      const glint = ctx.createLinearGradient(x, y, x + ww, y + wh);
      glint.addColorStop(0.2, 'rgba(255,255,255,0)');
      glint.addColorStop(0.3, 'rgba(255,255,255,0.28)');
      glint.addColorStop(0.4, 'rgba(255,255,255,0)');
      ctx.fillStyle = glint;
      ctx.fillRect(x, y, ww, wh);
      ctx.fillStyle = palette.trim;
      ctx.fillRect(x + ww / 2 - 2, y, 4, wh);
      ctx.fillRect(x, y + wh * 0.38, ww, 4);
      if (closed && palette.shutter) {
        // Both leaves shut against the afternoon sun.
        ctx.fillStyle = palette.shutter;
        ctx.fillRect(x, y, ww, wh);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let ly = y + 6; ly < y + wh; ly += 8) ctx.fillRect(x + 2, ly, ww - 4, 2);
        ctx.fillRect(x + ww / 2 - 1, y, 2, wh);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x - 8, y + wh + 10, ww + 16, 4);
      for (let i = 0; i < 7; i++) {
        const sx = x - 4 + random() * (ww + 8);
        const streak = ctx.createLinearGradient(0, y + wh + 14, 0, h);
        streak.addColorStop(0, 'rgba(70,60,50,0.16)');
        streak.addColorStop(1, 'rgba(70,60,50,0)');
        ctx.fillStyle = streak;
        ctx.fillRect(sx, y + wh + 14, 2 + random() * 4, h - y - wh - 14);
      }
      if (palette.flowers) {
        // A window box of geraniums on the sill.
        const by = y + wh + 2;
        ctx.fillStyle = '#6b4a33';
        ctx.fillRect(x - 6, by, ww + 12, 14);
        for (let i = 0; i < 46; i++) {
          const fx = x - 6 + random() * (ww + 12);
          const fy = by - 2 - random() * 16;
          ctx.fillStyle = random() < 0.45 ? '#3f6b35' : '#4f7d3c';
          ctx.beginPath();
          ctx.arc(fx, fy + 6, 3 + random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = palette.flowers;
          ctx.beginPath();
          ctx.arc(x - 4 + random() * (ww + 8), by - 4 - random() * 14, 2.5 + random() * 2, 0, 7);
          ctx.fill();
        }
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * The cobbled road, one 10 m tile 7 m across (L2-111 technique 9): rows of setts across the
 * road, each its own shade of granite, with dark joints, and white edge lines for the race.
 */
export function cobbleTextures(): { map: CanvasTexture; relief: CanvasTexture } {
  const w = 1024;
  const h = 1024;
  const pxX = w / 7;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // The height of the road: each sett domed, the joints sunk between them.
  const heights = document.createElement('canvas');
  heights.width = w;
  heights.height = h;
  const hctx = heights.getContext('2d');
  if (ctx && hctx) {
    hctx.fillStyle = '#000';
    hctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#76706a';
    ctx.fillRect(0, 0, w, h);
    const random = seeded(23);
    const sett = 0.13;
    const rows = Math.round(10 / sett);
    const rowH = h / rows;
    // Stamp a reusable domed sett height tile rather than allocating 4,200 radial gradients.
    const stamp = document.createElement('canvas');
    stamp.width = 48;
    stamp.height = 32;
    const sctx = stamp.getContext('2d');
    if (sctx) {
      const dome = sctx.createRadialGradient(24, 16, 1, 24, 16, 28);
      dome.addColorStop(0, '#fff');
      dome.addColorStop(1, '#5a5a5a');
      sctx.fillStyle = dome;
      roundRect(sctx, 0, 0, 48, 32, 6);
    }
    for (let row = 0; row < rows; row++) {
      const y = row * rowH;
      const g = ctx.createLinearGradient(0, y, 0, y + rowH);
      g.addColorStop(0, 'rgba(255,255,255,0.16)');
      g.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.18)');
      const rowPath = new Path2D();
      let x = row % 2 ? -0.5 * sett * pxX : 0;
      while (x < w) {
        const sw = (0.11 + random() * 0.06) * pxX;
        // Setts in the wheel tracks are polished by the traffic: a shade lighter, less varied.
        const centre = Math.abs(x / w - 0.5);
        const worn = centre < 0.18 ? 14 : 0;
        const tone = 165 + worn + random() * (worn ? 34 : 50);
        const warm = random() * 16;
        const rx = x + 1.5;
        const ry = y + 1.5;
        const rw = sw - 3;
        const rh = rowH - 3;
        ctx.fillStyle = `rgb(${tone + warm},${tone + warm * 0.6},${tone})`;
        roundRect(ctx, rx, ry, rw, rh, 4);
        rowPath.roundRect(rx, ry, rw, rh, 4);
        hctx.drawImage(stamp, rx, ry, rw, rh);
        x += sw;
      }
      ctx.fillStyle = g;
      ctx.fill(rowPath);
    }
    // The gutters: a channel of long granite slabs along each kerb, dished and darker.
    const gutter = 0.32 * pxX;
    for (const gx of [0, w - gutter]) {
      ctx.fillStyle = '#6f6a63';
      ctx.fillRect(gx, 0, gutter, h);
      hctx.fillStyle = '#9a9a9a';
      hctx.fillRect(gx, 0, gutter, h);
      for (let y = 0; y < h; y += 0.6 * (h / 10)) {
        const tone = 120 + random() * 30;
        ctx.fillStyle = `rgb(${tone},${tone - 4},${tone - 10})`;
        ctx.fillRect(gx + 2, y + 2, gutter - 4, 0.6 * (h / 10) - 4);
      }
      const dish = ctx.createLinearGradient(gx, 0, gx + gutter, 0);
      const dark = gx === 0 ? 1 : 0;
      dish.addColorStop(dark, 'rgba(30,25,20,0.35)');
      dish.addColorStop(1 - dark, 'rgba(30,25,20,0)');
      ctx.fillStyle = dish;
      ctx.fillRect(gx, 0, gutter, h);
      // A cast-iron drain grate in each gutter, the two sides out of step.
      const gy = (gx === 0 ? 0.22 : 0.68) * h;
      const gl = 0.55 * (h / 10);
      ctx.fillStyle = '#3b3d40';
      ctx.fillRect(gx + 4, gy, gutter - 8, gl);
      ctx.fillStyle = '#17181a';
      for (let sy = gy + 6; sy < gy + gl - 6; sy += 9) ctx.fillRect(gx + 9, sy, gutter - 18, 4);
      hctx.fillStyle = '#6a6a6a';
      hctx.fillRect(gx + 4, gy, gutter - 8, gl);
      hctx.fillStyle = '#303030';
      for (let sy = gy + 6; sy < gy + gl - 6; sy += 9) hctx.fillRect(gx + 9, sy, gutter - 18, 4);
    }
    ctx.fillStyle = '#f1f0ea';
    ctx.fillRect(0.42 * pxX, 0, 0.1 * pxX, h);
    ctx.fillRect(w - 0.52 * pxX, 0, 0.1 * pxX, h);
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  const relief = new CanvasTexture(hctx ? normalsFrom(hctx, w, h, 9) : heights);
  for (const t of [map, relief]) {
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
  }
  return { map, relief };
}

/** A tangent-space normal map from a height canvas, `strength` steepening its slopes. */
function normalsFrom(
  heights: CanvasRenderingContext2D,
  w: number,
  h: number,
  strength: number,
): HTMLCanvasElement {
  const source = heights.getImageData(0, 0, w, h).data;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const out = ctx.createImageData(w, h);
  const dst32 = new Uint32Array(out.data.buffer);
  const scale = strength / 255;
  const writePixel = (idx: number, left: number, right: number, up: number, down: number) => {
    const dx = (source[right * 4]! - source[left * 4]!) * scale;
    // The canvas runs down the texture's v: a rise down the canvas tips the normal to +v.
    const dy = (source[down * 4]! - source[up * 4]!) * scale;
    const invLen = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    const r = ((-dx * invLen * 0.5 + 0.5) * 255 + 0.5) | 0;
    const g = ((dy * invLen * 0.5 + 0.5) * 255 + 0.5) | 0;
    const b = ((invLen * 0.5 + 0.5) * 255 + 0.5) | 0;
    dst32[idx] = (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  };
  const lastX = w - 1;
  for (let y = 0; y < h; y++) {
    const yPrev = (y === 0 ? h - 1 : y - 1) * w;
    const yRow = y * w;
    const yNext = (y + 1 === h ? 0 : y + 1) * w;
    writePixel(yRow, yRow + lastX, yRow + 1, yPrev, yNext);
    for (let x = 1; x < lastX; x++) {
      const idx = yRow + x;
      writePixel(idx, idx - 1, idx + 1, yPrev + x, yNext + x);
    }
    writePixel(yRow + lastX, yRow + lastX - 1, yRow, yPrev + lastX, yNext + lastX);
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/**
 * Cathedral stone atlas (`256 × 528` with 4 px gutters): lancet windows with tracery (top) and
 * spire openwork quatrefoils (bottom), sharing one material across the cathedral.
 */
function gothicAtlasTexture(): {
  texture: CanvasTexture;
  lancets: UvRect;
  openwork: UvRect;
} {
  const W = 256;
  const tile = 256;
  const pad = 4;
  const rowH = tile + 2 * pad;
  const H = 2 * rowH;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const paintTile = (open: boolean, cy: number): UvRect => {
    const iy = cy + pad;
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, cy, W, rowH);
      const random = seeded(open ? 61 : 59);
      const buckets = [new Path2D(), new Path2D(), new Path2D()];
      for (let i = 0; i < 1400; i++) {
        const b = Math.min(2, Math.floor(random() * 3));
        buckets[b]!.rect(random() * W, iy + random() * tile, 2 + random() * 5, 1 + random() * 3);
      }
      [0.03, 0.06, 0.1].forEach((alpha, idx) => {
        ctx.fillStyle = `rgba(90,75,55,${alpha})`;
        ctx.fill(buckets[idx]!);
      });
      ctx.fillStyle = 'rgba(60,50,40,0.12)';
      const courses = new Path2D();
      for (let y = 0; y < tile; y += 8) courses.rect(0, iy + y, W, 1);
      ctx.fill(courses);
      ctx.fillStyle = '#3a3c44';
      if (open) {
        const holes = new Path2D();
        for (let row = 0; row < 10; row++) {
          const y = iy + 12 + row * 24;
          for (let col = 0; col < 8; col++) {
            const x = 16 + col * 32;
            holes.moveTo(x + 6, y);
            holes.arc(x, y, 6, 0, Math.PI * 2);
          }
        }
        ctx.fill(holes);
      } else {
        for (let col = 0; col < 3; col++) {
          const x = 30 + col * 80;
          const w = 36;
          ctx.beginPath();
          ctx.moveTo(x, iy + 230);
          ctx.lineTo(x, iy + 70);
          ctx.quadraticCurveTo(x, iy + 34, x + w / 2, iy + 22);
          ctx.quadraticCurveTo(x + w, iy + 34, x + w, iy + 70);
          ctx.lineTo(x + w, iy + 230);
          ctx.fill();
          ctx.fillStyle = 'rgba(220,205,175,0.9)';
          ctx.fillRect(x + w / 2 - 2, iy + 40, 4, 190);
          ctx.fillRect(x, iy + 120, w, 4);
          ctx.fillStyle = '#3a3c44';
        }
      }
    }
    return {
      u0: 0.5 / W,
      u1: (W - 0.5) / W,
      v0: 1 - (iy + tile - 0.5) / H,
      v1: 1 - (iy + 0.5) / H,
    };
  };
  const lancets = paintTile(false, 0);
  const openwork = paintTile(true, rowH);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, lancets, openwork };
}

/** The TV moto's back board: white letters on the broadcaster's blue. */
function tvBoardTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#2456a6';
    ctx.fillRect(0, 0, 100, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TV', 50, 38);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A cast-iron cover: a raised ring, a cross-hatched field and the water board's letters. */
function coverTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#3c3a38';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#6a6762';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#55524e';
    for (let i = -64; i < 64; i += 10) {
      ctx.beginPath();
      ctx.moveTo(64 + i, 8);
      ctx.lineTo(64 + i + 40, 120);
      ctx.moveTo(64 + i + 40, 8);
      ctx.lineTo(64 + i, 120);
      ctx.stroke();
    }
    ctx.fillStyle = '#3c3a38';
    ctx.fillRect(34, 52, 60, 24);
    ctx.fillStyle = '#77736c';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EAU', 64, 65);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Where a shop bay glows: aligned with each row of `shopAtlas` (`rows` repeats vertically). */
function shopGlowTexture(rows: number, innerH: number, pad: number): CanvasTexture {
  const w = 192;
  const rowH = innerH + 2 * pad;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = rowH;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, rowH);
    const scaleY = innerH / 268;
    const y0 = pad + 54 * scaleY;
    const y1 = pad + (268 - 66) * scaleY;
    const glow = ctx.createLinearGradient(0, y0, 0, y1);
    glow.addColorStop(0, '#202020');
    glow.addColorStop(1, '#ffffff');
    ctx.fillStyle = glow;
    ctx.fillRect(22, y0, w - 44, y1 - y0);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, rows);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function fasciaTexture(trade: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 42;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1c2a24';
    ctx.fillRect(0, 0, 520, 42);
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 512, 34);
    ctx.fillStyle = '#d9b45a';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(trade.split('').join(' '), 260, 23);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function shopDoorTexture(paint: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 88;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = paint;
    ctx.fillRect(0, 0, 88, 200);
    // The glazed upper panel, showing the lit shop inside.
    const inside = ctx.createLinearGradient(0, 14, 0, 120);
    inside.addColorStop(0, '#4a3a2c');
    inside.addColorStop(1, '#c79a62');
    ctx.fillStyle = inside;
    ctx.fillRect(12, 14, 64, 106);
    ctx.fillStyle = 'rgba(210,230,245,0.3)';
    ctx.fillRect(12, 14, 64, 40);
    // The lower panel, the kick plate and the brass handle.
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(14, 134, 60, 44);
    ctx.fillStyle = '#b08d3a';
    ctx.fillRect(70, 112, 5, 22);
    ctx.fillRect(10, 186, 68, 8);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function remapUv<T extends BufferGeometry>(geometry: T, rect: UvRect): T {
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(
      i,
      rect.u0 + uv.getX(i) * (rect.u1 - rect.u0),
      rect.v0 + uv.getY(i) * (rect.v1 - rect.v0),
    );
  }
  uv.needsUpdate = true;
  return geometry;
}

function uvPlane(w: number, h: number, rect: UvRect): PlaneGeometry {
  return remapUv(new PlaneGeometry(w, h), rect);
}

/** Stacked cloth street banners (`STREET_BANNERS`) in one `512 × 384` atlas with 4 px gutters. */
function clothBannerAtlasTexture(banners: readonly (readonly [string, string, string])[]): {
  texture: CanvasTexture;
  rects: UvRect[];
} {
  const W = 512;
  const rowH = 128;
  const pad = 4;
  const dh = rowH - 2 * pad;
  const H = banners.length * rowH;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const rects: UvRect[] = [];
  banners.forEach(([text, fill, ink], i) => {
    const cy = i * rowH;
    const iy = cy + pad;
    if (ctx) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, cy, W, rowH);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 4;
      ctx.strokeRect(8, iy + 8, W - 16, dh - 16);
      ctx.fillStyle = ink;
      ctx.font = 'bold 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, iy + dh * 0.52, W - 44);
    }
    rects.push({
      u0: 0.5 / W,
      u1: (W - 0.5) / W,
      v0: 1 - (iy + dh - 0.5) / H,
      v1: 1 - (iy + 0.5) / H,
    });
  });
  if (ctx) {
    const folds = ctx.createLinearGradient(0, 0, W, 0);
    for (let i = 0; i <= 6; i++) {
      folds.addColorStop(i / 6, i % 2 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)');
    }
    ctx.fillStyle = folds;
    ctx.fillRect(0, 0, W, H);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, rects };
}

/** Fans' road-painted slogans (`ROAD_PAINT`) packed into one `1024 × 560` transparent atlas. */
function roadPaintAtlasTexture(slogans: readonly (readonly [string, string, number])[]): {
  texture: CanvasTexture;
  rects: UvRect[];
} {
  const colW = 256;
  const H = 560;
  const pad = 4;
  const dw = colW - 2 * pad;
  const dh = H - 2 * pad;
  const W = slogans.length * colW;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const rects: UvRect[] = [];
  slogans.forEach(([text, colour], i) => {
    const ix = i * colW + pad;
    const iy = pad;
    if (ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ix, iy, dw, dh);
      ctx.clip();
      ctx.fillStyle = colour;
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.setTransform(1, 0, 0, 7, ix + dw / 2, iy + dh / 2);
      ctx.fillText(text, 0, 0, dw - 10);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      const random = seeded(text.length * 31);
      const wear = new Path2D();
      for (let k = 0; k < 2400; k++) {
        wear.rect(ix + random() * dw, iy + random() * dh, 0.5 + random() * 2, 1 + random() * 4);
      }
      ctx.fill(wear);
      ctx.restore();
    }
    rects.push({
      u0: (ix + 0.5) / W,
      u1: (ix + dw - 0.5) / W,
      v0: 1 - (iy + dh - 0.5) / H,
      v1: 1 - (iy + 0.5) / H,
    });
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, rects };
}

/** Lamp-post pennants packed side by side into one `128 × 128` cutout atlas: `'O' 'T' 'C'` on cloth. */
function pennantAtlasTexture(colours: readonly (readonly [string, string])[]): {
  texture: CanvasTexture;
  rects: UvRect[];
} {
  const colW = 64;
  const W = colours.length * colW;
  const H = 128;
  const dw = 50;
  const dh = 110;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const rects: UvRect[] = [];
  colours.forEach(([fill, ink], i) => {
    const ix = i * colW + 7;
    const iy = 9;
    if (ctx) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix + dw, iy);
      ctx.lineTo(ix + dw, iy + dh);
      ctx.lineTo(ix + dw / 2, iy + 92);
      ctx.lineTo(ix, iy + dh);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ['O', 'T', 'C'].forEach((letter, k) => ctx.fillText(letter, ix + dw / 2, iy + 20 + k * 24));
    }
    rects.push({
      u0: ix / W,
      u1: (ix + dw) / W,
      v0: 1 - (iy + dh) / H,
      v1: 1 - iy / H,
    });
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, rects };
}

/** Granite kerbstones a metre long: speckled grey, each a shade apart, butted at fine joints. */
function kerbTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const random = seeded(83);
    for (let stone = 0; stone < 4; stone++) {
      const tone = 140 + random() * 30;
      ctx.fillStyle = `rgb(${tone},${tone},${tone - 4})`;
      ctx.fillRect(0, stone * 64, 32, 64);
      ctx.fillStyle = 'rgba(50,50,50,0.6)';
      ctx.fillRect(0, stone * 64, 32, 2);
    }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(30,30,30,0.25)' : 'rgba(255,255,255,0.25)';
      ctx.fillRect(random() * 32, random() * 256, 1, 1);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  // A metre of kerb across its face and top, four stones along every four metres.
  texture.repeat.set(1 / 0.4, 1 / 4);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A gutter's damp line across 40 cm: clear on the road side, wettest against the kerb. */
function dampTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const wet = ctx.createLinearGradient(0, 0, 64, 0);
    wet.addColorStop(0, '#000');
    wet.addColorStop(0.4, '#5a5a5a');
    wet.addColorStop(1, '#d0d0d0');
    ctx.fillStyle = wet;
    ctx.fillRect(0, 0, 64, 64);
    // Dry breaks along it, where the water has run off.
    const random = seeded(89);
    ctx.fillStyle = '#000';
    for (let i = 0; i < 6; i++) ctx.fillRect(0, random() * 64, 64, 2 + random() * 6);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / 0.4, 1 / 6);
  return texture;
}

/** Corner shade across 1.4 m of pavement: clear at the outer edge, darkest at the wall. */
function cornerTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const shade = ctx.createLinearGradient(0, 0, 64, 0);
    shade.addColorStop(0, '#000');
    shade.addColorStop(0.45, '#2a2a2a');
    shade.addColorStop(0.64, '#707070');
    shade.addColorStop(1, '#808080');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 64, 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.repeat.set(1 / 1.4, 1);
  return texture;
}

function leafTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#2f5528';
    ctx.fillRect(0, 0, 256, 128);
    const random = seeded(67);
    const tones = [76, 90, 104, 118, 132];
    const paths = tones.map(() => new Path2D());
    for (let i = 0; i < 1400; i++) {
      const bucket = Math.min(4, Math.floor(random() * 5));
      paths[bucket]!.ellipse(
        random() * 256,
        random() * 128,
        3,
        1.6,
        random() * Math.PI,
        0,
        Math.PI * 2,
      );
    }
    tones.forEach((g, idx) => {
      ctx.fillStyle = `rgb(${Math.round(g * 0.45)},${g},${Math.round(g * 0.38)})`;
      ctx.fill(paths[idx]!);
    });
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Geraniums: a trailing green mass dotted with red and pink heads. */
function bloomTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#3d6a32';
    ctx.fillRect(0, 0, 128, 64);
    const random = seeded(61);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = ['#2f5528', '#4f8040', '#d8323a', '#e8607a', '#c41e3a'][
        Math.floor(random() * 5)
      ]!;
      ctx.beginPath();
      ctx.arc(random() * 128, random() * 64, 2 + random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A flag in horizontal bands, its cloth creased by a soft shade across it. */
function flagTexture(bands: readonly string[]): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    bands.forEach((band, i) => {
      ctx.fillStyle = band;
      ctx.fillRect(0, (i * 64) / bands.length, 96, 64 / bands.length + 1);
    });
    const crease = ctx.createLinearGradient(0, 0, 96, 0);
    for (let i = 0; i <= 4; i++) {
      crease.addColorStop(i / 4, i % 2 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.08)');
    }
    ctx.fillStyle = crease;
    ctx.fillRect(0, 0, 96, 64);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A shop sign: a painted board with a gilt border and the trade's emblem. */
function signTexture(ground: string, emblem: 'cup' | 'key' | 'loaf' | 'wheel'): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, 128, 100);
    ctx.strokeStyle = '#d6b456';
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, 116, 88);
    ctx.fillStyle = '#e3c463';
    ctx.strokeStyle = '#e3c463';
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (emblem === 'cup') {
      ctx.roundRect(42, 34, 36, 36, [0, 0, 14, 14]);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(82, 50, 9, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    } else if (emblem === 'key') {
      ctx.arc(44, 50, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(56, 47, 38, 6);
      ctx.fillRect(84, 53, 6, 10);
    } else if (emblem === 'loaf') {
      ctx.ellipse(64, 54, 32, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.arc(64, 50, 22, 0, Math.PI * 2);
      ctx.stroke();
      for (let a = 0; a < 6; a++) {
        ctx.fillRect(64 + Math.cos(a) * 2 - 2, 50 - 2, 4, 4);
      }
      ctx.moveTo(42, 50);
      ctx.lineTo(86, 50);
      ctx.moveTo(64, 28);
      ctx.lineTo(64, 72);
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A balcony railing, one metre per repeat: a top rail, a bottom rail, balusters and a scroll. */
function railingTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 8);
    ctx.fillRect(0, 114, 128, 6);
    for (let x = 4; x < 128; x += 16) ctx.fillRect(x, 0, 4, 120);
    ctx.lineWidth = 4;
    for (const cx of [32, 96]) {
      ctx.beginPath();
      ctx.arc(cx, 60, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Awning canvas atlas: one 64 px striped column per awning colour, repeating down `v`. */
function awningAtlasTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    AWNINGS.forEach((colour, i) => {
      const x = i * 64;
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(x, 0, 64, 64);
      ctx.fillStyle = colour;
      ctx.fillRect(x, 0, 64, 32);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = 0; y < 64; y += 4) ctx.fillRect(x, y, 64, 1);
    });
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Packs shop fascias, shop doors, hanging signs, civic flags, bay leaves and geranium blooms into
 * one 1024 × 512 texture atlas with 4 px edge-extruded gutters so mipmaps never bleed across cells.
 */
function houseDetailAtlas(): {
  texture: CanvasTexture;
  fascias: UvRect[];
  shopDoors: UvRect[];
  signs: UvRect[];
  flags: UvRect[];
  leaves: UvRect;
  blooms: UvRect;
} {
  const W = 1024;
  const H = 512;
  const pad = 4;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const place = (srcTex: CanvasTexture, cx: number, cy: number, dw: number, dh: number): UvRect => {
    const img = srcTex.image as HTMLCanvasElement;
    const sw = img.width;
    const sh = img.height;
    const ix = cx + pad;
    const iy = cy + pad;
    if (ctx) {
      ctx.drawImage(img, ix, iy, dw, dh);
      ctx.drawImage(img, 0, 0, sw, 1, ix, iy - pad, dw, pad);
      ctx.drawImage(img, 0, sh - 1, sw, 1, ix, iy + dh, dw, pad);
      ctx.drawImage(img, 0, 0, 1, sh, ix - pad, iy, pad, dh);
      ctx.drawImage(img, sw - 1, 0, 1, sh, ix + dw, iy, pad, dh);
    }
    srcTex.dispose();
    return {
      u0: (ix + 0.5) / W,
      u1: (ix + dw - 0.5) / W,
      v0: 1 - (iy + dh - 0.5) / H,
      v1: 1 - (iy + 0.5) / H,
    };
  };
  const fascias = ['BOEKEN', 'BAKKERIJ', 'BLOEMEN', 'MODE'].map((trade, i) =>
    place(fasciaTexture(trade), i * 256, 0, 248, 42),
  );
  const shopDoors = ['#2d4e3f', '#5a2730', '#1f2b44', '#3a3a3a'].map((paint, i) =>
    place(shopDoorTexture(paint), i * 104, 56, 88, 200),
  );
  const leaves = place(leafTexture(), 432, 56, 256, 128);
  const blooms = place(bloomTexture(), 704, 56, 128, 64);
  const signs = SIGNS.map((sign, i) =>
    place(signTexture(sign.ground, sign.emblem), i * 144, 272, 128, 100),
  );
  const flags = FLAGS.map((bands, i) => place(flagTexture(bands), i * 112, 388, 96, 64));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, fascias, shopDoors, signs, flags, leaves, blooms };
}

/** Pavement flagstones, one metre square per repeat, in two rows of 50 cm slabs. */
function slabTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#c9c2b4';
    ctx.fillRect(0, 0, size, size);
    const random = seeded(5);
    const slab = size / 2;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * slab - (row % 2 ? slab / 2 : 0);
        const shade = random() * 0.3 - 0.15;
        ctx.fillStyle = shade < 0 ? `rgba(60,50,40,${-shade})` : `rgba(255,250,240,${shade})`;
        ctx.fillRect(x, row * slab, slab, slab);
      }
    }
    const darkSpeckle = new Path2D();
    const lightSpeckle = new Path2D();
    for (let i = 0; i < 700; i++) {
      const path = random() < 0.5 ? darkSpeckle : lightSpeckle;
      path.rect(random() * size, random() * size, 1 + random() * 2, 1 + random() * 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fill(darkSpeckle);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill(lightSpeckle);
    // Old chewing gum and a damp stain or two, the wear of a busy pavement.
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = 'rgba(40,35,30,0.22)';
      ctx.beginPath();
      ctx.arc(random() * size, random() * size, 1.5 + random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const damp = ctx.createRadialGradient(40, 90, 2, 40, 90, 22);
    damp.addColorStop(0, 'rgba(60,55,45,0.18)');
    damp.addColorStop(1, 'rgba(60,55,45,0)');
    ctx.fillStyle = damp;
    ctx.fillRect(0, 0, size, size);
    // A crack across one slab.
    ctx.strokeStyle = 'rgba(60,50,40,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 8);
    ctx.lineTo(78, 22);
    ctx.lineTo(74, 34);
    ctx.lineTo(86, 52);
    ctx.stroke();
    ctx.fillStyle = 'rgba(70,60,50,0.45)';
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, slab, size, 2);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillRect(col * slab - (row % 2 ? slab / 2 : 0), row * slab, 2, slab);
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
