// Chichén Itzá's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the Yucatán
// jungle on a hot, golden afternoon. The rider follows a white sacbé, the Maya's raised limestone
// causeway, through the forest: the jungle stands dense both sides in a green wall of canopy,
// with broad-leaved trees, palms and a great ceiba reaching over it, vines hanging down; carved
// stelae and the tumbled stones of smaller temples lie in the undergrowth, vendors hang bright
// textiles by the way, and parrots wheel overhead. Ahead the forest opens on the grass of the
// Great Plaza where El Castillo rises in its nine terraces, its four stairways climbing to the
// temple, the feathered serpents' heads at its foot. Built on the shared kit (world-kit.ts) on
// the pattern of Old Town's street.
import {
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
import { limestoneTexture, textileTexture, steleTexture, terraceTexture } from './chichen-textures';
import type { StreetPoint } from './world-oldtown';

/** The causeway repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The undergrowth runs EDGE metres beyond the causeway before the canopy wall rises. */
const EDGE = 9;

const VISITOR_WEAR = {
  tops: ['#ffffff', '#ff6b5a', '#2ec4b6', '#ffd23f', '#3a86ff', '#f15bb5', '#e8d8b0'],
  bottoms: ['#e8d8b0', '#2f3e5c', '#5a5f69', '#1d1f24'],
  skins: ['#c48a5f', '#8d5a3b', '#e2b48c', '#f0c8a0', '#5a3a29'],
};

interface Parrot {
  readonly mesh: Group;
  readonly radius: number;
  readonly height: number;
  readonly speed: number;
  readonly phase: number;
  readonly cx: number;
  readonly cz: number;
}

export class ChichenStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly visitors: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly parrots: Parrot[] = [];
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
    this.addJungle(roadHalf, points);
    this.addTrees(roadHalf);
    this.addRuins(roadHalf);
    this.addVendors(roadHalf);
    this.addVisitors(roadHalf);
    this.addParrots();
    this.addCastillo();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The parrots wheel over the canopy, wings beating.
    for (const p of this.parrots) {
      const a = seconds * p.speed + p.phase;
      p.mesh.position.set(
        p.cx + Math.cos(a) * p.radius,
        p.height + Math.sin(a * 2) * 2,
        p.cz + Math.sin(a) * p.radius,
      );
      p.mesh.rotation.y = -a;
      const flap = Math.sin(seconds * 14 + p.phase) * 0.7;
      p.mesh.children[1]!.rotation.z = flap;
      p.mesh.children[2]!.rotation.z = -flap;
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
      this.visitors.forEach((v, i) => {
        const metres = loopMetres(v.offset + v.speed * this.time, s, LOOP, BEHIND);
        const step = v.speed ? Math.abs(Math.sin(this.time * 4 + v.phase)) * 0.04 : 0;
        crowd.set(i, v.x, heightAt(metres) + step, -metres, v.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The causeway's kerb stones, the red earth and undergrowth, and the canopy's wall both sides. */
  private addJungle(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ map: this.repeat(limestoneTexture(), 1, 1), roughness: 0.9 });
    const earth = this.material({ map: this.repeat(undergrowthTexture(), 3, 3), roughness: 1 });
    const canopy = this.material({ map: this.repeat(canopyTexture(), 8, 8), roughness: 1 });
    for (const side of [-1, 1] as const) {
      const lay = (profile: [number, number][], material: MeshStandardMaterial) => {
        const mirrored = profile.map(([x, y]) => [side * x, y] as [number, number]);
        this.ribbons.add(points, material, side > 0 ? [...mirrored].reverse() : mirrored);
      };
      lay(
        [
          [r, 0.004],
          [r + 0.4, 0.004],
          [r + 0.6, -0.35],
        ],
        kerb,
      );
      lay(
        [
          [r + 0.6, -0.35],
          [r + EDGE, -0.3],
        ],
        earth,
      );
      lay(
        [
          [r + EDGE, -0.3],
          [r + EDGE + 2, 9],
          [r + EDGE + 8, 19],
          [r + EDGE + 40, 23],
          [r + 600, 26],
        ],
        canopy,
      );
    }
  }

  /** The forest's edge: broad-leaved trees, palms and the odd great ceiba, vines hanging. */
  private addTrees(roadHalf: number): void {
    const random = seeded(3001);
    const bark = this.material({ color: 0x6a5a48, roughness: 1 });
    const pale = this.material({ color: 0xb8b0a0, roughness: 0.9 });
    const leaves = [0x2a6a2a, 0x3a7a2a, 0x2a5a2a, 0x4a8a3a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const frond = this.material({ color: 0x3a7a2a, roughness: 0.9, side: 2 });
    const vine = this.material({ color: 0x3a5a2a, roughness: 1 });
    const trunk = new CylinderGeometry(0.25, 0.4, 7, 6);
    trunk.translate(0, 3.5, 0);
    const crown = new DodecahedronGeometry(2.6, 0);
    crown.scale(1.3, 0.75, 1.3);
    const leaf = new PlaneGeometry(1, 3.6);
    leaf.translate(0, 1.8, 0);
    const strand = new CylinderGeometry(0.03, 0.03, 5, 3);
    strand.translate(0, -2.5, 0);
    const ceibaTrunk = new CylinderGeometry(0.9, 1.8, 18, 8);
    ceibaTrunk.translate(0, 9, 0);
    const ceibaCrown = new SphereGeometry(9, 10, 6);
    ceibaCrown.scale(1.4, 0.45, 1.4);
    this.disposables.push(trunk, crown, leaf, strand, ceibaTrunk, ceibaCrown);
    for (let offset = 0; offset < LOOP; offset += 1.4 + random() * 2.2) {
      const side = random() < 0.5 ? -1 : 1;
      const d = 1.5 + random() * (EDGE - 1);
      const kind = random();
      const tree = new Group();
      if (kind < 0.06) {
        const t = new Mesh(ceibaTrunk, pale);
        const c = new Mesh(ceibaCrown, leaves[0]!);
        c.position.y = 19;
        tree.add(t, c);
      } else if (kind < 0.3) {
        const t = new Mesh(trunk, bark);
        t.scale.set(0.7, 1.2, 0.7);
        tree.add(t);
        for (let k = 0; k < 8; k++) {
          const f = new Mesh(leaf, frond);
          f.position.y = 8.4;
          f.rotation.set(1.1 + random() * 0.4, (k / 8) * Math.PI * 2, 0, 'YXZ');
          tree.add(f);
        }
      } else if (kind < 0.75) {
        const t = new Mesh(trunk, bark);
        const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
        c.position.y = 7.5;
        c.rotation.y = random() * 6;
        tree.add(t, c);
        for (let k = 0; k < 3; k++) {
          const v = new Mesh(strand, vine);
          v.position.set((random() - 0.5) * 3, 7, (random() - 0.5) * 3);
          tree.add(v);
        }
      } else {
        // A shrub of broad leaves in the undergrowth.
        const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
        c.scale.setScalar(0.45);
        c.position.y = 0.8;
        tree.add(c);
      }
      tree.scale.setScalar(0.8 + random() * 0.5);
      tree.rotation.y = random() * 6;
      tree.children.forEach((c) => (c.castShadow = true));
      tree.position.y = -0.3;
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** Carved stelae and the tumbled platforms of lesser temples in the undergrowth. */
  private addRuins(roadHalf: number): void {
    const random = seeded(3011);
    const carved = this.material({ map: this.track(steleTexture()), roughness: 0.95 });
    const stone = this.material({
      map: this.repeat(limestoneTexture(), 0.5, 0.5),
      color: 0xc8c0a8,
      roughness: 1,
      flatShading: true,
    });
    const block = new DodecahedronGeometry(0.6, 0);
    this.disposables.push(block);
    for (let offset = 10; offset < LOOP; offset += 30 + random() * 30) {
      const side = random() < 0.5 ? -1 : 1;
      const ruin = new Group();
      if (random() < 0.5) {
        const stele = new Mesh(this.unit, carved);
        stele.scale.set(1.1, 2.6, 0.45);
        stele.position.y = 1.0;
        stele.rotation.set(
          (random() - 0.5) * 0.15,
          (side * Math.PI) / 2 + (random() - 0.5) * 0.4,
          (random() - 0.5) * 0.12,
        );
        ruin.add(stele);
      } else {
        for (let k = 0; k < 3; k++) {
          const tier = new Mesh(this.unit, stone);
          tier.scale.set(5 - k * 1.3, 0.9, 5 - k * 1.3);
          tier.position.y = 0.15 + k * 0.9;
          ruin.add(tier);
        }
        for (let k = 0; k < 4; k++) {
          const column = new Mesh(this.unit, stone);
          column.scale.set(0.45, 1.6 + random() * 1.2, 0.45);
          column.position.set(-1 + (k % 2) * 2, 2.9, -1 + Math.floor(k / 2) * 2);
          ruin.add(column);
        }
        for (let k = 0; k < 6; k++) {
          const b = new Mesh(block, stone);
          b.position.set((random() - 0.5) * 7, 0, (random() - 0.5) * 7);
          b.rotation.set(random(), random(), random());
          ruin.add(b);
        }
      }
      ruin.children.forEach((c) => (c.castShadow = true));
      ruin.position.y = -0.3;
      const holder = new Group();
      holder.add(ruin);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + 3 + random() * 3) });
    }
  }

  /** Vendors' frames hung with bright woven textiles and hammocks. */
  private addVendors(roadHalf: number): void {
    const random = seeded(3021);
    const wood = this.material({ color: 0x6a4a2a, roughness: 1 });
    const cloths = [0, 1, 2, 3].map((k) =>
      this.material({ map: this.track(textileTexture(k)), roughness: 0.9, side: 2 }),
    );
    const hang = new PlaneGeometry(1.1, 1.6);
    hang.translate(0, -0.8, 0);
    this.disposables.push(hang);
    for (let offset = 25; offset < LOOP; offset += 50 + random() * 40) {
      const side = random() < 0.5 ? -1 : 1;
      const stand = new Group();
      for (const z of [-2, 2]) {
        const post = new Mesh(this.unit, wood);
        post.scale.set(0.12, 2.4, 0.12);
        post.position.set(0, 1.2, z);
        stand.add(post);
      }
      const rail = new Mesh(this.unit, wood);
      rail.scale.set(0.1, 0.1, 4.2);
      rail.position.y = 2.35;
      stand.add(rail);
      for (let k = 0; k < 3; k++) {
        const cloth = new Mesh(hang, cloths[Math.floor(random() * cloths.length)]!);
        cloth.position.set(0, 2.3, -1.3 + k * 1.3);
        cloth.rotation.y = Math.PI / 2;
        stand.add(cloth);
      }
      stand.position.y = -0.3;
      const holder = new Group();
      holder.add(stand);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + 1.6) });
    }
  }

  /** Visitors walking the causeway's edges in sun hats, and some stopped at the textiles. */
  private addVisitors(roadHalf: number): void {
    const random = seeded(3031);
    for (let offset = 5; offset < LOOP; offset += 8 + random() * 14) {
      const standing = random() < 0.3;
      this.visitors.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 0.3 + random() * 0.4),
        speed: standing ? 0 : (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.3),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.visitors.length,
      VISITOR_WEAR,
      3037,
    );
  }

  /** Scarlet and green parrots wheeling over the canopy ahead. */
  private addParrots(): void {
    const random = seeded(3041);
    const body = new SphereGeometry(0.25, 6, 5);
    body.scale(1, 1, 2.4);
    const wing = new PlaneGeometry(0.9, 0.35);
    this.disposables.push(body, wing);
    for (let k = 0; k < 10; k++) {
      const scarlet = random() < 0.6;
      const colour = this.material({
        color: scarlet ? 0xd81a1a : 0x2aa83a,
        roughness: 0.7,
        side: 2,
      });
      const tip = this.material({ color: scarlet ? 0x2a6ad8 : 0xffd23f, roughness: 0.7, side: 2 });
      const bird = new Group();
      const b = new Mesh(body, colour);
      const left = new Group();
      const right = new Group();
      const lw = new Mesh(wing, tip);
      lw.position.x = -0.45;
      const rw = new Mesh(wing, tip);
      rw.position.x = 0.45;
      left.add(lw);
      right.add(rw);
      left.rotation.x = -Math.PI / 2;
      right.rotation.x = -Math.PI / 2;
      bird.add(b, left, right);
      bird.scale.setScalar(2);
      this.parrots.push({
        mesh: bird,
        radius: 20 + random() * 30,
        height: 30 + random() * 15,
        speed: 0.2 + random() * 0.2,
        phase: random() * 6,
        cx: (random() - 0.5) * 60,
        cz: -60 - random() * 120,
      });
      this.horizon.add(bird);
    }
  }

  /**
   * Ahead: the jungle opening on the Great Plaza's grass and El Castillo rising from it in nine
   * terraces with its four stairways, the temple on top and the serpents' heads at the foot; the
   * forest's canopy rolling away behind.
   */
  private addCastillo(): void {
    const stone = this.material({ map: this.track(terraceTexture()), roughness: 0.95 });
    const stair = this.material({ map: this.track(stairTexture()), roughness: 0.95 });
    const temple = this.material({ map: this.track(templeTexture()), roughness: 0.9 });
    const castillo = new Group();
    const base = 55;
    const height = 24;
    for (let k = 0; k < 9; k++) {
      const w = base - k * ((base - 19) / 9);
      const tier = new Mesh(this.unit, stone);
      tier.scale.set(w, height / 9, w);
      tier.position.y = (k + 0.5) * (height / 9);
      castillo.add(tier);
    }
    // The four stairways, each a ramp up the middle of a face.
    const run = Math.hypot((base - 19) / 2, height);
    const tilt = Math.atan2((base - 19) / 2, height);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const flight = new Mesh(this.unit, stair);
      flight.scale.set(9, run, 1.2);
      const face = new Group();
      flight.position.set(0, height / 2, (base + 19) / 4);
      flight.rotation.x = -tilt;
      face.add(flight);
      face.rotation.y = a;
      castillo.add(face);
      // A serpent's head at the foot of the north stair.
      if (k === 0)
        for (const x of [-4.2, 4.2]) {
          const head = new Mesh(this.unit, stone);
          head.scale.set(2.2, 1.8, 3);
          head.position.set(x, 0.9, base / 2 + 1.5);
          castillo.add(head);
        }
    }
    const shrine = new Mesh(this.unit, temple);
    shrine.scale.set(14, 6, 14);
    shrine.position.y = height + 3;
    const crest = new Mesh(this.unit, stone);
    crest.scale.set(15, 1, 15);
    crest.position.y = height + 6.5;
    castillo.add(shrine, crest);
    castillo.position.set(0, -0.5, -400);
    castillo.scale.setScalar(2.6);
    this.horizon.add(castillo);
    // The plaza's grass, and the canopy rolling away all round beyond it.
    const plaza = new Mesh(
      new PlaneGeometry(500, 400),
      this.material({ map: this.repeat(plazaTexture(), 20, 20), roughness: 1 }),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, -0.6, -420);
    this.disposables.push(plaza.geometry);
    this.horizon.add(plaza);
    const canopy = this.material({ map: this.repeat(canopyTexture(), 40, 40), roughness: 1 });
    const mound = new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(mound);
    for (const [x, z, sx, sy, sz] of [
      [0, -820, 600, 26, 180],
      [-420, -380, 220, 24, 400],
      [420, -380, 220, 24, 400],
      [-700, -1200, 700, 34, 400],
      [700, -1200, 700, 34, 400],
    ] as const) {
      const m = new Mesh(mound, canopy);
      m.scale.set(sx, sy, sz);
      m.position.set(x, -1, z);
      this.horizon.add(m);
    }
    // A tall ceiba or two standing over the canopy ahead.
    const pale = this.material({ color: 0xb8b0a0, roughness: 0.9 });
    const green = this.material({ color: 0x2a6a2a, roughness: 1, flatShading: true });
    for (const [x, z] of [
      [-110, -560],
      [150, -620],
    ] as const) {
      const t = new Mesh(new CylinderGeometry(1.5, 3, 34, 8), pale);
      t.position.set(x, 17, z);
      const c = new Mesh(new ConeGeometry(18, 10, 10), green);
      c.rotation.x = Math.PI;
      c.position.set(x, 36, z);
      this.disposables.push(t.geometry, c.geometry);
      this.horizon.add(t, c);
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

/** Red earth under ferns and fallen leaves. */
function undergrowthTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a5a3a', 3061);
    const random = seeded(3063);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = ['rgba(60,110,40,0.7)', 'rgba(90,140,50,0.6)', 'rgba(140,100,50,0.5)'][
        Math.floor(random() * 3)
      ]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 10, 2 + random() * 8);
    }
  });
}

/** The canopy: leaves in every green, sunlit and shadowed. */
function canopyTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#2a5a24', 3071);
    const random = seeded(3073);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = ['#3a7a2a', '#4a8a34', '#1e4a1e', '#5a9a3a', '#2a6a2a'][
        Math.floor(random() * 5)
      ]!;
      g.beginPath();
      g.ellipse(
        random() * 256,
        random() * 256,
        3 + random() * 7,
        2 + random() * 4,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
  });
}

/** A stairway's steps. */
function stairTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#d8ccb0', 3101);
    g.fillStyle = 'rgba(50,44,36,0.45)';
    for (let y = 0; y < 256; y += 6) g.fillRect(0, y, 64, 2);
    g.fillRect(0, 0, 4, 256);
    g.fillRect(60, 0, 4, 256);
  });
}

/** The temple's front with its dark doorways. */
function templeTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#c8b898', 3111);
    g.fillStyle = '#2a2420';
    for (const x of [20, 56, 92]) g.fillRect(x, 28, 16, 36);
    g.fillStyle = 'rgba(60,50,40,0.4)';
    g.fillRect(0, 18, 128, 4);
  });
}

/** The plaza's mown grass. */
function plazaTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#6a9a3a', 3121));
}
