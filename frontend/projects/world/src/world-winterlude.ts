// Winterlude, Ottawa, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the festival on a
// bright, bitterly cold February afternoon, the low sun gold on the snow. The rider rolls along
// the ploughed driveway beside the Rideau Canal, frozen into the world's longest skating rink,
// where skaters in toques and scarves glide below the snowy embankment. Along the other verge the
// festival's snow sculptures stand in the park, a polar bear, a castle, a giant snowflake and an
// inukshuk, carved white and lit faintly blue. Warming huts and a BeaverTails stand sit on the
// ice, maple-leaf flags fly from their poles, and strings of lanterns hang between the lamp
// posts. Bare elms and spruces carry the snow, banks of it line the road, and ahead, across the
// canal, Parliament's Peace Tower and the Château Laurier's copper roofs rise over the city.
// Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
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

/** The festival repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The canal's ice lies ICE metres below the road, between CANAL_NEAR and CANAL_FAR beyond the verge. */
const ICE = 2.6;
const CANAL_NEAR = 8;
const CANAL_FAR = 40;

const SKATER_WEAR = {
  tops: ['#d8102e', '#1d3a8a', '#ffffff', '#2a8a5a', '#f08a2a', '#1d1f24', '#ffd23f', '#8a2a6a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#3a2a24'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#5a3a2a'],
};

export class WinterludeStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: {
    offset: number;
    x: number;
    speed: number;
    phase: number;
    y: number;
  }[] = [];
  private crowd: Figures | null = null;
  private readonly flags: Mesh[] = [];
  private readonly lanterns: MeshStandardMaterial[] = [];
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
    this.addDriveway(roadHalf, points);
    this.addTrees(roadHalf);
    this.addSculptures(roadHalf);
    this.addIce(roadHalf);
    this.addLamps(roadHalf);
    this.addSkaters(roadHalf);
    this.addCity();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 3 + k * 1.2) * 0.5));
    this.lanterns.forEach((m, k) => (m.emissiveIntensity = 0.7 + Math.sin(seconds * 2 + k) * 0.15));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the canal's ice. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - ICE - 1);
      position.setY(i * 2 + 1, p.height - ICE - 1);
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
        // The skaters glide, swaying from one blade to the other.
        const sway = p.y < 0 ? Math.sin(this.time * 1.8 + p.phase) * 0.5 : 0;
        const step = p.y < 0 ? 0 : Math.abs(Math.sin(this.time * 3.2 + p.phase)) * 0.04;
        const heading = (p.speed >= 0 ? 0 : Math.PI) + sway * 0.4;
        crowd.set(i, p.x + sway, heightAt(metres) + p.y + step, -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The ploughed driveway, its snowbanks, the park, the embankment and the frozen canal. */
  private addDriveway(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.7 });
    const snow = this.material({
      map: this.repeat(snowTexture(), 6, 6),
      roughness: 0.9,
      emissive: 0xc8d4e8,
      emissiveIntensity: 0.12,
    });
    const ice = this.material({
      map: this.repeat(iceTexture(), 12, 12),
      color: 0xa8d0f0,
      roughness: 0.15,
      metalness: 0.2,
      emissive: 0x3a6a9a,
      emissiveIntensity: 0.25,
    });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, snow, [
      [r + 200, 1],
      [r + 4, 0.4],
      [r + 1.6, 0.7],
      [r, 0.02],
    ]);
    this.ribbons.add(points, snow, [
      [-r, 0.02],
      [-r - 1.6, 0.6],
      [-r - 4, 0.3],
      [-r - CANAL_NEAR, -ICE],
    ]);
    this.ribbons.add(points, ice, [
      [-r - CANAL_NEAR, -ICE],
      [-r - CANAL_FAR, -ICE],
    ]);
    this.ribbons.add(points, snow, [
      [-r - CANAL_FAR, -ICE],
      [-r - CANAL_FAR - 4, 0.3],
      [-r - 220, 1],
    ]);
  }

  /** Bare elms and snow-laden spruces along both banks. */
  private addTrees(roadHalf: number): void {
    const random = seeded(6101);
    const bark = this.material({ color: 0x3a3430, roughness: 1 });
    const spruce = this.material({ color: 0x1e3a2a, roughness: 1, flatShading: true });
    const snow = this.material({
      color: 0xf4f8fc,
      roughness: 0.9,
      emissive: 0xc8d4e8,
      emissiveIntensity: 0.15,
      flatShading: true,
    });
    const trunk = new CylinderGeometry(0.2, 0.35, 9, 6);
    trunk.translate(0, 4.5, 0);
    const branch = new CylinderGeometry(0.05, 0.1, 4, 4);
    branch.translate(0, 2, 0);
    const tier = new ConeGeometry(2.2, 3, 7);
    const cap = new ConeGeometry(1.6, 1.2, 7);
    this.disposables.push(trunk, branch, tier, cap);
    for (let offset = 0; offset < LOOP; offset += 9 + random() * 10)
      for (const side of [-1, 1]) {
        if (random() < 0.35) continue;
        const tree = new Group();
        if (random() < 0.5) {
          tree.add(new Mesh(trunk, bark));
          for (let k = 0; k < 6; k++) {
            const b = new Mesh(branch, bark);
            b.position.y = 4 + k * 0.8;
            b.rotation.set(0.7 + random() * 0.4, (k / 6) * Math.PI * 2 + random(), 0, 'YXZ');
            tree.add(b);
          }
        } else {
          for (let k = 0; k < 3; k++) {
            const t = new Mesh(tier, spruce);
            t.scale.setScalar(1 - k * 0.25);
            t.position.y = 2 + k * 2;
            const c = new Mesh(cap, snow);
            c.scale.setScalar(1 - k * 0.25);
            c.position.y = 3.1 + k * 2;
            tree.add(t, c);
          }
        }
        tree.scale.setScalar(0.9 + random() * 0.5);
        tree.children.forEach((m) => (m.castShadow = true));
        const d = side > 0 ? 6 + random() * 30 : CANAL_FAR + 6 + random() * 20;
        tree.position.y = side > 0 ? 0.5 : 0.4;
        const holder = new Group();
        holder.add(tree);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
      }
  }

  /** The festival's snow sculptures in the park: polar bear, castle, giant snowflake and inukshuk. */
  private addSculptures(roadHalf: number): void {
    const snow = this.material({
      map: this.repeat(carvedTexture(), 1, 1),
      roughness: 0.8,
      emissive: 0xa8c4ec,
      emissiveIntensity: 0.25,
    });
    const plinth = this.material({ color: 0xe8eef6, roughness: 0.9 });
    const ball = new SphereGeometry(1, 14, 10);
    const turret = new CylinderGeometry(1, 1, 1, 10);
    const roof = new ConeGeometry(1, 1, 10);
    this.disposables.push(ball, turret, roof);
    const sculptures: Group[] = [];
    // The polar bear, on all fours.
    const bear = new Group();
    for (const [x, y, z, sx, sy, sz] of [
      [0, 2.4, 0, 1.8, 1.6, 3.2],
      [0, 3, -3, 1.1, 1, 1.4],
      [0, 3, -4.3, 0.5, 0.45, 0.7],
      [-0.6, 3.9, -2.8, 0.3, 0.3, 0.2],
      [0.6, 3.9, -2.8, 0.3, 0.3, 0.2],
    ] as const) {
      const m = new Mesh(ball, snow);
      m.scale.set(sx, sy, sz);
      m.position.set(x, y, z);
      bear.add(m);
    }
    for (const [x, z] of [
      [-0.9, -1.8],
      [0.9, -1.8],
      [-0.9, 1.8],
      [0.9, 1.8],
    ] as const) {
      const leg = new Mesh(turret, snow);
      leg.scale.set(0.5, 1.6, 0.5);
      leg.position.set(x, 0.8, z);
      bear.add(leg);
    }
    bear.rotation.y = 0.9;
    sculptures.push(bear);
    // The castle with its keep and turrets.
    const castle = new Group();
    const keep = new Mesh(this.unit, snow);
    keep.scale.set(6, 5, 5);
    keep.position.y = 2.5;
    castle.add(keep);
    for (const [x, z, h] of [
      [-3, -2.5, 8],
      [3, -2.5, 8],
      [-3, 2.5, 7],
      [3, 2.5, 7],
      [0, 0, 10],
    ] as const) {
      const t = new Mesh(turret, snow);
      t.scale.set(1.1, h, 1.1);
      t.position.set(x, h / 2, z);
      const r = new Mesh(roof, snow);
      r.scale.set(1.4, 2, 1.4);
      r.position.set(x, h + 1, z);
      castle.add(t, r);
    }
    sculptures.push(castle);
    // The giant snowflake standing on its edge.
    const flake = new Group();
    for (let k = 0; k < 3; k++) {
      const arm = new Mesh(this.unit, snow);
      arm.scale.set(0.5, 7, 0.5);
      arm.rotation.z = (k * Math.PI) / 3;
      flake.add(arm);
      for (const end of [-1, 1])
        for (const tip of [-1, 1]) {
          const twig = new Mesh(this.unit, snow);
          twig.scale.set(0.3, 1.4, 0.3);
          twig.position.set(
            Math.sin((k * Math.PI) / 3) * -end * 2.4,
            Math.cos((k * Math.PI) / 3) * end * 2.4,
            0,
          );
          twig.rotation.z = (k * Math.PI) / 3 + tip * 0.8;
          flake.add(twig);
        }
    }
    flake.position.y = 4.4;
    const flakeHolder = new Group();
    flakeHolder.add(flake);
    flakeHolder.rotation.y = 0.4;
    sculptures.push(flakeHolder);
    // The inukshuk, its stacked blocks.
    const inukshuk = new Group();
    for (const [x, y, sx, sy] of [
      [-1, 1, 0.9, 2],
      [1, 1, 0.9, 2],
      [0, 2.4, 3.2, 0.8],
      [0, 3.4, 1.2, 1.2],
      [0, 4.4, 5, 0.7],
      [0, 5.4, 1, 1.2],
    ] as const) {
      const block = new Mesh(this.unit, snow);
      block.scale.set(sx, sy, 1);
      block.position.set(x, y, 0);
      inukshuk.add(block);
    }
    inukshuk.scale.setScalar(1.3);
    sculptures.push(inukshuk);
    sculptures.forEach((sculpture, k) => {
      const base = new Mesh(this.unit, plinth);
      base.scale.set(9, 0.6, 9);
      base.position.y = 0.3;
      sculpture.position.y = 0.6;
      sculpture.traverse((m) => (m.castShadow = true));
      const holder = new Group();
      holder.add(base, sculpture);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 30 + k * 85, x: roadHalf + 12 });
    });
  }

  /** The warming huts and the BeaverTails stand on the ice, and maple-leaf flags on their poles. */
  private addIce(roadHalf: number): void {
    const timber = this.material({ map: this.track(hutTexture()), roughness: 0.8 });
    const roof = this.material({ color: 0xf4f8fc, roughness: 0.9 });
    const stand = this.material({ map: this.track(beaverTailsTexture()), roughness: 0.7 });
    const maple = this.material({ map: this.track(mapleTexture()), roughness: 0.8, side: 2 });
    const pole = this.material({ color: 0xd8dce0, roughness: 0.4, metalness: 0.6 });
    const x = -roadHalf - CANAL_FAR + 3;
    [60, 180, 290].forEach((offset, k) => {
      const hut = new Group();
      const body = new Mesh(this.unit, k === 1 ? stand : timber);
      body.scale.set(4, 3, 6);
      body.position.y = 1.5;
      const top = new Mesh(new ConeGeometry(4.2, 1.6, 4), roof);
      top.rotation.y = Math.PI / 4;
      top.scale.set(0.7, 1, 1);
      top.position.y = 3.8;
      this.disposables.push(top.geometry);
      hut.add(body, top);
      hut.children.forEach((c) => (c.castShadow = true));
      hut.position.y = -ICE;
      const holder = new Group();
      holder.add(hut);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    });
    const cloth = new PlaneGeometry(2, 1);
    cloth.translate(1, 0, 0);
    this.disposables.push(cloth);
    for (let offset = 20; offset < LOOP; offset += 45) {
      const mast = new Group();
      const p = new Mesh(this.unit, pole);
      p.scale.set(0.1, 8, 0.1);
      p.position.y = 4;
      const flag = new Mesh(cloth, maple);
      flag.position.y = 7.4;
      mast.add(p, flag);
      this.flags.push(flag);
      const holder = new Group();
      holder.add(mast);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 3 });
    }
  }

  /** The black lamp posts along the canal with strings of lanterns between them. */
  private addLamps(roadHalf: number): void {
    const iron = this.material({ color: 0x1d1f24, roughness: 0.5, metalness: 0.5 });
    const glow = this.material({ color: 0xfff0c8, emissive: 0xffd890, emissiveIntensity: 0.8 });
    const colours = [0xd8102e, 0xffd23f, 0x2a8ad8, 0x3ac87a].map((c) => {
      const m = this.material({ color: c, emissive: c, emissiveIntensity: 0.7 });
      this.lanterns.push(m);
      return m;
    });
    const bulb = new SphereGeometry(0.16, 6, 5);
    this.disposables.push(bulb);
    for (let offset = 0; offset < LOOP; offset += 15) {
      const lamp = new Group();
      const post = new Mesh(this.unit, iron);
      post.scale.set(0.14, 4.4, 0.14);
      post.position.y = 2.2;
      const head = new Mesh(this.unit, glow);
      head.scale.set(0.45, 0.6, 0.45);
      head.position.y = 4.6;
      lamp.add(post, head);
      // The string of lanterns sagging to the next post.
      for (let k = 1; k < 10; k++) {
        const z = -k * 1.5;
        const sag = Math.sin((k / 10) * Math.PI) * 0.8;
        const l = new Mesh(bulb, colours[k % colours.length]!);
        l.position.set(0, 4.1 - sag, z);
        lamp.add(l);
      }
      const holder = new Group();
      holder.add(lamp);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 1.2 });
    }
  }

  /** Skaters gliding both ways on the canal, and walkers on the park path. */
  private addSkaters(roadHalf: number): void {
    const random = seeded(6111);
    for (let offset = 2; offset < LOOP; offset += 1.6 + random() * 2.4)
      this.people.push({
        offset,
        x: -roadHalf - CANAL_NEAR - 2 - random() * (CANAL_FAR - CANAL_NEAR - 6),
        speed: (random() < 0.5 ? 1 : -1) * (2.5 + random() * 2),
        phase: random() * 6,
        y: -ICE,
      });
    for (let offset = 10; offset < LOOP; offset += 14 + random() * 18)
      this.people.push({
        offset,
        x: roadHalf + 5 + random() * 2,
        speed: (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.3),
        phase: random() * 6,
        y: 0.4,
      });
    this.crowd = new Figures(this.group, this.disposables, this.people.length, SKATER_WEAR, 6117);
  }

  /** Parliament's Peace Tower and the Château Laurier across the canal, and the city beyond. */
  private addCity(): void {
    const random = seeded(6121);
    const sandstone = this.material({ map: this.track(gothicTexture()), roughness: 0.9 });
    const copper = this.material({ color: 0x5a9a84, roughness: 0.6, metalness: 0.2 });
    const clock = this.material({ map: this.track(clockTexture()), roughness: 0.6 });
    const parliament = new Group();
    const block = new Mesh(this.unit, sandstone);
    block.scale.set(140, 30, 40);
    block.position.y = 15;
    const tower = new Mesh(this.unit, sandstone);
    tower.scale.set(14, 70, 14);
    tower.position.set(0, 35, 22);
    const face = new Mesh(this.unit, clock);
    face.scale.set(10, 10, 0.4);
    face.position.set(0, 60, 29.3);
    const spire = new Mesh(new ConeGeometry(10.5, 26, 4), copper);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(0, 83, 22);
    this.disposables.push(spire.geometry);
    parliament.add(block, tower, face, spire);
    for (const x of [-60, -30, 30, 60]) {
      const roof = new Mesh(new ConeGeometry(9, 16, 4), copper);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(x, 38, 0);
      this.disposables.push(roof.geometry);
      parliament.add(roof);
    }
    parliament.position.set(-220, 8, -700);
    parliament.rotation.y = 0.3;
    parliament.scale.setScalar(1.4);
    this.horizon.add(parliament);
    // The Château Laurier's limestone walls and steep copper roofs.
    const limestone = this.material({ map: this.track(chateauTexture()), roughness: 0.9 });
    const chateau = new Group();
    const wing = new Mesh(this.unit, limestone);
    wing.scale.set(60, 40, 30);
    wing.position.y = 20;
    const top = new Mesh(this.unit, copper);
    top.scale.set(58, 14, 26);
    top.position.y = 46;
    chateau.add(wing, top);
    for (const x of [-26, 26]) {
      const turret = new Mesh(new ConeGeometry(5, 18, 8), copper);
      turret.position.set(x, 62, 10);
      this.disposables.push(turret.geometry);
      chateau.add(turret);
    }
    chateau.position.set(-60, 0, -1150);
    this.horizon.add(chateau);
    // The city's towers behind, softened by the cold air.
    const glass = [0x8aa0b8, 0x9aa8b4, 0x7a8a9a].map((c) =>
      this.material({ color: c, roughness: 0.4, metalness: 0.3 }),
    );
    for (let k = 0; k < 14; k++) {
      const h = 40 + random() * 70;
      const b = new Mesh(this.unit, glass[k % glass.length]!);
      b.scale.set(25 + random() * 20, h, 25);
      b.position.set(-500 + k * 55 + random() * 20, h / 2, -1450 - random() * 300);
      this.horizon.add(b);
    }
    // Snowy hills of the Gatineau beyond.
    const hills = this.material({ color: 0xdfe6ee, roughness: 1, flatShading: true });
    const hill = new DodecahedronGeometry(1, 1);
    this.disposables.push(hill);
    for (let k = 0; k < 7; k++) {
      const h = new Mesh(hill, hills);
      h.scale.set(700 + random() * 400, 120 + random() * 80, 400);
      h.position.set(-2400 + k * 700, -30, -3600 - random() * 400);
      this.horizon.add(h);
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

/** The ploughed driveway: dark tarmac dusted with salt and snow at its edges. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4e5054', 6131);
    const random = seeded(6133);
    g.fillStyle = 'rgba(235,240,248,0.6)';
    for (let i = 0; i < 40; i++)
      g.fillRect(random() < 0.5 ? random() * 16 : 112 + random() * 16, random() * 128, 4, 2);
    g.fillStyle = 'rgba(220,220,220,0.25)';
    for (let i = 0; i < 60; i++) g.fillRect(random() * 128, random() * 128, 2, 1);
    g.fillStyle = 'rgba(255,210,60,0.8)';
    g.fillRect(62, 0, 2, 128);
    g.fillRect(65, 0, 2, 128);
  });
}

/** Fresh snow, faintly blue in the shadows, with footprints. */
function snowTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#eef2f8', 6141);
    const random = seeded(6143);
    g.fillStyle = 'rgba(160,180,210,0.25)';
    for (let i = 0; i < 40; i++) g.fillRect(random() * 128, random() * 128, 3, 2);
  });
}

