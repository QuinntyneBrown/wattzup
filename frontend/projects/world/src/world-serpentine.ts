// The Serpentine in Hyde Park, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// lakeside road along the lake's north bank on a summer morning, closed for the ride. On the left
// a gravel footpath with black lamp posts and park benches runs along the stone edge of the lake,
// where swans drift and rowing boats pull past the boathouse and its jetty; on the right the lawns
// run back under London plane trees, set with green-and-white striped deckchairs and crossed by a
// path where joggers run. Ahead the five stone arches of the Serpentine Bridge cross the lake, the
// road passing under the last of them, with Kensington Gardens' trees and the Albert Memorial's
// gilded spire beyond.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, figures, barriers,
// banners, feather flags and road paint of world-kit.ts.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import {
  barrierBannerTexture,
  type BannerPanel,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  dashTexture,
  FeatherFlags,
  type FeatherWord,
  Figures,
  hazedMaterial,
  loopMetres,
  Mist,
  paintTexture,
  PopupTents,
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
const LOOP = 500;
const BEHIND = 30;
const KERB = 0.12;
/** Race barriers line the road; the fans stand in knots behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.4;
/** The footpath on the lake side ends at the stone edge, which drops to the water. */
const EDGE = 7.2;
/** The lake lies this far below the road. */
const WATER = 0.6;
/** The far bank of the lake, across the water on the left. */
const FAR_BANK = 130;
/** The path across the lawns on the right, where the joggers run. */
const LAWN_PATH = 16;
/** The boathouse and its jetty, once a lap on the lake side, in the opening view. */
const BOATHOUSE = 150;
/** The gardens and the town beyond the lake stand this far ahead, hazed by hand. */
const BRIDGE_AHEAD = 240;
/** The Serpentine Bridge stands nearer, the road passing under its last arch. */
const BRIDGE_AT = 175;
const HAZE = 0xd6dde2;
/** The morning mist off the water, warmed by the low sun. */
const MIST = 0xeee6d6;
const JOGGERS = 22;
const SWANS = 18;
const BOATS = 12;
const DECKCHAIRS = 70;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
const LOCALS: Wardrobe = {
  tops: [
    '#c8102e',
    '#1d2f5c',
    '#f2efe6',
    '#1f5a3a',
    '#f2b134',
    '#3a3f47',
    '#7a3e9d',
    '#5aa0d0',
    '#111111',
    '#e86a5a',
  ],
  bottoms: ['#2a3140', '#1e2530', '#3b4a5c', '#c9b48a', '#20242b', '#4a4f57'],
  skins: SKINS,
};
const ACTIVEWEAR: Wardrobe = {
  tops: ['#ff5d8f', '#2ec4b6', '#f2b134', '#ffffff', '#3fe08a', '#4f86c6'],
  bottoms: ['#111111', '#2f3b4c', '#3a3f47'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1f5a3a', ink: '#ffffff', text: 'HYDE PARK' },
  { fill: '#1d2f5c', ink: '#ffffff', text: 'SERPENTINE' },
  { fill: '#c8102e', ink: '#ffffff', text: 'LONDON' },
  { fill: '#f2efe6', ink: '#1d2f5c', text: 'LAKESIDE' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#2f6f9a', ink: '#ffffff', text: 'KENSINGTON' },
];
const STREET_BANNERS: readonly (readonly [string, string, string])[] = [
  ['SERPENTINE LAKESIDE RIDE', '#1d2f5c', '#ffffff'],
  ['HYDE PARK · LONDON', '#1f5a3a', '#ffffff'],
];
/** Feather flags along the barriers: the word down each and its colours. */
const FEATHERS: readonly FeatherWord[] = [
  ['SERPENTINE', '#1d2f5c', '#ffffff'],
  ['GO', '#c8102e', '#ffffff'],
  ['HYDE PARK', '#1f5a3a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
];
const FEATHER_EVERY = 16;
/**
 * The ride village's pop-up tents on the lawn: the valance's words, the canopy's fill and the
 * ink, how far into the loop and how far off the road's centre. The first stand in the opening
 * view.
 */
const TENTS: readonly (readonly [string, string, string, number, number])[] = [
  ['WATER', '#1f4e79', '#ffffff', 108, 9.8],
  ['LAKESIDE RIDE', '#2c5e3a', '#ffffff', 118, 10.4],
  ['ICE CREAMS', '#f2a7c3', '#5a1f33', 128, 9.9],
  ['WATTZUP', '#d7ff3a', '#1b1e24', 210, 9.8],
  ['BIKE REPAIR', '#c8202f', '#ffffff', 220, 10.3],
  ['FIRST AID', '#f2efe6', '#c8202f', 340, 9.8],
  ['WATER', '#1f4e79', '#ffffff', 430, 9.6],
];
/** What the fans paint on the road, its colour and how far off the centre line. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['COME ON', '#ffffff', -1.8],
  ['SERPENTINE', '#f2b134', 1.8],
  ['GO ON', '#ffffff', -1.8],
  ['LONDON', '#ff8a6a', 1.8],
  ['ALLEZ', '#ffffff', -1.8],
  ['WATTZUP', '#d7ff3a', 1.8],
  ['HUP HUP', '#ffffff', -1.8],
  ['PUSH', '#f2b134', 1.8],
];
const ROAD_PAINT_EVERY = 25;
/** Lamp posts and benches along the footpath by the lake. */
const LAMP_EVERY = 30;

interface Mover {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  readonly phase: number;
  readonly speed: number;
}

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly every: number;
  readonly x: number;
  /** Hidden past the bridge, so it never stands in front of the arches. */
  readonly near?: boolean;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

export class SerpentineStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly mist: Mist;
  private readonly props: Prop[] = [];
  private readonly boats: (Mover & { oars: Group[] })[] = [];
  private readonly swans: Mover[] = [];
  private readonly joggers: Mover[] = [];
  private people: Figures | null = null;
  private readonly horizon = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly ball = new SphereGeometry(1, 12, 9);
  private readonly flagMaterials = ['#c8102e', '#ffffff', '#1d2f5c', '#1f5a3a'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // Early-morning mist lying on the lake, and a veil over the gardens and the town beyond the
    // bridge.
    this.mist = new Mist(this.group, disposables, track, {
      colour: MIST,
      loop: LOOP,
      curtains: [
        { ahead: 330, height: 36, opacity: 0.32 },
        { ahead: 560, height: 70, opacity: 0.42 },
      ],
      banks: 12,
      bankX: (k) => -EDGE - 14 - (k % 4) * 26,
    });
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.7,
      wardrobe: LOCALS,
      flags: this.flagMaterials,
      flagShare: 0.2,
      seeds: [811, 821],
      // A summer-morning crowd: knots along the barriers, open stretches between them, and none
      // on the boathouse's jetty.
      skip: (side, offset, x) =>
        (side < 0 && Math.abs(offset - BOATHOUSE) < 12) ||
        offset % 40 > 26 ||
        // Thinner on the lake side, so the water shows between the knots.
        (side < 0 && offset % 40 > 15) ||
        (x > CROWD_NEAR + 1.2 && offset % 12 > 7),
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.ball, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.mist.build();
    this.addTrees();
    this.addDeckchairs();
    this.addLamps();
    this.addBoathouse();
    this.addBoats();
    this.addSwans();
    this.addJoggers();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addTents();
    this.addRoadPaint();
    this.addCrossing(roadHalf);
    this.addHorizon();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the lake, so the bank and the water lie over it. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - WATER - 1);
      position.setY(i * 2 + 1, p.height - WATER - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(metres);
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.visible = !prop.near || metres < BRIDGE_AT - 10;
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB, -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    // The banks float just over the water.
    this.mist.place(this.time, heightAt, along, (x) => (x < -EDGE ? -WATER - 1.2 : KERB));
    const t = this.time;
    // The rowing boats pull slowly along the lake, their oars sweeping.
    for (const b of this.boats) {
      const metres = along(b.offset + b.speed * t, LOOP);
      b.mesh.position.set(
        b.x + Math.sin(t * 0.05 + b.phase) * 3,
        ground(metres) - WATER + Math.sin(t * 1.1 + b.phase) * 0.03,
        -metres,
      );
      const stroke = Math.sin(t * 1.6 + b.phase);
      for (const oar of b.oars) oar.rotation.y = oar.userData['side'] * stroke * 0.45;
    }
    // The swans drift and bob, turning slowly.
    for (const w of this.swans) {
      const metres = along(w.offset + Math.sin(t * 0.04 + w.phase) * 6, LOOP);
      w.mesh.position.set(
        w.x + Math.cos(t * 0.05 + w.phase) * 1.5,
        ground(metres) - WATER + Math.sin(t * 0.9 + w.phase) * 0.02,
        -metres,
      );
      w.mesh.rotation.y = w.phase + Math.sin(t * 0.03 + w.phase) * 1.2;
    }
    const people = this.people;
    if (people) {
      this.joggers.forEach((j, i) => {
        const metres = along(j.offset + j.speed * t, LOOP);
        const running = Math.abs(j.speed) > 2;
        const step = Math.abs(Math.sin(t * (running ? 7 : 4) + j.phase)) * (running ? 0.08 : 0.04);
        people.set(i, j.x, ground(metres) + KERB, -metres, j.speed > 0 ? 0 : Math.PI, 0.95, step);
      });
      people.commit();
    }
    this.horizon.position.set(0, heightAt(BRIDGE_AHEAD), -BRIDGE_AHEAD);
  }

  /** The footpath, the lake's stone edge and the water; the lawns and their path; the far bank. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xc4c0b6, roughness: 0.9 });
    const gravel = this.material({ map: this.repeat(gravelTexture(), 3, 3), roughness: 1 });
    const coping = this.material({ map: this.repeat(stoneTexture(), 2, 1), roughness: 0.85 });
    const lake = this.material({
      map: this.repeat(lakeTexture(), 40, 40),
      roughness: 0.12,
      metalness: 0.3,
    });
    const lawn = this.material({ map: this.repeat(grassTexture(), 4, 4), roughness: 1 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
    }
    this.ribbons.add(points, gravel, [
      [-r - 0.3, KERB],
      [-EDGE, KERB],
    ]);
    this.ribbons.add(points, coping, [
      [-EDGE, KERB],
      [-EDGE, KERB + 0.18],
      [-EDGE - 0.5, KERB + 0.18],
      [-EDGE - 0.5, -WATER],
    ]);
    this.ribbons.add(points, lake, [
      [-EDGE - 0.5, -WATER],
      [-FAR_BANK, -WATER],
    ]);
    this.ribbons.add(points, lawn, [
      [-FAR_BANK, -WATER],
      [-FAR_BANK - 3, 0.4],
      [-900, 0.6],
    ]);
    this.ribbons.add(points, lawn, [
      [900, KERB],
      [LAWN_PATH + 1.5, KERB],
    ]);
    this.ribbons.add(points, gravel, [
      [LAWN_PATH + 1.5, KERB + 0.01],
      [LAWN_PATH - 1.5, KERB + 0.01],
    ]);
    this.ribbons.add(points, lawn, [
      [LAWN_PATH - 1.5, KERB],
      [r + 0.3, KERB],
    ]);
    // The road's white centre line, in short dashes.
    const centre = this.material({
      map: this.repeat(dashTexture('#f2f2ee'), 0.12, 6),
      alphaTest: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, centre, [
      [0.06, 0.006],
      [-0.06, 0.006],
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
   * London plane trees: tall trunks with the plane's mottled bark, cream, olive and grey in
   * patches, under broad rounded crowns. They stand in loose rows on the lawns and along the far
   * bank, none in front of the bridge.
   */
  private addTrees(): void {
    const random = seeded(831);
    const trunk = new CylinderGeometry(0.32, 0.55, 1, 9);
    trunk.translate(0, 0.5, 0);
    // A few crown shapes, each a cluster of leafy masses merged into one mesh.
    const crowns = [0, 1, 2, 3, 4].map((k) => {
      const r = seeded(841 + k);
      const parts: BufferGeometry[] = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + r();
        const part = new SphereGeometry(1, 12, 9);
        const size = 0.42 + r() * 0.2;
        part.scale(size, size * 0.85, size);
        part.translate(Math.cos(a) * 0.48, (r() - 0.3) * 0.4, Math.sin(a) * 0.48);
        parts.push(part);
      }
      const top = new SphereGeometry(0.6, 12, 9);
      top.translate(0, 0.35, 0);
      parts.push(top);
      const merged = mergeGeometries(parts)!;
      for (const p of parts) p.dispose();
      return merged;
    });
    this.disposables.push(trunk, ...crowns);
    const bark = this.material({ map: this.track(barkTexture()), roughness: 1 });
    const leaves = ['#3f6b32', '#4a7a3a', '#365e2c', '#557f3e'].map((c, i) =>
      this.material({ map: this.track(leafTexture(c, 851 + i)), roughness: 1 }),
    );
    const plant = (x: number, offset: number, rise: number, near: boolean, big = 1) => {
      const tree = new Group();
      const height = (17 + random() * 9) * big;
      const t = new Mesh(trunk, bark);
      t.scale.set(1, height * 0.62, 1);
      t.castShadow = true;
      const spread = height * (0.4 + random() * 0.08);
      const c = new Mesh(crowns[Math.floor(random() * crowns.length)]!, leaves[i++ % 4]!);
      c.scale.set(spread, spread * 0.95, spread);
      c.position.y = height * 0.62;
      c.rotation.y = random() * Math.PI * 2;
      c.castShadow = true;
      tree.add(t, c);
      tree.position.y = rise;
      this.group.add(tree);
      this.props.push({ mesh: tree, offset, every: LOOP, x, near });
    };
    let i = 0;
    for (let offset = 0; offset < LOOP; offset += 13 + random() * 9) {
      // The near row on the lawn, back from the barriers; a second row beyond the lawn path.
      if (Math.abs(offset - BOATHOUSE) > 6) plant(10 + random() * 3, offset, 0, true);
      plant(LAWN_PATH + 6 + random() * 10, offset + random() * 6, 0, true);
      if (random() < 0.7) plant(LAWN_PATH + 22 + random() * 30, offset + random() * 8, 0, true);
    }
    // The far bank, across the lake.
    for (let offset = 0; offset < LOOP; offset += 9 + random() * 8) {
      plant(-FAR_BANK - 8 - random() * 12, offset, 0.6 - KERB, false, 1.15);
      if (random() < 0.6) plant(-FAR_BANK - 26 - random() * 30, offset + 4, 0.6 - KERB, false, 1.2);
    }
  }

  /**
   * Deckchairs on the lawn under the planes, in green-and-white stripes, in twos and threes
   * facing the lake; someone sits in nearly half of them.
   */
  private addDeckchairs(): void {
    const random = seeded(861);
    const stripes = this.material({
      map: this.track(deckchairTexture()),
      side: DoubleSide,
      roughness: 0.85,
    });
    const wood = this.material({ color: 0xb08a5a, roughness: 0.8 });
    const sling = new PlaneGeometry(0.55, 1.07);
    this.disposables.push(sling);
    const tops = LOCALS.tops.map((c) => this.material({ color: c, roughness: 0.8 }));
    const bottoms = LOCALS.bottoms.map((c) => this.material({ color: c, roughness: 0.8 }));
    const skins = SKINS.map((c) => this.material({ color: c, roughness: 0.7 }));
    const box = (
      g: Group,
      m: Material,
      s: [number, number, number],
      p: [number, number, number],
      rx = 0,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(...s);
      mesh.position.set(...p);
      mesh.rotation.x = rx;
      mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    };
    let placed = 0;
    for (let offset = 2; placed < DECKCHAIRS; offset += 6 + random() * 10) {
      const group = 2 + Math.floor(random() * 2);
      // Set back behind the village's tents where they stand.
      const tent = TENTS.some(([, , , at]) => Math.abs(offset - at) < 6);
      const x = 6.8 + random() * 7 + (tent ? 6 : 0);
      for (let k = 0; k < group && placed < DECKCHAIRS; k++, placed++) {
        const chair = new Group();
        const canvas = new Mesh(sling, stripes);
        canvas.rotation.x = 0.92;
        canvas.position.set(0, 0.62, 0.02);
        chair.add(canvas);
        for (const side of [-0.29, 0.29]) {
          box(chair, wood, [0.04, 1.12, 0.04], [side, 0.62, 0.02], 0.92);
          box(chair, wood, [0.04, 0.4, 0.04], [side, 0.2, -0.42]);
          box(chair, wood, [0.04, 0.95, 0.04], [side, 0.45, 0.5], -0.35);
        }
        if (random() < 0.45) {
          const top = tops[Math.floor(random() * tops.length)]!;
          const bottom = bottoms[Math.floor(random() * bottoms.length)]!;
          const skin = skins[Math.floor(random() * skins.length)]!;
          box(chair, top, [0.38, 0.55, 0.22], [0, 0.82, 0.18], 0.75);
          box(chair, bottom, [0.34, 0.15, 0.45], [0, 0.48, -0.15]);
          box(chair, skin, [0.3, 0.42, 0.12], [0, 0.26, -0.4]);
          const head = new Mesh(this.ball, skin);
          head.scale.setScalar(0.11);
          head.position.set(0, 1.12, 0.36);
          chair.add(head);
        }
        // Face the lake, each set a little askew.
        chair.rotation.y = Math.PI / 2 + (random() - 0.5) * 0.6;
        const holder = new Group();
        holder.add(chair);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + k * 1.1,
          every: LOOP,
          x: x + (random() - 0.5) * 1.2,
          near: true,
        });
      }
    }
  }

  /**
   * Black cast-iron lamp posts along the lakeside footpath, a lantern on each, and a green park
   * bench between each pair facing the water.
   */
  private addLamps(): void {
    const iron = this.material({ color: 0x1a1c1e, metalness: 0.5, roughness: 0.5 });
    const glass = this.material({
      color: 0xfff1d0,
      emissive: new Color(0xffd9a0),
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    const slat = this.material({ color: 0x2f5a3a, roughness: 0.7 });
    const pole = new CylinderGeometry(0.06, 0.09, 3.4, 8);
    pole.translate(0, 1.7, 0);
    const foot = new CylinderGeometry(0.15, 0.2, 0.6, 8);
    foot.translate(0, 0.3, 0);
    const cap = new ConeGeometry(0.3, 0.32, 4);
    cap.rotateY(Math.PI / 4);
    this.disposables.push(pole, foot, cap);
    for (let offset = 6; offset < LOOP; offset += LAMP_EVERY) {
      const lamp = new Group();
      lamp.add(new Mesh(foot, iron), new Mesh(pole, iron));
      const lantern = new Mesh(this.unit, glass);
      lantern.scale.set(0.34, 0.5, 0.34);
      lantern.position.y = 3.65;
      const top = new Mesh(cap, iron);
      top.position.y = 4.06;
      const finial = new Mesh(this.ball, iron);
      finial.scale.setScalar(0.06);
      finial.position.y = 4.28;
      lamp.add(lantern, top, finial);
      for (const m of lamp.children) m.castShadow = true;
      this.group.add(lamp);
      this.props.push({ mesh: lamp, offset, every: LOOP, x: -EDGE + 0.4 });
      if (Math.abs(offset + LAMP_EVERY / 2 - BOATHOUSE) < 12) continue;
      const bench = new Group();
      const part = (m: Material, s: [number, number, number], p: [number, number, number]) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(...s);
        mesh.position.set(...p);
        mesh.castShadow = true;
        bench.add(mesh);
      };
      part(slat, [1.8, 0.06, 0.45], [0, 0.45, 0]);
      part(slat, [1.8, 0.4, 0.05], [0, 0.78, 0.24]);
      for (const x of [-0.85, 0.85]) part(iron, [0.06, 0.8, 0.5], [x, 0.4, 0.05]);
      // The bench looks out over the lake.
      bench.rotation.y = Math.PI / 2;
      this.group.add(bench);
      this.props.push({
        mesh: bench,
        offset: offset + LAMP_EVERY / 2,
        every: LOOP,
        x: -EDGE + 0.6,
      });
    }
  }

  /**
   * The boathouse on the lake's edge: a white weatherboarded hut under a green hipped roof on a
   * timber jetty, its sign over the footpath, blue rowing boats and yellow pedalos moored beside.
   */
  private addBoathouse(): void {
    const house = new Group();
    const water = -WATER - KERB;
    const deck = this.material({ map: this.repeat(deckTexture(), 2, 2), roughness: 0.9 });
    const boards = this.material({ map: this.repeat(weatherboardTexture(), 3, 3), roughness: 0.8 });
    const roof = this.material({ color: 0x2f5a3a, roughness: 0.7 });
    const post = this.material({ color: 0x4a3a2a, roughness: 0.9 });
    const box = (m: Material, s: [number, number, number], p: [number, number, number]) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(...s);
      mesh.position.set(...p);
      mesh.castShadow = true;
      house.add(mesh);
      return mesh;
    };
    // The jetty, on piles in the water.
    box(deck, [10, 0.25, 20], [-EDGE - 5.5, -0.12, 0]);
    for (let z = -9; z <= 9; z += 3) {
      for (const x of [-EDGE - 1, -EDGE - 10]) box(post, [0.25, 1, 0.25], [x, water + 0.3, z]);
    }
    // The hut, its roof hipped over it.
    const hut = new BoxGeometry(5, 3.4, 12);
    for (const face of [0, 1]) scaleFaceUv(hut, face, 12 / 3, 3.4 / 3);
    for (const face of [4, 5]) scaleFaceUv(hut, face, 5 / 3, 3.4 / 3);
    this.disposables.push(hut);
    const walls = new Mesh(hut, boards);
    walls.position.set(-EDGE - 6, 1.7, -2);
    walls.castShadow = true;
    house.add(walls);
    const hip = new ConeGeometry(1, 1, 4);
    hip.rotateY(Math.PI / 4);
    this.disposables.push(hip);
    const r = new Mesh(hip, roof);
    r.scale.set(4.6, 2.2, 9.6);
    r.position.set(-EDGE - 6, 3.4 + 1.1, -2);
    r.castShadow = true;
    house.add(r);
    // Its windows and door on the footpath side, and its sign.
    const dark = this.material({ color: 0x2b3138, roughness: 0.3 });
    for (const z of [-6, -3.5, 1.5]) box(dark, [0.05, 1.1, 1.4], [-EDGE - 3.48, 1.9, z]);
    box(dark, [0.05, 2.2, 1.2], [-EDGE - 3.48, 1.1, -0.6]);
    const sign = new Mesh(
      new PlaneGeometry(6, 0.8),
      this.material({
        map: this.track(clothBannerTexture('BOATS FOR HIRE', '#1d2f5c', '#ffffff')),
        roughness: 0.6,
      }),
    );
    this.disposables.push(sign.geometry);
    sign.rotation.y = Math.PI / 2;
    sign.position.set(-EDGE - 3.4, 3.05, -2);
    house.add(sign);
    // Rowing boats moored in a row off the jetty's end, and pedalos beside them.
    const blue = this.material({ color: 0x2f5d9a, roughness: 0.6 });
    const white = this.material({ color: 0xf2f2ee, roughness: 0.6 });
    const yellow = this.material({ color: 0xf2c230, roughness: 0.6 });
    for (let k = 0; k < 6; k++) {
      const hull = new Mesh(this.ball, blue);
      hull.scale.set(0.7, 0.35, 2.1);
      hull.position.set(-EDGE - 11.4 - k * 1.6, water, 4 + (k % 2) * 0.4);
      const rim = new Mesh(this.unit, white);
      rim.scale.set(1.2, 0.06, 3.6);
      rim.position.set(hull.position.x, water + 0.3, hull.position.z);
      house.add(hull, rim);
    }
    for (let k = 0; k < 5; k++) {
      const seat = k % 2 ? yellow : blue;
      box(white, [1.4, 0.4, 2.2], [-EDGE - 12 - k * 1.7, water + 0.15, -6]);
      box(seat, [1.2, 0.5, 1], [-EDGE - 12 - k * 1.7, water + 0.6, -6.2]);
    }
    this.group.add(house);
    this.props.push({ mesh: house, offset: BOATHOUSE, every: LOOP, x: 0 });
  }

  /** Rowing boats out on the lake, each with a rower pulling at the oars. */
  private addBoats(): void {
    const random = seeded(871);
    const hulls = [0x2f5d9a, 0x2a4f80, 0xf2f2ee].map((c) =>
      this.material({ color: c, roughness: 0.6 }),
    );
    const white = this.material({ color: 0xf2f2ee, roughness: 0.6 });
    const oarWood = this.material({ color: 0xc9a46a, roughness: 0.7 });
    const tops = ACTIVEWEAR.tops.map((c) => this.material({ color: c, roughness: 0.8 }));
    const skins = SKINS.map((c) => this.material({ color: c, roughness: 0.7 }));
    for (let k = 0; k < BOATS; k++) {
      const boat = new Group();
      const hull = new Mesh(this.ball, hulls[k % 3]!);
      hull.scale.set(0.7, 0.35, 2.1);
      const rim = new Mesh(this.unit, white);
      rim.scale.set(1.2, 0.06, 3.6);
      rim.position.y = 0.3;
      const body = new Mesh(this.unit, tops[k % tops.length]!);
      body.scale.set(0.4, 0.55, 0.24);
      body.position.set(0, 0.6, 0.2);
      body.rotation.x = 0.3;
      const head = new Mesh(this.ball, skins[k % skins.length]!);
      head.scale.setScalar(0.11);
      head.position.set(0, 1.0, 0.32);
      boat.add(hull, rim, body, head);
      const oars: Group[] = [];
      for (const side of [-1, 1]) {
        const pivot = new Group();
        pivot.position.set(side * 0.55, 0.35, 0);
        pivot.userData['side'] = side;
        const oar = new Mesh(this.unit, oarWood);
        oar.scale.set(2.6, 0.05, 0.08);
        oar.position.x = side * 1.1;
        oar.rotation.z = side * 0.2;
        pivot.add(oar);
        boat.add(pivot);
        oars.push(pivot);
      }
      for (const m of boat.children) m.castShadow = true;
      boat.rotation.y = random() < 0.5 ? 0 : Math.PI;
      this.group.add(boat);
      this.boats.push({
        mesh: boat,
        oars,
        // Half of them out on the water in the stretch the rider first sees.
        offset: k < BOATS / 2 ? 128 + k * 16 + random() * 6 : random() * LOOP,
        x:
          k < BOATS / 2
            ? -EDGE - 13 - random() * 24
            : -EDGE - 14 - random() * (FAR_BANK - EDGE - 30),
        phase: random() * 6,
        speed: (boat.rotation.y === 0 ? 1 : -1) * (0.5 + random() * 0.5),
      });
    }
  }

  /** Mute swans, white with an orange bill, drifting near the bank in pairs and small groups. */
  private addSwans(): void {
    const random = seeded(881);
    const white = this.material({ color: 0xf6f6f2, roughness: 0.7 });
    const orange = this.material({ color: 0xe0782a, roughness: 0.6 });
    const black = this.material({ color: 0x161616, roughness: 0.6 });
    for (let k = 0; k < SWANS; k++) {
      const swan = new Group();
      const body = new Mesh(this.ball, white);
      body.scale.set(0.3, 0.22, 0.55);
      body.position.y = 0.12;
      const tail = new Mesh(this.ball, white);
      tail.scale.set(0.2, 0.14, 0.25);
      tail.position.set(0, 0.25, 0.42);
      const neck = new Mesh(this.unit, white);
      neck.scale.set(0.08, 0.55, 0.08);
      neck.position.set(0, 0.48, -0.36);
      neck.rotation.x = 0.18;
      const head = new Mesh(this.ball, white);
      head.scale.set(0.07, 0.07, 0.12);
      head.position.set(0, 0.76, -0.44);
      const bill = new Mesh(this.unit, orange);
      bill.scale.set(0.045, 0.045, 0.12);
      bill.position.set(0, 0.74, -0.58);
      const knob = new Mesh(this.ball, black);
      knob.scale.setScalar(0.03);
      knob.position.set(0, 0.77, -0.52);
      swan.add(body, tail, neck, head, bill, knob);
      for (const m of swan.children) m.castShadow = true;
      swan.scale.setScalar(1.8);
      this.group.add(swan);
      const flock = Math.floor(k / 3);
      this.swans.push({
        mesh: swan,
        offset: (flock < 3 ? 118 + flock * 24 : flock * 85) + random() * 6,
        x: -EDGE - (flock < 3 ? 7 + random() * 10 : 2 + random() * 40),
        phase: random() * 6,
        speed: 0,
      });
    }
  }

  /** Joggers and walkers on the path across the lawns, built on the kit's figures. */
  private addJoggers(): void {
    const random = seeded(891);
    this.people = new Figures(this.group, this.disposables, JOGGERS, ACTIVEWEAR, 893);
    for (let i = 0; i < JOGGERS; i++) {
      const running = i % 3 !== 2;
      const ahead = i % 2 === 0;
      this.joggers.push({
        mesh: this.group,
        offset: i % 2 ? 90 + random() * 140 : random() * LOOP,
        speed: (ahead ? 1 : -1) * (running ? 2.8 : 1.3),
        x: LAWN_PATH + (ahead ? -0.6 : 0.6),
        phase: random() * 6,
      });
    }
  }

  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.08, 0.08, 6.4, 8);
    post.translate(0, 3.2, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1, 1.2);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0xd9dde2, metalness: 0.6, roughness: 0.35 });
    STREET_BANNERS.forEach(([text, fill, ink], i) => {
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
      this.props.push({ mesh: banner, offset: 115 + i * 250, every: LOOP, x: 0, near: true });
    });
  }

  /** The ride's feather flags along both barriers. */
  private addFeatherFlags(): void {
    const feathers = new FeatherFlags(this.disposables, this.track, FEATHERS);
    let k = 0;
    for (const side of [-1, 1] as const) {
      for (let offset = 4; offset < LOOP; offset += FEATHER_EVERY) {
        const holder = new Group();
        holder.add(feathers.make(k++));
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? FEATHER_EVERY / 2 : 0),
          every: LOOP,
          x: side * (BARRIER + 0.15),
        });
      }
    }
  }

  /**
   * The zebra crossing to the boathouse: black-and-white stripes across the road, a broken give-
   * way line either side, the white zig-zags along the kerbs and the centre on each approach, and
   * a Belisha beacon at each kerb, its amber globe on a black-and-white pole.
   */
  private addCrossing(roadHalf: number): void {
    const crossing = new Group();
    const road = 0.02 - KERB;
    const white = this.material({
      color: 0xf4f4f0,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.6,
    });
    const flat = (w: number, d: number, x: number, z: number, m: Material = white) => {
      const mesh = new Mesh(new PlaneGeometry(w, d), m);
      this.disposables.push(mesh.geometry);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, road, z);
      crossing.add(mesh);
    };
    for (let x = -roadHalf + 0.5; x < roadHalf; x += 1) flat(0.5, 3, x, 0);
    for (const z of [-2.1, 2.1]) {
      for (let x = -roadHalf + 0.3; x < roadHalf - 0.2; x += 0.9) flat(0.6, 0.2, x + 0.3, z);
    }
    const zigzag = this.material({
      map: this.track(zigzagTexture()),
      alphaTest: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.6,
    });
    for (const z of [-8, 8]) {
      for (const x of [-roadHalf + 0.35, 0, roadHalf - 0.35]) flat(0.45, 11, x, z, zigzag);
    }
    const bands = this.material({ map: this.track(beaconPoleTexture()), roughness: 0.5 });
    const globe = this.material({
      color: 0xffb020,
      emissive: new Color(0xff9a10),
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const pole = new CylinderGeometry(0.05, 0.05, 2.6, 10);
    pole.translate(0, 1.3, 0);
    this.disposables.push(pole);
    for (const side of [-1, 1]) {
      const p = new Mesh(pole, bands);
      p.position.set(side * (roadHalf + 0.15), 0, 1.8);
      const g = new Mesh(this.ball, globe);
      g.scale.setScalar(0.17);
      g.position.set(side * (roadHalf + 0.15), 2.75, 1.8);
      p.castShadow = true;
      crossing.add(p, g);
    }
    this.group.add(crossing);
    // Short of the boathouse, close enough in the opening view to read.
    this.props.push({ mesh: crossing, offset: BOATHOUSE - 28, every: LOOP, x: 0 });
  }

  /** The ride village: pop-up tents on the lawn, each turned a little to the road. */
  private addTents(): void {
    const tents = new PopupTents(this.disposables, this.track);
    TENTS.forEach(([text, fill, ink, offset, x], i) => {
      const tent = tents.make(text, fill, ink);
      tent.rotation.y = (i % 3) * 0.12 - 0.12;
      this.group.add(tent);
      this.props.push({ mesh: tent, offset, every: LOOP, x, near: true });
    });
  }

  /** What the fans have painted on the road. */
  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.4, 8.5);
    this.disposables.push(plane);
    [...ROAD_PAINT, ...ROAD_PAINT].forEach(([text, colour, x], i) => {
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
      mesh.position.y = 0.02 - KERB;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset: 22 + i * ROAD_PAINT_EVERY,
        every: LOOP,
        x,
        lies: true,
      });
    });
  }

  /**
   * Ahead: the Serpentine Bridge, five shallow stone arches across the lake under a cornice and
   * balustrade, the road passing under the last of them; Kensington Gardens' trees beyond, the
   * Albert Memorial's gilded spire rising over them, and Knightsbridge's tall barracks tower to
   * the left, all hazed by hand.
   */
  private addHorizon(): void {
    const haze = new Color(HAZE);
    // The bridge stands nearer than the rest of the distance.
    const h = new Group();
    h.position.z = BRIDGE_AHEAD - BRIDGE_AT;
    this.horizon.add(h);
    const stone = hazedMaterial(this.disposables, haze, 0xe2dccd, 0.1, {
      map: this.repeat(ashlarTexture(), 4, 2),
    });
    const trim = hazedMaterial(this.disposables, haze, 0xf0ebdf, 0.1);
    const shade = hazedMaterial(this.disposables, haze, 0x6d6a62, 0.15);
    // The bridge's face: five segmental arches, 26 m each between 4 m piers, the deck 9 m up.
    const span = 26;
    const pier = 4;
    const left = -136;
    const right = left + 5 * span + 6 * pier;
    const deck = 9;
    const face = new Shape();
    face.moveTo(left, -3);
    face.lineTo(right, -3);
    face.lineTo(right, deck);
    face.lineTo(left, deck);
    face.closePath();
    const rings: Shape[] = [];
    for (let i = 0; i < 5; i++) {
      const x0 = left + pier + i * (span + pier);
      const land = i === 4;
      const spring = land ? 2.2 : 1.2;
      const rise = 5.2;
      const bottom = land ? -0.3 : -2.5;
      const radius = (span * span) / 4 / (2 * rise) + rise / 2;
      const cx = x0 + span / 2;
      const cy = spring + rise - radius;
      const a = Math.atan2(spring - cy, span / 2);
      const hole = new Shape();
      hole.moveTo(x0, bottom);
      hole.lineTo(x0 + span, bottom);
      hole.lineTo(x0 + span, spring);
      hole.absarc(cx, cy, radius, a, Math.PI - a, false);
      hole.closePath();
      face.holes.push(hole);
      // The arch ring of voussoirs, standing a little proud of the face.
      const ring = new Shape();
      const outer = radius + 0.9;
      const b = Math.atan2(spring - cy, Math.sqrt(outer * outer - (spring - cy) ** 2));
      ring.absarc(cx, cy, outer, b, Math.PI - b, false);
      ring.absarc(cx, cy, radius, Math.PI - a, a, true);
      ring.closePath();
      rings.push(ring);
    }
    const body = new ExtrudeGeometry(face, { depth: 14, bevelEnabled: false });
    body.translate(0, 0, -7);
    const ringGeometry = new ExtrudeGeometry(rings, { depth: 0.3, bevelEnabled: false });
    ringGeometry.translate(0, 0, 7);
    this.disposables.push(body, ringGeometry);
    h.add(new Mesh(body, stone), new Mesh(ringGeometry, trim));
    // The cornice along the deck, the balustrade on it, and the cutwaters at the piers.
    const box = (
      m: Material,
      w: number,
      height: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, height, d);
      mesh.position.set(x, y, z);
      h.add(mesh);
      return mesh;
    };
    const width = right - left;
    box(trim, width + 1, 0.6, 15, (left + right) / 2, deck + 0.3, 0);
    const balusters = this.repeat(balustradeTexture(), 1.2, 1.1);
    const rail = hazedMaterial(this.disposables, haze, 0xf0ebdf, 0.1, {
      map: balusters,
      alphaTest: 0.5,
      side: DoubleSide,
    });
    const parapet = new PlaneGeometry(width, 1.1);
    const uv = parapet.getAttribute('uv') as BufferAttribute;
    for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) * width);
    this.disposables.push(parapet);
    for (const z of [7.2, -7.2]) {
      const p = new Mesh(parapet, rail);
      p.position.set((left + right) / 2, deck + 1.15, z);
      h.add(p);
    }
    box(trim, width + 1, 0.2, 0.5, (left + right) / 2, deck + 1.8, 7.2);
    // Black lamp standards along both parapets, a lantern on each.
    const iron = hazedMaterial(this.disposables, haze, 0x1a1c1e, 0.12);
    const glow = hazedMaterial(this.disposables, haze, 0xfff1d0, 0.05, {
      emissive: new Color(0xffd9a0),
      emissiveIntensity: 0.3,
    });
    for (let x = left + 8; x < right - 4; x += 15) {
      for (const z of [7.2, -7.2]) {
        box(iron, 0.22, 4.2, 0.22, x, deck + 1.9 + 2.1, z);
        box(glow, 0.55, 0.8, 0.55, x, deck + 6.4, z);
        box(iron, 0.7, 0.18, 0.7, x, deck + 6.9, z);
      }
    }
    for (let i = 0; i <= 5; i++) {
      const x = left + pier / 2 + i * (span + pier);
      if (i < 5) {
        const cut = box(stone, 2.8, 3.2, 2.8, x, -WATER + 0.4, 7.4);
        cut.rotation.y = Math.PI / 4;
      }
      // A pilaster up each pier to the cornice.
      box(trim, pier * 0.7, deck - 1, 0.4, x, (deck - 1) / 2, 7.2);
    }
    // The road on to the bridge: a grassed embankment to the right of the last arch.
    const bank = hazedMaterial(this.disposables, haze, 0x4f7a3a, 0.12);
    box(bank, 120, deck + 1, 30, right + 60, (deck - 1) / 2, 0);
    // The shadowed water and road under the arches.
    box(shade, width, 0.1, 13, (left + right) / 2, -WATER - 0.4, 0);
    this.addGardens(haze);
  }

  /** Kensington Gardens beyond the bridge, the Albert Memorial and the barracks tower. */
  private addGardens(haze: Color): void {
    const h = this.horizon;
    const random = seeded(901);
    const crown = new SphereGeometry(1, 14, 10);
    this.disposables.push(crown);
    const greens = [0x3a5f30, 0x45693a, 0x324f2c, 0x4e7240].map((c, i) =>
      hazedMaterial(this.disposables, haze, c, 0.16 + (i % 2) * 0.08),
    );
    for (let k = 0; k < 70; k++) {
      const x = -520 + random() * 900;
      const z = -40 - random() * 300;
      const r = 9 + random() * 8;
      const m = new Mesh(crown, greens[k % greens.length]!);
      m.scale.set(r * 1.2, r, r);
      m.position.set(x, 10 + r * 0.6, z);
      h.add(m);
    }
    // The Albert Memorial: a stepped podium, the canopy over the seated figure, and the gilded
    // Gothic spire, tier on tier, to a cross.
    const memorial = new Group();
    memorial.position.set(-95, 0, -420);
    h.add(memorial);
    const stone = hazedMaterial(this.disposables, haze, 0xd9d2c0, 0.25);
    const gold = hazedMaterial(this.disposables, haze, 0xd4a83a, 0.18, {
      metalness: 0.6,
      roughness: 0.35,
    });
    const dark = hazedMaterial(this.disposables, haze, 0x4a4840, 0.25);
    const part = (m: Material, w: number, height: number, x: number, y: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, height, w);
      mesh.position.set(x, y, 0);
      memorial.add(mesh);
    };
    part(stone, 34, 4, 0, 2);
    part(stone, 24, 4, 0, 6);
    part(stone, 14, 16, 0, 16);
    part(dark, 8, 10, 0, 15);
    part(stone, 15, 2, 0, 25);
    const tier = new ConeGeometry(1, 1, 8);
    this.disposables.push(tier);
    [
      [8, 9, 26],
      [5.5, 10, 33],
      [3.4, 12, 41],
      [1.6, 14, 50],
    ].forEach(([r, height, y], i) => {
      const cone = new Mesh(tier, i % 2 ? gold : stone);
      cone.scale.set(r!, height!, r!);
      cone.position.y = y! + height! / 2;
      memorial.add(cone);
    });
    part(gold, 0.6, 5, 0, 66);
    part(gold, 2.4, 0.6, 0, 67);
    // The barracks tower over Knightsbridge, to the left.
    const tower = new BoxGeometry(22, 94, 14);
    for (const face of [4, 5]) scaleFaceUv(tower, face, 22 / 4, 94 / 3);
    for (const face of [0, 1]) scaleFaceUv(tower, face, 14 / 4, 94 / 3);
    this.disposables.push(tower);
    const concrete = hazedMaterial(this.disposables, haze, 0xcfc9bd, 0.3, {
      map: this.repeat(towerTexture(), 1, 1),
    });
    const barracks = new Mesh(tower, concrete);
    barracks.position.set(-200, 47, -150);
    barracks.rotation.y = 0.3;
    h.add(barracks);
    this.addKnightsbridge(haze);
    this.group.add(h);
  }

  /**
   * Knightsbridge over the far bank's trees: Victorian and Edwardian mansion blocks in red brick
   * and Portland stone, five to nine storeys under grey slate mansards with dormers and chimney
   * stacks, and the turreted red-brick hotel by the park with its green copper cupolas.
   */
  private addKnightsbridge(haze: Color): void {
    const h = this.horizon;
    const random = seeded(971);
    const brick = this.repeat(facadeTexture('#9a4a38', '#efe7d6'), 1, 1);
    const stone = this.repeat(facadeTexture('#e0d8c6', '#bfb39a'), 1, 1);
    const fronts = [
      hazedMaterial(this.disposables, haze, 0xffffff, 0.22, { map: brick }),
      hazedMaterial(this.disposables, haze, 0xffffff, 0.22, { map: stone }),
      hazedMaterial(this.disposables, haze, 0xf0d8c8, 0.22, { map: brick }),
    ];
    const slate = hazedMaterial(this.disposables, haze, 0x5a5f66, 0.25);
    const chimney = hazedMaterial(this.disposables, haze, 0x8a4434, 0.25);
    const copper = hazedMaterial(this.disposables, haze, 0x5f9e8a, 0.2, { roughness: 0.5 });
    const mansard = new ConeGeometry(Math.SQRT1_2, 1, 4, 1);
    mansard.rotateY(Math.PI / 4);
    this.disposables.push(mansard);
    const block = (
      x: number,
      z: number,
      w: number,
      d: number,
      storeys: number,
      front: Material,
    ) => {
      const height = storeys * 3.4;
      const box = new BoxGeometry(w, height, d);
      for (const face of [4, 5]) scaleFaceUv(box, face, w / 4, storeys);
      for (const face of [0, 1]) scaleFaceUv(box, face, d / 4, storeys);
      for (const face of [2, 3]) scaleFaceUv(box, face, 0, 0);
      this.disposables.push(box);
      const body = new Mesh(box, front);
      body.position.set(x, height / 2, z);
      // A steep slate mansard, cut flat at its top.
      const roof = new Mesh(mansard, slate);
      roof.scale.set(w * 1.02, 5, d * 1.02);
      roof.position.set(x, height + 2.5, z);
      h.add(body, roof);
      for (let k = 0; k < 2; k++) {
        const stack = new Mesh(this.unit, chimney);
        stack.scale.set(1.4, 4, 2.4);
        stack.position.set(x + (k ? 1 : -1) * w * 0.32, height + 4.5, z);
        h.add(stack);
      }
    };
    // A street of mansion blocks, shoulder to shoulder, stepping back from the park.
    let z = 30;
    for (let k = 0; z > -300; k++) {
      const w = 18 + random() * 22;
      const storeys = 6 + Math.floor(random() * 4);
      block(-185 - random() * 40, z - w / 2, 16, w, storeys, fronts[k % 3]!);
      z -= w + 2 + random() * 8;
    }
    // The hotel by the park: a long red-brick front, a corner tower and copper cupolas.
    const hotel = { x: -165, z: -60 };
    block(hotel.x, hotel.z, 20, 46, 9, fronts[0]!);
    for (const dz of [-23, 23]) {
      const tower = new Mesh(new CylinderGeometry(4.5, 4.5, 38, 14), fronts[0]!);
      this.disposables.push(tower.geometry);
      tower.position.set(hotel.x + 8, 19, hotel.z + dz);
      const drum = new Mesh(new CylinderGeometry(3.6, 3.8, 4, 14), fronts[1]!);
      this.disposables.push(drum.geometry);
      drum.position.set(hotel.x + 8, 40, hotel.z + dz);
      const dome = new Mesh(this.ball, copper);
      dome.scale.set(4, 5.5, 4);
      dome.position.set(hotel.x + 8, 42, hotel.z + dz);
      const lantern = new Mesh(this.unit, copper);
      lantern.scale.set(0.8, 4, 0.8);
      lantern.position.set(hotel.x + 8, 49, hotel.z + dz);
      h.add(tower, drum, dome, lantern);
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

/** The park's self-binding gravel: buff, fine-grained, raked a little by feet. */
function gravelTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#c9b48a', 911);
    const random = seeded(913);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(90,70,40,0.25)' : 'rgba(250,240,215,0.3)';
      g.fillRect(random() * 256, random() * 256, 2, 2);
    }
  });
}

