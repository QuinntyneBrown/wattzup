// Blackpool Illuminations' promenade, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// the Golden Mile at dusk with the lights switched on. Festoons of coloured bulbs swing across
// the road between the lamps, lit arches span it, and the illuminated tableaux stand along the
// sea wall. On the left, double-deck trams glide along the tramway and halt at its stops, in front
// of the hotels, arcades and chip shops with their neon; on the right the railings look down on
// the beach and the sea, and the North Pier runs out over the water once a lap. The Tower rises
// ahead, lit from its feet to its flag. Built on the shared kit (world-kit.ts) on the pattern of
// Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  TorusGeometry,
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
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.14;
/** The tramway runs TRAMWAY metres wide left of the road, its two tracks at these offsets. */
const TRAMWAY = 7;
const TRACKS = [1.75, 5.25] as const;
/** The sea wall stands this far right of the road's edge; the beach lies BEACH below. */
const SEA_WALL = 9;
const BEACH = 3.2;
/** The frontages stand this far left of the tramway, FRONT_HEIGHT tall. */
const FRONTAGE = 6;
const FRONT_HEIGHT = 13;
/** The festoons hang every FESTOON metres; an arch spans the road every ARCH. */
const FESTOON = 15;
const ARCH = 90;
/** The North Pier runs out to sea this far round each lap. */
const PIER_AT = 230;
/** The Tower stands this far ahead, left of the promenade. */
const TOWER_AHEAD = 650;
const TOWER_X = -90;

/** The bulbs' colours; each chases on and off in turn on the ride's clock. */
const BULBS = [0xff3b5c, 0xffd23f, 0x3bc9ff, 0x7dff6a];

