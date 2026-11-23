// Els Àngels, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the pros' favourite
// training climb above Girona on a crisp, sunny winter morning of training-camp season. The rider
// winds up the smooth, narrow road through the Mediterranean forest, cork oaks with their
// stripped red trunks, holm oaks and stone pines, past low drystone walls and the white posts of
// the bends. Painted kilometre stones count down to the sanctuary, Catalan flags hang from a
// farmhouse balcony, and a few locals watch from the bends. Off to the left the hillside falls
// away to the plain where Girona's old town stands on the Onyar, its coloured houses below the
// cathedral's great façade and bell tower, and far beyond, the snowy Pyrenees close the horizon.
// Ahead, the Santuari dels Àngels' stone church sits on the summit among the trees. Built on the
// shared kit (world-kit.ts) on the pattern of Old Town's street.
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

/** The climb repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The plain lies PLAIN metres below the road. */
const PLAIN = 160;

/** The colours of the houses on the Onyar. */
const ONYAR = ['#d8783a', '#e8b84a', '#c8483a', '#f0d8a8', '#a85a3a', '#e8a070', '#f0e0c0'];

const LOCAL_WEAR = {
  tops: ['#d8102e', '#ffd23f', '#1d1f24', '#2a6a9a', '#ffffff', '#3a8a5a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#f5d3b5', '#8d5a3b'],
};

/** The wooded slope's height at a distance d beyond the uphill verge. */
function upslope(d: number): number {
  return 0.3 + Math.max(0, d - 3) * 0.45;
}

