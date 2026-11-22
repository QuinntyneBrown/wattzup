// Caribana Parade's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Lake
// Shore Boulevard on carnival day. Crowds wave Caribbean flags behind steel barricades, feathered
// masqueraders dance on the aprons between music trucks, Lake Ontario opens on the right and the
// CN Tower stands over downtown ahead. Everything repeats along a loop longer than the road in
// view, so the parade never ends.
import {
  BatchedMesh,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CubicBezierCurve3,
  CylinderGeometry,
  DoubleSide,
  Euler,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  QuadraticBezierCurve3,
  Quaternion,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  buntingGeometry,
  canvasTexture,
  clothBannerTexture,
  loopMetres,
  mergeStaticGroup,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  speckle,
  tintGeometry,
} from './world-kit';
import {
  bakeOcclusion,
  ellipsoid,
  Ensemble,
  hairParts,
  limb,
  merge,
  shoeGeometry,
  Spectators,
  spectatorParts,
} from './world-caribana-crowd';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.15;
/** The parade lanes' asphalt, laid a hair over the renderer's road from barricade to barricade. */
const ASPHALT = 0.012;
/** The kerb steps up to the pavement just behind the barricades. */
const CURB = 6.75;
/** The barricades stand on the road at the gutters; the masqueraders dance between them. */
const BARRIER = 6.6;
/** The crowd stands from just behind the barricades to the back of the pavement. */
const CROWD_NEAR = 7.0;
const CROWD_FAR = 9.4;
const PAVEMENT = 9.6;
/** Lake Ontario starts this far right of the road's centre, past the armour stone. */
const SHORE = 18;
/** A music truck every TRUCK_EVERY metres on the left apron; the bands dance between them. */
const TRUCK_EVERY = 120;
const TRUCK_X = -5.1;
/** Downtown and the CN Tower stand this far ahead, a little left, hazed by hand. */
const DOWNTOWN_AHEAD = 1700;
const HAZE = 0xcfe0ee;

/** One barricade's length along the gutter. */
const BARRICADE = 2.45;
/** The banners zip-tied to the barricades. */
const BARRICADE_BANNERS = [
  { text: 'TORONTO CARIBBEAN CARNIVAL', fill: '#ffd23f', ink: '#c8102e' },
  { text: 'GRAND PARADE', fill: '#111111', ink: '#ffd23f' },
  { text: 'LAKE SHORE BLVD W', fill: '#0f9d58', ink: '#ffffff' },
  { text: 'PLAY MAS', fill: '#c8102e', ink: '#ffffff' },
  { text: 'CARIBANA 2026', fill: '#1b3f8a', ink: '#ffd23f' },
  { text: 'PEACE · LOVE · UNITY', fill: '#ffffff', ink: '#0f9d58' },
  { text: 'MAS ON DE ROAD', fill: '#ff2d87', ink: '#ffffff' },
  { text: 'PLEASE STAY BEHIND BARRICADES', fill: '#ffd23f', ink: '#111111' },
] as const;

/** The Gardiner Expressway's deck runs north of the boulevard between these, this high. */
const GARDINER_NEAR = -40;
const GARDINER_FAR = -63;
const GARDINER_DECK = 9.5;

/** A King or Queen of the band leads each band on the right, this far into each truck's stretch. */
const ROYAL_AT = 64;
const ROYAL_X = 4.0;
/** The bands chip up the road at a slow walk, in metres a second. */
const PARADE_SPEED = 0.6;
/** Where the flag sellers stand along the loop, alternating sides from the left. */
const SELLERS = [38, 62, 128, 188, 247, 301] as const;
/** Where the food carts stand at the front of the pavement: offset along the loop, and side. */
const CARTS = [
  [BEHIND + 9, 1],
  [BEHIND + 30, -1],
  [170, 1],
  [262, -1],
] as const;
/** The grandstand's seats run along the right-hand pavement between these. */
const GRANDSTAND = [64, 106] as const;
/** The route crosses a signalised intersection this far into the loop. */
const CROSSING_AT = 36;
/**
 * The landmarks met once in a while rather than every loop come round every this many metres:
 * three loops, so a ride meets three different cross streets and the judging point once.
 */
const LANDMARKS = 3 * 360;
/** The cross streets along the Sunnyside stretch, and how far into the landmarks' cycle. */
const CROSS_STREETS = [
  ['PARKSIDE DR', CROSSING_AT],
  ['COLBORNE LODGE DR', 360 + 150],
  ['ELLIS AVE', 720 + 250],
] as const;
/** The steel orchestra's float rides the left lane ahead of the first music truck. */
const PAN_AT = 44;

/** Caribbean flags in the crowd and on the lamp banners: T&T, Jamaica, Barbados, Guyana. */
const FLAG_KINDS = ['trinidad', 'jamaica', 'barbados', 'guyana'] as const;
type FlagKind = (typeof FLAG_KINDS)[number];

/**
 * Costume palettes, one per mas band section: the bodysuit, and the feathers of the backpiece's
 * three layers as [hub, tip] pairs, outer plumes first.
 */
const COSTUMES: readonly { feathers: readonly (readonly [string, string])[]; suit: string }[] = [
  {
    feathers: [
      ['#d81b60', '#ff7ab8'],
      ['#ffb300', '#fff176'],
      ['#ff2d87', '#ffd1e6'],
    ],
    suit: '#ff2d87',
  },
  {
    feathers: [
      ['#00838f', '#4de0d0'],
      ['#2e7d32', '#b9f6ca'],
      ['#00acc1', '#e0f7fa'],
    ],
    suit: '#0fa3b1',
  },
  {
    feathers: [
      ['#e65100', '#ffcc33'],
      ['#c62828', '#ff8a65'],
      ['#ff8f00', '#fff3c4'],
    ],
    suit: '#ff8a00',
  },
  {
    feathers: [
      ['#4a148c', '#b388ff'],
      ['#1565c0', '#80d8ff'],
      ['#7b2ff7', '#e1c4ff'],
    ],
    suit: '#6a1fd6',
  },
  {
    feathers: [
      ['#b8860b', '#ffe066'],
      ['#f5f0e6', '#ffffff'],
      ['#d4a017', '#fff4c2'],
    ],
    suit: '#d4a017',
  },
  {
    feathers: [
      ['#4c8c00', '#c6ff3a'],
      ['#111111', '#4a4a4a'],
      ['#7ed321', '#eaffb0'],
    ],
    suit: '#7ed321',
  },
  {
    feathers: [
      ['#9e0b1f', '#ff4d4d'],
      ['#f5f0e6', '#ffffff'],
      ['#e8133c', '#ffd1d1'],
    ],
    suit: '#e8133c',
  },
  {
    feathers: [
      ['#7d8ea3', '#e8eef5'],
      ['#2a6fb0', '#9fd3ff'],
      ['#c0c8d0', '#ffffff'],
    ],
    suit: '#9fb6c8',
  },
];
const SKINS = ['#5a3a29', '#7a4b33', '#8d5a3b', '#a36d47', '#c48a5f', '#e2b48c', '#3f2a1f'];
const TROUSERS = ['#2f3e5c', '#1e2530', '#3b5a7a', '#5b4a3a', '#d9d2c3', '#141414'];
const SHIRTS = [
  '#e8133c',
  '#ffd23f',
  '#0f9d58',
  '#1b6ad8',
  '#ffffff',
  '#111111',
  '#ff7a00',
  '#13c3c9',
  '#ff2d87',
  '#f5f0e6',
];

interface Masquerader {
  readonly side: -1 | 1;
  readonly offset: number;
  readonly x: number;
  readonly costume: number;
  readonly phase: number;
  /** Which way the dancer holds their arms: both up, one up and one on the hip, or spread wide. */
  readonly pose: number;
  /** Frontline masqueraders carry a full backpiece; the rest of the section a collar of plumes. */
  readonly frontline: boolean;
  /** This dancer's slot among those in dark glasses, or -1. */
  readonly shaded: number;
  /** A man in trunks and a sash rather than a woman in a bra and bikini. */
  readonly male: boolean;
  /** A child playing mas with the family, three fifths of an adult's height. */
  readonly child?: boolean;
  /** How broad the dancer is built, across and through, as a share of the slimmest. */
  readonly build: number;
  readonly skin: string;
}

/** The poses a masquerader dances in, each its own body: [left arm, right arm] as elbow, hand. */
const POSES: readonly (readonly [readonly number[], readonly number[]])[] = [
  // Both arms thrown up in a V.
  [
    [-0.34, 1.62, -0.02, -0.42, 1.9, -0.06],
    [0.34, 1.62, -0.02, 0.42, 1.9, -0.06],
  ],
  // The right hand waving high, the left on the hip.
  [
    [-0.3, 1.12, 0.02, -0.17, 0.98, -0.06],
    [0.32, 1.64, -0.04, 0.3, 1.94, -0.1],
  ],
  // Both arms spread wide at the shoulders, wings to the backpiece.
  [
    [-0.44, 1.42, -0.04, -0.7, 1.5, -0.08],
    [0.44, 1.42, -0.04, 0.7, 1.5, -0.08],
  ],
  // Both hands on the hips, elbows out, wining.
  [
    [-0.34, 1.15, 0.02, -0.17, 0.98, -0.05],
    [0.34, 1.15, 0.02, 0.17, 0.98, -0.05],
  ],
  // Jumping up: the right arm thrown straight up, the left swung down and out behind.
  [
    [-0.33, 1.16, 0.12, -0.45, 0.96, 0.2],
    [0.24, 1.66, -0.04, 0.2, 1.98, -0.04],
  ],
];

const PROP_BEHIND_CULL = -22;
const PROP_HORIZON_CULL = 316;
const DANCER_BEHIND_CULL = -16;
const DANCER_TILT_FAR = 65;
const DANCER_DETAIL_FAR = 115;
const DANCER_HORIZON_CULL = 255;
const SHADOW_NEAR = -14;
const SHADOW_FAR = 30;
const CONFETTI_COUNT = 180;
const CONFETTI_SPAN = 120;

function collectShadowMeshes(root: Group): Mesh[] {
  const list: Mesh[] = [];
  root.traverse((obj) => {
    if (obj instanceof Mesh && obj.castShadow) list.push(obj);
  });
  return list;
}

function asNonIndexed(g: BufferGeometry): BufferGeometry {
  return g.index ? g.toNonIndexed() : g;
}

function ensureIndexedGeometry(g: BufferGeometry): BufferGeometry {
  if (g.getIndex() !== null) return g;
  const count = g.getAttribute('position').count;
  const indices = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
  for (let i = 0; i < count; i++) indices[i] = i;
  g.setIndex(new BufferAttribute(indices, 1));
  return g;
}

const ZERO_SCALE_SENTINEL = new Matrix4().makeScale(0, 0, 0).setPosition(0, -500, 0);

function makeStreetBatch(
  geometries: readonly BufferGeometry[],
  instanceTotal: number,
  material: Material,
  group: Group,
  disposables: { dispose(): void }[],
  castShadow = false,
  withWarmupSentinel = false,
): { batch: BatchedMesh; geoIds: number[] } {
  let maxVerts = 0;
  let maxIndices = 0;
  for (const g of geometries) {
    ensureIndexedGeometry(g);
    maxVerts += g.getAttribute('position').count;
    maxIndices += g.getIndex()!.count;
  }
  const cap = Math.max(1, instanceTotal + (withWarmupSentinel ? 1 : 0));
  const batch = new BatchedMesh(cap, Math.max(3, maxVerts), Math.max(3, maxIndices), material);
  batch.sortObjects = false;
  batch.perObjectFrustumCulled = false;
  batch.frustumCulled = false;
  batch.castShadow = castShadow;
  const geoIds = geometries.map((g) => batch.addGeometry(g));
  if (withWarmupSentinel && geoIds.length > 0) {
    let minIdx = 0;
    let minVerts = geometries[0]!.getAttribute('position').count;
    for (let i = 1; i < geometries.length; i++) {
      const vc = geometries[i]!.getAttribute('position').count;
      if (vc < minVerts) {
        minVerts = vc;
        minIdx = i;
      }
    }
    const sid = batch.addInstance(geoIds[minIdx]!);
    batch.setMatrixAt(sid, ZERO_SCALE_SENTINEL);
    batch.setVisibleAt(sid, true);
  }
  group.add(batch);
  disposables.push(batch);
  return { batch, geoIds };
}

interface PropBatchSlot {
  readonly batch: BatchedMesh;
  readonly id: number;
  readonly shadowBatch: BatchedMesh | null;
  readonly shadowId: number;
  readonly local: Float32Array;
}

