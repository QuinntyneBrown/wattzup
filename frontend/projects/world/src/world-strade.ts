// Strade Bianche, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// a white gravel road of the Crete Senesi on race day, closed for the ride. Dark cypresses line
// it on the banks above the tifosi at the barriers, olive groves and stone farmhouses with their
// dovecote towers stand on the golden fields either side, and dust drifts low over the gravel.
// Ahead, the rolling Tuscan hills fold away to Siena on its ridge: the Torre del Mangia rising
// over the brick town beside the Duomo's striped campanile and dome.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags, road paint, mist and box builder of world-kit.ts.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
  Vector2,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  barrierBannerTexture,
  type BannerPanel,
  BoxBuilder,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  hazedMaterial,
  loopMetres,
  Mist,
  paintedRows,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  slopeAt,
  speckle,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 30;
const KERB = 0.05;
const BARRIER = 4.6;
const CROWD_NEAR = 5.2;
const CROWD_FAR = 7.6;
/** The cypresses stand on the top of the banks, this far off the crown. */
const CYPRESS_X = 12.5;
const CYPRESS_EVERY = 9;
/** The ground's cross-section either side: the dusty verge, the bank, the fields, the hills. */
const PROFILE: readonly (readonly [number, number])[] = [
  [8, 0.05],
  [12, 1.2],
  [60, 3.2],
  [420, 9],
];
/**
 * The farmhouses: how far along the loop, which side, and how far off the crown. One stands close
 * to the road on the left in the opening view, its dovecote tower over the tifosi's heads.
 */
