// The Alto de Letras, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Colombia's
// 80-kilometre climb out of the Magdalena valley, at the heart of the coffee country on a warm,
// bright morning with the clouds lying in the valley below. The rider winds up the road cut into
// the mountainside: on the right the steep slope is planted with rows of dark, glossy coffee
// bushes shaded by banana plants, and tall wax palms rise above them. On the left the mountain
// falls away into a deep green valley, its floor under a sea of cloud and ridge after blue ridge
// beyond. A painted chiva, the country's wooden mountain bus, grinds past, a roadside tienda sells
// fruit under the yellow, blue and red of the flag, fans have painted the riders' names on the
// road, and kilometre posts count down to the top. Far ahead, the bare ridge of the páramo waits
// under the sky. Built on the shared kit (world-kit.ts) on the pattern of Old
// Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
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

/** The climb repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The valley floor lies VALLEY metres below the road. */
const VALLEY = 320;

const FAN_WEAR = {
  tops: ['#ffd23f', '#1d3a8a', '#d8102e', '#ffffff', '#3a8a5a', '#f08a2a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#e8dcc0'],
  skins: ['#c48a5f', '#e2b48c', '#8d5a3b', '#f0c8a0', '#5a3a2a'],
};

/** The coffee slope's height at a distance d beyond the uphill verge. */
function slope(d: number): number {
  return 0.3 + Math.max(0, d - 2.5) * 0.8;
}

