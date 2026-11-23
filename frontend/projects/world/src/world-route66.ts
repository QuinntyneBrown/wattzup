// Route 66 Desert's highway, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// Mother Road across northern Arizona on a golden afternoon. The two-lane blacktop runs out
// between red sand, sagebrush and saguaros, the telegraph poles marching beside it; red mesas
// stand round the horizon. Once a lap the road passes a chrome diner with its gas pumps and a neon
// motel; shields and billboards, and a run of little rhyming signs, give the rider something to
// sprint for. Classic cars and a big rig pass the other way and tumbleweeds roll across. Built on
// the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  bob,
  canvasTexture,
  loopFade,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
  wrapFade,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The highway repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 480;
const BEHIND = 24;
/** The oncoming lane left of the rider, and the gravel shoulders either side. */
const LANE = 3.6;
const SHOULDER = 2.2;
/** The telegraph line runs this far right of the road. */
const POLES = 13;
const POLE_EVERY = 40;
/** Scrub is laid in tiles TILE metres long. */
const TILE = 40;
/** The diner stands once a lap on the right, the motel on the left. */
const DINER_AT = 330;
const MOTEL_AT = 120;
/** The little rhyming signs, one every RHYME metres from RHYME_AT. */
const RHYME_AT = 200;
const RHYME = 24;
const RHYMES = [
  'HOLD YOUR TEMPO',
  'DOWN THE LINE',
  'TILL YOU SEE',
  'THE NEXT BIG SIGN',
  'THEN SPRINT!',
];

interface Mover {
  readonly mesh: Group;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
}

interface Tumbleweed {
  readonly mesh: Mesh;
  readonly offset: number;
  readonly phase: number;
}