export class CaribanaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private roadMap: CanvasTexture | null = null;
  private readonly props: {
    mesh: Group;
    offset: number;
    every: number;
    x: number;
    /** Standing on the road rather than up on the pavement. */
    road?: boolean;
    /** Part of the parade, chipping up the road with it. */
    marching?: boolean;
    shadowMeshes?: Mesh[];
    lastCast?: boolean;
    batchedSlots?: PropBatchSlot[];
  }[] = [];
  private readonly crowd: Spectators;
  private readonly dancers: (Masquerader & {
    skinR: number;
    skinG: number;
    skinB: number;
    suitR: number;
    suitG: number;
    suitB: number;
    hairR: number;
    hairG: number;
    hairB: number;
    rag1R: number;
    rag1G: number;
    rag1B: number;
    rag2R: number;
    rag2G: number;
    rag2B: number;
    baseCy: number;
    baseSy: number;
    sinP21: number;
    cosP21: number;
    sinP07: number;
    cosP07: number;
    sinP63: number;
    cosP63: number;
    rxAmp: number;
    rzAmp: number;
    k0: number;
    bw: number;
    plumeId: number;
    heldFlagId: number;
  })[] = [];
  private readonly bodies: InstancedMesh[] = [];
  private readonly nearBodies: InstancedMesh[] = [];
  private costumes: InstancedMesh | null = null;
  private trunks: InstancedMesh | null = null;
  private medallions: InstancedMesh | null = null;
  private fringes: InstancedMesh | null = null;
  private plumeBatch: BatchedMesh | null = null;
  private plumeVis = new Uint8Array(0);
  private heldFlagBatch: BatchedMesh | null = null;
  private heldFlagVis = new Uint8Array(0);
  private rags: InstancedMesh | null = null;
  private hair: InstancedMesh | null = null;
  private sharedPlumesMat: MeshStandardMaterial | null = null;
  private sharedSequinsMat: MeshStandardMaterial | null = null;
  private sharedSequinsVertexMat: MeshStandardMaterial | null = null;
  private readonly scratchMat = new Matrix4();
  private dancerBucket = Number.NaN;
  private teeBucket = Number.NaN;
  private readonly downtown = new Group();
  private readonly barricades: {
    side: -1 | 1;
    offset: number;
    banner: number;
    bannerId: number;
  }[] = [];
  private barricadeFrames: InstancedMesh | null = null;
  private barricadeBannerBatch: BatchedMesh | null = null;
  private boatsMesh: InstancedMesh | null = null;
  private readonly clouds = new Group();
  private readonly ontarioPlace = new Group();
  private readonly rotor = new Group();
  private readonly parkdale = new Group();
  private readonly plane = new Group();
  private readonly helicopter = new Group();
  private readonly rotorBlades = new Group();
  private readonly expressway: {
    offset: number;
    speed: number;
    x: number;
    r: number;
    g: number;
    b: number;
  }[] = [];
  private expresswayBodies: InstancedMesh | null = null;
  private expresswayTrim: InstancedMesh | null = null;
  private expresswayBucket = Number.NaN;
  private gardinerConcrete: InstancedMesh | null = null;
  private gardinerSteel: InstancedMesh | null = null;
  private readonly gardinerOffsets: number[] = [];
  private crosswalksMesh: InstancedMesh | null = null;
  private arrowRowsMesh: InstancedMesh | null = null;
  private arrowRowGeo: BufferGeometry | null = null;
  private crosswalkGeo: BufferGeometry | null = null;
  private readonly crosswalkOffsets: number[] = [];
  private readonly arrowRowOffsets: number[] = [];
  private sharedTrussTex: CanvasTexture | null = null;
  private sharedLadderMat: MeshStandardMaterial | null = null;
  private sharedAsphaltMat: MeshStandardMaterial | null = null;
  private sharedTruckBannerMat: MeshStandardMaterial | null = null;
  private sharedStreetSignMat: {
    tex: CanvasTexture;
    mat: MeshStandardMaterial;
  } | null = null;
  private readonly royals: {
    piece: Group;
    offset: number;
    phase: number;
    shadowMeshes?: Mesh[];
    lastCast?: boolean;
  }[] = [];
  private teeShirts: Ensemble | null = null;
  private readonly revellers: { x: number; offset: number; phase: number; facing: number }[] = [];
  private officerEnsemble: Ensemble | null = null;
  private readonly officerSpots: {
    x: number;
    offset: number;
    cy: number;
    sy: number;
    marching?: boolean;
  }[] = [];
  private pannistGroup: Group | null = null;
  private readonly bandBanners: { group: Group; phase: number }[] = [];
  private engineRoom: Group | null = null;
  private readonly mounted: { horse: Group; tail: Group; phase: number }[] = [];
  private sectionPoles: InstancedMesh | null = null;
  private sectionClothBatch: BatchedMesh | null = null;
  private readonly sectionFlagSpots: {
    x: number;
    offset: number;
    phase: number;
    cy: number;
    sy: number;
    clothId: number;
  }[] = [];
  private readonly truckLights: MeshStandardMaterial[] = [];
  private readonly policeLights: MeshStandardMaterial[] = [];
  private readonly closed = new MeshStandardMaterial({
    map: clothBannerTexture('ROAD CLOSED', '#ffffff', '#c8102e'),
    roughness: 0.6,
  });
  private readonly signalLamps: {
    red: MeshStandardMaterial;
    amber: MeshStandardMaterial;
    green: MeshStandardMaterial;
  }[] = [];
  private confetti: InstancedMesh | null = null;
  private readonly flakes: {
    x: number;
    offset: number;
    top: number;
    fall: number;
    spin: number;
    phase: number;
  }[] = [];
  private mokoStripeBatch: BatchedMesh | null = null;
  private mokoNearStripeBatch: BatchedMesh | null = null;
  private mokoBodyBatch: BatchedMesh | null = null;
  private mokoNearBodyBatch: BatchedMesh | null = null;
  private mokoWingBatch: BatchedMesh | null = null;
  private readonly mokos: {
    offset: number;
    x: number;
    phase: number;
    leftLegId: number;
    rightLegId: number;
    hipsId: number;
    nearLeftLegId: number;
    nearRightLegId: number;
    nearHipsId: number;
    bodyId: number;
    nearBodyId: number;
    wingId: number;
    state: number;
  }[] = [];
  private time = 0;
  /** How far the parade has chipped up the road since the ride began, in metres. */
  private march = 0;
  private readonly up = new Vector3(0, 1, 0);
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly propSolidMat = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.72,
    metalness: 0.12,
  });
  private readonly hazedSolidMat = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.7,
    fog: false,
  });
  private readonly solidMaterials = new Map<string, MeshStandardMaterial>();
  private treeBatches: {
    trunks: BatchedMesh;
    crowns: BatchedMesh;
    sprigs: BatchedMesh;
    items: {
      x: number;
      offset: number;
      scale: number;
      cy: number;
      sy: number;
      trunkId: number;
      crownId: number;
      sprigId: number;
      visible: boolean;
    }[];
  } | null = null;
  private lampMeshes: {
    body: InstancedMesh;
    bannerBatch: BatchedMesh;
    items: { side: -1 | 1; offset: number; x: number; festId: number; flagId: number }[];
  } | null = null;
  private buntingMeshes: {
    mesh: InstancedMesh;
    offsets: number[];
  } | null = null;
  private readonly flagAtlasMat = new MeshStandardMaterial({
    map: flagAtlasTexture(),
    side: DoubleSide,
    roughness: 0.8,
  });

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    this.crowd = new Spectators(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.55,
      tops: SHIRTS,
      bottoms: TROUSERS,
      skins: SKINS,
      flagAtlas: this.flagAtlasMat,
      flagCount: FLAG_KINDS.length,
      seed: 41,
      skip: (side, offset) =>
        (side > 0 && offset > GRANDSTAND[0] && offset < GRANDSTAND[1]) ||
        SELLERS.some((at, k) => (k % 2 ? 1 : -1) === side && Math.abs(offset - at) < 1.2) ||
        CARTS.some(([at, s]) => s === side && Math.abs(offset - at) < 1.6),
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(
      this.unit,
      this.propSolidMat,
      this.hazedSolidMat,
      this.satinWing,
      this.closed,
      this.flagAtlasMat,
    );
    if (this.closed.map) this.track(this.closed.map);
    if (this.flagAtlasMat.map) this.track(this.flagAtlasMat.map);
    this.roadMap = this.repeat(roadTexture(), 2 * CURB, 18);
    this.addGround(points);
    this.crowd.build();
    this.addMasqueraders(roadHalf);
    this.addBarricades();
    this.addMokoJumbies();
    this.addTeeShirtMas();
    this.addBandRope();
    this.addRoyals();
    this.addTrucks();
    this.addPanFloat();
    this.addGantry();
    for (const [name, at] of CROSS_STREETS) this.addIntersection(name, at);
    this.buildIntersectionRoadPaintMeshes();
    this.addGrandstand();
    this.addScreen();
    this.addPavilion();
    this.addFootbridge();
    this.addConfetti();
    this.addMountedUnit();
    this.addBandBanners();
    this.addEngineRoom();
    this.addRoadsideFiguresAndSectionFlags();
    this.addLamps();
    this.addBunting();
    this.addTrees();
    this.addStalls();
    this.addFlagSellers();
    this.addCarts();
    this.addGardiner(points);
    this.addDowntown();
    this.addOntarioPlace();
    this.addExhibition();
    this.addParkdale();
    this.addBoats();
    this.addClouds();
    this.addCirrus();
    this.addSkyLife();
    this.flattenStaticGroups();
  }

  private flattenStaticGroups(): void {
    const skip = new Set<Object3D>();
    for (const m of this.mounted) skip.add(m.tail);
    if (this.engineRoom) {
      skip.add(this.engineRoom);
      mergeStaticGroup(this.engineRoom, this.disposables, undefined, this.propSolidMat);
    }
    for (const b of this.bandBanners) {
      skip.add(b.group);
      mergeStaticGroup(b.group, this.disposables, undefined, this.propSolidMat);
    }
    if (this.pannistGroup) {
      skip.add(this.pannistGroup);
      mergeStaticGroup(this.pannistGroup, this.disposables, undefined, this.propSolidMat);
    }
    skip.add(this.rotor);
    mergeStaticGroup(this.rotor, this.disposables, undefined, this.propSolidMat);
    skip.add(this.rotorBlades);
    mergeStaticGroup(this.rotorBlades, this.disposables, undefined, this.propSolidMat);

    for (const prop of this.props) {
      mergeStaticGroup(prop.mesh, this.disposables, skip, this.propSolidMat);
    }
    for (const r of this.royals) {
      mergeStaticGroup(r.piece, this.disposables, skip, this.propSolidMat);
    }
    mergeStaticGroup(this.downtown, this.disposables, skip, this.hazedSolidMat);
    mergeStaticGroup(this.ontarioPlace, this.disposables, skip, this.propSolidMat);
    mergeStaticGroup(this.parkdale, this.disposables, skip, this.hazedSolidMat);
    mergeStaticGroup(this.plane, this.disposables, skip, this.hazedSolidMat);
    mergeStaticGroup(this.helicopter, this.disposables, skip, this.propSolidMat);
    this.batchStaticProps(skip);
  }

  private batchStaticProps(animatedSubtrees: Set<Object3D>): void {
    const isUnderAnimated = (obj: Object3D): boolean => {
      let cur: Object3D | null = obj;
      while (cur) {
        if (animatedSubtrees.has(cur)) return true;
        cur = cur.parent;
      }
      return false;
    };
    interface Candidate {
      propIdx: number;
      mesh: Mesh;
      geometry: BufferGeometry;
      material: Material;
      local: Float32Array;
      castShadow: boolean;
    }
    const buckets = new Map<string, { material: Material; items: Candidate[] }>();
    const matIds = new Map<Material, number>();
    let nextMatId = 1;
    for (let pIdx = 0; pIdx < this.props.length; pIdx++) {
      const prop = this.props[pIdx]!;
      prop.mesh.position.set(0, 0, 0);
      prop.mesh.updateMatrixWorld(true);
      prop.mesh.traverse((obj) => {
        if (!(obj instanceof Mesh) || Array.isArray(obj.material) || isUnderAnimated(obj)) return;
        const geo = ensureIndexedGeometry(obj.geometry as BufferGeometry);
        const mat = obj.material as Material;
        let mid = matIds.get(mat);
        if (mid === undefined) {
          mid = nextMatId++;
          matIds.set(mat, mid);
        }
        const attrKey = Object.keys(geo.attributes).sort().join(',');
        const key = `${mid}|${attrKey}`;
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = { material: mat, items: [] };
          buckets.set(key, bucket);
        }
        const local = new Float32Array(16);
        local.set(obj.matrixWorld.elements);
        bucket.items.push({
          propIdx: pIdx,
          mesh: obj,
          geometry: geo,
          material: mat,
          local,
          castShadow: obj.castShadow,
        });
      });
    }
    for (const bucket of buckets.values()) {
      if (bucket.items.length < 2) continue;
      const uniqueGeos: BufferGeometry[] = [];
      const byGeo = new Map<BufferGeometry, Candidate[]>();
      let anyShadow = false;
      for (const it of bucket.items) {
        if (it.castShadow) anyShadow = true;
        let list = byGeo.get(it.geometry);
        if (!list) {
          list = [];
          byGeo.set(it.geometry, list);
          uniqueGeos.push(it.geometry);
        }
        list.push(it);
      }
      const splitNearShadow = anyShadow && bucket.material === this.propSolidMat;
      const farPack = makeStreetBatch(
        uniqueGeos,
        bucket.items.length,
        bucket.material,
        this.group,
        this.disposables,
        false,
        true,
      );
      const nearPack = splitNearShadow
        ? makeStreetBatch(
            uniqueGeos,
            bucket.items.length,
            bucket.material,
            this.group,
            this.disposables,
            true,
            true,
          )
        : null;
      uniqueGeos.forEach((geo, gIdx) => {
        const farGid = farPack.geoIds[gIdx]!;
        const nearGid = nearPack ? nearPack.geoIds[gIdx]! : -1;
        for (const it of byGeo.get(geo)!) {
          const id = farPack.batch.addInstance(farGid);
          farPack.batch.setVisibleAt(id, false);
          let shadowId = -1;
          if (nearPack && it.castShadow) {
            shadowId = nearPack.batch.addInstance(nearGid);
            nearPack.batch.setVisibleAt(shadowId, false);
          }
          it.mesh.parent?.remove(it.mesh);
          const prop = this.props[it.propIdx]!;
          (prop.batchedSlots ??= []).push({
            batch: farPack.batch,
            id,
            shadowBatch: shadowId >= 0 ? nearPack!.batch : null,
            shadowId,
            local: it.local,
          });
        }
      });
    }
    for (const prop of this.props) {
      let remaining = 0;
      prop.mesh.traverse((obj) => {
        if (obj instanceof Mesh) remaining++;
      });
      if (remaining === 0) {
        prop.mesh.parent?.remove(prop.mesh);
      }
    }
  }

  /** The parade's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
    this.march = seconds * PARADE_SPEED;
  }

  /** Lays the pavements, barricades, grass, armour stone and lake over the road's points. */
  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** Moves the parade with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const pe = this.scratchMat.elements;
    for (const prop of this.props) {
      const march = prop.marching ? this.march : 0;
      const metres = along(prop.offset + march, prop.every);
      const visible = metres > PROP_BEHIND_CULL && metres <= PROP_HORIZON_CULL;
      const cast = visible && metres > SHADOW_NEAR && metres < SHADOW_FAR;
      const ty = visible ? heightAt(Math.max(metres, 0)) + (prop.road ? ASPHALT : KERB) : 0;
      const tz = -metres;
      if (prop.batchedSlots) {
        for (const slot of prop.batchedSlots) {
          const useShadow = cast && slot.shadowBatch !== null;
          const showFar = visible && !useShadow;
          if (slot.batch.getVisibleAt(slot.id) !== showFar) {
            slot.batch.setVisibleAt(slot.id, showFar);
          }
          if (slot.shadowBatch) {
            if (slot.shadowBatch.getVisibleAt(slot.shadowId) !== useShadow) {
              slot.shadowBatch.setVisibleAt(slot.shadowId, useShadow);
            }
          }
          if (visible) {
            const loc = slot.local;
            pe[0] = loc[0]!;
            pe[1] = loc[1]!;
            pe[2] = loc[2]!;
            pe[3] = loc[3]!;
            pe[4] = loc[4]!;
            pe[5] = loc[5]!;
            pe[6] = loc[6]!;
            pe[7] = loc[7]!;
            pe[8] = loc[8]!;
            pe[9] = loc[9]!;
            pe[10] = loc[10]!;
            pe[11] = loc[11]!;
            pe[12] = loc[12]! + prop.x;
            pe[13] = loc[13]! + ty;
            pe[14] = loc[14]! + tz;
            pe[15] = 1;
            if (useShadow) slot.shadowBatch!.setMatrixAt(slot.shadowId, this.scratchMat);
            else slot.batch.setMatrixAt(slot.id, this.scratchMat);
          }
        }
      }
      if (prop.mesh.parent) {
        prop.mesh.position.set(prop.x, ty, tz);
        prop.mesh.visible = visible;
        if (visible && prop.lastCast !== cast) {
          prop.lastCast = cast;
          const shadowMeshes = (prop.shadowMeshes ??= collectShadowMeshes(prop.mesh));
          for (const sm of shadowMeshes) sm.castShadow = cast;
        }
      }
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.placeDancers(heightAt, along);
    this.placeBarricades(heightAt, along);
    this.placeMokoJumbies(heightAt, along);
    this.placeTeeShirtMas(heightAt, along);
    this.placeRoadsideFiguresAndSectionFlags(heightAt, along);
    this.placeIntersectionRoadPaint(heightAt, along);
    this.placeLampsAndBunting(heightAt, along);
    this.placeTrees(heightAt, along);
    this.placeConfetti(s, heightAt);
    // The signals run their cycle as usual though the road is closed: 20 s green, 3 amber, 20 red.
    const phase = this.time % 43;
    for (const lamp of this.signalLamps) {
      lamp.green.emissiveIntensity = phase < 20 ? 3 : 0.05;
      lamp.amber.emissiveIntensity = phase >= 20 && phase < 23 ? 3 : 0.05;
      lamp.red.emissiveIntensity = phase >= 23 ? 3 : 0.05;
    }
    // The cruisers' roof lights flash red and blue in turn.
    const flash = Math.floor(this.time * 6) % 2;
    this.policeLights.forEach((m, k) => (m.emissiveIntensity = k % 2 === flash ? 4 : 0.1));
    // The trucks' lights pulse with the bass, each colour on its own count.
    this.truckLights.forEach((m, k) => {
      const beat = Math.max(0, Math.sin(this.time * Math.PI * 2.1 + k * 1.6));
      m.emissiveIntensity = 0.6 + Math.pow(beat, 4) * 3.2;
    });
    // The horses swish their tails and shift their weight now and then.
    for (const m of this.mounted) {
      m.tail.rotation.z = Math.sin(this.time * 1.7 + m.phase) * 0.35;
      m.tail.rotation.x = 0.3 + Math.sin(this.time * 0.9 + m.phase) * 0.1;
    }
    // The engine room bobs on every beat as it plays.
    if (this.engineRoom) {
      this.engineRoom.position.y = Math.abs(Math.sin(this.time * 4.2)) * 0.05;
    }
    for (const b of this.bandBanners) {
      // The bearers walk the banner up the road, swaying it on the beat.
      b.group.rotation.z = Math.sin(this.time * 2.1 + b.phase) * 0.025;
      b.group.position.y = Math.abs(Math.sin(this.time * 4.2 + b.phase)) * 0.04;
    }
    if (this.pannistGroup) {
      this.pannistGroup.position.y = Math.abs(Math.sin(this.time * 4.2)) * 0.06;
    }
    for (const r of this.royals) {
      const metres = along(r.offset + this.march, LOOP);
      const t = this.time + r.phase;
      r.piece.position.set(
        ROYAL_X + Math.sin(t * 0.5) * 0.3,
        heightAt(Math.max(metres, 0)) + ASPHALT + Math.abs(Math.sin(t * 2.1)) * 0.04,
        -metres,
      );
      const visible = metres > PROP_BEHIND_CULL && metres <= PROP_HORIZON_CULL;
      r.piece.visible = visible;
      if (!visible) continue;
      const cast = metres > SHADOW_NEAR && metres < SHADOW_FAR;
      if (r.lastCast !== cast) {
        r.lastCast = cast;
        const shadowMeshes = (r.shadowMeshes ??= collectShadowMeshes(r.piece));
        for (const sm of shadowMeshes) sm.castShadow = cast;
      }
      r.piece.rotation.z = Math.sin(t * 1.05) * 0.04;
      r.piece.rotation.y = Math.PI + Math.sin(t * 0.35) * 0.35;
    }
    this.placeGardinerAndTraffic(heightAt, along);
    const farH = heightAt(1e6);
    this.downtown.position.set(0, farH - 4, -DOWNTOWN_AHEAD);
    this.ontarioPlace.position.set(0, farH, 0);
    this.parkdale.position.set(0, farH, 0);
    const u = (this.time * 0.012) % 1;
    this.plane.position.set(420 - u * 600, farH + 260 - u * 170, -1400 + u * 200);
    const orbit = this.time * 0.05;
    this.helicopter.position.set(
      40 + Math.cos(orbit) * 60,
      farH + 95 + Math.sin(this.time * 0.4) * 2,
      -330 + Math.sin(orbit) * 60,
    );
    this.helicopter.rotation.y = -orbit;
    this.helicopter.rotation.z = 0.08;
    this.rotorBlades.rotation.y = this.time * 40;
    this.rotor.rotation.z = this.time * 1.1;
    this.clouds.position.set(((this.time * 1.5) % 1200) - 600, farH, 0);
    if (this.boatsMesh) {
      const bArr = this.boatsMesh.instanceMatrix.array as Float32Array;
      for (let i = 0; i < 6; i++) {
        const drift = this.time * 0.6 + i * 37;
        const yaw = Math.PI / 2 + (i % 2) * 0.6;
        const cy = Math.cos(yaw);
        const sy = Math.sin(yaw);
        const o = i * 16;
        bArr[o] = cy;
        bArr[o + 1] = 0;
        bArr[o + 2] = -sy;
        bArr[o + 3] = 0;
        bArr[o + 4] = 0;
        bArr[o + 5] = 1;
        bArr[o + 6] = 0;
        bArr[o + 7] = 0;
        bArr[o + 8] = sy;
        bArr[o + 9] = 0;
        bArr[o + 10] = cy;
        bArr[o + 11] = 0;
        bArr[o + 12] = 120 + i * 55;
        bArr[o + 13] = farH - 0.2;
        bArr[o + 14] = -(((i * 173 + drift - s * 0.15) % 700) + 120);
        bArr[o + 15] = 1;
      }
      this.boatsMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private placeDancers(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const costumes = this.costumes;
    const plumeBatch = this.plumeBatch;
    const heldFlagBatch = this.heldFlagBatch;
    if (!costumes || !plumeBatch || !heldFlagBatch) return;
    const plumeVis = this.plumeVis;
    const heldFlagVis = this.heldFlagVis;
    const bucket = Math.floor(along(this.march, LOOP) * 0.5);
    const colorsChanged = bucket !== this.dancerBucket;
    this.dancerBucket = bucket;
    const poseCount = this.bodies.length;
    const posed = new Int32Array(poseCount);
    const nearPosed = new Int32Array(poseCount);
    const bodyMats = this.bodies.map((b) => b.instanceMatrix.array as Float32Array);
    const bodyCols = this.bodies.map((b) =>
      b.instanceColor ? (b.instanceColor.array as Float32Array) : null,
    );
    const nearBodyMats = this.nearBodies.map((b) => b.instanceMatrix.array as Float32Array);
    const nearBodyCols = this.nearBodies.map((b) =>
      b.instanceColor ? (b.instanceColor.array as Float32Array) : null,
    );
    const nearBodyCaps = this.nearBodies.map((b) => b.instanceMatrix.count);
    const costumesMat = costumes.instanceMatrix.array as Float32Array;
    const costumesCol = costumes.instanceColor
      ? (costumes.instanceColor.array as Float32Array)
      : null;
    const trunksMat = this.trunks ? (this.trunks.instanceMatrix.array as Float32Array) : null;
    const trunksCol =
      this.trunks && this.trunks.instanceColor
        ? (this.trunks.instanceColor.array as Float32Array)
        : null;
    const fringesMat = this.fringes ? (this.fringes.instanceMatrix.array as Float32Array) : null;
    const fringesCol =
      this.fringes && this.fringes.instanceColor
        ? (this.fringes.instanceColor.array as Float32Array)
        : null;
    const hairMat = this.hair ? (this.hair.instanceMatrix.array as Float32Array) : null;
    const hairCol =
      this.hair && this.hair.instanceColor ? (this.hair.instanceColor.array as Float32Array) : null;
    const ragsMat = this.rags ? (this.rags.instanceMatrix.array as Float32Array) : null;
    const ragsCol =
      this.rags && this.rags.instanceColor ? (this.rags.instanceColor.array as Float32Array) : null;
    const medMat = this.medallions ? (this.medallions.instanceMatrix.array as Float32Array) : null;
    const medCol =
      this.medallions && this.medallions.instanceColor
        ? (this.medallions.instanceColor.array as Float32Array)
        : null;

    let ragSlot = 0;
    let women = 0;
    let men = 0;
    let vis = 0;
    let medallionsCount = 0;
    let fringesCount = 0;
    const me = this.scratchMat.elements;
    me[3] = 0;
    me[7] = 0;
    me[11] = 0;
    me[15] = 1;

    const s21Base = Math.sin(this.time * 2.1);
    const c21Base = Math.cos(this.time * 2.1);
    const s07Base = Math.sin(this.time * 0.7);
    const c07Base = Math.cos(this.time * 0.7);
    const s63Base = Math.sin(this.time * 6.3);
    const c63Base = Math.cos(this.time * 6.3);

    const writeArr = (
      arr: Float32Array | null,
      slot: number,
      m0: number,
      m1: number,
      m2: number,
      m4: number,
      m5: number,
      m6: number,
      m8: number,
      m9: number,
      m10: number,
      tx: number,
      ty: number,
      tz: number,
    ) => {
      if (!arr) return;
      const o = slot * 16;
      arr[o] = m0;
      arr[o + 1] = m1;
      arr[o + 2] = m2;
      arr[o + 3] = 0;
      arr[o + 4] = m4;
      arr[o + 5] = m5;
      arr[o + 6] = m6;
      arr[o + 7] = 0;
      arr[o + 8] = m8;
      arr[o + 9] = m9;
      arr[o + 10] = m10;
      arr[o + 11] = 0;
      arr[o + 12] = tx;
      arr[o + 13] = ty;
      arr[o + 14] = tz;
      arr[o + 15] = 1;
    };

    const setRgbArr = (arr: Float32Array | null, slot: number, r: number, g: number, b: number) => {
      if (!arr) return;
      const o = slot * 3;
      arr[o] = r;
      arr[o + 1] = g;
      arr[o + 2] = b;
    };

    const dancers = this.dancers;
    const dLen = dancers.length;
    for (let i = 0; i < dLen; i++) {
      const d = dancers[i]!;
      const metres = along(d.offset + this.march, LOOP);
      if (metres <= DANCER_BEHIND_CULL || metres > DANCER_HORIZON_CULL) {
        if (plumeVis[d.plumeId]) {
          plumeVis[d.plumeId] = 0;
          plumeBatch.setVisibleAt(d.plumeId, false);
        }
        if (d.heldFlagId >= 0 && heldFlagVis[d.heldFlagId]) {
          heldFlagVis[d.heldFlagId] = 0;
          heldFlagBatch.setVisibleAt(d.heldFlagId, false);
        }
        continue;
      }
      const y = heightAt(metres > 0 ? metres : 0) + ASPHALT;
      const s21 = s21Base * d.cosP21 + c21Base * d.sinP21;
      const c21 = c21Base * d.cosP21 - s21Base * d.sinP21;
      const prod = s21 * c21;
      const bounce = (prod < 0 ? -prod : prod) * 0.14;
      const sway = s21 * 0.35;
      const sw2 = sway * sway;
      const cs = 1 - 0.5 * sw2;
      const ss = sway * (1 - 0.16666667 * sw2);
      const cy = d.baseCy * cs - d.baseSy * ss;
      const sy = d.baseSy * cs + d.baseCy * ss;
      const x = d.x + (s07Base * d.cosP07 + c07Base * d.sinP07) * 0.4;

      let r00: number,
        r10: number,
        r20: number,
        r01: number,
        r11: number,
        r21: number,
        r02: number,
        r12: number,
        r22: number;
      if (metres <= DANCER_TILT_FAR) {
        const rx = c21 * d.rxAmp;
        const rz = s21 * d.rzAmp;
        const cx = 1 - 0.5 * rx * rx;
        const sx = rx;
        const cz = 1 - 0.5 * rz * rz;
        const sz = rz;
        r00 = cy * cz + sy * sx * sz;
        r10 = cx * sz;
        r20 = -sy * cz + cy * sx * sz;
        r01 = -cy * sz + sy * sx * cz;
        r11 = cx * cz;
        r21 = sy * sz + cy * sx * cz;
        r02 = sy * cx;
        r12 = -sx;
        r22 = cy * cx;
      } else {
        r00 = cy;
        r10 = 0;
        r20 = -sy;
        r01 = 0;
        r11 = 1;
        r21 = 0;
        r02 = sy;
        r12 = 0;
        r22 = cy;
      }

      const k0 = d.k0;
      const bw = d.bw;
      const m0 = r00 * bw;
      const m1 = r10 * bw;
      const m2 = r20 * bw;
      const m4 = r01 * k0;
      const m5 = r11 * k0;
      const m6 = r21 * k0;
      const m8 = r02 * bw;
      const m9 = r12 * bw;
      const m10 = r22 * bw;
      const ty = y + bounce;
      const tz = -metres;

      const body = d.pose;
      if (metres > SHADOW_NEAR && metres < SHADOW_FAR && nearPosed[body]! < nearBodyCaps[body]!) {
        const nbSlot = nearPosed[body]!;
        nearPosed[body] = nbSlot + 1;
        writeArr(nearBodyMats[body]!, nbSlot, m0, m1, m2, m4, m5, m6, m8, m9, m10, x, ty, tz);
        if (colorsChanged) setRgbArr(nearBodyCols[body]!, nbSlot, d.skinR, d.skinG, d.skinB);
      } else {
        const bodySlot = posed[body]!;
        posed[body] = bodySlot + 1;
        writeArr(bodyMats[body]!, bodySlot, m0, m1, m2, m4, m5, m6, m8, m9, m10, x, ty, tz);
        if (colorsChanged) setRgbArr(bodyCols[body]!, bodySlot, d.skinR, d.skinG, d.skinB);
      }

      const nearDetail = metres <= DANCER_DETAIL_FAR;
      if (d.male) {
        writeArr(trunksMat, men, m0, m1, m2, m4, m5, m6, m8, m9, m10, x, ty, tz);
        if (colorsChanged) setRgbArr(trunksCol, men, d.suitR, d.suitG, d.suitB);
        men++;
      } else {
        writeArr(costumesMat, women, m0, m1, m2, m4, m5, m6, m8, m9, m10, x, ty, tz);
        if (colorsChanged) setRgbArr(costumesCol, women, d.suitR, d.suitG, d.suitB);
        women++;
        if (nearDetail) {
          writeArr(fringesMat, fringesCount, m0, m1, m2, m4, m5, m6, m8, m9, m10, x, ty, tz);
          if (colorsChanged) setRgbArr(fringesCol, fringesCount, d.suitR, d.suitG, d.suitB);
          fringesCount++;
        }
      }

      if (nearDetail) {
        writeArr(hairMat, vis, m0, m1, m2, m4, m5, m6, m8, m9, m10, x, ty, tz);
        if (colorsChanged) setRgbArr(hairCol, vis, d.hairR, d.hairG, d.hairB);
        vis++;
      }

      if (d.pose === 1 || (nearDetail && d.pose === 0 && ragsMat)) {
        const wave = (s63Base * d.cosP63 + c63Base * d.sinP63) * 0.9;
        const w2 = wave * wave;
        const cw = 1 - 0.5 * w2 * (1 - 0.08333333 * w2);
        const sw = wave * (1 - 0.16666667 * w2 * (1 - 0.05 * w2));
        if (d.pose === 1 && d.heldFlagId >= 0) {
          if (!heldFlagVis[d.heldFlagId]) {
            heldFlagVis[d.heldFlagId] = 1;
            heldFlagBatch.setVisibleAt(d.heldFlagId, true);
          }
          me[0] = cw * m0 - sw * m8;
          me[1] = cw * m1 - sw * m9;
          me[2] = cw * m2 - sw * m10;
          me[4] = m4;
          me[5] = m5;
          me[6] = m6;
          me[8] = sw * m0 + cw * m8;
          me[9] = sw * m1 + cw * m9;
          me[10] = sw * m2 + cw * m10;
          me[12] = x + 0.3 * m0 + 1.97 * m4 - 0.1 * m8;
          me[13] = ty + 0.3 * m1 + 1.97 * m5 - 0.1 * m9;
          me[14] = tz + 0.3 * m2 + 1.97 * m6 - 0.1 * m10;
          heldFlagBatch.setMatrixAt(d.heldFlagId, this.scratchMat);
        } else if (ragsMat) {
          writeArr(
            ragsMat,
            ragSlot,
            cw * m0 - sw * m8,
            cw * m1 - sw * m9,
            cw * m2 - sw * m10,
            m4,
            m5,
            m6,
            sw * m0 + cw * m8,
            sw * m1 + cw * m9,
            sw * m2 + cw * m10,
            x - 0.42 * m0 + 1.93 * m4 - 0.06 * m8,
            ty - 0.42 * m1 + 1.93 * m5 - 0.06 * m9,
            tz - 0.42 * m2 + 1.93 * m6 - 0.06 * m10,
          );
          if (colorsChanged) setRgbArr(ragsCol, ragSlot, d.rag1R, d.rag1G, d.rag1B);
          ragSlot++;
          writeArr(
            ragsMat,
            ragSlot,
            cw * m0 + sw * m8,
            cw * m1 + sw * m9,
            cw * m2 + sw * m10,
            m4,
            m5,
            m6,
            -sw * m0 + cw * m8,
            -sw * m1 + cw * m9,
            -sw * m2 + cw * m10,
            x + 0.42 * m0 + 1.93 * m4 - 0.06 * m8,
            ty + 0.42 * m1 + 1.93 * m5 - 0.06 * m9,
            tz + 0.42 * m2 + 1.93 * m6 - 0.06 * m10,
          );
          if (colorsChanged) setRgbArr(ragsCol, ragSlot, d.rag2R, d.rag2G, d.rag2B);
          ragSlot++;
        }
      }

      const pm0 = r00 * k0;
      const pm1 = r10 * k0;
      const pm2 = r20 * k0;
      const pm8 = r02 * k0;
      const pm9 = r12 * k0;
      const pm10 = r22 * k0;
      const pty = ty + 1.3 * k0;
      if (d.frontline && nearDetail) {
        writeArr(medMat, medallionsCount, pm0, pm1, pm2, m4, m5, m6, pm8, pm9, pm10, x, pty, tz);
        if (colorsChanged) setRgbArr(medCol, medallionsCount, d.suitR, d.suitG, d.suitB);
        medallionsCount++;
      }
      if (!plumeVis[d.plumeId]) {
        plumeVis[d.plumeId] = 1;
        plumeBatch.setVisibleAt(d.plumeId, true);
      }
      me[0] = pm0;
      me[1] = pm1;
      me[2] = pm2;
      me[4] = m4;
      me[5] = m5;
      me[6] = m6;
      me[8] = pm8;
      me[9] = pm9;
      me[10] = pm10;
      me[12] = x;
      me[13] = pty;
      me[14] = tz;
      plumeBatch.setMatrixAt(d.plumeId, this.scratchMat);
    }

    if (this.rags) {
      this.rags.count = ragSlot;
      this.rags.instanceMatrix.needsUpdate = true;
      if (colorsChanged && this.rags.instanceColor) this.rags.instanceColor.needsUpdate = true;
    }
    const updateColored = (m: InstancedMesh | null, cnt: number) => {
      if (!m) return;
      m.count = cnt;
      m.instanceMatrix.needsUpdate = true;
      if (colorsChanged && m.instanceColor) m.instanceColor.needsUpdate = true;
    };
    updateColored(costumes, women);
    updateColored(this.trunks, men);
    updateColored(this.medallions, medallionsCount);
    updateColored(this.fringes, fringesCount);
    updateColored(this.hair, vis);
    for (let p = 0; p < poseCount; p++) {
      updateColored(this.bodies[p]!, posed[p]!);
      updateColored(this.nearBodies[p]!, nearPosed[p]!);
    }
  }

  /**
   * Steel bike-rack barricades along both gutters, 2.4 m apiece: rails, pickets and end posts
   * on splayed feet, linked end to end. Two in five carry a carnival banner zip-tied to the
   * face towards the road.
   */
  private addBarricades(): void {
    const random = seeded(421);
    const choose = seeded(431);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += BARRICADE) {
        const roll = random();
        // Two in three carry a banner; the choice comes from a seed of its own.
        const pick = choose();
        const banner = roll < 0.66 ? Math.floor(pick * BARRICADE_BANNERS.length) : -1;
        this.barricades.push({ side, offset: offset + BARRICADE / 2, banner, bannerId: -1 });
      }
    }
    const frame = barricadeGeometry();
    const steel = this.material({ color: 0xb9bec4, metalness: 0.75, roughness: 0.42 });
    this.disposables.push(frame);
    this.barricadeFrames = this.instanced(frame, steel, this.barricades.length, false);
    const rows = BARRICADE_BANNERS.length;
    const atlasMat = this.material({
      map: this.track(
        clothBannerStackTexture(BARRICADE_BANNERS.map((b) => [b.text, b.fill, b.ink] as const)),
      ),
      roughness: 0.75,
    });
    const cloths = BARRICADE_BANNERS.map((_, idx) => {
      const cloth = slicePlaneUv(2.3, 0.72, 0, 1, idx, rows, 700, 130 * rows);
      cloth.rotateY(-Math.PI / 2);
      cloth.translate(-0.035, 0.66, 0);
      this.disposables.push(cloth);
      return cloth;
    });
    let bannerTotal = 0;
    for (const b of this.barricades) if (b.banner >= 0) bannerTotal++;
    const pack = makeStreetBatch(
      cloths,
      bannerTotal,
      atlasMat,
      this.group,
      this.disposables,
      false,
    );
    this.barricadeBannerBatch = pack.batch;
    for (let k = 0; k < cloths.length; k++) {
      const gid = pack.geoIds[k]!;
      for (const b of this.barricades) {
        if (b.banner === k) b.bannerId = pack.batch.addInstance(gid);
      }
    }
  }

  private placeBarricades(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const frames = this.barricadeFrames;
    const bannerBatch = this.barricadeBannerBatch;
    if (!frames || !bannerBatch) return;
    const fArr = frames.instanceMatrix.array as Float32Array;
    const me = this.scratchMat.elements;
    me[1] = 0;
    me[2] = 0;
    me[3] = 0;
    me[4] = 0;
    me[5] = 1;
    me[6] = 0;
    me[7] = 0;
    me[8] = 0;
    me[9] = 0;
    me[11] = 0;
    me[15] = 1;
    let fCount = 0;
    for (const b of this.barricades) {
      const metres = along(b.offset, LOOP);
      if (metres <= DANCER_BEHIND_CULL || metres > 235) {
        if (b.bannerId >= 0 && bannerBatch.getVisibleAt(b.bannerId)) {
          bannerBatch.setVisibleAt(b.bannerId, false);
        }
        continue;
      }
      const sgn = b.side > 0 ? 1 : -1;
      const tx = b.side * BARRIER;
      const ty = heightAt(Math.max(metres, 0)) + ASPHALT;
      const tz = -metres;
      const o = fCount * 16;
      fArr[o] = sgn;
      fArr[o + 1] = 0;
      fArr[o + 2] = 0;
      fArr[o + 3] = 0;
      fArr[o + 4] = 0;
      fArr[o + 5] = 1;
      fArr[o + 6] = 0;
      fArr[o + 7] = 0;
      fArr[o + 8] = 0;
      fArr[o + 9] = 0;
      fArr[o + 10] = sgn;
      fArr[o + 11] = 0;
      fArr[o + 12] = tx;
      fArr[o + 13] = ty;
      fArr[o + 14] = tz;
      fArr[o + 15] = 1;
      fCount++;
      if (b.bannerId >= 0) {
        if (!bannerBatch.getVisibleAt(b.bannerId)) bannerBatch.setVisibleAt(b.bannerId, true);
        me[0] = sgn;
        me[10] = sgn;
        me[12] = tx;
        me[13] = ty;
        me[14] = tz;
        bannerBatch.setMatrixAt(b.bannerId, this.scratchMat);
      }
    }
    frames.count = fCount;
    frames.instanceMatrix.needsUpdate = true;
  }

  /**
   * T-shirt mas: band members in the band's T-shirts and shorts dancing among the costumed
   * sections, as every big band carries, arms up or waving rags, with caps, bandanas and hair.
   */
  private addTeeShirtMas(): void {
    const random = seeded(3307);
    // From 10 m ahead of the start, so no one stands in the riders' faces as they set off.
    for (let offset = BEHIND + 10; offset < LOOP; offset += 3.4) {
      if (offset > PAN_AT - 11 && offset < PAN_AT + 19) continue;
      if (random() < 0.4) continue;
      const side = random() < 0.5 ? -1 : 1;
      this.revellers.push({
        x: side * (2.3 + random() * 3.6),
        offset: offset + random() * 2,
        phase: random() * 6.3,
        facing: random() < 0.5 ? Math.PI : side * 0.6,
      });
    }
    const ensemble = new Ensemble(this.group, this.disposables);
    const skin = this.material({ roughness: 0.6, vertexColors: true });
    const cotton = this.material({ roughness: 0.9, vertexColors: true });
    const denim = this.material({ roughness: 0.9, vertexColors: true });
    const hair = this.material({ roughness: 0.95 });
    const bodies = [2, 1].map((stance) => spectatorParts(stance, true));
    const shoes = tintGeometry(shoeGeometry(), 0xe0e0e0);
    shoes.deleteAttribute('uv');
    bodies[0]!.bottom.deleteAttribute('uv');
    const sharedBottom = merge([bodies[0]!.bottom, shoes]);
    this.disposables.push(sharedBottom);
    bodies.forEach((b, idx) => {
      this.disposables.push(b.skin, b.top);
      if (idx > 0) b.bottom.dispose();
    });
    const allHairs = hairParts();
    const hairs = [allHairs[0]!, allHairs[2]!];
    allHairs[1]!.dispose();
    allHairs[3]!.dispose();
    this.disposables.push(...hairs);
    // Each band's T-shirt colour, by the section the reveller dances in.
    const tees = ['#ffd23f', '#ffffff', '#ff2d87', '#13c3c9', '#ff8a00', '#111111'];
    this.revellers.forEach((r, i) => {
      const pose = Math.floor(random() * bodies.length);
      const body = bodies[pose]!;
      const tee = tees[Math.floor(r.offset / 40) % tees.length]!;
      ensemble.put(i, `skin${pose}`, body.skin, skin, SKINS[Math.floor(random() * SKINS.length)]!);
      ensemble.put(i, `top${pose}`, body.top, cotton, tee);
      ensemble.put(i, 'bottom', sharedBottom, denim, TROUSERS[Math.floor(random() * 4)]!);
      const style = Math.floor(random() * hairs.length);
      ensemble.put(i, `hair${style}`, hairs[style]!, hair, style === 1 ? tee : '#1a1410');
    });
    ensemble.build();
    this.teeShirts = ensemble;
  }

  /**
   * The band rope: volunteers in orange vests walking either side of the band in the right
   * lanes, holding a long rope at waist height between them to keep the section together and
   * the riders' corridor clear, the rope sagging between each pair of hands.
   */
  private addBandRope(): void {
    const random = seeded(3701);
    const rope = new Group();
    const span = 3.2;
    const stations = 12;
    const vest = this.material({ color: 0xff7a00, roughness: 0.7, emissive: 0x3a1800 });
    const shorts = this.material({ color: 0x1e2530, roughness: 0.9 });
    const cord = this.material({ color: 0xe8e2d0, roughness: 0.9 });
    for (let k = 0; k <= stations; k++) {
      const z = -k * span;
      const parts = spectatorParts(0, true);
      this.disposables.push(parts.skin, parts.top, parts.bottom);
      const keeper = new Group();
      const skin = this.material({
        color: SKINS[Math.floor(random() * SKINS.length)],
        roughness: 0.6,
      });
      keeper.add(
        new Mesh(parts.skin, skin),
        new Mesh(parts.top, vest),
        new Mesh(parts.bottom, shorts),
      );
      keeper.position.set(0, 0, z);
      keeper.rotation.y = Math.PI / 2 + (random() - 0.5) * 0.4;
      rope.add(keeper);
      if (k === stations) break;
      // The rope from this keeper's hand to the next, sagging in the middle.
      const sag = new TubeGeometry(
        new QuadraticBezierCurve3(
          new Vector3(-0.22, 0.85, z),
          new Vector3(-0.22, 0.55, z - span / 2),
          new Vector3(-0.22, 0.85, z - span),
        ),
        10,
        0.015,
        4,
      );
      this.disposables.push(sag);
      rope.add(new Mesh(sag, cord));
    }
    rope.traverse((o) => (o.castShadow = true));
    const holder = new Group();
    holder.add(rope);
    this.group.add(holder);
    this.props.push({
      mesh: holder,
      offset: BEHIND + 14,
      every: LOOP,
      x: 1.9,
      road: true,
      marching: true,
    });
  }

  private placeTeeShirtMas(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const ensemble = this.teeShirts;
    if (!ensemble) return;
    const bucket = Math.floor(along(this.march, LOOP) * 0.5);
    const colorsChanged = bucket !== this.teeBucket;
    this.teeBucket = bucket;
    ensemble.beginFrame();
    for (let i = 0; i < this.revellers.length; i++) {
      const r = this.revellers[i]!;
      const metres = along(r.offset + this.march, LOOP);
      if (metres <= DANCER_BEHIND_CULL || metres > DANCER_HORIZON_CULL) continue;
      const t = this.time + r.phase;
      const s21 = Math.sin(t * 2.1);
      const c21 = Math.cos(t * 2.1);
      const bounce = Math.abs(s21 * c21) * 0.16;
      const yaw = r.facing + s21 * 0.3;
      ensemble.emitYawScaled(
        i,
        r.x + Math.sin(t * 0.6) * 0.3,
        heightAt(metres > 0 ? metres : 0) + ASPHALT + bounce,
        -metres,
        Math.cos(yaw) * 0.96,
        Math.sin(yaw) * 0.96,
        0.96,
        colorsChanged,
      );
    }
    ensemble.commit(colorsChanged);
  }

  /**
   * Moko jumbies: stilt walkers 4 m tall striding among the bands, their stilts hidden in long
   * striped trousers, in satin shirts and tall hats, with fans of satin spread from the wrists.
   */
  private addMokoJumbies(): void {
    const looks = [
      { stripes: ['#c8102e', '#ffffff'], shirt: '#ffd23f', hat: '#c8102e', wings: COSTUMES[2]! },
      { stripes: ['#0f9d58', '#ffd23f'], shirt: '#111111', hat: '#0f9d58', wings: COSTUMES[1]! },
      { stripes: ['#7b2ff7', '#ffd23f'], shirt: '#ffffff', hat: '#7b2ff7', wings: COSTUMES[3]! },
      { stripes: ['#ff2d87', '#13c3c9'], shirt: '#13c3c9', hat: '#ffd23f', wings: COSTUMES[0]! },
    ];
    const torso = new CylinderGeometry(0.19, 0.16, 0.6, 12);
    torso.scale(1, 1, 0.75);
    torso.translate(0, 3.0, 0);
    torso.deleteAttribute('uv');
    const arms = merge(
      [-1, 1].flatMap((side) =>
        limb(
          new Vector3(side * 0.2, 3.25, 0),
          new Vector3(side * 0.85, 3.45, -0.05),
          0.05,
          0.04,
        ).map((g) => {
          g.deleteAttribute('uv');
          return g;
        }),
      ),
    );
    const head = ellipsoid(0.11, 0.9, 1.1, 1, 0, 3.47, -0.01);
    head.deleteAttribute('uv');
    tintGeometry(head, SKINS[1]);
    const brim = new CylinderGeometry(0.22, 0.22, 0.02, 16);
    brim.translate(0, 3.58, 0);
    brim.deleteAttribute('uv');
    const crown = new CylinderGeometry(0.13, 0.14, 0.36, 14);
    crown.translate(0, 3.77, 0);
    crown.deleteAttribute('uv');
    const hat = mergeGeometries([brim, crown])!;
    brim.dispose();
    crown.dispose();
    const stripeAtlasMat = this.material({
      map: this.track(
        mokoStripeAtlasTexture(looks.map((l) => [l.stripes[0]!, l.stripes[1]!] as const)),
      ),
      vertexColors: true,
      roughness: 0.55,
    });
    const legGeos: BufferGeometry[] = [];
    const hipsGeos: BufferGeometry[] = [];
    const upperGeos: BufferGeometry[] = [];
    const wingGeos: BufferGeometry[] = [];
    looks.forEach((look, idx) => {
      const leg = new CylinderGeometry(0.1, 0.13, 2.6, 10);
      leg.translate(0, -1.3, 0);
      const u0 = idx * 0.25 + 0.5 / 256;
      const u1 = (idx + 1) * 0.25 - 0.5 / 256;
      const lUv = leg.getAttribute('uv') as BufferAttribute;
      for (let i = 0; i < lUv.count; i++) lUv.setX(i, u0 + lUv.getX(i) * (u1 - u0));
      tintGeometry(leg, 0xffffff);
      const foot = new BoxGeometry(0.16, 0.08, 0.3);
      foot.translate(0, -2.62, -0.04);
      const fUv = foot.getAttribute('uv') as BufferAttribute;
      for (let i = 0; i < fUv.count; i++) fUv.setXY(i, u0, 0.5);
      tintGeometry(foot, 0x161616);
      const mergedLeg = merge([leg, foot]);
      const hips = ellipsoid(0.17, 1.15, 0.7, 0.85, 0, 2.66, 0);
      const hUv = hips.getAttribute('uv') as BufferAttribute;
      for (let i = 0; i < hUv.count; i++) hUv.setX(i, u0 + hUv.getX(i) * (u1 - u0));
      tintGeometry(hips, 0xffffff);
      legGeos.push(mergedLeg);
      hipsGeos.push(hips);

      const tClone = tintGeometry(torso.clone(), look.shirt);
      const aClone = tintGeometry(arms.clone(), look.shirt);
      const hClone = head.clone();
      const hatClone = tintGeometry(hat.clone(), look.hat);
      const upper = merge([tClone, aClone, hClone, hatClone]);
      upperGeos.push(upper);

      const [outer, mid] = look.wings.feathers;
      const wingLeft = featherFan(outer!, 9, 0.95, 0.34, Math.PI * 0.55, 0)
        .rotateZ(-(Math.PI / 2 + 0.35))
        .translate(-0.2, 3.1, -0.02);
      const wingRight = featherFan(mid!, 9, 0.95, 0.34, Math.PI * 0.55, 0)
        .rotateZ(Math.PI / 2 + 0.35)
        .translate(0.2, 3.1, -0.02);
      const wingsMerged = mergeGeometries([wingLeft, wingRight])!;
      wingLeft.dispose();
      wingRight.dispose();
      wingGeos.push(wingsMerged);
      this.disposables.push(mergedLeg, hips, upper, wingsMerged);
    });
    torso.dispose();
    arms.dispose();
    head.dispose();
    hat.dispose();

    const mokoCount = 6;
    const stripeGeos = [...legGeos, ...hipsGeos];
    const farStripe = makeStreetBatch(
      stripeGeos,
      mokoCount * 3,
      stripeAtlasMat,
      this.group,
      this.disposables,
      false,
      true,
    );
    const nearStripe = makeStreetBatch(
      stripeGeos,
      mokoCount * 3,
      stripeAtlasMat,
      this.group,
      this.disposables,
      true,
      true,
    );
    const farBody = makeStreetBatch(
      upperGeos,
      mokoCount,
      this.propSolidMat,
      this.group,
      this.disposables,
      false,
      true,
    );
    const nearBody = makeStreetBatch(
      upperGeos,
      mokoCount,
      this.propSolidMat,
      this.group,
      this.disposables,
      true,
      true,
    );
    const wings = makeStreetBatch(
      wingGeos,
      mokoCount,
      this.satinWing,
      this.group,
      this.disposables,
      false,
      true,
    );
    this.mokoStripeBatch = farStripe.batch;
    this.mokoNearStripeBatch = nearStripe.batch;
    this.mokoBodyBatch = farBody.batch;
    this.mokoNearBodyBatch = nearBody.batch;
    this.mokoWingBatch = wings.batch;

    const random = seeded(733);
    const rawMokos: { lookIdx: number; offset: number; x: number; phase: number }[] = [];
    for (let k = 0; k < mokoCount; k++) {
      const lookIdx = k % looks.length;
      const side = k % 2 ? -1 : 1;
      const offset = k === 0 ? BEHIND + 17 : k === 1 ? BEHIND + 12 : 72 + k * 57 + random() * 10;
      rawMokos.push({
        lookIdx,
        offset,
        x: k === 0 ? 4.6 : k === 1 ? -3.4 : side * (3.2 + random() * 2.2),
        phase: random() * 6.3,
      });
    }
    const entries = rawMokos.map((rm) => ({
      offset: rm.offset,
      x: rm.x,
      phase: rm.phase,
      leftLegId: -1,
      rightLegId: -1,
      hipsId: -1,
      nearLeftLegId: -1,
      nearRightLegId: -1,
      nearHipsId: -1,
      bodyId: -1,
      nearBodyId: -1,
      wingId: -1,
      state: -1,
    }));
    for (let idx = 0; idx < looks.length; idx++) {
      const farLegGid = farStripe.geoIds[idx]!;
      const nearLegGid = nearStripe.geoIds[idx]!;
      rawMokos.forEach((rm, k) => {
        if (rm.lookIdx !== idx) return;
        const e = entries[k]!;
        e.leftLegId = farStripe.batch.addInstance(farLegGid);
        e.rightLegId = farStripe.batch.addInstance(farLegGid);
        farStripe.batch.setVisibleAt(e.leftLegId, false);
        farStripe.batch.setVisibleAt(e.rightLegId, false);
        e.nearLeftLegId = nearStripe.batch.addInstance(nearLegGid);
        e.nearRightLegId = nearStripe.batch.addInstance(nearLegGid);
        nearStripe.batch.setVisibleAt(e.nearLeftLegId, false);
        nearStripe.batch.setVisibleAt(e.nearRightLegId, false);
      });
    }
    for (let idx = 0; idx < looks.length; idx++) {
      const farHipsGid = farStripe.geoIds[looks.length + idx]!;
      const nearHipsGid = nearStripe.geoIds[looks.length + idx]!;
      const farBodyGid = farBody.geoIds[idx]!;
      const nearBodyGid = nearBody.geoIds[idx]!;
      const wingGid = wings.geoIds[idx]!;
      rawMokos.forEach((rm, k) => {
        if (rm.lookIdx !== idx) return;
        const e = entries[k]!;
        e.hipsId = farStripe.batch.addInstance(farHipsGid);
        farStripe.batch.setVisibleAt(e.hipsId, false);
        e.nearHipsId = nearStripe.batch.addInstance(nearHipsGid);
        nearStripe.batch.setVisibleAt(e.nearHipsId, false);
        e.bodyId = farBody.batch.addInstance(farBodyGid);
        farBody.batch.setVisibleAt(e.bodyId, false);
        e.nearBodyId = nearBody.batch.addInstance(nearBodyGid);
        nearBody.batch.setVisibleAt(e.nearBodyId, false);
        e.wingId = wings.batch.addInstance(wingGid);
        wings.batch.setVisibleAt(e.wingId, false);
      });
    }
    this.mokos.push(...entries);
  }

  /**
   * A King or Queen of the band for each band: the showpiece costume on a wheeled frame, a
   * towering fan of plumes in three layers 4 m high with wings of plumes either side, a great
   * jewelled medallion at the hub, a sequinned skirt over the wheels and the masquerader at its
   * heart, arms spread, facing back towards the riders.
   */
  private addRoyals(): void {
    const plumes =
      this.sharedPlumesMat ??
      (this.sharedPlumesMat = this.material({
        map: this.track(featherTexture()),
        alphaTest: 0.4,
        side: DoubleSide,
        vertexColors: true,
        roughness: 0.6,
      }));
    const sequins =
      this.sharedSequinsMat ??
      (this.sharedSequinsMat = this.material({
        map: this.repeat(sequinTexture(), 0.25, 0.25),
        roughness: 0.28,
        metalness: 0.55,
      }));
    const suitVertexMat =
      this.sharedSequinsVertexMat ??
      (this.sharedSequinsVertexMat = this.material({
        map: sequins.map,
        vertexColors: true,
        roughness: 0.25,
        metalness: 0.65,
      }));
    const skinMaterial = this.material({ color: SKINS[2], roughness: 0.55 });
    const random = seeded(1009);
    const castor = new CylinderGeometry(0.16, 0.16, 0.1, 14);
    castor.rotateZ(Math.PI / 2);
    this.disposables.push(castor);
    const castorRubber = this.material({ color: 0x151515, roughness: 0.8 });
    for (let i = 0; i < LOOP / TRUCK_EVERY; i++) {
      const costume = COSTUMES[(i + 1) % COSTUMES.length]!;
      const [outer, mid, inner] = costume.feathers;
      const piece = new Group();
      // The bands alternate: a King leads the first, a Queen the second, a King the third.
      if (i % 2 === 0) {
        this.buildKing(piece, costume, plumes, suitVertexMat, skinMaterial);
      } else {
        const fan = mergeGeometries([
          featherFan(outer!, 31, 4.2, 0.55, Math.PI * 1.1, 0.18),
          featherFan(mid!, 25, 3.0, 0.6, Math.PI * 1.04, 0.14),
          featherFan(inner!, 19, 1.8, 0.5, Math.PI, 0.1),
        ])!;
        fan.translate(0, 1.9, 0.45);
        const wings = mergeGeometries(
          [-1, 1].map((side) => {
            const wing = featherFan(side < 0 ? mid! : outer!, 13, 2.1, 0.42, Math.PI * 0.75, 0.05);
            wing.rotateZ(side * -1.2);
            wing.translate(side * 1.9, 1.3, 0.25);
            return wing;
          }),
        )!;
        const medallion = tintGeometry(medallionGeometry(), costume.suit);
        medallion.scale(3.2, 3.2, 3.2);
        medallion.translate(0, 1.85, -0.1);
        const skirt = tintGeometry(
          new CylinderGeometry(0.9, 1.7, 1.3, 28, 1, true).translate(0, 0.65, 0.2),
          costume.suit,
        );
        const frame = tintGeometry(
          new TorusGeometry(1.6, 0.06, 6, 36, Math.PI).translate(0, 1.95, 0.3),
          costume.suit,
        );
        const body = masBody(POSES[2]!);
        const suit = tintGeometry(masCostume(false), costume.suit);
        const crown = featherFan(inner!, 15, 1.2, 0.18, Math.PI * 0.7, 0.1);
        crown.translate(0, 1.7, 0);
        this.disposables.push(fan, wings, medallion, skirt, frame, body, suit, crown);
        piece.add(new Mesh(fan, plumes), new Mesh(wings, plumes), new Mesh(crown, plumes));
        piece.add(new Mesh(medallion, suitVertexMat), new Mesh(skirt, suitVertexMat));
        piece.add(new Mesh(frame, suitVertexMat));
        piece.add(new Mesh(body, skinMaterial), new Mesh(suit, suitVertexMat));
      }
      // The frame rolls on four castors under the skirt, and two helpers in the band's
      // T-shirts walk at its back corners, steadying it through the crowd.
      for (const [x, z] of [
        [-1.2, -0.6],
        [1.2, -0.6],
        [-1.2, 1.0],
        [1.2, 1.0],
      ] as const) {
        const wheel = new Mesh(castor, castorRubber);
        wheel.position.set(x, 0.16, z);
        piece.add(wheel);
      }
      for (const x of [-1.9, 1.9]) {
        const helper = new Group();
        const parts = spectatorParts(0, true);
        this.disposables.push(parts.skin, parts.top, parts.bottom);
        const skin = this.material({
          color: SKINS[Math.floor(random() * SKINS.length)],
          roughness: 0.6,
        });
        helper.add(
          new Mesh(parts.skin, skin),
          new Mesh(parts.top, this.material({ color: costume.suit })),
        );
        helper.add(new Mesh(parts.bottom, this.material({ color: 0x1e2530, roughness: 0.9 })));
        helper.position.set(x, 0, 1.6);
        helper.rotation.y = Math.PI + (x < 0 ? 0.3 : -0.3);
        piece.add(helper);
      }
      piece.traverse((o) => {
        if (o instanceof Mesh) o.castShadow = o.material !== plumes;
      });
      this.group.add(piece);
      this.royals.push({ piece, offset: i * TRUCK_EVERY + ROYAL_AT, phase: random() * 6.3 });
    }
  }

  /**
   * A King of the band: a man in sequinned trunks and a cape inside a towering frame, a
   * square-shouldered back frame 5 m tall fringed with long plumes along its top and sides,
   * a great sun disc of rays behind his head, a sequinned breastplate and a tall crown.
   */
  private buildKing(
    piece: Group,
    costume: (typeof COSTUMES)[number],
    plumes: Material,
    suitVertexMat: Material,
    skinMaterial: Material,
  ): void {
    const [outer, mid, inner] = costume.feathers;
    const gold = this.material({ color: 0xe8b830, roughness: 0.25, metalness: 0.85 });
    // The frame: two uprights and a crossbar, plumes fringing it.
    const frame = mergeGeometries(
      [
        [-1.9, 2.5, 0.12, 4.6, 0.12],
        [1.9, 2.5, 0.12, 4.6, 0.12],
        [0, 4.8, 3.9, 0.14, 0.12],
      ].map(([x, y, w, h, d]) => new BoxGeometry(w, h, d).translate(x!, y!, 0.5).toNonIndexed()),
    )!;
    const top = featherFan(outer!, 27, 2.2, 0.4, Math.PI * 0.6, 0.15);
    top.translate(0, 4.8, 0.55);
    const sides = mergeGeometries(
      [-1, 1].map((side) => {
        const fringe = featherFan(mid!, 15, 1.7, 0.36, Math.PI * 0.5, 0.05);
        fringe.rotateZ(side * -1.35);
        fringe.translate(side * 1.95, 2.9, 0.55);
        return fringe;
      }),
    )!;
    // The sun disc: rays of plumes round a gold boss behind the head.
    const sun = featherFan(inner!, 36, 1.3, 0.22, Math.PI * 2 - 0.2, 0);
    sun.translate(0, 1.75, 0.4);
    const boss = new CylinderGeometry(0.55, 0.55, 0.08, 28);
    boss.rotateX(Math.PI / 2);
    boss.translate(0, 1.75, 0.35);
    const cape = tintGeometry(
      new CylinderGeometry(0.28, 0.9, 1.4, 20, 1, true, Math.PI * 0.2, Math.PI * 1.6).translate(
        0,
        0.75,
        0.12,
      ),
      costume.suit,
    );
    const breastplate = tintGeometry(ellipsoid(0.2, 1.15, 0.8, 0.5, 0, 1.25, -0.08), costume.suit);
    const crown = featherFan(outer!, 13, 1.1, 0.16, Math.PI * 0.45, 0.05);
    crown.translate(0, 1.72, 0);
    const body = masBody(POSES[2]!, true);
    const trunks = tintGeometry(masCostume(true), costume.suit);
    this.disposables.push(frame, top, sides, sun, boss, cape, breastplate, crown, body, trunks);
    piece.add(new Mesh(frame, gold), new Mesh(top, plumes), new Mesh(sides, plumes));
    piece.add(new Mesh(sun, plumes), new Mesh(boss, gold), new Mesh(crown, plumes));
    piece.add(new Mesh(cape, suitVertexMat), new Mesh(breastplate, suitVertexMat));
    piece.add(new Mesh(body, skinMaterial), new Mesh(trunks, suitVertexMat));
  }

  private readonly satinWing = new MeshStandardMaterial({
    vertexColors: true,
    side: DoubleSide,
    roughness: 0.35,
    metalness: 0.2,
  });

  private placeMokoJumbies(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const farStripe = this.mokoStripeBatch;
    const nearStripe = this.mokoNearStripeBatch;
    const farBody = this.mokoBodyBatch;
    const nearBody = this.mokoNearBodyBatch;
    const wings = this.mokoWingBatch;
    if (!farStripe || !nearStripe || !farBody || !nearBody || !wings) return;
    const me = this.scratchMat.elements;
    me[3] = 0;
    me[7] = 0;
    me[11] = 0;
    me[15] = 1;
    for (const m of this.mokos) {
      const metres = along(m.offset + this.march, LOOP);
      const visible = metres > PROP_BEHIND_CULL && metres <= PROP_HORIZON_CULL;
      const cast = visible && metres > SHADOW_NEAR && metres < SHADOW_FAR;
      const nextState = !visible ? 0 : cast ? 2 : 1;
      if (m.state !== nextState) {
        m.state = nextState;
        const showFar = nextState === 1;
        const showNear = nextState === 2;
        farStripe.setVisibleAt(m.leftLegId, showFar);
        farStripe.setVisibleAt(m.rightLegId, showFar);
        farStripe.setVisibleAt(m.hipsId, showFar);
        farBody.setVisibleAt(m.bodyId, showFar);
        nearStripe.setVisibleAt(m.nearLeftLegId, showNear);
        nearStripe.setVisibleAt(m.nearRightLegId, showNear);
        nearStripe.setVisibleAt(m.nearHipsId, showNear);
        nearBody.setVisibleAt(m.nearBodyId, showNear);
        wings.setVisibleAt(m.wingId, visible);
      }
      if (!visible) continue;
      const t = this.time * 1.6 + m.phase;
      const st = Math.sin(t);
      const ct = Math.cos(t);
      const lift = Math.abs(ct) * 0.05 - 0.03;
      const px = m.x + Math.sin(t * 0.25) * 0.5;
      const py = heightAt(metres > 0 ? metres : 0) + ASPHALT + lift;
      const pz = -metres;
      const fy = Math.sin(t * 0.3) * 0.5 + (m.phase > 3 ? Math.PI : 0);
      const fz = st * 0.03;
      const cy = Math.cos(fy);
      const sy = Math.sin(fy);
      const cz = 1 - 0.5 * fz * fz;
      const sz = fz;
      const f0 = cy * cz;
      const f1 = sz;
      const f2 = -sy * cz;
      const f4 = -cy * sz;
      const f5 = cz;
      const f6 = sy * sz;
      const f8 = sy;
      const f10 = cy;

      const sBatch = cast ? nearStripe : farStripe;
      const bBatch = cast ? nearBody : farBody;
      const hipsId = cast ? m.nearHipsId : m.hipsId;
      const bodyId = cast ? m.nearBodyId : m.bodyId;
      const leftId = cast ? m.nearLeftLegId : m.leftLegId;
      const rightId = cast ? m.nearRightLegId : m.rightLegId;

      me[0] = f0;
      me[1] = f1;
      me[2] = f2;
      me[4] = f4;
      me[5] = f5;
      me[6] = f6;
      me[8] = f8;
      me[9] = 0;
      me[10] = f10;
      me[12] = px;
      me[13] = py;
      me[14] = pz;
      sBatch.setMatrixAt(hipsId, this.scratchMat);
      bBatch.setMatrixAt(bodyId, this.scratchMat);
      wings.setMatrixAt(m.wingId, this.scratchMat);

      const swing = st * 0.16;
      const ca = 1 - 0.5 * swing * swing;
      const sa = swing;
      const pBaseX = px + 2.66 * f4;
      const pBaseY = py + 2.66 * f5;
      const pBaseZ = pz + 2.66 * f6;

      // Left leg: pivot (-0.1, 2.66, 0), rotation.x = +swing
      me[0] = f0;
      me[1] = f1;
      me[2] = f2;
      me[4] = ca * f4 + sa * f8;
      me[5] = ca * f5;
      me[6] = ca * f6 + sa * f10;
      me[8] = -sa * f4 + ca * f8;
      me[9] = -sa * f5;
      me[10] = -sa * f6 + ca * f10;
      me[12] = pBaseX - 0.1 * f0;
      me[13] = pBaseY - 0.1 * f1;
      me[14] = pBaseZ - 0.1 * f2;
      sBatch.setMatrixAt(leftId, this.scratchMat);

      // Right leg: pivot (+0.1, 2.66, 0), rotation.x = -swing
      me[4] = ca * f4 - sa * f8;
      me[5] = ca * f5;
      me[6] = ca * f6 - sa * f10;
      me[8] = sa * f4 + ca * f8;
      me[9] = sa * f5;
      me[10] = sa * f6 + ca * f10;
      me[12] = pBaseX + 0.1 * f0;
      me[13] = pBaseY + 0.1 * f1;
      me[14] = pBaseZ + 0.1 * f2;
      sBatch.setMatrixAt(rightId, this.scratchMat);
    }
  }

  /** Concrete pavements to the barricades and the crowd, grass beyond, the lake on the right. */
  private addGround(points: number): void {
    const concrete = this.material({ map: this.repeat(concreteTexture(), 4, 4), roughness: 0.9 });
    const grass = this.material({ map: this.repeat(grassTexture(), 6, 6), roughness: 1 });
    const stone = this.material({ map: this.repeat(stoneTexture(), 3, 3), roughness: 0.95 });
    const lake = this.material({
      map: this.repeat(waterTexture(), 24, 24),
      color: 0x6fa6c4,
      roughness: 0.12,
      metalness: 0.1,
    });
    const asphalt = (this.sharedAsphaltMat ??= this.material({
      map: this.roadMap ?? this.repeat(roadTexture(), 2 * CURB, 18),
      roughness: 0.85,
    }));
    const kerb = this.material({ color: 0xc4c0b8, roughness: 0.8 });
    // Each profile runs from greater x to smaller, so its faces look up (or at the road).
    this.ribbons.add(points, asphalt, [
      [CURB, ASPHALT],
      [-CURB, ASPHALT],
    ]);
    // Drifts of confetti swept against both gutters, thick at the kerb and thinning out.
    const drifts = this.material({
      map: this.repeat(driftTexture(), 1.1, 6),
      alphaTest: 0.5,
      roughness: 0.6,
    });
    this.ribbons.add(points, drifts, [
      [CURB - 0.02, ASPHALT + 0.004],
      [CURB - 1.12, ASPHALT + 0.004],
    ]);
    this.ribbons.add(points, drifts, [
      [-CURB + 1.12, ASPHALT + 0.004],
      [-CURB + 0.02, ASPHALT + 0.004],
    ]);
    this.ribbons.add(points, kerb, [
      [CURB + 0.2, KERB],
      [CURB, KERB],
      [CURB, ASPHALT],
    ]);
    this.ribbons.add(points, kerb, [
      [-CURB, ASPHALT],
      [-CURB, KERB],
      [-CURB - 0.2, KERB],
    ]);
    this.ribbons.add(points, concrete, [
      [PAVEMENT, KERB + 0.01],
      [CURB + 0.2, KERB],
    ]);
    this.ribbons.add(points, concrete, [
      [-CURB - 0.2, KERB],
      [-PAVEMENT, KERB + 0.01],
    ]);
    // The crowds' feet darken the pavement where they stand packed together.
    const trodden = this.material({
      color: 0x0e0e10,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      roughness: 1,
    });
    this.ribbons.add(points, trodden, [
      [PAVEMENT, KERB + 0.02],
      [CROWD_NEAR - 0.6, KERB + 0.02],
    ]);
    this.ribbons.add(points, trodden, [
      [-CROWD_NEAR + 0.6, KERB + 0.02],
      [-PAVEMENT, KERB + 0.02],
    ]);
    this.ribbons.add(points, grass, [
      [SHORE - 3, 0.3],
      [PAVEMENT, KERB + 0.01],
    ]);
    this.ribbons.add(points, grass, [
      [-PAVEMENT, KERB + 0.01],
      [-80, 0.1],
    ]);
    this.ribbons.add(points, stone, [
      [SHORE + 0.4, 0.02],
      [SHORE - 1.2, 0.55],
      [SHORE - 3, 0.3],
    ]);
    this.ribbons.add(points, lake, [
      [600, 0.03],
      [SHORE + 0.4, 0.03],
    ]);
  }

  /**
   * Mas bands across the lanes: dancers in sequinned bras, bikinis and boots with beaded belts and
   * collars, feathered backpieces and headdresses, each in one of three poses.
   */
  private addMasqueraders(roadHalf: number): void {
    const random = seeded(73);
    const near = roadHalf - 1.5;
    const raw: Masquerader[] = [];
    for (let offset = 0; offset < LOOP; offset += 1.9) {
      const fromTruck = (((offset - TRUCK_EVERY / 2) % TRUCK_EVERY) + TRUCK_EVERY) % TRUCK_EVERY;
      for (const side of [-1, 1] as const) {
        const section = (Math.floor(offset / 40) + (side > 0 ? 4 : 0)) % COSTUMES.length;
        if (side < 0 && (fromTruck < 11 || fromTruck > TRUCK_EVERY - 11)) continue;
        const fromBanner = (((offset - ROYAL_AT + 18) % TRUCK_EVERY) + TRUCK_EVERY) % TRUCK_EVERY;
        if (side > 0 && (fromBanner < 3 || fromBanner > TRUCK_EVERY - 3)) continue;
        const fromRoyal = (((offset - ROYAL_AT) % TRUCK_EVERY) + TRUCK_EVERY) % TRUCK_EVERY;
        if (side > 0 && (fromRoyal < 6 || fromRoyal > TRUCK_EVERY - 6)) continue;
        if (side < 0 && offset > PAN_AT - 11 && offset < PAN_AT + 19) continue;
        if (random() < 0.25) continue;
        raw.push({
          side,
          offset: offset + random() * 1.6,
          x: side * (near + random() * (BARRIER - near - 0.8)),
          costume: (section + (random() < 0.15 ? 1 : 0)) % COSTUMES.length,
          phase: random() * 6.3,
          pose: 0,
          skin: '',
          frontline: false,
          shaded: -1,
          male: false,
          build: 1,
        });
      }
    }
    const posing = seeded(137);
    const kids = seeded(139);
    const hairs = seeded(149);
    const dyes = ['#120c08', '#1d130d', '#2c1d14', '#0a0a0a', '#5a2a1a', '#c79a4b', '#6b1f2a'];
    const c = new Color();
    let ragCounter = 0;
    raw.forEach((d, idx) => {
      const pose = Math.floor(posing() * POSES.length);
      const skinHex = SKINS[Math.floor(posing() * SKINS.length)]!;
      const frontline = posing() < 0.34;
      const male = posing() < 0.2;
      const build = male ? 0.98 + posing() * 0.17 : 0.94 + posing() * posing() * 0.34;
      const family = d.offset > BEHIND + 5 && d.offset < BEHIND + 9 && d.side < 0;
      const child = kids() < 0.07 || (family && !male);
      c.set(skinHex);
      const skinR = c.r;
      const skinG = c.g;
      const skinB = c.b;
      c.set(COSTUMES[d.costume]!.suit);
      const suitR = c.r;
      const suitG = c.g;
      const suitB = c.b;
      c.set(dyes[Math.floor(hairs() * dyes.length)]!);
      const hairR = c.r;
      const hairG = c.g;
      const hairB = c.b;
      const [outer] = COSTUMES[d.costume]!.feathers;
      c.set(outer![1]);
      const rag1R = c.r;
      const rag1G = c.g;
      const rag1B = c.b;
      if (pose === 0) ragCounter += 2;
      c.set(ragCounter % 4 ? '#ffffff' : outer![0]);
      const rag2R = c.r;
      const rag2G = c.g;
      const rag2B = c.b;
      const baseYaw = idx % 2 ? Math.PI - d.side * 0.5 : d.side * 0.55;
      const wine = d.phase % 1 < 0.6 ? 1 : 0.4;
      const k0 = child ? 0.6 : 1;
      const bw = build * (male ? 1.1 : 1) * k0;
      this.dancers.push({
        ...d,
        pose,
        skin: skinHex,
        frontline: frontline && !child,
        male,
        build,
        child,
        skinR,
        skinG,
        skinB,
        suitR,
        suitG,
        suitB,
        hairR,
        hairG,
        hairB,
        rag1R,
        rag1G,
        rag1B,
        rag2R,
        rag2G,
        rag2B,
        baseCy: Math.cos(baseYaw),
        baseSy: Math.sin(baseYaw),
        sinP21: Math.sin(d.phase * 2.1),
        cosP21: Math.cos(d.phase * 2.1),
        sinP07: Math.sin(d.phase * 0.7),
        cosP07: Math.cos(d.phase * 0.7),
        sinP63: Math.sin(d.phase * 6.3),
        cosP63: Math.cos(d.phase * 6.3),
        rxAmp: 0.12 * wine,
        rzAmp: 0.042 + 0.08 * wine,
        k0,
        bw,
        plumeId: -1,
        heldFlagId: -1,
      });
    });

    const n = this.dancers.length;
    const skin = this.material({ roughness: 0.5, vertexColors: true });
    POSES.forEach((pose, p) => {
      const body = masBody(pose);
      this.disposables.push(body);
      const cap = Math.max(1, this.dancers.filter((d) => d.pose === p).length);
      const farMesh = this.instanced(body, skin, cap, false);
      farMesh.setColorAt(0, c.setRGB(1, 1, 1));
      this.bodies.push(farMesh);
      const nearCap = Math.max(1, Math.min(cap, 44));
      const nearMesh = this.instanced(body, skin, nearCap, true);
      nearMesh.setColorAt(0, c.setRGB(1, 1, 1));
      this.nearBodies.push(nearMesh);
    });
    const costume = masCostume(false);
    const trunks = masCostume(true);
    this.disposables.push(costume, trunks);
    const sequins =
      this.sharedSequinsMat ??
      (this.sharedSequinsMat = this.material({
        map: this.repeat(sequinTexture(), 0.25, 0.25),
        roughness: 0.28,
        metalness: 0.55,
      }));
    const womenCap = Math.max(1, this.dancers.filter((d) => !d.male).length);
    const menCap = Math.max(1, this.dancers.filter((d) => d.male).length);
    this.costumes = this.instanced(costume, sequins, womenCap, false);
    this.costumes.setColorAt(0, c.setRGB(1, 1, 1));
    this.trunks = this.instanced(trunks, sequins, menCap, false);
    this.trunks.setColorAt(0, c.setRGB(1, 1, 1));

    const plumes =
      this.sharedPlumesMat ??
      (this.sharedPlumesMat = this.material({
        map: this.track(featherTexture()),
        alphaTest: 0.4,
        side: DoubleSide,
        vertexColors: true,
        roughness: 0.6,
      }));
    const backGeos: BufferGeometry[] = [];
    const collarGeos: BufferGeometry[] = [];
    COSTUMES.forEach((costumeSpec) => {
      const [outer, mid, inner] = costumeSpec.feathers;
      const tall = mergeGeometries([
        featherFan(outer!, 13, 0.95, 0.14, Math.PI * 0.75, 0.15),
        featherFan(mid!, 9, 0.7, 0.16, Math.PI * 0.6, 0.1),
        featherFan(inner!, 3, 1.15, 0.2, 0.12, 0.05),
      ])!;
      tall.translate(0, 0.44, -0.06);
      const frontLayers = [
        featherFan(outer!, 19, 1.55, 0.22, Math.PI * 1.08, 0.3),
        featherFan(mid!, 13, 1.05, 0.3, Math.PI, 0.25),
        featherFan(inner!, 9, 0.62, 0.26, Math.PI * 0.95, 0.2),
        tall,
      ];
      const back = mergeGeometries(frontLayers)!;
      frontLayers.forEach((l) => l.dispose());
      this.disposables.push(back);
      backGeos.push(back);

      const crown = featherFan(inner!, 9, 0.55, 0.12, Math.PI * 0.6, 0.12);
      crown.translate(0, 0.4, 0);
      const secLayers = [
        featherFan(mid!, 11, 0.62, 0.16, Math.PI * 0.95, 0.35).translate(0, 0.05, -0.02),
        featherFan(inner!, 7, 0.4, 0.15, Math.PI * 0.85, 0.25).translate(0, 0.05, -0.02),
        crown,
      ];
      const collar = mergeGeometries(secLayers)!;
      secLayers.forEach((l) => l.dispose());
      this.disposables.push(collar);
      collarGeos.push(collar);
    });
    const plumePack = makeStreetBatch(
      [...backGeos, ...collarGeos],
      this.dancers.length,
      plumes,
      this.group,
      this.disposables,
      false,
    );
    this.plumeBatch = plumePack.batch;
    for (let k = 0; k < COSTUMES.length; k++) {
      const bGid = plumePack.geoIds[k]!;
      for (const d of this.dancers) {
        if (d.frontline && d.costume === k) d.plumeId = plumePack.batch.addInstance(bGid);
      }
      const cGid = plumePack.geoIds[COSTUMES.length + k]!;
      for (const d of this.dancers) {
        if (!d.frontline && d.costume === k) d.plumeId = plumePack.batch.addInstance(cGid);
      }
    }
    this.plumeVis = new Uint8Array(Math.max(1, this.dancers.length));
    this.plumeVis.fill(1);

    const locks: BufferGeometry[] = [ellipsoid(0.112, 0.95, 0.86, 0.96, 0, 1.645, 0.034)];
    for (let b = 0; b < 5; b++) {
      const a = -0.75 + (b / 4) * 1.5;
      const top = new Vector3(Math.sin(a) * 0.1, 1.6, 0.06 + Math.cos(a) * 0.04);
      const end = new Vector3(Math.sin(a) * 0.15, 1.22 + (b % 2) * 0.06, 0.12 + Math.cos(a) * 0.04);
      locks.push(...limb(top, end, 0.022, 0.018, 4, false));
    }
    const hair = merge(locks);
    this.disposables.push(hair);
    this.hair = this.instanced(hair, this.material({ roughness: 0.85 }), Math.max(1, n), false);
    this.hair.setColorAt(0, c.setRGB(0.1, 0.08, 0.06));

    const heldFlagGeos = FLAG_KINDS.map((_, idx) => {
      const flag = slicePlaneUv(0.6, 0.4, idx % 2, 2, Math.floor(idx / 2), 2, 600, 400, 2, 1);
      flag.translate(0.3, 0.32, 0);
      const stick = new CylinderGeometry(0.01, 0.01, 0.75, 4);
      stick.translate(0, 0.2, 0);
      const sUv = stick.getAttribute('uv') as BufferAttribute;
      const uPin = (idx % 2) * 0.5 + 0.01;
      const vPin = 1 - (Math.floor(idx / 2) + 1) * 0.5 + 0.01;
      for (let vi = 0; vi < sUv.count; vi++) sUv.setXY(vi, uPin, vPin);
      const merged = merge([flag, stick]);
      this.disposables.push(merged);
      return merged;
    });
    let pose1Count = 0;
    for (const d of this.dancers) if (d.pose === 1) pose1Count++;
    const heldPack = makeStreetBatch(
      heldFlagGeos,
      pose1Count,
      this.flagAtlasMat,
      this.group,
      this.disposables,
      false,
    );
    this.heldFlagBatch = heldPack.batch;
    for (let fk = 0; fk < FLAG_KINDS.length; fk++) {
      const gid = heldPack.geoIds[fk]!;
      this.dancers.forEach((d, idx) => {
        if (d.pose === 1 && idx % FLAG_KINDS.length === fk) {
          d.heldFlagId = heldPack.batch.addInstance(gid);
        }
      });
    }
    this.heldFlagVis = new Uint8Array(Math.max(1, pose1Count));
    this.heldFlagVis.fill(1);
    const rag = new PlaneGeometry(0.34, 0.3, 1, 1);
    rag.translate(0.15, 0.1, 0);
    this.disposables.push(rag);
    const ragCloth = this.material({ side: DoubleSide, roughness: 0.7 });
    const pose0Cap = Math.max(1, this.dancers.filter((d) => d.pose === 0).length * 2);
    this.rags = this.instanced(rag, ragCloth, pose0Cap, false);
    this.rags.setColorAt(0, c.setRGB(1, 1, 1));

    const fringe = new CylinderGeometry(0.17, 0.2, 0.26, 12, 1, true);
    fringe.scale(1.05, 1, 0.86);
    fringe.translate(0, 0.86, 0);
    this.disposables.push(fringe);
    const beads = this.material({
      map: this.track(fringeTexture()),
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.3,
      metalness: 0.5,
    });
    this.fringes = this.instanced(fringe, beads, womenCap, false);
    this.fringes.setColorAt(0, c.setRGB(1, 1, 1));

    const medallion = medallionGeometry();
    this.disposables.push(medallion);
    const frontCap = Math.max(1, this.dancers.filter((d) => d.frontline).length);
    this.medallions = this.instanced(medallion, sequins, frontCap, false);
    this.medallions.setColorAt(0, c.setRGB(1, 1, 1));
  }

  /**
   * The bands' music trucks in the left lane: a long-nosed tractor with chrome stacks hauling a
   * flatbed. On the deck four truss towers carry a tarp roof, line arrays hang from the rear
   * corners over a wall of subs facing the band behind, coloured lights line the top truss,
   * and a DJ and crew dance at the booth under the band's name.
   */
  private addTrucks(): void {
    const dark = this.material({ color: 0x1b1c1f, roughness: 0.6 });
    const glass = this.material({ color: 0x1d2a33, roughness: 0.08, metalness: 0.6 });
    const chrome = this.material({ color: 0xe6e8ea, roughness: 0.15, metalness: 1 });
    const rubber = this.material({ color: 0x151515, roughness: 0.9 });
    const hub = this.material({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 });
    const deckWood = this.material({ color: 0x6b5138, roughness: 0.9 });
    const trussTex = (this.sharedTrussTex ??= this.track(trussTexture()));
    const truss = this.material({
      map: trussTex,
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0xd5d8db,
      metalness: 0.8,
      roughness: 0.35,
    });
    const speakers = this.material({ map: this.track(speakerTexture()), roughness: 0.7 });
    const cabinet = [dark, dark, dark, dark, speakers, dark];
    const lights = ['#ff2d87', '#ffd23f', '#13c3c9', '#7b2ff7'].map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 2.2 }),
    );
    this.truckLights.push(...lights);
    const tyre = new CylinderGeometry(0.52, 0.52, 0.3, 16);
    tyre.rotateZ(Math.PI / 2);
    const rim = new CylinderGeometry(0.3, 0.3, 0.32, 12);
    rim.rotateZ(Math.PI / 2);
    const stack = new CylinderGeometry(0.08, 0.08, 2.8, 10);
    const tank = new CylinderGeometry(0.32, 0.32, 1.3, 14);
    tank.rotateX(Math.PI / 2);
    const can = new CylinderGeometry(0.1, 0.12, 0.22, 10);
    this.disposables.push(tyre, rim, stack, tank, can);
    const crew = [
      [0, 2, 1.55],
      [2, 1, 1.55],
      [3, 0.5, 4.2],
      [2, -0.7, 5.5],
    ] as const;
    const truckBannerEntries = [
      ['SOCA KINGDOM', '#c8102e'],
      ['ISLAND PEOPLE', '#ffb000'],
      ['TROPICAL FUSION', '#0f9d58'],
      ['LAKESHORE STEEL ORCHESTRA', '#c8102e'],
    ] as const;
    const banner = (this.sharedTruckBannerMat ??= this.material({
      map: this.track(truckBannerAtlasTexture(truckBannerEntries)),
      roughness: 0.6,
    }));
    for (let i = 0; i < LOOP / TRUCK_EVERY; i++) {
      const truck = new Group();
      const rowIdx = i % 3;
      const paint = truckBannerEntries[rowIdx]![1];
      const body = this.material({ color: paint, roughness: 0.3, metalness: 0.4 });
      const tarp = this.material({ color: paint, roughness: 0.8 });
      const box = (
        m: Material | Material[],
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(w, h, d);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        truck.add(mesh);
        return mesh;
      };
      const part = (geometry: BufferGeometry, m: Material, x: number, y: number, z: number) => {
        const mesh = new Mesh(geometry, m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        truck.add(mesh);
        return mesh;
      };
      // The tractor: a long bonnet, the cab and a sleeper, chrome grille, stacks and tanks.
      box(body, 2.2, 1.3, 2.2, 0, 1.05, -8.3); // bonnet
      box(chrome, 1.3, 1.1, 0.08, 0, 1.1, -9.42); // grille
      box(chrome, 2.5, 0.3, 0.3, 0, 0.6, -9.45); // bumper
      box(body, 2.5, 2.1, 1.9, 0, 1.05, -6.3); // cab
      box(glass, 2.3, 0.85, 0.05, 0, 2.15, -7.27); // windscreen
      box(glass, 2.52, 0.7, 1.2, 0, 2.2, -6.35); // side windows
      box(body, 2.5, 2.6, 1.6, 0, 1.05, -4.6); // sleeper
      for (const x of [-1.32, 1.32]) {
        part(stack, chrome, x, 3.2, -5.45);
        part(tank, chrome, x * 0.95, 0.85, -5.8);
      }
      box(dark, 1.2, 0.5, 9.4, 0, 0.6, -4.6); // tractor frame
      // The flatbed: chassis, a timber deck, and the band's name along the skirt.
      box(dark, 1.2, 0.5, 12.4, 0, 0.9, 3.4);
      box(body, 2.6, 0.12, 12.4, 0, 1.4, 3.4);
      box(deckWood, 2.5, 0.04, 12.3, 0, 1.52, 3.4);
      for (const side of [-1, 1]) {
        const skirt = new Mesh(slicePlaneUv(11.6, 0.62, 0, 1, rowIdx, 4, 1024, 512), banner);
        skirt.position.set(side * 1.31, 1.1, 3.6);
        skirt.rotation.y = side * (Math.PI / 2);
        truck.add(skirt);
        this.disposables.push(skirt.geometry);
      }
      // Four truss towers, the top truss and a tarp roof in the band's colour.
      for (const x of [-1.15, 1.15]) {
        for (const z of [-2.5, 9.2]) box(truss, 0.3, 4, 0.3, x, 1.55, z);
        box(truss, 0.3, 0.3, 11.7, x, 5.55, 3.35);
      }
      for (const z of [-2.5, 9.2]) box(truss, 2.6, 0.3, 0.3, 0, 5.55, z);
      box(tarp, 2.9, 0.06, 12.2, 0, 5.95, 3.35);
      const valance = new Mesh(slicePlaneUv(2.9, 0.7, 0, 1, rowIdx, 4, 1024, 512), banner);
      valance.position.set(0, 5.5, 9.42);
      truck.add(valance);
      this.disposables.push(valance.geometry);
      // Line arrays curving down from the rear corners, and the subs between them.
      for (const x of [-1.0, 1.0]) {
        for (let k = 0; k < 7; k++) {
          const cab = box(cabinet, 0.62, 0.3, 0.5, x, 5.15 - k * 0.31, 9.0 + k * 0.015);
          cab.rotation.x = -0.02 - k * k * 0.008;
        }
      }
      box(cabinet, 2.3, 0.9, 1.0, 0, 1.55, 8.3);
      box(cabinet, 2.3, 0.9, 1.0, 0, 2.45, 8.3);
      // Coloured lights along the rear top truss, pointing at the band.
      for (let k = 0; k < 6; k++) {
        const light = part(can, lights[k % lights.length]!, -1.0 + k * 0.4, 5.25, 9.2);
        light.rotation.x = Math.PI / 2 + 0.5;
      }
      // The DJ booth, a generator, and the DJ and crew dancing on the deck.
      box(dark, 1.8, 1.0, 0.7, 0, 1.55, 2.6);
      const front = new Mesh(slicePlaneUv(1.8, 0.6, 0, 1, rowIdx, 4, 1024, 512), banner);
      front.position.set(0, 2.15, 2.96);
      truck.add(front);
      this.disposables.push(front.geometry);
      box(dark, 1.0, 1.1, 1.6, 0, 1.55, -1.4);
      const random = seeded(500 + i);
      for (const [stance, x, z] of crew) {
        const person = spectatorParts(stance, random() < 0.5);
        const figure = new Group();
        const tone = SKINS[Math.floor(random() * SKINS.length)]!;
        const shirt = SHIRTS[Math.floor(random() * SHIRTS.length)]!;
        const pairs: [BufferGeometry, string][] = [
          [person.skin, tone],
          [person.top, shirt],
          [person.bottom, TROUSERS[Math.floor(random() * TROUSERS.length)]!],
        ];
        for (const [geometry, colour] of pairs) {
          const m = this.material({
            color: colour,
            roughness: geometry === person.skin ? 0.6 : 0.9,
          });
          this.disposables.push(geometry);
          figure.add(new Mesh(geometry, m));
        }
        // The DJ (stance 0) works the decks facing the band behind; the crew face the crowds.
        figure.rotation.y = stance === 0 ? Math.PI : x < 0 ? Math.PI / 2 : -Math.PI / 2;
        figure.position.set(x, 1.55, z);
        figure.traverse((o) => (o.castShadow = true));
        truck.add(figure);
      }
      // Tractor wheels (a steer axle and a tandem) and the trailer's tandem at the rear.
      for (const z of [-8.2, -5.0, -3.8, 6.4, 7.6]) {
        for (const x of [-1.12, 1.12]) {
          part(tyre, rubber, x, 0.52, z);
          part(rim, hub, x, 0.52, z);
        }
      }
      this.group.add(truck);
      this.props.push({
        mesh: truck,
        offset: i * TRUCK_EVERY + 60,
        every: LOOP,
        x: TRUCK_X,
        road: true,
        marching: true,
      });
    }
  }

  /**
   * Toronto arterial lights behind the crowds: tapered octagonal galvanised poles on base
   * plates, a davit arm curving out over the gutter to a cobra-head luminaire, and two banner
   * brackets holding a pair of flag banners taut across the pole, square to the road.
   */
  private addLamps(): void {
    const pole = new CylinderGeometry(0.085, 0.17, 10.4, 8);
    pole.translate(0, 5.2, 0);
    const plate = new BoxGeometry(0.55, 0.08, 0.55);
    plate.translate(0, 0.04, 0);
    const skirt = new CylinderGeometry(0.2, 0.3, 0.5, 8);
    skirt.translate(0, 0.33, 0);
    const davit = new TubeGeometry(
      new CubicBezierCurve3(
        new Vector3(0, 9.8, 0),
        new Vector3(0, 11.2, 0),
        new Vector3(-1.4, 11.3, 0),
        new Vector3(-4.4, 10.9, 0),
      ),
      16,
      0.06,
      6,
    );
    const head = ellipsoid(0.42, 1.7, 0.36, 0.75, -4.75, 10.85, 0);
    const lens = ellipsoid(0.38, 1.45, 0.12, 0.62, -4.8, 10.76, 0);
    const brackets = mergeGeometries(
      [4.0, 6.3].map((y) => {
        const bar = new BoxGeometry(1.8, 0.05, 0.05);
        bar.translate(0, y, 0);
        return bar;
      }),
    )!;
    const cloth = new PlaneGeometry(0.74, 2.2);
    const basketBracket = new BoxGeometry(1.1, 0.04, 0.04);
    basketBracket.translate(-0.55, 3.4, 0);
    const basket = new SphereGeometry(0.38, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    basket.translate(-1.05, 2.95, 0);
    const blooms = new SphereGeometry(0.5, 14, 9);
    blooms.scale(1, 0.62, 1);
    blooms.translate(-1.05, 3.0, 0);
    // Petunias in pink, magenta, white and purple, splashed over the dome by vertex colour.
    const petals = ['#ff4fa3', '#c2187a', '#ffffff', '#7b2ff7', '#ff7ab8'].map((c) => new Color(c));
    const leafGreen = new Color('#3f7a33');
    const bloomPositions = blooms.getAttribute('position');
    const bloomColours = new Float32Array(bloomPositions.count * 3);
    const splash = seeded(4307);
    for (let v = 0; v < bloomPositions.count; v++) {
      const c = splash() < 0.72 ? petals[Math.floor(splash() * petals.length)]! : leafGreen;
      bloomColours.set([c.r, c.g, c.b], v * 3);
    }
    blooms.setAttribute('color', new BufferAttribute(bloomColours, 3));
    const strands = [];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const strand = new CylinderGeometry(0.03, 0.015, 0.6 + (k % 3) * 0.2, 5);
      strand.translate(-1.05 + Math.cos(a) * 0.36, 2.55 - (k % 3) * 0.1, Math.sin(a) * 0.36);
      strands.push(strand);
    }
    const trailing = mergeGeometries(strands)!;
    strands.forEach((g) => g.dispose());
    const lampSteel = mergeGeometries([pole, plate, skirt, davit, brackets, basketBracket])!;
    [pole, plate, skirt, davit, brackets, basketBracket].forEach((g) => g.dispose());
    const lampBodyParts = [
      tintGeometry(lampSteel, 0xa9aeb2),
      tintGeometry(head, 0x8c9196),
      tintGeometry(lens, 0xe8ecef),
      tintGeometry(basket, 0x5a4632),
      blooms,
      tintGeometry(trailing, 0x2f6b2a),
    ];
    for (const part of lampBodyParts) {
      for (const attrName of Object.keys(part.attributes)) {
        if (attrName !== 'position' && attrName !== 'normal' && attrName !== 'color') {
          part.deleteAttribute(attrName);
        }
      }
    }
    const lampBody = mergeGeometries(lampBodyParts)!;
    lampBodyParts.forEach((g) => g.dispose());
    cloth.dispose();
    this.disposables.push(lampBody);
    const festivalSpecs = [
      ['#c8102e', '#ffd23f'],
      ['#111111', '#ff2d87'],
      ['#0f9d58', '#ffffff'],
    ] as const;
    const totalCols = festivalSpecs.length + FLAG_KINDS.length;
    const lampBannerMat = this.material({
      map: this.track(lampBannerAtlasTexture(festivalSpecs)),
      side: DoubleSide,
      roughness: 0.8,
    });
    const bannerGeos = Array.from({ length: totalCols }, (_, col) => {
      const g = slicePlaneUv(0.74, 2.2, col, totalCols, 0, 1, 200 * totalCols, 600);
      this.disposables.push(g);
      return g;
    });
    const rawItems: {
      side: -1 | 1;
      offset: number;
      x: number;
      festIdx: number;
      flagIdx: number;
      festId: number;
      flagId: number;
    }[] = [];
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 36) {
        const festIdx = (k >> 1) % festivalSpecs.length;
        const flagIdx = k++ % FLAG_KINDS.length;
        rawItems.push({
          side,
          offset: offset + (side > 0 ? 18 : 0),
          x: side * (PAVEMENT + 0.3),
          festIdx,
          flagIdx,
          festId: -1,
          flagId: -1,
        });
      }
    }
    const n = Math.max(1, rawItems.length);
    const bannerPack = makeStreetBatch(
      bannerGeos,
      rawItems.length * 2,
      lampBannerMat,
      this.group,
      this.disposables,
      false,
    );
    for (let f = 0; f < festivalSpecs.length; f++) {
      const gid = bannerPack.geoIds[f]!;
      for (const it of rawItems) {
        if (it.festIdx === f) it.festId = bannerPack.batch.addInstance(gid);
      }
    }
    for (let fl = 0; fl < FLAG_KINDS.length; fl++) {
      const gid = bannerPack.geoIds[festivalSpecs.length + fl]!;
      for (const it of rawItems) {
        if (it.flagIdx === fl) it.flagId = bannerPack.batch.addInstance(gid);
      }
    }
    this.lampMeshes = {
      body: this.instanced(lampBody, this.propSolidMat, n, false),
      bannerBatch: bannerPack.batch,
      items: rawItems,
    };
  }

  /**
   * Bunting strung across the road between the lamp standards, a string from each lamp to the
   * next one on the other side 18 m on, crossing over the lanes: pennants in the islands'
   * colours sagging over the road.
   */
  private addBunting(): void {
    const across = 2 * (PAVEMENT + 0.3);
    const along = 18;
    const span = Math.hypot(across, along) / 2;
    const colours = ['#ce1126', '#fcd116', '#009e49', '#111111', '#ffffff', '#00267f', '#009b3a'];
    const pennants = this.material({ vertexColors: true, side: DoubleSide, roughness: 0.75 });
    const flagsA = buntingGeometry(span, colours, [[7.7, 0]], 1.6);
    flagsA.rotateY(Math.atan2(along, across));
    const normal = flagsA.getAttribute('normal') as BufferAttribute;
    for (let i = 0; i < normal.count; i++) normal.setXYZ(i, 0, 1, 0.35);
    const flagsB = flagsA.clone();
    flagsB.scale(-1, 1, 1);
    const crossedFlags = mergeGeometries([asNonIndexed(flagsA), asNonIndexed(flagsB)])!;
    flagsA.dispose();
    flagsB.dispose();
    const lineA = new TubeGeometry(
      new QuadraticBezierCurve3(
        new Vector3(-across / 2, 7.7, along / 2),
        new Vector3(0, 7.7 - 3.2, 0),
        new Vector3(across / 2, 7.7, -along / 2),
      ),
      24,
      0.01,
      4,
    );
    const lineB = lineA.clone();
    lineB.scale(-1, 1, 1);
    const crossedLines = tintGeometry(
      mergeGeometries([asNonIndexed(lineA), asNonIndexed(lineB)])!,
      0xeeeeee,
    );
    lineA.dispose();
    lineB.dispose();
    const buntingGeo = merge([crossedFlags, crossedLines]);
    this.disposables.push(buntingGeo);
    const offsets: number[] = [];
    for (let k = 0; k < 2; k++) {
      for (let offset = 0; offset < LOOP; offset += 72) {
        offsets.push(offset + k * 36 + along / 2);
      }
    }
    const cap = Math.max(1, offsets.length);
    this.buntingMeshes = {
      mesh: this.instanced(buntingGeo, pennants, cap, false),
      offsets,
    };
  }

  private placeLampsAndBunting(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const lamps = this.lampMeshes;
    if (lamps) {
      const bannerBatch = lamps.bannerBatch;
      const bArr = lamps.body.instanceMatrix.array as Float32Array;
      const me = this.scratchMat.elements;
      me[0] = 1;
      me[1] = 0;
      me[2] = 0;
      me[3] = 0;
      me[4] = 0;
      me[5] = 1;
      me[6] = 0;
      me[7] = 0;
      me[8] = 0;
      me[9] = 0;
      me[10] = 1;
      me[11] = 0;
      me[15] = 1;
      let partCount = 0;
      for (const it of lamps.items) {
        const metres = along(it.offset, LOOP);
        if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) {
          if (bannerBatch.getVisibleAt(it.festId)) bannerBatch.setVisibleAt(it.festId, false);
          if (bannerBatch.getVisibleAt(it.flagId)) bannerBatch.setVisibleAt(it.flagId, false);
          continue;
        }
        const y = heightAt(Math.max(metres, 0)) + KERB;
        const sgn = it.side > 0 ? 1 : -1;
        const o = partCount * 16;
        bArr[o] = sgn;
        bArr[o + 1] = 0;
        bArr[o + 2] = 0;
        bArr[o + 3] = 0;
        bArr[o + 4] = 0;
        bArr[o + 5] = 1;
        bArr[o + 6] = 0;
        bArr[o + 7] = 0;
        bArr[o + 8] = 0;
        bArr[o + 9] = 0;
        bArr[o + 10] = sgn;
        bArr[o + 11] = 0;
        bArr[o + 12] = it.x;
        bArr[o + 13] = y;
        bArr[o + 14] = -metres;
        bArr[o + 15] = 1;
        partCount++;
        if (!bannerBatch.getVisibleAt(it.festId)) bannerBatch.setVisibleAt(it.festId, true);
        me[12] = it.x - it.side * 0.48;
        me[13] = y + 5.15;
        me[14] = -metres;
        bannerBatch.setMatrixAt(it.festId, this.scratchMat);
        if (!bannerBatch.getVisibleAt(it.flagId)) bannerBatch.setVisibleAt(it.flagId, true);
        me[12] = it.x + it.side * 0.48;
        bannerBatch.setMatrixAt(it.flagId, this.scratchMat);
      }
      lamps.body.count = partCount;
      lamps.body.instanceMatrix.needsUpdate = true;
    }
    const bunt = this.buntingMeshes;
    if (bunt) {
      const fArr = bunt.mesh.instanceMatrix.array as Float32Array;
      let bCount = 0;
      for (const offset of bunt.offsets) {
        const metres = along(offset, LOOP);
        if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) continue;
        const y = heightAt(metres > 0 ? metres : 0) + KERB;
        const o = bCount * 16;
        fArr[o] = 1;
        fArr[o + 1] = 0;
        fArr[o + 2] = 0;
        fArr[o + 3] = 0;
        fArr[o + 4] = 0;
        fArr[o + 5] = 1;
        fArr[o + 6] = 0;
        fArr[o + 7] = 0;
        fArr[o + 8] = 0;
        fArr[o + 9] = 0;
        fArr[o + 10] = 1;
        fArr[o + 11] = 0;
        fArr[o + 12] = 0;
        fArr[o + 13] = y;
        fArr[o + 14] = -metres;
        fArr[o + 15] = 1;
        bCount++;
      }
      bunt.mesh.count = bCount;
      bunt.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Lakeshore park trees: a row of mature maples, lindens and honey locusts on the left and a
   * sparser row by the water on the right. Each is one of four species, with a trunk that forks
   * into limbs and a crown of irregular leaf clumps, lit yellow-green on top and shaded under.
   */
  private addTrees(): void {
    const species = [
      {
        seed: 11,
        clumps: 22,
        radius: 3.1,
        height: 6.6,
        squash: 0.74,
        light: '#8db552',
        dark: '#24481f',
      },
      {
        seed: 37,
        clumps: 20,
        radius: 2.8,
        height: 7.0,
        squash: 0.92,
        light: '#74a448',
        dark: '#1f421c',
      },
    ];
    const leaves = this.material({
      map: this.repeat(leafTexture(), 1.5, 1.5),
      vertexColors: true,
      roughness: 0.9,
    });
    const bark = this.material({
      map: this.repeat(barkTexture(), 1, 2),
      color: 0x8a7a68,
      roughness: 1,
    });
    const shapes = species.map((sp) => treeGeometry(sp));
    for (const { trunk, crown, sprigs } of shapes) this.disposables.push(trunk, crown, sprigs);
    const cut = this.material({
      map: this.track(sprigTexture()),
      vertexColors: true,
      alphaTest: 0.45,
      side: DoubleSide,
      roughness: 0.85,
    });
    const random = seeded(211);
    const rawItems: {
      idx: number;
      x: number;
      offset: number;
      scale: number;
      cy: number;
      sy: number;
      trunkId: number;
      crownId: number;
      sprigId: number;
      visible: boolean;
    }[] = [];
    for (const side of [-1, 1] as const) {
      const every = side < 0 ? 26 : 23;
      for (let offset = 0; offset < LOOP; offset += every) {
        const idx = Math.floor(random() * shapes.length);
        const scale = 0.85 + random() * 0.45;
        const yaw = random() * Math.PI * 2;
        const x = side < 0 ? -(19 + random() * 8) : 12 + random() * 2;
        const at = offset + random() * 4;
        rawItems.push({
          idx,
          x,
          offset: at,
          scale,
          cy: Math.cos(yaw),
          sy: Math.sin(yaw),
          trunkId: -1,
          crownId: -1,
          sprigId: -1,
          visible: true,
        });
      }
    }
    const trunkPack = makeStreetBatch(
      shapes.map((s) => s.trunk),
      rawItems.length,
      bark,
      this.group,
      this.disposables,
      false,
    );
    const crownPack = makeStreetBatch(
      shapes.map((s) => s.crown),
      rawItems.length,
      leaves,
      this.group,
      this.disposables,
      false,
    );
    const sprigPack = makeStreetBatch(
      shapes.map((s) => s.sprigs),
      rawItems.length,
      cut,
      this.group,
      this.disposables,
      false,
    );
    for (let sIdx = 0; sIdx < shapes.length; sIdx++) {
      const tGid = trunkPack.geoIds[sIdx]!;
      const cGid = crownPack.geoIds[sIdx]!;
      const spGid = sprigPack.geoIds[sIdx]!;
      for (const it of rawItems) {
        if (it.idx !== sIdx) continue;
        it.trunkId = trunkPack.batch.addInstance(tGid);
        it.crownId = crownPack.batch.addInstance(cGid);
        it.sprigId = sprigPack.batch.addInstance(spGid);
      }
    }
    this.treeBatches = {
      trunks: trunkPack.batch,
      crowns: crownPack.batch,
      sprigs: sprigPack.batch,
      items: rawItems,
    };
  }

  private placeTrees(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const tb = this.treeBatches;
    if (!tb) return;
    const { trunks, crowns, sprigs, items } = tb;
    const me = this.scratchMat.elements;
    me[1] = 0;
    me[3] = 0;
    me[4] = 0;
    me[6] = 0;
    me[7] = 0;
    me[9] = 0;
    me[11] = 0;
    me[15] = 1;
    for (const it of items) {
      const metres = along(it.offset, LOOP);
      if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) {
        if (it.visible) {
          it.visible = false;
          trunks.setVisibleAt(it.trunkId, false);
          crowns.setVisibleAt(it.crownId, false);
          sprigs.setVisibleAt(it.sprigId, false);
        }
        continue;
      }
      if (!it.visible) {
        it.visible = true;
        trunks.setVisibleAt(it.trunkId, true);
        crowns.setVisibleAt(it.crownId, true);
        sprigs.setVisibleAt(it.sprigId, true);
      }
      const sc = it.scale;
      const m0 = it.cy * sc;
      const m8 = it.sy * sc;
      me[0] = m0;
      me[2] = -m8;
      me[5] = sc;
      me[8] = m8;
      me[10] = m0;
      me[12] = it.x;
      me[13] = heightAt(metres > 0 ? metres : 0) + KERB;
      me[14] = -metres;
      trunks.setMatrixAt(it.trunkId, this.scratchMat);
      crowns.setMatrixAt(it.crownId, this.scratchMat);
      sprigs.setMatrixAt(it.sprigId, this.scratchMat);
    }
  }

  /**
   * Each band's banner at its head: the band's name and the year's theme on a fringed cloth
   * in the band's colours, carried high on two poles by bearers in the band's T-shirts, with
   * two marshals in neon shirts walking ahead to keep the road clear.
   */
  private addBandBanners(): void {
    const bands: readonly (readonly [string, string, string, string])[] = [
      // In the colours of the King or Queen each band brings behind its banner.
      ['SOCA KINGDOM', 'Coral Reef', COSTUMES[1]!.suit, '#ffffff'],
      ['ISLAND PEOPLE', 'Sunfire', COSTUMES[2]!.suit, '#111111'],
      ['TROPICAL FUSION', 'Midnight Orchid', COSTUMES[3]!.suit, '#ffffff'],
    ];
    const pole = new CylinderGeometry(0.025, 0.025, 3.4, 6);
    pole.translate(0, 1.7, 0);
    this.disposables.push(pole);
    const wood = this.material({ color: 0x8a6a45, roughness: 0.8 });
    const neon = this.material({ color: 0xff6a00, roughness: 0.7, emissive: 0x401800 });
    const bandAtlasMat = this.material({
      map: this.track(bandBannerAtlasTexture(bands)),
      side: DoubleSide,
      roughness: 0.7,
      alphaTest: 0.5,
    });
    const random = seeded(1409);
    bands.forEach(([, , fill], i) => {
      const banner = new Group();
      const cloth = slicePlaneUv(4.2, 1.5, 0, 1, i, bands.length, 512, 192 * bands.length, 8, 2);
      cloth.translate(0, 2.65, 0);
      this.disposables.push(cloth);
      banner.add(new Mesh(cloth, bandAtlasMat));
      const shirt = this.material({ color: fill, roughness: 0.9 });
      for (const x of [-2.1, 2.1]) {
        const p = new Mesh(pole, wood);
        p.position.set(x, 0, 0);
        banner.add(p);
        const parts = spectatorParts(0, random() < 0.5);
        this.disposables.push(parts.skin, parts.top, parts.bottom);
        const bearer = new Group();
        const skin = this.material({ color: SKINS[Math.floor(random() * SKINS.length)] });
        bearer.add(new Mesh(parts.skin, skin), new Mesh(parts.top, shirt));
        bearer.add(new Mesh(parts.bottom, this.material({ color: 0x1e2530, roughness: 0.9 })));
        bearer.position.set(x - Math.sign(x) * 0.25, 0, 0.15);
        banner.add(bearer);
      }
      // Two marshals in neon shirts a few metres ahead of the banner.
      for (const x of [-1.6, 1.4]) {
        const parts = spectatorParts(random() < 0.5 ? 0 : 1, false);
        this.disposables.push(parts.skin, parts.top, parts.bottom);
        const marshal = new Group();
        const skin = this.material({ color: SKINS[Math.floor(random() * SKINS.length)] });
        marshal.add(new Mesh(parts.skin, skin), new Mesh(parts.top, neon));
        marshal.add(new Mesh(parts.bottom, this.material({ color: 0x111111, roughness: 0.9 })));
        marshal.position.set(x, 0, -4 - random() * 2);
        marshal.rotation.y = Math.PI + (random() - 0.5) * 0.8;
        banner.add(marshal);
      }
      banner.traverse((o) => (o.castShadow = true));
      const holder = new Group();
      holder.add(banner);
      // The cloth faces back down the road, to the riders and the band behind it; the bearers
      // walk on up the road with it.
      this.group.add(holder);
      this.bandBanners.push({ group: banner, phase: random() * 6 });
      this.props.push({
        mesh: holder,
        offset: i * TRUCK_EVERY + ROYAL_AT - 18,
        every: LOOP,
        x: 2.9,
        road: true,
        marching: true,
      });
    });
  }

  /**
   * A rhythm section on foot, the engine room walking ahead of a band in the left lanes: iron
   * men beating brake drums held up on a strap with steel rods, and drummers with snares and
   * bass drums slung at the hip, in matching band T-shirts and caps, chipping along with the
   * parade and bobbing on the beat.
   */
  private addEngineRoom(): void {
    const random = seeded(2503);
    const shirt = this.material({ color: 0xffd23f, roughness: 0.9 });
    const cap = this.material({ color: 0x111111, roughness: 0.8 });
    const shorts = this.material({ color: 0x1e2530, roughness: 0.9 });
    const iron = this.material({ color: 0x6b6f74, roughness: 0.45, metalness: 0.85 });
    const shell = this.material({ color: 0xc8102e, roughness: 0.35, metalness: 0.3 });
    const head = this.material({ color: 0xf0ece2, roughness: 0.6 });
    const chrome = this.material({ color: 0xdfe2e5, roughness: 0.2, metalness: 1 });
    const brake = new CylinderGeometry(0.14, 0.16, 0.09, 14);
    brake.rotateX(-0.6);
    brake.translate(0, 1.32, -0.3);
    const rod = new CylinderGeometry(0.008, 0.008, 0.32, 5);
    rod.rotateZ(1.1);
    rod.translate(0.1, 1.42, -0.3);
    const snare = new CylinderGeometry(0.19, 0.19, 0.16, 16);
    snare.rotateX(-0.25);
    snare.translate(0, 0.98, -0.3);
    const bass = new CylinderGeometry(0.3, 0.3, 0.32, 18);
    bass.rotateZ(Math.PI / 2);
    bass.translate(0, 1.05, -0.32);
    const rim = new TorusGeometry(0.3, 0.015, 5, 22);
    rim.rotateY(Math.PI / 2);
    rim.translate(0.165, 1.05, -0.32);
    const peak = new CylinderGeometry(0.115, 0.115, 0.09, 12);
    peak.translate(0, 1.71, 0);
    const brim = new BoxGeometry(0.16, 0.012, 0.12);
    brim.translate(0, 1.67, -0.14);
    this.disposables.push(brake, rod, snare, bass, rim, peak, brim);
    const section = new Group();
    for (let k = 0; k < 9; k++) {
      const kind = k % 3; // 0 iron, 1 snare, 2 bass
      const parts = spectatorParts(kind === 0 ? 3 : 6, random() < 0.6);
      this.disposables.push(parts.skin, parts.top, parts.bottom);
      const person = new Group();
      const skin = this.material({
        color: SKINS[Math.floor(random() * SKINS.length)],
        roughness: 0.6,
      });
      person.add(
        new Mesh(parts.skin, skin),
        new Mesh(parts.top, shirt),
        new Mesh(parts.bottom, shorts),
      );
      person.add(new Mesh(peak, cap), new Mesh(brim, cap));
      if (kind === 0) person.add(new Mesh(brake, iron), new Mesh(rod, chrome));
      else if (kind === 1) person.add(new Mesh(snare, shell), new Mesh(snare, head));
      else person.add(new Mesh(bass, shell), new Mesh(rim, chrome));
      person.position.set(-(k % 3) * 1.1, 0, Math.floor(k / 3) * 1.4);
      person.rotation.y = (random() - 0.5) * 0.3;
      section.add(person);
    }
    section.traverse((o) => (o.castShadow = true));
    this.engineRoom = section;
    const holder = new Group();
    holder.add(section);
    this.group.add(holder);
    this.props.push({
      mesh: holder,
      offset: PAN_AT + 14,
      every: LOOP,
      x: -2.4,
      road: true,
      marching: true,
    });
  }

  /**
   * The Toronto Police mounted unit: two officers on tall bay and dark horses standing at the
   * right-hand barricade, watching the bands, the riders in navy with hi-vis vests and white
   * helmets, the horses' tails swishing and heads dipping now and then.
   */
  private addMountedUnit(): void {
    const coats = [0x5a3a24, 0x2a1d16];
    const navy = this.material({ color: 0x1c2333, roughness: 0.85 });
    const vest = this.material({ color: 0xd7f23a, roughness: 0.6, emissive: 0x3a4a00 });
    const helmet = this.material({ color: 0xf2f2f0, roughness: 0.35 });
    const tack = this.material({ color: 0x1a1410, roughness: 0.6 });
    const hoof = this.material({ color: 0x141414, roughness: 0.8 });
    const saddlecloth = this.material({ color: 0x1b3f8a, roughness: 0.8 });
    const steelTack = this.material({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 });
    const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
    for (let k = 0; k < 2; k++) {
      const coat = this.material({ color: coats[k], roughness: 0.55 });
      const horse = new Group();
      const parts: BufferGeometry[] = [];
      // Barrel, chest and hindquarters.
      parts.push(ellipsoid(0.48, 0.68, 0.92, 1.8, 0, 1.47, 0, 14));
      parts.push(ellipsoid(0.4, 0.66, 0.95, 0.85, 0, 1.55, -0.78, 12));
      parts.push(ellipsoid(0.44, 0.78, 0.95, 1, 0, 1.55, 0.72, 12));
      // The neck rising forward, the head and muzzle, the ears.
      parts.push(...limb(v(0, 1.75, -0.8), v(0, 2.35, -1.25), 0.22, 0.15, 10));
      parts.push(...limb(v(0, 2.38, -1.27), v(0, 2.05, -1.72), 0.13, 0.09, 10));
      for (const x of [-0.07, 0.07])
        parts.push(...limb(v(x, 2.45, -1.25), v(x, 2.62, -1.2), 0.03, 0.01, 5));
      // Four legs with knees and the tail.
      for (const [x, z] of [
        [-0.2, -0.75],
        [0.2, -0.75],
        [-0.2, 0.75],
        [0.2, 0.75],
      ] as const) {
        parts.push(...limb(v(x, 1.25, z), v(x, 0.62, z + 0.03), 0.13, 0.075, 8));
        parts.push(...limb(v(x, 0.62, z + 0.03), v(x, 0.1, z), 0.06, 0.055, 8));
      }
      const body = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)))!;
      parts.forEach((g) => g.dispose());
      const hooves = mergeGeometries(
        [
          [-0.2, -0.75],
          [0.2, -0.75],
          [-0.2, 0.75],
          [0.2, 0.75],
        ].map(([x, z]) => {
          const h = new CylinderGeometry(0.07, 0.08, 0.1, 8).translate(x!, 0.05, z!);
          const ni = asNonIndexed(h);
          if (ni !== h) h.dispose();
          return ni;
        }),
      )!;
      const tail = new Group();
      const strands = merge([...limb(v(0, 0, 0), v(0, -0.75, 0.15), 0.07, 0.04, 6)]);
      tail.add(new Mesh(strands, tack));
      tail.position.set(0, 1.65, 1.2);
      const cloth = new BoxGeometry(0.85, 0.5, 0.9);
      cloth.translate(0, 1.72, -0.05);
      const reins = new TorusGeometry(0.3, 0.015, 4, 12, Math.PI);
      reins.rotateY(Math.PI / 2);
      reins.translate(0, 2.0, -1.0);
      this.disposables.push(body, hooves, strands, cloth, reins);
      horse.add(new Mesh(body, coat), new Mesh(hooves, hoof), new Mesh(cloth, saddlecloth));
      horse.add(new Mesh(reins, tack), tail);
      // The mane along the crest of the neck and a forelock between the ears, in tufts.
      const mane: BufferGeometry[] = [];
      for (let m = 0; m <= 10; m++) {
        const t = m / 10;
        const at = v(0, 1.78, -0.82).lerp(v(0, 2.42, -1.2), t);
        const tuft = new BoxGeometry(0.05, 0.22, 0.09);
        tuft.rotateX(0.6);
        tuft.rotateZ((m % 2 ? 1 : -1) * 0.35);
        tuft.translate(m % 2 ? 0.07 : -0.07, at.y + 0.05, at.z + 0.06);
        mane.push(tuft.toNonIndexed());
        tuft.dispose();
      }
      const forelock = new BoxGeometry(0.1, 0.16, 0.04);
      forelock.rotateX(0.5);
      forelock.translate(0, 2.36, -1.36);
      mane.push(forelock.toNonIndexed());
      forelock.dispose();
      const maneGeometry = mergeGeometries(mane)!;
      mane.forEach((g) => g.dispose());
      // The bridle: a browband and noseband round the head, the cheek pieces between.
      const bridle = merge([
        new TorusGeometry(0.13, 0.014, 4, 14)
          .rotateY(Math.PI / 2)
          .rotateZ(0.9)
          .translate(0, 2.3, -1.38),
        new TorusGeometry(0.1, 0.014, 4, 14)
          .rotateY(Math.PI / 2)
          .rotateZ(0.9)
          .translate(0, 2.1, -1.62),
      ]);
      // The saddle on the cloth, and the stirrups hanging either side.
      const saddle = ellipsoid(0.32, 1, 0.35, 1.3, 0, 1.98, -0.05, 12);
      const stirrups = merge(
        [-1, 1].flatMap((side) => [
          ...limb(v(side * 0.36, 1.92, -0.05), v(side * 0.4, 1.3, -0.08), 0.012, 0.012, 4, false),
          new TorusGeometry(0.06, 0.015, 4, 10).translate(side * 0.4, 1.25, -0.08),
        ]),
      );
      this.disposables.push(maneGeometry, bridle, saddle, stirrups);
      const hair = this.material({ color: k ? 0x0e0b09 : 0x1a120c, roughness: 0.85 });
      horse.add(new Mesh(maneGeometry, hair), new Mesh(bridle, tack));
      horse.add(new Mesh(saddle, tack), new Mesh(stirrups, steelTack));
      // The officer in the saddle, legs either side, in navy and hi-vis, a white helmet.
      const rider = spectatorParts(0, false, true);
      this.disposables.push(rider.skin, rider.top, rider.bottom);
      const officer = new Group();
      const skin = this.material({ color: SKINS[(k * 3) % SKINS.length], roughness: 0.6 });
      officer.add(
        new Mesh(rider.skin, skin),
        new Mesh(rider.top, vest),
        new Mesh(rider.bottom, navy),
      );
      const hat = ellipsoid(0.13, 1, 0.85, 1.15, 0, 1.25, 0.0, 12);
      this.disposables.push(hat);
      officer.add(new Mesh(hat, helmet));
      officer.position.set(0, 1.5, 0.05);
      horse.add(officer);
      horse.traverse((o) => (o.castShadow = true));
      // Side on to the road, heads towards the oncoming bands and riders.
      horse.rotation.y = Math.PI - 0.5;
      this.group.add(horse);
      this.mounted.push({ horse, tail, phase: k * 2.3 });
      this.props.push({
        mesh: horse,
        offset: BEHIND + 2 + k * 3.4,
        every: LOOP,
        x: BARRIER - 1.0 - k * 0.2,
        road: true,
      });
    }
  }

  /**
   * Toronto Police officers along the route, accredited press photographers walking ahead of the
   * bands, section-flag bearers carrying swinging poles and banners, and paramedics on bikes.
   */
  private addRoadsideFiguresAndSectionFlags(): void {
    const navy = this.material({ color: 0x1c2333, roughness: 0.85 });
    const vest = this.material({ color: 0xd7f23a, roughness: 0.6, emissive: 0x3a4a00 });
    const checks = this.material({ map: this.track(chequerTexture()), roughness: 0.7 });
    const black = this.material({ color: 0x111111, roughness: 0.6 });
    const green = this.material({ color: 0x1f6f43, roughness: 0.8 });
    const random = seeded(1201);
    const torso = new CylinderGeometry(0.175, 0.17, 0.4, 12);
    torso.scale(1, 1, 0.78);
    torso.translate(0, 1.17, 0);
    const stripe = new CylinderGeometry(0.178, 0.178, 0.05, 12, 1, true);
    stripe.scale(1, 1, 0.78);
    stripe.translate(0, 1.08, 0);
    const crown = new CylinderGeometry(0.12, 0.11, 0.09, 14);
    crown.translate(0, 1.71, 0);
    const band = new CylinderGeometry(0.112, 0.112, 0.05, 14, 1, true);
    band.translate(0, 1.66, 0);
    const peak = new CylinderGeometry(0.08, 0.08, 0.012, 10, 1, false, Math.PI / 2, Math.PI);
    peak.translate(0, 1.645, -0.06);
    this.disposables.push(torso, stripe, crown, band, peak);
    const figure = (top: Material, cap: boolean) => {
      const parts = spectatorParts(0, false);
      const person = new Group();
      const skin = this.material({
        color: SKINS[Math.floor(random() * SKINS.length)],
        roughness: 0.6,
      });
      this.disposables.push(parts.skin, parts.top, parts.bottom);
      person.add(new Mesh(parts.skin, skin), new Mesh(parts.top, navy));
      person.add(new Mesh(parts.bottom, navy), new Mesh(torso, top));
      person.add(new Mesh(stripe, this.material({ color: 0xd8dde0, metalness: 0.6 })));
      if (cap) person.add(new Mesh(crown, navy), new Mesh(band, checks), new Mesh(peak, black));
      person.traverse((o) => (o.castShadow = true));
      return person;
    };
    const officerParts = spectatorParts(0, false);
    const officerSkinMat = this.material({ roughness: 0.6, vertexColors: true });
    const uniformSolidParts = [
      tintGeometry(officerParts.top, 0x1c2333),
      tintGeometry(officerParts.bottom, 0x1c2333),
      tintGeometry(stripe.clone(), 0xd8dde0),
      tintGeometry(crown.clone(), 0x1c2333),
      tintGeometry(peak.clone(), 0x111111),
    ];
    for (const p of uniformSolidParts) p.deleteAttribute('uv');
    const officerSolidGeo = merge(uniformSolidParts);
    this.disposables.push(officerParts.skin, officerSolidGeo);

    const offEnsemble = new Ensemble(this.group, this.disposables);
    let ownerIdx = 0;
    for (let k = 0; k < 8; k++) {
      const side = k % 2 ? 1 : -1;
      const skinHex = SKINS[Math.floor(random() * SKINS.length)]!;
      const yaw = side < 0 ? -Math.PI / 2 + 0.6 : Math.PI / 2 - 0.6;
      const offset = 20 + k * 45 + random() * 8;
      this.officerSpots.push({
        x: side * (BARRIER - 0.5),
        offset,
        cy: Math.cos(yaw),
        sy: Math.sin(yaw),
      });
      offEnsemble.put(ownerIdx, 'skin', officerParts.skin, officerSkinMat, skinHex);
      offEnsemble.put(ownerIdx, 'solid', officerSolidGeo, this.propSolidMat, '#ffffff');
      offEnsemble.put(ownerIdx, 'vest', torso, vest, '#ffffff');
      offEnsemble.put(ownerIdx, 'band', band, checks, '#ffffff');
      ownerIdx++;
    }

    // Accredited press photographers walking ahead of the bands in MEDIA vests.
    const pressRand = seeded(2309);
    const mediaVestMat = this.material({
      map: this.track(clothBannerTexture('MEDIA', '#ff7a00', '#111111')),
      roughness: 0.7,
    });
    const pressParts = spectatorParts(3, false);
    const camBody = tintGeometry(
      new BoxGeometry(0.15, 0.11, 0.08).translate(0, 1.55, -0.3),
      0x141416,
    );
    const camLens = tintGeometry(
      new CylinderGeometry(0.045, 0.05, 0.3, 8).rotateX(Math.PI / 2).translate(0, 1.53, -0.48),
      0x141416,
    );
    const pressSolidList = [
      tintGeometry(pressParts.top, 0x1f2838),
      tintGeometry(pressParts.bottom, 0x2b3444),
      camBody,
      camLens,
    ];
    for (const p of pressSolidList) p.deleteAttribute('uv');
    const pressSolidGeo = merge(pressSolidList);
    const mediaFrontGeo = new CylinderGeometry(
      0.168,
      0.162,
      0.32,
      10,
      1,
      true,
      Math.PI / 2,
      Math.PI,
    );
    mediaFrontGeo.scale(1, 1, 0.76);
    mediaFrontGeo.translate(0, 1.2, 0);
    this.disposables.push(pressParts.skin, pressSolidGeo, mediaFrontGeo);
    for (let k = 0; k < 8; k++) {
      const side = k % 2 ? 1 : -1;
      const skinHex = SKINS[Math.floor(pressRand() * SKINS.length)]!;
      const yaw = Math.PI + (pressRand() - 0.5) * 0.7;
      const offset = 26 + k * 41 + pressRand() * 6;
      const x = side * (1.9 + pressRand() * 2.4);
      this.officerSpots.push({ x, offset, cy: Math.cos(yaw), sy: Math.sin(yaw), marching: true });
      offEnsemble.put(ownerIdx, 'pressSkin', pressParts.skin, officerSkinMat, skinHex);
      offEnsemble.put(ownerIdx, 'pressSolid', pressSolidGeo, this.propSolidMat, '#ffffff');
      offEnsemble.put(ownerIdx, 'mediaVest', mediaFrontGeo, mediaVestMat, '#ffffff');
      ownerIdx++;
    }

    // Section-flag bearers marching at the head of each costume section.
    const names = [
      'FLAMINGO',
      'CORAL REEF',
      'SUNFIRE',
      'ORCHID',
      'GOLD RUSH',
      'LIME LIGHT',
      'FIREBIRD',
      'GLACIER',
    ];
    const secRand = seeded(2609);
    const bearerParts = spectatorParts(1, false);
    bearerParts.bottom.deleteAttribute('uv');
    const bearerBottomGeo = tintGeometry(bearerParts.bottom, 0x1e2530);
    const bearerTopMat = this.material({ roughness: 0.9, vertexColors: true });
    this.disposables.push(bearerParts.skin, bearerParts.top, bearerBottomGeo);

    const poleGeo = tintGeometry(
      new CylinderGeometry(0.025, 0.03, 4.5, 6).translate(0, 2.25, 0),
      0xd8d2c4,
    );
    poleGeo.deleteAttribute('uv');
    this.disposables.push(poleGeo);
    const sectionAtlasMat = this.material({
      map: this.track(
        sectionFlagAtlasTexture(
          names.map((name, idx) => [name, COSTUMES[idx]!.suit] as const),
          4,
          2,
        ),
      ),
      side: DoubleSide,
      roughness: 0.7,
    });
    const sectionCloths = names.map((_, idx) => {
      const cloth = slicePlaneUv(
        1.8,
        1.2,
        idx % 4,
        4,
        Math.floor(idx / 4),
        2,
        4 * 384,
        2 * 256,
        6,
        2,
      );
      cloth.translate(0.92, 3.8, 0);
      const ripple = cloth.getAttribute('position') as BufferAttribute;
      for (let i = 0; i < ripple.count; i++) {
        ripple.setZ(i, Math.sin(ripple.getX(i) * 4) * 0.08 * (ripple.getX(i) / 1.8));
      }
      cloth.rotateY(Math.PI);
      cloth.computeVertexNormals();
      this.disposables.push(cloth);
      return cloth;
    });
    const secTotal = Math.floor(LOOP / 40);
    const clothPack = makeStreetBatch(
      sectionCloths,
      secTotal,
      sectionAtlasMat,
      this.group,
      this.disposables,
      false,
    );
    this.sectionClothBatch = clothPack.batch;
    this.sectionPoles = this.instanced(poleGeo, this.propSolidMat, secTotal, false);
    const rawSec: {
      x: number;
      offset: number;
      phase: number;
      cy: number;
      sy: number;
      costume: number;
      clothId: number;
    }[] = [];
    for (let k = 0; k < secTotal; k++) {
      const costume = k % COSTUMES.length;
      const colour = COSTUMES[costume]!.suit;
      secRand();
      const skinHex = SKINS[Math.floor(secRand() * SKINS.length)]!;
      const yaw = Math.PI + (secRand() - 0.5) * 0.6;
      const phase = secRand() * 6;
      const side = k % 2 ? 1 : -1;
      const x = side * (2.4 + secRand() * 1.5);
      const offset = k * 40 + 2;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      this.officerSpots.push({ x, offset, cy, sy, marching: true });
      offEnsemble.put(ownerIdx, 'bearerSkin', bearerParts.skin, officerSkinMat, skinHex);
      offEnsemble.put(ownerIdx, 'bearerTop', bearerParts.top, bearerTopMat, colour);
      offEnsemble.put(ownerIdx, 'bearerBottom', bearerBottomGeo, this.propSolidMat, '#ffffff');
      ownerIdx++;
      rawSec.push({ x, offset, phase, cy, sy, costume, clothId: -1 });
    }
    for (let cIdx = 0; cIdx < sectionCloths.length; cIdx++) {
      const gid = clothPack.geoIds[cIdx]!;
      for (const s of rawSec) {
        if (s.costume === cIdx) s.clothId = clothPack.batch.addInstance(gid);
      }
    }
    for (const s of rawSec) {
      this.sectionFlagSpots.push({
        x: s.x,
        offset: s.offset,
        phase: s.phase,
        cy: s.cy,
        sy: s.sy,
        clothId: s.clothId,
      });
    }

    offEnsemble.build();
    this.officerEnsemble = offEnsemble;
    // Paramedics on response bikes, a pair at the kerb.
    const frame = new BoxGeometry(0.05, 0.05, 1.0);
    frame.rotateX(-0.35);
    frame.translate(0, 0.68, 0);
    const wheel = new TorusGeometry(0.33, 0.035, 5, 14);
    wheel.rotateY(Math.PI / 2);
    const bag = new BoxGeometry(0.3, 0.3, 0.45);
    bag.translate(0, 0.95, 0.42);
    this.disposables.push(frame, wheel, bag);
    const medicPair = new Group();
    for (const dz of [0, 1.7]) {
      const medic = figure(green, false);
      const bike = new Group();
      bike.add(new Mesh(frame, black), new Mesh(bag, this.material({ color: 0xffd23f })));
      for (const z of [-0.55, 0.55]) {
        const w = new Mesh(wheel, black);
        w.position.set(0, 0.33, z);
        bike.add(w);
      }
      bike.position.set(0.55, 0, 0);
      bike.rotation.y = 0.15;
      const unit = new Group();
      unit.add(medic, bike);
      unit.rotation.y = -Math.PI / 2 + 0.5;
      unit.position.z = -dz;
      medicPair.add(unit);
    }
    this.group.add(medicPair);
    this.props.push({ mesh: medicPair, offset: 31, every: LOOP, x: BARRIER - 0.9, road: true });
  }

  private placeRoadsideFiguresAndSectionFlags(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const ensemble = this.officerEnsemble;
    if (ensemble) {
      ensemble.beginFrame();
      for (let k = 0; k < this.officerSpots.length; k++) {
        const sp = this.officerSpots[k]!;
        const metres = along(sp.offset + (sp.marching ? this.march : 0), LOOP);
        if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) continue;
        ensemble.emitYawScaled(
          k,
          sp.x,
          heightAt(metres > 0 ? metres : 0) + ASPHALT,
          -metres,
          sp.cy,
          sp.sy,
          1,
          true,
        );
      }
      ensemble.commit(true);
    }
    const poles = this.sectionPoles;
    const clothBatch = this.sectionClothBatch;
    if (!poles || !clothBatch) return;
    const pArr = poles.instanceMatrix.array as Float32Array;
    const me = this.scratchMat.elements;
    me[3] = 0;
    me[7] = 0;
    me[11] = 0;
    me[15] = 1;
    let pCount = 0;
    for (const sf of this.sectionFlagSpots) {
      const metres = along(sf.offset + this.march, LOOP);
      if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) {
        if (clothBatch.getVisibleAt(sf.clothId)) clothBatch.setVisibleAt(sf.clothId, false);
        continue;
      }
      const ty = heightAt(Math.max(metres, 0)) + ASPHALT + 0.9;
      const swing = Math.sin(this.time * 1.6 + sf.phase);
      const wy = swing * 0.7;
      const wz = swing * 0.12;
      const cy = sf.cy * Math.cos(wy) - sf.sy * Math.sin(wy);
      const sy = sf.sy * Math.cos(wy) + sf.cy * Math.sin(wy);
      const cz = Math.cos(wz);
      const sz = Math.sin(wz);
      const m0 = cy * cz;
      const m1 = sz;
      const m2 = -sy * cz;
      const m4 = -cy * sz;
      const m5 = cz;
      const m6 = sy * sz;
      const m8 = sy;
      const m10 = cy;
      const px = sf.x + 0.3 * sf.cy - 0.06 * sf.sy;
      const pz = -metres - 0.3 * sf.sy - 0.06 * sf.cy;
      const o = pCount * 16;
      pArr[o] = m0;
      pArr[o + 1] = m1;
      pArr[o + 2] = m2;
      pArr[o + 3] = 0;
      pArr[o + 4] = m4;
      pArr[o + 5] = m5;
      pArr[o + 6] = m6;
      pArr[o + 7] = 0;
      pArr[o + 8] = m8;
      pArr[o + 9] = 0;
      pArr[o + 10] = m10;
      pArr[o + 11] = 0;
      pArr[o + 12] = px;
      pArr[o + 13] = ty;
      pArr[o + 14] = pz;
      pArr[o + 15] = 1;
      pCount++;
      if (!clothBatch.getVisibleAt(sf.clothId)) clothBatch.setVisibleAt(sf.clothId, true);
      me[0] = m0;
      me[1] = m1;
      me[2] = m2;
      me[4] = m4;
      me[5] = m5;
      me[6] = m6;
      me[8] = m8;
      me[9] = 0;
      me[10] = m10;
      me[12] = px;
      me[13] = ty;
      me[14] = pz;
      clothBatch.setMatrixAt(sf.clothId, this.scratchMat);
    }
    poles.count = pCount;
    poles.instanceMatrix.needsUpdate = true;
  }

  /**
   * A big LED screen on a trailer at the head of the grandstand, turned to the crowd and the
   * oncoming bands, showing the broadcast: a Queen of the band close up under the carnival's
   * name and the LIVE bug, with the panel grid of the screen over it.
   */
  private addScreen(): void {
    const screen = new Group();
    const dark = this.material({ color: 0x1b1c1f, roughness: 0.6 });
    const steel = this.material({ color: 0x9da3a8, metalness: 0.7, roughness: 0.4 });
    const picture = this.material({
      map: this.track(broadcastTexture()),
      emissive: 0xffffff,
      emissiveMap: null,
      emissiveIntensity: 0,
      roughness: 0.4,
    });
    picture.emissiveMap = picture.map;
    picture.emissiveIntensity = 0.9;
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      screen.add(mesh);
    };
    // The trailer, its outriggers and the mast.
    box(dark, 2.2, 0.8, 6.5, 0, 0.3, 0);
    box(steel, 0.12, 0.12, 8, 0, 0.15, 0);
    box(steel, 3.8, 0.12, 0.12, 0, 0.15, -2.5);
    box(steel, 3.8, 0.12, 0.12, 0, 0.15, 2.5);
    box(steel, 0.25, 3.2, 0.25, 0, 1.1, 0);
    // The screen in its black frame, 7 m by 4 m, its face looking down the road (+z).
    box(dark, 7.4, 4.4, 0.35, 0, 3.8, 0);
    const face = new PlaneGeometry(7, 4);
    face.translate(0, 6, 0.18);
    this.disposables.push(face);
    screen.add(new Mesh(face, picture));
    screen.traverse((o) => (o.castShadow = true));
    // Turned partly to the road so the crowd opposite and the bands can see it.
    screen.rotation.y = 0.55;
    this.group.add(screen);
    this.props.push({ mesh: screen, offset: GRANDSTAND[0] - 8, every: LOOP, x: PAVEMENT + 3.5 });
  }

  /**
   * The grandstand by the judging point on the right: aluminium bleachers of eight tiers along
   * the pavement, a skirt printed with the carnival's name at the front, a rail along the top,
   * and the seats filled with spectators, some on their feet dancing.
   */
  private addGrandstand(): void {
    const stand = new Group();
    const length = GRANDSTAND[1] - GRANDSTAND[0];
    const aluminium = this.material({ color: 0xc3c8cc, metalness: 0.75, roughness: 0.35 });
    const steel = this.material({ color: 0x7d838a, metalness: 0.7, roughness: 0.5 });
    const rows = 8;
    const front = BARRIER + 0.9;
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z = 0) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      stand.add(mesh);
    };
    for (let r = 0; r < rows; r++) {
      const x = front + 0.4 + r * 0.8;
      box(aluminium, 0.36, 0.05, length, x + 0.2, r * 0.42 + 0.42);
      box(aluminium, 0.4, 0.04, length, x - 0.2, r * 0.42);
      box(steel, 0.05, 0.42, length, x - 0.02, r * 0.42);
    }
    for (let z = -length / 2; z <= length / 2; z += 4) {
      const frame = new Mesh(this.unit, steel);
      const run = rows * 0.8;
      const rise = rows * 0.42;
      frame.scale.set(Math.hypot(run, rise), 0.12, 0.08);
      frame.rotation.z = Math.atan2(rise, run);
      frame.position.set(front + run / 2, rise / 2, z);
      stand.add(frame);
      box(steel, 0.08, rise + 1.1, 0.08, front + run + 0.1, 0, z);
    }
    box(steel, 0.05, 0.05, length, front + rows * 0.8 + 0.1, rows * 0.42 + 1.05);
    const skirt = this.material({
      map: this.track(
        clothBannerTexture('TORONTO CARIBBEAN CARNIVAL · GRANDSTAND', '#1b3f8a', '#ffd23f'),
      ),
      roughness: 0.7,
    });
    const panel = new PlaneGeometry(length, 0.42);
    panel.rotateY(-Math.PI / 2);
    panel.translate(front, 0.21, 0);
    this.disposables.push(panel);
    stand.add(new Mesh(panel, skirt));
    // The seats filled: seated spectators, and one in six on their feet.
    const random = seeded(1709);
    const sitters: Matrix4[] = [];
    const standers: Matrix4[] = [];
    const turn = new Quaternion().setFromAxisAngle(this.up, Math.PI / 2);
    for (let r = 0; r < rows; r++) {
      for (let z = -length / 2 + 0.45; z < length / 2; z += 0.9) {
        if (random() < 0.12) continue;
        const up = random() < 0.16;
        const at = new Vector3(front + 0.4 + r * 0.8 + (up ? -0.05 : 0.15), r * 0.42, z);
        const m = new Matrix4().compose(
          at,
          turn,
          new Vector3(1, 1, 1).multiplyScalar(0.94 + random() * 0.12),
        );
        (up ? standers : sitters).push(m);
      }
    }
    const baked: BufferGeometry[] = [];
    const people = (parts: ReturnType<typeof spectatorParts>, at: Matrix4[]) => {
      for (const [geometry, list] of [
        [parts.skin, SKINS],
        [parts.top, SHIRTS],
        [parts.bottom, TROUSERS],
      ] as const) {
        geometry.deleteAttribute('uv');
        for (const m of at) {
          const clone = geometry.clone();
          clone.applyMatrix4(m);
          tintGeometry(clone, list[Math.floor(random() * list.length)]!);
          baked.push(clone);
        }
        geometry.dispose();
      }
    };
    people(spectatorParts(0, true, true), sitters);
    people(spectatorParts(2, false), standers);
    if (baked.length > 0) {
      const crowdGeo = mergeGeometries(baked)!;
      baked.forEach((g) => g.dispose());
      this.disposables.push(crowdGeo);
      const crowdMesh = new Mesh(crowdGeo, this.propSolidMat);
      crowdMesh.castShadow = false;
      stand.add(crowdMesh);
    }
    this.group.add(stand);
    this.props.push({
      mesh: stand,
      offset: (GRANDSTAND[0] + GRANDSTAND[1]) / 2,
      every: LOOP,
      x: 0,
    });
  }

  /**
   * The footbridge that carries people from Parkdale over the Gardiner and Lake Shore to the
   * beach: a steel Warren truss on round piers, its deck 6.5 m over the road, with spectators
   * packed along its rail watching the parade pass beneath.
   */
  private addFootbridge(): void {
    const bridge = new Group();
    const trussTex = (this.sharedTrussTex ??= this.track(trussTexture()));
    const truss = this.material({
      map: trussTex,
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0x3f6f8f,
      metalness: 0.6,
      roughness: 0.45,
    });
    const steel = this.material({ color: 0x3f6f8f, metalness: 0.6, roughness: 0.45 });
    const deckMat = this.material({ color: 0x8c8a86, roughness: 0.9 });
    const pierMat = this.material({ color: 0xc9c4ba, roughness: 0.9 });
    const from = GARDINER_FAR - 4;
    const to = SHORE - 2;
    const span = to - from;
    const mid = (from + to) / 2;
    const deckY = 6.5;
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      bridge.add(mesh);
      return mesh;
    };
    box(deckMat, span, 0.35, 3.2, mid, deckY, 0);
    box(steel, span, 0.18, 3.4, mid, deckY - 0.18, 0);
    for (const z of [-1.7, 1.7]) {
      // The trusses either side, 2 m deep; the texture's lacing repeats every 2 m.
      const side = new PlaneGeometry(span, 2.0);
      // The texture's chords run along its height: turn it so they run along the span, top
      // and bottom, with the lacing zigzagging between them every 2 m.
      const uv = side.getAttribute('uv') as BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * (span / 2));
      side.translate(mid, deckY + 1.35, z);
      this.disposables.push(side);
      bridge.add(new Mesh(side, truss));
      box(steel, span, 0.12, 0.12, mid, deckY + 2.3, z);
    }
    for (const x of [from + 2, GARDINER_NEAR + 3, -PAVEMENT - 0.8, PAVEMENT + 0.8, to - 2]) {
      const pier = new CylinderGeometry(0.45, 0.5, deckY, 12);
      pier.translate(x, deckY / 2, 0);
      this.disposables.push(pier);
      bridge.add(new Mesh(pier, pierMat));
    }
    // Banners and flags draped over the rail facing the oncoming parade.
    const drape = new PlaneGeometry(1, 1);
    this.disposables.push(drape);
    const hang = (material: Material, w: number, h: number, x: number) => {
      const cloth = new Mesh(drape, material);
      cloth.scale.set(w, h, 1);
      cloth.position.set(x, deckY + 1.95 - h / 2, 1.78);
      bridge.add(cloth);
    };
    hang(
      this.material({
        map: this.track(clothBannerTexture('PARKDALE ♥ CARIBANA', '#ffd23f', '#c8102e')),
        roughness: 0.75,
      }),
      7,
      1.1,
      0,
    );
    [-6.6, -4.7, 4.7, 6.6, 9.1, -9.1].forEach((x, k) => {
      const idx = k % FLAG_KINDS.length;
      const fGeo = slicePlaneUv(1.6, 1.05, idx % 2, 2, Math.floor(idx / 2), 2, 600, 400);
      this.disposables.push(fGeo);
      const cloth = new Mesh(fGeo, this.flagAtlasMat);
      cloth.position.set(x, deckY + 1.95 - 1.05 / 2, 1.78);
      bridge.add(cloth);
    });
    // Spectators along both rails over the road, leaning on the rail to watch.
    const random = seeded(2903);
    const at: Matrix4[] = [];
    for (let x = -CURB - 2; x < CURB + 2; x += 0.85) {
      for (const z of [-1.2, 1.2]) {
        if (random() < 0.15) continue;
        const turn = new Quaternion().setFromAxisAngle(this.up, z < 0 ? 0 : Math.PI);
        at.push(
          new Matrix4().compose(
            new Vector3(x + random() * 0.2, deckY + 0.35, z),
            turn,
            new Vector3(1, 1, 1).multiplyScalar(0.92 + random() * 0.15),
          ),
        );
      }
    }
    const parts = spectatorParts(4, random() < 0.5);
    const bridgeBaked: BufferGeometry[] = [];
    for (const [geometry, list] of [
      [parts.skin, SKINS],
      [parts.top, SHIRTS],
      [parts.bottom, TROUSERS],
    ] as const) {
      geometry.deleteAttribute('uv');
      for (const m of at) {
        const clone = geometry.clone();
        clone.applyMatrix4(m);
        tintGeometry(clone, list[Math.floor(random() * list.length)]!);
        bridgeBaked.push(clone);
      }
      geometry.dispose();
    }
    bridge.traverse((o) => {
      o.castShadow = true;
    });
    if (bridgeBaked.length > 0) {
      const railCrowd = mergeGeometries(bridgeBaked)!;
      bridgeBaked.forEach((g) => g.dispose());
      this.disposables.push(railCrowd);
      const railMesh = new Mesh(railCrowd, this.propSolidMat);
      railMesh.castShadow = false;
      bridge.add(railMesh);
    }
    this.group.add(bridge);
    this.props.push({ mesh: bridge, offset: 58, every: LANDMARKS, x: 0, road: true });
  }

  /**
   * The Sunnyside Bathing Pavilion on the lake side: a long cream stuccoed front of round-headed
   * arches between square piers, a taller entrance block in the middle with its three great
   * arches and pediment, and red clay-tiled hipped roofs, met once in the landmarks' cycle.
   */
  private addPavilion(): void {
    const pavilion = new Group();
    const stucco = this.material({
      map: this.track(arcadeTexture()),
      roughness: 0.9,
    });
    stucco.map!.wrapS = RepeatWrapping;
    const plain = this.material({ color: 0xe9dfc8, roughness: 0.9 });
    const tile = this.material({ map: this.track(tileTexture()), roughness: 0.8 });
    tile.map!.wrapS = RepeatWrapping;
    tile.map!.wrapT = RepeatWrapping;
    tile.map!.repeat.set(6, 3);
    const block = (w: number, h: number, d: number, x: number, z: number, arches: number) => {
      const body = new BoxGeometry(d, h, w);
      // The arcade's face looks to the road (-x); it repeats an arch every 4.2 m.
      scaleFaceUv(body, 1, arches, 1);
      for (const face of [4, 5]) scaleFaceUv(body, face, Math.max(1, Math.round(d / 4.2)), 1);
      body.translate(x, h / 2, z);
      const roof = new ConeGeometry(1, 1, 4, 1);
      roof.rotateY(Math.PI / 4);
      roof.scale((d / 2) * 1.5, h * 0.35, (w / 2) * 1.5);
      roof.translate(x, h + h * 0.175, z);
      this.disposables.push(body, roof);
      // The arcade runs round the road face and both ends; the back to the lake is plain.
      pavilion.add(
        new Mesh(body, [plain, stucco, plain, plain, stucco, stucco]),
        new Mesh(roof, tile),
      );
    };
    block(64, 7, 10, 0, -40, 15);
    block(64, 7, 10, 0, 40, 15);
    block(16, 11, 13, -1.5, 0, 3);
    pavilion.traverse((o) => (o.castShadow = true));
    this.group.add(pavilion);
    this.props.push({ mesh: pavilion, offset: 120, every: LANDMARKS, x: SHORE + 4 });
  }

  /**
   * A signalised intersection the route crosses, `street` on its signs, `at` metres into the
   * landmarks' cycle: ladder crosswalks across all three lanes,
   * signal poles at the far corners with mast arms over the road carrying signal heads in
   * black with yellow-bordered backplates, pedestrian signals, and the cross street's name on
   * blue signs.
   */
  private addIntersection(street: string, at: number): void {
    const crossing = new Group();
    this.sharedLadderMat ??= this.material({
      map: this.track(ladderTexture()),
      transparent: true,
      alphaTest: 0.3,
      roughness: 0.6,
    });
    if (!this.arrowRowGeo) {
      const makeArrow = (turn: boolean) => {
        const shape = new Shape();
        shape.moveTo(-0.15, 0);
        shape.lineTo(0.15, 0);
        shape.lineTo(0.15, turn ? 2.2 : 3.6);
        if (turn) {
          shape.lineTo(-0.3, 2.9);
          shape.lineTo(-0.3, 3.4);
          shape.lineTo(-1.1, 2.75);
          shape.lineTo(-0.3, 2.1);
          shape.lineTo(-0.3, 2.6);
          shape.lineTo(-0.15, 2.45);
        } else {
          shape.lineTo(0.5, 3.6);
          shape.lineTo(0, 5);
          shape.lineTo(-0.5, 3.6);
          shape.lineTo(-0.15, 3.6);
        }
        shape.closePath();
        const g = new ShapeGeometry(shape);
        g.rotateX(-Math.PI / 2);
        g.translate(0, 0.012, 0);
        g.deleteAttribute('uv');
        return tintGeometry(g, 0xe6e3da);
      };
      const left = makeArrow(true).translate(-4.4, 0, 0);
      const mid = makeArrow(false);
      const right = mid.clone().translate(4.4, 0, 0);
      this.arrowRowGeo = mergeGeometries([left, mid, right])!;
      left.dispose();
      mid.dispose();
      right.dispose();
      this.disposables.push(this.arrowRowGeo);
    }
    this.arrowRowOffsets.push(at - 15);
    if (!this.crosswalkGeo) {
      const stripe = new PlaneGeometry(2 * CURB, 3.2);
      stripe.rotateX(-Math.PI / 2);
      stripe.translate(0, 0.01, 0);
      this.crosswalkGeo = stripe;
      this.disposables.push(stripe);
    }
    for (const dz of [-9, 9]) {
      this.crosswalkOffsets.push(at + dz);
    }
    const steel = this.material({ color: 0x9da3a8, metalness: 0.7, roughness: 0.45 });
    const black = this.material({ color: 0x15171a, roughness: 0.5 });
    const yellow = this.material({ color: 0xf2c200, roughness: 0.5 });
    const lamp = (hex: number) =>
      this.material({ color: hex, emissive: hex, emissiveIntensity: 0.05, roughness: 0.3 });
    let lamps = this.signalLamps[0];
    if (!lamps) {
      lamps = { red: lamp(0xff2a1a), amber: lamp(0xffa200), green: lamp(0x2aff7a) };
      this.signalLamps.push(lamps);
    }
    if (!this.sharedStreetSignMat) {
      const tex = this.track(streetSignAtlasTexture(CROSS_STREETS.map(([name]) => name)));
      this.sharedStreetSignMat = {
        tex,
        mat: this.material({ map: tex, roughness: 0.5 }),
      };
    }
    const streetIdx = Math.max(
      0,
      CROSS_STREETS.findIndex(([name]) => name === street),
    );
    const pole = new CylinderGeometry(0.13, 0.17, 7.2, 10);
    pole.translate(0, 3.6, 0);
    const arm = new CylinderGeometry(0.07, 0.1, 8.5, 8);
    arm.rotateZ(Math.PI / 2);
    arm.translate(-4.25, 6.9, 0);
    const head = new BoxGeometry(0.36, 1.05, 0.3);
    const back = new BoxGeometry(0.62, 1.3, 0.03);
    const lens = new CylinderGeometry(0.11, 0.11, 0.04, 12);
    lens.rotateX(Math.PI / 2);
    const plate = slicePlaneUv(
      1.6,
      0.32,
      0,
      1,
      streetIdx,
      CROSS_STREETS.length,
      512,
      96 * CROSS_STREETS.length,
    );
    this.disposables.push(pole, arm, head, back, lens, plate);
    for (const side of [-1, 1]) {
      const post = new Group();
      post.add(new Mesh(pole, steel), new Mesh(arm, steel));
      for (const x of [-2.6, -6.2]) {
        const unit = new Group();
        unit.add(new Mesh(back, yellow));
        const housing = new Mesh(head, black);
        housing.position.z = 0.17;
        unit.add(housing);
        [lamps.red, lamps.amber, lamps.green].forEach((m, k) => {
          const l = new Mesh(lens, m);
          l.position.set(0, 0.33 - k * 0.33, 0.34);
          unit.add(l);
        });
        unit.position.set(x, 6.1, 0);
        post.add(unit);
      }
      const name = new Mesh(plate, this.sharedStreetSignMat.mat);
      name.position.set(-4.4, 7.35, 0.05);
      post.add(name);
      // A pedestrian signal on the pole, facing across the road.
      const walk = new Mesh(head, black);
      walk.scale.set(1.1, 0.45, 1.1);
      walk.position.set(0.2, 2.8, 0.2);
      post.add(walk);
      // The mast reaches in over the road from each kerb; both face the oncoming bands.
      post.rotation.y = side > 0 ? 0 : Math.PI;
      post.position.set(side * (PAVEMENT - 0.6), 0.14, side > 0 ? -10 : 10);
      crossing.add(post);
    }
    // The cross street runs off on both sides behind the crowds, closed with barriers and a
    // police cruiser parked across it, its roof lights flashing.
    const side = (this.sharedAsphaltMat ??= this.material({
      map: this.roadMap ?? this.repeat(roadTexture(), 2 * CURB, 18),
      roughness: 0.85,
    }));
    const crossRoad = new PlaneGeometry(40, 2 * CURB);
    crossRoad.rotateX(-Math.PI / 2);
    crossRoad.rotateY(Math.PI / 2);
    this.disposables.push(crossRoad);
    for (const dir of [-1, 1]) {
      const run = new Mesh(crossRoad, side);
      run.position.set(dir * (PAVEMENT + 20), 0.135, 0);
      crossing.add(run);
      const cruiser = policeCruiser(this.material.bind(this), this.unit, this.policeLights);
      cruiser.position.set(dir * (PAVEMENT + 7), 0.15, 0);
      cruiser.rotation.y = Math.PI / 2;
      crossing.add(cruiser);
      const board = new Mesh(this.unit, this.closed);
      board.scale.set(0.08, 0.5, 3.2);
      board.position.set(dir * (PAVEMENT + 4.5), 0.85, -3.5);
      crossing.add(board);
    }
    crossing.traverse((o) => (o.castShadow = o.type === 'Mesh' && o.parent !== crossing));
    this.group.add(crossing);
    this.props.push({ mesh: crossing, offset: at, every: LANDMARKS, x: 0, road: true });
  }

  private buildIntersectionRoadPaintMeshes(): void {
    if (this.arrowRowGeo && this.arrowRowOffsets.length > 0) {
      this.arrowRowsMesh = this.instanced(
        this.arrowRowGeo,
        this.propSolidMat,
        this.arrowRowOffsets.length,
        false,
      );
    }
    if (this.crosswalkGeo && this.sharedLadderMat && this.crosswalkOffsets.length > 0) {
      this.crosswalksMesh = this.instanced(
        this.crosswalkGeo,
        this.sharedLadderMat,
        this.crosswalkOffsets.length,
        false,
      );
    }
  }

  private placeIntersectionRoadPaint(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const placeList = (mesh: InstancedMesh | null, offsets: readonly number[]) => {
      if (!mesh) return;
      const arr = mesh.instanceMatrix.array as Float32Array;
      let count = 0;
      for (const offset of offsets) {
        const metres = along(offset, LANDMARKS);
        if (metres <= PROP_BEHIND_CULL || metres > 180) continue;
        const y = heightAt(Math.max(metres, 0)) + ASPHALT;
        const o = count * 16;
        arr[o] = 1;
        arr[o + 1] = 0;
        arr[o + 2] = 0;
        arr[o + 3] = 0;
        arr[o + 4] = 0;
        arr[o + 5] = 1;
        arr[o + 6] = 0;
        arr[o + 7] = 0;
        arr[o + 8] = 0;
        arr[o + 9] = 0;
        arr[o + 10] = 1;
        arr[o + 11] = 0;
        arr[o + 12] = 0;
        arr[o + 13] = y;
        arr[o + 14] = -metres;
        arr[o + 15] = 1;
        count++;
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
    };
    placeList(this.arrowRowsMesh, this.arrowRowOffsets);
    placeList(this.crosswalksMesh, this.crosswalkOffsets);
  }

  /**
   * Confetti and streamers in the air over the lanes, blown from the trucks' cannons: bright
   * flakes in the bands' colours tumbling and drifting over the near stretch on the ride's clock.
   */
  private addConfetti(): void {
    const random = seeded(1511);
    const n = CONFETTI_COUNT;
    for (let k = 0; k < n; k++) {
      this.flakes.push({
        x: (random() - 0.5) * 2 * (CURB + 1),
        offset: random() * CONFETTI_SPAN,
        top: 4 + random() * 6,
        fall: 0.45 + random() * 0.5,
        spin: 2 + random() * 5,
        phase: random() * 40,
      });
    }
    const flake = new PlaneGeometry(0.06, 0.095);
    this.disposables.push(flake);
    this.confetti = this.instanced(
      flake,
      this.material({ side: DoubleSide, roughness: 0.4, metalness: 0.3 }),
      n,
      false,
    );
    const colours = ['#ff2d87', '#ffd23f', '#13c3c9', '#ff8a00', '#7b2ff7', '#ffffff', '#4de0a8'];
    const c = new Color();
    for (let k = 0; k < n; k++) this.confetti.setColorAt(k, c.set(colours[k % colours.length]!));
  }

  private placeConfetti(s: number, heightAt: (metres: number) => number): void {
    const confetti = this.confetti;
    if (!confetti) return;
    const out = confetti.instanceMatrix.array as Float32Array;
    for (let k = 0; k < this.flakes.length; k++) {
      const f = this.flakes[k]!;
      const t = this.time + f.phase;
      const height = f.top - ((t * f.fall) % f.top);
      const metres = loopMetres(f.offset + Math.sin(t * 0.3) * 0.8, s, CONFETTI_SPAN, 12);
      const px = f.x + Math.sin(t * 1.3) * 0.4;
      const py = heightAt(Math.max(metres, 0)) + height;
      const pz = -metres;
      const rx = t * f.spin;
      const ry = rx * 0.7;
      const cx = Math.cos(rx);
      const sx = Math.sin(rx);
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const o = k * 16;
      out[o] = cy;
      out[o + 1] = sx * sy;
      out[o + 2] = -cx * sy;
      out[o + 3] = 0;
      out[o + 4] = 0;
      out[o + 5] = cx;
      out[o + 6] = sx;
      out[o + 7] = 0;
      out[o + 8] = sy;
      out[o + 9] = -sx * cy;
      out[o + 10] = cx * cy;
      out[o + 11] = 0;
      out[o + 12] = px;
      out[o + 13] = py;
      out[o + 14] = pz;
      out[o + 15] = 1;
    }
    confetti.instanceMatrix.needsUpdate = true;
  }

  /**
   * A gantry over the route where the bands are judged: two box-truss towers at the gutters
   * carrying a truss across all three lanes, the carnival's name on a banner hung from it and
   * the day on a second below, Caribbean flags along the top and strings of bunting either side.
   */
  private addGantry(): void {
    const gantry = new Group();
    const trussTex = (this.sharedTrussTex ??= this.track(trussTexture()));
    const truss = this.material({
      map: trussTex,
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0xd5d8db,
      metalness: 0.8,
      roughness: 0.35,
    });
    const span = 2 * CURB + 0.6;
    const box = (w: number, h: number, d: number, x: number, y: number) => {
      const mesh = new Mesh(this.unit, truss);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, 0);
      gantry.add(mesh);
    };
    for (const x of [-span / 2, span / 2]) {
      box(0.45, 7.4, 0.45, x, 0);
      const foot = new Mesh(this.unit, this.material({ color: 0x2b2b2d, roughness: 0.8 }));
      foot.scale.set(1.2, 0.2, 1.2);
      foot.position.set(x, 0.1, 0);
      gantry.add(foot);
    }
    box(span + 0.45, 0.45, 0.45, 0, 7.4);
    box(span + 0.45, 0.45, 0.45, 0, 6.6);
    const main = this.material({
      map: this.track(clothBannerTexture('TORONTO CARIBBEAN CARNIVAL', '#c8102e', '#ffd23f')),
      side: DoubleSide,
      roughness: 0.7,
    });
    const day = this.material({
      map: this.track(clothBannerTexture('GRAND PARADE · JUDGING POINT', '#111111', '#ffffff')),
      side: DoubleSide,
      roughness: 0.7,
    });
    const top = new PlaneGeometry(span - 1.2, 1.5);
    const under = new PlaneGeometry(span * 0.55, 0.7);
    this.disposables.push(top, under);
    const a = new Mesh(top, main);
    a.position.set(0, 5.85, 0.25);
    const b = new Mesh(under, day);
    b.position.set(0, 4.75, 0.25);
    gantry.add(a, b);
    // Flags along the top truss.
    const pole = new CylinderGeometry(0.02, 0.02, 1.4, 5);
    this.disposables.push(pole);
    const steel = this.material({ color: 0xb9bec4, metalness: 0.7, roughness: 0.4 });
    for (let k = 0; k < 8; k++) {
      const idx = k % FLAG_KINDS.length;
      const flag = slicePlaneUv(0.9, 0.6, idx % 2, 2, Math.floor(idx / 2), 2, 600, 400);
      flag.translate(0.45, 0, 0);
      this.disposables.push(flag);
      const x = -span / 2 + 0.8 + (k * (span - 1.6)) / 7;
      const p = new Mesh(pole, steel);
      p.position.set(x, 8.5, 0);
      const f = new Mesh(flag, this.flagAtlasMat);
      f.position.set(x, 8.9, 0);
      f.rotation.y = 0.3;
      gantry.add(p, f);
    }
    // Bunting strung from the gantry back to the lamp standards either side.
    const bunting = buntingGeometry(
      span / 2,
      ['#c8102e', '#ffd23f', '#0f9d58', '#111111', '#ffffff'],
      [
        [6.5, 2.4],
        [6.5, -2.4],
      ],
      0.9,
    );
    this.disposables.push(bunting);
    const pennants = this.material({ vertexColors: true, side: DoubleSide, roughness: 0.8 });
    gantry.add(new Mesh(bunting, pennants));
    gantry.traverse((o) => (o.castShadow = true));
    this.group.add(gantry);
    this.props.push({ mesh: gantry, offset: 84, every: LANDMARKS, x: 0, road: true });
  }

  /**
   * A steel orchestra on its float in the left lane between two music trucks: a tractor
   * drawing a flatbed under a canopy with the band's name, rows of chrome tenor pans on stands
   * with their pannists in matching T-shirts, and a rank of bass pans, whole drums, at the back.
   */
  private addPanFloat(): void {
    const float = new Group();
    const red = this.material({ color: 0xc8102e, roughness: 0.35, metalness: 0.4 });
    const dark = this.material({ color: 0x1b1c1f, roughness: 0.6 });
    const glass = this.material({ color: 0x1d2a33, roughness: 0.08, metalness: 0.6 });
    const chrome = this.material({ color: 0xdfe3e6, roughness: 0.12, metalness: 1 });
    const face = this.material({ map: this.track(panTexture()), roughness: 0.2, metalness: 0.9 });
    const deck = this.material({ color: 0x6b5138, roughness: 0.9 });
    const tarp = this.material({ color: 0xffd23f, roughness: 0.8 });
    const banner = this.sharedTruckBannerMat!;
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      float.add(mesh);
      return mesh;
    };
    box(red, 2.2, 1.3, 2.2, 0, 1.05, -8.3);
    box(chrome, 1.3, 1.1, 0.08, 0, 1.1, -9.42);
    box(red, 2.5, 2.1, 1.9, 0, 1.05, -6.3);
    box(glass, 2.3, 0.85, 0.05, 0, 2.15, -7.27);
    box(dark, 1.2, 0.5, 9.4, 0, 0.6, -2);
    box(red, 2.6, 0.12, 12, 0, 1.4, 1.8);
    box(deck, 2.5, 0.04, 11.9, 0, 1.52, 1.8);
    for (const x of [-1.2, 1.2]) {
      for (const z of [-3.9, 7.6]) box(chrome, 0.08, 3.6, 0.08, x, 1.55, z);
    }
    box(tarp, 2.9, 0.06, 12, 0, 5.15, 1.8);
    // A gold fringe round the canopy's edge, and island flags flying from its four corners.
    const fringe = this.material({
      map: this.track(fringeTexture()),
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0xffd23f,
      roughness: 0.4,
      metalness: 0.5,
    });
    for (const [w, x, z, turn] of [
      [2.9, 0, 7.8, 0],
      [2.9, 0, -4.2, 0],
      [12, -1.45, 1.8, Math.PI / 2],
      [12, 1.45, 1.8, Math.PI / 2],
    ] as const) {
      const edge = new Mesh(new PlaneGeometry(w, 0.32), fringe);
      edge.position.set(x, 4.99, z);
      edge.rotation.y = turn;
      float.add(edge);
      this.disposables.push(edge.geometry);
    }
    // Two CO2 confetti cannons at the back corners of the canopy, aimed up and out.
    const tube = new CylinderGeometry(0.11, 0.13, 0.9, 10);
    this.disposables.push(tube);
    for (const x of [-1.3, 1.3]) {
      const cannon = new Mesh(
        tube,
        this.material({ color: 0x18191b, roughness: 0.5, metalness: 0.5 }),
      );
      cannon.position.set(x, 5.6, 7.5);
      cannon.rotation.z = -Math.sign(x) * 0.3;
      cannon.rotation.x = 0.25;
      float.add(cannon);
    }
    const mast = new CylinderGeometry(0.02, 0.02, 1.6, 5);
    this.disposables.push(mast);
    [
      [-1.4, -4.1],
      [1.4, -4.1],
      [-1.4, 7.7],
      [1.4, 7.7],
    ].forEach(([x, z], k) => {
      const idx = k % FLAG_KINDS.length;
      const flagCloth = slicePlaneUv(1.1, 0.72, idx % 2, 2, Math.floor(idx / 2), 2, 600, 400, 4, 1);
      flagCloth.translate(0.55, 0, 0);
      this.disposables.push(flagCloth);
      const pole = new Mesh(mast, chrome);
      pole.position.set(x!, 6.0, z!);
      const flag = new Mesh(flagCloth, this.flagAtlasMat);
      flag.position.set(x!, 6.5, z!);
      flag.rotation.y = x! < 0 ? Math.PI + 0.4 : -0.4;
      float.add(pole, flag);
    });
    for (const side of [-1, 1]) {
      const skirt = new Mesh(slicePlaneUv(11.4, 0.62, 0, 1, 3, 4, 1024, 512), banner);
      skirt.position.set(side * 1.31, 1.1, 1.8);
      skirt.rotation.y = side * (Math.PI / 2);
      float.add(skirt);
      this.disposables.push(skirt.geometry);
    }
    const valance = new Mesh(slicePlaneUv(2.9, 0.7, 0, 1, 3, 4, 1024, 512), banner);
    valance.position.set(0, 4.8, 7.82);
    float.add(valance);
    this.disposables.push(valance.geometry);
    // Tenor pans: a shallow chrome drum on a stand, its playing face hammered into notes.
    const skirtGeometry = new CylinderGeometry(0.29, 0.29, 0.22, 20, 1, true);
    const top = new CylinderGeometry(0.28, 0.28, 0.02, 20);
    const leg = new CylinderGeometry(0.012, 0.012, 1.25, 5);
    const bass = new CylinderGeometry(0.29, 0.29, 0.88, 20);
    this.disposables.push(skirtGeometry, top, leg, bass);
    const random = seeded(1103);
    const shirt = this.material({ color: 0xffd23f, roughness: 0.9 });
    const trousers = this.material({ color: 0x1e2530, roughness: 0.9 });
    const pannistGroup = new Group();
    float.add(pannistGroup);
    this.pannistGroup = pannistGroup;
    for (let row = 0; row < 4; row++) {
      for (const x of [-0.65, 0.65]) {
        const z = -2.8 + row * 1.9;
        const pan = new Group();
        const drum = new Mesh(skirtGeometry, chrome);
        drum.position.y = 1.25;
        const playing = new Mesh(top, face);
        playing.position.y = 1.35;
        pan.add(drum, playing);
        for (let l = 0; l < 3; l++) {
          const a = (l / 3) * Math.PI * 2;
          const stand = new Mesh(leg, dark);
          stand.position.set(Math.cos(a) * 0.2, 0.62, Math.sin(a) * 0.2);
          pan.add(stand);
        }
        pan.position.set(x, 1.55, z);
        float.add(pan);
        // The pannist behind the pan, facing the crowd beside the float and playing.
        const parts = spectatorParts(3, false);
        const figure = new Group();
        const skin = this.material({
          color: SKINS[Math.floor(random() * SKINS.length)],
          roughness: 0.6,
        });
        random();
        figure.add(new Mesh(parts.skin, skin), new Mesh(parts.top, shirt));
        figure.add(new Mesh(parts.bottom, trousers));
        this.disposables.push(parts.skin, parts.top, parts.bottom);
        figure.position.set(x * 1.45, 1.55, z);
        figure.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2;
        pannistGroup.add(figure);
      }
    }
    // The bass section: whole drums in a rank across the back.
    for (let k = 0; k < 5; k++) {
      const drum = new Mesh(bass, chrome);
      drum.position.set(-0.96 + k * 0.48, 1.55 + 0.44, 6.6 + (k % 2) * 0.5);
      float.add(drum);
      const face2 = new Mesh(top, face);
      face2.position.set(drum.position.x, 1.55 + 0.89, drum.position.z);
      float.add(face2);
    }
    for (const [x, z] of [
      [-1.12, -8.2],
      [1.12, -8.2],
      [-1.12, -5],
      [1.12, -5],
      [-1.12, 5.6],
      [1.12, 5.6],
    ] as const) {
      const wheel = new Mesh(this.unit, dark);
      wheel.scale.set(0.3, 1.04, 1.04);
      wheel.position.set(x, 0.52, z);
      float.add(wheel);
    }
    float.traverse((o) => (o.castShadow = true));
    this.group.add(float);
    this.props.push({
      mesh: float,
      offset: PAN_AT,
      every: LOOP,
      x: TRUCK_X + 0.3,
      road: true,
      marching: true,
    });
  }

  /**
   * Street food carts at the front of the pavement: a stainless-steel hot dog cart with its
   * grill, bottles of mustard and ketchup and a red and yellow umbrella, or a white ice cream
   * cart with its pictures of cones and a blue and white umbrella, the vendor behind each.
   */
  private addCarts(): void {
    const random = seeded(3907);
    const steel = this.material({ color: 0xc8ccd0, metalness: 0.85, roughness: 0.3 });
    const white = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const black = this.material({ color: 0x141414, roughness: 0.7 });
    const cartFrontMat = this.material({
      map: this.track(cartFrontAtlasTexture()),
      roughness: 0.5,
      metalness: 0.25,
    });
    const cartFrontGeos = [
      slicePlaneUv(1.5, 0.85, 0, 1, 0, 2, 256, 320).translate(0, 0.72, 0.402),
      slicePlaneUv(1.5, 0.85, 0, 1, 1, 2, 256, 320).translate(0, 0.72, 0.402),
    ] as const;
    const umbrellaAtlasMat = this.material({
      map: this.track(cartUmbrellaAtlasTexture()),
      side: DoubleSide,
      roughness: 0.75,
    });
    const canopyGeos = [0, 1].map((row) => {
      const g = new ConeGeometry(1.15, 0.45, 8, 1, true);
      const uv = g.getAttribute('uv') as BufferAttribute;
      const v0 = 1 - (row + 1) * 0.5 + 0.5 / 64;
      const v1 = 1 - row * 0.5 - 0.5 / 64;
      for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * (v1 - v0));
      return g;
    });
    const pole = new CylinderGeometry(0.025, 0.025, 2.4, 6);
    const wheel = new CylinderGeometry(0.25, 0.25, 0.06, 14);
    wheel.rotateZ(Math.PI / 2);
    const bottle = new CylinderGeometry(0.035, 0.04, 0.22, 8);
    this.disposables.push(...cartFrontGeos, ...canopyGeos, pole, wheel, bottle);
    CARTS.forEach(([offset, side], k) => {
      const ice = k % 2 === 1;
      const cart = new Group();
      const body = new Mesh(this.unit, ice ? white : steel);
      body.scale.set(1.5, 0.85, 0.8);
      body.position.y = 0.72;
      cart.add(body, new Mesh(cartFrontGeos[ice ? 0 : 1], cartFrontMat));
      const top = new Mesh(this.unit, ice ? white : steel);
      top.scale.set(1.55, 0.06, 0.85);
      top.position.y = 1.18;
      cart.add(top);
      for (const x of [-0.55, 0.55]) {
        const w = new Mesh(wheel, black);
        w.position.set(x, 0.25, 0);
        cart.add(w);
      }
      if (!ice) {
        // Mustard and ketchup by the grill.
        const mustard = new Mesh(bottle, this.material({ color: 0xffd23f, roughness: 0.4 }));
        mustard.position.set(0.55, 1.32, 0.2);
        const ketchup = new Mesh(bottle, this.material({ color: 0xc8102e, roughness: 0.4 }));
        ketchup.position.set(0.47, 1.32, 0.2);
        cart.add(mustard, ketchup);
      }
      const p = new Mesh(pole, steel);
      p.position.set(0, 2.2, 0);
      cart.add(p);
      const shade = new Mesh(canopyGeos[ice ? 1 : 0]!, umbrellaAtlasMat);
      shade.position.y = 3.25;
      cart.add(shade);
      const parts = spectatorParts(0, random() < 0.5);
      this.disposables.push(parts.skin, parts.top, parts.bottom);
      const vendor = new Group();
      const skin = this.material({
        color: SKINS[Math.floor(random() * SKINS.length)],
        roughness: 0.6,
      });
      vendor.add(new Mesh(parts.skin, skin), new Mesh(parts.top, white));
      vendor.add(new Mesh(parts.bottom, this.material({ color: 0x1e2530, roughness: 0.9 })));
      vendor.position.set(0, 0, -0.8);
      cart.add(vendor);
      cart.traverse((o) => (o.castShadow = true));
      // The cart's front, with its pictures, faces the road.
      cart.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      this.group.add(cart);
      this.props.push({ mesh: cart, offset, every: LOOP, x: side * (CROWD_NEAR + 0.5) });
    });
  }

  /**
   * Flag sellers working the crowd from the pavement: a pole cart bristling with dozens of
   * island flags on sticks, bandanas and scarves hung from a rail beneath, and the seller in a
   * cap and apron beside it, holding a flag up to the crowd.
   */
  private addFlagSellers(): void {
    const random = seeded(3103);
    const flag = new PlaneGeometry(0.36, 0.24);
    flag.translate(0.18, 0, 0);
    const stick = new CylinderGeometry(0.006, 0.006, 0.5, 4);
    stick.translate(0, -0.12, 0);
    const scarf = new PlaneGeometry(0.3, 0.42);
    const wood = this.material({ color: 0x8a6a45, roughness: 0.8 });
    const steel = this.material({ color: 0x9da3a8, metalness: 0.6, roughness: 0.4 });
    const apron = this.material({ color: 0xf4f2ea, roughness: 0.9 });
    const trousersMat = this.material({ color: 0x1e2530, roughness: 0.9 });
    const steelParts: BufferGeometry[] = [
      asNonIndexed(new BoxGeometry(0.05, 2.4, 0.05).translate(0, 1.2, 0)),
      asNonIndexed(new BoxGeometry(1.2, 0.03, 0.03).translate(0, 1.35, 0)),
      ...[-0.3, 0.3].map((x) =>
        asNonIndexed(
          new CylinderGeometry(0.2, 0.2, 0.05, 12).rotateZ(Math.PI / 2).translate(x, 0.2, 0),
        ),
      ),
    ];
    const cartSteel = mergeGeometries(steelParts)!;
    steelParts.forEach((g) => g.dispose());
    const m4 = new Matrix4();
    const rot = new Euler();
    const woodStickParts: BufferGeometry[] = [
      asNonIndexed(new BoxGeometry(0.7, 0.5, 0.5).translate(0, 0.55, 0)),
    ];
    for (let f = 0; f < 28; f++) {
      const a = (f / 28) * Math.PI * 2;
      const up = 1.9 + (f % 4) * 0.16;
      m4.makeRotationFromEuler(rot.set(0, -a, 0.5 + (f % 3) * 0.15));
      m4.setPosition(Math.cos(a) * 0.15, up, Math.sin(a) * 0.15);
      woodStickParts.push(asNonIndexed(stick.clone().applyMatrix4(m4)));
    }
    m4.makeScale(1.6, 1.6, 1.6).setPosition(0.8 + 0.3, 2.1, 0.2 - 0.06);
    woodStickParts.push(asNonIndexed(stick.clone().applyMatrix4(m4)));
    const cartWood = mergeGeometries(woodStickParts)!;
    woodStickParts.forEach((g) => g.dispose());
    this.disposables.push(cartSteel, cartWood);
    const flagTiles = FLAG_KINDS.map((_, idx) =>
      slicePlaneUv(0.36, 0.24, idx % 2, 2, Math.floor(idx / 2), 2, 600, 400).translate(0.18, 0, 0),
    );
    const scarfTiles = FLAG_KINDS.map((_, idx) =>
      slicePlaneUv(0.3, 0.42, idx % 2, 2, Math.floor(idx / 2), 2, 600, 400),
    );
    for (let k = 0; k < SELLERS.length; k++) {
      const cart = new Group();
      cart.add(new Mesh(cartWood, wood), new Mesh(cartSteel, steel));
      const allCloths: BufferGeometry[] = [];
      for (let f = 0; f < 28; f++) {
        const a = (f / 28) * Math.PI * 2;
        const up = 1.9 + (f % 4) * 0.16;
        m4.makeRotationFromEuler(rot.set(0, -a, 0.5 + (f % 3) * 0.15));
        m4.setPosition(Math.cos(a) * 0.15, up, Math.sin(a) * 0.15);
        allCloths.push(flagTiles[(f + k) % flagTiles.length]!.clone().applyMatrix4(m4));
      }
      for (let f = 0; f < 4; f++) {
        m4.makeTranslation(-0.45 + f * 0.3, 1.12, 0.03);
        allCloths.push(scarfTiles[(f + k + 1) % scarfTiles.length]!.clone().applyMatrix4(m4));
      }
      m4.makeScale(1.6, 1.6, 1.6).setPosition(0.8 + 0.3, 2.1, 0.2 - 0.06);
      allCloths.push(flagTiles[k % flagTiles.length]!.clone().applyMatrix4(m4));
      const mergedCloths = mergeGeometries(allCloths)!;
      allCloths.forEach((g) => g.dispose());
      this.disposables.push(mergedCloths);
      cart.add(new Mesh(mergedCloths, this.flagAtlasMat));
      // The seller beside the cart, holding a flag up.
      const parts = spectatorParts(1, random() < 0.5);
      this.disposables.push(parts.skin, parts.top, parts.bottom);
      const seller = new Group();
      const skin = this.material({
        color: SKINS[Math.floor(random() * SKINS.length)],
        roughness: 0.6,
      });
      seller.add(new Mesh(parts.skin, skin), new Mesh(parts.top, apron));
      seller.add(new Mesh(parts.bottom, trousersMat));
      seller.position.set(0.8, 0, 0.2);
      cart.add(seller);
      cart.traverse((o) => (o.castShadow = true));
      const side = k % 2 ? 1 : -1;
      // Facing the road from the back of the pavement.
      cart.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      this.group.add(cart);
      this.props.push({
        mesh: cart,
        offset: SELLERS[k]!,
        every: LOOP,
        x: side * (CROWD_NEAR + 0.3),
      });
    }
    flagTiles.forEach((g) => g.dispose());
    scarfTiles.forEach((g) => g.dispose());
    flag.dispose();
    stick.dispose();
    scarf.dispose();
  }

  /**
   * Food stalls on the grass behind both crowds: white pop-up tents with the vendor's name on
   * the valance, a jerk drum on angle-iron legs with its lid propped open over glowing coals
   * and chicken, a cooler, and the vendor at the table.
   */
  private addStalls(): void {
    const names = [
      ['JERK CHICKEN', '#c8102e', '#ffd23f'],
      ['DOUBLES & ROTI', '#ffd23f', '#0f5132'],
      ['PATTIES', '#0f9d58', '#ffffff'],
      ['COCONUT WATER', '#ffffff', '#0f9d58'],
      ['BAKE & SALTFISH', '#1b6ad8', '#ffffff'],
      ['JERK PORK', '#111111', '#ffd23f'],
    ] as const;
    const tentWhite = this.material({ color: 0xf2f2ee, metalness: 0.4, roughness: 0.4 });
    const frameParts: BufferGeometry[] = [];
    for (const [lx, lz] of [
      [-1.45, -1.45],
      [1.45, -1.45],
      [-1.45, 1.45],
      [1.45, 1.45],
    ] as const) {
      frameParts.push(new CylinderGeometry(0.03, 0.03, 2.3, 6).translate(lx, 1.15, lz));
    }
    frameParts.push(new BoxGeometry(1.9, 0.05, 0.7).translate(0, 0.75, 0));
    for (const [tx, tz] of [
      [-0.85, -0.3],
      [-0.85, 0.3],
      [0.85, -0.3],
      [0.85, 0.3],
    ] as const) {
      frameParts.push(new CylinderGeometry(0.03, 0.03, 0.74, 6).translate(tx, 0.37, tz));
    }
    const tentFrame = mergeGeometries(frameParts.map(asNonIndexed))!;
    frameParts.forEach((p) => p.dispose());
    const tentRoof = new ConeGeometry(2.12, 0.8, 4).rotateY(Math.PI / 4).translate(0, 2.7, 0);
    const stallValanceMat = this.material({
      map: this.track(clothBannerStackTexture(names)),
      side: DoubleSide,
      roughness: 0.7,
    });
    const valanceRings = names.map((_, rIdx) => {
      const sides: BufferGeometry[] = [];
      for (let sIdx = 0; sIdx < 4; sIdx++) {
        const a = (sIdx * Math.PI) / 2;
        sides.push(
          slicePlaneUv(3, 0.5, 0, 1, rIdx, names.length, 700, 130 * names.length)
            .rotateY(a)
            .translate(Math.sin(a) * 1.5, 2.05, Math.cos(a) * 1.5),
        );
      }
      const ring = mergeGeometries(sides)!;
      sides.forEach((s) => s.dispose());
      return ring;
    });
    const drum = this.material({ color: 0x2b2b2d, metalness: 0.55, roughness: 0.6 });
    const rust = this.material({ color: 0x6b3b22, roughness: 0.9 });
    const ember = this.material({ color: 0xe84a12, roughness: 0.9 });
    const meat = this.material({ color: 0x6a2e15, roughness: 0.7 });
    const cooler = this.material({ color: 0x1b6ad8, roughness: 0.5 });
    const lid = this.material({ color: 0xf2f2ee, roughness: 0.5 });
    const vendorTop = this.material({ color: '#f5f0e6', roughness: 0.8 });
    const vendorBottom = this.material({ color: '#1e2530', roughness: 0.8 });
    const half = new CylinderGeometry(0.42, 0.42, 0.95, 16, 1, false, Math.PI / 2, Math.PI);
    half.rotateZ(Math.PI / 2);
    half.translate(0, 0.95, 0);
    const cap = new CylinderGeometry(0.42, 0.42, 0.95, 16, 1, false, -Math.PI / 2, Math.PI);
    cap.rotateZ(Math.PI / 2);
    cap.rotateX(-1.9);
    cap.translate(0, 1.0, 0.42);
    const grillDrum = mergeGeometries([asNonIndexed(half), asNonIndexed(cap)])!;
    half.dispose();
    cap.dispose();
    const legParts = [
      [-0.4, -0.3],
      [0.4, -0.3],
      [-0.4, 0.3],
      [0.4, 0.3],
    ].map(([x, z]) => asNonIndexed(new BoxGeometry(0.04, 0.8, 0.04).translate(x!, 0.4, z!)));
    const grillLegs = mergeGeometries(legParts)!;
    legParts.forEach((g) => g.dispose());
    const meatParts: BufferGeometry[] = [];
    for (let p = 0; p < 6; p++) {
      meatParts.push(
        asNonIndexed(
          new BoxGeometry(0.13, 0.05, 0.1).translate(-0.3 + p * 0.12, 1.02, (p % 2) * 0.16 - 0.08),
        ),
      );
    }
    const grillMeat = mergeGeometries(meatParts)!;
    meatParts.forEach((g) => g.dispose());
    const coalsGeo = new BoxGeometry(0.8, 0.03, 0.55).translate(0, 0.98, 0);
    this.disposables.push(
      tentFrame,
      tentRoof,
      ...valanceRings,
      grillDrum,
      grillLegs,
      grillMeat,
      coalsGeo,
    );
    const random = seeded(919);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = side < 0 ? 14 : 44; offset < LOOP; offset += 58) {
        const nIdx = k++ % names.length;
        const [, fill] = names[nIdx]!;
        const stall = new Group();
        const canopyMat = this.material({ color: fill, roughness: 0.7 });
        stall.add(
          new Mesh(tentFrame, tentWhite),
          new Mesh(tentRoof, canopyMat),
          new Mesh(valanceRings[nIdx]!, stallValanceMat),
        );
        const grill = new Group();
        grill.add(
          new Mesh(grillDrum, drum),
          new Mesh(grillLegs, rust),
          new Mesh(coalsGeo, ember),
          new Mesh(grillMeat, meat),
        );
        grill.position.set(-side * 1.9, 0, 0.6);
        stall.add(grill);
        const box = new Mesh(this.unit, cooler);
        box.scale.set(0.7, 0.45, 0.45);
        box.position.set(side * 1.1, 0.225, -1.0);
        const boxLid = new Mesh(this.unit, lid);
        boxLid.scale.set(0.72, 0.06, 0.47);
        boxLid.position.set(side * 1.1, 0.47, -1.0);
        stall.add(box, boxLid);
        const vendor = spectatorParts(0, false);
        const figure = new Group();
        const skinMat = this.material({
          color: SKINS[Math.floor(random() * SKINS.length)]!,
          roughness: 0.8,
        });
        this.disposables.push(vendor.skin, vendor.top, vendor.bottom);
        figure.add(
          new Mesh(vendor.skin, skinMat),
          new Mesh(vendor.top, vendorTop),
          new Mesh(vendor.bottom, vendorBottom),
        );
        figure.position.set(side * 0.2, 0, -0.9);
        figure.rotation.y = Math.PI;
        stall.add(figure);
        stall.traverse((o) => (o.castShadow = true));
        stall.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
        this.group.add(stall);
        this.props.push({ mesh: stall, offset, every: LOOP, x: side * 13.6 });
      }
    }
  }

  /**
   * The Gardiner Expressway, elevated north of the boulevard: a concrete deck of six lanes on
   * bents of twin columns under a pier cap every 30 m, Jersey-barrier parapets, light poles on
   * the median, and traffic running both ways above the parade.
   */
  private addGardiner(points: number): void {
    const concrete = this.material({
      map: this.repeat(concreteTexture(), 6, 6),
      color: 0xc8c3ba,
      roughness: 0.95,
    });
    // The fascia: weathered concrete in 20 m spans between expansion joints, streaked under
    // each scupper with water and rust.
    const fascia = this.material({ map: this.repeat(fasciaTexture(), 2.3, 20), roughness: 0.95 });
    const shade = this.material({ map: this.repeat(soffitTexture(), 23, 6), roughness: 1 });
    const deck = this.material({ color: 0x5d5f63, roughness: 0.9 });
    const n = GARDINER_NEAR;
    const f = GARDINER_FAR;
    const d = GARDINER_DECK;
    // The parapet facing the boulevard, the deck, and the far parapet.
    this.ribbons.add(points, fascia, [
      [n, d - 1.4],
      [n, d + 0.9],
    ]);
    this.ribbons.add(points, concrete, [
      [n, d + 0.9],
      [n - 0.4, d + 0.9],
      [n - 0.5, d],
    ]);
    this.ribbons.add(points, deck, [
      [n - 0.5, d],
      [f + 0.5, d],
    ]);
    this.ribbons.add(points, concrete, [
      [f + 0.5, d],
      [f + 0.4, d + 0.9],
      [f, d + 0.9],
    ]);
    this.ribbons.add(points, shade, [
      [f, d - 1.4],
      [n, d - 1.4],
    ]);
    const colA = new CylinderGeometry(0.75, 0.85, d - 1.4, 10);
    colA.translate(-6.5, (d - 1.4) / 2, 0);
    const colB = new CylinderGeometry(0.75, 0.85, d - 1.4, 10);
    colB.translate(6.5, (d - 1.4) / 2, 0);
    const cap = new BoxGeometry((n - f) * 0.92, 1.3, 2.2);
    cap.translate(0, d - 2.05, 0);
    const bentGeo = mergeGeometries([colA, colB, cap])!;
    colA.dispose();
    colB.dispose();
    cap.dispose();
    const pole = new CylinderGeometry(0.08, 0.12, 9, 6);
    pole.translate(0, d + 4.5, 0);
    const arms = new BoxGeometry(0.08, 0.08, 5);
    arms.translate(0, d + 9, 0);
    const bentLampGeo = mergeGeometries([pole, arms])!;
    pole.dispose();
    arms.dispose();
    this.disposables.push(bentGeo, bentLampGeo);
    const steel = this.material({ color: 0xa9aeb2, metalness: 0.7, roughness: 0.45 });
    for (let offset = 0; offset < LOOP; offset += 30) {
      this.gardinerOffsets.push(offset);
    }
    const bentCap = Math.max(1, this.gardinerOffsets.length);
    this.gardinerConcrete = this.instanced(bentGeo, concrete, bentCap, false);
    this.gardinerSteel = this.instanced(bentLampGeo, steel, Math.ceil(bentCap / 2) + 1, false);
    // Overhead guide signs over the eastbound lanes, facing the traffic coming towards the city.
    const signs = [
      ['GARDINER EXPY', 'EAST  Downtown  1 km'],
      ['SPADINA AVE', 'Exit  Right Lane'],
    ] as const;
    const guideAtlasMat = this.material({
      map: this.track(guideSignAtlasTexture(signs)),
      roughness: 0.5,
    });
    signs.forEach((_, k) => {
      const board = slicePlaneUv(7.5, 2.6, 0, 1, k, signs.length, 512, 176 * signs.length);
      this.disposables.push(board);
      const face = new Mesh(board, guideAtlasMat);
      const sign = new Group();
      face.position.set(0, d + 5.6, 0.12);
      face.rotation.y = 0;
      const truss = new Mesh(this.unit, steel);
      truss.scale.set(n - f + 1, 0.5, 0.5);
      truss.position.set(0, d + 7.1, 0);
      const back = new Mesh(this.unit, steel);
      back.scale.set(7.5, 2.6, 0.08);
      back.position.set(0, d + 5.6, 0.04);
      sign.add(face, truss, back);
      for (const x of [-(n - f) / 2, (n - f) / 2]) {
        const leg = new Mesh(this.unit, steel);
        leg.scale.set(0.3, 7.2, 0.3);
        leg.position.set(x, d + 3.6, 0);
        sign.add(leg);
      }
      face.position.x = (n - f) / 2 - 5;
      back.position.x = face.position.x;
      sign.position.x = (n + f) / 2;
      // The face is turned to look back down the road, at the eastbound traffic.
      sign.rotation.y = Math.PI;
      sign.traverse((o) => (o.castShadow = true));
      this.group.add(sign);
      this.props.push({
        mesh: sign,
        offset: 70 + k * 180,
        every: LOOP,
        x: (n + f) / 2,
        road: true,
      });
    });
    // Traffic: eastbound in the near lanes, westbound in the far ones.
    const paints = [0xf2f2f2, 0x1c1c1e, 0x8e9499, 0xb3121f, 0x23466e, 0xd9d4c7];
    const random = seeded(887);
    const carBodyGeo = new BoxGeometry(1.8, 0.75, 4.5);
    carBodyGeo.translate(0, 0.65, 0);
    const cabinGeo = tintGeometry(new BoxGeometry(1.6, 0.55, 2.4).translate(0, 1.3, 0.2), 0x1e2a33);
    const wheelsGeo = tintGeometry(new BoxGeometry(1.9, 0.5, 3.2).translate(0, 0.3, 0), 0x141414);
    cabinGeo.deleteAttribute('uv');
    wheelsGeo.deleteAttribute('uv');
    const carTrimGeo = mergeGeometries([cabinGeo, wheelsGeo])!;
    cabinGeo.dispose();
    wheelsGeo.dispose();
    this.disposables.push(carBodyGeo, carTrimGeo);
    const carPaintMat = this.material({ roughness: 0.3, metalness: 0.5 });
    const c = new Color();
    for (let k = 0; k < 14; k++) {
      const hex = paints[Math.floor(random() * paints.length)]!;
      c.setHex(hex);
      const eastbound = k % 2 === 0;
      const lane = Math.floor(random() * 3);
      this.expressway.push({
        offset: random() * LOOP,
        speed: eastbound ? 14 + random() * 6 : -(14 + random() * 6),
        x: eastbound ? n - 2.5 - lane * 3.5 : f + 2.5 + lane * 3.5,
        r: c.r,
        g: c.g,
        b: c.b,
      });
    }
    this.expresswayBodies = this.instanced(carBodyGeo, carPaintMat, 14, false);
    this.expresswayBodies.setColorAt(0, c.setRGB(1, 1, 1));
    this.expresswayTrim = this.instanced(carTrimGeo, this.propSolidMat, 14, false);
  }

  private placeGardinerAndTraffic(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const centre = (GARDINER_NEAR + GARDINER_FAR) / 2;
    if (this.gardinerConcrete && this.gardinerSteel) {
      const cArr = this.gardinerConcrete.instanceMatrix.array as Float32Array;
      const sArr = this.gardinerSteel.instanceMatrix.array as Float32Array;
      let cCount = 0;
      let sCount = 0;
      for (let i = 0; i < this.gardinerOffsets.length; i++) {
        const metres = along(this.gardinerOffsets[i]!, LOOP);
        if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) continue;
        const y = heightAt(Math.max(metres, 0)) + ASPHALT;
        const o = cCount * 16;
        cArr[o] = 1;
        cArr[o + 1] = 0;
        cArr[o + 2] = 0;
        cArr[o + 3] = 0;
        cArr[o + 4] = 0;
        cArr[o + 5] = 1;
        cArr[o + 6] = 0;
        cArr[o + 7] = 0;
        cArr[o + 8] = 0;
        cArr[o + 9] = 0;
        cArr[o + 10] = 1;
        cArr[o + 11] = 0;
        cArr[o + 12] = centre;
        cArr[o + 13] = y;
        cArr[o + 14] = -metres;
        cArr[o + 15] = 1;
        cCount++;
        if (i % 2 === 0) {
          const so = sCount * 16;
          for (let m = 0; m < 16; m++) sArr[so + m] = cArr[o + m]!;
          sCount++;
        }
      }
      this.gardinerConcrete.count = cCount;
      this.gardinerSteel.count = sCount;
      this.gardinerConcrete.instanceMatrix.needsUpdate = true;
      this.gardinerSteel.instanceMatrix.needsUpdate = true;
    }
    if (this.expresswayBodies && this.expresswayTrim) {
      const bArr = this.expresswayBodies.instanceMatrix.array as Float32Array;
      const tArr = this.expresswayTrim.instanceMatrix.array as Float32Array;
      const cArr = this.expresswayBodies.instanceColor!.array as Float32Array;
      const bucket = Math.floor(along(this.time * 16, LOOP) * 0.2);
      const colorsChanged = bucket !== this.expresswayBucket;
      this.expresswayBucket = bucket;
      let count = 0;
      for (const e of this.expressway) {
        const metres = along(e.offset + this.time * e.speed, LOOP);
        if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) continue;
        const y = heightAt(Math.max(metres, 0)) + GARDINER_DECK;
        const o = count * 16;
        bArr[o] = 1;
        bArr[o + 1] = 0;
        bArr[o + 2] = 0;
        bArr[o + 3] = 0;
        bArr[o + 4] = 0;
        bArr[o + 5] = 1;
        bArr[o + 6] = 0;
        bArr[o + 7] = 0;
        bArr[o + 8] = 0;
        bArr[o + 9] = 0;
        bArr[o + 10] = 1;
        bArr[o + 11] = 0;
        bArr[o + 12] = e.x;
        bArr[o + 13] = y;
        bArr[o + 14] = -metres;
        bArr[o + 15] = 1;
        for (let m = 0; m < 16; m++) tArr[o + m] = bArr[o + m]!;
        if (colorsChanged || cArr) {
          const c3 = count * 3;
          cArr[c3] = e.r;
          cArr[c3 + 1] = e.g;
          cArr[c3 + 2] = e.b;
        }
        count++;
      }
      this.expresswayBodies.count = count;
      this.expresswayTrim.count = count;
      this.expresswayBodies.instanceMatrix.needsUpdate = true;
      this.expresswayTrim.instanceMatrix.needsUpdate = true;
      if (this.expresswayBodies.instanceColor)
        this.expresswayBodies.instanceColor.needsUpdate = true;
    }
  }

  /** Downtown Toronto ahead: towers in glass, the dome and the CN Tower over them. */
  private addDowntown(): void {
    const haze = new Color(HAZE);
    const hazed = (hex: number, amount: number, map: Texture | null = null) => {
      const material = new MeshStandardMaterial({ roughness: 0.6, fog: false, map });
      material.color.set(hex).lerp(haze, amount);
      this.disposables.push(material);
      return material;
    };
    const condoMat = this.addSkyline();
    const cn = cnTower(hazed(0xd3cec4, 0.38), hazed(0x8d9196, 0.36), hazed(0x2c3640, 0.4));
    this.disposables.push(...cn.children.map((m) => (m as Mesh).geometry));
    cn.position.set(-260, 0, 40);
    this.downtown.add(cn);
    // The Rogers Centre: a ring wall of arched bays under the retractable roof's four panels.
    const rogers = new Group();
    const ring = new CylinderGeometry(108, 110, 36, 48, 1, true);
    ring.translate(0, 18, 0);
    const bays = this.track(stadiumTexture());
    bays.wrapS = RepeatWrapping;
    bays.repeat.set(12, 1);
    const roof = new SphereGeometry(112, 48, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    roof.scale(1, 0.32, 1);
    roof.translate(0, 34, 0);
    const panels = this.track(roofTexture());
    panels.wrapS = RepeatWrapping;
    this.disposables.push(ring, roof);
    rogers.add(new Mesh(ring, hazed(0xe2dfd8, 0.38, bays)));
    rogers.add(new Mesh(roof, hazed(0xe8e6e0, 0.38, panels)));
    rogers.position.set(-130, 0, 120);
    this.downtown.add(rogers);
    // Pinnacle One Yonge on the waterfront, behind and right of the tower: three glass towers,
    // the tallest 300 m, their corners chamfered.
    const blueTint = new Color(0x7ea6bf).lerp(haze, 0.42);
    for (const [x, z, h, w] of [
      [-90, -700, 300, 34],
      [-40, -680, 240, 30],
      [-120, -640, 200, 28],
    ] as const) {
      const shaft = new CylinderGeometry(w * 0.62, w * 0.66, h, 8);
      shaft.rotateY(Math.PI / 8);
      shaft.translate(x, h / 2, z);
      tintGeometry(shaft, blueTint);
      this.disposables.push(shaft);
      this.downtown.add(new Mesh(shaft, condoMat));
    }
    // The One at Yonge and Bloor, far behind the Financial District: dark glass rising to 306 m
    // inside a bronze exoskeleton of piers.
    const one = new Group();
    const core = new BoxGeometry(40, 306, 40);
    core.translate(0, 153, 0);
    this.disposables.push(core);
    one.add(new Mesh(core, hazed(0x2c3440, 0.55)));
    for (const [x, z] of [
      [-21, -21],
      [21, -21],
      [-21, 21],
      [21, 21],
    ] as const) {
      const pier = new BoxGeometry(5, 306, 5);
      pier.translate(x, 153, z);
      this.disposables.push(pier);
      one.add(new Mesh(pier, hazed(0x8a6a3e, 0.55)));
    }
    one.position.set(-640, 0, -2600);
    this.downtown.add(one);
    this.group.add(this.downtown);
  }

  /**
   * Toronto's skyline as Lake Shore West sees it, east past Ontario Place: slender glass condos
   * of CityPlace and South Core clustered round the CN Tower with Harbourfront's lower slabs
   * to its right, and behind them, left of the tower, the Financial District's office towers:
   * white First Canadian Place, the black TD towers, red Scotia Plaza and gold Royal Bank Plaza.
   */
  private addSkyline(): MeshStandardMaterial {
    const hazeColor = new Color(HAZE);
    const hazedTint = (hex: number, amount: number) => new Color(hex).lerp(hazeColor, amount);
    const skin = (texture: CanvasTexture) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      return this.track(texture);
    };
    const condoMat = new MeshStandardMaterial({
      roughness: 0.6,
      fog: false,
      map: skin(condoTexture()),
      vertexColors: true,
    });
    const officeMat = new MeshStandardMaterial({
      roughness: 0.6,
      fog: false,
      map: skin(officeTexture('#2b3540', '#55687a')),
      vertexColors: true,
    });
    const pinstripeMat = new MeshStandardMaterial({
      roughness: 0.6,
      fog: false,
      map: skin(pinstripeTexture()),
      vertexColors: true,
    });
    this.disposables.push(condoMat, officeMat, pinstripeMat);
    const condo = [0x7fa7a8, 0x6c95a8, 0x9bb7b8, 0x8aa3b5, 0x5f8f8c].map((hex) => ({
      mat: condoMat,
      tint: hazedTint(hex, 0.4),
    }));
    const office = [0x8b9aa8, 0x6f8193, 0xa7b2bb].map((hex) => ({
      mat: officeMat,
      tint: hazedTint(hex, 0.42),
    }));
    const black = { mat: officeMat, tint: hazedTint(0x30343a, 0.42) };
    const white = { mat: pinstripeMat, tint: hazedTint(0xf0eee8, 0.36) };
    const red = { mat: pinstripeMat, tint: hazedTint(0x9a4b3e, 0.4) };
    const gold = { mat: officeMat, tint: hazedTint(0xd4a548, 0.38) };
    const tower = (
      spec: { mat: MeshStandardMaterial; tint: Color },
      w: number,
      d: number,
      h: number,
      x: number,
      z: number,
      crown = 0,
    ) => {
      const box = new BoxGeometry(w, h, d);
      for (const face of [0, 1]) scaleFaceUv(box, face, d / 8, h / 38);
      for (const face of [4, 5]) scaleFaceUv(box, face, w / 8, h / 38);
      box.translate(x, h / 2, z);
      tintGeometry(box, spec.tint);
      this.disposables.push(box);
      this.downtown.add(new Mesh(box, spec.mat));
      if (crown) {
        const top = new BoxGeometry(w * 0.7, crown, d * 0.7);
        top.translate(x, h + crown / 2, z);
        tintGeometry(top, spec.tint);
        this.disposables.push(top);
        this.downtown.add(new Mesh(top, spec.mat));
      }
    };
    // The Financial District, a kilometre beyond the tower and left of it.
    tower(white, 46, 46, 290, -470, -420, 8);
    tower(black, 36, 58, 223, -400, -330);
    tower(black, 34, 52, 190, -360, -400);
    tower(red, 44, 44, 260, -540, -360, 15);
    tower(gold, 30, 50, 180, -330, -270);
    tower(office[2]!, 42, 42, 239, -430, -500, 6);
    tower(office[0]!, 40, 40, 218, -580, -470, 10);
    tower(office[1]!, 50, 36, 240, -300, -360, 6);
    const random = seeded(307);
    for (let i = 0; i < 14; i++) {
      const h = 110 + random() * 110;
      tower(
        office[i % office.length]!,
        28 + random() * 22,
        28 + random() * 22,
        h,
        -700 + random() * 460,
        -300 - random() * 320,
        random() < 0.4 ? 6 : 0,
      );
    }
    // CityPlace and South Core: slender glass condos crowding the tower's foot.
    for (let i = 0; i < 30; i++) {
      const h = 95 + random() * random() * 140;
      const w = 20 + random() * 10;
      let x = -420 + random() * 400;
      const z = -60 + random() * 300;
      // Keep the tower's foot and the stadium clear.
      if (Math.abs(x + 260) < 45 && Math.abs(z - 40) < 70) x -= 90;
      tower(condo[i % condo.length]!, w, w * (1 + random() * 0.6), h, x, z, random() < 0.5 ? 5 : 0);
    }
    // Harbourfront's lower slabs along the water, right of the tower.
    for (let i = 0; i < 16; i++) {
      const h = 50 + random() * 80;
      tower(
        condo[(i + 2) % condo.length]!,
        24 + random() * 16,
        22 + random() * 10,
        h,
        -60 + random() * 340,
        120 + random() * 200,
      );
    }
    return condoMat;
  }

  /**
   * Fair-weather cumulus of an August afternoon over the lake and the city: each a heap of
   * puffs on a flat grey base, rising into a white dome lit by the sun.
   */
  private addClouds(): void {
    const random = seeded(613);
    const puffs: BufferGeometry[] = [];
    const halo: BufferGeometry[] = [];
    const white = new Color(0xffffff);
    const base = new Color(0xa7b3c2);
    const c = new Color();
    for (let k = 0; k < 14; k++) {
      const a = -1.2 + (k / 13) * 2.4 + (random() - 0.5) * 0.15;
      const far = 3400 + random() * 1800;
      const cx = Math.sin(a) * far;
      const cz = -Math.cos(a) * far;
      const cy = 820 + random() * 520;
      const size = 150 + random() * 170;
      const count = 16 + Math.floor(random() * 8);
      for (let p = 0; p < count; p++) {
        const along = (random() - 0.5) * 3.4;
        const r = size * (0.26 + random() * 0.3) * (1 - Math.abs(along) * 0.22);
        const lift = Math.max(0, (1 - Math.abs(along) / 1.8) * size * 0.75 * random());
        const puff = new SphereGeometry(r, 9, 6);
        const position = puff.getAttribute('position') as BufferAttribute;
        for (let i = 0; i < position.count; i++) {
          const y = position.getY(i);
          if (y < 0) position.setY(i, y * 0.25);
        }
        const px = cx + along * size;
        const py = cy + lift + r * 0.25;
        const pz = cz + (random() - 0.5) * size * 0.8;
        puff.translate(px, py, pz);
        const colour = new Float32Array(position.count * 3);
        for (let i = 0; i < position.count; i++) {
          const height = (position.getY(i) - cy) / (size * 1.6);
          c.copy(base).lerp(white, Math.min(1, Math.max(0, height * 1.4 + 0.15)));
          colour.set([c.r, c.g, c.b], i * 3);
        }
        puff.setAttribute('color', new BufferAttribute(colour, 3));
        const shell = puff.clone();
        shell.translate(-px, -py, -pz);
        shell.scale(1.18, 1.18, 1.18);
        shell.translate(px, py, pz);
        halo.push(shell);
        puffs.push(puff);
      }
    }
    const heap = mergeGeometries(puffs)!;
    puffs.forEach((p) => p.dispose());
    const soft = mergeGeometries(halo)!;
    halo.forEach((p) => p.dispose());
    this.disposables.push(soft, heap);
    const shell = new Mesh(
      soft,
      this.material({
        vertexColors: true,
        emissive: 0xdfe6f0,
        emissiveIntensity: 0.3,
        roughness: 1,
        fog: false,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
    );
    shell.frustumCulled = false;
    this.clouds.add(shell);
    const cloud = this.material({
      vertexColors: true,
      emissive: 0xdfe6f0,
      emissiveIntensity: 0.22,
      roughness: 1,
      fog: false,
    });
    const mesh = new Mesh(heap, cloud);
    mesh.frustumCulled = false;
    this.clouds.add(mesh);
    this.group.add(this.clouds);
  }

  /**
   * Ontario Place, out on the lake ahead and to the right: the Cinesphere's white geodesic dome
   * on its deck over the water, and the pods, steel-framed boxes held high on four-legged
   * pylons, joined to each other by footbridges.
   */
  private addOntarioPlace(): void {
    const white = this.material({ color: 0xf1f1ee, roughness: 0.5, metalness: 0.2 });
    const panels = this.material({
      map: this.track(geodesicTexture()),
      color: 0xf6f6f4,
      roughness: 0.45,
      metalness: 0.25,
      flatShading: true,
    });
    const glass = this.material({ color: 0x2a3640, roughness: 0.15, metalness: 0.5 });
    const steel = this.material({ color: 0xd8dadc, roughness: 0.5, metalness: 0.6 });
    const add = (geometry: BufferGeometry, material: Material, x: number, y: number, z: number) => {
      geometry.translate(x, y, z);
      this.disposables.push(geometry);
      const mesh = new Mesh(geometry, material);
      this.ontarioPlace.add(mesh);
      return mesh;
    };
    // The Cinesphere: three quarters of a geodesic sphere on a deck, piers into the water.
    const dome = new IcosahedronGeometry(17, 3);
    const position = dome.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < position.count; i++) position.setY(i, Math.max(position.getY(i), -8));
    add(dome, panels, 92, 9 + 8, -300);
    add(new CylinderGeometry(24, 24, 1.2, 40), white, 92, 8.4, -300);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      add(
        new CylinderGeometry(0.7, 0.7, 8, 8),
        white,
        190 + Math.cos(a) * 18,
        4,
        -380 + Math.sin(a) * 18,
      );
    }
    // The pods: boxes of dark glass in white steel frames, each on a four-legged pylon.
    const pods = [
      [135, -250],
      [160, -290],
      [140, -345],
      [175, -390],
      [130, -420],
    ] as const;
    for (const [x, z] of pods) {
      add(new BoxGeometry(22, 7, 22), glass, x, 30, z);
      add(new BoxGeometry(23, 1.2, 23), white, x, 34, z);
      add(new BoxGeometry(23, 1.2, 23), white, x, 26.4, z);
      for (const dx of [-7, 7]) {
        for (const dz of [-7, 7]) add(new BoxGeometry(0.9, 26, 0.9), steel, x + dx, 13, z + dz);
      }
      add(new BoxGeometry(18, 0.5, 0.5), steel, x, 20, z - 7);
      add(new BoxGeometry(18, 0.5, 0.5), steel, x, 20, z + 7);
    }
    for (let k = 0; k < pods.length - 1; k++) {
      const [ax, az] = pods[k]!;
      const [bx, bz] = pods[k + 1]!;
      const length = Math.hypot(bx - ax, bz - az);
      const bridge = add(new BoxGeometry(3, 2.2, length - 20), white, 0, 0, 0);
      bridge.position.set((ax + bx) / 2, 29, (az + bz) / 2);
      bridge.rotation.y = Math.atan2(bx - ax, bz - az);
    }
    this.group.add(this.ontarioPlace);
  }

  /**
   * Exhibition Place, ahead and to the left beyond the route: the ExPlace wind turbine on its
   * slender white tower, blades turning, the Hotel X tower in blue glass, and the long low
   * halls of the Enercare Centre under their shallow roofs.
   */
  private addExhibition(): void {
    const white = this.material({ color: 0xeef0f0, roughness: 0.4, metalness: 0.2 });
    const glass = this.material({
      map: this.repeat(condoTexture(), 0.25, 0.08),
      color: 0x8fb3c8,
      roughness: 0.2,
      metalness: 0.4,
    });
    const hall = this.material({ color: 0xcfc8bb, roughness: 0.85 });
    const roof = this.material({ color: 0x9aa3a8, roughness: 0.6, metalness: 0.3 });
    const tower = new CylinderGeometry(1.4, 2.6, 78, 16);
    tower.translate(0, 39, 0);
    const nacelle = new BoxGeometry(3.2, 3, 8);
    const hub = new SphereGeometry(1.6, 12, 8);
    hub.scale(1, 1, 1.4);
    const blade = new BoxGeometry(1.6, 33, 0.4);
    blade.translate(0, 17, 0);
    this.disposables.push(tower, nacelle, hub, blade);
    const turbine = new Group();
    turbine.add(new Mesh(tower, white));
    const head = new Mesh(nacelle, white);
    head.position.set(0, 79, 0.5);
    turbine.add(head);
    this.rotor.position.set(0, 79, -3.8);
    this.rotor.add(new Mesh(hub, white));
    for (let k = 0; k < 3; k++) {
      const b = new Mesh(blade, white);
      b.rotation.z = (k * Math.PI * 2) / 3;
      this.rotor.add(b);
    }
    turbine.add(this.rotor);
    turbine.position.set(-112, 0, -330);
    // Turned to face up the lake, square to the rider's view.
    this.ontarioPlace.add(turbine);
    const slab = new BoxGeometry(36, 105, 22);
    slab.translate(-150, 52.5, -620);
    const crown = new BoxGeometry(30, 6, 18);
    crown.translate(-150, 108, -620);
    this.disposables.push(slab, crown);
    this.ontarioPlace.add(new Mesh(slab, glass), new Mesh(crown, white));
    for (const [x, z, w, d] of [
      [-120, -470, 120, 60],
      [-250, -540, 160, 80],
    ] as const) {
      const body = new BoxGeometry(w, 16, d);
      body.translate(x, 8, z);
      const top = new BoxGeometry(w + 4, 2, d + 4);
      top.translate(x, 17, z);
      this.disposables.push(body, top);
      this.ontarioPlace.add(new Mesh(body, hall), new Mesh(top, roof));
    }
  }

  /**
   * High cirrus above the cumulus: long, thin streaks of ice cloud drawn across the upper sky,
   * each a band of faint overlapping strands, brushed out at both ends.
   */
  private addCirrus(): void {
    const random = seeded(3511);
    const strands: BufferGeometry[] = [];
    for (let k = 0; k < 9; k++) {
      const cx = (random() - 0.5) * 6000;
      const cz = -2400 - random() * 2000;
      const cy = 1500 + random() * 600;
      const tilt = (random() - 0.5) * 0.5;
      for (let i = 0; i < 7; i++) {
        const length = 900 + random() * 1400;
        const width = 30 + random() * 60;
        const strand = new PlaneGeometry(length, width, 8, 1);
        // Brush out both ends: the strand narrows to nothing at its tips.
        const position = strand.getAttribute('position') as BufferAttribute;
        for (let v = 0; v < position.count; v++) {
          const t = position.getX(v) / (length / 2);
          position.setY(v, position.getY(v) * Math.max(0.05, 1 - t * t));
        }
        strand.rotateZ(tilt + (random() - 0.5) * 0.08);
        strand.rotateX(Math.PI / 2.4);
        strand.translate(
          cx + (random() - 0.5) * 600,
          cy + (random() - 0.5) * 120,
          cz + (random() - 0.5) * 400,
        );
        strands.push(strand.toNonIndexed());
        strand.dispose();
      }
    }
    const sheet = mergeGeometries(strands)!;
    strands.forEach((g) => g.dispose());
    this.disposables.push(sheet);
    const cirrus = new Mesh(
      sheet,
      this.material({
        color: 0xffffff,
        emissive: 0xf4f7fc,
        emissiveIntensity: 1.15,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        side: DoubleSide,
        fog: false,
      }),
    );
    cirrus.frustumCulled = false;
    this.clouds.add(cirrus);
  }

  /**
   * The sky's life: a twin turboprop descending over the lake towards the island airport, a
   * news helicopter orbiting over the route, and a jet's contrail high above the city.
   */
  private addSkyLife(): void {
    // A twin turboprop, high-winged, white with a dark tail.
    const fuselage = new CylinderGeometry(1.3, 1.1, 30, 10);
    fuselage.rotateX(Math.PI / 2);
    const mainWing = new BoxGeometry(28, 0.4, 3);
    mainWing.translate(0, 1.2, -1);
    const tail = new BoxGeometry(0.4, 6, 3.4);
    tail.translate(0, 3, 13);
    const tailplane = new BoxGeometry(9, 0.3, 2.2);
    tailplane.translate(0, 5.8, 13.5);
    const engines = mergeGeometries(
      [-5, 5].map((x) => {
        const e = new CylinderGeometry(0.7, 0.6, 5, 8);
        e.rotateX(Math.PI / 2);
        e.translate(x, 0.6, -2.5);
        return e;
      }),
    )!;
    const dark = this.material({ color: 0x1c2b4a, roughness: 0.5, fog: false });
    const hull = this.material({ color: 0xf2f2f0, roughness: 0.5, fog: false });
    this.disposables.push(fuselage, mainWing, tail, tailplane, engines);
    this.plane.add(new Mesh(fuselage, hull), new Mesh(mainWing, hull), new Mesh(tail, dark));
    this.plane.add(new Mesh(tailplane, dark), new Mesh(engines, dark));
    this.plane.rotation.y = -Math.PI / 2 + 0.3;
    this.plane.rotation.z = 0.05;
    this.group.add(this.plane);
    this.addHelicopter();
    // A jet's contrail, a long thin streak spreading as it ages.
    const trail = new CylinderGeometry(3, 0.6, 2600, 8, 1, true);
    trail.rotateZ(Math.PI / 2 - 0.08);
    trail.translate(-500, 1150, -3300);
    this.disposables.push(trail);
    const vapour = this.material({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      fog: false,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
    });
    const contrail = new Mesh(trail, vapour);
    contrail.frustumCulled = false;
    this.clouds.add(contrail);
  }

  /**
   * A TV station's news helicopter over the parade: a white and blue body with a glazed nose,
   * a tail boom and fin, skids, the camera ball under its chin and a four-bladed rotor.
   */
  private addHelicopter(): void {
    const white = this.material({ color: 0xf2f3f4, roughness: 0.35, metalness: 0.3 });
    const blue = this.material({ color: 0x1b4fa0, roughness: 0.4, metalness: 0.3 });
    const glass = this.material({ color: 0x1a2630, roughness: 0.08, metalness: 0.6 });
    const dark = this.material({ color: 0x222428, roughness: 0.5, metalness: 0.5 });
    const h = this.helicopter;
    const add = (g: BufferGeometry, m: Material, x = 0, y = 0, z = 0) => {
      this.disposables.push(g);
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      h.add(mesh);
      return mesh;
    };
    add(ellipsoid(1.2, 1, 1, 2.1, 0, 0, 0, 16), white);
    add(ellipsoid(0.95, 1, 0.9, 1, 0, 0.12, -1.75, 14), glass);
    add(new BoxGeometry(2.25, 0.22, 3.4), blue, 0, -0.45, 0.2);
    const boom = new CylinderGeometry(0.16, 0.32, 5.2, 10);
    boom.rotateX(Math.PI / 2);
    add(boom, white, 0, 0.35, 4.6);
    add(new BoxGeometry(0.12, 1.3, 0.9), blue, 0, 0.9, 7.1);
    add(new BoxGeometry(1.4, 0.08, 0.5), white, 0, 0.4, 6.6);
    for (const x of [-0.85, 0.85]) {
      const skid = new CylinderGeometry(0.05, 0.05, 3.4, 6);
      skid.rotateX(Math.PI / 2);
      add(skid, dark, x, -1.45, 0);
      for (const z of [-0.8, 0.9])
        add(new CylinderGeometry(0.04, 0.04, 0.6, 5), dark, x * 0.85, -1.15, z);
    }
    add(new SphereGeometry(0.28, 10, 8), dark, 0, -0.9, -1.9);
    add(new CylinderGeometry(0.14, 0.18, 0.4, 8), dark, 0, 1.3, 0);
    for (let k = 0; k < 4; k++) {
      const blade = new BoxGeometry(0.28, 0.04, 10.5);
      blade.translate(0, 0, 0);
      const m = new Mesh(blade, dark);
      m.rotation.y = (k * Math.PI) / 4;
      this.disposables.push(blade);
      this.rotorBlades.add(m);
    }
    // The blur of the turning disc, faint against the sky.
    const disc = new CylinderGeometry(5.3, 5.3, 0.02, 32);
    this.disposables.push(disc);
    this.rotorBlades.add(
      new Mesh(
        disc,
        this.material({ color: 0x3a3c40, transparent: true, opacity: 0.18, depthWrite: false }),
      ),
    );
    this.rotorBlades.position.y = 1.55;
    h.add(this.rotorBlades);
    h.scale.setScalar(1.6);
    this.group.add(h);
  }

  /**
   * Parkdale on its bluff north of the Gardiner: a dense canopy of old maples and lindens over
   * the slope, and above it the 1960s apartment slabs along the top of the hill, brick and
   * concrete with balconies stacked up their fronts, hazed by distance.
   */
  private addParkdale(): void {
    const haze = new Color(HAZE);
    const hazed = (hex: number, amount: number, map: Texture | null = null) => {
      const material = new MeshStandardMaterial({ roughness: 0.85, fog: false, map });
      material.color.set(hex).lerp(haze, amount);
      this.disposables.push(material);
      return material;
    };
    const random = seeded(3401);
    const balconies = this.track(slabTexture());
    balconies.wrapS = RepeatWrapping;
    balconies.wrapT = RepeatWrapping;
    const wallMat = new MeshStandardMaterial({
      roughness: 0.85,
      fog: false,
      map: balconies,
      vertexColors: true,
    });
    this.disposables.push(wallMat);
    const wallTints = [0xb07a5c, 0xcfc6b8, 0x9c8a78, 0xd8d0c2].map((hex) =>
      new Color(hex).lerp(haze, 0.32),
    );
    // The canopy along the slope: overlapping crowns in a band, darker low, lit on top.
    const canopy: BufferGeometry[] = [];
    for (let k = 0; k < 90; k++) {
      const r = 9 + random() * 9;
      const crown = new IcosahedronGeometry(r, 1);
      crown.scale(1.2, 0.75, 1);
      crown.translate(-95 - random() * 70, 8 + random() * 14 + (k % 3) * 3, -120 - random() * 620);
      canopy.push(crown);
    }
    const trees = mergeGeometries(canopy)!;
    canopy.forEach((c) => c.dispose());
    this.disposables.push(trees);
    this.parkdale.add(new Mesh(trees, hazed(0x3f6b35, 0.3)));
    // The slabs along the top of the bluff, long sides to the lake.
    for (let k = 0; k < 11; k++) {
      const h = 38 + random() * 40;
      const w = 18 + random() * 10;
      const d = 40 + random() * 30;
      const slab = new BoxGeometry(w, h, d);
      for (const face of [0, 1]) scaleFaceUv(slab, face, d / 6, h / 2.9);
      for (const face of [4, 5]) scaleFaceUv(slab, face, w / 6, h / 2.9);
      slab.translate(-150 - random() * 60, h / 2 + 14, -170 - k * 52 - random() * 16);
      tintGeometry(slab, wallTints[k % wallTints.length]!);
      this.disposables.push(slab);
      this.parkdale.add(new Mesh(slab, wallMat));
    }
    this.group.add(this.parkdale);
  }

  /** Sailboats out on the lake, drifting slowly. */
  private addBoats(): void {
    const sail = new BufferGeometry();
    sail.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([0, 0.8, 0, 0, 9, 0, 3.6, 0.8, 0, 0, 0.8, 0, 3.6, 0.8, 0, 0, 9, 0]),
        3,
      ),
    );
    sail.computeVertexNormals();
    tintGeometry(sail, 0xf7f5ef);
    const hull = asNonIndexed(new BoxGeometry(5, 0.8, 1.5).translate(1.5, 0.4, 0));
    hull.deleteAttribute('uv');
    tintGeometry(hull, 0xffffff);
    const boatGeo = mergeGeometries([sail, hull])!;
    sail.dispose();
    hull.dispose();
    this.disposables.push(boatGeo);
    this.boatsMesh = this.instanced(boatGeo, this.propSolidMat, 6, false);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    if (
      options &&
      !options.map &&
      !options.emissiveMap &&
      options.emissive === undefined &&
      !options.transparent &&
      !options.flatShading &&
      options.alphaTest === undefined
    ) {
      const hex = options.color !== undefined ? new Color(options.color).getHexString() : 'ffffff';
      const key = `${hex}|${options.roughness ?? 1}|${options.metalness ?? 0}|${options.side ?? 0}|${options.fog === false ? 0 : 1}|${options.vertexColors ? 1 : 0}`;
      const cached = this.solidMaterials.get(key);
      if (cached) return cached;
      const created = new MeshStandardMaterial(options);
      this.solidMaterials.set(key, created);
      this.disposables.push(created);
      return created;
    }
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

  private instanced(
    geometry: BufferGeometry,
    material: Material,
    n: number,
    castShadow = true,
  ): InstancedMesh {
    const mesh = new InstancedMesh(geometry, material, n);
    mesh.frustumCulled = false;
    mesh.castShadow = castShadow;
    this.disposables.push(mesh);
    this.group.add(mesh);
    return mesh;
  }
}