/** The canal's ice, scored by blades and swept clear in lanes. */
function iceTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a8c8e4', 6151);
    const random = seeded(6153);
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 40; i++) {
      g.beginPath();
      const x = random() * 128;
      const y = random() * 128;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 10, y + 20, x + (random() - 0.5) * 20, y + 40);
      g.stroke();
    }
    g.fillStyle = 'rgba(240,246,252,0.5)';
    g.fillRect(0, 0, 10, 128);
    g.fillRect(118, 0, 10, 128);
  });
}

/** The carved snow's chisel marks. */
function carvedTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#f4f8fc', 6161);
    g.fillStyle = 'rgba(150,175,215,0.3)';
    const random = seeded(6163);
    for (let i = 0; i < 20; i++) g.fillRect(random() * 64, random() * 64, 8, 1);
  });
}

/** A warming hut's red-stained boards. */
function hutTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#a83a2a', 6171);
    g.fillStyle = 'rgba(40,20,10,0.5)';
    for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 1);
  });
}

/** The BeaverTails stand's brown and its sign. */
function beaverTailsTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.fillStyle = '#7a4a2a';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#f8f0e0';
    g.font = 'bold 18px sans-serif';
    g.textAlign = 'center';
    g.fillText('BEAVERTAILS', 64, 30);
    g.fillStyle = '#ffd23f';
    g.fillRect(10, 42, 108, 6);
  });
}

