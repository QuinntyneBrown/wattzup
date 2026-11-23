// Chicago Loop Crit's course, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): a
// downtown criterium on Wabash Avenue beneath the L. The riders race between crowd barriers hung
// with the crit's boards; the elevated railway's riveted green steel runs overhead on its columns,
// its trains rumbling past both ways, and towers of terracotta, limestone and glass wall the
// street in on both sides. Fans lean on the barriers, and once a lap the prime sprint's banner
// hangs from the L above the line. Built on the shared kit (world-kit.ts) on the pattern of Old
// Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
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

/** The course repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.15;
const SIDEWALK = 4;
/** The L's deck: its underside's height, and how far past the kerbs it spans. */
const DECK = 7.5;
const SPAN = 2.2;
/** The L's columns stand every COLUMN metres; the prime banner hangs at PRIME. */
const COLUMN = 15;
const PRIME = 200;
/** One L car's length; a train is four. */
const CAR = 14.6;

const BOARDS = ['LOOP CRIT', 'WABASH', 'PRIME LAP', 'WINDY CITY', 'CHI-TOWN', 'GO FAST'];

const FAN_WEAR = {
  tops: ['#41b6e6', '#c8102e', '#ffffff', '#1d1f24', '#0e3386', '#ffd23f', '#3a6b4a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#8a8f99'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Fan {
  readonly offset: number;
  readonly x: number;
  readonly heading: number;
  readonly phase: number;
}

export class ChicagoStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly trains: { mesh: Group; offset: number; speed: number }[] = [];
  private readonly fans: Fan[] = [];
  private crowd: Figures | null = null;
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
    this.addPavements(roadHalf, points);
    this.addTowers(roadHalf);
    this.addElevated(roadHalf, points);
    this.addTrains(roadHalf);
    this.addBarriers(roadHalf);
    this.addPrime(roadHalf);
    this.addFans(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    for (const train of this.trains) {
      const metres = loopMetres(train.offset + train.speed * this.time, s, LOOP, BEHIND + 60);
      train.mesh.position.z = -metres;
      train.mesh.position.y = heightAt(metres) + DECK + 0.9;
    }
    const crowd = this.crowd;
    if (crowd) {
      this.fans.forEach((f, i) => {
        const metres = loopMetres(f.offset, s, LOOP, BEHIND);
        const cheer = Math.max(0, Math.sin(this.time * 5 + f.phase)) * 0.1;
        crowd.set(i, f.x, heightAt(metres) + KERB + cheer, -metres, f.heading, 0.95, 0);
      });
      crowd.commit();
    }
  }

  /** The kerbs and the pavements both sides, in grey concrete slabs. */
  private addPavements(roadHalf: number, points: number): void {
    const r = roadHalf;
    const concrete = this.material({ map: this.repeat(slabTexture(), 1.5, 1.5), roughness: 0.9 });
    this.ribbons.add(points, concrete, [
      [-r, 0.004],
      [-r - 0.05, KERB],
      [-r - SIDEWALK, KERB],
    ]);
    this.ribbons.add(points, concrete, [
      [r + SIDEWALK, KERB],
      [r + 0.05, KERB],
      [r, 0.004],
    ]);
  }

  /** Towers walling the street: terracotta, limestone and glass, set side by side. */
  private addTowers(roadHalf: number): void {
    const random = seeded(801);
    const kinds = [
      { map: towerTexture('#b8754e', '#2a3038', 803), roughness: 0.8 },
      { map: towerTexture('#d9cfbd', '#2e3640', 809), roughness: 0.8 },
      { map: towerTexture('#5a6a78', '#9ab8d0', 811), roughness: 0.25, metalness: 0.5 },
      { map: towerTexture('#8a5a40', '#262a30', 821), roughness: 0.85 },
      { map: towerTexture('#e8e4dc', '#3a4450', 823), roughness: 0.7 },
    ].map(({ map, ...rest }) => {
      this.track(map);
      map.wrapS = RepeatWrapping;
      map.wrapT = RepeatWrapping;
      return { map, rest };
    });
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP;) {
        const width = 22 + random() * 24;
        const height = 40 + random() * 120;
        const kind = kinds[Math.floor(random() * kinds.length)]!;
        const map = kind.map.clone();
        map.repeat.set(width / 12, height / 12);
        map.needsUpdate = true;
        this.track(map);
        const facade = this.material({ map, ...kind.rest });
        const tower = new Group();
        const body = new Mesh(this.unit, facade);
        body.scale.set(30, height, width - 0.6);
        body.position.set(side * 15, height / 2, -width / 2);
        body.castShadow = true;
        // A storefront band at the foot, and an awning over it.
        const shop = new Mesh(this.unit, this.shopMaterial(random));
        shop.scale.set(0.3, 4.2, width - 2);
        shop.position.set(-side * 0.1, 2.2, -width / 2);
        tower.add(body, shop);
        this.group.add(tower);
        this.props.push({ mesh: tower, offset, x: side * (roadHalf + SIDEWALK) });
        offset += width;
      }
    }
  }

  private shops: MeshStandardMaterial[] = [];
  private shopMaterial(random: () => number): MeshStandardMaterial {
    if (!this.shops.length) {
      this.shops = ['#1d1f24', '#6a1a1a', '#1b3a5c', '#2f4a3a'].map((c, k) =>
        this.material({ map: this.track(shopTexture(c, 829 + k)), roughness: 0.5 }),
      );
    }
    return this.shops[Math.floor(random() * this.shops.length)]!;
  }

  /**
   * The L overhead: its deck's underside of riveted girders and cross-ties, its sides, and the
   * green steel columns at the kerbs with their bracing.
   */
  private addElevated(roadHalf: number, points: number): void {
    const x = roadHalf + SPAN;
    const steel = this.material({
      map: this.repeat(girderTexture(), x * 2, 6),
      roughness: 0.6,
      metalness: 0.4,
    });
    const side = this.material({
      map: this.repeat(rivetTexture(), 2, 6),
      roughness: 0.6,
      metalness: 0.4,
    });
    // The underside faces down: its profile runs from smaller x to greater.
    this.ribbons.add(points, steel, [
      [-x, DECK],
      [x, DECK],
    ]);
    this.ribbons.add(points, side, [
      [x, DECK + 1.3],
      [x, DECK],
    ]);
    this.ribbons.add(points, side, [
      [-x, DECK],
      [-x, DECK + 1.3],
    ]);
    const green = this.material({ color: 0x2f4a3a, roughness: 0.55, metalness: 0.4 });
    const column = new BoxGeometry(0.5, DECK, 0.5);
    column.translate(0, DECK / 2, 0);
    const brace = new BoxGeometry(0.15, 2.4, 0.15);
    brace.rotateX(0.7);
    brace.translate(0, DECK - 1.1, 0.7);
    const knee = brace.clone();
    knee.rotateY(Math.PI);
    const cap = new BoxGeometry(0.8, 0.4, 0.8);
    cap.translate(0, DECK - 0.2, 0);
    const pair = mergeGeometries([column, brace, knee, cap].map((g) => g.toNonIndexed()))!;
    [column, brace, knee, cap].forEach((g) => g.dispose());
    this.disposables.push(pair);
    for (let offset = 0; offset < LOOP; offset += COLUMN) {
      for (const s of [-1, 1]) {
        const holder = new Group();
        const mesh = new Mesh(pair, green);
        mesh.castShadow = true;
        holder.add(mesh);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: s * (roadHalf + 0.9) });
      }
    }
  }

  /** L trains of four steel cars on the deck, running both ways. */
  private addTrains(roadHalf: number): void {
    const body = this.material({ map: this.track(carTexture()), roughness: 0.4, metalness: 0.6 });
    const roof = this.material({ color: 0x9aa0a8, roughness: 0.5, metalness: 0.5 });
    for (const [x, offset, speed] of [
      [-1.9, 40, 13],
      [1.9, 220, -15],
    ] as const) {
      const train = new Group();
      for (let k = 0; k < 4; k++) {
        const car = new Mesh(this.unit, body);
        car.scale.set(2.8, 3.2, CAR - 0.5);
        car.position.set(0, 1.6, -k * CAR);
        const top = new Mesh(this.unit, roof);
        top.scale.set(2.6, 0.25, CAR - 0.8);
        top.position.set(0, 3.3, -k * CAR);
        train.add(car, top);
      }
      train.position.x = x * (roadHalf / 3.5);
      this.group.add(train);
      this.trains.push({ mesh: train, offset, speed });
    }
  }

  /** Crowd barriers along both kerbs, hung with the crit's boards facing the riders. */
  private addBarriers(roadHalf: number): void {
    const metal = this.material({ color: 0xb8bcc2, roughness: 0.5, metalness: 0.6 });
    const run = 30;
    const parts: BufferGeometry[] = [];
    for (let z = 0; z < run; z += 2.5) {
      const top = new BoxGeometry(0.05, 0.05, 2.4);
      top.translate(0, 1.05, -z - 1.25);
      const foot = new BoxGeometry(0.6, 0.05, 0.08);
      foot.translate(0, 0.03, -z);
      const post = new BoxGeometry(0.05, 1.05, 0.05);
      post.translate(0, 0.53, -z);
      parts.push(top, foot, post);
    }
    const frame = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
    parts.forEach((p) => p.dispose());
    const board = new PlaneGeometry(run, 0.85);
    this.disposables.push(frame, board);
    BOARDS.forEach((_, k) => {
      const material = this.material({ map: this.track(boardTexture(k)), roughness: 0.6 });
      for (const side of [-1, 1] as const) {
        for (let offset = k * run; offset < LOOP; offset += BOARDS.length * run) {
          const barrier = new Group();
          barrier.add(new Mesh(frame, metal));
          const face = new Mesh(board, material);
          // Facing the road: the board's front turns towards the riders.
          face.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          face.position.set(-side * 0.03, 0.55, -run / 2);
          barrier.add(face);
          this.group.add(barrier);
          this.props.push({ mesh: barrier, offset, x: side * (roadHalf + 0.3) });
        }
      }
    });
  }

  /** The prime sprint's banner hung from the L across the course, once a lap. */
  private addPrime(roadHalf: number): void {
    const banner = this.material({ map: this.track(primeTexture()), roughness: 0.7, side: 2 });
    const plane = new PlaneGeometry(roadHalf * 2 + 2, 1.6);
    const line = new PlaneGeometry(roadHalf * 2, 0.5);
    line.rotateX(-Math.PI / 2);
    this.disposables.push(plane, line);
    const prime = new Group();
    const b = new Mesh(plane, banner);
    b.position.y = DECK - 1;
    const paint = this.material({ map: this.track(checkTexture()), roughness: 0.8 });
    const l = new Mesh(line, paint);
    l.position.y = 0.01;
    prime.add(b, l);
    this.group.add(prime);
    this.props.push({ mesh: prime, offset: PRIME, x: 0 });
  }

  /** Fans leaning on the barriers both sides, turned towards the race, cheering it by. */
  private addFans(roadHalf: number): void {
    const random = seeded(839);
    for (let offset = 0; offset < LOOP; offset += 1.2 + random() * 3) {
      const side = random() < 0.5 ? -1 : 1;
      this.fans.push({
        offset,
        x: side * (roadHalf + 0.8 + random() * 1.4),
        heading: (side < 0 ? -1 : 1) * (Math.PI / 2) + (random() - 0.5) * 0.8,
        phase: random() * 6.3,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.fans.length, FAN_WEAR, 853);
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

/** Grey concrete pavement slabs. */
function slabTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a8a6a0', 857);
    g.fillStyle = 'rgba(40,40,40,0.35)';
    g.fillRect(0, 0, 128, 2);
    g.fillRect(0, 0, 2, 128);
  });
}

