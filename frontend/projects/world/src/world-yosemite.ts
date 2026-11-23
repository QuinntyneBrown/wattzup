// Yosemite Valley's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the valley
// floor on a bright late-spring morning, the falls in full flood. The rider follows Northside
// Drive through meadows and pine woods: on the left the Merced runs clear over its stones; split-
// rail fences line the meadows, black-tailed deer graze in the grass, and hikers walk the verge
// under ponderosa pines and incense cedars. The granite walls rise sheer on both sides: El
// Capitan's great face stands over the left, Yosemite Falls thunders down the cliff on the right
// in its long white ribbons with spray at the foot, and ahead at the valley's end Half Dome
// lifts its sheared face over the trees. Built on the shared kit (world-kit.ts) on the pattern
// of Old Town's street.
import {
  BoxGeometry,
  CircleGeometry,
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

/** The valley road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 420;
const BEHIND = 24;
/** The Merced runs RIVER metres left of the road's edge. */
const RIVER = 7;

const HIKER_WEAR = {
  tops: ['#d8442a', '#2a6a9a', '#e8c040', '#4a7a3a', '#f4f0e8', '#8a3a6a'],
  bottoms: ['#5a5040', '#2f3e5c', '#1d1f24', '#8a7a64'],
  skins: ['#f0c8a0', '#c48a5f', '#e2b48c', '#8d5a3b', '#f5d3b5'],
};

export class YosemiteStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly hikers: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly deer: { mesh: Group; phase: number }[] = [];
  private readonly falls: Texture[] = [];
  private river: Texture | null = null;
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
    this.addRiver(roadHalf, points);
    this.addMeadow(roadHalf, points);
    this.addTrees(roadHalf);
    this.addFences(roadHalf);
    this.addDeer(roadHalf);
    this.addHikers(roadHalf);
    this.addValley();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The falls pour and the river runs; the deer lift and lower their heads as they graze.
    for (const t of this.falls) t.offset.y = seconds * 0.35;
    if (this.river) this.river.offset.y = seconds * 0.12;
    for (const d of this.deer)
      d.mesh.children[1]!.rotation.x = 0.5 + Math.sin(seconds * 0.8 + d.phase) * 0.5;
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
      this.hikers.forEach((h, i) => {
        const metres = loopMetres(h.offset + h.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4 + h.phase)) * 0.04;
        crowd.set(i, h.x, heightAt(metres) + step, -metres, h.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The Merced on the left: a sandy bank, the clear green water over its stones, the far bank. */
  private addRiver(roadHalf: number, points: number): void {
    const r = roadHalf;
    const sand = this.material({ map: this.repeat(sandTexture(), 2, 2), roughness: 1 });
    const ripple = this.repeat(riverTexture(), 6, 6);
    this.river = ripple;
    const water = this.material({
      map: ripple,
      roughness: 0.15,
      metalness: 0.3,
      emissive: 0x1a3a34,
      emissiveIntensity: 0.3,
    });
    this.ribbons.add(points, sand, [
      [-r - RIVER + 2, 0.03],
      [-r - RIVER, 0.03],
    ]);
    this.ribbons.add(points, water, [
      [-r - RIVER, 0.04],
      [-r - RIVER - 16, 0.04],
    ]);
    this.ribbons.add(points, sand, [
      [-r - RIVER - 16, 0.03],
      [-r - RIVER - 19, 0.03],
    ]);
    // Grey granite boulders in the stream and on its banks.
    const random = seeded(3201);
    const granite = this.material({
      map: this.track(graniteTexture(64)),
      roughness: 0.9,
      flatShading: true,
    });
    const rock = new DodecahedronGeometry(1, 0);
    this.disposables.push(rock);
    for (let offset = 0; offset < LOOP; offset += 4 + random() * 9) {
      const boulder = new Mesh(rock, granite);
      boulder.scale.set(0.5 + random() * 1.4, 0.3 + random() * 0.6, 0.5 + random() * 1.4);
      boulder.rotation.set(random(), random() * 6, random());
      boulder.castShadow = true;
      const holder = new Group();
      holder.add(boulder);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -r - RIVER - random() * 18 });
    }
  }

  /** The meadow's long grass and wildflowers either side, a strip of it shown as the ground's grain. */
  private addMeadow(roadHalf: number, points: number): void {
    const r = roadHalf;
    const meadow = this.material({ map: this.repeat(meadowTexture(), 4, 4), roughness: 1 });
    this.ribbons.add(points, meadow, [
      [r + 60, 0.02],
      [r, 0.02],
    ]);
    this.ribbons.add(points, meadow, [
      [-r, 0.02],
      [-r - RIVER + 2, 0.02],
    ]);
    this.ribbons.add(points, meadow, [
      [-r - RIVER - 19, 0.02],
      [-r - 80, 0.02],
    ]);
  }

  /** Ponderosa pines, incense cedars and black oaks, in groves and standing alone in the meadow. */
  private addTrees(roadHalf: number): void {
    const random = seeded(3211);
    const bark = this.material({ color: 0x8a4a2a, roughness: 1 });
    const needles = [0x2a4a2a, 0x355a2e, 0x24402a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const oak = this.material({ color: 0x5a7a34, roughness: 1, flatShading: true });
    const trunk = new CylinderGeometry(0.35, 0.6, 1, 6);
    trunk.translate(0, 0.5, 0);
    const tier = new ConeGeometry(1, 1, 7);
    const crown = new DodecahedronGeometry(3, 0);
    crown.scale(1.3, 0.8, 1.3);
    this.disposables.push(trunk, tier, crown);
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 6) {
      const side = random() < 0.55 ? 1 : -1;
      const d = side > 0 ? 9 + random() * 50 : RIVER + 21 + random() * 50;
      const tree = new Group();
      if (random() < 0.8) {
        const h = 22 + random() * 18;
        const t = new Mesh(trunk, bark);
        t.scale.set(1, h, 1);
        tree.add(t);
        const green = needles[Math.floor(random() * needles.length)]!;
        for (let k = 0; k < 4; k++) {
          const c = new Mesh(tier, green);
          const w = 5.5 - k * 1.1;
          c.scale.set(w, 7, w);
          c.position.y = h * 0.38 + k * 4.6;
          tree.add(c);
        }
      } else {
        const t = new Mesh(trunk, bark);
        t.scale.set(1.2, 6, 1.2);
        const c = new Mesh(crown, oak);
        c.position.y = 8;
        tree.add(t, c);
      }
      tree.scale.setScalar(0.8 + random() * 0.4);
      tree.rotation.y = random() * 6;
      tree.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** The split-rail fence along the meadow's edge. */
  private addFences(roadHalf: number): void {
    const wood = this.material({ color: 0x8a7a64, roughness: 1 });
    for (let offset = 0; offset < LOOP; offset += 5) {
      const bay = new Group();
      const post = new Mesh(this.unit, wood);
      post.scale.set(0.16, 1.3, 0.16);
      post.position.y = 0.65;
      bay.add(post);
      for (const y of [0.55, 1.05]) {
        const rail = new Mesh(this.unit, wood);
        rail.scale.set(0.12, 0.14, 5.1);
        rail.position.set(0, y, -2.5);
        rail.rotation.x = y > 1 ? 0.04 : -0.04;
        bay.add(rail);
      }
      const holder = new Group();
      holder.add(bay);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 2.2 });
    }
  }

  /** Black-tailed deer grazing in the meadow. */
  private addDeer(roadHalf: number): void {
    const random = seeded(3221);
    const hide = this.material({ color: 0x8a6a4a, roughness: 1 });
    const body = new SphereGeometry(0.5, 8, 6);
    body.scale(1, 0.9, 1.9);
    const leg = new CylinderGeometry(0.05, 0.04, 0.8, 4);
    leg.translate(0, -0.4, 0);
    const neck = new CylinderGeometry(0.1, 0.15, 0.8, 5);
    neck.translate(0, 0.4, 0);
    const head = new SphereGeometry(0.16, 6, 5);
    head.scale(1, 1, 1.8);
    this.disposables.push(body, leg, neck, head);
    for (let offset = 30; offset < LOOP; offset += 60 + random() * 60)
      for (let k = 0; k < 1 + Math.floor(random() * 3); k++) {
        const deer = new Group();
        const b = new Mesh(body, hide);
        b.position.y = 1.05;
        const n = new Group();
        n.position.set(0, 1.25, -0.75);
        const nm = new Mesh(neck, hide);
        const h = new Mesh(head, hide);
        h.position.set(0, 0.8, -0.15);
        n.add(nm, h);
        deer.add(b, n);
        for (const [x, z] of [
          [-0.2, -0.6],
          [0.2, -0.6],
          [-0.2, 0.6],
          [0.2, 0.6],
        ] as const) {
          const l = new Mesh(leg, hide);
          l.position.set(x, 0.85, z);
          deer.add(l);
        }
        deer.rotation.y = random() * 6;
        deer.children.forEach((c) => (c.castShadow = true));
        const holder = new Group();
        holder.add(deer);
        this.group.add(holder);
        this.deer.push({ mesh: deer, phase: random() * 6 });
        this.props.push({ mesh: holder, offset: offset + k * 3, x: roadHalf + 6 + random() * 18 });
      }
  }

  /** Hikers in bright jackets walking the verge. */
  private addHikers(roadHalf: number): void {
    const random = seeded(3231);
    for (let offset = 6; offset < LOOP; offset += 10 + random() * 18)
      this.hikers.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 0.6 + random() * 0.6),
        speed: (random() < 0.5 ? 1 : -1) * (0.9 + random() * 0.4),
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.hikers.length, HIKER_WEAR, 3237);
  }

  /**
   * The valley: El Capitan's sheer face over the left, the north wall on the right with Yosemite
   * Falls pouring down it, the south wall's cliffs and Half Dome closing the valley ahead, and the
   * pine woods at the walls' feet.
   */
  private addValley(): void {
    const random = seeded(3241);
    const granite = this.material({ map: this.repeat(graniteTexture(256), 1, 1), roughness: 0.85 });
    const talus = this.material({ color: 0x9a968c, roughness: 1, flatShading: true });
    const woods = this.material({
      map: this.repeat(woodsTexture(), 30, 30),
      roughness: 1,
      flatShading: true,
    });
    // El Capitan: a great prow of granite on the left, its face towards the road.
    const elcap = new Mesh(this.unit, granite);
    elcap.scale.set(560, 900, 560);
    elcap.position.set(-820, 440, -760);
    elcap.rotation.y = Math.PI / 4 + 0.15;
    const brow = new Mesh(new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), granite);
    brow.scale.set(420, 140, 420);
    brow.position.set(-820, 885, -760);
    this.disposables.push(brow.geometry);
    this.horizon.add(elcap, brow);
    // The north wall on the right, and Yosemite Falls in its upper and lower falls.
    const north = new Mesh(this.unit, granite);
    north.scale.set(400, 760, 1600);
    north.position.set(470, 370, -1700);
    north.rotation.y = 0.12;
    this.horizon.add(north);
    for (const [y, h, w] of [
      [520, 440, 60],
      [110, 200, 44],
    ] as const) {
      const pour = this.track(fallTexture());
      pour.wrapS = RepeatWrapping;
      pour.wrapT = RepeatWrapping;
      pour.repeat.set(1, 3);
      this.falls.push(pour);
      const fall = new Mesh(
        new PlaneGeometry(w, h),
        this.material({
          map: pour,
          transparent: true,
          emissive: 0xc8d8e0,
          emissiveIntensity: 0.35,
          roughness: 0.5,
          depthWrite: false,
        }),
      );
      fall.position.set(262, y, -1500);
      fall.rotation.y = -0.5;
      this.disposables.push(fall.geometry);
      this.horizon.add(fall);
    }
    const spray = this.material({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
    });
    for (const y of [300, 10]) {
      const cloud = new Mesh(new SphereGeometry(1, 10, 8), spray);
      cloud.scale.set(40, 26, 40);
      cloud.position.set(262, y, -1490);
      this.disposables.push(cloud.geometry);
      this.horizon.add(cloud);
    }
    // The south wall's cliffs on the left beyond El Capitan, and Cathedral Rocks.
    for (let k = 0; k < 4; k++) {
      const cliff = new Mesh(this.unit, granite);
      const h = 500 + random() * 300;
      cliff.scale.set(300, h, 400);
      cliff.position.set(-480 - random() * 80, h / 2 - 10, -1100 - k * 420);
      cliff.rotation.y = random() * 0.4;
      this.horizon.add(cliff);
    }
    // Half Dome ahead: the rounded back and the sheer cut face looking down the valley.
    const dome = new Mesh(new SphereGeometry(1, 24, 12, 0, Math.PI, 0, Math.PI / 2), granite);
    dome.scale.set(520, 1050, 420);
    dome.position.set(-120, -60, -2700);
    dome.rotation.y = Math.PI + 0.7;
    const face = new Mesh(new CircleGeometry(1, 24, 0, Math.PI), granite);
    face.scale.set(520, 1050, 1);
    face.position.set(-120, -60, -2700);
    face.rotation.y = 0.7;
    this.disposables.push(dome.geometry, face.geometry);
    this.horizon.add(face);
    const shoulder = new Mesh(new ConeGeometry(1, 1, 8), granite);
    shoulder.scale.set(900, 700, 600);
    shoulder.position.set(-700, 340, -3000);
    this.horizon.add(dome, shoulder);
    // Talus slopes and the woods at the walls' feet.
    const cone = new ConeGeometry(1, 1, 10);
    this.disposables.push(cone);
    for (const [x, z, sx, sy, sz, m] of [
      [-330, -380, 120, 90, 520, talus],
      [330, -800, 100, 80, 1400, talus],
      [-250, -500, 160, 50, 900, woods],
      [250, -700, 160, 50, 1400, woods],
      [-260, -1400, 200, 60, 900, woods],
      [0, -2300, 900, 70, 300, woods],
    ] as const) {
      const m2 = new Mesh(cone, m);
      m2.scale.set(sx, sy, sz);
      m2.position.set(x, sy / 2 - 5, z);
      this.horizon.add(m2);
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

/** Pale granite with dark water streaks running down it and joints across. */
function graniteTexture(size: number): CanvasTexture {
  return canvasTexture(size, size, (g) => {
    speckle(g, size, size, '#c4c0b6', 3251);
    const random = seeded(3253);
    for (let i = 0; i < size / 6; i++) {
      g.fillStyle = `rgba(70,66,60,${0.15 + random() * 0.25})`;
      g.fillRect(
        random() * size,
        random() * size * 0.3,
        1 + random() * 4,
        size * (0.3 + random() * 0.7),
      );
    }
    g.strokeStyle = 'rgba(90,86,80,0.35)';
    for (let i = 0; i < size / 16; i++) {
      g.beginPath();
      const y = random() * size;
      g.moveTo(0, y);
      g.lineTo(size, y + (random() - 0.5) * size * 0.2);
      g.stroke();
    }
  });
}

/** A waterfall's white water in falling streaks. */
function fallTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    g.clearRect(0, 0, 64, 128);
    const random = seeded(3261);
    for (let i = 0; i < 220; i++) {
      const x = 6 + random() * 52;
      g.fillStyle = `rgba(255,255,255,${0.4 + random() * 0.6})`;
      g.fillRect(x, random() * 128, 1 + random() * 3, 8 + random() * 24);
    }
  });
}

/** The Merced's clear green water with light on its ripples. */
function riverTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4a7a6a', 3271);
    const random = seeded(3273);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(230,250,240,${0.2 + random() * 0.3})`;
      g.fillRect(random() * 128, random() * 128, 1, 6 + random() * 12);
    }
  });
}

/** The river's sandy banks. */
function sandTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#c8b898', 3281));
}

/** The meadow: long green grass with lupins and poppies. */
function meadowTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a8a3a', 3291);
    const random = seeded(3293);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = ['#8aa04a', '#4a6a2a', '#7a6ac8', '#f0a030', '#a0b45a'][
        Math.floor(random() * 5)
      ]!;
      g.fillRect(random() * 128, random() * 128, 1 + random() * 2, 2 + random() * 3);
    }
  });
}

/** The pine woods seen from afar. */
function woodsTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#2a4a2a', 3301);
    const random = seeded(3303);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = ['#355a2e', '#1e3a22', '#3a6232'][Math.floor(random() * 3)]!;
      g.beginPath();
      g.arc(random() * 128, random() * 128, 2 + random() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
}
