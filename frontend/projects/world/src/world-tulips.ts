// Dutch Tulip Fields' road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the bulb
// country near Lisse on a bright April morning. The rider takes a narrow brick-red cycle road
// across the polder; reed-edged ditches run beside it, and beyond them the bulb fields stretch flat
// to the horizon in long stripes of red, yellow, pink, white and purple. Windmills turn their sails
// across the fields, one close by the road once a lap, farmhouses with their bulb barns stand among
// rows of poplars, and fellow cyclists pedal upright Dutch bikes both ways. Built on the shared
// kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  TorusGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  bob,
  canvasTexture,
  Figures,
  loopFade,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The cyclists' speeds in m/s: riding away from the rider, and towards them. */
const OUT_SPEED = 3.75;
const IN_SPEED = 5;
/** The grass verge, the ditch, and where the fields begin, both sides. */
const VERGE = 2.5;
const DITCH = 3;
const FIELD = VERGE + DITCH + 0.8;
/** The mill by the road once a lap. */
const MILL = 160;

const CYCLIST_WEAR = {
  tops: ['#ff9f1c', '#ffffff', '#3a86ff', '#ff6b5a', '#2a7a4a', '#ffd23f', '#1d1f24', '#f15bb5'],
  bottoms: ['#2f3e5c', '#1d1f24', '#e8c9a0', '#5a5f69'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b'],
};

interface Cyclist {
  readonly bike: Mesh;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

export class TulipsStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly cyclists: Cyclist[] = [];
  private riders: Figures | null = null;
  private readonly sails: Group[] = [];
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
    this.addFields(roadHalf, points);
    this.addReeds(roadHalf);
    this.addMill(roadHalf);
    this.addCyclists(roadHalf);
    this.addPolder();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.sails.forEach((s, k) => (s.rotation.z = -seconds * (0.5 + (k % 3) * 0.08) - k));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const riders = this.riders;
    if (riders) {
      this.cyclists.forEach((c, i) => {
        const metres = loopMetres(c.offset + c.speed * this.time, s, LOOP, BEHIND);
        const y = heightAt(metres);
        const heading = c.speed > 0 ? 0 : Math.PI;
        c.bike.position.set(c.x, y, -metres);
        c.bike.rotation.set(0, heading, 0);
        const shown = loopFade(metres, LOOP, BEHIND);
        c.bike.scale.setScalar(shown);
        riders.set(
          i,
          c.x,
          y + 0.25,
          -metres,
          heading,
          0.95 * shown,
          bob(this.time * 3 + c.phase) * 0.02,
        );
      });
      riders.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The verges, the ditches, and the striped bulb fields running to the horizon both sides. */
  private addFields(roadHalf: number, points: number): void {
    const r = roadHalf;
    const grass = this.material({ map: this.repeat(grassTexture(), 3, 3), roughness: 1 });
    const bank = this.material({
      map: this.repeat(grassTexture(), 3, 3),
      color: 0x8a9a6a,
      roughness: 1,
    });
    const water = this.material({
      map: this.repeat(ditchTexture(), 4, 8),
      roughness: 0.1,
      metalness: 0.3,
    });
    const near = this.material({ map: this.repeat(stripesTexture(1801), 60, 6), roughness: 0.9 });
    const far = this.material({ map: this.repeat(stripesTexture(1803), 90, 6), roughness: 0.9 });
    for (const side of [-1, 1] as const) {
      const lay = (profile: [number, number][], material: MeshStandardMaterial) => {
        const mirrored = profile.map(([x, y]) => [side * x, y] as [number, number]);
        this.ribbons.add(points, material, side > 0 ? [...mirrored].reverse() : mirrored);
      };
      lay(
        [
          [r, 0.006],
          [r + VERGE, 0.02],
          [r + VERGE + 0.6, -0.5],
        ],
        grass,
      );
      lay(
        [
          [r + VERGE + 0.6, -0.5],
          [r + VERGE + DITCH - 0.4, -0.5],
        ],
        water,
      );
      lay(
        [
          [r + VERGE + DITCH - 0.4, -0.5],
          [r + FIELD, 0.05],
        ],
        bank,
      );
      lay(
        [
          [r + FIELD, 0.05],
          [r + FIELD + 160, 0.05],
        ],
        side < 0 ? near : far,
      );
      lay(
        [
          [r + FIELD + 160, 0.05],
          [r + FIELD + 1400, 0.05],
        ],
        side < 0 ? far : near,
      );
    }
  }

  /** Reeds and the odd willow along the ditches. */
  private addReeds(roadHalf: number): void {
    const random = seeded(1811);
    const reed = this.material({ color: 0x8a9a4a, roughness: 1 });
    const bark = this.material({ color: 0x5a4a3a, roughness: 1 });
    const willow = this.material({ color: 0x7a9a5a, roughness: 0.95 });
    const parts: BufferGeometry[] = [];
    for (let k = 0; k < 24; k++) {
      const blade = new ConeGeometry(0.04, 1.4 + random() * 0.6, 3);
      blade.translate(random() * 0.6 - 0.3, 0.7, -random() * 6);
      parts.push(blade);
    }
    const clump = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const trunk = new CylinderGeometry(0.3, 0.4, 2.4, 6);
    trunk.translate(0, 1.2, 0);
    const crown = new SphereGeometry(2.2, 8, 6);
    crown.scale(1, 0.8, 1);
    crown.translate(0, 3.4, 0);
    this.disposables.push(clump, trunk, crown);
    for (let offset = 0; offset < LOOP; offset += 4 + random() * 10) {
      const side = random() < 0.5 ? -1 : 1;
      const holder = new Group();
      if (random() < 0.12) {
        holder.add(new Mesh(trunk, bark), new Mesh(crown, willow));
      } else {
        holder.add(new Mesh(clump, reed));
        holder.position.y = -0.5;
      }
      holder.children.forEach((c) => (c.castShadow = true));
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset,
        x: side * (roadHalf + VERGE + 0.8 + random() * 0.4),
      });
    }
  }

  /** A windmill close by the road once a lap: its thatched octagon, white-trimmed cap and sails. */
  private addMill(roadHalf: number): void {
    const mill = this.windmill(1.4);
    this.group.add(mill);
    this.props.push({ mesh: mill, offset: MILL, x: -roadHalf - FIELD - 26 });
  }

  /** A windmill: a tapering octagonal body, its cap and stage, and four lattice sails. */
  private windmill(scale: number): Group {
    const thatch = this.material({ map: this.track(thatchTexture()), roughness: 1 });
    const brick = this.material({ color: 0x7a3a2a, roughness: 0.9 });
    const white = this.material({ color: 0xf2f0ea, roughness: 0.7 });
    const green = this.material({ color: 0x2a5a3a, roughness: 0.7 });
    const sailMat = this.material({
      map: this.track(sailTexture()),
      roughness: 0.8,
      side: 2,
      transparent: true,
    });
    const mill = new Group();
    const base = new Mesh(new CylinderGeometry(4.2, 4.6, 4, 8), brick);
    base.position.y = 2;
    const body = new Mesh(new CylinderGeometry(2.6, 4.2, 12, 8), thatch);
    body.position.y = 10;
    const stage = new Mesh(new CylinderGeometry(5.2, 5.2, 0.3, 8), white);
    stage.position.y = 4.2;
    const cap = new Mesh(new SphereGeometry(3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), green);
    cap.scale.set(1, 0.7, 1.3);
    cap.position.y = 16;
    const door = new Mesh(this.unit, green);
    door.scale.set(1.4, 2.4, 0.2);
    door.position.set(0, 1.4, 4.5);
    this.disposables.push(base.geometry, body.geometry, stage.geometry, cap.geometry);
    const sails = new Group();
    const blade = new BoxGeometry(1.8, 11, 0.08);
    blade.translate(0.9, 6, 0);
    const stock = new BoxGeometry(0.3, 23, 0.3);
    this.disposables.push(blade, stock);
    for (let k = 0; k < 4; k++) {
      const arm = new Group();
      arm.add(new Mesh(blade, sailMat));
      arm.rotation.z = (k * Math.PI) / 2;
      sails.add(arm);
    }
    sails.add(new Mesh(stock, white));
    const crossed = new Mesh(stock, white);
    crossed.rotation.z = Math.PI / 2;
    sails.add(crossed);
    sails.position.set(0, 16.5, 3.6);
    this.sails.push(sails);
    mill.add(base, body, stage, cap, door, sails);
    mill.children.forEach((c) => (c.castShadow = true));
    mill.rotation.y = 0.45;
    mill.scale.setScalar(scale);
    return mill;
  }

  /** Fellow cyclists on upright Dutch bikes, both ways along the road, 14 m or more apart. */
  private addCyclists(roadHalf: number): void {
    const random = seeded(1817);
    const frames = [0x1d1f24, 0x2a5a3a, 0x7a1a2a, 0x2a3a6a].map((c) =>
      this.material({ color: c, metalness: 0.4, roughness: 0.5 }),
    );
    const bike = dutchBikeGeometry();
    this.disposables.push(bike);
    for (let offset = 10; offset < LOOP; offset += 14 + random() * 22) {
      const out = random() < 0.6;
      const mesh = new Mesh(bike, frames[Math.floor(random() * 4)]!);
      mesh.castShadow = true;
      this.group.add(mesh);
      this.cyclists.push({
        bike: mesh,
        offset,
        x: out ? roadHalf - 0.7 - random() * 0.8 : -roadHalf + 0.8,
        // Each way rides at one speed, so no cyclist rides through another (#914).
        speed: out ? OUT_SPEED : -IN_SPEED,
        phase: random() * 6,
      });
    }
    this.riders = new Figures(
      this.group,
      this.disposables,
      this.cyclists.length,
      CYCLIST_WEAR,
      1823,
    );
  }

  /** The polder's far side: windmills across the fields, farms with bulb barns, and rows of poplars. */
  private addPolder(): void {
    const random = seeded(1831);
    for (const [x, z, s] of [
      [-260, -520, 1.3],
      [340, -700, 1.4],
      [-520, -1100, 1.6],
      [180, -1350, 1.5],
      [620, -1000, 1.3],
    ] as const) {
      const mill = this.windmill(s);
      mill.position.set(x, 0, z);
      this.horizon.add(mill);
    }
    const brick = this.material({ color: 0x8a3a2a, roughness: 0.9 });
    const tiles = this.material({ color: 0x3a3a40, roughness: 0.7 });
    const barn = this.material({ color: 0x2a4a3a, roughness: 0.8 });
    const poplar = this.material({ color: 0x4a7a3a, roughness: 0.95 });
    const roof = new ConeGeometry(1, 1, 4);
    roof.rotateY(Math.PI / 4);
    const crown = new SphereGeometry(1, 8, 6);
    crown.scale(1, 4, 1);
    this.disposables.push(roof, crown);
    for (let k = 0; k < 8; k++) {
      const side = k % 2 ? 1 : -1;
      const farm = new Group();
      const house = new Mesh(this.unit, brick);
      house.scale.set(9, 5, 12);
      house.position.y = 2.5;
      const top = new Mesh(roof, tiles);
      top.scale.set(9, 6, 11);
      top.position.y = 8;
      const shed = new Mesh(this.unit, barn);
      shed.scale.set(14, 6, 30);
      shed.position.set(16, 3, -6);
      const shedTop = new Mesh(roof, tiles);
      shedTop.scale.set(13, 5, 28);
      shedTop.position.set(16, 8.5, -6);
      farm.add(house, top, shed, shedTop);
      for (let j = 0; j < 9; j++) {
        const tree = new Mesh(crown, poplar);
        tree.scale.set(2.2, 4.5, 2.2);
        tree.position.set(-10, 15, -20 + j * 6);
        farm.add(tree);
      }
      farm.position.set(side * (150 + random() * 400), 0, -300 - k * 160 - random() * 80);
      this.horizon.add(farm);
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

/** An upright Dutch bike, along z: big wheels, a step-through frame, a rack and swept bars. */
function dutchBikeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const z of [-0.55, 0.55]) {
    const wheel = new TorusGeometry(0.36, 0.025, 4, 18);
    wheel.rotateY(Math.PI / 2);
    wheel.translate(0, 0.37, z);
    parts.push(wheel);
  }
  const tube = (length: number, y: number, z: number, tilt: number) => {
    const t = new CylinderGeometry(0.025, 0.025, length, 5);
    t.rotateX(tilt);
    t.translate(0, y, z);
    parts.push(t);
  };
  tube(0.75, 0.55, -0.1, 1.0);
  tube(0.65, 0.62, 0.22, 0.25);
  tube(0.7, 0.75, -0.48, -0.2);
  const rack = new BoxGeometry(0.2, 0.03, 0.4);
  rack.translate(0, 0.78, 0.48);
  const saddle = new BoxGeometry(0.14, 0.05, 0.22);
  saddle.translate(0, 0.98, 0.25);
  const bars = new BoxGeometry(0.55, 0.03, 0.03);
  bars.translate(0, 1.08, -0.5);
  parts.push(rack, saddle, bars);
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Polder grass. */
function grassTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#5a8a3a', 1837));
}

/** A ditch's still water, reflecting the sky, with duckweed. */
function ditchTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a7a9a', 1841);
    const random = seeded(1843);
    g.fillStyle = 'rgba(120,160,60,0.5)';
    for (let i = 0; i < 40; i++)
      g.fillRect(random() * 128, random() * 128, 4 + random() * 10, 2 + random() * 4);
  });
}