/**
 * A dancer's body in skin, 1.7 m tall, feet at the origin, facing -z: legs with knees bent a
 * little, hips, a waist, a chest, neck and head, and arms held as `pose` says.
 */
function masBody(pose: readonly (readonly number[])[], male = false): BufferGeometry {
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const hip = v(side * 0.09, 0.92, 0);
    const knee = v(side * 0.1, 0.5, -0.04);
    const ankle = v(side * 0.1, 0.09, 0);
    parts.push(...limb(hip, knee, 0.085, 0.058, 5), ...limb(knee, ankle, 0.058, 0.038, 5, false));
    const shoulder = v(side * (male ? 0.2 : 0.17), 1.38, 0);
    const [ex, ey, ez, hx, hy, hz] = pose[side < 0 ? 0 : 1]!;
    const elbow = v(ex! * (male ? 1.08 : 1), ey!, ez!);
    const hand = v(hx! * (male ? 1.06 : 1), hy!, hz!);
    const arm = male ? 1.2 : 1;
    parts.push(...limb(shoulder, elbow, 0.05 * arm, 0.04 * arm, 5));
    parts.push(...limb(elbow, hand, 0.04 * arm, 0.032 * arm, 4, false));
    parts.push(ellipsoid(0.045, 1, 1.3, 0.6, hand.x, hand.y + 0.03, hand.z, 5));
  }
  parts.push(ellipsoid(0.15, male ? 0.95 : 1.05, 0.72, 0.82, 0, 0.95, 0, 6)); // pelvis
  const waist = new CylinderGeometry(male ? 0.14 : 0.125, male ? 0.14 : 0.14, 0.24, 8, 1, true);
  waist.scale(1, 1, 0.78);
  waist.translate(0, 1.08, 0);
  parts.push(waist);
  parts.push(ellipsoid(0.15, male ? 1.22 : 1.08, 0.9, male ? 0.68 : 0.74, 0, 1.29, 0, 6)); // chest
  parts.push(ellipsoid(0.07, male ? 3.1 : 2.6, 0.75, 1.2, 0, 1.38, 0, 6)); // shoulders
  const neck = new CylinderGeometry(0.045, 0.052, 0.12, 6, 1, true);
  neck.translate(0, 1.47, 0);
  parts.push(neck);
  parts.push(ellipsoid(0.105, 0.9, 1.1, 1, 0, 1.6, -0.01, 7)); // head
  const merged = merge(parts);
  bakeOcclusion(merged);
  return merged;
}