const HOLIDAY_WEAR = {
  tops: ['#e8133c', '#ffd23f', '#2c7be5', '#f5f5f0', '#ff7a00', '#14b8a6', '#9b5de5', '#1d1f24'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#3a3a3a'],
  skins: ['#e2b48c', '#f0c8a0', '#c48a5f', '#8d5a3b', '#5a3a29', '#f5d3b5'],
};

interface Mover {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
}

interface Tram extends Mover {
  readonly mesh: Group;
}

export class BlackpoolStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number; y: number }[] = [];
  private readonly walkers: (Mover & { scale: number; phase: number })[] = [];
  private figures: Figures | null = null;
  private readonly trams: Tram[] = [];
  private readonly bulbs: MeshBasicMaterial[] = [];
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
    for (const hex of BULBS) {
      const bulb = new MeshBasicMaterial({ color: hex });
      this.disposables.push(bulb);
      this.bulbs.push(bulb);
    }
    this.addGround(roadHalf, points);
    this.addFrontages(roadHalf, points);
    this.addFestoons(roadHalf);
    this.addArches(roadHalf);
    this.addTableaux(roadHalf);
    this.addTramStops(roadHalf);
    this.addTrams(roadHalf);
    this.addWalkers(roadHalf);
    this.addPier(roadHalf);
    this.addTower();
  }

  /** The bulbs chase: each colour dims one beat in four. Reduced motion holds them still. */
  setTime(seconds: number): void {
    this.time = seconds;
    const beat = Math.floor(seconds * 2.5);
    this.bulbs.forEach((bulb, k) => {
      const on = (beat + k) % 4 !== 0;
      bulb.color.set(BULBS[k]!).multiplyScalar(on ? 1 : 0.3);
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops to the beach, so the sand and the sea lie below the sea wall. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - BEACH - 1);
      position.setY(i * 2 + 1, p.height - BEACH - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres) + prop.y, -metres);
    }
    // The trams run and halt: their speed falls to nothing once in each cycle, at a stop.
    for (const tram of this.trams) {
      const travelled = tram.speed * (this.time - Math.sin(this.time * 0.3) / 0.3);
      const metres = loopMetres(tram.offset + travelled, s, LOOP, BEHIND);
      tram.mesh.position.set(tram.x, heightAt(metres), -metres);
    }
    const figures = this.figures;
    if (figures) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4.5 + w.phase)) * 0.04;
        const y = heightAt(metres) + KERB;
        figures.set(i, w.x, y, -metres, w.speed > 0 ? 0 : Math.PI, w.scale, step);
      });
      figures.commit();
    }
    this.tower.position.set(TOWER_X, heightAt(TOWER_AHEAD), -TOWER_AHEAD);
  }

  /**
   * The tramway and its rails, the pavements, the sea wall's railings, the beach and the sea.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tramway = this.material({ map: this.repeat(tramwayTexture(), TRAMWAY, 6) });
    const flags = this.material({ map: this.repeat(flagsTexture(), 3, 3), roughness: 0.55 });
    const railing = this.material({
      map: this.repeat(railingTexture(), 1.25, 3),
      alphaTest: 0.5,
      side: DoubleSide,
      metalness: 0.4,
      roughness: 0.5,
    });
    const sand = this.material({ map: this.repeat(sandTexture(), 6, 6), roughness: 1 });
    const sea = this.material({
      map: this.repeat(seaTexture(), 40, 40),
      roughness: 0.15,
      metalness: 0.2,
    });
    this.ribbons.add(points, tramway, [
      [-r, 0.006],
      [-r - TRAMWAY, 0.006],
    ]);
    this.ribbons.add(points, flags, [
      [-r - TRAMWAY, 0.006],
      [-r - TRAMWAY - 0.2, KERB],
      [-r - TRAMWAY - FRONTAGE, KERB],
    ]);
    this.ribbons.add(points, flags, [
      [r + SEA_WALL + 0.4, KERB],
      [r + 0.2, KERB],
      [r, 0],
    ]);
    this.ribbons.add(points, railing, [
      [r + SEA_WALL, KERB + 1.15],
      [r + SEA_WALL, KERB],
    ]);
    this.ribbons.add(points, sand, [
      [r + 90, -BEACH],
      [r + SEA_WALL + 0.4, -BEACH],
      [r + SEA_WALL + 0.4, KERB],
    ]);
    this.ribbons.add(points, sea, [
      [r + 900, -BEACH - 0.25],
      [r + 90, -BEACH - 0.25],
      [r + 90, -BEACH],
    ]);
  }

  /** The Golden Mile's frontages: hotels, arcades, rock shops and chip shops, all lit. */
  private addFrontages(roadHalf: number, points: number): void {
    const x = -roadHalf - TRAMWAY - FRONTAGE;
    const front = this.material({
      map: this.repeat(frontageTexture(false), FRONT_HEIGHT, 24),
      emissiveMap: this.repeat(frontageTexture(true), FRONT_HEIGHT, 24),
      emissive: 0xffffff,
      emissiveIntensity: 1.2,
      roughness: 0.8,
    });
    const roofs = this.material({ color: 0x2a2633, roughness: 0.9 });
    this.ribbons.add(points, front, [
      [x, KERB],
      [x, FRONT_HEIGHT],
    ]);
    this.ribbons.add(points, roofs, [
      [x, FRONT_HEIGHT],
      [x - 20, FRONT_HEIGHT],
    ]);
  }

  /**
   * Festoons of bulbs swung across the road and the tramway between pairs of lamps, every
   * FESTOON metres; the bulbs alternate through the four colours along each string.
   */
  private addFestoons(roadHalf: number): void {
    const left = -roadHalf - TRAMWAY - 0.4;
    const right = roadHalf + 0.6;
    const high = 7.2;
    const sag = 1.6;
    const strings: BufferGeometry[][] = BULBS.map(() => []);
    const mid = (left + right) / 2;
    const half = (right - left) / 2;
    let k = 0;
    for (let x = left + 0.3; x < right; x += 0.42, k++) {
      const u = (x - mid) / half;
      const bulb = new SphereGeometry(0.085, 6, 4);
      bulb.translate(x, high - sag * (1 - u * u), 0);
      strings[k % BULBS.length]!.push(bulb);
    }
    const merged = strings.map((parts) => {
      const geometry = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      this.disposables.push(geometry);
      return geometry;
    });
    const lamp = this.lampPost();
    for (let offset = 0; offset < LOOP; offset += FESTOON) {
      const festoon = new Group();
      merged.forEach((geometry, c) => festoon.add(new Mesh(geometry, this.bulbs[c]!)));
      for (const x of [left, right]) {
        const post = lamp.clone();
        post.position.x = x;
        festoon.add(post);
      }
      this.group.add(festoon);
      this.props.push({ mesh: festoon, offset, x: 0, y: 0 });
    }
  }

  /** A promenade lamp: a green column, a crown of lit motifs, and its lantern. */
  private lampPost(): Group {
    const iron = this.material({ color: 0x1f4a3a, metalness: 0.5, roughness: 0.45 });
    const lantern = new MeshBasicMaterial({ color: 0xfff1c9 });
    const column = new CylinderGeometry(0.09, 0.16, 7.6, 10);
    column.translate(0, 3.8, 0);
    const globe = new SphereGeometry(0.28, 12, 8);
    globe.translate(0, 7.9, 0);
    const crown = new TorusGeometry(0.34, 0.05, 6, 24);
    crown.translate(0, 6.6, 0);
    this.disposables.push(lantern, column, globe, crown);
    const post = new Group();
    const shaft = new Mesh(column, iron);
    shaft.castShadow = true;
    const ring = new Mesh(crown, this.bulbs[1]!);
    ring.rotation.x = 0;
    post.add(shaft, new Mesh(globe, lantern), ring);
    return post;
  }

  /** Lit arches over the road and the tramway, every ARCH metres, each in one chasing colour. */
  private addArches(roadHalf: number): void {
    const left = -roadHalf - TRAMWAY - 0.4;
    const right = roadHalf + 0.6;
    const radius = (right - left) / 2;
    const tube = new TorusGeometry(radius, 0.16, 8, 48, Math.PI);
    const inner = new TorusGeometry(radius - 0.7, 0.1, 6, 48, Math.PI);
    this.disposables.push(tube, inner);
    for (let offset = 40, k = 0; offset < LOOP; offset += ARCH, k++) {
      const arch = new Group();
      const outer = new Mesh(tube, this.bulbs[k % BULBS.length]!);
      const ring = new Mesh(inner, this.bulbs[(k + 2) % BULBS.length]!);
      outer.scale.set(1, 0.9, 1);
      ring.scale.set(1, 0.9, 1);
      arch.add(outer, ring);
      arch.position.x = (left + right) / 2;
      this.group.add(arch);
      this.props.push({ mesh: arch, offset, x: (left + right) / 2, y: 0.4 });
    }
  }

  /** The illuminated tableaux along the sea wall, facing the road: seaside scenes in light. */
  private addTableaux(roadHalf: number): void {
    const scenes = ['star', 'sun', 'boat', 'heart', 'donkey', 'rocket'].map((motif) => {
      const material = new MeshBasicMaterial({
        map: this.track(tableauTexture(motif)),
        alphaTest: 0.3,
        side: DoubleSide,
      });
      this.disposables.push(material);
      return material;
    });
    const board = new PlaneGeometry(5.5, 4.2);
    board.translate(0, 2.1 + 1.6, 0);
    const leg = new CylinderGeometry(0.06, 0.06, 1.8, 6);
    leg.translate(0, 0.9, 0);
    this.disposables.push(board, leg);
    const steel = this.material({ color: 0x3a3a44, metalness: 0.6, roughness: 0.4 });
    for (let offset = 20, k = 0; offset < LOOP; offset += 36, k++) {
      const tableau = new Group();
      const face = new Mesh(board, scenes[k % scenes.length]!);
      face.rotation.y = -Math.PI / 2.4;
      tableau.add(face);
      for (const z of [-1.8, 1.8]) {
        const l = new Mesh(leg, steel);
        l.position.z = z;
        tableau.add(l);
      }
      this.group.add(tableau);
      this.props.push({ mesh: tableau, offset, x: roadHalf + SEA_WALL - 1.3, y: KERB });
    }
  }

  /** The tramway's stops: a glass shelter on the pavement with its lit sign. */
  private addTramStops(roadHalf: number): void {
    const glass = this.material({
      color: 0xbfd8e6,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
    });
    const frame = this.material({ color: 0x5b2a86, roughness: 0.5, metalness: 0.4 });
    const sign = new MeshBasicMaterial({ map: this.track(stopSignTexture()) });
    this.disposables.push(sign);
    for (let offset = 60; offset < LOOP; offset += 120) {
      const stop = new Group();
      const back = new Mesh(this.unit, glass);
      back.scale.set(0.05, 2.3, 6);
      back.position.set(-1.2, 1.15, 0);
      const roof = new Mesh(this.unit, frame);
      roof.scale.set(1.8, 0.12, 6.4);
      roof.position.set(-0.5, 2.4, 0);
      const plate = new Mesh(this.unit, sign);
      plate.scale.set(0.08, 0.5, 2.2);
      plate.position.set(0.4, 2.8, 0);
      stop.add(back, roof, plate);
      for (const z of [-3, 3]) {
        const post = new Mesh(this.unit, frame);
        post.scale.set(0.1, 2.4, 0.1);
        post.position.set(0.3, 1.2, z);
        stop.add(post);
      }
      this.group.add(stop);
      this.props.push({ mesh: stop, offset, x: -roadHalf - TRAMWAY - 1.6, y: KERB });
    }
  }

  /** Double-deck balloon trams, cream and green with their decks lit, one on each track. */
  private addTrams(roadHalf: number): void {
    const side = this.track(tramSideTexture());
    const sides = new MeshStandardMaterial({
      map: side,
      emissiveMap: this.track(tramSideTexture(true)),
      emissive: 0xffffff,
      emissiveIntensity: 1,
      roughness: 0.4,
    });
    const ends = this.material({ color: 0xf1e7c8, roughness: 0.4 });
    const roof = this.material({ color: 0x9aa0a6, roughness: 0.5 });
    const lamp = new MeshBasicMaterial({ color: 0xfff6d8 });
    this.disposables.push(sides, lamp);
    const faces: Material[] = [sides, sides, roof, roof, ends, ends];
    for (let k = 0; k < 4; k++) {
      const tram = new Group();
      const body = new Mesh(this.unit, faces);
      body.scale.set(2.6, 4.2, 14);
      body.position.y = 2.55;
      body.castShadow = true;
      const pole = new Mesh(this.unit, roof);
      pole.scale.set(0.08, 1.4, 0.08);
      pole.position.set(0, 5.3, 2);
      pole.rotation.x = -0.6;
      tram.add(body, pole);
      for (const x of [-0.8, 0.8]) {
        const light = new Mesh(this.unit, lamp);
        light.scale.set(0.3, 0.2, 0.05);
        light.position.set(x, 1.0, -7.03);
        tram.add(light);
      }
      const outbound = k % 2 === 0;
      if (!outbound) tram.rotation.y = Math.PI;
      this.group.add(tram);
      this.trams.push({
        mesh: tram,
        offset: k * (LOOP / 4) + 15,
        x: -roadHalf - TRACKS[outbound ? 0 : 1],
        speed: outbound ? 4.5 : -4.5,
      });
    }
  }

  /** Holidaymakers strolling both pavements, both ways. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(41);
    for (let offset = 0; offset < LOOP; offset += 2.5 + random() * 4) {
      const seaSide = random() < 0.6;
      const x = seaSide
        ? roadHalf + 1 + random() * (SEA_WALL - 2.5)
        : -roadHalf - TRAMWAY - 0.8 - random() * (FRONTAGE - 1.8);
      this.walkers.push({
        offset,
        x,
        speed: (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.6),
        scale: 0.88 + random() * 0.18,
        phase: random() * 6.3,
      });
    }
    this.figures = new Figures(this.group, this.disposables, this.walkers.length, HOLIDAY_WEAR, 43);
  }

  /**
   * The North Pier, once a lap: its deck on iron legs running out to sea, strung with bulbs, an
   * entrance kiosk with its sign, and the pavilion lit at the far end.
   */
  private addPier(roadHalf: number): void {
    const pier = new Group();
    const start = roadHalf + SEA_WALL;
    const length = 260;
    const deck = this.material({ map: this.repeat(deckTexture(), 4, 4), roughness: 0.8 });
    const iron = this.material({ color: 0x3b3f45, metalness: 0.5, roughness: 0.6 });
    const white = this.material({
      color: 0xf2efe6,
      emissive: 0xffe9b8,
      emissiveIntensity: 0.25,
      roughness: 0.5,
    });
    const boards = new Mesh(this.unit, deck);
    boards.scale.set(length, 0.4, 10);
    boards.position.set(start + length / 2, KERB - 0.2, 0);
    pier.add(boards);
    for (let x = start + 6; x < start + length; x += 9) {
      for (const z of [-4.2, 4.2]) {
        const leg = new Mesh(this.unit, iron);
        leg.scale.set(0.35, BEACH + 2, 0.35);
        leg.position.set(x, KERB - (BEACH + 2) / 2, z);
        pier.add(leg);
      }
    }
    // Bulbs strung along both rails.
    const parts: BufferGeometry[] = [];
    for (let x = start; x < start + length; x += 1.2) {
      for (const z of [-5, 5]) {
        const bulb = new SphereGeometry(0.1, 6, 4);
        bulb.translate(x, KERB + 1.4 + 0.35 * Math.abs(Math.sin((x - start) / 4)), z);
        parts.push(bulb);
      }
    }
    const string = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.disposables.push(string);
    pier.add(new Mesh(string, this.bulbs[1]!));
    // The entrance kiosks and the sign over the way on.
    const sign = new MeshBasicMaterial({ map: this.track(pierSignTexture()), side: DoubleSide });
    this.disposables.push(sign);
    for (const z of [-3.6, 3.6]) {
      const kiosk = new Mesh(this.unit, white);
      kiosk.scale.set(3, 3.2, 2.4);
      kiosk.position.set(start + 3, KERB + 1.6, z);
      pier.add(kiosk);
    }
    const board = new Mesh(new PlaneGeometry(8, 1.4), sign);
    this.disposables.push(board.geometry);
    board.rotation.y = -Math.PI / 2;
    board.position.set(start + 1.4, KERB + 4.4, 0);
    pier.add(board);
    // The pavilion at the far end: a hall under three lit domes.
    const hall = new Mesh(this.unit, white);
    hall.scale.set(24, 7, 16);
    hall.position.set(start + length - 12, KERB + 3.5, 0);
    pier.add(hall);
    const dome = new SphereGeometry(3.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(dome);
    for (const z of [-5, 0, 5]) {
      const d = new Mesh(dome, this.bulbs[(z + 5) % 4]!);
      d.position.set(start + length - 12, KERB + 7, z);
      pier.add(d);
    }
    this.group.add(pier);
    this.props.push({ mesh: pier, offset: PIER_AT, x: 0, y: 0 });
  }

  /**
   * Blackpool Tower: a red lattice tapering from its four feet, rings of light up it, the
   * crow's nest, the spire and the flag; the brick Tower Buildings at its foot.
   */
  private addTower(): void {
    const lattice = this.track(latticeTexture());
    lattice.wrapS = RepeatWrapping;
    lattice.wrapT = RepeatWrapping;
    lattice.repeat.set(4, 14);
    const red = new MeshStandardMaterial({
      map: lattice,
      alphaTest: 0.4,
      side: DoubleSide,
      color: 0xd13a2a,
      emissive: 0x6a1408,
      emissiveIntensity: 0.6,
      roughness: 0.6,
    });
    const brick = this.material({
      map: this.track(buildingsTexture()),
      emissiveMap: this.track(buildingsTexture(true)),
      emissive: 0xffffff,
      emissiveIntensity: 1,
    });
    this.disposables.push(red);
    const frustum = new CylinderGeometry(4.2, 17, 118, 4, 1, true);
    frustum.rotateY(Math.PI / 4);
    frustum.translate(0, 59 + 18, 0);
    const shaft = new CylinderGeometry(3.6, 4.2, 22, 4, 1, true);
    shaft.rotateY(Math.PI / 4);
    shaft.translate(0, 118 + 18 + 11, 0);
    const nest = new CylinderGeometry(5.2, 4.6, 5, 8);
    nest.translate(0, 118 + 18 + 22 + 2.5, 0);
    const spire = new ConeGeometry(1.8, 12, 8);
    spire.translate(0, 118 + 18 + 22 + 5 + 6, 0);
    const pole = new CylinderGeometry(0.15, 0.15, 6, 6);
    pole.translate(0, 118 + 18 + 22 + 5 + 12 + 3, 0);
    this.disposables.push(frustum, shaft, nest, spire, pole);
    this.tower.add(new Mesh(frustum, red), new Mesh(shaft, red));
    this.tower.add(new Mesh(nest, this.bulbs[1]!), new Mesh(spire, red));
    this.tower.add(new Mesh(pole, this.bulbs[1]!));
    // Rings of light up the lattice.
    for (let h = 30; h < 136; h += 14) {
      const t = (h - 18) / 118;
      const half = 17 + (4.2 - 17) * t;
      const ring = new TorusGeometry(half * Math.SQRT1_2 * 1.02, 0.25, 4, 4);
      ring.rotateX(Math.PI / 2);
      ring.rotateY(Math.PI / 4);
      ring.translate(0, h, 0);
      this.disposables.push(ring);
      this.tower.add(new Mesh(ring, this.bulbs[((h / 14) % 4) | 0]!));
    }
    const buildings = new Mesh(this.unit, brick);
    buildings.scale.set(70, 20, 50);
    buildings.position.y = 10;
    this.tower.add(buildings);
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

/** The tramway: grey setts with two tracks of steel rails, symmetric across. */
function tramwayTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#4a4a50', 103);
    const px = (m: number) => (m / TRAMWAY) * 256;
    for (const centre of TRACKS) {
      for (const rail of [-0.72, 0.72]) {
        g.fillStyle = '#2a2a2e';
        g.fillRect(px(centre + rail) - 3, 0, 6, 256);
        g.fillStyle = '#c9ccd2';
        g.fillRect(px(centre + rail) - 1, 0, 2, 256);
      }
    }
  });
}