/** Twelve metres of a tower's front: its piers in `face`, its windows in `glass`, three floors high. */
function towerTexture(face: string, glass: string, seed: number): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, face, seed);
    const random = seeded(seed + 1);
    for (let y = 8; y < 256; y += 85) {
      for (let x = 10; x < 256; x += 62) {
        g.fillStyle = glass;
        g.fillRect(x, y, 46, 64);
        g.fillStyle = `rgba(255,255,255,${0.05 + random() * 0.15})`;
        g.fillRect(x, y, 46, 16);
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.fillRect(x + 22, y, 2, 64);
      }
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(0, y + 70, 256, 4);
    }
  });
}

/** A storefront's glass, mullions and sign band. */
function shopTexture(colour: string, seed: number): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#3a4a58';
    g.fillRect(0, 16, 256, 48);
    const random = seeded(seed);
    for (let x = 0; x < 256; x += 32) {
      g.fillStyle = `rgba(255,230,180,${0.15 + random() * 0.3})`;
      g.fillRect(x + 3, 19, 26, 42);
    }
  });
}

/** The L's underside: girders along the track and cross-ties between them. */
function girderTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#2a3a30';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#1a221d';
    for (let y = 0; y < 256; y += 24) g.fillRect(0, y, 256, 10);
    g.fillStyle = '#3e5446';
    for (const x of [20, 70, 128, 186, 236]) g.fillRect(x - 6, 0, 12, 256);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let y = 4; y < 256; y += 8)
      for (const x of [20, 70, 128, 186, 236]) g.fillRect(x - 1, y, 2, 2);
  });
}

