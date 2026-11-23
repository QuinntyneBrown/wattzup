// Suburban Sunrise's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Maple
// Avenue at dawn. Maples line the tree lawns either side; behind the sidewalks, clapboard houses
// sit back on their lawns with porches, garages, driveways and mailboxes, some behind white picket
// fences. Sprinklers tick round on the lawns, the morning papers arc onto the driveways, and
// neighbours wave from their porches while a jogger or a dog walker passes on the sidewalk. The
// town's water tower stands ahead over the trees. Built on the shared kit (world-kit.ts) on the
// pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  CapsuleGeometry,
  type CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  legPair,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** A lot is LOT metres of frontage; the avenue repeats every LOOP metres. */
const LOT = 24;
const LOOP = LOT * 15;
const BEHIND = 24;
const KERB = 0.13;
/** Across from the road's edge: the tree lawn, the sidewalk, then the front lawns. */
const TREE_LAWN = 2.6;
const SIDEWALK = 1.6;
/** Each house's front stands this far from the road's edge. */
const SETBACK = 19;
/** The water tower stands this far ahead, right of the avenue. */
const TOWER_AHEAD = 820;
const TOWER_X = 70;

const SIDINGS = [0xf3efe4, 0xcfe0e8, 0xf0dcae, 0xd8e4c8, 0xe9cfc8, 0xbfc8d4];
const ROOFS = [0x4a4f57, 0x6b3f33, 0x3d4a3a, 0x5a5048];
const DOORS = [0x7a1424, 0x1b3a5c, 0x1f4d36, 0x111318, 0xd9a520];

const MORNING_WEAR = {
  tops: ['#e8133c', '#2c7be5', '#f5f5f0', '#7a8ca0', '#ff7a00', '#14b8a6', '#9b5de5', '#c9a27a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#8a8f99'],
  skins: ['#e2b48c', '#f0c8a0', '#c48a5f', '#8d5a3b', '#5a3a29', '#f5d3b5'],
};

interface Walker {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly scale: number;
  readonly phase: number;
}

interface Paper {
  readonly mesh: Mesh;
  /** Where it is thrown from and lands, in the lot's frame. */
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly phase: number;
}