/**
 * The sequinned costume over the body: a bra, a bikini, a beaded belt and collar, and boots
 * to the knee, all in the section's colour.
 */
function masCostume(male: boolean): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    if (!male)
      parts.push(ellipsoid(0.072, 1, 0.92, 0.75, side * 0.07, 1.3, -0.085, 6)); // cups
    else {
      // Trunks to mid-thigh.
      const leg = new CylinderGeometry(0.1, 0.092, 0.2, 8);
      leg.translate(side * 0.092, 0.8, -0.01);
      parts.push(leg);
    }
    // A fitted boot: the shaft turned to follow the ankle, calf and knee, a pointed toe, a heel
    // and a thin sole.
    const shaft = new LatheGeometry(
      [
        [0.05, 0.06],
        [0.048, 0.12],
        [0.062, 0.28],
        [0.066, 0.45],
      ].map(([r, y]) => new Vector2(r!, y!)),
      8,
    );
    shaft.translate(side * 0.1, 0, -0.02);
    parts.push(shaft);
    parts.push(ellipsoid(0.052, 1, 0.75, 2.3, side * 0.1, 0.05, -0.085, 6));
    const heel = new BoxGeometry(0.05, 0.075, 0.05);
    heel.translate(side * 0.1, 0.0375, 0.03);
    parts.push(heel);
    const sole = new BoxGeometry(0.1, 0.015, 0.2);
    sole.translate(side * 0.1, 0.0075, -0.07);
    parts.push(sole);
  }
  if (male) {
    // A sash from the shoulder across the chest to the hip.
    const wrap = new CylinderGeometry(0.19, 0.17, 0.12, 10, 1, true);
    wrap.scale(1.2, 1, 0.72);
    wrap.rotateZ(0.6);
    wrap.translate(0, 1.17, 0);
    parts.push(wrap);
  } else {
    const band = new CylinderGeometry(0.158, 0.16, 0.06, 10);
    band.scale(1.06, 1, 0.78);
    band.translate(0, 1.26, 0);
    parts.push(band);
  }
  const bikini = new CylinderGeometry(0.152, 0.158, 0.13, 10);
  bikini.scale(1.04, 1, 0.84);
  bikini.translate(0, 0.93, 0);
  parts.push(bikini);
  const belt = new TorusGeometry(0.158, 0.018, 4, 12);
  belt.rotateX(Math.PI / 2);
  belt.scale(1.06, 1, 0.84);
  belt.translate(0, 0.99, 0);
  parts.push(belt);
  const headband = new TorusGeometry(0.1, 0.022, 4, 12);
  headband.rotateX(Math.PI / 2);
  headband.translate(0, 1.66, -0.01);
  parts.push(headband);
  const collar = new TorusGeometry(0.075, 0.022, 4, 10);
  collar.rotateX(Math.PI / 2);
  collar.translate(0, 1.42, 0);
  parts.push(collar);
  return merge(parts);
}

