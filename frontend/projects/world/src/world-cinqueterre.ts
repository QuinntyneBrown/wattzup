// The Cinque Terre, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the corniche high
// above the Ligurian Sea on a warm, clear afternoon in early autumn, the grape harvest under way.
// The rider rolls along the narrow road cut into the cliff, a low stone parapet on the seaward
// side and the drop to the deep blue water below. Inland, vineyard terraces held up by drystone
// walls climb the hillside in steps, vines in rows on each, and the harvest's little monorail
// climbs between them. Umbrella pines and agaves cling to the cliff edge, bougainvillea spills
// over the bank, and walkers follow the coastal path. Ahead and below, the pastel villages, pink,
// ochre, yellow and terracotta houses with green shutters, are stacked on their rock spurs down
// to the sea, a bell tower among them, and fishing boats ride at anchor off the harbours. Built on
// the shared kit (world-kit.ts) on the pattern of Old Town's street.
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
} from 'three/webgpu';
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

/** The corniche repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The sea lies SEA metres below the road. */
const SEA = 80;

/** The pastel colours the villages' houses are painted. */
const PASTELS = [
  '#e8a8a0',
  '#e8c070',
  '#f0d890',
  '#d88a5a',
  '#f0b8a0',
  '#e8d8b8',
  '#c87a5a',
  '#f2e0a0',
];

