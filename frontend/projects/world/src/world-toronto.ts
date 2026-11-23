// The Toronto Waterfront Trail, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// Queens Quay on a bright summer morning. The rider races west along the trail: on the left the
// wooden boardwalk and the dock's edge above Lake Ontario, where the island ferry churns across
// to the Toronto Islands' green shore and sailboats lean on the breeze; Sugar Beach's pink
// umbrellas and HTO Park's yellow ones dot the sand. On the right the granite promenade runs
// under rows of red maples, the red streetcar glides along its grassy track, and the glass
// condo towers rise behind. Ahead over the city stands the CN Tower with its pod and long mast,
// the Rogers Centre's dome at its foot. Built on the shared kit (world-kit.ts) on the pattern of
// Old Town's street.
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

/** The trail repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 380;
const BEHIND = 24;
/** The boardwalk runs DECK metres wide on the left before the dock's edge. */
const DECK = 6;
/** The lake lies WATER metres below the boardwalk. */
const WATER = 1.6;

const CITY_WEAR = {
  tops: ['#ffffff', '#1d1f24', '#2a6a9a', '#ff6b5a', '#ffd23f', '#2ec4b6', '#c8102e', '#9b5cff'],
  bottoms: ['#2f3e5c', '#1d1f24', '#e8d8b0', '#5a5f69', '#3a86ff'],
  skins: ['#f0c8a0', '#c48a5f', '#8d5a3b', '#e2b48c', '#f5d3b5', '#5a3a29'],
};

interface Boat {
  readonly mesh: Group;
  readonly x: number;
  readonly z: number;
  readonly speed: number;
  readonly span: number;
  readonly phase: number;
}