/** Sequins: rows of small round scales, each catching the light its own way. */
function sequinTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(61);
    for (let y = 0; y < 128; y += 8) {
      for (let x = (y / 8) % 2 ? 4 : 0; x < 132; x += 8) {
        const l = 62 + random() * 38;
        g.fillStyle = `hsl(0,0%,${l}%)`;
        g.beginPath();
        g.arc(x, y + 4, 3.6, 0, Math.PI * 2);
        g.fill();
        if (random() < 0.12) {
          g.fillStyle = '#ffffff';
          g.fillRect(x - 1, y + 2, 2, 2);
        }
      }
    }
  });
}

/**
 * A fan of `count` plumes `length` long and `width` wide, spread over `spread` radians and
 * leaning back `lean`, each shaded from `hub` to `tip` through vertex colours, darker where
 * the quills cross at the hub.
 */
function featherFan(
  [hub, tip]: readonly [string, string],
  count: number,
  length: number,
  width: number,
  spread: number,
  lean: number,
): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const from = new Color(hub);
  const to = new Color(tip);
  const c = new Color();
  const random = seeded(count * 7 + Math.round(length * 100));
  for (let i = 0; i < count; i++) {
    const long = length * (0.88 + random() * 0.2);
    const feather = new PlaneGeometry(width, long, 2, 4);
    feather.translate(0, long / 2, 0);
    // Each plume arches: its shaft curls forward along its length and the tip nods over,
    // the vane cupped a little either side of the quill.
    const bend = feather.getAttribute('position') as BufferAttribute;
    const curl = 0.22 + random() * 0.12;
    for (let v = 0; v < bend.count; v++) {
      const t = bend.getY(v) / long;
      const across = bend.getX(v) / (width / 2);
      bend.setY(v, bend.getY(v) - curl * long * t * t * 0.35);
      bend.setZ(v, bend.getZ(v) - curl * long * t * t + across * across * width * 0.18);
    }
    // Each plume droops a little more the further it leans from upright.
    const a = -spread / 2 + (spread * i) / (count - 1) + (random() - 0.5) * 0.05;
    feather.rotateX(-lean - Math.abs(a) * 0.08);
    feather.rotateZ(a);
    feather.translate(0, 0, 0.16 + (i % 2) * 0.025);
    const position = feather.getAttribute('position') as BufferAttribute;
    const uv = feather.getAttribute('uv') as BufferAttribute;
    const colour = new Float32Array(position.count * 3);
    for (let v = 0; v < position.count; v++) {
      const y = uv.getY(v);
      c.copy(from).lerp(to, Math.pow(y, 0.9));
      c.multiplyScalar(0.62 + 0.38 * Math.min(1, y * 2.5));
      colour.set([c.r, c.g, c.b], v * 3);
    }
    feather.setAttribute('color', new BufferAttribute(colour, 3));
    feather.computeVertexNormals();
    parts.push(feather);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Bead fringe: strands of round beads on threads, cut out of the canvas. */
function fringeTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 256, 6);
    const random = seeded(83);
    for (let x = 3; x < 256; x += 6) {
      const length = 40 + random() * 22;
      for (let y = 8; y < length; y += 5) {
        g.beginPath();
        g.arc(x, y, 2.2, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

/** The hub of a backpiece: a sequinned disc in a raised ring, studded with rhinestones. */
function medallionGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const disc = new CylinderGeometry(0.2, 0.2, 0.03, 12);
  disc.rotateX(Math.PI / 2);
  disc.translate(0, 0.02, 0.15);
  parts.push(disc);
  const ring = new TorusGeometry(0.22, 0.028, 4, 14);
  ring.translate(0, 0.02, 0.15);
  parts.push(ring);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = new SphereGeometry(0.026, 5, 4);
    stone.translate(Math.cos(a) * 0.13, 0.02 + Math.sin(a) * 0.13, 0.13);
    parts.push(stone);
  }
  return merge(parts);
}

/**
 * Lake Shore's parade lanes, kerb to kerb across 13.5 m (u) and 18 m along (v): grey asphalt
 * with stone in it, a concrete gutter at each kerb, solid edge lines, two dashed lane lines,
 * patched seams and catch basins, and the parade's litter of confetti, glitter and dropped
 * feathers in the bands' colours.
 */
function roadTexture(): CanvasTexture {
  const w = 1024;
  const h = 2048;
  const px = w / (2 * CURB);
  const py = h / 18;
  return canvasTexture(w, h, (g) => {
    speckle(g, w, h, '#4d4f54', 4211);
    const random = seeded(4213);
    const aggFills = [
      'hsla(220,4%,24%,0.38)',
      'hsla(220,4%,31%,0.42)',
      'hsla(220,4%,60%,0.38)',
      'hsla(220,4%,70%,0.42)',
    ];
    const aggPaths = aggFills.map(() => new Path2D());
    for (let i = 0; i < 16000; i++) {
      const bi = (random() < 0.5 ? 0 : 2) + (random() < 0.5 ? 0 : 1);
      aggPaths[bi]!.rect(random() * w, random() * h, 1.5, 1.5);
    }
    for (let b = 0; b < aggFills.length; b++) {
      g.fillStyle = aggFills[b]!;
      g.fill(aggPaths[b]!);
    }
    // Wheel tracks: smoother, darker bands where the traffic runs the rest of the year.
    for (const lane of [-4.4, 0, 4.4]) {
      for (const track of [-0.9, 0.9]) {
        const x = (CURB + lane + track) * px;
        const band = g.createLinearGradient(x - 30, 0, x + 30, 0);
        band.addColorStop(0, 'rgba(30,30,34,0)');
        band.addColorStop(0.5, 'rgba(30,30,34,0.16)');
        band.addColorStop(1, 'rgba(30,30,34,0)');
        g.fillStyle = band;
        g.fillRect(x - 30, 0, 60, h);
      }
    }
    // Patches and sealed cracks.
    for (let i = 0; i < 5; i++) {
      g.fillStyle = `rgba(40,41,45,${(0.3 + random() * 0.25).toFixed(2)})`;
      g.fillRect(random() * w, random() * h, 60 + random() * 160, 40 + random() * 200);
    }
    g.strokeStyle = 'rgba(22,22,24,0.7)';
    g.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      let x = random() * w;
      let y = random() * h;
      g.beginPath();
      g.moveTo(x, y);
      for (let j = 0; j < 10; j++) {
        x += (random() - 0.5) * 40;
        y += random() * 40;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    // Concrete gutters at the kerbs, with a catch basin in each.
    const gutter = 0.4 * px;
    g.fillStyle = '#8f8b84';
    g.fillRect(0, 0, gutter, h);
    g.fillRect(w - gutter, 0, gutter, h);
    g.fillStyle = 'rgba(60,58,55,0.6)';
    for (let y = 0; y < h; y += 1.5 * py) g.fillRect(0, y, gutter, 2);
    for (let y = 0; y < h; y += 1.5 * py) g.fillRect(w - gutter, y, gutter, 2);
    for (const [x, y] of [
      [0, 6 * py],
      [w - gutter, 14 * py],
    ] as const) {
      g.fillStyle = '#26272a';
      g.fillRect(x + 4, y, gutter - 8, 0.9 * py);
      g.fillStyle = '#5b5d60';
      for (let k = 0; k < 7; k++) g.fillRect(x + 8, y + 6 + k * 14, gutter - 16, 5);
    }
    // Solid edge lines and two dashed lane lines, 3 m dashes and 6 m gaps, a little worn.
    g.fillStyle = 'rgba(238,236,228,0.88)';
    g.fillRect(gutter + 0.25 * px, 0, 0.12 * px, h);
    g.fillRect(w - gutter - 0.37 * px, 0, 0.12 * px, h);
    for (const lane of [-2.2, 2.2]) {
      const x = (CURB + lane) * px - 0.06 * px;
      for (let y = 0; y < h; y += 9 * py) g.fillRect(x, y, 0.12 * px, 3 * py);
    }
    g.fillStyle = 'rgba(77,79,84,0.55)';
    const wearPath = new Path2D();
    for (let i = 0; i < 900; i++) wearPath.rect(random() * w, random() * h, 3, 2);
    g.fill(wearPath);
    // The parade's litter: confetti, glitter and feathers dropped from the costumes.
    const colours = ['#ff2d87', '#ffd23f', '#13c3c9', '#ff8a00', '#7b2ff7', '#ffffff', '#4de0a8'];
    const litterPaths = colours.map(() => new Path2D());
    for (let i = 0; i < 1400; i++) {
      const ci = Math.floor(random() * colours.length);
      const cx = random() * w;
      const cy = random() * h;
      const a = random() * Math.PI;
      const hw = 2 + random() * 1.5;
      const hh = 1.5;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const p = litterPaths[ci]!;
      p.moveTo(cx - hw * ca + hh * sa, cy - hw * sa - hh * ca);
      p.lineTo(cx + hw * ca + hh * sa, cy + hw * sa - hh * ca);
      p.lineTo(cx + hw * ca - hh * sa, cy + hw * sa + hh * ca);
      p.lineTo(cx - hw * ca - hh * sa, cy - hw * sa + hh * ca);
      p.closePath();
    }
    for (let c = 0; c < colours.length; c++) {
      g.fillStyle = colours[c]!;
      g.fill(litterPaths[c]!);
    }
    for (let i = 0; i < 26; i++) {
      const x = gutter + random() * (w - 2 * gutter);
      const y = random() * h;
      const a = random() * Math.PI * 2;
      const len = 18 + random() * 26;
      g.strokeStyle = colours[Math.floor(random() * 5)]!;
      g.lineWidth = 5 + random() * 4;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(
        x + Math.cos(a) * len * 0.5 + 6,
        y + Math.sin(a) * len * 0.5,
        x + Math.cos(a) * len,
        y + Math.sin(a) * len,
      );
      g.stroke();
    }
  });
}

/**
 * The CN Tower, 553 m: a hexagonal core braced by three legs in a Y that taper into it below
 * the main pod; the pod turned on a lathe, its two dark window bands under the white ring of
 * the outdoor deck; the SkyPod at 447 m; and the antenna in tapering segments to the top.
 */
function cnTower(concrete: Material, grey: Material, glass: Material): Group {
  const tower = new Group();
  const core = new CylinderGeometry(4.6, 8.5, 452, 6);
  core.translate(0, 226, 0);
  tower.add(new Mesh(core, concrete));
  for (let k = 0; k < 3; k++) {
    const leg = new BoxGeometry(1, 1, 1, 1, 30, 1);
    leg.translate(0.5, 0.5, 0);
    const position = leg.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i);
      const v = position.getY(i);
      const height = v * 338;
      const reach = 6 + 24 * Math.pow(1 - v, 1.6);
      const width = 6.2 - 2.4 * v;
      position.setXYZ(i, u * reach, height, position.getZ(i) * width);
    }
    leg.computeVertexNormals();
    leg.rotateY((k * Math.PI * 2) / 3 + Math.PI / 2);
    tower.add(new Mesh(leg, concrete));
  }
  const lathe = (profile: [number, number][], segments = 40) =>
    new LatheGeometry(
      profile.map(([r, y]) => new Vector2(r, y)),
      segments,
    );
  // The main pod's shell, lower cone to upper cap.
  tower.add(
    new Mesh(
      lathe([
        [6, 318],
        [14, 328],
        [21, 336],
        [23.5, 340],
        [23.5, 352],
        [20, 357],
        [14, 361],
        [8, 364],
        [5, 366],
      ]),
      concrete,
    ),
  );
  // Two bands of glazing, the restaurant and the indoor lookout.
  for (const [y, h, r] of [
    [341, 4.2, 24.2],
    [348.5, 3.4, 23.9],
  ] as const) {
    const band = new CylinderGeometry(r, r - 0.6, h, 40, 1, true);
    band.translate(0, y + h / 2, 0);
    tower.add(new Mesh(band, glass));
  }
  // The outdoor deck: a white ring standing proud of the pod between the bands.
  const deck = new CylinderGeometry(26.5, 26, 2.2, 40);
  deck.translate(0, 346.2, 0);
  tower.add(new Mesh(deck, grey));
  // The SkyPod and its band of windows.
  tower.add(
    new Mesh(
      lathe([
        [4.5, 440],
        [8, 444],
        [8.4, 449],
        [6.5, 453],
        [3.8, 456],
      ]),
      concrete,
    ),
  );
  const sky = new CylinderGeometry(8.6, 8.6, 2.2, 32, 1, true);
  sky.translate(0, 446.5, 0);
  tower.add(new Mesh(sky, glass));
  // The antenna, in tapering segments with a collar at each joint.
  let y = 452;
  for (let k = 0; k < 6; k++) {
    const h = 17 - k;
    const bottom = 3.2 - k * 0.45;
    const segment = new CylinderGeometry(bottom - 0.42, bottom, h, 10);
    segment.translate(0, y + h / 2, 0);
    tower.add(new Mesh(segment, k % 2 ? grey : concrete));
    const collar = new CylinderGeometry(bottom + 0.3, bottom + 0.3, 0.8, 10);
    collar.translate(0, y + 0.4, 0);
    tower.add(new Mesh(collar, grey));
    y += h;
  }
  return tower;
}