const WALKER_WEAR = {
  tops: ['#ffffff', '#2a6a9a', '#e86a5a', '#f0d890', '#3a8a5a', '#1d1f24'],
  bottoms: ['#2f3e5c', '#e8dcc0', '#5a5f69', '#1d1f24'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

/** The terraced hillside's height at a distance d beyond the inland verge. */
function hillside(d: number): number {
  return 0.3 + Math.max(0, d - 3) * 0.62;
}

export class CinqueTerreStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly boats: { mesh: Group; phase: number }[] = [];
  private sea: Texture | null = null;
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
    this.addCorniche(roadHalf, points);
    this.addTerraces(roadHalf);
    this.addCliffEdge(roadHalf);
    this.addWalkers(roadHalf);
    this.addSea();
    this.addVillages();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.sea) this.sea.offset.set(seconds * 0.002, seconds * 0.003);
    for (const b of this.boats) {
      b.mesh.rotation.z = Math.sin(seconds * 0.9 + b.phase) * 0.05;
      b.mesh.position.y = -SEA + 0.4 + Math.sin(seconds * 0.7 + b.phase) * 0.25;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea beneath the cliff. */
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
        const step = Math.abs(Math.sin(this.time * 3.4 + p.phase)) * 0.04;
        crowd.set(i, p.x, heightAt(metres) + step, -metres, p.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The narrow corniche road, its verges, the terraced hillside inland and the cliff to the sea. */
  private addCorniche(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.85 });
    const verge = this.material({ map: this.repeat(vergeTexture(), 2, 2), roughness: 1 });
    const hill = this.material({ map: this.repeat(terraceTexture(), 6, 6), roughness: 1 });
    const cliff = this.material({
      map: this.repeat(cliffTexture(), 10, 10),
      roughness: 1,
      flatShading: true,
    });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, verge, [
      [r + 3, hillside(3)],
      [r, 0.02],
    ]);
    this.ribbons.add(
      points,
      hill,
      [220, 60, 20, 3].map((d) => [r + d, hillside(d)] as [number, number]),
    );
    this.ribbons.add(points, verge, [
      [-r, 0.02],
      [-r - 1.6, 0.05],
    ]);
    this.ribbons.add(points, cliff, [
      [-r - 1.6, 0.05],
      [-r - 6, -5],
      [-r - 22, -30],
      [-r - 55, -SEA - 10],
    ]);
  }

  /** The vineyard terraces stepping up the hillside, their vines, and the harvest's monorail. */
  private addTerraces(roadHalf: number): void {
    const random = seeded(5701);
    const stone = this.material({ map: this.repeat(drystoneTexture(), 0.5, 1), roughness: 1 });
    const vines = [0x4a7a2a, 0x6a8a30, 0x8a8a34].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const grapes = this.material({ color: 0x4a2a5a, roughness: 0.8 });
    const rail = this.material({ color: 0x8a8c90, roughness: 0.5, metalness: 0.6 });
    for (let offset = 0; offset < LOOP; offset += 12) {
      const block = new Group();
      for (let d = 6; d < 60; d += 6) {
        const wall = new Mesh(this.unit, stone);
        wall.scale.set(0.5, 3.4, 12);
        wall.position.set(d, hillside(d) - 1.4, 0);
        block.add(wall);
        // A row of vines along the terrace above the wall.
        const row = new Mesh(this.unit, vines[Math.floor(random() * vines.length)]!);
        row.scale.set(0.9, 1.3 + random() * 0.3, 11);
        row.position.set(d + 2.6, hillside(d) + 0.9, 0);
        block.add(row);
        if (random() < 0.35) {
          const bunch = new Mesh(this.unit, grapes);
          bunch.scale.set(0.3, 0.3, 0.3);
          bunch.position.set(d + 2.1, hillside(d) + 0.7, (random() - 0.5) * 9);
          block.add(bunch);
        }
      }
      // The monorail the harvest rides up the slope, every so often.
      if (offset % 96 === 48) {
        const track = new Mesh(this.unit, rail);
        const run = 54;
        track.scale.set(Math.hypot(run, hillside(60) - hillside(6)), 0.12, 0.12);
        track.rotation.z = Math.atan2(hillside(60) - hillside(6), run);
        track.position.set(6 + run / 2, (hillside(6) + hillside(60)) / 2 + 0.6, 5.5);
        block.add(track);
      }
      block.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(block);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + 6, x: roadHalf });
    }
    // Bougainvillea spilling over the inland bank.
    const flowers = [0xd82a8a, 0xe84aa0, 0xc8205a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const bush = new DodecahedronGeometry(1, 0);
    this.disposables.push(bush);
    const leaves = this.material({ color: 0x3a6a2a, roughness: 1, flatShading: true });
    for (let offset = 4; offset < LOOP; offset += 15 + random() * 25) {
      const b = new Group();
      const green = new Mesh(bush, leaves);
      green.scale.set(0.9, 0.7, 1.6);
      green.position.y = 0.6;
      b.add(green);
      for (let k = 0; k < 7; k++) {
        const bloom = new Mesh(bush, flowers[Math.floor(random() * flowers.length)]!);
        bloom.scale.setScalar(0.25 + random() * 0.2);
        bloom.position.set((random() - 0.5) * 1.4, 0.5 + random() * 0.8, (random() - 0.5) * 2.6);
        b.add(bloom);
      }
      b.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(b);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 1.8 });
    }
  }

  /** The stone parapet along the drop, umbrella pines and agaves clinging to the cliff edge. */
  private addCliffEdge(roadHalf: number): void {
    const random = seeded(5711);
    const stone = this.material({ map: this.repeat(drystoneTexture(), 0.5, 0.4), roughness: 1 });
    const cap = this.material({ color: 0xd8d0c0, roughness: 0.9 });
    for (let offset = 0; offset < LOOP; offset += 8) {
      const wall = new Group();
      const body = new Mesh(this.unit, stone);
      body.scale.set(0.5, 0.75, 8);
      body.position.y = 0.38;
      const top = new Mesh(this.unit, cap);
      top.scale.set(0.6, 0.12, 8);
      top.position.y = 0.8;
      wall.add(body, top);
      wall.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(wall);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + 4, x: -roadHalf - 0.5 });
    }
    const bark = this.material({ color: 0x6a4a3a, roughness: 1 });
    const needles = [0x2e5a2a, 0x3a6a30].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const trunk = new CylinderGeometry(0.25, 0.4, 9, 6);
    trunk.translate(0, 4.5, 0);
    const crown = new SphereGeometry(4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    crown.scale(1.3, 0.5, 1.1);
    this.disposables.push(trunk, crown);
    for (let offset = 10; offset < LOOP; offset += 30 + random() * 40) {
      const pine = new Group();
      const t = new Mesh(trunk, bark);
      t.rotation.z = -0.25;
      const c = new Mesh(crown, needles[Math.floor(random() * needles.length)]!);
      c.position.set(-2.2, 8.4, 0);
      pine.add(t, c);
      pine.children.forEach((m) => (m.castShadow = true));
      pine.position.y = -2;
      const holder = new Group();
      holder.add(pine);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 4 });
    }
    const agave = this.material({ color: 0x6a8a7a, roughness: 0.8, flatShading: true });
    const leaf = new ConeGeometry(0.15, 1.6, 4);
    leaf.translate(0, 0.8, 0);
    this.disposables.push(leaf);
    for (let offset = 3; offset < LOOP; offset += 12 + random() * 18) {
      const plant = new Group();
      for (let k = 0; k < 9; k++) {
        const l = new Mesh(leaf, agave);
        l.rotation.set(0.7, (k / 9) * Math.PI * 2, 0, 'YXZ');
        plant.add(l);
      }
      plant.position.y = 0.05;
      const holder = new Group();
      holder.add(plant);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 1.2 });
    }
  }

  /** Walkers on the coastal path along the inland verge. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(5721);
    for (let offset = 8; offset < LOOP; offset += 18 + random() * 26)
      this.people.push({
        offset,
        x: roadHalf + 1.1,
        speed: (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.3),
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.people.length, WALKER_WEAR, 5727);
  }

  /** The deep blue Ligurian Sea far below, and the fishing boats at anchor. */
  private addSea(): void {
    const random = seeded(5731);
    const ripple = this.track(seaTexture());
    ripple.wrapS = RepeatWrapping;
    ripple.wrapT = RepeatWrapping;
    ripple.repeat.set(80, 80);
    this.sea = ripple;
    const water = new Mesh(
      new PlaneGeometry(9000, 9000),
      this.material({
        map: ripple,
        color: 0x2a6aa8,
        roughness: 0.3,
        metalness: 0.1,
        emissive: 0x0a3a6a,
        emissiveIntensity: 0.55,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-4500, -SEA, -1500);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
    const hulls = [0xffffff, 0x2a6a9a, 0xd8402a, 0x3a8a5a].map((c) =>
      this.material({ color: c, roughness: 0.6 }),
    );
    const deck = this.material({ color: 0xc8a878, roughness: 0.8 });
    for (let k = 0; k < 10; k++) {
      const boat = new Group();
      const hull = new Mesh(this.unit, hulls[k % hulls.length]!);
      hull.scale.set(2.2, 1, 7);
      const top = new Mesh(this.unit, deck);
      top.scale.set(1.8, 0.2, 6);
      top.position.y = 0.55;
      const cabin = new Mesh(this.unit, hulls[0]!);
      cabin.scale.set(1.4, 1.2, 1.8);
      cabin.position.set(0, 1.2, 1);
      boat.add(hull, top, cabin);
      boat.rotation.y = random() * 6;
      boat.scale.setScalar(1.6);
      const near = k < 6;
      boat.position.set(
        near ? -220 + random() * 120 - 60 : -420 + random() * 160,
        -SEA + 0.4,
        near ? -620 - random() * 160 : -1500 - random() * 200,
      );
      this.boats.push({ mesh: boat, phase: random() * 6 });
      this.horizon.add(boat);
    }
  }

  /** The pastel villages stacked on their rock spurs down to the sea, with their bell towers. */
  private addVillages(): void {
    const random = seeded(5741);
    const rock = this.material({
      map: this.repeat(cliffTexture(), 12, 12),
      roughness: 1,
      flatShading: true,
    });
    const walls = PASTELS.map((c, k) =>
      this.material({ map: this.track(facadeTexture(c, k)), roughness: 0.9 }),
    );
    const roofs = [0x5a5a60, 0x6a5a54, 0xa85a3a].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    const spur = new DodecahedronGeometry(1, 1);
    this.disposables.push(spur);
    const village = (cx: number, cz: number, rows: number, across: number, tower: boolean) => {
      const town = new Group();
      const base = new Mesh(spur, rock);
      base.scale.set(across * 9 + 30, SEA * 0.55, rows * 14 + 30);
      base.position.set(0, -SEA, -rows * 5);
      town.add(base);
      for (let r = 0; r < rows; r++)
        for (let a = 0; a < across - (r % 2); a++) {
          const house = new Group();
          const w = 7 + random() * 3;
          const h = 10 + random() * 8;
          const body = new Mesh(this.unit, walls[Math.floor(random() * walls.length)]!);
          body.scale.set(w, h, 8);
          body.position.y = h / 2;
          const roof = new Mesh(this.unit, roofs[Math.floor(random() * roofs.length)]!);
          roof.scale.set(w + 0.6, 0.6, 8.6);
          roof.position.y = h + 0.3;
          house.add(body, roof);
          house.position.set(
            (a - (across - 1) / 2) * 9.5 + (r % 2) * 4.7 + (random() - 0.5) * 2,
            -SEA + 4 + r * 9,
            -r * 11,
          );
          town.add(house);
        }
      if (tower) {
        const bell = new Group();
        const shaft = new Mesh(this.unit, walls[5]!);
        shaft.scale.set(5, 30, 5);
        shaft.position.y = 15;
        const spire = new Mesh(new ConeGeometry(3.8, 7, 4), roofs[0]!);
        spire.rotation.y = Math.PI / 4;
        spire.position.y = 33.5;
        this.disposables.push(spire.geometry);
        bell.add(shaft, spire);
        bell.position.set(across * 3, -SEA + 4 + rows * 9, -rows * 11);
        town.add(bell);
      }
      town.position.set(cx, 0, cz);
      this.horizon.add(town);
    };
    village(-260, -620, 10, 6, true);
    village(-700, -1250, 9, 5, false);
    village(-260, -2000, 10, 6, true);
    // The headlands beyond, falling into the sea.
    const green = [0x4a6a34, 0x5a7a3a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    for (let k = 0; k < 6; k++) {
      const head = new Mesh(spur, k % 2 ? green[0]! : green[1]!);
      head.scale.set(260 + random() * 200, 160 + random() * 120, 400 + random() * 200);
      head.position.set(260 + random() * 200, -SEA, -1300 - k * 500);
      this.horizon.add(head);
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

/** The corniche's sun-faded tarmac with its yellow-white edge lines. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a6864', 5751);
    g.fillStyle = 'rgba(245,240,225,0.85)';
    g.fillRect(3, 0, 3, 128);
    g.fillRect(122, 0, 3, 128);
    g.fillRect(63, 0, 2, 56);
  });
}

/** The verge's dry grass and wild herbs. */
function vergeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#8a8a4a', 5761));
}

/** The terraced hillside's earth between the vines. */
function terraceTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a7a44', 5771);
    const random = seeded(5773);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = ['#5a7a34', '#9a8a5a', '#6a5a3a'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 128, random() * 128, 4 + random() * 6, 2);
    }
  });
}