export class SuburbiaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly walkers: Walker[] = [];
  private figures: Figures | null = null;
  private readonly sprays: Group[] = [];
  private readonly arms: { mesh: Mesh; phase: number; side: number }[] = [];
  private readonly papers: Paper[] = [];
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
    this.disposables.push(this.unit);
    this.addGround(roadHalf, points);
    this.addMaples(roadHalf);
    this.addLots(roadHalf);
    this.addBackyards();
    this.addWalkers(roadHalf);
    this.addWaterTower();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    const t = seconds;
    // A sprinkler ticks back and forth across its arc.
    this.sprays.forEach((spray, k) => {
      spray.rotation.y = Math.sin(t * 0.8 + k * 1.7) * 1.1;
    });
    // Neighbours wave, each in their own rhythm.
    for (const arm of this.arms) {
      arm.mesh.rotation.z = arm.side * (2.5 + Math.sin(t * 6 + arm.phase) * 0.35);
    }
    // A paper flies from the road in its first third of a cycle, then lies where it landed.
    for (const paper of this.papers) {
      const cycle = (t * 0.12 + paper.phase) % 1;
      const u = Math.min(cycle / 0.3, 1);
      const [fx, fz] = paper.from;
      const [tx, tz] = paper.to;
      paper.mesh.position.set(
        fx + (tx - fx) * u,
        0.08 + KERB + Math.sin(u * Math.PI) * 2.6,
        fz + (tz - fz) * u,
      );
      paper.mesh.rotation.x = u < 1 ? u * 14 : 0;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    const figures = this.figures;
    if (figures) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const stride = Math.abs(Math.sin(this.time * (Math.abs(w.speed) > 2 ? 8 : 4.5) + w.phase));
        const y = heightAt(Math.max(metres, 0)) + KERB;
        figures.set(i, w.x, y, -metres, w.speed > 0 ? 0 : Math.PI, w.scale, stride * 0.05);
      });
      figures.commit();
    }
    this.tower.position.set(TOWER_X, heightAt(TOWER_AHEAD), -TOWER_AHEAD);
  }

  /** The kerbs, the lawns either side and the concrete sidewalks laid over them. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const lawn = this.material({ map: this.repeat(lawnTexture(), 5, 5), roughness: 1 });
    const kerb = this.material({ color: 0xc9c6bd, roughness: 0.9 });
    const walk = this.material({ map: this.repeat(sidewalkTexture(), SIDEWALK, 1.6) });
    const inner = r + TREE_LAWN;
    const outer = inner + SIDEWALK;
    this.ribbons.add(points, kerb, [
      [-r, 0],
      [-r - 0.04, KERB],
      [-r - 0.22, KERB],
    ]);
    this.ribbons.add(points, kerb, [
      [r + 0.22, KERB],
      [r + 0.04, KERB],
      [r, 0],
    ]);
    this.ribbons.add(points, lawn, [
      [-r - 0.22, KERB],
      [-120, KERB],
    ]);
    this.ribbons.add(points, lawn, [
      [120, KERB],
      [r + 0.22, KERB],
    ]);
    this.ribbons.add(points, walk, [
      [-inner, KERB + 0.02],
      [-outer, KERB + 0.02],
    ]);
    this.ribbons.add(points, walk, [
      [outer, KERB + 0.02],
      [inner, KERB + 0.02],
    ]);
  }

  /** Sugar maples on the tree lawns, their crowns meeting over the avenue. */
  private addMaples(roadHalf: number): void {
    const random = seeded(151);
    const bark = this.material({ color: 0x4f463e, roughness: 1 });
    const leaves = [0x3f7a34, 0x4a8a3a, 0x5c8f3c, 0x6f9a3a, 0x8a9a38].map((hex) =>
      this.material({ color: hex, roughness: 0.95 }),
    );
    const trunk = new CylinderGeometry(0.2, 0.3, 4.2, 8);
    trunk.translate(0, 2.1, 0);
    const crown = maple();
    this.disposables.push(trunk, crown);
    for (const side of [-1, 1] as const) {
      for (let offset = 6; offset < LOOP; offset += 12) {
        const tree = new Group();
        const t = new Mesh(trunk, bark);
        const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
        t.castShadow = true;
        c.castShadow = true;
        tree.add(t, c);
        tree.scale.setScalar(0.85 + random() * 0.35);
        tree.rotation.y = random() * Math.PI * 2;
        this.group.add(tree);
        const x = side * (roadHalf + TREE_LAWN / 2 + 0.1);
        this.props.push({ mesh: tree, offset: offset + random() * 3, x });
      }
    }
  }

  /**
   * The lots, LOT metres each side: a house with its porch, garage and driveway, a mailbox by
   * the kerb, on some a picket fence, a sprinkler, a neighbour on the porch and the morning
   * paper. Each lot is built facing +z and turned to face the road.
   */
  private addLots(roadHalf: number): void {
    const random = seeded(157);
    const kit = this.houseKit();
    for (const side of [-1, 1] as const) {
      for (let k = 0; k < LOOP / LOT; k++) {
        const lot = new Group();
        this.house(lot, kit, random, side, roadHalf);
        lot.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        this.group.add(lot);
        // The lot's origin is at the road's edge; turned, its +z faces the road.
        this.props.push({
          mesh: lot,
          offset: k * LOT + (side > 0 ? LOT / 2 : 0),
          x: side * roadHalf,
        });
      }
    }
  }

  private houseKit() {
    const siding = this.repeat(sidingTexture(), 4, 4);
    const sidings = SIDINGS.map((hex) =>
      this.material({ map: siding, color: hex, roughness: 0.8 }),
    );
    const shingles = this.repeat(shingleTexture(), 3, 3);
    const roofs = ROOFS.map((hex) => this.material({ map: shingles, color: hex, roughness: 0.9 }));
    const doors = DOORS.map((hex) => this.material({ color: hex, roughness: 0.5 }));
    const white = this.material({ color: 0xf6f4ee, roughness: 0.6 });
    const brick = this.material({ color: 0x8a4a3a, roughness: 0.9 });
    const concrete = this.material({ map: this.repeat(sidewalkTexture(), 3, 3) });
    const lit = new MeshBasicMaterial({ map: this.track(windowTexture(true)) });
    const dark = this.material({ map: this.track(windowTexture(false)), roughness: 0.2 });
    const garage = this.material({ map: this.track(garageTexture()), roughness: 0.6 });
    const picket = this.material({
      map: this.repeat(picketTexture(), 2, 1),
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0xffffff,
    });
    const water = new MeshBasicMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.55 });
    const paper = this.material({ color: 0xf2efe2, roughness: 0.8 });
    const mail = this.material({ color: 0x2b2f36, metalness: 0.5, roughness: 0.4 });
    const flag = this.material({ color: 0xc8102e });
    this.disposables.push(lit, water);
    const roof1 = gable(11.6, 9.8, 2.6);
    const roof2 = gable(10.6, 8.8, 2.8);
    const garageRoof = gable(6.6, 7, 1.6);
    const spray = sprayGeometry();
    const roll = new CylinderGeometry(0.06, 0.06, 0.34, 8);
    roll.rotateZ(Math.PI / 2);
    const legs = legPair(0.08, 0.84);
    const body = new CapsuleGeometry(0.19, 0.4, 4, 8);
    const head = new SphereGeometry(0.115, 10, 8);
    const arm = new CapsuleGeometry(0.055, 0.5, 4, 6);
    arm.translate(0, -0.3, 0);
    this.disposables.push(roof1, roof2, garageRoof, spray, roll, legs, body, head, arm);
    return {
      sidings,
      roofs,
      doors,
      white,
      brick,
      concrete,
      lit,
      dark,
      garage,
      picket,
      water,
      paper,
      mail,
      flag,
      roof1,
      roof2,
      garageRoof,
      spray,
      roll,
      legs,
      body,
      head,
      arm,
    };
  }

  /**
   * One house on its lot, in the lot's frame: x runs along the road, the house's front faces +z
   * and the lot reaches back along -z from the kerb at z 0.
   */
  private house(
    lot: Group,
    kit: ReturnType<SuburbiaStreet['houseKit']>,
    random: () => number,
    side: number,
    roadHalf: number,
  ): void {
    void roadHalf;
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      lot.add(mesh);
      return mesh;
    };
    const two = random() < 0.55;
    const width = two ? 10 : 11;
    const depth = two ? 8 : 9;
    const height = two ? 5.8 : 3.2;
    const front = -SETBACK;
    const centre = front - depth / 2;
    const base = KERB + 0.5;
    // Seen from the road the lot's x is mirrored on one side; keep garages on the lot's left.
    const hx = -1.5;
    const siding = kit.sidings[Math.floor(random() * kit.sidings.length)]!;
    box(kit.brick, width + 0.2, 0.5, depth + 0.2, hx, KERB + 0.25, centre);
    box(siding, width, height, depth, hx, base + height / 2, centre);
    const roof = new Mesh(
      two ? kit.roof2 : kit.roof1,
      kit.roofs[Math.floor(random() * kit.roofs.length)]!,
    );
    roof.position.set(hx, base + height, centre);
    roof.castShadow = true;
    lot.add(roof);
    box(kit.brick, 0.8, 2.4, 0.8, hx + width / 2 - 1.5, base + height + 1.4, centre - 1);
    // Windows across the front, upstairs and down, some lit for an early riser.
    const rows = two ? [base + 1.5, base + 4.3] : [base + 1.5];
    for (const y of rows) {
      for (const x of [-3.4, -1.2, 2.4]) {
        const lit = random() < 0.35;
        box(lit ? kit.lit : kit.dark, 1.1, 1.4, 0.06, hx + x, y, front + 0.04);
        box(kit.white, 1.4, 0.12, 0.12, hx + x, y - 0.76, front + 0.08);
      }
    }
    // The porch: its deck, steps, posts and roof, and the front door behind.
    const porchZ = front + 1.4;
    box(kit.white, 5.4, 0.18, 2.8, hx + 0.6, base, porchZ);
    box(kit.white, 1.6, 0.3, 0.6, hx + 0.6, KERB + 0.2, porchZ + 1.7);
    box(
      kit.doors[Math.floor(random() * kit.doors.length)]!,
      1.0,
      2.1,
      0.08,
      hx + 0.6,
      base + 1.05,
      front + 0.05,
    );
    for (const x of [-1.9, 0.6, 3.1])
      box(kit.white, 0.16, 2.6, 0.16, hx + x, base + 1.3, porchZ + 1.25);
    box(kit.white, 0.06, 0.8, 2.6, hx + 3.2, base + 0.45, porchZ);
    box(kit.roofs[0]!, 5.8, 0.16, 3.0, hx + 0.6, base + 2.7, porchZ);
    // The garage and its driveway out to the road.
    const gx = hx - width / 2 - 3.2;
    box(siding, 6, 2.8, 6.6, gx, base + 1.4, front - 2.8);
    const garageRoof = new Mesh(
      kit.garageRoof,
      kit.roofs[Math.floor(random() * kit.roofs.length)]!,
    );
    garageRoof.position.set(gx, base + 2.8, front - 2.8);
    lot.add(garageRoof);
    box(kit.garage, 4.8, 2.3, 0.06, gx, KERB + 1.2, front + 0.45);
    box(kit.concrete, 5.2, 0.04, SETBACK - 0.5, gx, KERB + 0.03, -SETBACK / 2 + 0.6);
    // The front walk from the sidewalk to the porch steps.
    const walkFrom = TREE_LAWN + SIDEWALK;
    const walk = -porchZ - 2 - walkFrom;
    box(kit.concrete, 1.4, 0.04, walk, hx + 0.6, KERB + 0.03, -(walkFrom + walk / 2));
    // The mailbox by the kerb, its flag up on some.
    const mx = gx + 3.4;
    box(kit.white, 0.1, 1.05, 0.1, mx, KERB + 0.52, -0.6);
    box(kit.mail, 0.32, 0.3, 0.5, mx, KERB + 1.15, -0.6);
    if (random() < 0.5) box(kit.flag, 0.03, 0.28, 0.06, mx + 0.18, KERB + 1.32, -0.55);
    // A white picket fence along the front of some lots, gapped for the drive and the walk.
    if (random() < 0.5) {
      const z = -(TREE_LAWN + SIDEWALK + 0.4);
      for (const [from, to] of [
        [gx + 2.8, hx - 0.4],
        [hx + 1.6, LOT / 2 - 0.4],
      ] as const) {
        const fence = new Mesh(this.fencePlane(to - from), kit.picket);
        fence.position.set((from + to) / 2, KERB + 0.5, z);
        lot.add(fence);
      }
    }
    // A sprinkler on the lawn, its arc of water ticking round.
    if (random() < 0.45) {
      const spray = new Group();
      spray.add(new Mesh(kit.spray, kit.water));
      spray.position.set(hx + 5 + random() * 2, KERB, -(TREE_LAWN + SIDEWALK + 5 + random() * 4));
      lot.add(spray);
      this.sprays.push(spray);
    }
    // A neighbour on the porch, waving to the riders.
    if (random() < 0.5) {
      const neighbour = new Group();
      const wear = MORNING_WEAR;
      const top = this.material({ color: wear.tops[Math.floor(random() * wear.tops.length)]! });
      const bottom = this.material({
        color: wear.bottoms[Math.floor(random() * wear.bottoms.length)]!,
      });
      const skin = this.material({ color: wear.skins[Math.floor(random() * wear.skins.length)]! });
      const legs = new Mesh(kit.legs, bottom);
      const body = new Mesh(kit.body, top);
      body.position.y = 1.15;
      const head = new Mesh(kit.head, skin);
      head.position.y = 1.6;
      const arm = new Mesh(kit.arm, top);
      arm.position.set(0.24, 1.38, 0);
      neighbour.add(legs, body, head, arm);
      neighbour.position.set(hx + 2.2 - random(), base + 0.09, porchZ + 0.6);
      lot.add(neighbour);
      this.arms.push({ mesh: arm, phase: random() * 6.3, side: 1 });
    }
    // The morning paper, thrown from the road onto the driveway.
    const paper = new Mesh(kit.roll, kit.paper);
    paper.castShadow = true;
    lot.add(paper);
    this.papers.push({
      mesh: paper,
      from: [gx + random() * 2, 1.5],
      to: [gx + random() * 1.5 - 0.7, -(TREE_LAWN + SIDEWALK + 3 + random() * 6)],
      phase: random(),
    });
    void side;
  }

  private fencePlane(length: number): BufferGeometry {
    const plane = new PlaneGeometry(length, 1);
    const uv = plane.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (length / 2));
    this.disposables.push(plane);
    return plane;
  }

  /** The backyards' trees, rising over the rooftops behind each row of houses. */
  private addBackyards(): void {
    const random = seeded(163);
    const crown = maple();
    const trunk = new CylinderGeometry(0.25, 0.35, 5, 7);
    trunk.translate(0, 2.5, 0);
    this.disposables.push(crown, trunk);
    const bark = this.material({ color: 0x4f463e, roughness: 1 });
    const leaves = [0x3a6e30, 0x47803a, 0x55883a].map((hex) =>
      this.material({ color: hex, roughness: 0.95 }),
    );
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 8 + random() * 6) {
        const tree = new Group();
        tree.add(new Mesh(trunk, bark), new Mesh(crown, leaves[Math.floor(random() * 3)]!));
        tree.scale.setScalar(1.3 + random() * 0.6);
        this.group.add(tree);
        this.props.push({ mesh: tree, offset, x: side * (40 + random() * 20) });
      }
    }
  }

  /** An early jogger, dog walkers and a neighbour fetching the paper, on both sidewalks. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(167);
    for (let offset = 0; offset < LOOP; offset += 14 + random() * 20) {
      const side = random() < 0.5 ? -1 : 1;
      const jogger = random() < 0.4;
      this.walkers.push({
        offset,
        x: side * (roadHalf + TREE_LAWN + SIDEWALK / 2 + (random() - 0.5) * 0.6),
        speed: (random() < 0.5 ? 1 : -1) * (jogger ? 2.8 + random() : 1 + random() * 0.4),
        scale: 0.9 + random() * 0.15,
        phase: random() * 6.3,
      });
    }
    this.figures = new Figures(
      this.group,
      this.disposables,
      this.walkers.length,
      MORNING_WEAR,
      173,
    );
  }

  /** The town's water tower on its legs, its tank lettered with the town's name. */
  private addWaterTower(): void {
    const steel = this.material({ color: 0xd7dde2, metalness: 0.4, roughness: 0.5 });
    const tank = this.material({ map: this.track(tankTexture()), metalness: 0.3, roughness: 0.5 });
    const leg = new CylinderGeometry(0.5, 0.6, 30, 8);
    const drum = new CylinderGeometry(9, 9, 9, 32);
    const cap = new SphereGeometry(9, 32, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    cap.scale(1, 0.4, 1);
    const bowl = new SphereGeometry(9, 32, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    bowl.scale(1, 0.5, 1);
    this.disposables.push(leg, drum, cap, bowl);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const l = new Mesh(leg, steel);
      l.position.set(Math.cos(a) * 6.5, 15, Math.sin(a) * 6.5);
      this.tower.add(l);
    }
    const d = new Mesh(drum, tank);
    d.position.y = 34.5;
    d.rotation.y = Math.PI / 2 + 0.5;
    const c = new Mesh(cap, steel);
    c.position.y = 39;
    const b = new Mesh(bowl, steel);
    b.position.y = 30;
    this.tower.add(d, c, b);
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

/** A gable roof over a box `width` by `depth`, `rise` high, its ridge running along x. */
function gable(width: number, depth: number, rise: number): BufferGeometry {
  const shape = new Shape();
  shape.moveTo(-depth / 2 - 0.4, 0);
  shape.lineTo(depth / 2 + 0.4, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const roof = new ExtrudeGeometry(shape, { depth: width + 0.6, bevelEnabled: false });
  roof.translate(0, 0, -(width + 0.6) / 2);
  roof.rotateY(Math.PI / 2);
  return roof;
}

/** A sugar maple's crown: rounded masses of leaves, broadest in the middle. */
function maple(): BufferGeometry {
  const random = seeded(179);
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const blob = new IcosahedronGeometry(1.7 + random() * 0.6, 2);
    blob.translate(Math.cos(a) * 1.7, 5.6 + random() * 1.4, Math.sin(a) * 1.7);
    parts.push(blob);
  }
  const top = new IcosahedronGeometry(2.3, 2);
  top.translate(0, 7.4, 0);
  parts.push(top);
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A sprinkler's arc of droplets, thrown out and falling, swept round its head. */
function sprayGeometry(): BufferGeometry {
  const random = seeded(181);
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 90; k++) {
    const u = random();
    const fan = (random() - 0.5) * 0.25;
    const reach = u * 5.5;
    const drop = new SphereGeometry(0.035 + random() * 0.03, 4, 3);
    drop.translate(Math.sin(fan) * reach, 0.2 + Math.sin(u * Math.PI) * 1.6, Math.cos(fan) * reach);
    parts.push(drop);
  }
  const head = new CylinderGeometry(0.05, 0.08, 0.2, 6);
  head.translate(0, 0.1, 0);
  parts.push(head);
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Mown front lawns, dewy at dawn. */
function lawnTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#5a9440';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(191);
    for (let i = 0; i < 9000; i++) {
      g.strokeStyle = `hsl(${90 + random() * 22},45%,${30 + random() * 24}%)`;
      const x = random() * 512;
      const y = random() * 512;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + random() * 4 - 2, y - 4 - random() * 5);
      g.stroke();
    }
    // The mower's stripes.
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 64, 512);
  });
}

