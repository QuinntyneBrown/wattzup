// Pike Place at Dawn's brick street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// Seattle's market opening at sunrise. The rider rolls down the brick street past the market's
// arcade on the left, its stalls heaped with crushed ice and fish, flowers and fruit, the
// fishmongers throwing a salmon over the counter and the red PUBLIC MARKET sign and clock over the
// corner; coffee carts send steam up into the cold air and the early crowd drifts between the
// stalls. On the right a railing looks down over the waterfront to Elliott Bay, where a ferry
// crosses and the Olympic Mountains catch the first pink light; the Space Needle and the towers
// stand ahead. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
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

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The market's arcade stands SETBACK metres from the road's edge on the left. */
const SETBACK = 4.5;
/** The market's buildings are BAY metres long. */
const BAY = 15;
/** The sign and clock stand once a lap. */
const SIGN = 60;

const MARKET_WEAR = {
  tops: [
    '#2f3e5c',
    '#c8302a',
    '#ffd23f',
    '#3a6a3a',
    '#e8e4dc',
    '#5a5f69',
    '#ff9f1c',
    '#1d1f24',
    '#6a4a8a',
  ],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#3a3026'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Walker {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly heading: number;
  readonly phase: number;
}

interface Puff {
  readonly mesh: Mesh;
  readonly phase: number;
}