/** The cliff's grey-brown sandstone with scrub in its cracks. */
function cliffTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a7a64', 5781);
    const random = seeded(5783);
    for (let i = 0; i < 50; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(70,90,50,0.6)' : 'rgba(60,50,40,0.4)';
      g.fillRect(random() * 128, random() * 128, 5 + random() * 8, 2 + random() * 3);
    }
  });
}

/** The terraces' and parapet's drystone, laid in rough courses. */
function drystoneTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#a8987c', 5791);
    g.strokeStyle = 'rgba(60,50,40,0.55)';
    const random = seeded(5793);
    for (let y = 0; y < 64; y += 12)
      for (let x = (y / 12) % 2 ? -6 : 0; x < 128; x += 12 + random() * 8)
        g.strokeRect(x, y, 12 + random() * 6, 12);
  });
}

/** A pastel façade with its green-shuttered windows. */
function facadeTexture(base: string, k: number): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, base, 5801 + k);
    for (let y = 12; y < 120; y += 28)
      for (const x of [10, 38]) {
        g.fillStyle = '#2a3a30';
        g.fillRect(x, y, 16, 18);
        g.fillStyle = '#3a7a4a';
        g.fillRect(x - 4, y, 4, 18);
        g.fillRect(x + 16, y, 4, 18);
      }
  });
}

/** The Ligurian Sea's deep blue with light glinting on it. */
function seaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#1e5e9e', 5811);
    const random = seeded(5813);
    for (let i = 0; i < 50; i++) {
      g.fillStyle = `rgba(230,245,255,${0.2 + random() * 0.3})`;
      g.fillRect(random() * 128, random() * 128, 4 + random() * 8, 1);
    }
  });
}