/** The promenade's paving flags, wet with sea air. */
function flagsTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#8a8580', 107);
    g.strokeStyle = 'rgba(40,38,36,0.5)';
    g.lineWidth = 2;
    for (let i = 0; i <= 256; i += 85) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 256);
      g.moveTo(0, i);
      g.lineTo(256, i);
      g.stroke();
    }
  });
}

/** The sea wall's railings: green posts, two rails and a ring between each pair, cut out. */
function railingTexture(): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    g.clearRect(0, 0, 128, 256);
    g.fillStyle = '#2f7a55';
    // Across runs from the top rail (u 0) down to the foot (u 1); along runs with the wall.
    g.fillRect(0, 0, 12, 256);
    g.fillRect(58, 0, 8, 256);
    for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 128, 7);
    g.strokeStyle = '#2f7a55';
    g.lineWidth = 5;
    for (let y = 32; y < 256; y += 64) {
      g.beginPath();
      g.arc(34, y, 16, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

/** Damp sand at dusk. */
function sandTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => speckle(g, 256, 256, '#8f7b62', 109));
}

/** The Irish Sea at dusk, the lights in streaks across it. */
function seaTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#1c2a4a';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(113);
    for (let i = 0; i < 1600; i++) {
      const warm = random() < 0.25;
      g.fillStyle = warm
        ? `rgba(255,190,110,${0.08 + random() * 0.2})`
        : `rgba(170,190,255,${0.05 + random() * 0.15})`;
      g.fillRect(random() * 512, random() * 512, 1.5, 8 + random() * 22);
    }
  });
}

