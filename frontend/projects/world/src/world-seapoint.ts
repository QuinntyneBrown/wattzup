// Sea Point's promenade, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Cape
// Town's seafront on a clear morning. The rider takes the promenade's paving; on the left a lawn
// and a low wall give onto dark granite boulders where the Atlantic rolls in white against them,
// kelp lying in the swell, and on the right palms and a lawn edge Beach Road, where white
// apartment blocks with balconies face the sea. Lion's Head rises over them, Table Mountain's flat
// top stands beyond, and once a lap the Green Point lighthouse's red and white stripes stand on
// the shore. Joggers, walkers and their dogs share the promenade. Built on the shared kit
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
  IcosahedronGeometry,
  Mesh,
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

/** The promenade repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 380;
const BEHIND = 24;
const KERB = 0.12;
/** The lawn on the sea side, the wall's height, the rocks' run down and the sea below. */
const LAWN = 6;
const WALL = 0.6;
const ROCKS = 14;
const SEA = 2.2;
/** Beach Road's lawn, its lanes, and the lighthouse once a lap. */
const VERGE = 5;
const ROAD = 8;
const LIGHTHOUSE = 150;

const WALKER_WEAR = {
  tops: ['#ff6b5a', '#2ec4b6', '#ffffff', '#1d1f24', '#ffd23f', '#3a86ff', '#007a4d', '#f15bb5'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#e8c9a0'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#5a3a29', '#3d2a20'],
};

interface Walker {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
  readonly dog: Group | null;
}

export class SeaPointStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly walkers: Walker[] = [];
  private people: Figures | null = null;
  private surf: Texture | null = null;
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
    this.addBeachRoad(roadHalf, points);
    this.addBlocks(roadHalf);
    this.addPalms(roadHalf);
    this.addBenchesAndLamps(roadHalf);
    this.addLighthouse(roadHalf);
    this.addWalkers(roadHalf);
    this.addMountains();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The swell rolls in against the rocks and draws back.
    if (this.surf) this.surf.offset.x = Math.sin(seconds * 0.7) * 0.06 + seconds * 0.01;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea, so the rocks and the water lie over it. */
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
    const people = this.people;
    if (people) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const running = Math.abs(w.speed) > 2;
        const step =
          Math.abs(Math.sin(this.time * (running ? 7 : 4) + w.phase)) * (running ? 0.08 : 0.04);
        const y = heightAt(metres);
        const heading = w.speed > 0 ? 0 : Math.PI;
        people.set(i, w.x, y + KERB, -metres, heading, 0.95, step);
        if (w.dog) {
          w.dog.position.set(
            w.x + 0.7,
            y + KERB + Math.abs(Math.sin(this.time * 9 + w.phase)) * 0.05,
            -metres - (w.speed > 0 ? 1.2 : -1.2),
          );
          w.dog.rotation.y = heading;
        }
      });
      people.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The sea-side lawn, the low wall, the rocky run down to the surf, and the Atlantic. */
  private addShore(roadHalf: number, points: number): void {
    const r = roadHalf;
    const paving = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.85 });
    const lawn = this.material({ map: this.repeat(grassTexture(), 3, 3), roughness: 1 });
    const wall = this.material({ color: 0xe8e2d4, roughness: 0.85 });
    const rock = this.material({ map: this.repeat(rockTexture(), 4, 4), roughness: 0.9 });
    const foam = this.repeat(surfTexture(), 16, 24);
    this.surf = foam;
    const surf = this.material({ map: foam, roughness: 0.3 });
    const ocean = this.material({
      map: this.repeat(oceanTexture(), 60, 60),
      roughness: 0.12,
      metalness: 0.25,
    });
    const lawnEdge = -r - LAWN;
    const rocksEnd = lawnEdge - 0.4 - ROCKS;
    this.ribbons.add(points, paving, [
      [r, 0.004],
      [-r, 0.004],
    ]);
    this.ribbons.add(points, lawn, [
      [-r, 0.004],
      [-r - 0.1, KERB],
      [lawnEdge, KERB],
    ]);
    this.ribbons.add(points, wall, [
      [lawnEdge, KERB],
      [lawnEdge, WALL],
      [lawnEdge - 0.4, WALL],
      [lawnEdge - 0.4, -0.4],
    ]);
    this.ribbons.add(points, rock, [
      [lawnEdge - 0.4, -0.4],
      [lawnEdge - 6, -1.2],
      [rocksEnd, -SEA + 0.1],
    ]);
    this.ribbons.add(points, surf, [
      [rocksEnd, -SEA + 0.1],
      [rocksEnd - 18, -SEA],
    ]);
    this.ribbons.add(points, ocean, [
      [rocksEnd - 18, -SEA],
      [rocksEnd - 1400, -SEA],
    ]);
  }

  /** Dark granite boulders heaped along the shore, wet at their feet. */
  private addBoulders(roadHalf: number): void {
    const granite = this.material({
      map: this.repeat(rockTexture(), 1, 1),
      color: 0x8a8580,
      roughness: 0.75,
    });
    const kelp = this.material({ color: 0x5a4a1e, roughness: 0.7 });
    const tiles = [0, 1, 2].map((k) => {
      const random = seeded(1001 + k);
      const parts: BufferGeometry[] = [];
      const weed: BufferGeometry[] = [];
      for (let i = 0; i < 46; i++) {
        const size = 0.4 + random() ** 1.5 * 1.4;
        const rock = new DodecahedronGeometry(size, 0);
        rock.scale(1, 0.65 + random() * 0.3, 1.1);
        rock.rotateY(random() * 3);
        const d = 1 + random() * (ROCKS + 6);
        rock.translate(-roadHalf - LAWN - 0.4 - d, -0.4 - d * 0.12, -random() * 60);
        parts.push(rock.index ? rock.toNonIndexed() : rock);
        if (random() < 0.3) {
          const strand = new SphereGeometry(0.5 + random() * 0.6, 6, 4);
          strand.scale(2.2, 0.15, 0.8);
          strand.rotateY(random() * 3);
          strand.translate(
            -roadHalf - LAWN - ROCKS - 2 - random() * 12,
            -SEA + 0.05,
            -random() * 60,
          );
          weed.push(strand.toNonIndexed());
        }
      }
      const rocks = mergeGeometries(parts)!;
      const kelpBeds = mergeGeometries(
        weed.length ? weed : [new SphereGeometry(0.01).toNonIndexed()],
      )!;
      [...parts, ...weed].forEach((p) => p.dispose());
      this.disposables.push(rocks, kelpBeds);
      return [rocks, kelpBeds] as const;
    });
    for (let offset = 0, k = 0; offset < LOOP; offset += 60, k++) {
      const [rocks, kelpBeds] = tiles[k % 3]!;
      const tile = new Group();
      const mesh = new Mesh(rocks, granite);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tile.add(mesh, new Mesh(kelpBeds, kelp));
      this.group.add(tile);
      this.props.push({ mesh: tile, offset, x: 0 });
    }
  }

  /** The land-side lawn and Beach Road beyond it, with its pavement. */
  private addBeachRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const lawn = this.material({ map: this.repeat(grassTexture(), 3, 3), roughness: 1 });
    const asphalt = this.material({ map: this.repeat(roadTexture(), ROAD, 12), roughness: 0.85 });
    const paving = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.85 });
    this.ribbons.add(points, lawn, [
      [r + VERGE, KERB],
      [r + 0.1, KERB],
      [r, 0.004],
    ]);
    this.ribbons.add(points, asphalt, [
      [r + VERGE + ROAD, 0.02],
      [r + VERGE, 0.02],
    ]);
    this.ribbons.add(points, paving, [
      [r + VERGE + ROAD + 4, KERB],
      [r + VERGE + ROAD + 0.1, KERB],
      [r + VERGE + ROAD, 0.02],
    ]);
  }

  /** White apartment blocks along Beach Road, balconied towards the sea, side by side. */
  private addBlocks(roadHalf: number): void {
    const random = seeded(1009);
    const facades = [0xffffff, 0xf5f1e8, 0xe8f0f2, 0xf2e8dc, 0xdfe8e0];
    const balconies = this.track(balconyTexture());
    balconies.wrapS = RepeatWrapping;
    balconies.wrapT = RepeatWrapping;
    for (let offset = 0; offset < LOOP;) {
      const width = 20 + random() * 18;
      const floors = 5 + Math.floor(random() * 10);
      const height = floors * 3;
      const map = balconies.clone();
      map.repeat.set(width / 5, floors);
      map.needsUpdate = true;
      this.track(map);
      const facade = this.material({
        map,
        color: facades[Math.floor(random() * facades.length)]!,
        roughness: 0.6,
      });
      const block = new Group();
      const body = new Mesh(this.unit, facade);
      body.scale.set(18, height, width - 3);
      body.position.set(9, height / 2, -width / 2);
      body.castShadow = true;
      block.add(body);
      this.group.add(block);
      this.props.push({ mesh: block, offset, x: roadHalf + VERGE + ROAD + 4 });
      offset += width;
    }
  }

  /** Palms along the land-side lawn: tall Washingtonias and squat date palms. */
  private addPalms(roadHalf: number): void {
    const random = seeded(1013);
    const bark = this.material({ color: 0x8a7a64, roughness: 0.95 });
    const fronds = this.material({ color: 0x4f7f34, roughness: 0.9 });
    const trunk = new CylinderGeometry(0.2, 0.3, 12, 8);
    trunk.translate(0, 6, 0);
    const parts: BufferGeometry[] = [];
    for (let k = 0; k < 12; k++) {
      const frond = new ConeGeometry(0.4, 3, 4);
      frond.scale(1, 1, 0.22);
      frond.translate(0, 1.5, 0);
      frond.rotateZ(1.25 + (k % 2) * 0.25);
      frond.rotateY((k / 12) * Math.PI * 2);
      frond.translate(0, 12, 0);
      parts.push(frond);
    }
    const crown = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(trunk, crown);
    for (let offset = 6; offset < LOOP; offset += 14 + random() * 10) {
      const palm = new Group();
      palm.add(new Mesh(trunk, bark), new Mesh(crown, fronds));
      palm.children.forEach((c) => (c.castShadow = true));
      palm.scale.setScalar(0.7 + random() * 0.45);
      palm.rotation.set((random() - 0.5) * 0.08, random() * 6, (random() - 0.5) * 0.08);
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, x: roadHalf + 1.5 + random() * (VERGE - 2.5) });
    }
  }

  /** Benches facing the sea, and slim lamp posts along the promenade's sea edge. */
  private addBenchesAndLamps(roadHalf: number): void {
    const wood = this.material({ color: 0x8a6a48, roughness: 0.8 });
    const steel = this.material({ color: 0x3a4048, metalness: 0.5, roughness: 0.4 });
    const glow = this.material({ color: 0xf5f1e8, emissive: 0xfff4d0, emissiveIntensity: 0.2 });
    const post = new CylinderGeometry(0.06, 0.09, 5, 8);
    post.translate(0, 2.5, 0);
    const head = new BoxGeometry(0.9, 0.12, 0.25);
    head.translate(-0.35, 5, 0);
    this.disposables.push(post, head);
    for (let offset = 10; offset < LOOP; offset += 25) {
      const lamp = new Group();
      lamp.add(new Mesh(post, steel), new Mesh(head, glow));
      this.group.add(lamp);
      this.props.push({ mesh: lamp, offset, x: -roadHalf - 0.6 });
      const bench = new Group();
      const seat = new Mesh(this.unit, wood);
      seat.scale.set(0.5, 0.08, 1.8);
      seat.position.y = 0.45;
      const back = new Mesh(this.unit, wood);
      back.scale.set(0.08, 0.45, 1.8);
      back.position.set(0.25, 0.75, 0);
      const legs = new Mesh(this.unit, steel);
      legs.scale.set(0.4, 0.45, 1.6);
      legs.position.y = 0.22;
      bench.add(seat, back, legs);
      this.group.add(bench);
      this.props.push({ mesh: bench, offset: offset + 12, x: -roadHalf - 2.2 });
    }
  }

  /** The Green Point lighthouse on the shore once a lap, square and striped diagonally red and white. */
  private addLighthouse(roadHalf: number): void {
    const stripes = this.material({ map: this.track(stripeTexture()), roughness: 0.6 });
    const white = this.material({ color: 0xf5f5f0, roughness: 0.6 });
    const red = this.material({ color: 0xc8102e, roughness: 0.5 });
    const glass = this.material({
      color: 0xfff4d0,
      emissive: 0xffe8a0,
      emissiveIntensity: 0.4,
      roughness: 0.1,
    });
    const lighthouse = new Group();
    const tower = new Mesh(this.unit, stripes);
    tower.scale.set(4, 16, 4);
    tower.position.y = 8;
    const gallery = new Mesh(this.unit, white);
    gallery.scale.set(5, 0.4, 5);
    gallery.position.y = 16.2;
    const lantern = new CylinderGeometry(1.2, 1.2, 2.2, 10);
    lantern.translate(0, 17.5, 0);
    const dome = new ConeGeometry(1.5, 1.4, 10);
    dome.translate(0, 19.3, 0);
    this.disposables.push(lantern, dome);
    lighthouse.add(tower, gallery, new Mesh(lantern, glass), new Mesh(dome, red));
    lighthouse.children.forEach((c) => (c.castShadow = true));
    this.group.add(lighthouse);
    this.props.push({ mesh: lighthouse, offset: LIGHTHOUSE, x: -roadHalf - LAWN - 6 });
  }

  /** Joggers, walkers and their dogs, both ways along the promenade. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(1019);
    const coats = [0x2a2018, 0xc8a070, 0xf5f1e8, 0x1d1f24].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const body = new BoxGeometry(0.22, 0.24, 0.6);
    body.translate(0, 0.4, 0);
    const head = new BoxGeometry(0.16, 0.16, 0.22);
    head.translate(0, 0.56, -0.36);
    const legs = new BoxGeometry(0.18, 0.3, 0.5);
    legs.translate(0, 0.15, 0);
    const dog = mergeGeometries([body, head, legs].map((g) => g.toNonIndexed()))!;
    [body, head, legs].forEach((g) => g.dispose());
    this.disposables.push(dog);
    for (let offset = 0; offset < LOOP; offset += 5 + random() * 9) {
      const jogger = random() < 0.4;
      const speed = (random() < 0.5 ? 1 : -1) * (jogger ? 2.6 + random() : 1 + random() * 0.4);
      let pet: Group | null = null;
      if (!jogger && random() < 0.35) {
        pet = new Group();
        pet.add(new Mesh(dog, coats[Math.floor(random() * coats.length)]!));
        this.group.add(pet);
      }
      // Walkers keep to the edges; the promenade's middle is left for the riders.
      const side = random() < 0.55 ? -1 : 1;
      this.walkers.push({
        offset,
        x: side * (roadHalf - 0.5 - random() * 0.6),
        speed,
        phase: random() * 6.3,
        dog: pet,
      });
    }
    this.people = new Figures(this.group, this.disposables, this.walkers.length, WALKER_WEAR, 1021);
  }

  /** Lion's Head over the blocks on the right, Signal Hill's shoulder, and Table Mountain beyond. */
  private addMountains(): void {
    const fynbos = this.material({ map: this.repeat(slopeTexture(), 120, 120), roughness: 1 });
    const cliff = this.material({
      map: this.repeat(rockTexture(), 60, 60),
      color: 0x9a948a,
      roughness: 0.95,
    });
    const head = new ConeGeometry(330, 640, 20, 4);
    head.translate(0, 320, 0);
    const crown = new IcosahedronGeometry(1, 1);
    const hill = new SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(head, crown, hill);
    const lion = new Group();
    lion.add(new Mesh(head, fynbos));
    const top = new Mesh(
      crown,
      this.material({ map: this.repeat(rockTexture(), 40, 40), color: 0x7a6e60, roughness: 1 }),
    );
    top.scale.set(95, 115, 85);
    top.position.y = 545;
    lion.add(top);
    lion.position.set(260, -20, -1900);
    const signal = new Mesh(hill, fynbos);
    signal.scale.set(520, 240, 380);
    signal.position.set(700, -20, -1500);
    // Table Mountain: a long flat-topped massif with sheer grey cliffs over green slopes.
    const table = new Group();
    const slopes = new Mesh(hill, fynbos);
    slopes.scale.set(1500, 520, 700);
    const plateau = new Mesh(this.unit, cliff);
    plateau.scale.set(1800, 520, 460);
    plateau.position.y = 760;
    table.add(slopes, plateau);
    table.position.set(1100, -20, -4200);
    table.rotation.y = -0.2;
    this.horizon.add(lion, signal, table);
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

/** The promenade's warm, sand-coloured paving. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#c9b89a', 1031);
    g.fillStyle = 'rgba(80,60,40,0.3)';
    g.fillRect(0, 0, 128, 2);
    g.fillRect(0, 0, 2, 64);
    g.fillRect(64, 64, 2, 64);
    g.fillRect(0, 64, 128, 2);
  });
}

/** Mown kikuyu grass. */
function grassTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5f9a3e', 1033);
    g.fillStyle = 'rgba(255,255,200,0.06)';
    for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 16, 128);
  });
}

