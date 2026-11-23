// Col du Tourmalet's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// Pyrenean giant's last ramps on race day, on a bright summer afternoon. The rider climbs the
// open green slopes between a grassy bank on the right and a low stone wall on the left above the
// valley; fans line the verges in their thousands beside camper vans and flags, riders' names are
// painted across the tarmac, sheep graze the pasture, and a costumed devil in red, horns and
// trident, runs beside the riders up every ramp. Ahead the road switches back up the bare mountain
// past La Mongie's ski station to the col, where the Géant stands. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  type BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  TorusGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  slopeAt,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The painted words lie every WORDS metres. */
const WORDS = 26;

const NAMES = [
  'ALLEZ !',
  'VAMOS',
  'TOURMALET',
  'ALLEZ ALLEZ',
  'GO GO GO',
  'CHAPEAU',
  'HUP HUP',
  'FORZA',
];

const FAN_WEAR = {
  tops: [
    '#ffd23f',
    '#ed2939',
    '#ffffff',
    '#002395',
    '#ff9f1c',
    '#2a7a4a',
    '#f15bb5',
    '#1d1f24',
    '#ff2d78',
  ],
  bottoms: ['#1d1f24', '#2f3e5c', '#e8c9a0', '#5a5f69'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5'],
};

interface Fan {
  readonly offset: number;
  readonly x: number;
  readonly heading: number;
  readonly phase: number;
}

interface Climber {
  readonly bike: Mesh;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

export class TourmaletStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  /** Props along the road; one that `lies` on the ground takes the road's slope. */
  private readonly props: { mesh: Group; offset: number; x: number; lies?: boolean }[] = [];
  private readonly fans: Fan[] = [];
  private readonly climbers: Climber[] = [];
  private crowd: Figures | null = null;
  private readonly flags: Mesh[] = [];
  private readonly devil = new Group();
  private readonly limbs: Mesh[] = [];
  private roadHalf = 0;
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
    this.roadHalf = roadHalf;
    this.disposables.push(this.unit);
    this.addSlopes(roadHalf, points);
    this.addWords();
    this.addVans(roadHalf);
    this.addSheep(roadHalf);
    this.addClimbers(roadHalf);
    this.addFans(roadHalf);
    this.addDevil();
    this.addMountain();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 4 + k) * 0.5));
    // The devil's legs and arms swing as he runs; the trident shakes over his head.
    const stride = Math.sin(seconds * 9);
    this.limbs.forEach((limb, k) => (limb.rotation.x = (k % 2 ? stride : -stride) * 0.7));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the road, so the pasture falls away to the valley. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 200);
      position.setY(i * 2 + 1, p.height - 200);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
      if (prop.lies) prop.mesh.rotation.x = slopeAt(heightAt, metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.climbers.forEach((c, i) => {
        const metres = loopMetres(c.offset + c.speed * this.time, s, LOOP, BEHIND);
        const y = heightAt(metres);
        c.bike.position.set(c.x, y, -metres);
        // The bike rides on the ramp, front wheel up the slope, and rocks as they pedal.
        c.bike.rotation.set(
          slopeAt(heightAt, metres),
          0,
          Math.sin(this.time * 3.6 + c.phase) * 0.08,
        );
        crowd.set(
          i,
          c.x,
          y + 0.2,
          -metres,
          0,
          0.95,
          Math.abs(Math.sin(this.time * 3.6 + c.phase)) * 0.03,
        );
      });
      const n = this.climbers.length;
      this.fans.forEach((f, i) => {
        const metres = loopMetres(f.offset, s, LOOP, BEHIND);
        const jump = Math.max(0, Math.sin(this.time * 6 + f.phase)) * 0.1;
        crowd.set(n + i, f.x, heightAt(metres) + jump, -metres, f.heading, 0.95, 0);
      });
      crowd.commit();
    }
    // The devil keeps pace a few metres ahead on the right, surging and dropping back.
    const ahead = 6.5 + Math.sin(this.time * 0.35) * 2.5;
    this.devil.position.set(
      this.roadHalf - 1.3,
      heightAt(ahead) + Math.abs(Math.sin(this.time * 9)) * 0.12,
      -ahead,
    );
    this.devil.rotation.y = Math.sin(this.time * 0.7) * 0.4;
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The grassy bank on the right, the stone wall on the left, and the pasture falling away below it. */
  private addSlopes(roadHalf: number, points: number): void {
    const r = roadHalf;
    const grass = this.material({ map: this.repeat(pastureTexture(), 8, 8), roughness: 1 });
    const verge = this.material({
      map: this.repeat(pastureTexture(), 3, 3),
      color: 0xb0b890,
      roughness: 1,
    });
    const wall = this.material({ map: this.repeat(wallTexture(), 1.5, 1.5), roughness: 0.9 });
    const far = this.material({
      map: this.repeat(pastureTexture(), 60, 60),
      color: 0x8aa070,
      roughness: 1,
    });
    this.ribbons.add(points, grass, [
      [r + 200, 80],
      [r + 30, 14],
      [r + 6, 1.4],
    ]);
    this.ribbons.add(points, verge, [
      [r + 6, 1.4],
      [r + 0.2, 0.1],
      [r, 0.004],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.004],
      [-r - 3, 0.02],
    ]);
    this.ribbons.add(points, wall, [
      [-r - 3, 0.02],
      [-r - 3, 0.7],
      [-r - 3.6, 0.7],
      [-r - 3.6, -0.6],
    ]);
    this.ribbons.add(points, grass, [
      [-r - 3.6, -0.6],
      [-r - 200, -40],
    ]);
    this.ribbons.add(points, far, [
      [-r - 200, -40],
      [-r - 1500, -180],
    ]);
  }

  /** The fans' words painted across the tarmac in white and yellow. */
  private addWords(): void {
    const plane = new PlaneGeometry(6, 1.6);
    plane.rotateX(-Math.PI / 2);
    plane.translate(0, 0.02, 0);
    this.disposables.push(plane);
    for (let offset = 6, k = 0; offset < LOOP; offset += WORDS, k++) {
      const paint = this.material({
        map: this.track(wordTexture(NAMES[k % NAMES.length]!, k % 3 === 0 ? '#ffd23f' : '#ffffff')),
        transparent: true,
        roughness: 0.7,
        depthWrite: false,
      });
      const holder = new Group();
      holder.add(new Mesh(plane, paint));
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /** Camper vans parked on the bank, awnings out, flags flying from their ladders. */
  private addVans(roadHalf: number): void {
    const random = seeded(1901);
    const bodies = [0xf4f2ec, 0xe8e4dc, 0xfff8e0].map((c) =>
      this.material({ color: c, roughness: 0.5 }),
    );
    const stripe = this.material({ color: 0x3a86ff, roughness: 0.5 });
    const glass = this.material({ color: 0x2a3440, roughness: 0.2 });
    const awnings = ['#ff6b5a', '#2ec4b6', '#ffd23f', '#3a86ff'].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    const flagMats = [
      flagTexture('basque'),
      flagTexture('france'),
      flagTexture('spain'),
      flagTexture('polka'),
    ].map((t) => this.material({ map: this.track(t), roughness: 0.8, side: 2 }));
    const cloth = new PlaneGeometry(1.4, 0.9);
    cloth.translate(0.7, 0, 0);
    this.disposables.push(cloth);
    for (let offset = 12; offset < LOOP; offset += 22 + random() * 26) {
      const van = new Group();
      const body = new Mesh(this.unit, bodies[Math.floor(random() * 3)]!);
      body.scale.set(2.3, 2.8, 6.5);
      body.position.y = 1.7;
      const band = new Mesh(this.unit, stripe);
      band.scale.set(2.32, 0.25, 6.52);
      band.position.y = 1.4;
      const screen = new Mesh(this.unit, glass);
      screen.scale.set(2.1, 0.9, 0.1);
      screen.position.set(0, 2, -3.26);
      const awning = new Mesh(this.unit, awnings[Math.floor(random() * 4)]!);
      awning.scale.set(2.2, 0.08, 4.5);
      awning.position.set(-2.2, 2.9, 0.4);
      awning.rotation.z = 0.15;
      const flag = new Mesh(cloth, flagMats[Math.floor(random() * 4)]!);
      flag.position.set(0, 4.6, 2.8);
      this.flags.push(flag);
      van.add(body, band, screen, awning, flag);
      van.children.forEach((c) => (c.castShadow = true));
      // Parked across the bank, which rises 0.525 m a metre from the verge: leaning into it, the
      // uphill side higher, and settled by its low side on the grass. The uphill side sinks into
      // the bank, which hides it; nothing shows under the side the riders see.
      van.rotation.set(0, (random() - 0.5) * 0.3, 0.22);
      const d = random() * 3;
      van.position.y = 1.4 + d * 0.525 - 0.3 - 1.15 * (0.525 - Math.sin(0.22));
      const holder = new Group();
      holder.add(van);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 6 + d, lies: true });
    }
  }

  /** Sheep grazing the pasture below the wall and on the bank. */
  private addSheep(roadHalf: number): void {
    const random = seeded(1907);
    const wool = this.material({ color: 0xf0ece0, roughness: 1 });
    const face = this.material({ color: 0x2a2420, roughness: 0.9 });
    const body = new SphereGeometry(0.55, 8, 6);
    body.scale(0.8, 0.7, 1.2);
    body.translate(0, 0.7, 0);
    const head = new SphereGeometry(0.2, 6, 5);
    head.scale(1, 1, 1.4);
    head.translate(0, 0.85, -0.7);
    this.disposables.push(body, head);
    for (let offset = 0; offset < LOOP; offset += 3 + random() * 10) {
      const left = random() < 0.7;
      const d = 6 + random() * 50;
      const sheep = new Group();
      sheep.add(new Mesh(body, wool), new Mesh(head, face));
      sheep.rotation.y = random() * 6;
      const inner = new Group();
      inner.add(sheep);
      sheep.position.y = left ? -0.6 - (d - 3.6) * (39.4 / 196) : 1.4 + (d - 6) * (12.6 / 24);
      if (!left && d > 24) continue;
      this.group.add(inner);
      this.props.push({
        mesh: inner,
        offset,
        x: left ? -roadHalf - 3.6 - d : roadHalf + 6 + d * 0.5,
      });
    }
  }

  /** Fellow climbers grinding up the ramps. */
  private addClimbers(roadHalf: number): void {
    const random = seeded(1913);
    const frame = this.material({ color: 0x1d1f24, metalness: 0.5, roughness: 0.4 });
    const bike = roadBikeGeometry();
    this.disposables.push(bike);
    for (let offset = 14; offset < LOOP; offset += 20 + random() * 26) {
      const mesh = new Mesh(bike, frame);
      mesh.castShadow = true;
      this.group.add(mesh);
      this.climbers.push({
        bike: mesh,
        offset,
        x: -roadHalf + 1 + random() * 2.5,
        speed: 1.8 + random() * 1.2,
        phase: random() * 6,
      });
    }
  }

  /** The fans lining both verges, closest to the road where the climb is steepest. */
  private addFans(roadHalf: number): void {
    const random = seeded(1919);
    for (let offset = 0; offset < LOOP; offset += 0.8 + random() * 1.6) {
      const side = random() < 0.65 ? 1 : -1;
      this.fans.push({
        offset,
        x: side * (roadHalf + 0.4 + random() * (side > 0 ? 3 : 2.2)),
        heading: (side < 0 ? -Math.PI / 2 : Math.PI / 2) + (random() - 0.5) * 0.8,
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(
      this.group,
      this.disposables,
      this.climbers.length + this.fans.length,
      FAN_WEAR,
      1921,
    );
  }

  /** The devil: red suit, black horns and beard, cape flying, trident raised, running alongside. */
  private addDevil(): void {
    const red = this.material({ color: 0xd81a1a, roughness: 0.6 });
    const black = this.material({ color: 0x1d1f24, roughness: 0.6 });
    const skin = this.material({ color: 0xe2b48c, roughness: 0.7 });
    const torso = new Mesh(new CylinderGeometry(0.22, 0.2, 0.75, 8), red);
    torso.position.y = 1.25;
    const head = new Mesh(new SphereGeometry(0.15, 10, 8), skin);
    head.position.y = 1.78;
    const hood = new Mesh(new SphereGeometry(0.17, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), red);
    hood.position.y = 1.8;
    const horn = new ConeGeometry(0.04, 0.2, 6);
    const beard = new Mesh(new ConeGeometry(0.07, 0.18, 6), black);
    beard.rotation.x = Math.PI;
    beard.position.set(0, 1.62, -0.12);
    this.disposables.push(torso.geometry, head.geometry, hood.geometry, horn, beard.geometry);
    for (const x of [-0.09, 0.09]) {
      const h = new Mesh(horn, black);
      h.position.set(x, 1.98, 0);
      h.rotation.z = -x * 3;
      this.devil.add(h);
    }
    const leg = new CylinderGeometry(0.08, 0.07, 0.85, 6);
    leg.translate(0, -0.42, 0);
    const arm = new CylinderGeometry(0.06, 0.05, 0.65, 6);
    arm.translate(0, -0.32, 0);
    this.disposables.push(leg, arm);
    for (const x of [-0.1, 0.1]) {
      const l = new Mesh(leg, red);
      l.position.set(x, 0.88, 0);
      this.limbs.push(l);
      const a = new Mesh(arm, red);
      a.position.set(x * 2.6, 1.55, 0);
      this.limbs.push(a);
      this.devil.add(l, a);
    }
    // The trident, held high in the right hand.
    const shaft = new Mesh(new CylinderGeometry(0.02, 0.02, 2, 5), black);
    shaft.position.set(0.32, 2.2, 0);
    const prongs = new Group();
    for (const x of [-0.12, 0, 0.12]) {
      const p = new Mesh(new ConeGeometry(0.03, 0.25, 4), black);
      p.position.set(x, 0, 0);
      prongs.add(p);
      this.disposables.push(p.geometry);
    }
    const bar = new Mesh(this.unit, black);
    bar.scale.set(0.3, 0.03, 0.03);
    bar.position.y = -0.12;
    prongs.add(bar);
    prongs.position.set(0.32, 3.25, 0);
    this.disposables.push(shaft.geometry);
    const cape = new Mesh(new PlaneGeometry(0.6, 1), this.material({ color: 0x8a0a0a, side: 2 }));
    cape.position.set(0, 1.25, 0.25);
    cape.rotation.x = 0.4;
    this.disposables.push(cape.geometry);
    this.devil.add(torso, head, hood, beard, shaft, prongs, cape);
    this.devil.children.forEach((c) => (c.castShadow = true));
    this.devil.scale.setScalar(1.15);
    this.group.add(this.devil);
  }

  /**
   * The mountain ahead: bare slopes with the road's switchbacks up past La Mongie's ski station
   * to the col and the Géant, the Pic du Midi's observatory on its summit beyond.
   */
  private addMountain(): void {
    const random = seeded(1931);
    const slope = this.material({ map: this.track(mountainTexture()), roughness: 1 });
    const rock = this.material({ map: this.repeat(rockTexture(), 60, 60), roughness: 1 });
    const across = this.material({
      map: this.repeat(pastureTexture(), 30, 30),
      color: 0x6a8a5a,
      roughness: 1,
    });
    const face = new Mesh(new PlaneGeometry(3000, 560), slope);
    this.disposables.push(face.geometry);
    face.position.set(100, 120, -1300);
    face.rotation.x = -0.3;
    this.horizon.add(face);
    const peak = new ConeGeometry(1, 1, 7);
    this.disposables.push(peak);
    for (let k = 0; k < 7; k++) {
      const m = new Mesh(peak, rock);
      const h = 300 + random() * 260;
      m.scale.set(220 + random() * 160, h, 200);
      m.position.set(-900 + k * 300 + random() * 80, 300 + h / 2 - 120, -1750);
      this.horizon.add(m);
    }
    // The Pic du Midi and its observatory dome.
    const pic = new Mesh(peak, rock);
    pic.scale.set(240, 520, 220);
    pic.position.set(420, 440, -1700);
    const dome = new Mesh(
      new SphereGeometry(16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      this.material({ color: 0xf4f4f0 }),
    );
    dome.position.set(420, 700, -1700);
    const mast = new Mesh(this.unit, this.material({ color: 0xd8302a }));
    mast.scale.set(3, 60, 3);
    mast.position.set(420, 730, -1700);
    this.disposables.push(dome.geometry);
    this.horizon.add(pic, dome, mast);
    // Ridges across the valley on the left, so the view stays closed down the valley.
    const hump = new ConeGeometry(1, 1, 18);
    this.disposables.push(hump);
    for (const [z, sx, sy] of [
      [-250, 110, 120],
      [-800, 140, 160],
      [-1350, 130, 150],
      [-1900, 160, 190],
    ] as const) {
      const h = new Mesh(hump, across);
      h.scale.set(sx, sy, 380);
      h.position.set(-300 - sx, -40 + sy / 2, z);
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

/** A light road bike, along z: two wheels, its frame and drop bars. */
function roadBikeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const z of [-0.5, 0.5]) {
    const wheel = new TorusGeometry(0.34, 0.02, 4, 18);
    wheel.rotateY(Math.PI / 2);
    wheel.translate(0, 0.35, z);
    parts.push(wheel);
  }
  const tube = (length: number, y: number, z: number, tilt: number) => {
    const t = new CylinderGeometry(0.02, 0.02, length, 5);
    t.rotateX(tilt);
    t.translate(0, y, z);
    parts.push(t);
  };
  tube(0.6, 0.72, -0.05, Math.PI / 2 - 0.1);
  tube(0.6, 0.55, 0.15, 0.3);
  tube(0.55, 0.55, -0.32, -0.6);
  const saddle = new BoxGeometry(0.1, 0.04, 0.24);
  saddle.translate(0, 0.9, 0.22);
  const bars = new BoxGeometry(0.42, 0.03, 0.03);
  bars.translate(0, 0.86, -0.42);
  parts.push(saddle, bars);
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Pyrenean pasture: short grass, stones and gentians. */
function pastureTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6a9a4a', 1937);
    const random = seeded(1939);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = ['#b8b4a8', '#3a6aff', '#ffd23f', '#5a7a3a'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 256, random() * 256, 2 + random() * 3, 2 + random() * 3);
    }
  });
}

/** The roadside wall's grey stones. */
function wallTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#9a968c', 1949);
    const random = seeded(1951);
    g.fillStyle = 'rgba(40,40,36,0.45)';
    for (let y = 0; y < 128; y += 20 + random() * 8) {
      g.fillRect(0, y, 128, 2);
      for (let x = random() * 30; x < 128; x += 24 + random() * 20) g.fillRect(x, y, 2, 24);
    }
  });
}

