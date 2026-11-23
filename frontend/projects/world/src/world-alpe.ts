// Alpe d'Huez, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the climb of the
// twenty-one hairpins above Bourg-d'Oisans on a blazing July afternoon, closed for the ride. On
// the right the mountainside rises in alpine meadow and rock, the verge packed with camper vans
// under their awnings and flags; on the left a low stone wall, and past it the slope falls away to
// the valley floor far below. Numbered VIRAGE signs count the bends down, the tarmac is covered in
// painted names, fans line every bend, and at Dutch Corner the crowd turns orange round the church
// of Huez. Ahead the hairpins stack up the mountainside to the ski station, under the snowy peaks
// of the Grandes Rousses.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags and road paint of world-kit.ts.
import {
  type CanvasTexture,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
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
  FeatherFlags,
  type FeatherWord,
  hazedMaterial,
  loopMetres,
  paintTexture,
  Ribbons,
  scaleFaceUv,
  type SceneStreet,
  seeded,
  speckle,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 500;
const BEHIND = 30;
const KERB = 0.12;
/** Race barriers line the road; the fans stand packed behind them. */
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.9;
/** The verge on the mountain side, where the camper vans park, before the slope rises. */
const VERGE = 13;
/** The low stone wall on the valley side, before the drop. */
const WALL = 7.6;
/** The mountainside with its stacked hairpins rises from this far ahead. */
const FACE_AHEAD = 280;
/** How steeply the mountainside ahead rises, and how far back it runs. */
const FACE_TILT = 0.4;
const FACE_DEPTH = 1250;
/** Dutch Corner: the bend where the crowd turns orange, round the church of Huez. */
const DUTCH = 140;
const DUTCH_HALF = 48;
const CHURCH = 172;
/** The VIRAGE signs: one at every bend, counting down; the first is Dutch Corner's, bend 7. */
const BEND_EVERY = 125;
const FIRST_BEND = 7;
const HAZE = 0xc9d8ea;

/** How high the ground stands above the road `x` metres off its centre. */
function rise(x: number): number {
  if (x >= 0) {
    if (x <= VERGE) return 0;
    if (x <= 60) return (x - VERGE) * 0.45;
    return (60 - VERGE) * 0.45 + (x - 60) * 0.6;
  }
  const d = -x;
  if (d <= WALL + 0.6) return 0;
  if (d <= 40) return -((d - WALL - 0.6) * 0.6);
  if (d <= 160) return -19 - (d - 40) * 0.55;
  return -85 - Math.min(d - 160, 240) * 0.75;
}

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
const FANS: Wardrobe = {
  tops: [
    '#1d3c8f',
    '#ffffff',
    '#d8283a',
    '#f2c230',
    '#2a8a4a',
    '#111111',
    '#7a3e9d',
    '#5aa0d0',
    '#e86a5a',
    '#3a3f47',
  ],
  bottoms: ['#2a3140', '#1e2530', '#3b4a5c', '#c9b48a', '#20242b', '#4a4f57'],
  skins: SKINS,
};
/** Dutch Corner's fans, all in orange. */
const ORANJE: Wardrobe = {
  tops: ['#ff6a00', '#ff7f11', '#f25c05', '#ff8c1a', '#ffffff', '#ff6a00'],
  bottoms: ['#ff6a00', '#1e2530', '#2a3140', '#f25c05'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1d3c8f', ink: '#ffffff', text: "ALPE D'HUEZ" },
  { fill: '#f2c230', ink: '#1b1e24', text: '21 VIRAGES' },
  { fill: '#d8283a', ink: '#ffffff', text: 'OISANS' },
  { fill: '#ffffff', ink: '#1d3c8f', text: 'ISÈRE' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#2a8a4a', ink: '#ffffff', text: 'GRANDES ROUSSES' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['VIRAGE DES HOLLANDAIS', '#ff6a00', '#ffffff', DUTCH + 10],
  ["ALPE D'HUEZ · 21 VIRAGES", '#1d3c8f', '#ffffff', DUTCH + 250],
];
const FEATHERS: readonly FeatherWord[] = [
  ["ALPE D'HUEZ", '#1d3c8f', '#ffffff'],
  ['ALLEZ', '#d8283a', '#ffffff'],
  ['21 VIRAGES', '#f2c230', '#1b1e24'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
];
const FEATHER_EVERY = 16;
/**
 * The names and cries the fans paint on the tarmac, in their colours: the pacers' names, the
 * nations' cries, and the hairpins counted.
 */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['ALLEZ MAYA', '#ffffff'],
  ['HUP JONAS', '#ff8c1a'],
  ['VAS-Y', '#f2c230'],
  ['GO KENJI', '#ffffff'],
  ['FORZA ANA', '#d7ff3a'],
  ['HUP HOLLAND', '#ff8c1a'],
  ['RAVI!', '#ffffff'],
  ['ALLEZ SOPHIE', '#f2c230'],
  ['DANSE!', '#ffffff'],
  ['OPPA!', '#ff6a3a'],
  ['ALLEZ', '#ffffff'],
  ['VAMOS', '#f2c230'],
  ['SOPHIE', '#5ab4ff'],
  ['JONAS!!', '#ffffff'],
  ['ORANJE', '#ff8c1a'],
  ['KENJI', '#d7ff3a'],
  ['MAYA', '#ff6a3a'],
  ['ALLEZ ALLEZ', '#ffffff'],
  ['ANA', '#f2c230'],
  ['ALLEZ RAVI', '#5ab4ff'],
];
/** Cries painted big, right across the road. */
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['ALLEZ', '#ffffff'],
  ['WATTZUP', '#d7ff3a'],
  ['21 VIRAGES', '#f2c230'],
  ['HUP HUP HUP', '#ff8c1a'],
];
/** A row of paint every few metres: two names in staggered lanes, every third a slogan across. */
const ROAD_PAINT_EVERY = 6;
/** The national flags the camper vans fly: three bands each, upright or across. */
const FLAGS: readonly (readonly [string, string, string, boolean])[] = [
  ['#1d3c8f', '#ffffff', '#d8283a', true],
  ['#ae1c28', '#ffffff', '#21468b', false],
  ['#000000', '#fdda24', '#ef3340', true],
  ['#009246', '#ffffff', '#ce2b37', true],
  ['#ff6a00', '#ff6a00', '#ffffff', false],
  ['#aa151b', '#f1bf00', '#aa151b', false],
];

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly every: number;
  readonly x: number;
  /** How far the ground under it stands above the road. */
  readonly rise: number;
  /** Lies on the road, as paint does, and takes its slope. */
  readonly lies?: boolean;
}

export class AlpeStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly oranje: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private time = 0;
  /** The flares' smoke: each puff, the side it drifts to and where it is in its rise. */
  private readonly smoke: { mesh: Mesh; side: number; phase: number }[] = [];
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flagMaterials = ['#1d3c8f', '#ffffff', '#d8283a', '#f2c230'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );
  private readonly orangeFlags = ['#ff6a00', '#ffffff', '#21468b'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    const dutch = (offset: number) => Math.abs(offset - DUTCH) < DUTCH_HALF;
    // Fans packed along every bend, thinning only between them.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.6,
      wardrobe: FANS,
      flags: this.flagMaterials,
      flagShare: 0.25,
      seeds: [2011, 2017],
      skip: (side, offset, x) =>
        dutch(offset) ||
        (offset % BEND_EVERY > 80 && offset % 9 > 4) ||
        (side < 0 && x < -CROWD_NEAR - 1.6),
    });
    this.oranje = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.5,
      wardrobe: ORANJE,
      flags: this.orangeFlags,
      flagShare: 0.4,
      seeds: [2027, 2029],
      skip: (side, offset, x) => !dutch(offset) || (side < 0 && x < -CROWD_NEAR - 1.6),
    });
    this.group.add(this.horizon);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, ...this.flagMaterials, ...this.orangeFlags);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.oranje.build();
    this.addVans();
    this.addBendSigns();
    this.addChurch();
    this.addFlares();
    this.addVillage();
    this.addLarches();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addMountain();
  }

  /** The street's clock, in seconds; held at 0 for reduced motion. */
  setTime(seconds: number): void {
    this.time = seconds;
    // Each puff rises from its flare, swells and thins, drifting away from the road.
    for (const puff of this.smoke) {
      const u = (seconds * 0.16 + puff.phase) % 1;
      puff.mesh.position.set(puff.side * u * 2.2, 2.3 + u * 9, -u * 1.2);
      puff.mesh.scale.setScalar(0.35 + u * 1.9);
      (puff.mesh.material as MeshStandardMaterial).opacity = 0.42 * (1 - u) ** 1.5;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    for (const prop of this.props) {
      const metres = along(prop.offset, prop.every);
      prop.mesh.visible = metres < FACE_AHEAD - 10;
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB + prop.rise, -metres);
      // The fans' paint lies along the ramp, not level through it, where half of each word
      // would sink into the tarmac and half float over it.
      if (prop.lies) {
        prop.mesh.rotation.x = Math.atan((heightAt(metres + 1) - heightAt(metres - 1)) / 2);
      }
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.oranje.place(this.time, heightAt, along, KERB);
    this.horizon.position.set(0, heightAt(FACE_AHEAD), -FACE_AHEAD);
  }

  /** The kerbs, the verge and the meadow rising on the right, the wall and the drop on the left. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ color: 0xc9c6bc, roughness: 0.9 });
    const verge = this.material({ map: this.repeat(vergeTexture(), 4, 4), roughness: 1 });
    const meadow = this.material({ map: this.repeat(meadowTexture(), 7, 7), roughness: 1 });
    const rock = this.material({ map: this.repeat(rockTexture(), 6, 6), roughness: 0.95 });
    const wall = this.material({ map: this.repeat(wallTexture(), 2, 0.8), roughness: 0.95 });
    for (const side of [1, -1] as const) {
      const at = (x: number, h: number): [number, number] => [side * x, h];
      const order = <T>(list: T[]) => (side > 0 ? list : list.reverse());
      this.ribbons.add(points, kerb, order([at(r + 0.3, KERB), at(r, KERB), at(r, 0)]));
    }
    this.ribbons.add(points, verge, [
      [VERGE, KERB],
      [r + 0.3, KERB],
    ]);
    // The mountainside: meadow, a band of grey rock, meadow again and rock above.
    const slope = (from: number, to: number, step: number): [number, number][] => {
      const list: [number, number][] = [];
      for (let x = to; x > from; x -= step) list.push([x, KERB + rise(x)]);
      list.push([from, KERB + rise(from)]);
      return list;
    };
    this.ribbons.add(points, meadow, slope(VERGE, 34, 7));
    this.ribbons.add(points, rock, slope(34, 48, 7));
    this.ribbons.add(points, meadow, slope(48, 120, 12));
    this.ribbons.add(points, rock, slope(120, 900, 130));
    // The valley side: a strip of verge, the low stone wall, and the slope falling away.
    this.ribbons.add(points, verge, [
      [-r - 0.3, KERB],
      [-WALL, KERB],
    ]);
    this.ribbons.add(points, wall, [
      [-WALL, KERB],
      [-WALL, KERB + 0.75],
      [-WALL - 0.55, KERB + 0.75],
      [-WALL - 0.55, KERB],
    ]);
    const drop: [number, number][] = [[-WALL - 0.55, KERB]];
    for (const d of [10, 20, 40, 80, 160, 260, 400, 2400]) drop.push([-d, KERB + rise(-d)]);
    this.ribbons.add(points, meadow, drop);
    // White edge lines, broken, as on the climb.
    const edge = this.material({
      map: this.repeat(dashTexture(), 0.15, 6),
      alphaTest: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    for (const side of [1, -1]) {
      const x = side * (r - 0.25);
      this.ribbons.add(points, edge, [
        [Math.max(x, x - side * 0.15), 0.006],
        [Math.min(x, x - side * 0.15), 0.006],
      ]);
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
   * Camper vans packed nose to tail on the mountain-side verge, as they are for days before a
   * stage: white coachbuilt bodies over a cab, a striped awning out towards the road with
   * folding chairs under it, and a national flag on a pole.
   */
  private addVans(): void {
    const random = seeded(2101);
    const white = this.material({ color: 0xf2f1ec, roughness: 0.6 });
    const cream = this.material({ color: 0xe6e0d0, roughness: 0.6 });
    const glass = this.material({ color: 0x24303a, roughness: 0.2, metalness: 0.3 });
    const tyre = this.material({ color: 0x1c1c1c, roughness: 0.95 });
    const stripe = ['#d8283a', '#1d3c8f', '#2a8a4a', '#ff6a00'].map((c) =>
      this.material({ color: c, roughness: 0.7 }),
    );
    const awnings = ['#3a6a9a', '#c8462a', '#2a8a4a', '#d8a020'].map((c) =>
      this.material({ map: this.track(awningTexture(c)), side: DoubleSide, roughness: 0.8 }),
    );
    const flags = FLAGS.map(([a, b, c, upright]) =>
      this.material({ map: this.track(flagTexture(a, b, c, upright)), side: DoubleSide }),
    );
    const steel = this.material({ color: 0x9aa0a6, metalness: 0.5, roughness: 0.4 });
    const wheel = new CylinderGeometry(0.38, 0.38, 0.25, 12);
    wheel.rotateZ(Math.PI / 2);
    const pole = new CylinderGeometry(0.03, 0.03, 5, 6);
    pole.translate(0, 2.5, 0);
    const cloth = new PlaneGeometry(1.4, 0.9);
    cloth.translate(0.72, 4.4, 0);
    const awning = new PlaneGeometry(2.4, 4.6);
    this.disposables.push(wheel, pole, cloth, awning);
    let k = 0;
    for (let offset = 6; offset < LOOP; offset += 7.6 + random() * 3) {
      if (random() < 0.12) continue;
      const van = new Group();
      const length = 6 + random() * 1.4;
      const box = (
        m: MeshStandardMaterial,
        w: number,
        h: number,
        d: number,
        x: number,
        y: number,
        z: number,
      ) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(w, h, d);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        van.add(mesh);
      };
      const body = k % 3 === 2 ? cream : white;
      // The living box, its overcab, the cab, the windows and a stripe down its side.
      box(body, 2.3, 2.5, length - 1.4, 0, 1.75, -0.7);
      box(body, 2.2, 0.7, 1.4, 0, 2.65, length / 2 - 1.2);
      box(body, 2.2, 1.6, 1.3, 0, 1.25, length / 2 - 0.4);
      box(glass, 2.25, 0.7, 0.05, 0, 1.6, length / 2 + 0.26);
      box(glass, 0.05, 0.6, 1.1, -1.16, 1.65, length / 2 - 0.4);
      for (const wz of [-length / 4, length / 8]) box(glass, 0.05, 0.6, 1, -1.16, 2.1, wz);
      box(stripe[k % 4]!, 2.32, 0.18, length - 1.4, 0, 1.15, -0.7);
      for (const [wx, wz] of [
        [-1.05, length / 2 - 0.6],
        [1.05, length / 2 - 0.6],
        [-1.05, -length / 2 + 1.2],
        [1.05, -length / 2 + 1.2],
      ] as const) {
        const w = new Mesh(wheel, tyre);
        w.position.set(wx, 0.38, wz);
        van.add(w);
      }
      // The awning out towards the road, on two legs, chairs under it.
      if (random() < 0.7) {
        const a = new Mesh(awning, awnings[k % 4]!);
        a.rotation.z = Math.PI / 2 - 0.18;
        a.rotation.y = Math.PI;
        a.rotation.order = 'YZX';
        a.position.set(-2.3, 2.55, -0.9);
        van.add(a);
        for (const lz of [-3, 1.2]) box(steel, 0.05, 2.3, 0.05, -3.45, 1.15, lz);
        for (let c = 0; c < 2 + (k % 2); c++) {
          box(stripe[(k + c + 1) % 4]!, 0.5, 0.5, 0.5, -2.4 - c * 0.15, 0.5, -2 + c * 1.1);
        }
      }
      const p = new Mesh(pole, steel);
      p.position.set(-1.6, 2.9, length / 2 - 2);
      const f = new Mesh(cloth, flags[k % flags.length]!);
      f.position.set(-1.6, 2.9, length / 2 - 2);
      f.rotation.y = Math.PI / 2 + 0.4;
      van.add(p, f);
      van.rotation.y = (random() - 0.5) * 0.12;
      this.group.add(van);
      this.props.push({ mesh: van, offset, every: LOOP, x: 10.6 + random() * 0.8, rise: 0 });
      k++;
    }
  }

  /** At every bend a white VIRAGE sign on the mountain side, counting down to the top. */
  private addBendSigns(): void {
    const post = new CylinderGeometry(0.05, 0.05, 3.4, 8);
    post.translate(0, 1.7, 0);
    const panel = new PlaneGeometry(1.3, 1.5);
    panel.translate(0, 3.6, 0.03);
    this.disposables.push(post, panel);
    const steel = this.material({ color: 0x9aa0a6, metalness: 0.5, roughness: 0.4 });
    for (let k = 0; k < LOOP / BEND_EVERY; k++) {
      const bend = FIRST_BEND - k;
      const sign = new Group();
      sign.add(new Mesh(post, steel));
      const face = new Mesh(
        panel,
        this.material({ map: this.track(bendTexture(bend > 0 ? bend : bend + 21, 1850 - k * 70)) }),
      );
      // Turned to face the rider coming up the road.
      face.rotation.y = -0.35;
      sign.add(face);
      this.group.add(sign);
      this.props.push({
        mesh: sign,
        offset: DUTCH - 18 + k * BEND_EVERY,
        every: LOOP,
        x: CROWD_FAR + 0.6,
        rise: 0,
      });
    }
  }

  /**
   * The church of Huez on the outside of Dutch Corner, below the wall: a stone nave under a steep
   * slate roof, a square bell tower with louvred openings under a slate spire and its cross, and
   * the little graveyard wall round it.
   */
  private addChurch(): void {
    const g = new Group();
    const stone = this.material({ map: this.track(churchStoneTexture()), roughness: 1 });
    stone.map!.wrapS = RepeatWrapping;
    stone.map!.wrapT = RepeatWrapping;
    const slate = this.material({ color: 0x46484e, roughness: 0.7 });
    const dark = this.material({ color: 0x23201e, roughness: 0.8 });
    const nave = new BoxGeometry(9, 7, 17);
    for (const f of [0, 1]) scaleFaceUv(nave, f, 17 / 4, 7 / 4);
    for (const f of [4, 5]) scaleFaceUv(nave, f, 9 / 4, 7 / 4);
    nave.translate(0, 3.5, 0);
    const pitch = new Shape();
    pitch.moveTo(-5.2, 0);
    pitch.lineTo(5.2, 0);
    pitch.lineTo(0, 5);
    pitch.closePath();
    const roof = new ExtrudeGeometry(pitch, { depth: 18, bevelEnabled: false });
    roof.translate(0, 7, -9);
    const tower = new BoxGeometry(4.4, 15, 4.4);
    for (const f of [0, 1, 4, 5]) scaleFaceUv(tower, f, 4.4 / 4, 15 / 4);
    tower.translate(0, 7.5, 0);
    const spire = new ConeGeometry(3.4, 9, 4);
    spire.rotateY(Math.PI / 4);
    spire.translate(0, 15 + 4.5, 0);
    this.disposables.push(nave, roof, tower, spire);
    const n = new Mesh(nave, stone);
    const r = new Mesh(roof, slate);
    const t = new Mesh(tower, stone);
    t.position.z = 10.6;
    const sp = new Mesh(spire, slate);
    sp.position.z = 10.6;
    for (const m of [n, r, t, sp]) m.castShadow = true;
    g.add(n, r, t, sp);
    // Louvred belfry openings, the round-headed windows down the nave and the door.
    const opening = new PlaneGeometry(1.2, 2.2);
    this.disposables.push(opening);
    for (const [x, z, ry] of [
      [2.21, 10.6, Math.PI / 2],
      [0, 12.81, 0],
      [-2.21, 10.6, -Math.PI / 2],
    ] as const) {
      const o = new Mesh(opening, dark);
      o.position.set(x, 12.6, z);
      o.rotation.y = ry;
      g.add(o);
    }
    for (const z of [-5, -1, 3]) {
      const w = new Mesh(opening, dark);
      w.scale.set(0.8, 1, 1);
      w.position.set(4.51, 3.6, z);
      w.rotation.y = Math.PI / 2;
      g.add(w);
    }
    const cross = this.material({ color: 0x2a2a2a });
    const bar = (w: number, h: number, y: number) => {
      const m = new Mesh(this.unit, cross);
      m.scale.set(w, h, 0.15);
      m.position.set(0, y, 10.6);
      g.add(m);
    };
    bar(0.15, 1.8, 25);
    bar(0.9, 0.15, 25.4);
    // The graveyard wall, low, round the church on the road side.
    const wall = this.material({ map: this.repeat(wallTexture(), 2, 0.8), roughness: 0.95 });
    const w = new Mesh(this.unit, wall);
    w.scale.set(0.5, 1, 30);
    w.position.set(7, 0.5, 2);
    g.add(w);
    // It stands on a terrace a little below the road, turned to the bend.
    g.rotation.y = 0.25;
    this.group.add(g);
    this.props.push({ mesh: g, offset: CHURCH, every: LOOP, x: -22, rise: -3.5 });
  }

  /**
   * The village of Huez round Dutch Corner: houses of grey stone or ochre and cream render
   * stepping down the valley side round the church and up the mountain side, each under a steep
   * slate gable with a chimney, a timber balcony across its gable end and shutters either side of
   * its windows.
   */
  private addVillage(): void {
    const random = seeded(2501);
    const stone = this.material({ map: this.track(churchStoneTexture()), roughness: 1 });
    stone.map!.wrapS = RepeatWrapping;
    stone.map!.wrapT = RepeatWrapping;
    const renders = [0xe8d8b4, 0xd9b77a, 0xf0e8d6, 0xc99a6a].map((c) =>
      this.material({ color: c, roughness: 0.95 }),
    );
    const slate = this.material({ color: 0x4a4c52, roughness: 0.75 });
    const timber = this.material({ color: 0x6a4428, roughness: 0.9 });
    const shutters = [0x2f5a3a, 0x6a3a22, 0x3a4a6a].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    const glass = this.material({ color: 0x2a3036, roughness: 0.3 });
    // Where each house stands: how far into the loop, how far off the road, how it is turned.
    const houses: [number, number, number][] = [
      [142, -40, 0.1],
      [160, -32, 0.3],
      [188, -36, -0.2],
      [196, -17, 0.15],
      [208, -28, 0.4],
      [222, -16, -0.1],
      [168, 20, -0.15],
      [182, 27, 0.1],
      [200, 20, 0.2],
      [216, 30, -0.1],
      [232, 22, 0.05],
    ];
    houses.forEach(([offset, x, turn], i) => {
      const g = new Group();
      const w = 7 + random() * 3;
      const d = 9 + random() * 4;
      const storeys = 2 + Math.floor(random() * 2);
      const tall = storeys * 2.9 + 0.6;
      // Downhill houses stand on a stone undercroft so they rise from the slope to the road.
      const below = x < 0 ? -rise(x) : 0;
      const walls = new BoxGeometry(w, tall + below, d);
      for (const f of [0, 1]) scaleFaceUv(walls, f, d / 4, (tall + below) / 4);
      for (const f of [4, 5]) scaleFaceUv(walls, f, w / 4, (tall + below) / 4);
      walls.translate(0, (tall + below) / 2 - below, 0);
      this.disposables.push(walls);
      const body = new Mesh(walls, i % 3 === 0 ? stone : renders[i % renders.length]!);
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);
      // The steep slate gable, its ridge across the road so the gable end faces it.
      const pitch = new Shape();
      pitch.moveTo(-d / 2 - 0.7, 0);
      pitch.lineTo(d / 2 + 0.7, 0);
      pitch.lineTo(0, d * 0.42);
      pitch.closePath();
      const roof = new ExtrudeGeometry(pitch, { depth: w + 1.2, bevelEnabled: false });
      roof.rotateY(Math.PI / 2);
      roof.translate(-(w + 1.2) / 2, tall, 0);
      this.disposables.push(roof);
      const r = new Mesh(roof, slate);
      r.castShadow = true;
      g.add(r);
      const box = (
        m: MeshStandardMaterial,
        bw: number,
        bh: number,
        bd: number,
        bx: number,
        by: number,
        bz: number,
      ) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(bw, bh, bd);
        mesh.position.set(bx, by, bz);
        g.add(mesh);
        return mesh;
      };
      box(stone, 0.7, 2.2, 0.7, w * 0.2, tall + d * 0.3, d * 0.15);
      // The face to the road: windows with shutters on each floor and a timber balcony.
      const face = (x < 0 ? 1 : -1) * (w / 2 + 0.05);
      for (let f = 0; f < storeys; f++) {
        const y = 1.6 + f * 2.9;
        for (const z of [-d * 0.25, d * 0.25]) {
          box(glass, 0.08, 1.2, 0.9, face, y, z);
          for (const sz of [-0.75, 0.75]) box(shutters[i % 3]!, 0.1, 1.3, 0.55, face, y, z + sz);
        }
      }
      const by = 1.6 + (storeys - 1) * 2.9 - 1;
      box(timber, 1.2, 0.15, d * 0.8, face + Math.sign(face) * 0.6, by, 0);
      box(timber, 0.08, 0.9, d * 0.8, face + Math.sign(face) * 1.15, by + 0.5, 0);
      g.rotation.y = turn;
      this.group.add(g);
      this.props.push({ mesh: g, offset, every: LOOP, x, rise: x < 0 ? rise(x) : rise(x) });
    });
  }

  /**
   * Dutch Corner's flares: fans in the orange crowd holding burning flares up over their heads,
   * each pouring a plume of orange or red smoke that rises over the bend and drifts away.
   */
  private addFlares(): void {
    const random = seeded(2601);
    const puff = new SphereGeometry(1, 10, 8);
    const stick = new CylinderGeometry(0.04, 0.04, 0.4, 6);
    this.disposables.push(puff, stick);
    const glow = this.material({
      color: 0xff3a1a,
      emissive: new Color(0xff5a1a),
      emissiveIntensity: 2,
    });
    const colours = [0xff6a1a, 0xff8a2a, 0xe8401e];
    for (let k = 0; k < 8; k++) {
      const side = k % 2 ? 1 : -1;
      const flare = new Group();
      const held = new Mesh(stick, glow);
      held.position.y = 2.1;
      flare.add(held);
      const colour = colours[k % colours.length]!;
      for (let p = 0; p < 14; p++) {
        const material = this.material({
          color: colour,
          emissive: new Color(colour),
          emissiveIntensity: 0.7,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          roughness: 1,
        });
        const mesh = new Mesh(puff, material);
        flare.add(mesh);
        this.smoke.push({ mesh, side, phase: p / 14 + random() * 0.02 });
      }
      this.group.add(flare);
      this.props.push({
        mesh: flare,
        offset: DUTCH - 36 + k * 10 + random() * 4,
        every: LOOP,
        x: side * (CROWD_NEAR + 0.6 + random() * 1.2),
        rise: 0,
      });
    }
    this.setTime(this.time);
  }

  /** Larches and spruces dotted up the meadow on the right and down the slope on the left. */
  private addLarches(): void {
    const random = seeded(2201);
    const cone = new ConeGeometry(1, 1, 8);
    cone.translate(0, 0.5, 0);
    const trunk = new CylinderGeometry(0.15, 0.22, 1, 6);
    trunk.translate(0, 0.5, 0);
    this.disposables.push(cone, trunk);
    const greens = ['#2f4a2a', '#3a5a30', '#4a6a34', '#284022'].map((c) =>
      this.material({ color: c, roughness: 1 }),
    );
    const bark = this.material({ color: 0x4a3a2a, roughness: 1 });
    for (let k = 0; k < 120; k++) {
      const side = k % 3 === 0 ? -1 : 1;
      const x = side > 0 ? 22 + random() ** 1.5 * 180 : -(14 + random() * 120);
      if (side < 0 && Math.abs(x + 22) < 12) continue;
      const offset = random() * LOOP;
      if (Math.abs(offset - 190) < 48 && Math.abs(x) < 45) continue;
      const tree = new Group();
      const h = 8 + random() * 9;
      const t = new Mesh(trunk, bark);
      t.scale.set(1, h * 0.3, 1);
      const c = new Mesh(cone, greens[k % 4]!);
      c.scale.set(h * 0.22, h * 0.85, h * 0.22);
      c.position.y = h * 0.18;
      c.castShadow = true;
      tree.add(t, c);
      this.group.add(tree);
      this.props.push({ mesh: tree, offset, every: LOOP, x, rise: rise(x) - 0.2 });
    }
  }

  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.08, 0.08, 6.4, 8);
    post.translate(0, 3.2, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1, 1.2);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0xd9dde2, metalness: 0.6, roughness: 0.35 });
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
      this.props.push({ mesh: banner, offset, every: LOOP, x: 0, rise: 0 });
    }
  }

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
          rise: 0,
        });
      }
    }
  }

  /**
   * The names and cries painted all over the tarmac, as the fans leave it for days before a
   * stage: a row every few metres of two names in staggered lanes, and every third row a cry
   * painted big right across the road.
   */
  private addRoadPaint(): void {
    const name = new PlaneGeometry(2.5, 8);
    const slogan = new PlaneGeometry(5.6, 10);
    this.disposables.push(name, slogan);
    const materials = new Map<string, MeshStandardMaterial>();
    const paint = (text: string, colour: string) => {
      const key = `${text}|${colour}`;
      let material = materials.get(key);
      if (!material) {
        material = this.material({
          map: this.track(paintTexture(text, colour)),
          alphaTest: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          roughness: 0.7,
        });
        materials.set(key, material);
      }
      return material;
    };
    const lay = (
      geometry: PlaneGeometry,
      text: string,
      colour: string,
      offset: number,
      x: number,
    ) => {
      const mesh = new Mesh(geometry, paint(text, colour));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02 - KERB;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, every: LOOP, x, rise: 0, lies: true });
    };
    const rows = Math.floor(LOOP / ROAD_PAINT_EVERY);
    let k = 0;
    for (let row = 0; row < rows; row++) {
      const offset = 14 + row * ROAD_PAINT_EVERY;
      if (row % 3 === 2) {
        const [text, colour] = ROAD_SLOGANS[((row / 3) % ROAD_SLOGANS.length) | 0]!;
        lay(slogan, text, colour, offset, 0);
        continue;
      }
      const stagger = row % 2 ? 0.4 : -0.4;
      for (const x of [-1.6 + stagger, 1.6 + stagger]) {
        const [text, colour] = ROAD_PAINT[k++ % ROAD_PAINT.length]!;
        lay(name, text, colour, offset, x);
      }
    }
  }

  /**
   * Ahead: the mountainside rising from the road's end, its meadows and rock bands crossed by the
   * hairpins stacked one above another, low walls on their outer edges, larches between them;
   * at the top the ski station's blocks and chalets; behind it the snowy peaks of the Grandes
   * Rousses, and the valley's far side to the left, all hazed by hand.
   */
  private addMountain(): void {
    const haze = new Color(HAZE);
    const h = this.horizon;
    // The face, tilted up from its foot at the road's end, in its own frame.
    const frame = new Group();
    frame.rotation.x = FACE_TILT;
    h.add(frame);
    const sheet = new PlaneGeometry(1600, FACE_DEPTH, 1, 1);
    sheet.rotateX(-Math.PI / 2);
    sheet.translate(0, 0, -FACE_DEPTH / 2);
    this.disposables.push(sheet);
    const meadow = hazedMaterial(this.disposables, haze, 0xffffff, 0.12, {
      map: this.repeat(faceTexture(), 220, 220),
    });
    frame.add(new Mesh(sheet, meadow));
    // The hairpins: legs across the face, each turning back at a hairpin over the one below.
    const road = hazedMaterial(this.disposables, haze, 0x4a4b50, 0.12);
    const wall = hazedMaterial(this.disposables, haze, 0xcfc8b8, 0.12);
    const legs = 14;
    const pitch = (FACE_DEPTH - 160) / legs;
    for (let i = 0; i < legs; i++) {
      const z0 = -i * pitch;
      const z1 = -(i + 1) * pitch;
      const span = 150 - i * 6;
      const x0 = i === 0 ? 0 : (i % 2 ? 1 : -1) * span;
      const x1 = (i % 2 ? -1 : 1) * (span - 6);
      const dx = x1 - x0;
      const dz = z1 - z0;
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      for (const [m, w, y, along] of [
        [road, 9, 0.4, 0],
        [wall, 0.8, 1.2, 4.8],
      ] as const) {
        const leg = new Mesh(this.unit, m);
        leg.scale.set(w, y, length);
        leg.rotation.y = angle;
        const ox = Math.cos(angle) * along;
        const oz = -Math.sin(angle) * along;
        leg.position.set((x0 + x1) / 2 + ox, y / 2, (z0 + z1) / 2 + oz);
        frame.add(leg);
      }
      // The hairpin's turn: a round platform at the leg's end.
      const turn = new Mesh(new CylinderGeometry(8, 8, 0.4, 16), road);
      this.disposables.push(turn.geometry);
      turn.position.set(x1, 0.2, z1);
      frame.add(turn);
    }
    // Upright things on the face stand at its height there.
    const upon = (x: number, z: number) => ({
      x,
      y: -z * Math.sin(FACE_TILT),
      z: z * Math.cos(FACE_TILT),
    });
    const cone = new ConeGeometry(1, 1, 7);
    cone.translate(0, 0.5, 0);
    this.disposables.push(cone);
    const firs = [0x2c4528, 0x36522e].map((c, i) =>
      hazedMaterial(this.disposables, haze, c, 0.18 + i * 0.06),
    );
    const random = seeded(2301);
    for (let k = 0; k < 140; k++) {
      const p = upon((random() - 0.5) * 900, -40 - random() * 800);
      const tree = new Mesh(cone, firs[k % 2]!);
      const size = 10 + random() * 8;
      tree.scale.set(size * 0.3, size, size * 0.3);
      tree.position.set(p.x, p.y - 1, p.z);
      h.add(tree);
    }
    // The ski station at the top: blocks of flats and big chalets, white and timber, dark roofs.
    const walls = [0xf0ece2, 0xe2d6c0, 0xb88a5a, 0xf4f0e6, 0xa8784a].map((c, i) =>
      hazedMaterial(this.disposables, haze, c, 0.22 + (i % 2) * 0.04),
    );
    const roofs = hazedMaterial(this.disposables, haze, 0x3a3c42, 0.22);
    const windows = hazedMaterial(this.disposables, haze, 0x40505e, 0.22);
    const gable = new ConeGeometry(0.75, 0.5, 4);
    gable.rotateY(Math.PI / 4);
    this.disposables.push(gable);
    for (let k = 0; k < 34; k++) {
      const p = upon((random() - 0.5) * 520, -(FACE_DEPTH - 140) - random() * 120);
      const w = 18 + random() * 22;
      const tall = 10 + random() * 26;
      const d = 14 + random() * 10;
      const b = new Mesh(this.unit, walls[k % walls.length]!);
      b.scale.set(w, tall, d);
      b.position.set(p.x, p.y + tall / 2 - 4, p.z);
      h.add(b);
      // Rows of balconies across the face, and a low roof over it.
      for (let y = 4; y < tall - 2; y += 3.2) {
        const strip = new Mesh(this.unit, windows);
        strip.scale.set(w * 0.86, 1.2, 0.3);
        strip.position.set(p.x, p.y - 4 + y, p.z + d / 2 + 0.1);
        h.add(strip);
      }
      const r = new Mesh(gable, roofs);
      r.scale.set(w * 1.05, 6, d * 1.05);
      r.position.set(p.x, p.y + tall - 4 + 3, p.z);
      h.add(r);
    }
    // The Grandes Rousses behind: two ridgelines of jagged rock peaks, the near one dark with
    // snowfields draped down from its crests and glacier tongues filling its gullies, the far one
    // paler in the haze, its snow catching the light.
    const top = upon(0, -FACE_DEPTH).y;
    const ridges = [
      {
        z: -FACE_DEPTH - 1500,
        base: top + 80,
        lift: 1350,
        rock: 0x8a909a,
        snow: 0.26,
        haze: 0.4,
        seed: 2321,
      },
      {
        z: -FACE_DEPTH - 700,
        base: top - 40,
        lift: 1050,
        rock: 0x4c5058,
        snow: 0.06,
        haze: 0.2,
        seed: 2311,
      },
    ];
    for (const ridge of ridges) {
      const pr = seeded(ridge.seed);
      const crest: [number, number][] = [];
      // Peaks at irregular spacing, cols between them, and small teeth along the crest.
      for (let x = -2600; x <= 2600; x += 60) {
        const peaks =
          Math.sin(x / 430 + ridge.seed) * 0.5 + Math.sin(x / 170 + ridge.seed * 2) * 0.25;
        const y = ridge.lift * (0.55 + 0.38 * peaks + (pr() - 0.5) * 0.08);
        crest.push([x, Math.max(y, ridge.lift * 0.2)]);
      }
      const rock = new Shape();
      rock.moveTo(-2600, -200);
      for (const [x, y] of crest) rock.lineTo(x, y);
      rock.lineTo(2600, -200);
      rock.closePath();
      const body = new ExtrudeGeometry(rock, { depth: 60, bevelEnabled: false, curveSegments: 1 });
      this.disposables.push(body);
      const r = new Mesh(body, hazedMaterial(this.disposables, haze, ridge.rock, ridge.haze));
      r.position.set(0, ridge.base, ridge.z);
      h.add(r);
      // The snow: down from the crest, deeper on the high summits, ragged at its lower edge,
      // and glacier tongues reaching far down the gullies under the cols.
      const snow = new Shape();
      snow.moveTo(crest[0]![0], crest[0]![1] + 2);
      for (const [x, y] of crest) snow.lineTo(x, y + 2);
      for (let i = crest.length - 1; i >= 0; i--) {
        const [x, y] = crest[i]!;
        const high = y / ridge.lift;
        const gully = Math.max(0, Math.sin(x / 260 + ridge.seed * 3)) ** 6;
        const depth =
          ridge.lift *
          (0.08 + high * 0.28 + gully * 0.3) *
          (0.85 + 0.25 * Math.sin(x / 110 + ridge.seed));
        snow.lineTo(x, y - depth);
      }
      snow.closePath();
      const white = new ExtrudeGeometry(snow, { depth: 2, bevelEnabled: false, curveSegments: 1 });
      this.disposables.push(white);
      const s = new Mesh(
        white,
        hazedMaterial(this.disposables, haze, 0xffffff, ridge.snow, {
          emissive: new Color(0xb4c0cc),
          emissiveIntensity: 0.3,
        }),
      );
      s.position.set(0, ridge.base, ridge.z + 61);
      h.add(s);
    }
    // The valley's far side to the left, its slopes forested and its ridges bare.
    const ridge = new Shape();
    ridge.moveTo(-3600, -400);
    for (let x = -3600; x <= -300; x += 150) {
      ridge.lineTo(x, 180 + 220 * Math.sin(x / 520) + 160 * ((x + 3600) / 3300));
    }
    ridge.lineTo(-300, -400);
    ridge.closePath();
    const far = new ExtrudeGeometry(ridge, { depth: 40, bevelEnabled: false, curveSegments: 1 });
    this.disposables.push(far);
    const side = new Mesh(far, hazedMaterial(this.disposables, haze, 0x5a6a56, 0.45));
    side.position.set(-300, -60, -600);
    side.rotation.y = 0.9;
    h.add(side);
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

function vergeTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#8a9a5a', 2401);
    const random = seeded(2403);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(120,100,70,0.35)' : 'rgba(190,200,120,0.3)';
      g.fillRect(random() * 256, random() * 256, 3, 2);
    }
  });
}

