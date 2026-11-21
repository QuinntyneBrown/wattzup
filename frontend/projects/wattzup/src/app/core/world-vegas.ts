// Las Vegas Strip's boulevard, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// Strip after midnight. The rider takes the kerb lane northbound; traffic streams beside them and
// back down the far carriageway past the palms on the median. Casinos line both sides, their
// fronts ablaze with neon, their marquee pylons chasing bulbs and their hotel towers lit floor
// by floor above. Once a lap the casinos open onto a lake where the fountains dance; at every
// junction a mast arm hangs signals that cycle green, amber, red, so the rider sprints from light
// to light. The Welcome sign stands on the median and the observation tower rises ahead. Built on
// the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  bob,
  canvasTexture,
  Figures,
  loopFade,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The Strip repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 24;
const KERB = 0.14;
/** Left of the rider: their own carriageway's other lanes, the median, the far carriageway. */
const NEAR_LANES = 7;
const MEDIAN = 6;
const FAR_LANES = 10.5;
/** The sidewalks, and the casinos' fronts behind them. */
const SIDEWALK = 5;
/** A junction with its signals every JUNCTION metres; the fountains once a lap. */
const JUNCTION = 160;
const LAKE_AT = 360;
const LAKE_LENGTH = 110;
/** The observation tower stands this far ahead, left of the Strip. */
const TOWER_AHEAD = 1300;
const TOWER_X = -80;

/** The casinos along each side: name, neon colour, frontage, and how far round the lap. */
const CASINOS: readonly (readonly [string, string, number, number])[] = [
  ['LUCKY 7', '#ff2d55', 60, 10],
  ['DESERT ROSE', '#ff6ad5', 70, 90],
  ['SILVER SANDS', '#7df9ff', 60, 175],
  ['CROWN JEWEL', '#ffd23f', 55, 245],
  ['NEON PALMS', '#39ff14', 60, 415],
];
const FAR_CASINOS: readonly (readonly [string, string, number, number])[] = [
  ['THE ACE', '#ff3b2f', 70, 30],
  ['GOLDEN MIRAGE', '#ffb000', 80, 120],
  ['STARLIGHT', '#b14bff', 60, 215],
  ['ROYAL FLUSH', '#2c9bff', 70, 290],
  ['HIGH NOON', '#ff7a00', 60, 380],
];

