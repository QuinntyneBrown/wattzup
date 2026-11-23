// Golden Gate Park's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): John F.
// Kennedy Drive through San Francisco's park on a foggy summer morning, closed to cars for the
// race. Tall eucalyptus, wind-shaped Monterey cypress and pines stand in groves on both sides
// over lawns; on the left the bison graze in their paddock behind a timber fence; on the right
// model yachts drift on Spreckels Lake and roller skaters and joggers use the path; ahead the
// Dutch Windmill turns its sails above Ocean Beach, its tulip beds at its foot and the Pacific
// grey behind, all softened by the fog rolling in off the ocean.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, figures, mist,
// barriers, banners and road paint of world-kit.ts.
import {
  BoxGeometry,
  type CanvasTexture,
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
  TorusGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  barrierBannerTexture,
  type BannerPanel,
  canvasTexture,
  clothBannerTexture,
  FeatherFlags,
  type FeatherWord,
  Crowd,
  Figures,
  hazedMaterial,
  loopMetres,
  Mist,
  type MistCurtain,
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
const KERB = 0.12;
/** Race barriers line the drive; the fans stand in knots on the grass behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.8;
/** The park path on the right, where the skaters and joggers go. */
const PATH = 9;
/** The bison paddock on the left, between these offsets, behind its fence. */
const PADDOCK: readonly [number, number] = [70, 230];
const FENCE = -8.6;
/** Spreckels Lake on the right, its middle at this offset. */
const LAKE = 150;
/** The Dutch Windmill stands above Ocean Beach ahead, hazed by hand. */
const WINDMILL_AHEAD = 420;
/** The windmill's size against a real one, so it carries at the vanishing point. */
const WINDMILL_SCALE = 1.9;
const FOG = 0xc5ccd2;
/** The fog rolling in off the ocean: thick behind the windmill, thinner over the park. */
const CURTAINS: readonly MistCurtain[] = [
  { ahead: 1200, height: 800, opacity: 1 },
  { ahead: 700, height: 220, opacity: 0.75 },
  { ahead: 480, height: 120, opacity: 0.5 },
  { ahead: 260, height: 45, opacity: 0.3 },
];
const BISON = 12;
const SKATERS = 14;
const YACHTS = 6;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
const LOCALS: Wardrobe = {
  tops: [
    '#c0362c',
    '#2f3b4c',
    '#f2efe6',
    '#4f86c6',
    '#ffbf3c',
    '#3a6b4a',
    '#8a8f96',
    '#111111',
    '#7a3e9d',
    '#e86a5a',
  ],
  bottoms: ['#2a3140', '#1e2530', '#3b4a5c', '#6b5a48', '#20242b', '#4a4f57'],
  skins: SKINS,
};
const SKATEWEAR: Wardrobe = {
  tops: ['#ff5d8f', '#ffbf3c', '#2ec4b6', '#7a3e9d', '#ffffff', '#3fe08a'],
  bottoms: ['#111111', '#7a3e9d', '#2f3b4c', '#d8283a'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#c0362c', ink: '#ffffff', text: 'GOLDEN GATE PARK' },
  { fill: '#2f3b4c', ink: '#ffbf3c', text: 'JFK DRIVE' },
  { fill: '#ffbf3c', ink: '#2f3b4c', text: 'HIIT SPRINTS' },
  { fill: '#f2efe6', ink: '#c0362c', text: 'OCEAN BEACH' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#4f86c6', ink: '#ffffff', text: 'FOG CITY' },
];
/** Feather flags along the barriers: the word down each and its colours. */
const FEATHERS: readonly FeatherWord[] = [
  ['SPRINT', '#c0362c', '#ffffff'],
  ['GOLDEN GATE', '#2f3b4c', '#ffbf3c'],
  ['GO', '#ffbf3c', '#2f3b4c'],
  ['FOG CITY', '#4f86c6', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
];
/** A feather flag every so many metres along each barrier, the sides staggered. */
const FEATHER_EVERY = 14;
const STREET_BANNERS: readonly (readonly [string, string, string])[] = [
  ['GOLDEN GATE PARK SPRINTS', '#c0362c', '#ffffff'],
  ['JFK DRIVE · TO OCEAN BEACH', '#2f3b4c', '#ffbf3c'],
];
/** What the fans paint on the drive, its colour and how far off the centre line. */
const ROAD_PAINT: readonly (readonly [string, string, number])[] = [
  ['GO GO', '#ffffff', -1.8],
  ['JFK', '#ffbf3c', 1.8],
  ['SPRINT', '#ffffff', -1.8],
  ['FOG CITY', '#ff8a6a', 1.8],
  ['BISON', '#ffffff', -1.8],
  ['WATTZUP', '#d7ff3a', 1.8],
  ['OCEAN', '#ffffff', -1.8],
  ['ALLEZ', '#ffbf3c', 1.8],
];
/** Flat paint reads only in the first 25 m or so ahead, so some must always be that close. */
const ROAD_PAINT_EVERY = 25;

interface Grazer {
  readonly mesh: Group;
  readonly x: number;
  readonly offset: number;
  readonly heading: number;
}

export class GoldenGateStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly mist: Mist;
  /** Props along the road; one that `lies` on it, as paint does, takes its slope. */
  private readonly props: {
    mesh: Group;
    offset: number;
    every: number;
    x: number;
    lies?: boolean;
  }[] = [];
  private readonly bison: Grazer[] = [];
  private readonly yachts: { mesh: Group; x: number; offset: number; phase: number }[] = [];
  private skaters: Figures | null = null;
  private readonly windmill = new Group();
  private readonly sails = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flagMaterials = ['#c0362c', '#ffbf3c', '#2f3b4c', '#ffffff'].map(
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
      spacing: 0.7,
      wardrobe: LOCALS,
      flags: this.flagMaterials,
      flagShare: 0.15,
      seeds: [449, 457],
      // A park crowd: knots along the barriers, the lawns showing between them, and none in front
      // of the bison paddock so the herd shows over its fence.
      skip: (side, offset, x) =>
        (side < 0 && offset > PADDOCK[0] - 4 && offset < PADDOCK[1] + 4) ||
        offset % 36 > 22 ||
        (x > CROWD_NEAR + 1.4 && offset % 12 > 7),
    });
    this.mist = new Mist(this.group, disposables, track, {
      colour: FOG,
      loop: LOOP,
      curtains: CURTAINS,
      banks: 14,
      bankX: (k) => (k % 2 ? 1 : -1) * (30 + (k % 4) * 22),
    });
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, ...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addGroves();
    this.addLamps();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addPaddock();
    this.addLake();
    this.addSkaters();
    this.addWindmill();
    this.mist.build();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
  }

  /** Lays the kerbs, the lawns, the path and the barriers over the road's points. */
  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** Moves the street with the rider: `heightAt` gives the road's height `metres` ahead. */
  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(metres) + KERB;
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    const t = this.time;
    // The bison graze slowly, turning as they go.
    this.bison.forEach((b, i) => {
      const metres = along(b.offset, LOOP);
      b.mesh.position.set(b.x + Math.sin(t * 0.04 + i) * 1.2, ground(metres), -metres);
      b.mesh.rotation.y = b.heading + Math.sin(t * 0.025 + i * 2) * 0.4;
    });
    // Model yachts tack across the lake.
    for (const y of this.yachts) {
      const metres = along(y.offset + Math.sin(t * 0.05 + y.phase) * 12, LOOP);
      y.mesh.position.set(y.x + Math.cos(t * 0.05 + y.phase) * 5, ground(metres) - 0.05, -metres);
      y.mesh.rotation.y = y.phase + Math.sin(t * 0.05 + y.phase);
    }
    // Skaters roll the path both ways, swaying as they push.
    const skaters = this.skaters;
    if (skaters) {
      for (let i = 0; i < SKATERS; i++) {
        const west = i % 3 !== 0;
        const offset = i * (LOOP / SKATERS) + (west ? 1 : -1) * (2.5 + (i % 4) * 0.5) * t;
        const metres = along(offset, LOOP);
        const sway = Math.sin(t * 2.2 + i) * 0.15;
        const x = PATH + (west ? -0.8 : 0.8) + sway;
        skaters.set(i, x, ground(metres), -metres, (west ? 0 : Math.PI) + sway, 1, 0);
      }
      skaters.commit();
    }
    this.windmill.position.set(0, heightAt(WINDMILL_AHEAD), -WINDMILL_AHEAD);
    this.sails.rotation.z = -t * 0.12;
    this.mist.place(t, heightAt, along, () => KERB);
  }

  /** The kerbs, the lawns, the park path and the barriers. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xbdbab2, roughness: 0.9 });
    const lawn = this.material({ map: this.repeat(lawnTexture(), 6, 6), roughness: 1 });
    const duff = this.material({ map: this.repeat(duffTexture(), 10, 10), roughness: 1 });
    const asphalt = this.material({ color: 0x6e6c68, roughness: 0.95 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
      this.ribbons.add(points, lawn, order([at(30, KERB), at(r + 0.3, KERB)]));
      this.ribbons.add(points, duff, order([at(600, KERB), at(30, KERB)]));
    }
    this.ribbons.add(points, asphalt, [
      [PATH + 1.6, KERB + 0.01],
      [PATH - 1.6, KERB + 0.01],
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
   * The park's groves: tall eucalyptus with pale peeling trunks and hanging blue-green crowns,
   * Monterey cypress with dark, wind-flattened tops, and Monterey pines, on both sides of the
   * drive, opening for the paddock on the left and the lake on the right.
   */
  private addGroves(): void {
    const random = seeded(461);
    const trunk = new CylinderGeometry(0.28, 0.5, 1, 8);
    trunk.translate(0, 0.5, 0);
    // A crown is a dark core for its mass inside foliage cards: three crossed upright planes
    // and a level one, cut out by their leaves so the sky shows through.
    const blob = new SphereGeometry(1, 10, 8);
    const cards = mergeGeometries(
      [0, Math.PI / 3, (2 * Math.PI) / 3]
        .map((turn) => new PlaneGeometry(2, 2).rotateY(turn))
        .concat(new PlaneGeometry(2, 2).rotateX(-Math.PI / 2)),
    );
    this.disposables.push(trunk, blob, cards);
    const gum = this.material({ map: this.track(barkTexture()), roughness: 1 });
    const bark = this.material({ color: 0x4a3f36, roughness: 1 });
    const foliage = (texture: CanvasTexture, core: number) => ({
      leaves: this.material({ map: this.track(texture), alphaTest: 0.45, side: DoubleSide }),
      core: this.material({ color: core, roughness: 1 }),
    });
    const eucalyptus = foliage(foliageTexture('gum', 463), 0x4f6a5c);
    const cypress = foliage(foliageTexture('cypress', 467), 0x1f3324);
    const pine = foliage(foliageTexture('pine', 479), 0x2a4228);
    const crown = (
      tree: Group,
      m: { leaves: Material; core: Material },
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
    ) => {
      const core = new Mesh(blob, m.core);
      core.position.set(x, y, z);
      core.scale.set(sx * 0.55, sy * 0.55, sx * 0.5);
      const c = new Mesh(cards, m.leaves);
      c.position.set(x, y, z);
      c.scale.set(sx, sy, sx * 0.9);
      c.rotation.y = x * 1.7 + y;
      c.castShadow = true;
      tree.add(core, c);
    };
    const plant = (x: number, offset: number) => {
      const tree = new Group();
      const kind = random();
      if (kind < 0.5) {
        // Eucalyptus: a tall, slightly leaning pale trunk and crowns hanging in clumps.
        const height = 26 + random() * 14;
        const t = new Mesh(trunk, gum);
        t.scale.set(1.1, height, 1.1);
        t.rotation.z = (random() - 0.5) * 0.12;
        t.castShadow = true;
        tree.add(t);
        for (let k = 0; k < 6; k++) {
          const y = height * (0.55 + random() * 0.45);
          crown(
            tree,
            eucalyptus,
            (random() - 0.5) * 6,
            y,
            (random() - 0.5) * 6,
            2.4 + random(),
            4.5,
          );
        }
      } else if (kind < 0.8) {
        // Monterey cypress: a short dark trunk under broad, flat, wind-swept layers.
        const height = 7 + random() * 4;
        const t = new Mesh(trunk, bark);
        t.scale.set(1.8, height, 1.8);
        tree.add(t);
        for (let k = 0; k < 4; k++) {
          crown(
            tree,
            cypress,
            (random() - 0.3) * 5,
            height + k * 1.6,
            (random() - 0.5) * 4,
            6 - k,
            2.2,
          );
        }
      } else {
        // Monterey pine: a straight trunk and a rounded, open crown.
        const height = 15 + random() * 6;
        const t = new Mesh(trunk, bark);
        t.scale.set(1.2, height, 1.2);
        tree.add(t);
        crown(tree, pine, 0, height, 0, 5, 4);
        crown(tree, pine, 2, height - 2.5, 1, 3.5, 2.5);
      }
      tree.rotation.y = random() * Math.PI * 2;
      this.group.add(tree);
      this.props.push({ mesh: tree, offset, every: LOOP, x });
    };
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 7 + random() * 6) {
        const inPaddock = side < 0 && offset > PADDOCK[0] - 6 && offset < PADDOCK[1] + 6;
        const byLake = side > 0 && Math.abs(offset - LAKE) < 50;
        const near = inPaddock || byLake ? 70 + random() * 30 : 11 + random() * 8;
        plant(side * near, offset);
        if (random() < 0.7) plant(side * (near + 12 + random() * 25), offset + random() * 6);
      }
    }
  }

  /** The park's green lamp standards along the drive. */
  private addLamps(): void {
    const post = new CylinderGeometry(0.07, 0.11, 4.2, 8);
    post.translate(0, 2.1, 0);
    const lantern = new SphereGeometry(0.28, 12, 10);
    this.disposables.push(post, lantern);
    const green = this.material({ color: 0x2f4a3a, metalness: 0.4, roughness: 0.5 });
    const glass = this.material({
      color: 0xfff6e0,
      emissive: new Color(0xfff1cc),
      emissiveIntensity: 0.5,
    });
    for (const side of [-1, 1] as const) {
      for (let offset = side > 0 ? 10 : 30; offset < LOOP; offset += 40) {
        if (side < 0 && offset > PADDOCK[0] - 4 && offset < PADDOCK[1] + 4) continue;
        const lamp = new Group();
        const lit = new Mesh(lantern, glass);
        lit.position.y = 4.4;
        lamp.add(new Mesh(post, green), lit);
        this.group.add(lamp);
        this.props.push({ mesh: lamp, offset, every: LOOP, x: side * 8 });
      }
    }
  }

  /** The race's feather flags along both barriers, a word down each. */
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

  /** Cloth banners on poles across the drive, the race's name on each. */
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
      this.props.push({ mesh: banner, offset: 110 + i * 250, every: LOOP, x: 0 });
    });
  }

  /** What the fans have painted on the drive. */
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
   * The bison paddock: a dry meadow behind a post-and-rail timber fence, its sign at the gate,
   * a feed shed at the back, and the herd grazing.
   */
  private addPaddock(): void {
    const timber = this.material({ color: 0x7a5f44, roughness: 1 });
    const meadow = this.material({ map: this.track(meadowTexture()), roughness: 1 });
    const length = PADDOCK[1] - PADDOCK[0];
    const paddock = new Group();
    const field = new Mesh(new PlaneGeometry(56, length), meadow);
    this.disposables.push(field.geometry);
    field.rotation.x = -Math.PI / 2;
    field.position.set(-28, 0.02, 0);
    field.receiveShadow = true;
    paddock.add(field);
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      paddock.add(mesh);
      return mesh;
    };
    for (let z = -length / 2; z <= length / 2; z += 3) box(timber, 0.18, 1.6, 0.18, 0, 0, z);
    for (const y of [0.6, 1.25]) box(timber, 0.08, 0.14, length, 0.1, y, 0);
    box(timber, 8, 3.6, 5, -42, 0, -length / 4);
    box(this.material({ color: 0x5a4632 }), 8.6, 0.3, 5.6, -42, 3.6, -length / 4);
    const sign = new Mesh(
      new PlaneGeometry(3.6, 1.1),
      this.material({
        map: this.track(clothBannerTexture('BISON PADDOCK', '#5a4632', '#f2e6c8')),
        side: DoubleSide,
      }),
    );
    this.disposables.push(sign.geometry);
    sign.position.set(0.3, 2.3, length / 2 - 2);
    sign.rotation.y = Math.PI / 2;
    paddock.add(sign);
    for (const z of [length / 2 - 3.8, length / 2 - 0.2]) box(timber, 0.15, 2.9, 0.15, 0.3, 0, z);
    this.group.add(paddock);
    this.props.push({
      mesh: paddock,
      offset: (PADDOCK[0] + PADDOCK[1]) / 2,
      every: LOOP,
      x: FENCE,
    });
    // The herd: dark woolly forequarters and the hump high over the shoulders, a leaner, paler
    // rump, the heavy head carried low with its beard and short curved horns, on slim legs.
    // Some graze, some look up; a few are tawny calves.
    const ball = new SphereGeometry(1, 14, 10);
    const leg = new CylinderGeometry(0.09, 0.13, 1, 6);
    leg.translate(0, -0.5, 0);
    const hook = new TorusGeometry(0.16, 0.05, 5, 8, Math.PI * 0.7);
    this.disposables.push(ball, leg, hook);
    const wool = this.material({ map: this.track(coatTexture()), roughness: 1 });
    const hide = this.material({ color: 0x5a4030, roughness: 1 });
    const dark = this.material({ color: 0x241a14, roughness: 1 });
    const horn = this.material({ color: 0x2e2a26, roughness: 0.6 });
    const tawny = this.material({ color: 0xa8713e, roughness: 1 });
    const random = seeded(487);
    for (let k = 0; k < BISON; k++) {
      const b = new Group();
      const calf = k % 5 === 4;
      const grazing = k % 3 !== 0;
      const blob = (
        m: Material,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(ball, calf ? tawny : m);
        mesh.scale.set(sx, sy, sz);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        b.add(mesh);
        return mesh;
      };
      blob(hide, 0.5, 0.55, 0.85, 0, 1.15, 0.55);
      blob(wool, 0.68, 0.85, 0.8, 0, 1.4, -0.35);
      blob(wool, 0.5, 0.45, 0.5, 0, 1.95, -0.25);
      const head = new Group();
      head.position.set(0, grazing ? 0.95 : 1.3, -1.05);
      head.rotation.x = grazing ? 0.9 : 0.2;
      b.add(head);
      const part = (
        m: Material,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(ball, calf ? tawny : m);
        mesh.scale.set(sx, sy, sz);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        head.add(mesh);
      };
      part(wool, 0.42, 0.45, 0.42, 0, 0, 0);
      part(dark, 0.26, 0.3, 0.32, 0, -0.18, -0.36);
      part(wool, 0.16, 0.3, 0.16, 0, -0.42, -0.2);
      if (!calf) {
        for (const side of [-1, 1]) {
          const h = new Mesh(hook, horn);
          h.position.set(side * 0.36, 0.18, -0.05);
          h.rotation.set(0, side > 0 ? 0 : Math.PI, 0.3);
          head.add(h);
        }
      }
      for (const [x, z, front] of [
        [-0.28, -0.55, true],
        [0.28, -0.55, true],
        [-0.25, 0.85, false],
        [0.25, 0.85, false],
      ] as const) {
        const l = new Mesh(leg, calf ? tawny : dark);
        l.position.set(x, front ? 0.85 : 0.9, z);
        l.scale.y = front ? 0.85 : 0.9;
        l.castShadow = true;
        b.add(l);
      }
      const tail = new Mesh(leg, dark);
      tail.position.set(0, 1.45, 1.3);
      tail.rotation.x = -0.25;
      tail.scale.set(0.4, 0.7, 0.4);
      b.add(tail);
      b.scale.setScalar(calf ? 0.7 : 1.25);
      this.group.add(b);
      this.bison.push({
        mesh: b,
        // Bunched toward the paddock's near end and the fence, where the fog still shows them.
        x: FENCE - 2.5 - random() * 14,
        offset: PADDOCK[0] + 6 + random() ** 2 * (PADDOCK[1] - PADDOCK[0] - 20),
        heading: random() * Math.PI * 2,
      });
    }
  }

  /** Spreckels Lake: still grey water in a low stone rim, model yachts tacking across it. */
  private addLake(): void {
    const lake = new Group();
    const water = new Mesh(
      new PlaneGeometry(46, 80),
      this.material({ color: 0x7d8f96, roughness: 0.15, metalness: 0.2 }),
    );
    this.disposables.push(water.geometry);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.04;
    lake.add(water);
    const rim = this.material({ color: 0xa9a49a, roughness: 0.9 });
    for (const [w, d, x, z] of [
      [47, 0.6, 0, -40],
      [47, 0.6, 0, 40],
      [0.6, 80, -23.3, 0],
      [0.6, 80, 23.3, 0],
    ] as const) {
      const edge = new Mesh(this.unit, rim);
      edge.scale.set(w, 0.3, d);
      edge.position.set(x, 0.05, z);
      lake.add(edge);
    }
    this.group.add(lake);
    this.props.push({ mesh: lake, offset: LAKE, every: LOOP, x: 40 });
    const hull = this.material({ color: 0xf2efe6, roughness: 0.5 });
    const sail = this.material({ color: 0xffffff, side: DoubleSide, roughness: 0.7 });
    const accent = this.material({ color: 0xc0362c, side: DoubleSide, roughness: 0.7 });
    const cloth = new ConeGeometry(0.4, 1.4, 3);
    this.disposables.push(cloth);
    for (let k = 0; k < YACHTS; k++) {
      const yacht = new Group();
      const h = new Mesh(this.unit, hull);
      h.scale.set(0.25, 0.15, 0.9);
      const s = new Mesh(cloth, k % 3 === 0 ? accent : sail);
      s.scale.set(0.2, 1, 1);
      s.position.y = 0.8;
      yacht.add(h, s);
      this.group.add(yacht);
      this.yachts.push({
        mesh: yacht,
        x: 34 + (k % 3) * 6,
        offset: LAKE - 30 + k * 11,
        phase: k * 1.7,
      });
    }
  }

  /** Roller skaters and joggers on the park path, built on the kit's figures. */
  private addSkaters(): void {
    this.skaters = new Figures(this.group, this.disposables, SKATERS, SKATEWEAR, 491);
  }

  /**
   * The Dutch Windmill above Ocean Beach: an octagonal shingled tower tapering to a gallery and a
   * domed cap, its four lattice sails turning on the street's clock, the tulip beds at its foot,
   * the dunes and the grey Pacific behind, all hazed by hand.
   */
  private addWindmill(): void {
    const haze = new Color(FOG);
    const shingle = hazedMaterial(this.disposables, haze, 0xf2ecde, 0.08, {
      map: this.track(shingleTexture()),
    });
    const cap = hazedMaterial(this.disposables, haze, 0x4a3a2e, 0.08);
    const frame = hazedMaterial(this.disposables, haze, 0x2e241c, 0.08);
    const lattice = hazedMaterial(this.disposables, haze, 0x6a5240, 0.08, {
      map: this.track(latticeTexture()),
      alphaTest: 0.4,
      side: DoubleSide,
    });
    const sand = hazedMaterial(this.disposables, haze, 0xd8c8a4, 0.4);
    const sea = hazedMaterial(this.disposables, haze, 0x6f8792, 0.55);
    const w = this.windmill;
    const x = 9;
    const z = 0;
    const tower = new Mesh(new CylinderGeometry(4.6, 7.4, 22, 8), shingle);
    tower.position.set(x, 11, z);
    const gallery = new Mesh(new CylinderGeometry(7, 7, 0.5, 8), frame);
    gallery.position.set(x, 9, z);
    const dome = new Mesh(new SphereGeometry(5.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), cap);
    dome.scale.set(1, 0.9, 1.3);
    dome.position.set(x, 22, z);
    this.disposables.push(tower.geometry, gallery.geometry, dome.geometry);
    w.add(tower, gallery, dome);
    // The sails: four lattice blades on their stocks, facing the riders.
    const stock = new BoxGeometry(0.5, 30, 0.5);
    const blade = new PlaneGeometry(3.4, 12);
    blade.translate(1.9, 8.4, 0);
    this.disposables.push(stock, blade);
    for (let k = 0; k < 2; k++) {
      const s = new Mesh(stock, frame);
      s.rotation.z = (k * Math.PI) / 2;
      this.sails.add(s);
    }
    for (let k = 0; k < 4; k++) {
      const b = new Mesh(blade, lattice);
      b.rotation.z = (k * Math.PI) / 2;
      this.sails.add(b);
    }
    this.sails.position.set(x, 22, z + 6.6);
    this.sails.rotation.x = -0.1;
    w.add(this.sails);
    // Tulip beds at its foot, in rows of red, yellow and pink.
    const tulips = ['#d8283a', '#ffd200', '#ff8fab', '#f2efe6'].map((c) =>
      hazedMaterial(this.disposables, haze, c, 0.12),
    );
    for (let k = 0; k < 8; k++) {
      const bed = new Mesh(this.unit, tulips[k % tulips.length]!);
      bed.scale.set(14, 0.5, 2.2);
      bed.position.set(x - 2, 0.25, z + 12 + k * 3.2);
      w.add(bed);
    }
    // The dunes behind Ocean Beach and the Pacific beyond.
    const dune = new Mesh(this.unit, sand);
    dune.scale.set(900, 4, 60);
    dune.position.set(0, 0, -90);
    const ocean = new Mesh(new PlaneGeometry(9000, 3000), sea);
    this.disposables.push(ocean.geometry);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -0.5, -1600);
    w.add(dune, ocean);
    // The mill and its tulips at their size; the dunes and the sea stay as laid.
    for (const part of w.children) {
      if (part === dune || part === ocean) continue;
      part.position.x = x + (part.position.x - x) * WINDMILL_SCALE;
      part.position.y *= WINDMILL_SCALE;
      part.position.z *= WINDMILL_SCALE;
      part.scale.multiplyScalar(WINDMILL_SCALE);
    }
    this.group.add(w);
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