/** A word painted on the road, in the fans' rough capitals. */
function wordTexture(word: string, colour: string): CanvasTexture {
  return canvasTexture(384, 96, (g) => {
    g.clearRect(0, 0, 384, 96);
    g.fillStyle = colour;
    g.font = 'bold 64px sans-serif';
    g.textAlign = 'center';
    g.fillText(word, 192, 72, 370);
  });
}

/** A flag: the ikurriña, the tricolour, Spain's, or the polka-dot climber's. */
function flagTexture(kind: 'basque' | 'france' | 'spain' | 'polka'): CanvasTexture {
  return canvasTexture(96, 64, (g) => {
    if (kind === 'france') {
      ['#002395', '#ffffff', '#ed2939'].forEach((c, k) => {
        g.fillStyle = c;
        g.fillRect(k * 32, 0, 32, 64);
      });
    } else if (kind === 'spain') {
      g.fillStyle = '#c60b1e';
      g.fillRect(0, 0, 96, 64);
      g.fillStyle = '#ffc400';
      g.fillRect(0, 16, 96, 32);
    } else if (kind === 'basque') {
      g.fillStyle = '#d52b1e';
      g.fillRect(0, 0, 96, 64);
      g.strokeStyle = '#009b48';
      g.lineWidth = 10;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(96, 64);
      g.moveTo(96, 0);
      g.lineTo(0, 64);
      g.stroke();
      g.strokeStyle = '#ffffff';
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(48, 0);
      g.lineTo(48, 64);
      g.moveTo(0, 32);
      g.lineTo(96, 32);
      g.stroke();
    } else {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, 96, 64);
      g.fillStyle = '#d8202a';
      for (let y = 8; y < 64; y += 16)
        for (let x = (y / 16) % 2 ? 16 : 8; x < 96; x += 16) {
          g.beginPath();
          g.arc(x, y, 5, 0, Math.PI * 2);
          g.fill();
        }
    }
  });
}