export class PikePlaceStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly walkers: Walker[] = [];
  private crowd: Figures | null = null;
  private readonly puffs: Puff[] = [];
  private readonly salmon: Mesh[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private ferry: Group | null = null;
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
    this.addMarket(roadHalf);
    this.addStalls(roadHalf);
    this.addSign(roadHalf);
    this.addCoffee(roadHalf);
    this.addRailing(roadHalf);
    this.addWalkers(roadHalf);
    this.addBay();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The steam rises off the cups and carts and thins away, over and over.
    for (const puff of this.puffs) {
      const t = (seconds * 0.35 + puff.phase) % 1;
      puff.mesh.position.y = 1.4 + t * 2.4;
      puff.mesh.scale.setScalar(0.2 + t * 0.7);
      (puff.mesh.material as MeshStandardMaterial).opacity = 0.45 * (1 - t);
    }
    // The salmon flies over the counter from the ice to the catcher and back.
    this.salmon.forEach((fish, k) => {
      const t = (seconds * 0.5 + k * 0.5) % 1;
      const back = Math.floor(seconds * 0.5 + k * 0.5) % 2 === 1;
      const u = back ? 1 - t : t;
      fish.position.set(-1.4 + u * 2.8, 1.6 + Math.sin(u * Math.PI) * 2.2, 0);
      fish.rotation.z = (u - 0.5) * (back ? 2 : -2);
    });
    if (this.ferry) this.ferry.position.x = -2000 + ((seconds * 6) % 3000);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground falls away right of the railing to the waterfront and the bay below. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 60);
      position.setY(i * 2 + 1, p.height - 60);
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
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = w.speed ? Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04 : 0;
        crowd.set(i, w.x, heightAt(metres) + step, -metres, w.heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The brick-edged pavements, the arcade's floor on the left, and the drop to the waterfront. */
  private addPavements(roadHalf: number, points: number): void {
    const r = roadHalf;
    const pavement = this.material({ map: this.repeat(pavementTexture(), 2, 2), roughness: 0.85 });
    const kerb = this.material({ color: 0x8a8680, roughness: 0.8 });
    const bluff = this.material({ map: this.repeat(bluffTexture(), 6, 6), roughness: 1 });
    this.ribbons.add(points, kerb, [
      [-r, 0.004],
      [-r, 0.15],
      [-r - 0.3, 0.15],
    ]);
    this.ribbons.add(points, pavement, [
      [-r - 0.3, 0.15],
      [-r - SETBACK - 6, 0.15],
    ]);
    this.ribbons.add(points, kerb, [
      [r + 0.3, 0.15],
      [r, 0.15],
      [r, 0.004],
    ]);
    this.ribbons.add(points, pavement, [
      [r + 3.2, 0.15],
      [r + 0.3, 0.15],
    ]);
    this.ribbons.add(points, bluff, [
      [r + 60, -40],
      [r + 14, -24],
      [r + 3.2, 0.15],
    ]);
  }

  /** The market's buildings along the left: brick and timber fronts, shop windows, an arcade roof. */
  private addMarket(roadHalf: number): void {
    const random = seeded(2101);
    const fronts = [0, 1, 2, 3].map((k) =>
      this.material({ map: this.track(frontTexture(k)), roughness: 0.85 }),
    );
    const roof = this.material({ color: 0x3a3a3c, roughness: 0.7 });
    const post = this.material({ color: 0x2a4a3a, roughness: 0.6 });
    for (let offset = 0, k = 0; offset < LOOP; offset += BAY, k++) {
      const building = new Group();
      const height = 9 + random() * 6;
      const body = new Mesh(this.unit, fronts[k % 4]!);
      body.scale.set(10, height, BAY - 0.3);
      body.position.set(-5, height / 2, 0);
      const canopy = new Mesh(this.unit, roof);
      canopy.scale.set(SETBACK + 0.6, 0.25, BAY);
      canopy.position.set((SETBACK + 0.6) / 2, 3.6, 0);
      canopy.rotation.z = -0.06;
      building.add(body, canopy);
      for (const z of [-BAY / 2 + 0.6, 0, BAY / 2 - 0.6]) {
        const pillar = new Mesh(this.unit, post);
        pillar.scale.set(0.25, 3.6, 0.25);
        pillar.position.set(SETBACK + 0.2, 1.8, z);
        building.add(pillar);
      }
      building.children.forEach((c) => {
        c.castShadow = true;
        c.receiveShadow = true;
      });
      this.group.add(building);
      this.props.push({ mesh: building, offset: offset + BAY / 2, x: -roadHalf - SETBACK });
    }
  }

  /** The stalls under the arcade: fish on crushed ice, flowers, fruit, each under its sign. */
  private addStalls(roadHalf: number): void {
    const random = seeded(2111);
    const tops = ['fish', 'flowers', 'fruit', 'fish', 'veg'].map((kind) =>
      this.material({
        map: this.track(stallTexture(kind)),
        emissive: 0xffffff,
        emissiveMap: this.track(stallTexture(kind)),
        emissiveIntensity: 0.35,
        roughness: 0.6,
      }),
    );
    const counter = this.material({ color: 0x5a3a24, roughness: 0.8 });
    const tray = new BoxGeometry(1.8, 0.1, 3.2);
    tray.translate(0, 1.05, 0);
    tray.rotateZ(0.25);
    this.disposables.push(tray);
    for (let offset = 3, k = 0; offset < LOOP; offset += 5 + random() * 3, k++) {
      const stall = new Group();
      const base = new Mesh(this.unit, counter);
      base.scale.set(1.2, 0.9, 3);
      base.position.y = 0.45;
      const top = new Mesh(tray, tops[k % tops.length]!);
      stall.add(base, top);
      this.group.add(stall);
      this.props.push({ mesh: stall, offset, x: -roadHalf - SETBACK + 1.2 });
    }
    // The fish stall under the sign, where the fishmongers throw the salmon.
    const fish = new SphereGeometry(0.15, 8, 6);
    fish.scale(1, 0.5, 4);
    fish.rotateY(Math.PI / 2);
    this.disposables.push(fish);
    const scales = this.material({ color: 0xd87a5a, metalness: 0.3, roughness: 0.4 });
    const throwing = new Group();
    for (let k = 0; k < 2; k++) {
      const salmon = new Mesh(fish, scales);
      salmon.castShadow = true;
      this.salmon.push(salmon);
      throwing.add(salmon);
    }
    throwing.rotation.y = Math.PI / 2;
    this.group.add(throwing);
    this.props.push({ mesh: throwing, offset: SIGN + 6, x: -roadHalf - SETBACK + 1 });
  }

  /** The red PUBLIC MARKET CENTER sign glowing over the corner, the clock beside it. */
  private addSign(roadHalf: number): void {
    const corner = new Group();
    const board = new Mesh(
      new PlaneGeometry(10, 2.4),
      this.material({
        map: this.track(signTexture()),
        emissive: 0xffffff,
        emissiveMap: this.track(signTexture()),
        emissiveIntensity: 1.2,
        transparent: true,
      }),
    );
    board.position.set(4.4, 8.4, 0);
    const frame = new Mesh(this.unit, this.material({ color: 0x2a2a2c, roughness: 0.6 }));
    frame.scale.set(10.4, 2.8, 0.2);
    frame.position.set(4.4, 8.4, -0.15);
    const clock = new Mesh(
      new CylinderGeometry(1.4, 1.4, 0.3, 24),
      this.material({
        map: this.track(clockTexture()),
        emissive: 0xfff4d0,
        emissiveIntensity: 0.6,
      }),
    );
    clock.rotation.z = Math.PI / 2;
    clock.rotation.y = Math.PI;
    clock.rotation.set(Math.PI / 2, 0, 0);
    clock.position.set(0.6, 6, 6);
    const stem = new Mesh(this.unit, this.material({ color: 0x2a4a3a }));
    stem.scale.set(0.25, 6, 0.25);
    stem.position.set(0.6, 3, 6);
    this.disposables.push(board.geometry, clock.geometry);
    corner.add(board, frame, clock, stem);
    this.group.add(corner);
    this.props.push({ mesh: corner, offset: SIGN, x: -roadHalf - SETBACK + 0.4 });
  }

  /** Coffee carts on the pavement, steam curling up into the cold morning. */
  private addCoffee(roadHalf: number): void {
    const random = seeded(2131);
    const cart = this.material({ color: 0x2a5a3a, roughness: 0.6 });
    const brass = this.material({ color: 0xc8a050, metalness: 0.7, roughness: 0.3 });
    const umbrella = this.material({ color: 0xe8e4dc, roughness: 0.8 });
    const shade = new ConeGeometry(1.4, 0.6, 10);
    const puff = new SphereGeometry(0.7, 8, 6);
    this.disposables.push(shade, puff);
    for (let offset = 14; offset < LOOP; offset += 30 + random() * 20) {
      const stand = new Group();
      const body = new Mesh(this.unit, cart);
      body.scale.set(1, 1.1, 1.8);
      body.position.y = 0.55;
      const urn = new Mesh(this.unit, brass);
      urn.scale.set(0.4, 0.5, 0.4);
      urn.position.set(0, 1.35, -0.4);
      const top = new Mesh(shade, umbrella);
      top.position.y = 2.6;
      const pole = new Mesh(this.unit, brass);
      pole.scale.set(0.05, 1.5, 0.05);
      pole.position.y = 1.9;
      stand.add(body, urn, top, pole);
      for (let k = 0; k < 4; k++) {
        const mist = new Mesh(
          puff,
          this.material({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            roughness: 1,
          }),
        );
        mist.position.set((random() - 0.5) * 0.3, 1.4, -0.4 + (random() - 0.5) * 0.3);
        this.puffs.push({ mesh: mist, phase: k / 4 + random() * 0.1 });
        stand.add(mist);
      }
      body.castShadow = true;
      this.group.add(stand);
      this.props.push({ mesh: stand, offset, x: roadHalf + 1.6 });
    }
  }

  /** The railing at the bluff's edge, with lamp posts, over the waterfront. */
  private addRailing(roadHalf: number): void {
    const iron = this.material({ color: 0x1d2a24, metalness: 0.5, roughness: 0.5 });
    const glow = this.material({ color: 0xfff0c8, emissive: 0xffd890, emissiveIntensity: 1.4 });
    for (let offset = 0; offset < LOOP; offset += 10) {
      const section = new Group();
      const rail = new Mesh(this.unit, iron);
      rail.scale.set(0.08, 0.08, 10);
      rail.position.y = 1.1;
      const low = rail.clone();
      low.position.y = 0.55;
      section.add(rail, low);
      for (const z of [-5, -2.5, 0, 2.5]) {
        const post = new Mesh(this.unit, iron);
        post.scale.set(0.08, 1.1, 0.08);
        post.position.set(0, 0.55, z);
        section.add(post);
      }
      if (offset % 30 === 0) {
        const lamp = new Mesh(this.unit, iron);
        lamp.scale.set(0.15, 4.5, 0.15);
        lamp.position.y = 2.25;
        const globe = new Mesh(this.unit, glow);
        globe.scale.set(0.45, 0.6, 0.45);
        globe.position.y = 4.7;
        section.add(lamp, globe);
      }
      this.group.add(section);
      this.props.push({ mesh: section, offset, x: roadHalf + 3.1 });
    }
  }

  /** The early crowd along the arcade and at the railing, strolling and stopping at the stalls. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(2141);
    for (let offset = 0; offset < LOOP; offset += 0.9 + random() * 2.2) {
      const left = random() < 0.7;
      const standing = random() < 0.4;
      const speed = standing ? 0 : (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.4);
      this.walkers.push({
        offset,
        x: left ? -roadHalf - 0.8 - random() * (SETBACK - 2.2) : roadHalf + 0.8 + random() * 1.6,
        speed,
        heading: standing ? (left ? -Math.PI / 2 : Math.PI / 2) : speed > 0 ? 0 : Math.PI,
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.walkers.length, MARKET_WEAR, 2147);
  }

  /**
   * Elliott Bay below on the right with a ferry crossing, the Olympic Mountains lit pink beyond,
   * and the Space Needle and downtown's towers ahead.
   */
  private addBay(): void {
    const random = seeded(2153);
    const water = new Mesh(
      new PlaneGeometry(6000, 6000),
      this.material({
        map: this.repeat(waterTexture(), 80, 80),
        color: 0x8aa8c8,
        roughness: 0.25,
        metalness: 0.3,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(3060, -38, -1000);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
    // The Olympics: snowy peaks across the bay catching the dawn.
    const peak = new ConeGeometry(1, 1, 6);
    this.disposables.push(peak);
    const rock = this.material({
      map: this.track(peakTexture()),
      roughness: 1,
      emissive: 0x6a3a4a,
      emissiveIntensity: 0.25,
    });
    for (let k = 0; k < 14; k++) {
      const m = new Mesh(peak, rock);
      const h = 180 + random() * 220;
      m.scale.set(260 + random() * 200, h * 1.4, 220);
      m.position.set(1500 + random() * 300, -38 + (h * 1.4) / 2, 600 - k * 220);
      this.horizon.add(m);
    }
    // A green-and-white ferry.
    const ferry = new Group();
    const hull = new Mesh(this.unit, this.material({ color: 0xf4f4f0, roughness: 0.5 }));
    hull.scale.set(18, 6, 120);
    const band = new Mesh(this.unit, this.material({ color: 0x1a6a3a }));
    band.scale.set(18.2, 1.5, 120.2);
    band.position.y = -1.5;
    const deck = new Mesh(this.unit, this.material({ color: 0xe8e8e4 }));
    deck.scale.set(14, 6, 80);
    deck.position.y = 6;
    const funnel = new Mesh(this.unit, this.material({ color: 0x1d1f24 }));
    funnel.scale.set(5, 6, 8);
    funnel.position.y = 12;
    ferry.add(hull, band, deck, funnel);
    ferry.rotation.y = Math.PI / 2;
    ferry.position.set(-2000, -34, -500);
    const lane = new Group();
    lane.add(ferry);
    lane.position.x = 900;
    lane.rotation.y = 0.25;
    this.ferry = ferry;
    this.horizon.add(lane);
    // Downtown ahead, and the Space Needle.
    const tower = this.material({
      map: this.track(towerTexture()),
      roughness: 0.4,
      metalness: 0.3,
    });
    for (let k = 0; k < 18; k++) {
      const b = new Mesh(this.unit, tower);
      const h = 40 + random() * 150;
      b.scale.set(25 + random() * 25, h, 25 + random() * 25);
      b.position.set(-420 + random() * 300, h / 2, -650 - random() * 500);
      this.horizon.add(b);
    }
    const needle = new Group();
    const white = this.material({ color: 0xf0f0ec, roughness: 0.5 });
    const leg = new Mesh(new CylinderGeometry(1.2, 4, 130, 6), white);
    leg.position.y = 65;
    const saucer = new Mesh(new CylinderGeometry(19, 9, 6, 24), white);
    saucer.position.y = 132;
    const halo = new Mesh(
      new CylinderGeometry(15, 15, 3, 24),
      this.material({ color: 0xf2a33a, emissive: 0xf2a33a, emissiveIntensity: 0.4 }),
    );
    halo.position.y = 137;
    const spire = new Mesh(new ConeGeometry(1.2, 30, 6), white);
    spire.position.y = 154;
    this.disposables.push(leg.geometry, saucer.geometry, halo.geometry, spire.geometry);
    needle.add(leg, saucer, halo, spire);
    needle.position.set(60, 0, -1150);
    needle.scale.setScalar(1.3);
    this.horizon.add(needle);
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

/** Hexagonal pavers and brick, damp from the night. */
function pavementTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a7a6a', 2161);
    g.strokeStyle = 'rgba(40,30,24,0.35)';
    g.lineWidth = 2;
    for (let y = 0; y < 128; y += 16) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(128, y);
      g.stroke();
      for (let x = (y / 16) % 2 ? 0 : 16; x < 128; x += 32) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 16);
        g.stroke();
      }
    }
  });
}

