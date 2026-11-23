// Havana Malecón's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// seafront boulevard in the late afternoon. The rider takes the inland lanes; across the
// oncoming lanes, where classic American cars cruise by in two-tone paint, the promenade runs
// along the seawall, where fishermen cast and couples stroll, and the sea surges against it,
// throwing spray over the wall in bursts and falling still between them. Pastel façades with
// colonnades, balconies and peeling plaster line the right, palms stand among them, and El
// Morro's castle and lighthouse guard the harbour mouth ahead across the water. Built on the
// shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BufferAttribute,
  BoxGeometry,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  QuadraticBezierCurve3,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, loopMetres, Ribbons, type SceneStreet, seeded, speckle } from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The Malecón repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.15;
/** The oncoming lanes' width, the promenade's, the seawall's height and the sea below it. */
const LANES = 7;
const PROMENADE = 5;
const WALL = 0.85;
const SEA = 1.6;
/** The portales: the arcade's height and the depth of its walk under the upper floors. */
const PORTAL = 4.6;
const ARCADE = 3.6;
/** How far the balconies stand out from the upper floors. */
const BALCONY = 0.8;
/** The width of a side street, from façade to façade. */
const CROSS = 12;
/** The surges: each breaks over the wall for SURGE seconds of every CYCLE. */
const CYCLE = 8;
const SURGE = 3.2;
/** The drops flung up by each surge. */
const SPRAY_DROPS = 140;
/** How fast each breaker runs along the wall, in metres a second. */
const RUN = 12;

const CARS = [
  ['#e8455a', '#f5f1e8'],
  ['#2ec4b6', '#f5f1e8'],
  ['#ffd23f', '#f5f1e8'],
  ['#3a86ff', '#f5f1e8'],
  ['#f15bb5', '#f5f1e8'],
  ['#ff9f1c', '#2a2a2e'],
  ['#7ae582', '#f5f1e8'],
  ['#b0b8c0', '#c8102e'],
] as const;

/** The colours of the washing hung over the balconies. */
const LAUNDRY = [0xf5f5f0, 0xe63946, 0x457b9d, 0xffb703, 0xf1faee, 0x2a9d8f, 0xe76f51, 0x8ecae6];

const STROLL_WEAR = {
  tops: ['#ffffff', '#f5f1e8', '#ff6b5a', '#2ec4b6', '#ffd23f', '#3a86ff', '#f15bb5'],
  bottoms: ['#1b3a5c', '#e8c9a0', '#2f3e5c', '#f5f1e8', '#5a5f69'],
  skins: ['#e2b48c', '#c48a5f', '#8d5a3b', '#5a3a29', '#f0c8a0'],
};

interface Drop {
  readonly x: number;
  readonly z: number;
  readonly vx: number;
  readonly vy: number;
  readonly vz: number;
  readonly size: number;
  readonly lag: number;
}

interface Spray {
  readonly burst: InstancedMesh;
  readonly sheet: Mesh;
  readonly material: MeshStandardMaterial;
  readonly drops: readonly Drop[];
  readonly delay: number;
}

interface Sitter {
  readonly offset: number;
  /** Faces the sea, legs over the water, rather than the city. */
  readonly sea: boolean;
  readonly rod: boolean;
}

interface Stroller {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly heading: number;
  readonly phase: number;
  /** A child's height as a fraction of an adult's; absent for an adult. */
  readonly child?: number;
}

