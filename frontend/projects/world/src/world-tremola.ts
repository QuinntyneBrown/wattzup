// The Tremola's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the old
// Gotthard Pass road on a bright, cool summer morning. The rider climbs the cobbles: granite
// setts laid in their fans, a granite kerb and squat guard stones along the drop on the left,
// where the slope falls to the Val Tremola and the Ticino valley far below. On the right the
// alpine pasture climbs steeply, rough with boulders and bright with flowers, scattered larches
// below the treeline and brown cows grazing with their bells. The yellow Gotthard post coach
// and its horses toil up the road. Ahead the hairpins stack up the mountainside one above
// another, each held on its stone wall, to the pass, and the grey peaks stand above it streaked
// with the last snow. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
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
const LOOP = 380;
const BEHIND = 24;

const WALKER_WEAR = {
  tops: ['#c8102e', '#ffffff', '#2a6a9a', '#e8c040', '#3a8a5a', '#1d1f24'],
  bottoms: ['#2f3e5c', '#1d1f24', '#5a5f69', '#8a7a64'],
  skins: ['#f0c8a0', '#f5d3b5', '#e2b48c', '#c48a5f'],
};

/** The hairpins: where the mountainside's surface stands at a distance d from its centre. */
const MOUNTAIN = { x: 120, z: -2000, radius: 1700, height: 640 } as const;