/** The bluff below the railing: ivy, shrubs and the waterfront's roofs. */
function bluffTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#3a5a3a', 2171);
    const random = seeded(2173);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(90,80,70,0.6)' : 'rgba(60,90,50,0.6)';
      g.fillRect(random() * 128, random() * 128, 8 + random() * 20, 6 + random() * 12);
    }
  });
}

/** A market front: brick or painted timber, shop windows lit warm, signs over the doors. */
function frontTexture(k: number): CanvasTexture {
  const walls = ['#8a3a2a', '#c8b89a', '#5a6a5a', '#9a5a3a'];
  const names = ['FISH', 'PRODUCE', 'BAKERY', 'FLOWERS'];
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, walls[k]!, 2181 + k);
    // Upper windows.
    for (let x = 16; x < 256; x += 48)
      for (const y of [30, 90]) {
        g.fillStyle = '#f4f0e4';
        g.fillRect(x - 2, y - 2, 30, 40);
        g.fillStyle = (x + y) % 3 ? '#2a3440' : '#f2c46a';
        g.fillRect(x, y, 26, 36);
      }
    // The shop level, lit warm, with its sign.
    g.fillStyle = '#f2c46a';
    g.fillRect(0, 180, 256, 76);
    g.fillStyle = 'rgba(60,40,24,0.6)';
    for (let x = 0; x < 256; x += 32) g.fillRect(x, 180, 4, 76);
    g.fillStyle = '#1d1f24';
    g.fillRect(40, 150, 176, 26);
    g.fillStyle = '#ffd23f';
    g.font = 'bold 22px serif';
    g.textAlign = 'center';
    g.fillText(names[k]!, 128, 171);
  });
}