export class HavanaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly cars: { mesh: Group; offset: number; speed: number }[] = [];
  private readonly sprays: Spray[] = [];
  private readonly strollers: Stroller[] = [];
  private people: Walkers | null = null;
  /** Where each zebra crossing lies, and the people walking over them. */
  private readonly crossings: number[] = [];
  private readonly crossers: {
    offset: number;
    phase: number;
    period: number;
    from: number;
    to: number;
  }[] = [];
  private crowd: Walkers | null = null;
  private seated: Sitters | null = null;
  private readonly sitters: Sitter[] = [];
  private swell: Texture | null = null;
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly drop = new Matrix4();
  private readonly flight = new Vector3();
  private readonly upward = new Vector3(0, 1, 0);
  private readonly spin = new Quaternion();
  private readonly stretch = new Vector3();
  private readonly at = new Vector3();
  private readonly tank = tankGeometry();
  private readonly dressing = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    side: DoubleSide,
  });
  private readonly wire = new MeshStandardMaterial({ color: 0x141414, roughness: 0.6 });
  private readonly signSheet = new PlaneGeometry(0.55, 0.4);
  private readonly casaSign = new MeshStandardMaterial({
    map: casaTexture(),
    side: DoubleSide,
    roughness: 0.6,
  });
  private readonly glow = new MeshStandardMaterial({
    color: 0xfff0d0,
    emissive: 0xffd590,
    emissiveIntensity: 1.2,
  });
  private readonly flagSheet = new PlaneGeometry(1.8, 0.9).rotateY(-Math.PI / 2);
  private readonly flag = new MeshStandardMaterial({
    map: cubanFlag(),
    roughness: 0.8,
    side: DoubleSide,
  });
  private readonly crest = new Matrix4();
  private crests: InstancedMesh | null = null;
  private readonly crestList: { offset: number; delay: number; length: number }[] = [];
  private foam: Texture | null = null;
  private roadHalf = 0;
  private zebra: MeshStandardMaterial | null = null;
  private readonly divers: { body: Group; phase: number }[] = [];
  private birds: InstancedMesh | null = null;
  private readonly birdList: {
    offset: number;
    x: number;
    height: number;
    radius: number;
    turn: number;
    phase: number;
    size: number;
    glide: boolean;
  }[] = [];

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.roadHalf = roadHalf;
    this.disposables.push(
      this.unit,
      this.tank,
      this.dressing,
      this.glow,
      this.wire,
      this.signSheet,
      this.casaSign,
      this.casaSign.map!,
      this.flagSheet,
      this.flag,
    );
    this.track(this.flag.map!);
    this.addSeafront(roadHalf, points);
    this.addSpray(roadHalf);
    this.addFacades(roadHalf);
    this.addPalms(roadHalf);
    this.addCars(roadHalf);
    this.addPeople(roadHalf);
    this.addMorro(roadHalf);
    this.addSkyline();
    this.addClouds();
    this.addBoats(roadHalf);
    this.addBirds(roadHalf);
    this.addBillboards(roadHalf);
    this.addDogs(roadHalf);
    this.addVendors(roadHalf);
    this.addPotholes(roadHalf);
    this.addDivers(roadHalf);
    this.addTrio(roadHalf);
    this.addBusStop(roadHalf);
    this.addPelicans(roadHalf);
    this.addKerbside(roadHalf);
    this.addGrates(roadHalf);
    this.addRockers(roadHalf);
    this.addDominoes(roadHalf);
    this.addSigns(roadHalf);
    this.addCrossers(roadHalf);
    this.addCats(roadHalf);
    this.addQuinceanera(roadHalf);
    this.addManisero(roadHalf);
    this.addManholes(roadHalf);
    this.addArrows(roadHalf);
    this.addCouple(roadHalf);
    this.addLitter(roadHalf);
    this.addKite(roadHalf);
    this.addJoggers(roadHalf);
    this.addShopSigns(roadHalf);
    this.addFruitCart(roadHalf);
    this.addReef(roadHalf, points);
    this.addLamps(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.swell) this.swell.offset.x = Math.sin(seconds * 0.5) * 0.02;
    if (this.foam) {
      this.foam.offset.x = Math.sin(seconds * 0.8) * 0.06;
      this.foam.offset.y = seconds * 0.01;
    }
    for (const spray of this.sprays) {
      // Each surge climbs over the wall, hangs and falls; then the sea is still till the next.
      const t = (((seconds + spray.delay) % CYCLE) + CYCLE) % CYCLE;
      const live = t < SURGE;
      spray.burst.visible = live;
      spray.sheet.visible = live;
      if (!live) continue;
      // The sheet of white water slams up the wall's face; the drops fly on, spread and fall.
      const slam = Math.sin(Math.PI * Math.min(t / 1.2, 1));
      spray.sheet.scale.set(1, 0.2 + slam * 1.6, 1 + slam * 0.3);
      spray.material.opacity = 0.7 * (1 - (t / SURGE) ** 2);
      spray.drops.forEach((d, i) => {
        const u = t - d.lag;
        const y = d.vy * u - 4.9 * u * u;
        if (u <= 0 || y < -0.5) {
          this.drop.makeScale(0, 0, 0);
        } else {
          // Each drop is drawn out along its flight, a streak while it is fast, a bead as it slows.
          const r = d.size * (0.7 + u * 0.4);
          this.flight.set(d.vx, d.vy - 9.8 * u, d.vz);
          const speed = this.flight.length();
          this.spin.setFromUnitVectors(this.upward, this.flight.divideScalar(speed));
          this.stretch.set(r, r * (1 + speed * 0.35), r);
          this.at.set(d.x + d.vx * u, WALL - 0.2 + y, d.z + d.vz * u);
          this.drop.compose(this.at, this.spin, this.stretch);
        }
        spray.burst.setMatrixAt(i, this.drop);
      });
      spray.burst.instanceMatrix.needsUpdate = true;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea, so the water lies under the seawall. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - SEA - 1);
      position.setY(i * 2 + 1, p.height - SEA - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    for (const car of this.cars) {
      const metres = loopMetres(car.offset + car.speed * this.time, s, LOOP, BEHIND);
      car.mesh.position.z = -metres;
      car.mesh.position.y = heightAt(metres);
    }
    for (const runner of this.runners) {
      const swing = Math.sin(this.time * 9 + runner.phase) * 0.7;
      runner.limbs.forEach((limb, k) => (limb.rotation.x = k % 2 ? -swing : swing));
    }
    const people = this.people;
    if (people) {
      this.strollers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const y = heightAt(metres) + KERB;
        people.set(i, w.x, y, -metres, w.heading, this.time * (w.child ? 6 : 4) + w.phase);
      });
      people.commit();
    }
    const crowd = this.crowd;
    if (crowd) {
      this.crossers.forEach((c, i) => {
        // Over the road and back: out for half the period, home for the other half.
        const k = (((this.time / c.period + c.phase) % 1) + 1) % 1;
        const out = k < 0.5;
        const t = out ? k * 2 : (1 - k) * 2;
        const x = c.from + (c.to - c.from) * t;
        const metres = loopMetres(c.offset, s, LOOP, BEHIND);
        const kerb = x > this.roadHalf || x < -this.roadHalf - LANES ? KERB : 0;
        const heading = out === c.to < c.from ? Math.PI / 2 : -Math.PI / 2;
        crowd.set(i, x, heightAt(metres) + kerb, -metres, heading, this.time * 4 + c.phase * 9);
      });
      crowd.commit();
    }
    const seated = this.seated;
    if (seated) {
      const wall = -this.roadHalf - LANES - PROMENADE - 0.35;
      this.sitters.forEach((p, i) => {
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        seated.set(i, wall, heightAt(metres) + WALL, -metres, p.sea ? Math.PI / 2 : -Math.PI / 2);
      });
      seated.commit();
    }
    if (this.crests) {
      const wall = -this.roadHalf - LANES - PROMENADE - 0.7;
      this.crestList.forEach((c, i) => {
        // Each crest rolls in from the open water to break at the wall's foot.
        const metres = loopMetres(c.offset, s, LOOP, BEHIND);
        const k = ((((this.time + c.delay) / CYCLE) % 1) + 1) % 1;
        const out = 3 + (1 - k) * 70;
        this.crest.makeScale(2.2 + k * 1.8, 1 + k * 1.5, c.length);
        this.crest.setPosition(wall - out, heightAt(metres) - SEA + 0.04, -metres);
        this.crests!.setMatrixAt(i, this.crest);
      });
      this.crests.instanceMatrix.needsUpdate = true;
    }
    if (this.birds) {
      this.birdList.forEach((b, i) => {
        // Each bird circles slowly, flapping, or holds its wings out to glide.
        const a = b.phase + this.time * b.turn;
        const metres = loopMetres(b.offset + Math.sin(a) * b.radius, s, LOOP, BEHIND);
        const flap = b.glide ? 0.15 : Math.sin(this.time * 9 + b.phase) * 0.5;
        this.spin.setFromAxisAngle(this.upward, a + Math.PI / 2);
        this.stretch.set(b.size, b.size * (1 + flap), b.size);
        this.at.set(b.x + Math.cos(a) * b.radius, heightAt(metres) + b.height, -metres);
        this.drop.compose(this.at, this.spin, this.stretch);
        this.birds!.setMatrixAt(i, this.drop);
      });
      this.birds.instanceMatrix.needsUpdate = true;
    }
    for (const d of this.divers) {
      // Up on the coping, then out in an arc and down into the sea, and a while under.
      const t = (this.time * 0.22 + d.phase) % 1;
      const body = d.body;
      body.visible = t < 0.72;
      if (t < 0.35) {
        body.position.set(0, WALL, 0);
        body.rotation.z = 0;
      } else {
        const f = Math.min((t - 0.35) / 0.3, 1);
        body.position.set(-3.2 * f, WALL + 1.6 * f - (1.6 + WALL + SEA) * f * f, 0);
        body.rotation.z = f * 2.2;
      }
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /**
   * The oncoming lanes with their centre line, the kerb, the promenade's paving, the seawall and
   * the sea beyond, and the pavement before the façades on the right.
   */
  private addSeafront(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({ map: this.repeat(lanesTexture(), LANES, 12), roughness: 0.85 });
    const paving = this.material({ map: this.repeat(slabTexture(), 6, 6), roughness: 0.92 });
    const kerbStone = this.material({ map: this.repeat(kerbTexture(), 1, 3), roughness: 0.85 });
    const swell = this.repeat(seaTexture(), 30, 30);
    this.swell = swell;
    const sea = this.material({
      map: swell,
      emissiveMap: swell,
      emissive: 0x4f9cc8,
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.05,
    });
    const lanes = -r - LANES;
    const promenade = lanes - PROMENADE;
    // The rider's lanes, worn: patches, cracks, oil down the lanes and manhole covers.
    const wear = this.track(wearTexture());
    wear.wrapS = RepeatWrapping;
    wear.wrapT = RepeatWrapping;
    wear.repeat.set(1 / (2 * r), 1 / 40);
    const worn = this.ribbons.add(
      points,
      this.material({
        map: wear,
        transparent: true,
        depthWrite: false,
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      [
        [r, 0.008],
        [-r, 0.008],
      ],
    );
    worn.renderOrder = 1;
    const across = this.ribbons.add(points, worn.material as MeshStandardMaterial, [
      [-r - 0.4, 0.008],
      [lanes + 0.3, 0.008],
    ]);
    across.renderOrder = 1;
    // Tar snakes: the glossy black crack sealant poured along the road's cracks, wandering down
    // the lanes and across them, catching the sun where the matt asphalt does not.
    const tar = this.track(tarTexture());
    tar.wrapS = RepeatWrapping;
    tar.wrapT = RepeatWrapping;
    tar.repeat.set(1 / (2 * r + LANES), 1 / 60);
    this.ribbons.add(
      points,
      this.material({
        map: tar,
        transparent: true,
        depthWrite: false,
        roughness: 0.25,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      }),
      [
        [r, 0.011],
        [lanes + 0.3, 0.011],
      ],
    ).renderOrder = 2;
    this.ribbons.add(points, asphalt, [
      [-r, 0.004],
      [lanes, 0.004],
    ]);
    this.ribbons.add(points, kerbStone, [
      [lanes, 0.004],
      [lanes - 0.05, KERB],
      [lanes - 0.35, KERB],
    ]);
    this.ribbons.add(points, paving, [
      [lanes - 0.35, KERB],
      [promenade, KERB],
    ]);
    // The seawall: its face to the promenade, its broad top, and its face down to the sea.
    // Its coping is rounded at both edges, where generations have sat.
    const seawall = this.material({ map: this.repeat(seawallTexture(), 4, 6), roughness: 0.95 });
    this.ribbons.add(points, seawall, [
      [promenade, KERB],
      [promenade, WALL - 0.08],
      [promenade - 0.03, WALL - 0.02],
      [promenade - 0.1, WALL],
      [promenade - 0.6, WALL],
      [promenade - 0.67, WALL - 0.02],
      [promenade - 0.7, WALL - 0.08],
      [promenade - 0.7, -SEA],
    ]);
    this.ribbons.add(points, sea, [
      [promenade - 0.7, -SEA],
      [promenade - 1400, -SEA],
    ]);
    // The wall's landward face carries what people leave on it: names and hearts in paint,
    // sprayed tags, and old patches of whitewash over earlier ones.
    const tags = this.track(graffitiTexture());
    tags.wrapS = RepeatWrapping;
    tags.wrapT = RepeatWrapping;
    tags.repeat.set(1 / 0.64, 1 / 36);
    const painted = this.material({
      map: tags,
      transparent: true,
      depthWrite: false,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.ribbons.add(points, painted, [
      [promenade + 0.004, KERB + 0.02],
      [promenade + 0.004, WALL - 0.1],
    ]).renderOrder = 1;
    // Over the rock shelf at the wall's foot the water runs turquoise, deepening to the Gulf's
    // blue within forty metres; further out, whitecaps break on the swell.
    const shallow = this.track(shallowsTexture());
    shallow.repeat.set(1 / 44, 1);
    const shallows = new MeshBasicMaterial({ map: shallow, transparent: true, depthWrite: false });
    this.disposables.push(shallows);
    this.ribbons.add(points, shallows, [
      [promenade - 0.7, -SEA + 0.02],
      [promenade - 44.7, -SEA + 0.02],
    ]).renderOrder = 1;
    const caps = this.track(whitecapTexture());
    caps.wrapS = RepeatWrapping;
    caps.wrapT = RepeatWrapping;
    caps.repeat.set(1 / 50, 1 / 50);
    const whitecaps = new MeshBasicMaterial({
      map: caps,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    this.disposables.push(whitecaps);
    this.ribbons.add(points, whitecaps, [
      [promenade - 25, -SEA + 0.03],
      [promenade - 1400, -SEA + 0.03],
    ]).renderOrder = 1;
    this.ribbons.add(points, paving, [
      [r + 4 + ARCADE, KERB],
      [r + 0.35, KERB],
    ]);
    this.ribbons.add(points, kerbStone, [
      [r + 0.35, KERB],
      [r + 0.05, KERB],
      [r, 0.004],
    ]);
    // Paint on the inland kerb: stretches of no-stopping yellow and red-and-white blocks by the
    // corners, faded and chipped back to the stone, with bare kerb between.
    const daubs = this.track(kerbPaintTexture());
    daubs.wrapS = RepeatWrapping;
    daubs.wrapT = RepeatWrapping;
    daubs.repeat.set(1 / 0.46, 1 / 120);
    this.ribbons.add(
      points,
      this.material({
        map: daubs,
        transparent: true,
        depthWrite: false,
        roughness: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      [
        [r + 0.35, KERB + 0.003],
        [r + 0.05, KERB + 0.003],
        [r - 0.004, 0.006],
      ],
    ).renderOrder = 2;
    // The inland gutter: a grimy channel along the kerb where sand, leaves and litter collect,
    // darkest at the kerb's foot, with cast-iron drain grates every so often.
    const silt = this.track(gutterTexture());
    silt.wrapS = RepeatWrapping;
    silt.wrapT = RepeatWrapping;
    silt.repeat.set(1 / 0.6, 1 / 24);
    this.ribbons.add(
      points,
      this.material({
        map: silt,
        transparent: true,
        depthWrite: false,
        roughness: 0.95,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      }),
      [
        [r, 0.013],
        [r - 0.6, 0.013],
      ],
    ).renderOrder = 2;
    // Where the breakers come over, the promenade and the outer lane lie wet: dark, glossy
    // patches and puddles that catch the sky.
    const wet = this.track(wetTexture());
    wet.wrapS = RepeatWrapping;
    wet.wrapT = RepeatWrapping;
    wet.repeat.set(1 / 9, 1 / 30);
    const damp = this.material({
      map: wet,
      transparent: true,
      depthWrite: false,
      roughness: 0.08,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -3,
    });
    this.ribbons.add(points, damp, [
      [lanes - 0.4, KERB + 0.004],
      [promenade + 0.02, KERB + 0.004],
    ]).renderOrder = 2;
    this.ribbons.add(points, damp, [
      [lanes + 3.4, 0.012],
      [lanes + 0.05, 0.012],
    ]).renderOrder = 2;
  }

  /**
   * Spray thrown up over the seawall in surges, here and there along it: a sheet of white water
   * slamming up the wall's face, and a burst of drops and spume flung high over the promenade.
   */
  private addSpray(roadHalf: number): void {
    const random = seeded(901);
    const blob = new IcosahedronGeometry(1, 1);
    const sheet = new IcosahedronGeometry(1, 2);
    sheet.scale(0.9, 2, 3.2);
    sheet.translate(0, 1, 0);
    this.disposables.push(blob, sheet);
    const x = -roadHalf - LANES - PROMENADE - 0.6;
    for (let offset = 10; offset < LOOP; offset += 6 + random() * 6) {
      const material = this.material({
        color: 0xffffff,
        emissive: 0xf2f8fa,
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0,
        roughness: 0.6,
        depthWrite: false,
      });
      const holder = new Group();
      const face = new Mesh(sheet, material);
      face.position.set(-0.7, -SEA, 0);
      const drops: Drop[] = [];
      for (let i = 0; i < SPRAY_DROPS; i++) {
        drops.push({
          x: -0.6 + random() * 0.6,
          z: (random() - 0.5) * 5,
          vx: 0.4 + random() * 2.4,
          vy: 3 + random() * 9,
          vz: (random() - 0.5) * 2.4,
          size: 0.03 + random() ** 3 * 0.2,
          lag: random() * 0.6,
        });
      }
      const burst = new InstancedMesh(blob, material, SPRAY_DROPS);
      burst.frustumCulled = false;
      holder.add(face, burst);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
      // The swell meets the wall at a slant, so each set breaks along it, running toward the rider.
      const delay = -offset / RUN + random() * 0.6;
      this.sprays.push({ burst, sheet: face, material, drops, delay });
    }
  }

  /**
   * The façades: three and four storeys, pastel and peeling, standing on their portales: an
   * arcade of square piers and round arches at the foot, its walk set back under the upper floors
   * with shopfronts and doorways deep in its shade.
   */
  private addFacades(roadHalf: number): void {
    const random = seeded(907);
    // Havana's colours: salmon, turquoise, yolk yellow, periwinkle, pink, lime, cream,
    // terracotta, sky blue, lilac and ochre, each bleached by the sun and salt by its own amount.
    const pastels = [
      0xeea383, 0x6cc4bb, 0xf3cf5e, 0x93b2e0, 0xe59ac2, 0xb5d98e, 0xf1e2c2, 0xd77c5b, 0x98d0e4,
      0xc29ad8, 0xe0b25c,
    ];
    const bleach = new Color(0xe8e4dc);
    const shade = new Color();
    let previous = -1;
    const fronts = this.track(facadeTexture());
    fronts.wrapS = RepeatWrapping;
    fronts.wrapT = RepeatWrapping;
    const arches = this.track(archTexture());
    arches.wrapS = RepeatWrapping;
    const shops = this.track(shopTexture());
    const glows = this.track(shopTexture(true));
    const piers = this.track(pierTexture());
    glows.wrapS = RepeatWrapping;
    const plain = this.track(plasterTexture());
    shops.wrapS = RepeatWrapping;
    const cornice = this.material({ color: 0xf5f1e8, roughness: 0.8 });
    const soffit = this.material({ color: 0x8a8278, roughness: 0.95 });
    const iron = this.material({
      map: this.track(railingTexture()),
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.6,
      metalness: 0.4,
    });
    const arcade = new PlaneGeometry(1, 1);
    arcade.rotateY(-Math.PI / 2);
    this.disposables.push(arcade);
    const streets = seeded(1049);
    const roofs = seeded(1051);
    const life = seeded(1117);
    const gear = seeded(1163);
    const ruins = seeded(1171);
    const towers = seeded(1361);
    const blocks = this.track(towerTexture());
    blocks.wrapS = RepeatWrapping;
    blocks.wrapT = RepeatWrapping;
    const concrete = new Color();
    const cafes = seeded(1229);
    const wires = seeded(1301);
    const signs = seeded(1433);
    const folk = seeded(1307);
    const derelict = this.track(ruinTexture());
    derelict.wrapS = RepeatWrapping;
    derelict.wrapT = RepeatWrapping;
    const timber = this.material({ color: 0x6b5238, roughness: 1 });
    let inBlock = 0;
    let block = 4;
    let built = 0;
    for (let offset = 0; offset < LOOP;) {
      const width = 12 + random() * 14;
      const floors = 2 + Math.floor(random() * 2);
      // About one building in seven is a ruin: its paint long gone, its windows gaping, its
      // balconies fallen, and its front propped from the pavement with timber shores. Now and
      // then a 1950s apartment block rises among the old fronts, nine to twelve storeys of
      // concrete banded with balconies and glass.
      const ruin = ruins() < 0.15;
      const tower = !ruin && (built++ === 5 || towers() < 0.1);
      const storeys = 9 + Math.floor(towers() * 4);
      const height = tower ? storeys * 3.1 : floors * 4.2;
      let pick = Math.floor(random() * pastels.length);
      if (pick === previous) pick = (pick + 1 + Math.floor(random() * 3)) % pastels.length;
      previous = pick;
      const tint = shade
        .set(pastels[pick]!)
        .lerp(bleach, random() * 0.45)
        .getHex();
      const map = (ruin ? derelict : tower ? blocks : fronts).clone();
      if (tower) map.repeat.set(width / 6, storeys / 4);
      else {
        map.repeat.set(width / 8, floors / 4);
        map.offset.y = 1 - floors / 4;
      }
      map.needsUpdate = true;
      this.track(map);
      const facade = this.material({
        map,
        color: ruin ? 0xc4bcb0 : tower ? concrete.set(tint).lerp(bleach, 0.7).getHex() : tint,
        roughness: 0.95,
      });
      const building = new Group();
      const body = new Mesh(this.unit, facade);
      body.scale.set(14, height, width - 0.3);
      body.position.set(7, PORTAL + height / 2, -width / 2);
      body.castShadow = true;
      // The arcade's ceiling, the shopfronts at its back and its arched front of piers.
      const ceiling = new Mesh(this.unit, soffit);
      ceiling.scale.set(ARCADE, 0.3, width - 0.3);
      ceiling.position.set(ARCADE / 2, PORTAL - 0.15, -width / 2);
      ceiling.castShadow = true;
      const shopMap = shops.clone();
      shopMap.repeat.set(width / 7, 1);
      shopMap.needsUpdate = true;
      this.track(shopMap);
      const glowMap = glows.clone();
      glowMap.repeat.set(width / 7, 1);
      glowMap.needsUpdate = true;
      this.track(glowMap);
      const back = new Mesh(
        this.unit,
        this.material({
          map: shopMap,
          color: 0xa09890,
          roughness: 0.9,
          emissive: 0xffc890,
          emissiveMap: glowMap,
          emissiveIntensity: 0.6,
        }),
      );
      back.receiveShadow = true;
      back.scale.set(14 - ARCADE, PORTAL, width - 0.3);
      back.position.set(ARCADE + (14 - ARCADE) / 2, PORTAL / 2, -width / 2);
      const bays = Math.max(2, Math.round(width / 3.6));
      const archMap = arches.clone();
      archMap.repeat.set(bays, 1);
      archMap.needsUpdate = true;
      this.track(archMap);
      const front = new Mesh(
        arcade,
        this.material({
          map: archMap,
          color: tint,
          roughness: 0.85,
          alphaTest: 0.5,
          side: DoubleSide,
        }),
      );
      front.scale.set(1, PORTAL, width - 0.3);
      front.position.set(0, PORTAL / 2, -width / 2);
      front.castShadow = true;
      front.receiveShadow = true;
      building.add(body, ceiling, back, front, ...this.portal(width, bays, cafes));
      // Square piers between the arches, with a pale plinth at the foot of each.
      const bay = (width - 0.3) / bays;
      const plaster = this.material({ map: piers, color: tint, roughness: 0.9 });
      for (let k = 0; k <= bays; k++) {
        const pier = new Mesh(this.unit, plaster);
        // An impost moulding where the arches spring from the pier.
        const impost = new Mesh(this.unit, cornice);
        impost.scale.set(0.62, 0.18, 0.62);
        impost.position.set(0.25, PORTAL - 1.45, -0.15 - k * bay);
        building.add(impost);
        // Now and then a casa particular's sign hangs out from the pier on an iron bracket.
        if (!ruin && !tower && signs() < 0.18) {
          const sign = new Mesh(this.signSheet, this.casaSign);
          sign.position.set(-0.45, 2.75, -0.15 - k * bay);
          const arm = new Mesh(this.unit, this.wire);
          arm.scale.set(0.7, 0.04, 0.04);
          arm.position.set(-0.3, 3.05, -0.15 - k * bay);
          building.add(sign, arm);
        }
        pier.scale.set(0.5, PORTAL, 0.5);
        pier.position.set(0.25, PORTAL / 2, -0.15 - k * bay);
        pier.castShadow = true;
        pier.receiveShadow = true;
        const plinth = new Mesh(this.unit, cornice);
        plinth.scale.set(0.7, 0.5, 0.7);
        plinth.position.set(0.25, 0.25, -0.15 - k * bay);
        building.add(pier, plinth);
      }
      const top = new Mesh(this.unit, cornice);
      top.scale.set(14.6, 0.5, width - 0.1);
      top.position.set(7, PORTAL + height + 0.25, -width / 2);
      const band = new Mesh(this.unit, cornice);
      band.scale.set(0.4, 0.35, width - 0.1);
      band.position.set(-0.05, PORTAL + 0.1, -width / 2);
      building.add(
        top,
        band,
        this.roofline(width, PORTAL + height + 0.5, plain, tint, cornice, roofs),
      );
      // Wrought-iron balconies on stone slabs before the French windows of each storey: one to a
      // window, or one long balcony along the front.
      const tile = ((width - 0.3) * 8) / width;
      const long = random() < 0.35;
      const slabs: BufferGeometry[] = [];
      const rails: BufferGeometry[] = [];
      const things: BufferGeometry[] = [];
      for (let i = 0; i < floors; i++) {
        const y = PORTAL + i * 4.2;
        const spans: [number, number][] = [];
        if (long) spans.push([-width + 0.6, -0.6]);
        else {
          for (let u = 2; u < width - 1.6; u += 4) {
            const z = -width + 0.15 + (u * tile) / 8;
            spans.push([z - 1.3, z + 1.3]);
          }
        }
        for (const [z0, z1] of spans) {
          const length = z1 - z0;
          const slab = new BoxGeometry(BALCONY + 0.1, 0.16, length + 0.1);
          slab.translate(-BALCONY / 2, y + 0.08, (z0 + z1) / 2);
          slabs.push(slab);
          const front = stretch(new PlaneGeometry(length, 1), length / 2.6);
          front.rotateY(-Math.PI / 2);
          front.translate(-BALCONY, y + 0.66, (z0 + z1) / 2);
          rails.push(front);
          for (const z of [z0, z1]) {
            const side = stretch(new PlaneGeometry(BALCONY, 1), BALCONY / 2.6);
            side.translate(-BALCONY / 2, y + 0.66, z);
            rails.push(side);
          }
          this.dress(life, y, z0, z1, things);
          if (!ruin && !tower && this.shades() < 0.3) building.add(this.awning(y, z0, z1));
          if (folk() < 0.35) this.resident(folk, y, z0 + 0.6 + folk() * (z1 - z0 - 1.2), things);
        }
        // Air conditioners boxed into the transoms over the windows, and the odd satellite dish.
        for (let u = 2; u < width - 1.6; u += 4) {
          const z = -width + 0.15 + (u * tile) / 8;
          const roll = gear();
          if (roll < 0.38) {
            const unit = new BoxGeometry(0.5, 0.45, 0.7).toNonIndexed();
            unit.translate(-0.22, y + 3.55, z + (gear() - 0.5) * 0.4);
            things.push(paint(unit, gear() < 0.7 ? 0xe8e4da : 0xa8a49a));
            const grille = new BoxGeometry(0.02, 0.3, 0.55).toNonIndexed();
            grille.translate(-0.48, y + 3.55, z);
            things.push(paint(grille, 0x4a4a48));
          } else if (roll < 0.46) {
            const dish = new SphereGeometry(0.4, 10, 4, 0, Math.PI * 2, 0, 0.9).toNonIndexed();
            dish.rotateZ(Math.PI / 2 + 0.5);
            dish.translate(-0.35, y + 3.3, z + 1.3);
            things.push(paint(dish, 0xd8d8d4));
          }
        }
      }
      if (things.length && !ruin && !tower) {
        const merged = mergeGeometries(things)!;
        things.forEach((g) => g.dispose());
        this.disposables.push(merged);
        const mesh = new Mesh(merged, this.dressing);
        mesh.castShadow = true;
        building.add(mesh);
      }
      // Now and then a Cuban flag hangs over the top balcony's railing.
      if (life() < 0.2 && !ruin) {
        const flag = new Mesh(this.flagSheet, this.flag);
        flag.position.set(
          -BALCONY - 0.04,
          PORTAL + (floors - 1) * 4.2 + 0.25,
          -width * (0.3 + life() * 0.4),
        );
        building.add(flag);
      }
      const slabGeometry = mergeGeometries(slabs)!;
      const railGeometry = mergeGeometries(rails)!;
      [...slabs, ...rails].forEach((g) => g.dispose());
      this.disposables.push(slabGeometry, railGeometry);
      const slabMesh = new Mesh(slabGeometry, cornice);
      slabMesh.castShadow = true;
      const railMesh = new Mesh(railGeometry, iron);
      railMesh.castShadow = true;
      building.add(this.cables(width, wires));
      if (ruin) building.add(this.shoring(width, timber));
      else if (!tower) building.add(slabMesh, railMesh);
      this.group.add(building);
      this.props.push({ mesh: building, offset, x: roadHalf + 4 });
      offset += width;
      // Every few buildings a side street opens off the Malecón into the city.
      if (++inBlock >= block && offset < LOOP - CROSS - 12) {
        this.addCrossStreet(offset, roadHalf + 4, fronts, pastels, streets);
        this.addZebra(offset, roadHalf);
        offset += CROSS;
        inBlock = 0;
        block = 3 + Math.floor(streets() * 3);
      }
    }
  }

  /**
   * A resident out on a balcony, leaning on the railing to watch the sea: shirt, forearms on the
   * rail, head and hair, merged into the building's dressing in their own colours.
   */
  private resident(random: () => number, y: number, z: number, into: BufferGeometry[]): void {
    const shirts = [0xf2efe6, 0xe63946, 0x3a86ff, 0x2a9d8f, 0xf4a261, 0x8e44ad];
    const skins = [0x8d5a3b, 0x6b4128, 0xc68b5e, 0xe0b08a, 0x4a2c1c];
    const shirt = shirts[Math.floor(random() * shirts.length)]!;
    const skin = skins[Math.floor(random() * skins.length)]!;
    const lean = -BALCONY + 0.35;
    const torso = new CapsuleGeometry(0.17, 0.4, 3, 8).toNonIndexed();
    torso.rotateZ(-0.25);
    torso.translate(lean, y + 1.0, z);
    into.push(paint(torso, shirt));
    const head = new SphereGeometry(0.11, 10, 8).toNonIndexed();
    head.translate(lean - 0.15, y + 1.48, z);
    into.push(paint(head, skin));
    const hair = new SphereGeometry(0.118, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.5).toNonIndexed();
    hair.translate(lean - 0.14, y + 1.5, z);
    into.push(paint(hair, random() < 0.75 ? 0x1a1410 : 0x8a8580));
    for (const side of [-0.17, 0.17]) {
      const arm = new CapsuleGeometry(0.045, 0.3, 3, 6).toNonIndexed();
      arm.rotateZ(Math.PI / 2);
      arm.translate(-BALCONY + 0.15, y + 1.12, z + side);
      into.push(paint(arm, random() < 0.5 ? skin : shirt));
    }
  }

  private readonly shades = seeded(1627);
  private awnings?: MeshStandardMaterial[];

  /**
   * A canvas awning over a balcony's French windows: striped, sun-faded red, green or blue on
   * cream, sloping out from the wall above the window and hanging a scalloped valance.
   */
  private awning(y: number, z0: number, z1: number): Mesh {
    if (!this.awnings) {
      this.awnings = ['#b8402f', '#3f7a52', '#2f5a8a', '#c8902a'].map((c) =>
        this.material({ map: this.track(awningTexture(c)), roughness: 0.9, side: DoubleSide }),
      );
    }
    const width = z1 - z0 - 0.3;
    const sheet = new PlaneGeometry(1.4, width);
    sheet.rotateZ(Math.PI / 2);
    sheet.rotateY(Math.PI / 2);
    this.disposables.push(sheet);
    const mesh = new Mesh(sheet, this.awnings[Math.floor(this.shades() * this.awnings.length)]!);
    mesh.rotation.z = -0.55;
    mesh.position.set(-0.4, y + 2.75, (z0 + z1) / 2);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * What lives on a balcony between `z0` and `z1` at height `y`: terracotta pots of greenery
   * along its edge, and washing hung over the railing to dry, in vertex colours.
   */
  private dress(
    random: () => number,
    y: number,
    z0: number,
    z1: number,
    into: BufferGeometry[],
  ): void {
    for (let z = z0 + 0.3; z < z1 - 0.3; z += 0.6 + random() * 1.2) {
      const roll = random();
      if (roll < 0.35) {
        const pot = new CylinderGeometry(0.16, 0.12, 0.3, 8).toNonIndexed();
        pot.translate(-BALCONY + 0.25, y + 0.31, z);
        into.push(paint(pot, 0xb5603a));
        const leaves = new IcosahedronGeometry(0.28 + random() * 0.2, 0).toNonIndexed();
        leaves.scale(1, 0.9 + random() * 0.8, 1);
        leaves.translate(-BALCONY + 0.25, y + 0.7, z);
        into.push(paint(leaves, random() < 0.5 ? 0x3f7a32 : 0x5a8a3a));
        // Some spill over the railing in a loose cascade of small clusters, thinning as it
        // falls: trailing green, or a bougainvillea's magenta among its leaves.
        if (random() < 0.5) {
          const bloom = random() < 0.45;
          const fall = 0.6 + random() * 1.4;
          for (let k = 0; k < 14; k++) {
            const t = k / 14;
            const bit = new IcosahedronGeometry(0.07 + (1 - t) * 0.07, 0).toNonIndexed();
            bit.translate(
              -BALCONY - 0.08 - random() * 0.1,
              y + 0.9 - t * fall,
              z + (random() - 0.5) * (0.7 - t * 0.4),
            );
            const petal = bloom && random() < 0.7;
            into.push(paint(bit, petal ? (random() < 0.5 ? 0xd6247a : 0xb5179e) : 0x3f7a32));
          }
        }
      } else if (roll < 0.65) {
        const cloth = new PlaneGeometry(0.5 + random() * 0.5, 0.6 + random() * 0.6).toNonIndexed();
        cloth.rotateY(-Math.PI / 2);
        cloth.translate(-BALCONY - 0.03, y + 0.6, z);
        into.push(paint(cloth, LAUNDRY[Math.floor(random() * LAUNDRY.length)]!));
      }
    }
  }

  /**
   * Life under a building's portales: a lamp hanging in every bay, glowing in the shade, and
   * here and there a café's round tables and chairs set out on the arcade's walk.
   */
  private portal(width: number, bays: number, random: () => number): Mesh[] {
    const bay = (width - 0.3) / bays;
    const furniture: BufferGeometry[] = [];
    const lamps: BufferGeometry[] = [];
    const cafe = random() < 0.4;
    const wood = random() < 0.5 ? 0x6b4a2e : 0xe8e4da;
    for (let k = 0; k < bays; k++) {
      const z = -0.15 - (k + 0.5) * bay;
      const cord = new CylinderGeometry(0.01, 0.01, 0.6, 3).toNonIndexed();
      cord.translate(ARCADE / 2, PORTAL - 0.6, z);
      furniture.push(paint(cord, 0x222222));
      const globe = new SphereGeometry(0.16, 8, 6).toNonIndexed();
      globe.translate(ARCADE / 2, PORTAL - 1.0, z);
      lamps.push(globe);
      if (!cafe || random() < 0.3) continue;
      const top = new CylinderGeometry(0.38, 0.38, 0.04, 12).toNonIndexed();
      top.translate(ARCADE / 2, 0.92, z);
      furniture.push(paint(top, wood));
      const stem = new CylinderGeometry(0.04, 0.06, 0.9, 6).toNonIndexed();
      stem.translate(ARCADE / 2, 0.45, z);
      furniture.push(paint(stem, 0x2a2a2a));
      for (const dz of [-0.6, 0.6]) {
        const seat = new BoxGeometry(0.4, 0.05, 0.4).toNonIndexed();
        seat.translate(ARCADE / 2, 0.47, z + dz);
        furniture.push(paint(seat, wood));
        const back = new BoxGeometry(0.4, 0.45, 0.04).toNonIndexed();
        back.translate(ARCADE / 2, 0.72, z + dz * 1.3);
        furniture.push(paint(back, wood));
      }
    }
    const out: Mesh[] = [];
    const things = mergeGeometries(furniture)!;
    const glows = mergeGeometries(lamps)!;
    [...furniture, ...lamps].forEach((g) => g.dispose());
    this.disposables.push(things, glows);
    out.push(new Mesh(things, this.dressing), new Mesh(glows, this.glow));
    out[0]!.castShadow = true;
    return out;
  }

  /**
   * The overhead tangle Havana's fronts carry: two to four black cables strung along the front
   * over the arcade, each sagging between iron brackets at the building's ends, with now and then
   * one dropping in a loop to a bracket lower down.
   */
  private cables(width: number, random: () => number): Mesh {
    const lines: BufferGeometry[] = [];
    const count = 2 + Math.floor(random() * 3);
    for (let i = 0; i < count; i++) {
      const y = PORTAL + 0.5 + random() * 1.4;
      const sag = 0.25 + random() * 0.6;
      const out = -0.25 - random() * 0.35;
      const end = random() < 0.25 ? y - 1 - random() : y + (random() - 0.5) * 0.4;
      const points: Vector3[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        points.push(new Vector3(out, y + (end - y) * t - sag * 4 * t * (1 - t), -t * width));
      }
      lines.push(new TubeGeometry(new CatmullRomCurve3(points), 16, 0.012, 3));
      const bracket = new BoxGeometry(0.3, 0.05, 0.05);
      bracket.translate(out / 2, y, -0.02);
      lines.push(bracket.toNonIndexed());
    }
    const parts = lines.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(parts)!;
    [...lines, ...parts].forEach((g) => g.dispose());
    this.disposables.push(merged);
    return new Mesh(merged, this.wire);
  }

  /**
   * Timber shores propping a ruin's front: raking beams from sole plates on the pavement up to
   * a waling piece across the first floor, braced between.
   */
  private shoring(width: number, timber: MeshStandardMaterial): Mesh {
    const parts: BufferGeometry[] = [];
    for (let z = -2; z > -width + 1.5; z -= 3.2) {
      const raker = new BoxGeometry(0.22, 7.6, 0.22);
      raker.translate(0, 3.8, 0);
      raker.rotateZ(0.42);
      raker.translate(-0.1, 0, z);
      parts.push(raker);
      const sole = new BoxGeometry(1.2, 0.2, 0.4);
      sole.translate(-3.0, 0.1, z);
      parts.push(sole);
    }
    const waling = new BoxGeometry(0.25, 0.3, width - 1.5);
    waling.translate(-0.15, PORTAL + 2.2, -width / 2);
    parts.push(waling);
    const merged = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    this.disposables.push(merged);
    const mesh = new Mesh(merged, timber);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * A building's roofline above its cornice, one of four kinds: a stone balustrade, an art-deco
   * parapet stepping up to a raised centre with fins, a pediment over a plain parapet, or a plain
   * parapet; and on most roofs Havana's water tanks, black, blue or concrete, on their stands.
   */
  private roofline(
    width: number,
    y: number,
    plaster: Texture,
    tint: number,
    cornice: MeshStandardMaterial,
    random: () => number,
  ): Group {
    const roof = new Group();
    const wall = this.material({ map: plaster, color: tint, roughness: 0.9 });
    const span = width - 0.4;
    const parts: BufferGeometry[] = [];
    const block = (sx: number, sy: number, sz: number, x: number, by: number, z: number) => {
      const g = new BoxGeometry(sx, sy, sz);
      g.translate(x, by + sy / 2, z);
      parts.push(g);
    };
    const kind = random();
    if (kind < 0.3) {
      block(0.4, 0.25, span, 0.1, 0, -width / 2);
      for (let z = -0.4; z > -width + 0.4; z -= 0.45) block(0.18, 0.7, 0.18, 0.1, 0.25, z);
      block(0.45, 0.18, span, 0.1, 0.95, -width / 2);
    } else if (kind < 0.55) {
      block(0.4, 0.8, span, 0.1, 0, -width / 2);
      block(0.5, 1.6, span * 0.5, 0.05, 0, -width / 2);
      block(0.6, 2.6, span * 0.22, 0, 0, -width / 2);
      for (const f of [-0.08, 0, 0.08]) block(0.7, 3.2, 0.2, -0.05, 0, -width / 2 + f * span);
    } else if (kind < 0.75) {
      block(0.4, 0.9, span, 0.1, 0, -width / 2);
      const half = span * 0.22;
      const shape = new Shape([new Vector2(-half, 0), new Vector2(half, 0), new Vector2(0, 1.8)]);
      const pediment = new ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false });
      pediment.rotateY(Math.PI / 2);
      pediment.translate(-0.15, 0.9, -width / 2);
      parts.push(pediment);
    } else {
      block(0.4, 0.9, span, 0.1, 0, -width / 2);
    }
    const merged = mergeGeometries(parts.map((g) => g.toNonIndexed()))!;
    parts.forEach((g) => g.dispose());
    this.disposables.push(merged);
    const mesh = new Mesh(merged, kind < 0.3 ? cornice : wall);
    mesh.castShadow = true;
    mesh.position.y = y;
    roof.add(mesh);
    // Water tanks on their stands.
    const tanks = Math.floor(random() * 4);
    for (let i = 0; i < tanks; i++) {
      const colour = [0x1d1f22, 0x2b5da8, 0x9a968c][Math.floor(random() * 3)]!;
      const tank = new Mesh(this.tank, this.material({ color: colour, roughness: 0.7 }));
      const r = 0.6 + random() * 0.3;
      tank.scale.set(r, 1 + random() * 0.6, r);
      tank.position.set(4 + random() * 8, y + 0.8, -1.5 - random() * (width - 3));
      tank.castShadow = true;
      roof.add(tank);
    }
    return roof;
  }

  /**
   * A zebra crossing painted over both carriageways at a side street's mouth: broad white bars
   * across the road, their paint worn through where the wheels run.
   */
  private signals?: {
    pole: MeshStandardMaterial;
    head: MeshStandardMaterial;
    lamps: MeshStandardMaterial[];
    lamp: CylinderGeometry;
  };

  private addZebra(offset: number, roadHalf: number): void {
    this.crossings.push(offset);
    if (!this.zebra) {
      const map = this.track(zebraTexture());
      this.zebra = this.material({
        map,
        transparent: true,
        depthWrite: false,
        roughness: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      });
    }
    const span = 2 * roadHalf + LANES;
    const sheet = new PlaneGeometry(span, 4);
    sheet.rotateX(-Math.PI / 2);
    sheet.translate(roadHalf - span / 2, 0.016, -CROSS / 2);
    this.disposables.push(sheet);
    const crossing = new Mesh(sheet, this.zebra);
    crossing.renderOrder = 3;
    const holder = new Group();
    holder.add(crossing);
    // A traffic light on each kerb, its head facing the traffic coming to the crossing: green lit
    // for the road, red and amber dark, on a grey pole with a pedestrian box below.
    if (!this.signals) {
      const lens = (color: number, lit: boolean) =>
        this.material({
          color: lit ? color : 0x202020,
          emissive: lit ? color : 0x000000,
          emissiveIntensity: lit ? 2.4 : 0,
          roughness: 0.3,
        });
      this.signals = {
        pole: this.material({ color: 0x5a5e62, roughness: 0.6, metalness: 0.4 }),
        head: this.material({ color: 0x1a1c1e, roughness: 0.5 }),
        lamps: [lens(0xff2a1a, false), lens(0xffb020, false), lens(0x30ff70, true)],
        lamp: new CylinderGeometry(0.1, 0.1, 0.06, 12).rotateX(Math.PI / 2),
      };
      this.disposables.push(this.signals.lamp);
    }
    const signals = this.signals;
    for (const [x, z, turn] of [
      [roadHalf + 0.35, -CROSS / 2 + 2.6, 0],
      [-roadHalf - LANES - 0.35, -CROSS / 2 - 2.6, Math.PI],
    ] as const) {
      const signal = new Group();
      const pole = new Mesh(this.unit, signals.pole);
      pole.scale.set(0.12, 3.4, 0.12);
      pole.position.y = 1.7;
      const head = new Mesh(this.unit, signals.head);
      head.scale.set(0.34, 0.9, 0.24);
      head.position.set(0, 3.15, 0);
      const box = new Mesh(this.unit, signals.head);
      box.scale.set(0.25, 0.4, 0.2);
      box.position.set(0, 1.3, 0.12);
      signal.add(pole, head, box);
      for (let k = 0; k < 3; k++) {
        const lamp = new Mesh(signals.lamp, signals.lamps[k]!);
        lamp.position.set(0, 3.42 - k * 0.27, 0.13);
        signal.add(lamp);
      }
      for (const mesh of [pole, head, box]) mesh.castShadow = true;
      signal.position.set(x, KERB, z);
      signal.rotation.y = turn;
      holder.add(signal);
    }
    this.group.add(holder);
    this.props.push({ mesh: holder, offset, x: 0 });
  }

  /**
   * A side street opening off the Malecón: its asphalt and narrow pavements running inland
   * between the flanks of the corner buildings, older and plainer houses lining it further in,
   * and a façade closing the view at its end.
   */
  private addCrossStreet(
    offset: number,
    x: number,
    fronts: Texture,
    pastels: readonly number[],
    random: () => number,
  ): void {
    const street = new Group();
    const asphalt = this.material({ color: 0x55565c, roughness: 0.9 });
    const kerb = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.9 });
    const road = new Mesh(this.unit, asphalt);
    road.scale.set(80, 0.2, CROSS);
    road.position.set(40, -0.1, -CROSS / 2);
    road.receiveShadow = true;
    street.add(road);
    for (const z of [-0.8, -CROSS + 0.8]) {
      const side = new Mesh(this.unit, kerb);
      side.scale.set(80, 0.3, 1.6);
      side.position.set(40, 0, z);
      side.receiveShadow = true;
      street.add(side);
    }
    const house = (x0: number, x1: number, z0: number, z1: number) => {
      const floors = 2 + Math.floor(random() * 3);
      const height = floors * 4.2;
      const map = fronts.clone();
      map.repeat.set(Math.abs(x1 - x0) / 8, floors / 4);
      map.offset.y = 1 - floors / 4;
      map.needsUpdate = true;
      this.track(map);
      const body = new Mesh(
        this.unit,
        this.material({
          map,
          color: pastels[Math.floor(random() * pastels.length)]!,
          roughness: 0.9,
        }),
      );
      body.scale.set(Math.abs(x1 - x0), height, Math.abs(z1 - z0));
      body.position.set((x0 + x1) / 2, height / 2, (z0 + z1) / 2);
      body.castShadow = true;
      body.receiveShadow = true;
      street.add(body);
    };
    // The houses lining the street beyond the corner buildings, then the one closing it.
    for (let x0 = 14; x0 < 60;) {
      const length = 8 + random() * 10;
      house(x0, x0 + length, 12, 0);
      house(x0, x0 + length, -CROSS, -CROSS - 12);
      x0 += length;
    }
    house(62, 76, 14, -CROSS - 14);
    this.group.add(street);
    this.props.push({ mesh: street, offset, x });
  }

  /**
   * The Malecón's street lamps: tall, tapering grey poles, on the promenade's kerb and on the
   * pavement before the façades, each with a long arm curving out over the lanes to a lamp head
   * with a pale lens beneath.
   */
  private addLamps(roadHalf: number): void {
    // Salt-weathered paint: grey-green, chipped, with rust running down from the joints.
    const steel = this.material({
      map: this.track(lampPostTexture()),
      roughness: 0.6,
      metalness: 0.35,
    });
    const lens = this.material({ color: 0xf6f0dc, emissive: 0xfff2c8, emissiveIntensity: 0.4 });
    const pole = new CylinderGeometry(0.07, 0.13, 9, 12);
    pole.translate(0, 4.5, 0);
    const base = new CylinderGeometry(0.2, 0.24, 0.9, 12);
    base.translate(0, 0.45, 0);
    // Collars where the pole's sections meet, and the hatch at its foot.
    const collar = new CylinderGeometry(0.16, 0.16, 0.12, 12);
    collar.translate(0, 0.96, 0);
    const joint = new CylinderGeometry(0.12, 0.12, 0.1, 12);
    joint.translate(0, 4.6, 0);
    const hatch = new BoxGeometry(0.16, 0.36, 0.04);
    hatch.translate(0, 0.5, 0.235);
    const arm = new TubeGeometry(
      new QuadraticBezierCurve3(
        new Vector3(0, 8.4, 0),
        new Vector3(0, 9.6, 0),
        new Vector3(2.6, 9.4, 0),
      ),
      12,
      0.055,
      6,
    );
    // A cobra-head luminaire: a long, rounded shell over a shallow glass bowl.
    const head = new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    head.scale(0.55, 0.2, 0.24);
    head.rotateZ(-0.08);
    head.translate(2.95, 9.28, 0);
    const glow = new SphereGeometry(1, 16, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    glow.scale(0.48, 0.09, 0.2);
    glow.rotateZ(-0.08);
    glow.translate(2.95, 9.28, 0);
    const parts = [pole, base, collar, joint, hatch, arm, head].map((g) =>
      g.index ? g.toNonIndexed() : g,
    );
    const lamp = mergeGeometries(parts)!;
    [pole, base, collar, joint, hatch, arm, head, ...parts].forEach((g) => g.dispose());
    this.disposables.push(lamp, glow);
    const place = (offset: number, x: number, turn: number) => {
      const holder = new Group();
      const post = new Mesh(lamp, steel);
      post.castShadow = true;
      holder.add(post, new Mesh(glow, lens));
      holder.rotation.y = turn;
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    };
    for (let offset = 4; offset < LOOP; offset += 30) {
      // Seaward lamps reach over the oncoming lanes; the inland ones over the rider's.
      place(offset, -roadHalf - LANES - 0.6, 0);
      place(offset + 15, roadHalf + 1.0, Math.PI);
    }
    // Cables strung across the road from the buildings to every other seaward lamp post, two or
    // three together, each sagging in its own catenary, and short drops from the inland posts
    // to the façades: the overhead tangle of a Havana street.
    const random = seeded(1661);
    const wire = this.material({ color: 0x141414, roughness: 0.7 });
    const span = (x0: number, y0: number, x1: number, y1: number, sag: number, z: number) => {
      const points: Vector3[] = [];
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        points.push(new Vector3(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - sag * 4 * t * (1 - t), z));
      }
      const tube = new TubeGeometry(new CatmullRomCurve3(points), 24, 0.018, 3);
      this.disposables.push(tube);
      return new Mesh(tube, wire);
    };
    const perch = seeded(1667);
    const glossy = this.material({ color: 0x14141c, roughness: 0.3, metalness: 0.3 });
    const grey = this.material({ color: 0x8a8c94, roughness: 0.8 });
    const bodyShape = new SphereGeometry(0.07, 8, 6);
    bodyShape.scale(1, 1, 1.5);
    const headShape = new SphereGeometry(0.04, 8, 6);
    const tailShape = new BoxGeometry(0.05, 0.015, 0.14);
    this.disposables.push(bodyShape, headShape, tailShape);
    for (let offset = 34; offset < LOOP; offset += 60) {
      const cables = new Group();
      const strands = 2 + Math.floor(random() * 2);
      for (let k = 0; k < strands; k++) {
        const x0 = -roadHalf - LANES - 0.6;
        const y0 = 7.6 - k * 0.35;
        const x1 = roadHalf + 4.2;
        const y1 = PORTAL + 1.6 + random() * 2.5;
        const sag = 0.9 + random() * 0.9;
        const z = (random() - 0.5) * 0.6;
        cables.add(span(x0, y0, x1, y1, sag, z));
        // Birds perched along the top strand: grackles, glossy black, and grey pigeons.
        if (k > 0) continue;
        const perched = 3 + Math.floor(perch() * 4);
        for (let b = 0; b < perched; b++) {
          const t = 0.15 + perch() * 0.7;
          const y = y0 + (y1 - y0) * t - sag * 4 * t * (1 - t);
          const bird = new Group();
          const grackle = perch() < 0.6;
          const plumage = grackle ? glossy : grey;
          const body = new Mesh(bodyShape, plumage);
          const head = new Mesh(headShape, plumage);
          head.position.set(0, 0.09, grackle ? -0.06 : -0.05);
          const tail = new Mesh(tailShape, plumage);
          tail.position.set(0, -0.02, 0.12);
          tail.rotation.x = -0.6;
          bird.add(body, head, tail);
          bird.rotation.y = perch() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
          bird.rotation.y += (perch() - 0.5) * 0.8;
          bird.position.set(x0 + (x1 - x0) * t, y + 0.08, z);
          cables.add(bird);
        }
      }
      this.group.add(cables);
      this.props.push({ mesh: cables, offset, x: 0 });
    }
    for (let offset = 19; offset < LOOP; offset += 30) {
      const drop = new Group();
      drop.add(span(roadHalf + 1.0, 7.2, roadHalf + 4.2, PORTAL + 2 + random() * 2, 0.3, 0));
      this.group.add(drop);
      this.props.push({ mesh: drop, offset, x: 0 });
    }
  }

  /**
   * Royal palms standing along the pavement: a smooth, pale grey trunk turned on a lathe, swelling
   * low and again at mid-height like a column, a glossy green crownshaft at the top, and a crown
   * of long pinnate fronds, the upper ones arching out and the lower ones hanging.
   */
  private addPalms(roadHalf: number): void {
    const random = seeded(911);
    const bark = this.material({ map: this.repeat(trunkTexture(), 1, 3), roughness: 0.85 });
    const shaft = this.material({ color: 0x5f8f3a, roughness: 0.45 });
    const leaves = this.material({
      map: this.track(royalFrondTexture()),
      alphaTest: 0.45,
      side: DoubleSide,
      roughness: 0.8,
    });
    const radius = (h: number) =>
      0.3 -
      0.1 * (h / 12) +
      0.12 * Math.exp(-((h - 0.4) ** 2) / 0.6) +
      0.05 * Math.sin((h / 12) * Math.PI);
    const profilePoints: Vector2[] = [];
    for (let h = 0; h <= 12; h += 0.5) profilePoints.push(new Vector2(radius(h), h));
    const trunk = new LatheGeometry(profilePoints, 12);
    const crownshaft = new CylinderGeometry(0.2, 0.26, 2.2, 12);
    crownshaft.translate(0, 13.1, 0);
    const parts: BufferGeometry[] = [];
    for (let i = 0; i < 15; i++) {
      const length = 4.2 + (i % 3) * 0.4;
      const frond = new PlaneGeometry(1.3, length, 1, 10);
      const position = frond.getAttribute('position') as BufferAttribute;
      // Upper fronds rise and arch over; the lowest hang down beside the crownshaft.
      const rise = 1.1 - (i / 15) * 1.6;
      for (let v = 0; v < position.count; v++) {
        const t = (position.getY(v) + length / 2) / length;
        const angle = rise - t * t * 2.2;
        const reach = length * t;
        position.setXYZ(
          v,
          position.getX(v) * (1 - t * 0.6),
          Math.sin(angle) * reach * 0.8,
          reach * Math.cos(angle * 0.6),
        );
      }
      frond.rotateY((i * 2.4) % (Math.PI * 2));
      frond.translate(0, 14.1, 0);
      parts.push(frond);
    }
    const crown = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    crown.computeVertexNormals();
    this.disposables.push(trunk, crownshaft, crown);
    // Dead fronds hanging straight down the crownshaft, dry and brown, not yet shed; and below
    // the crownshaft, the flower spikes, branched and creamy, and the bunched purple-black fruit.
    const dry: BufferGeometry[] = [];
    for (let i = 0; i < 3; i++) {
      const length = 3.6;
      const frond = new PlaneGeometry(0.9, length, 1, 6);
      const position = frond.getAttribute('position') as BufferAttribute;
      for (let v = 0; v < position.count; v++) {
        const t = (position.getY(v) + length / 2) / length;
        position.setXYZ(v, position.getX(v) * (1 - t * 0.5), -t * length, 0.5 + t * 0.9);
      }
      frond.rotateY(1.2 + i * 2.1);
      frond.translate(0, 13.4, 0);
      dry.push(frond);
    }
    const dead = mergeGeometries(dry)!;
    dry.forEach((p) => p.dispose());
    dead.computeVertexNormals();
    const spikes: BufferGeometry[] = [];
    const bunches: BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const turn = i * 1.6 + 0.3;
      for (let k = 0; k < 5; k++) {
        const spike = new CylinderGeometry(0.015, 0.025, 0.9, 4);
        spike.translate(0, -0.45, 0);
        spike.rotateZ(0.5 + k * 0.18);
        spike.rotateY(turn + (k - 2) * 0.25);
        spike.translate(Math.cos(turn) * 0.26, 12.0, -Math.sin(turn) * 0.26);
        spikes.push(spike);
      }
      if (i % 2) {
        const bunch = new SphereGeometry(0.22, 8, 6);
        bunch.scale(1, 1.4, 1);
        bunch.translate(Math.cos(turn) * 0.55, 11.5, -Math.sin(turn) * 0.55);
        bunches.push(bunch);
      }
    }
    const flowers = mergeGeometries(spikes)!;
    const fruit = mergeGeometries(bunches)!;
    [...spikes, ...bunches].forEach((p) => p.dispose());
    this.disposables.push(dead, flowers, fruit);
    const withered = this.material({
      map: this.track(royalFrondTexture()),
      color: 0xd8a868,
      emissive: 0x3a2810,
      alphaTest: 0.45,
      side: DoubleSide,
      roughness: 0.95,
    });
    const cream = this.material({ color: 0xe8d8a8, roughness: 0.8 });
    const berries = this.material({ color: 0x3a2438, roughness: 0.6 });
    for (let offset = 8; offset < LOOP; offset += 22 + random() * 16) {
      const palm = new Group();
      palm.add(new Mesh(trunk, bark), new Mesh(crownshaft, shaft), new Mesh(crown, leaves));
      palm.add(new Mesh(dead, withered), new Mesh(flowers, cream), new Mesh(fruit, berries));
      palm.children.forEach((c) => (c.castShadow = true));
      palm.scale.setScalar(0.8 + random() * 0.3);
      palm.rotation.y = random() * Math.PI * 2;
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, x: roadHalf + 2.4 });
    }
  }

  /**
   * Classic American cars cruising the oncoming lanes: long two-tone bodies drawn from a side
   * profile, with a long bonnet, a rounded boot and tail fins, a glazed cabin with its roof in the
   * second colour, a chrome grille, bumpers and side strip, round headlamps, red tail lamps and
   * whitewall tyres with chrome hubcaps.
   */
  private addCars(roadHalf: number): void {
    const random = seeded(919);
    const chrome = this.material({ color: 0xe8ecf0, roughness: 0.15, metalness: 1 });
    const tyre = this.material({ color: 0x1b1b1f, roughness: 0.8 });
    const whitewall = this.material({ color: 0xf2f0ea, roughness: 0.6 });
    const glass = this.material({
      color: 0x1e2a32,
      roughness: 0.05,
      metalness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const lamp = this.material({ color: 0xfff6dc, emissive: 0xfff0c0, emissiveIntensity: 0.4 });
    const tail = this.material({ color: 0xc8102e, emissive: 0x800010, emissiveIntensity: 0.5 });
    const body = profile(
      [
        [-2.75, 0.32],
        [-2.8, 0.62],
        [-2.7, 0.9],
        [-2.2, 1.02],
        [-1.4, 0.92],
        [1.3, 0.92],
        [2.45, 0.86],
        [2.78, 0.72],
        [2.8, 0.42],
        [2.6, 0.3],
      ],
      1.86,
      0.07,
    );
    const cabin = profile(
      [
        [-1.42, 0.9],
        [-0.95, 1.46],
        [0.55, 1.48],
        [1.15, 0.9],
      ],
      1.56,
      0.05,
    );
    const windows = profile(
      [
        [-1.52, 0.9],
        [-1.0, 1.4],
        [0.6, 1.42],
        [1.27, 0.9],
      ],
      1.7,
      0,
    );
    const wheel = new CylinderGeometry(0.37, 0.37, 0.24, 16);
    wheel.rotateZ(Math.PI / 2);
    const wall = new CylinderGeometry(0.27, 0.27, 0.25, 16);
    wall.rotateZ(Math.PI / 2);
    const hub = new CylinderGeometry(0.15, 0.15, 0.27, 12);
    hub.rotateZ(Math.PI / 2);
    const headlamp = new CylinderGeometry(0.13, 0.13, 0.08, 12);
    headlamp.rotateX(Math.PI / 2);
    this.disposables.push(body, cabin, windows, wheel, wall, hub, headlamp);
    const build = (colour: string | number, roof: string | number, open = false) => {
      const paint = this.material({ color: colour, roughness: 0.3, metalness: 0.3 });
      const top = this.material({ color: roof, roughness: 0.35, metalness: 0.2 });
      const car = new Group();
      const put = (geometry: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0) => {
        const mesh = new Mesh(geometry, m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        car.add(mesh);
        return mesh;
      };
      const box = (
        m: MeshStandardMaterial,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
      ) => put(this.unit, m, x, y, z).scale.set(sx, sy, sz);
      put(body, paint);
      if (open) {
        // A convertible with its top down: a raked windscreen in a chrome frame, white leather
        // bench seats front and back, and the folded hood stowed behind.
        const screen = put(this.unit, glass, 0, 1.12, -1.25);
        screen.scale.set(1.6, 0.42, 0.03);
        screen.rotation.x = -0.5;
        box(chrome, 1.64, 0.03, 0.05, 0, 1.31, -1.14);
        const leather = this.material({ color: 0xf2efe6, roughness: 0.55 });
        for (const z of [-0.3, 0.75]) {
          box(leather, 1.6, 0.18, 0.55, 0, 0.98, z);
          box(leather, 1.6, 0.42, 0.12, 0, 1.15, z + 0.3);
        }
        box(top, 1.6, 0.16, 0.45, 0, 1.0, 1.45);
      }
      if (!open) put(windows, glass);
      // The glasshouse is open under its roof, on slanted pillars, so the people inside show.
      if (!open) box(top, 1.56, 0.06, 1.5, 0, 1.45, -0.2);
      for (const x of open ? [] : [-0.75, 0.75]) {
        const a = put(this.unit, top, x, 1.18, -1.185);
        a.scale.set(0.07, 0.73, 0.07);
        a.rotation.x = 0.7;
        const c = put(this.unit, top, x, 1.19, 0.85);
        c.scale.set(0.09, 0.83, 0.12);
        c.rotation.x = -0.8;
      }
      // Chrome: the bumpers, the grille, the side strip; the lamps at each end.
      box(chrome, 2.0, 0.2, 0.16, 0, 0.42, -2.86);
      box(chrome, 2.0, 0.2, 0.16, 0, 0.42, 2.86);
      box(chrome, 1.2, 0.22, 0.06, 0, 0.6, -2.84);
      box(chrome, 1.98, 0.04, 4.6, 0, 0.74, 0.1);
      for (const x of [-0.7, 0.7]) {
        put(headlamp, lamp, x, 0.64, -2.88);
        box(tail, 0.16, 0.26, 0.06, x * 1.3, 0.78, 2.86);
      }
      for (const x of [-0.93, 0.93]) {
        for (const z of [-1.72, 1.62]) {
          put(wheel, tyre, x, 0.37, z);
          put(wall, whitewall, x, 0.37, z);
          put(hub, chrome, x, 0.37, z);
        }
      }
      return car;
    };
    const crew = seeded(1619);
    CARS.forEach(([colour, roof], k) => {
      const car = build(colour, roof);
      this.occupy(car, crew, 0.0, 0.6, 0.42);
      // Oncoming down the far carriageway, in its two lanes.
      car.rotation.y = Math.PI;
      car.position.x = -roadHalf - (k % 2 ? 1.9 : 5.2);
      this.group.add(car);
      this.cars.push({ mesh: car, offset: k * 45 + random() * 20, speed: -(9 + random() * 4) });
    });
    // The quinceañera's car: a pink convertible, top down, parked at the kerb beside her shoot.
    const pink = build('#f4a6c6', '#f2f0ea', true);
    const stand = new Group();
    stand.add(pink);
    this.group.add(stand);
    this.props.push({ mesh: stand, offset: 35.6, x: roadHalf - 1.15 });
    // Almendrones parked nose to tail along the inland kerb, as they are all along the
    // Malecón, in ones and twos with gaps between, a few in faded or primer paint.
    const parking = seeded(1511);
    const faded = ['#8a8a7a', '#9a8a6a', '#6a7a7a', '#b0a890'];
    for (let offset = 42; offset < LOOP - 20; offset += 26 + parking() * 60) {
      const run = parking() < 0.4 ? 2 : 1;
      for (let n = 0; n < run; n++) {
        const [colour, roof] = CARS[Math.floor(parking() * CARS.length)]!;
        const tired = parking() < 0.3;
        const car = build(tired ? faded[n % faded.length]! : colour, tired ? '#d8d4c8' : roof);
        car.rotation.y = (parking() - 0.5) * 0.04;
        const holder = new Group();
        holder.add(car);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset: offset + n * 6.4, x: roadHalf - 1.15 });
      }
    }
    this.addTraffic(roadHalf, chrome, tyre, glass, wheel, hub);
  }

  /**
   * The rest of the Malecón's traffic among the classic cars: yellow coco-taxis, the egg-shaped
   * three-wheelers, puttering in the kerb lane; boxy Soviet Ladas; and open convertibles with
   * their tops down, cream seats and a raked windscreen.
   */
  private addTraffic(
    roadHalf: number,
    chrome: MeshStandardMaterial,
    tyre: MeshStandardMaterial,
    glass: MeshStandardMaterial,
    wheel: BufferGeometry,
    hub: BufferGeometry,
  ): void {
    const random = seeded(1069);
    const yellow = this.material({
      color: 0xffd21a,
      roughness: 0.35,
      metalness: 0.1,
      side: DoubleSide,
    });
    const black = this.material({ color: 0x1c1d20, roughness: 0.6 });
    const seat = this.material({ color: 0xe9dcc0, roughness: 0.7 });
    // The shell: the back half of the egg, and a band arching over the open sides to the front.
    const back = new SphereGeometry(1, 18, 10, 0, Math.PI, 0, Math.PI / 2);
    const hood = new SphereGeometry(1, 18, 4, Math.PI, Math.PI, 0, 0.55);
    const shell = mergeGeometries([back, hood])!;
    back.dispose();
    hood.dispose();
    shell.scale(0.8, 1.2, 1.2);
    const small = new CylinderGeometry(0.22, 0.22, 0.16, 12);
    small.rotateZ(Math.PI / 2);
    // The tub the shell sits on, rounded at its ends, and the scooter's tapering nose.
    const tub = new CapsuleGeometry(0.62, 1.0, 4, 14);
    tub.rotateX(Math.PI / 2);
    tub.scale(1, 0.32, 1);
    const nose = new CapsuleGeometry(0.22, 0.35, 4, 10);
    nose.rotateX(0.5);
    const torso = new CapsuleGeometry(0.17, 0.34, 3, 8);
    const head = new SphereGeometry(0.11, 10, 8);
    const headlamp = new CylinderGeometry(0.1, 0.1, 0.06, 12);
    headlamp.rotateX(Math.PI / 2);
    this.disposables.push(tub, nose, torso, head, headlamp);
    const lamp = this.material({ color: 0xfff6dc, emissive: 0xfff0c0, emissiveIntensity: 0.5 });
    const skin = this.material({ color: 0x8d5a3b, roughness: 0.8 });
    const drivers = [0xf2efe6, 0x3a86ff, 0xe63946].map((c) =>
      this.material({ color: c, roughness: 0.85 }),
    );
    const lada = profile(
      [
        [-2.05, 0.3],
        [-2.1, 0.92],
        [-1.2, 0.95],
        [-0.95, 1.42],
        [0.75, 1.42],
        [1.15, 0.95],
        [2.05, 0.9],
        [2.1, 0.3],
      ],
      1.62,
      0.03,
    );
    const ladaGlass = profile(
      [
        [-1.05, 0.98],
        [-0.86, 1.36],
        [0.68, 1.36],
        [1.02, 0.98],
      ],
      1.66,
      0,
    );
    const open = profile(
      [
        [-2.75, 0.32],
        [-2.8, 0.62],
        [-2.7, 0.9],
        [-2.2, 1.0],
        [-1.6, 0.9],
        [1.3, 0.9],
        [2.45, 0.86],
        [2.78, 0.72],
        [2.8, 0.42],
        [2.6, 0.3],
      ],
      1.9,
      0.07,
    );
    this.disposables.push(shell, small, lada, ladaGlass, open);
    const vehicles: { group: Group; lane: number; speed: number }[] = [];
    const box = (
      car: Group,
      m: MeshStandardMaterial,
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      car.add(mesh);
    };
    const put = (car: Group, g: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      car.add(mesh);
    };
    for (let i = 0; i < 4; i++) {
      // A coco-taxi: the yellow egg shell over a black seat, on a scooter's three wheels.
      const taxi = new Group();
      put(taxi, shell, yellow, 0, 0.42, 0.15);
      put(taxi, tub, yellow, 0, 0.42, 0.25);
      // The passengers' bench at the back, and the driver up front on the scooter's saddle.
      box(taxi, black, 1.1, 0.22, 0.55, 0, 0.7, 0.75);
      box(taxi, black, 1.1, 0.5, 0.12, 0, 0.95, 1.02);
      box(taxi, black, 0.36, 0.14, 0.5, 0, 0.78, -0.3);
      put(taxi, torso, drivers[i % drivers.length]!, 0, 1.2, -0.3);
      put(taxi, head, skin, 0, 1.62, -0.33);
      // The scooter's nose: a yellow fairing with its round headlamp, the handlebars and screen.
      put(taxi, nose, yellow, 0, 0.6, -0.95);
      put(taxi, headlamp, lamp, 0, 0.85, -1.2);
      box(taxi, chrome, 0.7, 0.04, 0.04, 0, 1.12, -0.85);
      const screen = new Mesh(this.unit, glass);
      screen.scale.set(0.55, 0.32, 0.02);
      screen.position.set(0, 1.28, -0.95);
      screen.rotation.x = -0.35;
      taxi.add(screen);
      put(taxi, small, tyre, 0, 0.22, -1.0);
      for (const x of [-0.6, 0.6]) put(taxi, small, tyre, x, 0.22, 0.9);
      vehicles.push({ group: taxi, lane: 1.4, speed: -(5 + random() * 2) });
    }
    for (const colour of [0xf2f0ea, 0x8fb8c8, 0xc0392b]) {
      const car = new Group();
      put(car, lada, this.material({ color: colour, roughness: 0.4, metalness: 0.2 }));
      put(car, ladaGlass, glass);
      box(car, chrome, 1.7, 0.16, 0.12, 0, 0.4, -2.12);
      box(car, chrome, 1.7, 0.16, 0.12, 0, 0.4, 2.12);
      for (const x of [-0.8, 0.8]) {
        for (const z of [-1.3, 1.3]) {
          put(car, wheel, tyre, x, 0.37, z);
          put(car, hub, chrome, x, 0.37, z);
        }
      }
      vehicles.push({ group: car, lane: random() < 0.5 ? 1.9 : 5.2, speed: -(8 + random() * 3) });
    }
    for (const colour of [0xd6336c, 0x2ec4b6]) {
      const car = new Group();
      put(car, open, this.material({ color: colour, roughness: 0.3, metalness: 0.3 }));
      box(car, seat, 1.6, 0.5, 0.6, 0, 1.05, 0.4);
      box(car, seat, 1.6, 0.5, 0.6, 0, 1.05, -0.6);
      box(car, seat, 1.6, 0.7, 0.15, 0, 1.2, 0.75);
      const screen = new Mesh(this.unit, glass);
      screen.scale.set(1.7, 0.5, 0.04);
      screen.position.set(0, 1.15, -1.25);
      screen.rotation.x = -0.5;
      car.add(screen);
      box(car, chrome, 2.0, 0.2, 0.16, 0, 0.42, -2.86);
      box(car, chrome, 2.0, 0.2, 0.16, 0, 0.42, 2.86);
      for (const x of [-0.93, 0.93]) {
        for (const z of [-1.72, 1.62]) {
          put(car, wheel, tyre, x, 0.37, z);
          put(car, hub, chrome, x, 0.37, z);
        }
      }
      vehicles.push({ group: car, lane: 5.2, speed: -(7 + random() * 3) });
    }
    vehicles.forEach(({ group, lane, speed }, k) => {
      group.rotation.y = Math.PI;
      group.position.x = -roadHalf - lane;
      this.group.add(group);
      this.cars.push({ mesh: group, offset: 34 + k * 39 + random() * 12, speed });
    });
    this.addBicitaxis(roadHalf, tyre, chrome);
    this.addBuses(roadHalf, tyre, glass);
    this.addSidecars(roadHalf, tyre, chrome);
    this.addMotorinas(roadHalf, tyre, chrome);
    this.addCyclists(roadHalf, tyre, chrome);
    this.addLadas(roadHalf, tyre, chrome);
    this.addTourBus(roadHalf, tyre);
    this.addSidecar(roadHalf, tyre, chrome);
    this.addCarriage(roadHalf);
  }

  /**
   * A coche, the horse-drawn carriage that takes visitors along the front: a bay horse in its
   * harness between the shafts, legs mid-stride, and behind it an open black carriage on two tall
   * spoked wheels, a fringed white canopy over its bench, the coachman up front in a straw hat.
   */
  private addCarriage(roadHalf: number): void {
    const coche = new Group();
    const bay = this.material({ color: 0x6a3e22, roughness: 0.75 });
    const black = this.material({ color: 0x18181a, roughness: 0.45, metalness: 0.2 });
    const canvas = this.material({ color: 0xf4f1ea, roughness: 0.85, side: DoubleSide });
    const straw = this.material({ color: 0xe8d8a8, roughness: 0.9 });
    const shirt = this.material({ color: 0xf2efe6, roughness: 0.85 });
    const skin = this.material({ color: 0x7a4a2e, roughness: 0.8 });
    const add = (
      g: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      rx = 0,
    ) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.x = rx;
      mesh.castShadow = true;
      coche.add(mesh);
      return mesh;
    };
    const barrel = new CapsuleGeometry(0.34, 1.0, 4, 12);
    barrel.rotateX(Math.PI / 2);
    const neck = new CapsuleGeometry(0.16, 0.6, 3, 8);
    const muzzle = new CapsuleGeometry(0.12, 0.4, 3, 8);
    const leg = new CylinderGeometry(0.085, 0.06, 0.95, 8);
    const tail = new CylinderGeometry(0.05, 0.02, 0.6, 5);
    const wheel = new TorusGeometry(0.62, 0.035, 6, 28);
    wheel.rotateY(Math.PI / 2);
    const spokes = new CylinderGeometry(0.015, 0.015, 1.2, 4);
    const torso = new CapsuleGeometry(0.17, 0.4, 3, 8);
    const head = new SphereGeometry(0.11, 10, 8);
    const brim = new CylinderGeometry(0.22, 0.22, 0.02, 12);
    const ear = new ConeGeometry(0.045, 0.14, 5);
    const ring = new TorusGeometry(0.24, 0.06, 6, 14);
    ring.rotateX(Math.PI / 2);
    const hoof = new CylinderGeometry(0.065, 0.075, 0.1, 8);
    this.disposables.push(
      barrel,
      neck,
      muzzle,
      leg,
      tail,
      wheel,
      spokes,
      torso,
      head,
      brim,
      ear,
      ring,
      hoof,
    );
    // The horse, facing -z: barrel, deep chest and rounded haunches, a heavy neck with its dark
    // mane, the long head angled down with its ears up, blinkers and the collar of its harness.
    add(barrel, bay, 0, 1.35, -2.4);
    const chest = add(head, bay, 0, 1.38, -2.98);
    chest.scale.setScalar(3.3);
    const haunch = add(head, bay, 0, 1.45, -1.82);
    haunch.scale.set(3.4, 3.4, 3.0);
    add(neck, bay, 0, 1.9, -3.2, -0.6).scale.set(1.3, 1.1, 1.3);
    const mane = add(this.unit, black, 0, 2.08, -3.08);
    mane.scale.set(0.07, 0.75, 0.12);
    mane.rotation.x = -0.6;
    add(muzzle, bay, 0, 2.1, -3.58, 1.1);
    for (const x of [-0.07, 0.07]) {
      add(ear, bay, x, 2.34, -3.36);
      const blinker = add(this.unit, black, x * 1.9, 2.22, -3.5);
      blinker.scale.set(0.02, 0.1, 0.12);
    }
    const collar = add(ring, black, 0, 1.65, -2.95, -0.6);
    collar.scale.setScalar(1);
    for (const [x, z] of [
      [-0.18, -2.95],
      [0.18, -2.9],
      [-0.18, -1.9],
      [0.18, -1.85],
    ] as const) {
      add(hoof, black, x, 0.05, z);
    }
    const strides = [0.35, -0.25, -0.3, 0.3];
    [
      [-0.18, -2.95],
      [0.18, -2.9],
      [-0.18, -1.9],
      [0.18, -1.85],
    ].forEach(([x, z], k) => add(leg, bay, x!, 0.5, z!, strides[k]!));
    add(tail, black, 0, 1.2, -1.4, -0.5);
    // Shafts and the carriage body, its bench and the canopy on posts.
    for (const x of [-0.45, 0.45]) {
      const shaft = add(this.unit, black, x, 1.15, -1.9);
      shaft.scale.set(0.05, 0.05, 2.0);
      add(wheel, black, x * 2.1, 0.62, 0.2);
      for (let k = 0; k < 4; k++) {
        const spoke = add(spokes, black, x * 2.1, 0.62, 0.2);
        spoke.rotation.x = (k * Math.PI) / 4;
      }
    }
    const body = add(this.unit, black, 0, 0.95, 0.15);
    body.scale.set(1.3, 0.5, 1.7);
    const bench = add(this.unit, this.material({ color: 0x8a2a2a, roughness: 0.8 }), 0, 1.35, 0.45);
    bench.scale.set(1.2, 0.3, 0.6);
    for (const x of [-0.6, 0.6]) {
      for (const z of [-0.55, 0.8]) {
        const post = add(this.unit, black, x, 1.95, z);
        post.scale.set(0.03, 1.4, 0.03);
      }
    }
    const roof = add(this.unit, canvas, 0, 2.66, 0.12);
    roof.scale.set(1.4, 0.06, 1.6);
    const fringe = add(this.unit, canvas, 0, 2.55, -0.68);
    fringe.scale.set(1.4, 0.16, 0.02);
    // The coachman on the box.
    add(torso, shirt, 0, 1.6, -0.55);
    add(head, skin, 0, 2.05, -0.58);
    add(brim, straw, 0, 2.15, -0.58);
    coche.rotation.y = Math.PI;
    coche.position.x = -roadHalf - LANES + 1.6;
    this.group.add(coche);
    this.cars.push({ mesh: coche, offset: 34, speed: -3.2 });
  }

  /**
   * Soviet sidecar motorcycles, still hauling families about: an olive, black or blue bike with
   * its tank, saddle and chrome handlebars, a rider in an open helmet, and bolted to its side a
   * boat-shaped sidecar on a third wheel with a passenger riding low in it.
   */
  private addSidecars(
    roadHalf: number,
    tyre: MeshStandardMaterial,
    chrome: MeshStandardMaterial,
  ): void {
    const random = seeded(1447);
    const wheel = new TorusGeometry(0.3, 0.09, 8, 18);
    wheel.rotateY(Math.PI / 2);
    const tub = new CapsuleGeometry(0.36, 1.1, 4, 12);
    tub.rotateX(Math.PI / 2);
    tub.scale(1, 0.7, 1);
    const torso = new CapsuleGeometry(0.17, 0.4, 3, 8);
    const head = new SphereGeometry(0.13, 10, 8);
    const limb = new CapsuleGeometry(0.06, 0.5, 3, 6);
    this.disposables.push(wheel, tub, torso, head, limb);
    const paints = [0x4a5a32, 0x1e1e20, 0x2b4f7a];
    const shirts = [0xf2efe6, 0xe63946, 0x3a86ff, 0xf4a261];
    const skin = this.material({ color: 0x7a4a2e, roughness: 0.8 });
    const helmet = this.material({ color: 0xe8e4da, roughness: 0.4 });
    for (let k = 0; k < 3; k++) {
      const bike = new Group();
      const paint = this.material({
        color: paints[k % paints.length]!,
        roughness: 0.45,
        metalness: 0.3,
      });
      const add = (
        g: BufferGeometry,
        m: MeshStandardMaterial,
        x: number,
        y: number,
        z: number,
        rx = 0,
      ) => {
        const mesh = new Mesh(g, m);
        mesh.position.set(x, y, z);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        bike.add(mesh);
        return mesh;
      };
      const box = (
        m: MeshStandardMaterial,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
      ) => add(this.unit, m, x, y, z).scale.set(sx, sy, sz);
      // The bike: wheels, frame, tank and saddle, handlebars.
      add(wheel, tyre, 0, 0.39, -0.75);
      add(wheel, tyre, 0, 0.39, 0.75);
      box(paint, 0.12, 0.3, 1.2, 0, 0.62, 0);
      box(paint, 0.3, 0.22, 0.5, 0, 0.9, -0.3);
      box(this.material({ color: 0x1a1a1a, roughness: 0.8 }), 0.28, 0.1, 0.55, 0, 0.92, 0.25);
      box(chrome, 0.7, 0.04, 0.04, 0, 1.15, -0.65);
      box(chrome, 0.08, 0.08, 0.6, -0.15, 0.45, 0.5);
      // The rider, leaning to the bars.
      const shirt = this.material({ color: shirts[(k + 1) % shirts.length]!, roughness: 0.85 });
      add(torso, shirt, 0, 1.35, 0.15, -0.35);
      add(head, helmet, 0, 1.8, -0.02);
      for (const side of [-0.25, 0.25]) add(limb, skin, side, 1.3, -0.3, -1.1);
      for (const side of [-0.14, 0.14])
        add(limb, this.material({ color: 0x2b2d42, roughness: 0.9 }), side, 0.8, 0.0, 1.2);
      // The sidecar, its wheel and its passenger.
      add(tub, paint, 0.85, 0.62, 0.05);
      add(wheel, tyre, 0.95, 0.33, 0.25).scale.setScalar(0.9);
      add(
        torso,
        this.material({ color: shirts[k % shirts.length]!, roughness: 0.85 }),
        0.85,
        1.05,
        0.25,
      );
      add(head, skin, 0.85, 1.45, 0.22);
      bike.rotation.y = Math.PI;
      bike.position.x = -roadHalf - (k === 1 ? 2.0 : 5.0);
      this.group.add(bike);
      this.cars.push({
        mesh: bike,
        offset: 45 + k * 120 + random() * 10,
        speed: -(9 + random() * 3),
      });
    }
  }

  /**
   * A Soviet-era motorcycle with a sidecar, as still common in Havana: an olive-drab tank and
   * mudguards, a round headlamp, the rider in an open-face helmet and the passenger sitting low
   * in the bullet-shaped sidecar alongside, coming on in the near oncoming lane.
   */
  private addSidecar(
    roadHalf: number,
    tyre: MeshStandardMaterial,
    chrome: MeshStandardMaterial,
  ): void {
    const rig = new Group();
    const drab = this.material({ color: 0x4f5a3a, roughness: 0.6, metalness: 0.2 });
    const black = this.material({ color: 0x1c1c1c, roughness: 0.7 });
    const lamp = this.material({ color: 0xfff6dc, emissive: 0xfff0c0, emissiveIntensity: 0.4 });
    const wheel = new CylinderGeometry(0.3, 0.3, 0.12, 16);
    wheel.rotateZ(Math.PI / 2);
    const tub = new SphereGeometry(0.4, 14, 10);
    tub.scale(0.85, 0.6, 1.9);
    const torso = new CapsuleGeometry(0.17, 0.4, 3, 8);
    const head = new SphereGeometry(0.12, 10, 8);
    const helmet = new SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const limb = new CapsuleGeometry(0.055, 0.42, 3, 6);
    const headlamp = new CylinderGeometry(0.09, 0.09, 0.08, 12);
    headlamp.rotateX(Math.PI / 2);
    this.disposables.push(wheel, tub, torso, head, helmet, limb, headlamp);
    const put = (
      g: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      rx = 0,
      rz = 0,
    ) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, 0, rz);
      mesh.castShadow = true;
      rig.add(mesh);
      return mesh;
    };
    const box = (
      m: MeshStandardMaterial,
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => put(this.unit, m, x, y, z).scale.set(sx, sy, sz);
    // The motorcycle: wheels, frame and engine, tank, saddle, mudguards, bars and lamp.
    put(wheel, tyre, 0, 0.3, -0.75);
    put(wheel, tyre, 0, 0.3, 0.75);
    box(black, 0.3, 0.32, 0.6, 0, 0.45, 0);
    box(chrome, 0.5, 0.14, 0.24, 0, 0.42, -0.05);
    box(drab, 0.3, 0.2, 0.55, 0, 0.78, -0.25);
    box(black, 0.26, 0.08, 0.6, 0, 0.8, 0.3);
    box(drab, 0.16, 0.06, 0.6, 0, 0.62, -0.78);
    box(drab, 0.16, 0.06, 0.6, 0, 0.62, 0.8);
    box(chrome, 0.7, 0.03, 0.03, 0, 1.05, -0.62);
    put(headlamp, lamp, 0, 0.9, -0.82);
    // The sidecar on the right: its wheel, the drab bullet tub and a small screen.
    put(wheel, tyre, 0.95, 0.3, 0.2);
    put(tub, drab, 0.95, 0.55, 0.05);
    box(black, 0.5, 0.25, 0.04, 0.95, 0.85, -0.45);
    // The rider astride, hands on the bars, in an open-face helmet; the passenger in the tub.
    const skin = this.material({ color: 0x9a6a48, roughness: 0.8 });
    const shirt = this.material({ color: 0xd8d2c0, roughness: 0.85 });
    const vest = this.material({ color: 0x3a5a8a, roughness: 0.85 });
    put(torso, shirt, 0, 1.25, 0.2, -0.25);
    put(head, skin, 0, 1.68, 0.06);
    put(helmet, black, 0, 1.7, 0.06);
    for (const x of [-0.2, 0.2]) {
      put(limb, shirt, x, 1.2, -0.25, 1.1);
      put(limb, black, x * 0.9, 0.62, -0.05, 1.3);
    }
    put(torso, vest, 0.95, 1.05, 0.15);
    put(head, skin, 0.95, 1.47, 0.15);
    rig.rotation.y = Math.PI;
    rig.position.x = -roadHalf - 1.3;
    this.group.add(rig);
    this.cars.push({ mesh: rig, offset: 33, speed: -6 });
  }

  /**
   * An open-top double-decker sightseeing bus: a red body with a cream band, a dark lower deck of
   * windows, the open upper deck railed round with its rows of seats full of visitors in sunhats,
   * and a narrow canopy over the front rows.
   */
  private addTourBus(roadHalf: number, tyre: MeshStandardMaterial): void {
    const random = seeded(1621);
    const bus = new Group();
    const red = this.material({ color: 0xc8202f, roughness: 0.45, metalness: 0.2 });
    const cream = this.material({ color: 0xf2e8d0, roughness: 0.6 });
    const dark = this.material({ color: 0x1e2a32, roughness: 0.15, metalness: 0.5 });
    const rail = this.material({ color: 0xd8dcdc, roughness: 0.3, metalness: 0.7 });
    const box = (
      m: MeshStandardMaterial,
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      bus.add(mesh);
      return mesh;
    };
    box(red, 2.5, 1.2, 10.6, 0, 1.0, 0);
    box(dark, 2.52, 0.9, 9.2, 0, 2.05, 0.4);
    box(dark, 2.3, 1.0, 0.05, 0, 2.0, -5.3);
    box(cream, 2.54, 0.25, 10.6, 0, 2.62, 0);
    box(red, 2.5, 0.6, 10.6, 0, 3.0, 0);
    for (const x of [-1.2, 1.2]) box(rail, 0.05, 0.05, 10.4, x, 3.75, 0);
    box(rail, 2.4, 0.05, 0.05, 0, 3.75, -5.2);
    box(red, 2.5, 0.08, 3.2, 0, 4.45, -3.6);
    for (const x of [-1.2, 1.2])
      for (const z of [-5.1, -2.1]) box(rail, 0.06, 1.1, 0.06, x, 3.9, z);
    // The visitors up top, in rows, in sunhats and caps.
    const shirts = [0xf2efe6, 0xe63946, 0x3a86ff, 0xffd166, 0x2a9d8f, 0xf4a261, 0xf0c8c0];
    const skins = [0xe0b08a, 0xc68b5e, 0xf0c8a8, 0x8d5a3b];
    const torso = new CapsuleGeometry(0.17, 0.3, 3, 8);
    const head = new SphereGeometry(0.11, 10, 8);
    const brim = new CylinderGeometry(0.2, 0.2, 0.02, 10);
    this.disposables.push(torso, head, brim);
    for (let row = 0; row < 8; row++) {
      for (const x of [-0.75, -0.3, 0.3, 0.75]) {
        if (random() < 0.3) continue;
        const z = -4.4 + row * 1.15;
        const body = new Mesh(
          torso,
          this.material({ color: shirts[Math.floor(random() * shirts.length)]!, roughness: 0.85 }),
        );
        body.position.set(x, 3.65, z);
        const face = new Mesh(
          head,
          this.material({ color: skins[Math.floor(random() * skins.length)]!, roughness: 0.8 }),
        );
        face.position.set(x, 4.03, z);
        bus.add(body, face);
        if (random() < 0.4) {
          const hat = new Mesh(brim, this.material({ color: 0xe8d8a8, roughness: 0.9 }));
          hat.position.set(x, 4.12, z);
          bus.add(hat);
        }
      }
    }
    const wheel = new CylinderGeometry(0.5, 0.5, 0.3, 16);
    wheel.rotateZ(Math.PI / 2);
    this.disposables.push(wheel);
    for (const x of [-1.15, 1.15]) {
      for (const z of [-3.6, 3.4]) {
        const w = new Mesh(wheel, tyre);
        w.position.set(x, 0.5, z);
        bus.add(w);
      }
    }
    bus.rotation.y = Math.PI;
    bus.position.x = -roadHalf - 1.9;
    this.group.add(bus);
    this.cars.push({ mesh: bus, offset: 118, speed: -7 });
  }

  /**
   * Ladas, the boxy Soviet sedans as common in Havana as the American classics: a squared-off
   * three-box body in faded white, beige, sky blue, red or green, a flat glasshouse, a thin
   * chrome grille between square-ish lamps, small black bumpers' rubbing strips; some oncoming,
   * some parked at the inland kerb.
   */
  private addLadas(
    roadHalf: number,
    tyre: MeshStandardMaterial,
    chrome: MeshStandardMaterial,
  ): void {
    const random = seeded(1613);
    const body = profile(
      [
        [-2.05, 0.3],
        [-2.08, 0.72],
        [-1.15, 0.78],
        [1.25, 0.78],
        [2.0, 0.76],
        [2.04, 0.32],
      ],
      1.62,
      0.04,
    );
    const cabin = profile(
      [
        [-1.15, 0.76],
        [-0.72, 1.3],
        [0.78, 1.3],
        [1.22, 0.76],
      ],
      1.5,
      0.03,
    );
    const glass = profile(
      [
        [-1.2, 0.8],
        [-0.76, 1.26],
        [0.82, 1.26],
        [1.27, 0.8],
      ],
      1.54,
      0,
    );
    const wheel = new CylinderGeometry(0.3, 0.3, 0.2, 14);
    wheel.rotateZ(Math.PI / 2);
    const hub = new CylinderGeometry(0.14, 0.14, 0.22, 10);
    hub.rotateZ(Math.PI / 2);
    this.disposables.push(body, cabin, glass, wheel, hub);
    const window = this.material({
      color: 0x1e2a32,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.9,
    });
    const rubber = this.material({ color: 0x1a1a1a, roughness: 0.8 });
    const lamp = this.material({ color: 0xfff6dc, emissive: 0xfff0c0, emissiveIntensity: 0.3 });
    const tail = this.material({ color: 0xb01020, emissive: 0x600010, emissiveIntensity: 0.4 });
    const paints = [0xe8e4d8, 0xd8c8a0, 0x8ab0c8, 0xa83228, 0x5a7a5a, 0xc8c0b0, 0x3a5a8a];
    const build = (police = false) => {
      const car = new Group();
      const paint = this.material({
        color: police ? 0xf2f2ee : paints[Math.floor(random() * paints.length)]!,
        roughness: 0.55,
        metalness: 0.15,
      });
      const put = (g: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0) => {
        const mesh = new Mesh(g, m);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        car.add(mesh);
        return mesh;
      };
      put(body, paint);
      put(glass, window);
      const box = (
        m: MeshStandardMaterial,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
      ) => put(this.unit, m, x, y, z).scale.set(sx, sy, sz);
      box(paint, 1.5, 0.05, 1.52, 0, 1.28, 0.03);
      for (const x of [-0.72, 0.72]) {
        const a = put(this.unit, paint, x, 1.03, -0.935);
        a.scale.set(0.06, 0.69, 0.06);
        a.rotation.x = 0.67;
        const c = put(this.unit, paint, x, 1.03, 1.0);
        c.scale.set(0.08, 0.7, 0.1);
        c.rotation.x = -0.68;
      }
      box(rubber, 1.66, 0.12, 0.1, 0, 0.36, -2.1);
      box(rubber, 1.66, 0.12, 0.1, 0, 0.36, 2.08);
      box(chrome, 0.9, 0.16, 0.04, 0, 0.58, -2.1);
      for (const x of [-0.58, 0.58]) {
        box(lamp, 0.26, 0.16, 0.04, x, 0.58, -2.1);
        box(tail, 0.3, 0.14, 0.04, x, 0.6, 2.06);
      }
      for (const x of [-0.78, 0.78]) {
        for (const z of [-1.25, 1.2]) {
          put(wheel, tyre, x, 0.3, z);
          put(hub, chrome, x, 0.3, z);
        }
      }
      return car;
    };
    for (let k = 0; k < 4; k++) {
      const car = build();
      this.occupy(car, random, 0.05, 0.5, 0.38);
      car.rotation.y = Math.PI;
      car.position.x = -roadHalf - (k % 2 ? 5.2 : 1.9);
      this.group.add(car);
      this.cars.push({
        mesh: car,
        offset: 22 + k * 88 + random() * 20,
        speed: -(8 + random() * 3),
      });
    }
    for (const offset of [56, 132, 215, 290]) {
      const car = build();
      const holder = new Group();
      holder.add(car);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + random() * 8, x: roadHalf - 1.0 });
    }
    // A PNR patrol car stopped in the lane, lights on: a white Lada with a blue band along its flanks, POLICÍA on
    // the doors, a light bar on the roof; its officer stands in the road at the driver's door.
    const patrol = build(true);
    const blue = this.material({ color: 0x1f4e9a, roughness: 0.5 });
    const band = (x: number) => {
      const strip = new Mesh(this.unit, blue);
      strip.scale.set(0.02, 0.16, 3.9);
      strip.position.set(x, 0.55, 0);
      patrol.add(strip);
    };
    band(-0.82);
    band(0.82);
    const bar = new Mesh(this.unit, this.material({ color: 0x222428, roughness: 0.5 }));
    bar.scale.set(1.0, 0.09, 0.26);
    bar.position.set(0, 1.35, -0.1);
    patrol.add(bar);
    for (const [x, colour] of [
      [-0.3, 0x2050ff],
      [0.3, 0xff2030],
    ] as const) {
      const light = new Mesh(
        this.unit,
        this.material({ color: colour, emissive: colour, emissiveIntensity: 0.8, roughness: 0.3 }),
      );
      light.scale.set(0.36, 0.11, 0.22);
      light.position.set(x, 1.43, -0.1);
      patrol.add(light);
    }
    const officer = new Group();
    const uniform = this.material({ color: 0x5a6a7c, roughness: 0.8 });
    const navy = this.material({ color: 0x1e2838, roughness: 0.85 });
    const skin = this.material({ color: 0x8d5a3b, roughness: 0.8 });
    const torso = new Mesh(new CapsuleGeometry(0.17, 0.42, 3, 8), uniform);
    torso.position.y = 1.08;
    const head = new Mesh(new SphereGeometry(0.11, 10, 8), skin);
    head.position.y = 1.52;
    const cap = new Mesh(new CylinderGeometry(0.12, 0.11, 0.09, 12), navy);
    cap.position.y = 1.62;
    const peak = new Mesh(this.unit, navy);
    peak.scale.set(0.16, 0.015, 0.1);
    peak.position.set(0, 1.585, 0.12);
    officer.add(torso, head, cap, peak);
    for (const z of [-0.1, 0.1]) {
      const leg = new Mesh(new CapsuleGeometry(0.07, 0.62, 3, 6), navy);
      leg.position.set(z, 0.42, 0);
      const arm = new Mesh(new CapsuleGeometry(0.05, 0.42, 3, 6), uniform);
      arm.position.set(z * 2.3, 1.02, 0);
      officer.add(leg, arm);
    }
    officer.traverse((m) => {
      m.castShadow = true;
      if (m instanceof Mesh) this.disposables.push(m.geometry);
    });
    officer.position.set(-1.3, 0, 0.6);
    officer.rotation.y = Math.PI / 2;
    const post = new Group();
    post.add(patrol, officer);
    this.group.add(post);
    this.props.push({ mesh: post, offset: 51, x: roadHalf - 3.6 });
  }

  /**
   * Local cyclists on Havana's heavy upright bicycles, riding slowly the riders' way outside the
   * parked cars: a black roadster frame on tall wheels, a wire basket on the front or a child
   * perched on a seat behind, the rider sitting bolt upright in a straw hat or a cap.
   */
  private addCyclists(
    roadHalf: number,
    tyre: MeshStandardMaterial,
    chrome: MeshStandardMaterial,
  ): void {
    const random = seeded(1567);
    const wheel = new TorusGeometry(0.33, 0.025, 6, 24);
    wheel.rotateY(Math.PI / 2);
    const torso = new CapsuleGeometry(0.16, 0.4, 3, 8);
    const head = new SphereGeometry(0.11, 10, 8);
    const limb = new CapsuleGeometry(0.055, 0.42, 3, 6);
    const brim = new CylinderGeometry(0.22, 0.22, 0.02, 12);
    this.disposables.push(wheel, torso, head, limb, brim);
    const frame = this.material({ color: 0x1a1a1c, roughness: 0.4, metalness: 0.3 });
    const straw = this.material({ color: 0xe8d8a8, roughness: 0.9 });
    const shirts = [0xf2efe6, 0xe63946, 0x3a86ff, 0x2a9d8f, 0xffd166, 0x8ab0c8];
    const skins = [0x8d5a3b, 0x6b4128, 0xc68b5e, 0x4a2c1c];
    for (let k = 0; k < 4; k++) {
      const bike = new Group();
      const pick = (list: number[], roughness = 0.85) =>
        this.material({ color: list[Math.floor(random() * list.length)]!, roughness });
      const add = (
        g: BufferGeometry,
        m: MeshStandardMaterial,
        x: number,
        y: number,
        z: number,
        rx = 0,
      ) => {
        const mesh = new Mesh(g, m);
        mesh.position.set(x, y, z);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        bike.add(mesh);
        return mesh;
      };
      const tube = (y: number, z: number, length: number, rx: number) =>
        add(this.unit, frame, 0, y, z, rx).scale.set(0.04, length, 0.04);
      add(wheel, tyre, 0, 0.34, -0.55);
      add(wheel, tyre, 0, 0.34, 0.55);
      tube(0.62, 0, 1.0, Math.PI / 2 - 0.1);
      tube(0.55, 0.18, 0.62, -0.35);
      tube(0.6, -0.48, 0.6, 0.3);
      add(this.unit, chrome, 0, 0.98, -0.5).scale.set(0.55, 0.03, 0.03);
      add(this.unit, this.material({ color: 0x3a2a1a, roughness: 0.8 }), 0, 0.88, 0.2).scale.set(
        0.16,
        0.06,
        0.26,
      );
      // The rider, bolt upright, hands on the bars, one foot down on its pedal.
      const skin = pick(skins, 0.8);
      add(torso, pick(shirts), 0, 1.3, 0.12, -0.12);
      add(head, skin, 0, 1.78, 0.05);
      if (random() < 0.6) add(brim, straw, 0, 1.87, 0.05);
      for (const side of [-0.2, 0.2]) add(limb, skin, side, 1.26, -0.22, -0.9);
      const trousers = pick([0x2b2d42, 0x3a5a8a, 0xc8b89a]);
      add(limb, trousers, -0.1, 0.62, 0.0, 0.5);
      add(limb, trousers, 0.1, 0.62, 0.1, -0.2);
      if (k % 2 === 0) {
        // A wire basket on the front with the shopping in it.
        add(this.unit, chrome, 0, 0.92, -0.78).scale.set(0.34, 0.24, 0.3);
        add(this.unit, pick([0xf4a261, 0x3f7a32, 0xf2efe6]), 0, 1.06, -0.78).scale.set(
          0.26,
          0.1,
          0.22,
        );
      } else {
        // A child on a seat behind.
        add(this.unit, frame, 0, 0.88, 0.55).scale.set(0.3, 0.05, 0.3);
        add(torso, pick(shirts), 0, 1.12, 0.58).scale.setScalar(0.62);
        add(head, skin, 0, 1.42, 0.58).scale.setScalar(0.8);
      }
      bike.position.x = roadHalf - 2.7;
      this.group.add(bike);
      this.cars.push({
        mesh: bike,
        offset: 44 + k * 85 + random() * 15,
        speed: 3.6 + random() * 1.2,
      });
    }
  }

  /**
   * Motorinas, the small mopeds and electric scooters that buzz along every Havana street: a
   * step-through body with its leg shield and cowl in a bright colour, small wheels, a rider sat
   * upright in a helmet, and every other one with a passenger perched behind.
   */
  private addMotorinas(
    roadHalf: number,
    tyre: MeshStandardMaterial,
    chrome: MeshStandardMaterial,
  ): void {
    const random = seeded(1489);
    const wheel = new TorusGeometry(0.2, 0.07, 8, 16);
    wheel.rotateY(Math.PI / 2);
    const cowl = new CapsuleGeometry(0.2, 0.4, 4, 10);
    cowl.rotateX(Math.PI / 2);
    const torso = new CapsuleGeometry(0.16, 0.38, 3, 8);
    const head = new SphereGeometry(0.13, 10, 8);
    const limb = new CapsuleGeometry(0.055, 0.45, 3, 6);
    this.disposables.push(wheel, cowl, torso, head, limb);
    const paints = [0xd62828, 0x1d70b8, 0xf1f1ec, 0x2a9d8f, 0xf4a261, 0x1a1a1a];
    const shirts = [0xf2efe6, 0xe63946, 0x3a86ff, 0xffd166, 0x8e44ad, 0x2a9d8f];
    const helmets = [0xf2f2ee, 0x1a1a1a, 0xc8202f, 0x1d70b8];
    const skins = [0x8d5a3b, 0x6b4128, 0xc68b5e, 0x4a2c1c];
    const dark = this.material({ color: 0x2b2d42, roughness: 0.9 });
    for (let k = 0; k < 6; k++) {
      const moped = new Group();
      const pick = (list: number[], roughness = 0.85) =>
        this.material({ color: list[Math.floor(random() * list.length)]!, roughness });
      const paint = pick(paints, 0.4);
      const add = (
        g: BufferGeometry,
        m: MeshStandardMaterial,
        x: number,
        y: number,
        z: number,
        rx = 0,
      ) => {
        const mesh = new Mesh(g, m);
        mesh.position.set(x, y, z);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        moped.add(mesh);
        return mesh;
      };
      add(wheel, tyre, 0, 0.27, -0.6);
      add(wheel, tyre, 0, 0.27, 0.6);
      add(cowl, paint, 0, 0.55, 0.38);
      add(this.unit, paint, 0, 0.32, -0.05).scale.set(0.34, 0.1, 0.7);
      add(this.unit, paint, 0, 0.62, -0.5, -0.25).scale.set(0.38, 0.62, 0.1);
      add(this.unit, this.material({ color: 0x1a1a1a, roughness: 0.8 }), 0, 0.78, 0.35).scale.set(
        0.28,
        0.08,
        0.6,
      );
      add(this.unit, chrome, 0, 1.02, -0.55).scale.set(0.6, 0.04, 0.04);
      // The rider, sat upright, hands on the bars, feet on the floor.
      const skin = pick(skins, 0.8);
      add(torso, pick(shirts), 0, 1.15, 0.2, -0.1);
      add(head, pick(helmets, 0.35), 0, 1.6, 0.15);
      for (const side of [-0.22, 0.22]) {
        add(limb, skin, side, 1.12, -0.18, -1.0);
        add(limb, dark, side * 0.6, 0.62, -0.05, 1.3);
      }
      if (k % 2 === 0) {
        add(torso, pick(shirts), 0, 1.15, 0.6, 0.05);
        add(head, skin, 0, 1.58, 0.62);
        for (const side of [-0.14, 0.14]) add(limb, dark, side, 0.65, 0.5, 0.9);
      }
      moped.rotation.y = Math.PI;
      moped.position.x = -roadHalf - (k % 3 === 0 ? 3.5 : k % 3 === 1 ? 0.8 : 6.0);
      this.group.add(moped);
      this.cars.push({
        mesh: moped,
        offset: 40 + k * 55 + random() * 12,
        speed: -(8 + random() * 5),
      });
    }
  }

  /**
   * Havana's buses: a camello, the humped trailer bus hauled by a truck's cab, its body painted
   * pink with a blue band and its two humps glazed along their sides; and a modern blue and white
   * city bus, long and square, with its dark windscreen and a band of windows.
   */
  private addBuses(
    roadHalf: number,
    tyre: MeshStandardMaterial,
    glass: MeshStandardMaterial,
  ): void {
    const random = seeded(1381);
    const trailer = profile(
      [
        [-6.5, 0.7],
        [-6.5, 3.5],
        [-6.2, 3.75],
        [-2.8, 3.75],
        [-2.2, 3.0],
        [2.2, 3.0],
        [2.8, 3.75],
        [6.2, 3.75],
        [6.5, 3.5],
        [6.5, 0.7],
      ],
      2.6,
      0.06,
    );
    const big = new CylinderGeometry(0.5, 0.5, 0.35, 16);
    big.rotateZ(Math.PI / 2);
    this.disposables.push(trailer, big);
    const box = (
      group: Group,
      m: MeshStandardMaterial,
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      group.add(mesh);
    };
    const wheels = (group: Group, zs: number[], half: number) => {
      for (const z of zs) {
        for (const x of [-half, half]) {
          const w = new Mesh(big, tyre);
          w.position.set(x, 0.5, z);
          group.add(w);
        }
      }
    };
    // The camello: the cab up front, the humped trailer behind.
    const camello = new Group();
    const pink = this.material({ color: 0xd9708f, roughness: 0.6, metalness: 0.1 });
    const blue = this.material({ color: 0x2b5fa8, roughness: 0.6 });
    const cab = this.material({ color: 0xc8202f, roughness: 0.5, metalness: 0.2 });
    const body = new Mesh(trailer, pink);
    body.castShadow = true;
    body.position.z = 1.5;
    camello.add(body);
    box(camello, blue, 2.64, 0.35, 13, 0, 1.3, 1.5);
    box(camello, glass, 2.66, 0.6, 3.2, 0, 3.0, -2.8);
    box(camello, glass, 2.66, 0.6, 3.2, 0, 3.0, 5.8);
    box(camello, glass, 2.66, 0.55, 4.2, 0, 2.3, 1.5);
    box(camello, cab, 2.4, 1.6, 2.4, 0, 1.6, -7.2);
    box(camello, cab, 2.3, 1.1, 1.8, 0, 2.9, -6.8);
    box(camello, glass, 2.2, 0.7, 0.05, 0, 3.0, -7.72);
    wheels(camello, [-7.4, -5.5, 4.5, 6.0], 1.1);
    // The city bus.
    const bus = new Group();
    const white = this.material({ color: 0xf0f0ec, roughness: 0.45, metalness: 0.1 });
    const navy = this.material({ color: 0x1d4f9c, roughness: 0.45, metalness: 0.1 });
    box(bus, white, 2.55, 3.0, 12, 0, 1.85, 0);
    box(bus, navy, 2.57, 0.9, 12.02, 0, 0.85, 0);
    box(bus, glass, 2.58, 1.0, 10.6, 0, 2.35, 0.4);
    box(bus, glass, 2.3, 1.5, 0.05, 0, 2.2, -6.02);
    wheels(bus, [-3.9, 3.8], 1.12);
    for (const [vehicle, lane, offset] of [
      [camello, 5.2, 62],
      [bus, 1.9, 250],
    ] as const) {
      vehicle.rotation.y = Math.PI;
      vehicle.position.x = -roadHalf - lane;
      this.group.add(vehicle);
      this.cars.push({ mesh: vehicle, offset: offset + random() * 20, speed: -(7 + random() * 2) });
    }
  }

  /**
   * Bicitaxis, Havana's pedal rickshaws, working the oncoming kerb lane: a rider standing on the
   * pedals of a bicycle's front half, and behind him a two-seat bench under a fringed canopy on
   * four posts, its side panels painted bright, on two spoked wheels; one carries a passenger.
   */
  private addBicitaxis(
    roadHalf: number,
    tyre: MeshStandardMaterial,
    metal: MeshStandardMaterial,
  ): void {
    const random = seeded(1249);
    const spoked = new TorusGeometry(0.33, 0.025, 6, 24);
    spoked.rotateY(Math.PI / 2);
    const torso = new CapsuleGeometry(0.15, 0.36, 3, 8);
    const limb = new CapsuleGeometry(0.06, 0.6, 3, 6);
    const head = new SphereGeometry(0.11, 10, 8);
    this.disposables.push(spoked, torso, limb, head);
    const skin = this.material({ color: 0x7a4a2e, roughness: 0.8 });
    const cloth = this.material({ color: 0x24262b, roughness: 0.9 });
    const panels = [0xd62828, 0x1d70b8, 0x2a9d8f, 0xf4a261];
    const canopies = [0xf1c40f, 0xe63946, 0x2b2d42, 0x3a86ff];
    const tops = [0xf2efe6, 0xe63946, 0x3a86ff, 0x2a9d8f];
    for (let i = 0; i < 4; i++) {
      const bike = new Group();
      const part = (
        g: BufferGeometry,
        m: MeshStandardMaterial,
        x: number,
        y: number,
        z: number,
        rx = 0,
      ) => {
        const mesh = new Mesh(g, m);
        mesh.position.set(x, y, z);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        bike.add(mesh);
        return mesh;
      };
      const box = (
        m: MeshStandardMaterial,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
      ) => part(this.unit, m, x, y, z).scale.set(sx, sy, sz);
      const panel = this.material({ color: panels[i % 4]!, roughness: 0.5 });
      const canopy = this.material({ color: canopies[i % 4]!, roughness: 0.8, side: DoubleSide });
      // The front: wheel, frame and the rider up on the pedals.
      part(spoked, tyre, 0, 0.35, -1.5);
      box(metal, 0.05, 0.05, 1.1, 0, 0.62, -1.0);
      box(metal, 0.05, 0.6, 0.05, 0, 0.6, -1.5);
      box(metal, 0.5, 0.04, 0.04, 0, 1.0, -1.45);
      part(torso, this.material({ color: tops[i % 4]!, roughness: 0.85 }), 0, 1.35, -0.95, -0.35);
      part(head, skin, 0, 1.8, -1.1);
      for (const x of [-0.1, 0.1]) part(limb, cloth, x, 0.72, -0.85 + x, 0.2);
      for (const x of [-0.18, 0.18])
        part(limb, skin, x * 1.4, 1.3, -1.25, -0.9).scale.setScalar(0.8);
      // The carriage: the bench, its painted panels, the canopy on four posts and two wheels.
      box(panel, 1.15, 0.45, 0.9, 0, 0.75, 0.2);
      box(cloth, 1.0, 0.12, 0.6, 0, 1.02, 0.25);
      box(panel, 1.05, 0.55, 0.1, 0, 1.3, 0.6);
      for (const x of [-0.55, 0.55]) {
        for (const z of [-0.2, 0.62]) box(metal, 0.04, 1.1, 0.04, x, 1.55, z);
        part(spoked, tyre, x * 1.05, 0.35, 0.25);
      }
      box(canopy, 1.25, 0.06, 1.05, 0, 2.12, 0.2);
      box(canopy, 1.25, 0.18, 0.02, 0, 2.0, -0.32);
      if (random() < 0.5) {
        part(torso, this.material({ color: tops[(i + 2) % 4]!, roughness: 0.85 }), 0.2, 1.38, 0.3);
        part(head, skin, 0.2, 1.82, 0.28);
      }
      bike.rotation.y = Math.PI;
      bike.position.x = -roadHalf - LANES + 1.2;
      this.group.add(bike);
      this.cars.push({
        mesh: bike,
        offset: 20 + i * 85 + random() * 30,
        speed: -(3 + random() * 1.5),
      });
    }
  }

  /** Couples strolling the promenade, and fishermen sitting on the wall facing the sea. */
  private addPeople(roadHalf: number): void {
    const random = seeded(929);
    const promenade = -roadHalf - LANES;
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 7) {
      if (random() < 0.3) {
        // A fisherman sits on the wall facing the sea, his rod out over the water.
        this.sitters.push({ offset, sea: true, rod: true });
        continue;
      }
      const speed = (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.5);
      this.strollers.push({
        offset,
        x: promenade - 0.8 - random() * (PROMENADE - 1.4),
        speed,
        heading: speed > 0 ? 0 : Math.PI,
        phase: random() * 6.3,
      });
    }
    for (let offset = 2; offset < LOOP; offset += 5 + random() * 9) {
      const speed = (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.4);
      this.strollers.push({
        offset,
        x: roadHalf + 0.8 + random() * 1.2,
        speed,
        heading: speed > 0 ? 0 : Math.PI,
        phase: random() * 6.3,
      });
    }
    // Children walking beside a parent on the inland pavement, at the parent's pace with
    // quicker steps, on the side away from the kerb.
    const family = seeded(1537);
    for (const adult of this.strollers.filter((w) => w.x > 0)) {
      if (family() > 0.28) continue;
      this.strollers.push({
        offset: adult.offset + (family() - 0.5) * 0.4,
        x: adult.x + 0.55,
        speed: adult.speed,
        heading: adult.heading,
        phase: adult.phase + 1.3,
        child: 0.52 + family() * 0.2,
      });
    }
    // People sitting along the wall's top: some facing the sea, most facing the city.
    const perch = seeded(1087);
    for (let offset = 1; offset < LOOP; offset += 2 + perch() * 6) {
      const sea = perch() < 0.35;
      this.sitters.push({ offset, sea, rod: sea && perch() < 0.4 });
    }
    this.seated = new Sitters(this.group, this.disposables, this.sitters, STROLL_WEAR, 1091);
    this.people = new Walkers(
      this.group,
      this.disposables,
      this.strollers.length,
      STROLL_WEAR,
      937,
      this.strollers.map((w) => w.child ?? 1),
    );
  }

  /**
   * The sea's side of the wall: the jagged dark reef rock (diente de perro) heaped at its foot,
   * a band of churning foam against it, and swell crests rolling in from the Gulf to break there.
   */
  private addReef(roadHalf: number, points: number): void {
    const wall = -roadHalf - LANES - PROMENADE - 0.7;
    const foam = this.track(foamTexture());
    foam.wrapS = RepeatWrapping;
    foam.wrapT = RepeatWrapping;
    foam.repeat.set(1 / 7, 1 / 14);
    this.foam = foam;
    this.ribbons.add(
      points,
      this.material({ map: foam, transparent: true, depthWrite: false, roughness: 0.6 }),
      [
        [wall, -SEA + 0.05],
        [wall - 7, -SEA + 0.05],
      ],
    );
    const random = seeded(1021);
    const rock = this.material({ color: 0x4a443c, roughness: 1, flatShading: true });
    const stone = new IcosahedronGeometry(1, 0);
    this.disposables.push(stone);
    for (let offset = 0; offset < LOOP; offset += 24) {
      const parts: BufferGeometry[] = [];
      for (let k = 0; k < 18; k++) {
        const r = 0.4 + random() * 0.9;
        const piece = stone.clone();
        piece.scale(r * (1 + random()), r * 0.6, r * (1 + random()));
        piece.rotateY(random() * Math.PI);
        piece.translate(-0.4 - random() * 3.2, -SEA + r * 0.15 - 0.2, -random() * 24);
        parts.push(piece);
      }
      const heap = mergeGeometries(parts)!;
      parts.forEach((g) => g.dispose());
      this.disposables.push(heap);
      const holder = new Group();
      const mesh = new Mesh(heap, rock);
      mesh.receiveShadow = true;
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: wall });
    }
    const ridge = new CylinderGeometry(0.5, 0.5, 1, 8, 1);
    ridge.rotateX(Math.PI / 2);
    ridge.scale(1, 0.2, 1);
    this.disposables.push(ridge);
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 6) {
      this.crestList.push({
        offset,
        delay: -offset / RUN + random() * 0.8,
        length: 8 + random() * 14,
      });
    }
    this.crests = new InstancedMesh(
      ridge,
      this.material({
        color: 0xf4fafc,
        emissive: 0x8aa0aa,
        transparent: true,
        opacity: 0.85,
        roughness: 0.5,
        depthWrite: false,
      }),
      this.crestList.length,
    );
    this.crests.frustumCulled = false;
    this.group.add(this.crests);
  }

  /**
   * El Morro across the harbour mouth ahead: a rocky headland rising from the sea, the castle's
   * battered, sloping walls following it in angled bastions of ochre stone with their parapets and
   * sentry boxes, the hill of La Cabaña green behind, and on the point the lighthouse, a pale
   * round tower with a gallery and a dark lantern.
   */
  private addMorro(roadHalf: number): void {
    const stone = this.material({
      map: this.repeat(wallTexture(), 6, 6),
      color: 0xd9bf8c,
      roughness: 0.95,
    });
    const rock = this.material({ color: 0x9d9588, roughness: 1, flatShading: true, fog: false });
    // The hill's colours carry their own light haze (they sit outside the scene's fog, which
    // would wash them to khaki at this distance).
    const scrub = this.material({ color: 0x819577, roughness: 1, fog: false });
    const tower = this.material({ color: 0xece4d2, roughness: 0.8 });
    const dark = this.material({ color: 0x2a2e30, roughness: 0.6, metalness: 0.3 });
    const lamp = this.material({ color: 0xfff4d0, emissive: 0xffe8a0, emissiveIntensity: 0.8 });
    const morro = new Group();
    // The headland: a heap of lumpy rock, with the green hill behind.
    const lump = (
      r: number,
      x: number,
      y: number,
      z: number,
      m: MeshStandardMaterial,
      sy = 0.5,
    ) => {
      const g = new IcosahedronGeometry(1, 1);
      const position = g.getAttribute('position') as BufferAttribute;
      for (let v = 0; v < position.count; v++) {
        // Displaced by its direction, so the faces that share a corner move it together.
        const n = Math.sin(
          position.getX(v) * 12.9 + position.getY(v) * 78.2 + position.getZ(v) * 37.7,
        );
        const k = 0.82 + 0.36 * ((((n * 43758.5) % 1) + 1) % 1);
        position.setXYZ(v, position.getX(v) * k, position.getY(v) * k, position.getZ(v) * k);
      }
      g.computeVertexNormals();
      this.disposables.push(g);
      const mesh = new Mesh(g, m);
      mesh.scale.set(r, r * sy, r * 0.8);
      mesh.position.set(x, y, z);
      morro.add(mesh);
    };
    lump(90, 0, -SEA - 6, 0, rock, 0.32);
    lump(60, 60, -SEA - 4, -10, rock, 0.36);
    lump(140, -40, -SEA - 10, -110, scrub, 0.42);
    lump(110, 120, -SEA - 8, -140, scrub, 0.4);
    // The hill's cover: clumps of dark trees and scrub dotted over its slopes, thickest on the
    // upper slopes and thinning toward the rock, so the hill reads as wooded rather than bare.
    const clump = new IcosahedronGeometry(1, 0);
    const woods = new InstancedMesh(
      clump,
      this.material({ color: 0xffffff, roughness: 1, flatShading: true, fog: false }),
      260,
    );
    this.disposables.push(clump, woods);
    const trees = seeded(1601);
    const place = new Matrix4();
    const tint = new Color();
    const greens = [0x70846d, 0x6b7e69, 0x788a70, 0x7e8c72];
    const hills: [number, number, number, number, number][] = [
      [140, -40, -SEA - 10, -110, 0.42],
      [110, 120, -SEA - 8, -140, 0.4],
      [90, 0, -SEA - 6, 0, 0.32],
    ];
    for (let i = 0; i < 260; i++) {
      const [r, cx, cy, cz, sy] = hills[i < 120 ? 0 : i < 220 ? 1 : 2]!;
      const a = trees() * Math.PI * 2;
      const d = Math.sqrt(trees()) * 0.68;
      const dx = Math.cos(a) * d * r;
      const dz = Math.sin(a) * d * r * 0.8;
      const height = Math.sqrt(Math.max(0, 1 - d * d)) * r * sy * 0.9;
      const size = 3 + trees() * 4;
      place.makeScale(size, size * (0.7 + trees() * 0.5), size);
      place.setPosition(cx + dx, cy + height + size * 0.4, cz + dz);
      woods.setMatrixAt(i, place);
      woods.setColorAt(i, tint.set(greens[Math.floor(trees() * greens.length)]!));
    }
    morro.add(woods);
    // The castle: polygonal bastions with walls battered inward as they rise.
    const bastion = (plan: [number, number][], height: number, x: number, y: number, z: number) => {
      const shape = new Shape(plan.map(([px, pz]) => new Vector2(px, pz)));
      const g = new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      const position = g.getAttribute('position') as BufferAttribute;
      for (let v = 0; v < position.count; v++) {
        const t = position.getY(v) / height;
        position.setX(v, position.getX(v) * (1 - t * 0.08));
        position.setZ(v, position.getZ(v) * (1 - t * 0.08));
      }
      g.computeVertexNormals();
      this.disposables.push(g);
      const mesh = new Mesh(g, stone);
      mesh.position.set(x, y, z);
      morro.add(mesh);
      // A parapet along the top, and a domed sentry box at the salient.
      const cap = new Mesh(this.unit, stone);
      const span = Math.max(...plan.map(([px]) => Math.abs(px))) * 1.7;
      cap.scale.set(span, 1.4, 1.2);
      cap.position.set(x, y + height + 0.7, z + plan[0]![1] * 0.92);
      morro.add(cap);
      const garita = new Mesh(new CylinderGeometry(1.1, 1.1, 3, 8), stone);
      this.disposables.push(garita.geometry);
      garita.position.set(x + plan[0]![0] * 0.9, y + height + 1.5, z + plan[0]![1] * 0.9);
      morro.add(garita);
    };
    bastion(
      [
        [0, 24],
        [26, 4],
        [20, -20],
        [-20, -20],
        [-26, 4],
      ],
      16,
      -30,
      8,
      6,
    );
    bastion(
      [
        [0, 20],
        [20, 2],
        [16, -18],
        [-16, -18],
        [-20, 2],
      ],
      18,
      4,
      10,
      -14,
    );
    bastion(
      [
        [0, 18],
        [18, 0],
        [14, -16],
        [-14, -16],
        [-18, 0],
      ],
      14,
      36,
      8,
      4,
    );
    const keep = new Mesh(this.unit, stone);
    keep.scale.set(60, 10, 30);
    keep.position.set(0, 28, -26);
    morro.add(keep);
    // The lighthouse on the point.
    const shaft = new CylinderGeometry(2.4, 3.2, 34, 16);
    const gallery = new CylinderGeometry(3.6, 3.6, 0.6, 16);
    const lantern = new CylinderGeometry(2, 2, 3.2, 12);
    const dome = new IcosahedronGeometry(2.1, 1);
    this.disposables.push(shaft, gallery, lantern, dome);
    const light = new Group();
    const add = (g: BufferGeometry, m: MeshStandardMaterial, y: number) => {
      const mesh = new Mesh(g, m);
      mesh.position.y = y;
      light.add(mesh);
    };
    add(shaft, tower, 17);
    add(gallery, dark, 34.3);
    add(lantern, lamp, 36.2);
    add(dome, dark, 38);
    light.position.set(48, 18, 18);
    morro.add(light);
    morro.position.set(-roadHalf - 330, 0, -1100);
    morro.rotation.y = 0.4;
    this.horizon.add(morro);
    this.group.add(this.horizon);
  }

  /**
   * The city closing the view ahead where the Malecón bends toward the harbour: Old Havana's
   * faded blocks of four to ten storeys, the Hotel Deauville's tall slab by the sea, and over the
   * rooftops the Capitolio, its long front and the dome on its drum topped by a lantern.
   */
  private addSkyline(): void {
    const random = seeded(1151);
    const city = new Group();
    const windows = this.track(facadeTexture());
    windows.wrapS = RepeatWrapping;
    windows.wrapT = RepeatWrapping;
    const faded = [0xe8d8c0, 0xd8c8b0, 0xc8d8d0, 0xe8c8b8, 0xd0d8e0, 0xe0e0d0, 0xd8b8a0];
    const block = (w: number, h: number, d: number, x: number, z: number, colour: number) => {
      const map = windows.clone();
      map.repeat.set(w / 8, h / 16.8);
      map.needsUpdate = true;
      this.track(map);
      const mesh = new Mesh(this.unit, this.material({ map, color: colour, roughness: 0.9 }));
      mesh.scale.set(w, h, d);
      mesh.position.set(x, h / 2 - 1, z);
      city.add(mesh);
    };
    for (let i = 0; i < 40; i++) {
      const x = -170 + random() * 200;
      const z = -950 - random() * 350;
      block(
        14 + random() * 26,
        12 + random() * 26,
        14 + random() * 20,
        x,
        z,
        faded[i % faded.length]!,
      );
    }
    // The Deauville, a tall slab right on the Malecón.
    block(24, 52, 16, -40, -900, 0xc8d0d4);
    // The Capitolio over the rooftops.
    const stone = this.material({ color: 0xece2cc, roughness: 0.85 });
    const capitolio = new Group();
    const front = new Mesh(this.unit, stone);
    front.scale.set(200, 26, 60);
    front.position.y = 12;
    const portico = new Mesh(this.unit, stone);
    portico.scale.set(40, 30, 10);
    portico.position.set(0, 14, 34);
    const drum = new Mesh(new CylinderGeometry(15, 16, 26, 24), stone);
    drum.position.y = 38;
    const dome = new Mesh(new SphereGeometry(16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), stone);
    dome.scale.y = 1.6;
    dome.position.y = 51;
    const lantern = new Mesh(new CylinderGeometry(3, 3.4, 10, 12), stone);
    lantern.position.y = 81;
    const tip = new Mesh(new ConeGeometry(2.4, 6, 12), stone);
    tip.position.y = 89;
    for (const m of [drum, dome, lantern, tip]) this.disposables.push(m.geometry);
    capitolio.add(front, portico, drum, dome, lantern, tip);
    capitolio.position.set(-125, 0, -1350);
    capitolio.rotation.y = -0.3;
    city.add(capitolio);
    city.add(this.laPunta());
    this.horizon.add(city);
  }

  /**
   * La Punta, the little fortress at the Malecón's end, facing El Morro across the harbour
   * mouth: a low, battered stone curtain on a bastioned plan, a parapet along its top, a domed
   * sentry box on each salient, and the flag over its gate.
   */
  private laPunta(): Group {
    const fort = new Group();
    const stone = this.material({
      map: this.repeat(wallTexture(), 8, 2),
      color: 0xd8c49a,
      roughness: 0.95,
    });
    // The plan: a square with an arrow-headed bastion on each corner.
    const outline = new Shape();
    const plan: [number, number][] = [];
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const c = Math.cos(a);
      const n = Math.sin(a);
      const corner = (u: number, v: number): [number, number] => [u * c - v * n, u * n + v * c];
      plan.push(corner(22, -10), corner(22, 10), corner(34, 34), corner(10, 22));
    }
    plan.forEach(([x, y], i) => (i ? outline.lineTo(x, y) : outline.moveTo(x, y)));
    const curtain = new ExtrudeGeometry(outline, { depth: 9, bevelEnabled: false });
    curtain.rotateX(-Math.PI / 2);
    const walls = new Mesh(curtain, stone);
    walls.scale.set(1.08, 1, 1.08);
    const parapet = new ExtrudeGeometry(outline, { depth: 1.4, bevelEnabled: false });
    parapet.rotateX(-Math.PI / 2);
    const lip = new Mesh(parapet, stone);
    lip.position.y = 9;
    this.disposables.push(curtain, parapet);
    fort.add(walls, lip);
    // A domed garita on each salient.
    const box = new CylinderGeometry(1.4, 1.5, 3.4, 10);
    const cap = new SphereGeometry(1.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(box, cap);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + Math.PI / 4;
      const r = 34 * Math.SQRT2 * 0.98;
      const garita = new Mesh(box, stone);
      garita.position.set(Math.cos(a) * r, 11.8, -Math.sin(a) * r);
      const top = new Mesh(cap, stone);
      top.position.set(garita.position.x, 13.5, garita.position.z);
      fort.add(garita, top);
    }
    const mast = new Mesh(this.unit, this.material({ color: 0xe8e8e2, roughness: 0.6 }));
    mast.scale.set(0.3, 14, 0.3);
    mast.position.set(0, 16, 0);
    const flag = new Mesh(this.flagSheet, this.flag);
    flag.scale.set(1, 2.8, 2.8);
    flag.position.set(0, 21.5, -2.6);
    fort.add(mast, flag);
    fort.position.set(-215, -1, -960);
    fort.rotation.y = 0.3;
    return fort;
  }

  /**
   * Tropical cumulus over the Gulf in the late afternoon: heaped white towers with sunlit tops
   * and flat, grey-blue bases, standing far out over the sea and the city.
   */
  private addClouds(): void {
    const random = seeded(1193);
    const sheet = new PlaneGeometry(1, 1);
    this.disposables.push(sheet);
    const looks = [0, 1, 2].map((k) => this.track(cumulusTexture(1201 + k * 7)));
    for (let i = 0; i < 9; i++) {
      const material = new MeshBasicMaterial({
        map: looks[i % looks.length]!,
        transparent: true,
        depthWrite: false,
        fog: false,
        opacity: 0.92,
      });
      this.disposables.push(material);
      const cloud = new Mesh(sheet, material);
      const w = 380 + random() * 520;
      cloud.scale.set(w, w * (0.6 + random() * 0.25), 1);
      cloud.position.set(
        -2600 + random() * 3000,
        260 + random() * 260 + w * 0.3,
        -2000 - random() * 1400,
      );
      cloud.renderOrder = -1;
      this.horizon.add(cloud);
    }
    // High above them, cirrus: thin streaks of ice cloud combed out by the wind aloft, faint and
    // fibrous, drawn behind the cumulus.
    const cirrus = new MeshBasicMaterial({
      map: this.track(cirrusTexture()),
      transparent: true,
      depthWrite: false,
      fog: false,
      opacity: 0.75,
    });
    this.disposables.push(cirrus);
    for (let i = 0; i < 4; i++) {
      const streak = new Mesh(sheet, cirrus);
      const w = 2200 + random() * 1600;
      streak.scale.set(w, w * 0.32, 1);
      streak.rotation.z = (random() - 0.5) * 0.3;
      streak.position.set(-2400 + i * 1500 + random() * 400, 1150 + random() * 500, -3600);
      streak.renderOrder = -2;
      this.horizon.add(streak);
    }
    // Contrails from the airliners crossing high over the Florida Straits: a fresh one, thin and
    // sharp, with the speck of its aircraft at the tip, and an older one spread into a soft band.
    for (const [fresh, x, y, w, tilt] of [
      [true, -500, 980, 1500, 0.18],
      [false, 700, 760, 2400, -0.1],
    ] as const) {
      const trail = new Mesh(
        sheet,
        new MeshBasicMaterial({
          map: this.track(contrailTexture(fresh)),
          transparent: true,
          depthWrite: false,
          fog: false,
          opacity: fresh ? 1 : 0.8,
        }),
      );
      this.disposables.push(trail.material as MeshBasicMaterial);
      trail.scale.set(w, fresh ? 110 : 320, 1);
      trail.rotation.z = tilt;
      trail.position.set(x, y, -3400);
      trail.renderOrder = -2;
      this.horizon.add(trail);
    }
  }

  /**
   * Life on the Gulf: fishermen afloat in black inner tubes (neumáticos) just off the wall, small
   * wooden skiffs further out, each with its fisherman, and freighters on the horizon.
   */
  private addBoats(roadHalf: number): void {
    const random = seeded(1213);
    const wall = -roadHalf - LANES - PROMENADE - 0.7;
    const rubber = this.material({ color: 0x18191b, roughness: 0.7 });
    const skin = this.material({ color: 0x8d5a3b, roughness: 0.8 });
    const shirt = this.material({ color: 0xf2efe6, roughness: 0.85 });
    const tube = new TorusGeometry(0.45, 0.17, 8, 16);
    tube.rotateX(Math.PI / 2);
    const torso = new CapsuleGeometry(0.17, 0.3, 3, 8);
    const head = new SphereGeometry(0.11, 10, 8);
    this.disposables.push(tube, torso, head);
    const water = -SEA;
    for (let offset = 12; offset < LOOP; offset += 40 + random() * 50) {
      const float = new Group();
      const ring = new Mesh(tube, rubber);
      ring.position.y = water + 0.05;
      const body = new Mesh(torso, shirt);
      body.position.y = water + 0.3;
      const face = new Mesh(head, skin);
      face.position.y = water + 0.62;
      float.add(ring, body, face);
      this.group.add(float);
      this.props.push({ mesh: float, offset, x: wall - 18 - random() * 40 });
    }
    // Wooden skiffs: a planked hull drawn as a side profile, painted, with a fisherman aboard.
    const hull = profile(
      [
        [-2.2, 0.75],
        [-2.0, 0.1],
        [1.6, 0.0],
        [2.5, 0.55],
        [2.7, 0.95],
      ],
      1.5,
      0.04,
    );
    this.disposables.push(hull);
    const paints = [0x2b6cb0, 0xe9e4d8, 0xc0392b, 0x2a9d8f];
    for (let offset = 30; offset < LOOP; offset += 90 + random() * 60) {
      const boat = new Group();
      const shell = new Mesh(
        hull,
        this.material({ color: paints[Math.floor(random() * 4)]!, roughness: 0.7 }),
      );
      shell.position.y = water - 0.25;
      const body = new Mesh(torso, shirt);
      body.position.set(0, water + 0.75, 0.6);
      const face = new Mesh(head, skin);
      face.position.set(0, water + 1.08, 0.6);
      boat.add(shell, body, face);
      boat.rotation.y = random() * Math.PI * 2;
      this.group.add(boat);
      this.props.push({ mesh: boat, offset, x: wall - 90 - random() * 160 });
    }
    // Freighters on the horizon: a long dark hull, a white bridge house aft, a funnel.
    const steel = this.material({ color: 0x3a3f46, roughness: 0.8 });
    const white = this.material({ color: 0xe8e8e2, roughness: 0.7 });
    for (const [x, z, k] of [
      [-1500, -1900, 1],
      [-900, -2600, 0.8],
    ] as const) {
      const ship = new Group();
      const hullBox = new Mesh(this.unit, steel);
      hullBox.scale.set(14, 9, 120);
      hullBox.position.y = water + 3;
      const bridge = new Mesh(this.unit, white);
      bridge.scale.set(12, 12, 14);
      bridge.position.set(0, water + 13, 45);
      const funnel = new Mesh(this.unit, steel);
      funnel.scale.set(4, 8, 5);
      funnel.position.set(0, water + 22, 52);
      ship.add(hullBox, bridge, funnel);
      ship.scale.setScalar(k);
      ship.rotation.y = 1.3;
      ship.position.set(x, 0, z);
      this.horizon.add(ship);
    }
    // Yachts under sail and a catamaran out on the Gulf: a white hull, a tall mast with its
    // mainsail and jib catching the light, each heeled a little to the breeze.
    const canvas = this.material({ color: 0xf8f6f0, roughness: 0.7, side: DoubleSide });
    const whiteHull = this.material({ color: 0xf0f0ec, roughness: 0.5 });
    const spar = this.material({ color: 0xb8bcc0, roughness: 0.4, metalness: 0.6 });
    const main = new BufferGeometry().setFromPoints([
      new Vector3(0, 1.5, 0),
      new Vector3(0, 16, 0),
      new Vector3(0, 1.5, 6),
    ]);
    const jib = new BufferGeometry().setFromPoints([
      new Vector3(0, 1.5, -0.4),
      new Vector3(0, 14, -0.2),
      new Vector3(0, 1.5, -5),
    ]);
    main.computeVertexNormals();
    jib.computeVertexNormals();
    this.disposables.push(main, jib);
    for (const [x, z, turn, cat] of [
      [-150, -260, 0.6, false],
      [-260, -470, -0.4, true],
      [-120, -700, 1.1, false],
      [-420, -880, 0.2, false],
    ] as const) {
      const yacht = new Group();
      const body = new Mesh(this.unit, whiteHull);
      if (cat) {
        for (const side of [-2.4, 2.4]) {
          const pontoon = new Mesh(this.unit, whiteHull);
          pontoon.scale.set(1.2, 1.2, 12);
          pontoon.position.set(side, water + 0.5, 0);
          yacht.add(pontoon);
        }
        body.scale.set(6, 0.8, 6);
        body.position.y = water + 1.3;
      } else {
        body.scale.set(3.2, 1.6, 12);
        body.position.y = water + 0.6;
      }
      const pole = new Mesh(this.unit, spar);
      pole.scale.set(0.25, 15, 0.25);
      pole.position.y = water + 8.5;
      const mainsail = new Mesh(main, canvas);
      mainsail.position.y = water;
      const headsail = new Mesh(jib, canvas);
      headsail.position.y = water;
      yacht.add(body, pole, mainsail, headsail);
      yacht.rotation.set(0, turn, 0.12);
      yacht.position.set(x, 0, z);
      this.horizon.add(yacht);
    }
  }

  /**
   * Seabirds over the water: gulls wheeling low along the wall, and frigatebirds, long-winged and
   * dark, soaring high over the Gulf on still wings. Each is a bent pair of wings, instanced.
   */
  private addBirds(roadHalf: number): void {
    const random = seeded(1223);
    const wall = -roadHalf - LANES - PROMENADE;
    for (let i = 0; i < 26; i++) {
      const high = i % 3 === 0;
      this.birdList.push({
        offset: random() * LOOP,
        x: wall - 6 - random() * (high ? 120 : 40),
        height: high ? 30 + random() * 40 : 5 + random() * 10,
        radius: 6 + random() * 18,
        turn: (random() < 0.5 ? 1 : -1) * (0.15 + random() * 0.2),
        phase: random() * Math.PI * 2,
        size: high ? 1.6 : 0.7,
        glide: high || random() < 0.4,
      });
    }
    // A gull's wings: two slim triangles from the body, raised and bent at the wrist.
    const wing = new BufferGeometry();
    const v = [
      [0, 0, 0.25],
      [0, 0, -0.2],
      [0.5, 0.15, 0.05],
      [0.5, 0.15, 0.05],
      [0, 0, -0.2],
      [1, -0.05, -0.15],
      [0, 0, 0.25],
      [-0.5, 0.15, 0.05],
      [0, 0, -0.2],
      [-0.5, 0.15, 0.05],
      [-1, -0.05, -0.15],
      [0, 0, -0.2],
    ].flat();
    wing.setAttribute('position', new BufferAttribute(new Float32Array(v), 3));
    wing.computeVertexNormals();
    this.disposables.push(wing);
    this.birds = new InstancedMesh(
      wing,
      this.material({ color: 0xe8e6e0, roughness: 0.8, side: DoubleSide }),
      this.birdList.length,
    );
    const dark = new Color(0x2a2a2e);
    const pale = new Color(0xf0eee8);
    this.birdList.forEach((b, i) => this.birds!.setColorAt(i, b.size > 1 ? dark : pale));
    this.birds.frustumCulled = false;
    this.group.add(this.birds);
  }

  /**
   * The Malecón's painted hoardings: big boards on steel legs along the promenade, each a
   * hand-painted message in the national colours, its paint faded by the sun and salt.
   */
  private addBillboards(roadHalf: number): void {
    const x = -roadHalf - LANES - 1.4;
    const steel = this.material({ color: 0x5a5e62, roughness: 0.7, metalness: 0.4 });
    const leg = new BoxGeometry(0.16, 3.2, 0.16);
    leg.translate(0, 1.6, 0);
    const back = new BoxGeometry(7.4, 3.4, 0.12);
    this.disposables.push(leg, back);
    const boards = [
      ['¡VIVA CUBA!', 'LIBRE'],
      ['LA PATRIA', 'ES DE TODOS'],
      ['HAVANA', 'MALECÓN'],
    ] as const;
    boards.forEach(([top, bottom], k) => {
      const face = this.track(boardTexture(top, bottom, k));
      const board = new Group();
      const sheet = new Mesh(back, [
        steel,
        steel,
        steel,
        steel,
        this.material({ map: face, roughness: 0.8 }),
        steel,
      ]);
      sheet.position.y = 3.2 + 1.7;
      sheet.castShadow = true;
      for (const dx of [-2.6, 2.6]) {
        const post = new Mesh(leg, steel);
        post.position.x = dx;
        board.add(post);
      }
      board.add(sheet);
      board.rotation.y = 0.35;
      this.group.add(board);
      this.props.push({ mesh: board, offset: 60 + k * 120, x });
    });
  }

  /**
   * Havana's street dogs, short-coated and lean, tan, black, brindle or white with patches: some
   * stand about on the pavement and the promenade, head up or nosing the ground, and some doze
   * stretched out in the shade, legs folded under them.
   */
  private addDogs(roadHalf: number): void {
    const random = seeded(1283);
    const coats = [0xb98a55, 0x2a2420, 0xd8c8a8, 0x7a5a3a, 0xe8e2d6];
    const body = new CapsuleGeometry(0.16, 0.5, 4, 10);
    body.rotateX(Math.PI / 2);
    const head = new SphereGeometry(0.12, 10, 8);
    const snout = new CapsuleGeometry(0.06, 0.1, 3, 8);
    snout.rotateX(Math.PI / 2);
    const ear = new ConeGeometry(0.045, 0.1, 4);
    const leg = new CylinderGeometry(0.035, 0.03, 0.4, 6);
    const tail = new CylinderGeometry(0.025, 0.012, 0.32, 5);
    this.disposables.push(body, head, snout, ear, leg, tail);
    for (let offset = 11; offset < LOOP; offset += 14 + random() * 22) {
      const dog = new Group();
      const coat = this.material({
        color: coats[Math.floor(random() * coats.length)]!,
        roughness: 0.95,
      });
      const lying = random() < 0.4;
      const nosing = !lying && random() < 0.4;
      const add = (g: BufferGeometry, x: number, y: number, z: number, rx = 0) => {
        const mesh = new Mesh(g, coat);
        mesh.position.set(x, y, z);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        dog.add(mesh);
      };
      const hip = lying ? 0.16 : 0.5;
      add(body, 0, hip, 0);
      const hy = lying ? 0.22 : nosing ? 0.35 : 0.68;
      add(head, 0, hy, -0.5);
      add(snout, 0, hy - 0.03, -0.64, nosing ? 0.5 : 0);
      for (const x of [-0.07, 0.07]) add(ear, x, hy + 0.1, -0.48);
      if (!lying) {
        for (const x of [-0.09, 0.09]) for (const z of [-0.28, 0.28]) add(leg, x, 0.2, z);
        add(tail, 0, 0.58, 0.48, 0.9);
      } else {
        for (const x of [-0.12, 0.12]) {
          const paw = new Mesh(leg, coat);
          paw.rotation.x = Math.PI / 2;
          paw.position.set(x, 0.05, -0.55);
          dog.add(paw);
        }
        add(tail, 0.12, 0.06, 0.5, 1.5);
      }
      dog.rotation.y = random() * Math.PI * 2;
      const holder = new Group();
      dog.position.y = KERB;
      holder.add(dog);
      this.group.add(holder);
      const promenade = offset > 15 && random() < 0.4;
      const x = promenade
        ? -roadHalf - LANES - 1.2 - random() * 2.5
        : roadHalf + 0.8 + random() * (lying ? 5 : 3);
      this.props.push({ mesh: holder, offset, x });
    }
  }

  /**
   * Street vendors working the promenade: a wooden pushcart on two spoked wheels, its box painted
   * bright with a glass case of churros, peanuts or coconut sweets on top, a striped parasol
   * on a pole above it, and the vendor standing at its handles.
   */
  private addVendors(roadHalf: number): void {
    const random = seeded(1319);
    const x = -roadHalf - LANES - 2.2;
    const wheel = new TorusGeometry(0.32, 0.03, 6, 20);
    wheel.rotateY(Math.PI / 2);
    const shade = new ConeGeometry(1.3, 0.45, 8, 1, true);
    const torso = new CapsuleGeometry(0.17, 0.4, 3, 8);
    const leg = new CapsuleGeometry(0.07, 0.75, 3, 6);
    const head = new SphereGeometry(0.11, 10, 8);
    this.disposables.push(wheel, shade, torso, leg, head);
    const boxes = [0x2a9d8f, 0xe63946, 0x1d70b8, 0xf4a261];
    const shades = [0xf1c40f, 0xffffff, 0xe63946, 0x3a86ff];
    const dark = this.material({ color: 0x2a2620, roughness: 0.8 });
    const glass = this.material({
      color: 0xdfe8ea,
      roughness: 0.1,
      transparent: true,
      opacity: 0.45,
    });
    const goods = this.material({ color: 0xc8883a, roughness: 0.8 });
    const skin = this.material({ color: 0x7a4a2e, roughness: 0.8 });
    const trousers = this.material({ color: 0x2b2d42, roughness: 0.9 });
    for (let k = 0, offset = 34; offset < LOOP; k++, offset += 50 + random() * 45) {
      const cart = new Group();
      const part = (
        g: BufferGeometry,
        m: MeshStandardMaterial,
        px: number,
        py: number,
        pz: number,
      ) => {
        const mesh = new Mesh(g, m);
        mesh.position.set(px, py, pz);
        mesh.castShadow = true;
        cart.add(mesh);
        return mesh;
      };
      const box = (
        m: MeshStandardMaterial,
        sx: number,
        sy: number,
        sz: number,
        px: number,
        py: number,
        pz: number,
      ) => part(this.unit, m, px, py, pz).scale.set(sx, sy, sz);
      const paint = this.material({ color: boxes[k % boxes.length]!, roughness: 0.6 });
      box(paint, 0.9, 0.7, 1.5, 0, 0.75, 0);
      box(glass, 0.8, 0.4, 1.3, 0, 1.3, 0);
      box(goods, 0.7, 0.12, 1.2, 0, 1.16, 0);
      for (const side of [-0.48, 0.48]) part(wheel, dark, side, 0.32, 0.2);
      box(dark, 0.6, 0.04, 0.04, 0, 1.0, -0.95);
      box(dark, 0.04, 2.1, 0.04, 0.3, 2.05, 0.55);
      const top = part(
        shade,
        this.material({ color: shades[k % shades.length]!, roughness: 0.8, side: DoubleSide }),
        0.3,
        3.0,
        0.55,
      );
      top.castShadow = true;
      // The vendor at the handles.
      part(
        torso,
        this.material({ color: boxes[(k + 2) % boxes.length]!, roughness: 0.85 }),
        0,
        1.25,
        -1.3,
      );
      for (const side of [-0.09, 0.09]) part(leg, trousers, side, 0.45, -1.3);
      part(head, skin, 0, 1.72, -1.3);
      cart.position.y = KERB;
      cart.rotation.y = (random() - 0.5) * 0.8;
      const holder = new Group();
      holder.add(cart);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: x - random() * 1.5 });
    }
  }

  /**
   * Potholes in both carriageways, as Havana's roads have them: ragged dark hollows with broken
   * edges and loose grit, some filled with water that mirrors the sky, decals laid on the road.
   */
  private addPotholes(roadHalf: number): void {
    const random = seeded(1399);
    const dry = this.material({
      map: this.track(potholeTexture(false)),
      transparent: true,
      depthWrite: false,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -5,
    });
    const wet = this.material({
      map: this.track(potholeTexture(true)),
      transparent: true,
      depthWrite: false,
      roughness: 0.05,
      metalness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -5,
    });
    const sheet = new PlaneGeometry(1, 1);
    sheet.rotateX(-Math.PI / 2);
    this.disposables.push(sheet);
    for (let offset = 9; offset < LOOP; offset += 12 + random() * 26) {
      const size = 1.2 + random() * 1.6;
      const hole = new Mesh(sheet, random() < 0.45 ? wet : dry);
      hole.scale.set(size * (0.8 + random() * 0.6), 1, size);
      hole.rotation.y = random() * Math.PI;
      hole.position.y = 0.02;
      hole.renderOrder = 4;
      const holder = new Group();
      holder.add(hole);
      this.group.add(holder);
      // Mostly in the wheel tracks and by the kerbs, either side of the road.
      const x =
        random() < 0.5 ? roadHalf - 0.6 - random() * 2 : -roadHalf - 0.8 - random() * (LANES - 1.6);
      this.props.push({ mesh: holder, offset, x });
    }
  }

  /**
   * The young men who dive off the Malecón: in swim trunks on the coping, then out in an arc,
   * arms up, head first into the sea, again and again. Each pair works its own stretch of wall.
   */
  private addDivers(roadHalf: number): void {
    const x = -roadHalf - LANES - PROMENADE - 0.35;
    const random = seeded(1439);
    const skin = this.material({ color: 0x6b4128, roughness: 0.7 });
    const torso = new CapsuleGeometry(0.16, 0.42, 3, 8);
    torso.translate(0, 1.15, 0);
    const head = new SphereGeometry(0.11, 10, 8);
    head.translate(0, 1.62, 0);
    const trunks = new CylinderGeometry(0.17, 0.16, 0.24, 10);
    trunks.translate(0, 0.86, 0);
    const legs: BufferGeometry[] = [];
    const arms: BufferGeometry[] = [];
    for (const side of [-0.09, 0.09]) {
      const leg = new CapsuleGeometry(0.065, 0.66, 3, 6);
      leg.translate(side, 0.42, 0);
      legs.push(leg);
      const arm = new CapsuleGeometry(0.045, 0.52, 3, 6);
      arm.translate(side * 2.3, 1.75, 0);
      arms.push(arm);
    }
    const bare = mergeGeometries([torso, head, ...legs, ...arms])!;
    [torso, head, ...legs, ...arms].forEach((g) => g.dispose());
    this.disposables.push(bare, trunks);
    const suits = [0xe63946, 0x1d70b8, 0x2a2a2a, 0xf1c40f];
    for (let k = 0, offset = 38; offset < LOOP; k++, offset += 110 + random() * 60) {
      const holder = new Group();
      for (const [dz, phase] of [
        [0, 0.15],
        [1.4, 0.55],
      ] as const) {
        const body = new Group();
        const person = new Mesh(bare, skin);
        person.castShadow = true;
        const suit = new Mesh(
          trunks,
          this.material({ color: suits[((k + dz) % 4) | 0]!, roughness: 0.7 }),
        );
        body.add(person, suit);
        body.position.z = -dz;
        const lane = new Group();
        lane.position.z = -dz;
        lane.add(body);
        holder.add(lane);
        this.divers.push({ body, phase: (phase + k * 0.3) % 1 });
      }
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    }
  }

  /**
   * A son trio playing for the passers-by on the promenade, in white guayaberas and straw hats:
   * a guitarist, a man shaking maracas, and a bongo player on a stool, the guitar's case open on
   * the ground before them for coins.
   */
  private addTrio(roadHalf: number): void {
    const trio = new Group();
    const white = this.material({ color: 0xf4f1ea, roughness: 0.85 });
    const slacks = this.material({ color: 0x2b2d42, roughness: 0.9 });
    const skin = this.material({ color: 0x6b4128, roughness: 0.8 });
    const straw = this.material({ color: 0xe8d8a8, roughness: 0.9 });
    const wood = this.material({ color: 0x9a5a2a, roughness: 0.5 });
    const dark = this.material({ color: 0x2a1a10, roughness: 0.6 });
    const torso = new CapsuleGeometry(0.18, 0.42, 3, 8);
    const leg = new CapsuleGeometry(0.075, 0.75, 3, 6);
    const arm = new CapsuleGeometry(0.05, 0.45, 3, 6);
    const head = new SphereGeometry(0.11, 10, 8);
    const brim = new CylinderGeometry(0.22, 0.22, 0.02, 12);
    const crown = new CylinderGeometry(0.1, 0.12, 0.1, 10);
    const ball = new SphereGeometry(0.06, 8, 6);
    const drum = new CylinderGeometry(0.11, 0.09, 0.22, 12);
    this.disposables.push(torso, leg, arm, head, brim, crown, ball, drum);
    const add = (
      g: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      rx = 0,
      rz = 0,
    ) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, 0, rz);
      mesh.castShadow = true;
      trio.add(mesh);
      return mesh;
    };
    const player = (x: number, z: number, seated: boolean) => {
      const hip = seated ? 0.5 : 0.88;
      for (const side of [-0.1, 0.1]) {
        if (seated) {
          add(leg, slacks, x + side, 0.48, z + 0.22, Math.PI / 2);
          add(leg, slacks, x + side, 0.25, z + 0.45);
        } else add(leg, slacks, x + side, 0.45, z);
      }
      add(torso, white, x, hip + 0.32, z);
      add(head, skin, x, hip + 0.8, z);
      add(brim, straw, x, hip + 0.9, z);
      add(crown, straw, x, hip + 0.96, z);
      return hip;
    };
    // The guitarist, the guitar across his body.
    const g = player(-0.9, 0, false);
    const guitar = add(head, wood, -0.85, g + 0.2, 0.2);
    guitar.scale.set(2.6, 3.4, 0.9);
    const neck = add(this.unit, dark, -0.6, g + 0.38, 0.22, 0, -1.0);
    neck.scale.set(0.05, 0.7, 0.04);
    add(arm, skin, -0.75, g + 0.25, 0.2, 1.2);
    add(arm, white, -1.08, g + 0.35, 0.12, 0.6);
    // The maraca player, both maracas up.
    const m = player(0, -0.2, false);
    for (const side of [-0.28, 0.28]) {
      add(arm, white, side, m + 0.62, -0.1, 0, side > 0 ? -0.5 : 0.5);
      add(ball, this.material({ color: 0xc8202f, roughness: 0.5 }), side * 1.5, m + 0.95, -0.1);
    }
    // The bongo player on his stool, the drums between his knees.
    const b = player(0.9, 0.1, true);
    const stool = add(drum, wood, 0.9, 0.22, 0.1);
    stool.scale.set(1.4, 2, 1.4);
    for (const side of [-0.1, 0.1]) add(drum, wood, 0.9 + side * 1.2, b + 0.08, 0.5);
    for (const side of [-0.22, 0.22]) add(arm, white, 0.9 + side, b + 0.3, 0.32, 0.9);
    // The open guitar case on the ground before them.
    const lid = add(this.unit, dark, 0, 0.06, 1.0);
    lid.scale.set(1.0, 0.1, 0.38);
    const lining = add(this.unit, this.material({ color: 0x8a1a2a, roughness: 0.9 }), 0, 0.1, 1.0);
    lining.scale.set(0.9, 0.04, 0.3);
    trio.rotation.y = -Math.PI / 2;
    trio.position.y = KERB;
    const holder = new Group();
    holder.add(trio);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 57, x: -roadHalf - LANES - 2.6 });
  }

  /**
   * A bus stop on the inland pavement: a concrete shelter on two steel posts with a bench under
   * it and a blue PARADA plate, and the little crowd that is always waiting at one, standing in
   * the shade or leaning on the posts.
   */
  private addBusStop(roadHalf: number): void {
    const random = seeded(1459);
    const stop = new Group();
    const concrete = this.material({ color: 0xd8d4cc, roughness: 0.9 });
    const steel = this.material({ color: 0x4a5a6a, roughness: 0.6, metalness: 0.4 });
    const plate = this.material({
      map: this.track(paradaTexture()),
      roughness: 0.6,
      side: DoubleSide,
    });
    const box = (
      m: MeshStandardMaterial,
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      stop.add(mesh);
      return mesh;
    };
    box(concrete, 1.8, 0.14, 5.0, 0.6, 2.6, 0);
    for (const z of [-2.1, 2.1]) box(steel, 0.1, 2.6, 0.1, 1.3, 1.3, z);
    box(concrete, 0.5, 0.08, 3.6, 1.2, 0.48, 0);
    box(steel, 0.06, 0.45, 0.06, 1.2, 0.24, 0);
    const sign = new Mesh(new PlaneGeometry(0.7, 0.45), plate);
    this.disposables.push(sign.geometry);
    sign.position.set(-0.2, 2.25, 2.4);
    stop.add(sign);
    const pole = box(steel, 0.05, 2.3, 0.05, -0.2, 1.15, 2.4);
    pole.castShadow = false;
    // The people waiting.
    const torso = new CapsuleGeometry(0.17, 0.42, 3, 8);
    const leg = new CapsuleGeometry(0.07, 0.75, 3, 6);
    const head = new SphereGeometry(0.11, 10, 8);
    this.disposables.push(torso, leg, head);
    const tops = [0xf2efe6, 0xe63946, 0x3a86ff, 0x2a9d8f, 0xf4a261, 0x8e44ad, 0xffd166];
    const bottoms = [0x2b2d42, 0x3a5a8a, 0x1a1a1a, 0xc8b89a];
    const skins = [0x8d5a3b, 0x6b4128, 0xc68b5e, 0xe0b08a, 0x4a2c1c];
    for (let i = 0; i < 7; i++) {
      const x = -0.2 + random() * 1.4;
      const z = -2.3 + i * 0.75 + random() * 0.3;
      const seated = i % 3 === 1;
      const material = (list: number[]) =>
        this.material({ color: list[Math.floor(random() * list.length)]!, roughness: 0.85 });
      const trousers = material(bottoms);
      for (const side of [-0.09, 0.09]) {
        const l = new Mesh(leg, trousers);
        if (seated) {
          l.rotation.z = Math.PI / 2;
          l.position.set(x - 0.3, 0.55, z + side);
        } else l.position.set(x, 0.45, z + side);
        stop.add(l);
      }
      const hip = seated ? 0.55 : 0.88;
      const t = new Mesh(torso, material(tops));
      t.position.set(seated ? 1.15 : x, hip + 0.32, z);
      t.castShadow = true;
      const h = new Mesh(head, material(skins));
      h.position.set(seated ? 1.15 : x, hip + 0.8, z);
      stop.add(t, h);
    }
    stop.position.y = KERB;
    const holder = new Group();
    holder.add(stop);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 46, x: roadHalf + 0.9 });
  }

  /**
   * Brown pelicans perched on the seawall's cap in little groups, as they do along the Malecón:
   * grey-brown bodies, white heads on long necks folded back, the long bill with its pouch laid
   * along the neck, each turned its own way, now and then one with its wings half open to dry.
   */
  private addPelicans(roadHalf: number): void {
    const random = seeded(1471);
    const body = new SphereGeometry(0.22, 12, 8);
    body.scale(1, 0.9, 1.9);
    const neck = new CapsuleGeometry(0.06, 0.28, 3, 8);
    const head = new SphereGeometry(0.075, 10, 8);
    const bill = new ConeGeometry(0.04, 0.42, 6);
    bill.rotateX(-Math.PI / 2);
    const pouch = new SphereGeometry(0.05, 8, 6);
    pouch.scale(0.8, 1, 3.4);
    const wing = new SphereGeometry(0.2, 10, 6);
    wing.scale(0.15, 0.6, 2.2);
    const leg = new CylinderGeometry(0.018, 0.018, 0.12, 5);
    this.disposables.push(body, neck, head, bill, pouch, wing, leg);
    const plumage = this.material({ color: 0x6e6a62, roughness: 0.9 });
    const back = this.material({ color: 0x4a4640, roughness: 0.9 });
    const white = this.material({ color: 0xf0ece0, roughness: 0.85 });
    const horn = this.material({ color: 0xc8a060, roughness: 0.6 });
    const dark = this.material({ color: 0x2a2620, roughness: 0.8 });
    const wall = -roadHalf - LANES - PROMENADE - 0.35;
    for (const offset of [53, 62, 140, 236, 300]) {
      const flock = new Group();
      const count = 2 + Math.floor(random() * 3);
      for (let k = 0; k < count; k++) {
        const bird = new Group();
        const part = (
          g: BufferGeometry,
          m: MeshStandardMaterial,
          x: number,
          y: number,
          z: number,
          rx = 0,
        ) => {
          const mesh = new Mesh(g, m);
          mesh.position.set(x, y, z);
          mesh.rotation.x = rx;
          mesh.castShadow = true;
          bird.add(mesh);
          return mesh;
        };
        part(body, plumage, 0, 0.3, 0.05, -0.25);
        part(neck, white, 0, 0.55, -0.22, 0.35);
        part(head, white, 0, 0.74, -0.3);
        part(bill, horn, 0, 0.66, -0.52, 0.5);
        part(pouch, dark, 0, 0.6, -0.46, 0.5);
        const open = random() < 0.25;
        for (const side of [-1, 1]) {
          const w = part(wing, back, side * 0.2, 0.36, 0.1, -0.2);
          if (open) {
            w.rotation.z = side * 1.1;
            w.position.set(side * 0.42, 0.5, 0.05);
          }
          part(leg, dark, side * 0.07, 0.06, 0.05);
        }
        bird.position.set((random() - 0.5) * 0.25, 0, k * 0.9 + random() * 0.5);
        bird.rotation.y = random() * Math.PI * 2;
        bird.scale.setScalar(1.1 + random() * 0.2);
        flock.add(bird);
      }
      flock.position.y = WALL;
      const holder = new Group();
      holder.add(flock);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: wall });
    }
  }

  /**
   * The street furniture of the inland kerb: squat red fire hydrants with their caps and chains,
   * and the big green wheeled rubbish containers, lids half open and a bag or two beside them,
   * standing at the pavement's edge every so often.
   */
  private addKerbside(roadHalf: number): void {
    const random = seeded(1481);
    const red = this.material({ color: 0xb8241c, roughness: 0.55, metalness: 0.2 });
    const cap = this.material({ color: 0xd8d0b0, roughness: 0.5, metalness: 0.3 });
    const green = this.material({ color: 0x2f6a3a, roughness: 0.7 });
    const grime = this.material({ color: 0x3a4a34, roughness: 0.9 });
    const black = this.material({ color: 0x1a1a1a, roughness: 0.8 });
    const bags = [0x1a1a1a, 0x2a3a6a, 0xd8d8d0];
    const barrel = new CylinderGeometry(0.13, 0.15, 0.62, 12);
    const dome = new SphereGeometry(0.13, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const nozzle = new CylinderGeometry(0.055, 0.055, 0.14, 8);
    nozzle.rotateZ(Math.PI / 2);
    const wheel = new CylinderGeometry(0.1, 0.1, 0.06, 10);
    wheel.rotateZ(Math.PI / 2);
    const bag = new SphereGeometry(0.28, 8, 6);
    bag.scale(1, 0.8, 1);
    this.disposables.push(barrel, dome, nozzle, wheel, bag);
    const place = (thing: Group, offset: number, x: number) => {
      thing.position.y = KERB;
      const holder = new Group();
      holder.add(thing);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    };
    for (let offset = 31; offset < LOOP; offset += 40 + random() * 50) {
      const hydrant = new Group();
      const body = new Mesh(barrel, red);
      body.position.y = 0.31;
      const top = new Mesh(dome, red);
      top.position.y = 0.62;
      const nut = new Mesh(nozzle, cap);
      nut.scale.set(0.5, 0.5, 0.5);
      nut.rotation.z = Math.PI / 2;
      nut.position.y = 0.76;
      const base = new Mesh(this.unit, red);
      base.scale.set(0.36, 0.06, 0.36);
      base.position.y = 0.03;
      hydrant.add(body, top, nut, base);
      for (const side of [-1, 1]) {
        const out = new Mesh(nozzle, cap);
        out.position.set(side * 0.17, 0.45, 0);
        hydrant.add(out);
      }
      hydrant.traverse((o) => (o.castShadow = true));
      hydrant.rotation.y = random() * Math.PI;
      place(hydrant, offset, roadHalf + 0.45);
    }
    for (let offset = 44; offset < LOOP; offset += 55 + random() * 70) {
      const bin = new Group();
      const box = new Mesh(this.unit, random() < 0.3 ? grime : green);
      box.scale.set(1.3, 1.15, 1.0);
      box.position.y = 0.72;
      const lid = new Mesh(this.unit, green);
      lid.scale.set(1.36, 0.06, 1.06);
      const ajar = random() < 0.5;
      lid.position.set(0, 1.32 + (ajar ? 0.2 : 0), ajar ? 0.25 : 0);
      lid.rotation.x = ajar ? -0.45 : 0;
      bin.add(box, lid);
      for (const x of [-0.5, 0.5]) {
        for (const z of [-0.38, 0.38]) {
          const w = new Mesh(wheel, black);
          w.position.set(x, 0.1, z);
          bin.add(w);
        }
      }
      const spill = Math.floor(random() * 3);
      for (let k = 0; k < spill; k++) {
        const b = new Mesh(bag, this.material({ color: bags[k % bags.length]!, roughness: 0.4 }));
        b.position.set(-0.4 + k * 0.6, 0.22, 0.85);
        bin.add(b);
      }
      bin.traverse((o) => (o.castShadow = true));
      bin.rotation.y = Math.PI / 2 + (random() - 0.5) * 0.3;
      place(bin, offset, roadHalf + 0.9);
    }
  }

  /** Cast-iron drain grates set into the gutter at the kerb's foot, every 25 to 45 m. */
  private addGrates(roadHalf: number): void {
    const random = seeded(1499);
    const iron = this.material({ map: this.track(grateTexture()), roughness: 0.7, metalness: 0.4 });
    const sheet = new PlaneGeometry(0.5, 0.9);
    sheet.rotateX(-Math.PI / 2);
    this.disposables.push(sheet);
    for (let offset = 33; offset < LOOP; offset += 25 + random() * 20) {
      const grate = new Mesh(sheet, iron);
      grate.position.set(-0.26, 0.018, 0);
      grate.renderOrder = 3;
      const holder = new Group();
      holder.add(grate);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf });
    }
  }

  /**
   * Older Habaneros sitting out under the arcade in wooden rocking chairs (sillones), as they do
   * through the afternoon: a chair of dark turned wood with its cane seat and back on curved
   * rockers, and its sitter, grey-haired, leaning back with hands in the lap; some chairs empty.
   */
  private addRockers(roadHalf: number): void {
    const random = seeded(1549);
    const wood = this.material({ color: 0x4a2a18, roughness: 0.6 });
    const cane = this.material({ color: 0xc8a870, roughness: 0.9 });
    const rocker = new TorusGeometry(0.6, 0.025, 4, 16, 0.9);
    rocker.rotateY(Math.PI / 2);
    rocker.rotateX(Math.PI / 2 - 0.45);
    const torso = new CapsuleGeometry(0.17, 0.38, 3, 8);
    const limb = new CapsuleGeometry(0.065, 0.4, 3, 6);
    const head = new SphereGeometry(0.11, 10, 8);
    this.disposables.push(rocker, torso, limb, head);
    const tops = [0xf2efe6, 0xd8e8f0, 0xe8c8b0, 0x8ab0c8, 0xf0e0a0];
    const skins = [0x8d5a3b, 0x6b4128, 0xc68b5e, 0x4a2c1c];
    const greys = [0xd8d8d4, 0xb8b8b4, 0xe8e8e4];
    for (let offset = 34; offset < LOOP; offset += 9 + random() * 22) {
      const chair = new Group();
      const box = (
        m: MeshStandardMaterial,
        sx: number,
        sy: number,
        sz: number,
        x: number,
        y: number,
        z: number,
        rx = 0,
      ) => {
        const mesh = new Mesh(this.unit, m);
        mesh.scale.set(sx, sy, sz);
        mesh.position.set(x, y, z);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        chair.add(mesh);
        return mesh;
      };
      for (const x of [-0.26, 0.26]) {
        const r = new Mesh(rocker, wood);
        r.position.set(x, 0.6, 0.05);
        chair.add(r);
        box(wood, 0.04, 0.45, 0.04, x, 0.28, -0.22);
        box(wood, 0.04, 1.05, 0.04, x, 0.55, 0.22, 0.25);
        box(wood, 0.04, 0.04, 0.5, x, 0.68, -0.02);
      }
      box(cane, 0.5, 0.04, 0.46, 0, 0.47, 0);
      box(cane, 0.5, 0.6, 0.03, 0, 0.82, 0.3, 0.25);
      if (random() < 0.75) {
        const skin = this.material({
          color: skins[Math.floor(random() * skins.length)]!,
          roughness: 0.8,
        });
        const top = this.material({
          color: tops[Math.floor(random() * tops.length)]!,
          roughness: 0.85,
        });
        const trousers = this.material({
          color: random() < 0.5 ? 0x5a5a5a : 0xc8b89a,
          roughness: 0.9,
        });
        const t = new Mesh(torso, top);
        t.position.set(0, 0.82, 0.1);
        t.rotation.x = 0.22;
        const h = new Mesh(head, skin);
        h.position.set(0, 1.28, 0.2);
        const hair = new Mesh(
          head,
          this.material({ color: greys[Math.floor(random() * greys.length)]!, roughness: 0.95 }),
        );
        hair.scale.set(1.05, 0.6, 1.05);
        hair.position.set(0, 1.33, 0.22);
        chair.add(t, h, hair);
        for (const side of [-0.1, 0.1]) {
          const thigh = new Mesh(limb, trousers);
          thigh.rotation.x = Math.PI / 2;
          thigh.position.set(side, 0.55, -0.18);
          const shin = new Mesh(limb, trousers);
          shin.position.set(side, 0.28, -0.42);
          const arm = new Mesh(limb, skin);
          arm.scale.setScalar(0.8);
          arm.rotation.x = 0.9;
          arm.position.set(side * 2.2, 0.75, -0.05);
          for (const m of [thigh, shin, arm]) m.castShadow = true;
          chair.add(thigh, shin, arm);
        }
      }
      // Facing the street, turned a little this way or that.
      chair.rotation.y = -Math.PI / 2 + (random() - 0.5) * 0.8;
      chair.position.set(0, KERB, 0);
      const holder = new Group();
      holder.add(chair);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 4 + ARCADE * (0.45 + random() * 0.3) });
    }
  }

  /**
   * A domino game on the pavement at the arcade's edge: four men on stools round a square
   * folding table, the white tiles laid out in their snaking line and each player's hand stood on
   * edge before him, one slapping a tile down, and a couple of onlookers standing over them.
   */
  private addDominoes(roadHalf: number): void {
    const random = seeded(1553);
    const game = new Group();
    const wood = this.material({ color: 0x7a5a3a, roughness: 0.7 });
    const top = this.material({ color: 0x2a5a3a, roughness: 0.8 });
    const ivory = this.material({ color: 0xf4f0e4, roughness: 0.4 });
    const torso = new CapsuleGeometry(0.18, 0.4, 3, 8);
    const limb = new CapsuleGeometry(0.065, 0.42, 3, 6);
    const head = new SphereGeometry(0.11, 10, 8);
    const stool = new CylinderGeometry(0.18, 0.16, 0.45, 10);
    const cap = new CylinderGeometry(0.12, 0.12, 0.06, 10);
    this.disposables.push(torso, limb, head, stool, cap);
    const shirts = [0xf2efe6, 0xe63946, 0x3a86ff, 0x2a9d8f, 0xf4a261, 0x8ab0c8];
    const skins = [0x8d5a3b, 0x6b4128, 0xc68b5e, 0x4a2c1c];
    const box = (
      m: MeshStandardMaterial,
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      game.add(mesh);
      return mesh;
    };
    // The table, its legs and the green baize-painted top.
    box(top, 0.9, 0.04, 0.9, 0, 0.74, 0);
    for (const x of [-0.38, 0.38])
      for (const z of [-0.38, 0.38]) box(wood, 0.05, 0.72, 0.05, x, 0.36, z);
    // The line of play snaking across the table.
    let x = -0.3;
    let z = -0.05;
    for (let k = 0; k < 11; k++) {
      const tile = box(
        ivory,
        k % 4 === 3 ? 0.05 : 0.1,
        0.018,
        k % 4 === 3 ? 0.1 : 0.05,
        x,
        0.77,
        z,
      );
      tile.castShadow = false;
      if (k % 4 === 3) z += 0.08;
      else x += k < 6 ? 0.1 : -0.1;
    }
    // The four players, each on his stool facing the table, his tiles stood before him.
    const pick = (list: number[], roughness = 0.85) =>
      this.material({ color: list[Math.floor(random() * list.length)]!, roughness });
    for (let p = 0; p < 4; p++) {
      const turn = (p * Math.PI) / 2;
      const seat = new Group();
      const skin = pick(skins, 0.8);
      const add = (
        g: BufferGeometry,
        m: MeshStandardMaterial,
        px: number,
        py: number,
        pz: number,
        rx = 0,
      ) => {
        const mesh = new Mesh(g, m);
        mesh.position.set(px, py, pz);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        seat.add(mesh);
        return mesh;
      };
      add(stool, wood, 0, 0.22, 0.75);
      const trousers = pick([0x2b2d42, 0x5a5a5a, 0xc8b89a]);
      for (const side of [-0.1, 0.1]) {
        add(limb, trousers, side, 0.5, 0.55, Math.PI / 2);
        add(limb, trousers, side, 0.25, 0.32);
      }
      add(torso, pick(shirts), 0, 0.92, 0.7, -0.2);
      add(head, skin, 0, 1.38, 0.62);
      if (random() < 0.5) add(cap, pick([0xe8d8a8, 0x1a1a1a, 0xf2f2ee]), 0, 1.48, 0.62);
      const slap = p === 1;
      add(limb, skin, -0.24, 0.92, 0.42, slap ? 1.9 : 1.2);
      add(limb, skin, 0.24, 0.92, 0.42, 1.2);
      for (let t = 0; t < 4; t++) {
        const tile = new Mesh(this.unit, ivory);
        tile.scale.set(0.05, 0.1, 0.018);
        tile.position.set(-0.11 + t * 0.07, 0.81, 0.32);
        seat.add(tile);
      }
      seat.rotation.y = turn;
      game.add(seat);
    }
    // Onlookers standing over the game.
    for (const [ox, oz] of [
      [0.95, 0.9],
      [-0.9, 1.1],
    ] as const) {
      const skin = pick(skins, 0.8);
      const legs = pick([0x2b2d42, 0x3a5a8a, 0xc8b89a]);
      for (const side of [-0.09, 0.09]) {
        const leg = new Mesh(limb, legs);
        leg.scale.y = 1.6;
        leg.position.set(ox + side, 0.46, oz);
        game.add(leg);
      }
      const body = new Mesh(torso, pick(shirts));
      body.position.set(ox, 1.2, oz);
      const face = new Mesh(head, skin);
      face.position.set(ox, 1.68, oz - 0.04);
      for (const m of [body, face]) m.castShadow = true;
      game.add(body, face);
    }
    game.rotation.y = 0.3;
    game.position.y = KERB;
    const holder = new Group();
    holder.add(game);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 39, x: roadHalf + 2.9 });
  }

  /**
   * Road signs on the inland kerb, facing the riders: round speed-limit 50s and no-parking
   * discs, some faded by the sun, on grey posts, one or two to a post.
   */
  private addSigns(roadHalf: number): void {
    const random = seeded(1571);
    const faces = [this.track(signTexture('limit')), this.track(signTexture('parking'))];
    const disc = new CircleGeometry(0.3, 24);
    const back = new CircleGeometry(0.3, 24);
    back.rotateY(Math.PI);
    this.disposables.push(disc, back);
    const grey = this.material({ color: 0x8a8e92, roughness: 0.5, metalness: 0.5 });
    for (let offset = 36; offset < LOOP; offset += 60 + random() * 70) {
      const post = new Group();
      const pole = new Mesh(this.unit, grey);
      pole.scale.set(0.06, 2.6, 0.06);
      pole.position.y = 1.3;
      pole.castShadow = true;
      post.add(pole);
      const two = random() < 0.35;
      const first = Math.floor(random() * 2);
      for (let k = 0; k < (two ? 2 : 1); k++) {
        const kind = (first + k) % 2;
        const faded = random() < 0.4;
        const face = new Mesh(
          disc,
          this.material({ map: faces[kind]!, roughness: 0.6, color: faded ? 0xe8d8d0 : 0xffffff }),
        );
        face.position.set(0, 2.3 - k * 0.66, 0.05);
        const rear = new Mesh(back, grey);
        rear.position.set(0, 2.3 - k * 0.66, 0.04);
        face.castShadow = true;
        post.add(face, rear);
      }
      post.rotation.y = 0.15;
      post.position.y = KERB;
      const holder = new Group();
      holder.add(post);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 0.3 });
    }
  }

  /**
   * People crossing at the zebra crossings: one to three at each, walking from one kerb over both
   * carriageways to the other and back, each at their own pace, some from the sea side.
   */
  private addCrossers(roadHalf: number): void {
    const random = seeded(1579);
    for (const offset of this.crossings) {
      const count = 1 + Math.floor(random() * 3);
      for (let k = 0; k < count; k++) {
        const inland = random() < 0.6;
        const near = roadHalf + 0.6;
        const far = -roadHalf - LANES - 0.6;
        this.crossers.push({
          offset: offset + CROSS / 2 + (random() - 0.5) * 2.6,
          phase: random(),
          period: 26 + random() * 14,
          from: inland ? near : far,
          to: inland ? far : near,
        });
      }
    }
    this.crowd = new Walkers(
      this.group,
      this.disposables,
      this.crossers.length,
      STROLL_WEAR,
      1583,
      this.crossers.map(() => 1),
    );
  }

  /**
   * Havana's street cats: sitting upright by the arcade piers with their tails curled round,
   * or lying stretched out in the shade, and a few on the seawall's cap; ginger, black, grey
   * tabby or white with patches.
   */
  private addCats(roadHalf: number): void {
    const random = seeded(1609);
    const body = new SphereGeometry(0.1, 10, 8);
    body.scale(1, 1, 2);
    const head = new SphereGeometry(0.065, 10, 8);
    const ear = new ConeGeometry(0.025, 0.05, 4);
    const tail = new TorusGeometry(0.12, 0.015, 4, 10, Math.PI);
    const leg = new CylinderGeometry(0.018, 0.016, 0.14, 5);
    this.disposables.push(body, head, ear, tail, leg);
    const coats = [0xd0802a, 0x1a1a1a, 0x7a7670, 0xe8e4dc, 0x9a6a3a];
    const wall = -roadHalf - LANES - PROMENADE - 0.35;
    for (let n = 0; n < 16; n++) {
      const cat = new Group();
      const coat = this.material({
        color: coats[Math.floor(random() * coats.length)]!,
        roughness: 0.95,
      });
      const part = (g: BufferGeometry, x: number, y: number, z: number, rx = 0) => {
        const mesh = new Mesh(g, coat);
        mesh.position.set(x, y, z);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        cat.add(mesh);
        return mesh;
      };
      const sitting = random() < 0.6;
      if (sitting) {
        // Upright on its haunches, front legs straight, tail round its feet.
        part(body, 0, 0.17, 0.02, -1.1);
        part(head, 0, 0.33, -0.05);
        for (const side of [-0.035, 0.035]) {
          part(ear, side, 0.39, -0.05);
          part(leg, side, 0.07, -0.07);
        }
        part(tail, 0, 0.02, 0.02, Math.PI / 2);
      } else {
        // Stretched out on its side in the shade.
        part(body, 0, 0.09, 0, 0).scale.set(1.1, 0.8, 1.1);
        part(head, 0, 0.1, -0.24);
        for (const side of [-0.035, 0.035]) part(ear, side, 0.16, -0.25);
        const t = part(tail, 0.05, 0.03, 0.25, Math.PI / 2);
        t.rotation.z = 1.2;
      }
      cat.rotation.y = random() * Math.PI * 2;
      const onWall = n % 4 === 3;
      cat.position.y = onWall ? WALL : KERB;
      const holder = new Group();
      holder.add(cat);
      this.group.add(holder);
      const offset = n === 0 ? 29.5 : 20 + random() * (LOOP - 30);
      this.props.push({
        mesh: holder,
        offset,
        x: onWall ? wall : roadHalf + (n === 0 ? 1.7 : 1.4 + random() * 2.4),
      });
    }
  }

  /**
   * The people in a car: the driver at the wheel on the left, sometimes a passenger beside, and
   * now and then someone in the back, a torso and head seen through the glass. `front` is the
   * car's local z at the front seats, `seat` the height of their hips.
   */
  private occupy(
    car: Group,
    random: () => number,
    front: number,
    seat: number,
    width: number,
  ): void {
    if (!this.riders) {
      const torso = new CapsuleGeometry(0.17, 0.3, 3, 8);
      const head = new SphereGeometry(0.11, 10, 8);
      this.disposables.push(torso, head);
      this.riders = {
        torso,
        head,
        shirts: [0xf2efe6, 0xe63946, 0x3a86ff, 0x2a9d8f, 0xffd166, 0x1a1a1a].map((c) =>
          this.material({ color: c, roughness: 0.85 }),
        ),
        skins: [0x8d5a3b, 0x6b4128, 0xc68b5e, 0x4a2c1c].map((c) =>
          this.material({ color: c, roughness: 0.8 }),
        ),
      };
    }
    const { torso, head, shirts, skins } = this.riders;
    const seats: [number, number][] = [[-width, front]];
    if (random() < 0.55) seats.push([width, front]);
    if (random() < 0.3) seats.push([width * (random() < 0.5 ? -1 : 1), front + 0.95]);
    for (const [x, z] of seats) {
      const body = new Mesh(torso, shirts[Math.floor(random() * shirts.length)]!);
      body.position.set(x, seat + 0.3, z);
      const face = new Mesh(head, skins[Math.floor(random() * skins.length)]!);
      face.position.set(x, seat + 0.68, z - 0.02);
      car.add(body, face);
    }
  }

  private riders?: {
    torso: CapsuleGeometry;
    head: SphereGeometry;
    shirts: MeshStandardMaterial[];
    skins: MeshStandardMaterial[];
  };

  /**
   * A carretillero's barrow at the kerb, piled with fruit for sale: pineapples with their spiky
   * crowns, hands of bananas, mangoes, papayas cut open, on a wooden tray on two bicycle wheels,
   * shaded by a scrap of sacking; the vendor stands at the handles in a straw hat.
   */
  private addFruitCart(roadHalf: number): void {
    const random = seeded(1657);
    const cart = new Group();
    const wood = this.material({ color: 0x8a6440, roughness: 0.9 });
    const sacking = this.material({ color: 0xc8b088, roughness: 1, side: DoubleSide });
    const tyre = this.material({ color: 0x1a1a1a, roughness: 0.8 });
    const box = (
      m: MeshStandardMaterial,
      sx: number,
      sy: number,
      sz: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      cart.add(mesh);
      return mesh;
    };
    box(wood, 0.9, 0.08, 1.6, 0, 0.8, 0);
    for (const x of [-0.45, 0.45]) box(wood, 0.04, 0.16, 1.6, x, 0.9, 0);
    for (const z of [-0.8, 0.8]) box(wood, 0.9, 0.16, 0.04, 0, 0.9, z);
    for (const x of [-0.35, 0.35]) box(wood, 0.05, 0.05, 0.8, x, 0.85, 1.15);
    const wheel = new TorusGeometry(0.32, 0.03, 6, 20);
    wheel.rotateY(Math.PI / 2);
    this.disposables.push(wheel);
    for (const x of [-0.5, 0.5]) {
      const w = new Mesh(wheel, tyre);
      w.position.set(x, 0.32, -0.2);
      cart.add(w);
    }
    for (const x of [-0.42, 0.42]) {
      box(wood, 0.04, 0.9, 0.04, x, 1.3, -0.75);
      box(wood, 0.04, 0.9, 0.04, x, 1.3, 0.75);
    }
    const shade = box(sacking, 1.0, 0.02, 1.7, 0, 1.76, 0);
    shade.rotation.x = 0.06;
    // The fruit, heaped on the tray.
    const pine = new SphereGeometry(0.09, 8, 6);
    pine.scale(1, 1.5, 1);
    const crown = new ConeGeometry(0.06, 0.16, 6);
    const mango = new SphereGeometry(0.06, 8, 6);
    mango.scale(1, 0.8, 1.3);
    const banana = new CapsuleGeometry(0.025, 0.16, 3, 6);
    const papaya = new SphereGeometry(0.1, 10, 8);
    papaya.scale(1, 1, 1.7);
    this.disposables.push(pine, crown, mango, banana, papaya);
    const gold = this.material({ color: 0xb08a2a, roughness: 0.9 });
    const leaf = this.material({ color: 0x3f6a2a, roughness: 0.8 });
    const yellow = this.material({ color: 0xf0d040, roughness: 0.7 });
    const mangoes = [0xe8a030, 0xd84a28, 0x9ab040].map((c) =>
      this.material({ color: c, roughness: 0.6 }),
    );
    const flesh = this.material({ color: 0xf07040, roughness: 0.7 });
    const add = (
      g: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      rz = 0,
    ) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rz;
      mesh.castShadow = true;
      cart.add(mesh);
    };
    for (let k = 0; k < 4; k++) {
      const z = -0.6 + k * 0.17;
      add(pine, gold, -0.25, 0.98, z);
      add(crown, leaf, -0.25, 1.18, z);
    }
    for (let k = 0; k < 14; k++) {
      add(
        mango,
        mangoes[k % 3]!,
        0.05 + random() * 0.3,
        0.9 + random() * 0.08,
        -0.65 + random() * 0.6,
      );
    }
    for (let h = 0; h < 3; h++) {
      for (let k = 0; k < 5; k++)
        add(banana, yellow, -0.25 + k * 0.05, 0.92 + h * 0.03, 0.15 + h * 0.18, 0.5 - k * 0.15);
    }
    add(papaya, flesh, 0.2, 0.95, 0.35);
    add(papaya, leaf, 0.22, 0.95, 0.6);
    // The vendor at the handles.
    const skin = this.material({ color: 0x6b4430, roughness: 0.8 });
    const shirt = this.material({ color: 0xc83a3a, roughness: 0.85 });
    const trousers = this.material({ color: 0x3a3a3a, roughness: 0.9 });
    const straw = this.material({ color: 0xd8c08a, roughness: 0.95 });
    const torso = new CapsuleGeometry(0.17, 0.42, 3, 8);
    const head = new SphereGeometry(0.11, 10, 8);
    const leg = new CapsuleGeometry(0.07, 0.62, 3, 6);
    const brim = new CylinderGeometry(0.24, 0.24, 0.02, 14);
    this.disposables.push(torso, head, leg, brim);
    for (const x of [-0.1, 0.1]) add(leg, trousers, x, 0.4, 1.75);
    add(torso, shirt, 0, 1.05, 1.75);
    add(head, skin, 0, 1.5, 1.75);
    add(brim, straw, 0, 1.6, 1.75);
    const holder = new Group();
    cart.position.y = KERB;
    holder.add(cart);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 34.2, x: roadHalf + 1.15 });
  }

  /**
   * Shop signs hung out from the arcade's front on iron brackets, painted boards facing along the
   * street: a state bodega, a pharmacy with its green cross, a café, a barber's.
   */
  private addShopSigns(roadHalf: number): void {
    const iron = this.material({ color: 0x1e1e1e, roughness: 0.6, metalness: 0.4 });
    const board = new PlaneGeometry(1.1, 0.62);
    this.disposables.push(board);
    const kinds = ['bodega', 'farmacia', 'cafe', 'barberia'] as const;
    const faces = kinds.map((k) =>
      this.material({ map: this.track(shopSignTexture(k)), roughness: 0.8, side: DoubleSide }),
    );
    [33.5, 58, 84, 121, 167, 214, 262, 318].forEach((offset, i) => {
      const sign = new Group();
      const face = new Mesh(board, faces[i % faces.length]!);
      face.position.set(-0.75, PORTAL - 0.75, 0);
      face.castShadow = true;
      const arm = new Mesh(this.unit, iron);
      arm.scale.set(1.5, 0.04, 0.04);
      arm.position.set(-0.75, PORTAL - 0.38, 0);
      sign.add(face, arm);
      for (const x of [-1.2, -0.3]) {
        const chain = new Mesh(this.unit, iron);
        chain.scale.set(0.015, 0.12, 0.015);
        chain.position.set(x, PORTAL - 0.42, 0);
        sign.add(chain);
      }
      this.group.add(sign);
      this.props.push({ mesh: sign, offset, x: roadHalf + 4.1 });
    });
  }

  private readonly runners: { limbs: Mesh[]; phase: number }[] = [];

  /**
   * Joggers on the inland pavement, out for the cool of the evening: running kit, trainers, a
   * cap on one, arms bent and legs swinging in stride, one coming on and one going away.
   */
  private addJoggers(roadHalf: number): void {
    const skin = [0x6b4430, 0xd8a882];
    const tops = [0xff5a36, 0x2a9df4];
    const torso = new CapsuleGeometry(0.15, 0.36, 3, 8);
    const head = new SphereGeometry(0.105, 10, 8);
    const leg = new CapsuleGeometry(0.065, 0.62, 3, 6);
    const arm = new CapsuleGeometry(0.045, 0.36, 3, 6);
    const shoe = new BoxGeometry(0.11, 0.08, 0.26);
    leg.translate(0, -0.4, 0);
    arm.translate(0, -0.22, 0);
    shoe.translate(0, -0.8, -0.04);
    this.disposables.push(torso, head, leg, arm, shoe);
    const shorts = this.material({ color: 0x1d1f24, roughness: 0.8 });
    const trainer = this.material({ color: 0xf4f4f4, roughness: 0.6 });
    [
      [29, roadHalf + 0.95, -2.3, Math.PI],
      [75, roadHalf + 1.5, 2.6, 0],
    ].forEach(([offset, x, speed, turn], i) => {
      const body = new Group();
      const top = this.material({ color: tops[i]!, roughness: 0.7 });
      const flesh = this.material({ color: skin[i]!, roughness: 0.8 });
      const chest = new Mesh(torso, top);
      chest.position.y = 1.12;
      chest.rotation.x = -0.15;
      const face = new Mesh(head, flesh);
      face.position.set(0, 1.55, -0.05);
      body.add(chest, face);
      const limbs: Mesh[] = [];
      for (const side of [-0.1, 0.1]) {
        const thigh = new Mesh(leg, shorts);
        thigh.position.set(side, 0.86, 0);
        thigh.add(new Mesh(shoe, trainer));
        const sleeve = new Mesh(arm, flesh);
        sleeve.position.set(side * 2.1, 1.36, 0);
        body.add(thigh, sleeve);
        limbs.push(thigh, sleeve);
      }
      if (i === 0) {
        const cap = new Mesh(head, top);
        cap.scale.set(1.05, 0.5, 1.05);
        cap.position.set(0, 1.6, -0.05);
        body.add(cap);
      }
      body.traverse((m) => (m.castShadow = true));
      body.rotation.y = turn!;
      body.position.y = KERB;
      const holder = new Group();
      holder.position.x = x!;
      holder.add(body);
      this.group.add(holder);
      this.cars.push({ mesh: holder, offset: offset!, speed: speed! });
      this.runners.push({ limbs, phase: 1.3 + i * 1.7 });
    });
  }

  /**
   * A boy flying a papalote from the promenade by the wall: a diamond kite of paper in bright
   * panels on a cross of sticks, its long tail of knotted rag bows, riding high over the sea at
   * the end of a long string that sags back down to his raised hand.
   */
  private addKite(roadHalf: number): void {
    const flight = new Group();
    const boy = new Group();
    const skin = this.material({ color: 0x6b4430, roughness: 0.8 });
    const shirt = this.material({ color: 0xf2d040, roughness: 0.85 });
    const shorts = this.material({ color: 0x2a5a9a, roughness: 0.85 });
    const torso = new CapsuleGeometry(0.12, 0.28, 3, 8);
    const head = new SphereGeometry(0.09, 10, 8);
    const limb = new CapsuleGeometry(0.04, 0.32, 3, 6);
    this.disposables.push(torso, head, limb);
    const add = (
      g: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      rz = 0,
    ) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rz;
      mesh.castShadow = true;
      boy.add(mesh);
    };
    for (const z of [-0.07, 0.07]) add(limb, skin, 0, 0.28, z);
    add(torso, shorts, 0, 0.55, 0);
    add(torso, shirt, 0, 0.78, 0);
    add(head, skin, 0, 1.12, 0);
    add(limb, skin, -0.16, 1.1, 0.1, 0.8);
    add(limb, skin, 0, 0.75, -0.16);
    boy.position.y = KERB;
    flight.add(boy);
    // The kite, high over the sea ahead, tilted into the wind.
    const hand = new Vector3(-0.3, KERB + 1.28, 0.1);
    const kitePoint = new Vector3(-3, 19, -46);
    const sail = new BufferGeometry().setFromPoints([
      new Vector3(0, 0.75, 0),
      new Vector3(-0.5, 0.15, 0),
      new Vector3(0, -0.85, 0),
      new Vector3(0, 0.75, 0),
      new Vector3(0, -0.85, 0),
      new Vector3(0.5, 0.15, 0),
    ]);
    sail.setAttribute(
      'uv',
      new BufferAttribute(new Float32Array([0.5, 1, 0, 0.6, 0.5, 0, 0.5, 1, 0.5, 0, 1, 0.6]), 2),
    );
    sail.computeVertexNormals();
    this.disposables.push(sail);
    const kite = new Mesh(
      sail,
      new MeshBasicMaterial({ map: this.track(kiteTexture()), side: DoubleSide, fog: false }),
    );
    this.disposables.push(kite.material as MeshBasicMaterial);
    kite.scale.setScalar(2);
    kite.position.copy(kitePoint);
    kite.rotation.set(-0.3, 0.6, 0.25);
    flight.add(kite);
    // Its tail: rag bows knotted along a string hanging and curling off downwind.
    const bow = new BoxGeometry(0.28, 0.08, 0.02);
    this.disposables.push(bow);
    const rags = [0xe8302a, 0xf2f2ea, 0x2a5ad8].map(
      (c) => new MeshBasicMaterial({ color: c, side: DoubleSide, fog: false }),
    );
    this.disposables.push(...rags);
    const line = new MeshBasicMaterial({ color: 0x3a3a3a, fog: false });
    this.disposables.push(line);
    const tail: Vector3[] = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      tail.push(
        new Vector3(
          kitePoint.x + Math.sin(t * 3) * 0.8,
          kitePoint.y - 1.1 - t * 4.2,
          kitePoint.z + t * 1.2,
        ),
      );
      if (k > 0) {
        const knot = new Mesh(bow, rags[k % 3]!);
        knot.position.copy(tail[k]!);
        knot.rotation.set(0, 0.6, Math.sin(k) * 0.6);
        flight.add(knot);
      }
    }
    const tailString = new TubeGeometry(new CatmullRomCurve3(tail), 20, 0.015, 3);
    // The flying line, sagging in a long curve back to the boy's hand.
    const sagging: Vector3[] = [];
    for (let k = 0; k <= 20; k++) {
      const t = k / 20;
      const p = hand.clone().lerp(kitePoint, t);
      p.y -= 3.5 * Math.sin(t * Math.PI) * (1 - t * 0.4);
      sagging.push(p);
    }
    const flying = new TubeGeometry(new CatmullRomCurve3(sagging), 40, 0.012, 3);
    this.disposables.push(tailString, flying);
    flight.add(new Mesh(tailString, line), new Mesh(flying, line));
    const holder = new Group();
    holder.add(flight);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 52, x: -roadHalf - LANES - PROMENADE + 0.8 });
  }

  /**
   * Litter gathered in both gutters against the kerb: scraps of white and brown paper, flattened
   * cans, bottle caps and dry almond leaves, in fifteen-metre stretches, each one instanced.
   */
  private addLitter(roadHalf: number): void {
    const random = seeded(1681);
    const scrap = new PlaneGeometry(1, 1);
    scrap.rotateX(-Math.PI / 2);
    this.disposables.push(scrap);
    const paint = new MeshStandardMaterial({ roughness: 0.9, side: DoubleSide });
    this.disposables.push(paint);
    const colours = [
      0xf2efe6, 0xe8e2d0, 0xb89a6a, 0xa8702a, 0xc84a2a, 0x8a9aa8, 0x6a7a3a, 0xc8b048,
    ];
    const matrix = new Matrix4();
    const turn = new Matrix4();
    const colour = new Color();
    for (let offset = 0; offset < LOOP; offset += 15) {
      const count = 48;
      const pieces = new InstancedMesh(scrap, paint, count);
      for (let i = 0; i < count; i++) {
        const right = i % 2 === 0;
        const kind = random();
        const w = kind < 0.5 ? 0.08 + random() * 0.14 : kind < 0.75 ? 0.07 : 0.03 + random() * 0.03;
        const l = kind < 0.5 ? 0.06 + random() * 0.12 : kind < 0.75 ? 0.12 : w;
        const edge = 0.04 + random() * random() * 0.5;
        const x = right ? roadHalf - edge : -roadHalf - LANES + edge;
        matrix.makeScale(w, 1, l);
        turn.makeRotationY(random() * Math.PI);
        matrix.premultiply(turn);
        matrix.setPosition(x, 0.012 + i * 0.0004, -random() * 15);
        pieces.setMatrixAt(i, matrix);
        const pick =
          kind < 0.5
            ? colours[Math.floor(random() * 3)]!
            : kind < 0.75
              ? colours[4 + Math.floor(random() * 2)]!
              : colours[6 + Math.floor(random() * 2)]!;
        pieces.setColorAt(i, colour.set(pick));
      }
      pieces.receiveShadow = true;
      const stretch = new Group();
      stretch.add(pieces);
      this.group.add(stretch);
      this.props.push({ mesh: stretch, offset, x: 0 });
    }
  }

  /**
   * A couple sitting close on the seawall with their backs to the road, legs dangling over the
   * sea side, his arm round her shoulders and her head leant on his, looking out to sea.
   */
  private addCouple(roadHalf: number): void {
    const pair = new Group();
    const torso = new CapsuleGeometry(0.16, 0.36, 3, 8);
    const head = new SphereGeometry(0.105, 10, 8);
    const limb = new CapsuleGeometry(0.06, 0.4, 3, 6);
    const hair = new SphereGeometry(0.115, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    this.disposables.push(torso, head, limb, hair);
    const add = (
      g: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      rx = 0,
      rz = 0,
    ) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, 0, rz);
      mesh.castShadow = true;
      pair.add(mesh);
      return mesh;
    };
    const seat = WALL + 0.08;
    const people = [
      { z: -0.22, shirt: 0xf0f0ea, trousers: 0x2a3a5a, skin: 0x8d5a3b, hair: 0x1a1410, lean: 0 },
      { z: 0.2, shirt: 0xe8607a, trousers: 0xe8607a, skin: 0xd8a882, hair: 0x5a3018, lean: -0.25 },
    ];
    for (const p of people) {
      const shirt = this.material({ color: p.shirt, roughness: 0.85 });
      const legs = this.material({ color: p.trousers, roughness: 0.85 });
      const skin = this.material({ color: p.skin, roughness: 0.8 });
      add(torso, shirt, 0.02, seat + 0.32, p.z, p.lean, 0);
      add(head, skin, 0.0, seat + 0.74, p.z + p.lean * 0.4);
      add(
        hair,
        this.material({ color: p.hair, roughness: 0.95 }),
        0.03,
        seat + 0.76,
        p.z + p.lean * 0.4,
        0,
        0.3,
      );
      for (const dz of [-0.09, 0.09]) {
        add(limb, legs, -0.24, seat + 0.04, p.z + dz, 0, Math.PI / 2);
        add(limb, legs, -0.46, seat - 0.24, p.z + dz);
      }
    }
    // His arm across her shoulders; her hands in her lap.
    add(
      limb,
      this.material({ color: 0xf0f0ea, roughness: 0.85 }),
      0.06,
      seat + 0.55,
      0.0,
      Math.PI / 2 - 0.15,
    );
    add(
      limb,
      this.material({ color: 0xd8a882, roughness: 0.8 }),
      -0.14,
      seat + 0.24,
      0.2,
      0,
      Math.PI / 2.4,
    );
    pair.rotation.y = 0;
    const holder = new Group();
    holder.add(pair);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 39, x: -roadHalf - LANES - PROMENADE - 0.3 });
  }

  /**
   * Lane arrows painted on the asphalt, straight ahead or ahead-and-right, five metres long as
   * real ones are so they read foreshortened, the white worn grey by tyres; both carriageways.
   */
  private addArrows(roadHalf: number): void {
    const random = seeded(1669);
    const sheet = new PlaneGeometry(1.0, 5.0);
    sheet.rotateX(-Math.PI / 2);
    this.disposables.push(sheet);
    const paints = [false, true].map(
      (turn) =>
        new MeshStandardMaterial({
          map: this.track(arrowTexture(turn)),
          transparent: true,
          depthWrite: false,
          roughness: 0.8,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }),
    );
    this.disposables.push(...paints);
    for (let offset = 38; offset < LOOP; offset += 70 + random() * 40) {
      for (const [x, turn] of [
        [roadHalf - 5.6, 0],
        [roadHalf - 2.2, 0],
        [-roadHalf - 1.9, Math.PI],
        [-roadHalf - 5.2, Math.PI],
      ] as const) {
        const arrow = new Mesh(sheet, paints[random() < 0.25 ? 1 : 0]!);
        arrow.rotation.y = turn;
        arrow.position.y = 0.008;
        arrow.renderOrder = 1;
        const holder = new Group();
        holder.add(arrow);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset: offset + (turn ? 6 : 0), x });
      }
    }
  }

  /**
   * Cast-iron manhole covers in the asphalt: a disc of rusted, cross-hatched iron, sat a touch
   * proud in a square collar of patched, paler concrete.
   */
  private addManholes(roadHalf: number): void {
    const random = seeded(1637);
    const iron = this.material({
      map: this.track(manholeTexture()),
      roughness: 0.55,
      metalness: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -3,
    });
    const collar = this.material({
      color: 0x6e6a64,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const disc = new CircleGeometry(0.34, 24);
    disc.rotateX(-Math.PI / 2);
    const square = new PlaneGeometry(0.95, 0.95);
    square.rotateX(-Math.PI / 2);
    this.disposables.push(disc, square);
    for (let offset = 30; offset < 600; offset += 45 + random() * 60) {
      const cover = new Group();
      const base = new Mesh(square, collar);
      base.position.y = 0.006;
      base.rotation.y = random() * 0.3;
      base.receiveShadow = true;
      const lid = new Mesh(disc, iron);
      lid.position.y = 0.012;
      lid.rotation.y = random() * Math.PI;
      lid.receiveShadow = true;
      cover.add(base, lid);
      this.group.add(cover);
      const lane = random() < 0.5 ? roadHalf - 4.4 : -roadHalf + 2.2 + random() * 3;
      this.props.push({ mesh: cover, offset, x: offset < 40 ? roadHalf - 6.2 : lane });
    }
  }

  /**
   * A manisero, the peanut seller: an old man in a white guayabera and straw hat, a tin of
   * roasted peanuts on a strap at his hip, holding out a fan of paper cones to the passers-by.
   */
  private addManisero(roadHalf: number): void {
    const man = new Group();
    const shirt = this.material({ color: 0xf4f1e8, roughness: 0.85 });
    const trousers = this.material({ color: 0x5a5448, roughness: 0.9 });
    const skin = this.material({ color: 0x7a4e32, roughness: 0.8 });
    const straw = this.material({ color: 0xd8c08a, roughness: 0.95 });
    const tin = this.material({ color: 0xb8bcbc, roughness: 0.35, metalness: 0.7 });
    const paper = this.material({ color: 0xf0ead8, roughness: 0.9 });
    const torso = new CapsuleGeometry(0.17, 0.42, 3, 8);
    const head = new SphereGeometry(0.11, 10, 8);
    const limb = new CapsuleGeometry(0.05, 0.42, 3, 6);
    const leg = new CapsuleGeometry(0.07, 0.62, 3, 6);
    const brim = new CylinderGeometry(0.24, 0.24, 0.02, 14);
    const crown = new CylinderGeometry(0.1, 0.12, 0.11, 12);
    const can = new CylinderGeometry(0.15, 0.15, 0.32, 14);
    const cone = new ConeGeometry(0.035, 0.16, 8);
    cone.rotateX(Math.PI);
    this.disposables.push(torso, head, limb, leg, brim, crown, can, cone);
    const add = (
      g: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      rx = 0,
      rz = 0,
    ) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, 0, rz);
      mesh.castShadow = true;
      man.add(mesh);
      return mesh;
    };
    for (const z of [-0.1, 0.1]) add(leg, trousers, 0, 0.4, z);
    add(torso, shirt, 0, 1.05, 0);
    add(head, skin, 0, 1.5, 0);
    add(brim, straw, 0, 1.6, 0);
    add(crown, straw, 0, 1.66, 0);
    // The tin at his hip on its strap, the lid open on the cones stood inside.
    add(can, tin, -0.05, 0.85, 0.27);
    const strap = add(this.unit, trousers, 0, 1.15, 0.12, -0.5);
    strap.scale.set(0.03, 0.62, 0.32);
    for (let k = 0; k < 6; k++)
      add(cone, paper, -0.08 + (k % 3) * 0.06, 1.06, 0.22 + Math.floor(k / 3) * 0.08);
    // One arm down, one held out toward the road with a fan of cones.
    add(limb, shirt, 0, 1.0, 0.24, 0, 0.1);
    add(limb, shirt, -0.22, 1.16, -0.2, 0, 1.2);
    for (let k = 0; k < 4; k++) add(cone, paper, -0.46, 1.24, -0.27 + k * 0.05, 0, 0.2 - k * 0.12);
    man.rotation.y = Math.PI;
    const holder = new Group();
    man.position.y = KERB;
    holder.add(man);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 31.8, x: roadHalf + 1.3 });
  }

  /**
   * A quinceañera's photo shoot under the arcade's edge, as there so often is: the girl in a vast
   * tulle gown, one hand on her hip and the other raised, her hair up with a tiara, the gown's
   * mother holding its train, and the photographer crouched with the camera to his eye.
   */
  private addQuinceanera(roadHalf: number): void {
    const shoot = new Group();
    const gown = this.material({ color: 0xf2a8c8, roughness: 0.9 });
    const skin = this.material({ color: 0xc68b5e, roughness: 0.8 });
    const hair = this.material({ color: 0x2a1d14, roughness: 0.95 });
    const tiara = this.material({ color: 0xf0e8c8, roughness: 0.2, metalness: 0.8 });
    const skirt = new LatheGeometry(
      [
        new Vector2(0.14, 1.05),
        new Vector2(0.3, 0.85),
        new Vector2(0.62, 0.45),
        new Vector2(0.78, 0.12),
        new Vector2(0.8, 0.0),
      ],
      24,
    );
    const torso = new CapsuleGeometry(0.14, 0.3, 3, 8);
    const head = new SphereGeometry(0.1, 10, 8);
    const limb = new CapsuleGeometry(0.045, 0.42, 3, 6);
    const bun = new SphereGeometry(0.07, 8, 6);
    this.disposables.push(skirt, torso, head, limb, bun);
    const add = (
      g: BufferGeometry,
      m: MeshStandardMaterial,
      x: number,
      y: number,
      z: number,
      rx = 0,
      rz = 0,
    ) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, 0, rz);
      mesh.castShadow = true;
      shoot.add(mesh);
      return mesh;
    };
    // The girl, facing the road.
    add(skirt, gown, 0, 0, 0);
    add(torso, gown, 0, 1.3, 0);
    add(head, skin, 0, 1.7, 0);
    add(head, hair, 0, 1.73, 0.03).scale.set(1.05, 0.9, 1.05);
    add(bun, hair, 0, 1.82, 0.08);
    add(this.unit, tiara, 0, 1.8, -0.04).scale.set(0.16, 0.04, 0.02);
    add(limb, skin, -0.2, 1.3, 0, 0, 0.9);
    add(limb, skin, 0.22, 1.62, 0, 0, -2.6);
    // Her mother holding the train behind her.
    const mother = this.material({ color: 0x3a5a8a, roughness: 0.85 });
    for (const side of [-0.09, 0.09])
      add(limb, this.material({ color: 0x2b2d42, roughness: 0.9 }), 0.4 + side, 0.45, 0.9).scale.y =
        1.7;
    add(torso, mother, 0.4, 1.15, 0.9, 0.4);
    add(head, skin, 0.4, 1.52, 0.78);
    // The photographer crouched in front, the camera at his eye.
    const shirt = this.material({ color: 0x1a1a1a, roughness: 0.85 });
    add(torso, shirt, 0, 0.75, -2.0, -0.3);
    add(head, this.material({ color: 0x8d5a3b, roughness: 0.8 }), 0, 1.12, -2.05);
    for (const side of [-0.12, 0.12]) {
      add(limb, this.material({ color: 0xc8b89a, roughness: 0.9 }), side, 0.35, -1.85, 1.2);
      add(limb, shirt, side * 1.4, 0.98, -1.95, 1.5);
    }
    add(this.unit, this.material({ color: 0x111111, roughness: 0.4 }), 0, 1.12, -1.92).scale.set(
      0.16,
      0.11,
      0.12,
    );
    shoot.rotation.y = Math.PI / 2;
    shoot.position.y = KERB;
    const holder = new Group();
    holder.add(shoot);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 35, x: roadHalf + 3.0 });
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