/**
 * The frontages, 13 m tall over 24 m of promenade: guest houses and hotels over shopfronts,
 * arcades and chip shops with neon signs. `lit` draws only what glows, for the emissive map.
 * The picture is drawn upright and turned onto the ribbon, whose across runs up the wall.
 */
function frontageTexture(lit: boolean): CanvasTexture {
  const shops = [
    ['GUEST HOUSE', '#ff3b8a', '#d9c7a8'],
    ['AMUSEMENTS', '#3bc9ff', '#c9b5d9'],
    ['FISH & CHIPS', '#ffd23f', '#e8dccb'],
    ['ROCK SHOP', '#ff5ab4', '#b9d4c8'],
    ['HOTEL', '#ff7a2f', '#d4bfa0'],
    ['BINGO', '#7dff6a', '#c8b8a8'],
  ] as const;
  return canvasTexture(512, 1024, (g) => {
    g.fillStyle = lit ? '#000000' : '#3a3440';
    g.fillRect(0, 0, 512, 1024);
    // Picture space: x along the promenade (1024 px), y down the wall (512 px).
    // Seen from the road the ribbon runs mirrored along, so the picture is flipped to read.
    g.setTransform(0, -1, -1, 0, 512, 1024);
    const random = seeded(127);
    const width = 1024 / 3;
    for (let b = 0; b < 3; b++) {
      const [word, neon, stucco] = shops[b * 2 + (random() < 0.5 ? 0 : 1)]!;
      const left = b * width;
      if (!lit) {
        g.fillStyle = stucco;
        g.fillRect(left + 3, 40 + b * 18, width - 6, 512);
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.fillRect(left + 3, 40 + b * 18, width - 6, 10);
      }
      // Bays of sash windows, most lit warm, some dark.
      for (let y = 80 + b * 18; y < 340; y += 70) {
        for (let x = left + 22; x < left + width - 40; x += 52) {
          const on = random() < 0.7;
          g.fillStyle = lit
            ? on
              ? `hsl(${32 + random() * 18},90%,${55 + random() * 15}%)`
              : '#000000'
            : on
              ? '#ffd9a0'
              : '#1d2230';
          g.fillRect(x, y, 30, 46);
          if (!lit) {
            g.fillStyle = 'rgba(255,255,255,0.7)';
            g.fillRect(x - 2, y + 22, 34, 3);
          }
        }
      }
      // The shopfront: lit glass and the neon sign over it.
      g.fillStyle = lit ? '#ffcf8a' : '#fff0d0';
      g.fillRect(left + 14, 410, width - 28, 96);
      g.fillStyle = lit ? neon : '#1b1820';
      g.fillRect(left + 10, 360, width - 20, 42);
      g.fillStyle = lit ? '#ffffff' : neon;
      g.font = 'bold 32px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(word, left + width / 2, 382);
      // Bulbs outlining the gable.
      if (lit) {
        g.fillStyle = '#ffe7a0';
        for (let x = left + 8; x < left + width - 8; x += 14) g.fillRect(x, 34 + b * 18, 5, 5);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  });
}

/** An illuminated tableau: a seaside motif drawn in neon tube and bulbs, the rest cut out. */
function tableauTexture(motif: string): CanvasTexture {
  return canvasTexture(512, 400, (g) => {
    g.clearRect(0, 0, 512, 400);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const tube = (colour: string, width: number, path: () => void) => {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.beginPath();
      path();
      g.stroke();
    };
    const frame = () => g.rect(14, 14, 484, 372);
    tube('#ffd23f', 10, frame);
    switch (motif) {
      case 'star':
        tube('#ffd23f', 16, () => {
          for (let i = 0; i <= 10; i++) {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 ? 70 : 160;
            g.lineTo(256 + Math.cos(a) * r, 205 + Math.sin(a) * r);
          }
        });
        break;
      case 'sun':
        tube('#ff7a2f', 18, () => g.arc(256, 200, 90, 0, Math.PI * 2));
        tube('#ffd23f', 10, () => {
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            g.moveTo(256 + Math.cos(a) * 115, 200 + Math.sin(a) * 115);
            g.lineTo(256 + Math.cos(a) * 165, 200 + Math.sin(a) * 165);
          }
        });
        tube('#ff3b5c', 8, () => g.arc(256, 210, 45, 0.2, Math.PI - 0.2));
        break;
      case 'boat':
        tube('#3bc9ff', 14, () => {
          g.moveTo(110, 260);
          g.lineTo(400, 260);
          g.lineTo(350, 320);
          g.lineTo(160, 320);
          g.closePath();
        });
        tube('#ffffff', 12, () => {
          g.moveTo(255, 250);
          g.lineTo(255, 70);
          g.lineTo(380, 240);
          g.closePath();
        });
        tube('#3bc9ff', 8, () => {
          for (let x = 40; x < 480; x += 60) g.arc(x + 30, 350, 30, Math.PI, 0);
        });
        break;
      case 'heart':
        tube('#ff3b8a', 18, () => {
          g.moveTo(256, 330);
          g.bezierCurveTo(60, 200, 130, 40, 256, 130);
          g.bezierCurveTo(382, 40, 452, 200, 256, 330);
        });
        break;
      case 'donkey':
        tube('#c9ccd2', 14, () => {
          g.ellipse(250, 220, 120, 60, 0, 0, Math.PI * 2);
          g.moveTo(350, 190);
          g.lineTo(410, 110);
          g.lineTo(450, 130);
          g.lineTo(380, 210);
          for (const x of [170, 210, 290, 330]) {
            g.moveTo(x, 270);
            g.lineTo(x, 340);
          }
        });
        tube('#ff3b5c', 10, () => g.rect(200, 150, 100, 30));
        break;
      default:
        tube('#7dff6a', 14, () => {
          g.moveTo(256, 50);
          g.lineTo(320, 170);
          g.lineTo(320, 300);
          g.lineTo(192, 300);
          g.lineTo(192, 170);
          g.closePath();
        });
        tube('#ff7a2f', 12, () => {
          g.moveTo(215, 310);
          g.lineTo(256, 370);
          g.lineTo(297, 310);
        });
    }
    // Bulbs dotted round the frame.
    g.fillStyle = '#fff6d8';
    for (let x = 14; x <= 498; x += 22) {
      g.fillRect(x - 4, 10, 8, 8);
      g.fillRect(x - 4, 382, 8, 8);
    }
  });
}

/** The tram stop's sign. */
function stopSignTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = '#5b2a86';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#ffffff';
    g.font = 'bold 34px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('TRAM STOP', 128, 34);
  });
}

