// North Shore, Oahu's highway, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// Kamehameha Highway on a bright winter morning when the big swell is running. The rider takes
// the two-lane highway; on the left a sandy verge and ironwoods give onto the golden beach and
// the big waves standing up and breaking white, surfers out on the peaks; on the right the
// shrimp trucks park in their dirt lots with picnic tables and umbrellas, surf shacks and
// plantation cottages stand among palms with boards racked outside, and the green ridges of the
// Ko'olau rise behind. A lifeguard tower stands on the sand once a lap. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The highway repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
const KERB = 0.06;
/** The sand verge, the beach's run down to the water, and the sea below the road. */
const VERGE = 4;
const BEACH = 22;
const SEA = 2.4;
/** The lots on the right; the lifeguard tower once a lap. */
const LOT = 22;
const TOWER = 120;

const BEACH_WEAR = {
  tops: ['#ffffff', '#ff6b5a', '#2ec4b6', '#ffd23f', '#f15bb5', '#3a86ff', '#1d1f24', '#ff9f1c'],
  bottoms: ['#2f3e5c', '#e8c9a0', '#ff6b5a', '#2ec4b6', '#1d1f24'],
  skins: ['#e2b48c', '#c48a5f', '#8d5a3b', '#f0c8a0', '#5a3a29', '#b07850'],
};

interface Person {
  readonly offset: number;
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly speed: number;
  readonly phase: number;
}

interface Wave {
  readonly mesh: Mesh;
  readonly phase: number;
}