/** The oncoming lanes: worn asphalt with a dashed lane line and the double centre line. */
function lanesTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#55565c', 941);
    g.fillStyle = 'rgba(240,240,230,0.8)';
    g.fillRect(4, 0, 4, 256);
    g.fillRect(12, 0, 4, 256);
    for (let y = 0; y < 256; y += 64) g.fillRect(128, y, 5, 32);
  });
}

/** The promenade's pale paving. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#cfc6b4', 947);
    g.fillStyle = 'rgba(60,50,40,0.3)';
    g.fillRect(0, 0, 128, 2);
    g.fillRect(0, 0, 2, 128);
  });
}

/** The seawall's weathered, salt-stained concrete. */
function wallTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#d2cabb', 953);
    const random = seeded(967);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(80,90,80,${0.08 + random() * 0.14})`;
      g.fillRect(random() * 256, random() * 256, 4 + random() * 20, 30 + random() * 60);
    }
  });
}

/** The Gulf's deep blue water, flecked with whitecaps. */
function seaTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#0f5f94';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(971);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(200,235,250,${0.06 + random() * 0.16})`;
      g.fillRect(random() * 512, random() * 512, 3, 10 + random() * 26);
    }
    for (let i = 0; i < 120; i++) {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(random() * 512, random() * 512, 3, 6 + random() * 10);
    }
  });
}