const FARMS: readonly (readonly [number, -1 | 1, number])[] = [
  [30, 1, 40],
  [178, -1, 25],
  [255, 1, 44],
  [340, -1, 38],
  [430, 1, 46],
];
/** The horizon this far ahead. */
const AHEAD = 280;
const HAZE = 0xe6dcc4;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** The tifosi on the banks: club jerseys, the pink of the Giro, caps and summer shirts. */
const TIFOSI: Wardrobe = {
  tops: [
    '#ffffff',
    '#f080a8',
    '#1d3c8f',
    '#d22630',
    '#1f8a3a',
    '#f2c230',
    '#111111',
    '#7ab8e8',
    '#e8d8b8',
    '#f4f0e8',
  ],
  bottoms: ['#20242b', '#3a5a8a', '#c8b89a', '#f4ece0', '#5a4a3a', '#111111'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#111111', ink: '#ffffff', text: 'STRADE BIANCHE' },
  { fill: '#ffffff', ink: '#111111', text: 'SIENA' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#f080a8', ink: '#111111', text: 'TOSCANA' },
  { fill: '#111111', ink: '#f2c230', text: 'SETTORE 8' },
  { fill: '#1f8a3a', ink: '#ffffff', text: 'FORZA!' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['SETTORE 8 · MONTE SANTE MARIE ★★★★★', '#111111', '#ffffff', 104],
  ['STRADE BIANCHE · WATTZUP', '#ffffff', '#111111', 300],
];
const FEATHERS: readonly FeatherWord[] = [
  ['STRADE BIANCHE', '#111111', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['SIENA', '#ffffff', '#111111'],
  ['SETTORE 8', '#f080a8', '#111111'],
];
const FEATHER_EVERY = 18;
/** The names and cries the tifosi paint on the gravel, dark on the white. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['FORZA', '#1b1e24'],
  ['VAI ANA', '#d22630'],
  ['GO MAYA', '#1d3c8f'],
  ['ALLEZ JONAS', '#1b1e24'],
  ['TIFOSI', '#1f8a3a'],
  ['SOPHIE!', '#c83a78'],
  ['KENJI', '#1d3c8f'],
  ['RAVI!', '#d22630'],
  ['DAI DAI', '#1b1e24'],
  ['SIENA', '#1f8a3a'],
];
/** Slogans painted big across the gravel. */
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['STRADE BIANCHE', '#1b1e24'],
  ['FORZA', '#d22630'],
  ['WATTZUP', '#1d3c8f'],
  ['SETTORE 8', '#1b1e24'],
];
const ROAD_PAINT_EVERY = 8;

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

/** How high the ground stands `x` metres off the crown, on the profile either side. */
function rise(x: number): number {
  const a = Math.abs(x);
  if (a <= PROFILE[0]![0]) return PROFILE[0]![1];
  for (let i = 1; i < PROFILE.length; i++) {
    const [x1, y1] = PROFILE[i]!;
    const [x0, y0] = PROFILE[i - 1]!;
    if (a <= x1) return y0 + ((a - x0) / (x1 - x0)) * (y1 - y0);
  }
  return PROFILE[PROFILE.length - 1]![1];
}

export class StradeStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly dust: Mist;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  /** The dust clouds raised over the gravel up the road, each billowing on its own phase. */
  private readonly puffs: { mesh: Mesh; size: number; phase: number }[] = [];
  private time = 0;
  private readonly flagMaterials = ['#1f8a3a', '#ffffff', '#d22630', '#111111'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // The tifosi along the barriers, in knots with gaps so the banks show between them.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.7,
      wardrobe: TIFOSI,
      flags: this.flagMaterials,
      flagShare: 0.2,
      seeds: [4911, 4917],
      skip: (_side, offset) => offset % 30 < 9,
      armsUp: 0.15,
    });
    // Dust raised by the race, drifting low over the gravel and hazing the hills.
    this.dust = new Mist(this.group, disposables, track, {
      colour: 0xeee4cc,
      loop: LOOP,
      curtains: [{ ahead: 1300, height: 120, opacity: 0.35 }],
      banks: 4,
      bankX: (k) => (k % 2 ? 1 : -1) * (26 + (k % 3) * 8),
    });
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.dust.build();
    this.addCypresses();
    this.addOlives();
    this.addFarmhouses();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addDust();
    this.addHills();
    this.addSiena();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
    // The dust billows and drifts a little downwind as it hangs.
    for (const puff of this.puffs) {
      const swell = 1 + Math.sin(seconds * 0.7 + puff.phase) * 0.12;
      puff.mesh.scale.set(puff.size * swell, puff.size * 0.55 * swell, 1);
      puff.mesh.position.x = puff.mesh.userData['x'] + Math.sin(seconds * 0.3 + puff.phase) * 0.6;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 12;
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB, -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.dust.place(this.time, heightAt, along, rise);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The white gravel over the road, the dusty verges, the grass banks rising to the cypresses,
   * the golden fields beyond, and the barriers with their banners.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf + 0.25;
    const gravelMap = this.track(gravelTexture());
    gravelMap.wrapS = RepeatWrapping;
    gravelMap.wrapT = RepeatWrapping;
    gravelMap.repeat.set(1 / (2 * r), 1 / 6);
    const gravel = this.material({
      map: gravelMap,
      color: 0xfff6e6,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, gravel, [
      [r, 0.006],
      [-r, 0.006],
    ]);
    const verge = this.material({ map: this.repeat(vergeTexture(), 4, 4), roughness: 1 });
    const bank = this.material({ map: this.repeat(bankTexture(), 5, 5), roughness: 1 });
    const field = this.material({ map: this.repeat(fieldTexture(), 24, 24), roughness: 1 });
    const far = this.material({ color: 0xc8b070, roughness: 1 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      const [p0, p1, p2, p3] = PROFILE;
      this.ribbons.add(points, verge, order([at(p0![0], p0![1]), at(r, 0.006)]));
      this.ribbons.add(points, bank, order([at(p1![0], p1![1]), at(p0![0], p0![1])]));
      this.ribbons.add(points, field, order([at(p2![0], p2![1]), at(p1![0], p1![1])]));
      this.ribbons.add(points, far, order([at(p3![0], p3![1]), at(p2![0], p2![1])]));
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

  /**
   * The Tuscan cypresses lining the road on top of the banks: tall dark spindles, widest a third
   * of the way up and drawn to a point, a gap here and there where a farm track turns off.
   */
  private addCypresses(): void {
    const geometry = cypressGeometry();
    this.disposables.push(geometry);
    const foliage = this.material({ map: this.track(cypressTexture()), roughness: 1 });
    const random = seeded(4921);
    for (const side of [-1, 1] as const) {
      for (let offset = side > 0 ? 4 : 0; offset < LOOP; offset += CYPRESS_EVERY) {
        // Avenues of cypresses with open stretches between, where the hills show.
        if ((offset + (side > 0 ? 40 : 0)) % 160 > 75) continue;
        const tree = new Mesh(geometry, foliage);
        tree.castShadow = true;
        tree.scale.set(1 + random() * 0.2, 0.85 + random() * 0.35, 1 + random() * 0.2);
        tree.rotation.y = random() * 6.3;
        const x = side * (CYPRESS_X + random() * 0.8);
        tree.position.y = rise(x) - KERB - 0.2;
        const holder = new Group();
        holder.add(tree);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset: offset + random() * 1.5, x });
      }
    }
  }

  /** Olive groves on the fields beyond the cypresses, silver-green crowns in loose rows. */
  private addOlives(): void {
    const random = seeded(4931);
    const bark = this.material({ color: 0x5a4a3a, roughness: 1 });
    const silver = this.material({ color: 0x8a9a6a, roughness: 1, flatShading: true });
    const CHUNK = 40;
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += CHUNK) {
        if ((offset / CHUNK + (side > 0 ? 1 : 0)) % 3 === 0) continue;
        // No grove on a farmhouse's plot.
        if (FARMS.some(([at, s]) => s === side && at > offset - 14 && at < offset + CHUNK + 14)) {
          continue;
        }
        const trunks: BufferGeometry[] = [];
        const crowns: BufferGeometry[] = [];
        for (let row = 0; row < 4; row++) {
          for (let along = 2; along < CHUNK; along += 6) {
            const x = side * (16 + row * 6 + random() * 1.5);
            const z = -(along + random() * 1.5);
            const y = rise(x) - KERB;
            const s = 0.8 + random() * 0.4;
            const trunk = new CylinderGeometry(0.12 * s, 0.22 * s, 1.8 * s, 5);
            trunk.translate(x, y + 0.9 * s, z);
            const crown = new DodecahedronGeometry(1.5 * s, 0);
            crown.scale(1.2, 0.8, 1.2);
            crown.rotateY(random() * 6);
            crown.translate(x, y + 2.3 * s, z);
            trunks.push(trunk);
            crowns.push(crown);
          }
        }
        const holder = new Group();
        for (const [list, material] of [
          [trunks, bark],
          [crowns, silver],
        ] as const) {
          const merged = mergeGeometries(list.map((g) => g.toNonIndexed()))!;
          list.forEach((g) => g.dispose());
          this.disposables.push(merged);
          const mesh = new Mesh(merged, material);
          mesh.castShadow = true;
          holder.add(mesh);
        }
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: 0 });
      }
    }
  }

  /**
   * Stone farmhouses on the fields, the casali of the Crete: two floors of warm stone under
   * low terracotta roofs, green shutters, an outside stair, and a square dovecote tower.
   */
  private addFarmhouses(): void {
    const random = seeded(4941);
    const stone = this.material({ map: this.track(stoneTexture()), roughness: 0.95 });
    const tiles = this.material({ color: 0xb4583a, roughness: 0.85 });
    const shutters = this.material({ color: 0x3a5a3a, roughness: 0.8 });
    for (const [offset, side, off] of FARMS) {
      const house = new Group();
      const b = new BoxBuilder();
      const w = 12 + random() * 6;
      const d = 9 + random() * 3;
      const tall = 6.4;
      const box = new BoxGeometry(d, tall, w);
      for (const f of [0, 1]) scaleFaceUv(box, f, w / 4, tall / 4);
      for (const f of [4, 5]) scaleFaceUv(box, f, d / 4, tall / 4);
      box.translate(0, tall / 2, 0);
      this.disposables.push(box);
      house.add(new Mesh(box, stone));
      // The dovecote tower at one end, a floor above the roof.
      const tower = new BoxGeometry(4, tall + 4, 4);
      for (const f of [0, 1, 4, 5]) scaleFaceUv(tower, f, 1, (tall + 4) / 4);
      tower.translate(0, (tall + 4) / 2, w / 2 - 2);
      this.disposables.push(tower);
      house.add(new Mesh(tower, stone));
      // Shutters on the side toward the road.
      for (let z = -w / 2 + 1.6; z < w / 2 - 4; z += 2.4) {
        for (const y of [1.6, 4.6])
          b.box(shutters, [0.12, 1.3, 0.9], [-side * (d / 2 + 0.05), y, z]);
      }
      house.add(b.build(this.disposables));
      const roof = new ConeGeometry(1, 1, 4, 1);
      roof.rotateY(Math.PI / 4);
      this.disposables.push(roof);
      const main = new Mesh(roof, tiles);
      main.scale.set((d / 2) * 1.5, 2.2, (w / 2) * 1.45);
      main.position.y = tall + 1.1;
      const cap = new Mesh(roof, tiles);
      cap.scale.set(3.2, 1.6, 3.2);
      cap.position.set(0, tall + 4.8, w / 2 - 2);
      house.add(main, cap);
      house.children.forEach((c) => (c.castShadow = true));
      const x = side * off;
      house.position.y = rise(x) - KERB - 0.3;
      house.rotation.y = (random() - 0.5) * 0.4;
      const holder = new Group();
      holder.add(house);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
      // A short avenue of cypresses up the farm track toward the house.
      const geometry = cypressGeometry();
      this.disposables.push(geometry);
      const foliage = this.material({ map: this.track(cypressTexture()), roughness: 1 });
      for (let k = 0; 14 + k * 4.5 < off - 7; k++) {
        const tx = side * (14 + k * 4.5);
        const tree = new Mesh(geometry, foliage);
        tree.scale.setScalar(0.8 + random() * 0.2);
        tree.position.set(tx, rise(tx) - KERB - 0.2, 0);
        const h = new Group();
        h.add(tree);
        this.group.add(h);
        this.props.push({ mesh: h, offset: offset + 8, x: 0 });
      }
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
      const c = new Mesh(
        cloth,
        this.material({
          map,
          emissive: 0xffffff,
          emissiveMap: map,
          emissiveIntensity: 0.3,
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

  /** The tifosi's names and cries painted dark on the white gravel, slogans right across it. */
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
   * Clouds of pale dust over the gravel up the road, raised by the riders ahead: soft billows
   * low over the white road and drifting onto the verges, hanging where a group has just passed.
   */
  private addDust(): void {
    const material = new MeshBasicMaterial({
      color: 0xf2e4c4,
      map: this.track(dustTexture()),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const plane = new PlaneGeometry(1, 1);
    plane.translate(0, 0.42, 0);
    this.disposables.push(material, plane);
    const random = seeded(5031);
    for (const offset of [138, 156, 172, 205, 260, 320, 390, 450]) {
      const cloud = new Group();
      for (let k = 0; k < 7; k++) {
        const puff = new Mesh(plane, material);
        const size = 4 + random() * 6;
        const x = (random() - 0.5) * 9;
        puff.userData['x'] = x;
        puff.position.set(x, 0, -random() * 14);
        puff.renderOrder = 1;
        cloud.add(puff);
        this.puffs.push({ mesh: puff, size, phase: random() * 6.3 });
      }
      this.group.add(cloud);
      this.props.push({ mesh: cloud, offset, x: 0 });
    }
    this.setTime(this.time);
  }

  /**
   * The Crete Senesi folding away to the horizon: rolling ridges in layers, golden and green near,
   * paling to blue-grey far off, cypresses in lines along their crests and farmhouses on them.
   */
  private addHills(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const random = seeded(4951);
    const ridge = (
      from: number,
      to: number,
      high: number,
      z: number,
      colour: number,
      amount: number,
    ) => {
      const shape = new Shape();
      shape.moveTo(from, -20);
      const steps = Math.round((to - from) / 20);
      const phase = random() * 6;
      const crest: [number, number][] = [];
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        // Each ridge slopes down into the fields at its ends rather than stopping in a sheer wall.
        const ends = Math.min(1, (u * (to - from)) / 120, ((1 - u) * (to - from)) / 120);
        const y =
          high *
            (0.55 + 0.25 * Math.sin(5 * u + phase) + 0.2 * Math.sin(13 * u + 2 * phase)) *
            Math.sin((ends * Math.PI) / 2) -
          (1 - ends) * 12;
        const x = from + (to - from) * u;
        shape.lineTo(x, y);
        crest.push([x, y]);
      }
      shape.lineTo(to, -20);
      shape.closePath();
      const geometry = new ExtrudeGeometry(shape, { depth: 60, bevelEnabled: false });
      geometry.translate(0, 0, z - 30);
      this.disposables.push(geometry);
      h.add(new Mesh(geometry, hazedMaterial(this.disposables, haze, colour, amount)));
      return crest;
    };
    const cone = new ConeGeometry(1, 1, 7);
    cone.translate(0, 0.5, 0);
    this.disposables.push(cone);
    const dark = hazedMaterial(this.disposables, haze, 0x2a3a22, 0.35);
    const layers: [number, number, number, number, number, number][] = [
      [-1600, 1600, 190, -1500, 0x9aa0a8, 0.6],
      [-1500, 1500, 150, -1050, 0xb0a888, 0.5],
      [-1400, -60, 140, -620, 0xc8b070, 0.3],
      [160, 1400, 150, -560, 0xb8b068, 0.3],
      [-900, -120, 90, -260, 0xd0b468, 0.2],
      [120, 900, 80, -220, 0xa8a860, 0.2],
    ];
    for (const [from, to, high, z, colour, amount] of layers) {
      const crest = ridge(from, to, high, z, colour, amount);
      if (z < -1000) continue;
      // A line of cypresses along a stretch of the crest.
      const start = Math.floor(random() * (crest.length - 12));
      for (let k = start; k < start + 10; k++) {
        const [x, y] = crest[k]!;
        const tree = new Mesh(cone, dark);
        tree.scale.set(2.2, 14, 2.2);
        tree.position.set(x, y - 1, z + 20);
        h.add(tree);
      }
    }
  }

  /**
   * Siena on its ridge at the end of the road: the brick town packed along the crest under
   * terracotta roofs, the slender Torre del Mangia with its white stone crown rising over the
   * Palazzo Pubblico, and the Duomo's black-and-white striped campanile beside its dome.
   */
  private addSiena(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const amount = 0.22;
    const z0 = -420;
    const x0 = 40;
    // The ridge the city stands on.
    const hill = new Mesh(
      new SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      hazedMaterial(this.disposables, haze, 0xa89a60, amount),
    );
    this.disposables.push(hill.geometry);
    hill.scale.set(520, 46, 160);
    hill.position.set(x0, -6, z0);
    h.add(hill);
    const top = (x: number, z: number) =>
      46 * Math.sqrt(Math.max(0, 1 - ((x - x0) / 520) ** 2 - ((z - z0) / 160) ** 2)) - 6;
    // The town: brick and ochre houses packed along the crest under terracotta roofs.
    const walls = [0xb8704a, 0xc88a5a, 0xd8a878, 0xa86040, 0xd09468].map((c) =>
      hazedMaterial(this.disposables, haze, c, amount),
    );
    const roofs = hazedMaterial(this.disposables, haze, 0xa04a30, amount);
    const box = new BoxGeometry(1, 1, 1);
    const roof = new ConeGeometry(0.75, 1, 4);
    roof.rotateY(Math.PI / 4);
    this.disposables.push(box, roof);
    const random = seeded(4961);
    for (let k = 0; k < 150; k++) {
      const x = x0 - 300 + random() * 600;
      const z = z0 - 60 + random() * 120;
      const ground = top(x, z);
      if (ground < 4) continue;
      const tall = 10 + random() * 14;
      const w = 10 + random() * 14;
      const d = 10 + random() * 12;
      const block = new Mesh(box, walls[k % walls.length]!);
      block.scale.set(w, tall, d);
      block.position.set(x, ground + tall / 2 - 2, z);
      const cap = new Mesh(roof, roofs);
      cap.scale.set(w, 4, d);
      cap.position.set(x, ground + tall - 2 + 2, z);
      h.add(block, cap);
    }
    const brick = hazedMaterial(this.disposables, haze, 0xa85a3a, amount * 0.8);
    const travertine = hazedMaterial(this.disposables, haze, 0xf2ece0, amount * 0.8);
    // The Palazzo Pubblico, long and crenellated, and the Torre del Mangia over it.
    const px = x0 - 20;
    const foot = top(px, z0 + 40);
    const palazzo = new Mesh(box, brick);
    palazzo.scale.set(70, 30, 18);
    palazzo.position.set(px, foot + 13, z0 + 40);
    h.add(palazzo);
    for (let k = -32; k <= 32; k += 4) {
      const merlon = new Mesh(box, brick);
      merlon.scale.set(2.2, 2.4, 18);
      merlon.position.set(px + k, foot + 29.2, z0 + 40);
      h.add(merlon);
    }
    // The tower at the palazzo's west corner, over the road's end.
    const tx = px - 32;
    const shaft = new Mesh(box, brick);
    shaft.scale.set(8, 92, 8);
    shaft.position.set(tx, foot + 44, z0 + 40);
    const crown = new Mesh(box, travertine);
    crown.scale.set(11, 8, 11);
    crown.position.set(tx, foot + 94, z0 + 40);
    const belfry = new Mesh(box, travertine);
    belfry.scale.set(6, 10, 6);
    belfry.position.set(tx, foot + 103, z0 + 40);
    const spire = new Mesh(roof, travertine);
    spire.scale.set(5, 6, 5);
    spire.position.set(tx, foot + 111, z0 + 40);
    h.add(shaft, crown, belfry, spire);
    // The Duomo: its dome and lantern, and the striped campanile beside it.
    const dx = x0 - 120;
    const dfoot = top(dx, z0);
    const nave = new Mesh(box, travertine);
    nave.scale.set(60, 30, 26);
    nave.position.set(dx, dfoot + 13, z0);
    const dome = new Mesh(
      new SphereGeometry(13, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      hazedMaterial(this.disposables, haze, 0x6a7078, amount),
    );
    this.disposables.push(dome.geometry);
    dome.position.set(dx + 8, dfoot + 32, z0);
    const lantern = new Mesh(box, travertine);
    lantern.scale.set(4, 9, 4);
    lantern.position.set(dx + 8, dfoot + 48, z0);
    const stripes = this.track(stripeTexture());
    stripes.wrapT = RepeatWrapping;
    const banded = hazedMaterial(this.disposables, haze, 0xffffff, amount * 0.8, { map: stripes });
    const campanile = new BoxGeometry(9, 76, 9);
    for (const f of [0, 1, 4, 5]) scaleFaceUv(campanile, f, 1, 14);
    this.disposables.push(campanile);
    const bell = new Mesh(campanile, banded);
    bell.position.set(dx - 30, dfoot + 36, z0 + 6);
    const pyramid = new Mesh(roof, travertine);
    pyramid.scale.set(10, 9, 10);
    pyramid.position.set(dx - 30, dfoot + 78.5, z0 + 6);
    h.add(nave, dome, lantern, bell, pyramid);
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

/** A Tuscan cypress, 11 m tall: a short trunk under a spindle widest a third of the way up. */
function cypressGeometry(): LatheGeometry {
  const outline = [
    new Vector2(0.001, 0),
    new Vector2(0.25, 0),
    new Vector2(0.25, 0.6),
    new Vector2(0.75, 1.2),
    new Vector2(1.05, 3.2),
    new Vector2(0.95, 5.6),
    new Vector2(0.62, 8.2),
    new Vector2(0.28, 10.2),
    new Vector2(0.001, 11.2),
  ];
  return new LatheGeometry(outline, 10);
}

/** A cypress's dense dark-green scale foliage, flecked lighter and darker. */
function cypressTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#2c4426', 4971);
    const random = seeded(4973);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(80,110,60,0.5)' : 'rgba(10,24,10,0.5)';
      g.fillRect(random() * 64, random() * 128, 3, 6);
    }
  });
}

/**
 * The white gravel, the road's width across: two compacted wheel tracks, loose stones heaped
 * between and at the edges, and pebbles everywhere.
 */
function gravelTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#ece6d8', 4981);
    // The compacted tracks, a shade darker and smoother.
    for (const x of [58, 186]) {
      const track = g.createLinearGradient(x - 26, 0, x + 26, 0);
      track.addColorStop(0, 'rgba(200,188,166,0)');
      track.addColorStop(0.5, 'rgba(200,188,166,0.55)');
      track.addColorStop(1, 'rgba(200,188,166,0)');
      g.fillStyle = track;
      g.fillRect(x - 26, 0, 52, 256);
    }
    const random = seeded(4983);
    for (let i = 0; i < 2600; i++) {
      const x = random() * 256;
      const y = random() * 256;
      const shade = 150 + Math.floor(random() * 105);
      g.fillStyle = `rgba(${shade},${shade - 6},${shade - 18},0.8)`;
      g.fillRect(x, y, 1 + random() * 3, 1 + random() * 2.5);
    }
  });
}

/** The dusty verge: dry grass whitened with the gravel's dust. */
function vergeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#c8c0a0', 4991);
    const random = seeded(4993);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = random() < 0.6 ? 'rgba(130,140,80,0.6)' : 'rgba(230,224,206,0.7)';
      g.fillRect(random() * 128, random() * 128, 1.5, 3 + random() * 4);
    }
  });
}

