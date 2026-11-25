// Hardknott Pass's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): England's
// steepest road on a grey, blustery Lake District day. The rider grinds up the narrow lane between
// dry-stone walls; bracken and rough grass climb the fellside on the right, and on the left the
// ground falls to Hardknott Gill with the Roman fort's ruined walls on a shoulder above Eskdale.
// The 30% warning sign stands at the foot, a cattle grid rattles under the wheels, Herdwick sheep
// graze among the boulders, walkers and riders pushing their bikes struggle on the ramps, and
// ahead the lane hairpins up the craggy fell into low cloud with the Scafells beyond. Built on
// the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
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
import { brackenTexture, cloudTexture, plateTexture, warningTexture } from './hardknott-textures';
import type { StreetPoint } from './world-oldtown';

/** The lane repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The warning sign and the cattle grid stand once a lap. */
const SIGN = 40;

const WALKER_WEAR = {
  tops: ['#c8302a', '#2f5a8a', '#ffd23f', '#2a6a4a', '#ff9f1c', '#5a3a6a', '#1d1f24'],
  bottoms: ['#1d1f24', '#3a3a3e', '#4a4030', '#2f3e5c'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#f5d3b5', '#8d5a3b'],
};

interface Walker {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

export class HardknottStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly walkers: Walker[] = [];
  private crowd: Figures | null = null;
  private readonly clouds: Mesh[] = [];
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
    this.addFellside(roadHalf, points);
    this.addSign(roadHalf);
    this.addBoulders(roadHalf);
    this.addSheep(roadHalf);
    this.addWalkers(roadHalf);
    this.addFells();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // Low cloud drags across the crags on the wind.
    this.clouds.forEach((c, k) => (c.position.x = ((seconds * (6 + k) + k * 400) % 2400) - 1200));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the lane, so the fellside falls away into the gill. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 120);
      position.setY(i * 2 + 1, p.height - 120);
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
        const step = Math.abs(Math.sin(this.time * 3 + w.phase)) * 0.04;
        crowd.set(i, w.x, heightAt(metres) + step, -metres, 0, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The verges, the dry-stone walls both sides, the bracken fell rising right and falling left to the gill. */
  private addFellside(roadHalf: number, points: number): void {
    const r = roadHalf;
    const fell = this.material({ map: this.repeat(brackenTexture(), 8, 8), roughness: 1 });
    const verge = this.material({ map: this.repeat(grassTexture(), 2, 2), roughness: 1 });
    const wall = this.material({ map: this.repeat(wallTexture(), 1.2, 1.2), roughness: 0.95 });
    const scree = this.material({ map: this.repeat(screeTexture(), 30, 30), roughness: 1 });
    const gill = this.material({ color: 0x6a7a84, roughness: 0.15, metalness: 0.3 });
    this.ribbons.add(points, fell, [
      [r + 220, 110],
      [r + 40, 22],
      [r + 2.6, 1.2],
    ]);
    this.ribbons.add(points, wall, [
      [r + 2.6, 1.2],
      [r + 2, 1.25],
      [r + 1.4, 1.2],
      [r + 1.4, 0.02],
    ]);
    this.ribbons.add(points, verge, [
      [r + 1.4, 0.02],
      [r, 0.004],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.004],
      [-r - 1.2, 0.02],
    ]);
    this.ribbons.add(points, wall, [
      [-r - 1.2, 0.02],
      [-r - 1.2, 1.1],
      [-r - 1.8, 1.15],
      [-r - 2.4, 1.1],
      [-r - 2.4, -0.4],
    ]);
    this.ribbons.add(points, fell, [
      [-r - 2.4, -0.4],
      [-r - 60, -26],
      [-r - 90, -36],
    ]);
    this.ribbons.add(points, gill, [
      [-r - 90, -36],
      [-r - 98, -36.2],
    ]);
    this.ribbons.add(points, scree, [
      [-r - 98, -36.2],
      [-r - 220, -10],
      [-r - 600, 90],
    ]);
  }

  /** The 30% warning sign at the foot of the ramp and the cattle grid across the lane. */
  private addSign(roadHalf: number): void {
    const corner = new Group();
    const post = new Mesh(
      this.unit,
      this.material({ color: 0x9a9a98, metalness: 0.4, roughness: 0.5 }),
    );
    post.scale.set(0.08, 2.2, 0.08);
    post.position.y = 1.1;
    const plate = new Mesh(
      new PlaneGeometry(1.1, 1.0),
      this.material({ map: this.track(warningTexture()), transparent: true, roughness: 0.5 }),
    );
    plate.position.y = 2.4;
    const below = new Mesh(
      new PlaneGeometry(1.3, 0.55),
      this.material({ map: this.track(plateTexture()), roughness: 0.5 }),
    );
    below.position.y = 1.6;
    this.disposables.push(plate.geometry, below.geometry);
    corner.add(post, plate, below);
    corner.rotation.y = 0.25;
    this.group.add(corner);
    this.props.push({ mesh: corner, offset: SIGN, x: -roadHalf - 0.7 });
    const grid = new Group();
    const bar = new BoxGeometry(roadHalf * 2, 0.05, 0.08);
    bar.translate(0, 0.02, 0);
    this.disposables.push(bar);
    const steel = this.material({ color: 0x4a4a4c, metalness: 0.6, roughness: 0.5 });
    const pit = new Mesh(this.unit, this.material({ color: 0x1d1f24 }));
    pit.scale.set(roadHalf * 2, 0.02, 2.4);
    grid.add(pit);
    for (let z = -1.1; z <= 1.1; z += 0.2) {
      const b = new Mesh(bar, steel);
      b.position.z = z;
      grid.add(b);
    }
    this.group.add(grid);
    this.props.push({ mesh: grid, offset: SIGN + 14, x: 0 });
  }

  /** Lichened boulders and outcrops scattered on the fellside. */
  private addBoulders(roadHalf: number): void {
    const random = seeded(2301);
    const stone = this.material({
      map: this.repeat(screeTexture(), 1, 1),
      color: 0xa8a8a0,
      roughness: 1,
      flatShading: true,
    });
    const rock = new DodecahedronGeometry(1, 0);
    this.disposables.push(rock);
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 6) {
      const right = random() < 0.6;
      const d = right ? 3 + random() * 36 : 3.5 + random() * 50;
      const holder = new Group();
      const b = new Mesh(rock, stone);
      const size = 0.4 + random() ** 2 * 3;
      b.scale.set(size * (1 + random()), size * 0.7, size);
      b.rotation.set(random(), random() * 6, random());
      b.position.y = right ? 1.2 + (d - 2.6) * (20.8 / 37.4) : -0.4 - (d - 2.4) * (25.6 / 57.6);
      b.castShadow = true;
      holder.add(b);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: right ? roadHalf + d : -roadHalf - d });
    }
  }

  /** Herdwicks: grey fleeces and white faces, grazing among the rocks and on the verges. */
  private addSheep(roadHalf: number): void {
    const random = seeded(2311);
    const fleece = this.material({ color: 0x6a6460, roughness: 1 });
    const face = this.material({ color: 0xf0ece4, roughness: 0.9 });
    const body = new SphereGeometry(0.55, 8, 6);
    body.scale(0.8, 0.7, 1.2);
    body.translate(0, 0.7, 0);
    const head = new SphereGeometry(0.2, 6, 5);
    head.scale(1, 1.1, 1.5);
    head.translate(0, 0.85, -0.72);
    this.disposables.push(body, head);
    for (let offset = 0; offset < LOOP; offset += 4 + random() * 12) {
      const right = random() < 0.55;
      const d = right ? 3 + random() * 26 : 3 + random() * 40;
      const sheep = new Group();
      sheep.add(new Mesh(body, fleece), new Mesh(head, face));
      sheep.rotation.y = random() * 6;
      sheep.scale.setScalar(1.3);
      sheep.position.y = right ? 1.2 + (d - 2.6) * (20.8 / 37.4) : -0.4 - (d - 2.4) * (25.6 / 57.6);
      sheep.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(sheep);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: right ? roadHalf + d : -roadHalf - d });
    }
  }

  /** Walkers in bright waterproofs plodding up the verges, with the odd rider pushing a bike. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(2321);
    for (let offset = 8; offset < LOOP; offset += 10 + random() * 22) {
      const group = random() < 0.4 ? 2 : 1;
      for (let k = 0; k < group; k++)
        this.walkers.push({
          offset: offset + k * 1.4,
          x: (random() < 0.5 ? -1 : 1) * (roadHalf - 0.4 - random() * 0.4),
          speed: 0.7 + random() * 0.3,
          phase: random() * 6,
        });
    }
    this.crowd = new Figures(this.group, this.disposables, this.walkers.length, WALKER_WEAR, 2327);
  }

  /**
   * The fells ahead: the lane's hairpins up the craggy head of the pass, low cloud dragging over
   * it, the Scafells' grey crags beyond, and Hardknott Roman Fort's walls on the shoulder left.
   */
  private addFells(): void {
    const random = seeded(2331);
    const face = new Mesh(
      new PlaneGeometry(2600, 520),
      this.material({ map: this.track(passTexture()), roughness: 1 }),
    );
    this.disposables.push(face.geometry);
    face.position.set(60, 130, -1250);
    face.rotation.x = -0.25;
    this.horizon.add(face);
    const crag = this.material({
      map: this.repeat(screeTexture(), 50, 50),
      color: 0x8a8a84,
      roughness: 1,
      flatShading: true,
    });
    const peak = new ConeGeometry(1, 1, 6);
    this.disposables.push(peak);
    for (let k = 0; k < 8; k++) {
      const m = new Mesh(peak, crag);
      const h = 260 + random() * 240;
      m.scale.set(220 + random() * 180, h, 200);
      m.position.set(-1000 + k * 280 + random() * 80, 250 + h / 2 - 100, -1650);
      m.rotation.y = random();
      this.horizon.add(m);
    }
    // Ridges across the gill on the left and up the fell on the right, closing the view.
    const hump = new ConeGeometry(1, 1, 14);
    this.disposables.push(hump);
    const brown = this.material({
      map: this.repeat(brackenTexture(), 30, 30),
      color: 0xa0b070,
      roughness: 1,
    });
    for (const [x, z, sx, sy] of [
      [-420, -300, 160, 200],
      [-460, -900, 200, 260],
      [-420, -1500, 180, 240],
      [480, -500, 180, 260],
      [520, -1200, 220, 300],
    ] as const) {
      const h = new Mesh(hump, brown);
      h.scale.set(sx, sy, 420);
      h.position.set(x, -40 + sy / 2, z);
      this.horizon.add(h);
    }
    // The Roman fort's square of low ruined walls on the shoulder above Eskdale.
    const ruin = this.material({
      map: this.repeat(wallTexture(), 0.2, 0.2),
      color: 0xb0aca0,
      roughness: 1,
    });
    const fort = new Group();
    for (const [x, z, w, d] of [
      [0, -40, 80, 3],
      [0, 40, 80, 3],
      [-40, 0, 3, 80],
      [40, 0, 3, 80],
      [0, 0, 14, 10],
    ] as const) {
      const wall = new Mesh(this.unit, ruin);
      wall.scale.set(w, 2.2, d);
      wall.position.set(x, 1.1, z);
      fort.add(wall);
    }
    fort.position.set(-200, -6, -380);
    fort.rotation.y = 0.3;
    this.horizon.add(fort);
    // Low cloud on the crags.
    const mist = new PlaneGeometry(900, 140);
    this.disposables.push(mist);
    for (let k = 0; k < 3; k++) {
      const cloud = new Mesh(
        mist,
        this.material({
          map: this.track(cloudTexture()),
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
          color: 0xe8ecf0,
        }),
      );
      cloud.position.set(0, 330 + k * 60, -1300 - k * 150);
      this.clouds.push(cloud);
      this.horizon.add(cloud);
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

/** Short sheep-cropped grass on the verges. */
function grassTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#5a7a3a', 2351));
}

/** Dry-stone wall: slate-grey stones laid flat, lichen on top. */
function wallTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a7a76', 2361);
    const random = seeded(2363);
    for (let y = 0; y < 128; y += 7 + random() * 5)
      for (let x = 0; x < 128; x += 10 + random() * 16) {
        g.fillStyle = `rgba(${random() < 0.2 ? '150,160,90' : '40,40,40'},${0.3 + random() * 0.3})`;
        g.fillRect(x, y, 2, 6);
        g.fillRect(x, y + 6, 14, 1);
      }
  });
}