/**
 * Eight metres and four storeys of a façade, drawn in pale greys so the material's pastel tints
 * it: the colonnade's arches at the foot, tall shuttered windows with balconies above, cornice
 * lines, and plaster peeling to the brick.
 */
function facadeTexture(): CanvasTexture {
  return canvasTexture(512, 1024, (g) => {
    // Drawn on a 256 × 512 grid at twice the resolution.
    g.scale(2, 2);
    g.fillStyle = '#f2f2f0';
    g.fillRect(0, 0, 256, 512);
    const random = seeded(977);
    const panes = seeded(1373);
    // Peeling and stains.
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(150,110,90,${0.1 + random() * 0.25})`;
      g.beginPath();
      g.ellipse(
        random() * 256,
        random() * 512,
        6 + random() * 16,
        4 + random() * 10,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = 'rgba(90,90,80,0.1)';
      g.fillRect(random() * 256, random() * 512, 3, 40 + random() * 80);
    }
    // Each storey: two tall French windows opening onto the balconies, their green shutters
    // folded back, a moulded surround and a string course at the floor.
    for (let y = 0; y < 512; y += 128) {
      for (const x of [26, 154]) {
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.fillRect(x + 12, y + 14, 52, 6);
        frenchWindow(g, x, y, panes);
        g.fillStyle = '#3f7a5a';
        g.fillRect(x, y + 24, 16, 100);
        g.fillRect(x + 60, y + 24, 16, 100);
        g.fillStyle = 'rgba(0,0,0,0.25)';
        for (let k = y + 28; k < y + 122; k += 5) {
          g.fillRect(x + 2, k, 12, 1);
          g.fillRect(x + 62, k, 12, 1);
        }
      }
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(0, y + 122, 256, 6);
    }
    // Weathering over it all: rain streaks run down from every balcony and sill, grime gathers
    // under the string courses, mould in dark blooms, and here and there the paint has peeled
    // away to an older, paler coat or to the brick beneath.
    for (let y = 0; y < 512; y += 128) {
      for (let x = 0; x < 256; x += 3 + random() * 5) {
        const length = 10 + random() ** 2 * 70;
        const grad = g.createLinearGradient(0, y, 0, y + length);
        grad.addColorStop(0, `rgba(70,66,58,${0.12 + random() * 0.2})`);
        grad.addColorStop(1, 'rgba(70,66,58,0)');
        g.fillStyle = grad;
        g.fillRect(x, y, 1.5 + random() * 3, length);
      }
      g.fillStyle = 'rgba(60,70,55,0.12)';
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(
          random() * 256,
          y + 100 + random() * 24,
          10 + random() * 20,
          4 + random() * 8,
          0,
          0,
          Math.PI * 2,
        );
        g.fill();
      }
    }
    for (let i = 0; i < 7; i++) {
      const cx = random() * 256;
      const cy = random() * 512;
      const brick = random() < 0.35;
      g.fillStyle = brick ? 'rgba(150,90,70,0.7)' : 'rgba(225,215,195,0.65)';
      g.beginPath();
      const points = 22;
      const size = (6 + random() * 10) * (brick ? 0.8 : 1.2);
      for (let k = 0; k < points; k++) {
        const a = (k / points) * Math.PI * 2;
        const r = size * (0.45 + random() * 0.75);
        g.lineTo(cx + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
      if (brick) {
        g.fillStyle = 'rgba(80,60,50,0.5)';
        for (let k = -20; k < 20; k += 4) g.fillRect(cx - 18, cy + k, 36, 0.8);
      }
    }
  });
}

/** One bay of the arcade's front: a round arch cut through the pale wall (transparent). */
function archTexture(): CanvasTexture {
  return canvasTexture(128, 160, (g) => {
    speckle(g, 128, 160, '#efece6', 983);
    g.fillStyle = 'rgba(150,110,90,0.25)';
    g.fillRect(0, 130, 128, 30);
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    g.beginPath();
    g.moveTo(14, 160);
    g.lineTo(14, 66);
    g.arc(64, 66, 50, Math.PI, 0);
    g.lineTo(114, 160);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(64, 66, 52, Math.PI, 0);
    g.stroke();
  });
}

/** The shopfronts at the back of the arcade: doorways, shutters and dim windows. */
function shopTexture(lit = false): CanvasTexture {
  // Two shopfronts per 7 m tile: a painted sign over each, a shop window lit from within, and a
  // doorway, open and dark or shut behind a roller grille; `lit` draws only what glows.
  const names = ['CAFETERÍA', 'BODEGA', 'BARBERÍA', 'PALADAR', 'FARMACIA', 'DULCERÍA'];
  const signs = ['#1f4fa0', '#c8202f', '#2a7a5a', '#e0a020', '#6a3a8a', '#1b2e5c'];
  return canvasTexture(512, 320, (g) => {
    if (lit) {
      g.fillStyle = '#000';
      g.fillRect(0, 0, 512, 320);
    } else speckle(g, 512, 320, '#b4a894', 991);
    const random = seeded(997);
    for (let k = 0; k < 2; k++) {
      const x = k * 256;
      const n = Math.floor(random() * names.length);
      const shut = random() < 0.3;
      // The sign board across the top of the front.
      if (!lit) {
        g.fillStyle = signs[n]!;
        g.fillRect(x + 16, 36, 224, 44);
        g.fillStyle = '#f5efe0';
        g.font = 'bold 30px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(names[n]!, x + 128, 59, 210);
      }
      // The shop window, glowing warm, with goods on shelves against the light.
      g.fillStyle = lit ? (shut ? '#000' : '#ffd9a0') : shut ? '#3a3632' : '#e8c890';
      g.fillRect(x + 22, 100, 120, 150);
      if (!shut) {
        g.fillStyle = lit ? '#6a5030' : 'rgba(80,50,30,0.7)';
        for (let y = 140; y < 250; y += 36) g.fillRect(x + 22, y, 120, 5);
        for (let i = 0; i < 12; i++) {
          g.fillRect(x + 28 + random() * 105, 118 + Math.floor(random() * 3) * 36, 8, 16);
        }
      }
      if (!lit) {
        g.fillStyle = '#4a4440';
        g.fillRect(x + 80, 100, 4, 150);
        g.fillRect(x + 22, 172, 120, 3);
      }
      // The doorway: dark and open, or shut behind a ribbed roller grille.
      g.fillStyle = lit ? '#000' : '#1e1a17';
      g.fillRect(x + 160, 96, 76, 224);
      if (shut && !lit) {
        g.fillStyle = '#6a6a66';
        g.fillRect(x + 160, 96, 76, 224);
        g.fillStyle = 'rgba(0,0,0,0.3)';
        for (let y = 98; y < 320; y += 7) g.fillRect(x + 160, y, 76, 2);
      } else if (!lit) {
        g.fillStyle = 'rgba(255,220,160,0.12)';
        g.fillRect(x + 166, 110, 64, 210);
      }
    }
  });
}

/** Plain pale plaster, weathered at the foot. */
function plasterTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#efece6', 1009);
    g.fillStyle = 'rgba(150,110,90,0.25)';
    g.fillRect(0, 210, 64, 46);
  });
}

/**
 * A car part drawn as a side profile (metres along the car from the boot to the bonnet, and
 * height), its bonnet turned toward -z, and
 * extruded across `width`, its edges rounded by `bevel`.
 */
function profile(
  points: readonly [number, number][],
  width: number,
  bevel: number,
): BufferGeometry {
  const shape = new Shape(points.map(([z, y]) => new Vector2(z, y)));
  const geometry = new ExtrudeGeometry(shape, {
    depth: width - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -(width - 2 * bevel) / 2);
  geometry.rotateY(Math.PI / 2);
  return geometry;
}

/** A royal palm's trunk: smooth pale grey, faintly ringed, stained darker at the foot. */
function trunkTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#c4beb4', 1013);
    for (let y = 0; y < 256; y += 14) {
      g.fillStyle = 'rgba(90,85,75,0.18)';
      g.fillRect(0, y, 64, 2);
    }
    g.fillStyle = 'rgba(70,60,50,0.25)';
    g.fillRect(0, 236, 64, 20);
  });
}

/** A royal palm's frond: a pale midrib with fine drooping leaflets, transparent round it. */
function royalFrondTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    g.clearRect(0, 0, 128, 512);
    const random = seeded(1019);
    for (let y = 6; y < 506; y += 5) {
      const reach = 60 * Math.sin((Math.PI * (y + 40)) / 600);
      g.strokeStyle = `hsl(${88 + random() * 22},${45 + random() * 15}%,${24 + random() * 14}%)`;
      g.lineWidth = 2.5;
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(64, y);
        g.quadraticCurveTo(
          64 + side * reach * 0.6,
          y + 4,
          64 + side * reach,
          y + 22 + random() * 8,
        );
        g.stroke();
      }
    }
    g.fillStyle = '#9aa060';
    g.fillRect(62, 0, 4, 512);
  });
}

/** A wrought-iron balcony railing: top rail, bottom rail and balusters with scrolls, open between. */
function railingTexture(): CanvasTexture {
  const texture = canvasTexture(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    g.fillStyle = '#1d2024';
    g.fillRect(0, 0, 256, 6);
    g.fillRect(0, 56, 256, 4);
    for (let x = 4; x < 256; x += 10) g.fillRect(x, 0, 3, 60);
    g.strokeStyle = '#1d2024';
    g.lineWidth = 2;
    for (let x = 0; x < 256; x += 40) {
      g.beginPath();
      g.arc(x + 20, 30, 9, 0, Math.PI * 2);
      g.stroke();
    }
  });
  texture.wrapS = RepeatWrapping;
  return texture;
}

/** Repeats a plane's texture `times` across its width, so railings keep their spacing. */
function stretch(plane: PlaneGeometry, times: number): PlaneGeometry {
  const uv = plane.getAttribute('uv') as BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * times);
  return plane;
}

/** Foam churning at the wall's foot: dense white against the wall, breaking up seaward. */
function foamTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const random = seeded(1031);
    for (let i = 0; i < 2600; i++) {
      const x = random() ** 2.2 * 256;
      const a = (1 - x / 256) * (0.25 + random() * 0.5);
      g.fillStyle = `rgba(245,250,252,${a})`;
      g.beginPath();
      g.ellipse(
        x,
        random() * 256,
        2 + random() * 7,
        2 + random() * 10,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });
}

/** A rooftop water tank on a low stand of four legs, a metre and a half tall at unit scale. */
function tankGeometry(): BufferGeometry {
  const drum = new CylinderGeometry(1, 1, 1.1, 14);
  drum.translate(0, 0.95, 0);
  const lid = new CylinderGeometry(0.3, 1, 0.2, 14);
  lid.translate(0, 1.6, 0);
  const parts: BufferGeometry[] = [drum, lid];
  for (const [x, z] of [
    [-0.6, -0.6],
    [0.6, -0.6],
    [-0.6, 0.6],
    [0.6, 0.6],
  ] as const) {
    const leg = new BoxGeometry(0.1, 0.4, 0.1);
    leg.translate(x, 0.2, z);
    parts.push(leg.toNonIndexed());
  }
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)))!;
  parts.forEach((g) => g.dispose());
  return merged;
}

/**
 * Forty metres of the rider's lanes, worn the Havana way, drawn over the road on a clear ground:
 * darker and paler patches of repair, branching cracks, oil stained down the middle of each
 * lane, and a manhole cover or two.
 */
function wearTexture(): CanvasTexture {
  return canvasTexture(256, 1024, (g) => {
    g.clearRect(0, 0, 256, 1024);
    const random = seeded(1061);
    for (let i = 0; i < 14; i++) {
      const dark = random() < 0.6;
      g.fillStyle = dark
        ? `rgba(30,30,34,${0.25 + random() * 0.25})`
        : `rgba(150,148,140,${0.15 + random() * 0.2})`;
      const w = 30 + random() * 90;
      const h = 30 + random() * 140;
      g.fillRect(random() * (256 - w), random() * (1024 - h), w, h);
    }
    for (const x of [64, 192]) {
      for (let y = 0; y < 1024; y += 8) {
        g.fillStyle = `rgba(20,18,16,${0.05 + random() * 0.1})`;
        g.fillRect(x - 14 + random() * 6, y, 18 + random() * 10, 8);
      }
    }
    g.strokeStyle = 'rgba(25,25,28,0.55)';
    g.lineWidth = 1.5;
    for (let i = 0; i < 26; i++) {
      let x = random() * 256;
      let y = random() * 1024;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        x += (random() - 0.5) * 18;
        y += 4 + random() * 12;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (const [x, y] of [
      [70, 300],
      [190, 820],
    ] as const) {
      g.fillStyle = 'rgba(40,38,36,0.85)';
      g.beginPath();
      g.arc(x, y, 11, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(120,110,100,0.6)';
      g.lineWidth = 1;
      for (let k = -8; k <= 8; k += 4) {
        g.beginPath();
        g.moveTo(x - 9, y + k);
        g.lineTo(x + 9, y + k);
        g.stroke();
      }
    }
  });
}

/**
 * People sitting on the Malecón's wall: thighs along its top, shins hanging over its face, a
 * torso and a head; a fisherman also holds a rod reaching up and out over the water, its line
 * falling to the sea. Each part is one instanced mesh, coloured per person.
 */
class Sitters {
  private readonly legs: InstancedMesh;
  private readonly bodies: InstancedMesh;
  private readonly heads: InstancedMesh;
  private readonly rods: InstancedMesh;
  private readonly hair: InstancedMesh;
  private readonly hats: InstancedMesh;
  private readonly hatted: boolean[] = [];
  private readonly matrix = new Matrix4();
  private readonly hidden = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly one = new Vector3(1, 1, 1);
  private readonly none = new Vector3(0, 0, 0);
  private readonly up = new Vector3(0, 1, 0);

  constructor(
    group: Group,
    disposables: { dispose(): void }[],
    private readonly people: readonly Sitter[],
    wardrobe: { tops: readonly string[]; bottoms: readonly string[]; skins: readonly string[] },
    seed: number,
  ) {
    const parts: BufferGeometry[] = [];
    for (const side of [-0.1, 0.1]) {
      const thigh = new CapsuleGeometry(0.075, 0.36, 3, 8);
      thigh.rotateX(Math.PI / 2);
      thigh.translate(side, 0.08, -0.22);
      const shin = new CapsuleGeometry(0.065, 0.36, 3, 8);
      shin.translate(side, -0.16, -0.46);
      parts.push(thigh, shin);
    }
    const legs = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    // A torso with shoulders, leaning a little forward, and both arms reaching down and out to
    // hold the rod (or rest on the knees), sleeved in the shirt's colour.
    const torso = new CapsuleGeometry(0.16, 0.34, 4, 10);
    torso.scale(1.18, 1, 0.8);
    torso.rotateX(-0.12);
    torso.translate(0, 0.48, 0.04);
    const arms: BufferGeometry[] = [torso];
    for (const side of [-1, 1]) {
      const upper = new CapsuleGeometry(0.05, 0.26, 3, 6);
      upper.rotateX(0.5);
      upper.rotateZ(side * 0.15);
      upper.translate(side * 0.23, 0.6, -0.08);
      const fore = new CapsuleGeometry(0.045, 0.24, 3, 6);
      fore.rotateX(1.3);
      fore.translate(side * 0.18, 0.45, -0.3);
      arms.push(upper, fore);
    }
    const body = mergeGeometries(arms)!;
    arms.forEach((g) => g.dispose());
    // The head and neck, and the hands at the rod's butt, all in skin.
    const skin: BufferGeometry[] = [];
    const face = new SphereGeometry(0.11, 12, 10);
    face.scale(0.92, 1.05, 1);
    face.translate(0, 0.98, -0.02);
    const neck = new CylinderGeometry(0.05, 0.055, 0.1, 8);
    neck.translate(0, 0.86, 0.01);
    skin.push(face, neck);
    for (const side of [-1, 1]) {
      const hand = new SphereGeometry(0.05, 8, 6);
      hand.translate(side * 0.12, 0.42, -0.43);
      skin.push(hand);
    }
    const head = mergeGeometries(skin)!;
    skin.forEach((g) => g.dispose());
    const cap = new SphereGeometry(0.118, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
    cap.translate(0, 0.99, 0);
    const brim = new CylinderGeometry(0.22, 0.22, 0.02, 14);
    const crown = new CylinderGeometry(0.1, 0.12, 0.1, 12);
    crown.translate(0, 0.06, 0);
    const hat = mergeGeometries([brim, crown])!;
    brim.dispose();
    crown.dispose();
    hat.translate(0, 1.07, -0.01);
    // The rod from the hands, up and out at forty degrees, and the line down from its tip.
    const rod = new CylinderGeometry(0.012, 0.02, 3.6, 5);
    rod.translate(0, 1.8, 0);
    rod.rotateX(-0.85);
    rod.translate(0, 0.55, -0.3);
    const line = new CylinderGeometry(0.004, 0.004, 4.6, 3);
    line.translate(0, -2.3 + 0.55 + 3.6 * Math.cos(0.85), -0.3 - 3.6 * Math.sin(0.85));
    const tackle = mergeGeometries([rod, line])!;
    rod.dispose();
    line.dispose();
    const make = (geometry: BufferGeometry, material: MeshStandardMaterial, count: number) => {
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      group.add(mesh);
      disposables.push(geometry, material, mesh);
      return mesh;
    };
    const n = people.length;
    this.legs = make(legs, new MeshStandardMaterial({ roughness: 0.9 }), n);
    this.bodies = make(body, new MeshStandardMaterial({ roughness: 0.85 }), n);
    this.heads = make(head, new MeshStandardMaterial({ roughness: 0.7 }), n);
    this.rods = make(tackle, new MeshStandardMaterial({ color: 0x3a3226, roughness: 0.6 }), n);
    this.hair = make(cap, new MeshStandardMaterial({ roughness: 0.95 }), n);
    this.hats = make(hat, new MeshStandardMaterial({ roughness: 0.9 }), n);
    const hairs = ['#1a1410', '#2a1d14', '#4a3020', '#8a8580', '#1a1a1a'];
    const random = seeded(seed);
    const pick = (list: readonly string[]) => list[Math.floor(random() * list.length)]!;
    const c = new Color();
    for (let i = 0; i < n; i++) {
      this.bodies.setColorAt(i, c.set(pick(wardrobe.tops)));
      this.legs.setColorAt(i, c.set(pick(wardrobe.bottoms)));
      this.heads.setColorAt(i, c.set(pick(wardrobe.skins)));
      this.hair.setColorAt(i, c.set(pick(hairs)));
      this.hats.setColorAt(i, c.set(random() < 0.7 ? '#e8d8a8' : pick(wardrobe.tops)));
      this.hatted.push(random() < 0.5);
    }
  }

  /** Seats person `i` on the wall's top at (x, y, z), facing `heading`. */
  set(i: number, x: number, y: number, z: number, heading: number): void {
    this.turn.setFromAxisAngle(this.up, heading);
    this.spot.set(x, y, z);
    this.matrix.compose(this.spot, this.turn, this.one);
    this.legs.setMatrixAt(i, this.matrix);
    this.bodies.setMatrixAt(i, this.matrix);
    this.heads.setMatrixAt(i, this.matrix);
    this.hair.setMatrixAt(i, this.matrix);
    if (this.hatted[i]) this.hats.setMatrixAt(i, this.matrix);
    else this.hats.setMatrixAt(i, this.hidden.compose(this.spot, this.turn, this.none));
    if (!this.people[i]!.rod) this.matrix.compose(this.spot, this.turn, this.none);
    this.rods.setMatrixAt(i, this.matrix);
  }

  commit(): void {
    for (const mesh of [this.legs, this.bodies, this.heads, this.rods, this.hair, this.hats]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/**
 * Six metres square of Havana pavement: pale concrete slabs a metre and a half across with dark
 * joints, each a slightly different shade, cracked and patched, stained and chipped at the edges.
 */
function slabTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#cbc2b0', 1097);
    const random = seeded(1103);
    const slab = 128;
    for (let x = 0; x < 512; x += slab) {
      for (let y = 0; y < 512; y += slab) {
        const v = random();
        g.fillStyle =
          v < 0.5 ? `rgba(255,250,240,${v * 0.25})` : `rgba(70,60,50,${(v - 0.5) * 0.22})`;
        g.fillRect(x, y, slab, slab);
        if (random() < 0.3) {
          g.fillStyle = `rgba(110,105,95,${0.25 + random() * 0.2})`;
          g.fillRect(x + random() * 60, y + random() * 60, 30 + random() * 60, 30 + random() * 60);
        }
      }
    }
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(60,50,40,${0.08 + random() * 0.12})`;
      g.beginPath();
      g.ellipse(
        random() * 512,
        random() * 512,
        8 + random() * 30,
        6 + random() * 20,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    g.strokeStyle = 'rgba(50,45,40,0.5)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 22; i++) {
      let x = random() * 512;
      let y = random() * 512;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (random() - 0.5) * 30;
        y += (random() - 0.5) * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(55,48,40,0.55)';
    for (let k = 0; k < 512; k += slab) {
      g.fillRect(k, 0, 3, 512);
      g.fillRect(0, k, 512, 3);
    }
  });
}

/** The kerb stones: pale, worn grey blocks with a dark joint every metre and grime at the foot. */
function kerbTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#d6d0c4', 1109);
    g.fillStyle = 'rgba(40,38,34,0.5)';
    for (let y = 0; y < 256; y += 85) g.fillRect(0, y, 64, 3);
    g.fillStyle = 'rgba(40,36,30,0.3)';
    g.fillRect(0, 0, 10, 256);
  });
}