export class NorthShoreStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: Person[] = [];
  private crowd: Figures | null = null;
  private readonly waves: Wave[] = [];
  private readonly surfers: { mesh: Group; wave: number; along: number }[] = [];
  private readonly sea = new Group();
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private foam: Texture | null = null;
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
    this.addBeach(roadHalf, points);
    this.addWaves(roadHalf);
    this.addIronwoods(roadHalf);
    this.addTower(roadHalf);
    this.addLots(roadHalf, points);
    this.addTrucks(roadHalf);
    this.addShacks(roadHalf);
    this.addPalms(roadHalf);
    this.addPeople(roadHalf);
    this.addRidges();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.foam) this.foam.offset.x = seconds * 0.02;
    // Each wave stands up out at sea, rolls in towards the beach and breaks, then the next.
    for (const wave of this.waves) {
      const t = (seconds / 11 + wave.phase) % 1;
      wave.mesh.position.x = -40 * (1 - t);
      wave.mesh.scale.y = Math.sin(Math.PI * Math.min(t * 1.25, 1)) * 1.2 + 0.1;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea, so the beach and the water lie over it. */
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
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const step = p.speed ? Math.abs(Math.sin(this.time * 4 + p.phase)) * 0.04 : 0;
        crowd.set(i, p.x, heightAt(metres) + p.y + step, -metres, p.heading, 0.95, 0);
      });
      crowd.commit();
    }
    // The sea keeps its place by the rider, the swell sliding along it with the ride.
    this.sea.position.set(0, heightAt(0), 0);
    for (const surfer of this.surfers) {
      const wave = this.waves[surfer.wave]!;
      const t = (this.time / 11 + wave.phase) % 1;
      surfer.mesh.visible = t > 0.15 && t < 0.75;
      surfer.mesh.position.set(
        wave.mesh.position.x + wave.mesh.parent!.position.x + 1.5,
        -SEA + wave.mesh.scale.y * 6.4,
        surfer.along - ((this.time * 6) % 80),
      );
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The highway's asphalt, its sandy verges, the beach running down to the surf, and the sea. */
  private addBeach(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({ map: this.repeat(roadTexture(), 2 * r, 12), roughness: 0.85 });
    const sand = this.material({ map: this.repeat(sandTexture(), 6, 6), roughness: 1 });
    const wet = this.material({
      map: this.repeat(sandTexture(), 6, 6),
      color: 0x9a8a70,
      roughness: 0.4,
    });
    const foam = this.repeat(foamTexture(), 20, 30);
    this.foam = foam;
    const surf = this.material({ map: foam, roughness: 0.3 });
    const ocean = this.material({
      map: this.repeat(oceanTexture(), 60, 60),
      roughness: 0.1,
      metalness: 0.25,
    });
    const edge = -r - VERGE;
    const shore = edge - BEACH;
    this.ribbons.add(points, asphalt, [
      [r, 0.006],
      [-r, 0.006],
    ]);
    this.ribbons.add(points, sand, [
      [-r, 0.006],
      [-r - 0.1, KERB],
      [edge, KERB + 0.3],
      [edge - 8, -0.4],
      [shore + 6, -SEA + 0.25],
    ]);
    this.ribbons.add(points, wet, [
      [shore + 6, -SEA + 0.25],
      [shore, -SEA + 0.05],
    ]);
    this.ribbons.add(points, surf, [
      [shore, -SEA + 0.05],
      [shore - 30, -SEA],
    ]);
    this.ribbons.add(points, ocean, [
      [shore - 30, -SEA],
      [shore - 1600, -SEA],
    ]);
  }

  /** The big waves: long walls of blue water standing up and breaking white, set after set. */
  private addWaves(roadHalf: number): void {
    const face = this.material({
      map: this.track(waveTexture()),
      roughness: 0.2,
      emissive: 0x1a7a9a,
      emissiveIntensity: 0.45,
      side: 2,
    });
    const lip = this.material({
      color: 0xf4f8fa,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
      roughness: 0.5,
    });
    const shape = new CylinderGeometry(6, 6, 1, 24, 1, true, Math.PI, Math.PI * 0.85);
    shape.rotateX(Math.PI / 2);
    shape.scale(1.4, 1, 1);
    shape.translate(0, 0, 0);
    const crest = new CylinderGeometry(1.4, 1.4, 1, 10);
    crest.rotateX(Math.PI / 2);
    crest.translate(-6.4, 5.2, 0);
    this.disposables.push(shape, crest);
    const shore = -roadHalf - VERGE - BEACH;
    for (let k = 0; k < 3; k++) {
      const holder = new Group();
      const wall = new Mesh(shape, face);
      const white = new Mesh(crest, lip);
      wall.add(white);
      wall.scale.z = 700;
      wall.position.z = -250;
      holder.add(wall);
      holder.position.set(shore - 12 - k * 3, -SEA, 0);
      this.sea.add(holder);
      this.waves.push({ mesh: wall, phase: k / 3 });
    }
    // Surfers riding down the waves' faces.
    const board = new BoxGeometry(0.5, 0.08, 2.1);
    const body = new CylinderGeometry(0.2, 0.18, 1.1, 6);
    body.translate(0, 0.7, 0);
    const head = new SphereGeometry(0.14, 8, 6);
    head.translate(0, 1.4, 0);
    this.disposables.push(board, body, head);
    const boards = ['#ffd23f', '#ff6b5a', '#ffffff'].map((c) =>
      this.material({ color: c, roughness: 0.4 }),
    );
    const suit = this.material({ color: 0x1d1f24, roughness: 0.6 });
    const skin = this.material({ color: 0x8d5a3b, roughness: 0.7 });
    for (let k = 0; k < 5; k++) {
      const surfer = new Group();
      const b = new Mesh(board, boards[k % 3]!);
      const torso = new Mesh(body, suit);
      torso.rotation.z = 0.25;
      surfer.add(b, torso, new Mesh(head, skin));
      surfer.rotation.y = 0.4;
      this.sea.add(surfer);
      this.surfers.push({ mesh: surfer, wave: k % 3, along: -40 - k * 70 });
    }
    this.group.add(this.sea);
  }

  /** Ironwood trees and naupaka bushes along the beach's top. */
  private addIronwoods(roadHalf: number): void {
    const random = seeded(1401);
    const bark = this.material({ color: 0x5a4a3a, roughness: 0.95 });
    const needles = this.material({ color: 0x3e5a3a, roughness: 0.95 });
    const bush = this.material({ color: 0x4f7a3a, roughness: 0.95 });
    const trunk = new CylinderGeometry(0.18, 0.3, 7, 6);
    trunk.translate(0, 3.5, 0);
    const parts: BufferGeometry[] = [];
    for (let k = 0; k < 4; k++) {
      const c = new ConeGeometry(2.2 - k * 0.35, 2.6, 7);
      c.translate((k % 2) * 0.6 - 0.3, 5 + k * 1.4, (k % 3) * 0.4 - 0.4);
      parts.push(c);
    }
    const canopy = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const shrub = new DodecahedronGeometry(1, 0);
    shrub.scale(1.6, 0.6, 1.2);
    this.disposables.push(trunk, canopy, shrub);
    for (let offset = 0; offset < LOOP; offset += 5 + random() * 12) {
      const holder = new Group();
      if (random() < 0.55) {
        holder.add(new Mesh(trunk, bark), new Mesh(canopy, needles));
        holder.scale.setScalar(0.8 + random() * 0.5);
        holder.rotation.set(0, random() * 6, (random() - 0.4) * 0.18);
      } else {
        holder.add(new Mesh(shrub, bush));
        holder.position.y = 0.2;
      }
      holder.children.forEach((c) => (c.castShadow = true));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 1.2 - random() * (VERGE - 1) });
    }
  }

  /** A lifeguard tower on the sand once a lap: its yellow hut on stilts, the flag and the board. */
  private addTower(roadHalf: number): void {
    const yellow = this.material({ color: 0xffc83a, roughness: 0.6 });
    const wood = this.material({ color: 0xc8b090, roughness: 0.9 });
    const red = this.material({ color: 0xd8302a, roughness: 0.6 });
    const tower = new Group();
    for (const [x, z] of [
      [-1.2, -1.2],
      [1.2, -1.2],
      [-1.2, 1.2],
      [1.2, 1.2],
    ] as const) {
      const leg = new Mesh(this.unit, wood);
      leg.scale.set(0.2, 3, 0.2);
      leg.position.set(x, 1.5, z);
      tower.add(leg);
    }
    const hut = new Mesh(this.unit, yellow);
    hut.scale.set(3, 2.2, 3);
    hut.position.y = 4.1;
    const roof = new Mesh(this.unit, red);
    roof.scale.set(3.6, 0.2, 3.6);
    roof.position.y = 5.3;
    const pole = new Mesh(this.unit, wood);
    pole.scale.set(0.08, 3, 0.08);
    pole.position.set(1.6, 6.5, 1.6);
    const flag = new Mesh(new PlaneGeometry(1.2, 0.7), red);
    this.disposables.push(flag.geometry);
    flag.position.set(2.2, 7.6, 1.6);
    tower.add(hut, roof, pole, flag);
    tower.children.forEach((c) => (c.castShadow = true));
    tower.rotation.y = Math.PI / 2;
    this.group.add(tower);
    this.props.push({ mesh: tower, offset: TOWER, x: -roadHalf - VERGE - 14 });
    // The surfboards stuck upright in the sand by it.
    const boards = ['#ffd23f', '#2ec4b6', '#ff6b5a', '#ffffff'].map((c) =>
      this.material({ color: c, roughness: 0.4 }),
    );
    const fin = new BoxGeometry(0.55, 2.2, 0.08);
    this.disposables.push(fin);
    const stand = new Group();
    boards.forEach((m, k) => {
      const b = new Mesh(fin, m);
      b.position.set(k * 0.8, 1, 0);
      b.rotation.z = (k - 1.5) * 0.06;
      stand.add(b);
    });
    stand.rotation.y = Math.PI / 2;
    this.group.add(stand);
    this.props.push({ mesh: stand, offset: TOWER + 9, x: -roadHalf - VERGE - 4 });
  }

  /** The right-hand verge and the red-dirt lots the trucks park in. */
  private addLots(roadHalf: number, points: number): void {
    const r = roadHalf;
    const verge = this.material({ map: this.repeat(grassTexture(), 3, 3), roughness: 1 });
    const dirt = this.material({ map: this.repeat(dirtTexture(), 4, 4), roughness: 1 });
    this.ribbons.add(points, dirt, [
      [r + LOT + 30, KERB],
      [r + 2, KERB],
      [r + 0.1, KERB],
      [r, 0.006],
    ]);
    this.ribbons.add(points, verge, [
      [r + 1200, 0.4],
      [r + LOT + 30, KERB],
    ]);
  }

  /** The shrimp trucks: white vans painted and lettered, with awnings, picnic tables and umbrellas. */
  private addTrucks(roadHalf: number): void {
    const random = seeded(1409);
    const sides = ['#ffffff', '#ffd23f', '#2ec4b6', '#ff6b5a', '#f5f1e8'].map((c, k) =>
      this.material({ map: this.track(truckTexture(c, 1411 + k)), roughness: 0.5 }),
    );
    const white = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    const table = this.material({ color: 0xa0784a, roughness: 0.9 });
    const umbrellas = ['#ff6b5a', '#2ec4b6', '#ffd23f', '#3a86ff'].map((c) =>
      this.material({ color: c, roughness: 0.7, side: 2 }),
    );
    const wheel = new CylinderGeometry(0.45, 0.45, 0.3, 12);
    wheel.rotateX(Math.PI / 2);
    const canopy = new ConeGeometry(1.8, 0.7, 8, 1, true);
    const stick = new CylinderGeometry(0.04, 0.04, 2.4, 5);
    stick.translate(0, 1.2, 0);
    const sign = new PlaneGeometry(2.2, 1.2);
    this.disposables.push(wheel, canopy, stick, sign);
    const board = this.material({ map: this.track(signTexture()), roughness: 0.7, side: 2 });
    for (let offset = 15; offset < LOOP; offset += 45 + random() * 40) {
      const lot = new Group();
      const count = 1 + Math.floor(random() * 3);
      for (let k = 0; k < count; k++) {
        const truck = new Group();
        const box = new Mesh(this.unit, sides[Math.floor(random() * sides.length)]!);
        box.scale.set(2.4, 2.6, 6);
        box.position.y = 1.8;
        const cab = new Mesh(this.unit, white);
        cab.scale.set(2.3, 1.8, 1.8);
        cab.position.set(0, 1.4, -3.9);
        const awning = new Mesh(this.unit, umbrellas[k % 4]!);
        awning.scale.set(1.4, 0.08, 5);
        awning.position.set(-1.8, 3, 0);
        awning.rotation.z = -0.2;
        truck.add(box, cab, awning);
        for (const [x, z] of [
          [-1.1, -3.6],
          [1.1, -3.6],
          [-1.1, 1.8],
          [1.1, 1.8],
        ] as const) {
          const w = new Mesh(wheel, tyre);
          w.rotation.y = Math.PI / 2;
          w.position.set(x, 0.45, z);
          truck.add(w);
        }
        truck.position.set(4 + k * 1.2, 0, -k * 9);
        truck.rotation.y = (random() - 0.5) * 0.3;
        lot.add(truck);
      }
      // Picnic tables under umbrellas between the trucks and the road.
      for (let k = 0; k < 3; k++) {
        const t = new Mesh(this.unit, table);
        t.scale.set(1, 0.8, 2);
        t.position.set(0.5 + (k % 2) * 1.5, 0.4, -k * 4 - 1);
        const u = new Mesh(canopy, umbrellas[(k + offset) % 4]!);
        u.position.set(t.position.x, 2.5, t.position.z);
        const s = new Mesh(stick, table);
        s.position.set(t.position.x, 0, t.position.z);
        lot.add(t, u, s);
      }
      const front = new Mesh(sign, board);
      front.position.set(-1.5, 1.6, 4);
      front.rotation.y = -Math.PI / 2;
      lot.add(front);
      lot.children.forEach((c) => (c.castShadow = true));
      this.group.add(lot);
      this.props.push({ mesh: lot, offset, x: roadHalf + 4 });
    }
  }

  /** Surf shacks and plantation cottages behind the lots: tin roofs, lanais and painted walls. */
  private addShacks(roadHalf: number): void {
    const random = seeded(1423);
    const walls = [0x6ac4b8, 0xf2e2b0, 0xd87a5a, 0xa8c890, 0xf5f1e8, 0x7ab0d8].map((c) =>
      this.material({ map: this.track(shackTexture()), color: c, roughness: 0.8 }),
    );
    const tin = this.material({ color: 0x9a3a2a, metalness: 0.4, roughness: 0.5 });
    const post = this.material({ color: 0xf4f4f0, roughness: 0.7 });
    const boards = ['#ffd23f', '#2ec4b6', '#ff6b5a', '#ffffff', '#3a86ff'].map((c) =>
      this.material({ color: c, roughness: 0.4 }),
    );
    const roof = new ConeGeometry(1, 1, 4, 1);
    roof.rotateY(Math.PI / 4);
    const plank = new BoxGeometry(0.08, 2.2, 0.55);
    this.disposables.push(roof, plank);
    for (let offset = 0; offset < LOOP; offset += 16 + random() * 16) {
      const width = 8 + random() * 5;
      const shack = new Group();
      const body = new Mesh(this.unit, walls[Math.floor(random() * walls.length)]!);
      body.scale.set(8, 3.4, width);
      body.position.set(4, 2.1, 0);
      const top = new Mesh(roof, tin);
      top.scale.set(6.4, 2.4, width * 0.8);
      top.position.set(4, 5, 0);
      shack.add(body, top);
      for (const z of [-width / 2 + 0.3, 0, width / 2 - 0.3]) {
        const p = new Mesh(this.unit, post);
        p.scale.set(0.15, 3, 0.15);
        p.position.set(-1.4, 1.5, z);
        shack.add(p);
      }
      const lanai = new Mesh(this.unit, tin);
      lanai.scale.set(2, 0.12, width);
      lanai.position.set(-0.6, 3.1, 0);
      lanai.rotation.z = 0.15;
      shack.add(lanai);
      // A rack of boards leaning on the wall.
      if (random() < 0.6) {
        for (let k = 0; k < 4; k++) {
          const b = new Mesh(plank, boards[Math.floor(random() * boards.length)]!);
          b.position.set(-0.2, 1.1, -width / 2 + 1 + k * 0.6);
          b.rotation.z = -0.2;
          shack.add(b);
        }
      }
      shack.children.forEach((c) => (c.castShadow = true));
      this.group.add(shack);
      this.props.push({ mesh: shack, offset, x: roadHalf + LOT + 2 + random() * 6 });
    }
  }

  /** Coconut palms leaning over the lots and the shacks. */
  private addPalms(roadHalf: number): void {
    const random = seeded(1427);
    const bark = this.material({ color: 0x8a7a64, roughness: 0.95 });
    const fronds = this.material({ color: 0x4f8a34, roughness: 0.9 });
    const nuts = this.material({ color: 0x6a5a2a, roughness: 0.8 });
    const trunk = new CylinderGeometry(0.18, 0.3, 11, 8);
    trunk.translate(0, 5.5, 0);
    const parts: BufferGeometry[] = [];
    for (let k = 0; k < 11; k++) {
      const frond = new ConeGeometry(0.45, 3.6, 4);
      frond.scale(1, 1, 0.2);
      frond.translate(0, 1.8, 0);
      frond.rotateZ(1.35 + (k % 2) * 0.3);
      frond.rotateY((k / 11) * Math.PI * 2);
      frond.translate(0, 11, 0);
      parts.push(frond);
    }
    const crown = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const cluster = new SphereGeometry(0.5, 8, 6);
    cluster.translate(0, 10.6, 0);
    this.disposables.push(trunk, crown, cluster);
    for (let offset = 4; offset < LOOP; offset += 8 + random() * 10) {
      const palm = new Group();
      palm.add(new Mesh(trunk, bark), new Mesh(crown, fronds), new Mesh(cluster, nuts));
      palm.children.forEach((c) => (c.castShadow = true));
      palm.scale.setScalar(0.75 + random() * 0.5);
      palm.rotation.set(0, random() * 6, -0.12 - random() * 0.15);
      this.group.add(palm);
      const beach = random() < 0.3;
      this.props.push({
        mesh: palm,
        offset,
        x: beach ? -roadHalf - VERGE - 2 - random() * 6 : roadHalf + 2 + random() * (LOT + 14),
      });
    }
  }

  /** Beachgoers on the sand, people queueing at the trucks and walkers along the verge. */
  private addPeople(roadHalf: number): void {
    const random = seeded(1433);
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 5) {
      const where = random();
      if (where < 0.4) {
        // On the beach, watching the surf.
        const d = 6 + random() * (BEACH - 10);
        this.people.push({
          offset,
          x: -roadHalf - VERGE - d,
          y: -0.4 - (d - 8) * ((SEA - 0.6) / (BEACH - 2)),
          heading: Math.PI / 2,
          speed: 0,
          phase: random() * 6,
        });
      } else if (where < 0.75) {
        // At the trucks' tables and in their queues.
        this.people.push({
          offset,
          x: roadHalf + 3 + random() * 4,
          y: KERB,
          heading: random() * 6,
          speed: 0,
          phase: random() * 6,
        });
      } else {
        const speed = (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.4);
        this.people.push({
          offset,
          x: roadHalf + 1.2,
          y: KERB,
          heading: speed > 0 ? 0 : Math.PI,
          speed,
          phase: random() * 6,
        });
      }
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, BEACH_WEAR, 1439);
  }

  /** The Ko'olau's green fluted ridges rising inland, and Ka'ena's point far down the coast. */
  private addRidges(): void {
    const green = this.material({ map: this.repeat(ridgeTexture(), 1, 1), roughness: 1 });
    const random = seeded(1447);
    const peak = new ConeGeometry(1, 1, 7, 3);
    this.disposables.push(peak);
    for (let k = 0; k < 9; k++) {
      const m = new Mesh(peak, green);
      m.scale.set(220 + random() * 160, 240 + random() * 200, 200 + random() * 120);
      m.position.set(300 + k * 60 + random() * 80, 60, -300 - k * 170);
      m.rotation.y = random() * 3;
      this.horizon.add(m);
    }
    const point = new Mesh(peak, green);
    point.scale.set(500, 260, 300);
    point.position.set(-700, 40, -2400);
    this.horizon.add(point);
    this.group.add(this.horizon);
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

/** The highway's worn asphalt, its double yellow centre line and white edges. */
function roadTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#5a5a5e', 1451);
    g.fillStyle = '#f2c230';
    g.fillRect(118, 0, 6, 256);
    g.fillRect(132, 0, 6, 256);
    g.fillStyle = '#e8e8e8';
    g.fillRect(4, 0, 5, 256);
    g.fillRect(247, 0, 5, 256);
  });
}