/**
 * Bulb fields across: long stripes of tulips in red, yellow, pink, white and purple, with the
 * green rows and the brown paths between the beds.
 */
function stripesTexture(seed: number): CanvasTexture {
  const colours = ['#e8202a', '#ffd21a', '#ff6aa8', '#f4f2ee', '#8a3ab8', '#ff8a1a', '#c8102e'];
  return canvasTexture(512, 64, (g) => {
    const random = seeded(seed);
    let x = 0;
    while (x < 512) {
      const w = 26 + random() * 30;
      const c = colours[Math.floor(random() * colours.length)]!;
      g.fillStyle = c;
      g.fillRect(x, 0, w, 64);
      // Flecks of leaf among the blooms.
      g.fillStyle = 'rgba(40,90,30,0.35)';
      for (let i = 0; i < w * 3; i++) g.fillRect(x + random() * w, random() * 64, 1.5, 1.5);
      x += w;
      g.fillStyle = random() < 0.4 ? '#7a5a3a' : '#3a6a2a';
      g.fillRect(x, 0, 4, 64);
      x += 4;
    }
  });
}

/** A mill's thatch, in vertical straw. */
function thatchTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#6a5a40', 1847);
    g.fillStyle = 'rgba(30,25,15,0.35)';
    for (let x = 0; x < 64; x += 3) g.fillRect(x, 0, 1, 128);
  });
}

/** A sail's lattice, white-framed. */
function sailTexture(): CanvasTexture {
  return canvasTexture(32, 128, (g) => {
    g.clearRect(0, 0, 32, 128);
    g.fillStyle = '#f2f0ea';
    for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 32, 2);
    g.fillRect(0, 0, 3, 128);
    g.fillRect(29, 0, 3, 128);
    g.fillStyle = 'rgba(200,190,170,0.5)';
    g.fillRect(3, 0, 26, 128);
  });
}
