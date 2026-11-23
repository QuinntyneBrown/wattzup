// Edinburgh Fringe's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// Royal Mile in August, packed for the festival. The riders climb the granite setts towards the
// Castle between tall dark tenements of rubble stone, their closes opening between shopfronts.
// Poster columns and boards are plastered with the Fringe's shows, bunting and Saltires cross
// overhead, street performers juggle inside rings of spectators, flyerers work the crowd, and
// once a lap St Giles' crown spire rises on the left. The Castle stands on its rock at the top of
// the Mile. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Float32BufferAttribute,
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

/** The Mile repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.12;
/** The pavements before the tenements, both sides. */
const PAVEMENT = 5;
/** St Giles stands at ST_GILES each lap; a performer's ring every RING metres. */
const ST_GILES = 210;
const RING = 60;

const WORDS = [
  'COMEDY',
  'LIVE!',
  '★★★★★',
  'FREE',
  'TONIGHT',
  'SOLD OUT',
  'HAMLET',
  'IMPROV',
  'MAGIC',
  'CABARET',
  'FRINGE',
  'NEW SHOW',
];

const CROWD_WEAR = {
  tops: [
    '#1d1f24',
    '#2f3e5c',
    '#c8102e',
    '#ffd23f',
    '#ffffff',
    '#3a6b4a',
    '#ff6b5a',
    '#005eb8',
    '#9b5cff',
  ],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#e8c9a0', '#3a3a3a'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Person {
  readonly offset: number;
  readonly x: number;
  readonly heading: number;
  readonly speed: number;
  readonly phase: number;
}

interface Juggler {
  readonly balls: Mesh[];
  readonly phase: number;
}