/** The grass banks: green and gold with poppies in it. */
function bankTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a8a48', 5001);
    const random = seeded(5003);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(170,160,80,0.6)' : 'rgba(70,90,40,0.6)';
      g.fillRect(random() * 128, random() * 128, 1.5, 3 + random() * 5);
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = '#d23a2a';
      g.fillRect(random() * 128, random() * 128, 2.5, 2.5);
    }
  });
}

/** The fields: golden wheat and green, in long ploughed strips. */
function fieldTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const bands = ['#d0b060', '#c4a858', '#a8a85a', '#d8bc70', '#b89a50', '#9aa058'];
    for (let x = 0; x < 256; x += 32) {
      g.fillStyle = bands[(x / 32) % bands.length]!;
      g.fillRect(x, 0, 32, 256);
    }
    const random = seeded(5011);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(255,240,190,0.25)' : 'rgba(80,70,30,0.2)';
      g.fillRect(random() * 256, random() * 256, 1, 4);
    }
  });
}

/** The farmhouses' warm stone, laid in rough courses. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#c8a882', 5021);
    g.strokeStyle = 'rgba(110,86,60,0.45)';
    g.lineWidth = 1.5;
    const random = seeded(5023);
    for (let y = 0; y < 128; y += 12) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(128, y);
      g.stroke();
      for (let x = random() * 20; x < 128; x += 14 + random() * 14) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 12);
        g.stroke();
      }
    }
    // Two small windows.
    g.fillStyle = '#3a3028';
    g.fillRect(28, 44, 14, 20);
    g.fillRect(86, 44, 14, 20);
  });
}

/** The Duomo campanile's bands of white and dark green-black marble. */
function stripeTexture(): CanvasTexture {
  return canvasTexture(16, 64, (g) => {
    g.fillStyle = '#f4f0e8';
    g.fillRect(0, 0, 16, 64);
    g.fillStyle = '#22262a';
    g.fillRect(0, 32, 16, 32);
  });
}

/** A billow of dust: a soft round cloud, densest low and fading at its rim, with lumps in it. */
function dustTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    const random = seeded(5033);
    for (let i = 0; i < 26; i++) {
      // Every billow stays inside the canvas, so no puff shows a straight edge.
      const r = 12 + random() * 18;
      const x = 64 + (random() - 0.5) * (124 - 2 * r);
      const y = Math.min(124 - r, 54 + random() * 46);
      const blob = g.createRadialGradient(x, y, 0, x, y, r);
      blob.addColorStop(0, 'rgba(255,255,255,0.32)');
      blob.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = blob;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  });
}