export class TorontoStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private streetcar: { mesh: Group; offset: number } | null = null;
  private readonly boats: Boat[] = [];
  private lake: Texture | null = null;
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
    this.addBoardwalk(roadHalf, points);
    this.addPromenade(roadHalf, points);
    this.addMaples(roadHalf);
    this.addUmbrellas(roadHalf);
    this.addStreetcar(roadHalf);
    this.addTowers(roadHalf);
    this.addPeople(roadHalf);
    this.addHarbour(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
    for (const b of this.boats) {
      const t = ((seconds * b.speed + b.phase) % (b.span * 2)) - b.span;
      b.mesh.position.set(b.x + t, -WATER + 0.2 + Math.sin(seconds * 1.3 + b.phase) * 0.12, b.z);
      b.mesh.rotation.y = b.speed > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    if (this.lake) this.lake.offset.set(seconds * 0.004, seconds * 0.006);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the lake on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 30);
      position.setY(i * 2 + 1, p.height - 30);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    if (this.streetcar) {
      const metres = loopMetres(this.streetcar.offset - 6 * this.time, s, LOOP, BEHIND);
      this.streetcar.mesh.position.set(this.streetcar.mesh.position.x, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const step = p.speed ? Math.abs(Math.sin(this.time * 4 + p.phase)) * 0.04 : 0;
        crowd.set(
          i,
          p.x,
          heightAt(metres) + step,
          -metres,
          p.speed > 0 ? 0 : p.speed < 0 ? Math.PI : -Math.PI / 2,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The wooden boardwalk on the left, its granite kerb, and the dock's edge into the lake. */
  private addBoardwalk(roadHalf: number, points: number): void {
    const r = roadHalf;
    const planks = this.material({ map: this.repeat(plankTexture(), 2, 2), roughness: 0.8 });
    const granite = this.material({ map: this.repeat(graniteTexture(), 1, 1), roughness: 0.7 });
    const dock = this.material({ map: this.repeat(dockTexture(), 2, 1), roughness: 0.9 });
    this.ribbons.add(points, granite, [
      [-r, 0.03],
      [-r - 0.8, 0.03],
    ]);
    this.ribbons.add(points, planks, [
      [-r - 0.8, 0.1],
      [-r - DECK, 0.1],
    ]);
    this.ribbons.add(points, dock, [
      [-r - DECK, 0.1],
      [-r - DECK, -WATER - 0.6],
    ]);
  }

  /** The granite promenade, the streetcar's grassy track, the road and the towers' frontage. */
  private addPromenade(roadHalf: number, points: number): void {
    const r = roadHalf;
    const granite = this.material({ map: this.repeat(graniteTexture(), 2, 2), roughness: 0.7 });
    const turf = this.material({ map: this.repeat(trackTexture(), 6, 3), roughness: 1 });
    const asphalt = this.material({ map: this.repeat(asphaltTexture(), 4, 4), roughness: 0.9 });
    this.ribbons.add(points, granite, [
      [r + 6, 0.06],
      [r, 0.03],
    ]);
    this.ribbons.add(points, turf, [
      [r + 12, 0.1],
      [r + 6, 0.06],
    ]);
    this.ribbons.add(points, asphalt, [
      [r + 21, 0.08],
      [r + 12, 0.1],
    ]);
    this.ribbons.add(points, granite, [
      [r + 28, 0.1],
      [r + 21, 0.08],
    ]);
  }

  /** The rows of red maples along the promenade in their granite tree pits. */
  private addMaples(roadHalf: number): void {
    const random = seeded(3901);
    const bark = this.material({ color: 0x4a3a30, roughness: 1 });
    const leaves = [0x3a7a2a, 0x4a8a34, 0x2e6a26].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const trunk = new CylinderGeometry(0.14, 0.22, 3.5, 6);
    trunk.translate(0, 1.75, 0);
    const crown = new DodecahedronGeometry(2.3, 0);
    crown.scale(1, 1.15, 1);
    this.disposables.push(trunk, crown);
    for (let offset = 0; offset < LOOP; offset += 9)
      for (const x of [3.5, 24.5]) {
        const tree = new Group();
        const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
        c.position.y = 5;
        c.rotation.y = random() * 6;
        tree.add(new Mesh(trunk, bark), c);
        tree.scale.setScalar(0.85 + random() * 0.3);
        tree.children.forEach((m) => (m.castShadow = true));
        const holder = new Group();
        holder.add(tree);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset: offset + (x > 10 ? 4 : 0), x: roadHalf + x });
      }
  }

  /** Sugar Beach's pink umbrellas and HTO Park's yellow ones on their patches of sand. */
  private addUmbrellas(roadHalf: number): void {
    const random = seeded(3911);
    const sand = this.material({ color: 0xe8d8b0, roughness: 1 });
    const pole = this.material({ color: 0xf2f2f2, roughness: 0.5 });
    const chair = this.material({ color: 0xf8f8f4, roughness: 0.7 });
    const canopy = new ConeGeometry(1.6, 0.6, 10, 1, true);
    this.disposables.push(canopy);
    for (const [offset, colour] of [
      [70, 0xff4a9a],
      [260, 0xffd23f],
    ] as const) {
      const beach = new Group();
      const patch = new Mesh(this.unit, sand);
      patch.scale.set(DECK - 1.6, 0.1, 40);
      patch.position.set(0, 0.16, 0);
      beach.add(patch);
      const fabric = this.material({ color: colour, roughness: 0.7, side: 2 });
      for (let k = 0; k < 9; k++) {
        const z = -18 + k * 4.5;
        const x = (random() - 0.5) * 2;
        const stick = new Mesh(this.unit, pole);
        stick.scale.set(0.06, 2.6, 0.06);
        stick.position.set(x, 1.3, z);
        const top = new Mesh(canopy, fabric);
        top.position.set(x, 2.7, z);
        const seat = new Mesh(this.unit, chair);
        seat.scale.set(0.6, 0.4, 1.4);
        seat.position.set(x + 0.8, 0.4, z + 0.6);
        seat.rotation.x = -0.25;
        beach.add(stick, top, seat);
      }
      beach.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(beach);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 0.8 - DECK / 2 });
    }
  }

  /** The red streetcar gliding along its grassy track. */
  private addStreetcar(roadHalf: number): void {
    const red = this.material({ color: 0xd8202a, roughness: 0.4, metalness: 0.2 });
    const glass = this.material({ color: 0x2a3440, roughness: 0.15, metalness: 0.5 });
    const black = this.material({ color: 0x1d1f24, roughness: 0.6 });
    const white = this.material({ color: 0xf2f2f2, roughness: 0.5 });
    const car = new Group();
    const body = new Mesh(this.unit, red);
    body.scale.set(2.6, 2.8, 30);
    body.position.y = 1.9;
    const windows = new Mesh(this.unit, glass);
    windows.scale.set(2.65, 1.1, 28);
    windows.position.y = 2.4;
    const skirt = new Mesh(this.unit, black);
    skirt.scale.set(2.62, 0.5, 30);
    skirt.position.y = 0.55;
    const stripe = new Mesh(this.unit, white);
    stripe.scale.set(2.64, 0.12, 30);
    stripe.position.y = 1.2;
    const pole = new Mesh(this.unit, black);
    pole.scale.set(0.06, 1.6, 0.06);
    pole.position.set(0, 4.0, 4);
    pole.rotation.x = 0.5;
    car.add(body, windows, skirt, stripe, pole);
    car.children.forEach((c) => (c.castShadow = true));
    car.position.x = roadHalf + 9;
    this.group.add(car);
    this.streetcar = { mesh: car, offset: 120 };
    // The overhead wire along the track.
    const wire = this.material({ color: 0x2a2a2a });
    for (let offset = 0; offset < LOOP; offset += 25) {
      const span = new Group();
      const post = new Mesh(this.unit, wire);
      post.scale.set(0.15, 6.5, 0.15);
      post.position.set(3, 3.25, 0);
      const arm = new Mesh(this.unit, wire);
      arm.scale.set(3.2, 0.08, 0.08);
      arm.position.set(1.4, 6, 0);
      const cable = new Mesh(this.unit, wire);
      cable.scale.set(0.03, 0.03, 25);
      cable.position.set(0, 5.6, -12.5);
      span.add(post, arm, cable);
      const holder = new Group();
      holder.add(span);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 9 });
    }
  }

  /** The glass condo towers and their podiums along the quay. */
  private addTowers(roadHalf: number): void {
    const random = seeded(3921);
    const glasses = ['#5a8ab0', '#7aa0b8', '#3a5a78', '#8ab8c8', '#4a6a88'].map((c, k) =>
      this.material({ map: this.track(towerTexture(c, k)), roughness: 0.25, metalness: 0.4 }),
    );
    const podium = this.material({ map: this.track(podiumTexture()), roughness: 0.6 });
    for (let offset = 0; offset < LOOP; offset += 38 + random() * 20) {
      const tower = new Group();
      const h = 50 + random() * 110;
      const w = 22 + random() * 10;
      const base = new Mesh(this.unit, podium);
      base.scale.set(18, 12, 34);
      base.position.set(0, 6, 0);
      const shaft = new Mesh(this.unit, glasses[Math.floor(random() * glasses.length)]!);
      shaft.scale.set(w, h, w);
      shaft.position.set(6 + w / 2, h / 2, 0);
      tower.add(base, shaft);
      const holder = new Group();
      holder.add(tower);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 37 });
    }
  }

  /** Runners, cyclists, strollers and people at the dock's edge watching the boats. */
  private addPeople(roadHalf: number): void {
    const random = seeded(3931);
    for (let offset = 3; offset < LOOP; offset += 4 + random() * 7) {
      const kind = random();
      const boardwalk = random() < 0.55;
      this.people.push({
        offset,
        x: boardwalk ? -roadHalf - 1.5 - random() * (DECK - 2) : roadHalf + 1 + random() * 4,
        speed:
          kind < 0.2
            ? 0
            : (random() < 0.5 ? 1 : -1) * (kind < 0.45 ? 2.6 + random() : 1 + random() * 0.4),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, CITY_WEAR, 3937);
  }

  /**
   * The harbour: Lake Ontario, the island ferry and sailboats crossing it, the Toronto Islands'
   * green shore, and ahead the CN Tower with the Rogers Centre's dome and the downtown towers.
   */
  private addHarbour(roadHalf: number): void {
    const random = seeded(3941);
    const ripple = this.track(lakeTexture());
    ripple.wrapS = RepeatWrapping;
    ripple.wrapT = RepeatWrapping;
    ripple.repeat.set(100, 100);
    this.lake = ripple;
    const water = new Mesh(
      new PlaneGeometry(5000, 6000),
      this.material({
        map: ripple,
        color: 0x5a8aa8,
        roughness: 0.15,
        metalness: 0.35,
        emissive: 0x1a3048,
        emissiveIntensity: 0.3,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-2500 - roadHalf - DECK, -WATER, -2000);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
    // The Toronto Islands' low wooded shore across the harbour.
    const green = [0x3a6a2a, 0x4a7a34, 0x2e5a26].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const beach = this.material({ color: 0xd8c8a0, roughness: 1 });
    const crown = new DodecahedronGeometry(1, 0);
    this.disposables.push(crown);
    const strand = new Mesh(this.unit, beach);
    strand.scale.set(40, 1.5, 3000);
    strand.position.set(-520, -WATER + 0.4, -800);
    this.horizon.add(strand);
    for (let k = 0; k < 120; k++) {
      const t = new Mesh(crown, green[k % green.length]!);
      t.scale.set(8 + random() * 8, 7 + random() * 7, 8 + random() * 8);
      t.position.set(-530 - random() * 80, 4 + random() * 4, 600 - k * 25);
      this.horizon.add(t);
    }
    // The island ferry and the sailboats.
    const white = this.material({ color: 0xf8f8f4, roughness: 0.4 });
    const navy = this.material({ color: 0x1a2a4a, roughness: 0.5 });
    const sail = this.material({ color: 0xf8f8f4, roughness: 0.6, side: 2 });
    for (let k = 0; k < 6; k++) {
      const ferry = k === 0;
      const boat = new Group();
      if (ferry) {
        const hull = new Mesh(this.unit, navy);
        hull.scale.set(9, 2, 30);
        const deck = new Mesh(this.unit, white);
        deck.scale.set(8.4, 2.6, 22);
        deck.position.y = 2.3;
        const top = new Mesh(this.unit, white);
        top.scale.set(6, 1.4, 8);
        top.position.y = 4.3;
        boat.add(hull, deck, top);
      } else {
        const hull = new Mesh(this.unit, white);
        hull.scale.set(2.2, 0.8, 8);
        const mast = new Mesh(this.unit, white);
        mast.scale.set(0.12, 10, 0.12);
        mast.position.y = 5;
        const main = new Mesh(new PlaneGeometry(3.6, 8.5), sail);
        main.position.set(0, 5.4, 1.8);
        main.rotation.y = Math.PI / 2;
        main.rotation.z = 0.12;
        this.disposables.push(main.geometry);
        boat.add(hull, mast, main);
        boat.rotation.z = 0.15;
      }
      const z = ferry ? -260 : -120 - random() * 600;
      this.boats.push({
        mesh: boat,
        x: -roadHalf - (ferry ? 260 : 60 + random() * 300),
        z,
        speed: (random() < 0.5 ? 1 : -1) * (ferry ? 4 : 3 + random() * 3),
        span: 160,
        phase: random() * 320,
      });
      this.horizon.add(boat);
    }
    // The CN Tower, the Rogers Centre and the downtown towers ahead.
    const concrete = this.material({ color: 0xd4d0c8, roughness: 0.7 });
    const pod = this.material({ color: 0xa8a8a8, roughness: 0.4, metalness: 0.5 });
    const cn = new Group();
    const shaft = new Mesh(new CylinderGeometry(6, 18, 340, 3), concrete);
    shaft.position.y = 170;
    const ring = new Mesh(new CylinderGeometry(24, 18, 22, 20), pod);
    ring.position.y = 345;
    const deck = new Mesh(new CylinderGeometry(19, 22, 8, 20), concrete);
    deck.position.y = 360;
    const upper = new Mesh(new CylinderGeometry(4.5, 6, 90, 8), concrete);
    upper.position.y = 410;
    const skypod = new Mesh(new CylinderGeometry(8, 8, 6, 12), pod);
    skypod.position.y = 446;
    const mast = new Mesh(new CylinderGeometry(1.2, 3.5, 100, 6), concrete);
    mast.position.y = 503;
    cn.add(shaft, ring, deck, upper, skypod, mast);
    for (const m of [shaft, ring, deck, upper, skypod, mast]) this.disposables.push(m.geometry);
    cn.position.set(-30, 0, -1500);
    this.horizon.add(cn);
    const dome = new Mesh(
      new SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      this.material({ color: 0xe8e8e4, roughness: 0.5, metalness: 0.3 }),
    );
    dome.scale.set(110, 75, 110);
    dome.position.set(-170, 0, -1560);
    this.disposables.push(dome.geometry);
    this.horizon.add(dome);
    const glass = [0x6a8aa8, 0x8aa8c0, 0x4a6a88, 0xa8b8c8].map((c) =>
      this.material({ color: c, roughness: 0.2, metalness: 0.5 }),
    );
    for (let k = 0; k < 40; k++) {
      const b = new Mesh(this.unit, glass[k % glass.length]!);
      const h = 60 + random() * 200;
      b.scale.set(28 + random() * 20, h, 28 + random() * 20);
      b.position.set(60 + random() * 800, h / 2, -1100 - random() * 900);
      this.horizon.add(b);
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

/** The boardwalk's ipe planks laid across the walk. */
function plankTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a6a4a', 3951);
    g.fillStyle = 'rgba(40,28,18,0.45)';
    for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 128, 1);
  });
}

/** Pale granite paving in long slabs. */
function graniteTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b8b4ac', 3961);
    g.fillStyle = 'rgba(70,68,62,0.3)';
    for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 1);
    for (let x = 0; x < 128; x += 64) g.fillRect(x, 0, 1, 128);
  });
}

