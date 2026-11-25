// Knicks Championship Parade's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// lower Broadway's Canyon of Heroes on parade morning. Limestone, granite and brick towers rise
// in setbacks on both sides above barricades packed with orange-and-blue fans, ticker tape and
// streamers drift down between them, parade floats roll up the outer lanes, and the Woolworth
// Building's copper crown closes the canyon ahead.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, figures, barriers,
// banners and road paint of world-kit.ts.
import {
  BatchedMesh,
  BoxGeometry,
  type BufferAttribute,
  BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  type DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  barrierBannerTexture,
  type BannerPanel,
  bob,
  canvasTexture,
  Crowd,
  Figures,
  hazedMaterial,
  loopFade,
  loopMetres,
  mergeStaticGroup,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  slopeAt,
  speckle,
  tintGeometry,
  wrapFade,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 30;
const BLOCK_COUNT = 10;
const BLOCK_LEN = LOOP / BLOCK_COUNT;
const BLOCK_BEHIND = 64;
const KERB = 0.15;
/** Broadway is wide: the race lane in the middle and an outer lane each side for the floats. */
const LANE = 8;
/** The barricades stand on the kerb; the crowd packs the pavement behind them. */
const BARRIER = 8.6;
const CROWD_NEAR = 9.1;
const CROWD_FAR = 11.4;
/** The towers' fronts stand this far from the road's centre. */
const FRONTAGE = 12.5;
const STOREY = 3.6;
/** Parade floats roll up the outer lanes at walking pace, FLOATS to a loop, CREW aboard each. */
const FLOATS = 6;
const FLOAT_X = 5.8;
const FLOAT_SPEED = 2.2;
const DECK = 1.6;
const CREW = 5;
/** Ticker tape and streamers fill the canyon for TAPE_SPAN metres ahead, falling from TAPE_TOP. */
const TAPE = 640;
const STREAMERS = 120;
const TAPE_SPAN = 125;
const TAPE_TOP = 44;
const SPIN_PRESETS = 16;
/** The Woolworth Building closes the canyon ahead, hazed by hand. */
const WOOLWORTH_AHEAD = 600;
const HAZE = 0xbfcbd6;
const ORANGE = '#f58426';
const BLUE = '#1d4f9c';

/** The towers' stone, its trim, and whether it is a later glass front. */
const PALETTES: readonly { wall: string; trim: string; glass: boolean }[] = [
  { wall: '#d9d0bf', trim: '#eee8db', glass: false },
  { wall: '#a6a39c', trim: '#c8c4ba', glass: false },
  { wall: '#84523c', trim: '#dcd1bc', glass: false },
  { wall: '#c9a87d', trim: '#efe4cf', glass: false },
  { wall: '#ebe5d7', trim: '#ffffff', glass: false },
  { wall: '#3f5467', trim: '#8a96a3', glass: true },
  { wall: '#5b5f66', trim: '#7d828a', glass: false },
];
const FACADE_COL_INNER = 384;
const FACADE_GUTTER = 8;
const FACADE_COL_STRIDE = FACADE_COL_INNER + FACADE_GUTTER * 2;
const FACADE_TEX_W = FACADE_COL_STRIDE * PALETTES.length;
const FACADE_TEX_H = 256;
const FACADE_MAX_METRES = 36;

const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: BLUE, ink: ORANGE, text: 'KNICKS CHAMPIONS' },
  { fill: ORANGE, ink: '#ffffff', text: 'CANYON OF HEROES' },
  { fill: '#ffffff', ink: BLUE, text: 'NEW YORK' },
  { fill: BLUE, ink: '#ffffff', text: 'FLOAT SPRINT' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: ORANGE, ink: BLUE, text: 'GO NY GO' },
];
const STREET_BANNERS: readonly (readonly [string, string, string])[] = [
  ['KNICKS CHAMPIONS', ORANGE, '#ffffff'],
  ['CANYON OF HEROES', BLUE, '#ffffff'],
  ['NEW YORK LOVES ITS CHAMPS', '#ffffff', BLUE],
  ['THE PARADE', ORANGE, BLUE],
];
/** The words the towers hang down their fronts. */
const DRAPES: readonly (readonly [string, string, string])[] = [
  ['KNICKS', ORANGE, '#ffffff'],
  ['CHAMPS', BLUE, ORANGE],
  ['NY', '#ffffff', BLUE],
];
const CLOTH_BANNER_W = 700;
const CLOTH_DRAPE_COL_W = 128;
const CLOTH_ATLAS_W = CLOTH_BANNER_W + CLOTH_DRAPE_COL_W * DRAPES.length;
const CLOTH_ROW_H = 130;
const CLOTH_ROWS = STREET_BANNERS.length + 3;
const CLOTH_ATLAS_H = CLOTH_ROW_H * CLOTH_ROWS;