/** Dark granite, lichened and wet. */
function rockTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#5a5650', 1039);
    const random = seeded(1049);
    for (let i = 0; i < 200; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '200,190,150' : '30,30,30'},${0.08 + random() * 0.15})`;
      g.fillRect(random() * 256, random() * 256, 3 + random() * 12, 3 + random() * 8);
    }
  });
}

/** White water rolling in over the rocks, in broken lines across the across axis. */
function surfTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const sea = g.createLinearGradient(0, 0, 256, 0);
    sea.addColorStop(0, '#d8eef0');
    sea.addColorStop(0.35, '#4f9aaa');
    sea.addColorStop(1, '#245f7a');
    g.fillStyle = sea;
    g.fillRect(0, 0, 256, 256);
    const random = seeded(1051);
    for (const x of [10, 60, 130, 200]) {
      for (let y = 0; y < 256; y += 2) {
        g.fillStyle = `rgba(250,252,255,${0.5 + random() * 0.45})`;
        g.fillRect(x + Math.sin(y / 11 + x) * 6, y, 8 + random() * 14, 2);
      }
    }
  });
}

/** The cold Atlantic: deep blue-green, flecked white. */
function oceanTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#1e5a78';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(1061);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(210,235,245,${0.05 + random() * 0.18})`;
      g.fillRect(random() * 512, random() * 512, 3, 12 + random() * 24);
    }
  });
}

