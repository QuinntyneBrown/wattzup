// Sa Calobra, Mallorca, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the climb
// up from the cove on a hot, clear spring morning of training-camp season. The rider winds up
// the narrow road between its low drystone parapets. On the right the grey and ochre limestone
// rises in fluted crags, holm oaks and Aleppo pines clinging to it and wild goats picking over
// the rocks. On the left the ravine falls away to the deep blue Mediterranean and the cove of
// Sa Calobra far below. Ahead the road's knotted hairpins stack up the mountainside, the Nus de
// sa Corbata looping under its own bridge, and the Serra de Tramuntana's peaks stand against the
// sky. A team car waits on a hairpin with spare bikes on its roof, and fans and riders stop at
// the parapet to look down. Built on the shared kit (world-kit.ts) on the pattern of Old Town's
// street.
import {
  BoxGeometry,
  type BufferAttribute,
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
  TorusGeometry,
  Vector3,
} from 'three/webgpu';
import {
  canvasTexture,
  Figures,
  loopMetres,
  profileHeight,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The climb repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The sea lies SEA metres below the road. */
const SEA = 260;

const CAMP_WEAR = {
  tops: ['#1d3a8a', '#ffffff', '#c8102e', '#1d1f24', '#ffd23f', '#2ec4b6', '#f08a2a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#e8d8b0'],
  skins: ['#f0c8a0', '#f5d3b5', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

/** The right verge's cross-section, [x, height above the road]: scrub, then the crag's foot. */
const rightVerge = (r: number): [number, number][] => [
  [r + 200, 90],
  [r + 40, 26],
  [r + 16, 12],
  [r + 7, 3],
  [r + 3, 0.6],
  [r, 0.02],
];

/** The left side's cross-section: the ravine's lip, then its fall to the sea. */
const ravine = (r: number): [number, number][] => [
  [-r - 0.6, 0.02],
  [-r - 3, -3],
  [-r - 10, -70],
  [-r - 60, -SEA - 10],
];

/** The mountainside the hairpins climb: a cone standing ahead and to the right. */
const MOUNTAIN = { x: 260, z: -1500, radius: 1300, height: 560 } as const;

export class CalobraStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly goats: { mesh: Group; phase: number }[] = [];
  private sea: Texture | null = null;
  private readonly boats: { mesh: Mesh; x: number; z: number; phase: number }[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
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
    this.addRoad(roadHalf, points);
    this.addParapet(roadHalf);
    this.addCrags(roadHalf);
    this.addTrees(roadHalf);
    this.addGoats(roadHalf);
    this.addTeamCar(roadHalf);
    this.addPeople(roadHalf);
    this.addHairpins();
    this.addSea();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    for (const g of this.goats) {
      const t = seconds * 0.6 + g.phase;
      g.mesh.rotation.y = Math.sin(t * 0.3) * 1.2;
      (g.mesh.children[1] as Mesh).rotation.x = 0.4 + Math.sin(t * 2) * 0.35;
    }
    for (const b of this.boats)
      b.mesh.position.set(b.x + ((seconds * 2 + b.phase) % 400) - 200, -SEA + 1, b.z);
    if (this.sea) this.sea.offset.set(seconds * 0.002, seconds * 0.003);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops away with the ravine to the sea on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - SEA - 20);
      position.setY(i * 2 + 1, p.height - SEA - 20);
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
        crowd.set(
          i,
          p.x,
          heightAt(metres) + step,
          -metres,
          p.speed ? (p.speed > 0 ? 0 : Math.PI) : Math.PI / 2,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The narrow road's worn asphalt, its edges, the crag's foot and the ravine's fall. */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({ map: this.repeat(asphaltTexture(), r * 2, 6), roughness: 0.9 });
    const rock = this.material({
      map: this.repeat(limestoneTexture(), 6, 6),
      roughness: 1,
      flatShading: true,
    });
    const scrub = this.material({ map: this.repeat(scrubTexture(), 8, 8), roughness: 1 });
    const verge = rightVerge(r);
    this.ribbons.add(points, asphalt, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, scrub, verge.slice(4));
    this.ribbons.add(points, rock, verge.slice(2, 5));
    this.ribbons.add(points, scrub, verge.slice(0, 3));
    this.ribbons.add(points, rock, ravine(r));
  }

  /** The low drystone parapet along the drop, coped with flat stones. */
  private addParapet(roadHalf: number): void {
    const stone = this.material({ map: this.track(drystoneTexture()), roughness: 1 });
    const cope = this.material({ color: 0xd8cbb0, roughness: 0.9 });
    for (let offset = 0; offset < LOOP; offset += 12) {
      const wall = new Group();
      const body = new Mesh(this.unit, stone);
      body.scale.set(0.5, 0.7, 12);
      body.position.y = 0.35;
      const top = new Mesh(this.unit, cope);
      top.scale.set(0.6, 0.12, 12);
      top.position.y = 0.76;
      wall.add(body, top);
      wall.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(wall);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + 6, x: -roadHalf - 0.3 });
    }
  }

  /** The fluted limestone crags and boulders rising on the right. */
  private addCrags(roadHalf: number): void {
    const random = seeded(4301);
    const greys = ['#a8a090', '#c0a880', '#8a8478', '#b89870'].map((c, k) =>
      this.material({ map: this.track(cragTexture(c, k)), roughness: 1, flatShading: true }),
    );
    const block = new DodecahedronGeometry(1, 0);
    this.disposables.push(block);
    for (let offset = 0; offset < LOOP; offset += 5 + random() * 8) {
      const crag = new Group();
      for (let k = 0; k < 3; k++) {
        const b = new Mesh(block, greys[Math.floor(random() * greys.length)]!);
        const h = 3 + random() * 10;
        b.scale.set(2 + random() * 3, h, 2 + random() * 3);
        b.position.set(random() * 6, h * 0.6, (random() - 0.5) * 6);
        b.rotation.y = random() * 3;
        b.castShadow = true;
        crag.add(b);
      }
      const holder = new Group();
      holder.add(crag);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 6 + random() * 4 });
    }
    // Loose boulders on the verge.
    for (let offset = 3; offset < LOOP; offset += 11 + random() * 12) {
      const b = new Mesh(block, greys[Math.floor(random() * greys.length)]!);
      b.scale.set(0.5 + random() * 0.6, 0.4 + random() * 0.5, 0.5 + random() * 0.6);
      b.position.y = 0.3;
      b.castShadow = true;
      const holder = new Group();
      holder.add(b);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 1.2 + random() * 1.5 });
    }
  }

  /** Holm oaks and Aleppo pines clinging to the crags and the ravine's lip. */
  private addTrees(roadHalf: number): void {
    const random = seeded(4311);
    const bark = this.material({ color: 0x5a4a3a, roughness: 1 });
    const oak = this.material({ color: 0x3a5a2a, roughness: 1, flatShading: true });
    const pine = this.material({ color: 0x5a7a3a, roughness: 1, flatShading: true });
    const trunk = new CylinderGeometry(0.12, 0.25, 4, 6);
    trunk.translate(0, 2, 0);
    const round = new DodecahedronGeometry(1.8, 0);
    const parasol = new SphereGeometry(2.6, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
    parasol.scale(1, 0.55, 1);
    this.disposables.push(trunk, round, parasol);
    for (let offset = 0; offset < LOOP; offset += 7 + random() * 10) {
      const right = random() < 0.6;
      const isPine = random() < 0.5;
      const tree = new Group();
      const t = new Mesh(trunk, bark);
      t.rotation.z = (random() - 0.5) * 0.4;
      const c = new Mesh(isPine ? parasol : round, isPine ? pine : oak);
      c.position.y = isPine ? 4.2 : 4.4;
      tree.add(t, c);
      tree.scale.setScalar(0.8 + random() * 0.6);
      tree.children.forEach((m) => (m.castShadow = true));
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      // On the left, only out to the lip, where the slope is gentle enough for a trunk to meet it.
      const x = right ? roadHalf + 3 + random() * 4 : -roadHalf - 2 - random();
      this.props.push({ mesh: holder, offset, x });
      // The trunk's foot sunk into the slope, so no side of it hangs over the ground (L2-110 AC12).
      tree.position.y = profileHeight(right ? rightVerge(roadHalf) : ravine(roadHalf), x) - 0.5;
    }
  }

  /** The wild goats picking over the verge's slope above the road. */
  private addGoats(roadHalf: number): void {
    const random = seeded(4321);
    const coats = [0x3a2e26, 0x8a6a4a, 0xd8d0c0].map((c) =>
      this.material({ color: c, roughness: 1 }),
    );
    const horn = this.material({ color: 0x5a5048, roughness: 0.8 });
    const body = new SphereGeometry(0.35, 8, 6);
    body.scale(0.8, 0.85, 1.5);
    const head = new SphereGeometry(0.17, 6, 5);
    head.scale(0.8, 0.9, 1.3);
    this.disposables.push(body, head);
    for (let k = 0; k < 7; k++) {
      const goat = new Group();
      const coat = coats[k % coats.length]!;
      const b = new Mesh(body, coat);
      b.position.y = 0.7;
      const neck = new Group();
      neck.position.set(0, 0.85, -0.45);
      const h = new Mesh(head, coat);
      h.position.set(0, 0.15, -0.15);
      const horns = new Mesh(this.unit, horn);
      horns.scale.set(0.2, 0.3, 0.05);
      horns.position.set(0, 0.32, -0.05);
      horns.rotation.x = 0.6;
      neck.add(h, horns);
      goat.add(b, neck);
      for (const [x, z] of [
        [-0.15, -0.35],
        [0.15, -0.35],
        [-0.15, 0.35],
        [0.15, 0.35],
      ] as const) {
        const leg = new Mesh(this.unit, coat);
        leg.scale.set(0.07, 0.5, 0.07);
        leg.position.set(x, 0.25, z);
        goat.add(leg);
      }
      goat.children.forEach((c) => (c.castShadow = true));
      const x = roadHalf + 2 + random() * 3;
      // Standing on the verge's slope, hooves a little sunk so none hangs over it (L2-110 AC12).
      goat.position.y = profileHeight(rightVerge(roadHalf), x) - 0.15;
      const holder = new Group();
      holder.add(goat);
      this.group.add(holder);
      this.goats.push({ mesh: goat, phase: random() * 6 });
      this.props.push({ mesh: holder, offset: 18 + k * 50 + random() * 20, x });
    }
  }

  /** A team car pulled in at the parapet with spare bikes on its roof. */
  private addTeamCar(roadHalf: number): void {
    const paint = this.material({
      map: this.track(teamCarTexture()),
      roughness: 0.35,
      metalness: 0.3,
    });
    const glass = this.material({ color: 0x1d2630, roughness: 0.1, metalness: 0.6 });
    const black = this.material({ color: 0x1d1f24, roughness: 0.6 });
    const frame = this.material({ color: 0xf8f8f4, roughness: 0.4 });
    const car = new Group();
    const body = new Mesh(this.unit, paint);
    body.scale.set(1.9, 0.9, 4.6);
    body.position.y = 0.75;
    const cabin = new Mesh(this.unit, glass);
    cabin.scale.set(1.7, 0.6, 2.6);
    cabin.position.set(0, 1.45, 0.2);
    const rack = new Mesh(this.unit, black);
    rack.scale.set(1.6, 0.06, 2.2);
    rack.position.set(0, 1.8, 0.2);
    car.add(body, cabin, rack);
    const wheel = new TorusGeometry(0.33, 0.03, 4, 16);
    const tyre = new CylinderGeometry(0.3, 0.3, 0.2, 12);
    tyre.rotateZ(Math.PI / 2);
    this.disposables.push(wheel, tyre);
    for (const [x, z] of [
      [-0.85, -1.5],
      [0.85, -1.5],
      [-0.85, 1.5],
      [0.85, 1.5],
    ] as const) {
      const t = new Mesh(tyre, black);
      t.position.set(x, 0.3, z);
      car.add(t);
    }
    for (const x of [-0.5, 0, 0.5]) {
      const bike = new Group();
      for (const z of [-0.5, 0.5]) {
        const w = new Mesh(wheel, black);
        w.rotation.y = Math.PI / 2;
        w.position.set(0, 0.35, z);
        bike.add(w);
      }
      const tube = new Mesh(this.unit, frame);
      tube.scale.set(0.04, 0.04, 1);
      tube.position.y = 0.6;
      bike.add(tube);
      bike.position.set(x, 1.83, 0.2);
      car.add(bike);
    }
    car.children.forEach((c) => (c.castShadow = true));
    car.position.x = -0.5;
    const holder = new Group();
    holder.add(car);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 64, x: roadHalf + 1.6 });
  }

  /** Fans and riders stopped at the parapet, and walkers on the verge. */
  private addPeople(roadHalf: number): void {
    const random = seeded(4331);
    for (let offset = 8; offset < LOOP; offset += 10 + random() * 14)
      this.people.push({
        offset,
        x: random() < 0.6 ? -roadHalf - 0.1 : roadHalf + 0.6,
        speed: random() < 0.6 ? 0 : (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.4),
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.people.length, CAMP_WEAR, 4337);
  }

  /**
   * Ahead: the mountainside with the road's knotted hairpins stacked up it on their stone
   * walls, the Nus de sa Corbata looping under its own bridge, and the Tramuntana's peaks.
   */
  private addHairpins(): void {
    const random = seeded(4341);
    const slope = this.material({
      map: this.repeat(scrubTexture(), 50, 50),
      roughness: 1,
      flatShading: true,
    });
    const rock = this.material({
      map: this.repeat(limestoneTexture(), 40, 40),
      roughness: 1,
      flatShading: true,
    });
    const tarmac = this.material({ color: 0x5a5a58, roughness: 0.9 });
    const wall = this.material({ map: this.repeat(drystoneTexture(), 8, 1), roughness: 1 });
    const m = MOUNTAIN;
    const mountain = new Mesh(new ConeGeometry(m.radius, m.height, 28, 1, true), slope);
    mountain.position.set(m.x, m.height / 2 - 20, m.z);
    this.disposables.push(mountain.geometry);
    this.horizon.add(mountain);
    const surface = (x: number, z: number) =>
      m.height * (1 - Math.hypot(x - m.x, z - m.z) / m.radius) - 20;
    // The face's rise per metre in x and in z: it falls away from the peak (L2-110 AC12).
    const rise = (x: number, z: number) => {
      const d = Math.hypot(x - m.x, z - m.z);
      return {
        x: (-m.height / m.radius) * ((x - m.x) / d),
        z: (-m.height / m.radius) * ((z - m.z) / d),
      };
    };
    // The hairpins' legs, swinging back and forth up the face, each on its wall.
    for (let k = 0; k < 12; k++) {
      const z = -380 - k * 32;
      const x = m.x - 120 + (k % 2 ? 40 : -40) + (random() - 0.5) * 20;
      const leg = new Group();
      const road = new Mesh(this.unit, tarmac);
      road.scale.set(110, 1.2, 6);
      road.position.y = 1.4;
      const face = new Mesh(this.unit, wall);
      face.scale.set(110, 5, 1);
      face.position.set(0, -1, 3.4);
      const bend = new Mesh(new CylinderGeometry(16, 16, 1.2, 14, 1, false, 0, Math.PI), tarmac);
      bend.position.set(k % 2 ? 52 : -52, 1.4, -14);
      bend.rotation.y = k % 2 ? 0 : Math.PI;
      this.disposables.push(bend.geometry);
      leg.add(road, face, bend);
      leg.position.set(x, surface(x, z), z);
      const yaw = (k % 2 ? 1 : -1) * (0.16 + random() * 0.08);
      // Each leg climbs with the face along its length, so neither end hangs above it.
      const r = rise(x, z);
      leg.rotation.set(0, yaw, Math.atan(r.x * Math.cos(yaw) - r.z * Math.sin(yaw)));
      this.horizon.add(leg);
    }
    // The Nus de sa Corbata: the road looping round and passing under its own bridge.
    const knot = new Group();
    const loop = new Mesh(new TorusGeometry(26, 3, 4, 36, Math.PI * 1.6), tarmac);
    loop.rotation.x = -Math.PI / 2;
    const arch = new Mesh(this.unit, wall);
    arch.scale.set(12, 8, 6);
    arch.position.set(26, -2, 0);
    const deck = new Mesh(this.unit, tarmac);
    deck.scale.set(14, 1.2, 7);
    deck.position.set(26, 2.6, 0);
    knot.add(loop, arch, deck);
    this.disposables.push(loop.geometry);
    // On the face beside the hairpins, laid in the slope so no side of the loop hangs above it.
    const kx = m.x - 280;
    const kz = -560;
    knot.position.set(kx, surface(kx, kz) + 1, kz);
    const r = rise(kx, kz);
    knot.quaternion.setFromUnitVectors(
      new Vector3(0, 1, 0),
      new Vector3(-r.x, 1, -r.z).normalize(),
    );
    this.horizon.add(knot);
    // Limestone crags breaking through the face.
    const block = new DodecahedronGeometry(1, 0);
    this.disposables.push(block);
    for (let k = 0; k < 40; k++) {
      const a = Math.PI + 0.3 + random() * 1.6;
      const d = 300 + random() * 800;
      const x = m.x + Math.cos(a) * d;
      const z = m.z - Math.sin(a) * d;
      const b = new Mesh(block, rock);
      const h = 20 + random() * 50;
      b.scale.set(20 + random() * 30, h, 20 + random() * 30);
      b.position.set(x, surface(x, z) + h * 0.3, z);
      this.horizon.add(b);
    }
    // The Serra de Tramuntana's peaks behind, Puig Major the highest.
    const cone = new ConeGeometry(1, 1, 6);
    this.disposables.push(cone);
    for (let k = 0; k < 8; k++) {
      const p = new Mesh(cone, rock);
      const h = 700 + random() * 500 + (k === 4 ? 400 : 0);
      p.scale.set(700 + random() * 500, h, 600 + random() * 400);
      p.position.set(-1600 + k * 520 + random() * 200, h / 2 - 40, -2800 - random() * 900);
      p.rotation.y = random() * 3;
      this.horizon.add(p);
    }
  }

  /** The deep blue Mediterranean far below, its cove, and the boats at the gorge's mouth. */
  private addSea(): void {
    const random = seeded(4351);
    const ripple = this.track(seaTexture());
    ripple.wrapS = RepeatWrapping;
    ripple.wrapT = RepeatWrapping;
    ripple.repeat.set(80, 80);
    this.sea = ripple;
    const water = new Mesh(
      new PlaneGeometry(9000, 9000),
      this.material({
        map: ripple,
        color: 0x1e5aa0,
        roughness: 0.3,
        metalness: 0.1,
        emissive: 0x0a3a7a,
        emissiveIntensity: 0.6,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-4500, -SEA, -1500);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
    // The cove's turquoise shallows and pale shingle at the gorge's mouth.
    const shallows = new Mesh(
      new PlaneGeometry(260, 200),
      this.material({ color: 0x3ac0c0, roughness: 0.2, transparent: true, opacity: 0.8 }),
    );
    shallows.rotation.x = -Math.PI / 2;
    shallows.position.set(-260, -SEA + 0.3, 200);
    const shingle = new Mesh(this.unit, this.material({ color: 0xe8e0d0, roughness: 1 }));
    shingle.scale.set(80, 4, 160);
    shingle.position.set(-130, -SEA, 200);
    this.disposables.push(shallows.geometry);
    this.horizon.add(shallows, shingle);
    // The headland across the cove.
    const rock = this.material({
      map: this.repeat(limestoneTexture(), 20, 20),
      roughness: 1,
      flatShading: true,
    });
    const head = new Mesh(new DodecahedronGeometry(1, 1), rock);
    head.scale.set(260, 200, 320);
    head.position.set(-1100, -SEA, -1900);
    this.disposables.push(head.geometry);
    this.horizon.add(head);
    // Boats: white tour boats and a sail crossing far below.
    const white = this.material({ color: 0xf8f8f4, roughness: 0.4 });
    for (let k = 0; k < 5; k++) {
      const boat = new Mesh(this.unit, white);
      boat.scale.set(4, 2, 14);
      const x = -400 - random() * 600;
      const z = -100 + random() * 500;
      this.boats.push({ mesh: boat, x, z, phase: random() * 400 });
      this.horizon.add(boat);
    }
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

/** The narrow road's sun-bleached asphalt with its white edge lines. */
function asphaltTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a5a58', 4361);
    g.fillStyle = 'rgba(245,245,240,0.85)';
    g.fillRect(2, 0, 3, 128);
    g.fillRect(123, 0, 3, 128);
  });
}

/** Grey and ochre limestone, fluted by the rain. */
function limestoneTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a89c88', 4371);
    const random = seeded(4373);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(80,72,60,0.35)' : 'rgba(200,150,90,0.35)';
      g.fillRect(random() * 128, random() * 128, 2, 10 + random() * 24);
    }
  });
}