/** Golden coral sand, ripple-marked. */
function sandTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#e8d0a0', 1453);
    g.fillStyle = 'rgba(160,120,70,0.15)';
    for (let y = 6; y < 128; y += 14) g.fillRect(0, y, 128, 2);
  });
}

/** White water spreading in sheets over the shallows. */
function foamTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#58b8c8';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(1457);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(255,255,255,${0.4 + random() * 0.5})`;
      g.beginPath();
      g.ellipse(
        random() * 256,
        random() * 256,
        10 + random() * 30,
        3 + random() * 6,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });
}

/** The deep Pacific: dark blue with a glint. */
function oceanTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#1a5a8a', 1459);
    const random = seeded(1461);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 90; i++)
      g.fillRect(random() * 256, random() * 256, 10 + random() * 20, 1.5);
  });
}

/** A wave's face: turquoise at its lip darkening to blue at its foot, streaked with foam. */
function waveTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const grad = g.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, '#1a5a8a');
    grad.addColorStop(0.6, '#2a9ab0');
    grad.addColorStop(1, '#8ad8d8');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const random = seeded(1463);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 80; i++) g.fillRect(random() * 256, random() * 256, 30 + random() * 40, 2);
  });
}

/** Roadside grass, dry at its edges. */
function grassTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#6a8a3a', 1467));
}