export class Route66Street implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly traffic: Mover[] = [];
  private readonly tumbleweeds: Tumbleweed[] = [];
  private readonly mesas = new Group();
  private readonly neon: MeshBasicMaterial[] = [];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addGround(roadHalf, points);
    this.addScrub(roadHalf);
    this.addSaguaros(roadHalf);
    this.addTelegraph(roadHalf);
    this.addSigns(roadHalf);
    this.addDiner(roadHalf);
    this.addMotel(roadHalf);
    this.addTraffic(roadHalf);
    this.addTumbleweeds();
    this.addMesas();
  }

  /** The motel's VACANCY flickers on; everything else moves on the clock in `place`. */
  setTime(seconds: number): void {
    this.time = seconds;
    const on = Math.floor(seconds * 1.5) % 5 !== 0;
    this.neon[2]?.color.setScalar(on ? 1 : 0.25);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    for (const car of this.traffic) {
      const metres = loopMetres(car.offset + car.speed * this.time, s, LOOP, BEHIND);
      car.mesh.position.set(car.x, heightAt(metres), -metres);
      car.mesh.scale.setScalar(loopFade(metres, LOOP, BEHIND));
    }
    // A tumbleweed blows across the road from the right, bounding as it rolls.
    for (const weed of this.tumbleweeds) {
      const metres = loopMetres(weed.offset, s, LOOP, BEHIND);
      const across = ((this.time * 3.2 + weed.phase * 90) % 90) - 45;
      const bound = bob(this.time * 3 + weed.phase * 6) * 0.5;
      weed.mesh.position.set(-across, heightAt(metres) + 0.45 + bound, -metres);
      // It dwindles away before it wraps back across the road, and grows back after (#902).
      weed.mesh.scale.setScalar(wrapFade(across, -45, 45, 8) * loopFade(metres, LOOP, BEHIND));
      weed.mesh.rotation.z = this.time * 2.6;
    }
    // The mesas stand round the horizon and keep their distance as the rider rides.
    this.mesas.position.set(0, heightAt(0) - 4, 0);
  }

  /** The oncoming lane and its double yellow line, the gravel shoulders and the red desert. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const lane = this.material({ map: this.repeat(laneTexture(), LANE, 16), roughness: 0.85 });
    const gravel = this.material({ map: this.repeat(gravelTexture(), SHOULDER, 3), roughness: 1 });
    const sand = this.material({ map: this.repeat(sandTexture(), 12, 12), roughness: 1 });
    this.ribbons.add(points, lane, [
      [-r, 0.005],
      [-r - LANE, 0.005],
    ]);
    this.ribbons.add(points, gravel, [
      [-r - LANE, 0.005],
      [-r - LANE - SHOULDER, -0.08],
    ]);
    this.ribbons.add(points, gravel, [
      [r + SHOULDER, -0.08],
      [r, 0.005],
    ]);
    this.ribbons.add(points, sand, [
      [-r - LANE - SHOULDER, -0.08],
      [-r - LANE - 40, 0.4],
      [-r - LANE - 400, 1.5],
    ]);
    this.ribbons.add(points, sand, [
      [r + 400, 1.5],
      [r + 40, 0.4],
      [r + SHOULDER, -0.08],
    ]);
  }

  /** Sagebrush, creosote and rocks scattered over the sand, in tiles laid along the highway. */
  private addScrub(roadHalf: number): void {
    const brush = this.material({ color: 0x8a9a6a, roughness: 1 });
    const rock = this.material({ color: 0x9a5a3a, roughness: 1 });
    const tiles = [0, 1, 2].map((k) => scrubTile(roadHalf + 3, 120, 260 + k));
    const stones = [0, 1, 2].map((k) => rockTile(roadHalf + 3, 120, 270 + k));
    this.disposables.push(...tiles, ...stones);
    for (const side of [-1, 1] as const) {
      for (let offset = 0, k = 0; offset < LOOP; offset += TILE, k++) {
        const tile = new Group();
        tile.add(new Mesh(tiles[k % 3]!, brush), new Mesh(stones[(k + 1) % 3]!, rock));
        if (side < 0) tile.scale.x = -1;
        this.group.add(tile);
        this.props.push({ mesh: tile, offset, x: side < 0 ? -LANE - SHOULDER + 3 : 0 });
      }
    }
  }

  /** Saguaros standing out in the scrub, arms raised. */
  private addSaguaros(roadHalf: number): void {
    const random = seeded(283);
    const green = this.material({ color: 0x4f6b3a, roughness: 0.8 });
    const shapes = [0, 1, 2].map((k) => saguaro(290 + k));
    this.disposables.push(...shapes);
    for (let offset = 0; offset < LOOP; offset += 18 + random() * 30) {
      const side = random() < 0.5 ? -1 : 1;
      const cactus = new Group();
      const mesh = new Mesh(shapes[Math.floor(random() * 3)]!, green);
      mesh.castShadow = true;
      cactus.add(mesh);
      cactus.rotation.y = random() * 6.3;
      cactus.scale.setScalar(0.8 + random() * 0.5);
      this.group.add(cactus);
      const x = side * (roadHalf + LANE + 9 + random() * 60);
      this.props.push({ mesh: cactus, offset, x });
    }
  }

  /** The telegraph line: weathered poles with their crossarms, the wires sagging between. */
  private addTelegraph(roadHalf: number): void {
    const wood = this.material({ color: 0x6b5644, roughness: 1 });
    const wire = this.material({ color: 0x1a1a1a, roughness: 0.6 });
    for (let offset = 0; offset < LOOP; offset += POLE_EVERY) {
      const pole = new Group();
      const post = new Mesh(this.unit, wood);
      post.scale.set(0.28, 9, 0.28);
      post.position.y = 4.5;
      post.castShadow = true;
      const arm = new Mesh(this.unit, wood);
      arm.scale.set(2.6, 0.16, 0.16);
      arm.position.y = 8.4;
      pole.add(post, arm);
      for (const x of [-1.1, -0.4, 0.4, 1.1]) {
        const w = new Mesh(this.unit, wire);
        w.scale.set(0.03, 0.03, POLE_EVERY);
        w.position.set(x, 8.2, POLE_EVERY / 2);
        pole.add(w);
      }
      this.group.add(pole);
      this.props.push({ mesh: pole, offset, x: roadHalf + POLES });
    }
  }

  /** Route 66 shields, a billboard, and the run of little rhyming signs to sprint for. */
  private addSigns(roadHalf: number): void {
    const wood = this.material({ color: 0x7a6248, roughness: 1 });
    const steel = this.material({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.4 });
    const shield = this.material({
      map: this.track(shieldTexture()),
      side: DoubleSide,
      alphaTest: 0.5,
    });
    const shieldFace = new PlaneGeometry(1.4, 1.4);
    this.disposables.push(shieldFace);
    for (let offset = 40; offset < LOOP; offset += 160) {
      const sign = new Group();
      const post = new Mesh(this.unit, steel);
      post.scale.set(0.08, 2.4, 0.08);
      post.position.y = 1.2;
      const face = new Mesh(shieldFace, shield);
      face.position.y = 2.6;
      face.rotation.y = -0.25;
      sign.add(post, face);
      this.group.add(sign);
      this.props.push({ mesh: sign, offset, x: roadHalf + SHOULDER + 0.8 });
    }
    // The billboard, out in the scrub on its timber legs.
    const board = new Group();
    const face = new Mesh(
      new PlaneGeometry(12, 4.5),
      this.material({ map: this.track(billboardTexture()), roughness: 0.8 }),
    );
    this.disposables.push(face.geometry);
    face.position.y = 6;
    face.rotation.y = -0.35;
    board.add(face);
    for (const x of [-4.5, 0, 4.5]) {
      const leg = new Mesh(this.unit, wood);
      leg.scale.set(0.3, 6, 0.3);
      leg.position.set(x * 0.94, 3, 1.6 * Math.sin(-0.35) * (x / 4.5));
      board.add(leg);
    }
    this.group.add(board);
    this.props.push({ mesh: board, offset: 90, x: roadHalf + 18 });
    // The rhyming signs, each a little red board on its post.
    const plate = new PlaneGeometry(2.2, 0.8);
    this.disposables.push(plate);
    RHYMES.forEach((line, k) => {
      const sign = new Group();
      const post = new Mesh(this.unit, wood);
      post.scale.set(0.12, 1.6, 0.12);
      post.position.y = 0.8;
      const face = new Mesh(
        plate,
        this.material({ map: this.track(rhymeTexture(line)), side: DoubleSide }),
      );
      face.position.y = 1.7;
      face.rotation.y = -0.3;
      sign.add(post, face);
      this.group.add(sign);
      this.props.push({ mesh: sign, offset: RHYME_AT + k * RHYME, x: roadHalf + SHOULDER + 1.5 });
    });
  }

  /**
   * The chrome diner once a lap on the right: a streamlined stainless car with its red band and
   * windows, the DINER sign on its roof, and the gas pumps under their canopy beside it.
   */
  private addDiner(roadHalf: number): void {
    const stop = new Group();
    const chrome = this.material({
      map: this.track(dinerTexture()),
      metalness: 0.85,
      roughness: 0.25,
    });
    const caps = this.material({ color: 0xd9dde2, metalness: 0.9, roughness: 0.2 });
    const lot = this.material({ map: this.repeat(gravelTexture(), 6, 6), roughness: 1 });
    const white = this.material({ color: 0xf2efe6, roughness: 0.6 });
    const red = this.material({ color: 0xc8102e, roughness: 0.4 });
    const sign = new MeshBasicMaterial({
      map: this.track(neonTexture('DINER', '#ff3b8a')),
      transparent: true,
    });
    this.neon.push(sign);
    this.disposables.push(sign);
    const yard = new Mesh(this.unit, lot);
    yard.scale.set(34, 0.06, 60);
    yard.position.set(17, 0.03, 0);
    stop.add(yard);
    // The diner car: a long box with rounded ends.
    const body = new Mesh(this.unit, chrome);
    body.scale.set(5, 3.4, 16);
    body.position.set(18, 1.9, -8);
    const end = new CylinderGeometry(2.5, 2.5, 3.4, 20, 1, false, 0, Math.PI);
    this.disposables.push(end);
    const front = new Mesh(end, caps);
    front.position.set(18, 1.9, -16);
    front.rotation.y = Math.PI / 2;
    const back = new Mesh(end, caps);
    back.position.set(18, 1.9, 0);
    back.rotation.y = -Math.PI / 2;
    const roof = new Mesh(this.unit, red);
    roof.scale.set(5.4, 0.3, 16.6);
    roof.position.set(18, 3.75, -8);
    const board = new Mesh(new PlaneGeometry(9, 2.2), sign);
    this.disposables.push(board.geometry);
    board.position.set(17, 5.4, -8);
    board.rotation.y = -Math.PI / 2;
    stop.add(body, front, back, roof, board);
    // The canopy and its two vintage pumps, globes on top.
    const canopy = new Mesh(this.unit, white);
    canopy.scale.set(8, 0.5, 10);
    canopy.position.set(9, 4.8, 14);
    stop.add(canopy);
    for (const z of [10, 18]) {
      const post = new Mesh(this.unit, white);
      post.scale.set(0.3, 4.6, 0.3);
      post.position.set(9, 2.3, z);
      const pump = new Mesh(this.unit, red);
      pump.scale.set(0.8, 1.9, 0.6);
      pump.position.set(7.5, 0.95, z - 1.5);
      const globe = new Mesh(new SphereGeometry(0.3, 12, 8), white);
      this.disposables.push(globe.geometry);
      globe.position.set(7.5, 2.15, z - 1.5);
      stop.add(post, pump, globe);
    }
    stop.children.forEach((m) => (m.castShadow = true));
    this.group.add(stop);
    this.props.push({ mesh: stop, offset: DINER_AT, x: roadHalf + SHOULDER });
  }

  /** The motel once a lap on the left: a row of rooms and its tall neon sign with VACANCY. */
  private addMotel(roadHalf: number): void {
    const motel = new Group();
    const rooms = this.material({ map: this.track(roomsTexture()), roughness: 0.8 });
    const roof = this.material({ color: 0x3a6b6a, roughness: 0.8 });
    const steel = this.material({ color: 0x2a2c30, metalness: 0.5, roughness: 0.5 });
    const name = new MeshBasicMaterial({
      map: this.track(neonTexture('MOTEL', '#39d3ff')),
      transparent: true,
      side: DoubleSide,
    });
    const vacancy = new MeshBasicMaterial({
      map: this.track(neonTexture('VACANCY', '#ff3b2f')),
      transparent: true,
      side: DoubleSide,
    });
    this.neon.push(name, vacancy);
    this.disposables.push(name, vacancy);
    const row = new Mesh(new BoxGeometry(8, 3.2, 44), [
      rooms,
      rooms,
      roof,
      roof,
      rooms,
      rooms,
    ] as Material[]);
    this.disposables.push(row.geometry);
    row.position.set(-26, 1.6, 0);
    const eaves = new Mesh(this.unit, roof);
    eaves.scale.set(10, 0.3, 46);
    eaves.position.set(-25.5, 3.35, 0);
    motel.add(row, eaves);
    const pole = new Mesh(this.unit, steel);
    pole.scale.set(0.4, 10, 0.4);
    pole.position.set(-6, 5, -18);
    const board = new Mesh(new PlaneGeometry(6, 2.2), name);
    const lower = new Mesh(new PlaneGeometry(5, 1.1), vacancy);
    this.disposables.push(board.geometry, lower.geometry);
    board.position.set(-6, 9, -18);
    board.rotation.y = Math.PI / 2 - 0.4;
    lower.position.set(-6, 7.2, -18);
    lower.rotation.y = Math.PI / 2 - 0.4;
    motel.add(pole, board, lower);
    this.group.add(motel);
    this.props.push({ mesh: motel, offset: MOTEL_AT, x: -roadHalf - LANE });
  }

  /** Classic cars and a big rig coming the other way down the oncoming lane. */
  private addTraffic(roadHalf: number): void {
    const paints = [0x2ab3a6, 0xc8102e, 0xf2e6c8, 0x1b3a8a].map((hex) =>
      this.material({ color: hex, metalness: 0.5, roughness: 0.3 }),
    );
    const chrome = this.material({ color: 0xdfe3e8, metalness: 0.95, roughness: 0.15 });
    const glass = this.material({ color: 0x1a2430, metalness: 0.5, roughness: 0.1 });
    const x = -roadHalf - LANE / 2;
    paints.forEach((paint, k) => {
      const car = new Group();
      const body = new Mesh(this.unit, paint);
      body.scale.set(2, 0.8, 5.4);
      body.position.y = 0.75;
      const cabin = new Mesh(this.unit, glass);
      cabin.scale.set(1.7, 0.6, 2.4);
      cabin.position.set(0, 1.45, 0.4);
      const bumper = new Mesh(this.unit, chrome);
      bumper.scale.set(2.1, 0.2, 5.6);
      bumper.position.y = 0.45;
      car.add(body, cabin, bumper);
      // Tail fins.
      for (const side of [-0.85, 0.85]) {
        const fin = new Mesh(this.unit, paint);
        fin.scale.set(0.1, 0.35, 1.2);
        fin.position.set(side, 1.25, 2.1);
        car.add(fin);
      }
      car.rotation.y = Math.PI;
      this.group.add(car);
      this.traffic.push({ mesh: car, offset: k * 120 + 30, x, speed: -22 });
    });
    // The big rig: its cab and a long silver trailer.
    const rig = new Group();
    const cab = new Mesh(this.unit, paints[1]!);
    cab.scale.set(2.5, 3.2, 3);
    cab.position.set(0, 1.9, -7.5);
    const trailer = new Mesh(this.unit, chrome);
    trailer.scale.set(2.6, 3.6, 13);
    trailer.position.set(0, 2.3, 1);
    const stack = new Mesh(this.unit, chrome);
    stack.scale.set(0.2, 2, 0.2);
    stack.position.set(1.1, 4, -6.2);
    rig.add(cab, trailer, stack);
    rig.rotation.y = Math.PI;
    this.group.add(rig);
    // The rig keeps the cars' speed in their lane, between two of them, so none drives through
    // it (#902).
    this.traffic.push({ mesh: rig, offset: 210, x, speed: -22 });
  }

  /** Tumbleweeds blowing across the highway. */
  private addTumbleweeds(): void {
    const brush = this.material({ color: 0xa8875a, wireframe: true });
    const ball = new IcosahedronGeometry(0.45, 2);
    this.disposables.push(ball);
    for (const [offset, phase] of [
      [70, 0.1],
      [190, 0.55],
      [380, 0.8],
    ] as const) {
      const weed = new Mesh(ball, brush);
      this.group.add(weed);
      this.tumbleweeds.push({ mesh: weed, offset, phase });
    }
  }

  /** Red mesas round the horizon: flat tops over banded cliffs, talus slopes at their feet. */
  private addMesas(): void {
    const random = seeded(307);
    const strata = this.track(strataTexture());
    strata.wrapS = RepeatWrapping;
    const cliff = this.material({ map: strata, roughness: 1 });
    const talus = this.material({ color: 0xb0603a, roughness: 1 });
    for (let k = 0; k < 26; k++) {
      // Off to either side and ahead, never on the line of the road.
      const side = random() < 0.5 ? -1 : 1;
      const angle = side * (0.25 + random() * 1.9);
      const distance = 600 + random() * 900;
      const radius = 40 + random() * 160;
      const height = 40 + random() * 90;
      const top = new CylinderGeometry(radius * 0.92, radius, height, 9 + Math.floor(random() * 5));
      top.translate(0, height / 2 + height * 0.35, 0);
      const foot = new ConeGeometry(radius * 1.5, height * 0.7, 12);
      foot.translate(0, height * 0.35, 0);
      this.disposables.push(top, foot);
      const mesa = new Group();
      mesa.add(new Mesh(top, cliff), new Mesh(foot, talus));
      mesa.position.set(Math.sin(angle) * distance, 0, -Math.cos(angle) * distance);
      mesa.scale.set(1, 1, 0.6 + random() * 0.8);
      mesa.rotation.y = random() * 6.3;
      this.mesas.add(mesa);
    }
    this.group.add(this.mesas);
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

/** A tile of sagebrush clumps over `width` metres of desert beside the road, from `inner` out. */
function scrubTile(inner: number, width: number, seed: number): BufferGeometry {
  const random = seeded(seed);
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 140; k++) {
    const clump = new IcosahedronGeometry(0.3 + random() * 0.5, 0);
    clump.scale(1, 0.6, 1);
    const x = inner + Math.pow(random(), 0.7) * width;
    clump.translate(x, 0.2, -random() * TILE);
    parts.push(clump);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A tile of red rocks scattered among the scrub. */
function rockTile(inner: number, width: number, seed: number): BufferGeometry {
  const random = seeded(seed);
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 30; k++) {
    const stone = new IcosahedronGeometry(0.3 + random() * 1.2, 0);
    stone.scale(1, 0.5 + random() * 0.4, 1);
    stone.translate(inner + 4 + random() * width, 0.1, -random() * TILE);
    parts.push(stone);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A saguaro: a tall ribbed column with two or three arms turning up. */
function saguaro(seed: number): BufferGeometry {
  const random = seeded(seed);
  const parts: BufferGeometry[] = [];
  const height = 6 + random() * 4;
  const trunk = new CylinderGeometry(0.4, 0.45, height, 10);
  trunk.translate(0, height / 2, 0);
  const crown = new SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  crown.translate(0, height, 0);
  parts.push(trunk, crown);
  const arms = 2 + Math.floor(random() * 2);
  for (let k = 0; k < arms; k++) {
    const a = (k / arms) * Math.PI * 2 + random();
    const y = height * (0.35 + random() * 0.25);
    const reach = 1.1 + random() * 0.4;
    const out = new CylinderGeometry(0.28, 0.28, reach, 8);
    out.rotateZ(Math.PI / 2);
    out.translate(reach / 2, y, 0);
    const up = new CylinderGeometry(0.28, 0.3, 2 + random() * 1.5, 8);
    up.translate(reach, y + 1 + random() * 0.6, 0);
    const tip = new SphereGeometry(0.28, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
    tip.translate(reach, y + 2.6, 0);
    for (const g of [out, up, tip]) {
      g.rotateY(a);
      parts.push(g);
    }
  }
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** The oncoming lane: bleached asphalt with the double yellow centre line on its road side. */
function laneTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, '#5a5651', 311);
    g.fillStyle = '#e8b52a';
    g.fillRect(0, 0, 8, 512);
    g.fillRect(16, 0, 8, 512);
    g.fillStyle = '#e8e6de';
    g.fillRect(246, 0, 10, 512);
    // Cracks sealed with tar.
    g.strokeStyle = 'rgba(20,18,16,0.6)';
    g.lineWidth = 2;
    const random = seeded(313);
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      let x = random() * 256;
      let y = random() * 512;
      g.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (random() - 0.5) * 40;
        y += random() * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

/** The shoulders' loose red gravel. */
function gravelTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => speckle(g, 256, 256, '#9a6a4a', 317));
}

/** Red desert sand, wind-rippled. */
function sandTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#b9744a', 331);
    g.strokeStyle = 'rgba(120,60,30,0.18)';
    g.lineWidth = 3;
    for (let y = 0; y < 512; y += 18) {
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 40 + y) * 5);
      g.stroke();
    }
  });
}