/** A balloon tram's side: cream over green, two decks of windows. `lit` draws the glow. */
function tramSideTexture(lit = false): CanvasTexture {
  return canvasTexture(512, 160, (g) => {
    g.fillStyle = lit ? '#000000' : '#f1e7c8';
    g.fillRect(0, 0, 512, 160);
    if (!lit) {
      g.fillStyle = '#1f6b47';
      g.fillRect(0, 128, 512, 32);
      g.fillRect(0, 70, 512, 8);
    }
    g.fillStyle = lit ? '#ffd9a0' : '#2b2a33';
    for (let x = 18; x < 500; x += 44) {
      g.fillRect(x, 16, 34, 44);
      g.fillRect(x, 84, 34, 38);
    }
  });
}

/** The pier's deck boards. */
function deckTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6b5440', 131);
    g.fillStyle = 'rgba(30,20,12,0.5)';
    for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 2, 128);
  });
}

/** The sign over the way onto the pier. */
function pierSignTexture(): CanvasTexture {
  return canvasTexture(512, 90, (g) => {
    g.fillStyle = '#1d1f5a';
    g.fillRect(0, 0, 512, 90);
    g.fillStyle = '#ffd23f';
    g.font = 'bold 60px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('NORTH PIER', 256, 48);
  });
}

/** The Tower's red lattice: posts, rails and X-bracing, cut out. */
function latticeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 8;
    g.strokeRect(4, 4, 120, 120);
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(4, 4);
    g.lineTo(124, 124);
    g.moveTo(124, 4);
    g.lineTo(4, 124);
    g.stroke();
  });
}

/** The Tower Buildings: red brick with rows of lit windows. `lit` draws the glow. */
function buildingsTexture(lit = false): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    g.fillStyle = lit ? '#000000' : '#8a3a2a';
    g.fillRect(0, 0, 256, 128);
    const random = seeded(137);
    for (let y = 12; y < 120; y += 26) {
      for (let x = 8; x < 250; x += 16) {
        g.fillStyle = random() < 0.75 ? '#ffcf8a' : lit ? '#000000' : '#2b2026';
        g.fillRect(x, y, 9, 16);
      }
    }
  });
}