/** The L's riveted green side plates. */
function rivetTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#34503f', 859);
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.fillRect(0, 0, 128, 3);
    g.fillRect(0, 125, 128, 3);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let y = 8; y < 128; y += 12) {
      g.fillRect(10, y, 3, 3);
      g.fillRect(115, y, 3, 3);
    }
  });
}

/** An L car's stainless side: its windows and the coloured stripe below them. */
function carTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = '#c8ccd2';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#2a3440';
    for (let x = 8; x < 256; x += 30) g.fillRect(x, 12, 22, 22);
    g.fillStyle = '#62361b';
    g.fillRect(0, 40, 256, 6);
  });
}

/** A barrier board: the crit's word in white on a coloured ground, readable from the road. */
function boardTexture(k: number): CanvasTexture {
  const grounds = ['#c8102e', '#0e3386', '#41b6e6', '#1d1f24', '#c8102e', '#0e3386'];
  return canvasTexture(1024, 32, (g) => {
    g.fillStyle = grounds[k % grounds.length]!;
    g.fillRect(0, 0, 1024, 32);
    g.fillStyle = '#ffffff';
    g.font = 'bold 22px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let x = 85; x < 1024; x += 170) g.fillText(BOARDS[k]!, x, 17);
    g.fillStyle = '#ffffff';
    for (let x = 170; x < 1024; x += 170) {
      // A red star of Chicago's flag between the words.
      g.save();
      g.translate(x, 16);
      g.fillStyle = '#ff4057';
      g.beginPath();
      for (let p = 0; p < 12; p++) {
        const r = p % 2 ? 4 : 10;
        const a = (p / 12) * Math.PI * 2;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.fill();
      g.restore();
    }
  });
}

/** The prime banner: Chicago's blue stripes and red stars on white, and its words. */
function primeTexture(): CanvasTexture {
  return canvasTexture(512, 96, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 96);
    g.fillStyle = '#41b6e6';
    g.fillRect(0, 8, 512, 10);
    g.fillRect(0, 78, 512, 10);
    g.fillStyle = '#c8102e';
    g.font = 'bold 42px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('★ PRIME SPRINT ★', 256, 50);
  });
}

/** The chequered sprint line. */
function checkTexture(): CanvasTexture {
  return canvasTexture(128, 16, (g) => {
    for (let x = 0; x < 128; x += 8) {
      for (let y = 0; y < 16; y += 8) {
        g.fillStyle = (x + y) % 16 ? '#111114' : '#f5f5f0';
        g.fillRect(x, y, 8, 8);
      }
    }
  });
}
