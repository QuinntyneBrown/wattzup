// Lake Tahoe, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the east shore on a clear,
// still summer morning, the high Sierra air sharp and the light bright. The rider rolls along the
// shore road a few metres above the water, which is so clear the shallows glow turquoise over the
// sand and pale granite before falling away to deep sapphire blue. Rounded granite boulders lie
// piled on the shore and stand out of the water, tall Jeffrey pines with their red-brown bark rise
// on both sides, and the granite slope climbs away on the right. Paddleboarders and kayakers glide
// over the shallows, a varnished wooden runabout lies at a little pier, and across the lake the
// Sierra's peaks still carry snow above the far shore, with Fannette Island in Emerald Bay. Built on
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

/** The shore repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The lake lies LAKE metres below the road; the shore falls to it from SHORE metres beyond the verge. */
const LAKE = 4;
const SHORE = 6;

const PADDLER_WEAR = {
  tops: ['#ff6b3a', '#ffd23f', '#2ec4b6', '#ffffff', '#e84a8a', '#1d5aa8', '#3a8a5a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#e8dcc0', '#5a5f69'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

export class TahoeStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: {
    offset: number;
    x: number;
    speed: number;
    phase: number;
    y: number;
  }[] = [];
  private crowd: Figures | null = null;
  private readonly boards: { mesh: Group; index: number }[] = [];
  private water: Texture | null = null;
  private deep: Texture | null = null;
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
    this.addShore(roadHalf, points);
    this.addBoulders(roadHalf);
    this.addPines(roadHalf);
    this.addPier(roadHalf);
    this.addPaddlers(roadHalf);
    this.addFarShore();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.water) this.water.offset.set(seconds * 0.003, seconds * 0.002);
    if (this.deep) this.deep.offset.set(seconds * 0.001, seconds * 0.0015);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the lake's floor. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - LAKE - 6);
      position.setY(i * 2 + 1, p.height - LAKE - 6);
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
        const y = heightAt(metres) + p.y;
        const rock =
          p.y < 0
            ? Math.sin(this.time * 1.2 + p.phase) * 0.04
            : Math.abs(Math.sin(this.time * 3.2 + p.phase)) * 0.04;
        crowd.set(i, p.x, y + rock, -metres, p.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
      // Each paddler's board rides under them.
      for (const b of this.boards) {
        const p = this.people[b.index]!;
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        b.mesh.position.set(p.x, heightAt(metres) + p.y - 0.05, -metres);
      }
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The shore road, the granite slope on the right, and the shore falling to the clear water. */
  private addShore(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.85 });
    const duff = this.material({ map: this.repeat(duffTexture(), 4, 4), roughness: 1 });
    const granite = this.material({
      map: this.repeat(graniteTexture(), 10, 10),
      roughness: 0.9,
      flatShading: true,
    });
    const sand = this.material({ map: this.repeat(sandTexture(), 4, 4), roughness: 1 });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, duff, [
      [r + 30, 8],
      [r + 2, 0.3],
      [r, 0.02],
    ]);
    this.ribbons.add(points, granite, [
      [r + 220, 110],
      [r + 30, 8],
    ]);
    this.ribbons.add(points, duff, [
      [-r, 0.02],
      [-r - SHORE, -0.6],
    ]);
    // The beach and the lake floor shelving under the clear water.
    this.ribbons.add(points, sand, [
      [-r - SHORE, -0.6],
      [-r - SHORE - 4, -LAKE + 0.4],
      [-r - SHORE - 30, -LAKE - 1.6],
    ]);
    const water = this.track(waterTexture());
    water.wrapS = RepeatWrapping;
    water.wrapT = RepeatWrapping;
    water.repeat.set(1 / 10, 1 / 10);
    this.water = water;
    const shallows = this.material({
      map: water,
      color: 0x4ad8cc,
      roughness: 0.1,
      metalness: 0.1,
      emissive: 0x1a8a8a,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.ribbons.add(points, shallows, [
      [-r - SHORE - 3, -LAKE + 0.2],
      [-r - SHORE - 30, -LAKE + 0.2],
    ]);
  }

  /** The rounded granite boulders piled on the shore, standing out of the water and on the slope. */
  private addBoulders(roadHalf: number): void {
    const random = seeded(6701);
    const stones = ['#d8d0c4', '#c8c0b4', '#b8b0a4'].map((c) =>
      this.material({ map: this.track(boulderTexture(c)), roughness: 0.9, flatShading: true }),
    );
    const rock = new DodecahedronGeometry(1, 1);
    this.disposables.push(rock);
    for (let offset = 0; offset < LOOP; offset += 4 + random() * 8) {
      const pile = new Group();
      const water = random() < 0.55;
      const n = 1 + Math.floor(random() * 3);
      for (let k = 0; k < n; k++) {
        const b = new Mesh(rock, stones[Math.floor(random() * stones.length)]!);
        const s = water ? 0.8 + random() * 2.2 : 0.6 + random() * 1.6;
        b.scale.set(s * (1 + random() * 0.4), s * 0.75, s);
        b.position.set((random() - 0.5) * 4, s * 0.3, (random() - 0.5) * 4);
        b.rotation.y = random() * 3;
        b.castShadow = true;
        pile.add(b);
      }
      const holder = new Group();
      if (water) {
        const d = SHORE + 3 + random() * 22;
        pile.position.y = -LAKE - 0.6;
        holder.add(pile);
        this.props.push({ mesh: holder, offset, x: -roadHalf - d });
      } else {
        const d = 3 + random() * 20;
        pile.position.y = 0.3 + Math.max(0, d - 2) * (7.7 / 28);
        holder.add(pile);
        this.props.push({ mesh: holder, offset, x: roadHalf + d });
      }
      this.group.add(holder);
    }
  }

  /** Tall Jeffrey pines with red-brown bark on both sides of the road. */
  private addPines(roadHalf: number): void {
    const random = seeded(6711);
    const bark = this.material({ map: this.track(barkTexture()), roughness: 1 });
    const needles = [0x2e5a34, 0x3a6a3a, 0x24502e].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const trunk = new CylinderGeometry(0.3, 0.6, 26, 7);
    trunk.translate(0, 13, 0);
    const tier = new ConeGeometry(3.4, 5, 7);
    this.disposables.push(trunk, tier);
    for (let offset = 0; offset < LOOP; offset += 5 + random() * 7)
      for (const side of [-1, 1]) {
        if (random() < (side < 0 ? 0.6 : 0.2)) continue;
        const pine = new Group();
        pine.add(new Mesh(trunk, bark));
        // Sparse tiers of needles, higher up the tall trunk.
        for (let k = 0; k < 5; k++) {
          const t = new Mesh(tier, needles[Math.floor(random() * needles.length)]!);
          t.scale.setScalar(1 - k * 0.16);
          t.position.set((random() - 0.5) * 0.6, 12 + k * 3.2, (random() - 0.5) * 0.6);
          pine.add(t);
        }
        pine.scale.setScalar(0.8 + random() * 0.45);
        pine.children.forEach((m) => (m.castShadow = true));
        const d = side < 0 ? 1.5 + random() * 3.5 : 3 + random() * 30;
        pine.position.y = side < 0 ? -0.1 * d : 0.3 + Math.max(0, d - 2) * (7.7 / 28);
        const holder = new Group();
        holder.add(pine);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
      }
  }

  /** The little timber pier with the varnished wooden runabout moored at it. */
  private addPier(roadHalf: number): void {
    const plank = this.material({ map: this.track(plankTexture()), roughness: 0.8 });
    const varnish = this.material({ color: 0x8a4a24, roughness: 0.25, metalness: 0.1 });
    const white = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const glass = this.material({
      color: 0x8ab4c8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    const pier = new Group();
    const deck = new Mesh(this.unit, plank);
    deck.scale.set(22, 0.3, 2.4);
    deck.position.set(-11, -LAKE + 1.4, 0);
    pier.add(deck);
    for (let x = -2; x > -22; x -= 4)
      for (const z of [-1, 1]) {
        const post = new Mesh(this.unit, plank);
        post.scale.set(0.25, 2.6, 0.25);
        post.position.set(x, -LAKE + 0.2, z);
        pier.add(post);
      }
    const boat = new Group();
    const hull = new Mesh(this.unit, varnish);
    hull.scale.set(2, 0.9, 6.4);
    const deckline = new Mesh(this.unit, white);
    deckline.scale.set(2.02, 0.08, 6.42);
    deckline.position.y = 0.45;
    const screen = new Mesh(this.unit, glass);
    screen.scale.set(1.8, 0.5, 0.06);
    screen.position.set(0, 0.75, -0.6);
    boat.add(hull, deckline, screen);
    boat.position.set(-16, -LAKE + 0.5, 2.6);
    pier.add(boat);
    pier.children.forEach((c) => c.traverse((m) => (m.castShadow = true)));
    const holder = new Group();
    holder.add(pier);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 110, x: -roadHalf - SHORE + 1 });
  }

  /** Paddleboarders and kayakers gliding over the shallows, and walkers on the shoulder. */
  private addPaddlers(roadHalf: number): void {
    const random = seeded(6721);
    const boardColours = [0xffd23f, 0xff6b3a, 0x2ec4b6, 0xf4f4f0].map((c) =>
      this.material({ color: c, roughness: 0.4 }),
    );
    for (let k = 0; k < 9; k++) {
      const index = this.people.length;
      this.people.push({
        offset: 20 + k * 38 + random() * 10,
        x: -roadHalf - SHORE - 8 - random() * 16,
        speed: (random() < 0.5 ? 1 : -1) * (0.6 + random() * 0.5),
        phase: random() * 6,
        y: -LAKE + 0.35,
      });
      const board = new Group();
      const b = new Mesh(this.unit, boardColours[k % boardColours.length]!);
      b.scale.set(0.8, 0.12, 3.2);
      board.add(b);
      this.group.add(board);
      this.boards.push({ mesh: board, index });
    }
    for (let offset = 30; offset < LOOP; offset += 40 + random() * 40)
      this.people.push({
        offset,
        x: roadHalf + 1.2,
        speed: (random() < 0.5 ? 1 : -1) * 1.1,
        phase: random() * 6,
        y: 0.3,
      });
    this.crowd = new Figures(this.group, this.disposables, this.people.length, PADDLER_WEAR, 6727);
  }

  /** The deep blue lake, the far shore's forests, Fannette Island and the snowy Sierra peaks. */
  private addFarShore(): void {
    const random = seeded(6731);
    const ripple = this.track(waterTexture());
    ripple.wrapS = RepeatWrapping;
    ripple.wrapT = RepeatWrapping;
    ripple.repeat.set(80, 80);
    this.deep = ripple;
    const deep = this.material({
      map: ripple,
      color: 0x1e5aa8,
      roughness: 0.15,
      metalness: 0.2,
      emissive: 0x0a2a6a,
      emissiveIntensity: 0.4,
    });
    const lake = new Mesh(new PlaneGeometry(9000, 9000), deep);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-4500, -LAKE - 0.2, -2000);
    this.disposables.push(lake.geometry);
    this.horizon.add(lake);
    // The far shore's forested hills and the granite peaks above, snow still in their gullies.
    const forest = [0x2e5a34, 0x3a6a3e].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const rock = this.material({ color: 0x5a6070, roughness: 1, flatShading: true });
    const snow = this.material({ color: 0xf4f6fa, roughness: 0.8, flatShading: true });
    const hill = new DodecahedronGeometry(1, 1);
    const peak = new ConeGeometry(1, 1, 9, 2);
    this.disposables.push(hill, peak);
    for (let k = 0; k < 9; k++) {
      const h = new Mesh(hill, forest[k % 2]!);
      h.scale.set(600 + random() * 300, 160 + random() * 120, 400);
      h.position.set(-3800 + k * 650, -LAKE - 20, -4200 - random() * 400);
      this.horizon.add(h);
    }
    for (let k = 0; k < 8; k++) {
      const hgt = 700 + random() * 500;
      const p = new Mesh(peak, rock);
      p.scale.set(800 + random() * 500, hgt, 700);
      p.position.set(
        -4200 + k * 800 + random() * 200,
        -LAKE + hgt / 2 - 40,
        -5200 - random() * 300,
      );
      const cap = new Mesh(peak, snow);
      // The snow sits a touch proud of the rock, so the two faces never fight.
      cap.scale.set(p.scale.x * 0.5, hgt * 0.46, 380);
      cap.position.set(p.position.x, -LAKE - 40 + hgt * 0.77 + 6, p.position.z);
      this.horizon.add(p, cap);
    }
    // Fannette Island with its little stone tea house.
    const island = new Mesh(hill, forest[0]!);
    island.scale.set(60, 26, 50);
    island.position.set(-700, -LAKE - 6, -1800);
    const house = new Mesh(this.unit, rock);
    house.scale.set(6, 5, 6);
    house.position.set(-700, -LAKE + 21, -1800);
    this.horizon.add(island, house);
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

/** The shore road's grey tarmac with its white edge lines and double yellow centre. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#58585a', 6741);
    g.fillStyle = 'rgba(245,245,240,0.9)';
    g.fillRect(3, 0, 3, 128);
    g.fillRect(122, 0, 3, 128);
    g.fillStyle = 'rgba(255,200,40,0.9)';
    g.fillRect(61, 0, 2, 128);
    g.fillRect(65, 0, 2, 128);
  });
}

/** The forest floor's pine needles and decomposed granite. */
function duffTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a08a6a', 6751);
    const random = seeded(6753);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = ['#7a5a3a', '#c8b898', '#6a7a4a'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 128, random() * 128, 4 + random() * 4, 1);
    }
  });
}

