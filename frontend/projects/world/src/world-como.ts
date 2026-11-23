// Lake Como's shore road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the lake
// on a clear early-summer morning. The rider follows the road along the western shore: on the
// left a white stone balustrade with iron lamps stands above the still green water, where the
// white ferries cross between the villages and polished wooden launches cut their wakes; on the
// right a stone retaining wall holds up terraced gardens of azaleas, magnolias and cypresses,
// with ochre and rose villas and their loggias, and the wooded mountainside climbing steeply
// above. Across the water the mountains fall straight into the lake with villages at their
// feet, and ahead Bellagio's point with its villas divides the lake's arms. Built on the shared
// kit (world-kit.ts) on the pattern of Old Town's street.
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

/** The shore road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 380;
const BEHIND = 24;
/** The water lies WATER metres below the road. */
const WATER = 3.5;
/** The garden terrace stands TERRACE metres above the road, behind the retaining wall. */
const TERRACE = 1.4;

const STROLLER_WEAR = {
  tops: ['#ffffff', '#f4e4c8', '#2a4a7a', '#e88a7a', '#8ab0d0', '#1d1f24', '#c8a050'],
  bottoms: ['#e8e0d0', '#2f3e5c', '#1d1f24', '#8a7a64'],
  skins: ['#f0c8a0', '#f5d3b5', '#e2b48c', '#c48a5f'],
};

interface Boat {
  readonly mesh: Group;
  readonly lane: number;
  readonly z: number;
  readonly speed: number;
  readonly span: number;
  readonly phase: number;
}