export class EdinburghStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: Person[] = [];
  private crowd: Figures | null = null;
  private readonly jugglers: Juggler[] = [];
  private readonly flags: Mesh[] = [];
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
    this.addSetts(roadHalf, points);
    this.addTenements(roadHalf);
    this.addPosters(roadHalf);
    this.addBunting(roadHalf);
    this.addStGiles(roadHalf);
    this.addPerformers(roadHalf);
    this.addCrowd(roadHalf);
    this.addCastle();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The jugglers' clubs climb and fall in a cascade over their hands.
    for (const juggler of this.jugglers) {
      juggler.balls.forEach((ball, k) => {
        const t = seconds * 2.4 + juggler.phase + (k * Math.PI * 2) / juggler.balls.length;
        ball.position.set(Math.cos(t) * 0.35, 1.9 + Math.abs(Math.sin(t)) * 1.1, 0);
      });
    }
    this.flags.forEach((flag, k) => (flag.rotation.y = Math.sin(seconds * 3 + k) * 0.25));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
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
        const step = p.speed
          ? Math.abs(Math.sin(this.time * 4 + p.phase)) * 0.04
          : Math.max(0, Math.sin(this.time * 2 + p.phase)) * 0.03;
        crowd.set(i, p.x, heightAt(metres) + KERB + step, -metres, p.heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The Mile's granite setts across the street and the flagstone pavements, both sides. */
  private addSetts(roadHalf: number, points: number): void {
    const r = roadHalf;
    const setts = this.material({ map: this.repeat(settsTexture(), 2.4, 2.4), roughness: 0.75 });
    const flags = this.material({ map: this.repeat(flagstoneTexture(), 2, 2), roughness: 0.85 });
    this.ribbons.add(points, setts, [
      [r, 0.006],
      [-r, 0.006],
    ]);
    this.ribbons.add(points, flags, [
      [-r, 0.006],
      [-r - 0.05, KERB],
      [-r - PAVEMENT, KERB],
    ]);
    this.ribbons.add(points, flags, [
      [r + PAVEMENT, KERB],
      [r + 0.05, KERB],
      [r, 0.006],
    ]);
  }

  /**
   * The tenements: six and seven storeys of dark rubble and ashlar, sash windows in rows, a
   * shopfront at the foot with its painted fascia, the odd close's dark arch, and chimney stacks
   * along the roofline.
   */
  private addTenements(roadHalf: number): void {
    const random = seeded(1301);
    const stones = ['#4a4440', '#5a524a', '#3e3a38', '#6a6058', '#54504c'];
    const fronts = stones.map((stone, k) => {
      const t = tenementTexture(stone, 1303 + k);
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      return this.track(t);
    });
    const shops = ['#1b3a5c', '#6a1a1a', '#1f3a2c', '#1d1f24', '#5a3a1a', '#3a2a5a'].map((c, k) =>
      this.material({ map: this.track(shopTexture(c, 1311 + k)), roughness: 0.6 }),
    );
    const chimney = this.material({ color: 0x3a3634, roughness: 0.9 });
    const roof = this.material({ color: 0x2e3238, roughness: 0.8 });
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP;) {
        if (side < 0 && Math.abs(offset - ST_GILES) < 30) {
          offset += 4;
          continue;
        }
        const width = 9 + random() * 10;
        const floors = 6 + Math.floor(random() * 2);
        const height = floors * 3.2 + 1;
        const map = fronts[Math.floor(random() * fronts.length)]!.clone();
        map.repeat.set(width / 6, floors / 4);
        map.needsUpdate = true;
        this.track(map);
        const facade = this.material({ map, roughness: 0.9 });
        const tenement = new Group();
        const body = new Mesh(this.unit, facade);
        body.scale.set(14, height, width - 0.2);
        body.position.set(side * 7, height / 2, -width / 2);
        body.castShadow = true;
        const shop = new Mesh(this.unit, shops[Math.floor(random() * shops.length)]!);
        shop.scale.set(0.3, 3.6, width - 1.5);
        shop.position.set(-side * 0.1, 1.9, -width / 2);
        const top = new Mesh(this.unit, roof);
        top.scale.set(14, 2.2, width - 0.2);
        top.position.set(side * 7, height + 1.1, -width / 2);
        tenement.add(body, shop, top);
        for (let k = 0; k < 2; k++) {
          const stack = new Mesh(this.unit, chimney);
          stack.scale.set(1.2, 2.2, 2.6);
          stack.position.set(side * (2 + k * 9), height + 2.6, -width * (0.2 + k * 0.6));
          tenement.add(stack);
        }
        this.group.add(tenement);
        this.props.push({ mesh: tenement, offset, x: side * (roadHalf + PAVEMENT) });
        offset += width;
      }
    }
  }

  /** Poster columns and A-boards plastered with the Fringe's shows, along both pavements. */
  private addPosters(roadHalf: number): void {
    const random = seeded(1321);
    const posters = [0, 1, 2].map((k) => {
      const t = this.track(posterTexture(1323 + k));
      t.wrapS = RepeatWrapping;
      return this.material({ map: t, roughness: 0.8 });
    });
    const cap = this.material({ color: 0x1f3a2c, metalness: 0.4, roughness: 0.5 });
    const column = new CylinderGeometry(0.55, 0.55, 2.8, 16, 1, true);
    column.translate(0, 1.5, 0);
    const dome = new SphereGeometry(0.62, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(0, 2.9, 0);
    const board = new BoxGeometry(0.06, 1.2, 0.8);
    this.disposables.push(column, dome, board);
    for (let offset = 8; offset < LOOP; offset += 16 + random() * 14) {
      const side = random() < 0.5 ? -1 : 1;
      const holder = new Group();
      if (random() < 0.55) {
        holder.add(new Mesh(column, posters[Math.floor(random() * 3)]!), new Mesh(dome, cap));
      } else {
        // An A-board, its two faces leaning together.
        for (const lean of [-1, 1]) {
          const face = new Mesh(board, posters[Math.floor(random() * 3)]!);
          face.position.set(lean * 0.2, 0.6, 0);
          face.rotation.z = lean * 0.3;
          face.rotation.y = Math.PI / 2;
          holder.add(face);
        }
        holder.rotation.y = Math.PI / 2;
      }
      holder.children.forEach((c) => (c.castShadow = true));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + 1) });
    }
  }

  /** Bunting and Saltires strung across the Mile between the tenements. */
  private addBunting(roadHalf: number): void {
    const span = roadHalf + PAVEMENT;
    const random = seeded(1327);
    const pennant = new ConeGeometry(0.22, 0.45, 3);
    pennant.rotateX(Math.PI);
    const colours = ['#c8102e', '#ffffff', '#005eb8', '#ffd23f'];
    const parts: BufferGeometry[] = [];
    const vertexColours: number[] = [];
    for (let k = 0; k <= 34; k++) {
      const u = k / 34;
      const p = pennant.clone().toNonIndexed();
      p.translate(-span + u * span * 2, 10.5 - 1.6 * Math.sin(Math.PI * u), 0);
      const hex = colours[k % 4]!;
      const c = [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      ];
      for (let v = 0; v < p.getAttribute('position').count; v++) vertexColours.push(...c);
      parts.push(p);
    }
    pennant.dispose();
    const string = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    string.setAttribute('color', new Float32BufferAttribute(vertexColours, 3));
    this.disposables.push(string);
    const cloth = this.material({ vertexColors: true, roughness: 0.8, side: 2 });
    const saltire = this.material({ map: this.track(saltireTexture()), roughness: 0.8, side: 2 });
    const flag = new PlaneGeometry(1.6, 1);
    flag.translate(0.8, 0, 0);
    const pole = new CylinderGeometry(0.04, 0.04, 2.2, 6);
    pole.rotateZ(Math.PI / 2 - 0.4);
    pole.translate(1, 0, 0);
    const iron = this.material({ color: 0x1d1f24, roughness: 0.5 });
    this.disposables.push(flag, pole);
    for (let offset = 5; offset < LOOP; offset += 18) {
      const holder = new Group();
      holder.add(new Mesh(string, cloth));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
      if (random() < 0.5) {
        // A Saltire on its pole, out from a tenement's first floor.
        const side = random() < 0.5 ? -1 : 1;
        const mount = new Group();
        const f = new Mesh(flag, saltire);
        f.position.set(1.8, 0.8, 0);
        mount.add(new Mesh(pole, iron), f);
        this.flags.push(f);
        mount.rotation.y = side < 0 ? 0 : Math.PI;
        mount.position.y = 5;
        const anchor = new Group();
        anchor.add(mount);
        this.group.add(anchor);
        this.props.push({
          mesh: anchor,
          offset: offset + 8,
          x: side * (roadHalf + PAVEMENT - 0.1),
        });
      }
    }
  }

  /** St Giles' Cathedral on the left once a lap: its nave, the tower, and the crown spire's arches and pinnacles. */
  private addStGiles(roadHalf: number): void {
    const stone = this.material({
      map: this.repeat(ashlarTexture(), 4, 4),
      color: 0x9a948a,
      roughness: 0.9,
    });
    const glass = this.material({
      color: 0x2a3a5a,
      emissive: 0x3a2a5a,
      emissiveIntensity: 0.2,
      roughness: 0.3,
    });
    const church = new Group();
    const nave = new Mesh(this.unit, stone);
    nave.scale.set(22, 16, 50);
    nave.position.set(-11, 8, -25);
    const roof = new Mesh(new CylinderGeometry(0.1, 12, 6, 4, 1), stone);
    this.disposables.push(roof.geometry);
    roof.rotation.set(Math.PI / 2, Math.PI / 4, 0);
    roof.scale.set(1, 4, 0.7);
    roof.position.set(-11, 17, -25);
    const tower = new Mesh(this.unit, stone);
    tower.scale.set(10, 34, 10);
    tower.position.set(-11, 17, -25);
    // The crown: eight flying ribs rising to a lantern and its spire.
    const crown = new Group();
    const rib = new BoxGeometry(0.5, 7, 0.5);
    rib.translate(0, 3.5, 0);
    rib.rotateX(0.7);
    const pinnacle = new ConeGeometry(0.5, 2.6, 6);
    const lantern = new CylinderGeometry(1.2, 1.4, 3, 8);
    const spire = new ConeGeometry(1, 6, 8);
    this.disposables.push(rib, pinnacle, lantern, spire);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const r = new Mesh(rib, stone);
      r.position.set(Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6);
      r.rotation.y = -a + Math.PI / 2;
      const p = new Mesh(pinnacle, stone);
      p.position.set(Math.cos(a) * 4.8, 1.3, Math.sin(a) * 4.8);
      crown.add(r, p);
    }
    const l = new Mesh(lantern, stone);
    l.position.y = 5.6;
    const sp = new Mesh(spire, stone);
    sp.position.y = 10;
    crown.add(l, sp);
    crown.position.set(-11, 34, -25);
    for (const z of [-10, -22, -34, -46]) {
      const w = new Mesh(this.unit, glass);
      w.scale.set(0.2, 7, 2.6);
      w.position.set(0.05, 8, z);
      church.add(w);
    }
    church.add(nave, roof, tower, crown);
    church.children.forEach((c) => (c.castShadow = true));
    this.group.add(church);
    this.props.push({ mesh: church, offset: ST_GILES - 25, x: -roadHalf - PAVEMENT - 4 });
  }

  /** Street performers in the road's edge: a juggler in a ring of spectators, every so often. */
  private addPerformers(roadHalf: number): void {
    const random = seeded(1331);
    const clubs = ['#ffd23f', '#ff2d78', '#2dd4ff', '#30ff9a'].map((c) =>
      this.material({ color: c, roughness: 0.4 }),
    );
    const club = new SphereGeometry(0.09, 8, 6);
    club.scale(1, 2.2, 1);
    const hat = new CylinderGeometry(0.4, 0.3, 0.12, 12);
    this.disposables.push(club, hat);
    const black = this.material({ color: 0x1d1f24, roughness: 0.7 });
    for (let offset = 25; offset < LOOP; offset += RING) {
      const side = random() < 0.5 ? -1 : 1;
      const x = side * (roadHalf + 2.6);
      const show = new Group();
      const balls = [0, 1, 2].map((k) => {
        const b = new Mesh(club, clubs[(k + offset) % 4]!);
        show.add(b);
        return b;
      });
      const h = new Mesh(hat, black);
      h.position.set(0.8, 0.07, 0.6);
      show.add(h);
      this.group.add(show);
      this.props.push({ mesh: show, offset, x });
      this.jugglers.push({ balls, phase: random() * 6 });
      // The performer at the centre, facing the street, and the ring around.
      this.people.push({
        offset,
        x,
        heading: side < 0 ? -Math.PI / 2 : Math.PI / 2,
        speed: 0,
        phase: random() * 6,
      });
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const px = x + Math.cos(a) * 2.4;
        // Leave the side towards the road open, so the ring stays off the riders' line.
        if (Math.sign(px - x) === -side && Math.abs(px - x) > 1.2) continue;
        this.people.push({
          offset: offset + Math.sin(a) * 2.4,
          x: px,
          heading: Math.atan2(Math.cos(a), -Math.sin(a)) + Math.PI / 2,
          speed: 0,
          phase: random() * 6,
        });
      }
    }
  }

  /** The crowd walking the pavements both ways, and flyerers standing at the kerbs. */
  private addCrowd(roadHalf: number): void {
    const random = seeded(1337);
    for (let offset = 0; offset < LOOP; offset += 0.9 + random() * 1.8) {
      const side = random() < 0.5 ? -1 : 1;
      const flyerer = random() < 0.12;
      const speed = flyerer ? 0 : (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.5);
      this.people.push({
        offset,
        x: side * (roadHalf + (flyerer ? 0.5 : 1.2 + random() * (PAVEMENT - 2))),
        heading: flyerer ? (side < 0 ? Math.PI / 2 : -Math.PI / 2) : speed > 0 ? 0 : Math.PI,
        speed,
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, CROWD_WEAR, 1339);
  }

  /** Edinburgh Castle on its rock at the top of the Mile: the cliffs, the walls and the half-moon battery. */
  private addCastle(): void {
    const rock = this.material({ map: this.repeat(rockTexture(), 30, 30), roughness: 1 });
    const stone = this.material({
      map: this.repeat(ashlarTexture(), 12, 12),
      color: 0x8a847a,
      roughness: 0.9,
    });
    const castle = new Group();
    const crag = new DodecahedronGeometry(1, 1);
    this.disposables.push(crag);
    const base = new Mesh(crag, rock);
    base.scale.set(160, 70, 120);
    base.position.y = 10;
    const walls = new Mesh(this.unit, stone);
    walls.scale.set(140, 24, 70);
    walls.position.y = 82;
    const battery = new Mesh(new CylinderGeometry(30, 34, 22, 20, 1, false, 0, Math.PI), stone);
    this.disposables.push(battery.geometry);
    battery.position.set(10, 78, 30);
    battery.rotation.y = -Math.PI / 2;
    const keep = new Mesh(this.unit, stone);
    keep.scale.set(30, 22, 24);
    keep.position.set(-20, 104, 0);
    castle.add(base, walls, battery, keep);
    for (let x = -66; x <= 66; x += 8) {
      const merlon = new Mesh(this.unit, stone);
      merlon.scale.set(4, 4, 71);
      merlon.position.set(x, 96, 0);
      castle.add(merlon);
    }
    castle.position.set(0, -10, -560);
    this.horizon.add(castle);
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

/** Grey granite setts, laid in courses across the street. */
function settsTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6a6a6e', 1341);
    const random = seeded(1343);
    g.fillStyle = 'rgba(25,25,28,0.55)';
    for (let x = 0; x < 256; x += 22) {
      g.fillRect(x, 0, 3, 256);
      for (let y = random() * 30; y < 256; y += 28 + random() * 10) g.fillRect(x, y, 22, 3);
    }
  });
}