/** What the fans paint on the tarmac, its colour and how far off the centre line. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['CHAMPS', '#ff8a2a', -2.0],
  ['GO NY', '#ffffff', 2.0],
  ['KNICKS', '#5b9bff', -2.0],
  ['DEFENSE', '#ffffff', 2.0],
  ['NY NY', '#ff8a2a', -2.0],
  ['PARADE', '#5b9bff', 2.0],
  ['WATTZUP', '#d7ff3a', -2.0],
  ['BROADWAY', '#ffffff', 2.0],
];
/** Flat paint reads only in the first 25 m or so ahead, so some must always be that close. */
const ROAD_PAINT_EVERY = 25;
const SKINS = ['#f1c7a5', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26', '#e2b48c'];
const TOPS = [
  ORANGE,
  BLUE,
  ORANGE,
  BLUE,
  '#ffffff',
  '#2a62c4',
  '#ff9a3c',
  '#111111',
  '#c4ced8',
  ORANGE,
];
const BOTTOMS = ['#1e2530', '#2f3e5c', '#3b5a7a', '#111111', '#8a8f99', '#d9c3a0'];

interface Piece {
  readonly x: number;
  readonly offset: number;
  readonly phase: number;
  readonly sinP20: number;
  readonly cosP20: number;
  readonly fall: number;
  readonly spinPreset: number;
}

interface BlockBatchSlot {
  readonly farBatch: BatchedMesh;
  readonly farArr: Float32Array;
  readonly farId: number;
  readonly nearBatch: BatchedMesh | null;
  readonly nearArr: Float32Array | null;
  readonly nearId: number;
  state: number;
}

const PROP_BEHIND_CULL = -22;
const PROP_HORIZON_CULL = 318;
const BLOCK_BEHIND_CULL = -52;
const SHADOW_NEAR = -20;
const SHADOW_FAR = 36;
const BLOCK_SHADOW_NEAR = -34;
const BLOCK_SHADOW_FAR = 42;
const FLOAT_CREW_SPOTS: readonly (readonly [number, number])[] = [
  [-0.75, -5],
  [0.75, -3.9],
  [0, 4.2],
  [-0.75, 5.2],
  [0.75, 5.2],
];

function ensureIndexed(geometry: BufferGeometry): BufferGeometry {
  if (!geometry.getIndex()) {
    const count = geometry.getAttribute('position').count;
    if (count <= 65535) {
      const idx = new Uint16Array(count);
      for (let i = 0; i < count; i++) idx[i] = i;
      geometry.setIndex(new Uint16BufferAttribute(idx, 1));
    } else {
      const idx = new Uint32Array(count);
      for (let i = 0; i < count; i++) idx[i] = i;
      geometry.setIndex(new Uint32BufferAttribute(idx, 1));
    }
  }
  return geometry;
}

function batchMatrices(batch: BatchedMesh): { tex: DataTexture; data: Float32Array } {
  const tex = (batch as unknown as { _matricesTexture: DataTexture })._matricesTexture;
  return { tex, data: tex.image.data as unknown as Float32Array };
}

function createBatch(
  geometries: readonly BufferGeometry[],
  maxInstances: number,
  material: Material,
  group: Group,
  disposables: { dispose(): void }[],
  castShadow: boolean,
  withWarmupSentinel = false,
): { batch: BatchedMesh; geoIds: number[]; tex: DataTexture; data: Float32Array } {
  let maxVerts = 0;
  let maxIndices = 0;
  let minIdx = 0;
  let minVerts = Infinity;
  geometries.forEach((g, idx) => {
    ensureIndexed(g);
    const vc = g.getAttribute('position').count;
    maxVerts += vc;
    maxIndices += g.getIndex()!.count;
    if (vc < minVerts) {
      minVerts = vc;
      minIdx = idx;
    }
  });
  const extra = withWarmupSentinel ? 1 : 0;
  const batch = new BatchedMesh(
    Math.max(1, maxInstances + extra),
    Math.max(3, maxVerts),
    Math.max(3, maxIndices),
    material,
  );
  batch.sortObjects = false;
  batch.perObjectFrustumCulled = false;
  batch.frustumCulled = false;
  batch.castShadow = castShadow;
  batch.receiveShadow = true;
  const geoIds = geometries.map((g) => batch.addGeometry(g));
  const mt = batchMatrices(batch);
  if (withWarmupSentinel && geoIds.length > 0) {
    const sentinel = batch.addInstance(geoIds[minIdx]!);
    const o = sentinel * 16;
    mt.data.fill(0, o, o + 15);
    mt.data[o + 13] = -1000;
    mt.data[o + 15] = 1;
    mt.tex.needsUpdate = true;
  }
  group.add(batch);
  disposables.push(batch);
  return { batch, geoIds, tex: mt.tex, data: mt.data };
}

function collectShadowMeshes(root: Group): Mesh[] {
  const list: Mesh[] = [];
  root.traverse((obj) => {
    if (obj instanceof Mesh && obj.castShadow) list.push(obj);
  });
  return list;
}

export class KnicksStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly canyonBlocks: { center: number; slots: BlockBatchSlot[] }[] = [];
  private readonly blockTextures: DataTexture[] = [];
  private roadPaintBatch: BatchedMesh | null = null;
  private roadPaintData: Float32Array | null = null;
  private roadPaintTex: DataTexture | null = null;
  private readonly roadPaintItems: {
    id: number;
    offset: number;
    x: number;
    vis: number;
  }[] = [];
  private readonly floats: { group: Group; shadowMeshes: Mesh[]; lastCast?: boolean }[] = [];
  /** The players riding the floats, built on the kit's figures. */
  private crew: Figures | null = null;
  private readonly woolworth = new Group();
  private readonly skyline = new Group();
  private tape: InstancedMesh | null = null;
  private streamers: InstancedMesh | null = null;
  private readonly pieces: Piece[] = [];
  private readonly spinRates = new Float32Array(SPIN_PRESETS * 6);
  private readonly spinTrig = new Float32Array(SPIN_PRESETS * 6);
  private lampBodies: InstancedMesh | null = null;
  private lampHeads: InstancedMesh | null = null;
  private readonly lampItems: { side: -1 | 1; offset: number; x: number }[] = [];
  private buntingMesh: InstancedMesh | null = null;
  private readonly buntingOffsets: number[] = [];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly solidMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
  private readonly hazedSolidMat = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    fog: false,
  });
  private readonly doubleSideVertexMat = new MeshStandardMaterial({
    vertexColors: true,
    side: DoubleSide,
    roughness: 0.8,
  });
  private clothAtlasMat: MeshStandardMaterial | null = null;
  private readonly flagMaterials = [ORANGE, BLUE, '#ffffff'].map(
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
      spacing: 0.55,
      wardrobe: { tops: TOPS, bottoms: BOTTOMS, skins: SKINS },
      flags: this.flagMaterials,
      flagShare: 0.26,
      seeds: [101, 107],
      figureMaterial: this.solidMat,
      sharedSolidFlagMaterial: this.doubleSideVertexMat,
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(
      this.unit,
      this.solidMat,
      this.hazedSolidMat,
      this.doubleSideVertexMat,
      ...this.flagMaterials,
    );
    this.clothAtlasMat = this.material({
      map: this.track(
        canyonClothAtlasTexture([
          ...STREET_BANNERS,
          ['NEW YORK CHAMPIONS', ORANGE, '#ffffff'],
          ['KNICKS', BLUE, ORANGE],
          ['KNICKS CHAMPIONS', BLUE, ORANGE],
        ]),
      ),
      side: DoubleSide,
      roughness: 0.78,
    });
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addCanyonBlocks();
    this.addLamps();
    this.addBunting();
    this.addRoadPaint();
    this.addFloats();
    this.addTickerTape();
    this.addSkyline();
    this.addWoolworth();
  }

  /** The first float and a visible piece of paper in the submitted instance buffer. */
  paradePose(
    metres: number,
    into: { paradeFloatStation: number | null; tickerHeight: number | null },
  ) {
    const float = this.floats[0]?.group;
    into.paradeFloatStation = float?.visible ? metres - float.position.z : null;
    into.tickerHeight = null;
    if (!this.tape) return;
    const values = this.tape.instanceMatrix.array;
    for (let i = 0; i < this.tape.count; i++) {
      const j = i * 16;
      if (
        values[j + 14]! < -4 &&
        values[j + 14]! > -68 &&
        values[j + 13]! < 10 &&
        values[j + 13]! > 0.35
      ) {
        into.tickerHeight = values[j + 13]!;
        return;
      }
    }
  }
  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  /** Lays the outer lanes, kerbs, pavements and barricades over the road's points. */
  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** Moves the street with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(
    s: number,
    heightAt: (metres: number) => number,
    crownAhead?: number,
    courtyard?: (station: number) => boolean,
  ): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    for (const block of this.canyonBlocks) {
      const metres = loopMetres(block.center, s, LOOP, BLOCK_BEHIND);
      const visible =
        metres > BLOCK_BEHIND_CULL && metres <= PROP_HORIZON_CULL && !courtyard?.(s + metres);
      const cast = visible && metres > BLOCK_SHADOW_NEAR && metres < BLOCK_SHADOW_FAR;
      const clamped = metres > 0 ? metres : 0;
      const ty = visible ? heightAt(clamped) : 0;
      const grade = visible
        ? (heightAt(clamped + 2) - heightAt(Math.max(0, clamped - 2))) * 0.25
        : 0;
      const tz = -metres;
      for (const slot of block.slots) {
        const useNear = cast && slot.nearBatch !== null;
        const nextState = !visible ? 0 : useNear ? 2 : 1;
        if (slot.state !== nextState) {
          slot.state = nextState;
          slot.farBatch.setVisibleAt(slot.farId, nextState === 1);
          if (slot.nearBatch) slot.nearBatch.setVisibleAt(slot.nearId, nextState === 2);
        }
        if (visible) {
          const dst = useNear ? slot.nearArr! : slot.farArr;
          const o = (useNear ? slot.nearId : slot.farId) * 16;
          dst[o] = 1;
          dst[o + 1] = 0;
          dst[o + 2] = 0;
          dst[o + 3] = 0;
          dst[o + 4] = 0;
          dst[o + 5] = 1;
          dst[o + 6] = 0;
          dst[o + 7] = 0;
          dst[o + 8] = 0;
          dst[o + 9] = -grade;
          dst[o + 10] = 1;
          dst[o + 11] = 0;
          dst[o + 12] = 0;
          dst[o + 13] = ty;
          dst[o + 14] = tz;
          dst[o + 15] = 1;
        }
      }
    }
    for (const tex of this.blockTextures) tex.needsUpdate = true;
    this.placeRoadPaint(heightAt, along);
    this.crowd.place(this.time, heightAt, along, KERB);
    this.placeLampsAndBunting(heightAt, along);
    const far = heightAt(1e6);
    this.woolworth.position.set(
      0,
      (crownAhead === undefined ? far : heightAt(crownAhead)) - 4,
      -(crownAhead ?? WOOLWORTH_AHEAD),
    );
    this.skyline.position.set(0, far - 4, 0);
    this.placeFloats(along, heightAt);
    this.placeTape(s, heightAt);
  }

  private placeRoadPaint(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    const batch = this.roadPaintBatch;
    const arr = this.roadPaintData;
    const tex = this.roadPaintTex;
    if (!batch || !arr || !tex) return;
    for (const it of this.roadPaintItems) {
      const metres = along(it.offset, LOOP);
      const visible = metres > PROP_BEHIND_CULL && metres <= 140;
      const nv = visible ? 1 : 0;
      if (it.vis !== nv) {
        it.vis = nv;
        batch.setVisibleAt(it.id, visible);
      }
      if (!visible) continue;
      const slope = slopeAt(heightAt, metres);
      const cs = 1 - 0.5 * slope * slope;
      const ss = slope;
      const y = heightAt(metres > 0 ? metres : 0);
      const o = it.id * 16;
      arr[o] = 1;
      arr[o + 1] = 0;
      arr[o + 2] = 0;
      arr[o + 3] = 0;
      arr[o + 4] = 0;
      arr[o + 5] = cs;
      arr[o + 6] = ss;
      arr[o + 7] = 0;
      arr[o + 8] = 0;
      arr[o + 9] = -ss;
      arr[o + 10] = cs;
      arr[o + 11] = 0;
      arr[o + 12] = it.x;
      arr[o + 13] = y;
      arr[o + 14] = -metres;
      arr[o + 15] = 1;
    }
    tex.needsUpdate = true;
  }

  private placeLampsAndBunting(
    heightAt: (metres: number) => number,
    along: (offset: number, every: number) => number,
  ): void {
    if (this.lampBodies && this.lampHeads) {
      const bArr = this.lampBodies.instanceMatrix.array as Float32Array;
      const hArr = this.lampHeads.instanceMatrix.array as Float32Array;
      let count = 0;
      for (const it of this.lampItems) {
        const metres = along(it.offset, LOOP);
        if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) continue;
        const y = heightAt(Math.max(metres, 0));
        const sgn = it.side < 0 ? -1 : 1;
        const o = count * 16;
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
        for (let k = 0; k < 16; k++) hArr[o + k] = bArr[o + k]!;
        count++;
      }
      this.lampBodies.count = count;
      this.lampHeads.count = count;
      this.lampBodies.instanceMatrix.needsUpdate = true;
      this.lampHeads.instanceMatrix.needsUpdate = true;
    }
    if (this.buntingMesh) {
      const arr = this.buntingMesh.instanceMatrix.array as Float32Array;
      let count = 0;
      for (const offset of this.buntingOffsets) {
        const metres = along(offset, LOOP);
        if (metres <= PROP_BEHIND_CULL || metres > PROP_HORIZON_CULL) continue;
        const y = heightAt(Math.max(metres, 0));
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
      this.buntingMesh.count = count;
      this.buntingMesh.instanceMatrix.needsUpdate = true;
    }
  }

  /** The floats roll forward slowly, so the riders reel them in one after another. */
  private placeFloats(
    along: (offset: number, every: number) => number,
    heightAt: (metres: number) => number,
  ): void {
    const crew = this.crew;
    let crewSlot = 0;
    for (let i = 0; i < this.floats.length; i++) {
      const entry = this.floats[i]!;
      const float = entry.group;
      const metres = along(40 + i * (LOOP / FLOATS) + this.time * FLOAT_SPEED, LOOP);
      const y = heightAt(Math.max(metres, 0));
      const x = i % 2 ? FLOAT_X : -FLOAT_X;
      float.position.set(x, y, -metres);
      const visible = metres > PROP_BEHIND_CULL && metres <= PROP_HORIZON_CULL;
      float.visible = visible;
      if (!visible) continue;
      const cast = metres > SHADOW_NEAR && metres < SHADOW_FAR;
      if (entry.lastCast !== cast) {
        entry.lastCast = cast;
        for (const sm of entry.shadowMeshes) {
          sm.castShadow = cast;
        }
      }
      // A float dwindles away at the far end of the loop and grows back there (#900).
      const shown = loopFade(metres, LOOP, BEHIND);
      float.scale.setScalar(shown);
      if (!crew) continue;
      const scale = 1.05 * shown;
      for (let k = 0; k < FLOAT_CREW_SPOTS.length; k++) {
        const [dx, dz] = FLOAT_CREW_SPOTS[k]!;
        const sgn = dx === 0 ? (x > 0 ? -1 : 1) : dx > 0 ? -1 : 1;
        const jump = bob(this.time * 4 + i * 1.3 + k) * 0.22;
        crew.setYawScaled(
          crewSlot++,
          x + dx * shown,
          y + DECK * shown,
          -metres + dz * shown,
          0,
          sgn * scale,
          scale,
          jump * shown,
        );
      }
    }
    if (crew) {
      crew.setCount(crewSlot);
      crew.commit();
    }
  }

  /** Each piece of tape falls, flutters and tumbles; the cloud travels with the street. */
  private placeTape(s: number, heightAt: (metres: number) => number): void {
    const tape = this.tape;
    const streamers = this.streamers;
    if (!tape || !streamers) return;
    const tapeArr = tape.instanceMatrix.array as Float32Array;
    const streamerArr = streamers.instanceMatrix.array as Float32Array;
    const t = this.time;
    const s09 = Math.sin(t * 0.9);
    const c09 = Math.cos(t * 0.9);
    const rates = this.spinRates;
    const trig = this.spinTrig;
    for (let p = 0; p < SPIN_PRESETS; p++) {
      const r6 = p * 6;
      const rx = t * rates[r6]! + rates[r6 + 3]!;
      const ry = t * rates[r6 + 1]! + rates[r6 + 4]!;
      const rz = t * rates[r6 + 2]!;
      trig[r6] = Math.cos(rx);
      trig[r6 + 1] = Math.sin(rx);
      trig[r6 + 2] = Math.cos(ry);
      trig[r6 + 3] = Math.sin(ry);
      trig[r6 + 4] = Math.cos(rz);
      trig[r6 + 5] = Math.sin(rz);
    }
    for (let i = 0; i < this.pieces.length; i++) {
      const p = this.pieces[i]!;
      const metres = loopMetres(p.offset, s, TAPE_SPAN, 12);
      const ground = heightAt(metres > 0 ? metres : 0);
      const drop = (p.phase * TAPE_TOP + t * p.fall) % TAPE_TOP;
      const sc = wrapFade(drop, 0, TAPE_TOP, 1.5) * loopFade(metres, TAPE_SPAN, 12);
      const px = p.x + (s09 * p.cosP20 + c09 * p.sinP20) * 0.6;
      const py = ground + TAPE_TOP - drop;
      const pz = -metres;
      const r6 = p.spinPreset * 6;
      const cx = trig[r6]!;
      const sx = trig[r6 + 1]!;
      const cy = trig[r6 + 2]!;
      const sy = trig[r6 + 3]!;
      const cz = trig[r6 + 4]!;
      const sz = trig[r6 + 5]!;
      const arr = i < TAPE ? tapeArr : streamerArr;
      const o = (i < TAPE ? i : i - TAPE) * 16;
      const ae = cx * cz;
      const af = cx * sz;
      const be = sx * cz;
      const bf = sx * sz;
      arr[o] = cy * cz * sc;
      arr[o + 1] = (be * sy + af) * sc;
      arr[o + 2] = (-ae * sy + bf) * sc;
      arr[o + 3] = 0;
      arr[o + 4] = -cy * sz * sc;
      arr[o + 5] = (-bf * sy + ae) * sc;
      arr[o + 6] = (af * sy + be) * sc;
      arr[o + 7] = 0;
      arr[o + 8] = sy * sc;
      arr[o + 9] = -sx * cy * sc;
      arr[o + 10] = cx * cy * sc;
      arr[o + 11] = 0;
      arr[o + 12] = px;
      arr[o + 13] = py;
      arr[o + 14] = pz;
      arr[o + 15] = 1;
    }
    tape.instanceMatrix.needsUpdate = true;
    streamers.instanceMatrix.needsUpdate = true;
  }

  /** The outer lanes, lane lines and litter, the granite kerbs, pavements and barricades. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({ map: this.repeat(asphaltTexture(), 4, 4), roughness: 0.9 });
    const concrete = this.material({ map: this.repeat(concreteTexture(), 3, 3), roughness: 0.9 });
    const granite = this.material({ color: 0x8e8c88, roughness: 0.8 });
    this.ribbons.add(points, asphalt, [
      [-r, 0.004],
      [-LANE, 0.004],
    ]);
    this.ribbons.add(points, asphalt, [
      [LANE, 0.004],
      [r, 0.004],
    ]);
    this.ribbons.add(points, granite, [
      [-LANE, 0.004],
      [-LANE - 0.05, KERB],
      [-LANE - 0.35, KERB],
    ]);
    this.ribbons.add(points, granite, [
      [LANE + 0.35, KERB],
      [LANE + 0.05, KERB],
      [LANE, 0.004],
    ]);
    this.ribbons.add(points, concrete, [
      [-LANE - 0.35, KERB],
      [-FRONTAGE - 3, KERB],
    ]);
    this.ribbons.add(points, concrete, [
      [FRONTAGE + 3, KERB],
      [LANE + 0.35, KERB],
    ]);
    // Dashed lane lines between the race lane and the floats' lanes.
    const dash = this.material({
      map: this.repeat(dashTexture(), 0.15, 12),
      alphaTest: 0.5,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    for (const side of [-1, 1]) {
      const x = side * (r + 0.1);
      this.ribbons.add(points, dash, [
        [x + 0.075, 0.008],
        [x - 0.075, 0.008],
      ]);
    }
    // Ticker tape that has already come down, scattered over every lane.
    const litter = this.material({
      map: this.repeat(litterTexture(), 6, 6),
      alphaTest: 0.5,
      roughness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -3,
    });
    this.ribbons.add(points, litter, [
      [LANE, 0.012],
      [-LANE, 0.012],
    ]);
    // Barricades along both kerbs, hung with the parade's banners.
    const rail = this.material({ color: 0x2a4f9e, roughness: 0.6 });
    for (const side of [-1, 1]) {
      const texture = this.track(barrierBannerTexture(BARRIER_PANELS));
      texture.repeat.set(-1, -side / 24);
      const banner = this.material({ map: texture, alphaTest: 0.5, roughness: 0.5 });
      const x = side * BARRIER;
      this.ribbons.add(points, banner, [
        [x, KERB + 0.08],
        [x, KERB + 1.05],
      ]);
      this.ribbons.add(points, rail, [
        [x, KERB + 1.05],
        [x + 0.05, KERB + 1.12],
        [x - 0.05, KERB + 1.12],
        [x, KERB + 1.05],
      ]);
    }
  }

  /**
   * Builds the canyon's limestone, granite, brick and glass towers plus the overhead cloth street
   * banners, merges both sides of Broadway into `BLOCK_COUNT` cross-street `StreetBlock`s, and
   * packs all blocks into shared `BatchedMesh`es (`facadeAtlasMat`, `shop`, `solidMat`,
   * `clothAtlasMat`) with near-rider shadow-corridor splitting.
   */
  private addCanyonBlocks(): void {
    const facadeAtlas = this.track(facadeAtlasTexture());
    const facadeAtlasMat = this.material({ map: facadeAtlas, roughness: 0.75 });
    const shopfront = this.track(shopTexture());
    shopfront.wrapS = RepeatWrapping;
    const shop = this.material({ map: shopfront, roughness: 0.35, metalness: 0.2 });

    const tempMats: MeshStandardMaterial[] = [];
    const tempSolid = (color: string | number) => {
      const m = new MeshStandardMaterial({ color });
      tempMats.push(m);
      return m;
    };
    const walls = PALETTES.map((p) => tempSolid(p.wall));
    const trims = PALETTES.map((p) => tempSolid(p.trim));
    const copper = tempSolid(0x6fa58f);
    const tar = tempSolid(0x2c2d30);
    const wood = tempSolid(0x7a5a3e);
    const steel = tempSolid(0x3a3c40);
    const wireSteel = tempSolid(0x2b2d31);

    const pyramid = new ConeGeometry(Math.SQRT1_2, 1, 4);
    pyramid.rotateY(Math.PI / 4);
    pyramid.translate(0, 0.5, 0);
    const tank = new CylinderGeometry(1.7, 1.7, 3.6, 12);
    tank.translate(0, 1.8, 0);
    const tankRoof = new ConeGeometry(1.85, 1.4, 12);
    tankRoof.translate(0, 4.3, 0);
    const wire = new BoxGeometry(FRONTAGE - 6.5, 0.04, 0.04);
    const drapeCloths = DRAPES.map((_, k) => {
      const g = new PlaneGeometry(2.4, 10);
      const uv = g.getAttribute('uv') as BufferAttribute;
      const u0 = (CLOTH_BANNER_W + k * CLOTH_DRAPE_COL_W + 1) / CLOTH_ATLAS_W;
      const u1 = (CLOTH_BANNER_W + (k + 1) * CLOTH_DRAPE_COL_W - 1) / CLOTH_ATLAS_W;
      const v0 = 1 - 511 / CLOTH_ATLAS_H;
      const v1 = 1 - 1 / CLOTH_ATLAS_H;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
      }
      this.disposables.push(g);
      return g;
    });
    this.disposables.push(pyramid, tank, tankRoof, wire);

    const blockGroups = Array.from({ length: BLOCK_COUNT }, () => new Group());
    const blockOf = (propOffset: number) =>
      Math.min(BLOCK_COUNT - 1, Math.max(0, Math.floor(propOffset / BLOCK_LEN)));

    const makeTowerMass = (palette: number, depth: number, height: number, width: number) => {
      const geometry = new BoxGeometry(depth, height, width);
      const vRep = height / (4 * STOREY);
      setFacadeFaceUv(geometry, 0, palette, width, vRep);
      setFacadeFaceUv(geometry, 4, palette, depth, vRep);
      setFacadeFaceUv(geometry, 5, palette, depth, vRep);
      this.disposables.push(geometry);
      const wall = walls[palette]!;
      const mesh = new Mesh(geometry, [
        facadeAtlasMat,
        wall,
        tar,
        wall,
        facadeAtlasMat,
        facadeAtlasMat,
      ]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    for (const side of [-1, 1] as const) {
      const layout = seeded(side < 0 ? 11 : 29);
      let offset = side < 0 ? 0 : 9;
      let last = -1;
      let index = 0;
      while (offset < LOOP - 10) {
        const width = Math.min(16 + Math.floor(layout() * 5) * 4, LOOP - offset);
        let style = Math.floor(layout() * (PALETTES.length - 1));
        if (style >= last) style++;
        last = style;
        const baseStoreys = 6 + Math.floor(layout() * 8);
        const towerStoreys = layout() < 0.65 ? 8 + Math.floor(layout() * 22) : 0;
        const depth = 26;
        const baseHeight = baseStoreys * STOREY + 1;
        const building = new Group();
        const box = (m: Material, w: number, h: number, d: number, x: number, y: number) => {
          const mesh = new Mesh(this.unit, m);
          mesh.scale.set(w, h, d);
          mesh.position.set(x, y + h / 2, 0);
          mesh.castShadow = true;
          building.add(mesh);
          return mesh;
        };
        const base = makeTowerMass(style, depth, baseHeight, width);
        base.position.set(-depth / 2, baseHeight / 2, 0);
        building.add(base);
        const shopGeometry = new BoxGeometry(0.5, 4.4, width - 0.8);
        scaleFaceUv(shopGeometry, 0, width / 12, 1);
        this.disposables.push(shopGeometry);
        const store = new Mesh(shopGeometry, shop);
        store.position.set(0.25, 2.2, 0);
        building.add(store);
        const trim = trims[style]!;
        box(trim, 0.8, 0.5, width + 0.2, 0.2, 4.4);
        box(trim, 1.5, 0.9, width + 0.6, 0.45, baseHeight - 0.9);
        if (towerStoreys > 0) {
          const inset = 3 + layout() * 3;
          const towerWidth = Math.max(width - 2 * (1.5 + layout() * 3), 10);
          const towerDepth = depth - inset - 3;
          const towerHeight = towerStoreys * STOREY;
          const tower = makeTowerMass(style, towerDepth, towerHeight, towerWidth);
          tower.position.set(-inset - towerDepth / 2, baseHeight + towerHeight / 2, 0);
          building.add(tower);
          const top = baseHeight + towerHeight;
          box(trim, towerDepth + 0.8, 0.8, towerWidth + 0.8, -inset - towerDepth / 2, top - 0.8);
          if (layout() < 0.5) {
            const roof = new Mesh(pyramid, copper);
            roof.scale.set(towerDepth * 0.9, 7 + layout() * 8, towerWidth * 0.9);
            roof.position.set(-inset - towerDepth / 2, top, 0);
            roof.castShadow = true;
            building.add(roof);
          } else {
            box(steel, 0.25, 9, 0.25, -inset - towerDepth / 2, top);
          }
        }
        if (towerStoreys === 0 || layout() < 0.4) {
          const legs = new Group();
          for (const [x, z] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ] as const) {
            const leg = new Mesh(this.unit, steel);
            leg.scale.set(0.18, 2.6, 0.18);
            leg.position.set(x * 1.1, 1.3, z * 1.1);
            legs.add(leg);
          }
          const body = new Mesh(tank, wood);
          body.position.y = 2.6;
          const roof = new Mesh(tankRoof, tar);
          roof.position.y = 2.6;
          body.castShadow = true;
          legs.add(body, roof);
          legs.position.set(-depth + 5, baseHeight, (layout() - 0.5) * width * 0.5);
          building.add(legs);
        }
        if (index % 2 === 0) {
          for (const z of [-width / 4, width / 4]) {
            const dIdx = (index / 2 + (z > 0 ? 1 : 0)) % drapeCloths.length;
            const drape = new Mesh(drapeCloths[dIdx]!, this.clothAtlasMat!);
            drape.position.set(0.2, 12, z);
            drape.rotation.y = Math.PI / 2;
            building.add(drape);
          }
        }
        if (side > 0) building.rotation.y = Math.PI;
        const setback = layout() * 1.2;
        const propOffset = offset + width / 2;
        const bIdx = blockOf(propOffset);
        const blockCenter = bIdx * BLOCK_LEN + BLOCK_LEN / 2;
        building.position.set(side * (FRONTAGE + setback), 0, -(propOffset - blockCenter));
        blockGroups[bIdx]!.add(building);
        offset += width + (layout() < 0.15 ? 11 : 0.3);
        index++;
      }
    }

    // Overhead cloth banners slung across the canyon on wires from tower to tower.
    STREET_BANNERS.forEach((_, i) => {
      const cloth = bannerAtlasPlane(13, 2.2, i);
      this.disposables.push(cloth);
      const banner = new Group();
      const c = new Mesh(cloth, this.clothAtlasMat!);
      c.position.y = 10.5;
      c.castShadow = true;
      banner.add(c);
      for (const side of [-1, 1]) {
        const w = new Mesh(wire, wireSteel);
        w.position.set(side * (6.5 + (FRONTAGE - 6.5) / 2), 11.4, 0);
        banner.add(w);
      }
      const propOffset = 60 + i * 120;
      const bIdx = blockOf(propOffset);
      const blockCenter = bIdx * BLOCK_LEN + BLOCK_LEN / 2;
      banner.position.set(0, 0, -(propOffset - blockCenter));
      blockGroups[bIdx]!.add(banner);
    });

    interface BlockPiece {
      blockIdx: number;
      geometry: BufferGeometry;
      castShadow: boolean;
    }
    const buckets = new Map<string, { material: Material; pieces: BlockPiece[] }>();
    const matIds = new Map<Material, number>();
    let nextMid = 1;

    for (let bIdx = 0; bIdx < BLOCK_COUNT; bIdx++) {
      const bg = blockGroups[bIdx]!;
      mergeStaticGroup(bg, this.disposables, undefined, this.solidMat);
      this.canyonBlocks.push({ center: bIdx * BLOCK_LEN + BLOCK_LEN / 2, slots: [] });
      for (const child of bg.children) {
        if (!(child instanceof Mesh) || Array.isArray(child.material)) continue;
        const geo = ensureIndexed(child.geometry as BufferGeometry);
        const mat = child.material as Material;
        let mid = matIds.get(mat);
        if (mid === undefined) {
          mid = nextMid++;
          matIds.set(mat, mid);
        }
        const attrSig = Object.keys(geo.attributes).sort().join(',');
        const key = `${mid}|${attrSig}`;
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = { material: mat, pieces: [] };
          buckets.set(key, bucket);
        }
        bucket.pieces.push({ blockIdx: bIdx, geometry: geo, castShadow: child.castShadow });
      }
    }

    for (const bucket of buckets.values()) {
      const geos = bucket.pieces.map((p) => p.geometry);
      const anyShadow = bucket.pieces.some((p) => p.castShadow);
      const farPack = createBatch(
        geos,
        bucket.pieces.length,
        bucket.material,
        this.group,
        this.disposables,
        false,
        true,
      );
      this.blockTextures.push(farPack.tex);
      const nearPack = anyShadow
        ? createBatch(
            geos,
            bucket.pieces.length,
            bucket.material,
            this.group,
            this.disposables,
            true,
            true,
          )
        : null;
      if (nearPack) this.blockTextures.push(nearPack.tex);

      bucket.pieces.forEach((piece, idx) => {
        const farId = farPack.batch.addInstance(farPack.geoIds[idx]!);
        farPack.batch.setVisibleAt(farId, false);
        let nearId = -1;
        if (nearPack && piece.castShadow) {
          nearId = nearPack.batch.addInstance(nearPack.geoIds[idx]!);
          nearPack.batch.setVisibleAt(nearId, false);
        }
        this.canyonBlocks[piece.blockIdx]!.slots.push({
          farBatch: farPack.batch,
          farArr: farPack.data,
          farId,
          nearBatch: nearId >= 0 ? nearPack!.batch : null,
          nearArr: nearId >= 0 ? nearPack!.data : null,
          nearId,
          state: 0,
        });
      });
    }

    for (const m of tempMats) m.dispose();
  }

  /** Street lamps on both kerbs, each carrying a pair of the parade's banners. */
  private addLamps(): void {
    const pole = new CylinderGeometry(0.09, 0.14, 8.5, 8);
    pole.translate(0, 4.25, 0);
    const arm = new BoxGeometry(2.6, 0.12, 0.12);
    arm.translate(-1.3, 8.3, 0);
    const head = new BoxGeometry(0.9, 0.22, 0.4);
    head.translate(-2.6, 8.2, 0);
    const solidParts: BufferGeometry[] = [
      tintGeometry(pole.toNonIndexed(), 0x3d4a3f),
      tintGeometry(arm.toNonIndexed(), 0x3d4a3f),
    ];
    [ORANGE, BLUE].forEach((colour, k) => {
      for (const rotY of [0, Math.PI]) {
        const banner = new PlaneGeometry(0.75, 2.2).toNonIndexed();
        if (rotY !== 0) banner.rotateY(rotY);
        banner.translate(0, 5.2, (k ? 1 : -1) * 0.45);
        tintGeometry(banner, colour);
        solidParts.push(banner);
      }
    });
    for (const part of solidParts) part.deleteAttribute('uv');
    const lampSolid = mergeGeometries(solidParts)!;
    solidParts.forEach((g) => g.dispose());
    pole.dispose();
    arm.dispose();
    this.disposables.push(lampSolid, head);
    const lens = this.material({ color: 0xf5f1e6, emissive: 0xfff2d6, emissiveIntensity: 0.3 });
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 30) {
        this.lampItems.push({
          side,
          offset: offset + (side > 0 ? 15 : 0),
          x: side * (LANE + 0.25),
        });
      }
    }
    const cap = Math.max(1, this.lampItems.length);
    this.lampBodies = new InstancedMesh(lampSolid, this.solidMat, cap);
    this.lampBodies.frustumCulled = false;
    this.lampBodies.castShadow = false;
    this.lampHeads = new InstancedMesh(head, lens, cap);
    this.lampHeads.frustumCulled = false;
    this.lampHeads.castShadow = false;
    this.disposables.push(this.lampBodies, this.lampHeads);
    this.group.add(this.lampBodies, this.lampHeads);
  }

  /** Strings of orange, blue and white pennants sagging across the canyon. */
  private addBunting(): void {
    const colours = [ORANGE, BLUE, '#ffffff'].map((c) => new Color(c));
    const n = 33;
    const positions = new Float32Array(n * 9);
    const vertColours = new Float32Array(n * 9);
    for (let k = 0; k < n; k++) {
      const x = -FRONTAGE + ((k + 0.5) * 2 * FRONTAGE) / n;
      const y = 12.5 - 2.4 * (1 - (x / FRONTAGE) ** 2);
      const o = k * 9;
      positions[o] = x - 0.3;
      positions[o + 1] = y;
      positions[o + 2] = 0;
      positions[o + 3] = x + 0.3;
      positions[o + 4] = y;
      positions[o + 5] = 0;
      positions[o + 6] = x;
      positions[o + 7] = y - 0.7;
      positions[o + 8] = 0;
      const c = colours[k % colours.length]!;
      for (let v = 0; v < 3; v++) {
        vertColours[o + v * 3] = c.r;
        vertColours[o + v * 3 + 1] = c.g;
        vertColours[o + v * 3 + 2] = c.b;
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(vertColours, 3));
    geometry.computeVertexNormals();
    this.disposables.push(geometry);
    for (let offset = 20; offset < LOOP; offset += 40) {
      if ((offset - 60) % 120 === 0) continue;
      this.buntingOffsets.push(offset);
    }
    const cap = Math.max(1, this.buntingOffsets.length);
    this.buntingMesh = new InstancedMesh(geometry, this.doubleSideVertexMat, cap);
    this.buntingMesh.frustumCulled = false;
    this.buntingMesh.castShadow = false;
    this.disposables.push(this.buntingMesh);
    this.group.add(this.buntingMesh);
  }

  /** What the fans have painted on the tarmac, batched into one `BatchedMesh`. */
  private addRoadPaint(): void {
    const cols = 4;
    const rows = Math.ceil(ROAD_PAINT.length / cols);
    const atlasMat = this.material({
      map: this.track(roadPaintAtlasTexture(ROAD_PAINT, cols, rows)),
      alphaTest: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.7,
    });
    const planes = ROAD_PAINT.map((_, idx) => {
      const g = gridAtlasPlane(
        2.6,
        9,
        idx % cols,
        cols,
        Math.floor(idx / cols),
        rows,
        cols * 256,
        rows * 560,
      );
      g.rotateX(-Math.PI / 2);
      g.translate(0, 0.02, 0);
      this.disposables.push(g);
      return g;
    });
    const allEntries = [...ROAD_PAINT, ...ROAD_PAINT];
    const pack = createBatch(
      planes,
      allEntries.length,
      atlasMat,
      this.group,
      this.disposables,
      false,
      true,
    );
    this.roadPaintBatch = pack.batch;
    this.roadPaintData = pack.data;
    this.roadPaintTex = pack.tex;
    // Group consecutive instances by geometryId so WebGPU merges same-stencil draws.
    for (let pIdx = 0; pIdx < planes.length; pIdx++) {
      const gid = pack.geoIds[pIdx]!;
      allEntries.forEach(([, , x], i) => {
        if (i % planes.length !== pIdx) return;
        const id = pack.batch.addInstance(gid);
        pack.batch.setVisibleAt(id, false);
        this.roadPaintItems.push({ id, offset: 30 + i * ROAD_PAINT_EVERY, x, vis: 0 });
      });
    }
  }

  /**
   * The parade floats: a blue tractor unit pulling a flatbed skirted in the parade's colours,
   * carrying a giant basketball, a gold trophy or a champions' board, balloons tied above and
   * the players dancing on the deck.
   */
  private addFloats(): void {
    const tempMats: MeshStandardMaterial[] = [];
    const tempSolid = (color: string | number) => {
      const m = new MeshStandardMaterial({ color });
      tempMats.push(m);
      return m;
    };
    const cab = tempSolid(BLUE);
    const glass = tempSolid(0x1c2630);
    const deck = tempSolid(0xf2efe6);
    const chassis = tempSolid(0x15171b);
    const gold = tempSolid(0xe2b23c);
    const balloons = [ORANGE, BLUE, '#ffffff'].map((c) => tempSolid(c));
    const ball = this.material({ map: this.track(ballTexture()), roughness: 0.75 });
    const skirtGeos = [0, 1].map((k) => {
      const g = bannerAtlasPlane(11.6, 1.3, STREET_BANNERS.length + k);
      this.disposables.push(g);
      return g;
    });
    const sign = bannerAtlasPlane(8.5, 2.4, STREET_BANNERS.length + 2);
    const sphere = new SphereGeometry(1, 16, 12);
    const cup = new CylinderGeometry(1, 0.45, 1.8, 16);
    cup.translate(0, 0.9, 0);
    const stem = new CylinderGeometry(0.22, 0.32, 1.6, 10);
    stem.translate(0, 0.8, 0);
    const foot = new CylinderGeometry(0.9, 1.05, 0.9, 14);
    foot.translate(0, 0.45, 0);
    this.disposables.push(sphere, cup, stem, foot, sign);
    const random = seeded(127);
    for (let i = 0; i < FLOATS; i++) {
      const float = new Group();
      const box = (
        m: Material,
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
        float.add(mesh);
        return mesh;
      };
      box(cab, 2.5, 2.4, 2.6, 0, 0.5, -7.4);
      box(glass, 2.3, 0.9, 0.05, 0, 1.9, -8.72);
      box(chassis, 2.6, 0.6, 14.4, 0, 0.1, -1.2);
      box(deck, 2.8, 0.25, 11.6, 0, DECK - 0.25, 0);
      for (const side of [-1, 1]) {
        const s = new Mesh(skirtGeos[i % skirtGeos.length]!, this.clothAtlasMat!);
        s.position.set(side * 1.42, DECK - 0.8, 0);
        s.rotation.y = side * (Math.PI / 2);
        float.add(s);
      }
      const kind = i % 3;
      if (kind === 0) {
        const b = new Mesh(sphere, ball);
        b.scale.setScalar(2.1);
        b.position.set(0, DECK + 2.1, 0.6);
        b.rotation.set(0.4, 0.8, 0.2);
        b.castShadow = true;
        float.add(b);
      } else if (kind === 1) {
        const trophy = new Group();
        const parts = [new Mesh(foot, chassis), new Mesh(stem, gold), new Mesh(cup, gold)];
        parts[1]!.position.y = 0.9;
        parts[2]!.position.y = 2.5;
        const top = new Mesh(sphere, gold);
        top.scale.setScalar(0.75);
        top.position.y = 4.9;
        trophy.add(...parts, top);
        trophy.scale.setScalar(1.5);
        trophy.position.set(0, DECK, 0.6);
        trophy.traverse((o) => (o.castShadow = true));
        float.add(trophy);
      } else {
        const s = new Mesh(sign, this.clothAtlasMat!);
        s.position.set(0, DECK + 2.2, 0.4);
        s.rotation.y = Math.PI / 2;
        float.add(s);
        box(chassis, 0.15, 1.1, 0.15, 0, DECK, -3.6);
        box(chassis, 0.15, 1.1, 0.15, 0, DECK, 4.4);
      }
      for (let k = 0; k < 7; k++) {
        const b = new Mesh(sphere, balloons[k % balloons.length]!);
        b.scale.set(0.38, 0.46, 0.38);
        b.position.set((random() - 0.5) * 2.2, DECK + 4.4 + random() * 1.6, (random() - 0.5) * 9);
        float.add(b);
      }
      mergeStaticGroup(float, this.disposables, undefined, this.solidMat);
      this.group.add(float);
      this.floats.push({ group: float, shadowMeshes: collectShadowMeshes(float) });
    }
    for (const m of tempMats) m.dispose();
    this.crew = new Figures(
      this.group,
      this.disposables,
      FLOATS * CREW,
      { tops: [BLUE, ORANGE, '#ffffff'], bottoms: [BLUE, '#ffffff', ORANGE], skins: SKINS },
      131,
      false,
      this.solidMat,
    );
  }

  /** Ticker tape and streamers falling through the canyon, white with the parade's colours. */
  private addTickerTape(): void {
    const scrap = tintGeometry(new PlaneGeometry(0.2, 0.12), 0xffffff);
    scrap.deleteAttribute('uv');
    const ribbon = tintGeometry(new PlaneGeometry(0.05, 1.5), 0xffffff);
    ribbon.deleteAttribute('uv');
    const make = (geometry: BufferGeometry, count: number, colours: readonly string[]) => {
      const mesh = new InstancedMesh(geometry, this.doubleSideVertexMat, count);
      mesh.frustumCulled = false;
      const random = seeded(count);
      const c = new Color();
      for (let i = 0; i < count; i++)
        mesh.setColorAt(i, c.set(colours[Math.floor(random() * colours.length)]!));
      this.group.add(mesh);
      this.disposables.push(geometry, mesh);
      return mesh;
    };
    this.tape = make(scrap, TAPE, [
      '#ffffff',
      '#ffffff',
      '#ffffff',
      '#f4f0e4',
      '#ffffff',
      '#ffb36b',
      '#7fa8f0',
    ]);
    this.streamers = make(ribbon, STREAMERS, [ORANGE, '#2f6fe0', '#ffffff', ORANGE, '#2f6fe0']);
    const spinRand = seeded(991);
    for (let p = 0; p < SPIN_PRESETS; p++) {
      const streamer = p >= SPIN_PRESETS - 4;
      const r6 = p * 6;
      this.spinRates[r6] = streamer ? 0.2 + spinRand() * 0.2 : 1 + spinRand() * 2;
      this.spinRates[r6 + 1] = streamer ? 0.8 + spinRand() * 1.2 : 1 + spinRand() * 2;
      this.spinRates[r6 + 2] = streamer ? 0.2 + spinRand() * 0.3 : 1 + spinRand() * 2;
      this.spinRates[r6 + 3] = spinRand() * 6.28;
      this.spinRates[r6 + 4] = spinRand() * 6.28;
      this.spinRates[r6 + 5] = 0;
    }
    const random = seeded(137);
    for (let i = 0; i < TAPE + STREAMERS; i++) {
      const streamer = i >= TAPE;
      const x = (random() * 2 - 1) * (FRONTAGE - 0.5);
      const offset = random() * TAPE_SPAN;
      const phase = random();
      const fall = streamer ? 0.5 + random() * 0.3 : 0.8 + random() * 0.6;
      // Consume the same 3 PRNG draws per piece so seeded positions stay identical.
      random();
      random();
      random();
      this.pieces.push({
        x,
        offset,
        phase,
        sinP20: Math.sin(phase * 20),
        cosP20: Math.cos(phase * 20),
        fall,
        spinPreset: streamer ? SPIN_PRESETS - 4 + (i % 4) : i % (SPIN_PRESETS - 4),
      });
    }
  }

  /** The canyon running on past the street's loop into the haze: plainer towers, further off. */
  private addSkyline(): void {
    const random = seeded(149);
    const tones = ['#b9b4aa', '#9a978f', '#8c6b58', '#c4b393', '#7d838c'].map(
      (c) => new MeshStandardMaterial({ color: c, roughness: 0.9 }),
    );
    for (let z = 470; z < WOOLWORTH_AHEAD - 40; z += 26 + random() * 10) {
      for (const side of [-1, 1]) {
        const height = 50 + random() * 95;
        const width = 22 + random() * 10;
        const tower = new Mesh(this.unit, tones[Math.floor(random() * tones.length)]!);
        tower.scale.set(30, height, width);
        tower.position.set(side * (FRONTAGE + 15 + random() * 4), height / 2, -z);
        this.skyline.add(tower);
      }
    }
    mergeStaticGroup(this.skyline, this.disposables, undefined, this.solidMat);
    tones.forEach((m) => m.dispose());
    this.group.add(this.skyline);
  }

  /**
   * The Woolworth Building at the head of the canyon: a cream terra-cotta base, the tower
   * rising out of it in setbacks with Gothic pinnacles at every corner, and its copper
   * pyramid crown with a lantern and spire.
   */
  private addWoolworth(): void {
    const haze = new Color(HAZE);
    const terra = this.track(terracottaTexture());
    terra.wrapS = RepeatWrapping;
    terra.wrapT = RepeatWrapping;
    const cream = hazedMaterial(this.disposables, haze, 0xf1ead9, 0.14, { map: terra });
    const plain = new MeshStandardMaterial({ roughness: 0.7, fog: false });
    plain.color.set(0xe9e1cd).lerp(haze, 0.16);
    // The verdigris crown catches the high sun, so it reads green against the sky.
    const copper = hazedMaterial(this.disposables, haze, 0x5fae8e, 0.1, {
      metalness: 0.2,
      emissive: new Color(0x3f8a6c),
      emissiveIntensity: 0.35,
    });
    const w = this.woolworth;
    const stage = (width: number, height: number, depth: number, y: number) => {
      const geometry = new BoxGeometry(width, height, depth);
      for (const face of [0, 1]) scaleFaceUv(geometry, face, depth / 8, height / 8);
      for (const face of [4, 5]) scaleFaceUv(geometry, face, width / 8, height / 8);
      this.disposables.push(geometry);
      const mesh = new Mesh(geometry, [cream, cream, plain, plain, cream, cream]);
      mesh.position.set(0, y + height / 2, 0);
      w.add(mesh);
    };
    const pinnacle = new CylinderGeometry(0.9, 1.1, 7, 8);
    pinnacle.translate(0, 3.5, 0);
    const point = new ConeGeometry(1.1, 5, 8);
    point.translate(0, 9.5, 0);
    const pyramid = new ConeGeometry(Math.SQRT1_2, 1, 4);
    pyramid.rotateY(Math.PI / 4);
    pyramid.translate(0, 0.5, 0);
    this.disposables.push(pinnacle, point, pyramid);
    const corners = (half: number, y: number) => {
      for (const [x, z] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        const p = new Mesh(pinnacle, plain);
        const q = new Mesh(point, copper);
        p.position.set(x * half, y, z * half);
        q.position.set(x * half, y, z * half);
        w.add(p, q);
      }
    };
    stage(64, 100, 40, 0);
    for (const x of [-29, 29]) {
      const cap = new Mesh(pyramid, copper);
      cap.scale.set(7, 9, 7);
      cap.position.set(x, 100, 16);
      w.add(cap);
    }
    stage(30, 60, 30, 100);
    corners(15, 160);
    stage(26, 22, 26, 160);
    corners(13, 182);
    stage(21, 16, 21, 182);
    corners(10.5, 198);
    const crown = new Mesh(pyramid, copper);
    crown.scale.set(21, 26, 21);
    crown.position.y = 198;
    w.add(crown);
    const lantern = new Mesh(this.unit, plain);
    lantern.scale.set(5, 7, 5);
    lantern.position.y = 225.5;
    const spire = new Mesh(point, copper);
    spire.scale.set(1.4, 2.8, 1.4);
    spire.position.y = 202;
    w.add(lantern, spire);
    mergeStaticGroup(w, this.disposables, undefined, this.hazedSolidMat);
    plain.dispose();
    w.scale.setScalar(1.25);
    this.group.add(w);
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

/** Maps one face of a tower box onto palette column `palette` of `facadeAtlasTexture`. */
function setFacadeFaceUv(
  box: BoxGeometry,
  face: number,
  palette: number,
  spanMetres: number,
  vRepeats: number,
): void {
  const uv = box.getAttribute('uv') as BufferAttribute;
  const u0 = (palette * FACADE_COL_STRIDE + FACADE_GUTTER + 0.5) / FACADE_TEX_W;
  const uSpan =
    (Math.min(spanMetres, FACADE_MAX_METRES - 0.5) / FACADE_MAX_METRES) *
    ((FACADE_COL_INNER - 1) / FACADE_TEX_W);
  for (let i = face * 4; i < face * 4 + 4; i++) {
    uv.setXY(i, u0 + uv.getX(i) * uSpan, uv.getY(i) * vRepeats);
  }
}

/**
 * Packs all 7 canyon tower palettes side by side into one `wrapT = RepeatWrapping` atlas:
 * 12 bays (`36 m`) across per column with 8 px edge-extruded mipmap gutters, and 4 storeys down.
 */
function facadeAtlasTexture(): CanvasTexture {
  const bayW = 32;
  const storeyH = 64;
  const bays = FACADE_COL_INNER / bayW;
  const texture = canvasTexture(FACADE_TEX_W, FACADE_TEX_H, (g) => {
    PALETTES.forEach((p, col) => {
      const colLeft = col * FACADE_COL_STRIDE;
      const innerLeft = colLeft + FACADE_GUTTER;
      g.save();
      g.beginPath();
      g.rect(colLeft, 0, FACADE_COL_STRIDE, FACADE_TEX_H);
      g.clip();
      g.translate(colLeft, 0);
      speckle(g, FACADE_COL_STRIDE, FACADE_TEX_H, p.wall, 41 + col);
      g.restore();

      const random = seeded(42 + col);
      for (let row = 0; row < 4; row++) {
        const y = row * storeyH;
        const pane = p.glass
          ? g.createLinearGradient(0, y, 0, y + 50)
          : g.createLinearGradient(0, y + 12, 0, y + 53);
        if (p.glass) {
          pane.addColorStop(0, '#a9c2d8');
          pane.addColorStop(0.6, '#47627b');
          pane.addColorStop(1, '#2b3d4f');
        } else {
          pane.addColorStop(0, '#93aec4');
          pane.addColorStop(1, '#27333f');
        }
        for (let bay = -1; bay <= bays; bay++) {
          const x = innerLeft + bay * bayW;
          if (x + bayW <= colLeft || x >= colLeft + FACADE_COL_STRIDE) continue;
          g.save();
          g.beginPath();
          g.rect(colLeft, y, FACADE_COL_STRIDE, storeyH);
          g.clip();
          if (p.glass) {
            g.fillStyle = pane;
            g.fillRect(x + 1, y + 1, bayW - 2, 48);
            g.fillStyle = p.trim;
            g.fillRect(x, y, 1.5, storeyH);
          } else {
            g.fillStyle = p.trim;
            g.fillRect(x + 7, y + 10, 18, 46);
            g.fillStyle = pane;
            g.fillRect(x + 9, y + 12, 14, 41);
            if (bay >= 0 && bay < bays && random() < 0.35) {
              g.fillStyle = 'rgba(236,229,212,0.9)';
              g.fillRect(x + 9, y + 12, 14, 5 + random() * 20);
            }
            g.fillStyle = p.trim;
            g.fillRect(x + 15.5, y + 12, 1.5, 41);
            g.fillRect(x + 9, y + 31, 14, 2);
            g.fillStyle = 'rgba(0,0,0,0.28)';
            g.fillRect(x + 7, y + 56, 18, 2.5);
          }
          g.restore();
        }
      }
    });
  });
  texture.wrapT = RepeatWrapping;
  return texture;
}

/** Twelve metres of shopfronts: a dark sign band over plate glass, posters in the windows. */
function shopTexture(): CanvasTexture {
  return canvasTexture(512, 192, (g) => {
    g.fillStyle = '#2a2d33';
    g.fillRect(0, 0, 512, 192);
    g.fillStyle = '#16181c';
    g.fillRect(0, 0, 512, 40);
    const random = seeded(151);
    for (let k = 0; k < 4; k++) {
      const x = k * 128;
      const pane = g.createLinearGradient(0, 50, 0, 186);
      pane.addColorStop(0, '#6d8296');
      pane.addColorStop(1, '#1c242c');
      g.fillStyle = pane;
      g.fillRect(x + 10, 50, 108, 136);
      g.fillStyle = 'rgba(255,255,255,0.14)';
      g.fillRect(x + 10, 50, 108, 18);
      if (random() < 0.6) {
        g.fillStyle = random() < 0.5 ? ORANGE : BLUE;
        g.fillRect(x + 30 + random() * 40, 90, 30, 42);
      }
    }
  });
}

/** Returns a PlaneGeometry sampling horizontal banner `row` in `canyonClothAtlasTexture`. */
function bannerAtlasPlane(width: number, height: number, row: number): PlaneGeometry {
  const g = new PlaneGeometry(width, height);
  const uv = g.getAttribute('uv') as BufferAttribute;
  const u0 = 0.5 / CLOTH_ATLAS_W;
  const u1 = (CLOTH_BANNER_W - 0.5) / CLOTH_ATLAS_W;
  const dv = 0.5 / CLOTH_ATLAS_H;
  const v0 = 1 - (row + 1) / CLOTH_ROWS + dv;
  const v1 = 1 - row / CLOTH_ROWS - dv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  }
  return g;
}

/** Returns a PlaneGeometry whose UVs sample tile `(col, row)` of a `(cols × rows)` grid atlas. */
function gridAtlasPlane(
  width: number,
  height: number,
  col: number,
  cols: number,
  row: number,
  rows: number,
  texW: number,
  texH: number,
): PlaneGeometry {
  const g = new PlaneGeometry(width, height);
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

/** Packs horizontal cloth banners (left) and vertical tower drapes (right) into one atlas. */
function canyonClothAtlasTexture(
  entries: readonly (readonly [string, string, string])[],
): CanvasTexture {
  return canvasTexture(CLOTH_ATLAS_W, CLOTH_ATLAS_H, (ctx) => {
    entries.forEach(([text, fill, ink], r) => {
      const y0 = r * CLOTH_ROW_H;
      ctx.fillStyle = fill;
      ctx.fillRect(0, y0, CLOTH_BANNER_W, CLOTH_ROW_H);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 5;
      ctx.strokeRect(10, y0 + 10, CLOTH_BANNER_W - 20, CLOTH_ROW_H - 20);
      ctx.fillStyle = ink;
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, CLOTH_BANNER_W / 2, y0 + 68, CLOTH_BANNER_W - 60);
      const folds = ctx.createLinearGradient(0, y0, CLOTH_BANNER_W, y0);
      for (let i = 0; i <= 6; i++) {
        folds.addColorStop(i / 6, i % 2 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)');
      }
      ctx.fillStyle = folds;
      ctx.fillRect(0, y0, CLOTH_BANNER_W, CLOTH_ROW_H);
    });
    DRAPES.forEach(([word, fill, ink], col) => {
      const x0 = CLOTH_BANNER_W + col * CLOTH_DRAPE_COL_W;
      ctx.fillStyle = fill;
      ctx.fillRect(x0, 0, CLOTH_DRAPE_COL_W, 512);
      ctx.fillStyle = ink;
      ctx.fillRect(x0, 0, CLOTH_DRAPE_COL_W, 14);
      ctx.fillRect(x0, 498, CLOTH_DRAPE_COL_W, 14);
      ctx.font = 'bold 84px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const letters = word.split('');
      const step = 460 / Math.max(letters.length, 3);
      const start = 256 - (step * letters.length) / 2;
      letters.forEach((c, i) =>
        ctx.fillText(c, x0 + CLOTH_DRAPE_COL_W / 2, start + step * (i + 0.5)),
      );
    });
  });
}

/** Packs road-paint stencils into a `(cols × rows)` grid atlas (`256c × 560r`). */
function roadPaintAtlasTexture(
  entries: readonly (readonly [string, string, number])[],
  cols: number,
  rows: number,
): CanvasTexture {
  const cellW = 256;
  const cellH = 560;
  return canvasTexture(cellW * cols, cellH * rows, (ctx) => {
    entries.forEach(([text, colour], idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x0 = col * cellW;
      const y0 = row * cellH;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, cellW, cellH);
      ctx.clip();
      ctx.fillStyle = colour;
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.setTransform(1, 0, 0, 7, x0, y0);
      ctx.fillText(text, 128, 40, 244);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      const random = seeded(text.length * 31);
      if (typeof Path2D !== 'undefined') {
        const wear = new Path2D();
        for (let i = 0; i < 1200; i++) {
          wear.rect(
            x0 + random() * cellW,
            y0 + random() * cellH,
            1 + random() * 2,
            1 + random() * 4,
          );
        }
        ctx.fill(wear);
      }
      ctx.restore();
    });
  });
}