/** Paints every vertex of a non-indexed geometry one colour, for a vertex-coloured mesh. */
function paint(geometry: BufferGeometry, hex: number): BufferGeometry {
  const c = new Color(hex);
  const n = geometry.getAttribute('position').count;
  const colours = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) colours.set([c.r, c.g, c.b], i * 3);
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  return geometry;
}

/** Cuba's flag: five blue and white stripes, and the red triangle with its white star. */
function cubanFlag(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    for (let k = 0; k < 5; k++) {
      g.fillStyle = k % 2 ? '#ffffff' : '#002a8f';
      g.fillRect(0, (k * 128) / 5, 256, 128 / 5 + 1);
    }
    g.fillStyle = '#cf142b';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(111, 64);
    g.lineTo(0, 128);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 9 : 22;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      g.lineTo(38 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
  });
}

/**
 * Six metres of the seawall, unrolled across its profile (four metres: the face to the
 * promenade, the coping, and the long face down to the sea): weathered pale concrete with an
 * expansion joint, grime at the promenade's foot, salt bloom on the coping, and the sea face
 * darkened by spray and green with algae toward the water.
 */
function seawallTexture(): CanvasTexture {
  return canvasTexture(256, 384, (g) => {
    speckle(g, 256, 384, '#d8d0c0', 1123);
    const random = seeded(1129);
    const m = 64;
    const grime = g.createLinearGradient(0, 0, 0.3 * m, 0);
    grime.addColorStop(0, 'rgba(60,55,45,0.35)');
    grime.addColorStop(1, 'rgba(60,55,45,0)');
    g.fillStyle = grime;
    g.fillRect(0, 0, 0.3 * m, 384);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(255,255,250,${0.1 + random() * 0.25})`;
      g.fillRect(
        0.75 * m + random() * 0.55 * m,
        random() * 384,
        1 + random() * 3,
        1 + random() * 3,
      );
    }
    const sea = g.createLinearGradient(1.4 * m, 0, 4 * m, 0);
    sea.addColorStop(0, 'rgba(90,95,85,0.15)');
    sea.addColorStop(0.6, 'rgba(70,85,60,0.4)');
    sea.addColorStop(1, 'rgba(40,70,40,0.75)');
    g.fillStyle = sea;
    g.fillRect(1.4 * m, 0, 2.6 * m, 384);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(60,70,55,${0.06 + random() * 0.12})`;
      g.fillRect(random() * 1.4 * m, random() * 384, 2 + random() * 4, 20 + random() * 60);
    }
    g.fillStyle = 'rgba(50,45,40,0.6)';
    g.fillRect(0, 0, 256, 3);
  });
}