/** Grey scree and crag. */
function screeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a7a74', 2371);
    const random = seeded(2373);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '40,40,40' : '170,170,160'},0.35)`;
      g.fillRect(random() * 128, random() * 128, 2 + random() * 8, 2 + random() * 5);
    }
  });
}

/** The head of the pass: bracken giving way to crag, the lane hairpinning up to the top. */
function passTexture(): CanvasTexture {
  return canvasTexture(1024, 512, (g) => {
    const fall = g.createLinearGradient(0, 512, 0, 0);
    fall.addColorStop(0, '#6a7240');
    fall.addColorStop(0.5, '#7a6a48');
    fall.addColorStop(0.8, '#7a7a74');
    fall.addColorStop(1, '#8a8a86');
    g.fillStyle = fall;
    g.fillRect(0, 0, 1024, 512);
    const random = seeded(2391);
    for (let i = 0; i < 600; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '40,40,36' : '150,90,40'},${0.08 + random() * 0.14})`;
      g.fillRect(random() * 1024, random() * 512, 4 + random() * 20, 2 + random() * 6);
    }
    // The lane's tight hairpins up to the top, with its walls.
    let y = 500;
    let fromLeft = true;
    const path: [number, number][] = [[470, y]];
    while (y > 120) {
      y -= 30 + random() * 20;
      path.push([fromLeft ? 590 + random() * 30 : 430 - random() * 30, y]);
      fromLeft = !fromLeft;
    }
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const [width, colour] of [
      [10, '#8a8a84'],
      [6, '#4a4a4e'],
    ] as const) {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.beginPath();
      path.forEach(([x, py], k) => (k ? g.lineTo(x, py) : g.moveTo(x, py)));
      g.stroke();
    }
  });
}
