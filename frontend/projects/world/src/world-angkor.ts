// The Angkor Temples, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Siem Reap's temple
// park at dawn, the sky warming from violet to gold and a thin mist lying on the water. The rider
// rolls along the red laterite road through the jungle, tall pale-trunked dipterocarps and sugar
// palms on both sides. On the left the wide moat lies still, lotus pads and pink flowers on its
// surface, and beyond it the five lotus-bud towers of Angkor Wat stand black against the sunrise.
// Ruined sandstone gateways crowned with faces sit at the roadside, a strangler fig's roots poured
// over one of them; monks in saffron robes walk the verge and tuk-tuks wait for the sunrise crowd.
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

/** The jungle road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The moat lies MOAT metres below the road, from BANK metres beyond the verge. */
const MOAT = 1.6;
const BANK = 7;

const MONK_WEAR = {
  tops: ['#f08a1a', '#e87a10', '#f49a2a', '#d86a10'],
  bottoms: ['#f08a1a', '#e87a10', '#d86a10'],
  skins: ['#c48a5f', '#a8704a', '#8d5a3b'],
};

export class AngkorStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private water: Texture | null = null;
  private readonly mist: Mesh[] = [];
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
    this.addLotus(roadHalf);
    this.addTrees(roadHalf);
    this.addGates(roadHalf);
    this.addTukTuks(roadHalf);
    this.addMonks(roadHalf);
    this.addAngkorWat();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    if (this.water) this.water.offset.set(seconds * 0.002, 0);
    this.mist.forEach((m, k) => (m.position.x = Math.sin(seconds * 0.05 + k) * 40));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the moat's floor. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - MOAT - 2);
      position.setY(i * 2 + 1, p.height - MOAT - 2);
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
        const bob = Math.abs(Math.sin(this.time * 3 + p.phase)) * 0.04;
        crowd.set(i, p.x, heightAt(metres) + bob, -metres, p.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The laterite road, the jungle floor on the right and the bank falling to the moat on the left. */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const laterite = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.9 });
    const floor = this.material({ map: this.repeat(floorTexture(), 4, 4), roughness: 1 });
    const grass = this.material({ map: this.repeat(grassTexture(), 4, 4), roughness: 1 });
    this.ribbons.add(points, laterite, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, floor, [
      [r + 80, 1.2],
      [r + 1.5, 0.05],
      [r, 0.02],
    ]);
    this.ribbons.add(points, grass, [
      [-r, 0.02],
      [-r - BANK, -0.2],
      [-r - BANK - 2, -MOAT - 0.4],
    ]);
    const water = this.track(moatTexture());
    water.wrapS = RepeatWrapping;
    water.wrapT = RepeatWrapping;
    water.repeat.set(1 / 12, 1 / 12);
    this.water = water;
    const moat = this.material({
      map: water,
      color: 0xe8c8b8,
      roughness: 0.05,
      metalness: 0.3,
      emissive: 0x8a5a5a,
      emissiveIntensity: 0.45,
    });
    this.ribbons.add(points, moat, [
      [-r - BANK - 1.5, -MOAT],
      [-r - 400, -MOAT],
    ]);
  }

  /** Lotus pads and pink flowers floating on the moat. */
  private addLotus(roadHalf: number): void {
    const random = seeded(7101);
    const pad = this.material({ color: 0x4a8a3a, roughness: 0.6 });
    const petal = this.material({
      color: 0xf4a0c0,
      roughness: 0.6,
      emissive: 0x4a1a2a,
      emissiveIntensity: 0.3,
    });
    const disc = new CylinderGeometry(0.5, 0.5, 0.04, 10);
    const bud = new ConeGeometry(0.16, 0.4, 6);
    this.disposables.push(disc, bud);
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 5) {
      const bed = new Group();
      for (let k = 0; k < 6; k++) {
        const p = new Mesh(disc, pad);
        p.scale.setScalar(0.6 + random() * 0.8);
        p.position.set((random() - 0.5) * 5, 0, (random() - 0.5) * 5);
        bed.add(p);
        if (random() < 0.4) {
          const f = new Mesh(bud, petal);
          f.position.set(p.position.x, 0.25, p.position.z);
          bed.add(f);
        }
      }
      bed.position.y = -MOAT + 0.03;
      const holder = new Group();
      holder.add(bed);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - BANK - 4 - random() * 30 });
    }
  }

  /** The tall pale-trunked dipterocarps and the sugar palms of the jungle. */
  private addTrees(roadHalf: number): void {
    const random = seeded(7111);
    const bark = this.material({ map: this.track(barkTexture()), roughness: 1 });
    const palmBark = this.material({ color: 0x5a4a3a, roughness: 1 });
    const leaves = [0x2a5a2a, 0x3a6a2a, 0x24502a, 0x4a7a3a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const trunk = new CylinderGeometry(0.5, 1.1, 30, 8);
    trunk.translate(0, 15, 0);
    const crown = new DodecahedronGeometry(1, 1);
    const stem = new CylinderGeometry(0.22, 0.28, 12, 6);
    stem.translate(0, 6, 0);
    const frond = new ConeGeometry(0.5, 4, 4);
    frond.rotateX(Math.PI / 2);
    frond.translate(0, 0, 2);
    this.disposables.push(trunk, crown, stem, frond);
    for (let offset = 0; offset < LOOP; offset += 5 + random() * 6)
      for (const side of [-1, 1]) {
        if (random() < (side < 0 ? 0.75 : 0.15)) continue;
        const tree = new Group();
        if (random() < 0.7) {
          tree.add(new Mesh(trunk, bark));
          // The dipterocarp's high, spreading crown.
          for (let k = 0; k < 5; k++) {
            const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
            c.scale.set(4 + random() * 3, 2.4 + random() * 1.4, 4 + random() * 3);
            c.position.set((random() - 0.5) * 8, 30 + random() * 4, (random() - 0.5) * 8);
            tree.add(c);
          }
          tree.scale.setScalar(0.7 + random() * 0.5);
        } else {
          tree.add(new Mesh(stem, palmBark));
          const head = new Group();
          head.position.y = 12;
          for (let k = 0; k < 12; k++) {
            const f = new Mesh(frond, leaves[1]!);
            f.rotation.set(-0.2 - random() * 0.4, (k / 12) * Math.PI * 2, 0, 'YXZ');
            head.add(f);
          }
          tree.add(head);
        }
        tree.children.forEach((m) => (m.castShadow = true));
        const d = side < 0 ? 1.5 + random() * 4 : 2.5 + random() * 40;
        const holder = new Group();
        holder.add(tree);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
      }
    // Low undergrowth along the jungle's edge.
    const bush = this.material({ color: 0x3a6a2a, roughness: 1, flatShading: true });
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 3) {
      const b = new Mesh(crown, bush);
      b.scale.set(1.4 + random(), 0.9 + random() * 0.6, 1.4 + random());
      b.position.y = 0.4;
      const holder = new Group();
      holder.add(b);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 2 + random() * 4 });
    }
  }

  /** Ruined sandstone gateways crowned with the carved faces, a strangler fig's roots over one. */
  private addGates(roadHalf: number): void {
    const random = seeded(7121);
    const stone = this.material({
      map: this.track(sandstoneTexture()),
      roughness: 0.95,
      flatShading: true,
    });
    const moss = this.material({ color: 0x5a6a4a, roughness: 1, flatShading: true });
    const root = this.material({ color: 0xb8aa98, roughness: 0.9 });
    const block = new DodecahedronGeometry(1, 0);
    const vine = new TorusGeometry(2.4, 0.22, 6, 12, Math.PI);
    this.disposables.push(block, vine);
    for (const [offset, fig] of [
      [60, true],
      [230, false],
    ] as const) {
      const gate = new Group();
      // The two piers and the stepped tower over the passage, its corbelled top tapering.
      for (const z of [-3, 3]) {
        const pier = new Mesh(this.unit, stone);
        pier.scale.set(4, 6, 2.2);
        pier.position.set(0, 3, z);
        gate.add(pier);
      }
      for (let k = 0; k < 5; k++) {
        const tier = new Mesh(this.unit, stone);
        const w = 8.4 - k * 1.3;
        tier.scale.set(w * 0.6, 1.6, w);
        tier.position.y = 6.8 + k * 1.6;
        gate.add(tier);
      }
      // The carved face on the tower, looking out over the road.
      const face = new Mesh(
        this.unit,
        this.material({ map: this.track(faceTexture()), roughness: 0.95 }),
      );
      face.scale.set(0.2, 3.2, 2.8);
      face.position.set(2.7, 8.6, 0);
      gate.add(face);
      // Fallen blocks at its feet, moss on the stone.
      for (let k = 0; k < 6; k++) {
        const b = new Mesh(block, k % 2 ? stone : moss);
        b.scale.set(0.8 + random() * 0.6, 0.5 + random() * 0.3, 0.7 + random() * 0.5);
        b.position.set((random() - 0.5) * 8, 0.3, (random() - 0.5) * 10);
        b.rotation.set(random(), random() * 3, random());
        gate.add(b);
      }
      if (fig) {
        // The strangler fig's pale roots poured over the stone, its crown above.
        for (let k = 0; k < 5; k++) {
          const v = new Mesh(vine, root);
          v.scale.set(1 + random() * 0.6, 1.6 + random() * 1.2, 1);
          v.rotation.set(0, Math.PI / 2 + (random() - 0.5) * 0.6, 0);
          v.position.set(-0.5 + random(), 4 + random() * 3, (k - 2) * 1.4);
          gate.add(v);
        }
        const trunk = new Mesh(this.unit, root);
        trunk.scale.set(1.6, 10, 1.6);
        trunk.position.set(-1, 17, 0.5);
        gate.add(trunk);
        for (let k = 0; k < 4; k++) {
          const c = new Mesh(block, moss);
          c.scale.set(5, 3, 5);
          c.position.set((random() - 0.5) * 6, 23 + random() * 3, (random() - 0.5) * 6);
          gate.add(c);
        }
      }
      gate.children.forEach((m) => (m.castShadow = true));
      gate.rotation.y = Math.PI;
      const holder = new Group();
      holder.add(gate);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 9 });
    }
  }

  /** Tuk-tuks waiting on the verge for the sunrise crowd. */
  private addTukTuks(roadHalf: number): void {
    const random = seeded(7131);
    const canopies = [0x1d5aa8, 0xd8102e, 0x2a8a4a].map((c) =>
      this.material({ color: c, roughness: 0.6 }),
    );
    const frame = this.material({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.4 });
    const seat = this.material({ color: 0x8a2a1a, roughness: 0.7 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    for (let k = 0; k < 4; k++) {
      const t = new Group();
      const carriage = new Mesh(this.unit, seat);
      carriage.scale.set(1.5, 0.6, 1.8);
      carriage.position.y = 0.8;
      const roof = new Mesh(this.unit, canopies[k % canopies.length]!);
      roof.scale.set(1.7, 0.1, 2.2);
      roof.position.y = 2.1;
      t.add(carriage, roof);
      for (const [x, z] of [
        [-0.75, -1],
        [0.75, -1],
        [-0.75, 1],
        [0.75, 1],
      ] as const) {
        const post = new Mesh(this.unit, frame);
        post.scale.set(0.05, 1.2, 0.05);
        post.position.set(x, 1.5, z);
        t.add(post);
      }
      const bike = new Mesh(this.unit, frame);
      bike.scale.set(0.3, 0.7, 1.4);
      bike.position.set(0, 0.6, -1.8);
      const wheels = new Mesh(this.unit, tyre);
      wheels.scale.set(1.6, 0.5, 0.5);
      wheels.position.set(0, 0.25, 0.3);
      t.add(bike, wheels);
      t.children.forEach((m) => (m.castShadow = true));
      t.rotation.y = random() * 0.4 - 0.2;
      const holder = new Group();
      holder.add(t);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 100 + k * 6 + random() * 2, x: roadHalf + 2.6 });
    }
  }

  /** Monks in saffron robes walking the verge, and early visitors. */
  private addMonks(roadHalf: number): void {
    const random = seeded(7141);
    for (let k = 0; k < 14; k++) {
      const offset = 30 + Math.floor(k / 3) * 70 + (k % 3) * 1.6;
      this.people.push({
        offset,
        x: (k % 2 ? -1 : 1) * (roadHalf + 1.1) - (k % 3) * 0.2,
        speed: k % 2 ? 0.9 : -0.9,
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, MONK_WEAR, 7147);
  }

  /** Angkor Wat's five lotus-bud towers dark against the sunrise across the moat, the mist on the water. */
  private addAngkorWat(): void {
    const random = seeded(7151);
    const stone = this.material({ color: 0x4a3a40, roughness: 1, flatShading: true });
    const wat = new Group();
    // The long galleried enclosure and the stepped terraces.
    for (let k = 0; k < 3; k++) {
      const terrace = new Mesh(this.unit, stone);
      terrace.scale.set(420 - k * 110, 14, 120 - k * 26);
      terrace.position.y = 7 + k * 14;
      wat.add(terrace);
    }
    // The five towers in a quincunx, the central one tallest, each a tapering lotus bud.
    const tier = new CylinderGeometry(0.9, 1, 1, 8);
    tier.translate(0, 0.5, 0);
    const spire = new ConeGeometry(1, 1, 8);
    this.disposables.push(tier, spire);
    for (const [x, z, h] of [
      [0, 0, 120],
      [-70, -30, 80],
      [70, -30, 80],
      [-70, 30, 80],
      [70, 30, 80],
    ] as const) {
      const base = 42 - (h > 100 ? 0 : 8);
      // Corbelled tiers swelling then drawing in, the lotus bud's silhouette.
      const tiers = 9;
      let y = base;
      for (let k = 0; k < tiers; k++) {
        const t = k / (tiers - 1);
        const radius = 14 * (0.55 + Math.sin(0.35 + t * 2.4) * 0.5) * (1 - t * 0.55);
        const step = (h / tiers) * (1 - t * 0.3);
        const ring = new Mesh(tier, stone);
        ring.scale.set(radius, step * 0.82, radius);
        ring.position.set(x, y, z);
        const lip = new Mesh(tier, stone);
        lip.scale.set(radius * 1.12, step * 0.18, radius * 1.12);
        lip.position.set(x, y + step * 0.82, z);
        wat.add(ring, lip);
        y += step;
      }
      const tip = new Mesh(spire, stone);
      tip.scale.set(3.5, 14, 3.5);
      tip.position.set(x, y + 7, z);
      wat.add(tip);
    }
    wat.position.set(-420, -MOAT, -1150);
    wat.scale.setScalar(1.25);
    wat.rotation.y = 0.35;
    this.horizon.add(wat);
    // The far tree line, dark against the dawn.
    const line = this.material({ color: 0x2a3a2a, roughness: 1, flatShading: true });
    const hill = new DodecahedronGeometry(1, 1);
    this.disposables.push(hill);
    for (let k = 0; k < 18; k++) {
      const h = new Mesh(hill, line);
      h.scale.set(120 + random() * 80, 30 + random() * 20, 60);
      h.position.set(-1600 + k * 160, -MOAT + 4, -1500 - random() * 150);
      this.horizon.add(h);
    }
    // The still water reaching to the far shore, and the mist lying on it.
    const water = this.material({
      color: 0xe8c0b0,
      roughness: 0.05,
      metalness: 0.3,
      emissive: 0x9a6a5a,
      emissiveIntensity: 0.5,
    });
    const pool = new Mesh(new PlaneGeometry(4000, 3000), water);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-2000, -MOAT - 0.1, -1200);
    this.disposables.push(pool.geometry);
    this.horizon.add(pool);
    const haze = this.material({
      color: 0xf4dcd0,
      roughness: 1,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const puff = new SphereGeometry(1, 10, 6);
    this.disposables.push(puff);
    for (let k = 0; k < 8; k++) {
      const m = new Mesh(puff, haze);
      m.scale.set(140 + random() * 80, 6, 60);
      m.position.set(-200 - k * 120, -MOAT + 2, -400 - random() * 900);
      this.horizon.add(m);
      this.mist.push(m);
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

/** The red laterite road, packed and rutted, with its pale edges. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a86a4a', 7161);
    g.fillStyle = 'rgba(60,20,10,0.25)';
    g.fillRect(36, 0, 6, 128);
    g.fillRect(86, 0, 6, 128);
    g.fillStyle = 'rgba(220,200,170,0.35)';
    g.fillRect(0, 0, 4, 128);
    g.fillRect(124, 0, 4, 128);
  });
}

/** The jungle floor's leaf litter. */
function floorTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a5a2a', 7171);
    const random = seeded(7173);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = ['#8a5a2a', '#3a4a1a', '#a8803a'][Math.floor(random() * 3)]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 3, 2);
    }
  });
}