export class AngelsStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; phase: number }[] = [];
  private crowd: Figures | null = null;
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
    this.addRoad(roadHalf, points);
    this.addForest(roadHalf);
    this.addRoadside(roadHalf);
    this.addFarmhouse(roadHalf);
    this.addLocals(roadHalf);
    this.addGirona();
    this.addSanctuary();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((f, k) => (f.rotation.x = Math.sin(seconds * 1.6 + k) * 0.08));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops to the plain below the hillside on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - PLAIN - 10);
      position.setY(i * 2 + 1, p.height - PLAIN - 10);
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
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        // The locals turn to watch the riders go by, clapping now and then.
        const heading =
          (p.x < 0 ? -Math.PI / 2 : Math.PI / 2) + Math.sin(this.time * 0.5 + p.phase) * 0.6;
        const clap = Math.max(0, Math.sin(this.time * 3 + p.phase)) * 0.04;
        crowd.set(i, p.x, heightAt(metres) + clap, -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The smooth road, its verges, the wooded slope above and the hillside falling to the plain. */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.85 });
    const verge = this.material({ map: this.repeat(vergeTexture(), 2, 2), roughness: 1 });
    const floor = this.material({ map: this.repeat(forestFloorTexture(), 8, 8), roughness: 1 });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, verge, [
      [r + 3, upslope(3)],
      [r, 0.02],
    ]);
    this.ribbons.add(
      points,
      floor,
      [200, 40, 3].map((d) => [r + d, upslope(d)] as [number, number]),
    );
    this.ribbons.add(points, verge, [
      [-r, 0.02],
      [-r - 2, -0.2],
    ]);
    this.ribbons.add(points, floor, [
      [-r - 2, -0.2],
      [-r - 30, -12],
      [-r - 120, -70],
      [-r - 300, -PLAIN],
    ]);
  }

  /** Cork oaks with their stripped red trunks, holm oaks and stone pines either side. */
  private addForest(roadHalf: number): void {
    const random = seeded(5901);
    const cork = this.material({ color: 0xa84a2a, roughness: 1 });
    const bark = this.material({ color: 0x4a3e34, roughness: 1 });
    const holm = [0x3a5a2e, 0x2e4e28, 0x46663a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const pine = [0x3a6a34, 0x4a7a3a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const trunk = new CylinderGeometry(0.25, 0.4, 5, 6);
    trunk.translate(0, 2.5, 0);
    const crown = new DodecahedronGeometry(2.8, 1);
    crown.scale(1.2, 0.85, 1.2);
    const tall = new CylinderGeometry(0.2, 0.32, 11, 6);
    tall.translate(0, 5.5, 0);
    const umbrella = new SphereGeometry(4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    umbrella.scale(1.2, 0.55, 1.2);
    this.disposables.push(trunk, crown, tall, umbrella);
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 5)
      for (const side of [-1, 1]) {
        // The downhill side is thinner, opening the view over the plain.
        if (random() < (side < 0 ? 0.75 : 0.3)) continue;
        const d = side < 0 ? 6 + random() * 22 : 4 + random() * 34;
        const tree = new Group();
        if (random() < 0.25) {
          tree.add(new Mesh(tall, bark));
          const c = new Mesh(umbrella, pine[Math.floor(random() * pine.length)]!);
          c.position.y = 10.6;
          tree.add(c);
        } else {
          // Cork oaks stripped to their red trunks, the rest holm oaks.
          tree.add(new Mesh(trunk, random() < 0.45 ? cork : bark));
          const c = new Mesh(crown, holm[Math.floor(random() * holm.length)]!);
          c.position.y = 5.6;
          tree.add(c);
        }
        tree.scale.setScalar(0.85 + random() * 0.4);
        tree.rotation.y = random() * 6;
        tree.children.forEach((m) => (m.castShadow = true));
        tree.position.y = side > 0 ? upslope(d) : -0.2 - (d - 2) * (11.8 / 28);
        const holder = new Group();
        holder.add(tree);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
      }
  }

  /** Drystone walls, the white bend posts and the painted kilometre stones. */
  private addRoadside(roadHalf: number): void {
    const stone = this.material({ map: this.repeat(drystoneTexture(), 0.5, 0.5), roughness: 1 });
    for (let offset = 0; offset < LOOP; offset += 10) {
      if (offset % 90 >= 60) continue;
      const wall = new Mesh(this.unit, stone);
      wall.scale.set(0.6, 0.9, 10);
      wall.position.y = 0.45;
      wall.castShadow = true;
      const holder = new Group();
      holder.add(wall);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: offset + 5, x: roadHalf + 2.4 });
    }
    const white = this.material({ color: 0xf4f4f0, roughness: 0.6 });
    const red = this.material({ color: 0xd8202a, roughness: 0.6 });
    for (let offset = 0; offset < LOOP; offset += 14) {
      const post = new Group();
      const body = new Mesh(this.unit, white);
      body.scale.set(0.14, 1, 0.14);
      body.position.y = 0.5;
      const band = new Mesh(this.unit, red);
      band.scale.set(0.15, 0.12, 0.15);
      band.position.y = 0.85;
      post.add(body, band);
      const holder = new Group();
      holder.add(post);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 0.8 });
    }
    const km = this.material({ map: this.track(kmStoneTexture()), roughness: 0.8 });
    for (const offset of [70, 250]) {
      const block = new Mesh(this.unit, km);
      block.scale.set(0.3, 0.9, 0.6);
      block.position.y = 0.45;
      block.castShadow = true;
      const holder = new Group();
      holder.add(block);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 0.9 });
    }
  }

  /** A stone farmhouse by the road, the senyera hanging from its balcony. */
  private addFarmhouse(roadHalf: number): void {
    const stone = this.material({ map: this.track(masiaTexture()), roughness: 1 });
    const tile = this.material({ color: 0xb85a3a, roughness: 0.8 });
    const senyera = this.material({ map: this.track(senyeraTexture()), roughness: 0.8, side: 2 });
    const masia = new Group();
    const body = new Mesh(this.unit, stone);
    body.scale.set(10, 9, 14);
    body.position.y = 4.5;
    const roof = new Mesh(this.unit, tile);
    roof.scale.set(11, 0.5, 15);
    roof.rotation.z = 0.12;
    roof.position.y = 9.5;
    masia.add(body, roof);
    for (const z of [-3, 3]) {
      const flag = new Mesh(new PlaneGeometry(1.4, 2.4), senyera);
      flag.rotation.y = -Math.PI / 2;
      flag.position.set(-5.05, 5.5, z);
      this.disposables.push(flag.geometry);
      this.flags.push(flag);
      masia.add(flag);
    }
    masia.children.forEach((c) => (c.castShadow = true));
    masia.position.y = upslope(9);
    const holder = new Group();
    holder.add(masia);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 160, x: roadHalf + 9 });
  }

  /** A few locals watching from the bends. */
  private addLocals(roadHalf: number): void {
    const random = seeded(5911);
    for (let offset = 20; offset < LOOP; offset += 30 + random() * 40) {
      const side = random() < 0.6 ? 1 : -1;
      for (let k = 0; k < 1 + Math.floor(random() * 3); k++)
        this.people.push({
          offset: offset + k * 1.2,
          x: side * (roadHalf + 1 + random() * 0.8),
          phase: random() * 6,
        });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, LOCAL_WEAR, 5917);
  }

  /** Girona's old town on the Onyar below, its cathedral, the plain and the snowy Pyrenees beyond. */
  private addGirona(): void {
    const random = seeded(5921);
    const plain = this.material({ map: this.repeat(plainTexture(), 60, 60), roughness: 1 });
    const fields = new Mesh(new PlaneGeometry(9000, 9000), plain);
    fields.rotation.x = -Math.PI / 2;
    fields.position.set(-4300, -PLAIN, -1500);
    this.disposables.push(fields.geometry);
    this.horizon.add(fields);
    const town = new Group();
    const walls = ONYAR.map((c, k) =>
      this.material({ map: this.track(houseTexture(c, k)), roughness: 0.9 }),
    );
    const tile = this.material({ color: 0xa8583a, roughness: 0.8 });
    for (let k = 0; k < 70; k++) {
      const w = 8 + random() * 6;
      const h = 12 + random() * 14;
      const house = new Mesh(this.unit, walls[Math.floor(random() * walls.length)]!);
      house.scale.set(w, h, 10);
      const row = Math.floor(k / 14);
      house.position.set(-60 + (k % 14) * 10 + (random() - 0.5) * 3, h / 2 + row * 7, -row * 14);
      const roof = new Mesh(this.unit, tile);
      roof.scale.set(w + 0.6, 0.8, 10.6);
      roof.position.set(house.position.x, h + row * 7 + 0.4, house.position.z);
      town.add(house, roof);
    }
    // The cathedral's great Baroque façade, its nave and bell tower, high above the houses.
    const sandstone = this.material({ map: this.track(cathedralTexture()), roughness: 0.9 });
    const cathedral = new Group();
    const nave = new Mesh(this.unit, sandstone);
    nave.scale.set(34, 46, 80);
    nave.position.y = 23;
    const front = new Mesh(this.unit, sandstone);
    front.scale.set(30, 56, 4);
    front.position.set(0, 28, 41);
    const tower = new Mesh(this.unit, sandstone);
    tower.scale.set(12, 22, 12);
    tower.position.set(-20, 78, 24);
    const dome = new Mesh(
      new SphereGeometry(6.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      sandstone,
    );
    dome.position.set(-20, 89, 24);
    this.disposables.push(dome.geometry);
    cathedral.add(nave, front, tower, dome);
    cathedral.position.set(30, 34, -90);
    town.add(cathedral);
    town.position.set(-470, -PLAIN, -950);
    town.rotation.y = 0.5;
    town.scale.setScalar(1.6);
    this.horizon.add(town);
    // The snowy Pyrenees closing the horizon.
    const rock = this.material({ color: 0x7a8494, roughness: 1, flatShading: true });
    const snow = this.material({ color: 0xf4f6fa, roughness: 0.8, flatShading: true });
    const peak = new ConeGeometry(1, 1, 6);
    this.disposables.push(peak);
    for (let k = 0; k < 14; k++) {
      const h = 500 + random() * 500;
      const base = new Mesh(peak, rock);
      base.scale.set(700 + random() * 500, h, 600);
      base.position.set(-5200 + k * 650 + random() * 200, -PLAIN + h / 2, -6200 - random() * 300);
      const cap = new Mesh(peak, snow);
      cap.scale.set(base.scale.x * 0.4, h * 0.4, 240);
      cap.position.set(base.position.x, -PLAIN + h * 0.8 + 2, base.position.z + 30);
      this.horizon.add(base, cap);
    }
    // The wooded hills of the Gavarres across the plain.
    const woods = [0x4a6a34, 0x5a7a3e].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const hill = new DodecahedronGeometry(1, 1);
    this.disposables.push(hill);
    for (let k = 0; k < 8; k++) {
      const h = new Mesh(hill, woods[k % 2]!);
      h.scale.set(500 + random() * 400, 120 + random() * 100, 400);
      h.position.set(-2600 + k * 500, -PLAIN - 20, -2600 - random() * 600);
      this.horizon.add(h);
    }
  }

  /** The Santuari dels Àngels' stone church on the summit ahead, among the trees. */
  private addSanctuary(): void {
    const stone = this.material({ map: this.track(masiaTexture()), roughness: 1 });
    const tile = this.material({ color: 0xa8583a, roughness: 0.8 });
    const green = this.material({ color: 0x3a5a2e, roughness: 1, flatShading: true });
    const summit = new Mesh(new DodecahedronGeometry(1, 1), green);
    summit.scale.set(260, 110, 220);
    summit.position.set(160, -40, -700);
    this.disposables.push(summit.geometry);
    const church = new Group();
    const nave = new Mesh(this.unit, stone);
    nave.scale.set(14, 14, 30);
    nave.position.y = 7;
    const roof = new Mesh(new ConeGeometry(11, 6, 4), tile);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(0.9, 1, 1.9);
    roof.position.y = 17;
    const tower = new Mesh(this.unit, stone);
    tower.scale.set(6, 26, 6);
    tower.position.set(8, 13, 12);
    const top = new Mesh(new ConeGeometry(4.5, 5, 4), tile);
    top.rotation.y = Math.PI / 4;
    top.position.set(8, 28.5, 12);
    this.disposables.push(roof.geometry, top.geometry);
    church.add(nave, roof, tower, top);
    church.position.set(140, 66, -680);
    this.horizon.add(summit, church);
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

/** The climb's smooth dark tarmac with its white edge lines and centre dashes. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4a4a4c', 5931);
    g.fillStyle = 'rgba(245,245,240,0.9)';
    g.fillRect(3, 0, 3, 128);
    g.fillRect(122, 0, 3, 128);
    g.fillRect(63, 0, 2, 60);
  });
}

/** The verge's winter grass and fallen leaves. */
function vergeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#7a7a44', 5941));
}

/** The forest floor: dry oak leaves, needles and the red Gavarres earth. */
function forestFloorTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a6040', 5951);
    const random = seeded(5953);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = ['#5a6a34', '#a07a4a', '#8a4a2a', '#4a5a2e'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 5, 2 + random() * 3);
    }
  });
}

