// Daytona Beach Sand's course, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// hard-packed beach where stock cars once raced, on a bright morning. The rider takes the firm
// sand at the tide line, tyre tracks pressed into it; the Atlantic's surf rolls in on the left
// over glistening wet sand, and soft sand, umbrellas, lifeguard towers and sea-oat dunes rise on
// the right to the beachside hotels. Once a lap a drag strip's start tree counts the riders down
// beside a timing board, the Main Street Pier crosses the beach on its pilings, and vintage stock
// cars stand on the sand with their numbers. Beachgoers stroll along the water. Built on the
// shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
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

/** The beach repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The wet sand's width before the surf, and the surf's. */
const WET = 9;
const SURF = 14;
/** The start tree, its timing board and the stock cars stand here each lap; the pier crosses at PIER. */
const START = 60;
const PIER = 250;

const BEACH_WEAR = {
  tops: ['#ff6b5a', '#ffd23f', '#2ec4b6', '#ffffff', '#3a86ff', '#ff9f1c', '#f15bb5'],
  bottoms: ['#1b3a5c', '#e8c9a0', '#ff6b5a', '#2ec4b6', '#5a5f69'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Stroller {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly scale: number;
  readonly phase: number;
}

export class DaytonaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly strollers: Stroller[] = [];
  private beachgoers: Figures | null = null;
  private foam: Texture | null = null;
  private readonly lamps: MeshBasicMaterial[] = [];
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
    this.addUmbrellasAndTowers(roadHalf);
    this.addDunes(roadHalf);
    this.addHotels(roadHalf);
    this.addPier(roadHalf);
    this.addDragStrip(roadHalf);
    this.addStockCars(roadHalf);
    this.addBeachgoers(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The surf rolls in towards the beach.
    if (this.foam) this.foam.offset.x = (seconds * 0.06) % 1;
    // The start tree runs its count: three ambers, then green, every eight seconds.
    const step = Math.floor((seconds % 8) / 0.8);
    this.lamps.forEach((lamp, k) => {
      const on = k < 3 ? step === k + 1 : step >= 4 && step < 8;
      lamp.color.setHex(on ? (k < 3 ? 0xffb020 : 0x30ff60) : 0x2a2a2a);
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea, so the beach and the surf lie over it. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 1);
      position.setY(i * 2 + 1, p.height - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    const beachgoers = this.beachgoers;
    if (beachgoers) {
      this.strollers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04;
        beachgoers.set(
          i,
          w.x,
          heightAt(Math.max(metres, 0)),
          -metres,
          w.speed > 0 ? 0 : Math.PI,
          w.scale,
          step,
        );
      });
      beachgoers.commit();
    }
  }

  /**
   * The packed sand the rider takes with its tyre tracks, the wet sand and the surf on the left
   * and the ocean beyond, and the soft dry sand rising on the right.
   */
  private addBeach(roadHalf: number, points: number): void {
    const r = roadHalf;
    const packed = this.material({ map: this.repeat(packedTexture(), 7, 8), roughness: 0.9 });
    const wet = this.material({
      map: this.repeat(wetTexture(), 9, 10),
      roughness: 0.25,
      metalness: 0.15,
    });
    const foam = this.repeat(foamTexture(), SURF, 30);
    this.foam = foam;
    const surf = this.material({ map: foam, roughness: 0.3 });
    const ocean = this.material({
      map: this.repeat(oceanTexture(), 60, 60),
      roughness: 0.15,
      metalness: 0.2,
    });
    const dry = this.material({ map: this.repeat(dryTexture(), 10, 10), roughness: 1 });
    this.ribbons.add(points, packed, [
      [r + 2, 0.004],
      [-r - 1, 0.004],
    ]);
    this.ribbons.add(points, wet, [
      [-r - 1, 0.004],
      [-r - 1 - WET, -0.15],
    ]);
    this.ribbons.add(points, surf, [
      [-r - 1 - WET, -0.15],
      [-r - 1 - WET - SURF, -0.3],
    ]);
    this.ribbons.add(points, ocean, [
      [-r - 1 - WET - SURF, -0.3],
      [-r - 1 - WET - SURF - 900, -0.3],
    ]);
    this.ribbons.add(points, dry, [
      [r + 160, 2.5],
      [r + 60, 1.2],
      [r + 12, 0.15],
      [r + 2, 0.004],
    ]);
  }

  /** Striped umbrellas and towels on the dry sand, and lifeguard towers along it. */
  private addUmbrellasAndTowers(roadHalf: number): void {
    const random = seeded(601);
    const pole = new CylinderGeometry(0.03, 0.03, 2.3, 6);
    pole.translate(0, 1.15, 0);
    const canopy = new ConeGeometry(1.3, 0.55, 12, 1, true);
    canopy.translate(0, 2.3, 0);
    const towel = new BoxGeometry(0.9, 0.02, 1.8);
    this.disposables.push(pole, canopy, towel);
    const white = this.material({ color: 0xf5f5f0, roughness: 0.6 });
    const stripes = ['#ff6b5a', '#2ec4b6', '#ffd23f', '#3a86ff', '#f15bb5'].map((c) =>
      this.material({ map: this.track(stripeTexture(c)), roughness: 0.8, side: 2 }),
    );
    for (let offset = 6; offset < LOOP; offset += 10 + random() * 14) {
      if (Math.abs(offset - START) < 25) continue;
      const spot = new Group();
      const m = stripes[Math.floor(random() * stripes.length)]!;
      const u = new Group();
      u.add(new Mesh(pole, white), new Mesh(canopy, m));
      u.rotation.z = (random() - 0.5) * 0.25;
      const t = new Mesh(towel, m);
      t.position.set(1.2, 0.02, 0.3);
      t.rotation.y = random() - 0.5;
      spot.add(u, t);
      spot.children.forEach((c) => (c.castShadow = true));
      this.group.add(spot);
      this.props.push({ mesh: spot, offset, x: roadHalf + 8 + random() * 30 });
    }
    // Lifeguard towers: a hut on stilts with a ramp and a red flag.
    const hut = this.material({ color: 0x3fb6d8, roughness: 0.6 });
    const trim = this.material({ color: 0xffd23f, roughness: 0.6 });
    const wood = this.material({ color: 0xe9e2d0, roughness: 0.8 });
    const flag = this.material({ color: 0xd62828, roughness: 0.8, side: 2 });
    const leg = new CylinderGeometry(0.08, 0.08, 2.2, 6);
    leg.translate(0, 1.1, 0);
    this.disposables.push(leg);
    for (let offset = 30; offset < LOOP; offset += 100) {
      const tower = new Group();
      for (const [x, z] of [
        [-0.9, -0.9],
        [0.9, -0.9],
        [-0.9, 0.9],
        [0.9, 0.9],
      ] as const) {
        const l = new Mesh(leg, wood);
        l.position.set(x, 0, z);
        tower.add(l);
      }
      const box = new Mesh(this.unit, hut);
      box.scale.set(2.4, 1.8, 2.4);
      box.position.y = 3.1;
      const roof = new Mesh(this.unit, trim);
      roof.scale.set(2.8, 0.2, 2.8);
      roof.position.y = 4.1;
      const ramp = new Mesh(this.unit, wood);
      ramp.scale.set(0.8, 0.08, 3.2);
      ramp.position.set(0, 1.2, 2.3);
      ramp.rotation.x = 0.75;
      const mast = new Mesh(leg, wood);
      mast.position.set(1, 4.1, 1);
      const f = new Mesh(this.unit, flag);
      f.scale.set(0.02, 0.5, 0.8);
      f.position.set(1, 6, 1.4);
      tower.add(box, roof, ramp, mast, f);
      tower.children.forEach((c) => (c.castShadow = true));
      tower.rotation.y = Math.PI / 2;
      this.group.add(tower);
      this.props.push({ mesh: tower, offset, x: roadHalf + 12 });
    }
  }

  /** Sea-oat dunes in a ridge behind the beach, merged into tiles. */
  private addDunes(roadHalf: number): void {
    const sand = this.material({ map: this.repeat(dryTexture(), 6, 6), roughness: 1 });
    const oats = this.material({ color: 0x9aa860, roughness: 1 });
    const random = seeded(607);
    const mounds: BufferGeometry[] = [];
    const grass: BufferGeometry[] = [];
    for (let z = 0; z < 100; z += 7 + random() * 5) {
      const mound = new SphereGeometry(6 + random() * 4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      mound.scale(1.4, 0.45 + random() * 0.2, 1);
      mound.translate(random() * 6, 0, -z);
      mounds.push(mound);
      for (let k = 0; k < 6; k++) {
        const tuft = new ConeGeometry(0.35, 1.2, 4);
        tuft.translate((random() - 0.5) * 9, 2.4 + random() * 0.8, -z + (random() - 0.5) * 6);
        grass.push(tuft);
      }
    }
    const ridge = mergeGeometries(mounds.map((m) => m.toNonIndexed()))!;
    const tufts = mergeGeometries(grass.map((g) => g.toNonIndexed()))!;
    [...mounds, ...grass].forEach((g) => g.dispose());
    this.disposables.push(ridge, tufts);
    for (let offset = 0; offset < LOOP; offset += 100) {
      const tile = new Group();
      tile.add(new Mesh(ridge, sand), new Mesh(tufts, oats));
      this.group.add(tile);
      this.props.push({ mesh: tile, offset, x: roadHalf + 48 });
    }
  }

  /** The beachside hotels behind the dunes: pastel towers with balconies, in a row. */
  private addHotels(roadHalf: number): void {
    const random = seeded(613);
    const colours = [0xf5e6d0, 0xf2c9b8, 0xd8ecf0, 0xfff2c8, 0xe8d8f0, 0xffffff];
    const windows = this.track(balconyTexture());
    windows.wrapS = RepeatWrapping;
    windows.wrapT = RepeatWrapping;
    for (let offset = 0; offset < LOOP; offset += 30 + random() * 20) {
      const floors = 6 + Math.floor(random() * 14);
      const width = 18 + random() * 22;
      const map = windows.clone();
      map.repeat.set(width / 6, floors);
      map.needsUpdate = true;
      this.track(map);
      const facade = this.material({
        map,
        color: colours[Math.floor(random() * colours.length)]!,
        roughness: 0.7,
      });
      const hotel = new Group();
      const body = new Mesh(this.unit, facade);
      body.scale.set(14, floors * 3.1, width);
      body.position.y = (floors * 3.1) / 2;
      body.castShadow = true;
      hotel.add(body);
      this.group.add(hotel);
      this.props.push({ mesh: hotel, offset, x: roadHalf + 80 + random() * 20 });
    }
  }

  /** The Main Street Pier crossing the beach on its pilings once a lap, out over the surf. */
  private addPier(roadHalf: number): void {
    const wood = this.material({ map: this.repeat(plankTexture(), 4, 4), roughness: 0.85 });
    const piling = new CylinderGeometry(0.35, 0.4, 9, 8);
    piling.translate(0, 4.5, 0);
    this.disposables.push(piling);
    const pier = new Group();
    const length = 220;
    const deck = new Mesh(this.unit, wood);
    deck.scale.set(length, 0.6, 10);
    deck.position.set(-length / 2 + 40, 8.6, 0);
    deck.castShadow = true;
    pier.add(deck);
    for (const z of [-4.5, 4.5]) {
      const rail = new Mesh(this.unit, wood);
      rail.scale.set(length, 1.1, 0.15);
      rail.position.set(-length / 2 + 40, 9.4, z);
      pier.add(rail);
      for (let x = 40; x > 40 - length; x -= 9) {
        // The span over the riders' line is left clear.
        if (x < roadHalf + 2 && x > -roadHalf - 2) continue;
        const p = new Mesh(piling, wood);
        p.position.set(x, -0.3, z);
        pier.add(p);
      }
    }
    this.group.add(pier);
    this.props.push({ mesh: pier, offset: PIER, x: 0 });
  }

  /**
   * The drag strip's start, once a lap: a start tree on the right with its staged lamps, three
   * ambers and a green that count down on the ride's clock, and a timing board above the beach.
   */
  private addDragStrip(roadHalf: number): void {
    const black = this.material({ color: 0x1b1b1f, roughness: 0.5 });
    const board = this.material({ map: this.track(timingTexture()), roughness: 0.6 });
    const line = this.material({ color: 0xf5f5f0, roughness: 0.8 });
    const lamp = new SphereGeometry(0.16, 12, 8);
    this.disposables.push(lamp);
    const start = new Group();
    const post = new Mesh(this.unit, black);
    post.scale.set(0.15, 3.4, 0.15);
    post.position.y = 1.7;
    const head = new Mesh(this.unit, black);
    head.scale.set(0.5, 2, 0.3);
    head.position.y = 2.6;
    start.add(post, head);
    for (let k = 0; k < 4; k++) {
      const material = new MeshBasicMaterial({ color: 0x2a2a2a });
      this.disposables.push(material);
      this.lamps.push(material);
      for (const x of [-0.12, 0.12]) {
        const l = new Mesh(lamp, material);
        l.position.set(x, 3.3 - k * 0.45, 0.17);
        start.add(l);
      }
    }
    start.rotation.y = Math.PI;
    this.group.add(start);
    this.props.push({ mesh: start, offset: START - 2, x: roadHalf + 1.2 });
    // The start line across the sand, and the timing board on its gantry.
    const stripe = new Group();
    const paint = new Mesh(this.unit, line);
    paint.scale.set(roadHalf * 2 + 2, 0.02, 0.5);
    paint.position.set(0.5, 0.01, 0);
    stripe.add(paint);
    this.group.add(stripe);
    this.props.push({ mesh: stripe, offset: START, x: 0 });
    const gantry = new Group();
    for (const x of [-8, 8]) {
      const leg = new Mesh(this.unit, black);
      leg.scale.set(0.4, 7, 0.4);
      leg.position.set(x, 3.5, 0);
      gantry.add(leg);
    }
    const panel = new Mesh(this.unit, board);
    panel.scale.set(16, 3, 0.3);
    panel.position.y = 7.5;
    panel.rotation.y = Math.PI;
    gantry.add(panel);
    this.group.add(gantry);
    this.props.push({ mesh: gantry, offset: START + 40, x: roadHalf + 14 });
  }

  /** Vintage stock cars standing on the sand by the start, their numbers on the doors. */
  private addStockCars(roadHalf: number): void {
    const wheel = new CylinderGeometry(0.36, 0.36, 0.26, 14);
    wheel.rotateZ(Math.PI / 2);
    const cabin = new BoxGeometry(1.5, 0.6, 1.9);
    const body = new BoxGeometry(1.8, 0.62, 4.6);
    this.disposables.push(wheel, cabin, body);
    const tyre = this.material({ color: 0x1b1b1f, roughness: 0.8 });
    const glass = this.material({ color: 0x2a3640, roughness: 0.15, metalness: 0.4 });
    const cars: [string, number][] = [
      ['#1f5fbf', 3],
      ['#ffd23f', 22],
      ['#d62828', 92],
      ['#f5f5f0', 11],
      ['#2a7a4a', 7],
    ];
    cars.forEach(([colour, number], k) => {
      const paint = this.material({
        map: this.track(numberTexture(colour, number)),
        roughness: 0.35,
        metalness: 0.3,
      });
      const car = new Group();
      const b = new Mesh(body, paint);
      b.position.y = 0.66;
      const c = new Mesh(cabin, glass);
      c.position.set(0, 1.25, 0.3);
      car.add(b, c);
      for (const [x, z] of [
        [-0.9, -1.5],
        [0.9, -1.5],
        [-0.9, 1.5],
        [0.9, 1.5],
      ] as const) {
        const w = new Mesh(wheel, tyre);
        w.position.set(x, 0.36, z);
        car.add(w);
      }
      car.children.forEach((m) => (m.castShadow = true));
      car.rotation.y = 0.35 + k * 0.1;
      this.group.add(car);
      this.props.push({ mesh: car, offset: START + 10 + k * 7, x: roadHalf + 6 + (k % 2) * 3 });
    });
  }

  /** Beachgoers strolling along the water's edge and over the soft sand. */
  private addBeachgoers(roadHalf: number): void {
    const random = seeded(617);
    for (let offset = 0; offset < LOOP; offset += 4 + random() * 7) {
      const water = random() < 0.6;
      this.strollers.push({
        offset,
        x: water ? -roadHalf - 2 - random() * (WET - 1) : roadHalf + 4 + random() * 30,
        speed: (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.5),
        scale: 0.85 + random() * 0.2,
        phase: random() * 6.3,
      });
    }
    this.beachgoers = new Figures(
      this.group,
      this.disposables,
      this.strollers.length,
      BEACH_WEAR,
      619,
    );
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

/** Firm, damp-packed sand with tyre tracks pressed along it. */
function packedTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#c9a878', 631);
    g.fillStyle = 'rgba(110,80,50,0.22)';
    for (const x of [40, 62, 150, 172, 214]) g.fillRect(x, 0, 10, 256);
    g.fillStyle = 'rgba(80,60,40,0.18)';
    for (let y = 0; y < 256; y += 8) for (const x of [40, 62, 150, 172]) g.fillRect(x, y, 10, 3);
  });
}

/** Wet sand at the tide line, shining with the sky. */
function wetTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#8f7a5e', 641);
    const random = seeded(643);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(200,225,240,${0.12 + random() * 0.2})`;
      g.fillRect(random() * 256, random() * 256, 3 + random() * 30, 2);
    }
  });
}

/** Soft dry sand, pale and footprinted. */
function dryTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#e8d2a8', 647);
    const random = seeded(653);
    g.fillStyle = 'rgba(150,120,80,0.2)';
    for (let i = 0; i < 90; i++) {
      g.beginPath();
      g.ellipse(random() * 256, random() * 256, 3, 5, random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** The surf: lines of white foam breaking towards the beach across the across axis. */
function foamTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const sea = g.createLinearGradient(0, 0, 256, 0);
    sea.addColorStop(0, '#6fa8a8');
    sea.addColorStop(1, '#2f6f8a');
    g.fillStyle = sea;
    g.fillRect(0, 0, 256, 256);
    const random = seeded(659);
    for (const x of [20, 90, 170]) {
      for (let y = 0; y < 256; y += 2) {
        const w = 10 + Math.sin(y / 9 + x) * 6 + random() * 8;
        g.fillStyle = `rgba(250,252,255,${0.65 + random() * 0.3})`;
        g.fillRect(x + Math.sin(y / 14) * 5, y, w, 2);
      }
    }
  });
}

/** The Atlantic: blue-green water with glints. */
function oceanTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#2a6a8a';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(661);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(220,240,250,${0.05 + random() * 0.18})`;
      g.fillRect(random() * 512, random() * 512, 3, 14 + random() * 24);
    }
  });
}