/** The lots' red Hawaiian dirt, tyre-tracked. */
function dirtTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a85a3a', 1469);
    g.fillStyle = 'rgba(60,30,20,0.2)';
    g.fillRect(30, 0, 8, 128);
    g.fillRect(84, 0, 8, 128);
  });
}

/** A shrimp truck's side: its colour, its serving window and its hand-painted lettering. */
function truckTexture(colour: string, seed: number): CanvasTexture {
  const words = ['SHRIMP', 'GARLIC SHRIMP', 'SHRIMP SHACK', 'HOT & SPICY', 'SHRIMP PLATE'];
  return canvasTexture(256, 128, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 256, 128);
    const random = seeded(seed);
    g.fillStyle = '#2a3440';
    g.fillRect(80, 40, 110, 44);
    g.fillStyle = 'rgba(255,220,160,0.5)';
    g.fillRect(84, 44, 102, 36);
    g.fillStyle =
      colour === '#ffffff' || colour === '#f5f1e8' || colour === '#ffd23f' ? '#c8302a' : '#ffffff';
    g.font = 'bold 22px sans-serif';
    g.fillText(words[Math.floor(random() * words.length)]!, 10, 30, 236);
    g.font = 'bold 14px sans-serif';
    g.fillText('PLATES · $16', 12, 112, 120);
    g.fillStyle = '#ff6b5a';
    g.beginPath();
    g.arc(220, 104, 14, Math.PI * 0.2, Math.PI * 1.6);
    g.lineWidth = 6;
    g.strokeStyle = '#ff6b5a';
    g.stroke();
  });
}