/** A tree species: its seed, how many leaf clumps, the crown's size and its two greens. */
interface Species {
  readonly seed: number;
  readonly clumps: number;
  readonly radius: number;
  readonly height: number;
  readonly squash: number;
  readonly light: string;
  readonly dark: string;
}

/**
 * A park tree of `species`: a trunk forking into three or four limbs, and a crown of leaf
 * clumps, each an icosahedron pushed out of round, set round the limbs' ends and shaded
 * through vertex colours from a sunlit top to a dark underside.
 */
function treeGeometry(species: Species): {
  trunk: BufferGeometry;
  crown: BufferGeometry;
  sprigs: BufferGeometry;
} {
  const random = seeded(species.seed);
  const { radius, height, squash } = species;
  const base = new Vector3(0, 0, 0);
  const fork = new Vector3(0, height * 0.42, 0);
  const wood: BufferGeometry[] = limb(base, fork, 0.32, 0.22, 6);
  const tips: Vector3[] = [];
  const limbs = 3 + Math.floor(random() * 2);
  for (let k = 0; k < limbs; k++) {
    const a = (k / limbs) * Math.PI * 2 + random() * 0.6;
    const out = radius * (0.45 + random() * 0.25);
    const tip = new Vector3(
      Math.cos(a) * out,
      height * (0.78 + random() * 0.12),
      Math.sin(a) * out,
    );
    wood.push(...limb(fork, tip, 0.17, 0.07, 5, false));
    tips.push(tip);
  }
  const clumps: BufferGeometry[] = [];
  const centre = new Vector3(0, height, 0);
  const clumpCount = Math.max(11, Math.round(species.clumps * 0.62));
  for (let k = 0; k < clumpCount; k++) {
    const r = radius * (0.44 + random() * 0.22);
    const facets = new IcosahedronGeometry(r, 1);
    facets.deleteAttribute('normal');
    facets.deleteAttribute('uv');
    const clump = mergeVertices(facets);
    facets.dispose();
    const position = clump.getAttribute('position') as BufferAttribute;
    // Every copy of a corner moves together, by a hash of where it is, so the clump stays shut.
    const salt = random() * 100;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const hash = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + salt) * 43758.5453;
      const bulge = 0.8 + (hash - Math.floor(hash)) * 0.4;
      position.setXYZ(i, x * bulge, y * bulge, z * bulge);
    }
    const around = k < tips.length ? tips[k]!.clone() : centre.clone();
    if (k >= tips.length) {
      const a = random() * Math.PI * 2;
      const up = random() * 2 - 0.6;
      around.add(
        new Vector3(
          Math.cos(a) * radius * 0.62,
          up * radius * squash * 0.55,
          Math.sin(a) * radius * 0.62,
        ),
      );
    }
    clump.translate(around.x, around.y, around.z);
    clump.computeVertexNormals();
    // Leaves wrap the clump: planar texture coordinates from where each corner stands.
    const uv = new Float32Array(position.count * 2);
    for (let i = 0; i < position.count; i++) {
      uv[i * 2] = (position.getX(i) + position.getZ(i)) * 0.35;
      uv[i * 2 + 1] = position.getY(i) * 0.35;
    }
    clump.setAttribute('uv', new BufferAttribute(uv, 2));
    clumps.push(clump);
  }
  const crown = mergeGeometries(clumps)!;
  clumps.forEach((c) => c.dispose());
  // Shade the crown: sunlit where it faces up and out, dark where it faces down or inward.
  const position = crown.getAttribute('position') as BufferAttribute;
  const normal = crown.getAttribute('normal') as BufferAttribute;
  const colour = new Float32Array(position.count * 3);
  const light = new Color(species.light);
  const dark = new Color(species.dark);
  const c = new Color();
  const top = height + radius * squash;
  const bottom = height - radius * squash;
  for (let i = 0; i < position.count; i++) {
    const rise = (position.getY(i) - bottom) / (top - bottom);
    const facing = normal.getY(i) * 0.5 + 0.5;
    const t = Math.min(1, Math.max(0, rise * 0.55 + facing * 0.45 + (random() - 0.5) * 0.12));
    c.copy(dark).lerp(light, t);
    colour.set([c.r, c.g, c.b], i * 3);
  }
  crown.setAttribute('color', new BufferAttribute(colour, 3));
  // Sprigs of leaves standing out of the crown's surface, so its edge is ragged, not smooth.
  const cards: BufferGeometry[] = [];
  const normals = crown.getAttribute('normal') as BufferAttribute;
  const out = new Vector3();
  for (let k = 0; k < 84; k++) {
    const i = Math.floor(random() * position.count);
    out.set(normals.getX(i), normals.getY(i), normals.getZ(i));
    if (out.y < -0.5) continue;
    const size = 1.25 + random() * 0.9;
    const card = new PlaneGeometry(size, size);
    card.rotateZ(random() * Math.PI);
    card.lookAt(out);
    card.rotateY((random() - 0.5) * 1.2);
    card.translate(
      position.getX(i) + out.x * size * 0.25,
      position.getY(i) + out.y * size * 0.25,
      position.getZ(i) + out.z * size * 0.25,
    );
    const shade = new Float32Array(4 * 3);
    for (let v = 0; v < 4; v++)
      shade.set([colour[i * 3]!, colour[i * 3 + 1]!, colour[i * 3 + 2]!], v * 3);
    card.setAttribute('color', new BufferAttribute(shade, 3));
    cards.push(card);
  }
  const sprigs = mergeGeometries(cards)!;
  cards.forEach((c) => c.dispose());
  const trunk = merge(wood);
  return { trunk, crown, sprigs };
}

