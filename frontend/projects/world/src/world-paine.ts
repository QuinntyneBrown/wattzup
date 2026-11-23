// Torres del Paine's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// Patagonian park on a bright, wild afternoon with the wind howling off the ice. The rider
// follows the gravel road along Lago Pehoé: on the left the lake lies milky turquoise, its water
// whipped into white crests; on the right the steppe rolls away in golden tussock grass that
// streams in the wind, with thorny calafate bushes and lenga trees bent flat by it. Guanacos
// graze and lift their heads, and a condor wheels overhead. Ahead the massif rises straight from
// the lake: the Cuernos' pale granite horns capped in black slate, the three Torres standing
// like needles behind, Paine Grande's glaciers hung on its shoulder, and long lens-shaped clouds
// stacked over the summits. Built on the shared kit (world-kit.ts) on the pattern of Old Town's
// street.
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

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The lake lies LAKE metres below the road. */
const LAKE = 12;

const TREKKER_WEAR = {
  tops: ['#d8442a', '#2a6a9a', '#e8c040', '#3a8a5a', '#1d1f24', '#ff6b5a'],
  bottoms: ['#2f3e5c', '#1d1f24', '#5a5f69', '#8a7a64'],
  skins: ['#f0c8a0', '#c48a5f', '#e2b48c', '#8d5a3b'],
};