/** Concrete sidewalk slabs with their joints. */
function sidewalkTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#bdb8ad', 193);
    g.fillStyle = 'rgba(60,58,52,0.4)';
    g.fillRect(0, 0, 256, 3);
    g.fillRect(0, 0, 2, 256);
  });
}

/** Clapboard siding: white boards with their shadow lines, tinted per house. */
function sidingTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(0, y + 13, 256, 3);
      g.fillStyle = 'rgba(0,0,0,0.06)';
      g.fillRect(0, y, 256, 6);
    }
  });
}

/** Asphalt shingles, staggered. */
function shingleTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#d0d0d0', 197);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = 0; y < 256; y += 21) {
      g.fillRect(0, y, 256, 2);
      for (let x = (y / 21) % 2 ? 0 : 18; x < 256; x += 36) g.fillRect(x, y, 2, 21);
    }
  });
}

/** A sash window: lit warm for an early riser, or dark with the dawn sky in it. */
function windowTexture(lit: boolean): CanvasTexture {
  return canvasTexture(64, 96, (g) => {
    g.fillStyle = lit ? '#ffd38a' : '#3a4a5c';
    g.fillRect(0, 0, 64, 96);
    if (!lit) {
      g.fillStyle = 'rgba(255,200,170,0.35)';
      g.fillRect(6, 6, 52, 30);
    }
    g.fillStyle = '#f6f4ee';
    g.fillRect(0, 0, 64, 5);
    g.fillRect(0, 91, 64, 5);
    g.fillRect(0, 0, 5, 96);
    g.fillRect(59, 0, 5, 96);
    g.fillRect(0, 46, 64, 5);
    g.fillRect(30, 0, 4, 96);
  });
}

