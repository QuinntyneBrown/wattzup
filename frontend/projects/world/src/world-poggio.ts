// The Poggio's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the Riviera
// di Ponente on a bright spring afternoon, the last climb before San Remo. The rider takes the
// coast road up the Poggio: on the right the hillside rises in stone-walled terraces where
// glasshouses for the flower growers glint among olive trees, cypresses and pastel villas with
// terracotta roofs; on the left a low wall and palms stand above the maquis falling to the
// Mediterranean, where yachts lie at anchor on the glittering sea. Tifosi line the road waving
// flags, a banner arch counts down to the finish, and ahead the Poggio's village and church tower
// sit on the hill with San Remo strung along the shore below the green Ligurian Alps. Built on
// the shared kit (world-kit.ts) on the pattern of Old Town's street.
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

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The banner arch spans the road once a lap. */
const ARCH = 70;
/** The terraces: STEPS of them, each TREAD metres deep and RISE metres above the last. */
const STEPS = 8;
const TREAD = 7;
const RISE = 2.8;
/** The first terrace wall stands this far beyond the road's edge. */
const FOOT = 2.2;

const TIFOSI_WEAR = {
  tops: ['#2a7ad8', '#ffffff', '#c8102e', '#ffd23f', '#2a8a4a', '#ff2d78', '#1d1f24', '#ff9f1c'],
  bottoms: ['#1d1f24', '#2f3e5c', '#e8d8b0', '#5a5f69'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#f5d3b5', '#8d5a3b'],
};

interface Fan {
  readonly offset: number;
  readonly x: number;
  readonly heading: number;
  readonly phase: number;
}

/** The height of terrace k's tread above the road. */
function terrace(k: number): number {
  return 1.4 + k * RISE;
}

export class PoggioStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly fans: Fan[] = [];
  private crowd: Figures | null = null;
  private readonly flags: Mesh[] = [];
  private sea: Texture | null = null;
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
    this.addTerraces(roadHalf, points);
    this.addCoast(roadHalf, points);
    this.addGlasshouses(roadHalf);
    this.addTrees(roadHalf);
    this.addVillas(roadHalf);
    this.addPalms(roadHalf);
    this.addArch(roadHalf);
    this.addFans(roadHalf);
    this.addRiviera();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 5 + k) * 0.6));
    // The sea's glitter shifts in the breeze.
    if (this.sea) this.sea.offset.set(seconds * 0.004, seconds * 0.006);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the road, down to the sea. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 90);
      position.setY(i * 2 + 1, p.height - 90);
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
      this.fans.forEach((f, i) => {
        const metres = loopMetres(f.offset, s, LOOP, BEHIND);
        const jump = Math.max(0, Math.sin(this.time * 6 + f.phase)) * 0.08;
        crowd.set(i, f.x, heightAt(metres) + jump, -metres, f.heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The verge, then the hillside's terraces: dry-stone walls and green treads stepping up. */
  private addTerraces(roadHalf: number, points: number): void {
    const r = roadHalf;
    const stone = this.material({ map: this.repeat(stoneTexture(), 1.5, 1.5), roughness: 0.9 });
    const tread = this.material({ map: this.repeat(treadTexture(), 4, 4), roughness: 1 });
    const verge = this.material({
      map: this.repeat(treadTexture(), 2, 2),
      color: 0xc8c0a0,
      roughness: 1,
    });
    this.ribbons.add(points, verge, [
      [r + FOOT, 0.05],
      [r, 0.004],
    ]);
    for (let k = 0; k < STEPS; k++) {
      const x = r + FOOT + k * TREAD;
      const below = k ? terrace(k - 1) : 0.05;
      this.ribbons.add(points, stone, [
        [x, terrace(k)],
        [x, below],
      ]);
      this.ribbons.add(points, tread, [
        [x + TREAD, terrace(k)],
        [x, terrace(k)],
      ]);
    }
    const top = r + FOOT + STEPS * TREAD;
    this.ribbons.add(points, tread, [
      [top + 300, terrace(STEPS - 1) + 90],
      [top, terrace(STEPS - 1)],
    ]);
  }

  /** The low wall on the left, the maquis falling to the shore, and the Mediterranean. */
  private addCoast(roadHalf: number, points: number): void {
    const r = roadHalf;
    const wall = this.material({ color: 0xe8dcc4, roughness: 0.8 });
    const scrub = this.material({ map: this.repeat(maquisTexture(), 6, 6), roughness: 1 });
    const verge = this.material({
      map: this.repeat(treadTexture(), 2, 2),
      color: 0xc8c0a0,
      roughness: 1,
    });
    this.ribbons.add(points, verge, [
      [-r, 0.004],
      [-r - 1, 0.03],
    ]);
    this.ribbons.add(points, wall, [
      [-r - 1, 0.03],
      [-r - 1, 0.8],
      [-r - 1.4, 0.8],
      [-r - 1.4, -0.4],
    ]);
    this.ribbons.add(points, scrub, [
      [-r - 1.4, -0.4],
      [-r - 40, -36],
      [-r - 90, -60],
    ]);
    const flow = this.track(seaTexture());
    flow.wrapS = RepeatWrapping;
    flow.wrapT = RepeatWrapping;
    flow.repeat.set(60, 60);
    this.sea = flow;
    const water = new Mesh(
      new PlaneGeometry(8000, 8000),
      this.material({
        map: flow,
        color: 0x6ab0e0,
        roughness: 0.15,
        metalness: 0.3,
        emissive: 0x1a4a7a,
        emissiveIntensity: 0.35,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-4000 - r - 80, -62, -1500);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
  }

  /** The flower growers' glasshouses on the terraces, their glass catching the sun. */
  private addGlasshouses(roadHalf: number): void {
    const random = seeded(2701);
    const glass = this.material({
      color: 0xdcecf4,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.7,
      emissive: 0x8ab0c8,
      emissiveIntensity: 0.25,
    });
    const frame = this.material({ color: 0xf4f4f0, roughness: 0.5 });
    const roof = new CylinderGeometry(1, 1, 1, 12, 1, false, 0, Math.PI);
    roof.rotateZ(Math.PI / 2);
    roof.rotateY(Math.PI / 2);
    this.disposables.push(roof);
    for (let offset = 0; offset < LOOP; offset += 8 + random() * 12) {
      const k = 1 + Math.floor(random() * (STEPS - 1));
      const length = 10 + random() * 14;
      const house = new Group();
      const body = new Mesh(this.unit, glass);
      body.scale.set(TREAD - 1.6, 2.2, length);
      body.position.y = 1.1;
      const top = new Mesh(roof, glass);
      top.scale.set((TREAD - 1.6) / 2, 1.1, length);
      top.position.y = 2.2;
      const ridge = new Mesh(this.unit, frame);
      ridge.scale.set(0.1, 0.1, length);
      ridge.position.y = 3.3;
      house.add(body, top, ridge);
      house.position.y = terrace(k);
      const holder = new Group();
      holder.add(house);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + FOOT + k * TREAD + TREAD / 2 });
    }
  }

  /** Olive trees on the treads, cypresses standing dark among them. */
  private addTrees(roadHalf: number): void {
    const random = seeded(2711);
    const bark = this.material({ color: 0x5a4a3a, roughness: 1 });
    const silver = this.material({ color: 0x8a9a6a, roughness: 1, flatShading: true });
    const dark = this.material({ color: 0x2a4a2a, roughness: 1 });
    const trunk = new CylinderGeometry(0.12, 0.2, 2, 5);
    trunk.translate(0, 1, 0);
    const crown = new DodecahedronGeometry(1.4, 0);
    crown.scale(1.2, 0.8, 1.2);
    const spire = new ConeGeometry(0.8, 9, 8);
    spire.translate(0, 4.8, 0);
    this.disposables.push(trunk, crown, spire);
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 5) {
      const k = Math.floor(random() * STEPS);
      const tree = new Group();
      if (random() < 0.25) {
        tree.add(new Mesh(spire, dark));
      } else {
        const top = new Mesh(crown, silver);
        top.position.y = 2.4;
        top.rotation.y = random() * 6;
        tree.add(new Mesh(trunk, bark), top);
      }
      tree.children.forEach((c) => (c.castShadow = true));
      tree.position.y = terrace(k);
      tree.scale.setScalar(0.8 + random() * 0.4);
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset,
        x: roadHalf + FOOT + k * TREAD + 1 + random() * (TREAD - 2),
      });
    }
  }

  /** Pastel villas with green shutters and terracotta roofs on the upper terraces. */
  private addVillas(roadHalf: number): void {
    const random = seeded(2721);
    const walls = ['#f4d0a0', '#f2b8a0', '#f8e8b8', '#e8a888', '#f4e4d0'].map((c, k) =>
      this.material({ map: this.track(villaTexture(c, k)), roughness: 0.85 }),
    );
    const tiles = this.material({ color: 0xb85a3a, roughness: 0.8 });
    const hip = new ConeGeometry(1, 1, 4);
    hip.rotateY(Math.PI / 4);
    this.disposables.push(hip);
    for (let offset = 15; offset < LOOP; offset += 35 + random() * 30) {
      const k = 4 + Math.floor(random() * (STEPS - 4));
      const villa = new Group();
      const w = 6;
      const d = 8 + random() * 4;
      const h = 6 + random() * 3;
      const body = new Mesh(this.unit, walls[Math.floor(random() * walls.length)]!);
      body.scale.set(w, h, d);
      body.position.y = h / 2;
      const roof = new Mesh(hip, tiles);
      roof.scale.set(w * 0.78, 2, d * 0.78);
      roof.position.y = h + 1;
      villa.add(body, roof);
      villa.children.forEach((c) => (c.castShadow = true));
      villa.position.y = terrace(k);
      const holder = new Group();
      holder.add(villa);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + FOOT + k * TREAD + TREAD / 2 });
    }
  }

  /** Palms along the sea wall. */
  private addPalms(roadHalf: number): void {
    const random = seeded(2731);
    const bark = this.material({ color: 0x8a7a5a, roughness: 1 });
    const frond = this.material({ color: 0x4a7a3a, roughness: 0.9, side: 2 });
    const trunk = new CylinderGeometry(0.18, 0.28, 8, 6);
    trunk.translate(0, 4, 0);
    const leaf = new PlaneGeometry(0.8, 3.4);
    leaf.translate(0, 1.7, 0);
    this.disposables.push(trunk, leaf);
    for (let offset = 6; offset < LOOP; offset += 14 + random() * 14) {
      const palm = new Group();
      palm.add(new Mesh(trunk, bark));
      for (let k = 0; k < 9; k++) {
        const f = new Mesh(leaf, frond);
        f.position.y = 8;
        f.rotation.set(1.1 + random() * 0.4, (k / 9) * Math.PI * 2, 0, 'YXZ');
        palm.add(f);
      }
      palm.rotation.z = (random() - 0.5) * 0.2;
      palm.children.forEach((c) => (c.castShadow = true));
      this.group.add(palm);
      this.props.push({ mesh: palm, offset, x: -roadHalf - 2.6 });
    }
  }

  /** The banner arch across the road counting down to San Remo. */
  private addArch(roadHalf: number): void {
    const arch = new Group();
    const blue = this.material({ color: 0x2a7ad8, roughness: 0.5 });
    for (const x of [-roadHalf - 0.6, roadHalf + 0.6]) {
      const leg = new Mesh(this.unit, blue);
      leg.scale.set(0.8, 6, 0.8);
      leg.position.set(x, 3, 0);
      arch.add(leg);
    }
    const banner = new Mesh(
      new PlaneGeometry(roadHalf * 2 + 2, 1.6),
      this.material({ map: this.track(archTexture()), roughness: 0.6 }),
    );
    banner.position.y = 5.4;
    this.disposables.push(banner.geometry);
    arch.add(banner);
    arch.children.forEach((c) => (c.castShadow = true));
    this.group.add(arch);
    this.props.push({ mesh: arch, offset: ARCH, x: 0 });
  }

  /** The tifosi at the roadside, bouncing, flags flying over them. */
  private addFans(roadHalf: number): void {
    const random = seeded(2741);
    const cloth = new PlaneGeometry(1.2, 0.8);
    cloth.translate(0.6, 0, 0);
    const pole = new CylinderGeometry(0.02, 0.02, 2.2, 4);
    pole.translate(0, 1.1, 0);
    this.disposables.push(cloth, pole);
    const flagMats = [
      flagTexture('italia'),
      flagTexture('blue'),
      flagTexture('belgium'),
      flagTexture('france'),
    ].map((t) => this.material({ map: this.track(t), roughness: 0.8, side: 2 }));
    const stick = this.material({ color: 0x3a3a3a });
    for (let offset = 0; offset < LOOP; offset += 1 + random() * 2.4) {
      const side = random() < 0.55 ? 1 : -1;
      const x = side * (roadHalf + 0.4 + random() * (side > 0 ? 1.4 : 0.4));
      this.fans.push({
        offset,
        x,
        heading: (side < 0 ? -Math.PI / 2 : Math.PI / 2) + (random() - 0.5) * 0.8,
        phase: random() * 6,
      });
      if (random() < 0.2) {
        const holder = new Group();
        const f = new Mesh(cloth, flagMats[Math.floor(random() * 4)]!);
        f.position.y = 2.6;
        this.flags.push(f);
        holder.add(new Mesh(pole, stick), f);
        holder.position.y = 0.6;
        const outer = new Group();
        outer.add(holder);
        this.group.add(outer);
        this.props.push({ mesh: outer, offset: offset + 0.3, x: x + 0.3 });
      }
    }
    this.crowd = new Figures(this.group, this.disposables, this.fans.length, TIFOSI_WEAR, 2747);
  }

  /**
   * Ahead: the Poggio's village and church tower on the hill, San Remo along the shore below,
   * yachts on the sea, and the green Ligurian Alps behind.
   */
  private addRiviera(): void {
    const random = seeded(2751);
    const green = this.material({
      map: this.repeat(maquisTexture(), 30, 30),
      color: 0x8aa070,
      roughness: 1,
      flatShading: true,
    });
    const alp = new ConeGeometry(1, 1, 7);
    this.disposables.push(alp);
    for (let k = 0; k < 10; k++) {
      const m = new Mesh(alp, green);
      const h = 220 + random() * 260;
      m.scale.set(320 + random() * 260, h, 300);
      m.position.set(-300 + k * 260 + random() * 80, h / 2 - 40, -1500 - random() * 400);
      m.rotation.y = random();
      this.horizon.add(m);
    }
    // The Poggio's hill and its village with the church tower.
    const hill = new Mesh(alp, green);
    hill.scale.set(320, 120, 260);
    hill.position.set(80, 20, -700);
    this.horizon.add(hill);
    const pastel = [0xf4d0a0, 0xf2b8a0, 0xf8e8b8, 0xe8a888, 0xf4e4d0].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    const tiles = this.material({ color: 0xb85a3a, roughness: 0.8 });
    for (let k = 0; k < 22; k++) {
      const a = random() * Math.PI * 2;
      const rr = random() * 55;
      const house = new Mesh(this.unit, pastel[k % pastel.length]!);
      const h = 8 + random() * 6;
      house.scale.set(10 + random() * 6, h, 10 + random() * 6);
      house.position.set(80 + Math.cos(a) * rr, 70 + h / 2 - rr * 0.3, -700 + Math.sin(a) * rr);
      const roof = new Mesh(this.unit, tiles);
      roof.scale.set(house.scale.x + 1, 1.2, house.scale.z + 1);
      roof.position.set(house.position.x, house.position.y + h / 2 + 0.6, house.position.z);
      this.horizon.add(house, roof);
    }
    const tower = new Mesh(this.unit, this.material({ color: 0xf0e0c0, roughness: 0.8 }));
    tower.scale.set(8, 40, 8);
    tower.position.set(90, 100, -690);
    const spire = new Mesh(new ConeGeometry(6, 12, 4), tiles);
    spire.position.set(90, 126, -690);
    this.disposables.push(spire.geometry);
    this.horizon.add(tower, spire);
    // San Remo strung along the shore to the left ahead.
    for (let k = 0; k < 40; k++) {
      const b = new Mesh(this.unit, pastel[k % pastel.length]!);
      const h = 10 + random() * 24;
      b.scale.set(20 + random() * 20, h, 20 + random() * 20);
      b.position.set(-700 + random() * 500, -62 + h / 2, -1100 - random() * 400);
      this.horizon.add(b);
    }
    // Yachts at anchor.
    const hull = this.material({ color: 0xf8f8f4, roughness: 0.4 });
    const mast = new CylinderGeometry(0.3, 0.3, 26, 4);
    mast.translate(0, 13, 0);
    this.disposables.push(mast);
    for (let k = 0; k < 9; k++) {
      const boat = new Group();
      const body = new Mesh(this.unit, hull);
      body.scale.set(6, 3, 18);
      boat.add(body);
      if (random() < 0.6) boat.add(new Mesh(mast, hull));
      boat.position.set(-250 - random() * 700, -61, -200 - random() * 1000);
      boat.rotation.y = random() * 6;
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

/** Honey-coloured dry-stone terrace wall. */
function stoneTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b8a080', 2761);
    const random = seeded(2763);
    g.fillStyle = 'rgba(60,50,40,0.4)';
    for (let y = 0; y < 128; y += 10 + random() * 6) {
      g.fillRect(0, y, 128, 2);
      for (let x = random() * 20; x < 128; x += 14 + random() * 14) g.fillRect(x, y, 2, 12);
    }
  });
}