export class PaineStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly trekkers: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly tussocks: Mesh[] = [];
  private readonly guanacos: { mesh: Group; phase: number }[] = [];
  private condor: Group | null = null;
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
    this.addGravel(roadHalf, points);
    this.addSteppe(roadHalf, points);
    this.addTussocks(roadHalf);
    this.addShrubs(roadHalf);
    this.addGuanacos(roadHalf);
    this.addTrekkers(roadHalf);
    this.addMassif();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The wind streams the grass and whips the lake; the guanacos graze; the condor wheels.
    this.tussocks.forEach(
      (t, i) => (t.rotation.z = -0.25 + Math.sin(seconds * 3 + i * 0.7) * 0.12),
    );
    if (this.lake) this.lake.offset.set(seconds * 0.02, seconds * 0.006);
    for (const g of this.guanacos)
      g.mesh.children[1]!.rotation.x = 0.4 + Math.sin(seconds * 0.6 + g.phase) * 0.6;
    if (this.condor) {
      const a = seconds * 0.15;
      this.condor.position.set(
        Math.cos(a) * 60 + 30,
        70 + Math.sin(a * 2) * 6,
        Math.sin(a) * 60 - 160,
      );
      this.condor.rotation.set(0, -a, 0.3);
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the lake on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - LAKE - 20);
      position.setY(i * 2 + 1, p.height - LAKE - 20);
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
      this.trekkers.forEach((t, i) => {
        const metres = loopMetres(t.offset + t.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4 + t.phase)) * 0.04;
        crowd.set(i, t.x, heightAt(metres) + step, -metres, t.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The gravel road's loose grey-brown stones across its width, and its soft shoulders. */
  private addGravel(roadHalf: number, points: number): void {
    const r = roadHalf;
    const gravel = this.material({ map: this.repeat(gravelTexture(), 4, 4), roughness: 1 });
    this.ribbons.add(points, gravel, [
      [r + 1, -0.02],
      [r, 0.012],
      [-r, 0.012],
      [-r - 1, -0.02],
    ]);
  }

  /** The steppe rolling up on the right; the bank falling to the lake's stony shore on the left. */
  private addSteppe(roadHalf: number, points: number): void {
    const r = roadHalf;
    const steppe = this.material({ map: this.repeat(steppeTexture(), 6, 6), roughness: 1 });
    const shore = this.material({ map: this.repeat(shingleTexture(), 2, 2), roughness: 1 });
    this.ribbons.add(points, steppe, [
      [r + 500, 70],
      [r + 80, 10],
      [r + 1, -0.02],
    ]);
    this.ribbons.add(points, steppe, [
      [-r - 1, -0.02],
      [-r - 8, -2],
      [-r - 20, -LAKE + 1],
    ]);
    this.ribbons.add(points, shore, [
      [-r - 20, -LAKE + 1],
      [-r - 26, -LAKE - 0.5],
    ]);
  }

  /** The golden tussocks of coirón grass, streaming in the wind. */
  private addTussocks(roadHalf: number): void {
    const random = seeded(3701);
    const golds = [0xc8a858, 0xb89848, 0xd8b868, 0xa88a40].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const blades = new ConeGeometry(0.35, 1.2, 9);
    blades.translate(0, 0.6, 0);
    this.disposables.push(blades);
    for (let offset = 0; offset < LOOP; offset += 0.6 + random() * 1.2) {
      const side = random() < 0.7 ? 1 : -1;
      const d = 1.5 + random() * (side > 0 ? 40 : 6);
      const t = new Mesh(blades, golds[Math.floor(random() * golds.length)]!);
      t.scale.set(0.8 + random() * 0.8, 0.7 + random() * 0.8, 0.8 + random() * 0.8);
      t.castShadow = true;
      this.tussocks.push(t);
      const holder = new Group();
      t.position.y = side > 0 ? (d / 80) * 10 - 0.05 : -(d / 7) * 2;
      holder.add(t);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** Thorny calafate bushes, boulders, and lenga trees bent flat by the wind. */
  private addShrubs(roadHalf: number): void {
    const random = seeded(3711);
    const calafate = this.material({ color: 0x4a5a2a, roughness: 1, flatShading: true });
    const lenga = this.material({ color: 0x3a6a2a, roughness: 1, flatShading: true });
    const bark = this.material({ color: 0x5a4a3e, roughness: 1 });
    const granite = this.material({ color: 0x9a948a, roughness: 1, flatShading: true });
    const bush = new DodecahedronGeometry(0.9, 0);
    bush.scale(1.2, 0.6, 1.2);
    const trunk = new CylinderGeometry(0.15, 0.3, 4, 5);
    trunk.translate(0, 2, 0);
    const crown = new SphereGeometry(2, 8, 5);
    crown.scale(1.8, 0.6, 1);
    this.disposables.push(bush, trunk, crown);
    for (let offset = 0; offset < LOOP; offset += 4 + random() * 8) {
      const d = 3 + random() * 45;
      const thing = new Group();
      const kind = random();
      if (kind < 0.5) {
        thing.add(new Mesh(bush, calafate));
      } else if (kind < 0.75) {
        const b = new Mesh(bush, granite);
        b.scale.setScalar(0.8 + random() * 1.4);
        thing.add(b);
      } else {
        // A lenga leaning hard away from the west wind, its crown streamed out to the east.
        const t = new Mesh(trunk, bark);
        t.rotation.z = -0.5;
        const c = new Mesh(crown, lenga);
        c.position.set(2.4, 3.6, 0);
        thing.add(t, c);
        thing.scale.setScalar(0.8 + random() * 0.6);
      }
      thing.children.forEach((c) => (c.castShadow = true));
      thing.position.y = (d / 80) * 10;
      const holder = new Group();
      holder.add(thing);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + d });
    }
  }

  /** Guanacos grazing the steppe, cinnamon-backed and pale-bellied. */
  private addGuanacos(roadHalf: number): void {
    const random = seeded(3721);
    const coat = this.material({ color: 0xb87a44, roughness: 1 });
    const belly = this.material({ color: 0xf0e8dc, roughness: 1 });
    const body = new SphereGeometry(0.5, 8, 6);
    body.scale(0.9, 0.9, 2);
    const leg = new CylinderGeometry(0.06, 0.05, 1.1, 4);
    leg.translate(0, -0.55, 0);
    const neck = new CylinderGeometry(0.1, 0.16, 1.2, 5);
    neck.translate(0, 0.6, 0);
    const head = new SphereGeometry(0.18, 6, 5);
    head.scale(1, 1, 1.8);
    this.disposables.push(body, leg, neck, head);
    for (let offset = 25; offset < LOOP; offset += 50 + random() * 60)
      for (let k = 0; k < 2 + Math.floor(random() * 3); k++) {
        const guanaco = new Group();
        const b = new Mesh(body, coat);
        b.position.y = 1.4;
        const n = new Group();
        n.position.set(0, 1.6, -0.8);
        const nm = new Mesh(neck, coat);
        const h = new Mesh(head, coat);
        h.position.set(0, 1.25, -0.15);
        n.add(nm, h);
        const under = new Mesh(body, belly);
        under.scale.set(0.8, 0.5, 0.9);
        under.position.y = 1.2;
        guanaco.add(b, n, under);
        for (const [x, z] of [
          [-0.2, -0.7],
          [0.2, -0.7],
          [-0.2, 0.7],
          [0.2, 0.7],
        ] as const) {
          const l = new Mesh(leg, coat);
          l.position.set(x, 1.2, z);
          guanaco.add(l);
        }
        guanaco.rotation.y = random() * 6;
        guanaco.children.forEach((c) => (c.castShadow = true));
        const d = 8 + random() * 25;
        guanaco.position.y = (d / 80) * 10;
        const holder = new Group();
        holder.add(guanaco);
        this.group.add(holder);
        this.guanacos.push({ mesh: guanaco, phase: random() * 6 });
        this.props.push({ mesh: holder, offset: offset + k * 4, x: roadHalf + d + k * 2 });
      }
  }

  /** Trekkers leaning into the wind with their packs. */
  private addTrekkers(roadHalf: number): void {
    const random = seeded(3731);
    for (let offset = 12; offset < LOOP; offset += 20 + random() * 25)
      this.trekkers.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 0.5),
        speed: (random() < 0.5 ? 1 : -1) * (0.8 + random() * 0.3),
        phase: random() * 6,
      });
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.trekkers.length,
      TREKKER_WEAR,
      3737,
    );
  }

  /**
   * Ahead: Lago Pehoé's turquoise water and the massif rising from it — the Cuernos' granite horns
   * capped in black, the three Torres behind, Paine Grande's glaciers — under lenticular clouds,
   * and a condor overhead.
   */
  private addMassif(): void {
    const random = seeded(3741);
    const ripple = this.track(lakeTexture());
    ripple.wrapS = RepeatWrapping;
    ripple.wrapT = RepeatWrapping;
    ripple.repeat.set(120, 120);
    this.lake = ripple;
    const water = new Mesh(
      new PlaneGeometry(6000, 6000),
      this.material({
        map: ripple,
        color: 0x7ac8c8,
        roughness: 0.3,
        metalness: 0.2,
        emissive: 0x2a6a6a,
        emissiveIntensity: 0.35,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-3020, -LAKE, -2000);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
    const granite = this.material({
      map: this.repeat(hornTexture(), 1, 1),
      roughness: 0.9,
      flatShading: true,
    });
    const slate = this.material({ color: 0x2a2624, roughness: 1, flatShading: true });
    const ice = this.material({
      color: 0xe8f2f8,
      roughness: 0.6,
      emissive: 0x8aa8c0,
      emissiveIntensity: 0.2,
    });
    const flank = this.material({
      map: this.repeat(steppeTexture(), 40, 40),
      color: 0x8a8a6a,
      roughness: 1,
      flatShading: true,
    });
    const cone = new ConeGeometry(1, 1, 8);
    const spire = new CylinderGeometry(0.55, 1, 1, 7);
    this.disposables.push(cone, spire);
    // The massif, standing far across the lake.
    const peaks = new Group();
    peaks.position.set(300, 0, -3600);
    this.horizon.add(peaks);
    // The massif's base rising straight from the lake.
    const base = new Mesh(cone, flank);
    base.scale.set(2600, 900, 1200);
    base.position.set(-300, 450 - LAKE - 40, -2600);
    peaks.add(base);
    // The Cuernos: pale granite horns with their black slate caps.
    for (const [x, h, w] of [
      [-500, 1400, 260],
      [-260, 1550, 240],
      [-40, 1350, 220],
    ] as const) {
      const horn = new Mesh(spire, granite);
      horn.scale.set(w, h, w);
      horn.position.set(x, h / 2 - 40, -2300);
      const cap = new Mesh(spire, slate);
      cap.scale.set(w * 0.58, 320, w * 0.58);
      cap.position.set(x, h - 40 + 150, -2300);
      peaks.add(horn, cap);
    }
    // The three Torres, needles of granite behind on the right.
    for (const [x, h] of [
      [420, 1900],
      [560, 2050],
      [700, 1850],
    ] as const) {
      const tower = new Mesh(spire, granite);
      tower.scale.set(120, h, 120);
      tower.position.set(x + 500, h / 2 - 40, -1700);
      const tip = new Mesh(cone, granite);
      tip.scale.set(70, 160, 70);
      tip.position.set(x + 500, h - 40 + 80, -1700);
      peaks.add(tower, tip);
    }
    // The Torres' own ridge, which they stand on.
    const ridge = new Mesh(cone, flank);
    ridge.scale.set(1100, 800, 700);
    ridge.position.set(1060, 360, -1600);
    peaks.add(ridge);
    // Paine Grande on the left, its glaciers on the shoulder.
    const grande = new Mesh(cone, granite);
    grande.scale.set(1400, 2000, 1000);
    grande.position.set(-1500, 1000 - 40, -2900);
    const glacier = new Mesh(cone, ice);
    glacier.scale.set(820, 700, 600);
    glacier.position.set(-1500, 1700, -2800);
    peaks.add(grande, glacier);
    // Lower ridges round the lake.
    for (let k = 0; k < 6; k++) {
      const ridge = new Mesh(cone, flank);
      const h = 300 + random() * 300;
      ridge.scale.set(700 + random() * 500, h, 500);
      ridge.position.set(-1800 - random() * 600, h / 2 - LAKE, 400 - k * 600);
      this.horizon.add(ridge);
    }
    // Lenticular clouds stacked over the summits.
    const cloud = this.material({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      roughness: 1,
      emissive: 0xd0d0d8,
      emissiveIntensity: 0.4,
    });
    const lens = new SphereGeometry(1, 16, 8);
    this.disposables.push(lens);
    for (let k = 0; k < 5; k++) {
      const c = new Mesh(lens, cloud);
      c.scale.set(900 - k * 120, 40, 400);
      c.position.set(-200 + (random() - 0.5) * 300, 2300 + k * 90, -3000);
      peaks.add(c);
    }
    // The condor.
    const black = this.material({ color: 0x1a1a1a, roughness: 0.9, side: 2 });
    const white = this.material({ color: 0xf2f2f2, roughness: 0.9 });
    const condor = new Group();
    const body = new Mesh(new SphereGeometry(0.5, 8, 6), black);
    body.scale.set(1, 0.8, 2.2);
    const wings = new Mesh(new PlaneGeometry(6, 1.2), black);
    wings.rotation.x = -Math.PI / 2;
    const ruff = new Mesh(new SphereGeometry(0.35, 6, 5), white);
    ruff.position.z = -0.9;
    condor.add(body, wings, ruff);
    this.disposables.push(body.geometry, wings.geometry, ruff.geometry);
    this.condor = condor;
    this.horizon.add(condor);
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

/** The road's gravel: loose grey and brown stones with wheel ruts. */
function gravelTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a7e6e', 3751);
    const random = seeded(3753);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = ['#a89a86', '#5a5248', '#7a6a58', '#c8bca8'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 128, random() * 128, 1 + random() * 2, 1 + random() * 2);
    }
    g.fillStyle = 'rgba(70,62,52,0.25)';
    g.fillRect(28, 0, 14, 128);
    g.fillRect(86, 0, 14, 128);
  });
}

/** The steppe's golden grass and grey-green scrub. */
function steppeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b89a58', 3761);
    const random = seeded(3763);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = ['#d8b868', '#8a8a5a', '#a88a48', '#6a7a4a'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 128, random() * 128, 1 + random() * 3, 2 + random() * 3);
    }
  });
}

/** The lake shore's grey shingle. */
function shingleTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#8a8680', 3771));
}

/** Lago Pehoé's milky turquoise water with the wind's white crests. */
function lakeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5ab8b8', 3781);
    const random = seeded(3783);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(255,255,255,${0.35 + random() * 0.5})`;
      g.fillRect(random() * 128, random() * 128, 4 + random() * 8, 1);
    }
  });
}

/** The horns' pale granite, streaked dark by meltwater. */
function hornTexture(): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    speckle(g, 128, 256, '#c8c0b0', 3791);
    const random = seeded(3793);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(60,56,52,${0.15 + random() * 0.25})`;
      g.fillRect(random() * 128, random() * 100, 1 + random() * 3, 60 + random() * 150);
    }
  });
}