/** A panelled garage door. */
function garageTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    g.fillStyle = '#f2efe6';
    g.fillRect(0, 0, 256, 128);
    g.strokeStyle = 'rgba(0,0,0,0.22)';
    g.lineWidth = 3;
    for (let y = 0; y < 128; y += 32) {
      for (let x = 0; x < 256; x += 64) g.strokeRect(x + 6, y + 5, 52, 22);
    }
  });
}

/** White pickets with their pointed tops and two rails, cut out. */
function picketTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.clearRect(0, 0, 128, 64);
    g.fillStyle = '#ffffff';
    for (let x = 4; x < 128; x += 16) {
      g.beginPath();
      g.moveTo(x, 64);
      g.lineTo(x, 10);
      g.lineTo(x + 4, 2);
      g.lineTo(x + 8, 10);
      g.lineTo(x + 8, 64);
      g.fill();
    }
    g.fillRect(0, 20, 128, 5);
    g.fillRect(0, 48, 128, 5);
  });
}

/** The water tower's tank, painted pale blue with the town's name. */
function tankTexture(): CanvasTexture {
  return canvasTexture(1024, 128, (g) => {
    g.fillStyle = '#cfe3ef';
    g.fillRect(0, 0, 1024, 128);
    g.fillStyle = '#1b3a5c';
    g.font = 'bold 72px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('MAPLEWOOD', 256, 68);
    g.fillText('MAPLEWOOD', 768, 68);
  });
}