/** The lake's stone edging in blocks. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    speckle(g, 256, 64, '#bdb6a6', 917);
    g.fillStyle = 'rgba(60,55,45,0.4)';
    for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 2, 64);
    g.fillStyle = 'rgba(40,60,40,0.3)';
    g.fillRect(0, 48, 256, 16);
  });
}

/** The Serpentine's water: green-grey, catching the sky on its ripples. */
function lakeTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#4f6f6a';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(919);
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = `rgba(215,232,240,${0.05 + random() * 0.15})`;
      g.fillRect(random() * 512, random() * 512, 3, 10 + random() * 20);
    }
  });
}

/** The park's mown summer lawn. */
function grassTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#5f8f45', 929);
    const random = seeded(937);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(40,70,30,0.3)' : 'rgba(180,205,120,0.25)';
      g.fillRect(random() * 256, random() * 256, 2, 5);
    }
  });
}

/** A London plane's bark: flaking in patches of cream, olive and grey. */
function barkTexture(): CanvasTexture {
  const texture = canvasTexture(128, 256, (g) => {
    speckle(g, 128, 256, '#6e6a56', 941);
    const random = seeded(947);
    for (let i = 0; i < 45; i++) {
      g.fillStyle = ['#c9c09a', '#8f9068', '#5a594a', '#a89f78'][Math.floor(random() * 4)]!;
      g.beginPath();
      g.ellipse(
        random() * 128,
        random() * 256,
        6 + random() * 14,
        8 + random() * 18,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 3);
  return texture;
}

/** A plane tree's foliage in `colour`, lit and shaded leaf by leaf. */
function leafTexture(colour: string, seed: number): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, colour, seed);
    const random = seeded(seed + 1);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '15,30,10' : '200,225,150'},${0.12 + random() * 0.2})`;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 2 + random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** A deckchair's canvas: broad green and white stripes down its length. */
function deckchairTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    for (let x = 0; x < 64; x += 16) {
      g.fillStyle = (x / 16) % 2 ? '#f4f2ea' : '#2f7a46';
      g.fillRect(x, 0, 16, 128);
    }
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < 128; y += 6) g.fillRect(0, y, 64, 1);
  });
}

/** The jetty's timber decking. */
function deckTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a6a48', 953);
    g.fillStyle = 'rgba(40,28,18,0.5)';
    for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 2, 128);
  });
}

/** The boathouse's white-painted weatherboarding. */
function weatherboardTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#f0eee6', 959);
    g.fillStyle = 'rgba(80,80,70,0.3)';
    for (let y = 0; y < 128; y += 16) g.fillRect(0, y, 128, 3);
  });
}

/** Portland stone ashlar: pale blocks in courses, weathered darker in the joints. */
function ashlarTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    speckle(g, 256, 128, '#e6e0d0', 967);
    g.fillStyle = 'rgba(90,82,68,0.35)';
    for (let y = 0; y < 128; y += 32) {
      g.fillRect(0, y, 256, 2);
      for (let x = (y / 32) % 2 ? 0 : 40; x < 256; x += 80) g.fillRect(x, y, 2, 32);
    }
  });
}

/** A balustrade, 1.2 m per repeat: a top rail, a plinth and four turned balusters. */
function balustradeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 18);
    g.fillRect(0, 112, 128, 16);
    for (let x = 16; x < 128; x += 32) {
      g.beginPath();
      g.ellipse(x, 70, 9, 30, 0, 0, Math.PI * 2);
      g.fill();
      g.fillRect(x - 5, 18, 10, 94);
    }
  });
}

/**
 * A mansion block's face, one 4 m bay by one storey per repeat: `wall` with a tall sash window
 * in a `dressing` surround, its sill and a string course under the floor above.
 */
function facadeTexture(wall: string, dressing: string): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, wall, 977);
    g.fillStyle = dressing;
    g.fillRect(16, 10, 32, 44);
    g.fillRect(0, 60, 64, 4);
    g.fillStyle = '#2f3a44';
    g.fillRect(20, 14, 24, 36);
    g.fillStyle = 'rgba(200,220,235,0.35)';
    g.fillRect(20, 14, 24, 12);
    g.fillStyle = dressing;
    g.fillRect(20, 30, 24, 2);
    g.fillRect(31, 14, 2, 36);
  });
}

/** A zebra crossing's approach markings: a white zig-zag down an 11 m strip. */
function zigzagTexture(): CanvasTexture {
  return canvasTexture(32, 512, (g) => {
    g.strokeStyle = '#f4f4f0';
    g.lineWidth = 6;
    g.beginPath();
    for (let k = 0; k <= 8; k++) g.lineTo(k % 2 ? 26 : 6, k * 64);
    g.stroke();
  });
}

/** A Belisha beacon's pole: black and white bands. */
function beaconPoleTexture(): CanvasTexture {
  return canvasTexture(8, 128, (g) => {
    for (let y = 0; y < 128; y += 16) {
      g.fillStyle = (y / 16) % 2 ? '#f4f4f0' : '#141414';
      g.fillRect(0, y, 8, 16);
    }
  });
}

/** The barracks tower's concrete face: bands of windows storey on storey. */
function towerTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#5a6068';
    for (let x = 4; x < 64; x += 16) g.fillRect(x, 16, 10, 30);
  });
}