const NIGHT_WEAR = {
  tops: ['#f5f5f0', '#111318', '#e8133c', '#2c7be5', '#ffd23f', '#9b5de5', '#14b8a6', '#ff7ac0'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#c9b8a0'],
  skins: ['#e2b48c', '#f0c8a0', '#c48a5f', '#8d5a3b', '#5a3a29', '#3f2a1f'],
};

interface Car {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
}

interface Walker {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly scale: number;
  readonly phase: number;
}

export class VegasStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly cars: Car[] = [];
  private readonly walkers: Walker[] = [];
  private figures: Figures | null = null;
  private readonly jets: { mesh: Mesh; k: number }[] = [];
  private readonly chasers: MeshBasicMaterial[] = [];
  private readonly signals = {
    red: new MeshBasicMaterial({ color: 0xff2a1f }),
    amber: new MeshBasicMaterial({ color: 0xffb000 }),
    green: new MeshBasicMaterial({ color: 0x2bff88 }),
  };
  private readonly tower = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.signals.red, this.signals.amber, this.signals.green);
    for (const hex of [0xfff1b8, 0xffd23f]) {
      const bulb = new MeshBasicMaterial({ color: hex });
      this.disposables.push(bulb);
      this.chasers.push(bulb);
    }
    this.addGround(roadHalf, points);
    this.addPalms(roadHalf);
    this.addCasinos(roadHalf);
    this.addFountains(roadHalf);
    this.addJunctions(roadHalf);
    this.addWelcomeSign(roadHalf);
    this.addTraffic(roadHalf);
    this.addWalkers(roadHalf);
    this.addTower();
  }

  /**
   * The signals cycle green, amber, red; the fountains dance; the marquees' bulbs chase. Reduced
   * motion holds them at the first beat.
   */
  setTime(seconds: number): void {
    this.time = seconds;
    const phase = seconds % 14;
    const dim = 0.12;
    this.signals.green.color.set(0x2bff88).multiplyScalar(phase < 7 ? 1 : dim);
    this.signals.amber.color.set(0xffb000).multiplyScalar(phase >= 7 && phase < 9 ? 1 : dim);
    this.signals.red.color.set(0xff2a1f).multiplyScalar(phase >= 9 ? 1 : dim);
    for (const jet of this.jets) {
      const wave = Math.sin(seconds * 1.4 - jet.k * 0.45) * 0.5 + 0.5;
      const swell = Math.sin(seconds * 0.35) * 0.5 + 0.5;
      jet.mesh.scale.y = 0.15 + wave * (0.4 + swell * 0.6);
    }
    const beat = Math.floor(seconds * 3) % 2;
    this.chasers[0]!.color.set(0xfff1b8).multiplyScalar(beat ? 1 : 0.35);
    this.chasers[1]!.color.set(0xffd23f).multiplyScalar(beat ? 0.35 : 1);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    for (const car of this.cars) {
      const metres = loopMetres(car.offset + car.speed * this.time, s, LOOP, BEHIND);
      car.mesh.position.set(car.x, heightAt(Math.max(metres, 0)), -metres);
      car.mesh.scale.setScalar(loopFade(metres, LOOP, BEHIND));
    }
    const figures = this.figures;
    if (figures) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = bob(this.time * 4.5 + w.phase) * 0.04;
        const y = heightAt(Math.max(metres, 0)) + KERB;
        const scale = w.scale * loopFade(metres, LOOP, BEHIND);
        figures.set(i, w.x, y, -metres, w.speed > 0 ? 0 : Math.PI, scale, step);
      });
      figures.commit();
    }
    this.tower.position.set(TOWER_X, heightAt(TOWER_AHEAD), -TOWER_AHEAD);
  }

  /** The lanes beside the rider, the median's kerbs and its bed, the far lanes and the sidewalks. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const lanes = this.material({
      map: this.repeat(lanesTexture(), NEAR_LANES, 12),
      roughness: 0.5,
    });
    const far = this.material({ map: this.repeat(lanesTexture(), FAR_LANES, 12), roughness: 0.5 });
    const median = this.material({ map: this.repeat(gravelTexture(), 3, 3), roughness: 1 });
    const walk = this.material({ map: this.repeat(pavingTexture(), 2.5, 2.5), roughness: 0.6 });
    const m0 = -r - NEAR_LANES;
    const m1 = m0 - MEDIAN;
    const f1 = m1 - FAR_LANES;
    this.ribbons.add(points, lanes, [
      [-r, 0.006],
      [m0, 0.006],
    ]);
    this.ribbons.add(points, median, [
      [m0, 0.006],
      [m0 - 0.1, KERB + 0.1],
      [m1 + 0.1, KERB + 0.1],
      [m1, 0.006],
    ]);
    this.ribbons.add(points, far, [
      [m1, 0.006],
      [f1, 0.006],
    ]);
    this.ribbons.add(points, walk, [
      [f1, 0.006],
      [f1 - 0.1, KERB],
      [f1 - SIDEWALK - 40, KERB],
    ]);
    this.ribbons.add(points, walk, [
      [r + SIDEWALK + 40, KERB],
      [r + 0.1, KERB],
      [r, 0],
    ]);
  }

  /** Date palms along the median, uplit from their feet. */
  private addPalms(roadHalf: number): void {
    const random = seeded(263);
    const trunk = new CylinderGeometry(0.18, 0.28, 9, 8);
    trunk.translate(0, 4.5, 0);
    const crown = palmCrown();
    this.disposables.push(trunk, crown);
    const bark = this.material({ color: 0x6b5440, emissive: 0xffb36a, emissiveIntensity: 0.25 });
    const fronds = this.material({
      color: 0x2f6b3a,
      emissive: 0x0f3a1a,
      emissiveIntensity: 0.6,
      side: DoubleSide,
    });
    const x = -roadHalf - NEAR_LANES - MEDIAN / 2;
    for (let offset = 0; offset < LOOP; offset += 14) {
      const palm = new Group();
      palm.add(new Mesh(trunk, bark), new Mesh(crown, fronds));
      palm.scale.setScalar(0.9 + random() * 0.3);
      palm.rotation.y = random() * 6.3;
      this.group.add(palm);
      this.props.push({ mesh: palm, offset: offset + random() * 3, x: x + (random() - 0.5) * 2 });
    }
  }

  /** The casinos both sides: a lit front with its neon name, a marquee pylon and a tower behind. */
  private addCasinos(roadHalf: number): void {
    const random = seeded(269);
    const towerWindows = this.track(windowsTexture());
    towerWindows.wrapS = RepeatWrapping;
    towerWindows.wrapT = RepeatWrapping;
    const body = this.material({ color: 0x1a1824, roughness: 0.7 });
    const glass = new MeshStandardMaterial({
      color: 0x14141c,
      emissiveMap: towerWindows,
      emissive: 0xffffff,
      emissiveIntensity: 1,
      roughness: 0.3,
    });
    this.disposables.push(glass);
    const sides = [
      { list: CASINOS, side: 1, edge: roadHalf + SIDEWALK },
      { list: FAR_CASINOS, side: -1, edge: roadHalf + NEAR_LANES + MEDIAN + FAR_LANES + SIDEWALK },
    ] as const;
    for (const { list, side, edge } of sides) {
      for (const [name, neon, frontage, at] of list) {
        const casino = new Group();
        const depth = 40;
        const height = 12 + random() * 6;
        const podium = new Mesh(this.unit, body);
        podium.scale.set(depth, height, frontage);
        podium.position.set(side * (depth / 2), height / 2, 0);
        casino.add(podium);
        const front = new Mesh(
          new PlaneGeometry(frontage, height),
          new MeshBasicMaterial({ map: this.track(frontTexture(name, neon, frontage / height)) }),
        );
        this.disposables.push(front.geometry, front.material as Material);
        front.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        front.position.set(-side * 0.05, height / 2, 0);
        casino.add(front);
        // The hotel tower behind, lit floor by floor, its name at the top.
        const towerHeight = 90 + random() * 110;
        const towerWidth = 22 + random() * 18;
        const t = new Mesh(new BoxGeometry(24, towerHeight, towerWidth), glass);
        this.disposables.push(t.geometry);
        const uv = t.geometry.getAttribute('uv');
        for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (towerHeight / 40));
        t.position.set(side * (depth + 14), towerHeight / 2, (random() - 0.5) * 10);
        casino.add(t);
        const crown = new Mesh(
          new PlaneGeometry(towerWidth * 0.9, towerWidth * 0.22),
          new MeshBasicMaterial({ map: this.track(nameTexture(name, neon)), transparent: true }),
        );
        this.disposables.push(crown.geometry, crown.material as Material);
        crown.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        crown.position.set(
          side * (depth + 14) - side * 12.1,
          towerHeight - towerWidth * 0.18,
          t.position.z,
        );
        casino.add(crown);
        // The marquee pylon by the kerb.
        casino.add(this.pylon(name, neon, side, -side * (SIDEWALK - 1.2)));
        this.group.add(casino);
        this.props.push({ mesh: casino, offset: at + frontage / 2, x: side * edge });
      }
    }
  }

  /** A marquee pylon: a tall column carrying the casino's name and a board of chasing bulbs. */
  private pylon(name: string, neon: string, side: number, x: number): Group {
    const pylon = new Group();
    const steel = this.material({ color: 0x2a2833, metalness: 0.6, roughness: 0.4 });
    const column = new Mesh(this.unit, steel);
    column.scale.set(1, 18, 1);
    column.position.set(x, 9, 0);
    const sign = new Mesh(
      new PlaneGeometry(7, 4.2),
      new MeshBasicMaterial({ map: this.track(nameTexture(name, neon, true)), side: DoubleSide }),
    );
    this.disposables.push(sign.geometry, sign.material as Material);
    sign.position.set(x, 15, 0);
    sign.rotation.y = side > 0 ? -Math.PI / 2 + 0.5 : Math.PI / 2 - 0.5;
    const board = new Mesh(this.unit, this.chasers[0]!);
    board.scale.set(0.3, 0.5, 6);
    board.position.set(x, 11.7, 0);
    const board2 = new Mesh(this.unit, this.chasers[1]!);
    board2.scale.set(0.3, 0.5, 6);
    board2.position.set(x, 18.3, 0);
    pylon.add(column, sign, board, board2);
    return pylon;
  }

  /** The lake once a lap on the right, its fountains dancing in rows, its balustrade at the walk. */
  private addFountains(roadHalf: number): void {
    const lake = new Group();
    const water = this.material({
      color: 0x0c2a4a,
      emissive: 0x0a3a6a,
      emissiveIntensity: 0.6,
      roughness: 0.05,
      metalness: 0.3,
    });
    const stone = this.material({ color: 0xd9cfbd, emissive: 0x6a5a3a, emissiveIntensity: 0.3 });
    const spray = new MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.75 });
    this.disposables.push(spray);
    const pool = new Mesh(this.unit, water);
    pool.scale.set(90, 0.2, LAKE_LENGTH);
    pool.position.set(48, KERB - 0.4, 0);
    lake.add(pool);
    const rail = new Mesh(this.unit, stone);
    rail.scale.set(0.5, 1, LAKE_LENGTH);
    rail.position.set(2.5, KERB + 0.5, 0);
    lake.add(rail);
    const jet = new CylinderGeometry(0.08, 0.35, 22, 8, 1, true);
    jet.translate(0, 11, 0);
    this.disposables.push(jet);
    let k = 0;
    for (const x of [16, 30, 46]) {
      for (let z = -LAKE_LENGTH / 2 + 6; z < LAKE_LENGTH / 2 - 4; z += 4, k++) {
        const j = new Mesh(jet, spray);
        j.position.set(x, KERB - 0.3, z);
        lake.add(j);
        this.jets.push({ mesh: j, k: k + x / 8 });
      }
    }
    // The hotel over the lake, its long curved front lit.
    const hotel = new Mesh(
      new CylinderGeometry(70, 70, 120, 24, 1, true, Math.PI * 1.25, Math.PI * 0.5),
      new MeshStandardMaterial({
        color: 0x1a1824,
        emissiveMap: this.windows(6, 3),
        emissive: 0xffe9c0,
        emissiveIntensity: 1,
        side: DoubleSide,
      }),
    );
    this.disposables.push(hotel.geometry, hotel.material as Material);
    hotel.position.set(150, 60, 0);
    lake.add(hotel);
    this.group.add(lake);
    this.props.push({ mesh: lake, offset: LAKE_AT, x: roadHalf + SIDEWALK });
  }

  private windows(x: number, y: number): Texture {
    const texture = this.track(windowsTexture());
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(x, y);
    return texture;
  }

  /** Every junction: a crossing painted across, and a mast arm hanging its signals over the lanes. */
  private addJunctions(roadHalf: number): void {
    const paint = this.material({ color: 0xf2f2ee, roughness: 0.6 });
    const steel = this.material({ color: 0x3a3d44, metalness: 0.6, roughness: 0.4 });
    const housing = this.material({ color: 0x1a1a1a, roughness: 0.6 });
    const lamp = new CylinderGeometry(0.17, 0.17, 0.08, 12);
    lamp.rotateX(Math.PI / 2);
    this.disposables.push(lamp);
    const span = roadHalf * 2 + NEAR_LANES;
    for (let offset = 60; offset < LOOP; offset += JUNCTION) {
      const junction = new Group();
      for (let x = -roadHalf - NEAR_LANES + 0.4; x < roadHalf - 0.4; x += 1.1) {
        const stripe = new Mesh(this.unit, paint);
        stripe.scale.set(0.55, 0.012, 3.2);
        stripe.position.set(x, 0.012, 2.5);
        junction.add(stripe);
      }
      const stop = new Mesh(this.unit, paint);
      stop.scale.set(span, 0.012, 0.4);
      stop.position.set(roadHalf - span / 2, 0.012, 4.8);
      junction.add(stop);
      const pole = new Mesh(this.unit, steel);
      pole.scale.set(0.35, 7.5, 0.35);
      pole.position.set(roadHalf + 0.9, 3.75, 0.5);
      const arm = new Mesh(this.unit, steel);
      arm.scale.set(span + 0.6, 0.22, 0.22);
      arm.position.set(roadHalf + 0.9 - (span + 0.6) / 2, 7.2, 0.5);
      junction.add(pole, arm);
      for (let x = roadHalf - 1.75; x > -roadHalf - NEAR_LANES; x -= 3.5) {
        const head = new Mesh(this.unit, housing);
        head.scale.set(0.5, 1.4, 0.4);
        head.position.set(x, 6.3, 0.5);
        junction.add(head);
        for (const [m, y] of [
          [this.signals.red, 6.75],
          [this.signals.amber, 6.3],
          [this.signals.green, 5.85],
        ] as const) {
          const l = new Mesh(lamp, m);
          l.position.set(x, y, 0.72);
          junction.add(l);
        }
      }
      this.group.add(junction);
      this.props.push({ mesh: junction, offset, x: 0 });
    }
  }

  /** The Welcome sign on the median: the diamond board on its posts, ringed with bulbs. */
  private addWelcomeSign(roadHalf: number): void {
    const sign = new Group();
    const face = new MeshBasicMaterial({
      map: this.track(welcomeTexture()),
      transparent: true,
      side: DoubleSide,
    });
    const steel = this.material({ color: 0xd9d9d9, metalness: 0.6, roughness: 0.4 });
    this.disposables.push(face);
    const board = new Mesh(new PlaneGeometry(7.5, 5.5), face);
    this.disposables.push(board.geometry);
    board.position.y = 5.2;
    board.rotation.y = 0.35;
    for (const x of [-1.6, 1.6]) {
      const post = new Mesh(this.unit, steel);
      post.scale.set(0.25, 3, 0.25);
      post.position.set(x, 1.5, 0);
      sign.add(post);
    }
    sign.add(board);
    this.group.add(sign);
    this.props.push({ mesh: sign, offset: 140, x: -roadHalf - NEAR_LANES - MEDIAN / 2 });
  }

  /** Cars on both carriageways, lit: tail-lights ahead of the rider, headlights coming back. */
  private addTraffic(roadHalf: number): void {
    const random = seeded(271);
    const paints = [0xf2f2f2, 0x111111, 0x8a0f1a, 0x1b3a8a, 0xc9c9c9, 0xffd23f, 0x2a2a2e].map(
      (hex) => this.material({ color: hex, metalness: 0.6, roughness: 0.3 }),
    );
    const cabin = this.material({ color: 0x0c0f16, metalness: 0.5, roughness: 0.15 });
    const head = new MeshBasicMaterial({ color: 0xfff6e0 });
    const tail = new MeshBasicMaterial({ color: 0xff1a1a });
    this.disposables.push(head, tail);
    const lanes: [number, number][] = [
      [-roadHalf - 1.75, 1],
      [-roadHalf - 5.25, 1],
      [-roadHalf - NEAR_LANES - MEDIAN - 1.75, -1],
      [-roadHalf - NEAR_LANES - MEDIAN - 5.25, -1],
      [-roadHalf - NEAR_LANES - MEDIAN - 8.75, -1],
    ];
    for (const [x, way] of lanes) {
      // A lane moves at one speed, so its cars keep their order and never drive through each
      // other (#901).
      const speed = way * (9 + random() * 5);
      for (let offset = random() * 30; offset < LOOP; offset += 28 + random() * 40) {
        const car = new Group();
        const limo = random() < 0.08;
        const length = limo ? 8.5 : 4.6;
        const b = new Mesh(this.unit, paints[Math.floor(random() * paints.length)]!);
        b.scale.set(1.85, 0.75, length);
        b.position.y = 0.6;
        const c = new Mesh(this.unit, cabin);
        c.scale.set(1.6, 0.55, length * 0.5);
        c.position.set(0, 1.2, 0.2);
        car.add(b, c);
        for (const side of [-0.65, 0.65]) {
          const h = new Mesh(this.unit, head);
          h.scale.set(0.35, 0.18, 0.05);
          h.position.set(side, 0.68, -length / 2 - 0.02);
          const t = new Mesh(this.unit, tail);
          t.scale.set(0.35, 0.16, 0.05);
          t.position.set(side, 0.72, length / 2 + 0.02);
          car.add(h, t);
        }
        if (way < 0) car.rotation.y = Math.PI;
        this.group.add(car);
        this.cars.push({ mesh: car, offset, x, speed });
      }
    }
  }

  /** People out on the Strip after midnight, strolling both sidewalks. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(277);
    const far = -roadHalf - NEAR_LANES - MEDIAN - FAR_LANES;
    for (let offset = 0; offset < LOOP; offset += 2.4 + random() * 4) {
      const right = random() < 0.6;
      this.walkers.push({
        offset,
        x: right
          ? roadHalf + 0.8 + random() * (SIDEWALK - 1.6)
          : far - 0.8 - random() * (SIDEWALK - 1.6),
        speed: (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.6),
        scale: 0.9 + random() * 0.15,
        phase: random() * 6.3,
      });
    }
    this.figures = new Figures(this.group, this.disposables, this.walkers.length, NIGHT_WEAR, 281);
  }

  /** The observation tower at the north end: its tapering shaft, the lit pod and the spire. */
  private addTower(): void {
    const concrete = this.material({ color: 0xcfcac0, emissive: 0x3a3048, emissiveIntensity: 0.5 });
    const pod = this.material({
      color: 0x1a1824,
      emissiveMap: this.windows(10, 1),
      emissive: 0xfff0d0,
      emissiveIntensity: 1,
    });
    const shaft = new CylinderGeometry(4, 9, 250, 3);
    shaft.translate(0, 125, 0);
    const deck = new CylinderGeometry(20, 14, 18, 24);
    deck.translate(0, 262, 0);
    const spire = new ConeGeometry(2.4, 50, 8);
    spire.translate(0, 296, 0);
    this.disposables.push(shaft, deck, spire);
    this.tower.add(
      new Mesh(shaft, concrete),
      new Mesh(deck, pod),
      new Mesh(spire, this.chasers[0]!),
    );
    this.group.add(this.tower);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** A date palm's crown: long fronds arching out and drooping from the top of the trunk. */
function palmCrown(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 10; k++) {
    const frond = new ConeGeometry(0.35, 4.2, 4);
    frond.scale(1, 1, 0.25);
    frond.translate(0, 2.1, 0);
    frond.rotateZ(1.05 + (k % 2) * 0.35);
    frond.rotateY((k / 10) * Math.PI * 2);
    frond.translate(0, 9, 0);
    parts.push(frond);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Lanes of dark asphalt with their dashed white lines, the neon in streaks on it. */
function lanesTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, '#2a2b31', 283);
    g.fillStyle = '#e8e8e2';
    for (let y = 0; y < 512; y += 128) g.fillRect(126, y, 5, 64);
    const random = seeded(293);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `hsla(${random() * 360},90%,65%,${0.04 + random() * 0.06})`;
      g.fillRect(random() * 256, random() * 512, 3, 20 + random() * 50);
    }
  });
}