export class LetrasStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly fronds: Group[] = [];
  private readonly clouds: { mesh: Mesh; x: number; speed: number }[] = [];
  private chiva: Group | null = null;
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
    this.addCoffee(roadHalf);
    this.addPalms(roadHalf);
    this.addRoadside(roadHalf);
    this.addChiva();
    this.addFans(roadHalf);
    this.addValley();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.fronds.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 0.9 + k) * 0.12));
    for (const c of this.clouds) c.mesh.position.x = ((c.x + seconds * c.speed) % 2400) - 1700;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops to the valley floor below the mountainside on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - VALLEY - 10);
      position.setY(i * 2 + 1, p.height - VALLEY - 10);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    // The chiva grinds up the climb ahead of the riders, slower than they ride.
    if (this.chiva) {
      const metres = loopMetres(150 + this.time * 4, s, LOOP, BEHIND);
      this.chiva.position.set(1.4, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        const jump = Math.max(0, Math.sin(this.time * 4 + p.phase)) * 0.1;
        const heading =
          (p.x < 0 ? -Math.PI / 2 : Math.PI / 2) + Math.sin(this.time * 0.6 + p.phase) * 0.5;
        crowd.set(i, p.x, heightAt(metres) + jump, -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The road with the riders' names painted on it, its verges, the coffee slope and the drop. */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 40), roughness: 0.85 });
    const verge = this.material({ map: this.repeat(vergeTexture(), 2, 2), roughness: 1 });
    const earth = this.material({ map: this.repeat(slopeTexture(), 6, 6), roughness: 1 });
    const drop = this.material({
      map: this.repeat(jungleTexture(), 10, 10),
      roughness: 1,
      flatShading: true,
    });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, verge, [
      [r + 2.5, slope(2.5)],
      [r, 0.02],
    ]);
    this.ribbons.add(
      points,
      earth,
      [160, 40, 2.5].map((d) => [r + d, slope(d)] as [number, number]),
    );
    this.ribbons.add(points, verge, [
      [-r, 0.02],
      [-r - 2, -0.3],
    ]);
    this.ribbons.add(points, drop, [
      [-r - 2, -0.3],
      [-r - 14, -9],
      [-r - 60, -70],
      [-r - 260, -VALLEY],
    ]);
  }

  /** The coffee bushes in their rows on the steep slope, shaded by banana plants. */
  private addCoffee(roadHalf: number): void {
    const random = seeded(6301);
    const leaves = [0x1e4a24, 0x2a5a2a, 0x24522a].map((c) =>
      this.material({ color: c, roughness: 0.4, flatShading: true }),
    );
    const cherries = this.material({ color: 0xc8202a, roughness: 0.5 });
    const bush = new DodecahedronGeometry(0.9, 0);
    bush.scale(1, 1.2, 1);
    const berry = new SphereGeometry(0.09, 5, 4);
    this.disposables.push(bush, berry);
    for (let offset = 0; offset < LOOP; offset += 10) {
      const block = new Group();
      for (let d = 4; d < 40; d += 2.6)
        for (let z = -4.5; z < 5; z += 2.2) {
          if (random() < 0.12) continue;
          const b = new Mesh(bush, leaves[Math.floor(random() * leaves.length)]!);
          const s = 0.8 + random() * 0.4;
          b.scale.setScalar(s);
          b.position.set(d, slope(d) + 0.9 * s, z + (random() - 0.5) * 0.6);
          block.add(b);
          if (random() < 0.3) {
            const c = new Mesh(berry, cherries);
            c.position.set(d - 0.8 * s, slope(d) + 0.9 * s, z);
            block.add(c);
          }
        }
      block.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(block);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + 5, x: roadHalf });
    }
    // Banana plants shading the coffee, their big leaves drooping.
    const stem = this.material({ color: 0x6a8a3a, roughness: 0.8 });
    const frond = this.material({ color: 0x5aa03a, roughness: 0.6, side: 2 });
    const trunk = new CylinderGeometry(0.18, 0.28, 3.6, 6);
    trunk.translate(0, 1.8, 0);
    const blade = new PlaneGeometry(0.8, 3);
    blade.translate(0, 1.5, 0);
    this.disposables.push(trunk, blade);
    for (let offset = 6; offset < LOOP; offset += 12 + random() * 14) {
      const plant = new Group();
      plant.add(new Mesh(trunk, stem));
      const crown = new Group();
      crown.position.y = 3.4;
      for (let k = 0; k < 7; k++) {
        const leaf = new Mesh(blade, frond);
        leaf.rotation.set(1 + random() * 0.4, (k / 7) * Math.PI * 2, 0, 'YXZ');
        crown.add(leaf);
      }
      plant.add(crown);
      this.fronds.push(crown);
      plant.children.forEach((c) => (c.castShadow = true));
      const d = 5 + random() * 30;
      plant.position.y = slope(d);
      const holder = new Group();
      holder.add(plant);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + d });
    }
  }

  /** The tall wax palms rising over the slope. */
  private addPalms(roadHalf: number): void {
    const random = seeded(6311);
    const wax = this.material({ color: 0xd8d0c0, roughness: 0.7 });
    const green = this.material({ color: 0x4a7a3a, roughness: 0.7, side: 2 });
    const trunk = new CylinderGeometry(0.25, 0.3, 30, 8);
    trunk.translate(0, 15, 0);
    const blade = new PlaneGeometry(0.9, 5);
    blade.translate(0, 2.5, 0);
    this.disposables.push(trunk, blade);
    for (let offset = 20; offset < LOOP; offset += 40 + random() * 40) {
      const palm = new Group();
      palm.add(new Mesh(trunk, wax));
      const crown = new Group();
      crown.position.y = 30;
      for (let k = 0; k < 9; k++) {
        const leaf = new Mesh(blade, green);
        leaf.rotation.set(1.1 + random() * 0.3, (k / 9) * Math.PI * 2, 0, 'YXZ');
        crown.add(leaf);
      }
      palm.add(crown);
      this.fronds.push(crown);
      palm.children.forEach((c) => (c.castShadow = true));
      const d = 14 + random() * 24;
      palm.position.y = slope(d);
      const holder = new Group();
      holder.add(palm);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + d });
    }
  }

  /** The tienda with its fruit and the flag painted on its wall, kilometre posts and the guard rail. */
  private addRoadside(roadHalf: number): void {
    const wall = this.material({ map: this.track(tiendaTexture()), roughness: 0.9 });
    const tile = this.material({ color: 0xa8482e, roughness: 0.8 });
    const crate = this.material({ color: 0x8a6a3a, roughness: 0.9 });
    const fruit = [0xf0a020, 0xe8d020, 0x6aa030, 0xd8402a].map((c) =>
      this.material({ color: c, roughness: 0.6 }),
    );
    const shop = new Group();
    const body = new Mesh(this.unit, wall);
    body.scale.set(5, 3.6, 7);
    body.position.y = 1.8;
    const roof = new Mesh(this.unit, tile);
    roof.scale.set(7, 0.3, 8);
    roof.rotation.z = -0.15;
    roof.position.set(-0.9, 4, 0);
    shop.add(body, roof);
    for (let k = 0; k < 4; k++) {
      const c = new Mesh(this.unit, crate);
      c.scale.set(0.9, 0.5, 1.2);
      c.position.set(-3.1, 0.5, -2.4 + k * 1.5);
      const pile = new Mesh(this.unit, fruit[k]!);
      pile.scale.set(0.8, 0.25, 1.1);
      pile.position.set(-3.1, 0.85, -2.4 + k * 1.5);
      shop.add(c, pile);
    }
    shop.children.forEach((c) => (c.castShadow = true));
    shop.position.y = 0.3;
    const holder = new Group();
    holder.add(shop);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 120, x: roadHalf + 6 });
    // The kilometre posts counting down to the top.
    const post = this.material({ map: this.track(kmTexture()), roughness: 0.7 });
    for (const offset of [40, 220]) {
      const p = new Mesh(this.unit, post);
      p.scale.set(0.2, 1.2, 0.5);
      p.position.y = 0.6;
      p.castShadow = true;
      const h = new Group();
      h.add(p);
      this.group.add(h);
      this.props.push({ mesh: h, offset, x: roadHalf + 0.8 });
    }
    // The guard rail along the drop.
    const steel = this.material({ color: 0xc0c4c8, roughness: 0.4, metalness: 0.7 });
    for (let offset = 0; offset < LOOP; offset += 4) {
      const rail = new Group();
      const beam = new Mesh(this.unit, steel);
      beam.scale.set(0.06, 0.32, 4);
      beam.position.y = 0.6;
      const leg = new Mesh(this.unit, steel);
      leg.scale.set(0.1, 0.7, 0.1);
      leg.position.y = 0.35;
      rail.add(beam, leg);
      const h = new Group();
      h.add(rail);
      this.group.add(h);
      this.props.push({ mesh: h, offset: offset + 2, x: -roadHalf - 0.9 });
    }
  }

  /** The chiva, the painted wooden mountain bus, with luggage on its roof. */
  private addChiva(): void {
    const paint = this.material({ map: this.track(chivaTexture()), roughness: 0.7 });
    const roof = this.material({ color: 0xd8102e, roughness: 0.7 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    const luggage = [0x3a6a9a, 0xd8a040, 0x5a8a3a].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const bus = new Group();
    const body = new Mesh(this.unit, paint);
    body.scale.set(2.4, 2.4, 8);
    body.position.y = 1.9;
    const top = new Mesh(this.unit, roof);
    top.scale.set(2.5, 0.2, 8.1);
    top.position.y = 3.2;
    const wheels = new Mesh(this.unit, tyre);
    wheels.scale.set(2.3, 0.8, 6);
    wheels.position.y = 0.4;
    bus.add(body, top, wheels);
    luggage.forEach((m, k) => {
      const bag = new Mesh(this.unit, m);
      bag.scale.set(1.6, 0.6, 1.4);
      bag.position.set(0, 3.6, -2 + k * 1.8);
      bus.add(bag);
    });
    bus.children.forEach((c) => (c.castShadow = true));
    this.group.add(bus);
    this.chiva = bus;
  }

  /** The fans at the roadside, waving the riders up. */
  private addFans(roadHalf: number): void {
    const random = seeded(6321);
    for (let offset = 6; offset < LOOP; offset += 10 + random() * 22) {
      const side = random() < 0.7 ? 1 : -1;
      for (let k = 0; k < 1 + Math.floor(random() * 4); k++)
        this.people.push({
          offset: offset + k * 1.1,
          x: side * (roadHalf + 0.9 + random() * 0.8),
          phase: random() * 6,
        });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, FAN_WEAR, 6327);
  }

  /** The valley under its sea of cloud, the blue ridges beyond and the páramo's ridge ahead. */
  private addValley(): void {
    const random = seeded(6331);
    const floor = this.material({ map: this.repeat(jungleTexture(), 80, 80), roughness: 1 });
    const plain = new Mesh(new PlaneGeometry(9000, 9000), floor);
    plain.rotation.x = -Math.PI / 2;
    plain.position.set(-4300, -VALLEY, -1500);
    this.disposables.push(plain.geometry);
    this.horizon.add(plain);
    const hill = new DodecahedronGeometry(1, 1);
    this.disposables.push(hill);
    // Ridge after ridge, bluer as they recede.
    const ridges = [0x3a6a34, 0x4a7a5a, 0x6a8aa0, 0x8a9ab8].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    ridges.forEach((m, row) => {
      for (let k = 0; k < 6; k++) {
        const h = new Mesh(hill, m);
        h.scale.set(600 + random() * 400, 200 + random() * 120 + row * 110, 360);
        h.position.set(
          -2600 + k * 750 + random() * 200 - row * 300,
          -VALLEY - 40,
          -1600 - row * 1100,
        );
        this.horizon.add(h);
      }
    });
    // The bare ridge of the páramo ahead.
    const paramo = this.material({ color: 0x8a8a5a, roughness: 1, flatShading: true });
    const ridge = new Mesh(hill, paramo);
    ridge.scale.set(900, 520, 500);
    ridge.position.set(500, -VALLEY, -2200);
    this.horizon.add(ridge);
    // The sea of cloud lying in the valley below.
    const cloud = this.material({
      color: 0xffffff,
      emissive: 0xe4eaf0,
      emissiveIntensity: 0.5,
      roughness: 1,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const puff = new SphereGeometry(1, 12, 8);
    this.disposables.push(puff);
    for (let k = 0; k < 22; k++) {
      const c = new Mesh(puff, cloud);
      c.scale.set(140 + random() * 160, 22 + random() * 18, 90 + random() * 80);
      c.position.set(0, -VALLEY + 120 + random() * 50, -200 - random() * 1600);
      this.clouds.push({ mesh: c, x: random() * 2400, speed: 2 + random() * 3 });
      this.horizon.add(c);
    }
    // Fair-weather cumulus over the ridges, each a cluster of puffs.
    for (let k = 0; k < 6; k++) {
      const x = -1400 + k * 520 + random() * 120;
      const y = 460 + random() * 160;
      const z = -1800 - random() * 700;
      for (let p = 0; p < 4; p++) {
        const c = new Mesh(puff, cloud);
        const r = 50 + random() * 40;
        c.scale.set(r * 1.3, r * 0.8, r);
        c.position.set(x + (p - 1.5) * 55, y + (p % 2) * 30, z + (random() - 0.5) * 40);
        this.horizon.add(c);
      }
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

/** The mountain road's tarmac with its yellow centre line and the riders' names painted on it. */
function roadTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, '#555556', 6341);
    g.fillStyle = 'rgba(255,210,60,0.85)';
    g.fillRect(126, 0, 4, 512);
    g.fillStyle = 'rgba(245,245,240,0.85)';
    g.fillRect(6, 0, 5, 512);
    g.fillRect(245, 0, 5, 512);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const [text, colour, y] of [
      ['VAMOS NAIRO', '#ffffff', 140],
      ['RIGO', '#ffd23f', 400],
    ] as const) {
      g.save();
      g.translate(128, y);
      g.scale(-1, 1.8);
      g.fillStyle = colour;
      g.font = 'bold 30px sans-serif';
      g.fillText(text, 0, 0);
      g.restore();
    }
  });
}

/** The verge's lush grass. */
function vergeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#4a8a2e', 6351));
}