export class TremolaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly walkers: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private coach: { mesh: Group; offset: number } | null = null;
  private readonly horses: Group[] = [];
  private readonly cows: { mesh: Group; phase: number }[] = [];
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
    this.addCobbles(roadHalf, points);
    this.addSlopes(roadHalf, points);
    this.addGuardStones(roadHalf);
    this.addPasture(roadHalf);
    this.addCows(roadHalf);
    this.addCoach(roadHalf);
    this.addWalkers(roadHalf);
    this.addHairpins();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The horses' legs swing as they pull; the cows graze, heads lifting and lowering.
    this.horses.forEach((h, i) => {
      const swing = Math.sin(seconds * 5 + i) * 0.4;
      h.children[2]!.rotation.x = swing;
      h.children[3]!.rotation.x = -swing;
    });
    for (const c of this.cows)
      c.mesh.children[1]!.rotation.x = 0.6 + Math.sin(seconds * 0.7 + c.phase) * 0.4;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops away below the slope falling to the valley on the left. */
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
    if (this.coach) {
      const metres = loopMetres(this.coach.offset + 1.6 * this.time, s, LOOP, BEHIND);
      this.coach.mesh.position.set(this.coach.mesh.position.x, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
        const step = Math.abs(Math.sin(this.time * 4 + w.phase)) * 0.04;
        crowd.set(i, w.x, heightAt(metres) + step, -metres, w.speed >= 0 ? 0 : Math.PI, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The granite setts laid in their fans across the whole road. */
  private addCobbles(roadHalf: number, points: number): void {
    const setts = this.material({
      map: this.repeat(settsTexture(), roadHalf * 2, 3),
      roughness: 0.85,
    });
    this.ribbons.add(points, setts, [
      [roadHalf, 0.012],
      [-roadHalf, 0.012],
    ]);
  }

  /** The kerb, the pasture climbing on the right, and the slope falling to the valley on the left. */
  private addSlopes(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ map: this.repeat(graniteTexture(), 1, 1), roughness: 0.9 });
    const pasture = this.material({ map: this.repeat(pastureTexture(), 6, 6), roughness: 1 });
    this.ribbons.add(points, kerb, [
      [r + 0.5, 0.18],
      [r, 0.18],
      [r, 0.01],
    ]);
    this.ribbons.add(points, pasture, [
      [r + 300, 170],
      [r + 40, 18],
      [r + 0.5, 0.18],
    ]);
    this.ribbons.add(points, kerb, [
      [-r, 0.01],
      [-r, 0.18],
      [-r - 0.6, 0.18],
    ]);
    this.ribbons.add(points, pasture, [
      [-r - 0.6, 0.18],
      [-r - 3, -0.6],
      [-r - 60, -28],
      [-r - 500, -150],
    ]);
  }

  /** The squat granite guard stones along the drop. */
  private addGuardStones(roadHalf: number): void {
    const granite = this.material({ map: this.track(graniteTexture()), roughness: 0.9 });
    const stone = new CylinderGeometry(0.22, 0.28, 0.8, 6);
    stone.translate(0, 0.4, 0);
    this.disposables.push(stone);
    for (let offset = 0; offset < LOOP; offset += 3.5) {
      const post = new Mesh(stone, granite);
      post.castShadow = true;
      post.position.y = 0.18;
      const holder = new Group();
      holder.add(post);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 0.35 });
    }
  }

  /** Boulders and larches on the pasture, and the scree under the drop. */
  private addPasture(roadHalf: number): void {
    const random = seeded(3401);
    const granite = this.material({
      map: this.track(graniteTexture()),
      roughness: 0.95,
      flatShading: true,
    });
    const larch = this.material({ color: 0x4a6a2a, roughness: 1, flatShading: true });
    const bark = this.material({ color: 0x5a4030, roughness: 1 });
    const rock = new DodecahedronGeometry(1, 0);
    const crown = new ConeGeometry(2, 9, 7);
    crown.translate(0, 6.5, 0);
    const trunk = new CylinderGeometry(0.15, 0.3, 3, 5);
    trunk.translate(0, 1.5, 0);
    this.disposables.push(rock, crown, trunk);
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 4) {
      const side = random() < 0.62 ? 1 : -1;
      const d = 1.5 + random() * 36;
      const thing = new Group();
      if (random() < 0.7) {
        const b = new Mesh(rock, granite);
        b.scale.set(0.5 + random() * 1.8, 0.4 + random() * 1.1, 0.5 + random() * 1.8);
        b.rotation.set(random(), random() * 6, random());
        thing.add(b);
      } else {
        thing.add(new Mesh(trunk, bark), new Mesh(crown, larch));
        thing.scale.setScalar(0.7 + random() * 0.6);
      }
      thing.children.forEach((c) => (c.castShadow = true));
      thing.position.y = side > 0 ? 0.18 + (d / 40) * 17.8 - 0.2 : -0.6 - ((d - 2.4) / 57) * 27.4;
      if (side < 0 && d < 3) continue;
      const holder = new Group();
      holder.add(thing);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
  }

  /** Brown Swiss cows grazing the pasture with their bells. */
  private addCows(roadHalf: number): void {
    const random = seeded(3411);
    const hide = this.material({ color: 0x7a5a40, roughness: 1 });
    const pale = this.material({ color: 0xc8b8a0, roughness: 1 });
    const bell = this.material({ color: 0xc8a040, metalness: 0.6, roughness: 0.4 });
    const body = new BoxGeometry(1.1, 1.0, 2.2);
    const leg = new CylinderGeometry(0.1, 0.09, 0.8, 5);
    leg.translate(0, -0.4, 0);
    const head = new BoxGeometry(0.5, 0.5, 0.7);
    head.translate(0, 0, -0.35);
    this.disposables.push(body, leg, head);
    for (let offset = 20; offset < LOOP; offset += 45 + random() * 50)
      for (let k = 0; k < 1 + Math.floor(random() * 3); k++) {
        const cow = new Group();
        const b = new Mesh(body, hide);
        b.position.y = 1.3;
        const neck = new Group();
        neck.position.set(0, 1.5, -1.1);
        const h = new Mesh(head, hide);
        const muzzle = new Mesh(this.unit, pale);
        muzzle.scale.set(0.4, 0.3, 0.2);
        muzzle.position.set(0, -0.1, -0.7);
        const b2 = new Mesh(this.unit, bell);
        b2.scale.set(0.2, 0.25, 0.2);
        b2.position.set(0, -0.4, -0.1);
        neck.add(h, muzzle, b2);
        cow.add(b, neck);
        for (const [x, z] of [
          [-0.4, -0.8],
          [0.4, -0.8],
          [-0.4, 0.8],
          [0.4, 0.8],
        ] as const) {
          const l = new Mesh(leg, hide);
          l.position.set(x, 0.85, z);
          cow.add(l);
        }
        cow.rotation.y = random() * 6;
        cow.children.forEach((c) => (c.castShadow = true));
        const d = 8 + random() * 20;
        cow.position.y = 0.18 + (d / 40) * 17.8 - 0.3;
        const holder = new Group();
        holder.add(cow);
        this.group.add(holder);
        this.cows.push({ mesh: cow, phase: random() * 6 });
        this.props.push({ mesh: holder, offset: offset + k * 4, x: roadHalf + d });
      }
  }

  /** The yellow Gotthard post coach and its two pairs of horses, climbing at a walk. */
  private addCoach(roadHalf: number): void {
    const yellow = this.material({ color: 0xf2c200, roughness: 0.5 });
    const black = this.material({ color: 0x1d1f24, roughness: 0.6 });
    const glass = this.material({ color: 0x3a4a5a, roughness: 0.2, metalness: 0.4 });
    const brown = this.material({ color: 0x5a3a24, roughness: 0.9 });
    const red = this.material({ color: 0xc8102e, roughness: 0.6 });
    const wheel = new CylinderGeometry(0.75, 0.75, 0.12, 12);
    wheel.rotateZ(Math.PI / 2);
    const leg = new CylinderGeometry(0.07, 0.06, 1, 5);
    leg.translate(0, -0.5, 0);
    this.disposables.push(wheel, leg);
    const coach = new Group();
    const body = new Mesh(this.unit, yellow);
    body.scale.set(1.9, 1.8, 3.4);
    body.position.set(0, 2.0, 1.5);
    const roof = new Mesh(this.unit, black);
    roof.scale.set(2.0, 0.2, 3.6);
    roof.position.set(0, 3.0, 1.5);
    const luggage = new Mesh(this.unit, brown);
    luggage.scale.set(1.6, 0.5, 1.4);
    luggage.position.set(0, 3.35, 2.2);
    const windows = new Mesh(this.unit, glass);
    windows.scale.set(1.95, 0.7, 2.2);
    windows.position.set(0, 2.3, 1.5);
    const box = new Mesh(this.unit, yellow);
    box.scale.set(1.6, 0.6, 0.9);
    box.position.set(0, 2.2, -0.5);
    const cross = new Mesh(this.unit, red);
    cross.scale.set(1.96, 0.5, 0.5);
    cross.position.set(0, 1.6, 1.5);
    coach.add(body, roof, luggage, windows, box, cross);
    for (const [x, z] of [
      [-1, 0.3],
      [1, 0.3],
      [-1, 2.8],
      [1, 2.8],
    ] as const) {
      const w = new Mesh(wheel, black);
      w.position.set(x, 0.75, z);
      coach.add(w);
    }
    for (const [x, z] of [
      [-0.55, -2.6],
      [0.55, -2.6],
      [-0.55, -5.2],
      [0.55, -5.2],
    ] as const) {
      const horse = new Group();
      const b = new Mesh(this.unit, brown);
      b.scale.set(0.7, 0.9, 2.0);
      b.position.y = 1.6;
      const head = new Mesh(this.unit, brown);
      head.scale.set(0.35, 0.9, 0.5);
      head.position.set(0, 2.3, -1.1);
      head.rotation.x = 0.5;
      const front = new Mesh(leg, brown);
      front.position.set(0, 1.2, -0.7);
      const back = new Mesh(leg, brown);
      back.position.set(0, 1.2, 0.7);
      horse.add(b, head, front, back);
      horse.position.set(x, 0, z);
      coach.add(horse);
      this.horses.push(horse);
    }
    coach.children.forEach((c) => (c.castShadow = true));
    coach.position.x = roadHalf - 1.4;
    this.group.add(coach);
    this.coach = { mesh: coach, offset: 70 };
  }

  /** Walkers in bright jackets climbing with their poles. */
  private addWalkers(roadHalf: number): void {
    const random = seeded(3421);
    for (let offset = 10; offset < LOOP; offset += 18 + random() * 22)
      this.walkers.push({
        offset,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf - 0.4),
        speed: (random() < 0.6 ? 1 : -1) * (0.7 + random() * 0.4),
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.walkers.length, WALKER_WEAR, 3427);
  }

  /**
   * Ahead: the mountainside with the Tremola's hairpins stacked up it, each on its stone wall, the
   * pass at the top, and the grey peaks streaked with snow around and above it.
   */
  private addHairpins(): void {
    const random = seeded(3431);
    const slope = this.material({
      map: this.repeat(pastureTexture(), 60, 60),
      roughness: 1,
      flatShading: true,
    });
    const cobbles = this.material({ color: 0x8a8680, roughness: 0.9 });
    const wall = this.material({ map: this.repeat(graniteTexture(), 6, 1), roughness: 0.95 });
    const peaks = this.material({
      map: this.repeat(peakTexture(), 1, 1),
      roughness: 1,
      flatShading: true,
    });
    const m = MOUNTAIN;
    const mountain = new Mesh(new ConeGeometry(m.radius, m.height, 24, 1, true), slope);
    mountain.position.set(m.x, m.height / 2 - 6, m.z);
    this.disposables.push(mountain.geometry);
    this.horizon.add(mountain);
    // The surface's height at a point on the near face.
    const surface = (x: number, z: number) =>
      m.height * (1 - Math.hypot(x - m.x, z - m.z) / m.radius) - 6;
    for (let k = 0; k < 14; k++) {
      const z = -420 - k * 38;
      const x = m.x - 40 + (k % 2 ? 50 : -50);
      const y = surface(x, z);
      const leg = new Group();
      const road = new Mesh(this.unit, cobbles);
      road.scale.set(130, 1.6, 8);
      road.position.y = 1.6;
      const face = new Mesh(this.unit, wall);
      face.scale.set(130, 6, 1.2);
      // The hairpin's bend at the end where this leg turns into the next.
      const bend = new Mesh(new CylinderGeometry(22, 22, 1.6, 16, 1, false, 0, Math.PI), cobbles);
      bend.position.set(k % 2 ? 62 : -62, 1.6, -19);
      bend.rotation.y = k % 2 ? 0 : Math.PI;
      this.disposables.push(bend.geometry);
      leg.add(bend);
      face.position.set(0, -1.4, 4.4);
      leg.add(road, face);
      leg.position.set(x, y, z);
      leg.rotation.y = k % 2 ? 0.12 : -0.12;
      this.horizon.add(leg);
    }
    // The grey peaks around the pass, streaked with the last snow.
    const cone = new ConeGeometry(1, 1, 7);
    this.disposables.push(cone);
    for (let k = 0; k < 9; k++) {
      const p = new Mesh(cone, peaks);
      const h = 900 + random() * 800;
      p.scale.set(600 + random() * 500, h, 600 + random() * 400);
      const a = -Math.PI / 2 + (k - 4) * 0.32 + (random() - 0.5) * 0.15;
      const d = 2600 + random() * 1200;
      p.position.set(Math.cos(a) * d, h / 2 + 200, Math.sin(a) * d);
      p.rotation.y = random() * 3;
      this.horizon.add(p);
    }
    // The wall of the valley falling away on the left, across the gulf.
    const far = new Mesh(cone, slope);
    far.scale.set(1600, 700, 1200);
    far.position.set(-1700, 150, -600);
    this.horizon.add(far);
    // The Val Tremola's floor far below.
    const floor = new Mesh(new PlaneGeometry(8000, 8000), slope);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-4300, -150, -1000);
    this.disposables.push(floor.geometry);
    this.horizon.add(floor);
    // A few clouds hung round the summits.
    const cloud = this.material({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      roughness: 1,
      emissive: 0xc8c8c8,
      emissiveIntensity: 0.4,
    });
    const ball = new SphereGeometry(1, 10, 8);
    this.disposables.push(ball);
    for (let k = 0; k < 8; k++) {
      const c = new Mesh(ball, cloud);
      c.scale.set(200 + random() * 200, 50 + random() * 40, 120);
      c.position.set(-1400 + k * 400, 1300 + random() * 300, -3200 - random() * 600);
      this.horizon.add(c);
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

/** Granite setts laid in overlapping fans. */
function settsTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    speckle(g, 256, 128, '#8a8680', 3441);
    const random = seeded(3443);
    for (let fan = 0; fan < 4; fan++)
      for (let row = 0; row < 8; row++) {
        const cx = fan * 64 + 32;
        const radius = 10 + row * 8;
        const count = 4 + row * 2;
        for (let k = 0; k < count; k++) {
          const a = Math.PI + (k / count) * Math.PI;
          const x = cx + Math.cos(a) * radius;
          const y = 128 + Math.sin(a) * radius;
          const shade = 110 + random() * 50;
          g.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`;
          g.fillRect(x - 3.5, y - 3.5, 7, 7);
          g.strokeStyle = 'rgba(40,38,34,0.7)';
          g.strokeRect(x - 3.5, y - 3.5, 7, 7);
        }
      }
  });
}

/** Grey alpine granite with lichen. */
function graniteTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#9a968e', 3451);
    const random = seeded(3453);
    for (let i = 0; i < 20; i++) {
      g.fillStyle = ['rgba(200,190,90,0.4)', 'rgba(60,58,54,0.4)'][Math.floor(random() * 2)]!;
      g.fillRect(random() * 64, random() * 64, 3 + random() * 6, 2 + random() * 4);
    }
  });
}

/** The alpine pasture: short green grass bright with flowers, grey stones showing through. */
function pastureTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a8a3a', 3461);
    const random = seeded(3463);
    for (let i = 0; i < 220; i++) {
      g.fillStyle = ['#8aa04a', '#4a6a2a', '#e8d040', '#ffffff', '#c86ab8', '#9a968e'][
        Math.floor(random() * 6)
      ]!;
      g.fillRect(random() * 128, random() * 128, 1 + random() * 3, 1 + random() * 3);
    }
  });
}

/** Grey rock peaks with snow in the gullies near the top. */
function peakTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6a6864', 3471);
    const random = seeded(3473);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(245,247,250,${0.5 + random() * 0.4})`;
      g.fillRect(random() * 256, random() * 90, 2 + random() * 4, 10 + random() * 50);
    }
    g.fillStyle = 'rgba(245,247,250,0.8)';
    g.fillRect(0, 0, 256, 14);
  });
}