/** The median's bed of pale desert gravel. */
function gravelTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => speckle(g, 256, 256, '#a8957a', 307));
}

/** The sidewalks' pale paving. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#7a746e', 311);
    g.fillStyle = 'rgba(30,28,26,0.4)';
    for (let i = 0; i < 256; i += 64) {
      g.fillRect(i, 0, 2, 256);
      g.fillRect(0, i, 256, 2);
    }
  });
}

/** Tower windows: rows of lit rooms, gold and white, a few dark. */
function windowsTexture(): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    g.fillStyle = '#000000';
    g.fillRect(0, 0, 128, 256);
    const random = seeded(313);
    for (let y = 2; y < 256; y += 8) {
      for (let x = 2; x < 128; x += 8) {
        const r = random();
        if (r < 0.25) continue;
        g.fillStyle = r < 0.7 ? '#ffd38a' : '#fff4dc';
        g.fillRect(x, y, 6, 5);
      }
    }
  });
}

/**
 * A casino's front: a dark facade wrapped in bulbs, the entrance's lit glass and canopy, and the
 * name in neon tube with its glow. `aspect` is the frontage over the height.
 */
function frontTexture(name: string, neon: string, aspect: number): CanvasTexture {
  const h = 256;
  const w = Math.round(h * aspect);
  return canvasTexture(w, h, (g) => {
    g.fillStyle = '#16141f';
    g.fillRect(0, 0, w, h);
    // Bands of coloured light up the facade.
    const band = g.createLinearGradient(0, 0, 0, h);
    band.addColorStop(0, neon);
    band.addColorStop(1, '#16141f');
    g.globalAlpha = 0.35;
    g.fillStyle = band;
    g.fillRect(0, 0, w, h * 0.6);
    g.globalAlpha = 1;
    // The name in neon.
    g.shadowColor = neon;
    g.shadowBlur = 24;
    g.fillStyle = '#ffffff';
    g.font = `bold ${Math.min(90, (w / name.length) * 1.4)}px sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, w / 2, h * 0.32);
    g.strokeStyle = neon;
    g.lineWidth = 4;
    g.strokeText(name, w / 2, h * 0.32);
    g.shadowBlur = 0;
    // The entrance: a lit canopy over glass doors.
    g.fillStyle = '#ffe9b0';
    g.fillRect(w * 0.15, h * 0.62, w * 0.7, h * 0.03);
    g.fillStyle = '#1e1a28';
    g.fillRect(0, h * 0.65, w * 0.2, h * 0.35);
    g.fillRect(w * 0.8, h * 0.65, w * 0.2, h * 0.35);
    const lobby = g.createLinearGradient(0, h * 0.7, 0, h);
    lobby.addColorStop(0, '#8a5a2a');
    lobby.addColorStop(1, '#3a2414');
    g.fillStyle = lobby;
    g.fillRect(w * 0.2, h * 0.7, w * 0.6, h * 0.3);
    g.fillStyle = 'rgba(40,30,20,0.5)';
    for (let x = w * 0.2; x < w * 0.8; x += 34) g.fillRect(x, h * 0.7, 3, h * 0.3);
    // Bulbs round the edge.
    g.fillStyle = '#fff1b8';
    for (let x = 6; x < w; x += 14) {
      g.fillRect(x, 4, 5, 5);
      g.fillRect(x, h * 0.58, 5, 5);
    }
  });
}

/** A casino's name for its tower top or its pylon, the board dark or transparent behind. */
function nameTexture(name: string, neon: string, board = false): CanvasTexture {
  return canvasTexture(512, board ? 300 : 128, (g) => {
    const height = board ? 300 : 128;
    if (board) {
      g.fillStyle = '#16141f';
      g.fillRect(0, 0, 512, height);
      g.strokeStyle = '#fff1b8';
      g.lineWidth = 10;
      g.setLineDash([6, 10]);
      g.strokeRect(10, 10, 492, height - 20);
      g.setLineDash([]);
    } else {
      g.clearRect(0, 0, 512, height);
    }
    g.shadowColor = neon;
    g.shadowBlur = 20;
    g.fillStyle = neon;
    g.font = `bold ${Math.min(board ? 110 : 90, 760 / name.length)}px sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, 256, height / 2);
    g.fillStyle = '#ffffff';
    g.shadowBlur = 0;
    g.font = `bold ${Math.min(board ? 104 : 84, 720 / name.length)}px sans-serif`;
    g.fillText(name, 256, height / 2);
  });
}