/** Bare grey-green limestone, scree and rock. */
function rockTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#8a8a80', 1957);
    const random = seeded(1959);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '50,50,46' : '120,140,90'},${0.15 + random() * 0.2})`;
      g.fillRect(random() * 256, random() * 256, 3 + random() * 30, 2 + random() * 6);
    }
  });
}

/**
 * The mountainside ahead: green pasture below fading to grey scree, the road's switchbacks
 * climbing it past La Mongie's blocks to the col, lined with the crowd's colours.
 */
function mountainTexture(): CanvasTexture {
  return canvasTexture(1024, 512, (g) => {
    const fall = g.createLinearGradient(0, 512, 0, 0);
    fall.addColorStop(0, '#5f8a44');
    fall.addColorStop(0.6, '#6a8a4a');
    fall.addColorStop(0.9, '#8a8a7a');
    fall.addColorStop(1, '#9a968c');
    g.fillStyle = fall;
    g.fillRect(0, 0, 1024, 512);
    const random = seeded(1963);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = `rgba(40,50,30,${0.06 + random() * 0.12})`;
      g.fillRect(random() * 1024, random() * 512, 4 + random() * 16, 2 + random() * 4);
    }
    // La Mongie's ski-station blocks partway up.
    g.fillStyle = '#d8d4c8';
    for (let k = 0; k < 6; k++) g.fillRect(300 + k * 26, 330 - (k % 2) * 10, 20, 16);
    // The switchbacks to the col, a dotted line of the crowd beside them.
    let y = 500;
    let left = 380;
    let right = 640;
    let fromLeft = true;
    const path: [number, number][] = [[left, y]];
    while (y > 90) {
      y -= 28 + (y / 512) * 20;
      path.push([fromLeft ? right : left, y]);
      fromLeft = !fromLeft;
      left += 6;
      right -= 6;
    }
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const [width, colour] of [
      [12, 'rgba(255,210,63,0.6)'],
      [7, '#4a4a50'],
    ] as const) {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.beginPath();
      path.forEach(([x, py], k) => (k ? g.lineTo(x, py) : g.moveTo(x, py)));
      g.stroke();
    }
  });
}
