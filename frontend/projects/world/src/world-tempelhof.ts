// Tempelhof Field's runway, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Berlin's
// old airport on a breezy summer evening, its runways now a park. The rider races down the
// runway's concrete with its white centre line and threshold bars, the taxiway's yellow signs
// and the old edge lights still beside it. The field runs flat and wide either side in long
// grass behind low fences, where the skylarks nest; skaters, joggers and kite-landboarders share
// the runway, and the community gardens' raised beds and sheds huddle by the beer garden. Kites
// in every colour fly overhead, dipping and climbing on the wind. Around the field's edge the
// great curved terminal stretches in pale limestone, the radar tower stands over it, and far
// across the city the Fernsehturm rises with its silver sphere. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  BufferGeometry,
  type CanvasTexture,
  CylinderGeometry,
  DodecahedronGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  TorusGeometry,
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

/** The runway repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The runway's concrete runs SHOULDER metres beyond the ride's lane either side. */
const SHOULDER = 16;

const PARK_WEAR = {
  tops: ['#ffffff', '#ff6b5a', '#2ec4b6', '#ffd23f', '#3a86ff', '#f15bb5', '#1d1f24', '#9b5cff'],
  bottoms: ['#2f3e5c', '#1d1f24', '#e8d8b0', '#5a5f69', '#3a86ff'],
  skins: ['#f0c8a0', '#c48a5f', '#8d5a3b', '#e2b48c', '#f5d3b5', '#5a3a29'],
};

interface Kite {
  readonly mesh: Group;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly phase: number;
}