/**
 * A ruined front, on the same 8 m × four-storey grid as the painted ones: bare, stained grey
 * plaster and stone, the windows gaping black and empty of their shutters, a fallen balcony's
 * stub at each floor, and the brick showing where the render has come away.
 */
function ruinTexture(): CanvasTexture {
  return canvasTexture(512, 1024, (g) => {
    g.scale(2, 2);
    speckle(g, 256, 512, '#b8b2a6', 1181);
    const random = seeded(1187);
    for (let i = 0; i < 16; i++) {
      g.fillStyle = `rgba(140,85,60,${0.4 + random() * 0.4})`;
      g.fillRect(random() * 230, random() * 490, 14 + random() * 40, 10 + random() * 30);
    }
    for (let x = 0; x < 256; x += 2 + random() * 4) {
      g.fillStyle = `rgba(50,48,42,${0.1 + random() * 0.2})`;
      g.fillRect(x, random() * 512, 2, 30 + random() * 120);
    }
    for (let y = 0; y < 512; y += 128) {
      for (const x of [26, 154]) {
        g.fillStyle = '#121212';
        g.fillRect(x + 16, y + 24, 44, 100);
        g.fillStyle = 'rgba(90,70,50,0.8)';
        if (random() < 0.4) g.fillRect(x + 16, y + 24 + random() * 60, 44, 4);
      }
      g.fillStyle = 'rgba(80,76,70,0.8)';
      g.fillRect(0, y + 122, 256, 6);
    }
  });
}