/** A mesa's cliffs in bands of red, orange and cream sandstone. */
function strataTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    const bands = ['#c0603a', '#d98a5a', '#a84a2e', '#e8c09a', '#b8583a', '#cf7a4a', '#9a4028'];
    const random = seeded(337);
    let y = 0;
    let k = 0;
    while (y < 256) {
      const h = 10 + random() * 34;
      g.fillStyle = bands[k++ % bands.length]!;
      g.fillRect(0, y, 64, h);
      y += h;
    }
  });
}

/** The US 66 shield, cut out. */
function shieldTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    const shape = () => {
      g.beginPath();
      g.moveTo(20, 30);
      g.quadraticCurveTo(70, 10, 128, 30);
      g.quadraticCurveTo(186, 10, 236, 30);
      g.lineTo(236, 120);
      g.quadraticCurveTo(230, 210, 128, 246);
      g.quadraticCurveTo(26, 210, 20, 120);
      g.closePath();
    };
    g.fillStyle = '#111111';
    shape();
    g.fill();
    g.save();
    g.translate(128, 138);
    g.scale(0.88, 0.88);
    g.translate(-128, -138);
    g.fillStyle = '#f4f1e8';
    shape();
    g.fill();
    g.restore();
    g.fillStyle = '#111111';
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center';
    g.fillText('ROUTE', 128, 72);
    g.fillRect(40, 84, 176, 5);
    g.font = 'bold 110px sans-serif';
    g.fillText('66', 128, 200);
  });
}