/** Alpine meadow: deep green grass with flowers, white, yellow and violet. */
function meadowTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#5a8a3a', 2407);
    const random = seeded(2409);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(30,60,20,0.3)' : 'rgba(170,205,110,0.25)';
      g.fillRect(random() * 256, random() * 256, 2, 5);
    }
    for (let i = 0; i < 160; i++) {
      g.fillStyle = ['#ffffff', '#f2d23a', '#9a7ad0'][i % 3]!;
      g.fillRect(random() * 256, random() * 256, 2, 2);
    }
  });
}

function rockTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#8a8a86', 2411);
    const random = seeded(2413);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(50,50,52,0.35)' : 'rgba(210,208,200,0.3)';
      g.fillRect(random() * 256, random() * 256, 10 + random() * 40, 2 + random() * 5);
    }
  });
}

/** A dry-stone wall: rough grey stones in courses. */
function wallTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.fillStyle = '#5a5a56';
    g.fillRect(0, 0, 128, 64);
    const random = seeded(2417);
    for (let y = 0; y < 64; y += 13) {
      for (let x = -(random() * 16); x < 128; x += 16 + random() * 10) {
        g.fillStyle = ['#a8a49a', '#9a968c', '#b8b4a8', '#8e8a80'][Math.floor(random() * 4)]!;
        g.fillRect(x + 1, y + 1, 14 + random() * 6, 11);
      }
    }
  });
}

function churchStoneTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#7a7266';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(2419);
    const tones = ['#c2b8a4', '#b0a690', '#d0c6b2', '#a89e88'];
    for (let y = 0; y < 256; y += 18) {
      for (let x = -(random() * 20); x < 256; x += 24 + random() * 14) {
        g.fillStyle = tones[Math.floor(random() * tones.length)]!;
        g.fillRect(x + 2, y + 2, 22 + random() * 10, 15);
      }
    }
  });
}

/** The broken white edge line, dashes along the road. */
function dashTexture(): CanvasTexture {
  return canvasTexture(16, 64, (g) => {
    g.fillStyle = '#f2f2ee';
    g.fillRect(0, 0, 16, 40);
  });
}

/** A camper's awning: broad stripes of its colour and white. */
function awningTexture(colour: string): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = (x / 16) % 2 ? '#f4f2ea' : colour;
      g.fillRect(x, 0, 16, 64);
    }
    g.fillStyle = colour;
    g.fillRect(0, 54, 128, 10);
  });
}

/** A national flag of three bands, upright or across. */
function flagTexture(a: string, b: string, c: string, upright: boolean): CanvasTexture {
  return canvasTexture(96, 64, (g) => {
    [a, b, c].forEach((colour, i) => {
      g.fillStyle = colour;
      if (upright) g.fillRect(i * 32, 0, 32, 64);
      else g.fillRect(0, (i * 64) / 3, 96, 64 / 3 + 1);
    });
  });
}