/** Leaves: overlapping small ovals in light and shadow, tinted by the crown's colours. */
function leafTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#b8b8b8';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(71);
    for (let i = 0; i < 2600; i++) {
      const l = 50 + random() * 50;
      g.fillStyle = `hsl(80,12%,${l}%)`;
      g.save();
      g.translate(random() * 256, random() * 256);
      g.rotate(random() * Math.PI);
      g.beginPath();
      g.ellipse(0, 0, 4 + random() * 3, 2 + random() * 1.5, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  });
}

/** A sprig: a cluster of overlapping pointed leaves on twigs, cut out of the canvas. */
function sprigTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    const random = seeded(73);
    for (let i = 0; i < 46; i++) {
      const a = random() * Math.PI * 2;
      const r = random() * 44;
      const x = 64 + Math.cos(a) * r;
      const y = 64 + Math.sin(a) * r;
      const l = 55 + random() * 45;
      g.fillStyle = `hsl(80,10%,${l}%)`;
      g.save();
      g.translate(x, y);
      g.rotate(a + (random() - 0.5));
      g.beginPath();
      g.moveTo(-11, 0);
      g.quadraticCurveTo(0, -7, 11, 0);
      g.quadraticCurveTo(0, 7, -11, 0);
      g.fill();
      g.restore();
    }
  });
}