/** Mown park lawn, cool green under the fog. */
function lawnTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#5f8048', 499);
    const random = seeded(503);
    for (let i = 0; i < 600; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(40,60,30,0.3)' : 'rgba(160,190,120,0.25)';
      g.fillRect(random() * 256, random() * 256, 2, 5);
    }
  });
}

/** The groves' floor of fallen eucalyptus leaves, bark strips and needles. */
function duffTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6b6248', 509);
    const random = seeded(521);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(160,140,100,0.4)' : 'rgba(60,80,50,0.35)';
      g.fillRect(random() * 256, random() * 256, 8, 2);
    }
  });
}

/** The paddock's dry summer meadow. */
function meadowTexture(): CanvasTexture {
  const texture = canvasTexture(256, 256, (g) => speckle(g, 256, 256, '#a89a62', 523));
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(8, 20);
  return texture;
}

/** A eucalyptus trunk's pale bark, peeling in long strips. */
function barkTexture(): CanvasTexture {
  const texture = canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#cfc6b4', 541);
    const random = seeded(547);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(140,110,90,0.45)' : 'rgba(200,190,170,0.6)';
      g.fillRect(random() * 64, random() * 256, 3 + random() * 5, 30 + random() * 60);
    }
  });
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 4);
  return texture;
}