/** A VIRAGE sign: white, a blue border, the bend's number large and its altitude below. */
function bendTexture(bend: number, altitude: number): CanvasTexture {
  return canvasTexture(208, 240, (g) => {
    g.fillStyle = '#f6f6f2';
    g.fillRect(0, 0, 208, 240);
    g.strokeStyle = '#1d3c8f';
    g.lineWidth = 12;
    g.strokeRect(6, 6, 196, 228);
    g.fillStyle = '#1d3c8f';
    g.textAlign = 'center';
    g.font = 'bold 34px sans-serif';
    g.fillText('VIRAGE', 104, 56);
    g.font = 'bold 110px sans-serif';
    g.fillText(String(bend), 104, 170);
    g.font = 'bold 26px sans-serif';
    g.fillText(`ALT. ${altitude} m`, 104, 214);
  });
}

/** The mountainside's skin: meadow with rock bands, scree and patches of shadow. */
function faceTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#5e8a40', 2421);
    const random = seeded(2423);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = random() < 0.6 ? 'rgba(130,130,126,0.7)' : 'rgba(40,70,30,0.4)';
      g.beginPath();
      g.ellipse(random() * 512, random() * 512, 20 + random() * 60, 4 + random() * 10, 0, 0, 7);
      g.fill();
    }
  });
}