/** The Sierra granite's pale, speckled face. */
function graniteTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#c8c0b4', 6761);
    const random = seeded(6763);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = random() < 0.5 ? '#3a3a3a' : '#e8e4dc';
      g.fillRect(random() * 128, random() * 128, 1, 1);
    }
  });
}

/** The shore's coarse golden sand. */
function sandTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#d8c8a0', 6771));
}

/** The lake's surface, clear and rippled, glinting in the sun. */
function waterTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5ab8d0', 6781);
    const random = seeded(6783);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(240,250,255,${0.2 + random() * 0.3})`;
      g.fillRect(random() * 128, random() * 128, 4 + random() * 8, 1);
    }
  });
}

/** A granite boulder, weathered round, with dark mica flecks. */
function boulderTexture(colour: string): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, colour, 6791);
    const random = seeded(6793);
    g.fillStyle = 'rgba(40,40,40,0.5)';
    for (let i = 0; i < 40; i++) g.fillRect(random() * 64, random() * 64, 1, 1);
  });
}

/** The Jeffrey pine's red-brown bark in its puzzle-piece plates. */
function barkTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#9a5a3a', 6801);
    g.strokeStyle = 'rgba(40,20,10,0.6)';
    const random = seeded(6803);
    for (let y = 0; y < 128; y += 12)
      for (let x = (y / 12) % 2 ? -6 : 0; x < 64; x += 12)
        g.strokeRect(x, y + random() * 3, 12, 12);
  });
}

/** The pier's weathered planks. */
function plankTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#9a8a6a', 6811);
    g.fillStyle = 'rgba(40,30,20,0.5)';
    for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 1, 64);
  });
}