/** One crag's limestone in its own tint, streaked dark down its flutes. */
function cragTexture(base: string, k: number): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, base, 4381 + k);
    g.fillStyle = 'rgba(60,54,46,0.35)';
    for (let x = 3; x < 64; x += 9) g.fillRect(x, 0, 2, 64);
  });
}

/** The garrigue: dry grass, rosemary and mastic scrub between the stones. */
function scrubTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a8a5a', 4391);
    const random = seeded(4393);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = ['#4a5a2a', '#6a7a3a', '#b8a888', '#5a6a4a'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 4, 3 + random() * 3);
    }
  });
}

/** The parapet's drystone: rough limestone blocks fitted without mortar. */
function drystoneTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#b0a088', 4401);
    g.strokeStyle = 'rgba(60,50,40,0.6)';
    const random = seeded(4403);
    for (let y = 0; y < 64; y += 16)
      for (let x = (y / 16) % 2 ? -8 : 0; x < 128; x += 14 + random() * 10)
        g.strokeRect(x, y, 14 + random() * 8, 16);
  });
}

/** The Mediterranean's deep blue with light glinting on it. */
function seaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#1a5a98', 4411);
    const random = seeded(4413);
    for (let i = 0; i < 50; i++) {
      g.fillStyle = `rgba(230,245,255,${0.2 + random() * 0.3})`;
      g.fillRect(random() * 128, random() * 128, 4 + random() * 8, 1);
    }
  });
}

/** The team car's livery: navy with a white band. */
function teamCarTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#1d2a5a';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#f8f8f4';
    g.fillRect(0, 26, 64, 10);
  });
}
