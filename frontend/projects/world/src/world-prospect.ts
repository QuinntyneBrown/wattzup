// Prospect Park's loop, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Brooklyn's
// park on a golden early-autumn weekend morning. The rider circles the drive with the runners'
// and cyclists' lanes painted on it, under great oaks and plane trees just turning, past the
// park's cast-iron lamps and green benches. On the right the Long Meadow rolls away in its huge
// sweep of lawn, picnic blankets spread and dogs racing after balls; the weekend market's white
// tents and striped awnings line the meadow's edge. On the left the Lake lies still, swans and
// pedal boats on it, the white Boathouse on its far bank and a rustic shelter on its point.
// Ahead the trees open on Grand Army Plaza's arch, and brownstone rooftops and the borough's
// towers show over the canopy. Built on the shared kit (world-kit.ts) on the pattern of Old
// Town's street.
import {
  type BufferAttribute,
  type BufferGeometry,
  BoxGeometry,
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

/** The drive repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 380;
const BEHIND = 24;

const PARK_WEAR = {
  tops: [
    '#ffffff',
    '#c8102e',
    '#2a6a9a',
    '#ffd23f',
    '#1d1f24',
    '#ff6b5a',
    '#3a8a5a',
    '#9b5cff',
    '#e8b878',
  ],
  bottoms: ['#2f3e5c', '#1d1f24', '#e8d8b0', '#5a5f69', '#3a86ff'],
  skins: ['#f0c8a0', '#c48a5f', '#8d5a3b', '#e2b48c', '#f5d3b5', '#5a3a29'],
};

export class ProspectStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly dogs: { mesh: Group; phase: number; x: number }[] = [];
  private readonly swans: { mesh: Group; phase: number }[] = [];
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
    this.addDrive(roadHalf, points);
    this.addTrees(roadHalf);
    this.addLamps(roadHalf);
    this.addMarket(roadHalf);
    this.addMeadowLife(roadHalf);
    this.addPeople(roadHalf);
    this.addLake();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The dogs race after their balls; the swans glide; the lake ripples.
    for (const d of this.dogs) {
      const t = seconds * 1.4 + d.phase;
      d.mesh.position.set(
        d.x + Math.sin(t) * 8,
        Math.abs(Math.sin(t * 6)) * 0.15,
        Math.cos(t * 0.7) * 6,
      );
      d.mesh.rotation.y = -t;
    }
    for (const s of this.swans) {
      const a = seconds * 0.05 + s.phase;
      s.mesh.position.set(-60 + Math.cos(a) * 30, 0, -120 + Math.sin(a) * 50);
      s.mesh.rotation.y = -a;
    }
    if (this.lake) this.lake.offset.set(seconds * 0.003, seconds * 0.002);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the Lake so its water shows. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 2);
      position.setY(i * 2 + 1, p.height - 2);
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
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const step = p.speed ? Math.abs(Math.sin(this.time * 4.5 + p.phase)) * 0.05 : 0;
        crowd.set(
          i,
          p.x,
          heightAt(metres) + step,
          -metres,
          p.speed > 0 ? 0 : p.speed < 0 ? Math.PI : p.phase,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The drive's lanes, the kerbs and footpath, and the lawns and the Long Meadow either side. */
  private addDrive(roadHalf: number, points: number): void {
    const r = roadHalf;
    const lanes = this.material({ map: this.repeat(laneTexture(), r * 2, 12), roughness: 0.9 });
    const path = this.material({ map: this.repeat(pathTexture(), 2, 2), roughness: 0.9 });
    const lawn = this.material({ map: this.repeat(lawnTexture(), 5, 5), roughness: 1 });
    this.ribbons.add(points, lanes, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, path, [
      [r + 3, 0.12],
      [r + 0.2, 0.12],
      [r, 0.01],
    ]);
    this.ribbons.add(points, lawn, [
      [r + 300, 6],
      [r + 60, 2.5],
      [r + 3, 0.12],
    ]);
    this.ribbons.add(points, path, [
      [-r, 0.01],
      [-r - 0.2, 0.12],
      [-r - 3, 0.12],
    ]);
    this.ribbons.add(points, lawn, [
      [-r - 3, 0.12],
      [-r - 20, 0.2],
      [-r - 27, -0.6],
    ]);
  }

  /** The great oaks and London planes just turning gold and russet, close over the drive. */
  private addTrees(roadHalf: number): void {
    const random = seeded(4101);
    const bark = this.material({ color: 0x5a4a3e, roughness: 1 });
    const plane = this.material({ color: 0xb8ae98, roughness: 0.9 });
    const leaves = [0x4a7a2e, 0x6a8a2a, 0xc89a2a, 0xb8642a, 0x3a6a2a, 0xd8b040].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const trunk = new CylinderGeometry(0.4, 0.7, 8, 7);
    trunk.translate(0, 4, 0);
    const crown = new DodecahedronGeometry(4.5, 1);
    crown.scale(1.2, 0.85, 1.2);
    this.disposables.push(trunk, crown);
    for (let offset = 0; offset < LOOP; offset += 6 + random() * 8) {
      const side = random() < 0.5 ? -1 : 1;
      const d = side > 0 ? 4 + random() * 6 : 4 + random() * 12;
      const tree = new Group();
      tree.add(new Mesh(trunk, random() < 0.4 ? plane : bark));
      for (let k = 0; k < 3; k++) {
        const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
        c.position.set((random() - 0.5) * 4, 9 + random() * 3, (random() - 0.5) * 4);
        c.scale.setScalar(0.7 + random() * 0.4);
        tree.add(c);
      }
      tree.scale.setScalar(0.85 + random() * 0.35);
      tree.rotation.y = random() * 6;
      tree.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
    // Trees scattered across the far side of the meadow.
    for (let k = 0; k < 18; k++) {
      const tree = new Group();
      const c = new Mesh(crown, leaves[k % leaves.length]!);
      c.position.y = 9;
      tree.add(new Mesh(trunk, bark), c);
      tree.scale.setScalar(1 + random() * 0.6);
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: k * 21, x: roadHalf + 70 + random() * 60 });
    }
  }

  /** The park's cast-iron lamps and green slatted benches along the footpaths. */
  private addLamps(roadHalf: number): void {
    const iron = this.material({ color: 0x1e2a22, roughness: 0.5, metalness: 0.4 });
    const glow = this.material({ color: 0xfff4d8, emissive: 0xffe0a0, emissiveIntensity: 0.5 });
    const slats = this.material({ color: 0x2a5a3a, roughness: 0.7 });
    for (let offset = 0; offset < LOOP; offset += 30)
      for (const side of [-1, 1]) {
        const lamp = new Group();
        const post = new Mesh(this.unit, iron);
        post.scale.set(0.14, 3.6, 0.14);
        post.position.y = 1.8;
        const lantern = new Mesh(this.unit, glow);
        lantern.scale.set(0.4, 0.55, 0.4);
        lantern.position.y = 3.9;
        const cap = new Mesh(this.unit, iron);
        cap.scale.set(0.5, 0.12, 0.5);
        cap.position.y = 4.25;
        lamp.add(post, lantern, cap);
        const bench = new Group();
        const seat = new Mesh(this.unit, slats);
        seat.scale.set(0.6, 0.08, 2);
        seat.position.y = 0.45;
        const back = new Mesh(this.unit, slats);
        back.scale.set(0.08, 0.5, 2);
        back.position.set(side * 0.3, 0.75, 0);
        const legs = new Mesh(this.unit, iron);
        legs.scale.set(0.5, 0.45, 1.8);
        legs.position.y = 0.22;
        bench.add(seat, back, legs);
        bench.position.set(side * 1.2, 0.12, 4);
        lamp.add(bench);
        lamp.position.y = 0.12;
        const holder = new Group();
        holder.add(lamp);
        this.group.add(holder);
        this.props.push({
          mesh: holder,
          offset: offset + (side > 0 ? 15 : 0),
          x: side * (roadHalf + 1.4),
        });
      }
  }

  /** The weekend market's white tents and striped awnings along the meadow's edge. */
  private addMarket(roadHalf: number): void {
    const random = seeded(4111);
    const canvas = this.material({ color: 0xf8f6f0, roughness: 0.9 });
    const stripes = [0, 1, 2].map((k) =>
      this.material({ map: this.track(awningTexture(k)), roughness: 0.8 }),
    );
    const table = this.material({ color: 0x8a6a4a, roughness: 0.9 });
    const goods = [0xd8442a, 0xffd23f, 0x6a9a3a, 0xf08a2a, 0x8a3a6a].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const peak = new ConeGeometry(2.3, 1.2, 4);
    peak.rotateY(Math.PI / 4);
    this.disposables.push(peak);
    for (let offset = 40; offset < 200; offset += 7) {
      const tent = new Group();
      const roof = new Mesh(
        peak,
        random() < 0.6 ? canvas : stripes[Math.floor(random() * stripes.length)]!,
      );
      roof.position.y = 3.2;
      for (const [x, z] of [
        [-1.5, -1.5],
        [1.5, -1.5],
        [-1.5, 1.5],
        [1.5, 1.5],
      ] as const) {
        const leg = new Mesh(this.unit, canvas);
        leg.scale.set(0.06, 2.6, 0.06);
        leg.position.set(x, 1.3, z);
        tent.add(leg);
      }
      const counter = new Mesh(this.unit, table);
      counter.scale.set(0.9, 0.9, 2.8);
      counter.position.set(-1.1, 0.45, 0);
      tent.add(roof, counter);
      for (let k = 0; k < 4; k++) {
        const g = new Mesh(this.unit, goods[Math.floor(random() * goods.length)]!);
        g.scale.set(0.5, 0.25, 0.5);
        g.position.set(-1.1, 1.0, -1 + k * 0.65);
        tent.add(g);
      }
      tent.children.forEach((c) => (c.castShadow = true));
      tent.position.y = 0.2;
      const holder = new Group();
      holder.add(tent);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 14 });
    }
  }

  /** Picnic blankets on the Long Meadow and dogs racing after their balls. */
  private addMeadowLife(roadHalf: number): void {
    const random = seeded(4121);
    const blankets = [0, 1, 2, 3].map((k) =>
      this.material({ map: this.track(blanketTexture(k)), roughness: 1 }),
    );
    const coats = [0xc8a060, 0x1d1d1d, 0xf0e8dc, 0x8a5a3a].map((c) =>
      this.material({ color: c, roughness: 1 }),
    );
    const body = new SphereGeometry(0.3, 8, 6);
    body.scale(0.8, 0.8, 1.6);
    const head = new SphereGeometry(0.16, 6, 5);
    this.disposables.push(body, head);
    for (let offset = 10; offset < LOOP; offset += 14 + random() * 14) {
      const spot = new Group();
      const blanket = new Mesh(this.unit, blankets[Math.floor(random() * blankets.length)]!);
      blanket.scale.set(2.2, 0.03, 1.8);
      blanket.rotation.y = random() * 3;
      spot.add(blanket);
      spot.position.y = 0.3 + random() * 0.6;
      const holder = new Group();
      holder.add(spot);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 22 + random() * 40 });
      this.people.push({
        offset: offset + 1,
        x: roadHalf + 22 + random() * 40,
        speed: 0,
        phase: random() * 6,
      });
    }
    for (let k = 0; k < 6; k++) {
      const dog = new Group();
      const coat = coats[k % coats.length]!;
      const b = new Mesh(body, coat);
      b.position.y = 0.4;
      const h = new Mesh(head, coat);
      h.position.set(0, 0.6, -0.45);
      dog.add(b, h);
      const run = new Group();
      run.add(dog);
      const holder = new Group();
      holder.add(run);
      this.group.add(holder);
      this.dogs.push({ mesh: dog, phase: random() * 6, x: 0 });
      this.props.push({ mesh: holder, offset: 20 + k * 55, x: roadHalf + 30 + random() * 30 });
    }
  }

  /** Runners and cyclists on the drive's lanes, walkers and strollers on the footpaths. */
  private addPeople(roadHalf: number): void {
    const random = seeded(4131);
    for (let offset = 3; offset < LOOP; offset += 5 + random() * 7) {
      const runner = random() < 0.5;
      this.people.push({
        offset,
        x: runner ? -roadHalf + 0.6 : (random() < 0.5 ? -1 : 1) * (roadHalf + 1 + random() * 1.8),
        speed: runner ? 2.6 + random() * 0.8 : (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.4),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, PARK_WEAR, 4137);
  }

  /**
   * The Lake on the left with its swans and pedal boats, the white Boathouse and a rustic shelter
   * on its banks, and ahead Grand Army Plaza's arch, brownstone rooftops and the borough's towers.
   */
  private addLake(): void {
    const random = seeded(4141);
    const ripple = this.track(lakeTexture());
    ripple.wrapS = RepeatWrapping;
    ripple.wrapT = RepeatWrapping;
    ripple.repeat.set(30, 30);
    this.lake = ripple;
    const water = new Mesh(
      new PlaneGeometry(240, 700),
      this.material({
        map: ripple,
        color: 0x5a8ab8,
        roughness: 0.08,
        metalness: 0.3,
        emissive: 0x2a4a6a,
        emissiveIntensity: 0.5,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-148, -0.15, -300);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
    // The swans.
    const white = this.material({ color: 0xfafaf6, roughness: 0.7 });
    const beak = this.material({ color: 0xe86a2a, roughness: 0.6 });
    for (let k = 0; k < 4; k++) {
      const swan = new Group();
      const b = new Mesh(new SphereGeometry(0.5, 8, 6), white);
      b.scale.set(0.8, 0.6, 1.4);
      b.position.y = 0.3;
      const neck = new Mesh(new CylinderGeometry(0.08, 0.1, 0.9, 5), white);
      neck.position.set(0, 0.8, -0.5);
      neck.rotation.x = 0.2;
      const bill = new Mesh(this.unit, beak);
      bill.scale.set(0.1, 0.08, 0.25);
      bill.position.set(0, 1.2, -0.7);
      swan.add(b, neck, bill);
      this.disposables.push(b.geometry, neck.geometry);
      swan.scale.setScalar(1.5);
      const wrap = new Group();
      wrap.add(swan);
      wrap.position.y = 0.2;
      this.swans.push({ mesh: swan, phase: k * 1.6 });
      this.horizon.add(wrap);
    }
    // The Boathouse: white terra cotta, arched loggia on the water, its terrace.
    const terra = this.material({ map: this.track(boathouseTexture()), roughness: 0.8 });
    const roof = this.material({ color: 0x6a6a6a, roughness: 0.7 });
    const boathouse = new Mesh(this.unit, terra);
    boathouse.scale.set(14, 9, 34);
    boathouse.position.set(-235, 4.5, -320);
    const top = new Mesh(this.unit, roof);
    top.scale.set(15, 0.8, 35);
    top.position.set(-235, 9.4, -320);
    this.horizon.add(boathouse, top);
    // A rustic shelter on the point.
    const logs = this.material({ color: 0x6a4a30, roughness: 1 });
    const shelter = new Group();
    for (const [x, z] of [
      [-1.5, -1.5],
      [1.5, -1.5],
      [-1.5, 1.5],
      [1.5, 1.5],
    ] as const) {
      const post = new Mesh(this.unit, logs);
      post.scale.set(0.25, 3, 0.25);
      post.position.set(x, 1.5, z);
      shelter.add(post);
    }
    const thatch = new Mesh(new ConeGeometry(3, 2, 6), logs);
    thatch.position.y = 4;
    this.disposables.push(thatch.geometry);
    shelter.add(thatch);
    shelter.position.set(-60, 0, -120);
    this.horizon.add(shelter);
    // The far shore's trees ringing the lake.
    const leaves = [0x4a7a2e, 0xc89a2a, 0xb8642a, 0x3a6a2a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const crown = new DodecahedronGeometry(1, 1);
    this.disposables.push(crown);
    for (let k = 0; k < 70; k++) {
      const t = new Mesh(crown, leaves[k % leaves.length]!);
      t.scale.set(7 + random() * 5, 8 + random() * 6, 7 + random() * 5);
      t.position.set(-275 - random() * 60, 9 + random() * 4, 40 - k * 9);
      this.horizon.add(t);
    }
    // Ahead: Grand Army Plaza's arch, brownstone rooftops and the borough's towers over the trees.
    const granite = this.material({ map: this.track(archTexture()), roughness: 0.8 });
    const bronze = this.material({ color: 0x4a6a5a, roughness: 0.5, metalness: 0.5 });
    const arch = new Group();
    for (const x of [-11, 11]) {
      const pier = new Mesh(this.unit, granite);
      pier.scale.set(8, 24, 10);
      pier.position.set(x, 12, 0);
      arch.add(pier);
    }
    const attic = new Mesh(this.unit, granite);
    attic.scale.set(30, 8, 10);
    attic.position.y = 28;
    const quadriga = new Mesh(this.unit, bronze);
    quadriga.scale.set(10, 6, 5);
    quadriga.position.y = 35;
    arch.add(attic, quadriga);
    arch.position.set(10, 0, -560);
    this.horizon.add(arch);
    const brick = [0x8a4a34, 0x6a3a2a, 0xa86a4a, 0x7a5a48].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const glass = [0x6a8aa8, 0x8aa8c0, 0x4a6a88].map((c) =>
      this.material({ color: c, roughness: 0.2, metalness: 0.5 }),
    );
    for (let k = 0; k < 40; k++) {
      const tall = random() < 0.3;
      const b = new Mesh(this.unit, tall ? glass[k % glass.length]! : brick[k % brick.length]!);
      const h = tall ? 60 + random() * 80 : 14 + random() * 6;
      b.scale.set(16 + random() * 14, h, 14 + random() * 10);
      b.position.set(-260 + random() * 520, h / 2, -620 - random() * 400);
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

/** The drive's asphalt with its lanes: the runners' lane edge and the cyclists' lane line. */
function laneTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    speckle(g, 256, 128, '#4a4c50', 4151);
    g.fillStyle = 'rgba(245,245,240,0.85)';
    g.fillRect(64, 0, 3, 128);
    g.fillStyle = 'rgba(240,200,40,0.85)';
    g.fillRect(150, 0, 3, 70);
  });
}

/** The footpaths' hexagonal asphalt pavers. */
function pathTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#6a6c6a', 4161);
    g.strokeStyle = 'rgba(40,40,40,0.4)';
    for (let y = 0; y < 64; y += 12)
      for (let x = (y / 12) % 2 ? 6 : 0; x < 64; x += 12) g.strokeRect(x, y, 12, 12);
  });
}

/** The meadow's lawn: green, with the first fallen leaves. */
function lawnTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a8a3a', 4171);
    const random = seeded(4173);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = ['#c89a2a', '#b8642a', '#6a9a3a', '#4a7a2a'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 128, random() * 128, 2, 2);
    }
  });
}