/** The drystone walls' warm grey granite. */
function drystoneTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#a89a84', 5961);
    g.strokeStyle = 'rgba(60,50,40,0.55)';
    const random = seeded(5963);
    for (let y = 0; y < 64; y += 12)
      for (let x = (y / 12) % 2 ? -6 : 0; x < 128; x += 12 + random() * 8)
        g.strokeRect(x, y, 12 + random() * 6, 12);
  });
}

/** A painted kilometre stone: the distance left to the sanctuary. */
function kmStoneTexture(): CanvasTexture {
  return canvasTexture(64, 96, (g) => {
    g.fillStyle = '#f4f4f0';
    g.fillRect(0, 0, 64, 96);
    g.fillStyle = '#d8202a';
    g.fillRect(0, 0, 64, 30);
    g.fillStyle = '#ffffff';
    g.font = 'bold 14px sans-serif';
    g.textAlign = 'center';
    g.fillText('ÀNGELS', 32, 21);
    g.fillStyle = '#111111';
    g.font = 'bold 28px sans-serif';
    g.fillText('3', 32, 72);
  });
}

/** The masia's rubble stone walls with their dressed corners and windows. */
function masiaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b8a080', 5971);
    g.fillStyle = '#d8c8a8';
    g.fillRect(0, 0, 8, 128);
    g.fillRect(120, 0, 8, 128);
    g.fillStyle = '#3a2e24';
    for (const [x, y] of [
      [28, 30],
      [80, 30],
      [28, 82],
      [80, 82],
    ] as const)
      g.fillRect(x, y, 18, 24);
  });
}