export class ComoStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly strollers: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
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
    this.addShore(roadHalf, points);
    this.addHillside(roadHalf, points);
    this.addBalustrade(roadHalf);
    this.addGardens(roadHalf);
    this.addVillas(roadHalf);
    this.addStrollers(roadHalf);
    this.addLake(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The ferries and launches cross the lake, rocking gently.
    for (const b of this.boats) {
      const t = ((seconds * b.speed + b.phase) % (b.span * 2)) - b.span;
      b.mesh.position.set(b.lane, -WATER + 0.2 + Math.sin(seconds * 1.5 + b.phase) * 0.1, b.z + t);
      b.mesh.rotation.y = b.speed > 0 ? Math.PI : 0;
    }
    if (this.lake) this.lake.offset.set(seconds * 0.002, seconds * 0.003);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the road, under the lake's water. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 40);
      position.setY(i * 2 + 1, p.height - 40);
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
      this.strollers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = w.speed ? Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04 : 0;
        crowd.set(
          i,
          w.x,
          heightAt(metres) + step,
          -metres,
          w.speed > 0 ? 0 : w.speed < 0 ? Math.PI : -Math.PI / 2,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The lakeside promenade on the left and the sea wall dropping into the water. */
  private addShore(roadHalf: number, points: number): void {
    const r = roadHalf;
    const paving = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.85 });
    const wall = this.material({ map: this.repeat(stoneTexture(), 1.5, 1.5), roughness: 0.9 });
    this.ribbons.add(points, paving, [
      [-r, 0.12],
      [-r - 3.2, 0.12],
    ]);
    this.ribbons.add(points, wall, [
      [-r - 3.2, 0.12],
      [-r - 3.2, -WATER - 0.5],
    ]);
  }

  /** The retaining wall, the garden terrace, and the wooded mountainside above. */
  private addHillside(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.85 });
    const wall = this.material({ map: this.repeat(stoneTexture(), 1.5, 1.5), roughness: 0.9 });
    const lawn = this.material({ map: this.repeat(lawnTexture(), 4, 4), roughness: 1 });
    const forest = this.material({ map: this.repeat(forestTexture(), 12, 12), roughness: 1 });
    this.ribbons.add(points, kerb, [
      [r + 1.2, 0.12],
      [r, 0.12],
    ]);
    this.ribbons.add(points, wall, [
      [r + 1.2, TERRACE],
      [r + 1.2, 0.12],
    ]);
    this.ribbons.add(points, lawn, [
      [r + 22, TERRACE + 1.5],
      [r + 1.2, TERRACE],
    ]);
    this.ribbons.add(points, forest, [
      [r + 400, 520],
      [r + 80, 90],
      [r + 22, TERRACE + 1.5],
    ]);
  }

  /** The white balustrade and the iron lamps along the water's edge. */
  private addBalustrade(roadHalf: number): void {
    const white = this.material({ color: 0xf2eee4, roughness: 0.7 });
    const iron = this.material({ color: 0x1d2420, metalness: 0.5, roughness: 0.5 });
    const glow = this.material({ color: 0xfff4d8, emissive: 0xffe8b0, emissiveIntensity: 0.6 });
    const baluster = new CylinderGeometry(0.07, 0.1, 0.7, 6);
    baluster.translate(0, 0.47, 0);
    this.disposables.push(baluster);
    for (let offset = 0; offset < LOOP; offset += 6) {
      const run = new Group();
      const rail = new Mesh(this.unit, white);
      rail.scale.set(0.3, 0.14, 6);
      rail.position.y = 0.9;
      const plinth = new Mesh(this.unit, white);
      plinth.scale.set(0.34, 0.12, 6);
      plinth.position.y = 0.06;
      run.add(rail, plinth);
      for (let z = -2.75; z < 3; z += 0.5) {
        const b = new Mesh(baluster, white);
        b.position.z = z;
        run.add(b);
      }
      const pier = new Mesh(this.unit, white);
      pier.scale.set(0.45, 1.1, 0.45);
      pier.position.set(0, 0.55, -3);
      run.add(pier);
      if (offset % 18 === 0) {
        const post = new Mesh(this.unit, iron);
        post.scale.set(0.1, 3.6, 0.1);
        post.position.set(0, 2.9, -3);
        const lantern = new Mesh(this.unit, glow);
        lantern.scale.set(0.35, 0.5, 0.35);
        lantern.position.set(0, 4.9, -3);
        run.add(post, lantern);
      }
      run.position.y = 0.12;
      const holder = new Group();
      holder.add(run);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 3 });
    }
  }

  /** The terrace gardens: azaleas in flower, clipped bay, magnolias and dark cypresses. */
  private addGardens(roadHalf: number): void {
    const random = seeded(3101);
    const blooms = [0xf26aa8, 0xc84ab8, 0xff8aa0, 0xffffff, 0xe85a8a].map((c) =>
      this.material({ color: c, roughness: 0.9, flatShading: true }),
    );
    const dark = this.material({ color: 0x1e3a22, roughness: 1 });
    const glossy = this.material({ color: 0x2a5a2a, roughness: 0.6, flatShading: true });
    const bark = this.material({ color: 0x5a4a3a, roughness: 1 });
    const bush = new SphereGeometry(1, 8, 6);
    bush.scale(1.2, 0.8, 1.2);
    const spire = new ConeGeometry(0.9, 11, 8);
    spire.translate(0, 5.5, 0);
    const crown = new DodecahedronGeometry(2.4, 0);
    const trunk = new CylinderGeometry(0.2, 0.3, 3, 5);
    trunk.translate(0, 1.5, 0);
    this.disposables.push(bush, spire, crown, trunk);
    for (let offset = 0; offset < LOOP; offset += 1.5 + random() * 2.5) {
      const d = 1.8 + random() * 18;
      const kind = random();
      const plant = new Group();
      if (kind < 0.55) {
        const b = new Mesh(bush, blooms[Math.floor(random() * blooms.length)]!);
        b.scale.setScalar(0.6 + random() * 0.6);
        b.position.y = 0.4;
        plant.add(b);
      } else if (kind < 0.8) {
        plant.add(new Mesh(spire, dark));
        plant.scale.setScalar(0.8 + random() * 0.5);
      } else {
        const top = new Mesh(crown, glossy);
        top.position.y = 4;
        plant.add(new Mesh(trunk, bark), top);
      }
      plant.children.forEach((c) => (c.castShadow = true));
      plant.position.y = TERRACE + (d / 21) * 1.5;
      const holder = new Group();
      holder.add(plant);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 1.2 + d });
    }
  }

  /** Ochre and rose villas with green shutters, loggias and terracotta roofs above the gardens. */
  private addVillas(roadHalf: number): void {
    const random = seeded(3111);
    const fronts = ['#e8b878', '#e8a898', '#f2dcb0', '#d89a70', '#f4e8d8'].map((c, k) =>
      this.material({ map: this.track(villaTexture(c, k)), roughness: 0.85 }),
    );
    const tiles = this.material({ color: 0xa85a3a, roughness: 0.8 });
    const white = this.material({ color: 0xf2eee4, roughness: 0.7 });
    const hip = new ConeGeometry(1, 1, 4);
    hip.rotateY(Math.PI / 4);
    this.disposables.push(hip);
    for (let offset = 10; offset < LOOP; offset += 40 + random() * 35) {
      const villa = new Group();
      const w = 12 + random() * 6;
      const d = 16 + random() * 8;
      const h = 10 + random() * 5;
      const body = new Mesh(this.unit, fronts[Math.floor(random() * fronts.length)]!);
      body.scale.set(w, h, d);
      body.position.y = h / 2;
      const roof = new Mesh(hip, tiles);
      roof.scale.set(w * 0.76, 3, d * 0.76);
      roof.position.y = h + 1.5;
      // A loggia of white columns along the lake front.
      for (let z = -d / 2 + 1.5; z < d / 2 - 1; z += 3) {
        const column = new Mesh(this.unit, white);
        column.scale.set(0.5, 4, 0.5);
        column.position.set(-w / 2 - 1.5, 2, z);
        villa.add(column);
      }
      const loggia = new Mesh(this.unit, white);
      loggia.scale.set(3.4, 0.6, d - 1);
      loggia.position.set(-w / 2 - 1.3, 4.2, 0);
      villa.add(body, roof, loggia);
      villa.children.forEach((c) => (c.castShadow = true));
      villa.position.y = TERRACE + 1.2;
      const holder = new Group();
      holder.add(villa);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 16 + w / 2 });
    }
  }

  /** People strolling the promenade and leaning on the balustrade to look at the lake. */
  private addStrollers(roadHalf: number): void {
    const random = seeded(3121);
    for (let offset = 0; offset < LOOP; offset += 4 + random() * 8) {
      const leaning = random() < 0.3;
      this.strollers.push({
        offset,
        x: leaning ? -roadHalf - 2.6 : -roadHalf - 0.6 - random() * 1.8,
        speed: leaning ? 0 : (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.4),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.strollers.length,
      STROLLER_WEAR,
      3127,
    );
  }

  /**
   * The lake: green water, the white ferries and wooden launches crossing it, the mountains
   * falling straight into it opposite with their villages at the water, and Bellagio's point ahead.
   */
  private addLake(roadHalf: number): void {
    const random = seeded(3131);
    const ripple = this.track(lakeTexture());
    ripple.wrapS = RepeatWrapping;
    ripple.wrapT = RepeatWrapping;
    ripple.repeat.set(80, 80);
    this.lake = ripple;
    const water = new Mesh(
      new PlaneGeometry(4000, 6000),
      this.material({
        map: ripple,
        color: 0x5a9a8a,
        roughness: 0.12,
        metalness: 0.35,
        emissive: 0x16403a,
        emissiveIntensity: 0.35,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-2000 - roadHalf - 3.2, -WATER, -2000);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
    // The mountains across the lake, wooded, falling into the water; their villages at the shore.
    const wooded = this.material({
      map: this.repeat(forestTexture(), 40, 40),
      roughness: 1,
      flatShading: true,
    });
    const ridge = new ConeGeometry(1, 1, 8);
    this.disposables.push(ridge);
    for (let k = 0; k < 9; k++) {
      const m = new Mesh(ridge, wooded);
      const h = 500 + random() * 500;
      m.scale.set(500 + random() * 300, h, 400);
      m.position.set(-1000 - random() * 300, h / 2 - WATER - 10, 600 - k * 420);
      m.rotation.y = random();
      this.horizon.add(m);
    }
    const pastel = [0xf2dcb0, 0xe8a898, 0xe8b878, 0xf4e8d8, 0xd89a70].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    const tiles = this.material({ color: 0xa85a3a, roughness: 0.8 });
    for (const zc of [-200, -900, -1600]) {
      for (let k = 0; k < 14; k++) {
        const house = new Mesh(this.unit, pastel[k % pastel.length]!);
        const h = 8 + random() * 10;
        house.scale.set(10, h, 10 + random() * 8);
        const x = -560 - random() * 60;
        const z = zc + (random() - 0.5) * 160;
        house.position.set(x, h / 2 - WATER, z);
        const roof = new Mesh(this.unit, tiles);
        roof.scale.set(11, 1.2, house.scale.z + 1);
        roof.position.set(x, h - WATER + 0.6, z);
        this.horizon.add(house, roof);
      }
      const campanile = new Mesh(this.unit, pastel[0]!);
      campanile.scale.set(5, 30, 5);
      campanile.position.set(-580, 15 - WATER, zc);
      this.horizon.add(campanile);
    }
    // Bellagio's point ahead, its villas stepping up from the water under the wooded ridge.
    const point = new Mesh(ridge, wooded);
    point.scale.set(380, 200, 300);
    point.position.set(-320, 100 - WATER - 10, -1400);
    this.horizon.add(point);
    for (let k = 0; k < 24; k++) {
      const house = new Mesh(this.unit, pastel[k % pastel.length]!);
      const h = 10 + random() * 8;
      const a = random() * Math.PI;
      house.scale.set(12, h, 12);
      house.position.set(
        -320 + Math.cos(a) * (150 + random() * 40),
        h / 2 - WATER + random() * 30,
        -1400 + Math.sin(a) * 120 + 140,
      );
      this.horizon.add(house);
    }
    // The ferries and launches.
    const hull = this.material({ color: 0xf8f8f4, roughness: 0.4 });
    const band = this.material({ color: 0x2a5a9a, roughness: 0.5 });
    const varnish = this.material({ color: 0x8a4a24, roughness: 0.25, metalness: 0.2 });
    const deck = this.material({ color: 0xe8e8e4, roughness: 0.5 });
    for (let k = 0; k < 6; k++) {
      const ferry = k < 2;
      const boat = new Group();
      if (ferry) {
        const body = new Mesh(this.unit, hull);
        body.scale.set(8, 2.4, 40);
        const stripe = new Mesh(this.unit, band);
        stripe.scale.set(8.1, 0.6, 40.1);
        stripe.position.y = -0.6;
        const cabin = new Mesh(this.unit, deck);
        cabin.scale.set(6, 3, 24);
        cabin.position.y = 2.6;
        boat.add(body, stripe, cabin);
      } else {
        const body = new Mesh(this.unit, varnish);
        body.scale.set(2.2, 0.8, 7);
        const screen = new Mesh(this.unit, deck);
        screen.scale.set(2, 0.5, 0.2);
        screen.position.set(0, 0.6, -0.8);
        const wake = new Mesh(
          new PlaneGeometry(3, 18),
          this.material({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }),
        );
        wake.rotation.x = -Math.PI / 2;
        wake.position.set(0, -0.35, 12);
        this.disposables.push(wake.geometry);
        boat.add(body, screen, wake);
      }
      const lane = -roadHalf - (ferry ? 140 + random() * 200 : 30 + random() * 90);
      const speed = (random() < 0.5 ? 1 : -1) * (ferry ? 5 : 12 + random() * 6);
      this.boats.push({
        mesh: boat,
        lane,
        z: -300 - random() * 400,
        speed,
        span: 700,
        phase: random() * 1400,
      });
      this.horizon.add(boat);
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

/** Grey granite paving slabs. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a8a49c', 3141);
    g.fillStyle = 'rgba(60,58,54,0.35)';
    for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 2);
    for (let x = 0; x < 128; x += 48) g.fillRect(x, 0, 2, 128);
  });
}

/** The retaining walls' rough grey stone. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b4ae9e', 3151);
    const random = seeded(3153);
    g.fillStyle = 'rgba(40,40,36,0.4)';
    for (let y = 0; y < 128; y += 12 + random() * 6) {
      g.fillRect(0, y, 128, 2);
      for (let x = random() * 20; x < 128; x += 16 + random() * 16) g.fillRect(x, y, 2, 14);
    }
    g.fillStyle = 'rgba(60,100,50,0.4)';
    for (let i = 0; i < 20; i++) g.fillRect(random() * 128, random() * 128, 6 + random() * 10, 3);
  });
}

/** The gardens' lawn. */
function lawnTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#5a8a3a', 3161));
}

/** The mountainside's woods: chestnut and beech in deep greens. */
function forestTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#2e5a2a', 3171);
    const random = seeded(3173);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = ['#3a6a2e', '#24481f', '#4a7a36', '#5a7a3a'][Math.floor(random() * 4)]!;
      g.beginPath();
      g.arc(random() * 256, random() * 256, 3 + random() * 6, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** The lake's surface: green-blue with soft light ripples. */
function lakeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#3a7a72', 3181);
    const random = seeded(3183);
    for (let i = 0; i < 50; i++) {
      g.fillStyle = `rgba(230,250,245,${0.15 + random() * 0.3})`;
      g.fillRect(random() * 128, random() * 128, 6 + random() * 14, 1);
    }
  });
}

/** A villa's plastered front with green shutters and a cornice. */
function villaTexture(wall: string, k: number): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    speckle(g, 256, 128, wall, 3191 + k);
    for (const y of [22, 72])
      for (let x = 18; x < 256; x += 42) {
        g.fillStyle = '#2a3440';
        g.fillRect(x, y, 16, 30);
        g.fillStyle = '#3a6a4a';
        g.fillRect(x - 7, y, 7, 30);
        g.fillRect(x + 16, y, 7, 30);
        g.fillStyle = '#f2eee4';
        g.fillRect(x - 8, y - 4, 32, 3);
      }
    g.fillStyle = '#f2eee4';
    g.fillRect(0, 0, 256, 8);
  });
}