/** The dock wall's concrete with its timber fender. */
function dockTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#8a8680', 3971);
    g.fillStyle = '#5a4030';
    g.fillRect(0, 0, 64, 14);
  });
}

/** The streetcar's grassy track with its two steel rails. */
function trackTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#5a8a3a', 3981);
    g.fillStyle = '#8a8c90';
    g.fillRect(22, 0, 3, 64);
    g.fillRect(39, 0, 3, 64);
  });
}

/** Queens Quay's asphalt. */
function asphaltTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#4a4c50', 3991));
}

/** Lake Ontario's blue-green water with light on its ripples. */
function lakeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4a7a98', 4001);
    const random = seeded(4003);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(230,245,255,${0.2 + random() * 0.3})`;
      g.fillRect(random() * 128, random() * 128, 6 + random() * 12, 1);
    }
  });
}

/** A condo tower's glass curtain wall with its floor lines and balcony glass. */
function towerTexture(glass: string, k: number): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    speckle(g, 128, 256, glass, 4011 + k);
    g.fillStyle = 'rgba(240,248,255,0.5)';
    for (let y = 0; y < 256; y += 8) g.fillRect(0, y, 128, 1);
    g.fillStyle = 'rgba(30,40,50,0.25)';
    for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 1, 256);
  });
}

/** A tower's podium: shopfronts with awnings at the street. */
function podiumTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#c8c0b4', 4021);
    g.fillStyle = '#2a3440';
    for (let x = 4; x < 128; x += 24) g.fillRect(x, 30, 18, 30);
    g.fillStyle = '#c8102e';
    g.fillRect(0, 24, 128, 4);
  });
}