/** A basketball's pebbled orange leather and its black seams, wrapped round a sphere. */
function ballTexture(): CanvasTexture {
  return canvasTexture(512, 256, (g) => {
    speckle(g, 512, 256, '#e2702a', 157);
    g.strokeStyle = '#1a1410';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(0, 128);
    g.lineTo(512, 128);
    for (const x of [128, 384]) {
      g.moveTo(x, 0);
      g.lineTo(x, 256);
    }
    g.stroke();
    for (const centre of [0, 256, 512]) {
      g.beginPath();
      for (let y = 0; y <= 256; y += 8) {
        const x = centre + (centre === 256 ? -1 : 1) * (30 + 60 * Math.sin((Math.PI * y) / 256));
        if (y === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

/** Eight metres of the Woolworth's terra cotta: pale piers rising between Gothic windows. */
function terracottaTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#efe8d8', 163);
    for (let x = 0; x < 256; x += 64) {
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(x, 0, 12, 256);
      g.fillStyle = 'rgba(80,70,50,0.25)';
      g.fillRect(x + 12, 0, 4, 256);
      for (const y of [20, 148]) {
        g.fillStyle = '#4c5866';
        g.fillRect(x + 26, y + 12, 26, 88);
        g.beginPath();
        g.arc(x + 39, y + 12, 13, Math.PI, 0);
        g.fill();
      }
    }
  });
}

/** Worn New York asphalt, patched here and there. */
function asphaltTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#47484d', 171);
    const random = seeded(173);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(20,20,24,${0.15 + random() * 0.15})`;
      g.fillRect(random() * 460, random() * 460, 40 + random() * 120, 30 + random() * 90);
    }
  });
}

/** Grey sidewalk slabs, 1.5 m square (the texture covers 3 m), dotted with old gum. */
function concreteTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#b8b6b0', 179);
    g.strokeStyle = 'rgba(70,70,70,0.45)';
    g.lineWidth = 3;
    for (const p of [0, 256, 512]) {
      g.beginPath();
      g.moveTo(0, p);
      g.lineTo(512, p);
      g.moveTo(p, 0);
      g.lineTo(p, 512);
      g.stroke();
    }
    const random = seeded(181);
    g.fillStyle = 'rgba(60,60,62,0.35)';
    for (let i = 0; i < 70; i++) {
      g.beginPath();
      g.arc(random() * 512, random() * 512, 2 + random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** A 3 m white dash and a 9 m gap: a lane line, 12 m to the texture. */
function dashTexture(): CanvasTexture {
  return canvasTexture(16, 256, (g) => {
    g.fillStyle = '#f2f2ee';
    g.fillRect(0, 0, 16, 64);
  });
}

/** Scraps of fallen ticker tape and confetti, on a clear ground, 6 m to the texture. */
function litterTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    const random = seeded(191);
    const colours = ['#ffffff', '#ffffff', '#f4f0e4', '#ffffff', ORANGE, '#4d7fe0'];
    for (let i = 0; i < 240; i++) {
      g.save();
      g.translate(random() * 512, random() * 512);
      g.rotate(random() * Math.PI);
      g.fillStyle = colours[Math.floor(random() * colours.length)]!;
      g.fillRect(-4, -2, 8, 4);
      g.restore();
    }
  });
}