/** The billboard: a faded painted ad for the road ahead. */
function billboardTexture(): CanvasTexture {
  return canvasTexture(768, 288, (g) => {
    g.fillStyle = '#f2e3c2';
    g.fillRect(0, 0, 768, 288);
    g.fillStyle = '#c8102e';
    g.fillRect(0, 0, 768, 70);
    g.fillStyle = '#ffffff';
    g.font = 'bold 54px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('HISTORIC ROUTE 66', 384, 38);
    g.fillStyle = '#1b3a5c';
    g.font = 'bold 66px serif';
    g.fillText('KINGMAN  · 58 MILES', 384, 150);
    g.fillStyle = '#7a4a2a';
    g.font = 'italic 38px serif';
    g.fillText('Cold drinks · Ice · Souvenirs', 384, 228);
  });
}

/** One of the little rhyming signs: white capitals on a red board. */
function rhymeTexture(line: string): CanvasTexture {
  return canvasTexture(256, 96, (g) => {
    g.fillStyle = '#b3131f';
    g.fillRect(0, 0, 256, 96);
    g.fillStyle = '#ffffff';
    g.font = `bold ${Math.min(34, 420 / line.length)}px sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(line, 128, 50);
  });
}

/** The diner car's stainless flutes, its red band and the windows along it. */
function dinerTexture(): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    g.fillStyle = '#cfd5dc';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (let y = 0; y < 128; y += 6) g.fillRect(0, y, 512, 2);
    g.fillStyle = '#c8102e';
    g.fillRect(0, 96, 512, 14);
    g.fillStyle = '#2a3a4a';
    for (let x = 12; x < 500; x += 48) g.fillRect(x, 30, 40, 50);
    g.fillStyle = 'rgba(255,220,160,0.5)';
    for (let x = 12; x < 500; x += 48) g.fillRect(x, 60, 40, 20);
  });
}

/** The motel's rooms: doors and windows along the stucco, each with its number. */
function roomsTexture(): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    g.fillStyle = '#f0dcc0';
    g.fillRect(0, 0, 512, 64);
    for (let x = 6, n = 1; x < 512; x += 64, n++) {
      g.fillStyle = '#2ab3a6';
      g.fillRect(x, 16, 14, 46);
      g.fillStyle = '#3a4a5c';
      g.fillRect(x + 26, 20, 28, 22);
      g.fillStyle = '#111111';
      g.font = 'bold 9px sans-serif';
      g.fillText(String(n), x + 3, 12);
    }
  });
}

/** A neon sign's word in tube with its glow, the board transparent behind. */
function neonTexture(word: string, colour: string): CanvasTexture {
  return canvasTexture(512, 180, (g) => {
    g.clearRect(0, 0, 512, 180);
    g.fillStyle = '#16141f';
    g.fillRect(8, 8, 496, 164);
    g.shadowColor = colour;
    g.shadowBlur = 22;
    g.strokeStyle = colour;
    g.lineWidth = 8;
    g.font = `bold ${Math.min(120, 800 / word.length)}px sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.strokeText(word, 256, 94);
    g.fillStyle = '#ffffff';
    g.shadowBlur = 0;
    g.fillText(word, 256, 94);
  });
}