/** The Welcome sign's diamond: white board, bulbs round its edge, and its lettering. */
function welcomeTexture(): CanvasTexture {
  return canvasTexture(512, 380, (g) => {
    g.clearRect(0, 0, 512, 380);
    g.fillStyle = '#f4f1e8';
    g.beginPath();
    g.moveTo(256, 6);
    g.lineTo(506, 190);
    g.lineTo(256, 374);
    g.lineTo(6, 190);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffd23f';
    for (let k = 0; k < 40; k++) {
      const u = k / 40;
      const corners = [
        [256, 18],
        [490, 190],
        [256, 362],
        [22, 190],
      ];
      const seg = Math.floor(u * 4);
      const f = u * 4 - seg;
      const [ax, ay] = corners[seg]!;
      const [bx, by] = corners[(seg + 1) % 4]!;
      g.beginPath();
      g.arc(ax! + (bx! - ax!) * f, ay! + (by! - ay!) * f, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#1b3a8a';
    g.font = 'bold 30px serif';
    g.fillText('WELCOME', 256, 110);
    g.fillStyle = '#1b3a8a';
    g.font = 'italic bold 30px serif';
    g.fillText('to Fabulous', 256, 158);
    g.fillStyle = '#ce1126';
    g.font = 'bold 74px serif';
    g.fillText('LAS VEGAS', 256, 222);
    g.fillStyle = '#1b3a8a';
    g.font = 'bold 30px serif';
    g.fillText('NEVADA', 256, 286);
  });
}