/** Bark: grey-brown with long vertical fissures. */
function barkTexture(): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    speckle(g, 128, 256, '#8e8378', 77);
    const random = seeded(79);
    g.strokeStyle = 'rgba(40,32,26,0.6)';
    for (let i = 0; i < 40; i++) {
      g.lineWidth = 1 + random() * 2;
      let x = random() * 128;
      let y = 0;
      g.beginPath();
      g.moveTo(x, y);
      while (y < 256) {
        x += (random() - 0.5) * 6;
        y += 8 + random() * 10;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

/**
 * A steel bike-rack barricade, 2.4 m long along z and 1.1 m high: top and bottom rails, end
 * posts, fourteen pickets and a flat foot splayed across each end, with a hook to the next.
 */
function barricadeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const bar = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const box = new BoxGeometry(w, h, d);
    box.translate(x, y, z);
    parts.push(box);
  };
  bar(0.045, 0.045, 2.4, 0, 1.08, 0);
  bar(0.04, 0.04, 2.4, 0, 0.17, 0);
  for (const z of [-1.18, 1.18]) {
    bar(0.045, 1.04, 0.045, 0, 0.6, z);
    bar(0.75, 0.03, 0.06, 0, 0.015, z);
    bar(0.03, 0.12, 0.03, 0, 0.08, z);
  }
  for (let k = 1; k <= 8; k++) bar(0.02, 0.9, 0.02, 0, 0.62, -1.18 + (k * 2.36) / 9);
  bar(0.03, 0.03, 0.14, 0, 0.95, 1.25);
  return merge(parts);
}

/** Packs all four moko jumbie trouser stripe pairs into one `256 × 32` horizontal atlas. */
function mokoStripeAtlasTexture(pairs: readonly (readonly [string, string])[]): CanvasTexture {
  const cellW = 64;
  return canvasTexture(cellW * pairs.length, 32, (g) => {
    pairs.forEach(([a, b], idx) => {
      const x0 = idx * cellW;
      for (let x = 0; x < cellW; x += 8) {
        g.fillStyle = (x / 8) % 2 ? b : a;
        g.fillRect(x0 + x, 0, 8, 32);
      }
    });
  });
}

/** The Cinesphere's aluminium panels: pale triangles with dark joints. */
function geodesicTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#f2f2f0';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(90,96,104,0.55)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 126, 126);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(128, 128);
    g.stroke();
  });
}

/** Pale concrete slabs, 1 m by 1 m (the texture covers 4 m), with dark joints. */
function concreteTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#bdb8ae', 5);
    g.strokeStyle = 'rgba(60,55,50,0.45)';
    g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      g.beginPath();
      g.moveTo(0, i * 128);
      g.lineTo(512, i * 128);
      g.moveTo(i * 128, 0);
      g.lineTo(i * 128, 512);
      g.stroke();
    }
  });
}

function grassTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#4f8a3a';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(9);
    const shades = ['hsl(98,45%,33%)', 'hsl(104,45%,39%)', 'hsl(110,45%,45%)', 'hsl(116,45%,51%)'];
    const bladePaths = shades.map(() => new Path2D());
    for (let i = 0; i < 9000; i++) {
      const p = bladePaths[Math.floor(random() * shades.length)]!;
      const x = random() * 512;
      const y = random() * 512;
      p.moveTo(x, y);
      p.lineTo(x + random() * 4 - 2, y - 4 - random() * 6);
    }
    for (let s = 0; s < shades.length; s++) {
      g.strokeStyle = shades[s]!;
      g.stroke(bladePaths[s]!);
    }
  });
}

/** Armour stone at the water's edge: big blocks of grey limestone. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#9a958b', 13);
    const random = seeded(17);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `hsl(40,6%,${45 + random() * 25}%)`;
      g.strokeStyle = 'rgba(40,38,35,0.6)';
      g.lineWidth = 3;
      const x = random() * 512;
      const y = random() * 512;
      g.beginPath();
      g.roundRect(x, y, 60 + random() * 70, 40 + random() * 50, 10);
      g.fill();
      g.stroke();
    }
  });
}

/** Ripples on the lake, light on blue. */
function waterTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#3d7fa6';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(23);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(255,255,255,${0.05 + random() * 0.2})`;
      g.fillRect(random() * 512, random() * 512, 8 + random() * 22, 1.5);
    }
  });
}

function drawFlagKind(g: CanvasRenderingContext2D, kind: FlagKind, w: number, h: number): void {
  const poly = (fill: string, ...pts: [number, number][]) => {
    g.fillStyle = fill;
    g.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.closePath();
    g.fill();
  };
  if (kind === 'trinidad') {
    g.fillStyle = '#ce1126';
    g.fillRect(0, 0, w, h);
    poly('#ffffff', [0, 0], [70, 0], [w, h - 0], [w - 70, h]);
    poly('#000000', [15, 0], [55, 0], [w - 15, h], [w - 55, h]);
    poly('#ffffff', [0, 0], [10, 0], [10, 0], [0, 10]);
  } else if (kind === 'jamaica') {
    g.fillStyle = '#009b3a';
    g.fillRect(0, 0, w, h);
    poly('#000000', [0, 0], [w / 2, h / 2], [0, h]);
    poly('#000000', [w, 0], [w / 2, h / 2], [w, h]);
    g.strokeStyle = '#fed100';
    g.lineWidth = 30;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(w, h);
    g.moveTo(w, 0);
    g.lineTo(0, h);
    g.stroke();
  } else if (kind === 'barbados') {
    g.fillStyle = '#00267f';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffc726';
    g.fillRect(w / 3, 0, w / 3, h);
    g.fillStyle = '#000000';
    g.fillRect(w / 2 - 6, 50, 12, 110);
    g.fillRect(w / 2 - 40, 60, 80, 10);
    g.fillRect(w / 2 - 40, 30, 10, 40);
    g.fillRect(w / 2 + 30, 30, 10, 40);
  } else {
    g.fillStyle = '#009e49';
    g.fillRect(0, 0, w, h);
    poly('#ffffff', [0, 0], [w, h / 2], [0, h]);
    poly('#fcd116', [0, 8], [w - 16, h / 2], [0, h - 8]);
    poly('#000000', [0, 0], [w / 2, h / 2], [0, h]);
    poly('#ce1126', [0, 8], [w / 2 - 14, h / 2], [0, h - 8]);
  }
}

/** Packs all four Caribbean flags into one `2×2` (`600 × 400`) texture atlas. */
function flagAtlasTexture(): CanvasTexture {
  const cellW = 300;
  const cellH = 200;
  return canvasTexture(cellW * 2, cellH * 2, (g) => {
    FLAG_KINDS.forEach((kind, idx) => {
      const x0 = (idx % 2) * cellW;
      const y0 = Math.floor(idx / 2) * cellH;
      g.save();
      g.beginPath();
      g.rect(x0, y0, cellW, cellH);
      g.clip();
      g.translate(x0, y0);
      drawFlagKind(g, kind, cellW, cellH);
      g.restore();
    });
  });
}

/**
 * One ostrich plume: a pale quill with soft, ragged barbs curling out and up either side,
 * fluffier towards the tip, transparent round it.
 */
function featherTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    g.clearRect(0, 0, 64, 256);
    const random = seeded(29);
    g.lineCap = 'round';
    for (let y = 250; y > 4; y -= 1.6) {
      const along = 1 - y / 256;
      // Narrow at the quill's foot, widest two thirds up, rounding off at the tip.
      const reach =
        30 * Math.sin(Math.min(1, along * 1.25) * Math.PI * 0.92) * (0.75 + random() * 0.3);
      for (const side of [-1, 1]) {
        const shade = 82 + random() * 18;
        g.strokeStyle = `hsla(0,0%,${shade}%,${0.55 + random() * 0.4})`;
        g.lineWidth = 1 + random() * 1.4;
        g.beginPath();
        g.moveTo(32, y);
        g.quadraticCurveTo(
          32 + side * reach * 0.6,
          y - 4,
          32 + side * reach,
          y - 10 - random() * 6,
        );
        g.stroke();
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.fillRect(31, 0, 2, 256);
  });
}

/** A box truss face: two chords and the zigzag lacing between them, cut out of the canvas. */
function trussTexture(): CanvasTexture {
  return canvasTexture(64, 512, (g) => {
    g.clearRect(0, 0, 64, 512);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 8, 512);
    g.fillRect(56, 0, 8, 512);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 5;
    g.beginPath();
    for (let y = 0; y <= 512; y += 64) {
      g.moveTo(4, y);
      g.lineTo(60, y + 32);
      g.lineTo(4, y + 64);
    }
    g.stroke();
  });
}

/** A pan's playing face: chrome hammered into a ring of note fields round a centre. */
function panTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, '#8a8f94');
    grad.addColorStop(1, '#e8ebee');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(40,44,48,0.55)';
    g.lineWidth = 2;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.beginPath();
      g.ellipse(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44, 13, 9, a, 0, Math.PI * 2);
      g.stroke();
    }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      g.beginPath();
      g.ellipse(64 + Math.cos(a) * 20, 64 + Math.sin(a) * 20, 8, 6, a, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

/** The Toronto Police cap band: a chequer of black and white squares. */
function chequerTexture(): CanvasTexture {
  return canvasTexture(64, 8, (g) => {
    for (let x = 0; x < 64; x += 4) {
      for (let y = 0; y < 8; y += 4) {
        g.fillStyle = (x + y) % 8 ? '#111111' : '#f2f2f2';
        g.fillRect(x, y, 4, 4);
      }
    }
  });
}

/** Packs the bands' banners into one vertical stack atlas (`512 × 192n`). */
function bandBannerAtlasTexture(
  entries: readonly (readonly [string, string, string, string])[],
): CanvasTexture {
  const rowH = 192;
  return canvasTexture(512, rowH * entries.length, (g) => {
    g.clearRect(0, 0, 512, rowH * entries.length);
    entries.forEach(([name, theme, fill, ink], r) => {
      const y0 = r * rowH;
      g.fillStyle = fill;
      g.fillRect(0, y0, 512, 168);
      g.strokeStyle = '#ffd23f';
      g.lineWidth = 8;
      g.strokeRect(8, y0 + 8, 496, 152);
      g.fillStyle = ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold 64px system-ui, sans-serif';
      g.fillText(name, 256, y0 + 66, 470);
      g.font = 'italic 34px system-ui, sans-serif';
      g.fillText(`presents ${theme}`, 256, y0 + 126, 440);
      g.fillStyle = '#ffd23f';
      for (let x = 4; x < 512; x += 8) g.fillRect(x, y0 + 168, 4, 18 + (x % 3) * 2);
    });
  });
}

/** A ladder crosswalk: wide white bars across the road, worn, transparent between. */
function ladderTexture(): CanvasTexture {
  return canvasTexture(1024, 128, (g) => {
    g.clearRect(0, 0, 1024, 128);
    g.fillStyle = '#e6e3da';
    g.fillRect(0, 0, 1024, 10);
    g.fillRect(0, 118, 1024, 10);
    for (let x = 8; x < 1024; x += 48) g.fillRect(x, 10, 26, 108);
    // Weathered as a busy crossing is: the paint dulled grey-brown where tyres run in the
    // lanes, scuffed and flecked with grit, its edges ragged. The texture is cut out by its
    // alpha, so the wear is painted on in colour, kept within the bars.
    g.globalCompositeOperation = 'source-atop';
    const random = seeded(1601);
    for (const lane of [0.18, 0.5, 0.82]) {
      for (const track of [-0.06, 0.06]) {
        const x = (lane + track) * 1024;
        const band = g.createLinearGradient(x - 50, 0, x + 50, 0);
        band.addColorStop(0, 'rgba(90,86,78,0)');
        band.addColorStop(0.5, 'rgba(90,86,78,0.42)');
        band.addColorStop(1, 'rgba(90,86,78,0)');
        g.fillStyle = band;
        g.fillRect(x - 50, 0, 100, 128);
      }
    }
    for (let i = 0; i < 90; i++) {
      const x = random() * 1024;
      const y = random() * 128;
      const r = 6 + random() * 22;
      const scuff = g.createRadialGradient(x, y, 0, x, y, r);
      scuff.addColorStop(0, `rgba(70,66,60,${(0.2 + random() * 0.3).toFixed(2)})`);
      scuff.addColorStop(1, 'rgba(70,66,60,0)');
      g.fillStyle = scuff;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(60,58,54,${(0.2 + random() * 0.5).toFixed(2)})`;
      g.fillRect(random() * 1024, random() * 128, 1.5, 1.5);
    }
    // Ragged edges: bites out of the ends of the bars where the paint has chipped away.
    g.globalCompositeOperation = 'destination-out';
    for (let x = 8; x < 1024; x += 48) {
      for (const y of [10, 118]) {
        for (let k = 0; k < 4; k++) {
          g.fillRect(x + random() * 24, y - 2 + random() * 3, 2 + random() * 5, 2 + random() * 3);
        }
      }
    }
  });
}

/** Packs Toronto street-name signs into one vertical stack atlas (`512 × 96n`). */
function streetSignAtlasTexture(names: readonly string[]): CanvasTexture {
  const rowH = 96;
  return canvasTexture(512, rowH * names.length, (g) => {
    names.forEach((name, r) => {
      const y0 = r * rowH;
      g.fillStyle = '#1d4e9e';
      g.fillRect(0, y0, 512, rowH);
      g.strokeStyle = '#ffffff';
      g.lineWidth = 5;
      g.strokeRect(6, y0 + 6, 500, rowH - 12);
      g.fillStyle = '#ffffff';
      g.font = 'bold 58px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(name, 256, y0 + 52, 470);
    });
  });
}

/**
 * A Toronto Police cruiser: a white sedan with the blue and red stripe along its flank, dark
 * glass, black wheels and a light bar on the roof whose red and blue go into `lights`.
 */
function policeCruiser(
  material: (o: ConstructorParameters<typeof MeshStandardMaterial>[0]) => MeshStandardMaterial,
  unit: BoxGeometry,
  lights: MeshStandardMaterial[],
): Group {
  const car = new Group();
  const box = (m: MeshStandardMaterial, w: number, h: number, d: number, y: number, z = 0) => {
    const mesh = new Mesh(unit, m);
    mesh.scale.set(w, h, d);
    mesh.position.set(0, y + h / 2, z);
    car.add(mesh);
  };
  const white = material({ color: 0xf4f4f2, roughness: 0.3, metalness: 0.3 });
  const glass = material({ color: 0x1a222a, roughness: 0.1, metalness: 0.5 });
  const black = material({ color: 0x111111, roughness: 0.8 });
  const blue = material({ color: 0x1c3f94, roughness: 0.4 });
  const red = material({ color: 0xc8102e, roughness: 0.4 });
  box(black, 1.84, 0.62, 3.1, 0.06);
  box(white, 1.9, 0.6, 4.9, 0.32);
  box(blue, 1.92, 0.12, 3.6, 0.55);
  box(red, 1.92, 0.05, 3.6, 0.68);
  box(glass, 1.6, 0.48, 2.3, 0.92, 0.2);
  box(white, 1.56, 0.06, 1.8, 1.4, 0.25);
  if (lights.length < 2) {
    for (const hex of [0xff2a1a, 0x2a5aff]) {
      lights.push(material({ color: hex, emissive: hex, emissiveIntensity: 0.1 }));
    }
  }
  [lights[0]!, lights[1]!].forEach((m, k) => {
    const half = new Mesh(unit, m);
    half.scale.set(0.6, 0.12, 0.25);
    half.position.set(k ? 0.32 : -0.32, 1.52, 0.25);
    car.add(half);
  });
  car.traverse((o) => (o.castShadow = true));
  return car;
}

/** The Gardiner's fascia, 2.3 m tall and 20 m along: weathered concrete, joints, streaks. */
function fasciaTexture(): CanvasTexture {
  return canvasTexture(128, 1024, (g) => {
    speckle(g, 128, 1024, '#b8b2a8', 2411);
    const random = seeded(2413);
    // Water and rust streaks running down from the scuppers along the top.
    for (let k = 0; k < 7; k++) {
      const y = random() * 1024;
      const w = 10 + random() * 30;
      const streak = g.createLinearGradient(0, 0, 128, 0);
      streak.addColorStop(0, random() < 0.4 ? 'rgba(120,72,40,0.45)' : 'rgba(60,60,58,0.4)');
      streak.addColorStop(1, 'rgba(60,60,58,0)');
      g.fillStyle = streak;
      g.fillRect(0, y, 128 - random() * 40, w);
    }
    // A darker band along the top lip, and the expansion joint between spans.
    g.fillStyle = 'rgba(70,68,64,0.4)';
    g.fillRect(0, 0, 10, 1024);
    g.fillStyle = 'rgba(30,30,30,0.85)';
    g.fillRect(0, 1018, 128, 6);
  });
}

/** The deck's underside: girders every 1.5 m in shadow, darker between. */
function soffitTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = '#5e5b56';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#7c7872';
    for (let x = 0; x < 256; x += 16) g.fillRect(x, 0, 6, 64);
  });
}

/** Packs Ontario overhead guide signs into one vertical stack atlas (`512 × 176n`). */
function guideSignAtlasTexture(signs: readonly (readonly [string, string])[]): CanvasTexture {
  const rowH = 176;
  return canvasTexture(512, rowH * signs.length, (g) => {
    signs.forEach(([top, bottom], r) => {
      const y0 = r * rowH;
      g.fillStyle = '#0f6b3c';
      g.fillRect(0, y0, 512, rowH);
      g.strokeStyle = '#ffffff';
      g.lineWidth = 6;
      g.strokeRect(8, y0 + 8, 496, 160);
      g.fillStyle = '#ffffff';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold 56px system-ui, sans-serif';
      g.fillText(top, 256, y0 + 62, 470);
      g.font = '40px system-ui, sans-serif';
      g.fillText(bottom, 256, y0 + 124, 470);
    });
  });
}

/** Returns a PlaneGeometry whose UVs sample tile `(col, row)` of a `(cols × rows)` atlas. */
function slicePlaneUv(
  width: number,
  height: number,
  col: number,
  cols: number,
  row: number,
  rows: number,
  texW: number,
  texH: number,
  wSegs = 1,
  hSegs = 1,
): PlaneGeometry {
  const g = new PlaneGeometry(width, height, wSegs, hSegs);
  const uv = g.getAttribute('uv') as BufferAttribute;
  const du = 0.5 / texW;
  const dv = 0.5 / texH;
  const u0 = col / cols + du;
  const u1 = (col + 1) / cols - du;
  const v0 = 1 - (row + 1) / rows + dv;
  const v1 = 1 - row / rows - dv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  }
  return g;
}

/** Stacks cloth banners into one vertical texture atlas (`700 × 130n`). */
function clothBannerStackTexture(
  entries: readonly (readonly [string, string, string])[],
): CanvasTexture {
  const rowH = 130;
  return canvasTexture(700, rowH * entries.length, (ctx) => {
    entries.forEach(([text, fill, ink], r) => {
      const y0 = r * rowH;
      ctx.fillStyle = fill;
      ctx.fillRect(0, y0, 700, rowH);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5;
      ctx.strokeRect(10, y0 + 10, 680, 110);
      ctx.fillStyle = ink;
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 350, y0 + 68, 640);
      const folds = ctx.createLinearGradient(0, y0, 700, y0);
      for (let i = 0; i <= 6; i++) {
        folds.addColorStop(i / 6, i % 2 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)');
      }
      ctx.fillStyle = folds;
      ctx.fillRect(0, y0, 700, rowH);
    });
  });
}

/** Packs section flags into a `(cols × rows)` grid atlas (`384c × 256r`). */
function sectionFlagAtlasTexture(
  entries: readonly (readonly [string, string])[],
  cols: number,
  rows: number,
): CanvasTexture {
  const cellW = 384;
  const cellH = 256;
  return canvasTexture(cellW * cols, cellH * rows, (g) => {
    entries.forEach(([name, colour], idx) => {
      const x0 = (idx % cols) * cellW;
      const y0 = Math.floor(idx / cols) * cellH;
      g.fillStyle = colour;
      g.fillRect(x0, y0, cellW, cellH);
      g.strokeStyle = '#ffd23f';
      g.lineWidth = 12;
      g.strokeRect(x0 + 6, y0 + 6, cellW - 12, cellH - 12);
      g.fillStyle = '#ffd23f';
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 22 : 50;
        const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
        if (k === 0) g.moveTo(x0 + 192 + Math.cos(a) * r, y0 + 92 + Math.sin(a) * r);
        else g.lineTo(x0 + 192 + Math.cos(a) * r, y0 + 92 + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
      g.fillStyle = '#ffffff';
      g.font = 'bold 54px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(name, x0 + 192, y0 + 196, 340);
    });
  });
}

/** The stadium's wall: arched bays between white piers, in three tiers. */
function stadiumTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    g.fillStyle = '#e6e3dc';
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#5a6670';
    for (let x = 8; x < 256; x += 32) {
      for (const [y, h] of [
        [16, 26],
        [56, 22],
        [92, 26],
      ] as const) {
        g.beginPath();
        g.moveTo(x, y + h);
        g.lineTo(x, y + 8);
        g.arc(x + 8, y + 8, 8, Math.PI, 0);
        g.lineTo(x + 16, y + h);
        g.fill();
      }
    }
  });
}

/** The roof's panels: radial seams and the steps where the moving panels overlap. */
function roofTexture(): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    g.fillStyle = '#ecebe6';
    g.fillRect(0, 0, 512, 64);
    g.fillStyle = 'rgba(90,96,104,0.5)';
    for (let x = 0; x < 512; x += 16) g.fillRect(x, 0, 1, 64);
    g.fillStyle = 'rgba(60,66,72,0.8)';
    for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 4, 64);
  });
}

/** One bay of an arcade: a round-headed arch in shade between cream piers, under a cornice. */
function arcadeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#ece3cd';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#d8ccb0';
    g.fillRect(0, 0, 128, 12);
    g.fillRect(0, 118, 128, 10);
    g.fillStyle = '#211c17';
    g.beginPath();
    g.moveTo(26, 118);
    g.lineTo(26, 56);
    g.arc(64, 56, 38, Math.PI, 0);
    g.lineTo(102, 118);
    g.fill();
    g.strokeStyle = '#cbbd9e';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(64, 56, 41, Math.PI, 0);
    g.stroke();
  });
}

/** Packs vertical festival street banners and hanging island flags into one `200(n + 4) × 600` atlas. */
function lampBannerAtlasTexture(entries: readonly (readonly [string, string])[]): CanvasTexture {
  const colW = 200;
  const totalCols = entries.length + FLAG_KINDS.length;
  return canvasTexture(colW * totalCols, 600, (g) => {
    const colours = ['#ff2d87', '#ffd23f', '#13c3c9', '#ff8a00', '#7b2ff7', '#0f9d58', '#ffffff'];
    entries.forEach(([fill, ink], col) => {
      const x0 = col * colW;
      g.fillStyle = fill;
      g.fillRect(x0, 0, colW, 600);
      for (let k = 0; k < 13; k++) {
        const a = -Math.PI * 0.85 + (k / 12) * Math.PI * 0.7;
        g.strokeStyle = colours[k % colours.length]!;
        g.lineWidth = 12;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(x0 + 100, 430);
        g.lineTo(x0 + 100 + Math.cos(a) * 92, 430 + Math.sin(a) * 92);
        g.stroke();
      }
      g.fillStyle = ink;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold 38px system-ui, sans-serif';
      g.fillText('TORONTO', x0 + 100, 52, 186);
      g.font = 'bold 32px system-ui, sans-serif';
      g.fillText('CARIBBEAN', x0 + 100, 100, 186);
      g.font = 'bold 34px system-ui, sans-serif';
      g.fillText('CARNIVAL', x0 + 100, 146, 186);
      g.font = 'bold 46px system-ui, sans-serif';
      g.fillText('2026', x0 + 100, 530, 186);
    });
    FLAG_KINDS.forEach((kind, idx) => {
      const x0 = (entries.length + idx) * colW;
      g.save();
      g.beginPath();
      g.rect(x0, 0, colW, 600);
      g.clip();
      g.translate(x0 + colW, 0);
      g.scale(1, 2);
      g.rotate(Math.PI / 2);
      drawFlagKind(g, kind, 300, 200);
      g.restore();
    });
  });
}

/**
 * The broadcast on the big screen: a Queen of the band close up, her plumes fanned against a
 * stage-lit backdrop, the carnival's name in a lower third and a red LIVE bug, under the LED
 * panel grid.
 */
function broadcastTexture(): CanvasTexture {
  return canvasTexture(700, 400, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 400);
    sky.addColorStop(0, '#1b3f8a');
    sky.addColorStop(1, '#ff7ab8');
    g.fillStyle = sky;
    g.fillRect(0, 0, 700, 400);
    // The plumes fanned out behind her.
    const colours = ['#ffd23f', '#ff2d87', '#13c3c9', '#ffffff', '#ff8a00'];
    for (let k = 0; k < 29; k++) {
      const a = -Math.PI * 0.95 + (k / 28) * Math.PI * 0.9;
      g.strokeStyle = colours[k % colours.length]!;
      g.lineWidth = 22;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(350, 330);
      g.lineTo(350 + Math.cos(a) * 300, 330 + Math.sin(a) * 300);
      g.stroke();
    }
    // Her face and shoulders, a jewelled crown and collar.
    g.fillStyle = '#8d5a3b';
    g.beginPath();
    g.ellipse(350, 220, 50, 64, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(270, 280, 160, 120);
    g.fillStyle = '#ffd23f';
    g.beginPath();
    g.moveTo(300, 165);
    g.lineTo(350, 110);
    g.lineTo(400, 165);
    g.closePath();
    g.fill();
    g.fillRect(270, 300, 160, 22);
    g.fillStyle = '#1b1310';
    g.fillRect(325, 210, 14, 6);
    g.fillRect(361, 210, 14, 6);
    g.fillStyle = '#9e2a3a';
    g.fillRect(338, 248, 24, 6);
    // The lower third and the LIVE bug.
    g.fillStyle = 'rgba(10,10,14,0.78)';
    g.fillRect(0, 330, 700, 70);
    g.fillStyle = '#ffffff';
    g.font = 'bold 34px system-ui, sans-serif';
    g.textBaseline = 'middle';
    g.fillText('TORONTO CARIBBEAN CARNIVAL · GRAND PARADE', 24, 365, 650);
    g.fillStyle = '#e8133c';
    g.fillRect(24, 22, 92, 40);
    g.fillStyle = '#ffffff';
    g.font = 'bold 28px system-ui, sans-serif';
    g.fillText('LIVE', 38, 43);
    // The LED panels' grid.
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.lineWidth = 2;
    for (let x = 0; x <= 700; x += 50) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 400);
      g.stroke();
    }
    for (let y = 0; y <= 400; y += 50) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(700, y);
      g.stroke();
    }
  });
}

/** A 1960s apartment slab's front: a bay of windows over a balcony slab with its railing. */
function slabTexture(): CanvasTexture {
  return canvasTexture(64, 32, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#3a4048';
    g.fillRect(6, 6, 22, 14);
    g.fillRect(36, 6, 22, 14);
    g.fillStyle = '#d8d8d8';
    g.fillRect(0, 22, 64, 4);
    g.fillStyle = 'rgba(40,44,50,0.6)';
    for (let x = 2; x < 64; x += 4) g.fillRect(x, 26, 1, 6);
  });
}

/**
 * A confetti drift along a gutter, 1.1 m across (u) and 6 m along (v): flakes in the bands'
 * colours packed thick at the kerb (u = 0) and thinning to scattered flakes at the edge,
 * cut out of the canvas.
 */
function driftTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    g.clearRect(0, 0, 128, 512);
    const colours = ['#ff2d87', '#ffd23f', '#13c3c9', '#ff8a00', '#7b2ff7', '#ffffff', '#4de0a8'];
    const paths = colours.map(() => new Path2D());
    const random = seeded(3601);
    for (let i = 0; i < 9000; i++) {
      // Most flakes near the kerb: the square of a random number crowds them to u = 0.
      const u = Math.pow(random(), 2.2) * 128;
      const v = random() * 512;
      const ci = Math.floor(random() * colours.length);
      const a = random() * Math.PI;
      const hw = 1.5 + random() * 1.5;
      const hh = 1.5;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const p = paths[ci]!;
      p.moveTo(u - hw * ca + hh * sa, v - hw * sa - hh * ca);
      p.lineTo(u + hw * ca + hh * sa, v + hw * sa - hh * ca);
      p.lineTo(u + hw * ca - hh * sa, v + hw * sa + hh * ca);
      p.lineTo(u - hw * ca - hh * sa, v - hw * sa + hh * ca);
      p.closePath();
    }
    for (let c = 0; c < colours.length; c++) {
      g.fillStyle = colours[c]!;
      g.fill(paths[c]!);
    }
  });
}

/** Packs both street-cart umbrella panel schemes into one `256 × 64` atlas (row 0 red/yellow, row 1 blue/white). */
function cartUmbrellaAtlasTexture(): CanvasTexture {
  const schemes: readonly [string, string][] = [
    ['#c8102e', '#ffd23f'],
    ['#1b6ad8', '#ffffff'],
  ];
  return canvasTexture(256, 64, (g) => {
    schemes.forEach(([a, b], r) => {
      const y0 = r * 32;
      for (let k = 0; k < 8; k++) {
        g.fillStyle = k % 2 ? b : a;
        g.fillRect(k * 32, y0, 32, 32);
      }
    });
  });
}

/** Packs the ice-cream cart front (row 0) and hot-dog cart front (row 1) into one `256 × 320` atlas. */
function cartFrontAtlasTexture(): CanvasTexture {
  return canvasTexture(256, 320, (g) => {
    // Row 0: ice cream cart front
    g.fillStyle = '#f4f4f0';
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#1b6ad8';
    g.font = 'bold 34px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('ICE CREAM', 128, 40, 240);
    ['#ff7ab8', '#fff6e0', '#7a4b33'].forEach((scoop, k) => {
      const x = 58 + k * 70;
      g.fillStyle = '#d9a35a';
      g.beginPath();
      g.moveTo(x - 18, 95);
      g.lineTo(x + 18, 95);
      g.lineTo(x, 150);
      g.closePath();
      g.fill();
      g.fillStyle = scoop;
      g.beginPath();
      g.arc(x, 88, 22, 0, Math.PI * 2);
      g.fill();
    });
    // Row 1: hot dog cart front
    const y0 = 160;
    g.fillStyle = '#c8ccd0';
    g.fillRect(0, y0, 256, 160);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    for (let x = 0; x < 256; x += 3) g.fillRect(x, y0, 1, 160);
    g.fillStyle = '#c8102e';
    g.fillRect(16, y0 + 40, 224, 72);
    g.fillStyle = '#ffd23f';
    g.font = 'bold 30px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('HOT DOGS', 128, y0 + 72, 210);
    g.font = 'bold 20px system-ui, sans-serif';
    g.fillText('SAUSAGES · DRINKS', 128, y0 + 100, 210);
  });
}

/** Clay roof tiles: courses of curved red pantiles, each its own shade, shadowed below. */
function tileTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    const random = seeded(4211);
    for (let y = 0; y < 64; y += 8) {
      for (let x = (y / 8) % 2 ? -8 : 0; x < 128; x += 16) {
        g.fillStyle = `hsl(${12 + random() * 8},${45 + random() * 15}%,${36 + random() * 10}%)`;
        g.fillRect(x, y, 16, 8);
        g.fillStyle = 'rgba(255,255,255,0.12)';
        g.fillRect(x + 4, y, 6, 8);
      }
      g.fillStyle = 'rgba(40,20,14,0.5)';
      g.fillRect(0, y + 7, 128, 1);
    }
  });
}

/** A wall of speaker cabinets: black boxes with round cones. */
function speakerTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#141416';
    g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const x = 64 + col * 128;
        const y = 44 + row * 84;
        g.strokeStyle = '#2b2c30';
        g.lineWidth = 4;
        g.strokeRect(x - 60, y - 40, 120, 80);
        const grad = g.createRadialGradient(x, y, 4, x, y, 34);
        grad.addColorStop(0, '#5a5c62');
        grad.addColorStop(0.3, '#232428');
        grad.addColorStop(1, '#0b0b0c');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, 34, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

/** Packs music-truck and steelpan-float banners into one vertical stack atlas (`1024 × 128n`). */
function truckBannerAtlasTexture(entries: readonly (readonly [string, string])[]): CanvasTexture {
  const rowH = 128;
  return canvasTexture(1024, rowH * entries.length, (g) => {
    entries.forEach(([name, colour], r) => {
      const y0 = r * rowH;
      g.fillStyle = colour;
      g.fillRect(0, y0, 1024, rowH);
      g.fillStyle = '#111111';
      g.fillRect(0, y0, 1024, 10);
      g.fillRect(0, y0 + 118, 1024, 10);
      g.fillStyle = '#ffffff';
      g.font = 'bold 76px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(name, 512, y0 + 68, 980);
    });
  });
}

/** Condo glazing: tinted glass floor to ceiling, a white balcony slab at every storey. */
function condoTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#5d7b86';
    g.fillRect(0, 0, 64, 128);
    const random = seeded(311);
    for (let y = 0; y < 128; y += 4) {
      for (let x = 0; x < 64; x += 8) {
        g.fillStyle = `hsl(195,18%,${36 + random() * 22}%)`;
        g.fillRect(x, y, 8, 3);
      }
      g.fillStyle = 'rgba(238,240,238,0.9)';
      g.fillRect(0, y + 3, 64, 1);
    }
  });
}

/** Office glazing in `frame` and `pane`: a curtain wall of mullions and spandrels. */
function officeTexture(frame: string, pane: string): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = frame;
    g.fillRect(0, 0, 64, 128);
    const random = seeded(313);
    for (let y = 0; y < 128; y += 4) {
      for (let x = 0; x < 64; x += 4) {
        g.globalAlpha = 0.6 + random() * 0.4;
        g.fillStyle = pane;
        g.fillRect(x + 1, y + 1, 3, 2);
      }
    }
    g.globalAlpha = 1;
  });
}

/** Stone or marble cladding with narrow vertical windows between the piers. */
function pinstripeTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(40,48,58,0.55)';
    for (let x = 2; x < 64; x += 5) g.fillRect(x, 0, 2, 128);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (let y = 0; y < 128; y += 4) g.fillRect(0, y, 64, 1);
  });
}