/** The moat bank's rough grass. */
function grassTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#5a7a2a', 7181));
}

/** The moat's still water, the dawn sky in it. */
function moatTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#c8a8b0', 7191);
    const random = seeded(7193);
    g.fillStyle = 'rgba(255,220,180,0.3)';
    for (let i = 0; i < 30; i++) g.fillRect(random() * 128, random() * 128, 12, 1);
  });
}

/** The dipterocarp's pale, smooth bark. */
function barkTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#b8b0a0', 7201);
    g.fillStyle = 'rgba(80,80,60,0.3)';
    for (let y = 0; y < 128; y += 9) g.fillRect(0, y, 64, 1);
  });
}

/** The weathered grey-gold sandstone in its laid courses. */
function sandstoneTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a89878', 7211);
    g.strokeStyle = 'rgba(50,40,30,0.45)';
    for (let y = 0; y < 128; y += 16) {
      g.strokeRect(0, y, 128, 16);
      for (let x = (y / 16) % 2 ? 0 : 20; x < 128; x += 40) g.strokeRect(x, y, 40, 16);
    }
    g.fillStyle = 'rgba(60,80,40,0.25)';
    g.fillRect(0, 96, 128, 32);
  });
}

/** The serene carved face on a gate tower. */
function faceTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#a89878', 7221);
    g.strokeStyle = 'rgba(40,30,20,0.75)';
    g.lineWidth = 4;
    // The lowered eyes, the broad nose and the faint smile.
    g.beginPath();
    g.arc(42, 50, 14, 0.1 * Math.PI, 0.9 * Math.PI);
    g.moveTo(100, 50);
    g.arc(86, 50, 14, 0.1 * Math.PI, 0.9 * Math.PI);
    g.moveTo(64, 50);
    g.lineTo(58, 78);
    g.lineTo(70, 78);
    g.moveTo(44, 96);
    g.quadraticCurveTo(64, 108, 84, 96);
    g.stroke();
    g.strokeStyle = 'rgba(40,30,20,0.4)';
    g.lineWidth = 2;
    for (let y = 0; y < 128; y += 22) g.strokeRect(0, y, 128, 22);
  });
}