/** The coffee slope's red-brown volcanic earth between the rows. */
function slopeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a5a3a', 6361);
    const random = seeded(6363);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = random() < 0.6 ? '#3a6a2a' : '#8a5a34';
      g.fillRect(random() * 128, random() * 128, 4 + random() * 6, 2 + random() * 3);
    }
  });
}

/** The mountainside's dense green forest. */
function jungleTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#2e6a2a', 6371);
    const random = seeded(6373);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = ['#4a8a34', '#1e4a20', '#3a7a2e', '#5a9a3a'][Math.floor(random() * 4)]!;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 2 + random() * 5, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** The tienda's whitewashed wall with the flag painted in a band. */
function tiendaTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#f0ece2', 6381);
    g.fillStyle = '#ffd23f';
    g.fillRect(0, 34, 128, 12);
    g.fillStyle = '#1d3a8a';
    g.fillRect(0, 46, 128, 6);
    g.fillStyle = '#d8102e';
    g.fillRect(0, 52, 128, 6);
    g.fillStyle = '#1d3a8a';
    g.font = 'bold 14px sans-serif';
    g.textAlign = 'center';
    g.fillText('TIENDA', 64, 24);
  });
}

/** A kilometre post: the distance left to the top. */
function kmTexture(): CanvasTexture {
  return canvasTexture(32, 64, (g) => {
    g.fillStyle = '#ffd23f';
    g.fillRect(0, 0, 32, 64);
    g.fillStyle = '#111111';
    g.font = 'bold 10px sans-serif';
    g.textAlign = 'center';
    g.fillText('KM', 16, 18);
    g.font = 'bold 16px sans-serif';
    g.fillText('45', 16, 44);
  });
}

/** The chiva's bright painted panels. */
function chivaTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    const colours = ['#ffd23f', '#d8102e', '#1d3a8a', '#3a8a5a', '#f08a2a'];
    for (let y = 0; y < 64; y += 8) {
      g.fillStyle = colours[(y / 8) % colours.length]!;
      g.fillRect(0, y, 128, 8);
    }
    g.fillStyle = '#1d2630';
    for (let x = 6; x < 128; x += 16) g.fillRect(x, 8, 12, 18);
  });
}