/**
 * A cumulus cloud: heaped puffs, bright where the low sun catches their tops, shading to a flat,
 * grey-blue base, on a clear ground.
 */
function cumulusTexture(seed: number): CanvasTexture {
  return canvasTexture(512, 256, (g) => {
    g.clearRect(0, 0, 512, 256);
    const random = seeded(seed);
    const base = 200;
    for (let i = 0; i < 70; i++) {
      const t = i / 70;
      const x = 80 + random() * 350;
      const spread = Math.sin(((x - 60) / 390) * Math.PI);
      const r = 18 + random() * 40 * spread;
      const y = base - r * 0.4 - random() * 120 * spread * (0.4 + t * 0.6);
      const glow = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
      glow.addColorStop(0, 'rgba(255,250,240,0.95)');
      glow.addColorStop(0.7, 'rgba(240,236,232,0.85)');
      glow.addColorStop(1, 'rgba(200,205,215,0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    const shadow = g.createLinearGradient(0, base - 50, 0, base + 6);
    shadow.addColorStop(0, 'rgba(150,160,180,0)');
    shadow.addColorStop(1, 'rgba(150,160,180,0.55)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = shadow;
    g.fillRect(0, base - 50, 512, 60);
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    g.fillRect(0, base + 4, 512, 256 - base);
  });
}

/**
 * Havana's walkers: each a person in parts, so they read as people up close: two legs swinging
 * from the hips in stride, a torso with shoulders, two arms swinging against the legs, a head
 * with hair, and for some a straw hat or a cap. Each part is one instanced mesh, coloured per
 * person from the wardrobe.
 */
class Walkers {
  private readonly parts: InstancedMesh[];
  private readonly hats: InstancedMesh;
  private readonly hatted: boolean[] = [];
  private readonly shades: InstancedMesh;
  private readonly feet: InstancedMesh;
  private readonly skirts: InstancedMesh;
  private readonly skirted: boolean[] = [];
  private readonly hands: InstancedMesh;
  private readonly faces: InstancedMesh;
  private readonly eyes: InstancedMesh;
  private readonly shaded: boolean[] = [];
  private readonly size = new Vector3();
  private readonly base = new Matrix4();
  private readonly local = new Matrix4();
  private readonly out = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly one = new Vector3(1, 1, 1);
  private readonly none = new Vector3(0, 0, 0);
  private readonly up = new Vector3(0, 1, 0);

  constructor(
    group: Group,
    disposables: { dispose(): void }[],
    count: number,
    wardrobe: { tops: readonly string[]; bottoms: readonly string[]; skins: readonly string[] },
    seed: number,
    private readonly sizes: readonly number[],
  ) {
    // Each limb hangs from its pivot at the origin, so it can swing there.
    const leg = new CapsuleGeometry(0.075, 0.72, 3, 8);
    leg.translate(0, -0.43, 0);
    const arm = new CapsuleGeometry(0.05, 0.5, 3, 6);
    arm.translate(0, -0.3, 0);
    const torso = new CapsuleGeometry(0.17, 0.36, 4, 10);
    torso.scale(1.15, 1, 0.8);
    const head = new SphereGeometry(0.11, 12, 10);
    const hair = new SphereGeometry(0.118, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const brim = new CylinderGeometry(0.22, 0.22, 0.02, 14);
    const crown = new CylinderGeometry(0.1, 0.12, 0.1, 12);
    crown.translate(0, 0.06, 0);
    const hat = mergeGeometries([brim, crown])!;
    brim.dispose();
    crown.dispose();
    const make = (geometry: BufferGeometry, roughness: number, per = 1) => {
      const material = new MeshStandardMaterial({ roughness });
      const mesh = new InstancedMesh(geometry, material, count * per);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      group.add(mesh);
      disposables.push(geometry, material, mesh);
      return mesh;
    };
    // legs, arms, torsos, heads, hair (legs and arms hold two instances per person).
    this.parts = [
      make(leg, 0.9, 2),
      make(arm, 0.85, 2),
      make(torso, 0.85),
      make(head, 0.7),
      make(hair, 0.95),
    ];
    this.hats = make(hat, 0.9);
    // Shoes at the foot of each leg and hands at the end of each arm, swinging with them.
    const shoe = new BoxGeometry(0.11, 0.08, 0.26);
    shoe.translate(0, -0.84, -0.05);
    const hand = new SphereGeometry(0.05, 8, 6);
    hand.scale(0.8, 1.2, 0.9);
    hand.translate(0, -0.6, 0);
    this.feet = make(shoe, 0.6, 2);
    // A skirt or the lower half of a dress, flaring from the waist to the knee.
    const skirt = new CylinderGeometry(0.17, 0.27, 0.55, 14, 1, true);
    this.skirts = make(skirt, 0.9);
    (this.skirts.material as MeshStandardMaterial).side = DoubleSide;
    this.hands = make(hand, 0.75, 2);
    // A face on the front of the head (it faces -z): the nose and the ears in the walker's skin,
    // and the dark eyes and brows above.
    const nose = new ConeGeometry(0.022, 0.06, 6);
    nose.rotateX(-Math.PI / 2);
    nose.translate(0, -0.01, -0.115);
    const ears = [-1, 1].map((side) => {
      const ear = new SphereGeometry(0.028, 6, 5);
      ear.scale(0.5, 1, 0.8);
      ear.translate(side * 0.108, 0, 0);
      return ear;
    });
    const face = mergeGeometries([nose.toNonIndexed(), ...ears.map((e) => e.toNonIndexed())])!;
    const marks = [-1, 1].flatMap((side) => {
      const eye = new SphereGeometry(0.014, 6, 4);
      eye.translate(side * 0.038, 0.022, -0.1);
      const brow = new BoxGeometry(0.04, 0.008, 0.01);
      brow.translate(side * 0.038, 0.048, -0.102);
      return [eye.toNonIndexed(), brow.toNonIndexed()];
    });
    const sight = mergeGeometries(marks)!;
    for (const g of [nose, ...ears]) g.dispose();
    this.faces = make(face, 0.7);
    this.eyes = make(sight, 0.4);
    // A parasol held up against the sun: a shallow canopy on its shaft, in the right hand.
    const canopy = new ConeGeometry(0.55, 0.22, 10, 1, true);
    canopy.translate(0, 0.62, 0);
    const shaft = new CylinderGeometry(0.01, 0.01, 0.7, 4);
    shaft.translate(0, 0.3, 0);
    const parasol = mergeGeometries([canopy.toNonIndexed(), shaft.toNonIndexed()])!;
    canopy.dispose();
    shaft.dispose();
    this.shades = make(parasol, 0.8);
    (this.shades.material as MeshStandardMaterial).side = DoubleSide;
    const random = seeded(seed);
    const pick = (list: readonly string[]) => list[Math.floor(random() * list.length)]!;
    const c = new Color();
    const wears = seeded(seed + 2);
    const skirts = ['#2b2d42', '#e8d8b8', '#c8202f', '#1d70b8', '#f4f1ea', '#8e44ad'];
    const shoes = ['#1a1a1a', '#5a3a22', '#f2f2ee', '#2a2a40', '#8a6a4a'];
    const hairs = ['#1a1410', '#2a1d14', '#4a3020', '#8a8580', '#1a1a1a'];
    for (let i = 0; i < count; i++) {
      const top = pick(wardrobe.tops);
      const bottom = pick(wardrobe.bottoms);
      const skin = pick(wardrobe.skins);
      const dress = wears() < 0.4;
      this.skirted.push(dress);
      this.skirts.setColorAt(i, c.set(wears() < 0.5 ? top : pick(skirts)));
      for (const k of [0, 1]) {
        this.parts[0]!.setColorAt(i * 2 + k, c.set(dress ? skin : bottom));
        this.parts[1]!.setColorAt(i * 2 + k, c.set(random() < 0.6 ? skin : top));
        this.hands.setColorAt(i * 2 + k, c.set(skin));
        this.feet.setColorAt(i * 2 + k, c.set(shoes[i % shoes.length]!));
      }
      this.parts[2]!.setColorAt(i, c.set(top));
      this.parts[3]!.setColorAt(i, c.set(skin));
      this.faces.setColorAt(i, c.set(skin).multiplyScalar(0.92));
      this.eyes.setColorAt(i, c.set('#1a120c'));
      this.parts[4]!.setColorAt(i, c.set(pick(hairs)));
      this.hats.setColorAt(i, c.set(random() < 0.6 ? '#e8d8a8' : pick(wardrobe.tops)));
      this.hatted.push(random() < 0.35);
    }
    const parasols = ['#e63946', '#1d70b8', '#f1c40f', '#2b2d42', '#f0c8c0', '#ffffff'];
    const choose = seeded(seed + 1);
    for (let i = 0; i < count; i++) {
      this.shades.setColorAt(i, c.set(parasols[Math.floor(choose() * parasols.length)]!));
      this.shaded.push(!this.hatted[i] && choose() < 0.3);
    }
  }

  /** Places walker `i` at (x, y, z), facing `heading`, `stride` radians into its step cycle. */
  set(i: number, x: number, y: number, z: number, heading: number, stride: number): void {
    this.turn.setFromAxisAngle(this.up, heading);
    this.spot.set(x, y, z);
    this.base.compose(this.spot, this.turn, this.size.setScalar(this.sizes[i]!));
    const swing = Math.sin(stride) * 0.45;
    const lift = Math.abs(Math.cos(stride)) * 0.03;
    for (const [k, side] of [
      [0, -1],
      [1, 1],
    ] as const) {
      this.place(this.parts[0]!, i * 2 + k, side * 0.1, 0.88 + lift, 0, side * swing);
      this.place(this.parts[1]!, i * 2 + k, side * 0.24, 1.42 + lift, 0, -side * swing * 0.8);
      this.place(this.feet, i * 2 + k, side * 0.1, 0.88 + lift, 0, side * swing);
      this.place(this.hands, i * 2 + k, side * 0.24, 1.42 + lift, 0, -side * swing * 0.8);
    }
    this.place(this.parts[2]!, i, 0, 1.18 + lift, 0, 0);
    if (this.skirted[i]) this.place(this.skirts, i, 0, 0.78 + lift, 0, 0);
    else this.skirts.setMatrixAt(i, this.out.compose(this.spot, this.turn, this.none));
    this.place(this.parts[3]!, i, 0, 1.66 + lift, 0, 0);
    this.place(this.faces, i, 0, 1.66 + lift, 0, 0);
    this.place(this.eyes, i, 0, 1.66 + lift, 0, 0);
    this.place(this.parts[4]!, i, 0, 1.67 + lift, 0, 0);
    if (this.hatted[i]) this.place(this.hats, i, 0, 1.75 + lift, 0, 0);
    else this.hats.setMatrixAt(i, this.out.compose(this.spot, this.turn, this.none));
    if (this.shaded[i]) this.place(this.shades, i, 0.24, 1.25 + lift, -0.12, 0);
    else this.shades.setMatrixAt(i, this.out.compose(this.spot, this.turn, this.none));
  }

  /** Sets one part's instance at a local pivot (x, y, z), swung `swing` radians about x. */
  private place(
    mesh: InstancedMesh,
    index: number,
    x: number,
    y: number,
    z: number,
    swing: number,
  ): void {
    this.local.makeRotationX(swing).setPosition(x, y, z);
    this.out.multiplyMatrices(this.base, this.local);
    mesh.setMatrixAt(index, this.out);
  }

  commit(): void {
    for (const mesh of [
      ...this.parts,
      this.hats,
      this.shades,
      this.feet,
      this.hands,
      this.skirts,
    ]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/**
 * Spray-wet ground: dark, ragged patches and puddles on a clear ground, thickest toward the wall
 * (the canvas's right) and thinning toward the road.
 */
function wetTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    g.clearRect(0, 0, 256, 512);
    const random = seeded(1237);
    for (let i = 0; i < 28; i++) {
      const x = 256 - random() ** 1.8 * 256;
      const y = random() * 512;
      const a = 0.35 + random() * 0.3 * (x / 256);
      g.fillStyle = `rgba(28,32,36,${a})`;
      g.beginPath();
      g.ellipse(x, y, 8 + random() * 30, 14 + random() * 60, random() * 0.4, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/**
 * A hand-painted hoarding: a two-line message in heavy capitals over the flag's blue and white
 * stripes and its red triangle, sun-faded and flaking at the edges.
 */
function boardTexture(top: string, bottom: string, look: number): CanvasTexture {
  return canvasTexture(1024, 480, (g) => {
    g.fillStyle = '#f2ede2';
    g.fillRect(0, 0, 1024, 480);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i % 2 ? '#f2ede2' : '#1f4fa0';
      g.fillRect(0, i * 96, 1024, 96);
    }
    g.fillStyle = '#c8202f';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(look === 2 ? 300 : 360, 240);
    g.lineTo(0, 480);
    g.fill();
    g.fillStyle = 'rgba(242,237,226,0.86)';
    g.fillRect(360, 60, 640, 360);
    g.fillStyle = look === 1 ? '#c8202f' : '#1b2e5c';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 110px sans-serif';
    g.fillText(top, 680, 170, 600);
    g.fillStyle = '#c8202f';
    g.fillText(bottom, 680, 320, 600);
    const random = seeded(1259 + look);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = `rgba(230,225,215,${0.3 + random() * 0.5})`;
      const edge = random() < 0.5;
      g.fillRect(
        edge ? random() * 1024 : random() < 0.5 ? random() * 60 : 964 + random() * 60,
        edge ? (random() < 0.5 ? random() * 30 : 450 + random() * 30) : random() * 480,
        4 + random() * 22,
        3 + random() * 12,
      );
    }
    g.fillStyle = 'rgba(255,250,235,0.18)';
    g.fillRect(0, 0, 1024, 480);
  });
}

/**
 * An arcade pier's face, 0.5 m by the portal's height: painted stucco with a little rustication
 * toward the foot, the paint peeling in flakes to bare grey render, salt-damp and grime rising a
 * metre from the pavement.
 */
function pierTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    speckle(g, 128, 512, '#f0ece4', 1277);
    const random = seeded(1279);
    // Rusticated joints over the lower third.
    g.fillStyle = 'rgba(90,80,70,0.35)';
    for (let y = 330; y < 512; y += 30) g.fillRect(0, y, 128, 3);
    // Peeling paint to the grey render beneath.
    for (let i = 0; i < 9; i++) {
      const x = random() * 120;
      const y = 40 + random() * 440;
      const w = 10 + random() * 30;
      const h = 6 + random() * 16;
      g.fillStyle = 'rgba(170,165,155,0.5)';
      g.beginPath();
      g.ellipse(x, y, w / 2, h / 2, random() * 3, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(255,255,250,0.3)';
      g.lineWidth = 1;
      g.stroke();
    }
    // Damp and grime rising from the foot.
    const damp = g.createLinearGradient(0, 512, 0, 380);
    damp.addColorStop(0, 'rgba(70,60,50,0.55)');
    damp.addColorStop(1, 'rgba(70,60,50,0)');
    g.fillStyle = damp;
    g.fillRect(0, 380, 128, 132);
  });
}

/** Shallow water over the rock shelf: turquoise at the wall, fading to clear forty metres out. */
function shallowsTexture(): CanvasTexture {
  return canvasTexture(256, 4, (g) => {
    const fade = g.createLinearGradient(0, 0, 256, 0);
    fade.addColorStop(0, 'rgba(70,200,195,0.8)');
    fade.addColorStop(0.35, 'rgba(50,170,190,0.45)');
    fade.addColorStop(1, 'rgba(40,120,180,0)');
    g.clearRect(0, 0, 256, 4);
    g.fillStyle = fade;
    g.fillRect(0, 0, 256, 4);
  });
}

/** Whitecaps on the swell: short white streaks lying along the wind, on a clear ground. */
function whitecapTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.clearRect(0, 0, 512, 512);
    const random = seeded(1289);
    for (let i = 0; i < 46; i++) {
      const x = random() * 512;
      const y = random() * 512;
      const w = 5 + random() * 9;
      const h = 24 + random() * 50;
      const cap = g.createRadialGradient(x, y, 0, x, y, h);
      cap.addColorStop(0, 'rgba(255,255,255,0.95)');
      cap.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = cap;
      g.beginPath();
      g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/**
 * A Malecón lamp post's paint, wrapped round the pole and running up it: grey-green gloss gone
 * chalky in the salt air, chipped to grey primer, and rust weeping down from the joints.
 */
function lampPostTexture(): CanvasTexture {
  return canvasTexture(64, 512, (g) => {
    speckle(g, 64, 512, '#8a9890', 1291);
    const random = seeded(1297);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(190,190,180,${0.3 + random() * 0.4})`;
      g.fillRect(random() * 64, random() * 512, 2 + random() * 5, 2 + random() * 4);
    }
    for (const top of [0, 250, 440]) {
      for (let i = 0; i < 6; i++) {
        const x = random() * 64;
        const run = g.createLinearGradient(0, top, 0, top + 40 + random() * 80);
        run.addColorStop(0, 'rgba(140,70,30,0.7)');
        run.addColorStop(1, 'rgba(140,70,30,0)');
        g.fillStyle = run;
        g.fillRect(x, top, 1.5 + random() * 2.5, 120);
      }
    }
  });
}

/**
 * A zebra crossing's bars: white bars half a metre wide every metre across a 2048-pixel road,
 * on a clear ground, the paint scuffed and worn thin in the wheel tracks.
 */
function zebraTexture(): CanvasTexture {
  return canvasTexture(2048, 128, (g) => {
    g.clearRect(0, 0, 2048, 128);
    const random = seeded(1321);
    const bars = 22;
    const pitch = 2048 / bars;
    for (let i = 0; i < bars; i++) {
      g.fillStyle = `rgba(240,238,230,${0.75 + random() * 0.2})`;
      g.fillRect(i * pitch + pitch * 0.25, 4, pitch * 0.5, 120);
    }
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(0,0,0,${0.3 + random() * 0.6})`;
      g.fillRect(random() * 2048, random() * 128, 2 + random() * 10, 1 + random() * 4);
    }
    g.globalCompositeOperation = 'source-over';
  });
}

/**
 * A modernist tower's front, six metres by four storeys: a band of concrete balcony parapet
 * and a band of glass and shadow behind it on each floor, the parapets streaked dark by rain,
 * and here and there washing or a screen of blinds.
 */
function towerTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, '#e4e0d8', 1331);
    const random = seeded(1337);
    for (let y = 0; y < 512; y += 128) {
      g.fillStyle = '#2a3236';
      g.fillRect(0, y + 10, 256, 66);
      g.fillStyle = 'rgba(160,190,200,0.35)';
      for (let x = 0; x < 256; x += 32) g.fillRect(x + 2, y + 12, 26, 30);
      g.fillStyle = '#efece6';
      g.fillRect(0, y + 76, 256, 52);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(0, y + 76, 256, 3);
      for (let i = 0; i < 6; i++) {
        g.fillStyle = 'rgba(70,70,65,0.18)';
        g.fillRect(random() * 256, y + 78, 2 + random() * 3, 30 + random() * 40);
      }
      if (random() < 0.5) {
        const colours = ['#e63946', '#f1c40f', '#3a86ff', '#ffffff'];
        for (let i = 0; i < 5; i++) {
          g.fillStyle = colours[Math.floor(random() * 4)]!;
          g.fillRect(40 + i * 14 + random() * 60, y + 60, 10, 18);
        }
      }
    }
  });
}

/**
 * One French window's opening, varied from window to window: open and dark with a curtain hung
 * inside and stirring, shut behind its glazed doors whose panes catch the sky, or closed up
 * behind its louvred shutters, wholly or by one leaf.
 */
function frenchWindow(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  random: () => number,
): void {
  const roll = random();
  g.fillStyle = '#26302f';
  g.fillRect(x + 16, y + 24, 44, 100);
  if (roll < 0.35) {
    // Open, a curtain hanging inside and drawn to one side.
    const curtains = ['#f4f1ea', '#e8d8b8', '#f0c8c0', '#c8d8e8', '#f4f1ea'];
    g.fillStyle = curtains[Math.floor(random() * curtains.length)]!;
    const left = random() < 0.5;
    const w = 12 + random() * 14;
    g.beginPath();
    g.moveTo(left ? x + 16 : x + 60, y + 24);
    g.lineTo(left ? x + 16 + w : x + 60 - w, y + 24);
    g.quadraticCurveTo(
      left ? x + 16 + w * 0.5 : x + 60 - w * 0.5,
      y + 80,
      left ? x + 16 + w * 0.8 : x + 60 - w * 0.8,
      y + 124,
    );
    g.lineTo(left ? x + 16 : x + 60, y + 124);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.15)';
    for (let k = 0; k < 4; k++)
      g.fillRect(left ? x + 18 + k * (w / 4) : x + 58 - k * (w / 4), y + 24, 1, 100);
  } else if (roll < 0.7) {
    // Shut behind glazed doors: white frames, panes reflecting the sky.
    const sky = g.createLinearGradient(0, y + 24, 0, y + 124);
    sky.addColorStop(0, 'rgba(200,225,240,0.95)');
    sky.addColorStop(0.6, 'rgba(120,160,190,0.9)');
    sky.addColorStop(1, 'rgba(60,80,95,0.9)');
    g.fillStyle = sky;
    g.fillRect(x + 16, y + 24, 44, 100);
    g.fillStyle = '#f0ede6';
    g.fillRect(x + 16, y + 24, 44, 3);
    g.fillRect(x + 16, y + 24, 3, 100);
    g.fillRect(x + 57, y + 24, 3, 100);
    g.fillRect(x + 37, y + 24, 2, 100);
    for (let k = y + 48; k < y + 124; k += 24) g.fillRect(x + 16, k, 44, 2);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.beginPath();
    g.moveTo(x + 20, y + 120);
    g.lineTo(x + 34, y + 30);
    g.lineTo(x + 38, y + 30);
    g.lineTo(x + 24, y + 120);
    g.fill();
  } else {
    // Closed up behind louvred shutters, both leaves or one.
    const both = roll < 0.85;
    g.fillStyle = '#3f7a5a';
    g.fillRect(x + 16, y + 24, both ? 44 : 22, 100);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let k = y + 28; k < y + 122; k += 5) g.fillRect(x + 18, k, both ? 40 : 18, 1);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    if (both) g.fillRect(x + 37, y + 24, 2, 100);
  }
}