/** The senyera: four red stripes on gold. */
function senyeraTexture(): CanvasTexture {
  return canvasTexture(36, 64, (g) => {
    g.fillStyle = '#ffd23f';
    g.fillRect(0, 0, 36, 64);
    g.fillStyle = '#d8102e';
    for (let k = 0; k < 4; k++) g.fillRect(4 + k * 8, 0, 4, 64);
  });
}

/** The plain's patchwork of fields and olive groves. */
function plainTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const random = seeded(5981);
    for (let y = 0; y < 128; y += 16)
      for (let x = 0; x < 128; x += 16) {
        g.fillStyle = ['#7a8a44', '#8a7a4a', '#5a7a3a', '#a08a5a', '#6a6a3a'][
          Math.floor(random() * 5)
        ]!;
        g.fillRect(x, y, 16, 16);
      }
  });
}

/** A house on the Onyar, its painted façade, balconies and shutters. */
function houseTexture(base: string, k: number): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, base, 5991 + k);
    for (let y = 14; y < 120; y += 26)
      for (const x of [10, 38]) {
        g.fillStyle = '#2a2420';
        g.fillRect(x, y, 14, 18);
        g.fillStyle = 'rgba(40,40,40,0.8)';
        g.fillRect(x - 3, y + 17, 20, 2);
      }
  });
}

/** The cathedral's golden sandstone, its pilasters and tall windows. */
function cathedralTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#d8b884', 6001);
    g.fillStyle = 'rgba(120,90,50,0.35)';
    for (let x = 8; x < 128; x += 24) g.fillRect(x, 0, 4, 128);
    g.fillStyle = '#3a2e24';
    for (let x = 16; x < 128; x += 24) g.fillRect(x, 40, 6, 30);
  });
}