/** A stall's display: fish on ice, flowers, fruit or vegetables. */
function stallTexture(kind: string): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    const random = seeded(2191 + kind.length);
    if (kind === 'fish') {
      speckle(g, 64, 128, '#e8f0f4', 2193);
      for (let i = 0; i < 18; i++) {
        g.fillStyle = ['#d87a5a', '#c0c8d0', '#e89a7a', '#8a4a3a'][Math.floor(random() * 4)]!;
        g.beginPath();
        g.ellipse(8 + random() * 48, 6 + random() * 116, 5, 12, random() * 3, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      const palette =
        kind === 'flowers'
          ? ['#ff6b9a', '#ffd23f', '#ff9f1c', '#9b5cff', '#ffffff', '#3a7a3a']
          : kind === 'fruit'
            ? ['#d8202a', '#ff9f1c', '#ffd23f', '#8ac43a', '#6a2a4a']
            : ['#3a8a3a', '#d8602a', '#8ac43a', '#6a3a8a', '#e8d8a0'];
      g.fillStyle = '#3a2a1a';
      g.fillRect(0, 0, 64, 128);
      for (let i = 0; i < 90; i++) {
        g.fillStyle = palette[Math.floor(random() * palette.length)]!;
        g.beginPath();
        g.arc(random() * 64, random() * 128, 3 + random() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
}

/** The market's red neon sign. */
function signTexture(): CanvasTexture {
  return canvasTexture(1024, 192, (g) => {
    g.clearRect(0, 0, 1024, 192);
    g.fillStyle = '#ff2a1a';
    g.font = 'bold 110px sans-serif';
    g.textAlign = 'center';
    g.fillText('PUBLIC MARKET', 512, 110, 1000);
    g.font = 'bold 50px sans-serif';
    g.fillText('CENTER', 512, 175);
  });
}

/** The clock's lit face. */
function clockTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#fff8e0';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#1d1f24';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(64, 64, 58, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(64, 64);
    g.lineTo(64, 24);
    g.moveTo(64, 64);
    g.lineTo(90, 70);
    g.stroke();
  });
}

/** Elliott Bay's water, still in the dawn. */
function waterTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a7a9a', 2201);
    const random = seeded(2203);
    g.fillStyle = 'rgba(255,220,200,0.35)';
    for (let i = 0; i < 40; i++) g.fillRect(random() * 128, random() * 128, 10 + random() * 20, 1);
  });
}

/** The Olympics: blue-grey rock with snow lit pink at the tops. */
function peakTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const fall = g.createLinearGradient(0, 0, 0, 128);
    fall.addColorStop(0, '#f8e0e8');
    fall.addColorStop(0.4, '#c8b8c8');
    fall.addColorStop(0.6, '#6a6a80');
    fall.addColorStop(1, '#4a5a6a');
    g.fillStyle = fall;
    g.fillRect(0, 0, 128, 128);
  });
}

/** Downtown's towers, a few windows still lit. */
function towerTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.fillStyle = '#4a5a6a';
    g.fillRect(0, 0, 64, 128);
    const random = seeded(2213);
    for (let y = 4; y < 128; y += 8)
      for (let x = 4; x < 64; x += 8) {
        g.fillStyle = random() < 0.15 ? '#f2c46a' : '#6a7a8a';
        g.fillRect(x, y, 5, 5);
      }
  });
}