/**
 * A pothole on a clear ground: a ragged hollow, dark at its heart, its rim of broken asphalt
 * lighter and crumbled into grit around it; or the same hollow brimming with water, which takes
 * the sky's pale blue.
 */
function potholeTexture(water: boolean): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const random = seeded(water ? 1409 : 1403);
    const rim: [number, number][] = [];
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      const r = 70 + random() * 40;
      rim.push([128 + Math.cos(a) * r, 128 + Math.sin(a) * r]);
    }
    const outline = (scale: number) => {
      g.beginPath();
      rim.forEach(([x, y], k) => {
        const px = 128 + (x - 128) * scale;
        const py = 128 + (y - 128) * scale;
        if (k) g.lineTo(px, py);
        else g.moveTo(px, py);
      });
      g.closePath();
    };
    g.fillStyle = 'rgba(120,118,112,0.8)';
    outline(1.08);
    g.fill();
    g.fillStyle = water ? 'rgba(150,185,210,0.92)' : 'rgba(34,32,30,0.92)';
    outline(0.95);
    g.fill();
    if (water) {
      g.fillStyle = 'rgba(255,255,255,0.25)';
      outline(0.6);
      g.fill();
    } else {
      g.fillStyle = 'rgba(20,18,16,0.6)';
      outline(0.6);
      g.fill();
    }
    for (let i = 0; i < 140; i++) {
      const a = random() * Math.PI * 2;
      const r = 90 + random() * 36;
      g.fillStyle = `rgba(${90 + random() * 60},${88 + random() * 60},${84 + random() * 60},0.85)`;
      g.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 2 + random() * 4, 2 + random() * 4);
    }
  });
}

/**
 * The sign of a casa particular, a licensed room to let: a white enamel plate with a blue
 * border and the blue roof-and-arch mark of the trade, worn at its edges.
 */
function casaTexture(): CanvasTexture {
  return canvasTexture(128, 96, (g) => {
    g.fillStyle = '#f4f2ec';
    g.fillRect(0, 0, 128, 96);
    g.strokeStyle = '#1f4fa0';
    g.lineWidth = 6;
    g.strokeRect(4, 4, 120, 88);
    g.fillStyle = '#1f4fa0';
    g.beginPath();
    g.moveTo(30, 52);
    g.lineTo(64, 20);
    g.lineTo(98, 52);
    g.lineTo(86, 52);
    g.lineTo(64, 32);
    g.lineTo(42, 52);
    g.fill();
    g.beginPath();
    g.arc(64, 70, 18, Math.PI, 0);
    g.lineTo(74, 70);
    g.arc(64, 70, 10, 0, Math.PI, true);
    g.fill();
    g.fillStyle = 'rgba(120,90,60,0.35)';
    g.fillRect(0, 88, 128, 8);
  });
}

/**
 * Paint on the seawall's landward face, 36 m of it along a 0.64 m height: names and hearts in
 * brush paint, sprayed tags in two colours, and pale patches of whitewash over older ones, with
 * long stretches of bare wall between.
 */
function graffitiTexture(): CanvasTexture {
  return canvasTexture(64, 2048, (g) => {
    g.clearRect(0, 0, 64, 2048);
    const random = seeded(1451);
    const colours = ['#c8202f', '#1d70b8', '#f1c40f', '#2a9d8f', '#f2f2ee', '#1a1a1a', '#e07a9a'];
    for (let y = 30; y < 2000; y += 60 + random() * 140) {
      const roll = random();
      const h = 40 + random() * 90;
      if (roll < 0.3) {
        // A whitewash patch.
        g.fillStyle = `rgba(235,232,222,${0.5 + random() * 0.3})`;
        g.fillRect(4 + random() * 10, y, 44 + random() * 12, h);
      }
      // The tag: loops and strokes of spray along the wall.
      g.strokeStyle = colours[Math.floor(random() * colours.length)]!;
      g.lineWidth = 2 + random() * 3;
      g.globalAlpha = 0.7 + random() * 0.3;
      g.beginPath();
      g.moveTo(20 + random() * 24, y);
      for (let k = 0; k < 7; k++) {
        g.quadraticCurveTo(
          10 + random() * 44,
          y + (k + 0.5) * (h / 7),
          14 + random() * 36,
          y + (k + 1) * (h / 7),
        );
      }
      g.stroke();
      if (random() < 0.35) {
        // A heart.
        const cx = 32;
        const cy = y + h / 2;
        g.fillStyle = '#c8202f';
        g.beginPath();
        g.arc(cx - 6, cy - 5, 6, 0, Math.PI * 2);
        g.arc(cx + 6, cy - 5, 6, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(cx - 12, cy - 3);
        g.lineTo(cx, cy + 12);
        g.lineTo(cx + 12, cy - 3);
        g.fill();
      }
      g.globalAlpha = 1;
    }
  });
}

/** A bus stop's plate: PARADA in white capitals on Havana's blue, with a bus drawn above. */
function paradaTexture(): CanvasTexture {
  return canvasTexture(128, 84, (g) => {
    g.fillStyle = '#1f4fa0';
    g.fillRect(0, 0, 128, 84);
    g.fillStyle = '#f4f2ec';
    g.fillRect(34, 10, 60, 24);
    g.fillStyle = '#1f4fa0';
    g.fillRect(40, 14, 10, 8);
    g.fillRect(54, 14, 10, 8);
    g.fillRect(68, 14, 10, 8);
    g.fillStyle = '#f4f2ec';
    g.beginPath();
    g.arc(44, 36, 4, 0, Math.PI * 2);
    g.arc(84, 36, 4, 0, Math.PI * 2);
    g.fill();
    g.font = 'bold 22px sans-serif';
    g.textAlign = 'center';
    g.fillText('PARADA', 64, 66, 116);
  });
}

/**
 * Cirrus: a band of fibrous ice-cloud streaks on transparency, each a bundle of fine strands drawn
 * along a gentle curve and hooked at one end, fading out along their length.
 */
function cirrusTexture(): CanvasTexture {
  return canvasTexture(1024, 320, (g) => {
    g.clearRect(0, 0, 1024, 320);
    const random = seeded(1493);
    g.lineCap = 'round';
    for (let k = 0; k < 26; k++) {
      const x0 = random() * 760;
      const y0 = 60 + random() * 200;
      const length = 160 + random() * 260;
      const rise = (random() - 0.5) * 60;
      const hook = 12 + random() * 26;
      for (let f = 0; f < 18; f++) {
        const dy = (random() - 0.5) * 16;
        const fade = g.createLinearGradient(x0, 0, x0 + length, 0);
        const a = 0.1 + random() * 0.14;
        fade.addColorStop(0, `rgba(255,255,255,0)`);
        fade.addColorStop(0.2, `rgba(255,255,255,${a})`);
        fade.addColorStop(0.75, `rgba(255,255,255,${a * 0.8})`);
        fade.addColorStop(1, `rgba(255,255,255,0)`);
        g.strokeStyle = fade;
        g.lineWidth = 1 + random() * 3;
        g.beginPath();
        g.moveTo(x0, y0 + dy);
        g.quadraticCurveTo(
          x0 + length * 0.5,
          y0 + dy + rise,
          x0 + length,
          y0 + dy + rise * 0.4 - hook,
        );
        g.stroke();
      }
    }
  });
}

/**
 * The inland gutter, 0.6 m across (u from the kerb) and 24 m along: a grime band darkest at the
 * kerb's foot, drifts of pale sand, scattered dry leaves and the odd scrap of litter, on clear.
 */
function gutterTexture(): CanvasTexture {
  return canvasTexture(64, 1024, (g) => {
    g.clearRect(0, 0, 64, 1024);
    const band = g.createLinearGradient(0, 0, 64, 0);
    band.addColorStop(0, 'rgba(30,28,24,0.75)');
    band.addColorStop(0.4, 'rgba(40,36,30,0.4)');
    band.addColorStop(1, 'rgba(40,36,30,0)');
    g.fillStyle = band;
    g.fillRect(0, 0, 64, 1024);
    const random = seeded(1487);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(210,190,145,${0.5 + random() * 0.35})`;
      g.beginPath();
      g.ellipse(
        random() * 22,
        random() * 1024,
        4 + random() * 10,
        20 + random() * 60,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    const leaves = ['#7a5a2a', '#a07a3a', '#5a4a2a', '#8a6a3a'];
    for (let i = 0; i < 90; i++) {
      g.fillStyle = leaves[i % leaves.length]!;
      g.save();
      g.translate(random() * 30, random() * 1024);
      g.rotate(random() * Math.PI);
      g.beginPath();
      g.ellipse(0, 0, 2.5, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    const litter = ['#f2f2ee', '#c8202f', '#1d70b8', '#e8d8a8'];
    for (let i = 0; i < 12; i++) {
      g.fillStyle = litter[i % litter.length]!;
      g.fillRect(random() * 26, random() * 1024, 3 + random() * 4, 4 + random() * 6);
    }
  });
}

/** A cast-iron drain grate: a dark frame and rusty bars across slots open to black. */
function grateTexture(): CanvasTexture {
  return canvasTexture(64, 112, (g) => {
    g.fillStyle = '#3a3634';
    g.fillRect(0, 0, 64, 112);
    g.fillStyle = '#0a0a0a';
    for (let y = 10; y < 102; y += 9) g.fillRect(8, y, 48, 5);
    g.fillStyle = 'rgba(140,80,40,0.35)';
    for (let i = 0; i < 20; i++) g.fillRect((i * 37) % 60, (i * 53) % 108, 6, 4);
  });
}

/**
 * Tar snakes over the whole road, its width across and 60 m along: sealant lines poured along
 * the cracks, long wandering runs down the lanes, short ones across them, and branching forks,
 * glossy black and a little ragged at the edges, on clear.
 */
function tarTexture(): CanvasTexture {
  return canvasTexture(512, 2048, (g) => {
    g.clearRect(0, 0, 512, 2048);
    const random = seeded(1559);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const snake = (x: number, y: number, dx: number, dy: number, steps: number) => {
      g.strokeStyle = `rgba(14,14,16,${0.75 + random() * 0.2})`;
      g.lineWidth = 2.5 + random() * 2.5;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < steps; k++) {
        x += dx + (random() - 0.5) * 10;
        y += dy + (random() - 0.5) * 10;
        g.lineTo(x, y);
        if (random() < 0.08) {
          g.stroke();
          snake(
            x,
            y,
            dy * 0.3 * (random() < 0.5 ? 1 : -1),
            dx + dy * 0.6,
            3 + Math.floor(random() * 6),
          );
          g.strokeStyle = `rgba(14,14,16,${0.75 + random() * 0.2})`;
          g.lineWidth = 2.5 + random() * 2.5;
          g.beginPath();
          g.moveTo(x, y);
        }
      }
      g.stroke();
    };
    for (let i = 0; i < 9; i++)
      snake(random() * 512, random() * 2048, 0, 14, 12 + Math.floor(random() * 30));
    for (let i = 0; i < 14; i++)
      snake(
        random() * 200,
        random() * 2048,
        12,
        (random() - 0.5) * 4,
        6 + Math.floor(random() * 22),
      );
  });
}

/** A round road sign's face: a speed limit of 50 in a red ring, or no parking, a red bar on blue. */
function signTexture(kind: 'limit' | 'parking'): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#f4f2ec';
    g.fillRect(0, 0, 128, 128);
    g.beginPath();
    g.arc(64, 64, 62, 0, Math.PI * 2);
    g.fillStyle = '#c8202f';
    g.fill();
    g.beginPath();
    g.arc(64, 64, 48, 0, Math.PI * 2);
    g.fillStyle = kind === 'limit' ? '#f4f2ec' : '#1f4fa0';
    g.fill();
    if (kind === 'limit') {
      g.fillStyle = '#1a1a1a';
      g.font = 'bold 50px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('50', 64, 68);
    } else {
      g.save();
      g.translate(64, 64);
      g.rotate(-Math.PI / 4);
      g.fillStyle = '#c8202f';
      g.fillRect(-52, -7, 104, 14);
      g.restore();
    }
  });
}

/** An awning's canvas: broad stripes of a faded colour on cream, a scalloped edge at the hem. */
function awningTexture(colour: string): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.fillStyle = '#efe6d2';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = colour;
    for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 16, 56);
    g.clearRect(0, 56, 128, 8);
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = (x / 16) % 2 ? '#efe6d2' : colour;
      g.beginPath();
      g.arc(x + 8, 56, 8, 0, Math.PI);
      g.fill();
    }
    g.fillStyle = 'rgba(255,255,240,0.25)';
    g.fillRect(0, 0, 128, 20);
  });
}

/**
 * Kerb paint along 120 m of kerb (u across its top and face): stretches of yellow, and of red
 * and white blocks a metre long, each chipped and faded with the stone showing through, on clear.
 */
function kerbPaintTexture(): CanvasTexture {
  return canvasTexture(32, 2048, (g) => {
    g.clearRect(0, 0, 32, 2048);
    const random = seeded(1631);
    const metre = 2048 / 120;
    for (let y = 0; y < 2048;) {
      const length = (8 + random() * 16) * metre;
      if (random() < 0.55) {
        g.fillStyle = `rgba(230,190,40,${0.75 + random() * 0.2})`;
        g.fillRect(0, y, 32, length);
      } else {
        for (let k = 0; k < length; k += metre) {
          g.fillStyle = (k / metre) % 2 < 1 ? 'rgba(200,40,40,0.85)' : 'rgba(240,238,230,0.85)';
          g.fillRect(0, y + k, 32, Math.min(metre, length - k));
        }
      }
      // Chips and wear back to the stone.
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < length / 3; i++) {
        g.fillStyle = `rgba(0,0,0,${0.4 + random() * 0.6})`;
        g.fillRect(random() * 32, y + random() * length, 2 + random() * 6, 2 + random() * 8);
      }
      g.globalCompositeOperation = 'source-over';
      y += length + (3 + random() * 8) * metre;
    }
  });
}

/** A manhole cover's face: rusted iron, a raised cross-hatch, a rim, two lifting slots. */
function manholeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#3a3532';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#5a5048';
    g.lineWidth = 3;
    for (let k = -128; k < 256; k += 12) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + 128, 128);
      g.moveTo(k, 128);
      g.lineTo(k + 128, 0);
      g.stroke();
    }
    g.lineWidth = 8;
    g.strokeStyle = '#4a4440';
    g.beginPath();
    g.arc(64, 64, 58, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#141210';
    g.fillRect(40, 60, 12, 6);
    g.fillRect(76, 60, 12, 6);
    const random = seeded(1641);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(${130 + random() * 40},${60 + random() * 20},30,${0.15 + random() * 0.25})`;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 2 + random() * 9, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** A shop's hanging board: painted lettering on a coloured ground, edged, with its emblem. */
function shopSignTexture(kind: 'bodega' | 'farmacia' | 'cafe' | 'barberia'): CanvasTexture {
  const look = {
    bodega: ['#7a2a1e', '#f2e4c0', 'BODEGA'],
    farmacia: ['#f2f2ec', '#1f7a3a', 'FARMACIA'],
    cafe: ['#2a4a3a', '#f2d890', 'CAFÉ'],
    barberia: ['#1f3f7a', '#f2f2ec', 'BARBERÍA'],
  }[kind];
  return canvasTexture(176, 100, (g) => {
    g.fillStyle = look[0]!;
    g.fillRect(0, 0, 176, 100);
    g.strokeStyle = look[1]!;
    g.lineWidth = 5;
    g.strokeRect(6, 6, 164, 88);
    g.fillStyle = look[1]!;
    g.textAlign = 'center';
    g.font = 'bold 28px serif';
    if (kind === 'farmacia') {
      g.fillRect(74, 14, 28, 44);
      g.fillRect(66, 22, 44, 28);
      g.font = 'bold 22px sans-serif';
      g.fillText(look[2]!, 88, 84, 156);
    } else if (kind === 'barberia') {
      for (let k = 0; k < 4; k++) {
        g.fillStyle = k % 2 ? '#d02030' : '#f2f2ec';
        g.fillRect(78 + k * 0, 14 + k * 10, 20, 10);
      }
      g.fillStyle = look[1]!;
      g.font = 'bold 24px serif';
      g.fillText(look[2]!, 88, 84, 156);
    } else {
      g.fillText(look[2]!, 88, 62, 156);
    }
    // Weather: sun-fading and grime.
    const random = seeded(kind.length * 31 + 1643);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '255,250,230' : '40,30,20'},${0.05 + random() * 0.1})`;
      g.fillRect(random() * 176, random() * 100, 4 + random() * 20, 2 + random() * 8);
    }
  });
}

/**
 * A contrail along the texture's length: a fresh one is a crisp double line that starts at the
 * aircraft's speck and widens and fades behind it; an old one is a broad, uneven, wispy band.
 */
function contrailTexture(fresh: boolean): CanvasTexture {
  return canvasTexture(1024, 64, (g) => {
    g.clearRect(0, 0, 1024, 64);
    const random = seeded(fresh ? 1647 : 1651);
    for (let x = 0; x < 1024; x += 4) {
      const t = x / 1024;
      if (fresh) {
        if (t < 0.012) continue;
        const fade = Math.min(1, (1 - t) * 1.8);
        const spread = 2 + t * 10;
        g.fillStyle = `rgba(255,255,255,${0.25 * fade})`;
        g.fillRect(x, 32 - spread * 1.6, 4, spread * 3.2);
        g.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
        g.fillRect(x, 32 - spread / 2, 4, spread);
      } else {
        const wobble = Math.sin(t * 9) * 5 + (random() - 0.5) * 2;
        const fade = Math.sin(t * Math.PI) * (0.7 + random() * 0.3);
        g.fillStyle = `rgba(255,255,255,${0.22 * fade})`;
        g.fillRect(x, 32 + wobble - 18, 4, 36);
        g.fillStyle = `rgba(255,255,255,${0.35 * fade})`;
        g.fillRect(x, 32 + wobble - 8, 4, 16);
      }
    }
    if (fresh) {
      g.fillStyle = 'rgb(200,205,215)';
      g.fillRect(0, 29, 12, 6);
    }
  });
}

/** A lane arrow (pointing to the texture's top): a long shaft and a head, a right branch if it
 * turns, painted white and scuffed and worn grey along the tyre tracks. */
function arrowTexture(turn: boolean): CanvasTexture {
  return canvasTexture(64, 320, (g) => {
    g.clearRect(0, 0, 64, 320);
    g.fillStyle = 'rgba(236,234,226,0.85)';
    g.fillRect(26, 90, 12, 225);
    g.beginPath();
    g.moveTo(32, 4);
    g.lineTo(58, 100);
    g.lineTo(6, 100);
    g.closePath();
    g.fill();
    if (turn) {
      g.fillRect(36, 170, 18, 10);
      g.beginPath();
      g.moveTo(62, 150);
      g.lineTo(62, 200);
      g.lineTo(50, 175);
      g.closePath();
      g.fill();
    }
    g.globalCompositeOperation = 'destination-out';
    const random = seeded(turn ? 1673 : 1677);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(0,0,0,${0.3 + random() * 0.7})`;
      g.fillRect(random() * 64, random() * 320, 1 + random() * 5, 1 + random() * 9);
    }
    g.globalCompositeOperation = 'source-over';
  });
}

/** A papalote's paper: four bright panels meeting at the spine and spar, edged dark. */
function kiteTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    const panels = ['#e8302a', '#f2d040', '#2a5ad8', '#2aa860'];
    [
      [0, 0],
      [32, 0],
      [0, 32],
      [32, 32],
    ].forEach(([x, y], i) => {
      g.fillStyle = panels[i]!;
      g.fillRect(x!, y!, 32, 32);
    });
    g.fillStyle = '#f2f2ea';
    g.beginPath();
    g.arc(32, 28, 8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2a2018';
    g.fillRect(31, 0, 2, 64);
    g.fillRect(0, 37, 64, 2);
  });
}