/** A market stall's striped awning. */
function awningTexture(k: number): CanvasTexture {
  const colours = ['#c8102e', '#2a6a9a', '#3a8a5a'];
  return canvasTexture(64, 64, (g) => {
    for (let x = 0; x < 64; x += 8) {
      g.fillStyle = (x / 8) % 2 ? '#f8f6f0' : colours[k]!;
      g.fillRect(x, 0, 8, 64);
    }
  });
}

/** A picnic blanket in checks. */
function blanketTexture(k: number): CanvasTexture {
  const colours = ['#c8102e', '#2a6a9a', '#ffd23f', '#3a8a5a'];
  return canvasTexture(32, 32, (g) => {
    g.fillStyle = '#f8f6f0';
    g.fillRect(0, 0, 32, 32);
    g.fillStyle = colours[k]!;
    for (let i = 0; i < 32; i += 8) {
      g.fillRect(i, 0, 4, 32);
      g.fillRect(0, i, 32, 4);
    }
  });
}

/** The Lake's still blue water with the sky's light on it. */
function lakeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#4a7aa0', 4181);
    const random = seeded(4183);
    for (let i = 0; i < 20; i++) {
      g.fillStyle = `rgba(230,240,235,${0.2 + random() * 0.2})`;
      g.fillRect(random() * 64, random() * 64, 6 + random() * 8, 1);
    }
  });
}

/** The Boathouse's white terra cotta with its arched loggia. */
function boathouseTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#f0ece2', 4191);
    g.fillStyle = '#3a4048';
    for (let x = 8; x < 128; x += 20) {
      g.fillRect(x, 34, 12, 30);
      g.beginPath();
      g.arc(x + 6, 34, 6, Math.PI, 0);
      g.fill();
    }
  });
}

/** The arch's grey granite in courses. */
function archTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#a8a49c', 4201);
    g.fillStyle = 'rgba(60,58,54,0.3)';
    for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 1);
  });
}