/** A terrace's tread: green growth and dry earth. */
function treadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a9a4a', 2771);
    const random = seeded(2773);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(160,130,90,0.45)' : 'rgba(240,200,80,0.5)';
      g.fillRect(random() * 128, random() * 128, 3 + random() * 8, 2 + random() * 5);
    }
  });
}

/** The maquis: dark scrub, pale rock and broom in flower. */
function maquisTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a7a3a', 2781);
    const random = seeded(2783);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = ['rgba(200,190,170,0.5)', 'rgba(255,214,60,0.6)', 'rgba(40,60,30,0.5)'][
        Math.floor(random() * 3)
      ]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 10, 2 + random() * 6);
    }
  });
}

/** The sea: deep blue with sunlit glints. */
function seaTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#3a7ab8', 2791);
    const random = seeded(2793);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(255,255,255,${0.3 + random() * 0.5})`;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 8, 1);
    }
  });
}

/** A villa's front: plaster, green shutters, a balcony. */
function villaTexture(wall: string, k: number): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, wall, 2801 + k);
    for (const y of [20, 70])
      for (let x = 14; x < 128; x += 36) {
        g.fillStyle = '#2a3a44';
        g.fillRect(x, y, 16, 26);
        g.fillStyle = '#3a6a4a';
        g.fillRect(x - 6, y, 6, 26);
        g.fillRect(x + 16, y, 6, 26);
      }
  });
}

/** The arch's banner. */
function archTexture(): CanvasTexture {
  return canvasTexture(512, 96, (g) => {
    g.fillStyle = '#2a7ad8';
    g.fillRect(0, 0, 512, 96);
    g.fillStyle = '#ffffff';
    g.font = 'bold 50px sans-serif';
    g.textAlign = 'center';
    g.fillText('SAN REMO  ·  2 KM', 256, 66, 490);
  });
}

/** A tifoso's flag. */
function flagTexture(kind: 'italia' | 'blue' | 'belgium' | 'france'): CanvasTexture {
  const stripes: Record<typeof kind, string[]> = {
    italia: ['#009246', '#ffffff', '#ce2b37'],
    blue: ['#2a7ad8', '#2a7ad8', '#2a7ad8'],
    belgium: ['#1d1f24', '#ffd23f', '#ef3340'],
    france: ['#002395', '#ffffff', '#ed2939'],
  };
  return canvasTexture(96, 64, (g) =>
    stripes[kind].forEach((c, k) => {
      g.fillStyle = c;
      g.fillRect(k * 32, 0, 32, 64);
    }),
  );
}
