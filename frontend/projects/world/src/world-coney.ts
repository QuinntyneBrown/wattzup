// Coney Island Boardwalk, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// the Riegelmann Boardwalk on a summer afternoon, closed for the ride. The weathered planks run
// in chevrons under iron lamp posts and stars-and-stripes bunting. On the left the railing
// drops to the crowded beach, its umbrellas, towels and lifeguard chairs, the surf and the
// Atlantic beyond. On the right the arcades and clam bars stand in a bright row under striped
// awnings. Ahead the Wonder Wheel turns over the amusement park, the white lattice of the
// Cyclone climbs behind the shops, and the red Parachute Jump stands at the end of the shore.
// It follows Old Town's pattern (world-oldtown.ts): `build`, `lay` and `place`, seeded detail,
// canvas textures and a loop that recycles the street, with the shared crowd, barriers, banners,
// feather flags, bunting, road paint, figures and box builder of world-kit.ts.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
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
  BoxBuilder,
  buntingGeometry,
  canvasTexture,
  clothBannerTexture,
  Crowd,
  FeatherFlags,
  type FeatherWord,
  Figures,
  hazedMaterial,
  loopMetres,
  paintedRows,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
  type Wardrobe,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 30;
const KERB = 0.05;
const BARRIER = 3.9;
const CROWD_NEAR = 4.4;
const CROWD_FAR = 6.8;
/** The boardwalk's railing on the beach side, and the shopfronts on the other. */
const RAIL = 10;
const SHOPS = 12;
/** The beach lies this far below the planks, and runs out to the surf. */
const SAND = -1.4;
const SURF = 62;
/** The horizon this far ahead. */
const AHEAD = 220;
const HAZE = 0xd8e2ea;

const SKINS = ['#f1c7a5', '#e2b48c', '#d9a17c', '#b67a55', '#8a5a3c', '#5e3b26'];
/** A Brooklyn summer: tank tops, beachwear and Mets and Yankees colours. */
const SUMMER: Wardrobe = {
  tops: [
    '#ffffff',
    '#f2c230',
    '#ff6a3a',
    '#3ac8e8',
    '#e8a0c0',
    '#1d3c8f',
    '#ff8a1a',
    '#1f8a5a',
    '#d8283a',
    '#111111',
  ],
  bottoms: ['#3a5a8a', '#20242b', '#c8b89a', '#ffffff', '#2a6ad8', '#e8d0a0'],
  skins: SKINS,
};
const BARRIER_PANELS: readonly BannerPanel[] = [
  { fill: '#1d3c8f', ink: '#ffffff', text: 'CONEY ISLAND' },
  { fill: '#d8283a', ink: '#ffffff', text: 'BROOKLYN' },
  { fill: '#d7ff3a', ink: '#1b1e24', text: 'WATTZUP' },
  { fill: '#ffffff', ink: '#d8283a', text: 'BOARDWALK' },
  { fill: '#f2c230', ink: '#1b1e24', text: 'SPIN TO WIN' },
  { fill: '#1b1e24', ink: '#ffffff', text: 'NYC' },
];
const STREET_BANNERS: readonly (readonly [string, string, string, number])[] = [
  ['CONEY ISLAND · SPIN TO WIN', '#d8283a', '#ffffff', 96],
  ['WATTZUP · BROOKLYN', '#1d3c8f', '#ffffff', 300],
];
const FEATHERS: readonly FeatherWord[] = [
  ['CONEY ISLAND', '#d8283a', '#ffffff'],
  ['WATTZUP', '#d7ff3a', '#1b1e24'],
  ['BROOKLYN', '#1d3c8f', '#ffffff'],
  ['NYC', '#f2c230', '#1b1e24'],
];
const FEATHER_EVERY = 20;
/** The stars and stripes, strung across the boardwalk between the lamp posts. */
const STRIPES = ['#d8283a', '#ffffff', '#1d3c8f'];
const LAMP_EVERY = 16;
/** The names and cries chalked on the planks. */
const ROAD_PAINT: readonly (readonly [string, string])[] = [
  ['GO MAYA', '#ffffff'],
  ['ALLEZ JONAS', '#f2c230'],
  ['ANA!', '#ffffff'],
  ['SOPHIE', '#ff8ab0'],
  ['KENJI', '#3ac8e8'],
  ['RAVI!', '#d7ff3a'],
  ['SPIN', '#ffffff'],
  ['BROOKLYN', '#f2c230'],
];
const ROAD_SLOGANS: readonly (readonly [string, string])[] = [
  ['CONEY ISLAND', '#ffffff'],
  ['SPIN TO WIN', '#f2c230'],
  ['WATTZUP', '#d7ff3a'],
];
/** The arcades and clam bars along the boardwalk: their signs and their colours. */
const STALLS: readonly (readonly [string, string, string])[] = [
  ['PAUL’S DAUGHTER', '#faf1cf', '#bb3024'],
  ['ARCADE', '#3ac8e8', '#1b1e24'],
  ['HOT DOGS', '#f2c230', '#d8283a'],
  ['ICE CREAM', '#ffb8d0', '#1d3c8f'],
  ['SOUVENIRS', '#ffffff', '#1f8a5a'],
  ['FRIED CLAMS', '#ff8a1a', '#ffffff'],
  ['RUBY’S BAR & GRILL', '#982826', '#fff3c9'],
  ['GAMES', '#d8283a', '#f2c230'],
];