/** Caithness flagstones on the pavements. */
function flagstoneTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a867e', 1347);
    g.fillStyle = 'rgba(30,30,30,0.4)';
    g.fillRect(0, 0, 128, 2);
    g.fillRect(0, 0, 2, 80);
    g.fillRect(70, 80, 2, 48);
    g.fillRect(0, 80, 128, 2);
  });
}

/** Six metres and four storeys of tenement: rubble stone and rows of white-framed sash windows. */
function tenementTexture(stone: string, seed: number): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, stone, seed);
    const random = seeded(seed + 1);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(0,0,0,${0.05 + random() * 0.12})`;
      g.fillRect(random() * 256, random() * 512, 8 + random() * 22, 6 + random() * 10);
    }
    for (let y = 18; y < 512; y += 128) {
      for (const x of [24, 104, 184]) {
        g.fillStyle = '#e8e4da';
        g.fillRect(x - 4, y - 4, 56, 92);
        g.fillStyle = random() < 0.25 ? '#c8a060' : '#1f2630';
        g.fillRect(x, y, 48, 84);
        g.fillStyle = '#e8e4da';
        g.fillRect(x, y + 40, 48, 4);
        g.fillRect(x + 22, y, 3, 84);
      }
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(0, y + 100, 256, 5);
    }
  });
}

/** A shopfront: its painted fascia, glazing and door. */
function shopTexture(colour: string, seed: number): CanvasTexture {
  return canvasTexture(256, 96, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 256, 96);
    g.fillStyle = '#d9b46a';
    g.fillRect(10, 8, 236, 3);
    g.fillRect(10, 26, 236, 3);
    const random = seeded(seed);
    g.fillStyle = '#2a3440';
    g.fillRect(12, 36, 150, 56);
    g.fillStyle = `rgba(255,220,160,${0.3 + random() * 0.3})`;
    g.fillRect(16, 40, 142, 48);
    g.fillStyle = '#1d1f24';
    g.fillRect(180, 36, 46, 60);
  });
}

/** A poster wall: the Fringe's shows pasted over one another in bold colours. */
function posterTexture(seed: number): CanvasTexture {
  const colours = [
    '#ff2d78',
    '#ffd23f',
    '#2dd4ff',
    '#ffffff',
    '#1d1f24',
    '#ff9f1c',
    '#30ff9a',
    '#9b5cff',
    '#c8102e',
  ];
  return canvasTexture(512, 256, (g) => {
    g.fillStyle = '#e8e4da';
    g.fillRect(0, 0, 512, 256);
    const random = seeded(seed);
    for (let i = 0; i < 42; i++) {
      const w = 40 + random() * 50;
      const h = 56 + random() * 60;
      const x = random() * 512;
      const y = random() * 256 - 20;
      const bg = colours[Math.floor(random() * colours.length)]!;
      g.fillStyle = bg;
      g.fillRect(x, y, w, h);
      g.fillStyle =
        bg === '#ffffff' || bg === '#ffd23f' || bg === '#30ff9a' ? '#1d1f24' : '#ffffff';
      g.font = `bold ${10 + Math.floor(random() * 6)}px sans-serif`;
      g.fillText(WORDS[Math.floor(random() * WORDS.length)]!, x + 4, y + 20, w - 8);
      g.fillRect(x + 4, y + h - 14, w * 0.5, 3);
    }
  });
}

/** The Saltire: a white diagonal cross on blue. */
function saltireTexture(): CanvasTexture {
  return canvasTexture(160, 100, (g) => {
    g.fillStyle = '#005eb8';
    g.fillRect(0, 0, 160, 100);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 16;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(160, 100);
    g.moveTo(160, 0);
    g.lineTo(0, 100);
    g.stroke();
  });
}

/** Dressed sandstone ashlar, in courses. */
function ashlarTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#9a9086', 1349);
    g.fillStyle = 'rgba(40,36,32,0.4)';
    for (let y = 0; y < 128; y += 16) {
      g.fillRect(0, y, 128, 2);
      for (let x = (y / 16) % 2 ? 0 : 24; x < 128; x += 48) g.fillRect(x, y, 2, 16);
    }
  });
}

/** The Castle Rock's dark volcanic crag, with grass on its ledges. */
function rockTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#3e3a38', 1351);
    const random = seeded(1361);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '90,110,60' : '20,20,20'},${0.2 + random() * 0.3})`;
      g.fillRect(random() * 256, random() * 256, 6 + random() * 24, 3 + random() * 8);
    }
  });
}