/**
 * A foliage card: leaves on a clear ground, thickest in the middle and thinning to ragged
 * edges. Eucalyptus hangs in drooping blue-green strands of sickle leaves, Monterey cypress
 * grows in dense dark clumps and pine in tufts of needles.
 */
function foliageTexture(kind: 'gum' | 'cypress' | 'pine', seed: number): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const random = seeded(seed);
    const greens = {
      gum: ['#7d9a86', '#8fa894', '#6a8572', '#a3b59a', '#5d7766'],
      cypress: ['#2f4a32', '#3a5a3c', '#26402a', '#456b46'],
      pine: ['#3d5a36', '#4a6b40', '#33502e', '#5a7a48'],
    }[kind];
    const spot = () => {
      // Denser towards the middle: the mean of two draws.
      const r = ((random() + random()) / 2) * 118;
      const a = random() * Math.PI * 2;
      return [128 + Math.cos(a) * r, 128 + Math.sin(a) * r * 0.9] as const;
    };
    g.lineCap = 'round';
    for (let i = 0; i < (kind === 'cypress' ? 520 : 380); i++) {
      const [x, y] = spot();
      g.strokeStyle = greens[Math.floor(random() * greens.length)]!;
      g.fillStyle = g.strokeStyle;
      if (kind === 'gum') {
        // A drooping strand: a short stalk hanging down with leaves along it.
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(
          x + (random() - 0.5) * 10,
          y + 8,
          x + (random() - 0.5) * 6,
          y + 14 + random() * 10,
        );
        g.stroke();
      } else if (kind === 'cypress') {
        g.beginPath();
        g.arc(x, y, 3 + random() * 4, 0, Math.PI * 2);
        g.fill();
      } else {
        g.lineWidth = 1.6;
        for (let n = 0; n < 6; n++) {
          const a = random() * Math.PI * 2;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7);
          g.stroke();
        }
      }
    }
  });
}

/** A bison's shaggy brown coat. */
function coatTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#3e2a1c', 557);
    const random = seeded(569);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(20,12,8,0.45)' : 'rgba(120,85,55,0.35)';
      g.fillRect(random() * 64, random() * 64, 2, 4 + random() * 4);
    }
  });
}

/** The windmill's cream shingles in courses. */
function shingleTexture(): CanvasTexture {
  const texture = canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#ece6d8', 563);
    g.fillStyle = 'rgba(80,70,60,0.25)';
    for (let y = 0; y < 128; y += 8) g.fillRect(0, y, 128, 1);
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 6);
  return texture;
}

/** A windmill sail's lattice of bars on a clear ground. */
function latticeTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 6, 256);
    g.fillRect(58, 0, 6, 256);
    for (let y = 0; y < 256; y += 20) g.fillRect(0, y, 64, 4);
    g.fillRect(28, 0, 4, 256);
  });
}