/** The maple-leaf flag: red bars and a red leaf on white. */
function mapleTexture(): CanvasTexture {
  return canvasTexture(64, 32, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#d8102e';
    g.fillRect(0, 0, 16, 32);
    g.fillRect(48, 0, 16, 32);
    g.beginPath();
    g.moveTo(32, 5);
    g.lineTo(36, 12);
    g.lineTo(42, 10);
    g.lineTo(39, 18);
    g.lineTo(43, 20);
    g.lineTo(34, 23);
    g.lineTo(33, 28);
    g.lineTo(31, 28);
    g.lineTo(30, 23);
    g.lineTo(21, 20);
    g.lineTo(25, 18);
    g.lineTo(22, 10);
    g.lineTo(28, 12);
    g.closePath();
    g.fill();
  });
}

/** Parliament's Nepean sandstone with its Gothic windows. */
function gothicTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#c8b898', 6181);
    g.fillStyle = '#4a4440';
    for (let x = 6; x < 128; x += 14) {
      g.fillRect(x, 16, 6, 24);
      g.beginPath();
      g.arc(x + 3, 16, 3, Math.PI, 0);
      g.fill();
    }
  });
}

/** The Peace Tower's clock face. */
function clockTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#c8b898';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#f4f0e4';
    g.beginPath();
    g.arc(32, 32, 26, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#1d1f24';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(32, 32);
    g.lineTo(32, 12);
    g.moveTo(32, 32);
    g.lineTo(46, 38);
    g.stroke();
  });
}

/** The Château Laurier's pale limestone and rows of windows. */
function chateauTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#d8d0c0', 6191);
    g.fillStyle = '#3a3a40';
    for (let y = 10; y < 128; y += 18) for (let x = 6; x < 128; x += 12) g.fillRect(x, y, 5, 9);
  });
}