export class TempelhofStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly kites: Kite[] = [];
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
    this.addRunway(roadHalf, points);
    this.addEdgeLights(roadHalf);
    this.addSigns(roadHalf);
    this.addFences(roadHalf);
    this.addGardens(roadHalf);
    this.addPeople(roadHalf);
    this.addKites();
    this.addSkyline();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The kites dip, climb and swing on the wind, tails trailing.
    for (const k of this.kites) {
      const a = seconds * 0.6 + k.phase;
      k.mesh.position.set(
        k.x + Math.sin(a) * 6,
        k.y + Math.sin(a * 1.7) * 4,
        k.z + Math.cos(a * 0.8) * 3,
      );
      k.mesh.rotation.z = Math.sin(a * 1.3) * 0.5;
      k.mesh.children[1]!.rotation.z = Math.sin(a * 3) * 0.4;
    }
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
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
        const step = p.speed ? Math.abs(Math.sin(this.time * 5 + p.phase)) * 0.05 : 0;
        crowd.set(
          i,
          p.x,
          heightAt(metres) + step,
          -metres,
          p.speed > 0 ? 0 : p.speed < 0 ? Math.PI : Math.PI / 2,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The runway's concrete across the ride and its shoulders, with its markings; the long grass. */
  private addRunway(roadHalf: number, points: number): void {
    const r = roadHalf;
    const runway = this.material({
      map: this.repeat(runwayTexture(), (r + SHOULDER) * 2, 60),
      roughness: 0.9,
    });
    const grass = this.material({ map: this.repeat(grassTexture(), 8, 8), roughness: 1 });
    this.ribbons.add(points, runway, [
      [r + SHOULDER, 0.012],
      [-r - SHOULDER, 0.012],
    ]);
    this.ribbons.add(points, grass, [
      [r + 600, 0.1],
      [r + SHOULDER, 0.02],
    ]);
    this.ribbons.add(points, grass, [
      [-r - SHOULDER, 0.02],
      [-r - 600, 0.1],
    ]);
  }

  /** The old edge lights in their low housings along the runway's edges. */
  private addEdgeLights(roadHalf: number): void {
    const housing = this.material({ color: 0x3a3c40, roughness: 0.6 });
    const lens = this.material({ color: 0xffffff, emissive: 0xfff2c8, emissiveIntensity: 0.7 });
    for (let offset = 0; offset < LOOP; offset += 30)
      for (const side of [-1, 1]) {
        const light = new Group();
        const base = new Mesh(this.unit, housing);
        base.scale.set(0.3, 0.3, 0.3);
        base.position.y = 0.15;
        const glass = new Mesh(this.unit, lens);
        glass.scale.set(0.22, 0.12, 0.22);
        glass.position.y = 0.36;
        light.add(base, glass);
        const holder = new Group();
        holder.add(light);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + SHOULDER + 0.6) });
      }
  }

  /** The taxiway's yellow and black signs on their frangible legs. */
  private addSigns(roadHalf: number): void {
    const legs = this.material({ color: 0xc8c8c8, roughness: 0.5 });
    const faces = ['A3', 'B → 09L', '27R ·  A', 'C'].map((text) =>
      this.material({ map: this.track(signTexture(text)), roughness: 0.6 }),
    );
    for (let k = 0; k < 4; k++) {
      const sign = new Group();
      const face = new Mesh(this.unit, faces[k]!);
      face.scale.set(0.2, 1, 3.2);
      face.position.y = 1.0;
      sign.add(face);
      for (const z of [-1.2, 1.2]) {
        const leg = new Mesh(this.unit, legs);
        leg.scale.set(0.08, 0.6, 0.08);
        leg.position.set(0, 0.3, z);
        sign.add(leg);
      }
      sign.rotation.y = k % 2 ? Math.PI / 2 + 0.6 : Math.PI / 2 - 0.6;
      const holder = new Group();
      holder.add(sign);
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset: 40 + k * 95,
        x: (k % 2 ? -1 : 1) * (roadHalf + SHOULDER + 3),
      });
    }
  }

  /** The low fences around the skylarks' meadows, the long grass and wildflowers behind them. */
  private addFences(roadHalf: number): void {
    const random = seeded(3601);
    const wood = this.material({ color: 0x8a7a64, roughness: 1 });
    const wire = this.material({ color: 0x9a9a9a, roughness: 0.5 });
    const tall = [0x9aa04a, 0x8a9a3a, 0xb8b060].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const tuft = new DodecahedronGeometry(0.8, 0);
    tuft.scale(1, 0.6, 1);
    this.disposables.push(tuft);
    for (let offset = 0; offset < LOOP; offset += 4)
      for (const side of [-1, 1]) {
        const bay = new Group();
        const post = new Mesh(this.unit, wood);
        post.scale.set(0.1, 1.0, 0.1);
        post.position.y = 0.5;
        const line = new Mesh(this.unit, wire);
        line.scale.set(0.02, 0.02, 4);
        line.position.set(0, 0.85, -2);
        bay.add(post, line);
        for (let k = 0; k < 3; k++) {
          const t = new Mesh(tuft, tall[Math.floor(random() * tall.length)]!);
          t.position.set(side * (2 + random() * 20), 0.2, -random() * 4);
          t.scale.setScalar(0.6 + random() * 0.8);
          bay.add(t);
        }
        const holder = new Group();
        holder.add(bay);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + SHOULDER + 6) });
      }
  }

  /** The community gardens' raised beds and sheds, and the beer garden's parasols and benches. */
  private addGardens(roadHalf: number): void {
    const random = seeded(3611);
    const timber = this.material({ color: 0x9a7a54, roughness: 1 });
    const greens = [0x4a8a2a, 0x6aa03a, 0x3a6a2a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const blooms = [0xff6b5a, 0xffd23f, 0xf15bb5, 0xffffff].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const sheds = [0x3a86ff, 0xff6b5a, 0x2ec4b6, 0xffd23f].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    const canvas = this.material({ color: 0xf4f0e8, roughness: 0.9, side: 2 });
    const plant = new SphereGeometry(0.4, 6, 4);
    const shade = new CylinderGeometry(0.1, 1.8, 0.6, 8, 1, true);
    this.disposables.push(plant, shade);
    for (const [offset, side] of [
      [60, -1],
      [250, 1],
    ] as const) {
      const garden = new Group();
      for (let k = 0; k < 10; k++) {
        const bed = new Group();
        const box = new Mesh(this.unit, timber);
        box.scale.set(1.4, 0.6, 2.6);
        box.position.y = 0.3;
        bed.add(box);
        for (let p = 0; p < 4; p++) {
          const leaf = new Mesh(
            plant,
            random() < 0.3
              ? blooms[Math.floor(random() * blooms.length)]!
              : greens[Math.floor(random() * greens.length)]!,
          );
          leaf.position.set((random() - 0.5) * 1, 0.75, -1 + p * 0.65);
          bed.add(leaf);
        }
        bed.position.set((k % 5) * 3 * side, 0, Math.floor(k / 5) * 4);
        bed.rotation.y = (random() - 0.5) * 0.4;
        garden.add(bed);
      }
      for (let k = 0; k < 3; k++) {
        const shed = new Mesh(this.unit, sheds[k % sheds.length]!);
        shed.scale.set(2.2, 2.2, 2.2);
        shed.position.set(side * (16 + k * 3), 1.1, 6 + k * 2);
        shed.rotation.y = random();
        garden.add(shed);
      }
      // The beer garden beside it.
      for (let k = 0; k < 4; k++) {
        const pole = new Mesh(this.unit, timber);
        pole.scale.set(0.08, 2.6, 0.08);
        pole.position.set(side * (2 + k * 4), 1.3, -10);
        const top = new Mesh(shade, canvas);
        top.position.set(side * (2 + k * 4), 2.6, -10);
        const bench = new Mesh(this.unit, timber);
        bench.scale.set(2.4, 0.75, 0.7);
        bench.position.set(side * (2 + k * 4), 0.375, -9);
        garden.add(pole, top, bench);
      }
      garden.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(garden);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + SHOULDER + 12) });
    }
  }

  /** Skaters, joggers and walkers sharing the runway, and picnickers sitting by its edge. */
  private addPeople(roadHalf: number): void {
    const random = seeded(3621);
    for (let offset = 3; offset < LOOP; offset += 4 + random() * 7) {
      const kind = random();
      this.people.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 1 + random() * (SHOULDER - 2)),
        speed:
          kind < 0.2
            ? 0
            : (random() < 0.5 ? 1 : -1) * (kind < 0.5 ? 4 + random() * 3 : 1 + random() * 1.5),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, PARK_WEAR, 3627);
  }

  /** Kites in every colour on the wind: diamonds, deltas and a big landboarding foil. */
  private addKites(): void {
    const random = seeded(3631);
    const colours = [0xff2d78, 0xffd23f, 0x2ec4b6, 0x3a86ff, 0xff6b5a, 0x9b5cff, 0x30d158];
    const diamond = new BufferGeometry();
    diamond.setAttribute(
      'position',
      new Float32BufferAttribute([0, 1.2, 0, -0.8, 0, 0, 0, -1.6, 0, 0.8, 0, 0], 3),
    );
    diamond.setIndex([0, 1, 2, 0, 2, 3]);
    diamond.computeVertexNormals();
    const foil = new TorusGeometry(5, 0.9, 4, 16, Math.PI);
    foil.scale(1, 0.5, 1.6);
    const tail = new BoxGeometry(0.12, 4, 0.02);
    tail.translate(0, -2, 0);
    this.disposables.push(diamond, foil, tail);
    for (let k = 0; k < 14; k++) {
      const colour = this.material({
        color: colours[k % colours.length]!,
        roughness: 0.6,
        side: 2,
        emissive: colours[k % colours.length]!,
        emissiveIntensity: 0.2,
      });
      const kite = new Group();
      const body = new Mesh(k % 5 === 0 ? foil : diamond, colour);
      const streamer = new Mesh(
        tail,
        this.material({ color: colours[(k + 3) % colours.length]!, side: 2 }),
      );
      streamer.position.y = k % 5 === 0 ? 0 : -1.6;
      kite.add(body, streamer);
      kite.scale.setScalar(k % 5 === 0 ? 1.4 : 2 + random() * 1.5);
      this.kites.push({
        mesh: kite,
        x: (random() - 0.5) * 160,
        y: 22 + random() * 40,
        z: -40 - random() * 220,
        phase: random() * 6,
      });
      this.horizon.add(kite);
    }
  }

  /**
   * Around the field: the curved limestone terminal with its hangars, the radar tower, the city's
   * trees and roofs along the edges, and the Fernsehturm far off with its silver sphere.
   */
  private addSkyline(): void {
    const random = seeded(3641);
    const stone = this.material({ map: this.repeat(terminalTexture(), 1, 1), roughness: 0.85 });
    const roof = this.material({ color: 0x5a5c60, roughness: 0.7 });
    // The terminal's long arc on the left ahead.
    for (let k = 0; k < 14; k++) {
      const a = -2.1 + k * 0.08;
      const block = new Mesh(this.unit, stone);
      block.scale.set(90, 34, 40);
      block.position.set(Math.cos(a) * 1000 - 150, 17, Math.sin(a) * 1000 - 100);
      block.rotation.y = -a - Math.PI / 2;
      const top = new Mesh(this.unit, roof);
      top.scale.set(92, 3, 46);
      top.position.set(block.position.x, 35, block.position.z);
      top.rotation.y = block.rotation.y;
      this.horizon.add(block, top);
    }
    // The radar tower.
    const white = this.material({ color: 0xf2f2ee, roughness: 0.6 });
    const shaft = new Mesh(new CylinderGeometry(4, 5, 70, 10), white);
    shaft.position.set(-640, 35, -1180);
    const dome = new Mesh(new SphereGeometry(9, 14, 10), white);
    dome.position.set(-640, 76, -1180);
    this.disposables.push(shaft.geometry, dome.geometry);
    this.horizon.add(shaft, dome);
    // The trees and roofs along the field's edges.
    const trees = [0x3a6a2a, 0x4a7a34, 0x2a5a24].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const flats = [0xd8c8b0, 0xc8a890, 0xe8e0d0, 0xb8b8c0].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const crown = new DodecahedronGeometry(1, 0);
    this.disposables.push(crown);
    for (let k = 0; k < 140; k++) {
      const a = (k / 140) * Math.PI * 2;
      const d = 900 + random() * 300;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d - 300;
      if (z > -100 && Math.abs(x) < 600) continue;
      const t = new Mesh(crown, trees[k % trees.length]!);
      t.scale.set(14 + random() * 10, 10 + random() * 8, 14 + random() * 10);
      t.position.set(x, 8, z);
      this.horizon.add(t);
      if (random() < 0.5) {
        const h = 18 + random() * 20;
        const flat = new Mesh(this.unit, flats[k % flats.length]!);
        flat.scale.set(40, h, 20);
        flat.position.set(x * 1.12, h / 2, z * 1.12);
        flat.rotation.y = -a;
        this.horizon.add(flat);
      }
    }
    // The Fernsehturm, far off across the city.
    const concrete = this.material({ color: 0xd8d8d4, roughness: 0.7 });
    const silver = this.material({ color: 0xc8ccd4, metalness: 0.7, roughness: 0.25 });
    const red = this.material({ color: 0xc8202a, roughness: 0.6 });
    const tower = new Group();
    const stem = new Mesh(new CylinderGeometry(9, 16, 250, 12), concrete);
    stem.position.y = 125;
    const sphere = new Mesh(new SphereGeometry(18, 18, 12), silver);
    sphere.position.y = 210;
    const mast = new Mesh(new CylinderGeometry(2, 3, 120, 6), red);
    mast.position.y = 290;
    tower.add(stem, sphere, mast);
    this.disposables.push(stem.geometry, sphere.geometry, mast.geometry);
    tower.position.set(520, 0, -2400);
    tower.scale.setScalar(1.15);
    this.horizon.add(tower);
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

/** The runway: concrete slabs, tyre marks, the white centre-line dash and the side stripes. */
function runwayTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#9a9890', 3651);
    g.fillStyle = 'rgba(60,58,54,0.35)';
    for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 256, 1);
    for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 1, 256);
    const random = seeded(3653);
    g.fillStyle = 'rgba(40,40,40,0.25)';
    for (let i = 0; i < 20; i++)
      g.fillRect(70 + random() * 116, random() * 256, 3 + random() * 4, 30 + random() * 60);
    g.fillStyle = 'rgba(245,245,240,0.9)';
    g.fillRect(126, 0, 4, 150);
    g.fillRect(6, 0, 3, 256);
    g.fillRect(247, 0, 3, 256);
  });
}

/** The field's long summer grass, flecked with wildflowers. */
function grassTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a9a4a', 3661);
    const random = seeded(3663);
    for (let i = 0; i < 200; i++) {
      g.fillStyle = ['#a8b060', '#6a8a3a', '#c8b870', '#ffffff', '#e8d040'][
        Math.floor(random() * 5)
      ]!;
      g.fillRect(random() * 128, random() * 128, 1 + random() * 2, 2 + random() * 3);
    }
  });
}

/** A taxiway sign: black letters on yellow. */
function signTexture(text: string): CanvasTexture {
  return canvasTexture(256, 80, (g) => {
    g.fillStyle = '#f2c200';
    g.fillRect(0, 0, 256, 80);
    g.fillStyle = '#111111';
    g.font = 'bold 48px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 128, 42);
  });
}

/** The terminal's pale limestone with its rows of tall windows. */
function terminalTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    speckle(g, 256, 64, '#d8ccb0', 3671);
    g.fillStyle = '#3a3e44';
    for (let x = 6; x < 256; x += 12) {
      g.fillRect(x, 10, 6, 18);
      g.fillRect(x, 36, 6, 18);
    }
  });
}