/** An umbrella's alternating stripes. */
function stripeTexture(colour: string): CanvasTexture {
  return canvasTexture(128, 32, (g) => {
    for (let x = 0; x < 128; x += 16) {
      g.fillStyle = (x / 16) % 2 ? '#ffffff' : colour;
      g.fillRect(x, 0, 16, 32);
    }
  });
}

/** A hotel floor: a balcony rail in front of sliding windows, one bay wide. */
function balconyTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#4a6a80';
    g.fillRect(6, 10, 52, 34);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(6, 10, 52, 6);
    g.fillStyle = '#e0e0e0';
    g.fillRect(0, 44, 64, 14);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(0, 58, 64, 6);
  });
}

/** The pier's weathered planking. */
function plankTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#9a8468', 673);
    g.fillStyle = 'rgba(40,30,20,0.4)';
    for (let y = 0; y < 128; y += 16) g.fillRect(0, y, 128, 2);
  });
}

/** The timing board: the strip's name and the quarter mile, lit in amber on black. */
function timingTexture(): CanvasTexture {
  return canvasTexture(512, 96, (g) => {
    g.fillStyle = '#111114';
    g.fillRect(0, 0, 512, 96);
    g.fillStyle = '#ffb020';
    g.font = 'bold 34px sans-serif';
    g.textAlign = 'center';
    g.fillText('DAYTONA BEACH', 256, 42);
    g.fillStyle = '#30ff60';
    g.font = 'bold 26px monospace';
    g.fillText('1/4 MILE  ·  6.42 s', 256, 80);
  });
}

/** A stock car's paint with its roundel and number on the doors. */
function numberTexture(colour: string, number: number): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(64, 64, 34, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#111114';
    g.font = 'bold 40px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(number), 64, 66);
  });
}