/** Height of the Cyclone's lift hill and camelbacks along its out-and-back track. */
function cycloneHeight(u: number): number {
  return (
    3 +
    25 * Math.exp(-(((u - 0.12) / 0.11) ** 2)) +
    (u > 0.3 ? Math.min(1, (u - 0.3) / 0.08) * (6 + 12 * Math.abs(Math.sin(u * 8))) : 0)
  );
}

interface Prop {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
}

export class ConeyStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly crowd: Crowd;
  private readonly props: Prop[] = [];
  private readonly horizon = new Group();
  private readonly sea = new Group();
  private wheel: Group | null = null;
  private gondolas: { seats: InstancedMesh; glass: InstancedMesh; caps: InstancedMesh } | null =
    null;
  private readonly cabinPose = new Matrix4();
  private readonly train: Group[] = [];
  private readonly wheelStand = new Group();
  private readonly coaster = new Group();
  private tower: Group | null = null;
  private time = 0;

  get carRadius(): number {
    if (!this.gondolas) return 0;
    const positions = this.gondolas.glass.instanceMatrix.array;
    return Math.hypot(positions[28]!, positions[29]!);
  }

  get trainX(): number {
    return this.train[0]?.position.x ?? 0;
  }

  /** Bring the three Brooklyn landmarks into view at their own chainage. */
  alignPark(distance: number): void {
    this.wheelStand.position.z = distance - 1710 + AHEAD;
    this.coaster.position.z = distance - 2700 + AHEAD;
    // The tower is the wayfinding landmark along the entire straight. Compress the
    // far distance beyond the shops so its lattice still reads on a tablet.
    if (this.tower) this.tower.position.z = AHEAD - Math.min(590, 8500 - distance);
  }
  private readonly flagMaterials = ['#d8283a', '#ffffff', '#1d3c8f', '#f2c230'].map(
    (colour) => new MeshStandardMaterial({ color: colour, side: DoubleSide, roughness: 0.8 }),
  );

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
    // Packed along the shops, in knots along the railing so the beach shows.
    this.crowd = new Crowd(this.group, disposables, {
      loop: LOOP,
      near: CROWD_NEAR,
      far: CROWD_FAR,
      spacing: 0.6,
      wardrobe: SUMMER,
      flags: this.flagMaterials,
      flagShare: 0.15,
      seeds: [5811, 5817],
      skip: (side, offset, x) => side < 0 && (Math.abs(x) > CROWD_NEAR + 0.6 || offset % 40 < 26),
      armsUp: 0.15,
    });
    this.group.add(this.horizon, this.sea);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(...this.flagMaterials);
    this.addGround(roadHalf, points);
    this.crowd.build();
    this.addSea();
    this.addBeach();
    this.addLamps();
    this.addStalls();
    this.addStreetBanners(roadHalf);
    this.addFeatherFlags();
    this.addRoadPaint();
    this.addSkyline();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The Wonder Wheel turns slowly.
    const turn = seconds * 0.05;
    if (this.wheel) this.wheel.rotation.z = turn;
    if (this.gondolas) {
      const { seats, glass, caps } = this.gondolas;
      const pose = this.cabinPose.makeRotationZ(-turn);
      const dx = Math.sin(turn);
      const dy = Math.cos(turn);
      for (let i = 0; i < glass.count; i++) {
        const angle = (i * Math.PI * 2) / glass.count;
        const radius = i % 3 === 0 ? 23 : 17.5 - 3.5 * Math.sin(angle + turn);
        const x = radius * Math.cos(angle),
          y = radius * Math.sin(angle);
        glass.setMatrixAt(i, pose.setPosition(x, y, 0));
        seats.setMatrixAt(i, pose.setPosition(x - 0.9 * dx, y - 0.9 * dy, 0));
        caps.setMatrixAt(i, pose.setPosition(x + 0.53 * dx, y + 0.53 * dy, 0));
      }
      for (const batch of [seats, glass, caps]) batch.instanceMatrix.needsUpdate = true;
    }
    for (const [i, carriage] of this.train.entries()) {
      const phase = seconds * 0.19 - i * 0.12;
      const u = (1 - Math.cos(phase)) / 2;
      const lane = (1 - Math.tanh(7 * Math.sin(phase))) / 2;
      const x = 6 + 40 * u;
      const height = cycloneHeight(u) * (1 - 0.15 * lane);
      carriage.position.set(x, height + 0.78, 75 - 15 * u - 5 * lane);
      carriage.rotation.z = Math.atan2(cycloneHeight(u + 0.001) - cycloneHeight(u - 0.001), 0.08);
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the boardwalk, under the beach. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position');
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 40);
      position.setY(i * 2 + 1, p.height - 40);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    const along = (offset: number, every: number) => loopMetres(offset, s, every, BEHIND);
    const ground = (metres: number) => heightAt(Math.max(metres, 0));
    for (const prop of this.props) {
      const metres = along(prop.offset, LOOP);
      prop.mesh.visible = metres < AHEAD - 12;
      prop.mesh.position.set(prop.x, ground(metres) + KERB, -metres);
    }
    this.crowd.place(this.time, heightAt, along, KERB);
    this.sea.position.y = ground(0);
    this.horizon.position.set(0, heightAt(AHEAD), -AHEAD);
  }

  /**
   * The boardwalk's planks in chevrons from the railing to the shops, laid over the road, the
   * railing and the drop to the beach, the beach out to the surf, and the barriers.
   */
  private addGround(roadHalf: number, points: number): void {
    const planks = this.track(plankTexture());
    planks.wrapS = RepeatWrapping;
    planks.wrapT = RepeatWrapping;
    planks.repeat.set(1 / 4, 1 / 4);
    const deck = this.material({
      map: planks,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, deck, [
      [SHOPS + 40, KERB],
      [roadHalf + 0.3, KERB],
      [-RAIL, KERB],
    ]);
    // Under the road strip too, so the planks run kerb to kerb.
    this.ribbons.add(points, deck, [
      [roadHalf + 0.3, 0.006],
      [-roadHalf - 0.3, 0.006],
    ]);
    const timber = this.material({ color: 0x6a5a48, roughness: 0.9 });
    this.ribbons.add(points, timber, [
      [-RAIL, KERB],
      [-RAIL, SAND],
    ]);
    const sand = this.material({ map: this.repeat(sandTexture(), 6, 6), roughness: 1 });
    this.ribbons.add(points, sand, [
      [-RAIL, SAND],
      [-SURF, SAND - 0.4],
    ]);
    const foam = this.material({ color: 0xf4f6f4, roughness: 0.6 });
    this.ribbons.add(points, foam, [
      [-SURF, SAND - 0.4],
      [-SURF - 5, SAND - 0.55],
    ]);
    // The railing: a post every 2.4 m and two rails, iron painted dark green.
    const iron = this.material({ color: 0x2a4a3a, metalness: 0.4, roughness: 0.6 });
    for (const y of [0.55, 1.05]) {
      this.ribbons.add(points, iron, [
        [-RAIL + 0.04, KERB + y + 0.05],
        [-RAIL + 0.04, KERB + y - 0.05],
      ]);
    }
    const posts = new BoxBuilder();
    for (let z = 0; z < 48; z += 2.4) posts.box(iron, [0.08, 1.1, 0.08], [0, 0.55, -z]);
    const run = posts.build(this.disposables).children as Mesh[];
    for (let offset = 0; offset < LOOP; offset += 48) {
      const holder = new Group();
      holder.add(...run.map((m) => new Mesh(m.geometry, m.material)));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -RAIL + 0.04 });
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

  /** The Atlantic: blue-green to the horizon, sparkling, beyond the surf. */
  private addSea(): void {
    const water = this.material({
      map: this.repeat(seaTexture(), 30, 30),
      color: 0x5a8aa0,
      roughness: 0.2,
      metalness: 0.2,
    });
    const plane = new PlaneGeometry(4000, 6000);
    plane.rotateX(-Math.PI / 2);
    plane.translate(-SURF - 2 - 2000, SAND - 0.6, -2000);
    this.disposables.push(plane);
    this.sea.add(new Mesh(plane, water));
  }

  /**
   * The beach below the railing: umbrellas in stripes, towels laid out, bathers standing and
   * strolling, and a white lifeguard chair every stretch, in chunks along the shore.
   */
  private addBeach(): void {
    const random = seeded(5821);
    const pole = new CylinderGeometry(0.03, 0.03, 2.2, 5);
    pole.translate(0, 1.1, 0);
    const canopy = new ConeGeometry(1.3, 0.5, 8, 1, true);
    canopy.translate(0, 2.2, 0);
    this.disposables.push(pole, canopy);
    const white = this.material({ color: 0xf4f4f0, roughness: 0.7 });
    const umbrellas = ['#d8283a', '#f2c230', '#3ac8e8', '#ff8ab0', '#1d3c8f', '#1f8a5a'].map((c) =>
      this.material({ color: c, roughness: 0.8, side: DoubleSide }),
    );
    const towels = ['#ff6a3a', '#3ac8e8', '#f2c230', '#ffffff', '#e8a0c0'].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const CHUNK = 40;
    for (let offset = 0, k = 0; offset < LOOP; offset += CHUNK, k++) {
      const holder = new Group();
      const b = new BoxBuilder();
      const people: [number, number][] = [];
      const poles = new InstancedMesh(pole, white, 26);
      const canopies = new InstancedMesh(canopy, white, 26);
      const pose = new Matrix4();
      holder.add(poles, canopies);
      this.disposables.push(poles, canopies);
      // Packed thickest under the railing, thinning toward the water.
      for (let n = 0; n < 26; n++) {
        const x = -RAIL - 3 - random() ** 1.5 * (SURF - RAIL - 9);
        const z = -random() * CHUNK;
        pose.makeTranslation(x, SAND, z);
        poles.setMatrixAt(n, pose);
        canopies.setMatrixAt(n, pose);
        canopies.setColorAt(n, umbrellas[Math.floor(random() * umbrellas.length)]!.color);
        b.box(towels[n % towels.length]!, [0.9, 0.03, 1.8], [x + 1.2, SAND + 0.02, z + 0.4]);
        people.push([x + 1.5, z - 0.6], [x - 1 + random() * 2, z + 1.5]);
      }
      // Bathers wading in the surf, waist deep.
      const wading: [number, number][] = [];
      for (let n = 0; n < 10; n++) wading.push([-SURF - 1 - random() * 7, -random() * CHUNK]);
      // Gulls wheeling over the sand.
      for (let n = 0; n < 4; n++) {
        const x = -RAIL - 6 - random() * 30;
        const y = SAND + 7 + random() * 7;
        const z = -random() * CHUNK;
        b.box(white, [0.8, 0.05, 0.28], [x - 0.36, y + 0.12, z], 0.35);
        b.box(white, [0.8, 0.05, 0.28], [x + 0.36, y + 0.12, z], -0.35);
      }
      if (k % 2 === 0) {
        // A lifeguard chair: four white legs, the seat high up, a red rescue float.
        const x = -RAIL - 22;
        for (const [dx, dz] of [
          [-0.5, -0.5],
          [0.5, -0.5],
          [-0.5, 0.5],
          [0.5, 0.5],
        ] as const) {
          b.box(white, [0.1, 2.4, 0.1], [x + dx, SAND + 1.2, -20 + dz]);
        }
        b.box(white, [1.3, 0.1, 1.2], [x, SAND + 2.4, -20]);
        b.box(white, [1.3, 0.8, 0.08], [x, SAND + 2.85, -19.4]);
        b.box(umbrellas[0]!, [0.25, 0.9, 0.12], [x + 0.7, SAND + 1.6, -19.4]);
      }
      holder.add(b.build(this.disposables));
      const all = people.length + wading.length;
      const figures = new Figures(holder, this.disposables, all, SUMMER, 5831 + k);
      people.forEach(([x, z], i) =>
        figures.set(i, x, SAND, z, random() * Math.PI * 2, 0.9 + random() * 0.15),
      );
      wading.forEach(([x, z], i) =>
        figures.set(people.length + i, x, SAND - 1.3, z, random() * Math.PI * 2, 0.95),
      );
      figures.commit();
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /**
   * The boardwalk's lamp posts every LAMP_EVERY metres along both sides, iron with a white globe,
   * the stars-and-stripes bunting strung across between each pair.
   */
  private addLamps(): void {
    const iron = this.material({ color: 0x2a4a3a, metalness: 0.4, roughness: 0.6 });
    const globe = this.material({
      color: 0xfffaf0,
      emissive: 0xfff4e0,
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    const post = new CylinderGeometry(0.08, 0.13, 4.6, 8);
    post.translate(0, 2.3, 0);
    const ball = new SphereGeometry(0.28, 12, 8);
    ball.translate(0, 4.85, 0);
    const bunting = buntingGeometry(
      8.6,
      STRIPES,
      [
        [4.6, 0],
        [4.1, 1.8],
      ],
      1.1,
    );
    bunting.translate(0.4, 0, 0);
    this.disposables.push(post, ball, bunting);
    const pennant = this.material({ vertexColors: true, side: DoubleSide, roughness: 0.8 });
    for (let offset = 4; offset < LOOP; offset += LAMP_EVERY) {
      const holder = new Group();
      for (const x of [-8.2, 9]) {
        const p = new Mesh(post, iron);
        const g = new Mesh(ball, globe);
        p.position.x = g.position.x = x;
        p.castShadow = true;
        holder.add(p, g);
      }
      if (!STREET_BANNERS.some(([, , , at]) => Math.abs(offset - at) < 10)) {
        holder.add(new Mesh(bunting, pennant));
      }
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /**
   * The arcades and clam bars on the right: one- and two-storey fronts in bright paint, each
   * with its sign along the fascia, a striped awning on white posts over its open counter, a
   * white cornice and a stepped false front over its roofline. The two-storey ones have a row of
   * windows upstairs and a sign up on the roof, and every fourth stall a timber water tank.
   */
  private addStalls(): void {
    const random = seeded(5841);
    const counter = this.material({ color: 0x2a2a2e, roughness: 0.6 });
    const roofs = this.material({ color: 0x8a8e96, roughness: 0.8 });
    const trim = this.material({ color: 0xf6f2ea, roughness: 0.6 });
    const glass = this.material({ color: 0x1e2a36, roughness: 0.2, metalness: 0.3 });
    const timber = this.material({ color: 0x6a4a32, roughness: 0.9 });
    const tank = new CylinderGeometry(1.3, 1.3, 2.4, 12);
    tank.translate(0, 1.2, 0);
    const lid = new ConeGeometry(1.45, 0.9, 12);
    lid.translate(0, 2.85, 0);
    this.disposables.push(tank, lid);
    let k = 0;
    for (let offset = 0; offset < LOOP; k++) {
      const [name, paint, ink] = STALLS[k % STALLS.length]!;
      const width = 9 + random() * 10;
      const tall = k % 3 === 2 ? 8 + random() * 2 : 4.5 + random() * 1.5;
      const holder = new Group();
      const b = new BoxBuilder();
      const wall = this.material({ color: paint, roughness: 0.8 });
      b.box(wall, [8, tall, width], [4, tall / 2, 0]);
      b.box(roofs, [8.2, 0.3, width + 0.2], [4, tall + 0.15, 0]);
      b.box(counter, [0.1, 2.2, width - 2], [-0.02, 1.4, 0]);
      // The cornice, and the false front stepped up over the roofline.
      b.box(trim, [0.5, 0.3, width + 0.1], [-0.05, tall, 0]);
      const step = 0.7 + random() * 0.5;
      b.box(wall, [0.35, step, width * 0.7], [0.15, tall + step / 2, 0]);
      b.box(trim, [0.45, 0.2, width * 0.7 + 0.1], [0.15, tall + step + 0.1, 0]);
      b.box(wall, [0.35, step, width * 0.3], [0.15, tall + step * 1.5, 0]);
      b.box(trim, [0.45, 0.2, width * 0.3 + 0.1], [0.15, tall + step * 2 + 0.1, 0]);
      // The awning's white posts along the counter.
      const posts = Math.max(2, Math.round(width / 3.5));
      for (let i = 0; i <= posts; i++) {
        b.box(trim, [0.14, 2.2, 0.14], [-1.3, 1.1, -width / 2 + 0.3 + (i * (width - 0.6)) / posts]);
      }
      if (k % 3 === 2) {
        // Upstairs: a row of windows with white frames.
        for (let z = -width / 2 + 1.6; z < width / 2 - 1; z += 2.4) {
          b.box(trim, [0.06, 1.7, 1.4], [-0.03, tall - 2.6, z]);
          b.box(glass, [0.1, 1.4, 1.1], [-0.04, tall - 2.6, z]);
        }
        // The roof sign's frame.
        for (const z of [-width * 0.3, width * 0.3]) {
          b.box(counter, [0.15, 2.4, 0.15], [2.1, tall + 1.2, z]);
        }
      }
      holder.add(b.build(this.disposables));
      if (k % 4 === 1) {
        // A timber water tank on four legs on the roof.
        const water = new Group();
        water.add(new Mesh(tank, timber), new Mesh(lid, roofs));
        water.position.set(5, tall + 1.6, (random() - 0.5) * (width - 4));
        for (const [dx, dz] of [
          [-0.8, -0.8],
          [0.8, -0.8],
          [-0.8, 0.8],
          [0.8, 0.8],
        ] as const) {
          const leg = new BoxBuilder();
          leg.box(counter, [0.14, 1.6, 0.14], [dx, -0.8, dz]);
          water.add(leg.build(this.disposables));
        }
        holder.add(water);
      }
      const sign = this.track(signTexture(name, paint, ink));
      const fascia = new Mesh(
        new PlaneGeometry(width - 0.6, 1.1),
        this.material({ map: sign, roughness: 0.6 }),
      );
      this.disposables.push(fascia.geometry);
      fascia.rotation.y = -Math.PI / 2;
      fascia.position.set(-0.06, 3.4, 0);
      holder.add(fascia);
      if (name.startsWith('PAUL') || name.startsWith('RUBY')) {
        const blade = new Group();
        const bracket = new BoxBuilder();
        bracket.box(timber, [3.1, 0.16, 0.14], [-1.35, 4.75, 0]);
        bracket.box(trim, [0.08, 0.48, 0.08], [-2.5, 4.5, 0]);
        blade.add(bracket.build(this.disposables));
        const panel = new PlaneGeometry(2.6, 0.93);
        const lettered = new Mesh(panel, this.material({ map: sign, side: DoubleSide }));
        this.disposables.push(panel);
        lettered.position.set(-1.8, 3.87, 0.08);
        blade.add(lettered);
        holder.add(blade);
      }
      const stripes = this.track(awningTexture(ink));
      stripes.wrapS = RepeatWrapping;
      stripes.repeat.set(width / 2, 1);
      const awning = new Mesh(
        new PlaneGeometry(width, 1.6),
        this.material({ map: stripes, roughness: 0.8, side: DoubleSide }),
      );
      this.disposables.push(awning.geometry);
      awning.rotation.set(-1.0, -Math.PI / 2, 0, 'YXZ');
      awning.position.set(-0.7, 2.6, 0);
      holder.add(awning);
      if (k % 3 === 2) {
        const roofSign = new Mesh(
          new PlaneGeometry(width * 0.8, 1.8),
          this.material({ map: sign, roughness: 0.6, side: DoubleSide }),
        );
        this.disposables.push(roofSign.geometry);
        roofSign.rotation.y = -Math.PI / 2;
        roofSign.position.set(2, tall + 2.6, 0);
        holder.add(roofSign);
      }
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + width / 2, x: SHOPS });
      offset += width + 0.5;
    }
  }

  private addStreetBanners(roadHalf: number): void {
    const post = new CylinderGeometry(0.1, 0.1, 6.4, 8);
    post.translate(0, 3.2, 0);
    const cloth = new PlaneGeometry(2 * roadHalf + 1.2, 2);
    this.disposables.push(post, cloth);
    const steel = this.material({ color: 0x2a4a3a, metalness: 0.4, roughness: 0.5 });
    for (const [text, fill, ink, offset] of STREET_BANNERS) {
      const banner = new Group();
      for (const x of [-roadHalf - 0.7, roadHalf + 0.7]) {
        const p = new Mesh(post, steel);
        p.position.x = x;
        banner.add(p);
      }
      const c = new Mesh(
        cloth,
        this.material({
          map: this.track(clothBannerTexture(text, fill, ink)),
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
      for (let offset = 10; offset < LOOP; offset += FEATHER_EVERY) {
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
    const rows = paintedRows(
      {
        loop: LOOP,
        every: 8,
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
   * Ahead along the shore: the Wonder Wheel turning over the amusement park on the right, its
   * white rims, spokes and swinging cars; the white wooden lattice of the Cyclone climbing behind
   * the shops; and the red Parachute Jump at the end of the beach, its tapering lattice tower and
   * the ring of arms at its crown. All hazed by hand.
   */
  private addSkyline(): void {
    const h = this.horizon;
    const haze = new Color(HAZE);
    const white = hazedMaterial(this.disposables, haze, 0xf4f2ec, 0.12);
    // The Wonder Wheel: two rims, the hub and spokes, the cars hung round it, on A-frame legs.
    const R = 23;
    const HUB = R + 4;
    const wheel = new Group();
    const parts: BufferGeometry[] = [];
    for (const z of [-1.6, 1.6]) {
      for (const r of [R, R * 0.55]) {
        const rim = new TorusGeometry(r, 0.35, 6, 64);
        rim.translate(0, 0, z);
        parts.push(rim);
      }
      for (let k = 0; k < 16; k++) {
        const spoke = new BoxGeometry(0.25, R, 0.25);
        spoke.translate(0, R / 2, z);
        spoke.rotateZ((k / 16) * Math.PI * 2);
        parts.push(spoke);
      }
    }
    const hub = new CylinderGeometry(1.4, 1.4, 4, 16);
    hub.rotateX(Math.PI / 2);
    parts.push(hub);
    const frame = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(frame);
    const enamel = hazedMaterial(this.disposables, haze, 0x45836e, 0.09);
    wheel.add(new Mesh(frame, enamel));
    const cars = ['#d8283a', '#1d3c8f', '#f2c230', '#1f8a5a', '#ff8a1a', '#3ac8e8'].map((c) =>
      hazedMaterial(this.disposables, haze, c, 0.15),
    );
    const car = new BoxGeometry(2.2, 1.15, 2.6);
    const glazing = new BoxGeometry(1.94, 0.93, 2.32);
    const roof = new BoxGeometry(2.34, 0.18, 2.72);
    const glass = hazedMaterial(this.disposables, haze, 0x506269, 0.12);
    const track = new BoxBuilder();
    this.disposables.push(glazing, roof);
    this.disposables.push(car);
    const seats = new InstancedMesh(car, white, 24);
    const windows = new InstancedMesh(glazing, glass, 24);
    const caps = new InstancedMesh(roof, white, 24);
    this.gondolas = { seats, glass: windows, caps };
    this.disposables.push(seats, windows, caps);
    wheel.add(seats, windows, caps);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      seats.setColorAt(k, cars[k % cars.length]!.color);
      caps.setColorAt(k, cars[k % cars.length]!.color);
      if (k % 3 !== 0) {
        for (const side of [-1, 1]) {
          const x = 17.5 * Math.cos(a) - side * 0.8 * Math.sin(a);
          const y = 17.5 * Math.sin(a) + side * 0.8 * Math.cos(a);
          track.box(enamel, [7.5, 0.14, 0.18], [x, y, 0], a);
        }
      }
    }
    wheel.add(track.build(this.disposables));
    wheel.position.set(48, HUB, -40);
    wheel.rotation.y = -0.25;
    this.wheelStand.add(wheel);
    h.add(this.wheelStand, this.coaster);
    this.wheel = wheel;
    const legs = new BoxBuilder();
    for (const dz of [-3, 3]) {
      for (const dx of [-11, 11]) {
        const len = Math.hypot(dx, HUB);
        legs.box(white, [0.6, len, 0.6], [48 + dx / 2, HUB / 2, -40 + dz], Math.atan2(dx, HUB));
      }
    }
    for (const dz of [-3, 3]) {
      for (let level = 0; level < 4; level++) {
        const rise = HUB / 5;
        const width = 18 * (1 - level / 5);
        for (const sign of [-1, 1]) {
          legs.box(
            cars[0]!,
            [Math.hypot(width, rise), 0.23, 0.26],
            [48, (level + 0.55) * rise, -40 + dz],
            sign * Math.atan2(rise, width),
          );
        }
      }
    }
    const sign = this.track(signTexture('WONDER WHEEL', '#efe7c2', '#bb3024'));
    const signPanel = new PlaneGeometry(15, 2.4);
    this.disposables.push(signPanel);
    const marquee = new Mesh(signPanel, this.material({ map: sign, side: DoubleSide }));
    marquee.position.set(48, 7, -36);
    this.wheelStand.add(marquee);
    this.wheelStand.add(legs.build(this.disposables));
    // The Cyclone: the white wooden lattice of its out-and-back track, beside the boardwalk on
    // the right in front of the Wonder Wheel, broadside to the rider: climbing to its lift hill
    // at the boardwalk's end and dropping through its hills toward the amusement park.
    const cyclone = new BoxBuilder();
    const rails = hazedMaterial(this.disposables, haze, 0x7a2a22, 0.1);
    const lattice = hazedMaterial(this.disposables, haze, 0xf6f2ea, 0.08);
    for (const t of [0, 1]) {
      const at = (u: number) =>
        [6 + 40 * u, cycloneHeight(u) * (t ? 0.85 : 1), 75 - 15 * u - 5 * t] as const;
      // The track: the rails sloping from one point of its line to the next, finely, so its
      // hills read as curves.
      for (let u = 0; u < 1; u += 0.007) {
        const [x0, y0, z0] = at(u);
        const [x1, y1, z1] = at(u + 0.007);
        const run = Math.hypot(x1 - x0, y1 - y0);
        cyclone.box(
          rails,
          [run + 0.1, 0.8, 2.2],
          [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
          Math.atan2(y1 - y0, x1 - x0),
        );
      }
      for (let k = 0, u = 0; u < 1; k++, u += 0.035) {
        const [x, y, z] = at(u);
        for (const dz of [-0.7, 0.7]) cyclone.box(lattice, [0.4, y, 0.4], [x, y / 2, z + dz]);
        for (let yy = 2.5; yy < y; yy += 3) {
          cyclone.box(lattice, [1.4, 0.3, 1.9], [x, yy, z]);
          // The cross-bracing between one bent and the next, leaning one way then the other.
          cyclone.box(lattice, [0.2, 3.3, 0.2], [x + 0.7, yy + 1.5, z], k % 2 ? 0.42 : -0.42);
        }
      }
    }
    this.coaster.add(cyclone.build(this.disposables));
    for (let i = 0; i < 4; i++) {
      const body = new BoxBuilder();
      body.box(cars[0]!, [2.1, 0.65, 1.55], [0, 0, 0]);
      for (const end of [-0.8, 0.2]) {
        body.box(glass, [0.2, 0.55, 1.38], [end, 0.5, 0]);
        body.box(white, [0.1, 0.1, 1.42], [end + 0.54, 0.45, 0]);
      }
      const carriage = body.build(this.disposables);
      this.coaster.add(carriage);
      this.train.push(carriage);
    }
    // The Parachute Jump: a red tapering lattice tower, the ring of arms at its crown.
    const red = hazedMaterial(this.disposables, haze, 0xc8302a, 0.3, {
      transparent: true,
      alphaTest: 0.4,
      side: DoubleSide,
    });
    red.map = this.track(latticeTexture());
    red.map.wrapS = RepeatWrapping;
    red.map.wrapT = RepeatWrapping;
    red.map.repeat.set(2, 14);
    const tower = new CylinderGeometry(2.4, 7, 64, 4, 1, true);
    tower.rotateY(Math.PI / 4);
    tower.translate(0, 32, 0);
    this.disposables.push(tower);
    const jump = new Group();
    jump.add(new Mesh(tower, red));
    const crown = new BoxBuilder();
    const solid = hazedMaterial(this.disposables, haze, 0xc8302a, 0.3);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const arm = new BoxGeometry(14, 0.5, 0.5);
      arm.translate(7, 0, 0);
      arm.rotateZ(-0.25);
      arm.rotateY(a);
      arm.translate(0, 66, 0);
      const m = new Mesh(arm, solid);
      this.disposables.push(arm);
      jump.add(m);
    }
    const ring = new TorusGeometry(13.5, 0.4, 6, 48);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, 62.5, 0);
    this.disposables.push(ring);
    jump.add(new Mesh(ring, solid));
    crown.box(solid, [2.6, 6, 2.6], [0, 67, 0]);
    jump.add(crown.build(this.disposables));
    jump.position.set(-38, 0, -260);
    this.tower = jump;
    h.add(jump);
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

/**
 * Four metres square of the boardwalk: weathered planks laid in chevrons, grey-brown with sun
 * and salt, their seams and the odd darker board.
 */
function plankTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#a8927a';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(5851);
    const tones = ['#a8927a', '#9a8470', '#b8a288', '#8e7a66', '#b09a80'];
    g.save();
    for (const half of [0, 1]) {
      g.save();
      g.beginPath();
      g.rect(half * 128, 0, 128, 256);
      g.clip();
      g.translate(half * 128 + 64, 128);
      g.rotate(half ? -Math.PI / 4 : Math.PI / 4);
      for (let y = -200; y < 200; y += 10) {
        g.fillStyle = tones[Math.floor(random() * tones.length)]!;
        g.fillRect(-200, y, 400, 9);
        g.fillStyle = 'rgba(50,36,24,0.55)';
        g.fillRect(-200, y + 9, 400, 1);
      }
      g.restore();
    }
    g.restore();
    g.fillStyle = 'rgba(50,36,24,0.6)';
    g.fillRect(127, 0, 2, 256);
  });
}

function sandTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#e8d8b4', 5861));
}

/** The Atlantic: blue-green, the sun's glints and the darker swell. */
function seaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#4a7a90';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(5871);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(255,255,255,0.45)' : 'rgba(20,50,70,0.4)';
      g.fillRect(random() * 128, random() * 128, 4 + random() * 10, 1.5);
    }
  });
}

/** A stall's sign along its fascia: its name in bold on its paint, a border in its ink. */
function signTexture(name: string, paint: string, ink: string): CanvasTexture {
  return canvasTexture(512, 96, (g) => {
    g.fillStyle = paint;
    g.fillRect(0, 0, 512, 96);
    g.strokeStyle = ink;
    g.lineWidth = 8;
    g.strokeRect(6, 6, 500, 84);
    g.fillStyle = ink;
    g.font = 'bold 60px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(name, 256, 52, 480);
  });
}

/** Awning stripes, two metres of them: white and the stall's colour. */
function awningTexture(ink: string): CanvasTexture {
  return canvasTexture(64, 16, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 16);
    g.fillStyle = ink;
    g.fillRect(0, 0, 32, 16);
  });
}

/** The Parachute Jump's steel lattice: crossed braces between its legs, open between them. */
function latticeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.clearRect(0, 0, 64, 64);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 5;
    g.strokeRect(2, 2, 60, 60);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(64, 64);
    g.moveTo(64, 0);
    g.lineTo(0, 64);
    g.stroke();
  });
}