/** A hand-painted roadside board for the trucks. */
function signTexture(): CanvasTexture {
  return canvasTexture(220, 120, (g) => {
    g.fillStyle = '#f4e8c8';
    g.fillRect(0, 0, 220, 120);
    g.strokeStyle = '#c8302a';
    g.lineWidth = 6;
    g.strokeRect(4, 4, 212, 112);
    g.fillStyle = '#c8302a';
    g.font = 'bold 34px sans-serif';
    g.fillText('SHRIMP', 30, 52);
    g.fillStyle = '#1d6a5a';
    g.font = 'bold 20px sans-serif';
    g.fillText('OPEN · ALOHA', 34, 92);
  });
}

/** Board-and-batten walls with a window. */
function shackTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = 0; x < 128; x += 10) g.fillRect(x, 0, 2, 64);
    g.fillStyle = '#2a3440';
    g.fillRect(44, 18, 40, 26);
    g.fillStyle = '#f4f4f0';
    g.fillRect(62, 18, 3, 26);
  });
}

/** The Ko'olau's green flanks, fluted by the rain. */
function ridgeTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#3e6a3a', 1471);
    const random = seeded(1473);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(20,40,20,${0.15 + random() * 0.2})`;
      g.fillRect(random() * 256, 0, 3 + random() * 6, 256);
    }
  });
}
