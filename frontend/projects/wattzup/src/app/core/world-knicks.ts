// Knicks Championship Parade's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// lower Broadway's Canyon of Heroes on parade morning. Limestone, granite and brick towers rise
// in setbacks on both sides above barricades packed with orange-and-blue fans, ticker tape and
// streamers drift down between them, parade floats roll up the outer lanes, and the Woolworth
// Building's copper crown closes the canyon ahead.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, figures, barriers,
// banners and road paint of world-kit.ts.
import {
  BoxGeometry,
  type BufferAttribute,
  BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
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
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  barrierBannerTexture,
  type BannerPanel,
  bob,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  Figures,
  hazedMaterial,
  loopFade,
  loopMetres,
  mergeStaticGroup,
  paintTexture,
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
  readonly fall: number;
  readonly spin: readonly [number, number, number];
}

const PROP_BEHIND_CULL = -22;
const PROP_HORIZON_CULL = 318;
const SHADOW_NEAR = -20;
const SHADOW_FAR = 36;
const FLOAT_CREW_SPOTS: readonly (readonly [number, number])[] = [
  [-0.75, -5],
  [0.75, -3.9],
  [0, 4.2],
  [-0.75, 5.2],
  [0.75, 5.2],
];

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
  /** Props along the road; one that `lies` on it, as paint does, takes its slope. */
  private readonly props: {
    mesh: Group;
    offset: number;
    every: number;
    x: number;
    lies?: boolean;
    shadowMeshes: Mesh[];
    lastCast?: boolean;
  }[] = [];
  private readonly floats: { group: Group; shadowMeshes: Mesh[]; lastCast?: boolean }[] = [];
  /** The players riding the floats, built on the kit's figures. */
  private crew: Figures | null = null;
  private readonly woolworth = new Group();
  private readonly skyline = new Group();
  private tape: InstancedMesh | null = null;
  private streamers: InstancedMesh | null = null;
  private readonly pieces: Piece[] = [];
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
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.solidMat, this.hazedSolidMat, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addTowers();
    this.addLamps();
    this.addStreetBanners();
    this.addBunting();
    this.addRoadPaint();
    this.addFloats();
    this.addTickerTape();
    this.addSkyline();
    this.addWoolworth();
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
  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
      const visible = metres > PROP_BEHIND_CULL && metres <= PROP_HORIZON_CULL;
      prop.mesh.visible = visible;
      if (!visible) continue;
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
      const cast = metres > SHADOW_NEAR && metres < SHADOW_FAR;
      if (prop.lastCast !== cast) {
        prop.lastCast = cast;
        for (const sm of prop.shadowMeshes) {
          sm.castShadow = cast;
        }
      }
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.placeLampsAndBunting(heightAt, along);
    const far = heightAt(1e6);
    this.woolworth.position.set(0, far - 4, -WOOLWORTH_AHEAD);
    this.skyline.position.set(0, far - 4, 0);
    this.placeFloats(along, heightAt);
    this.placeTape(s, heightAt);
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
      for (let k = 0; k < FLOAT_CREW_SPOTS.length; k++) {
        const [dx, dz] = FLOAT_CREW_SPOTS[k]!;
        const heading =
          dx === 0 ? (x > 0 ? -Math.PI / 2 : Math.PI / 2) : dx > 0 ? -Math.PI / 2 : Math.PI / 2;
        const jump = bob(this.time * 4 + i * 1.3 + k) * 0.22;
        crew.set(
          crewSlot++,
          x + dx * shown,
          y + DECK * shown,
          -metres + dz * shown,
          heading,
          1.05 * shown,
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
    for (let i = 0; i < this.pieces.length; i++) {
      const p = this.pieces[i]!;
      const metres = loopMetres(p.offset, s, TAPE_SPAN, 12);
      const ground = heightAt(Math.max(metres, 0));
      const drop = (p.phase * TAPE_TOP + t * p.fall) % TAPE_TOP;
      const sc = wrapFade(drop, 0, TAPE_TOP, 1.5) * loopFade(metres, TAPE_SPAN, 12);
      const px = p.x + Math.sin(t * 0.9 + p.phase * 20) * 0.6;
      const py = ground + TAPE_TOP - drop;
      const pz = -metres;
      const rx = t * p.spin[0] + p.phase * 7;
      const ry = t * p.spin[1] + p.phase * 3;
      const rz = t * p.spin[2];
      const cx = Math.cos(rx);
      const sx = Math.sin(rx);
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const cz = Math.cos(rz);
      const sz = Math.sin(rz);
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
   * The canyon's walls: towers of limestone, granite, brick and glass, each with a shopfront at
   * the foot, a cornice over its base, and on many a tower set back above it under a copper
   * roof or a water tank. Some hang the parade's colours down their fronts. A cross street
   * opens now and then, so the canyon is never one wall.
   */
  private addTowers(): void {
    const facades = PALETTES.map((p, i) =>
      this.track(facadeTexture(p.wall, p.trim, p.glass, 41 + i)),
    );
    const faces = facades.map((map) => this.material({ map, roughness: 0.75 }));
    const walls = PALETTES.map((p) => this.material({ color: p.wall, roughness: 0.9 }));
    const trims = PALETTES.map((p) => this.material({ color: p.trim, roughness: 0.7 }));
    const shopfront = this.track(shopTexture());
    shopfront.wrapS = RepeatWrapping;
    const shop = this.material({ map: shopfront, roughness: 0.35, metalness: 0.2 });
    const copper = this.material({ color: 0x6fa58f, roughness: 0.6, metalness: 0.25 });
    const tar = this.material({ color: 0x2c2d30, roughness: 1 });
    const wood = this.material({ map: this.track(staveTexture()), roughness: 0.95 });
    const steel = this.material({ color: 0x3a3c40, metalness: 0.5, roughness: 0.5 });
    const drapeAtlas = this.material({
      map: this.track(drapeAtlasTexture()),
      side: DoubleSide,
      roughness: 0.85,
    });
    const pyramid = new ConeGeometry(Math.SQRT1_2, 1, 4);
    pyramid.rotateY(Math.PI / 4);
    pyramid.translate(0, 0.5, 0);
    const tank = new CylinderGeometry(1.7, 1.7, 3.6, 16);
    tank.translate(0, 1.8, 0);
    const tankRoof = new ConeGeometry(1.85, 1.4, 16);
    tankRoof.translate(0, 4.3, 0);
    const drapeCloths = DRAPES.map((_, k) => {
      const g = new PlaneGeometry(2.4, 10);
      const uv = g.getAttribute('uv') as BufferAttribute;
      const u0 = k / DRAPES.length;
      const u1 = (k + 1) / DRAPES.length;
      for (let i = 0; i < uv.count; i++) {
        uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
      }
      this.disposables.push(g);
      return g;
    });
    this.disposables.push(pyramid, tank, tankRoof);
    const block = (palette: number, depth: number, height: number, width: number) => {
      const geometry = new BoxGeometry(depth, height, width);
      scaleFaceUv(geometry, 0, width / 12, height / (4 * STOREY));
      scaleFaceUv(geometry, 4, depth / 12, height / (4 * STOREY));
      scaleFaceUv(geometry, 5, depth / 12, height / (4 * STOREY));
      this.disposables.push(geometry);
      const face = faces[palette]!;
      const wall = walls[palette]!;
      const mesh = new Mesh(geometry, [face, wall, tar, wall, face, face]);
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
        // The base, its front facing the road (+x).
        const base = block(style, depth, baseHeight, width);
        base.position.set(-depth / 2, baseHeight / 2, 0);
        building.add(base);
        // The shopfront at the foot, and the cornice and belt course of the base.
        const shopGeometry = new BoxGeometry(0.5, 4.4, width - 0.8);
        scaleFaceUv(shopGeometry, 0, width / 12, 1);
        this.disposables.push(shopGeometry);
        const store = new Mesh(shopGeometry, shop);
        store.position.set(0.25, 2.2, 0);
        building.add(store);
        const trim = trims[style]!;
        box(trim, 0.8, 0.5, width + 0.2, 0.2, 4.4);
        box(trim, 1.5, 0.9, width + 0.6, 0.45, baseHeight - 0.9);
        // A tower set back above the base, under a copper roof or a flat top and a mast.
        if (towerStoreys > 0) {
          const inset = 3 + layout() * 3;
          const towerWidth = Math.max(width - 2 * (1.5 + layout() * 3), 10);
          const towerDepth = depth - inset - 3;
          const towerHeight = towerStoreys * STOREY;
          const tower = block(style, towerDepth, towerHeight, towerWidth);
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
        // A wooden water tank on the base's roof, behind any tower.
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
        // The parade's colours hung down the front of every other tower.
        if (index % 2 === 0) {
          for (const z of [-width / 4, width / 4]) {
            const dIdx = (index / 2 + (z > 0 ? 1 : 0)) % drapeCloths.length;
            const drape = new Mesh(drapeCloths[dIdx]!, drapeAtlas);
            drape.position.set(0.2, 12, z);
            drape.rotation.y = Math.PI / 2;
            building.add(drape);
          }
        }
        mergeStaticGroup(building, this.disposables, undefined, this.solidMat);
        if (side > 0) building.rotation.y = Math.PI;
        const setback = layout() * 1.2;
        this.group.add(building);
        this.props.push({
          mesh: building,
          offset: offset + width / 2,
          every: LOOP,
          x: side * (FRONTAGE + setback),
          shadowMeshes: collectShadowMeshes(building),
        });
        offset += width + (layout() < 0.15 ? 11 : 0.3);
        index++;
      }
    }
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

  /** Cloth banners slung across the canyon on wires from tower to tower. */
  private addStreetBanners(): void {
    const cloth = new PlaneGeometry(13, 2.2);
    const wire = new BoxGeometry(FRONTAGE - 6.5, 0.04, 0.04);
    this.disposables.push(cloth, wire);
    const steel = this.material({ color: 0x2b2d31, roughness: 0.5 });
    STREET_BANNERS.forEach(([text, fill, ink], i) => {
      const banner = new Group();
      const c = new Mesh(
        cloth,
        this.material({
          map: this.track(clothBannerTexture(text, fill, ink)),
          side: DoubleSide,
          roughness: 0.8,
        }),
      );
      c.position.y = 10.5;
      c.castShadow = true;
      banner.add(c);
      for (const side of [-1, 1]) {
        const w = new Mesh(wire, steel);
        w.position.set(side * (6.5 + (FRONTAGE - 6.5) / 2), 11.4, 0);
        banner.add(w);
      }
      mergeStaticGroup(banner, this.disposables, undefined, this.solidMat);
      this.group.add(banner);
      this.props.push({
        mesh: banner,
        offset: 60 + i * 120,
        every: LOOP,
        x: 0,
        shadowMeshes: collectShadowMeshes(banner),
      });
    });
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
    const pennantMat = this.material({ vertexColors: true, side: DoubleSide, roughness: 0.8 });
    this.disposables.push(geometry);
    for (let offset = 20; offset < LOOP; offset += 40) {
      if ((offset - 60) % 120 === 0) continue;
      this.buntingOffsets.push(offset);
    }
    const cap = Math.max(1, this.buntingOffsets.length);
    this.buntingMesh = new InstancedMesh(geometry, pennantMat, cap);
    this.buntingMesh.frustumCulled = false;
    this.buntingMesh.castShadow = false;
    this.disposables.push(this.buntingMesh);
    this.group.add(this.buntingMesh);
  }

  /** What the fans have painted on the tarmac. */
  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.6, 9);
    this.disposables.push(plane);
    const byKey = new Map<string, MeshStandardMaterial>();
    [...ROAD_PAINT, ...ROAD_PAINT].forEach(([text, colour, x], i) => {
      const key = `${text}|${colour}`;
      let mat = byKey.get(key);
      if (!mat) {
        mat = this.material({
          map: this.track(paintTexture(text, colour)),
          alphaTest: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          roughness: 0.7,
        });
        byKey.set(key, mat);
      }
      const mesh = new Mesh(plane, mat);
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
        shadowMeshes: [],
      });
    });
  }

  /**
   * The parade floats: a blue tractor unit pulling a flatbed skirted in the parade's colours,
   * carrying a giant basketball, a gold trophy or a champions' board, balloons tied above and
   * the players dancing on the deck.
   */
  private addFloats(): void {
    const cab = this.material({ color: BLUE, roughness: 0.35, metalness: 0.3 });
    const glass = this.material({ color: 0x1c2630, roughness: 0.1, metalness: 0.5 });
    const deck = this.material({ color: 0xf2efe6, roughness: 0.8 });
    const chassis = this.material({ color: 0x15171b, roughness: 0.6 });
    const ball = this.material({ map: this.track(ballTexture()), roughness: 0.75 });
    const gold = this.material({ color: 0xe2b23c, metalness: 0.9, roughness: 0.28 });
    const skirts = [
      ['NEW YORK CHAMPIONS', ORANGE, '#ffffff'],
      ['KNICKS', BLUE, ORANGE],
    ].map(([text, fill, ink]) =>
      this.material({
        map: this.track(clothBannerTexture(text!, fill!, ink!)),
        side: DoubleSide,
        roughness: 0.8,
      }),
    );
    const board = this.material({
      map: this.track(clothBannerTexture('KNICKS CHAMPIONS', BLUE, ORANGE)),
      side: DoubleSide,
      roughness: 0.6,
    });
    const balloons = [ORANGE, BLUE, '#ffffff'].map((c) =>
      this.material({ color: c, roughness: 0.3 }),
    );
    const sphere = new SphereGeometry(1, 28, 18);
    const cup = new CylinderGeometry(1, 0.45, 1.8, 24);
    cup.translate(0, 0.9, 0);
    const stem = new CylinderGeometry(0.22, 0.32, 1.6, 12);
    stem.translate(0, 0.8, 0);
    const foot = new CylinderGeometry(0.9, 1.05, 0.9, 20);
    foot.translate(0, 0.45, 0);
    const skirt = new PlaneGeometry(11.6, 1.3);
    const sign = new PlaneGeometry(8.5, 2.4);
    this.disposables.push(sphere, cup, stem, foot, skirt, sign);
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
        const s = new Mesh(skirt, skirts[i % skirts.length]!);
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
        const s = new Mesh(sign, board);
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
    this.crew = new Figures(
      this.group,
      this.disposables,
      FLOATS * CREW,
      { tops: [BLUE, ORANGE, '#ffffff'], bottoms: [BLUE, '#ffffff', ORANGE], skins: SKINS },
      131,
      false,
    );
  }

  /** Ticker tape and streamers falling through the canyon, white with the parade's colours. */
  private addTickerTape(): void {
    const scrap = new PlaneGeometry(0.2, 0.12);
    const ribbon = new PlaneGeometry(0.05, 1.5);
    const make = (geometry: PlaneGeometry, count: number, colours: readonly string[]) => {
      const material = new MeshStandardMaterial({ side: DoubleSide, roughness: 0.8 });
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.frustumCulled = false;
      const random = seeded(count);
      const c = new Color();
      for (let i = 0; i < count; i++)
        mesh.setColorAt(i, c.set(colours[Math.floor(random() * colours.length)]!));
      this.group.add(mesh);
      this.disposables.push(geometry, material, mesh);
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
    const random = seeded(137);
    for (let i = 0; i < TAPE + STREAMERS; i++) {
      const streamer = i >= TAPE;
      this.pieces.push({
        x: (random() * 2 - 1) * (FRONTAGE - 0.5),
        offset: random() * TAPE_SPAN,
        phase: random(),
        fall: streamer ? 0.5 + random() * 0.3 : 0.8 + random() * 0.6,
        spin: streamer
          ? [0.2 + random() * 0.2, 0.8 + random() * 1.2, 0.2 + random() * 0.3]
          : [1 + random() * 2, 1 + random() * 2, 1 + random() * 2],
      });
    }
  }

  /** The canyon running on past the street's loop into the haze: plainer towers, further off. */
  private addSkyline(): void {
    const random = seeded(149);
    const tones = ['#b9b4aa', '#9a978f', '#8c6b58', '#c4b393', '#7d838c'].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
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
    const plain = hazedMaterial(this.disposables, haze, 0xe9e1cd, 0.16);
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
    // The base's corner turrets under copper caps.
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

/**
 * Four bays and four storeys of a tower's front: punched windows in stone surrounds, some
 * with their blinds part-drawn, or for a glass tower a curtain wall over dark spandrels.
 */
function facadeTexture(wall: string, trim: string, glass: boolean, seed: number): CanvasTexture {
  const texture = canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, wall, seed);
    const random = seeded(seed + 1);
    for (let row = 0; row < 4; row++) {
      for (let bay = 0; bay < 4; bay++) {
        const x = bay * 128;
        const y = row * 128;
        if (glass) {
          const pane = g.createLinearGradient(0, y, 0, y + 100);
          pane.addColorStop(0, '#a9c2d8');
          pane.addColorStop(0.6, '#47627b');
          pane.addColorStop(1, '#2b3d4f');
          g.fillStyle = pane;
          g.fillRect(x + 3, y + 3, 122, 96);
          g.fillStyle = trim;
          g.fillRect(x, y, 3, 128);
          continue;
        }
        g.fillStyle = trim;
        g.fillRect(x + 30, y + 20, 68, 92);
        const pane = g.createLinearGradient(0, y + 25, 0, y + 107);
        pane.addColorStop(0, '#93aec4');
        pane.addColorStop(1, '#27333f');
        g.fillStyle = pane;
        g.fillRect(x + 35, y + 25, 58, 82);
        if (random() < 0.35) {
          g.fillStyle = 'rgba(236,229,212,0.9)';
          g.fillRect(x + 35, y + 25, 58, 10 + random() * 40);
        }
        g.fillStyle = trim;
        g.fillRect(x + 62, y + 25, 4, 82);
        g.fillRect(x + 35, y + 62, 58, 4);
        g.fillStyle = 'rgba(0,0,0,0.28)';
        g.fillRect(x + 28, y + 112, 72, 5);
      }
    }
  });
  texture.wrapS = RepeatWrapping;
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
      // A poster for the champions in some windows.
      if (random() < 0.6) {
        g.fillStyle = random() < 0.5 ? ORANGE : BLUE;
        g.fillRect(x + 30 + random() * 40, 90, 30, 42);
      }
    }
  });
}

/** Cloth drapes hung down tower fronts, packed side by side into one 3-column atlas. */
function drapeAtlasTexture(): CanvasTexture {
  const colW = 128;
  return canvasTexture(colW * DRAPES.length, 512, (g) => {
    DRAPES.forEach(([word, fill, ink], col) => {
      const x0 = col * colW;
      g.fillStyle = fill;
      g.fillRect(x0, 0, colW, 512);
      g.fillStyle = ink;
      g.fillRect(x0, 0, colW, 14);
      g.fillRect(x0, 498, colW, 14);
      g.font = 'bold 84px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const letters = word.split('');
      const step = 460 / Math.max(letters.length, 3);
      const start = 256 - (step * letters.length) / 2;
      letters.forEach((c, i) => g.fillText(c, x0 + 64, start + step * (i + 0.5)));
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

/** The wooden staves of a rooftop water tank, bound with iron hoops. */
function staveTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a5a3e', 167);
    g.fillStyle = 'rgba(40,25,15,0.4)';
    for (let x = 0; x < 128; x += 10) g.fillRect(x, 0, 2, 128);
    g.fillStyle = '#2c2d30';
    for (const y of [18, 62, 106]) g.fillRect(0, y, 128, 4);
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