/** Beach Road's lanes and its centre line. */
function roadTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#56575e', 1063);
    g.fillStyle = 'rgba(240,240,230,0.8)';
    for (let y = 0; y < 256; y += 64) g.fillRect(126, y, 5, 32);
  });
}

/** A block's bay, one floor high: a glass slider behind a balcony's white slab and glass rail. */
function balconyTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#4a6878';
    g.fillRect(6, 8, 52, 36);
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.fillRect(6, 8, 52, 8);
    g.fillStyle = 'rgba(160,200,215,0.6)';
    g.fillRect(2, 44, 60, 12);
    g.fillStyle = '#e8e8e4';
    g.fillRect(0, 56, 64, 8);
  });
}

/** The lighthouse's diagonal red and white stripes. */
function stripeTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    g.fillStyle = '#f5f5f0';
    g.fillRect(0, 0, 128, 512);
    g.fillStyle = '#c8102e';
    for (let y = -128; y < 640; y += 96) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(128, y - 64);
      g.lineTo(128, y - 16);
      g.lineTo(0, y + 48);
      g.closePath();
      g.fill();
    }
  });
}

/** The mountains' fynbos: grey-green scrub with bare rock showing through. */
function slopeTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6a7a52', 1069);
    const random = seeded(1087);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '150,140,120' : '60,80,50'},${0.2 + random() * 0.3})`;
      g.fillRect(random() * 256, random() * 256, 4 + random() * 16, 3 + random() * 8);
    }
  });
}
